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
  if (name === 'next/navigation') return { useRouter: () => ({}), usePathname: () => fixturePath, useSearchParams: () => new URLSearchParams() };
  if (name === '@/app/actions') return new Proxy({}, {get: () => () => {throw Error('Fixture checks must not mutate bookings');}});
  if (name === '@/lib/data') return {
    getSessionProfile: async () => ({profile}),
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
const profile = {full_name:'Mohammed',role:'customer',referral_code:'MOHAM',avatar_url:null};
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
  for (const [route,file] of [['/booking','booking'],['/bookings','bookings']]) {
    fixturePath = route;
    const Page = require(path.join(root, `src/app/${file}/page.tsx`)).default;
    pages[route] = documentFor(renderToStaticMarkup(await Page({searchParams:Promise.resolve({})})));
  }
  assert.ok(pages['/bookings'].includes('Expected cash due'));
  assert.ok(pages['/bookings'].includes('$30'));
  assert.ok(pages['/bookings'].includes('Cancel booking'));
  assert.ok(!pages['/booking'].match(/aria-label="Primary navigation"[^>]*>(.*?)<\/nav>/)?.[1].includes('>Book</a>'));
  assert.ok(pages['/booking'].includes('liquid-glass-cta'));
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
  for(const route of Object.keys(pages)) for(const [name,width,height] of [['desktop',1672,941],['mobile',390,844]]){
    const page=await browser.newPage({viewport:{width,height}});
    await page.goto('http://127.0.0.1:3107'+route);await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:'.impeccable/review/'+(route==='/'?'':route.slice(1)+'-')+name+'.png',fullPage:true});
    const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,portrait:[...document.querySelectorAll('img')].every(img=>img.complete),heading:document.querySelector('h1,h2')?.textContent ?? 'Booking review'}));
    if(metrics.overflow||!metrics.portrait)throw Error(JSON.stringify(metrics));
    console.log(route,name,metrics);
    await page.close();
  }
  await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exitCode=1});




