/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node CommonJS render check. */
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = process.cwd();
let fixturePath = '/';
const original = Module._load;
Module._load = function(name, parent, main) {
  if (name === 'next/link') return ({children, href, ...props}) => React.createElement('a', {href, ...props}, children);
  if (name === 'next/image') return ({fill, ...props}) => {
    delete props.preload; delete props.priority; delete props.unoptimized;
    return React.createElement('img', {...props, style: fill ? {position:'absolute',width:'100%',height:'100%',inset:0} : {}});
  };
  if (name === 'next/navigation') return { redirect: url => {throw Error(`REDIRECT ${url}`);}, useRouter: () => ({}), usePathname: () => fixturePath, useSearchParams: () => new URLSearchParams() };
  if (name === '@/app/actions') return new Proxy({}, {get: () => () => {throw Error('Fixture checks must not mutate bookings');}});
  if (name === '@/lib/data') return {
    getSessionProfile: async () => ({profile:sessionProfile}),
    getAdminSettings: async () => require(path.join(root, 'src/lib/config.ts')).defaultAdminSettings,
    getWeeklyAvailability: async () => undefined,
    getMyBookings: async () => fixtureBookings,
  };
  if (name.startsWith('@/')) name = path.join(root, 'src', name.slice(2));
  return original.call(this, name, parent, main);
};
for (const ext of ['.tsx', '.ts']) require.extensions[ext] = (mod, file) => {
  let source = fs.readFileSync(file, 'utf8');
  if (file.endsWith(path.join('app','page.tsx'))) source = source.replace('function CustomerHome(', 'export function CustomerHome(');
  if (file.endsWith('booking-wizard.tsx')) source = source.replace(/function (BookingReview|BookingDateSelector|BookingConfirmation)\(/g, 'export function $1(');
  mod._compile(ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText, file);
};
const assert = require('node:assert/strict');
const {LoyaltyProgressCard} = require(path.join(root, 'src/components/loyalty-tracker.tsx'));
for (const [props, expected] of [[{completed:0,required:5},'Complete 4 more paid visits'],[{completed:3,required:4},'Complete 0 more paid visits'],[{completed:0,freeHaircutsAvailable:1},'Your free cut is ready.']]) {
  assert.ok(renderToStaticMarkup(React.createElement(LoyaltyProgressCard,props)).includes(expected));
}
const {CustomerHome} = require(path.join(root, 'src/app/page.tsx'));
const profile = {full_name:'Mohammed',email:'client@example.com',phone:'9495551234',role:'customer',referral_code:'MOHAM',avatar_url:'/mb-logo.png'};
let sessionProfile = profile;
const fixtureBookings = [
  {id:'upcoming',service_type:'haircut_beard',date_time:'2026-10-10T18:00:00Z',base_price:35,final_price:null,discount_amount:5,discount_type:'referral',status:'confirmed',notes:'Keep the length on top.'},
  {id:'past',service_type:'haircut',date_time:'2026-09-20T18:00:00Z',base_price:30,final_price:30,discount_amount:0,discount_type:'none',status:'completed',notes:null},
];
const css = fs.readFileSync(path.join(root,'.next/static/chunks',fs.readdirSync('.next/static/chunks').find(n=>n.endsWith('.css'))),'utf8').replaceAll('../media/', '/_next/static/media/');
const markup = renderToStaticMarkup(React.createElement(CustomerHome,{profile,activeCredits:0,paidNeeded:4,loyalty:{paid_haircuts_since_last_free:2,free_haircuts_available:0}}));
const fontCSS = fs.readdirSync('.next/static/media').filter(n=>n.endsWith('.woff2')).map((n,i)=>`@font-face{font-family:preview${i};src:url('/_next/static/media/${n}')}`).join('');
const documentFor = (content) => `<!doctype html><html><head><style>${css}\n${fontCSS} :root{--font-inter:Inter;--font-outfit:Outfit;--font-cormorant:"Cormorant Garamond"}</style></head><body>${content}</body></html>`;
const pages = {'/': documentFor(markup)};
const http = require('http');
const server = http.createServer((req,res)=>{
  if(pages[req.url]){res.setHeader('Content-Type','text/html');return res.end(pages[req.url])}
  const file=path.join(root,req.url.startsWith('/_next/')?req.url.replace('/_next/','.next/'): 'public'+req.url);
  if(fs.existsSync(file)){res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'font/woff2');res.end(fs.readFileSync(file))}else{res.statusCode=404;res.end()}
});
(async()=>{
  const ProfilePage = require(path.join(root, 'src/app/profile/page.tsx')).default;
  const RewardsPage = require(path.join(root, 'src/app/rewards/page.tsx')).default;
  sessionProfile = null;
  await assert.rejects(() => ProfilePage(), {message:'REDIRECT /login?next=/profile'});
  await assert.rejects(() => RewardsPage(), {message:'REDIRECT /login?next=/%23loyalty'});
  sessionProfile = {...profile,role:'admin'};
  await assert.rejects(() => ProfilePage(), {message:'REDIRECT /admin'});
  await assert.rejects(() => RewardsPage(), {message:'REDIRECT /admin'});
  sessionProfile = profile;
  await assert.rejects(() => RewardsPage(), {message:'REDIRECT /#loyalty'});
  for (const [route,file] of [['/booking','booking'],['/bookings','bookings'],['/profile','profile']]) {
    fixturePath = route;
    const Page = require(path.join(root, `src/app/${file}/page.tsx`)).default;
    pages[route] = documentFor(renderToStaticMarkup(await Page({searchParams:Promise.resolve({})})));
  }
  assert.ok(pages['/bookings'].includes('Expected cash due'));
  assert.ok(pages['/bookings'].includes('$30'));
  assert.ok(pages['/bookings'].includes('Cancel booking'));
  assert.ok(!pages['/booking'].match(/aria-label="Primary navigation"[^>]*>(.*?)<\/nav>/)?.[1].includes('>Book</a>'));
  assert.ok(pages['/booking'].includes('liquid-glass-cta'));
  assert.ok(pages['/profile'].includes('name="fullName"'));
  assert.ok(pages['/profile'].includes('Save changes'));
  const profileMain = pages['/profile'].match(/<main.*?<\/main>/s)[0];
  for (const redundant of ['Recent bookings', 'Loyalty', 'Available credits', 'Give $5']) assert.ok(!profileMain.includes(redundant));
  assert.ok(!pages['/profile'].match(/aria-label="Primary navigation"[^>]*>(.*?)<\/nav>/)?.[1].includes('>Profile</a>'));
  assert.ok(!pages['/profile'].match(/aria-label="Quick navigation"[^>]*>(.*?)<\/nav>/)?.[1].includes('Profile'));
  const wizard = require(path.join(root, 'src/components/booking-wizard.tsx'));
  const wrap = (content) => documentFor(`<main class="account-home account-flow"><div class="account-flow-content"><div class="account-booking-form"><div class="booking-panel"><div class="booking-panel-body">${content}</div></div></div></div></main>`);
  pages['/review'] = wrap(renderToStaticMarkup(React.createElement(wizard.BookingReview, {bookingLimitMessage:'',date:new Date('2026-10-10T18:00:00Z'),duration:45,isCheckingBookingLimit:false,notes:'',price:35,referralCode:'MOHAM',referralDiscountAmount:5,referralMessage:'Valid code',scalpNeckMassage:false,serviceType:'haircut_beard',time:'11:00',isCheckingReferral:false,isReferralValid:true})));
  pages['/confirmation'] = wrap(renderToStaticMarkup(React.createElement(wizard.BookingConfirmation, {booking:{serviceType:'haircut_beard',dateTime:'2026-10-10T18:00:00Z',finalPrice:30,status:'confirmed'}})));
  fixtureBookings.length = 0;
  fixturePath = '/bookings';
  pages['/bookings-empty'] = documentFor(renderToStaticMarkup(await require(path.join(root,'src/app/bookings/page.tsx')).default({searchParams:Promise.resolve({cancel:'too-late'})})));
  assert.ok(pages['/bookings-empty'].includes('No upcoming appointments.'));
  assert.ok(pages['/bookings-empty'].includes('Online cancellation closes'));
  await new Promise(resolve=>server.listen(3107,'127.0.0.1',resolve));
  const {chromium}=require('C:/Users/minio/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  const clientModules = Object.fromEntries([
    ['react','react','react.development.js'], ['react/jsx-runtime','react','react-jsx-runtime.development.js'],
    ['react-dom','react-dom','react-dom.development.js'], ['react-dom/client','react-dom','react-dom-client.development.js'],
    ['scheduler','scheduler','scheduler.development.js'],
  ].map(([name,pkg,file]) => [name,fs.readFileSync(path.join(path.dirname(require.resolve(`${pkg}/package.json`)),'cjs',file),'utf8')]));
  clientModules['profile-form'] = ts.transpileModule(fs.readFileSync('src/components/profile-edit-form.tsx','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const profileClient = `(() => {
    const sources = ${JSON.stringify(clientModules)}, cache = {}, process = {env:{NODE_ENV:'development'}};
    const mocks = {
      'next/navigation': {useRouter:()=>({refresh:()=>{}})},
      'lucide-react': {Camera:()=>null},
      '@/lib/business-logic': {getDefaultAvatarUrl:()=>'/mb-logo.png'},
      '@/lib/supabase/client': {createSupabaseBrowserClient:()=>{throw Error('Unexpected storage access')}},
      '@/app/actions': {updateMyProfile:async data => {window.__profilePayload = Object.fromEntries(data); return {ok:true,message:'Profile updated.'}}},
    };
    function require(name) {
      if(mocks[name]) return mocks[name];
      if(cache[name]) return cache[name].exports;
      const module = cache[name] = {exports:{}};
      new Function('module','exports','require','process',sources[name])(module,module.exports,require,process);
      return module.exports;
    }
    const container = document.querySelector('.account-booking-form'); container.innerHTML = '';
    require('react-dom/client').createRoot(container).render(require('react').createElement(require('profile-form').ProfileEditForm,{profile:${JSON.stringify(profile)}}));
  })();`;
  for(const route of Object.keys(pages)) for(const [name,width,height] of [['desktop',1672,941],['mobile',390,844]]){
    const page=await browser.newPage({viewport:{width,height}});
    await page.goto('http://127.0.0.1:3107'+route);await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:'.impeccable/review/'+(route==='/'?'':route.slice(1)+'-')+name+'.png',fullPage:true});
    const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,portrait:[...document.querySelectorAll('img')].every(img=>img.complete),heading:document.querySelector('h1,h2')?.textContent ?? 'Booking review'}));
    if(metrics.overflow||!metrics.portrait)throw Error(JSON.stringify(metrics));
    console.log(route,name,metrics);
    if(route === '/profile' && name === 'mobile') {
      await page.addScriptTag({content:profileClient});
      await page.getByLabel('Full name').fill('Edited name');
      await page.getByLabel('Phone number').fill('9495557890');
      await page.getByRole('button',{name:'Reset changes'}).click();
      assert.equal(await page.getByLabel('Full name').inputValue(), profile.full_name);
      assert.equal(await page.getByLabel('Phone number').inputValue(), profile.phone);
      await page.getByLabel('Full name').fill('Edited name');
      await page.getByRole('button',{name:'Save changes'}).click();
      await page.getByRole('status').waitFor();
      assert.deepEqual(await page.evaluate(()=>window.__profilePayload), {fullName:'Edited name',phone:profile.phone,avatarUrl:profile.avatar_url});
      assert.ok(await page.getByLabel('Full name').isVisible());
      await page.locator('input[type=file]').setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('invalid')});
      await page.getByRole('alert').waitFor();
      assert.ok((await page.getByRole('alert').innerText()).includes('Upload a JPG'));
      console.log('PASS: profile immediately editable, reset, save payload, stays editable after save, and upload type validation. Backend mocked; no real profile updated.');
    }
    await page.close();
  }
  await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exitCode=1});




