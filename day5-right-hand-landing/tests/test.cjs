const { chromium } = require('playwright');
const path = require('path');
const {execFileSync}=require('child_process');const fontCache={};
function gfetch(u){for(let i=0;i<5&&!(fontCache[u]&&fontCache[u].length>1000);i++){try{fontCache[u]=execFileSync('curl',['-s','--max-time','60',u])}catch(e){}}return fontCache[u]}
const FILE = 'file://' + path.resolve('out/landing-page.html');
// the container cannot reach the photo hosts, so stand-in images keep crops and layout realistic
function ph(url){
  let label='PHOTO', w=720, h=450, c1='#6b7a99', c2='#2b3552';
  if(url.includes('kasim-headshot')){label='KASIM';w=1000;h=1000;c1='#8a9a5b';c2='#3d4a2a'}
  else if(url.includes('filesafe')){label='KASIM + IVAN';w=900;h=1410;c1='#9aa0a8';c2='#3a3f47'}
  else if(url.match(/justin|polish|roman/)){label='';w=400;h=400;c1='#c9a27e';c2='#6d4c35'}
  else if(url.includes('unsplash')){label='STOCK';c1='#b7a58c';c2='#4b4032'}
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${w/2}" cy="${h*0.34}" r="${Math.min(w,h)*0.16}" fill="rgba(255,255,255,.25)"/><text x="50%" y="88%" font-family="sans-serif" font-size="${Math.min(w,h)*0.07}" fill="rgba(255,255,255,.7)" text-anchor="middle">${label}</text></svg>`;
}
(async()=>{
  const browser = await chromium.launch({proxy:{server:process.env.HTTPS_PROXY||process.env.https_proxy}});
  const results = {};
  const widths = [[1440,900],[1600,900],[1280,800],[1024,768],[768,1024],[390,844],[360,740]];
  for (const [w,h] of widths){
    for (const motion of (w===1440||w===390)?['no-preference','reduce']:['no-preference']){
      const ctx = await browser.newContext({viewport:{width:w,height:h}, reducedMotion:motion, deviceScaleFactor: w<500?2:1, ignoreHTTPSErrors:true});
      const page = await ctx.newPage();
      const errs=[]; page.on('pageerror',e=>errs.push(String(e))); page.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load resource/.test(m.text()))errs.push(m.text())});
      await page.route(/paretotalent\.com|filesafe\.space|unsplash\.com/, r=>r.fulfill({status:200,contentType:'image/svg+xml',body:ph(r.request().url())}));
      await page.route(/fonts\.gstatic\.com/, r=>r.fulfill({status:200,contentType:'font/woff2',headers:{'access-control-allow-origin':'*'},body:gfetch(r.request().url())}));
      await page.goto(FILE,{waitUntil:'networkidle'});
      await page.waitForTimeout(2600);
      const key=`${w}${motion==='reduce'?'-rm':''}`;
      const r = {errors:errs, fonts: await page.evaluate(async()=>{await document.fonts.ready;return [[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family+' '+f.style).join(', ')]}), heroCTA: await page.evaluate(()=>{const b=document.querySelector('.cta-row .btn').getBoundingClientRect();return Math.round(b.bottom)+'/'+innerHeight})};
      // horizontal overflow across the whole page at several scroll depths
      r.overflow = await page.evaluate(async()=>{const out=[];const H=document.documentElement.scrollHeight;for(let y=0;y<H;y+=innerHeight*0.8){scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,40));out.push(document.documentElement.scrollWidth-document.documentElement.clientWidth)}scrollTo({top:0,behavior:'instant'});return Math.max(...out)});
      // widest offender if any
      if(r.overflow>0) r.offenders = await page.evaluate(()=>[...document.querySelectorAll('#rh *')].filter(e=>{const b=e.getBoundingClientRect();return b.right>document.documentElement.clientWidth+1&&!e.closest('.wall')&&getComputedStyle(e).position!=='fixed'}).slice(0,6).map(e=>e.className+' '+Math.round(e.getBoundingClientRect().right)));
      // calculator
      r.calc = await page.evaluate(()=>{const s=document.getElementById('rh-rate');const f=v=>{s.value=v;s.dispatchEvent(new Event('input'));return [document.getElementById('rh-verdict').textContent, document.getElementById('rh-mult').textContent]};return {250:f(250),50:f(50),75:f(75),1000:f(1000)}});
      await page.waitForTimeout(900);
      r.calcVal = await page.evaluate(()=>[document.getElementById('rh-rate-out').textContent,document.getElementById('rh-val').textContent]);
      await page.evaluate(()=>{const s=document.getElementById('rh-rate');s.value=250;s.dispatchEvent(new Event('input'))});
      // mobile bar states
      if(w<=640){
        r.mbar = await page.evaluate(async()=>{const m=document.getElementById('rh-mbar');const st=[];const at=async y=>{scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,500));st.push(m.classList.contains('on'))};await at(0);await at(document.getElementById('rh-math').offsetTop);const f=document.getElementById('rh-final');await at(f.getBoundingClientRect().top+scrollY);scrollTo({top:0,behavior:'instant'});return st});
      }
      // screenshots at section anchors
      const stops = {hero:'#rh-top',proof:'.proof',problem:'.problem',math:'#rh-math',wall:'#rh-wall',calc:'#rh-inst',how:'#rh-how',ivan:'#rh-ivan',offer:'.offer',guar:'#rh-guar',faq:'.faq',final:'#rh-final'};
      const pick = (w===1440&&motion!=='reduce')?Object.keys(stops):(w===390&&motion!=='reduce')?['hero','proof','problem','wall','calc','how','ivan','offer','guar','final']:(w===360||w===768||w===1024)?['hero','calc']:[];
      for (const k of pick){
        await page.evaluate(sel=>{const el=document.querySelector(sel);const top=el.getBoundingClientRect().top+scrollY;scrollTo({top:sel==='#rh-top'?0:Math.max(0,top-(sel==='#rh-inst'?innerHeight*0.12:60)),behavior:'instant'})},stops[k]);
        await page.waitForTimeout(k==='hero'?300:700);
        await page.screenshot({path:`shots/${w}-${k}.png`});
      }
      results[key]=r; await ctx.close();
    }
  }
  console.log(JSON.stringify(results,null,1));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
