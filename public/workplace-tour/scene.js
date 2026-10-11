/* ASCEND workplace scene. Native WebGL; published role text supplied by the parent page. */
(() => { 'use strict';
const $=id=>document.getElementById(id);
let stop=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,renderOnce=()=>{},snap=false;
let data={};try{data=JSON.parse(new URLSearchParams(location.hash.slice(1)).get('content')||'{}');}catch{}
function motionLabel(){} function unavailable(){$('fallback').hidden=false;$('motion').hidden=true;try{parent.postMessage({type:'ascend-tour-unavailable'},location.origin);}catch{}}
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent)return;const value=event.data;if(value?.type==='ascend-tour-stop'&&Number.isInteger(value.stop)&&value.stop>=0&&value.stop<3){stop=value.stop;snap=paused;renderOnce();}if(value?.type==='ascend-tour-motion'){paused=Boolean(value.paused);snap=paused;renderOnce();}});
const canvas=$('world'),gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'low-power'});
if(!gl){unavailable();return;}
try {
    const norm = a => {const d=Math.hypot(...a)||1;return a.map(v=>v/d);};
    const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
    function look(eye,target) {const z=norm(eye.map((v,i)=>v-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
    function mul(a,b) {const r=new Float32Array(16);for(let c=0;c<4;c++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)r[c*4+row]+=a[k*4+row]*b[c*4+k];return r;}
    function perspective(aspect) {const f=1/Math.tan(.57/2),n=.1,far=70;return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0]);}
    function ortho(l,r,b,t,n,f) {return new Float32Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]);}
    const vertex=`#version 300 es
    layout(location=0) in vec3 position;layout(location=1) in vec3 normal;layout(location=2) in vec3 color;layout(location=3) in float material;
    uniform mat4 vp;uniform mat4 lightVP;out vec3 P;out vec3 N;out vec3 C;out vec4 L;out float M;
    void main(){P=position;N=normal;C=color;M=material;L=lightVP*vec4(position,1.);gl_Position=vp*vec4(position,1.);}`;
    const fragment=`#version 300 es
    precision highp float;in vec3 P;in vec3 N;in vec3 C;in vec4 L;in float M;uniform vec3 eye;uniform sampler2D shadowMap;uniform sampler2D artwork;uniform float clock;uniform float networkView;out vec4 outColor;
    void main(){vec3 n=normalize(N),light=normalize(vec3(-3.,9.,5.));float diff=max(dot(n,light),0.);vec3 lp=L.xyz/L.w*.5+.5;float shade=0.;float bias=max(.0012*(1.-diff),.00035);
    for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float depth=texture(shadowMap,lp.xy+vec2(float(x),float(y))/2048.).r;shade+=(lp.z-bias>depth?0.:1.)/9.;}if(lp.x<0.||lp.x>1.||lp.y<0.||lp.y>1.)shade=1.;
    vec3 base=C;if(M>.5&&M<1.5){float grain=sin(P.x*43.+sin(P.z*5.)*2.3+sin(P.x*8.))*.023+sin(P.x*172.+P.z*3.)*.012;base+=grain;}
    float hemi=.5+.5*n.y;vec3 lit=base*(vec3(.19,.205,.245)+hemi*.24+vec3(1.,.89,.72)*diff*shade*.85);
    vec3 h=normalize(light+normalize(eye-P));float spec=pow(max(dot(n,h),0.),M>1.5&&M<2.5?95.:35.);lit+=spec*shade*(M>1.5&&M<2.5?.38:.07);
    if(M>2.5)lit=base*.95;
    if(M>3.5){vec2 uv;float slot;if(M<4.5){uv=vec2((P.x+4.92)/1.64,1.-(P.y-1.19)/1.08);slot=0.;}else if(M<5.5){uv=vec2((P.x+1.6)/3.2,1.-(P.y-1.15)/1.7);slot=1.;}else{uv=vec2((P.x-3.13)/1.94,1.-(P.y-1.20)/1.36);slot=2.;}lit=texture(artwork,vec2(clamp(uv.x,0.,1.),1.-(slot+clamp(uv.y,0.,1.))/3.)).rgb;}
    if(networkView>.5&&P.y<.06&&P.y>-.05){float path=1.-smoothstep(.025,.065,abs(P.z-2.2));float end=1.-smoothstep(5.7,6.,abs(P.x));float travel=mod(clock*.7,11.8)-5.9;float pulse=exp(-pow((P.x-travel)*2.5,2.));lit+=vec3(.1,.64,.46)*path*end*(.3+pulse*1.4);}float fog=1.-exp(-length(eye-P)*.007);lit=mix(lit,vec3(.02745,.07451,.06275),fog);outColor=vec4(pow(max(lit,vec3(0.)),vec3(.88)),1.);}`;
    function program(v,f) {const p=gl.createProgram();for(const [type,source] of [[gl.VERTEX_SHADER,v],[gl.FRAGMENT_SHADER,f]]){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
    const mainProgram=program(vertex,fragment);
    const shadowProgram=program(`#version 300 es\nlayout(location=0) in vec3 position;uniform mat4 vp;void main(){gl_Position=vp*vec4(position,1.);}`,`#version 300 es\nprecision highp float;void main(){}`);
    const vertices=[];
    const palette={wood:[.55,.37,.22],dark:[.07,.08,.09],metal:[.42,.45,.48],fabric:[.31,.32,.32],wall:[.56,.55,.50],accent:[.08,.58,.49],screen:[.07,.085,.12],paper:[.77,.75,.67],leaf:[.16,.25,.12]};
    function point(p,n,c,m,origin,angle) {const co=Math.cos(angle),si=Math.sin(angle);vertices.push(p[0]*co+p[2]*si+origin[0],p[1]+origin[1],-p[0]*si+p[2]*co+origin[2],n[0]*co+n[2]*si,n[1],-n[0]*si+n[2]*co,...c,m);}
    function box(origin,size,c,m=0,angle=0) {const [x,y,z]=size.map(v=>v/2);const faces=[[[1,0,0],[[x,-y,-z],[x,y,-z],[x,y,z],[x,-y,z]]],[[-1,0,0],[[-x,-y,z],[-x,y,z],[-x,y,-z],[-x,-y,-z]]],[[0,1,0],[[-x,y,-z],[-x,y,z],[x,y,z],[x,y,-z]]],[[0,-1,0],[[-x,-y,z],[-x,-y,-z],[x,-y,-z],[x,-y,z]]],[[0,0,1],[[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]]],[[0,0,-1],[[x,-y,-z],[-x,-y,-z],[-x,y,-z],[x,y,-z]]]];for(const [n,ps] of faces)for(const i of [0,1,2,0,2,3])point(ps[i],n,c,m,origin,angle);}
    function cylinder(origin,radius,height,c,m=0,segments=24) {for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2;const p=[Math.cos(a)*radius,Math.sin(a)*radius],q=[Math.cos(b)*radius,Math.sin(b)*radius];for(const [x,y,z] of [[p[0],-height/2,p[1]],[q[0],-height/2,q[1]],[q[0],height/2,q[1]],[p[0],-height/2,p[1]],[q[0],height/2,q[1]],[p[0],height/2,p[1]]])point([x,y,z],norm([x,0,z]),c,m,origin,0);for(const sign of [-1,1]){const ps=sign===1?[[0,height/2,0],[q[0],height/2,q[1]],[p[0],height/2,p[1]]]:[[0,-height/2,0],[p[0],-height/2,p[1]],[q[0],-height/2,q[1]]];for(const p2 of ps)point(p2,[0,sign,0],c,m,origin,0);}}}
    function ellipsoid(origin,scale,c) {const rings=8,sides=12;function vertexAt(i,j){const a=i/rings*Math.PI,b=j/sides*Math.PI*2;return [Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];}for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const p=[vertexAt(i,j),vertexAt(i+1,j),vertexAt(i+1,j+1),vertexAt(i,j+1)];for(const k of [0,1,2,0,2,3])point(p[k].map((v,a)=>v*scale[a]),norm(p[k].map((v,a)=>v/scale[a])),c,0,origin,0);}}
    function plant(x,z,size=1){cylinder([x,.23*size,z],.24*size,.46*size,[.48,.44,.38]);cylinder([x,.46*size,z],.21*size,.025,[.11,.08,.055]);for(let i=0;i<7;i++){const a=i*2.4;const h=(.8+(i%3)*.25)*size;cylinder([x+Math.sin(a)*.05,h/2+.4*size,z+Math.cos(a)*.05],.012,h-.2*size,palette.leaf,0,8);ellipsoid([x+Math.sin(a)*.20*size,h+.25*size,z+Math.cos(a)*.20*size],[.16*size,.35*size,.11*size],palette.leaf);}}
    function chair(x,z,rotation=0) {const loc=(dx,y,dz)=>[x+dx*Math.cos(rotation)+dz*Math.sin(rotation),y,z-dx*Math.sin(rotation)+dz*Math.cos(rotation)];box(loc(0,.62,0),[.65,.14,.65],palette.fabric,0,rotation);box(loc(0,.99,-.27),[.64,.65,.13],palette.fabric,0,rotation);cylinder(loc(0,.32,0),.055,.52,palette.metal,2);for(let i=0;i<5;i++){box(loc(Math.sin(i*1.256)*.17,.085,Math.cos(i*1.256)*.17),[.045,.035,.42],palette.dark,2,rotation+i*1.256);ellipsoid(loc(Math.sin(i*1.256)*.34,.06,Math.cos(i*1.256)*.34),[.055,.055,.055],palette.dark);}for(const side of [-1,1])box(loc(side*.34,.86,0),[.055,.055,.36],palette.dark,2,rotation);}
    function desk(x,z,width=2.1){box([x,1.02,z],[width,.12,.9],palette.wood,1);for(const dx of [-width/2+.12,width/2-.12])for(const dz of [-.33,.33])box([x+dx,.5,z+dz],[.055,1,.055],palette.dark,2);box([x,.25,z-.33],[width-.2,.04,.04],palette.dark,2);}

    // One continuous customer-success studio, viewed at three tour stops.
    box([0,-.18,0],[13,.3,6],[.24,.28,.26]);
    box([0,-.015,0],[12.8,.03,5.8],[.43,.45,.40]);
    for(let x=-6;x<=6;x+=.45)box([x,.005,0],[.012,.006,5.8],[.35,.37,.33]);
    box([0,1.6,-2.35],[12.8,3.2,.15],[.56,.59,.54]);
    box([0,2.1,-2.24],[3.8,1.55,.035],[.66,.83,.79],3);
    for(const x of [-1.9,0,1.9])box([x,2.1,-2.19],[.05,1.65,.06],palette.metal,2);
    box([0,2.1,-2.19],[3.85,.05,.06],palette.metal,2);
    // Welcome board, the customer context.
    box([-4.1,1.74,-.74],[1.76,1.2,.09],palette.dark,2);
    box([-4.1,1.73,-.687],[1.64,1.08,.012],[1,1,1],4);
    for(const x of [-4.8,-3.4])box([x,.6,-.75],[.07,1.2,.08],palette.metal,2);
    plant(-5.3,-1.45,1.25);
    desk(0,-.2,3.6);
    box([0,2,-.75],[3.34,1.82,.10],palette.dark,2);
    box([0,2,-.69],[3.2,1.7,.012],[1,1,1],5);
    box([0,1.17,-.73],[.12,.35,.08],palette.metal,2);
    box([0,1.10,-.59],[.65,.04,.35],palette.metal,2);
    box([-.45,1.105,.07],[1.15,.04,.35],palette.metal,2);
    for(let row=0;row<4;row++)for(let col=0;col<15;col++)box([-.96+col*.072,1.134,-.04+row*.068],[.051,.014,.043],palette.dark);
    ellipsoid([.38,1.14,.13],[.10,.04,.14],palette.dark);
    box([1.23,1.12,.02],[.45,.05,.56],palette.paper,0,-.13);
    for(let i=0;i<5;i++)box([1.23,1.15,-.15+i*.075],[.3,.004,.015],[.39,.47,.42],0,-.13);
    cylinder([-1.38,1.22,-.11],.09,.23,[.73,.72,.61]);cylinder([-1.38,1.338,-.11],.075,.01,[.08,.04,.02]);
    chair(-.3,1.15);chair(-2.2,.6,.6);
    // Role-reality board and physical handover folders.
    desk(4.1,-.25,2.8);
    box([4.1,1.9,-.75],[2.06,1.48,.11],palette.dark,2);
    box([4.1,1.88,-.685],[1.94,1.36,.014],[1,1,1],6);
    for(let i=0;i<3;i++){box([3.3+i*.75,1.13,.1],[.58,.055,.49],palette.paper,0,-.08);box([3.3+i*.75,1.162,-.03],[.38,.007,.04],palette.accent);}
    plant(5.7,-1.35,1.1);
    const vao=gl.createVertexArray();gl.bindVertexArray(vao);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    for(const [index,size,offset] of [[0,3,0],[1,3,12],[2,3,24],[3,1,36]]){gl.enableVertexAttribArray(index);gl.vertexAttribPointer(index,size,gl.FLOAT,false,40,offset);}
    const count=vertices.length/10;
    const depth=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,depth);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,2048,2048,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depth,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Shadow framebuffer unavailable');
    const lightVP=mul(ortho(-10,10,-8,8,.1,35),look([-6,18,10],[0,0,0]));
    gl.enable(gl.DEPTH_TEST);gl.viewport(0,0,2048,2048);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(shadowProgram);gl.uniformMatrix4fv(gl.getUniformLocation(shadowProgram,'vp'),false,lightVP);gl.drawArrays(gl.TRIANGLES,0,count);gl.bindFramebuffer(gl.FRAMEBUFFER,null);

    const atlas=document.createElement('canvas');atlas.width=1024;atlas.height=1536;const ctx=atlas.getContext('2d');if(!ctx)throw new Error('Artwork unavailable');
    const headings=['YOUR WORKPLACE','THE WORK IN FRONT OF YOU','ROLE REALITY'];
    const titles=[data.title||'Explore the role',data.tasks?.[0]||'A working day',data.reality?.[0]||'Understand the demands'];
    const lines=[[data.environment||'',data.team||'',data.pace||''],data.tasks||[],data.reality||[]];
    for(let slot=0;slot<3;slot++){ctx.save();ctx.translate(0,slot*512);ctx.fillStyle='#102e2a';ctx.fillRect(0,0,1024,512);ctx.fillStyle='#64cbb0';ctx.fillRect(0,0,1024,8);ctx.font='20px Arial';ctx.fillText(headings[slot],45,65);ctx.fillStyle='#ecf4eb';ctx.font='39px Arial';ctx.fillText(titles[slot].slice(0,42),45,135);for(let j=0;j<3;j++){ctx.fillStyle='#1c4439';ctx.fillRect(45,180+j*80,930,60);ctx.fillStyle='#d5e6dc';ctx.font='26px Arial';ctx.fillText('0'+(j+1)+'   '+(lines[slot][j]||'').slice(0,57),65,218+j*80);}ctx.fillStyle='#9fbdb0';ctx.font='19px Arial';ctx.fillText('Conceptual workplace · Explore the published role',45,477);ctx.restore();}
    const artwork=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,artwork);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const uniforms={};for(const key of ['vp','lightVP','eye','shadowMap','artwork','clock','networkView'])uniforms[key]=gl.getUniformLocation(mainProgram,key);

    const cameras=[[ -4.5,3.15,8.3],[.3,2.55,5.1],[4.7,2.8,6.4]],targets=[[-2.6,1.2,-.3],[0,1.7,-.5],[4.1,1.5,-.5]];
    let camera=[-5.3,4.3,11.5],target=[-1.4,1,-.3],last=0,frame=0,elapsed=0;
    function draw(now=0){const dt=Math.min(Math.max((now-last)/1000,0),.05);last=now;const c=cameras[stop],t=targets[stop];let distance=0;
      if(!paused||snap){for(let i=0;i<3;i++){camera[i]+= (c[i]-camera[i])*(snap?1:1-Math.exp(-dt*2.2));target[i]+=(t[i]-target[i])*(snap?1:1-Math.exp(-dt*2.2));}snap=false;}
      for(let i=0;i<3;i++)distance+=Math.abs(c[i]-camera[i])+Math.abs(t[i]-target[i]);
      const r=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio,1.5),w=Math.max(1,Math.round(r.width*ratio)),h=Math.max(1,Math.round(r.height*ratio));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      const eye=[...camera];if(innerWidth<700)eye[2]+=2.3;
      gl.viewport(0,0,w,h);gl.clearColor(.02745,.07451,.06275,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(mainProgram);gl.uniformMatrix4fv(uniforms.vp,false,mul(perspective(w/h),look(eye,target)));gl.uniformMatrix4fv(uniforms.lightVP,false,lightVP);gl.uniform3fv(uniforms.eye,eye);gl.uniform1f(uniforms.clock,elapsed);gl.uniform1f(uniforms.networkView,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,depth);gl.uniform1i(uniforms.shadowMap,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,artwork);gl.uniform1i(uniforms.artwork,1);gl.drawArrays(gl.TRIANGLES,0,count);
      frame=0;if(!paused&&distance>.003&&!document.hidden)frame=requestAnimationFrame(draw);
    }
    renderOnce=()=>{if(!frame){last=performance.now();frame=requestAnimationFrame(draw);}};
    new ResizeObserver(renderOnce).observe(canvas);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else renderOnce();});
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{paused=e.matches;snap=paused;motionLabel();renderOnce();});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);unavailable();});
    snap=paused;renderOnce();
  }catch(error){console.error('ASCEND role tour:',error);unavailable();}
})();
