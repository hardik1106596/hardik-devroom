// ═══════════════════════════════════════════════════════════════════════════════
// MONT-FORT STYLE WEBGL ANIMATED BACKGROUND
// Deep fluid 3D wave surface + volumetric light columns + aurora fog
// ═══════════════════════════════════════════════════════════════════════════════
(function initWebGL(){
  const canvas = document.getElementById('glcanvas');
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setClearColor(0x04050d,1);
  renderer.setSize(innerWidth,innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04050d, 0.018);

  const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 300);
  camera.position.set(0, 14, 32);
  camera.lookAt(0, 0, 0);

  const GRID = 200;
  const SIZE = 90;
  const waveGeo = new THREE.PlaneGeometry(SIZE, SIZE, GRID, GRID);
  waveGeo.rotateX(-Math.PI/2);
  const origPos = Float32Array.from(waveGeo.attributes.position.array);

  const waveMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.FrontSide,
    uniforms:{
      uTime:     {value:0},
      uMouse:    {value:new THREE.Vector2(0,0)},
      uScroll:   {value:0},
      uColorA:   {value:new THREE.Color(0x0a0f3d)},
      uColorB:   {value:new THREE.Color(0x1a1060)},
      uColorC:   {value:new THREE.Color(0x5B6AF0)},
      uColorD:   {value:new THREE.Color(0x06b6d4)},
    },
    vertexShader:`
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uScroll;
      varying float vElevation;
      varying vec2 vUv;
      varying float vFresnel;

      float wave(vec2 p, float freq, float speed, float amp){
        return sin(p.x*freq + uTime*speed) * cos(p.y*freq*0.7 + uTime*speed*0.6) * amp;
      }

      void main(){
        vUv = uv;
        vec3 pos = position;
        float e  = wave(pos.xz, 0.18, 0.55, 1.8);
             e += wave(pos.xz, 0.32, 0.80, 0.9);
             e += wave(pos.xz, 0.55, 1.10, 0.5);
             e += wave(pos.xz, 0.90, 1.40, 0.28);
             e += wave(pos.xz, 1.40, 0.70, 0.14);
        vec2 delta = pos.xz - uMouse * 30.0;
        float dist = length(delta);
        float ripple = sin(dist * 1.2 - uTime * 3.5) * exp(-dist * 0.18) * 1.4;
        e += ripple;
        pos.y = e;
        vElevation = e;
        vec4 mv = modelViewMatrix * vec4(pos,1.0);
        vFresnel = pow(1.0 - abs(normalize(mv.xyz).z), 3.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader:`
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;
      uniform vec3 uColorD;
      uniform float uTime;
      varying float vElevation;
      varying vec2 vUv;
      varying float vFresnel;

      void main(){
        float t = (vElevation + 2.5) / 5.0;
        t = clamp(t, 0.0, 1.0);
        vec3 deep   = mix(uColorA, uColorB, vUv.y);
        vec3 mid    = mix(uColorB, uColorC, smoothstep(0.3,0.7,t));
        vec3 bright = mix(uColorC, uColorD, smoothstep(0.6,1.0,t));
        vec3 col = mix(deep, mid, smoothstep(0.0,0.5,t));
        col = mix(col, bright, smoothstep(0.5,1.0,t));
        float foam = smoothstep(0.75, 1.0, t) * 0.25;
        col += foam * vec3(0.5, 0.6, 1.0);
        col += vFresnel * uColorD * 0.18;
        float shimmer = sin(vUv.x*40.0 + uTime*2.0) * sin(vUv.y*40.0 - uTime*1.5) * 0.04;
        col += shimmer * uColorC;
        float alpha = 0.88 + vFresnel * 0.12;
        gl_FragColor = vec4(col, alpha);
      }
    `
  });

  const wave = new THREE.Mesh(waveGeo, waveMat);
  wave.position.y = -6;
  scene.add(wave);

  const wave2Geo = new THREE.PlaneGeometry(SIZE*1.4, SIZE*1.4, 80, 80);
  wave2Geo.rotateX(-Math.PI/2);
  const wave2Mat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.FrontSide,
    uniforms:{
      uTime:{value:0},
      uColorA:{value:new THREE.Color(0x020412)},
      uColorB:{value:new THREE.Color(0x080c30)},
    },
    vertexShader:`
      uniform float uTime;
      varying float vE;
      varying vec2 vUv;
      float w(vec2 p,float f,float s,float a){return sin(p.x*f+uTime*s)*cos(p.y*f*0.8+uTime*s*0.7)*a;}
      void main(){
        vUv=uv;
        vec3 pos=position;
        pos.y=w(pos.xz,.12,.4,2.2)+w(pos.xz,.22,.55,1.1)+w(pos.xz,.4,.8,.5);
        vE=pos.y;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);
      }
    `,
    fragmentShader:`
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying float vE;varying vec2 vUv;
      void main(){
        float t=clamp((vE+2.5)/5.0,0.0,1.0);
        vec3 c=mix(uColorA,uColorB,t);
        gl_FragColor=vec4(c,0.7);
      }
    `
  });
  const wave2 = new THREE.Mesh(wave2Geo, wave2Mat);
  wave2.position.y = -10;
  scene.add(wave2);

  function makeLightColumn(x, z, colorHex, height, opacity){
    const geo = new THREE.CylinderGeometry(0.04, 2.5, height, 8, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: opacity,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, height/2 - 6, z);
    return mesh;
  }

  const col1 = makeLightColumn(-18, -14, 0x5B6AF0, 50, 0.06);
  const col2 = makeLightColumn(  0,  -8, 0x8B5CF6, 60, 0.05);
  const col3 = makeLightColumn( 20, -18, 0x22d3ee, 45, 0.055);
  const col4 = makeLightColumn(-8,  -22, 0x5B6AF0, 40, 0.04);
  const col5 = makeLightColumn( 12,  -6, 0x8B5CF6, 55, 0.045);
  scene.add(col1,col2,col3,col4,col5);
  const lightCols = [col1,col2,col3,col4,col5];

  const PCNT = 1800;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(PCNT*3);
  const pCol = new Float32Array(PCNT*3);
  const pSz  = new Float32Array(PCNT);
  const C1=new THREE.Color(0x5B6AF0), C2=new THREE.Color(0x8B5CF6), C3=new THREE.Color(0x22d3ee);
  for(let i=0;i<PCNT;i++){
    const i3=i*3;
    pPos[i3]   = (Math.random()-.5)*100;
    pPos[i3+1] = Math.random()*30 - 4;
    pPos[i3+2] = (Math.random()-.5)*100;
    pSz[i] = Math.random()*1.8+.3;
    const r=Math.random(), c = r<.45?C1:r<.72?C2:C3;
    const br=.2+Math.random()*.6;
    pCol[i3]=c.r*br; pCol[i3+1]=c.g*br; pCol[i3+2]=c.b*br;
  }
  pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
  pGeo.setAttribute('color',   new THREE.BufferAttribute(pCol,3));
  pGeo.setAttribute('size',    new THREE.BufferAttribute(pSz,1));
  const pMat = new THREE.ShaderMaterial({
    vertexColors:true, transparent:true, depthWrite:false,
    blending:THREE.AdditiveBlending,
    vertexShader:`
      attribute float size;varying vec3 vC;varying float vA;
      void main(){
        vC=color;
        vec4 mv=modelViewMatrix*vec4(position,1.0);
        gl_PointSize=size*(280.0/-mv.z);
        gl_Position=projectionMatrix*mv;
        vA=smoothstep(55.0,0.0,-mv.z);
      }`,
    fragmentShader:`
      varying vec3 vC;varying float vA;
      void main(){
        float d=length(gl_PointCoord-.5);
        if(d>.5)discard;
        float a=1.0-smoothstep(.1,.5,d);
        gl_FragColor=vec4(vC,a*vA*.7);
      }`
  });
  const pMesh = new THREE.Points(pGeo,pMat);
  scene.add(pMesh);

  function makeAurora(y, z, w, h, color, op){
    const geo = new THREE.PlaneGeometry(w, h, 20, 4);
    const pos = geo.attributes.position.array;
    for(let i=0;i<pos.length;i+=3){
      pos[i+1] += (Math.random()-.5)*h*0.5;
    }
    geo.attributes.position.needsUpdate=true;
    const mat = new THREE.MeshBasicMaterial({
      color, transparent:true, opacity:op, side:THREE.DoubleSide,
      depthWrite:false, blending:THREE.AdditiveBlending
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(0, y, z);
    m.rotation.x = Math.PI * 0.08;
    return m;
  }
  const aur1 = makeAurora(6, -40, 120, 8, 0x2a1b8a, 0.12);
  const aur2 = makeAurora(10, -50, 100, 5, 0x5B6AF0, 0.07);
  const aur3 = makeAurora(14, -60, 80,  3, 0x22d3ee, 0.05);
  scene.add(aur1, aur2, aur3);
  const auroras = [aur1,aur2,aur3];

  let mx=0,my=0,scrollY=0,scrollFrac=0;
  document.addEventListener('mousemove',e=>{mx=(e.clientX/innerWidth-.5)*2;my=(e.clientY/innerHeight-.5)*2;});
  window.addEventListener('scroll',()=>{scrollY=window.scrollY;scrollFrac=scrollY/Math.max(document.body.scrollHeight-innerHeight,1);});

  window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

  let smx=0, smy=0, sScroll=0;
  let t=0;
  function animate(){
    requestAnimationFrame(animate);
    t+=0.008;
    smx += (mx-smx)*0.04;
    smy += (my-smy)*0.04;
    sScroll += (scrollFrac-sScroll)*0.05;
    waveMat.uniforms.uTime.value = t;
    waveMat.uniforms.uMouse.value.set(smx, -smy);
    waveMat.uniforms.uScroll.value = sScroll;
    wave2Mat.uniforms.uTime.value = t*0.7;
    camera.position.x = smx*3.5;
    camera.position.y = 14 + sScroll*10 - smy*2;
    camera.position.z = 32 + sScroll*8;
    camera.lookAt(smx*2, sScroll*4, 0);
    pMesh.rotation.y = t*0.015;
    pMesh.position.y = Math.sin(t*0.3)*0.8;
    lightCols.forEach((c,i)=>{
      c.material.opacity = 0.04 + Math.sin(t*0.8+i*1.3)*0.025;
      c.rotation.y = t*0.05*(i%2===0?1:-1);
    });
    auroras.forEach((a,i)=>{
      a.material.opacity = (0.06+i*0.035) * (0.7+Math.sin(t*0.4+i)*0.3);
      a.position.x = Math.sin(t*0.1+i)*4;
    });
    renderer.render(scene,camera);
  }
  animate();
})();

// ═══════════════════════════════════════════════════════════════
// UI SCRIPTS
// ═══════════════════════════════════════════════════════
const cur=document.getElementById('cur'), ring=document.getElementById('cur-ring');
let cx=0,cy=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{cx=e.clientX;cy=e.clientY;cur.style.left=cx+'px';cur.style.top=cy+'px'});
(function rl(){rx+=(cx-rx)*.1;ry+=(cy-ry)*.1;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(rl)})();
document.querySelectorAll('a,button,.sd,.pcard,.acard,.sk-cat').forEach(el=>{el.addEventListener('mouseenter',()=>{cur.style.cssText+='width:14px;height:14px;background:#fff';ring.style.cssText+='width:46px;height:46px;border-color:rgba(91,106,240,.8)'});el.addEventListener('mouseleave',()=>{cur.style.cssText+='width:8px;height:8px;background:var(--accent)';ring.style.cssText+='width:30px;height:30px;border-color:rgba(91,106,240,.55)'});});
const prog=document.getElementById('prog'), nav=document.getElementById('topnav');
window.addEventListener('scroll',()=>{prog.style.width=(window.scrollY/(document.body.scrollHeight-innerHeight)*100)+'%';nav.classList.toggle('scrolled',window.scrollY>60);});
const rvObs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.08});
document.querySelectorAll('.rv').forEach(el=>rvObs.observe(el));
const secIds=['hero','about','skills','featured','projects','achievements','education','contact'];
const dots=document.querySelectorAll('.sd');
const sdObs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){const id=e.target.id;dots.forEach(d=>d.classList.toggle('active',d.dataset.t===id))}});},{threshold:.3});
secIds.forEach(id=>{const el=document.getElementById(id);if(el)sdObs.observe(el)});
dots.forEach(d=>d.addEventListener('click',()=>document.getElementById(d.dataset.t)?.scrollIntoView({behavior:'smooth'})));
function animInt(el){const to=+el.dataset.to,steps=60;let i=0;const t=setInterval(()=>{i++;el.textContent=Math.round(to*(i/steps));if(i>=steps){el.textContent=to;clearInterval(t)}},22);}
function animFloat(el){const to=+el.dataset.to,steps=60;let i=0;const t=setInterval(()=>{i++;el.textContent=(to*(i/steps)).toFixed(2);if(i>=steps){el.textContent=to;clearInterval(t)}},22);}
const cObs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting&&!e.target._done){e.target._done=1;e.target.classList.contains('countf')?animFloat(e.target):animInt(e.target);}});},{threshold:.5});
document.querySelectorAll('.counter,.countf').forEach(el=>cObs.observe(el));
document.querySelectorAll('.tilt-card').forEach(c=>{c.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect();const rx=-(e.clientY-r.top-r.height/2)/(r.height/2)*8;const ry=(e.clientX-r.left-r.width/2)/(r.width/2)*8;c.style.transition='transform .08s ease';c.style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.025)`;});c.addEventListener('mouseleave',()=>{c.style.transition='transform .55s cubic-bezier(.22,1,.36,1)';c.style.transform='perspective(900px) rotateX(0) rotateY(0) scale(1)';});});
