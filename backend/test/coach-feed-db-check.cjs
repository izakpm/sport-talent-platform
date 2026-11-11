const { Client } = require('../node_modules/pg');
const { HubService } = require('../dist/team-hub/hub.service');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
require('../node_modules/dotenv').config({
  path: path.join(__dirname, '../.env'),
  quiet: true,
});
if (process.env.RUN_FEED_CHECK !== '1')
  throw new Error('Opt in with RUN_FEED_CHECK=1');
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
    if (process.env.APPLY_FEED_MIGRATION === '1') {
      await db.query(
        fs.readFileSync(
          path.join(__dirname, '../../docs/sql/coach-session-updates.sql'),
          'utf8',
        ),
      );
      console.log('Session-update category migration applied.');
    }
    await db.query('BEGIN');
    let n = 0;
    const adapter = {
      query: async (q, v) => (await db.query(q, v)).rows,
      transaction: async (fn) => {
        const save = 'feed_' + ++n;
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
    const service = new HubService(adapter);
    const ids = [];
    for (const role of ['COACH', 'COACH', 'ATHLETE', 'ATHLETE']) {
      const [u] = await adapter.query(
        'INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES($1,$2,$3,$4,$5) RETURNING id',
        [
          randomUUID() + '@example.invalid',
          'not-a-login-hash',
          role,
          'Feed',
          'Test',
        ],
      );
      ids.push(u.id);
    }
    const teams = [];
    for (let i = 0; i < 2; i++) {
      const [t] = await adapter.query(
        "INSERT INTO coach_teams(coach_id,name,age_group) VALUES($1,'Feed team','U18') RETURNING id",
        [ids[i]],
      );
      teams.push(t.id);
    }
    const [player] = await adapter.query(
      "INSERT INTO coach_team_players(team_id,first_name,last_name) VALUES($1,'Test','Player') RETURNING id",
      [teams[0]],
    );
    await adapter.query(
      'INSERT INTO coach_player_accounts(player_id,team_id,user_id) VALUES($1,$2,$3)',
      [player.id, teams[0], ids[2]],
    );
    const events = [];
    for (let i = 0; i < 2; i++) {
      const [e] = await adapter.query(
        "INSERT INTO coach_schedule_events(team_id,title,kind,date,start_time,end_time,venue) VALUES($1,'Practice','practice','2026-11-21','16:00','17:00','Main field') RETURNING id",
        [teams[i]],
      );
      events.push(e.id);
    }
    const body = {
      team_id: teams[0],
      category: 'session_update',
      event_id: events[0],
      title: 'Bring boots',
      body: 'Boots and water.',
    };
    const post = await service.post(ids[0], body);
    assert.equal(post.event_id, events[0]);
    assert.match(post.body, /Practice/);
    assert.match(post.body, /16:00/);
    assert.match(post.body, /Main field/);
    assert.equal((await service.feed(ids[2]))[0].id, post.id);
    assert.equal((await service.feed(ids[3])).length, 0);
    await assert.rejects(() => service.feed(ids[3], teams[0]));
    await assert.rejects(() => service.post(ids[1], body));
    await assert.rejects(() => service.post(ids[2], body));
    await assert.rejects(() =>
      service.post(ids[0], { ...body, event_id: events[1] }),
    );
    await assert.rejects(() =>
      service.post(ids[0], { ...body, event_id: undefined }),
    );
    await assert.rejects(() =>
      service.post(ids[0], { ...body, category: 'cancellation' }),
    );
    await assert.rejects(() =>
      service.post(ids[0], { ...body, category: 'announcement' }),
    );
    await service.post(ids[0], {
      team_id: teams[0],
      category: 'announcement',
      title: 'Team news',
      body: 'News',
    });
    await service.post(ids[0], {
      team_id: teams[0],
      category: 'reminder',
      title: 'Kit',
      body: 'Bring kit',
    });
    await assert.rejects(() => service.removePost(ids[1], post.id));
    await service.removePost(ids[0], post.id);
    assert.equal((await service.feed(ids[2])).length, 2);
    await service.cancel(ids[0], events[0], { reason: 'Rain' });
    await assert.rejects(() => service.post(ids[0], body));
    const cancellation = (await service.feed(ids[2])).find(
      (p) => p.category === 'cancellation',
    );
    assert.ok(cancellation);
    await assert.rejects(() => service.removePost(ids[0], cancellation.id));
    await adapter.query(
      "UPDATE coach_team_players SET status='inactive' WHERE id=$1",
      [player.id],
    );
    assert.equal((await service.feed(ids[2])).length, 0);
    console.log(
      'PASS: coach posting, session context, wrong-team/athlete isolation, linked athlete delivery, announcement/reminder compatibility, removal ownership and protected cancellations.',
    );
  } finally {
    await db.query('ROLLBACK');
    await db.end();
    console.log('All feed test records rolled back.');
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
