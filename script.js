/* ── CURSOR ── */
const cur = document.getElementById('cur');
const ring = document.getElementById('cur-ring');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;});
(function animCursor(){
  rx+=(mx-rx)*.18; ry+=(my-ry)*.18;
  cur.style.left=mx+'px'; cur.style.top=my+'px';
  ring.style.left=rx+'px'; ring.style.top=ry+'px';
  requestAnimationFrame(animCursor);
})();
document.querySelectorAll('a,button,.tilt-card,.sd').forEach(el=>{
  el.addEventListener('mouseenter',()=>{ring.style.width='52px';ring.style.height='52px';ring.style.opacity='.4';});
  el.addEventListener('mouseleave',()=>{ring.style.width='32px';ring.style.height='32px';ring.style.opacity='1';});
});

/* ── SCROLL PROGRESS ── */
const prog = document.getElementById('prog');
window.addEventListener('scroll',()=>{
  const h=document.documentElement;
  prog.style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+'%';
  document.getElementById('main-nav').classList.toggle('scrolled',h.scrollTop>20);
});

/* ════════════════════════════════════════════════
   ROCKET DESCENT TIMELINE SCROLL ENGINE
════════════════════════════════════════════════ */
const projectBlocks = document.querySelectorAll('.project-block');
const timelineFill  = document.getElementById('timeline-fill');
const wrapper       = document.getElementById('projects-scroll-wrapper');
const rocket        = document.getElementById('timeline-rocket');

// Track which blocks were previously active to fire sparks only once per activation
const prevActive = new Set();

// Tiny floating particle trail behind the descending rocket
function burstParticles(dotEl) {
  const rect = dotEl.getBoundingClientRect();
  const wRect = wrapper.getBoundingClientRect();
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'proj-particle';
    const angle = (i / 8) * Math.PI * 2;
    const radius = 18 + Math.random() * 20;
    const cx = rect.left + rect.width/2 - wRect.left + Math.cos(angle)*radius;
    const cy = rect.top  + rect.height/2 - wRect.top  + Math.sin(angle)*radius;
    p.style.cssText = `left:${cx}px;top:${cy}px;position:absolute;width:${3+Math.random()*4}px;height:${3+Math.random()*4}px;`;
    wrapper.appendChild(p);
    setTimeout(()=>{
      p.classList.add('rise');
      setTimeout(()=>p.remove(), 1400);
    }, i * 60);
  }
}

// Spark ring pulse on the dot
function fireSpark(block) {
  const spark = block.querySelector('.dot-spark');
  if (!spark) return;
  spark.classList.remove('fire');
  void spark.offsetWidth; // reflow to restart
  spark.classList.add('fire');
}

function updateTimeline() {
  if (!wrapper || !rocket) return;

  const wRect   = wrapper.getBoundingClientRect();
  const wTop    = wRect.top;
  const wHeight = wRect.height;
  const viewMid = window.innerHeight / 2;

  // Progress 0→1 as we scroll through the wrapper — rocket descends from top to bottom
  const progress = Math.min(Math.max((-wTop + viewMid) / wHeight, 0), 1);
  timelineFill.style.height = (progress * 100) + '%';

  const rocketTopPx = progress * wHeight;
  rocket.style.top = rocketTopPx + 'px';

  // Activate project blocks
  projectBlocks.forEach((block, i) => {
    const dot = block.querySelector('.timeline-dot-inner');
    if (!dot) return;
    const dRect = dot.getBoundingClientRect();
    const dotCenter = dRect.top + dRect.height / 2;
    const triggerPt = window.innerHeight * 0.56;

    const shouldBeActive = dotCenter < triggerPt && dotCenter > -50;

    if (shouldBeActive && !prevActive.has(i)) {
      block.classList.add('active');
      prevActive.add(i);
      fireSpark(block);
      burstParticles(dot);
    } else if (!shouldBeActive && prevActive.has(i)) {
      block.classList.remove('active');
      prevActive.delete(i);
    } else if (shouldBeActive) {
      block.classList.add('active');
    }
  });
}

window.addEventListener('scroll', updateTimeline, { passive: true });
window.addEventListener('resize', updateTimeline);
updateTimeline();

/* ── THREE.JS 3D BACKGROUND ── */
const threeScript = document.createElement('script');
threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
threeScript.onload = initThree;
document.head.appendChild(threeScript);

function initThree() {
  const canvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000,0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 300);
  camera.position.z = 42;
  const PX_TO_WORLD = 0.022;
  function getPageWorldHeight(){
    return Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)*PX_TO_WORLD;
  }
  const matO = new THREE.MeshBasicMaterial({color:0xD9480F,wireframe:true,transparent:true,opacity:0.20});
  const matI = new THREE.MeshBasicMaterial({color:0x3D3DB8,wireframe:true,transparent:true,opacity:0.14});
  const matS = new THREE.MeshBasicMaterial({color:0xB8862E,wireframe:true,transparent:true,opacity:0.13});
  const geoPool = [
    new THREE.IcosahedronGeometry(1,0), new THREE.OctahedronGeometry(1,0),
    new THREE.TetrahedronGeometry(1,0), new THREE.BoxGeometry(1.3,1.3,1.3),
    new THREE.OctahedronGeometry(1,1),
  ];
  const matPool = [matO,matO,matI,matS,matI];
  const shapes=[]; let particleMesh=null;
  function buildScene(){
    shapes.forEach(s=>scene.remove(s)); shapes.length=0;
    if(particleMesh) scene.remove(particleMesh);
    const worldH = getPageWorldHeight();
    for(let i=0;i<70;i++){
      const gi=i%geoPool.length;
      const mesh=new THREE.Mesh(geoPool[gi],matPool[gi]);
      const sc=1.0+Math.random()*4.2; mesh.scale.setScalar(sc);
      mesh.position.set((Math.random()-.5)*115,-(Math.random()*worldH),(Math.random()-.5)*55);
      mesh.userData={rx:(Math.random()-.5)*.005,ry:(Math.random()-.5)*.005,rz:(Math.random()-.5)*.003,
        floatAmp:.3+Math.random()*1,floatOffset:Math.random()*Math.PI*2,initY:mesh.position.y,burst:1};
      scene.add(mesh); shapes.push(mesh);
    }
    const PC=600; const pos=new Float32Array(PC*3);
    for(let i=0;i<PC;i++){pos[i*3]=(Math.random()-.5)*130;pos[i*3+1]=-(Math.random()*worldH);pos[i*3+2]=(Math.random()-.5)*70;}
    const pGeo=new THREE.BufferGeometry();
    pGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    particleMesh=new THREE.Points(pGeo,new THREE.PointsMaterial({color:0xC2B299,size:.21,transparent:true,opacity:.50}));
    scene.add(particleMesh);
  }
  buildScene();
  let isTabVisible=true, targetCamY=0, currentCamY=0, mouseX=0, clock=0;
  window.addEventListener('scroll',()=>{targetCamY=-window.scrollY*PX_TO_WORLD;});
  document.addEventListener('visibilitychange',()=>{
    isTabVisible=!document.hidden;
    if(isTabVisible) shapes.forEach(s=>{s.userData.burst=7;});
  });
  let resizeTimer;
  window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
    clearTimeout(resizeTimer); resizeTimer=setTimeout(buildScene,300);
  });
  document.addEventListener('mousemove',e=>{mouseX=(e.clientX/window.innerWidth-.5)*2;});
  function animate(){
    requestAnimationFrame(animate);
    if(!isTabVisible) return;
    clock+=.016;
    currentCamY+=(targetCamY-currentCamY)*.06;
    camera.position.y=currentCamY;
    camera.position.x+=(mouseX*3.5-camera.position.x)*.03;
    shapes.forEach(s=>{
      const u=s.userData,b=Math.max(u.burst,1);
      s.rotation.x+=u.rx*b; s.rotation.y+=u.ry*b; s.rotation.z+=u.rz*b;
      s.position.y=u.initY+Math.sin(clock*.55+u.floatOffset)*u.floatAmp;
      if(u.burst>1) u.burst-=.10;
    });
    renderer.render(scene,camera);
  }
  animate();
}

/* ── SIDE DOTS ── */
const sections=['hero','about','skills','experience','featured','projects','achievements','certifications','education','contact'];
const dots=document.querySelectorAll('.sd');
dots.forEach(d=>{
  d.addEventListener('click',()=>{
    const t=document.getElementById(d.dataset.t);
    if(t) t.scrollIntoView({behavior:'smooth'});
  });
});
const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){const id=e.target.id;dots.forEach(d=>d.classList.toggle('on',d.dataset.t===id));}
  });
},{threshold:.3});
sections.forEach(id=>{const el=document.getElementById(id);if(el) obs.observe(el);});

/* ── REVEAL ── */
const rvObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('vis');rvObs.unobserve(e.target);}});
},{threshold:.12,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.rv').forEach(el=>rvObs.observe(el));

/* ── COUNTERS ── */
function animateCounter(el,to,duration){
  const start=performance.now();
  function step(now){
    const p=Math.min((now-start)/duration,1);
    const ease=1-Math.pow(1-p,3);
    el.textContent=Math.floor(ease*to);
    if(p<1) requestAnimationFrame(step); else el.textContent=to;
  }
  requestAnimationFrame(step);
}
const counterObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.querySelectorAll('.counter').forEach(el=>animateCounter(el,+el.dataset.to,1600));
      counterObs.unobserve(e.target);
    }
  });
},{threshold:.2});
document.querySelectorAll('#hero,#achievements').forEach(el=>counterObs.observe(el));

/* ── TILT ── */
document.querySelectorAll('.tilt-card').forEach(card=>{
  card.addEventListener('mousemove',e=>{
    const r=card.getBoundingClientRect();
    const x=(e.clientX-r.left-r.width/2)/r.width;
    const y=(e.clientY-r.top-r.height/2)/r.height;
    card.style.transform=`perspective(700px) rotateY(${x*6}deg) rotateX(${-y*6}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave',()=>{card.style.transform='';});
});
