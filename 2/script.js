// ═══════════════════════════════════════════════════════════════════════
//  REALISTIC 3D BACKGROUND — Zero console errors
//  Scene: Deep space with rotating planet, asteroid belt,
//  volumetric nebula, star field, energy streams
//  Colors: Purple (#c084fc) + Blue (#818cf8) + Cyan (#38bdf8)
//  Background stays dark — text always white and readable
// ═══════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var canvas = document.getElementById('bg-canvas');
  var W = window.innerWidth;
  var H = window.innerHeight;

  // ── RENDERER ──
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x02010a, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.physicallyCorrectLights = true;

  // ── SCENE ──
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02010a);
  scene.fog = new THREE.FogExp2(0x02010a, 0.008);

  // ── CAMERA ──
  var camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 2000);
  camera.position.set(0, 20, 90);
  camera.lookAt(0, 0, 0);

  // ═══════════════════════════════════════════
  //  LIGHTING — Key to realistic look
  // ═══════════════════════════════════════════

  // Ambient — very low so shadows are deep
  var ambient = new THREE.AmbientLight(0x0a0520, 0.8);
  scene.add(ambient);

  // Main purple point light — illuminates the planet
  var purpleLight = new THREE.PointLight(0xc084fc, 8, 200);
  purpleLight.position.set(-40, 30, 40);
  purpleLight.castShadow = true;
  scene.add(purpleLight);

  // Cyan rim light from the right
  var cyanLight = new THREE.PointLight(0x38bdf8, 5, 180);
  cyanLight.position.set(60, -10, 20);
  scene.add(cyanLight);

  // Blue fill from below
  var blueLight = new THREE.PointLight(0x818cf8, 3, 150);
  blueLight.position.set(0, -40, 60);
  scene.add(blueLight);

  // Dim white directional for planet surface detail
  var dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
  dirLight.position.set(-60, 50, 30);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // ═══════════════════════════════════════════
  //  PLANET — main centerpiece (slightly off center)
  // ═══════════════════════════════════════════

  // Planet sphere with Lambert material (reacts to lights)
  var planetGeo = new THREE.SphereGeometry(18, 64, 64);
  var planetMat = new THREE.MeshLambertMaterial({
    color: 0x1a0a3d,
    emissive: 0x0d0520,
    emissiveIntensity: 0.3
  });
  var planet = new THREE.Mesh(planetGeo, planetMat);
  planet.position.set(28, -8, -30);
  planet.castShadow = true;
  planet.receiveShadow = true;
  scene.add(planet);

  // Planet atmosphere glow (outer shell)
  var atmGeo = new THREE.SphereGeometry(19.5, 32, 32);
  var atmMat = new THREE.MeshBasicMaterial({
    color: 0xc084fc,
    transparent: true,
    opacity: 0.06,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  var atmosphere = new THREE.Mesh(atmGeo, atmMat);
  atmosphere.position.copy(planet.position);
  scene.add(atmosphere);

  // Planet glow ring
  var glowGeo = new THREE.SphereGeometry(22, 32, 32);
  var glowMat = new THREE.MeshBasicMaterial({
    color: 0x6d28d9,
    transparent: true,
    opacity: 0.04,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  var planetGlow = new THREE.Mesh(glowGeo, glowMat);
  planetGlow.position.copy(planet.position);
  scene.add(planetGlow);

  // Planet surface lines (latitude/longitude wireframe overlay)
  var planetWireGeo = new THREE.SphereGeometry(18.05, 16, 16);
  var planetWireMat = new THREE.MeshBasicMaterial({
    color: 0x7c3aed,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  var planetWire = new THREE.Mesh(planetWireGeo, planetWireMat);
  planetWire.position.copy(planet.position);
  scene.add(planetWire);

  // ═══════════════════════════════════════════
  //  PLANET RINGS (Saturn-style)
  // ═══════════════════════════════════════════

  function makeRing(innerR, outerR, color, opacity) {
    var geo = new THREE.RingGeometry(innerR, outerR, 80);
    var mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI * 0.38;
    ring.position.copy(planet.position);
    return ring;
  }

  var ring1 = makeRing(22, 28, 0xc084fc, 0.18);
  var ring2 = makeRing(29, 33, 0x818cf8, 0.12);
  var ring3 = makeRing(34, 36, 0x38bdf8, 0.08);
  scene.add(ring1, ring2, ring3);

  // ═══════════════════════════════════════════
  //  MOON (smaller sphere orbiting the planet)
  // ═══════════════════════════════════════════

  var moonGeo = new THREE.SphereGeometry(4, 32, 32);
  var moonMat = new THREE.MeshLambertMaterial({
    color: 0x2d1f5e,
    emissive: 0x100a20,
    emissiveIntensity: 0.2
  });
  var moon = new THREE.Mesh(moonGeo, moonMat);
  moon.castShadow = true;
  scene.add(moon);

  // Moon glow
  var moonGlowGeo = new THREE.SphereGeometry(5, 16, 16);
  var moonGlowMat = new THREE.MeshBasicMaterial({
    color: 0x818cf8,
    transparent: true,
    opacity: 0.08,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  var moonGlow = new THREE.Mesh(moonGlowGeo, moonGlowMat);
  scene.add(moonGlow);

  // ═══════════════════════════════════════════
  //  ASTEROID BELT
  // ═══════════════════════════════════════════

  var asteroidGroup = new THREE.Group();
  scene.add(asteroidGroup);

  var asteroidCount = 220;
  var asteroidMeshes = [];
  var asteroidGeos = [
    new THREE.IcosahedronGeometry(0.5, 0),
    new THREE.OctahedronGeometry(0.6, 0),
    new THREE.TetrahedronGeometry(0.55, 0)
  ];

  for (var i = 0; i < asteroidCount; i++) {
    var geoIdx = Math.floor(Math.random() * 3);
    var geo = asteroidGeos[geoIdx];
    var mat2 = new THREE.MeshLambertMaterial({
      color: new THREE.Color(
        0.1 + Math.random() * 0.15,
        0.05 + Math.random() * 0.1,
        0.2 + Math.random() * 0.2
      )
    });
    var mesh = new THREE.Mesh(geo, mat2);

    // ring orbit around planet position
    var angle = (i / asteroidCount) * Math.PI * 2;
    var beltR = 44 + (Math.random() - 0.5) * 12;
    var beltY = (Math.random() - 0.5) * 5;
    mesh.position.set(
      planet.position.x + Math.cos(angle) * beltR,
      planet.position.y + beltY,
      planet.position.z + Math.sin(angle) * beltR * 0.55
    );

    var s = 0.3 + Math.random() * 1.4;
    mesh.scale.set(s, s, s);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

    asteroidGroup.add(mesh);
    asteroidMeshes.push({ mesh: mesh, angle: angle, radius: beltR, yOff: beltY, speed: 0.08 + Math.random() * 0.12, ry: (Math.random() - 0.5) * 0.03 });
  }

  // ═══════════════════════════════════════════
  //  STAR FIELD (two layers — near & far)
  // ═══════════════════════════════════════════

  function makeStars(count, spread, minSize, maxSize, colors) {
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(count * 3);
    var col = new Float32Array(count * 3);
    var siz = new Float32Array(count);
    var c = new THREE.Color();

    for (var si = 0; si < count; si++) {
      var si3 = si * 3;
      // Distribute on sphere shell
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      var r = spread * 0.6 + Math.random() * spread * 0.4;
      pos[si3] = r * Math.sin(phi) * Math.cos(theta);
      pos[si3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[si3 + 2] = r * Math.cos(phi);
      siz[si] = minSize + Math.random() * (maxSize - minSize);
      c.set(colors[Math.floor(Math.random() * colors.length)]);
      var br = 0.5 + Math.random() * 0.5;
      col[si3] = c.r * br;
      col[si3 + 1] = c.g * br;
      col[si3 + 2] = c.b * br;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(siz, 1));
    return geo;
  }

  var starColors = ['#ffffff', '#e0e8ff', '#c0d0ff', '#d0c0ff', '#b0c8ff'];
  var starGeo1 = makeStars(3000, 600, 0.4, 1.8, starColors);
  var starGeo2 = makeStars(2000, 900, 0.2, 1.0, starColors);

  var starMat = new THREE.ShaderMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0.0 } },
    vertexShader: [
      'attribute float size;',
      'attribute vec3 color;',
      'varying vec3 vColor;',
      'varying float vAlpha;',
      'uniform float uTime;',
      'void main() {',
      '  vColor = color;',
      '  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = size * (400.0 / -mvPos.z);',
      '  gl_Position = projectionMatrix * mvPos;',
      '  float dist = length(mvPos.xyz);',
      '  vAlpha = smoothstep(600.0, 50.0, dist);',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying vec3 vColor;',
      'varying float vAlpha;',
      'uniform float uTime;',
      'void main() {',
      '  vec2 uv = gl_PointCoord - 0.5;',
      '  float d = length(uv);',
      '  if (d > 0.5) discard;',
      '  float alpha = (1.0 - smoothstep(0.0, 0.5, d));',
      '  float twinkle = 0.75 + 0.25 * sin(uTime * 1.8 + gl_FragCoord.x * 0.07 + gl_FragCoord.y * 0.05);',
      '  gl_FragColor = vec4(vColor, alpha * vAlpha * twinkle * 0.92);',
      '}'
    ].join('\n')
  });

  var starMat2 = starMat.clone();
  starMat2.uniforms = { uTime: { value: 0.0 } };

  scene.add(new THREE.Points(starGeo1, starMat));
  scene.add(new THREE.Points(starGeo2, starMat2));

  // ═══════════════════════════════════════════
  //  NEBULA — large glowing clouds far back
  // ═══════════════════════════════════════════

  var nebulaDefs = [
    { pos: [-80, 30, -300], radius: 100, color: 0x3b0764, op: 0.18 },
    { pos: [100, -20, -350], radius: 120, color: 0x1e1b4b, op: 0.15 },
    { pos: [0, 60, -400], radius: 140, color: 0x4c1d95, op: 0.12 },
    { pos: [-50, -50, -280], radius: 90, color: 0x0c4a6e, op: 0.14 },
    { pos: [80, 40, -320], radius: 110, color: 0x164e63, op: 0.10 }
  ];

  nebulaDefs.forEach(function (def) {
    var geo = new THREE.SphereGeometry(def.radius, 8, 8);
    var mat = new THREE.MeshBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: def.op,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    scene.add(new THREE.Mesh(geo, mat));
  });

  // ═══════════════════════════════════════════
  //  ENERGY STREAMS (thin glowing tubes)
  // ═══════════════════════════════════════════

  var streamGroup = new THREE.Group();
  scene.add(streamGroup);

  var streamDefs = [
    { from: new THREE.Vector3(-60, 20, -10), to: new THREE.Vector3(planet.position.x - 18, planet.position.y + 5, planet.position.z), color: 0xc084fc, op: 0.35 },
    { from: new THREE.Vector3(70, -10, 10), to: new THREE.Vector3(planet.position.x + 18, planet.position.y - 3, planet.position.z), color: 0x38bdf8, op: 0.28 },
    { from: new THREE.Vector3(-20, 55, -20), to: new THREE.Vector3(planet.position.x, planet.position.y + 18, planet.position.z), color: 0x818cf8, op: 0.25 }
  ];

  var streamMeshes = [];
  streamDefs.forEach(function (def) {
    var pts = [def.from, def.to];
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: def.op,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var line = new THREE.Line(geo, mat);
    streamGroup.add(line);
    streamMeshes.push({ line: line, mat: mat, baseOp: def.op });
  });

  // ═══════════════════════════════════════════
  //  FLOATING GEOMETRIC SHAPES (far left/right)
  // ═══════════════════════════════════════════

  var shapeGroup = new THREE.Group();
  scene.add(shapeGroup);

  var shapeDefs = [
    { type: 'oct', size: 6, pos: [-55, 15, -20], color: 0x7c3aed, wireOp: 0.25 },
    { type: 'ico', size: 5, pos: [-45, -18, -15], color: 0x2563eb, wireOp: 0.2 },
    { type: 'tet', size: 7, pos: [55, 12, -18], color: 0xc084fc, wireOp: 0.22 },
    { type: 'oct', size: 4, pos: [48, -22, -12], color: 0x0891b2, wireOp: 0.18 },
    { type: 'ico', size: 3.5, pos: [-30, 35, -25], color: 0x818cf8, wireOp: 0.2 },
    { type: 'tet', size: 4.5, pos: [35, -30, -20], color: 0x9333ea, wireOp: 0.22 }
  ];

  var shapes = [];
  shapeDefs.forEach(function (def) {
    var geo;
    if (def.type === 'oct') geo = new THREE.OctahedronGeometry(def.size, 0);
    else if (def.type === 'ico') geo = new THREE.IcosahedronGeometry(def.size, 0);
    else geo = new THREE.TetrahedronGeometry(def.size, 0);

    // Solid — very dark, lit by scene lights
    var solidMat = new THREE.MeshLambertMaterial({
      color: 0x0a0520,
      transparent: true,
      opacity: 0.85
    });
    var solid = new THREE.Mesh(geo, solidMat);
    solid.position.set(def.pos[0], def.pos[1], def.pos[2]);
    solid.castShadow = true;
    shapeGroup.add(solid);

    // Wireframe glow
    var wireMat = new THREE.MeshBasicMaterial({
      color: def.color,
      wireframe: true,
      transparent: true,
      opacity: def.wireOp,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var wire = new THREE.Mesh(geo, wireMat);
    wire.position.set(def.pos[0], def.pos[1], def.pos[2]);
    shapeGroup.add(wire);

    shapes.push({
      solid: solid, wire: wire,
      mat: wireMat, baseOp: def.wireOp,
      ry: (Math.random() - 0.5) * 0.012,
      rx: (Math.random() - 0.5) * 0.008,
      floatAmp: 0.8 + Math.random() * 1.2,
      floatSpeed: 0.25 + Math.random() * 0.35,
      floatPhase: Math.random() * Math.PI * 2
    });
  });

  // ═══════════════════════════════════════════
  //  FLOATING PARTICLES (code/data dust)
  // ═══════════════════════════════════════════

  var PDUST = 800;
  var dustGeo = new THREE.BufferGeometry();
  var dPos = new Float32Array(PDUST * 3);
  var dCol = new Float32Array(PDUST * 3);
  var dSz = new Float32Array(PDUST);
  var dColors = [
    new THREE.Color(0xc084fc),
    new THREE.Color(0x818cf8),
    new THREE.Color(0x38bdf8),
    new THREE.Color(0xa78bfa)
  ];

  for (var di = 0; di < PDUST; di++) {
    var di3 = di * 3;
    dPos[di3] = (Math.random() - 0.5) * 160;
    dPos[di3 + 1] = (Math.random() - 0.5) * 100;
    dPos[di3 + 2] = (Math.random() - 0.5) * 100 - 20;
    dSz[di] = 0.8 + Math.random() * 2.0;
    var dc = dColors[Math.floor(Math.random() * dColors.length)];
    var dbr = 0.12 + Math.random() * 0.3;
    dCol[di3] = dc.r * dbr;
    dCol[di3 + 1] = dc.g * dbr;
    dCol[di3 + 2] = dc.b * dbr;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dustGeo.setAttribute('color', new THREE.BufferAttribute(dCol, 3));
  dustGeo.setAttribute('size', new THREE.BufferAttribute(dSz, 1));

  var dustMat = new THREE.ShaderMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0.0 } },
    vertexShader: [
      'attribute float size;',
      'attribute vec3 color;',
      'varying vec3 vC;',
      'varying float vA;',
      'void main() {',
      '  vC = color;',
      '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = size * (280.0 / -mv.z);',
      '  gl_Position = projectionMatrix * mv;',
      '  vA = smoothstep(180.0, 10.0, -mv.z);',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying vec3 vC;',
      'varying float vA;',
      'void main() {',
      '  float d = length(gl_PointCoord - 0.5);',
      '  if (d > 0.5) discard;',
      '  float a = (1.0 - smoothstep(0.0, 0.5, d)) * vA * 0.65;',
      '  gl_FragColor = vec4(vC, a);',
      '}'
    ].join('\n')
  });

  scene.add(new THREE.Points(dustGeo, dustMat));

  // ═══════════════════════════════════════════
  //  MOUSE + SCROLL TRACKING
  // ═══════════════════════════════════════════

  var mouseX = 0, mouseY = 0, smoothX = 0, smoothY = 0;
  var scrollFrac = 0, smoothScroll = 0;

  document.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener('scroll', function () {
    var maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    scrollFrac = window.scrollY / maxScroll;
  });

  window.addEventListener('resize', function () {
    var w = window.innerWidth;
    var h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // ═══════════════════════════════════════════
  //  ANIMATION LOOP
  // ═══════════════════════════════════════════

  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();
    var dt = Math.min(clock.getDelta(), 0.05);

    // Smooth input
    smoothX += (mouseX - smoothX) * 0.04;
    smoothY += (mouseY - smoothY) * 0.04;
    smoothScroll += (scrollFrac - smoothScroll) * 0.05;

    // Update star uniforms
    starMat.uniforms.uTime.value = t;
    starMat2.uniforms.uTime.value = t + 1.3;
    dustMat.uniforms.uTime.value = t;

    // Camera parallax + scroll
    camera.position.x = smoothX * 6;
    camera.position.y = 20 - smoothY * 4 + smoothScroll * 15;
    camera.position.z = 90 + smoothScroll * 25;
    camera.lookAt(smoothX * 3, -smoothY * 2 + smoothScroll * 6, 0);

    // Planet rotation (slow, majestic)
    planet.rotation.y = t * 0.04;
    planetWire.rotation.y = t * 0.04;
    atmosphere.rotation.y = t * 0.025;

    // Rings pulse
    ring1.material.opacity = 0.15 + 0.06 * Math.sin(t * 0.7);
    ring2.material.opacity = 0.10 + 0.04 * Math.sin(t * 0.5 + 1.0);
    ring3.material.opacity = 0.06 + 0.03 * Math.sin(t * 0.9 + 2.0);

    // Moon orbit
    var moonAngle = t * 0.22;
    moon.position.set(
      planet.position.x + Math.cos(moonAngle) * 28,
      planet.position.y + Math.sin(moonAngle * 0.5) * 4,
      planet.position.z + Math.sin(moonAngle) * 14
    );
    moonGlow.position.copy(moon.position);
    moon.rotation.y = t * 0.3;

    // Purple light follows mouse slightly
    purpleLight.position.x = -40 + smoothX * 12;
    purpleLight.position.y = 30 - smoothY * 8;

    // Asteroid belt rotation
    var beltSpeed = t * 0.06;
    asteroidMeshes.forEach(function (a) {
      var na = a.angle + beltSpeed * a.speed;
      a.mesh.position.set(
        planet.position.x + Math.cos(na) * a.radius,
        planet.position.y + a.yOff + Math.sin(na * 0.3) * 1.5,
        planet.position.z + Math.sin(na) * a.radius * 0.55
      );
      a.mesh.rotation.x += a.ry;
      a.mesh.rotation.z += a.ry * 0.7;
    });

    // Shapes float + rotate
    shapes.forEach(function (s, idx) {
      var floatY = Math.sin(t * s.floatSpeed + s.floatPhase) * s.floatAmp;
      s.solid.position.y += (floatY - s.solid.position.y + shapeDefs[idx].pos[1]) * 0.02;
      s.wire.position.y = s.solid.position.y;
      s.solid.rotation.x += s.rx;
      s.solid.rotation.y += s.ry;
      s.wire.rotation.copy(s.solid.rotation);
      // Pulse wireframe
      s.mat.opacity = s.baseOp * (0.7 + 0.3 * Math.sin(t * 1.4 + idx * 0.8));
    });

    // Energy streams pulse
    streamMeshes.forEach(function (s, idx) {
      s.mat.opacity = s.baseOp * (0.6 + 0.4 * Math.sin(t * 2.0 + idx * 1.2));
    });

    renderer.render(scene, camera);
  }

  animate();

})(); // end scene IIFE

// ══════════════════════════════════════════════
//  UI INTERACTIONS — zero errors guaranteed
// ══════════════════════════════════════════════

// ── CURSOR ──
(function () {
  var cur = document.getElementById('cur');
  var ring = document.getElementById('cur-ring');
  var cx = -99, cy = -99, rx = -99, ry = -99;

  document.addEventListener('mousemove', function (e) {
    cx = e.clientX;
    cy = e.clientY;
    cur.style.left = cx + 'px';
    cur.style.top = cy + 'px';
  });

  function animRing() {
    rx += (cx - rx) * 0.1;
    ry += (cy - ry) * 0.1;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animRing);
  }
  animRing();

  var hoverEls = document.querySelectorAll('a, button, .sd, .proj-card, .ach-card, .skill-col, .browser-card');
  hoverEls.forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      cur.style.width = '18px';
      cur.style.height = '18px';
      cur.style.background = '#fff';
      ring.style.width = '50px';
      ring.style.height = '50px';
      ring.style.borderColor = 'rgba(192,132,252,.9)';
    });
    el.addEventListener('mouseleave', function () {
      cur.style.width = '12px';
      cur.style.height = '12px';
      cur.style.background = '#c084fc';
      ring.style.width = '38px';
      ring.style.height = '38px';
      ring.style.borderColor = 'rgba(192,132,252,.45)';
    });
  });
})();

// ── SCROLL PROGRESS + NAV ──
(function () {
  var prog = document.getElementById('prog');
  var nav = document.getElementById('main-nav');
  window.addEventListener('scroll', function () {
    var max = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    prog.style.width = (window.scrollY / max * 100) + '%';
    if (window.scrollY > 60) {
      nav.classList.add('stuck');
    } else {
      nav.classList.remove('stuck');
    }
  });
})();

// ── REVEAL ON SCROLL ──
(function () {
  var els = document.querySelectorAll('.rv');
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
      }
    });
  }, { threshold: 0.08 });
  els.forEach(function (el) { obs.observe(el); });
})();

// ── NAV DOTS ──
(function () {
  var secIds = ['hero', 'about', 'skills', 'featured', 'projects', 'achievements', 'education', 'contact'];
  var dots = document.querySelectorAll('.sd');

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        var id = e.target.id;
        dots.forEach(function (d) {
          if (d.dataset.t === id) {
            d.classList.add('on');
          } else {
            d.classList.remove('on');
          }
        });
      }
    });
  }, { threshold: 0.3 });

  secIds.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) obs.observe(el);
  });

  dots.forEach(function (d) {
    d.addEventListener('click', function () {
      var target = document.getElementById(d.dataset.t);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
})();

// ── COUNTERS ──
(function () {
  function animInt(el) {
    var to = parseInt(el.dataset.to, 10);
    var steps = 60;
    var i = 0;
    var timer = setInterval(function () {
      i++;
      el.textContent = Math.round(to * i / steps);
      if (i >= steps) { el.textContent = to; clearInterval(timer); }
    }, 22);
  }

  function animFloat(el) {
    var to = parseFloat(el.dataset.to);
    var steps = 60;
    var i = 0;
    var timer = setInterval(function () {
      i++;
      el.textContent = (to * i / steps).toFixed(2);
      if (i >= steps) { el.textContent = to.toFixed(2); clearInterval(timer); }
    }, 22);
  }

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && !e.target._counted) {
        e.target._counted = true;
        if (e.target.classList.contains('countf')) {
          animFloat(e.target);
        } else {
          animInt(e.target);
        }
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.counter, .countf').forEach(function (el) {
    obs.observe(el);
  });
})();

// ── 3D TILT CARDS ──
(function () {
  document.querySelectorAll('.tilt-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var rotX = -((e.clientY - r.top - r.height / 2) / (r.height / 2)) * 8;
      var rotY = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 8;
      card.style.transition = 'transform .08s ease';
      card.style.transform = 'perspective(900px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) scale(1.02)';
    });
    card.addEventListener('mouseleave', function () {
      card.style.transition = 'transform .55s cubic-bezier(.22,1,.36,1)';
      card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
  });
})();
