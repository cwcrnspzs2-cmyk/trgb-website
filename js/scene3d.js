// TRGB 3D-scène: zwevend tennis-/padelterrein met spelende figuren (Three.js)
import * as THREE from './vendor/three.module.js?v=160';

const COL = { clay: 0xC45A36, claySide: 0x8E3A1E, turf: 0x2F8F6E, turfSide: 0x1C5E47, lime: 0xC9D42B, red: 0xC8281F, ink: 0x1C2A24, white: 0xffffff, glass: 0xBFE0F5, blue: 0x2D5BFF, skinA: 0xF2C3A0, skinB: 0x8A5436, hair: 0x1E1A1A, shoe: 0xffffff };
const SPORT = {
  tennis: { L: 23.77, W: 10.97, margin: 2.4, top: COL.clay, side: COL.claySide, netH: 1.07, walls: false },
  padel:  { L: 20, W: 10, margin: 0.9, top: COL.turf, side: COL.turfSide, netH: 0.88, walls: true }
};
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// ---------- texturen (canvas) ----------
function courtTexture(sport) {
  const S = SPORT[sport], px = 60, c = document.createElement('canvas');
  const Wc = (S.L + 2 * S.margin) * px, Hc = (S.W + 2 * S.margin) * px; c.width = Wc; c.height = Hc;
  const g = c.getContext('2d');
  g.fillStyle = sport === 'tennis' ? '#C45A36' : '#2F8F6E'; g.fillRect(0, 0, Wc, Hc);
  // korrel / grasstructuur
  for (let i = 0; i < Wc * Hc / 180; i++) { g.fillStyle = Math.random() > .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'; g.fillRect(Math.random() * Wc, Math.random() * Hc, 2, 2); }
  g.strokeStyle = '#fff'; g.lineWidth = sport === 'tennis' ? 5 : 6; g.lineCap = 'round';
  const X = u => (S.margin + u) * px, Y = v => (S.margin + v) * px;
  const ln = (u1, v1, u2, v2) => { g.beginPath(); g.moveTo(X(u1), Y(v1)); g.lineTo(X(u2), Y(v2)); g.stroke(); };
  if (sport === 'tennis') {
    const L = S.L, W = S.W, sl = 1.37, svc = 6.4, n = L / 2;
    ln(0, 0, L, 0); ln(0, W, L, W); ln(0, sl, L, sl); ln(0, W - sl, L, W - sl); ln(0, 0, 0, W); ln(L, 0, L, W);
    ln(n - svc, sl, n - svc, W - sl); ln(n + svc, sl, n + svc, W - sl); ln(n - svc, W / 2, n + svc, W / 2); ln(0, W / 2, .4, W / 2); ln(L - .4, W / 2, L, W / 2);
  } else { const L = S.L, W = S.W; ln(3, 0, 3, W); ln(L - 3, 0, L - 3, W); ln(3, W / 2, L - 3, W / 2); }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function meshTexture(cell = 8, w = 1.6) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.clearRect(0, 0, 64, 64); g.strokeStyle = 'rgba(30,30,30,.85)'; g.lineWidth = w;
  for (let i = 0; i <= 64; i += cell) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(64, i); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function stringTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = 'rgba(244,241,234,.55)'; g.fillRect(0, 0, 64, 64); g.strokeStyle = 'rgba(120,110,95,.9)'; g.lineWidth = 1.5;
  for (let i = 4; i < 64; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(64, i); g.stroke(); }
  return new THREE.CanvasTexture(c);
}

// ---------- hulpjes ----------
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .85, metalness: 0, ...o });
function roundedBox(w, h, d, r = .3) {
  const s = new THREE.Shape(); const x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: .08, bevelSize: .08, bevelSegments: 2 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, -h, 0); return geo;
}
const shadowBlob = (r) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .16, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = .02; return m; };

// ---------- terrein ----------
function buildCourt(sport) {
  const S = SPORT[sport], g = new THREE.Group(); g.name = 'court';
  const fw = S.L + 2 * S.margin, fd = S.W + 2 * S.margin, th = 1.2;
  const slab = new THREE.Mesh(roundedBox(fw, th, fd, .6), mat(S.side)); slab.receiveShadow = true; slab.castShadow = true; g.add(slab);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(fw - .1, fd - .1), mat(0xffffff, { map: courtTexture(sport) })); top.rotation.x = -Math.PI / 2; top.position.y = .095; top.receiveShadow = true; g.add(top);
  // net
  const net = new THREE.Group(); net.position.y = .09; const nl = sport === 'tennis' ? S.W + 1.8 : S.W;
  const nm = new THREE.Mesh(new THREE.PlaneGeometry(nl, S.netH), new THREE.MeshBasicMaterial({ map: meshTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  nm.material.map.repeat.set(nl * .9, S.netH * .9); nm.material.opacity = .95; nm.position.y = S.netH / 2; nm.rotation.y = Math.PI / 2; net.add(nm);
  const band = new THREE.Mesh(new THREE.BoxGeometry(.06, .09, nl), mat(0xffffff)); band.position.y = S.netH; net.add(band);
  for (const z of [-nl / 2, nl / 2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, S.netH + .15, 10), mat(0x222222)); p.position.set(0, (S.netH + .15) / 2, z); p.castShadow = true; net.add(p); }
  g.add(net);
  if (S.walls) { const wallsY = .09;
    const glass = new THREE.MeshPhysicalMaterial({ color: COL.glass, transparent: true, opacity: .28, roughness: .1, metalness: 0, side: THREE.DoubleSide, depthWrite: false });
    const frame = mat(0x1F2A33);
    const H = 3, L = S.L, W = S.W;
    // achterwanden (volledig glas, 3 m) + zijwanden: 2 m glas aan de hoeken, rest hekwerk
    const wall = (w, h, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass); m.position.set(x, h / 2 + wallsY, z); m.rotation.y = ry; g.add(m); };
    wall(W, H, -L / 2, 0, Math.PI / 2); wall(W, H, L / 2, 0, Math.PI / 2);
    for (const z of [-W / 2, W / 2]) { wall(4, H, -L / 2 + 2, z, 0); wall(4, H, L / 2 - 2, z, 0);
      const fence = new THREE.Mesh(new THREE.PlaneGeometry(L - 8, H), new THREE.MeshBasicMaterial({ map: meshTexture(6, 1), transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: .9 })); fence.material.map.repeat.set((L - 8) * 1.2, H * 1.2); fence.position.set(0, H / 2 + wallsY, z); g.add(fence); }
    const post = (x, z, h = H) => { const p = new THREE.Mesh(new THREE.BoxGeometry(.12, h, .12), frame); p.position.set(x, h / 2 + wallsY, z); p.castShadow = true; g.add(p); };
    for (const x of [-L / 2, -L / 2 + 4, 0, L / 2 - 4, L / 2]) for (const z of [-W / 2, W / 2]) post(x, z);
    const rail = (w, x, z, ry) => { const r = new THREE.Mesh(new THREE.BoxGeometry(w, .1, .1), frame); r.position.set(x, H + wallsY, z); r.rotation.y = ry; g.add(r); };
    rail(L, 0, -W / 2, 0); rail(L, 0, W / 2, 0); rail(W, -L / 2, 0, Math.PI / 2); rail(W, L / 2, 0, Math.PI / 2);
  }
  g.userData.S = S; return g;
}

// ---------- figuur (Duolingo-achtig, TRGB-spin) ----------
function buildKid({ skin, shirt, shorts, hair, style, sport, flip }) {
  const k = new THREE.Group(); const sc = 1.25;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.55, .5, 6, 16), mat(shirt)); body.position.y = 1.35; body.castShadow = true; k.add(body);
  const strip = new THREE.Mesh(new THREE.CylinderGeometry(.57, .57, .12, 24), mat(COL.lime)); strip.position.y = 1.0; k.add(strip);
  for (const x of [-.25, .25]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.16, .35, 4, 10), mat(skin)); leg.position.set(x, .55, 0); leg.castShadow = true; k.add(leg);
    const short = new THREE.Mesh(new THREE.CylinderGeometry(.2, .22, .3, 12), mat(shorts)); short.position.set(x, .85, 0); k.add(short);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(.24, 14, 10), mat(COL.shoe)); shoe.scale.set(1.1, .55, 1.4); shoe.position.set(x, .15, .08); shoe.castShadow = true; k.add(shoe);
  }
  const head = new THREE.Group(); head.position.y = 2.55; k.add(head);
  const hm = new THREE.Mesh(new THREE.SphereGeometry(.78, 28, 22), mat(skin)); hm.castShadow = true; head.add(hm);
  const eye = (x) => { const w = new THREE.Mesh(new THREE.SphereGeometry(.17, 16, 12), mat(0xffffff, { roughness: .3 })); w.scale.set(1, 1.25, .6); w.position.set(x, .05, .68); head.add(w);
    const p = new THREE.Mesh(new THREE.SphereGeometry(.085, 12, 10), mat(0x1a1a1a, { roughness: .2 })); p.position.set(x, .03, .8); head.add(p);
    const h = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); h.position.set(x + .03, .08, .87); head.add(h); };
  eye(-.26); eye(.26);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(.14, .035, 8, 16, Math.PI), mat(0x1a1a1a)); mouth.rotation.z = Math.PI; mouth.position.set(0, -.28, .7); head.add(mouth);
  for (const x of [-.48, .48]) { const ch = new THREE.Mesh(new THREE.CircleGeometry(.1, 12), new THREE.MeshBasicMaterial({ color: 0xF08A7A, transparent: true, opacity: .6 })); ch.position.set(x, -.18, .62); ch.lookAt(x * 3, -.18, 3); head.add(ch); }
  // haar / accessoires
  const hairM = mat(hair);
  if (style === 'ponytail') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.82, 24, 16, 0, Math.PI * 2, 0, Math.PI * .5), hairM); cap.position.y = .08; head.add(cap);
    const band = new THREE.Mesh(new THREE.TorusGeometry(.78, .08, 10, 32), mat(COL.red)); band.rotation.x = Math.PI / 2; band.position.y = .3; head.add(band);
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(.16, .5, 4, 10), hairM); tail.position.set(0, -.1, -.85); tail.rotation.x = .5; head.add(tail);
    const bob = new THREE.Mesh(new THREE.SphereGeometry(.24, 12, 10), hairM); bob.position.set(0, -.45, -1.05); head.add(bob);
  } else {
    const beanie = new THREE.Mesh(new THREE.SphereGeometry(.84, 24, 16, 0, Math.PI * 2, 0, Math.PI * .55), hairM); beanie.position.y = .05; head.add(beanie);
    const band = new THREE.Mesh(new THREE.TorusGeometry(.8, .09, 10, 32), mat(COL.red)); band.rotation.x = Math.PI / 2; band.position.y = .28; head.add(band);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 10), mat(COL.lime)); pom.position.y = .95; head.add(pom);
  }
  // armen: schouderpivot
  const armL = new THREE.Group(); armL.position.set(-.62, 1.75, 0); k.add(armL);
  const armR = new THREE.Group(); armR.position.set(.62, 1.75, 0); k.add(armR);
  for (const a of [armL, armR]) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(.14, .55, 4, 10), mat(skin)); m.position.y = -.4; m.castShadow = true; a.add(m); const hand = new THREE.Mesh(new THREE.SphereGeometry(.17, 12, 10), mat(skin)); hand.position.y = -.8; a.add(hand); }
  armL.rotation.z = .5; armL.rotation.x = -.3;
  // racket in de rechterhand
  const racket = buildRacket(sport); racket.position.y = -.85; armR.add(racket);
  k.userData = { armR, armL, head, racket, body };
  k.scale.setScalar(sc);
  const sh = shadowBlob(.9); sh.position.y = .01; k.add(sh);
  return k;
}
function buildRacket(sport) {
  const r = new THREE.Group();
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, .7, 10), mat(0x2B2B2B)); grip.position.y = -.2; r.add(grip);
  if (sport === 'tennis') {
    const frame = new THREE.Mesh(new THREE.TorusGeometry(.55, .055, 10, 36), mat(COL.red, { roughness: .5 })); frame.scale.set(1, 1.25, 1); frame.position.y = .85; r.add(frame);
    const strings = new THREE.Mesh(new THREE.CircleGeometry(.52, 36), new THREE.MeshBasicMaterial({ map: stringTexture(), transparent: true, side: THREE.DoubleSide })); strings.scale.set(1, 1.25, 1); strings.position.y = .85; r.add(strings);
  } else {
    const s = new THREE.Shape(); s.absellipse(0, 0, .55, .7, 0, Math.PI * 2);
    const geo = new THREE.ExtrudeGeometry(s, { depth: .09, bevelEnabled: true, bevelSize: .04, bevelThickness: .03, bevelSegments: 2 });
    const face = new THREE.Mesh(geo, mat(COL.blue, { roughness: .5 })); face.position.set(0, .9, -.05); r.add(face);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.6, .04, 8, 36), mat(0x1F2A33)); rim.scale.set(1, 1.27, 1); rim.position.y = .9; r.add(rim);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; const hole = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .2, 8), mat(0xffffff)); hole.rotation.x = Math.PI / 2; hole.position.set(Math.cos(a) * .3, .9 + Math.sin(a) * .4, 0); r.add(hole); }
  }
  r.userData.sport = sport; return r;
}
function swapRacket(kid, sport) { const old = kid.userData.racket; const nr = buildRacket(sport); nr.position.copy(old.position); old.parent.add(nr); old.parent.remove(old); kid.userData.racket = nr; }

// ---------- hoofd ----------
export function createScene(container, opts = {}) {
  let sport = opts.sport || 'tennis';
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement); renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:pan-y;cursor:grab';
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 200);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xE8DCC8, 1.15); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(18, 30, 14); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = sun.shadow.camera.bottom = -22; sun.shadow.camera.right = sun.shadow.camera.top = 22; sun.shadow.camera.far = 90; sun.shadow.bias = -.0005; scene.add(sun);
  const world = new THREE.Group(); scene.add(world);           // zweeft + draait
  const courtHolder = new THREE.Group(); world.add(courtHolder);
  let court = buildCourt(sport); courtHolder.add(court);
  // grondschaduw ver onder het terrein (zweef-effect)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: .18 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -7; ground.receiveShadow = true; scene.add(ground);
  // figuren
  const kidA = buildKid({ skin: COL.skinA, shirt: COL.red, shorts: 0x2B2B2B, hair: COL.hair, style: 'ponytail', sport, flip: false });
  const kidB = buildKid({ skin: COL.skinB, shirt: COL.lime, shorts: 0x2B2B2B, hair: COL.hair, style: 'beanie', sport, flip: true });
  world.add(kidA, kidB);
  // bal
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.3, 16, 12), mat(0xD9F23C, { roughness: .6 })); ball.castShadow = true; world.add(ball);
  const seam = new THREE.Mesh(new THREE.TorusGeometry(.3, .03, 6, 24), mat(0xffffff)); seam.rotation.x = 1; ball.add(seam);
  const ballShadow = shadowBlob(.25); world.add(ballShadow);

  function place() {
    const S = SPORT[sport]; const x = S.L / 2 - 2.4;
    kidA.position.set(-x, .09, 1.6); kidA.rotation.y = Math.PI / 2 - .75; kidB.position.set(x, .09, -1.4); kidB.rotation.y = -Math.PI / 2 + .75;
  }
  place();
  // camera / interactie
  let baseYaw = .18, pitch = .5, dragYaw = 0, yaw = baseYaw, dist = 1, dragging = false, px = 0, vel = 0, lastT = 0;
  const el = renderer.domElement;
  el.addEventListener('pointerdown', e => { dragging = true; px = e.clientX; vel = 0; lastT = performance.now(); el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; });
  el.addEventListener('pointermove', e => { if (dragging) { const now = performance.now(), d = (e.clientX - px) * .006; dragYaw += d; vel = d / Math.max(now - lastT, 1) * 1000; px = e.clientX; lastT = now; } });
  const up = () => { dragging = false; el.style.cursor = 'grab'; }; el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  function resize() { const w = container.clientWidth || 600, h = container.clientHeight || 420; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dist = 1; }
  new ResizeObserver(resize).observe(container); resize();

  // sport wisselen met animatie
  let pendingSport = null, scaleTarget = 1, scaleY = 1;
  function setSport(s) { if (s === sport && !pendingSport) return; pendingSport = s === sport ? null : s; scaleTarget = pendingSport ? 0 : 1; opts.onSport && opts.onSport(s); }
  function applySport(s) { courtHolder.remove(court); court.traverse(o => { o.geometry && o.geometry.dispose(); }); sport = s; court = buildCourt(sport); courtHolder.add(court); swapRacket(kidA, sport); swapRacket(kidB, sport); place(); }

  // animatie
  const clock = new THREE.Clock(); let t0 = 0; const period = 1.9;
  let running = true, visible = true, raf = 0, userPaused = false;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) { clock.getDelta(); animate(); } }, { threshold: .02 }).observe(container);
  document.addEventListener('visibilitychange', () => { running = !document.hidden && !userPaused; if (running && visible && !raf) { clock.getDelta(); animate(); } });
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); running = false; container.classList.add('gl-lost'); });
  renderer.domElement.addEventListener('webglcontextrestored', () => { running = true; container.classList.remove('gl-lost'); if (!raf) animate(); });
  addEventListener('pagehide', () => { running = false; renderer.dispose(); scene.traverse(o => { o.geometry && o.geometry.dispose(); if (o.material) { [].concat(o.material).forEach(m => { m.map && m.map.dispose(); m.dispose(); }); } }); });
  function animate() {
    raf = 0; if (!running || !visible) return; raf = requestAnimationFrame(animate); const dt = Math.min(clock.getDelta(), .05); const t = clock.elapsedTime;
    // sportwissel: kritisch gedempt, start altijd vanuit de huidige waarde en kan op elk moment omkeren
    scaleY += (scaleTarget - scaleY) * (1 - Math.exp(-dt * 9));
    if (pendingSport && scaleY < .04) { applySport(pendingSport); pendingSport = null; scaleTarget = 1; }
    courtHolder.scale.set(1, Math.max(scaleY, .02), 1); courtHolder.rotation.y = (1 - scaleY) * .6;
    // zweven
    world.position.y = Math.sin(t * .6) * .22;
    if (!dragging) { dragYaw += vel * dt; vel *= Math.exp(-dt * 2.5); dragYaw *= Math.exp(-dt * .35); }
    yaw += (baseYaw + Math.sin(t * .2) * .08 + dragYaw - yaw) * (1 - Math.exp(-dt * 10));
    const S = SPORT[sport]; // camera-afstand uit de omschreven cirkel van het terrein, zodat het bij elke draaihoek volledig in beeld blijft
    const fw = S.L + 2 * S.margin, fd = S.W + 2 * S.margin, rad = Math.hypot(fw, fd) / 2 + 1.5, tanH = Math.tan(camera.fov * Math.PI / 360);
    const narrow = camera.aspect < 1.5; const lookY = narrow ? -2.4 : .6;
    const R = Math.max(rad * 1.04 / (tanH * camera.aspect), (rad * Math.sin(pitch) + 4.5) * (narrow ? 1.25 : 1.1) / tanH, 30);
    camera.position.set(Math.sin(yaw) * Math.cos(pitch) * R, Math.sin(pitch) * R + lookY, Math.cos(yaw) * Math.cos(pitch) * R); camera.lookAt(0, lookY, 0);
    // bal heen en weer
    const ph = (t % (period * 2)) / period; const dir = ph < 1 ? 1 : -1; const u = ph < 1 ? ph : ph - 1; const e = easeInOut(u);
    const ax = kidA.position.x + 1.2, bx = kidB.position.x - 1.2; const from = dir > 0 ? ax : bx, to = dir > 0 ? bx : ax;
    const bxp = lerp(from, to, u), bz = lerp(dir > 0 ? kidA.position.z : kidB.position.z, dir > 0 ? kidB.position.z : kidA.position.z, u);
    ball.position.set(bxp, 2.2 + Math.sin(u * Math.PI) * 4.4, bz); ball.rotation.x += dt * 10; ballShadow.position.set(bxp, .12, bz); ballShadow.material.opacity = .22 - Math.sin(u * Math.PI) * .14;
    // slagbeweging: wie net geslagen heeft zwaait, wie wacht beweegt mee
    const swing = (kid, hitPhase) => { const d = Math.abs(((u - hitPhase + 1.5) % 1) - .5) * 2; const s = Math.max(0, 1 - d * 6); kid.userData.armR.rotation.z = -.4 - s * 1.6; kid.userData.armR.rotation.x = -.2 + s * .8; kid.userData.body.rotation.y = s * .35; kid.userData.head.rotation.y = Math.sin(t * 1.3) * .15; kid.userData.head.rotation.z = Math.sin(t * 1.7) * .06; kid.userData.armL.rotation.z = .5 + Math.sin(t * 2) * .1; kid.position.y = .09 + Math.abs(Math.sin(t * 4)) * .06; };
    swing(kidA, dir > 0 ? 0 : 1); swing(kidB, dir > 0 ? 1 : 0);
        renderer.render(scene, camera);
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  animate();
  return { setSport, get sport() { return sport; }, pause() { userPaused = true; running = false; }, resume() { userPaused = false; running = !document.hidden; if (visible && !raf) { clock.getDelta(); animate(); } } };
}
