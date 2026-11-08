import {bindParticleVortex} from './particle-vortex.js';
import {bindRingDisintegration} from './ring-disintegration.js';
import {bindChaosBackground} from './chaos-background.js';
const art=(file,cls='')=>`<img src="https://hiroshimakrumpmakyo.yoko2528.chatgpt.site/assets/${file}.webp" class="${cls}" alt="">`;
const layer=(name,content)=>`<div class="depth-layer depth-${name}" data-depth="${name}">${content}</div>`;

function smokeMarkup(){
  return '<div class="infernal-smoke">'+Array.from({length:8},(_,i)=>`<span class="smoke-plume" style="--left:${-18+i*17}%;--drift:${i%2?-65:65}px;--duration:${18+i%4*2}s;--delay:${-i*2.7}s;--veil:${i%3===0?'74,55,82':i%3===1?'100,38,46':'99,94,105'}"></span>`).join('')+'</div>';
}
export function sceneMarkup(){
  return `<div class="hero-space" aria-hidden="true">${layer('landscape','<div class="hero-background"><i class="eclipse-bloom"></i><i class="rift-pulse"></i><i class="world-vignette"></i></div>')}${layer('background-fog','<div class="fog-art"></div><i class="cloud-veil cloud-veil-a"></i><i class="cloud-veil cloud-veil-b"></i><i class="ash-sweep"></i>')}${layer('foreground-smoke','<div class="smoke-art"></div><i class="rift-haze"></i>'+smokeMarkup())}${layer('foreground-rocks','<div class="obsidian-shards"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="embers"></div>')}<canvas class="vortex-canvas" aria-hidden="true"></canvas></div><div class="hero-blackout" aria-hidden="true"></div>`;
}
export function logoMarkup(){return `<div class="hero-logo-slot">${layer('logo',`<div class="logo-float"><img src="https://hiroshimakrumpmakyo.yoko2528.chatgpt.site/assets/makyo-emblem-v4.png?v=55" class="hero-logo hero-logo-v3" alt="魔境 MAKYO"></div>`)}</div>`;}
const clamp=n=>Math.max(0,Math.min(1,n));
const stage=(p,start,end)=>{const v=clamp((p-start)/(end-start));return v*v*(3-2*v);};
const configs={landscape:[1,1], 'background-fog':[-2,2],ring03:[-2,-2],ring02:[4,-4],ring01:[3,3],logo:[1.5,-1.5],'foreground-smoke':[-15,15],'foreground-rocks':[22,-22]};
export function bindHeroMotion(hero,reduced){
  const stopVortex=bindParticleVortex(hero,reduced);
  const layers=Object.fromEntries([...hero.querySelectorAll('[data-depth]')].map(e=>[e.dataset.depth,e]));
  const blackout=hero.querySelector('.hero-blackout'),enter=hero.querySelector('.enter');
  const rocks=[...hero.querySelectorAll('.floating-rock')];
  let x=0,y=0,p=0,tx=0,ty=0,tp=0,frame=0,last=0,journeyStart=null,timer=0,disposed=false,finishing=false,scrollRange=1;
  function measure(){scrollRange=Math.max(1,document.documentElement.scrollHeight-innerHeight);}
  function finish(){if(finishing||disposed)return;finishing=true;blackout.style.opacity='1';timer=setTimeout(()=>{if(!disposed)location.hash='history';},180);}
  function paint(){
    const ring=stage(p,0,.84),logo=stage(p,.3,.94),escape=stage(p,.22,.88),flow=stage(p,.12,.95);
    for(const [name,el] of Object.entries(layers)){
      const [ax,ay]=configs[name];let dx=x*ax,dy=y*ay,z=0,scale=1;
      if(name==='landscape'){dy-=p*18;z=-p*20;scale=1+p*.035;}
      if(name==='background-fog'){dx-=flow*20;dy-=flow*28;scale=1+flow*.09;}
      if(name.startsWith('ring')){const k={ring01:.38,ring02:.32,ring03:.26}[name];scale=1+ring*k;z=ring*35;dy-=ring*12;}
      if(name==='logo'){scale=1+logo*.025;dy-=logo*2;}
      if(name==='foreground-smoke'){dx+=flow*44;dy-=flow*48;scale=1+flow*.13;z=flow*12;}
      if(name==='foreground-rocks'){dy-=escape*15;scale=1+escape*.1;z=escape*18;}
      el.style.transform=`translate3d(${dx.toFixed(3)}px,${dy.toFixed(3)}px,${z.toFixed(3)}px) scale(${scale.toFixed(4)})`;
    }
    rocks.forEach((rock,i)=>{rock.style.transform=`translate3d(${(i?1:-1)*escape*150}px,${escape*(i?-38:30)}px,0) rotate(${i?180:-30}deg)`;});
    blackout.style.opacity=journeyStart===null?'0':String(stage(p,.79,.995));
    if(journeyStart!==null&&p>=.995&&tp===1)finish();
  }
  function tick(now){
    frame=0;if(disposed||reduced.matches||finishing)return;
    const dt=Math.min(50,last?now-last:16.67);last=now;
    if(journeyStart!==null)tp=clamp((now-journeyStart)/1800);
    const ease=1-Math.pow(.87,dt/16.67);
    const progressEase=journeyStart!==null?ease:1-Math.pow(.955,dt/16.67);
    x+=(tx-x)*ease;y+=(ty-y)*ease;p+=(tp-p)*progressEase;paint();
    if(Math.abs(tx-x)+Math.abs(ty-y)+Math.abs(tp-p)>.0005||journeyStart!==null)schedule();else last=0;
  }
  function schedule(){if(!frame&&!disposed&&!reduced.matches&&!finishing)frame=requestAnimationFrame(tick);}
  function point(cx,cy){if(journeyStart!==null)return;const r=hero.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(cx-r.left)/r.width*2-1));ty=Math.max(-1,Math.min(1,(cy-r.top)/r.height*2-1));schedule();}
  const pointer=e=>point(e.clientX,e.clientY);
  const touch=e=>{const t=e.touches[0];if(t)point(t.clientX,t.clientY);};
  const reset=()=>{tx=ty=0;schedule();};
  const scroll=()=>{if(journeyStart===null&&!finishing){tp=clamp(scrollY/scrollRange);schedule();}};
  const resize=()=>{measure();scroll();};
  const start=e=>{if(reduced.matches)return;e.preventDefault();if(journeyStart!==null||finishing)return;tx=ty=0;journeyStart=performance.now();schedule();};
  function preference(){cancelAnimationFrame(frame);frame=0;last=0;clearTimeout(timer);finishing=false;journeyStart=null;x=y=p=tx=ty=tp=0;for(const el of Object.values(layers))el.style.transform='';rocks.forEach(r=>r.style.transform='');blackout.style.opacity='0';if(!reduced.matches){scroll();schedule();}}
  hero.addEventListener('pointerdown',pointer,{passive:true});hero.addEventListener('pointermove',pointer,{passive:true});hero.addEventListener('pointerleave',reset);hero.addEventListener('pointerup',reset);
  hero.addEventListener('touchstart',touch,{passive:true});hero.addEventListener('touchmove',touch,{passive:true});hero.addEventListener('touchend',reset,{passive:true});hero.addEventListener('touchcancel',reset,{passive:true});
  window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',resize,{passive:true});enter.addEventListener('click',start);reduced.addEventListener('change',preference);
  measure();scroll();
  return ()=>{stopVortex();disposed=true;cancelAnimationFrame(frame);clearTimeout(timer);hero.removeEventListener('pointerdown',pointer);hero.removeEventListener('pointermove',pointer);hero.removeEventListener('pointerleave',reset);hero.removeEventListener('pointerup',reset);hero.removeEventListener('touchstart',touch);hero.removeEventListener('touchmove',touch);hero.removeEventListener('touchend',reset);hero.removeEventListener('touchcancel',reset);window.removeEventListener('scroll',scroll);window.removeEventListener('resize',resize);enter.removeEventListener('click',start);reduced.removeEventListener('change',preference);};
}
export function historyHeaderMarkup(subtitle){return `<div class="section-hero history-header"><div class="history-background" aria-hidden="true"><canvas class="chaos-background-canvas"></canvas></div><div class="history-ring-anchor" aria-hidden="true"><img class="history-ring" src="https://hiroshimakrumpmakyo.yoko2528.chatgpt.site/assets/history-header-ring.webp" alt="" width="1254" height="1254"></div><canvas class="vortex-canvas" aria-hidden="true"></canvas><div class="history-heading"><h1><img src="https://hiroshimakrumpmakyo.yoko2528.chatgpt.site/assets/history-header-title.webp" alt="HISTORY" width="2172" height="724"></h1><p>${subtitle}</p></div></div>`;}
export function bindHistoryHeader(header,reduced){
  if(!header)return ()=>{};
  const stopRing=bindRingDisintegration(header,reduced),stopBackground=bindChaosBackground(header,reduced);const stop=()=>{stopRing();stopBackground();};let frame=0,visible=true,x=0,y=0;
  const running=()=>header.classList.toggle('header-running',visible&&!document.hidden&&!reduced.matches);
  const paint=()=>{frame=0;const r=header.getBoundingClientRect(),s=reduced.matches?0:Math.max(-1,Math.min(1,-r.top/innerHeight));header.style.setProperty('--hx',`${reduced.matches?0:x*5}px`);header.style.setProperty('--hy',`${reduced.matches?0:y*4-s*12}px`);running();};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint);};
  const pointer=e=>{const r=header.getBoundingClientRect();x=(e.clientX-r.left)/r.width-.5;y=(e.clientY-r.top)/r.height-.5;schedule();};
  const reset=()=>{x=y=0;schedule();};
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;running();});observer.observe(header);
  header.addEventListener('pointermove',pointer,{passive:true});header.addEventListener('pointerleave',reset);window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});document.addEventListener('visibilitychange',running);reduced.addEventListener('change',schedule);paint();
  return ()=>{stop();cancelAnimationFrame(frame);observer.disconnect();header.removeEventListener('pointermove',pointer);header.removeEventListener('pointerleave',reset);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);document.removeEventListener('visibilitychange',running);reduced.removeEventListener('change',schedule);};
}
