// Shards sample the original ring artwork and depart from its jagged cut edge.
export function bindEdgeDisintegration(header,reduced,{canvasSelector,imageSelector,readyClass='history-fracture-ready'}={}){
  const canvas=header.querySelector(canvasSelector),image=header.querySelector(imageSelector);
  if(!canvas||!image)return ()=>{};
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)return ()=>{};
  let disposed=false,ready=false,visible=true,frame=0,last=0,time=0,dpr=1,quality=1,slow=0;
  let w=1,h=1,particles=[];
  let seed=83;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const edges=Array.from({length:49},()=>.19+random()*.095);
  const edge=v=>edges[Math.min(48,Math.floor(v*48))];
  function prepare(){
    if(disposed||ready||!image.naturalWidth)return;
    try{
      const sample=document.createElement('canvas');sample.width=sample.height=256;
      const s=sample.getContext('2d',{willReadFrequently:true});s.drawImage(image,0,0,256,256);
      const pixels=s.getImageData(0,0,256,256).data;
      // Bright opaque pixels give each chip the ring's red/charcoal/silver palette.
      for(let attempt=0;attempt<24000&&particles.length<420;attempt++){
        const v=.06+random()*.88,u=edge(v)-.025-random()*.075;
        const i=(Math.floor(v*256)*256+Math.floor(u*256))*4;
        if(pixels[i+3]<130||Math.max(pixels[i],pixels[i+1],pixels[i+2])<45)continue;
        particles.push({u,v,phase:random(),speed:.105+random()*.065,
          drift:38+random()*100,lift:18+random()*70,sway:random()*18,
          size:4+random()*9,angle:random()*6.28,spin:random()*5-2.5,
          crop:16+random()*30,color:`rgb(${pixels[i]},${pixels[i+1]},${pixels[i+2]})`,dust:particles.length>=150});
      }
      if(particles.length<30)return;
      ready=true;header.classList.add(readyClass);canvas.style.opacity='1';image.style.visibility='hidden';resize();resume();
    }catch{ /* Preserve the full image if sampling is unavailable. */ }
  }
  function resize(){
    if(disposed)return;
    w=header.clientWidth;h=header.clientHeight;dpr=Math.min(devicePixelRatio||1,1.5)*quality;
    canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));
    if(ready)draw();
  }
  function draw(){
    if(!ready||disposed)return;
    const box=header.getBoundingClientRect(),r=image.getBoundingClientRect();
    const x=r.left-box.left,y=r.top-box.top,width=r.width,height=r.height;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    // Keep the complete right side; the stepped left contour exposes broken edges.
    ctx.save();ctx.beginPath();ctx.moveTo(x+edge(0)*width,y);
    for(let row=1;row<=48;row++){
      const v=row/48;ctx.lineTo(x+edge((row-1)/48)*width,y+v*height);ctx.lineTo(x+edge(v)*width,y+v*height);
    }
    ctx.lineTo(x+width,y+height);ctx.lineTo(x+width,y);ctx.closePath();ctx.clip();
    ctx.drawImage(image,x,y,width,height);ctx.restore();
    const limit=Math.floor(particles.length*quality);
    for(let i=0;i<limit;i++){
      const p=particles[i],age=(p.phase+time*p.speed)%1;
      const ax=x+p.u*width-p.drift*age-age*age*24;
      const ay=y+p.v*height-p.lift*age+Math.sin(age*5+p.angle)*p.sway*age;
      const scale=Math.min(width,height)/270,sz=(p.dust?1.6:p.size)*scale*Math.pow(1-age,1.25)+.35;
      ctx.globalAlpha=(1-Math.pow(age,2))*(p.dust?.6:.95);
      if(p.dust){
        ctx.fillStyle=p.color;ctx.fillRect(ax,ay,sz,sz);continue;
      }
      // Triangular chips carry actual image pixels; they shrink into the dust trail.
      ctx.save();ctx.translate(ax,ay);ctx.rotate(p.angle+age*p.spin);
      ctx.beginPath();ctx.moveTo(-sz*.6,-sz*.5);ctx.lineTo(sz*.55,-sz*.3);ctx.lineTo(sz*.2,sz*.65);ctx.closePath();ctx.clip();
      const cropX=p.u*image.naturalWidth-p.crop/2,cropY=p.v*image.naturalHeight-p.crop/2;
      ctx.drawImage(image,cropX,cropY,p.crop,p.crop,-sz*.6,-sz*.5,sz*1.2,sz*1.2);
      ctx.restore();
    }
    ctx.globalAlpha=1;
  }
  function render(now){
    frame=0;if(disposed||!ready||!visible||document.hidden||reduced.matches)return;
    const dt=last?now-last:16.7;last=now;time+=Math.min(dt,50)/1000;
    slow=dt>38?slow+1:Math.max(0,slow-1);
    if(slow>45&&quality===1){quality=.7;resize();}
    draw();frame=requestAnimationFrame(render);
  }
  function resume(){
    cancelAnimationFrame(frame);frame=0;last=0;
    if(disposed||!ready)return;
    if(reduced.matches){draw();return;}
    if(visible&&!document.hidden)frame=requestAnimationFrame(render);
  }
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();});observer.observe(header);
  const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(header);
  image.addEventListener('load',prepare);document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);
  resize();prepare();
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();sizeObserver.disconnect();image.removeEventListener('load',prepare);document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);header.classList.remove(readyClass);image.style.visibility='';ctx.clearRect(0,0,canvas.width,canvas.height);canvas.style.opacity='0';};
}

export function bindRingDisintegration(header,reduced){
  return bindEdgeDisintegration(header,reduced,{canvasSelector:'.vortex-canvas',imageSelector:'.history-ring'});
}
