// Perspective-projected particles: one GPU draw call, no remote dependencies.
const vertex = `
attribute vec4 a_seed;
uniform float u_time, u_progress, u_aspect, u_dpr, u_header;
uniform vec2 u_pointer;
varying mediump vec3 v_color;
varying mediump float v_alpha, v_smoke, v_angle;
void main(){
  float depth=fract(a_seed.y-u_time*.048-u_progress*.48);
  float z=.65+depth*8.5;
  float perspective=1.45/z;
  float angle=a_seed.x*.24+floor(a_seed.z*3.)*2.0944+u_time*.3+depth*6.5+u_progress*.7;
  float radius=mix(2.1,1.3,u_header)+a_seed.z*.8+.18*sin(angle*3.+u_time*.3);
  vec2 orbit=vec2(cos(angle),sin(angle))*radius*perspective;
  orbit.x/=u_aspect;
  orbit+=vec2(-u_pointer.x*.06,.32+u_pointer.y*.04)*(1.-depth);
  orbit+=vec2(.58,-.2)*u_header;
  gl_Position=vec4(orbit,0.,1.);
  v_smoke=step(.93,a_seed.w);
  float size=mix(5.+a_seed.w*11.,90.+a_seed.z*65.,v_smoke);
  gl_PointSize=clamp(size*perspective*u_dpr,1.,110.*u_dpr);
  float fade=smoothstep(0.,.045,depth)*(1.-smoothstep(.88,1.,depth));
  v_alpha=fade*mix(.85,.22,v_smoke);
  v_color=mix(vec3(1.,.13,.2),vec3(.40,.22,.58),step(.55,a_seed.z));
  v_color=mix(v_color,vec3(.68,.65,.62),step(.83,a_seed.z));
  v_angle=angle;
}`;
const fragment = `
precision mediump float;
varying mediump vec3 v_color;
varying mediump float v_alpha, v_smoke, v_angle;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){
  vec2 p=gl_PointCoord-.5;
  float d=length(p)*2.;
  if(d>1.)discard;
  float alpha;
  if(v_smoke>.5){
    float n=noise(p*8.)*.65+noise(p*17.)*.35;
    alpha=pow(1.-d,1.7)*n*v_alpha;
  }else{
    float c=cos(v_angle),s=sin(v_angle);
    vec2 q=mat2(c,-s,s,c)*p;
    float ember=exp(-dot(q*vec2(1.,2.),q*vec2(1.,2.))*3.);
    alpha=ember*v_alpha;
  }
  gl_FragColor=vec4(v_color*alpha,alpha);
}`;

export function bindParticleVortex(hero,reduced,header=false){
  const canvas=hero.querySelector('.vortex-canvas');
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,
    premultipliedAlpha:true,powerPreference:'low-power'});
  if(!gl)return ()=>{}; // Existing smoke remains a graceful static fallback.
  let program,buffer,shaders=[],disposed=false,lost=false,frame=0;
  let restarted=null;
  let visible=true,clock=0,last=0,progress=0,target=0,px=0,py=0,quality=1,slow=0;
  const count=header?1400:(innerWidth<700?4200:7200);
  function compile(type,source){
    const shader=gl.createShader(type);shaders.push(shader);
    gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Particle shader');
    return shader;
  }
  try{
    program=gl.createProgram();
    gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Particle program');
  }catch{
    shaders.forEach(s=>gl.deleteShader(s));if(program)gl.deleteProgram(program);
    return ()=>{};
  }
  gl.useProgram(program);
  let seed=37;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const data=new Float32Array(count*4);
  for(let i=0;i<count;i++)data.set([random()*Math.PI*2,random(),random(),random()],i*4);
  buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  const attribute=gl.getAttribLocation(program,'a_seed');
  gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,4,gl.FLOAT,false,0,0);
  const uniforms=Object.fromEntries(['time','progress','aspect','dpr','pointer','header'].map(n=>[n,gl.getUniformLocation(program,'u_'+n)]));
  gl.uniform1f(uniforms.header,header?1:0);
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.clearColor(0,0,0,0);
  function resize(){
    if(disposed||lost)return;
    const w=hero.clientWidth,h=hero.clientHeight,dpr=Math.min(devicePixelRatio||1,1.5)*quality;
    canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform1f(uniforms.aspect,w/Math.max(1,h));gl.uniform1f(uniforms.dpr,dpr);
  }
  function render(now){
    frame=0;if(disposed||lost||document.hidden||!visible||reduced.matches)return;
    const elapsed=last?now-last:16.7;last=now;
    clock+=Math.min(elapsed,50)/1000;progress+=(target-progress)*.08;
    if(elapsed>38)slow++;else slow=Math.max(0,slow-1);
    if(slow>45&&quality===1){quality=.7;resize();}
    gl.uniform1f(uniforms.time,clock);gl.uniform1f(uniforms.progress,progress);
    gl.uniform2f(uniforms.pointer,px,py);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS,0,Math.floor(count*(quality===1?1:.6)));
    frame=requestAnimationFrame(render);
  }
  function resume(){
    cancelAnimationFrame(frame);frame=0;last=0;
    if(disposed||lost)return;
    if(reduced.matches){gl.clear(gl.COLOR_BUFFER_BIT);return;}
    if(visible&&!document.hidden)frame=requestAnimationFrame(render);
  }
  function scroll(){const r=hero.getBoundingClientRect();target=Math.max(0,Math.min(1,-r.top/Math.max(1,r.height*.8)));}
  function pointer(e){const r=hero.getBoundingClientRect();px=(e.clientX-r.left)/r.width*2-1;py=(e.clientY-r.top)/r.height*2-1;}
  function reset(){px=py=0;}
  function contextLost(e){e.preventDefault();lost=true;cancelAnimationFrame(frame);canvas.style.opacity='0';}
  function contextRestored(){if(disposed)return;cleanup();restarted=bindParticleVortex(hero,reduced,header);}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();});observer.observe(hero);
  const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(hero);
  window.addEventListener('scroll',scroll,{passive:true});
  hero.addEventListener('pointermove',pointer,{passive:true});hero.addEventListener('pointerleave',reset);
  document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);
  canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('webglcontextrestored',contextRestored);
  resize();scroll();canvas.style.opacity='1';resume();
  function cleanup(){
    disposed=true;cancelAnimationFrame(frame);observer.disconnect();sizeObserver.disconnect();
    window.removeEventListener('scroll',scroll);hero.removeEventListener('pointermove',pointer);hero.removeEventListener('pointerleave',reset);
    document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);
    canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',contextRestored);
    if(!lost){gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));}
  }
  return ()=>{cleanup();restarted?.();};
}
