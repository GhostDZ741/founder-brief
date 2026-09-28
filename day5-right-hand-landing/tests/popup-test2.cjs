const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const FILE='file://'+path.resolve('out/_popup-test.html');
const map={};fs.readFileSync('fontmap.txt','utf8').trim().split('\n').forEach(l=>{const [u,f]=l.split(' ');map[u]=f});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const b=await chromium.launch({proxy:{server:process.env.HTTPS_PROXY}});const out={};const errs=[];
  let cur=null;
  async function fresh(mobile){
    if(cur)await cur.close();
    const c=await b.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,ignoreHTTPSErrors:true}:{viewport:{width:1440,height:900},ignoreHTTPSErrors:true});
    cur=c;const p=await c.newPage();p.on('pageerror',e=>errs.push(String(e)));
    await p.route(/paretotalent|filesafe|unsplash/,r=>r.abort());
    await p.route(/fonts\.gstatic/,r=>{const f=map[r.request().url()];f?r.fulfill({status:200,contentType:'font/woff2',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(f)}):r.abort()});
    await p.clock.install();await p.goto(FILE,{waitUntil:'networkidle'});await sleep(200);return p}
  const isOpen=p=>p.evaluate(()=>document.getElementById('rh-exit-dlg').open);
  const exitIntent=p=>p.evaluate(()=>document.dispatchEvent(new MouseEvent('mouseout',{clientY:-2,relatedTarget:null,bubbles:true})));
  const to=async(p,y)=>{await p.evaluate(y=>new Promise(res=>{if(Math.abs(scrollY-y)<1)return res();const done=()=>{removeEventListener('scroll',done);res()};addEventListener('scroll',done);scrollTo({top:y,behavior:'instant'});setTimeout(res,1000)}),y);await sleep(30)};
  const bottom=p=>p.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
  // ---------- desktop ----------
  let p=await fresh(false);
  await exitIntent(p); await p.clock.fastForward(9000); out.d_earlyExitNotHeldOver=!(await isOpen(p));
  await exitIntent(p); out.d_exitAfter8s=await isOpen(p);
  p=await fresh(false);
  await to(p,await bottom(p)); await p.clock.fastForward(1500); out.d_endBefore8s_waits=!(await isOpen(p));
  await p.clock.fastForward(7000); out.d_endOpensAt8s=await isOpen(p);
  p=await fresh(false);
  await to(p,await bottom(p)); await p.clock.fastForward(1500); await to(p,0); await p.clock.fastForward(8000); out.d_skimThenBackUp_standsDown=!(await isOpen(p));
  await to(p,await bottom(p)); await p.clock.fastForward(1300); out.d_endAgainLaterOpens=await isOpen(p);
  p=await fresh(false);
  await p.evaluate(()=>{const a=document.querySelector('.hero .btn');a.addEventListener('click',e=>e.preventDefault());a.click()});
  await p.clock.fastForward(9000); await to(p,await bottom(p)); await p.clock.fastForward(1500); out.d_noPopupAfterCTA=!(await isOpen(p));
  p=await fresh(false);
  await p.evaluate(()=>{const s=document.getElementById('rh-rate');s.value=50;s.dispatchEvent(new Event('input'))});
  await p.clock.fastForward(9000); await to(p,await bottom(p)); await p.clock.fastForward(1500); out.d_noPopupBelow75=!(await isOpen(p));
  // ---------- phone ----------
  p=await fresh(true);
  await p.clock.fastForward(9000); await to(p,await bottom(p)); await p.clock.fastForward(1300);
  out.m_endOpens=await isOpen(p); await sleep(700);
  out.m_isBottomSheet=await p.evaluate(()=>{const r=document.getElementById('rh-exit-dlg').getBoundingClientRect();return Math.abs(r.bottom-innerHeight)<2&&Math.abs(r.width-innerWidth)<2});
  out.m_scrollLocked=await p.evaluate(()=>getComputedStyle(document.documentElement).overflow==='hidden');
  await p.screenshot({path:'shots/popup-phone.png'});
  await p.keyboard.press('Escape'); await sleep(150); out.m_unlockOnClose=await p.evaluate(()=>document.documentElement.style.overflow==='');
  p=await fresh(true);
  await p.evaluate(()=>{const s=document.getElementById('rh-rate');s.value=500;s.dispatchEvent(new Event('input'))});
  await p.clock.fastForward(9000);
  let H=await bottom(p),deep=Math.round(H*.8);
  await to(p,deep); for(const d of [200,450,650]){await p.clock.fastForward(100);await to(p,deep-d)}
  out.m_fastFlickUpOpens=await isOpen(p); out.m_personalLine=await p.evaluate(()=>!document.getElementById('rh-exit-wait').hidden&&document.getElementById('rh-exit-wv').textContent);
  p=await fresh(true); await p.clock.fastForward(9000); H=await bottom(p); deep=Math.round(H*.8);
  await to(p,deep); for(let d=100;d<=800;d+=100){await p.clock.fastForward(400);await to(p,deep-d)}
  out.m_slowScrollUpNoPopup=!(await isOpen(p));
  p=await fresh(true); await p.clock.fastForward(9000); H=await bottom(p); const shallow=Math.round(H*.3);
  await to(p,shallow); for(const d of [200,450,650]){await p.clock.fastForward(100);await to(p,Math.max(0,shallow-d))}
  out.m_flickBeforeReadingNoPopup=!(await isOpen(p));
  p=await fresh(true); await p.clock.fastForward(9000); H=await bottom(p);
  await to(p,Math.round(H*.8)); await p.evaluate(()=>document.querySelector('#rh .logo').click()); await sleep(1500);
  out.m_logoTapNoPopup=!(await isOpen(p)) && (await p.evaluate(()=>scrollY))<200;
  out.errors=errs.length;
  console.log(JSON.stringify(out,null,1)); await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
