// Opt-in integration check: uses the configured database inside a rolled-back transaction.
if (process.env.RUN_PORTFOLIO_DB_CHECK !== '1') throw new Error('Set RUN_PORTFOLIO_DB_CHECK=1 to run against the configured database.');
const {Client}=require('../node_modules/pg');
const {PortfolioService}=require('../dist/coach-portfolio/portfolio.service');
const assert=require('node:assert/strict');
require('../node_modules/dotenv').config({path:require('node:path').join(__dirname,'../.env'),quiet:true});
(async()=>{
 const response=await fetch('https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt');if(!response.ok)throw new Error('Unable to load official CA');
 const db=new Client({host:process.env.DB_HOST,port:process.env.DB_PORT,user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE,ssl:{rejectUnauthorized:true,ca:await response.text()}});
 try{await db.connect();await db.query('BEGIN');
 const adapter={query:async(sql,args)=>(await db.query(sql,args)).rows,transaction:async(fn)=>fn(adapter)};
 const service=new PortfolioService(adapter);
 const {rows:[coach]}=await db.query("SELECT id FROM users WHERE role='COACH' AND status IS DISTINCT FROM 'SUSPENDED' LIMIT 1");assert.ok(coach,'A coach must exist');
 for(const kind of ['achievements','history','qualifications']){
 const body={title:'Temporary integration check',role:'Head coach',start_date:'1998-01-01',end_date:'2000-01-01',...(kind==='qualifications'?{certificate:{name:'sample.pdf',data:Buffer.from('%PDF-1.4 sample certificate').toString('base64')}}:{})};
 const entry=await service.save(coach.id,kind,body);assert.ok(entry.id);assert.ok((await service.list(coach.id,kind)).some(x=>x.id===entry.id));
 if(kind==='qualifications'){const file=await service.certificate(coach.id,entry.id);assert.equal(file.certificate_data.toString(),'%PDF-1.4 sample certificate');}
 const updated=await service.save(coach.id,kind,{...body,title:'Updated check'},entry.id);assert.equal(updated.title,'Updated check');
 if(kind==='qualifications'){await service.save(coach.id,kind,{title:body.title,start_date:body.start_date,remove_certificate:true},entry.id);await assert.rejects(()=>service.certificate(coach.id,entry.id));}
 await service.remove(coach.id,entry.id);assert.ok(!(await service.list(coach.id,kind)).some(x=>x.id===entry.id));
 }
 const {rows:[security]}=await db.query("SELECT relrowsecurity FROM pg_class WHERE oid='public.coach_portfolio'::regclass");assert.equal(security.relrowsecurity,true);
 console.log('All three portfolio sections: database create/read/update/delete passed. Private certificate upload/download/removal passed. RLS enabled.');
 }finally{await db.query('ROLLBACK');await db.end();console.log('Test transaction rolled back.');}
})().catch(err=>{console.error(err.message);process.exitCode=1;});
