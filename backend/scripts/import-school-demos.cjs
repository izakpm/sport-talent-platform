// Caller supplies a connected PostgreSQL client and a reviewed, sourced plan.
// Does not reset existing passwords or attach any private athlete/coach records.
const bcrypt = require('bcrypt');
const { randomUUID } = require('node:crypto');
module.exports = async function importSchoolDemos(db, plan, password) {
  if (!password || password.length < 6) throw Error('A demo password is required');
  const schools = new Map(), teams = new Map(), accounts = [];
  if (new Set(plan.schools.map(s=>s.slug)).size !== plan.schools.length) throw Error('Duplicate school slugs');
  for (const s of plan.schools) if (!s.email.endsWith('.demo@playverified.test')) throw Error('Only reserved demo addresses are permitted');
  const hash = await bcrypt.hash(password, 10);
  await db.query('BEGIN');
  try {
    await db.query("SELECT pg_advisory_xact_lock(hashtext('noordvaal-demo-import'))");
    for (const s of plan.schools) {
      let existing = (await db.query('SELECT organisation_id FROM school_competition_profiles WHERE source_key=$1',[s.source_key])).rows[0];
      const id=existing?.organisation_id || randomUUID();
      if (!existing) {
        await db.query("INSERT INTO organisations(id,name,type,location,verification_status) VALUES($1,$2,'SCHOOL',$3,'UNCLAIMED_DEMO')",[id,s.name,s.location]);
        await db.query('INSERT INTO school_competition_profiles(organisation_id,source_key,slug,division,province,logo_url,source_url) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,s.source_key,s.slug,s.division,s.province,s.logo_url,s.source_url]);
      }
      schools.set(s.slug,id);
      let user=(await db.query('SELECT id,role FROM users WHERE email=$1',[s.email])).rows[0];
      if(user){
        const member=(await db.query('SELECT id FROM organisation_users WHERE user_id=$1 AND organisation_id=$2',[user.id,id])).rows[0];
        if(user.role!=='SCHOOL'||!member)throw Error('Demo login already belongs to another workspace: '+s.email);
      }else{
        user={id:randomUUID()};
        await db.query("INSERT INTO users(id,email,password_hash,role,first_name,last_name,status,profile_image) VALUES($1,$2,$3,'SCHOOL',$4,'Demo','ACTIVE',$5)",[user.id,s.email,hash,s.name,s.logo_url]);
        await db.query("INSERT INTO organisation_users(user_id,organisation_id,role) VALUES($1,$2,'DEMO_VIEWER')",[user.id,id]);
      }
      accounts.push({school:s.name,email:s.email,user_id:user.id,organisation_id:id});
    }
    for(const t of plan.teams){
      const org=schools.get(t.school);if(!org)throw Error('Unmapped school: '+t.school);
      const r=await db.query(`INSERT INTO school_competition_teams(organisation_id,name,season,source_url) VALUES($1,$2,$3,$4)
        ON CONFLICT(organisation_id,name,season) DO UPDATE SET source_url=school_competition_teams.source_url RETURNING id`,[org,t.name,t.season,t.source_url]);
      teams.set(t.key,r.rows[0].id);
    }
    const fixtures=plan.fixtures.map(f=>{
      if(!teams.has(f.home_team)||!teams.has(f.away_team)||f.home_team===f.away_team||!/^2026-\d\d-\d\d$/.test(f.date))throw Error('Invalid fixture');
      if((f.home_score===null)!==(f.away_score===null)||[f.home_score,f.away_score].some(x=>x!==null&&(!Number.isInteger(x)||x<0)))throw Error('Invalid score');
      return {...f,home_team_id:teams.get(f.home_team),away_team_id:teams.get(f.away_team)};
    });
    await db.query(`INSERT INTO school_competition_fixtures(source_key,home_team_id,away_team_id,match_date,division,home_score,away_score,venue,round,decision_note,source_url,source_label,additional_sources)
      SELECT source_key,home_team_id,away_team_id,date::date,division,home_score,away_score,venue,round,decision_note,source_url,source_label,additional_sources
      FROM jsonb_to_recordset($1::jsonb) AS x(source_key text,home_team_id uuid,away_team_id uuid,date text,division text,home_score int,away_score int,venue text,round text,decision_note text,source_url text,source_label text,additional_sources jsonb)
      ON CONFLICT DO NOTHING`,[JSON.stringify(fixtures)]);
    await db.query('COMMIT');
    return {accounts,teams:teams.size,fixtures:fixtures.length};
  }catch(e){await db.query('ROLLBACK');throw e;}
};
