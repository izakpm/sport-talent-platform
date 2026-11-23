// Generate current-state documentation from the read-only PostgreSQL snapshot.
const fs = require('node:fs');
const path = require('node:path');
const base = __dirname;
const s = JSON.parse(fs.readFileSync(path.join(base, 'current/schema-snapshot.json')));
const groups = [
  ['01-identity', 'Identity & account access', 'users athlete_profiles coach_profiles guardian_profiles guardian_links scout_profiles password_reset_tokens oauth_sessions auth_rate_limits'],
  ['02-portfolios', 'Sports & sporting portfolios', 'sports positions athlete_sports athlete_sport_profiles athlete_sport_positions metrics athlete_portfolio_entries coach_portfolio'],
  ['03-teams', 'Coach teams & invitations', 'coach_teams coach_team_players coach_player_accounts team_invitations'],
  ['04-schedule', 'Calendars, attendance, matches & feed', 'coach_schedule_events athlete_calendar_events coach_session_attendance coach_session_codes coach_team_posts match_results athlete_match_stats'],
  ['05-activities', 'Training & verification', 'activities activity_types activity_metrics activity_coach_requests activity_verifications verification_requests verification_tokens'],
  ['06-organisations', 'Organisations & school competitions', 'organisations organisation_users organisation_affiliations organisation_directory_sources school_competition_profiles school_competition_teams school_competition_fixtures'],
  ['07-resources', 'Resource library & publishing', 'athlete_resources resource_assets resource_publishers'],
  ['08-discovery', 'Additional events & discovery models', 'events participations videos connections opportunities opportunity_applications'],
].map(([id, title, names]) => ({id, title, tables: names.split(' ')}));
const columns = t => s.columns.filter(c => c.table_name === t);
const constraints = t => s.constraints.filter(c => c.table_name === t);
const fks = s.constraints.filter(c => c.type === 'f');
const pk = t => constraints(t).find(c => c.type === 'p')?.columns || [];
const uniqueSets = t => [
  ...constraints(t).filter(c => ['p', 'u'].includes(c.type)).map(c => c.columns),
  ...s.indexes.filter(i => i.table_name === t && /CREATE UNIQUE INDEX/.test(i.definition) && !/ WHERE /.test(i.definition))
    .map(i => i.definition.match(/USING btree \(([^)]+)\)/)?.[1].split(',').map(x => x.trim().replaceAll('"', ''))).filter(Boolean),
];
const unique = (t, cols) => uniqueSets(t).some(set => set.every(c => cols.includes(c)));
const write = (file, content) => { fs.mkdirSync(path.dirname(path.join(base,file)), {recursive:true}); fs.writeFileSync(path.join(base,file),content); };
const esc = x => String(x ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const md = x => String(x ?? '—').replaceAll('|','\\|').replaceAll('\n',' ');
const ownership = groups.flatMap(g => g.tables);
if (new Set(ownership).size !== s.tables.length || ownership.length !== s.tables.length || s.tables.some(t => !ownership.includes(t.name))) throw Error('Table coverage mismatch');
let renderedRelationships = 0;
for (const g of groups) {
  const edges = fks.filter(f => g.tables.includes(f.table_name));
  const references = [...new Set(edges.map(f => f.target_table))].filter(t => !g.tables.includes(t));
  let m = 'erDiagram\n    direction LR\n';
  for (const t of [...g.tables, ...references]) {
    const isReference = references.includes(t);
    // Key fields and a few useful business fields keep the diagrams readable.
    const keys = new Set([...pk(t), ...fks.filter(f => f.table_name === t).flatMap(f => f.columns)]);
    const selected = isReference ? columns(t).filter(c => pk(t).includes(c.column_name)) : columns(t).filter(c => keys.has(c.column_name) || /^(name|title|role|status|kind|mode|date|sport|season|format|topic|email|school_id|organisation_id|sport_id|user_id|athlete_id|position_id|event_id|coach_id)$/.test(c.column_name));
    m += `    ${t} {\n`;
    for (const c of selected) {
      const tags = [pk(t).includes(c.column_name) && 'PK', fks.some(f => f.table_name === t && f.columns.includes(c.column_name)) && 'FK', unique(t,[c.column_name]) && !pk(t).includes(c.column_name) && 'UK'].filter(Boolean).join(',');
      const notes = [c.is_nullable === 'YES' ? 'nullable' : 'required', isReference && 'reference table'].filter(Boolean).join('; ');
      m += `        ${c.udt_name.replace(/[^a-zA-Z0-9_]/g,'_')} ${c.column_name}${tags ? ' '+tags : ''} "${notes}"\n`;
    }
    m += '    }\n';
  }
  for (const f of edges) {
    const required = f.columns.every(col => columns(f.table_name).find(c => c.column_name === col).is_nullable === 'NO');
    const identifying = f.columns.every(c => pk(f.table_name).includes(c));
    m += `    ${f.target_table} ${required ? '||' : '|o'}${identifying ? '--' : '..'}${unique(f.table_name,f.columns) ? 'o|' : 'o{'} ${f.table_name} : "${f.columns.join(', ')}"\n`;
  }
  renderedRelationships += edges.length;
  write(`current/${g.id}.mmd`, m);
}
if (renderedRelationships !== fks.length) throw Error('Relationship coverage mismatch');
let dictionary = `# Current database dictionary\n\nCaptured ${s.captured_at}. Public application schema only; metadata, not customer records.\n\n${s.tables.length} tables · ${s.columns.length} columns · ${fks.length} foreign keys.\n\nDiagrams show selected fields; this dictionary preserves every column, constraint and index. Nullable means PostgreSQL permits NULL, not that the application always permits omission.\n\n`;
for (const g of groups) {
  dictionary += `## ${g.title}\n\n`;
  for (const t of g.tables) {
    dictionary += `### ${t}\n\n| Column | PostgreSQL type | Nullable | Default |\n|---|---|---|---|\n`;
    for (const c of columns(t)) dictionary += `| ${c.column_name} | ${md(c.data_type)} (${c.udt_name}) | ${c.is_nullable} | ${md(c.column_default)} |\n`;
    dictionary += '\nConstraints:\n\n';
    for (const c of constraints(t)) dictionary += `- **${c.name}**: \`${c.definition}\`${c.validated ? '' : ' — NOT VALIDATED'}\n`;
    dictionary += '\nIndexes:\n\n';
    for (const i of s.indexes.filter(i => i.table_name === t)) dictionary += `- \`${i.definition}\`\n`;
    const table = s.tables.find(x => x.name === t);
    dictionary += `\nRow-level security: ${table.rls ? 'enabled' : 'disabled'}; forced: ${table.force_rls ? 'yes' : 'no'}; public policies: ${s.policies.filter(p => p.table_name === t).length}.\n\n`;
  }
}
write('current/table-dictionary.md',dictionary.trimEnd()+'\n');
write('current/relationships.md', '# Current foreign-key register\n\nEach row is a database-enforced relationship. All '+fks.length+' appear once across the eight detailed diagrams, in the referencing table’s group.\n\n| Referencing table / columns | Referenced table / columns | Definition |\n|---|---|---|\n'+fks.map(f=>`| ${f.table_name} (${f.columns.join(', ')}) | ${f.target_table} (${f.target_columns.join(', ')}) | ${md(f.definition)} |`).join('\n')+'\n');
write('current/coverage.json',JSON.stringify({captured_at:s.captured_at,tables:s.tables.length,columns:s.columns.length,foreign_keys:fks.length,diagram_relationships:renderedRelationships,groups:groups.map(g=>({...g,foreign_keys:fks.filter(f=>g.tables.includes(f.table_name)).length}))},null,2)+'\n');
// Rendering happens separately; rebuild the portable viewer once SVG exports exist.
const diagrams = [{id:'00-platform-overview',title:'Platform overview',folder:'current'},...groups.map(g=>({...g,folder:'current'})),{id:'organisation-affiliations',title:'Proposed: confirmation & public counts',folder:'proposed'}];
if (diagrams.every(d => fs.existsSync(path.join(base,d.folder,d.id+'.svg')))) {
  const nav=diagrams.map(d=>`<a href="#${d.id}">${esc(d.title)}</a>`).join('');
  const sections=diagrams.map(d=>`<section id="${d.id}" class="${d.folder}"><header><div><small>${d.folder === 'proposed' ? 'PROPOSED · NOT IMPLEMENTED' : 'CURRENT · 23 NOVEMBER 2026'}</small><h2>${esc(d.title)}</h2></div><a href="${d.folder}/${d.id}.svg" target="_blank" rel="noopener">Open full size ↗</a></header><p>${d.id==='00-platform-overview'?'Application flow overview. Arrows describe usage, not foreign-key cardinality.':d.folder==='proposed'?'Existing structures are labelled separately from proposed confirmation, public-count and official-team workflows.':'Database-enforced relationships. PK = primary key · FK = foreign key · UK = unique key. Reference tables show their key only. Full fields are in the table dictionary.'}</p><div class="controls"><button data-zoom="out">−</button><button data-zoom="in">+</button><button data-zoom="fit">Fit</button><span>Zoom, then scroll to inspect</span></div><div class="diagram"><img alt="${esc(d.title)} diagram" src="data:image/svg+xml;base64,${fs.readFileSync(path.join(base,d.folder,d.id+'.svg')).toString('base64')}"></div></section>`).join('\n');
  write('index.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PlayVerified · Data model</title><style>
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f3f6f8;color:#0b2130;font:16px/1.6 system-ui,sans-serif}aside{position:fixed;inset:0 auto 0 0;width:258px;background:#0b2130;color:white;padding:28px 22px;overflow:auto;border-top:4px solid #ffcc00}aside strong{font-size:23px}aside small{display:block;color:#adc1ce;margin-bottom:25px}aside a{display:block;color:#dbe6ed;text-decoration:none;padding:9px 0;font-size:14px}aside a:hover{color:#ffcc00}main{margin-left:258px;padding:40px;max-width:1900px}h1{font-size:42px;line-height:1.15;margin:8px 0 20px}h2{margin:0;font-size:24px}p{max-width:1000px}small{font-weight:700;letter-spacing:1px;font-size:11px}.lead{background:#0b2130;color:white;padding:32px;border-top:4px solid #ffcc00;border-radius:14px}.lead p{color:#cbdce7}.stats{display:flex;gap:35px;flex-wrap:wrap}.stats b{font-size:30px;color:#ffcc00}.stats span{display:block;font-size:13px}.notes{background:#fff;padding:24px;margin:24px 0;border-radius:12px}.notes li{margin:9px 0}a{color:#185e7c}section{background:white;border:1px solid #d4dfe7;border-top:3px solid #ffcc00;border-radius:14px;margin:28px 0;padding:24px;scroll-margin-top:20px}section.proposed{border-top-color:#b56022}header{display:flex;gap:20px;justify-content:space-between;align-items:center}header a{font-size:13px;white-space:nowrap}section small{color:#536d7e}section.proposed small{color:#a24d15}.diagram{overflow:auto;max-height:85vh;border:1px solid #e1e7eb;background:white}[id="00-platform-overview"] .diagram{max-height:none}.diagram img{display:block;width:100%;height:auto;max-width:none!important}.controls{display:flex;align-items:center;gap:8px;margin:12px 0}button{background:#edf3f6;border:1px solid #c8d5df;border-radius:6px;padding:5px 14px;font:inherit;cursor:pointer}.controls span{font-size:12px;color:#536d7e}@media(max-width:800px){aside{position:static;width:auto}aside nav{display:flex;gap:18px;overflow:auto}aside a{white-space:nowrap}aside small{margin-bottom:10px}main{margin:0;padding:18px}h1{font-size:32px}section{padding:15px}header{display:block}}@media print{aside,.controls{display:none}main{margin:0;padding:0}.diagram{max-height:none;overflow:visible}section{break-before:page}}
</style><aside><strong>PlayVerified</strong><small>THE DATA BEHIND THE PLATFORM</small><nav>${nav}<a href="README.md">Analysis & reading guide</a><a href="current/table-dictionary.md">Complete table dictionary</a><a href="current/relationships.md">All 82 foreign keys</a></nav></aside><main><div class="lead"><small>LIVE DATABASE SNAPSHOT · 23 NOVEMBER 2026</small><h1>One platform.<br>A clear view of its data.</h1><p>Current structures verified against Supabase metadata and the application code. Future design ideas are kept in a separate section.</p><div class="stats"><div><b>51</b><span>Application tables</span></div><div><b>433</b><span>Columns</span></div><div><b>82</b><span>Foreign-key relationships</span></div><div><b>8</b><span>Detailed domain diagrams</span></div></div></div><div class="notes"><strong>What matters most</strong><ul><li>Accounts are the shared identity. Managed children also have athlete account records; guardian links control parent access.</li><li>Coach teams and imported school-competition teams are separate structures. The database does not currently connect them.</li><li>Training verification and team-session attendance are separate records and must not be counted as the same thing.</li><li>School and club directory entries now map to shared organisations. Profile affiliations are private and separate from access permissions.</li></ul><p><b>Read the diagrams:</b> a circle means zero is allowed; a bar means one; a crow’s foot means many. Solid lines identify a child through its primary key; dotted lines are other enforced foreign keys. Optionality reflects the database, not just the intended screen behaviour.</p></div>${sections}<p>Scope: public application schema. No customer records or credentials are included. Supabase-managed auth and storage schemas are outside this snapshot.</p></main><script>document.querySelectorAll('.controls button').forEach(b=>b.addEventListener('click',()=>{const box=b.closest('section').querySelector('.diagram');let z=Number(box.dataset.zoom||1);z=b.dataset.zoom==='fit'?1:Math.max(1,Math.min(8,z*(b.dataset.zoom==='in'?1.5:1/1.5)));box.dataset.zoom=z;box.querySelector('img').style.width=(100*z)+'%';}));</script></html>`);
}
console.log(`Verified ${ownership.length} tables and ${renderedRelationships} relationships; generated current documentation.`);
