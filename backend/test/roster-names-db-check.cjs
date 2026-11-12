// Run with a connected pg client. All fixtures and changes are rolled back.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PlanningService } = require('../dist/coach-planning/planning.service');
const { HubService } = require('../dist/team-hub/hub.service');
module.exports = async function checkRosterNames(client) {
  await client.query('BEGIN');
  const db = {
    query: async (sql, args) => (await client.query(sql, args)).rows,
  };
  db.transaction = (fn) => fn(db);
  try {
    const ids = [];
    for (const role of ['COACH', 'ATHLETE']) {
      const [u] = await db.query(
        "INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES($1,'not-a-login',$2,'Original','Name') RETURNING id",
        [randomUUID() + '@example.invalid', role],
      );
      ids.push(u.id);
    }
    const [coach, athlete] = ids;
    const [team] = await db.query(
      "INSERT INTO coach_teams(coach_id,name,age_group) VALUES($1,'Roster regression','U18') RETURNING id",
      [coach],
    );
    const players = [];
    for (let n = 0; n < 2; n++)
      players.push(
        (
          await db.query(
            "INSERT INTO coach_team_players(team_id,first_name,last_name) VALUES($1,'Roster','Placeholder') RETURNING id",
            [team.id],
          )
        )[0],
      );
    await db.query(
      'INSERT INTO coach_player_accounts(player_id,team_id,user_id) VALUES($1,$2,$3)',
      [players[0].id, team.id, athlete],
    );
    const [event] = await db.query(
      "INSERT INTO coach_schedule_events(team_id,title,kind,date,start_time,end_time) VALUES($1,'Test practice','practice',CURRENT_DATE,'16:00','17:00') RETURNING id",
      [team.id],
    );
    await db.query(
      "INSERT INTO coach_session_attendance(event_id,player_id,user_id,status,method) VALUES($1,$2,$3,'pending','request')",
      [event.id, players[0].id, athlete],
    );
    const planning = new PlanningService(db),
      hub = new HubService(db);
    const initial = await planning.roster(coach, team.id);
    assert.equal(
      initial.players.find((p) => p.id === players[0].id).first_name,
      'Original',
    );
    await db.query(
      "UPDATE users SET first_name='Updated',last_name='Athlete' WHERE id=$1",
      [athlete],
    );
    for (const rows of [
      (await planning.roster(coach, team.id)).players,
      (await hub.register(coach, event.id)).players,
      await hub.pending(coach),
    ]) {
      const linked = rows.find((p) => (p.player_id || p.id) === players[0].id);
      assert.equal(linked.first_name, 'Updated');
      assert.equal(linked.last_name, 'Athlete');
    }
    const roster = await planning.roster(coach, team.id);
    assert.equal(
      roster.players.find((p) => p.id === players[1].id).first_name,
      'Roster',
    );
    assert.equal(
      roster.players.find((p) => p.id === players[1].id).linked,
      false,
    );
    const saved = await planning.savePlayer(
      coach,
      team.id,
      {
        first_name: 'Stale',
        last_name: 'Submission',
        position: 'Flanker',
        status: 'active',
        is_captain: false,
      },
      players[0].id,
    );
    assert.equal(saved.first_name, 'Updated');
    assert.equal(saved.last_name, 'Athlete');
    assert.equal(saved.linked, true);
    assert.equal(
      (await db.query('SELECT first_name FROM users WHERE id=$1', [athlete]))[0]
        .first_name,
      'Updated',
    );
    await assert.rejects(() => planning.roster(athlete, team.id));
    console.log(
      'PASS: profile rename appears in roster, attendance and pending verification; unlinked names preserved; save response canonical; athlete profile untouched; access protected.',
    );
  } finally {
    await client.query('ROLLBACK');
  }
};
