import { getImageProps } from 'next/image';
import { welcomeSlides } from './welcome-slides.js';

/* Native WebGL artwork transferred from the approved welcome concept. */
/** @param {HTMLElement} root @param {string} initial */
export function mountNetworkWelcome(root, initial = 'student', cinematic = true) {
 const cleanup = []; const controller = new AbortController();
 let fallbackDispose;
 const listen = (target, event, handler) => target.addEventListener(event, handler, {signal: controller.signal});
 const dispose = () => {controller.abort(); cleanup.forEach(fn=>fn()); fallbackDispose?.();};
  const $ = id => root.querySelector("#"+id);
  const requestedView = new URLSearchParams(location.search).get('view');
  const view = ['orbit','walkthrough','network'].includes(requestedView) ? requestedView : 'walkthrough';
  const copy = [
    ['YOUR NEXT CHAPTER STARTS HERE','Stand out in<br>a crowded<br><em>job market.</em>','Work that fits how you think, a plan to get ready, and proof employers trust.','Open my career home','/','TRY THE WORK','A task. Your response.<br>A chance to improve.','Illustrative college'],
    ['SUPPORT THE STUDENT. STRENGTHEN THE COHORT.','Potential needs<br>a place to<br><em>become visible.</em>','Understand student readiness and focus your placement support.','Explore Ascend for colleges','/for/colleges','SEE THE COHORT','See where support is needed.<br>Then look at the work behind it.','Illustrative placement office'],
    ['A CLEARER VIEW OF YOUR NEXT HIRE','Meet the work.<br>Then meet<br><em>the person.</em>','Explore the evidence behind a candidate’s readiness.','Explore Ascend for employers','/for/employers','OPEN THE WORK RECORD','The task. The response. The assessment.<br>Evidence for a better conversation.','Illustrative workplace']
  ];
  let audience = 0, paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pointerX = 0, pointerY = 0, orbit = 0, cameraX = -3.8, renderOnce = () => {};
  root.querySelectorAll('[data-audience]').forEach(button => button.onclick = () => {
    audience = Number(button.dataset.audience);
    root.querySelectorAll('[data-audience]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    const d = copy[audience];
    $('eyebrow').textContent = d[0]; $('headline').innerHTML = d[1]; $('body').textContent = d[2];
    $('cta').innerHTML = d[3] + ' <span>↗</span>'; $('cta').href = d[4];
    root.querySelectorAll('[data-connection]').forEach(el => { el.dataset.active=String(Number(el.dataset.connection)===audience); });
    const url=new URL(location.href);url.searchParams.set('for',['student','college','employer'][audience]);history.replaceState(null,'',url);
    
    if (paused) cameraX = [-3.8,0,3.8][audience];
    renderOnce(true);
  });
  const initialAudience=['student','college','employer'].indexOf(initial);
  if(initialAudience>0)root.querySelector('[data-audience="'+initialAudience+'"]').click();
  // The one-minute film: a centred play button over the poster until the film is running.
  const player = root.querySelector('.welcome-player');
  const film = player?.querySelector('video'), playButton = player?.querySelector('.welcome-play');
  if (player && film && playButton) {
    const syncPlayer = () => { player.dataset.playing = String(!film.paused); };
    playButton.onclick = () => { void film.play().catch(() => {}); };
    ['play', 'pause', 'ended'].forEach(event => listen(film, event, syncPlayer));
    syncPlayer();
    // "Watch the film" in the hero: bring the section into view and start the film in one click.
    const watch = $('watch-film');
    if (watch) listen(watch, 'click', event => {
      event.preventDefault();
      $('what-is-ascend').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', '#what-is-ascend');
      void film.play().catch(() => {});
    });
  }
  const canvas = $('world');
  if (cinematic && new URLSearchParams(location.search).get('animation') !== 'original') {
    const scene = canvas.parentElement;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    paused = paused || Boolean(navigator.connection?.saveData);
    scene.classList.add('scene--stills');
    canvas.style.display = 'none';
    let disposed = false, visible = true;
    let activeAudience = audience, slideIndex = 0, requestId = 0;
    let rotationTimer, fadeTimer, activeImage;
    const images = new Map();
    const file = slide => '/welcome/stills/' + slide.id + '.' + slide.extension;
    const mayRotate = () => !disposed && !paused && !document.hidden && visible;
    const loadImage = slide => {
      if (images.has(slide.id)) return images.get(slide.id);
      const loading = (async () => {
        const img = new Image();
        const { props } = getImageProps({src: file(slide), alt: '', width: 1920, height: 1080, sizes: '(max-width: 760px) 100vw, 74vw'});
        img.width = 1920; img.height = 1080;
        img.sizes = props.sizes;
        img.srcset = props.srcSet;
        img.src = props.src;
        try { await img.decode(); } catch {
          img.removeAttribute('srcset'); img.src = file(slide);
          await img.decode();
        }
        return img;
      })().catch(error => { images.delete(slide.id); throw error; });
      images.set(slide.id, loading);
      return loading;
    };
    const stopTimer = () => { clearTimeout(rotationTimer); rotationTimer = undefined; };
    const schedule = () => {
      stopTimer();
      if (!mayRotate()) return;
      rotationTimer = setTimeout(() => { void showSlide((slideIndex + 1) % 3); }, 6500);
      // Decode only the next picture in this category before its transition.
      void loadImage(welcomeSlides[activeAudience][(slideIndex + 1) % 3]).catch(() => {});
    };
    const showSlide = async index => {
      stopTimer();
      const token = ++requestId, category = activeAudience;
      const slide = welcomeSlides[category][index];
      try {
        const loaded = await loadImage(slide);
        if (disposed || token !== requestId || category !== activeAudience) return;
        const img = loaded.cloneNode();
        await img.decode();
        if (disposed || token !== requestId || category !== activeAudience) return;
        img.className = 'welcome-slide';
        img.alt = ''; img.setAttribute('aria-hidden', 'true');
        img.dataset.slide = slide.id;
        img.style.zIndex = '2';
        scene.querySelectorAll('.welcome-slide').forEach(old => { old.style.zIndex = '1'; });
        scene.prepend(img);
        // Paint the fully decoded image before starting its opacity transition.
        img.getBoundingClientRect();
        img.classList.add('is-visible');
        activeImage = img; slideIndex = index;
        scene.dataset.currentSlide = slide.id;
        clearTimeout(fadeTimer);
        fadeTimer = setTimeout(() => {
          scene.querySelectorAll('.welcome-slide').forEach(old => { if (old !== activeImage) old.remove(); });
        }, reduced.matches ? 0 : 1100);
        schedule();
      } catch {
        if (!disposed && token === requestId) {
          // Retain the last decoded picture on a slow or failed image request.
          slideIndex = index;
          schedule();
        }
      }
    };
    renderOnce = selected => {
      if (selected) {
        activeAudience = audience; slideIndex = 0;
        void showSlide(0);
      } else schedule();
    };
    listen(document, 'visibilitychange', schedule);
    listen(reduced, 'change', event => { paused = event.matches; schedule(); });
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); });
    observer.observe(scene);
    cleanup.push(() => {
      disposed = true; ++requestId; stopTimer(); clearTimeout(fadeTimer);
      observer.disconnect();
      scene.querySelectorAll('.welcome-slide').forEach(img => img.remove());
      canvas.style.removeProperty('display'); scene.classList.remove('scene--stills');
      delete scene.dataset.currentSlide;
    });
    void showSlide(0);
    return dispose;
  }
  listen(canvas, 'pointermove', e => { if (paused) return; const r=canvas.getBoundingClientRect(); pointerX=(e.clientX-r.left)/r.width-.5;pointerY=(e.clientY-r.top)/r.height-.5; });
  listen(canvas, 'pointerleave', () => {pointerX=0;pointerY=0;});
  const gl = canvas.getContext('webgl2', {antialias:true,alpha:false,powerPreference:'low-power'});
  if (!gl) { $('fallback').style.display='block'; return dispose; }
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
    // A continuous open exhibition of the work-to-readiness journey; no cabins.
    box([0,-.25,0],[13,.36,5.4],[.16,.20,.19],2);
    box([0,-.05,0],[12.8,.05,5.2],[.21,.25,.23]);
    box([0,-.005,2.2],[12.2,.04,.08],palette.accent,3);
    for(const x of [-4.1,0,4.1]){cylinder([x,.04,-.1],1.9,.16,[.30,.33,.30],0,64);cylinder([x,-.025,-.1],1.93,.035,palette.metal,2,64);}
    // Student: a substantial individual workbench, task display and tools for a response.
    desk(-4.1,-.35,2.8);
    box([-4.1,1.74,-.74],[1.76,1.2,.09],palette.dark,2);
    box([-4.1,1.73,-.687],[1.64,1.08,.012],[1,1,1],4);
    box([-4.1,1.17,-.77],[.09,.32,.07],palette.metal,2);
    box([-4.1,1.10,-.69],[.52,.035,.29],palette.metal,2);
    // Full-size keyboard gives the close-up a recognisable human scale.
    box([-4.18,1.10,.00],[1.02,.035,.31],palette.metal,2);
    for(let row=0;row<4;row++)for(let col=0;col<15;col++)box([-4.64+col*.064,1.124,-.095+row*.059],[.048,.015,.038],palette.dark);
    ellipsoid([-3.45,1.13,.01],[.09,.04,.13],palette.dark);
    box([-5.10,1.11,-.12],[.38,.04,.51],palette.paper,0,-.13);
    box([-5.10,1.14,-.12],[.31,.008,.43],[.84,.81,.72],0,-.13);
    box([-5.0,1.155,-.12],[.015,.015,.30],palette.dark,0,.13);
    cylinder([-3.0,1.18,-.56],.09,.21,[.61,.59,.48]);cylinder([-3.0,1.29,-.56],.075,.01,[.07,.035,.016]);
    chair(-4.3,1.04);plant(-5.45,-1.44,.85);
    // College: standing cohort display, with a matrix of individual work folders.
    box([0,2,-.94],[3.35,1.84,.14],palette.dark,2);
    box([0,2,-.862],[3.2,1.7,.012],[1,1,1],5);
    for(const x of [-1.3,1.3]){box([x,.77,-.97],[.07,1.54,.08],palette.metal,2);box([x,.14,-.80],[.52,.06,.62],palette.dark,2);}
    box([0,.83,.40],[2.8,.13,1.04],palette.wood,1);
    for(const x of [-1.1,1.1])box([x,.44,.40],[.08,.78,.74],palette.dark,2);
    for(let row=0;row<2;row++)for(let col=0;col<5;col++){
      const x=-1.04+col*.51,z=.13+row*.49;
      box([x,.924,z],[.36,.065,.35],[.61,.66,.60]);
      box([x,.96,z-.09],[.22,.009,.05],[.18,.42,.33]);
      box([x,.96,z+.03],[.22,.009,.012],[.40,.45,.42]);
      box([x,.96,z+.08],[.16,.009,.012],[.40,.45,.42]);
    }
    // Employer: a large physical work-record display in an open portfolio mount.
    box([4.1,.52,-.13],[1.15,.94,.75],[.25,.29,.26],2);
    box([4.1,1.06,-.12],[2.75,.12,1.13],palette.wood,1);
    box([4.1,1.88,-.57],[2.09,1.50,.10],[.095,.16,.13],2);
    box([4.1,1.88,-.512],[1.94,1.36,.012],[1,1,1],6);
    // Page edges and a spine make this a work record, not another laptop.
    for(let i=0;i<5;i++)box([4.1,1.88,-.585-i*.012],[2.03,1.44,.008],[.71,.73,.65]);
    box([3.015,1.88,-.56],[.075,1.52,.15],palette.metal,2);
    box([5.32,1.68,-.58],[.36,1.10,.07],[.18,.26,.22],0,-.18);
    for(let i=0;i<5;i++)box([5.30,2.04-i*.14,-.515],[.23,.024,.018],i===0?palette.accent:[.54,.60,.53],0,-.18);
    // Three documents below correspond to task, response and assessment.
    for(let i=0;i<3;i++){const x=3.28+i*.8;box([x,1.15,.12],[.60,.055,.48],palette.paper);box([x,1.181,-.03],[.39,.008,.055],palette.accent);for(let j=0;j<3;j++)box([x,1.182,.08+j*.07],[.37-j*.045,.008,.013],[.40,.44,.39]);}
    plant(5.6,-1.5,1.1);
    const vao=gl.createVertexArray();gl.bindVertexArray(vao);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    for(const [index,size,offset] of [[0,3,0],[1,3,12],[2,3,24],[3,1,36]]){gl.enableVertexAttribArray(index);gl.vertexAttribPointer(index,size,gl.FLOAT,false,40,offset);}
    const count=vertices.length/10;
    const depth=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,depth);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,2048,2048,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depth,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Shadow framebuffer unavailable');
    const lightVP=mul(ortho(-10,10,-8,8,.1,35),look([-6,18,10],[0,0,0]));
    gl.enable(gl.DEPTH_TEST);gl.viewport(0,0,2048,2048);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(shadowProgram);gl.uniformMatrix4fv(gl.getUniformLocation(shadowProgram,'vp'),false,lightVP);gl.drawArrays(gl.TRIANGLES,0,count);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    // Locally drawn labels describe the exhibits; they contain no invented scores or candidate data.
    const atlas=document.createElement('canvas');atlas.width=1024;atlas.height=1536;
    const ctx=atlas.getContext('2d');
    if(!ctx)throw new Error('Display artwork unavailable');
    function text(value,x,y,size=24,color='#d9e9e0'){ctx.font=size+'px Arial';ctx.fillStyle=color;ctx.fillText(value,x,y);}
    for(let slot=0;slot<3;slot++){
      ctx.save();ctx.translate(0,slot*512);ctx.fillStyle='#0b211b';ctx.fillRect(0,0,1024,512);
      ctx.fillStyle='#1c493c';ctx.fillRect(0,0,1024,7);
      text(['PRACTICE / A MOMENT AT WORK','COLLEGE / THE COHORT VIEW','EMPLOYER / CANDIDATE PASSPORT'][slot],45,55,19,'#71cfac');
      text(['A customer needs your help.','See the cohort. Support the student.','Open the evidence behind readiness.'][slot],45,116,36);
      if(slot===0){text('“Our team cannot log in. We present in an hour.”',45,177,25);text('How would you respond?',45,239,28);const names=['Understand the task','Develop your response','Learn from feedback'];for(let i=0;i<3;i++){ctx.fillStyle='#17382d';ctx.fillRect(45+i*310,290,285,115);text(names[i],64+i*310,369,21);}}
      if(slot===1){const names=['Role readiness','Practice gaps','Not yet assessed'];for(let i=0;i<3;i++){ctx.fillStyle='#17382d';ctx.fillRect(45+i*310,168,285,220);text(names[i],64+i*310,206,23);for(let j=0;j<3;j++){ctx.fillStyle='#2b4e41';ctx.fillRect(66+i*310,234+j*43,242,27);}}}
      if(slot===2){const names=['THE TASK','THE RESPONSE','THE ASSESSMENT'];const lines=['What was asked','How they approached it','Criteria and feedback'];for(let i=0;i<3;i++){ctx.fillStyle='#17382d';ctx.fillRect(45,157+i*79,934,66);text(names[i],65,198+i*79,20,'#71cfac');text(lines[i],360,198+i*79,24);}}
      text(slot===0?'Illustrative task • No score assigned':'Planned capability • Illustrative view',45,472,19,'#92afa0');ctx.restore();
    }
    const artwork=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,artwork);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const uniforms={};for(const key of ['vp','lightVP','eye','shadowMap','artwork','clock','networkView'])uniforms[key]=gl.getUniformLocation(mainProgram,key);
    let last=0,frame=0,elapsed=0;
    function draw(now=0){const dt=Math.min((now-last)/1000,.05);last=now;if(!paused){elapsed+=dt;orbit+=dt*.15;cameraX+=([-3.8,0,3.8][audience]-cameraX)*(1-Math.exp(-dt*3));}
      const r=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio,1.5);const w=Math.max(1,Math.round(r.width*ratio)),h=Math.max(1,Math.round(r.height*ratio));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      const sway=paused?0:Math.sin(orbit)*.28+pointerX*.9;const mobile=innerWidth<761;
      let eye,target;
      if(view==='walkthrough'){
        // A slow dolly toward the selected workspace at human eye level.
        const approach=(1-Math.cos(elapsed*.30))*.5;
        eye=[cameraX+.65+Math.sin(elapsed*.18)*.30+(paused?0:pointerX*.20),2.65+(paused?0:pointerY*.15),7.7-approach*1.5];
        target=[cameraX,1.48,-.5];
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
      gl.viewport(0,0,w,h);gl.clearColor(.02745,.07451,.06275,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(mainProgram);gl.uniformMatrix4fv(uniforms.vp,false,mul(perspective(w/h),look(eye,target)));gl.uniformMatrix4fv(uniforms.lightVP,false,lightVP);gl.uniform3fv(uniforms.eye,eye);gl.uniform1f(uniforms.clock,elapsed);gl.uniform1f(uniforms.networkView,1);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,depth);gl.uniform1i(uniforms.shadowMap,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,artwork);gl.uniform1i(uniforms.artwork,1);gl.drawArrays(gl.TRIANGLES,0,count);
      frame=0;if(!paused&&!document.hidden)frame=requestAnimationFrame(draw);
    }
    renderOnce=()=>{if(!frame)frame=requestAnimationFrame(draw);};
    const resize = new ResizeObserver(renderOnce);resize.observe(canvas);cleanup.push(()=>resize.disconnect(),()=>cancelAnimationFrame(frame));listen(document, 'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{last=performance.now();renderOnce();}});
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');listen(reduced, 'change',e=>{paused=e.matches;renderOnce();});
    listen(canvas, 'webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);$('fallback').style.display='block';});
    cleanup.push(()=>{gl.deleteBuffer(buffer);gl.deleteVertexArray(vao);gl.deleteTexture(depth);gl.deleteTexture(artwork);gl.deleteFramebuffer(fb);gl.deleteProgram(mainProgram);gl.deleteProgram(shadowProgram);});
    renderOnce();
  } catch(error) { console.error('ASCEND 3D preview:',error);$('fallback').style.display='block'; }
  return dispose;
}
