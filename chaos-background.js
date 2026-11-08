// Distort the existing background texture locally; no added ring or particle path.
const vertex = `
attribute vec2 a_position;
varying mediump vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}
`;
const fragment = `
precision mediump float;
uniform sampler2D u_image;
uniform float u_time,u_aspect,u_imageAspect,u_strength,u_fire,u_mist,u_lunar;
varying mediump vec2 v_uv;
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*437.585);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fog(vec2 p){return noise(p)*.57+noise(p*2.03+7.)*.28+noise(p*4.01+13.)*.15;}
void main(){
  vec2 uv=vec2(v_uv.x,1.-v_uv.y);
  vec2 center=vec2(.21,.44),p=(uv-center)*vec2(u_aspect,1.);
  float radius=length(p);
  float local=(1.-smoothstep(.34,.59,uv.x))*(1.-smoothstep(.18,.65,radius));
  local*=smoothstep(0.,.08,uv.x)*smoothstep(0.,.08,uv.y)*(1.-smoothstep(.91,1.,uv.y));
  float angle=(.5*(sin(u_time*.4-radius*8.)-sin(-radius*8.))+u_time*.2)*local*u_strength*(1.-u_fire)*(1.-u_mist);
  float c=cos(angle),s=sin(angle);
  p=mat2(c,-s,s,c)*p;
  vec2 warped=center+p/vec2(u_aspect,1.);
  float heat=u_fire*smoothstep(.35,.65,uv.x)*(1.-smoothstep(.15,.58,abs(uv.y-.53)));
  warped+=vec2(sin(uv.y*45.-u_time*3.)*.0035,sin(uv.x*54.-u_time*2.)*.0015)*heat;
  if(u_lunar>.5){
    // Advect the actual distant cloud texture with a broad, evolving flow field.
    // Leave the moon's core quiet so it never looks like a rotating flat card.
    vec2 q=uv*vec2(3.4,3.9);
    float t=u_time*.045;
    vec2 flow=vec2(fog(q+vec2(-t,t*.34)),fog(q+vec2(8.3+t*.43,-t*.71)))-.5;
    flow+=.35*vec2(fog(q*1.7+flow-t*.4),fog(q*1.5-flow+t*.6))-.175;
    float core=smoothstep(.12,.34,length((uv-vec2(.64,.29))*vec2(u_aspect,1.)));
    float edge=smoothstep(0.,.1,uv.x)*(1.-smoothstep(.9,1.,uv.x));
    float sky=1.-smoothstep(.65,.98,uv.y);
    warped+=flow*vec2(.065,.048)*core*edge*sky;
    warped+=vec2(sin(u_time*.069)*.003,cos(u_time*.053)*.002)*core*sky;
  }
  // CSS cover mapping retains the original crop and leaves the right side still.
  vec2 cover=vec2(min(1.,u_aspect/u_imageAspect),min(1.,u_imageAspect/u_aspect));
  vec2 anchor=mix(vec2(.5),vec2(.68,.34),u_lunar);
  vec2 sampleUV=clamp((warped-.5)*cover+anchor*(1.-cover)+cover*.5,vec2(.002),vec2(.998));
  vec4 color=texture2D(u_image,sampleUV);
  if(u_mist>.5){
    // Only atmospheric layers move; the underlying forest and ruins stay still.
    float sky=1.-smoothstep(.16,.36,uv.y);
    float valley=smoothstep(.28,.48,uv.x)*smoothstep(.23,.42,uv.y)*(1.-smoothstep(.68,.88,uv.y));
    float grey=1.-smoothstep(.06,.21,abs(color.r-color.g)+abs(color.g-color.b));
    valley*=grey*smoothstep(.08,.32,dot(color.rgb,vec3(.3,.5,.2)));
    vec2 drift=vec2(uv.x*5.5-u_time*.075,uv.y*8.+sin(u_time*.19)*.32);
    float curl=fog(drift+vec2(fog(drift*.7+u_time*.018),fog(drift*.8-u_time*.024)));
    float cloud=fog(vec2(uv.x*4.+u_time*.035,uv.y*6.-u_time*.014));
    float veil=smoothstep(.31,.77,curl)*valley*.46;
    color.rgb=mix(color.rgb,vec3(.39,.36,.37),veil);
    color.rgb=mix(color.rgb,color.rgb*.38+vec3(.055,.005,.012),sky*smoothstep(.25,.76,cloud)*.46);
  }
  float hot=smoothstep(.07,.3,color.r-color.g)*smoothstep(.15,.6,color.r);
  if(u_lunar>.5){
    float glow=fog(uv*vec2(4.,5.)+vec2(-u_time*.037,u_time*.021));
    color.rgb*=1.+hot*(.13+.5*glow);
    color.rgb+=vec3(.07,.008,.012)*hot*glow;
  }
  float flicker=.12*sin(u_time*5.2+uv.x*40.)+.06*sin(u_time*10.+uv.y*48.);
  color.rgb*=1.+u_fire*hot*flicker;
  color.rgb*=mix(.60,1.,smoothstep(0.,.8,uv.x));
  gl_FragColor=vec4(color.rgb,1.);
}
`;
export function bindChaosBackground(header,reduced){
  const canvas=header.querySelector('.chaos-background-canvas');
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});
  if(!gl)return ()=>{};
  let program,buffer,texture,shaders=[],ready=false,disposed=false,lost=false;
  let visible=true,frame=0,last=0,time=0,restarted=null;
  function compile(type,source){const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Background shader');return s;}
  try{program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Background program');}
  catch{shaders.forEach(s=>gl.deleteShader(s));if(program)gl.deleteProgram(program);return ()=>{};}
  gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const a=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  const uniforms=Object.fromEntries(['time','aspect','imageAspect','image','strength','fire','mist','lunar'].map(n=>[n,gl.getUniformLocation(program,'u_'+n)]));
  gl.uniform1f(uniforms.strength,Number(canvas.dataset.strength||1));
  gl.uniform1f(uniforms.fire,canvas.dataset.effect==='fire'?1:0);
  gl.uniform1f(uniforms.mist,canvas.dataset.effect==='mist'?1:0);
  gl.uniform1f(uniforms.lunar,canvas.dataset.effect==='lunar'?1:0);
  texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  for(const [key,value] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,key,value);
  const image=new Image();
  image.onload=()=>{if(disposed||lost)return;gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.uniform1i(uniforms.image,0);gl.uniform1f(uniforms.imageAspect,image.naturalWidth/image.naturalHeight);ready=true;resize();resume();};
  image.src=canvas.dataset.art||'https://hiroshimakrumpmakyo.yoko2528.chatgpt.site/assets/history-header-bg.webp';
  function resize(){if(disposed||lost)return;const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,1.25);canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));gl.viewport(0,0,canvas.width,canvas.height);gl.uniform1f(uniforms.aspect,w/Math.max(1,h));}
  function render(now){frame=0;if(disposed||lost||!ready||!visible||document.hidden||reduced.matches)return;time+=Math.min(last?now-last:16.7,50)/1000;last=now;gl.uniform1f(uniforms.time,time);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);canvas.style.opacity='1';frame=requestAnimationFrame(render);}
  function resume(){cancelAnimationFrame(frame);frame=0;last=0;if(disposed||lost)return;if(reduced.matches){canvas.style.opacity='0';return;}if(ready&&visible&&!document.hidden)frame=requestAnimationFrame(render);}
  function contextLost(e){e.preventDefault();lost=true;cancelAnimationFrame(frame);canvas.style.opacity='0';}
  function contextRestored(){if(disposed)return;cleanup();restarted=bindChaosBackground(header,reduced);}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();});observer.observe(header);
  const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(canvas);
  document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('webglcontextrestored',contextRestored);
  resize();
  function cleanup(){disposed=true;image.onload=null;cancelAnimationFrame(frame);observer.disconnect();sizeObserver.disconnect();document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',contextRestored);canvas.style.opacity='0';if(!lost){gl.deleteBuffer(buffer);gl.deleteTexture(texture);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));}}
  return ()=>{cleanup();restarted?.();};
}
