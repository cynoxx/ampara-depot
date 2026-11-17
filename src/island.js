// Île stylisée en 3D — paysage d'inspiration méditerranéenne, pas une carte.
// Chargée à la demande ; la page reste complète sans elle.
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  PlaneGeometry,
  BoxGeometry,
  ConeGeometry,
  IcosahedronGeometry,
  BufferGeometry,
  TubeGeometry,
  CatmullRomCurve3,
  Vector3,
  MeshBasicMaterial,
  Float32BufferAttribute,
  MeshStandardMaterial,
  MeshLambertMaterial,
  Mesh,
  InstancedMesh,
  Group,
  Object3D,
  Color,
  HemisphereLight,
  DirectionalLight,
  DoubleSide,
  SRGBColorSpace,
} from 'three';

/* ---------- Bruit déterministe ---------- */
function hash(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const fade = (t) => t * t * (3 - 2 * t);
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  const u = fade(xf), v = fade(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, oct = 4) {
  let s = 0, amp = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) {
    s += amp * noise(x * f + 11.3 * i, y * f - 7.1 * i);
    n += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return s / n;
}
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

/* ---------- Relief ---------- */
// Axe nord-sud légèrement sinueux, corps large, cap effilé au nord.
function spine(z) {
  return 0.22 * Math.sin(z * 0.55 + 0.4) + (z < -2 ? 0.1 * (-2 - z) : 0);
}
function halfWidth(z) {
  const body = z > -2.4 && z < 3.15 ? 1.85 * Math.sqrt(Math.max(0, 1 - ((z - 0.35) / 2.8) ** 2)) : 0;
  const cape = z > -3.9 && z < -1.6 ? 0.36 * smooth(-3.9, -3.3, z) : 0;
  return Math.max(body, cape);
}
function heightAt(x, z) {
  const w = halfWidth(z);
  const deep = 0.25 * smooth(1.6, 2.6, Math.hypot(x * 0.85, z * 0.62));
  if (w <= 0.001) return -0.4 - deep;
  const jag = (fbm(x * 1.6 + 3, z * 1.6) - 0.5) * 0.55;
  const d = Math.abs(x - spine(z)) / w + jag;
  const f = 1 - d; // > 0 sur terre
  if (f <= 0) return -0.12 + Math.max(f, -0.5) * 0.4 - deep;
  const coast = smooth(0, 0.32, f);
  const ridge = Math.exp(-((x - spine(z) + 0.25 + (fbm(z * 1.3, 4) - 0.5) * 0.6) ** 2) / 0.42) * smooth(-2.6, -0.6, z) * (1 - smooth(1.6, 3.0, z) * 0.55);
  const peaks = fbm(x * 2.1 + 5, z * 2.1 + 2, 5);
  return coast * (0.1 + 0.32 * f + 1.25 * ridge * (0.35 + 1.0 * peaks ** 1.4));
}

// Fondu de la mer (ellipse autour de l'île) ; le fond marin est coupé au-delà.
const FADE_A = '2.2', FADE_B = '3.5';
const BASE_ROT = 0.12;

const C = {
  sand: new Color('#cdb27a'),
  maquisLight: new Color('#7d9a3e'),
  maquis: new Color('#4c7a2f'),
  forest: new Color('#2c5226'),
  rock: new Color('#7d776a'),
  stone: new Color('#c9c2b0'),
  floor: new Color('#1d4a40'),
};
function landColor(h, jitter) {
  let c;
  if (h < 0.0) c = C.floor;
  else if (h < 0.07) c = C.sand;
  else if (h < 0.32) c = C.maquisLight;
  else if (h < 0.62) c = C.maquis;
  else if (h < 1.18) c = C.forest;
  else if (h < 1.5) c = C.rock;
  else c = C.stone;
  return c.clone().offsetHSL(0, 0, (jitter - 0.5) * 0.05);
}

function buildTerrain(seg) {
  const g = new PlaneGeometry(9, 10, seg, Math.round(seg * 1.1)).toNonIndexed();
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
  }
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i += 3) {
    const h = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    const col = landColor(h, hash(i, 91));
    for (let k = 0; k < 3; k++) col.toArray(colors, (i + k) * 3);
  }
  g.setAttribute('color', new Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  const mat = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0 });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLandPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvLandPos = transformed;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLandPos;')
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>\nif (vLandPos.y < 0.0 && length(vec2(vLandPos.x * 0.85, vLandPos.z * 0.62)) > ${FADE_A}) discard;`,
      );
  };
  return new Mesh(g, mat);
}

function buildSea() {
  const g = new PlaneGeometry(18, 18, 56, 56);
  g.rotateX(-Math.PI / 2);
  const mat = new MeshStandardMaterial({
    color: new Color('#1f5650'),
    transparent: true,
    opacity: 0.93,
    roughness: 0.28,
    metalness: 0.05,
    flatShading: true,
    depthWrite: false,
  });
  // Fondu circulaire du bord de la mer vers l'arrière-plan.
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSeaPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvSeaPos = transformed;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSeaPos;')
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>\ngl_FragColor.a *= 1.0 - smoothstep(FADE_A, FADE_B, length(vec2(vSeaPos.x * 0.85, vSeaPos.z * 0.62)));`.replace('FADE_A', FADE_A).replace('FADE_B', FADE_B),
      );
  };
  const mesh = new Mesh(g, mat);
  mesh.renderOrder = 2;
  const base = Float32Array.from(g.attributes.position.array);
  mesh.userData.animate = (t) => {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2];
      p.setY(i, 0.03 * Math.sin(x * 1.3 + t * 1.1) + 0.025 * Math.cos(z * 1.1 + t * 0.9) + 0.015 * Math.sin((x + z) * 2.2 + t * 1.6));
    }
    p.needsUpdate = true;
  };
  return mesh;
}

function findSpot(zMin, zMax, xMin, xMax, hMin, hMax) {
  for (let i = 0; i < 400; i++) {
    const x = xMin + rand() * (xMax - xMin);
    const z = zMin + rand() * (zMax - zMin);
    const h = heightAt(x, z);
    if (h > hMin && h < hMax) return [x, z];
  }
  return [(xMin + xMax) / 2, (zMin + zMax) / 2];
}

function buildVillage(center, count, withTower) {
  const g = new Group();
  const wallMat = new MeshLambertMaterial({ color: new Color('#f1e6cf'), flatShading: true });
  const roofMat = new MeshLambertMaterial({ color: new Color('#b85a32'), flatShading: true });
  const wall = new BoxGeometry(0.085, 0.07, 0.075);
  const roof = new ConeGeometry(0.068, 0.05, 4);
  roof.rotateY(Math.PI / 4);
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2, r = 0.05 + rand() * 0.22;
    const x = center[0] + Math.cos(a) * r, z = center[1] + Math.sin(a) * r;
    const y = heightAt(x, z);
    if (y < 0.08) continue;
    const s = 0.85 + rand() * 0.4;
    const w = new Mesh(wall, wallMat);
    w.position.set(x, y + 0.03 * s, z);
    w.scale.setScalar(s);
    w.rotation.y = rand() * Math.PI;
    const rf = new Mesh(roof, roofMat);
    rf.position.set(x, y + 0.085 * s, z);
    rf.scale.setScalar(s);
    rf.rotation.y = w.rotation.y;
    g.add(w, rf);
  }
  if (withTower) {
    const x = center[0] + 0.04, z = center[1] - 0.05, y = heightAt(x, z);
    const tower = new Mesh(new BoxGeometry(0.05, 0.2, 0.05), wallMat);
    tower.position.set(x, y + 0.09, z);
    const cap = new Mesh(new ConeGeometry(0.042, 0.06, 4), roofMat);
    cap.position.set(x, y + 0.215, z);
    cap.rotation.y = Math.PI / 4;
    g.add(tower, cap);
  }
  return g;
}

function buildTrees(count) {
  const pine = new ConeGeometry(0.04, 0.15, 5);
  pine.translate(0, 0.075, 0);
  const bush = new IcosahedronGeometry(0.045, 0);
  bush.translate(0, 0.03, 0);
  const pines = new InstancedMesh(pine, new MeshLambertMaterial({ color: new Color('#2e5a35'), flatShading: true }), count);
  const bushes = new InstancedMesh(bush, new MeshLambertMaterial({ color: new Color('#6c8c45'), flatShading: true }), count);
  const o = new Object3D();
  let p = 0, b = 0;
  for (let i = 0; i < count * 4 && (p < count || b < count); i++) {
    const x = (rand() - 0.5) * 4.2, z = -3 + rand() * 6;
    const h = heightAt(x, z);
    if (h < 0.12 || h > 1.05) continue;
    o.position.set(x, h - 0.01, z);
    const s = 0.7 + rand() * 0.7;
    o.scale.set(s, s * (0.8 + rand() * 0.5), s);
    o.rotation.y = rand() * Math.PI;
    o.updateMatrix();
    if (h > 0.45 && p < count) pines.setMatrixAt(p++, o.matrix);
    else if (b < count) bushes.setMatrixAt(b++, o.matrix);
  }
  pines.count = p;
  bushes.count = b;
  const g = new Group();
  g.add(pines, bushes);
  return g;
}

function buildBoat() {
  const g = new Group();
  const hullGeo = new BoxGeometry(0.2, 0.045, 0.07);
  const hull = new Mesh(hullGeo, new MeshLambertMaterial({ color: new Color('#7d4528'), flatShading: true }));
  hull.position.y = 0.02;
  const sailGeo = new BufferGeometry();
  sailGeo.setAttribute('position', new Float32BufferAttribute([-0.07, 0.05, 0, 0.06, 0.05, 0, -0.03, 0.27, 0], 3));
  sailGeo.computeVertexNormals();
  const sail = new Mesh(sailGeo, new MeshLambertMaterial({ color: new Color('#fbf3e2'), side: DoubleSide }));
  g.add(hull, sail);
  return g;
}

/* ---------- Montage ---------- */
export function mountIsland(stage, { reduceMotion, pins }) {
  const small = Math.min(stage.clientWidth, window.innerWidth) < 520;
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  stage.prepend(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 60);

  scene.add(new HemisphereLight(new Color('#eef6dc'), new Color('#20372a'), 1.5));
  const sun = new DirectionalLight(new Color('#ffe6b8'), 3.0);
  sun.position.set(-5, 5, 2);
  scene.add(sun);

  const world = new Group();
  const island = new Group();
  seed = 7;
  island.add(buildTerrain(small ? 80 : 120));
  island.add(buildTrees(small ? 70 : 120));
  const v1 = findSpot(0.9, 1.9, 0.6, 1.4, 0.3, 0.6);
  const v2 = findSpot(-1.6, -0.8, -1.3, -0.6, 0.25, 0.55);
  island.add(buildVillage(v1, 11, true));
  island.add(buildVillage(v2, 6, false));
  // Escales du parcours, du sud au nord.
  const stops = [
    findSpot(1.6, 2.3, 0.2, 1.0, 0.12, 0.45),
    findSpot(0.3, 0.9, 0.5, 1.3, 0.15, 0.5),
    findSpot(-1.1, -0.5, -0.9, 0.0, 0.2, 0.6),
    findSpot(-2.6, -2.0, -0.1, 0.6, 0.08, 0.5),
  ].map(([x, z]) => new Vector3(x, heightAt(x, z) + 0.06, z));
  function trail(a, b) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const x = a.x + (b.x - a.x) * (i / 24), z = a.z + (b.z - a.z) * (i / 24);
      pts.push(new Vector3(x, Math.max(0.02, heightAt(x, z)) + 0.05, z));
    }
    return pts;
  }
  const done = new CatmullRomCurve3(trail(stops[0], stops[1]));
  const rest = new CatmullRomCurve3([...trail(stops[1], stops[2]), ...trail(stops[2], stops[3]).slice(1)]);
  island.add(new Mesh(new TubeGeometry(done, 60, 0.014, 6), new MeshBasicMaterial({ color: new Color('#c8f04a') })));
  island.add(new Mesh(new TubeGeometry(rest, 120, 0.009, 6), new MeshBasicMaterial({ color: new Color('#eef3e6'), transparent: true, opacity: 0.45 })));
  for (const [i, p] of stops.entries()) {
    const dot = new Mesh(new IcosahedronGeometry(i < 2 ? 0.045 : 0.035, 1), new MeshBasicMaterial({ color: new Color(i < 2 ? '#c8f04a' : '#eef3e6') }));
    dot.position.copy(p);
    island.add(dot);
  }
  const pinEls = (pins && pins.items) ? pins.items.map((item) => {
    const el = document.createElement('div');
    el.className = 'pin' + (item.on ? ' pin--on' : '');
    el.innerHTML = `<span class="pin__dot"></span><span class="pin__body"><b>${item.label}</b><small>${item.sub}</small></span>`;
    pins.container.append(el);
    return el;
  }) : [];
  const tmp = new Vector3();
  function placePins() {
    if (!pinEls.length) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    pinEls.forEach((el, i) => {
      tmp.copy(stops[i]);
      island.localToWorld(tmp);
      tmp.project(camera);
      const x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.style.opacity = tmp.z < 1 ? '' : '0';
    });
  }

  world.add(island);
  const sea = buildSea();
  world.add(sea);
  const boat = buildBoat();
  world.add(boat);
  world.rotation.y = BASE_ROT;
  scene.add(world);

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Cadrage : plus de recul sur les formats étroits.
    // Vue aérienne. Sur grand écran, l'île se place à droite du texte.
    const wide = camera.aspect > 1.15;
    const back = wide ? 1.42 : 1.3;
    world.position.x = wide ? Math.min(3.9, (camera.aspect - 1) * 3.9) : 0;
    camera.position.set(1.2 * back + world.position.x * 0.3, 8.6 * back, 5.6 * back);
    camera.lookAt(world.position.x * 0.3, 0, wide ? 0.5 : 1.0);
    camera.updateProjectionMatrix();
  }

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  function onPointer(e) {
    const r = stage.getBoundingClientRect();
    pointer.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    pointer.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
  }

  let start = performance.now();
  let running = false, visible = true, raf = 0;
  const ENTRY = 1800;

  function frame(now) {
    const t = (now - start) / 1000;
    const k = reduceMotion.matches ? 1 : Math.min(1, (now - start) / ENTRY);
    const e = 1 - (1 - k) ** 3;
    island.position.y = -0.7 * (1 - e);
    world.scale.setScalar(0.9 + 0.1 * e);

    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    world.rotation.y = BASE_ROT + Math.sin(t * 0.09) * 0.08 + pointer.x * 0.1;
    world.rotation.x = pointer.y * 0.03;

    sea.userData.animate(t);
    const a = t * 0.07 + 1.2;
    boat.position.set(Math.cos(a) * 2.25, 0.01 + Math.sin(t * 1.7) * 0.012, Math.sin(a) * 3.15);
    boat.rotation.y = -a;
    boat.rotation.z = Math.sin(t * 1.3) * 0.06;

    renderer.render(scene, camera);
    placePins();
  }

  function loop(now) {
    frame(now);
    raf = running ? requestAnimationFrame(loop) : 0;
  }
  function update() {
    const should = visible && !document.hidden && !reduceMotion.matches;
    if (should && !running) {
      running = true;
      raf = requestAnimationFrame(loop);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }
  function renderStill() {
    // Mouvement réduit : une seule image, pose finale.
    start = performance.now() - ENTRY;
    frame(performance.now());
  }

  resize();
  new ResizeObserver(() => {
    resize();
    if (!running) renderStill();
  }).observe(stage);

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    update();
  }).observe(stage);
  document.addEventListener('visibilitychange', update);
  reduceMotion.addEventListener('change', () => {
    update();
    if (!running) renderStill();
  });
  window.addEventListener('pointermove', onPointer, { passive: true });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    running = false;
    cancelAnimationFrame(raf);
    stage.classList.remove('is-live');
    pinEls.forEach((el) => el.remove());
  });

  if (reduceMotion.matches) renderStill();
  else {
    start = performance.now();
    update();
  }
  requestAnimationFrame(() => stage.classList.add('is-live'));
}
