const { Client } = require('../node_modules/pg');
const { MatchesService } = require('../dist/matches/matches.service');
const { HubService } = require('../dist/team-hub/hub.service');
const { PlanningService } = require('../dist/coach-planning/planning.service');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
require('../node_modules/dotenv').config({
  path: path.join(__dirname, '../.env'),
  quiet: true,
});
if (process.env.RUN_MATCH_CHECK !== '1')
  throw new Error('Opt in with RUN_MATCH_CHECK=1');
(async () => {
  const cert = await fetch(
    'https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt',
  );
  if (!cert.ok) throw new Error('CA unavailable');
  const db = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: { rejectUnauthorized: true, ca: await cert.text() },
    connectionTimeoutMillis: 10000,
    statement_timeout: 20000,
  });
  try {
    await db.connect();
    if (process.env.APPLY_MATCH_MIGRATION === '1') {
      await db.query(
        fs.readFileSync(
          path.join(__dirname, '../../docs/sql/match-results.sql'),
          'utf8',
        ),
      );
      console.log('Additive match migration applied.');
    }
    await db.query('BEGIN');
    let n = 0;
    const adapter = {
      query: async (q, v) => (await db.query(q, v)).rows,
      transaction: async (fn) => {
        const save = 'match_' + ++n;
        await db.query('SAVEPOINT ' + save);
        try {
          const r = await fn(adapter);
          await db.query('RELEASE SAVEPOINT ' + save);
          return r;
        } catch (e) {
          await db.query('ROLLBACK TO SAVEPOINT ' + save);
          throw e;
        }
      },
    };
    const hub = new HubService(adapter),
      service = new MatchesService(adapter, hub),
      planning = new PlanningService(adapter);
    const ids = [];
    for (const role of ['COACH', 'COACH', 'ATHLETE', 'ATHLETE']) {
      const [u] = await adapter.query(
        'INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES($1,$2,$3,$4,$5) RETURNING id',
        [
          randomUUID() + '@example.invalid',
          'not-a-login-hash',
          role,
          'Match',
          'Test',
        ],
      );
      ids.push(u.id);
    }
    const [team] = await adapter.query(
      "INSERT INTO coach_teams(coach_id,name,age_group) VALUES($1,'Test XV','U18') RETURNING id",
      [ids[0]],
    );
    const [player] = await adapter.query(
      "INSERT INTO coach_team_players(team_id,first_name,last_name) VALUES($1,'Test','Player') RETURNING id",
      [team.id],
    );
    await adapter.query(
      'INSERT INTO coach_player_accounts(player_id,team_id,user_id) VALUES($1,$2,$3)',
      [player.id, team.id, ids[2]],
    );
    const events = [];
    for (const [kind, date, cancelled] of [
      ['match', '2025-01-01', false],
      ['match', '2099-01-01', false],
      ['practice', '2025-01-02', false],
      ['match', '2025-01-03', true],
    ]) {
      const [e] = await adapter.query(
        "INSERT INTO coach_schedule_events(team_id,title,kind,date,start_time,end_time,cancelled) VALUES($1,'Test match',$2,$3,'10:00','11:00',$4) RETURNING id",
        [team.id, kind, date, cancelled],
      );
      events.push(e.id);
    }
    const result = { opponent: 'North', team_score: 28, opponent_score: 24 };
    const stats = {
      position: 'Eighth man',
      tries: 0,
      minutes: 60,
      video_url: 'https://youtu.be/example',
    };
    assert.equal((await service.list(ids[2])).length, 3);
    assert.equal((await service.list(ids[3])).length, 0);
    assert.equal((await service.list(ids[1])).length, 0);
    await assert.rejects(() => service.save(ids[2], events[0], result));
    await assert.rejects(() => service.save(ids[1], events[0], result));
    await assert.rejects(() => service.save(ids[2], events[0], stats, true));
    for (const id of events.slice(1))
      await assert.rejects(() => service.save(ids[0], id, result));
    let row = await service.save(ids[0], events[0], result);
    assert.equal(row.result.team_score, 28);
    assert.equal(
      (await service.list(ids[2])).find((e) => e.id === events[0]).result
        .opponent,
      'North',
    );
    await assert.rejects(() => service.save(ids[3], events[0], stats, true));
    await assert.rejects(() => service.save(ids[0], events[0], stats, true));
    row = await service.save(ids[2], events[0], stats, true);
    assert.equal(row.stats.tries, 0);
    assert.equal(row.stats.tackles, null);
    assert.equal(row.stats.video_url, stats.video_url);
    assert.equal(
      (await service.list(ids[0])).find((e) => e.id === events[0]).stats,
      null,
    );
    await service.save(ids[0], events[0], { ...result, team_score: 24 });
    row = (await service.list(ids[2])).find((e) => e.id === events[0]);
    assert.equal(row.result.team_score, 24);
    assert.equal(row.stats.minutes, 60);
    await assert.rejects(() =>
      hub.cancel(ids[0], events[0], { reason: 'Test cancel' }),
    );
    await assert.rejects(() =>
      planning.deleteEvent(ids[0], team.id, events[0]),
    );
    await assert.rejects(() => planning.saveEvents(ids[0],team.id,{title:'Changed fixture',kind:'match',date:'2025-01-01',start_time:'12:00',end_time:'13:00',venue:'Field',notes:''},events[0]), /recorded result/);
    await adapter.query(
      "UPDATE coach_team_players SET status='inactive' WHERE id=$1",
      [player.id],
    );
    assert.equal((await service.list(ids[2])).length, 1);
    await service.save(ids[2], events[0], { ...stats, tries: 1 }, true);
    await adapter.query("UPDATE users SET status='SUSPENDED' WHERE id=$1", [
      ids[2],
    ]);
    await assert.rejects(() => service.list(ids[2]));
    await assert.rejects(() => service.save(ids[2], events[0], stats, true));
    console.log(
      'PASS: coach ownership, athlete ownership, score corrections, private stats, safe links, time/type/cancellation restrictions, fixture protection, retained personal history and suspension.',
    );
  } finally {
    await db.query('ROLLBACK');
    await db.end();
    console.log('All test records rolled back.');
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});

