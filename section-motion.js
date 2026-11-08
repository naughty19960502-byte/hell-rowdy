import {bindChaosBackground} from './chaos-background.js?v=63';
import {bindEdgeDisintegration} from './ring-disintegration.js';
const scenes={about:'https://hiroshimakrumpmakyo.yoko2528.chatgpt.site/assets/about-burning-scene.webp',culture:'https://hiroshimakrumpmakyo.yoko2528.chatgpt.site/assets/culture-header-scene.webp',member:'https://hiroshimakrumpmakyo.yoko2528.chatgpt.site/assets/member-header-scene-v2.webp',page:'https://hiroshimakrumpmakyo.yoko2528.chatgpt.site/assets/page-header-scene.webp',philosophy:'https://hiroshimakrumpmakyo.yoko2528.chatgpt.site/assets/philosophy-moon-header-v1.png'};
export function sectionHeaderMarkup(route,title,subtitle){
  const art=scenes[route];
  const heading=route==='philosophy'?`<img class="philosophy-title-art" src="https://hiroshimakrumpmakyo.yoko2528.chatgpt.site/assets/philosophy-title-v1.png" alt="${title}" width="2187" height="719">`:`<img class="section-title-art" src="https://hiroshimakrumpmakyo.yoko2528.chatgpt.site/assets/${route}-header-title${route==='page'?'-v2':''}.webp" alt="${title}" width="2172" height="724">`;
  const mist=route==='philosophy'?'<i class="moon-corona-pulse" aria-hidden="true"></i><i class="moon-cloud moon-cloud-a" aria-hidden="true"></i><i class="moon-cloud moon-cloud-b" aria-hidden="true"></i><i class="philosophy-weather philosophy-weather-back" aria-hidden="true"></i><i class="philosophy-weather philosophy-weather-front" aria-hidden="true"></i>':route!=='about'?'<div class="section-mist-layer section-clouds" aria-hidden="true"></div><div class="section-mist-layer section-ground-fog" aria-hidden="true"></div><div class="section-sky-lightning" aria-hidden="true"></div>':'';
  return `<div class="section-hero animated-section ${route}-scene" style="--section-art:url('${art}')"><div class="section-background" aria-hidden="true"><canvas class="chaos-background-canvas" data-art="${art}" data-strength="0" data-effect="${route==='philosophy'?'lunar':route==='about'?'fire':'mist'}"></canvas></div>${mist}<canvas class="section-atmosphere" aria-hidden="true"></canvas><div class="section-heading"><h1>${heading}</h1><p>${subtitle}</p></div>${route==='page'?'<canvas class="page-title-fragments" aria-hidden="true"></canvas>':''}</div>`;
}
export function bindSectionHeader(header,reduced){
  if(!header)return ()=>{};
  const stopBackground=bindChaosBackground(header,reduced),canvas=header.querySelector('.section-atmosphere'),ctx=canvas.getContext('2d');
  let disposed=false,visible=true,frame=0,last=0,time=0,w=1,h=1,dpr=1,px=0,py=0;
  const storm=['culture-scene','member-scene','page-scene'].some(scene=>header.classList.contains(scene));
  const lunar=header.classList.contains('philosophy-scene');
  const title=header.classList.contains('page-scene')?header.querySelector('.section-title-art'):null;
  const stopFracture=title?bindEdgeDisintegration(header,reduced,{canvasSelector:'.page-title-fragments',imageSelector:'.section-title-art',readyClass:'page-fracture-ready'}):()=>{};
  let nextLightning=2.8,lightningStart=-10,lightningX=.65,strike=0;
  const particles=Array.from({length:lunar?0:96},(_,i)=>({x:((i*73)%97)/97,y:((i*31)%101)/101,size:.6+(i%4)*.4,speed:.03+(i%7)*.006}));
  function resize(){w=header.clientWidth;h=header.clientHeight;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  function render(now){
    frame=0;if(disposed||!visible||document.hidden||reduced.matches)return;
    time+=Math.min(last?now-last:16.7,50)/1000;last=now;
    const scroll=Math.max(-1,Math.min(1,-header.getBoundingClientRect().top/innerHeight));
    header.style.setProperty('--sx',`${px*6}px`);header.style.setProperty('--sy',`${py*4-scroll*8}px`);
    if(storm){
      if(time>=nextLightning){lightningStart=time;strike++;lightningX=.25+(strike*37%55)/100;nextLightning=time+8+(strike*7%9);}
      const age=time-lightningStart;
      header.style.setProperty('--lightning',age>=0&&age<.8?String(Math.exp(-age*7)*.85):'0');
      header.style.setProperty('--lightning-x',`${lightningX*100}%`);
    }
    if(ctx){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
      for(const p of particles){
        const life=(p.y+time*p.speed*(storm?1:1.5))%1,x=(storm?p.x:lunar?(p.x<.5?p.x*.34:.67+p.x*.33):.28+p.x*.72)*w+Math.sin(time*.4+p.x*12+life*3)*12,y=(1-life)*h;
        ctx.globalAlpha=Math.sin(life*Math.PI)*(lunar?.18:.62);
        ctx.fillStyle=lunar?'#dba49d':p.size>1.5?'#b5aba3':storm?'#cf364b':'#e13d26';
        ctx.fillRect(x,y,p.size,p.size*(storm?1:1.8));
      }
      ctx.globalAlpha=1;
    }
    frame=requestAnimationFrame(render);
  }
  function resume(){cancelAnimationFrame(frame);frame=0;last=0;if(disposed)return;header.style.setProperty('--lightning','0');header.classList.toggle('atmosphere-paused',!visible||document.hidden||reduced.matches);if(reduced.matches){ctx?.clearRect(0,0,canvas.width,canvas.height);header.style.setProperty('--sx','0px');header.style.setProperty('--sy','0px');return;}if(visible&&!document.hidden)frame=requestAnimationFrame(render);}
  function pointer(e){const r=header.getBoundingClientRect();px=(e.clientX-r.left)/r.width-.5;py=(e.clientY-r.top)/r.height-.5;}
  function reset(){px=py=0;}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();});observer.observe(header);
  const sizes=new ResizeObserver(resize);sizes.observe(header);
  header.addEventListener('pointermove',pointer,{passive:true});header.addEventListener('pointerleave',reset);document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);
  resize();resume();
  return ()=>{disposed=true;stopFracture();stopBackground();cancelAnimationFrame(frame);observer.disconnect();sizes.disconnect();header.removeEventListener('pointermove',pointer);header.removeEventListener('pointerleave',reset);document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);};
}
