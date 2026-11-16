(() => {
 const root = document.documentElement;
 const theme = document.getElementById('theme-toggle');
 const motion = document.getElementById('motion-toggle');
 const media = matchMedia('(prefers-reduced-motion: reduce)');
 let paused = media.matches;
 const save = (key,value) => { try { localStorage.setItem(key,value); } catch {} };
 const syncTheme = () => { const dark = root.dataset.theme === 'dark'; theme.textContent = dark ? '☀ Light' : '☾ Dark'; theme.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme'); theme.setAttribute('aria-pressed',String(dark)); document.querySelector('meta[name="theme-color"]').content = dark ? '#101423' : '#f7f8fc'; };
 theme.addEventListener('click',() => { root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; save('profile-theme',root.dataset.theme); syncTheme(); }); syncTheme();
 const syncMotion = () => { root.dataset.motion = paused ? 'off' : 'on'; motion.textContent = paused ? 'Play motion' : 'Pause motion'; motion.setAttribute('aria-pressed',String(paused)); motion.setAttribute('aria-label',paused ? 'Enable animations' : 'Pause animations'); };
 motion.addEventListener('click',() => { paused = !paused; syncMotion(); }); media.addEventListener('change',e => { paused=e.matches;syncMotion(); });syncMotion();
 const progress = document.querySelector('.read-progress'); let ticking=false;
 const update = () => { const max=root.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?scrollY/max:0})`;ticking=false; };
 addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}},{passive:true});addEventListener('resize',update);update();
 const button=document.getElementById('deploy-demo'); const status=document.getElementById('deploy-status');const steps=[...document.querySelectorAll('.deploy-step')];
 const messages=['Building a reproducible artifact…','Checking dependencies and security policy…','Promoting the release…','Watching signals after deployment…'];
 let run=0;
 button.addEventListener('click', async () => {
  const current=++run;button.disabled=true;steps.forEach(s=>s.className='deploy-step');
  for(let i=0;i<steps.length;i++){
   steps[i].classList.add('active');status.textContent=messages[i];
   if(!paused)await new Promise(resolve=>setTimeout(resolve,650));
   if(current!==run)return;
   steps[i].classList.replace('active','done');
  }
  status.textContent='Shipped! A little demo of how I think about delivery.';button.textContent='↻ Ship it again';button.disabled=false;
  if(!paused){const panel=button.closest('.play-panel');panel.style.position='relative';for(let i=0;i<18;i++){const p=document.createElement('i');p.className='confetti';p.setAttribute('aria-hidden','true');p.style.cssText=`left:80%;top:20px;--dx:${Math.random()*230-160}px;--dy:${Math.random()*140-90}px`;panel.append(p);p.addEventListener('animationend',()=>p.remove(),{once:true});setTimeout(()=>p.remove(),1100);}}
 });
})();
