// Opt-in integration check: uses the configured database inside a rolled-back transaction.
if (process.env.RUN_COACH_PROFILE_DB_CHECK !== '1') throw new Error('Set RUN_COACH_PROFILE_DB_CHECK=1 to run against the configured database.');
const {Client}=require('../node_modules/pg');
const {CoachProfileService}=require('../dist/coach-profile/profile.service');
const assert=require('node:assert/strict');
require('../node_modules/dotenv').config({path:require('node:path').join(__dirname,'../.env'),quiet:true});
(async()=>{
 const response=await fetch('https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt');if(!response.ok)throw new Error('Unable to load official CA');
 const db=new Client({host:process.env.DB_HOST,port:process.env.DB_PORT,user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE,ssl:{rejectUnauthorized:true,ca:await response.text()}});
 try{await db.connect();await db.query('BEGIN');
 const adapter={query:async(sql,args)=>(await db.query(sql,args)).rows,transaction:async(fn)=>fn(adapter)};
 const profile=new CoachProfileService(adapter);
 const {rows:[coach]}=await db.query("SELECT id FROM users WHERE role='COACH' AND status IS DISTINCT FROM 'SUSPENDED' LIMIT 1");assert.ok(coach,'A coach must exist');
 const original=await profile.get(coach.id);
 const saved=await profile.update(coach.id,{first_name:'Integration',last_name:'Check',phone:'+27 82 123 4567',headline:'Youth coach',primary_sport:'Rugby',location:'Pretoria',years_experience:12,specialisms:'Forwards',bio:'Temporary profile test'});
 assert.equal(saved.user.first_name,'Integration');assert.equal(saved.details.bio,'Temporary profile test');assert.equal(saved.details.years_experience,12);
 assert.equal(saved.counts.qualifications,original.counts.qualifications);
 const cleared=await profile.update(coach.id,{phone:'',years_experience:null,bio:'',profile_image:null});assert.equal(cleared.user.phone,'');assert.equal(cleared.details.years_experience,null);assert.equal(cleared.details.bio,'');
 assert.ok(!('password_hash' in saved.user));
 console.log('Coach profile account and coaching details save/read/clear passed; portfolio totals preserved.');

 }finally{await db.query('ROLLBACK');await db.end();console.log('Test transaction rolled back.');}
})().catch(err=>{console.error(err.message);process.exitCode=1;});
