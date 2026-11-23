// Import existing public directory entries into shared organisations, not accounts.
// Run with a connected pg client. Dry-run is the default; caller owns the transaction.
const fs = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
module.exports = async function importDirectory(db, {apply = false} = {}) {
  const directory = path.resolve(__dirname, '../../frontend/app/network');
  const entries = [['schools.json','SCHOOL'],['clubs.json','CLUB']].flatMap(([file,type]) => JSON.parse(fs.readFileSync(path.join(directory,file),'utf8')).map(e => ({...e,type})));
  if (new Set(entries.map(e=>e.slug)).size !== entries.length) throw Error('Duplicate directory keys; review before importing.');
  const organisations = (await db.query('SELECT id,name,type,location FROM organisations')).rows;
  const profiles = (await db.query('SELECT organisation_id,slug FROM school_competition_profiles')).rows;
  const exists = (await db.query("SELECT to_regclass('public.organisation_directory_sources') AS table_name")).rows[0].table_name;
  const sources = exists ? (await db.query("SELECT external_key,organisation_id FROM organisation_directory_sources WHERE source='playverified-network'")).rows : [];
  const normalise = v => (v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const summary = {entries:entries.length,existing:0,created:0,ambiguous:[]};
  const plan=[];
  for (const entry of entries) {
    let id = sources.find(s=>s.external_key===entry.slug)?.organisation_id || (entry.type==='SCHOOL' ? profiles.find(s=>s.slug===entry.slug)?.organisation_id : undefined);
    if (!id) {
      const candidates=organisations.filter(o=>o.type?.toUpperCase()===entry.type && normalise(o.name)===normalise(entry.name));
      if(candidates.length>1) {summary.ambiguous.push(entry.name); continue;}
      id=candidates[0]?.id;
    }
    if(id) summary.existing++; else summary.created++;
    plan.push({entry,id:id||randomUUID(),create:!id});
  }
  if (summary.ambiguous.length) { if(apply) throw Error('Ambiguous organisation matches require review: '+summary.ambiguous.join(', ')); return summary; }
  if(apply) for(const {entry,id,create} of plan) {
    if(create) await db.query("INSERT INTO organisations(id,name,type,location,verification_status) VALUES($1,$2,$3,$4,'UNVERIFIED')",[id,entry.name,entry.type,entry.location||null]);
    await db.query(`INSERT INTO organisation_directory_sources(source,external_key,organisation_id,logo_url,source_url) VALUES('playverified-network',$1,$2,$3,$4) ON CONFLICT(source,external_key) DO UPDATE SET logo_url=EXCLUDED.logo_url,source_url=EXCLUDED.source_url`,[entry.slug,id,entry.logo,entry.sources?.[0]||null]);
  }
  return summary;
};
