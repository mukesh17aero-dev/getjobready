/* Standalone local concept. Native WebGL; no packages, network calls or tracking. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const requestedView = new URLSearchParams(location.search).get('view');
  const view = ['orbit','walkthrough','network'].includes(requestedView) ? requestedView : 'orbit';
  const copy = [
    ['YOUR NEXT CHAPTER STARTS HERE','Your future.<br>A little more<br><em>within reach.</em>','Find your direction, strengthen your professional presence and practise for interviews. Start with what you need today.','Open my career home','/','<strong>Next: your career home</strong>Tell us about you, explore your options and choose your next step. You can look around before creating an account.','01 / THE PRACTICE STUDIO','A place to prepare.<br>For the work ahead.'],
    ['SUPPORT THE STUDENT. STRENGTHEN THE COHORT.','Potential needs<br>a place to<br><em>become visible.</em>','See how Ascend plans to bring student progress, employability insights and placement preparation into one college view.','Explore Ascend for colleges','/for/colleges','<strong>Next: the college home</strong>Explore the planned tools and request access. College features are not released yet.','02 / THE MENTORING STUDIO','From individual preparation<br>to a view of the whole cohort.'],
    ['A CLEARER VIEW OF YOUR NEXT HIRE','Meet the work.<br>Then meet<br><em>the person.</em>','See how candidate passports, role readiness and simulation reports will help you look beyond an application.','Explore Ascend for employers','/for/employers','<strong>Next: the employer home</strong>Explore the planned tools and request access. Employer features are not released yet.','03 / THE INTERVIEW STUDIO','From a candidate’s preparation<br>to evidence you can review.']
  ];
  const paths = [['Explore','Prepare','Progress'],['Student progress','Cohort insights','Placement preparation'],['Candidate passports','Role readiness','Simulation reports']];
  let audience = 0, paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pointerX = 0, pointerY = 0, orbit = 0, cameraX = -3.8, renderOnce = () => {};
  const motion = $('motion');
  function motionLabel() { motion.textContent = paused ? 'Play motion' : 'Pause motion'; motion.setAttribute('aria-pressed', String(!paused)); }
  motionLabel();
  motion.onclick = () => { paused = !paused; motionLabel(); renderOnce(); };
  document.querySelectorAll('[data-audience]').forEach(button => button.onclick = () => {
    audience = Number(button.dataset.audience);
    document.querySelectorAll('[data-audience]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    const d = copy[audience];
    $('eyebrow').textContent = d[0]; $('headline').innerHTML = d[1]; $('body').textContent = d[2];
    $('cta').innerHTML = d[3] + ' <span>↗</span>'; $('cta').href = d[4]; $('sub').innerHTML = d[5];
    $('room-label').textContent = d[6]; $('room-detail').innerHTML = d[7];
    ['path','path-middle','path-end'].forEach((id,i) => { $(id).textContent=paths[audience][i]; });
    document.querySelectorAll('[data-connection]').forEach(el => { el.dataset.active=String(Number(el.dataset.connection)===audience); });
    const url=new URL(location.href);url.searchParams.set('for',['student','college','employer'][audience]);history.replaceState(null,'',url);
    if(parent!==window)parent.postMessage({type:'ascend-preview-audience',audience:['student','college','employer'][audience]},location.origin);
    if (paused) cameraX = [-3.8,0,3.8][audience];
    renderOnce();
  });
  const initialAudience=['student','college','employer'].indexOf(new URLSearchParams(location.search).get('for'));
  if(initialAudience>0)document.querySelector('[data-audience="'+initialAudience+'"]').click();
  const canvas = $('world');
  canvas.addEventListener('pointermove', e => { if (paused) return; const r=canvas.getBoundingClientRect(); pointerX=(e.clientX-r.left)/r.width-.5;pointerY=(e.clientY-r.top)/r.height-.5; });
  canvas.addEventListener('pointerleave', () => {pointerX=0;pointerY=0;});
  const gl = canvas.getContext('webgl2', {antialias:true,alpha:false,powerPreference:'low-power'});
  if (!gl) { $('fallback').style.display='block'; motion.hidden=true; return; }
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
    precision highp float;in vec3 P;in vec3 N;in vec3 C;in vec4 L;in float M;uniform vec3 eye;uniform sampler2D shadowMap;uniform float clock;uniform float networkView;out vec4 outColor;
    void main(){vec3 n=normalize(N),light=normalize(vec3(-3.,9.,5.));float diff=max(dot(n,light),0.);vec3 lp=L.xyz/L.w*.5+.5;float shade=0.;float bias=max(.0012*(1.-diff),.00035);
    for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float depth=texture(shadowMap,lp.xy+vec2(float(x),float(y))/2048.).r;shade+=(lp.z-bias>depth?0.:1.)/9.;}if(lp.x<0.||lp.x>1.||lp.y<0.||lp.y>1.)shade=1.;
    vec3 base=C;if(M>.5&&M<1.5){float grain=sin(P.x*43.+sin(P.z*5.)*2.3+sin(P.x*8.))*.023+sin(P.x*172.+P.z*3.)*.012;base+=grain;}
    float hemi=.5+.5*n.y;vec3 lit=base*(vec3(.19,.205,.245)+hemi*.24+vec3(1.,.89,.72)*diff*shade*.85);
    vec3 h=normalize(light+normalize(eye-P));float spec=pow(max(dot(n,h),0.),M>1.5&&M<2.5?95.:35.);lit+=spec*shade*(M>1.5&&M<2.5?.38:.07);
    if(M>2.5)lit=base*.95;
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
    function laptop(x,y,z,rotation=0){const loc=(dx,dy,dz)=>[x+dx*Math.cos(rotation)+dz*Math.sin(rotation),y+dy,z-dx*Math.sin(rotation)+dz*Math.cos(rotation)];box(loc(0,0,0),[.66,.035,.46],palette.metal,2,rotation);box(loc(0,.24,-.22),[.66,.47,.035],palette.dark,2,rotation);box(loc(0,.24,-.199),[.60,.405,.006],palette.screen,3,rotation);box(loc(-.20,.24,-.192),[.13,.37,.007],[.055,.19,.17],3,rotation);for(let i=0;i<4;i++)box(loc(.07,.37-i*.07,-.19),[.28-i*.025,.018,.008],i===0?palette.accent:[.31,.32,.37],3,rotation);for(let row=0;row<4;row++)for(let col=0;col<10;col++)box(loc(-.255+col*.056,.022,-.12+row*.048),[.043,.008,.032],palette.dark,0,rotation);box(loc(0,.023,.135),[.20,.005,.10],[.32,.34,.36],2,rotation);}
    function desk(x,z,width=2.1){box([x,1.02,z],[width,.12,.9],palette.wood,1);for(const dx of [-width/2+.12,width/2-.12])for(const dz of [-.33,.33])box([x+dx,.5,z+dz],[.055,1,.055],palette.dark,2);box([x,.25,z-.33],[width-.2,.04,.04],palette.dark,2);}
    // Architectural plinth, parquet floors and an open front preserve the view into all three spaces.
    box([0,-.24,0],[12.8,.38,5.6],[.22,.24,.25],2);
    box([0,-.03,0],[12.5,.08,5.3],[.37,.32,.26],1);
    for(let x=-6.1;x<6.2;x+=.31)box([x,.014,0],[.009,.008,5.25],[.24,.205,.17]);
    box([0,1.65,-2.6],[12.5,3.3,.13],palette.wall);
    box([-6.2,1.65,0],[.13,3.3,5.25],palette.wall);
    for(let x=-5.8;x<6;x+=.3)box([x,1.68,-2.50],[.04,3.18,.05],[.46,.445,.4],1);
    box([0,3.3,-2.5],[12.6,.10,.22],palette.dark,2);
    box([0,.08,-2.47],[12.4,.06,.05],palette.accent,3);
    // Three open portals frame distinct rooms without hiding the workspaces.
    for(const x of [-2.15,2.15]){box([x,1.65,-1.45],[.095,3.3,2.2],palette.dark,2);box([x,3.27,.10],[.095,.10,5.0],palette.dark,2);box([x,1.65,2.35],[.095,3.3,.095],palette.dark,2);}
    // Student workspace: laptop, task notebook, desk lamp, storage and a small plant.
    box([-4.1,.035,.1],[3.3,.04,3.3],[.25,.26,.265]);
    desk(-4.1,-.55,2.6);laptop(-4.3,1.10,-.60);chair(-4.15,.45);
    box([-3.31,1.104,-.37],[.38,.045,.51],palette.paper,0,-.12);
    box([-3.31,1.13,-.37],[.30,.007,.42],[.84,.82,.75],0,-.12);
    box([-3.28,1.15,-.36],[.014,.014,.33],palette.dark,0,.22);
    cylinder([-5.10,1.10,-.68],.17,.045,palette.dark,2);cylinder([-5.10,1.44,-.68],.023,.64,palette.metal,2);box([-4.98,1.75,-.68],[.28,.06,.18],palette.dark,2);box([-4.98,1.715,-.68],[.22,.008,.13],[.91,.81,.61],3);
    cylinder([-3.35,1.17,-.83],.075,.17,[.70,.65,.56]);cylinder([-3.35,1.26,-.83],.061,.008,[.09,.045,.02]);
    box([-5.55,.56,-1.86],[.75,1.12,.70],[.37,.32,.27],1);for(let y=.2;y<1;y+=.3)box([-5.55,y,-1.50],[.18,.018,.022],palette.metal,2);plant(-5.6,1.6,1.2);
    // College studio: a shared mentoring table and multiple visible practice stations.
    box([0,.035,0],[3.7,.04,3.6],[.31,.305,.29]);desk(0,-.1,2.7);laptop(-.65,1.10,-.13);laptop(.65,1.10,-.13);
    chair(-.70,.9);chair(.7,.9);chair(0,-1.2,Math.PI);
    box([0,2.1,-2.38],[2.3,1.18,.08],[.13,.14,.16],2);box([0,2.1,-2.33],[2.19,1.07,.015],[.26,.275,.28]);
    for(let i=0;i<3;i++){box([-.65+i*.66,2.34,-2.31],[.46,.07,.02],[.28,.64,.53],3);for(let j=0;j<3;j++)box([-.65+i*.66,2.13-j*.18,-2.31],[.42,.09,.02],[.56,.56,.53]);}
    plant(1.55,1.65,.8);
    // Employer studio: round interview table, two chairs and a work record on a laptop.
    box([4.23,.035,0],[3.8,.04,3.6],[.24,.26,.27]);cylinder([4.1,1.02,-.2],1.02,.12,palette.wood,1,48);cylinder([4.1,.5,-.2],.14,1,palette.dark,2);cylinder([4.1,.055,-.2],.56,.05,palette.dark,2,40);
    laptop(4.15,1.10,-.3,-.25);chair(4.05,1.15);chair(4.10,-1.45,Math.PI);
    box([4.72,1.10,-.05],[.30,.025,.42],palette.paper,0,.20);cylinder([3.5,1.19,-.15],.066,.21,[.65,.66,.62],2);
    box([5.60,.51,-1.95],[.9,1.02,.75],[.33,.34,.31],1);plant(5.58,1.65,1.25);
    for(let i=0;i<4;i++)box([3.0+i*.55,2.12,-2.35],[.34,.58,.09],i%2?[.48,.45,.40]:[.22,.24,.25]);
    // Ceiling pendants are physical objects, with warm luminous undersides.
    for(const x of [-4.1,0,4.1]){cylinder([x,3.12,-.3],.012,.66,palette.dark,2,8);cylinder([x,2.78,-.3],.40,.09,palette.dark,2,40);cylinder([x,2.728,-.3],.35,.008,[.92,.80,.59],3,40);}
    const vao=gl.createVertexArray();gl.bindVertexArray(vao);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    for(const [index,size,offset] of [[0,3,0],[1,3,12],[2,3,24],[3,1,36]]){gl.enableVertexAttribArray(index);gl.vertexAttribPointer(index,size,gl.FLOAT,false,40,offset);}
    const count=vertices.length/10;
    const depth=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,depth);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,2048,2048,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depth,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Shadow framebuffer unavailable');
    const lightVP=mul(ortho(-10,10,-8,8,.1,35),look([-6,18,10],[0,0,0]));
    gl.enable(gl.DEPTH_TEST);gl.viewport(0,0,2048,2048);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(shadowProgram);gl.uniformMatrix4fv(gl.getUniformLocation(shadowProgram,'vp'),false,lightVP);gl.drawArrays(gl.TRIANGLES,0,count);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    const uniforms={};for(const key of ['vp','lightVP','eye','shadowMap','clock','networkView'])uniforms[key]=gl.getUniformLocation(mainProgram,key);
    let last=0,frame=0,elapsed=0;
    function draw(now=0){const dt=Math.min((now-last)/1000,.05);last=now;if(!paused){elapsed+=dt;orbit+=dt*.15;cameraX+=([-3.8,0,3.8][audience]-cameraX)*(1-Math.exp(-dt*3));}
      const r=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio,1.5);const w=Math.round(r.width*ratio),h=Math.round(r.height*ratio);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      const sway=paused?0:Math.sin(orbit)*.28+pointerX*.9;const mobile=innerWidth<761;
      let eye,target;
      if(view==='walkthrough'){
        // A slow dolly toward the selected workspace at human eye level.
        const approach=(1-Math.cos(elapsed*.30))*.5;
        eye=[cameraX+.90+Math.sin(elapsed*.18)*.38+(paused?0:pointerX*.20),2.05+(paused?0:pointerY*.15),6.5-approach*2.1];
        target=[cameraX,1.30,-.65];
        if(mobile){eye[1]=2.65;eye[2]+=1.8;}
      }else if(view==='network'){
        // Pull back to keep students, colleges and employers in one frame.
        const angle=.18+Math.sin(elapsed*.12)*.20;
        eye=[Math.sin(angle)*18+cameraX*.12,9.8,Math.cos(angle)*18];
        target=[0,.8,0];
        if(mobile){eye[1]=12;eye[2]+=4;}
      }else{
        // A visible architectural orbit, constrained to the building's open face.
        const angle=.36+Math.sin(elapsed*.17)*.15;
        eye=[cameraX+Math.sin(angle)*12+sway,6.0+(paused?0:pointerY*.5),Math.cos(angle)*12];
        target=[cameraX*.67,1.05,-.25];
        if(mobile){eye[1]=7.3;eye[2]+=2;}
      }
      gl.viewport(0,0,w,h);gl.clearColor(.02745,.07451,.06275,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(mainProgram);gl.uniformMatrix4fv(uniforms.vp,false,mul(perspective(w/h),look(eye,target)));gl.uniformMatrix4fv(uniforms.lightVP,false,lightVP);gl.uniform3fv(uniforms.eye,eye);gl.uniform1f(uniforms.clock,elapsed);gl.uniform1f(uniforms.networkView,view==='network'?1:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,depth);gl.uniform1i(uniforms.shadowMap,0);gl.drawArrays(gl.TRIANGLES,0,count);
      frame=0;if(!paused&&!document.hidden)frame=requestAnimationFrame(draw);
    }
    renderOnce=()=>{if(!frame)frame=requestAnimationFrame(draw);};
    new ResizeObserver(renderOnce).observe(canvas);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{last=performance.now();renderOnce();}});
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');reduced.addEventListener('change',e=>{paused=e.matches;motionLabel();renderOnce();});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);$('fallback').style.display='block';});
    renderOnce();
  } catch(error) { console.error('ASCEND 3D preview:',error);$('fallback').style.display='block';motion.hidden=true; }
})();
