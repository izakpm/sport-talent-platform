const { Client } = require('../node_modules/pg');
const { ConnectionsService } = require('../dist/team-hub/connections.service');
const { HubService } = require('../dist/team-hub/hub.service');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
require('../node_modules/dotenv').config({
  path: path.join(__dirname, '../.env'),
  quiet: true,
});
if (process.env.RUN_CONNECTIONS_CHECK !== '1')
  throw new Error('Opt in with RUN_CONNECTIONS_CHECK=1');
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
    await db.query('BEGIN');
    const adapter = { query: async (q, v) => (await db.query(q, v)).rows };
    const service = new ConnectionsService(adapter, new HubService(adapter));
    const ids = [];
    for (const [role, name] of [
      ['COACH', 'Coach'],
      ['ATHLETE', 'Viewer'],
      ['ATHLETE', 'Teammate'],
      ['ATHLETE', 'Outsider'],
      ['ATHLETE', 'Suspended'],
    ]) {
      const [u] = await adapter.query(
        'INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES($1,$2,$3,$4,$5) RETURNING id',
        [
          randomUUID() + '@example.invalid',
          'not-a-login-hash',
          role,
          name,
          'Test',
        ],
      );
      ids.push(u.id);
    }
    await adapter.query("UPDATE users SET status='SUSPENDED' WHERE id=$1", [
      ids[4],
    ]);
    const teams = [];
    const players = [];
    for (let i = 0; i < 3; i++) {
      const [team] = await adapter.query(
        "INSERT INTO coach_teams(coach_id,name,age_group) VALUES($1,$2,'U18') RETURNING id",
        [ids[0], 'Network team ' + i],
      );
      teams.push(team.id);
      for (const user of i === 2 ? [ids[3]] : [ids[1], ids[2], ids[4]]) {
        const [p] = await adapter.query(
          "INSERT INTO coach_team_players(team_id,first_name,last_name) VALUES($1,'Roster','Player') RETURNING id",
          [team.id],
        );
        players.push({ id: p.id, user, team: team.id });
        await adapter.query(
          'INSERT INTO coach_player_accounts(player_id,team_id,user_id) VALUES($1,$2,$3)',
          [p.id, team.id, user],
        );
      }
      await adapter.query(
        "INSERT INTO coach_team_players(team_id,first_name,last_name) VALUES($1,'Unlinked','Player')",
        [team.id],
      );
    }
    let data = await service.list(ids[1]);
    assert.equal(data.teams.length, 2);
    assert.equal(data.people.length, 2);
    assert.deepEqual(
      data.people.map((p) => p.id).sort(),
      [ids[0], ids[2]].sort(),
    );
    assert.equal(data.people.find((p) => p.id === ids[2]).team_ids.length, 2);
    assert.equal(
      data.people.some((p) => 'email' in p || 'phone' in p),
      false,
    );
    assert.equal(
      data.teams.some((t) => t.id === teams[2]),
      false,
    );
    await adapter.query(
      "UPDATE coach_team_players SET status='inactive' WHERE id=$1",
      [players.find((p) => p.user === ids[2] && p.team === teams[0]).id],
    );
    data = await service.list(ids[1]);
    assert.equal(data.people.find((p) => p.id === ids[2]).team_ids.length, 1);
    await adapter.query(
      'DELETE FROM coach_player_accounts WHERE user_id=$1 AND team_id=$2',
      [ids[2], teams[1]],
    );
    data = await service.list(ids[1]);
    assert.equal(data.people.length, 1);
    await adapter.query(
      "UPDATE coach_team_players SET status='inactive' WHERE id IN (SELECT player_id FROM coach_player_accounts WHERE user_id=$1)",
      [ids[1]],
    );
    assert.deepEqual(await service.list(ids[1]), { teams: [], people: [] });
    await assert.rejects(() => service.list(ids[0]));
    await assert.rejects(() => service.list(ids[4]));
    console.log(
      'PASS: shared-team isolation, deduplication, self exclusion, inactive/unlinked/suspended exclusions, minimum display fields and athlete-only access.',
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
