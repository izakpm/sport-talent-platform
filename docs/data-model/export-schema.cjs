const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const { Client } = require(path.join(root, 'backend/node_modules/pg'));
const dotenv = require(path.join(root, 'backend/node_modules/dotenv'));
const env = { ...process.env, ...dotenv.parse(fs.readFileSync(process.argv[2] || path.join(root, '.vercel/backend-production.env'))) };
const client = new Client({ host: env.DB_HOST, port: Number(env.DB_PORT || 5432), user: env.DB_USERNAME, password: env.DB_PASSWORD, database: env.DB_DATABASE, ssl: { rejectUnauthorized: true, ...(env.DB_SSL_CA ? { ca: env.DB_SSL_CA.replace(/\\n/g, '\n') } : {}) } });
(async () => {
  try {
    await client.connect();
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const query = async sql => (await client.query(sql)).rows;
    const tables = await query(`SELECT c.relname AS name,c.relrowsecurity AS rls,c.relforcerowsecurity AS force_rls FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') ORDER BY c.relname`);
    const columns = await query(`SELECT table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position`);
    const constraints = await query(`SELECT con.conname AS name,c.relname AS table_name,con.contype AS type,con.convalidated AS validated,pg_get_constraintdef(con.oid,true) AS definition,ARRAY(SELECT a.attname::text FROM unnest(con.conkey) WITH ORDINALITY k(attnum,ord) JOIN pg_attribute a ON a.attrelid=con.conrelid AND a.attnum=k.attnum ORDER BY k.ord) AS columns,tn.nspname AS target_schema,tc.relname AS target_table,CASE WHEN con.contype='f' THEN ARRAY(SELECT a.attname::text FROM unnest(con.confkey) WITH ORDINALITY k(attnum,ord) JOIN pg_attribute a ON a.attrelid=con.confrelid AND a.attnum=k.attnum ORDER BY k.ord) END AS target_columns FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_class tc ON tc.oid=con.confrelid LEFT JOIN pg_namespace tn ON tn.oid=tc.relnamespace WHERE n.nspname='public' ORDER BY c.relname,con.contype,con.conname`);
    const indexes = await query(`SELECT tablename AS table_name,indexname AS name,indexdef AS definition FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname`);
    const views = await query(`SELECT table_name AS name,view_definition AS definition FROM information_schema.views WHERE table_schema='public' ORDER BY table_name`);
    const triggers = await query(`SELECT event_object_table AS table_name,trigger_name AS name,event_manipulation AS event,action_timing AS timing,action_statement AS action FROM information_schema.triggers WHERE trigger_schema='public' ORDER BY event_object_table,trigger_name,event_manipulation`);
    const policies = await query(`SELECT tablename AS table_name,policyname AS name,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname`);
    const { rows: [{ captured_at }] } = await client.query('SELECT now() AS captured_at');
    await client.query('COMMIT');
    fs.writeFileSync(path.join(__dirname,'current/schema-snapshot.json'),JSON.stringify({captured_at,scope:'public application schema; metadata only; no account or business records',tables,columns,constraints,indexes,views,triggers,policies},null,2)+'\n');
    console.log(JSON.stringify({tables:tables.length,columns:columns.length,foreign_keys:constraints.filter(c=>c.type==='f').length,views:views.length,triggers:triggers.length}));
  } catch (error) { console.error('Schema inspection failed:', error.code || error.name); process.exitCode=1; }
  finally { await client.end(); }
})();
