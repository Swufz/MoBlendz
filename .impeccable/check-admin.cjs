/* eslint-disable @typescript-eslint/no-require-imports -- Standalone read-only admin check. */
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), assert = require('node:assert/strict');
const ts = require('typescript'), React = require('react'), {renderToStaticMarkup} = require('react-dom/server');
const root = process.cwd(), original = Module._load;
let route = '/admin', role = 'admin', fail = false, queries = 0;
let bookings = [], customers = [];
const profile = {full_name:'Mo',role:'admin',email:'admin@example.com',avatar_url:'/mb-logo.png'};
const supabase = {from(table) {
  queries++;
  let from = 0, to = 999, joined = false;
  const query = {select(columns) {joined = columns.includes('profiles('); return query}, order(){return query}, range(a,b){from=a;to=b;return query}, eq(){return query}, in(){return query}, gte(){return query}, or(){return query}, async returns(){
    const rows = table === 'profiles' ? customers : bookings;
    // Small simulated API cap exercises dashboard pagination beyond its first request.
    const data = rows.slice(from, Math.min(to + 1, from + (joined ? 50 : 3))).map(row => joined ? {...row,profiles:customers.find(c=>c.id===row.user_id)} : row);
    return {data:fail ? null : data,error:fail ? {message:'Fixture connection failed'} : null,count:rows.length};
  }};
  return query;
}};
Module._load = function(name,parent,main) {
  if(name === 'next/link') return ({children,href,...props})=>React.createElement('a',{href,...props},children);
  if(name === 'next/image') return ({fill,...props})=>{delete props.preload;delete props.priority;return React.createElement('img',{...props,style:fill?{position:'absolute',width:'100%',height:'100%',inset:0}:{}})};
  if(name === 'next/navigation') return {redirect:url=>{throw Error('REDIRECT '+url)},usePathname:()=>route,useSearchParams:()=>new URLSearchParams(),useRouter:()=>({})};
  if(name === '@/app/actions') return new Proxy({}, {get:()=>()=>{throw Error('No real mutations allowed')}});
  if(name === '@/lib/data') return {getSessionProfile:async()=>({profile:{...profile,role}}),getSupabaseOrNull:async()=>supabase,getAdminSettings:async()=>require(path.join(root,'src/lib/config.ts')).defaultAdminSettings};
  if(name.startsWith('@/')) name=path.join(root,'src',name.slice(2));
  return original.call(this,name,parent,main);
};
for(const ext of ['.ts','.tsx']) require.extensions[ext]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);
const {buildAdminDashboard,shiftBusinessDate,collectedAmount}=require(path.join(root,'src/lib/admin-dashboard.ts'));
const {createBookingDateTime,getBusinessDate}=require(path.join(root,'src/lib/timezone.ts'));
const base={id:'1',user_id:'a',service_type:'haircut',date_time:'2026-11-01T08:30:00Z',completed_at:'2026-11-01T08:30:00Z',status:'completed',base_price:30,discount_amount:5,final_price:24.75,duration_minutes:30,notes:null};
const check=buildAdminDashboard([base,{...base,id:'2',date_time:'2026-11-01T09:30:00Z',completed_at:'2026-11-01T09:30:00Z',final_price:0,notes:'Scalp/neck massage'},{...base,id:'3',date_time:'2026-10-31T18:00:00Z',completed_at:'2026-10-31T18:00:00Z'},{...base,id:'4',status:'cancelled'},{...base,id:'5',status:'no_show'},{...base,id:'6',date_time:'2026-11-02T08:00:00Z',completed_at:'2026-11-02T08:00:00Z'}],[{id:'a',created_at:'2026-11-01T07:00:00Z'}],'today',new Date('2026-11-01T20:00:00Z'));
assert.equal(check.selected.length,2);assert.equal(check.completed,2);assert.equal(check.revenue,24.75);assert.equal(check.returning,1);assert.equal(check.returningPercent,100);assert.equal(check.addOns,1);assert.equal(check.newCustomers,1);assert.equal(check.end-check.start,25*3600000);assert.equal(collectedAmount({...base,final_price:null}),25);
assert.equal(buildAdminDashboard([],[],'today').averageDuration,null);assert.equal(buildAdminDashboard([base],[],'week',new Date('2026-11-01T20:00:00Z')).days,7);assert.equal(shiftBusinessDate('2026-12-31',1),'2027-01-01');
const today=getBusinessDate(new Date());
customers=Array.from({length:25},(_,i)=>({id:'c'+i,full_name:['Omar K.','Yusuf A.','Daniel R.','Adam S.','Hassan M.'][i%5],phone:'9495551234',email:'client@example.com',created_at:createBookingDateTime(shiftBusinessDate(today,-i),'08:00').toISOString()}));
for(let day=-13;day<=0;day++) for(let visit=0;visit<2+(day+13)%6;visit++) bookings.push({...base,id:'b'+bookings.length,user_id:'c'+(visit%5),date_time:createBookingDateTime(shiftBusinessDate(today,day),'09:00').toISOString(),completed_at:createBookingDateTime(shiftBusinessDate(today,day),'10:00').toISOString(),final_price:visit%3===0?35:30,service_type:visit%3===0?'haircut_beard':'haircut'});
for(let i=0;i<4;i++) bookings.push({...base,id:'future'+i,user_id:'c'+i,date_time:new Date(Date.now()+(i+1)*3600000).toISOString(),completed_at:null,status:i===3?'pending':'confirmed'});
const AdminPage=require(path.join(root,'src/app/admin/page.tsx')).default, Layout=require(path.join(root,'src/app/admin/layout.tsx')).default;
(async()=>{
  role='customer';await assert.rejects(()=>AdminPage({searchParams:Promise.resolve({})}),{message:'REDIRECT /'});assert.equal(queries,0);role='admin';
  const css=fs.readdirSync('.next/static/chunks').filter(n=>n.endsWith('.css')).map(n=>fs.readFileSync('.next/static/chunks/'+n,'utf8')).join('\n').replaceAll('../media/','/_next/static/media/');
  const doc=html=>`<!doctype html><html><head><meta charset="UTF-8"><style>${css} :root{--font-inter:Inter;--font-outfit:Outfit;--font-cormorant:"Cormorant Garamond"}</style></head><body>${html}</body></html>`;
  const pages={};
  for(const [name,params] of [['admin',{}],['admin-week',{period:'week',metric:'bookings'}],['admin-month',{period:'month',metric:'customers'}],['admin-invalid',{period:'oops',metric:'oops'}]]) {
    const markup=renderToStaticMarkup(React.createElement(Layout,{children:await AdminPage({searchParams:Promise.resolve(params)})}));
    pages['/'+name]=doc(markup);
  }
  assert.ok(queries>8,'All compact history pages read');assert.ok(pages['/admin'].includes('Collected revenue'));assert.ok(pages['/admin-week'].includes('Scheduled appointments'));assert.ok(pages['/admin-month'].includes('New customer registrations'));assert.ok(pages['/admin-invalid'].includes('Today at a glance'));
  for(const file of ['bookings','settings']) {route='/admin/'+file;pages[route]=doc(renderToStaticMarkup(React.createElement(Layout,{children:await require(path.join(root,'src/app/admin/'+file+'/page.tsx')).default({searchParams:Promise.resolve({})})})));}
  route='/admin';fail=true;pages['/admin-error']=doc(renderToStaticMarkup(React.createElement(Layout,{children:await AdminPage({searchParams:Promise.resolve({})})})));assert.ok(pages['/admin-error'].includes('Chart unavailable'));fail=false;bookings=[];customers=[];pages['/admin-empty']=doc(renderToStaticMarkup(React.createElement(Layout,{children:await AdminPage({searchParams:Promise.resolve({})})})));assert.ok(pages['/admin-empty'].includes('No upcoming bookings.'));
  const server=require('node:http').createServer((req,res)=>{if(pages[req.url]){res.setHeader('Content-Type','text/html');return res.end(pages[req.url])}const file=path.join(root,req.url.startsWith('/_next/')?req.url.replace('/_next/','.next/'):'public'+req.url);if(fs.existsSync(file)){res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'font/woff2');res.end(fs.readFileSync(file))}else{res.statusCode=404;res.end()}});
  await new Promise(resolve=>server.listen(3108,'127.0.0.1',resolve));
  const {chromium}=require('C:/Users/minio/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const browser=await chromium.launch({headless:true,channel:'msedge'});
  try {for(const name of ['/admin','/admin-week','/admin-empty','/admin-error','/admin/bookings','/admin/settings']) for(const [device,width,height] of [['desktop',1536,1024],['mobile',390,844],['tablet',820,1180]]) {if(process.env.ADMIN_CAPTURE==='desktop'&&(name!=='/admin'||device!=='desktop'))continue;const page=await browser.newPage({viewport:{width,height}});await page.goto('http://127.0.0.1:3108'+name);await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,name+' '+device+' overflow');assert.equal(await page.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth)),true);await page.screenshot({path:'.impeccable/review/'+name.slice(1).replaceAll('/','-')+'-'+device+'.png',fullPage:true});if(name==='/admin' && device==='mobile'){await page.getByRole('region',{name:'Recent bookings table'}).focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('.admin-table-scroll').scrollLeft>0);assert.ok(await page.getByText('Scroll sideways to see amounts, status, and booking links.').isVisible())}if(name==='/admin'){await page.locator('.admin-period summary').click();assert.ok(await page.getByRole('navigation',{name:'Dashboard reporting period'}).isVisible());assert.ok((await page.getByRole('link',{name:'Last 7 days',exact:true}).getAttribute('href')).includes('period=week'));await page.locator('.admin-chart-data summary').click();assert.equal(await page.locator('.admin-chart-data tbody tr').count(),14)}console.log('PASS',name,device);await page.close()}}
  finally {await browser.close();server.close()}
  console.log('PASS: DST, money, status exclusion, returning clients, addon accounting, pagination, auth, periods, empty/error states, selected viewport rendering. Mock data only; no mutations.');
})().catch(error=>{console.error(error);process.exit(1)});









