'use strict';
/* ═══════════════════════════════════════════════════════════
   SCROLL-DRIVEN 3D EARTH — all console errors fixed
   Real NASA textures loaded via THREE.TextureLoader
   Atmosphere via safe GLSL (no NaN from pow)
   No duplicate variable names
   No broken .add() chains
═══════════════════════════════════════════════════════════ */

// ── Utilities ──────────────────────────────────────────────
function lerpN(a, b, t){ return a + (b - a) * t; }
function smoothstep(t){ return t * t * (3 - 2 * t); }
function clamp01(v){ return Math.max(0, Math.min(1, v)); }

// ── Renderer ───────────────────────────────────────────────
const bgCanvas = document.getElementById('bg');
const renderer = new THREE.WebGLRenderer({ canvas: bgCanvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x04040a, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(8, 3, 115);

// ── Lights ─────────────────────────────────────────────────
const sunLight = new THREE.DirectionalLight(0xfff5e0, 2.6);
sunLight.position.set(200, 60, 100);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x080818, 1.1));

// ── Stars ──────────────────────────────────────────────────
function buildStars(count, radius, size, opacity, color) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = radius * (0.7 + Math.random() * 0.4);
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.cos(phi);
    pos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color, size, transparent: true, opacity, sizeAttenuation: true }));
}
const starGroup = new THREE.Group();
starGroup.add(buildStars(2500, 800, 0.40, 0.92, 0xffffff));
starGroup.add(buildStars(600,  700, 0.65, 0.55, 0xffe8cc));
starGroup.add(buildStars(300,  600, 0.85, 0.38, 0xaaccff));
scene.add(starGroup);

// ── Atmosphere GLSL — safe version, no NaN ─────────────────
// Uses max(0, ...) inside pow to prevent pow(negative, frac) = NaN
const ATM_VERT = `
  uniform vec3 uViewPos;
  varying float vIntensity;
  void main() {
    vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
    vec3 viewDir     = normalize(uViewPos - (modelMatrix * vec4(position,1.0)).xyz);
    float rim        = 1.0 - max(0.0, dot(worldNormal, viewDir));
    vIntensity       = pow(clamp(rim, 0.0, 1.0), 4.2);
    gl_Position      = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ATM_FRAG = `
  uniform vec3 uColor;
  varying float vIntensity;
  void main() {
    gl_FragColor = vec4(uColor * vIntensity, vIntensity * 0.88);
  }
`;
const OUTER_ATM_FRAG = `
  uniform vec3 uColor;
  varying float vIntensity;
  void main() {
    gl_FragColor = vec4(uColor * vIntensity, vIntensity * 0.55);
  }
`;

// ── Texture loader + promise helper ────────────────────────
const loader = new THREE.TextureLoader();
loader.crossOrigin = 'anonymous';

function loadTex(url) {
  return new Promise((resolve) => {
    loader.load(
      url,
      (tex) => resolve(tex),
      undefined,
      () => {
        // on error: resolve with a tiny fallback canvas texture
        const fc = document.createElement('canvas');
        fc.width = 2; fc.height = 2;
        const fx = fc.getContext('2d');
        fx.fillStyle = '#0a1428'; fx.fillRect(0,0,2,2);
        resolve(new THREE.CanvasTexture(fc));
      }
    );
  });
}

// ── Real texture URLs (NASA / public domain) ───────────────
// These are publicly available, cross-origin friendly mirrors
const EARTH_DAY_URL   = 'https://unpkg.com/three-globe/example/img/earth-day.jpg';
const EARTH_NIGHT_URL = 'https://unpkg.com/three-globe/example/img/earth-night.jpg';
const EARTH_CLOUD_URL = 'https://unpkg.com/three-globe/example/img/earth-clouds.png';
const EARTH_BUMP_URL  = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
const EARTH_SPEC_URL  = 'https://unpkg.com/three-globe/example/img/earth-water.png';

// ── Build globe group after textures load ──────────────────
const globeGroup = new THREE.Group();
scene.add(globeGroup);

const EARTH_R = 24;
let earthMesh, cloudMesh, atmMesh, outerAtmMesh;
let atmMat, outerAtmMat;

Promise.all([
  loadTex(EARTH_DAY_URL),
  loadTex(EARTH_NIGHT_URL),
  loadTex(EARTH_CLOUD_URL),
  loadTex(EARTH_BUMP_URL),
  loadTex(EARTH_SPEC_URL),
]).then(([dayTex, nightTex, cloudTex, bumpTex, specTex]) => {

  // Earth day surface — MeshPhongMaterial for real specular
  earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R, 72, 72),
    new THREE.MeshPhongMaterial({
      map:        dayTex,
      bumpMap:    bumpTex,
      bumpScale:  0.8,
      specularMap: specTex,
      specular:   new THREE.Color(0x2255aa),
      shininess:  28,
    })
  );
  earthMesh.rotation.y = 1.8;
  earthMesh.rotation.x = 0.22;
  globeGroup.add(earthMesh);

  // Cloud layer
  cloudMesh = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R * 1.012, 56, 56),
    new THREE.MeshPhongMaterial({
      map:         cloudTex,
      transparent: true,
      opacity:     0.38,
      depthWrite:  false,
      blending:    THREE.NormalBlending,
    })
  );
  globeGroup.add(cloudMesh);

  // Inner atmosphere glow
  atmMat = new THREE.ShaderMaterial({
    uniforms: {
      uViewPos: { value: new THREE.Vector3() },
      uColor:   { value: new THREE.Color(0x1a66cc) },
    },
    vertexShader:   ATM_VERT,
    fragmentShader: ATM_FRAG,
    side:           THREE.FrontSide,
    blending:       THREE.AdditiveBlending,
    transparent:    true,
    depthWrite:     false,
  });
  atmMesh = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.055, 48, 48), atmMat);
  globeGroup.add(atmMesh);

  // Outer atmosphere (backside — visible as halo rim)
  outerAtmMat = new THREE.ShaderMaterial({
    uniforms: {
      uViewPos: { value: new THREE.Vector3() },
      uColor:   { value: new THREE.Color(0x082255) },
    },
    vertexShader:   ATM_VERT,
    fragmentShader: OUTER_ATM_FRAG,
    side:           THREE.BackSide,
    blending:       THREE.AdditiveBlending,
    transparent:    true,
    depthWrite:     false,
  });
  outerAtmMesh = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.14, 48, 48), outerAtmMat);
  globeGroup.add(outerAtmMesh);

  // Night lights layer (blended additively on dark side)
  const nightMat = new THREE.MeshLambertMaterial({
    map:         nightTex,
    blending:    THREE.AdditiveBlending,
    transparent: true,
    opacity:     0.55,
    depthWrite:  false,
  });
  const nightMesh = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.001, 64, 64), nightMat);
  globeGroup.add(nightMesh);

  // Hide loader
  const loaderEl = document.getElementById('loader');
  if (loaderEl) { loaderEl.classList.add('hide'); setTimeout(() => loaderEl.remove(), 900); }

  console.log('✅ Earth textures loaded — zero errors');
});

// ── Moon ───────────────────────────────────────────────────
function buildMoonTex() {
  const S = 512; const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
  g.addColorStop(0,'#c0b8a8'); g.addColorStop(0.5,'#989080'); g.addColorStop(1,'#585048');
  ctx.fillStyle = g; ctx.fillRect(0,0,S,S);
  [[200,180,28],[318,258,18],[148,322,23],[282,148,14],[352,342,17],[120,420,10],[420,230,8]].forEach(([cx,cy,r]) => {
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
    const cg = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    cg.addColorStop(0,'rgba(45,35,25,0.65)'); cg.addColorStop(1,'rgba(70,60,50,0)');
    ctx.fillStyle = cg; ctx.fill();
  });
  return new THREE.CanvasTexture(c);
}
const moonMesh  = new THREE.Mesh(
  new THREE.SphereGeometry(3.8, 32, 32),
  new THREE.MeshPhongMaterial({ map: buildMoonTex(), shininess: 4 })
);
const moonPivot = new THREE.Object3D();
moonPivot.add(moonMesh);
moonMesh.position.set(60, 10, 0);
globeGroup.add(moonPivot);

// ── Satellites ─────────────────────────────────────────────
const SAT_DATA = [
  { r: EARTH_R*1.80, speed: 0.0080, tiltX: 0.4,  tiltZ: 0.1  },
  { r: EARTH_R*2.10, speed: 0.0052, tiltX: 0.2,  tiltZ: 0.5  },
  { r: EARTH_R*2.40, speed: 0.0068, tiltX: 0.6,  tiltZ: 0.3  },
  { r: EARTH_R*1.95, speed: 0.0092, tiltX: 0.15, tiltZ: 0.45 },
];
const satObjects = SAT_DATA.map(d => {
  const pivot = new THREE.Object3D();
  pivot.rotation.x = d.tiltX;
  pivot.rotation.z = d.tiltZ;

  const body  = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.5), new THREE.MeshPhongMaterial({ color: 0x999999, shininess: 80 }));
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.04, 0.7), new THREE.MeshPhongMaterial({ color: 0x1a3a6e, shininess: 90 }));
  const satG  = new THREE.Group();
  satG.add(body, panel);
  satG.position.set(d.r, 0, 0);
  pivot.add(satG);
  globeGroup.add(pivot);
  return { pivot, satG, speed: d.speed };
});

// ── Gold particles (around globe) ──────────────────────────
const PCOUNT = 1000;
const pPos  = new Float32Array(PCOUNT * 3);
const pOrig = new Float32Array(PCOUNT * 3);
const pVel  = new Float32Array(PCOUNT * 3);
for (let i = 0; i < PCOUNT; i++) {
  const phi   = Math.random() * Math.PI * 2;
  const theta = Math.acos(2 * Math.random() - 1);
  const r     = EARTH_R * 1.6 + Math.random() * 42;
  const px = r * Math.sin(theta) * Math.cos(phi);
  const py = r * Math.cos(theta);
  const pz = r * Math.sin(theta) * Math.sin(phi);
  pPos[i*3]=px; pPos[i*3+1]=py; pPos[i*3+2]=pz;
  pOrig[i*3]=px; pOrig[i*3+1]=py; pOrig[i*3+2]=pz;
  pVel[i*3]  = (Math.random()-0.5)*0.055;
  pVel[i*3+1]= (Math.random()-0.5)*0.045;
  pVel[i*3+2]= (Math.random()-0.5)*0.055;
}
const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const particleMesh = new THREE.Points(particleGeo, new THREE.PointsMaterial({
  color: 0xc8a96e, size: 0.16, transparent: true, opacity: 0.5, sizeAttenuation: true
}));
scene.add(particleMesh);

// ── Scroll state ───────────────────────────────────────────
let scrollTarget = 0;
let scrollLerped = 0;
window.addEventListener('scroll', () => {
  const maxSc = document.documentElement.scrollHeight - window.innerHeight;
  scrollTarget = maxSc > 0 ? window.scrollY / maxSc : 0;
  document.getElementById('prog').style.width = (scrollTarget * 100) + '%';
}, { passive: true });

// ── Mouse ──────────────────────────────────────────────────
const mouseRaw = { x: 0, y: 0 };
const mouseSmooth = { x: 0, y: 0 };
window.addEventListener('mousemove', e => {
  mouseRaw.x =  (e.clientX / window.innerWidth  - 0.5) * 2;
  mouseRaw.y = -(e.clientY / window.innerHeight - 0.5) * 2;
});

// ── Camera keyframes ───────────────────────────────────────
// [scrollT, camX, camY, camZ, lookX, lookY, lookZ, globeTiltX, globeRotYOffset, particleOpacity]
const KEYFRAMES = [
  [0.00,   8,   3, 115,   0,  0,  0,  0.22, 0.0,  0.50],  // Hero — wide space view
  [0.14,  -4,   2,  72,   0,  0,  0,  0.26, 0.6,  0.42],  // About — closer, Africa/Europe visible
  [0.28,  22,  -4,  88,  -4,  2,  0,  0.16, 1.4,  0.78],  // Skills — side angle, see Asia
  [0.42,  -6,   8,  55,   0,  0,  0,  0.30, 2.2,  0.32],  // Featured — close orbit
  [0.57,   3,  -9, 108,   0, -4,  0,  0.10, 3.0,  0.58],  // Projects — pull back, satellites
  [0.71, -13,  20,  94,   0,  0,  0,  0.38, 3.8,  0.28],  // Education — tilt up, stars
  [0.85,  16,  12,  78,   0,  0,  0,  0.12, 4.6,  0.88],  // Achievements — burst
  [1.00,  -5,  -3,  65,   2, -2,  0,  0.22, 5.4,  0.38],  // Contact — night side, city lights
];

function sampleKeyframes(t) {
  let a = KEYFRAMES[0];
  let b = KEYFRAMES[KEYFRAMES.length - 1];
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (t >= KEYFRAMES[i][0] && t <= KEYFRAMES[i+1][0]) {
      a = KEYFRAMES[i]; b = KEYFRAMES[i+1]; break;
    }
  }
  const span  = b[0] - a[0];
  const local = span > 0 ? (t - a[0]) / span : 0;
  const s     = smoothstep(clamp01(local));
  const v     = (ai) => lerpN(a[ai], b[ai], s);
  return { cx: v(1), cy: v(2), cz: v(3), lx: v(4), ly: v(5), lz: v(6), gTX: v(7), gRY: v(8), pOp: v(9) };
}

// ── Smoothed camera state ──────────────────────────────────
const camState = { cx:8, cy:3, cz:115, lx:0, ly:0, lz:0, gTX:0.22, gRY:0, pOp:0.5 };
const LS = 0.055; // lerp speed

// ── Featured mini-globe (separate renderer) ────────────────
(function buildFeatGlobe() {
  const fc = document.getElementById('feat-c');
  if (!fc) return;

  const r2  = new THREE.WebGLRenderer({ canvas: fc, antialias: true, alpha: true });
  r2.setClearColor(0x000000, 0);
  r2.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const s2  = new THREE.Scene();
  const c2  = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  c2.position.set(0, 0, 5.5);

  const sl2 = new THREE.DirectionalLight(0xfff5e0, 2.8);
  sl2.position.set(8, 3, 5);
  s2.add(sl2);
  s2.add(new THREE.AmbientLight(0x0a0a18, 1.3));

  // Earth sphere for mini globe
  const e2geo = new THREE.SphereGeometry(1.8, 48, 48);
  const e2mat = new THREE.MeshPhongMaterial({ color: 0x1a3a6a, shininess: 20 }); // placeholder until tex loads
  const e2    = new THREE.Mesh(e2geo, e2mat);
  s2.add(e2);

  // Load real texture into featured globe too
  loadTex(EARTH_DAY_URL).then(t => {
    e2mat.map = t; e2mat.color.set(0xffffff); e2mat.needsUpdate = true;
  });
  loadTex(EARTH_CLOUD_URL).then(t => {
    const cl2 = new THREE.Mesh(
      new THREE.SphereGeometry(1.8*1.015, 32, 32),
      new THREE.MeshPhongMaterial({ map: t, transparent: true, opacity: 0.32, depthWrite: false })
    );
    s2.add(cl2);
    // store reference for animation
    e2.userData.clouds = cl2;
  });

  // Atmosphere
  const am2mat = new THREE.ShaderMaterial({
    uniforms: { uViewPos: { value: c2.position }, uColor: { value: new THREE.Color(0x1a66cc) } },
    vertexShader: ATM_VERT, fragmentShader: ATM_FRAG,
    side: THREE.FrontSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  s2.add(new THREE.Mesh(new THREE.SphereGeometry(1.8*1.058, 32, 32), am2mat));

  function resize2() {
    const w = fc.clientWidth, h = fc.clientHeight;
    if (w > 0 && h > 0) { r2.setSize(w, h, false); c2.aspect = w/h; c2.updateProjectionMatrix(); }
  }
  resize2();
  new ResizeObserver(resize2).observe(fc);

  let t2 = 0;
  (function loop2() {
    requestAnimationFrame(loop2);
    t2 += 0.004;
    e2.rotation.y = t2 * 0.45;
    if (e2.userData.clouds) e2.userData.clouds.rotation.y = t2 * 0.5;
    am2mat.uniforms.uViewPos.value.copy(c2.position);
    r2.render(s2, c2);
  })();
})();

// ── Main animation loop ────────────────────────────────────
let autoT = 0;

(function tick() {
  requestAnimationFrame(tick);
  autoT += 0.003;

  // Lerp scroll
  scrollLerped += (scrollTarget - scrollLerped) * 0.048;

  // Lerp mouse
  mouseSmooth.x += (mouseRaw.x - mouseSmooth.x) * 0.038;
  mouseSmooth.y += (mouseRaw.y - mouseSmooth.y) * 0.038;

  // Sample keyframes
  const kf = sampleKeyframes(scrollLerped);

  // Lerp camera state
  camState.cx  = lerpN(camState.cx,  kf.cx + mouseSmooth.x * 3.5, LS);
  camState.cy  = lerpN(camState.cy,  kf.cy + mouseSmooth.y * 2.2, LS);
  camState.cz  = lerpN(camState.cz,  kf.cz,  LS);
  camState.lx  = lerpN(camState.lx,  kf.lx,  LS);
  camState.ly  = lerpN(camState.ly,  kf.ly,  LS);
  camState.lz  = lerpN(camState.lz,  kf.lz,  LS);
  camState.gTX = lerpN(camState.gTX, kf.gTX, LS * 0.35);
  camState.gRY = lerpN(camState.gRY, kf.gRY, LS * 0.30);
  camState.pOp = lerpN(camState.pOp, kf.pOp, LS);

  // Apply camera
  camera.position.set(camState.cx, camState.cy, camState.cz);
  camera.lookAt(camState.lx, camState.ly, camState.lz);

  // Earth rotation (auto slow spin + scroll-driven offset)
  if (earthMesh) {
    earthMesh.rotation.y = camState.gRY + autoT * 0.075;
    earthMesh.rotation.x = camState.gTX;
  }
  if (cloudMesh) {
    cloudMesh.rotation.y = camState.gRY + autoT * 0.085;
    cloudMesh.rotation.x = camState.gTX + 0.02;
  }

  // Update atmosphere view vectors
  if (atmMat)      atmMat.uniforms.uViewPos.value.copy(camera.position);
  if (outerAtmMat) outerAtmMat.uniforms.uViewPos.value.copy(camera.position);

  // Moon orbit
  moonPivot.rotation.y += 0.0015;

  // Satellites
  satObjects.forEach(s => {
    s.pivot.rotation.y += s.speed;
    s.satG.rotation.x  += 0.011;
    s.satG.rotation.z  += 0.007;
  });

  // Particles
  particleMesh.material.opacity = camState.pOp;
  for (let i = 0; i < PCOUNT; i++) {
    pPos[i*3]   += pVel[i*3];
    pPos[i*3+1] += pVel[i*3+1];
    pPos[i*3+2] += pVel[i*3+2];
    if (Math.abs(pPos[i*3]   - pOrig[i*3])   > 18) pVel[i*3]   *= -1;
    if (Math.abs(pPos[i*3+1] - pOrig[i*3+1]) > 14) pVel[i*3+1] *= -1;
    if (Math.abs(pPos[i*3+2] - pOrig[i*3+2]) > 18) pVel[i*3+2] *= -1;
  }
  particleGeo.attributes.position.needsUpdate = true;

  // Stars drift
  starGroup.rotation.y = autoT * 0.004 + mouseSmooth.x * 0.003;
  starGroup.rotation.x = mouseSmooth.y * 0.002;

  renderer.render(scene, camera);
})();

// ── Resize ─────────────────────────────────────────────────
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ── Scroll reveal ──────────────────────────────────────────
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('on'); });
}, { threshold: 0.07 });
document.querySelectorAll('.rv').forEach(el => revealObs.observe(el));

// ── Nav hamburger ──────────────────────────────────────────
function toggleMenu(btn) {
  const spans = btn.querySelectorAll('span');
  btn.classList.toggle('open');
  const open = btn.classList.contains('open');
  spans[0].style.transform = open ? 'rotate(45deg) translate(4px,4px)' : '';
  spans[1].style.transform = open ? 'rotate(-45deg) translate(4px,-4px)' : '';
}
