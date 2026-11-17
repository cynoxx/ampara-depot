// Escales du parcours en 3D : plateformes de verre en spirale ascendante.
// A0 et A1 disponibles (citron), A2 et B1 en préparation (contour seul).
// Chargé seulement quand la section approche ; rendu uniquement à l'écran.
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  CylinderGeometry,
  EdgesGeometry,
  LineSegments,
  LineBasicMaterial,
  MeshPhysicalMaterial,
  MeshBasicMaterial,
  Mesh,
  Group,
  Color,
  Sprite,
  SpriteMaterial,
  CanvasTexture,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  AdditiveBlending,
  HemisphereLight,
  DirectionalLight,
  QuadraticBezierCurve3,
  TubeGeometry,
  Vector3,
  IcosahedronGeometry,
  SRGBColorSpace,
} from 'three';

const LIME = new Color('#c8f04a');
const PALE = new Color('#eef3e6');

function labelTexture(title, sub, on) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 192;
  const g = c.getContext('2d');
  const r = 40;
  g.fillStyle = on ? 'rgba(200,240,74,0.16)' : 'rgba(238,243,230,0.08)';
  g.strokeStyle = on ? 'rgba(200,240,74,0.7)' : 'rgba(238,243,230,0.35)';
  g.lineWidth = 3;
  g.beginPath();
  g.roundRect(6, 6, 500, 180, r);
  g.fill();
  g.stroke();
  g.fillStyle = on ? '#c8f04a' : '#eef3e6';
  g.font = '600 78px "JetBrains Mono", ui-monospace, monospace';
  g.fillText(title, 40, 104);
  g.fillStyle = on ? '#e9f7c0' : '#a9b8a4';
  g.font = '500 40px "DM Sans", system-ui, sans-serif';
  g.fillText(sub, 40, 158);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function glow() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.6)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

export function mountSteps(stage, { reduceMotion }) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  stage.prepend(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 50);
  scene.add(new HemisphereLight(new Color('#f4ffe0'), new Color('#0b1510'), 1.6));
  const key = new DirectionalLight(new Color('#ffffff'), 2.4);
  key.position.set(3, 6, 4);
  scene.add(key);

  const root = new Group();
  scene.add(root);

  const items = [
    { t: 'A0', s: 'Disponible', on: true },
    { t: 'A1', s: 'Disponible', on: true },
    { t: 'A2', s: 'En préparation', on: false },
    { t: 'B1', s: 'En préparation', on: false },
  ];
  const tex = glow();
  const plates = [];
  const centers = [];
  const hex = new CylinderGeometry(0.46, 0.46, 0.1, 6);
  const edges = new EdgesGeometry(hex);

  items.forEach((it, i) => {
    // Escalier qui monte en diagonale, légèrement en zigzag.
    const p = new Vector3(-1.65 + i * 1.1, -1.05 + i * 0.72, i % 2 ? -0.35 : 0.35);
    centers.push(p);
    const g = new Group();
    g.position.copy(p);
    const glass = new Mesh(
      hex,
      new MeshPhysicalMaterial({
        color: it.on ? new Color('#b9e64a') : new Color('#9fb3a0'),
        transparent: true,
        opacity: it.on ? 0.55 : 0.18,
        roughness: 0.15,
        metalness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        emissive: it.on ? LIME : new Color('#000000'),
        emissiveIntensity: it.on ? 0.35 : 0,
        depthWrite: false,
      }),
    );
    g.add(glass);
    g.add(new LineSegments(edges, new LineBasicMaterial({ color: it.on ? LIME : PALE, transparent: true, opacity: it.on ? 0.95 : 0.4 })));
    if (it.on) {
      const halo = new Points(
        new BufferGeometry().setAttribute('position', new Float32BufferAttribute([0, -0.05, 0], 3)),
        new PointsMaterial({ color: LIME, size: 1.6, map: tex, transparent: true, opacity: 0.55, depthWrite: false, blending: AdditiveBlending }),
      );
      g.add(halo);
      g.userData.halo = halo;
    }
    const label = new Sprite(new SpriteMaterial({ map: labelTexture(it.t, it.s, it.on), transparent: true, depthWrite: false }));
    label.scale.set(0.95, 0.36, 1);
    label.position.set(0, 0.5, 0);
    g.add(label);
    g.userData.phase = i * 1.3;
    root.add(g);
    plates.push(g);
  });

  // Liaisons : citron entre A0 et A1, pâles ensuite.
  for (let i = 0; i < 3; i++) {
    const a = centers[i], b = centers[i + 1];
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y += 0.55;
    const curve = new QuadraticBezierCurve3(a.clone().setY(a.y + 0.08), mid, b.clone().setY(b.y + 0.08));
    const on = i === 0;
    root.add(new Mesh(new TubeGeometry(curve, 40, on ? 0.018 : 0.01, 6), new MeshBasicMaterial({ color: on ? LIME : PALE, transparent: true, opacity: on ? 1 : 0.3 })));
    if (on) root.userData.hop = curve;
  }

  // Orbe qui saute d'A0 à A1.
  const orb = new Mesh(new IcosahedronGeometry(0.07, 2), new MeshBasicMaterial({ color: new Color('#f3ffc4') }));
  const orbGlow = new Points(
    new BufferGeometry().setAttribute('position', new Float32BufferAttribute([0, 0, 0], 3)),
    new PointsMaterial({ color: LIME, size: 0.9, map: tex, transparent: true, depthWrite: false, blending: AdditiveBlending }),
  );
  orb.add(orbGlow);
  root.add(orb);

  // Poussière lumineuse.
  const N = 160;
  const dust = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) dust.set([(Math.random() - 0.5) * 5, Math.random() * 3.4 - 1.3, (Math.random() - 0.5) * 5], i * 3);
  const dustBase = Float32Array.from(dust);
  const dustGeo = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(dust, 3));
  const motes = new Points(dustGeo, new PointsMaterial({ color: new Color('#dfff8a'), size: 0.05, map: tex, transparent: true, opacity: 0.7, depthWrite: false, blending: AdditiveBlending }));
  root.add(motes);

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const d = 7.9 / Math.min(1, camera.aspect);
    camera.position.set(0, 1.4, d);
    camera.lookAt(0, 0.1, 0);
    camera.updateProjectionMatrix();
  }

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { pointer.tx = 0; pointer.ty = 0; });

  const t0 = performance.now();
  let running = false, visible = false, raf = 0;

  function frame(now) {
    const t = reduceMotion.matches ? 2 : (now - t0) / 1000;
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    root.rotation.y = Math.sin(t * 0.35) * 0.32 + pointer.x * 0.45;
    root.rotation.x = 0.08 + pointer.y * 0.12;
    plates.forEach((g) => {
      g.position.y = centers[plates.indexOf(g)].y + Math.sin(t * 1.2 + g.userData.phase) * 0.05;
      g.rotation.y = t * 0.3 + g.userData.phase;
      if (g.userData.halo) g.userData.halo.material.size = 1.5 + Math.sin(t * 2 + g.userData.phase) * 0.4;
    });
    const k = (t * 0.45) % 1;
    const ease = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    orb.position.copy(root.userData.hop.getPoint(ease));
    const dp = dustGeo.attributes.position;
    for (let i = 0; i < N; i++) {
      dp.setY(i, dustBase[i * 3 + 1] + ((t * 0.12 + i * 0.37) % 1.2) - 0.6);
    }
    dp.needsUpdate = true;
    renderer.render(scene, camera);
  }
  function loop(now) {
    frame(now);
    raf = running ? requestAnimationFrame(loop) : 0;
  }
  function update() {
    const should = visible && !document.hidden && !reduceMotion.matches;
    if (should && !running) { running = true; raf = requestAnimationFrame(loop); }
    else if (!should && running) { running = false; cancelAnimationFrame(raf); }
  }

  resize();
  new ResizeObserver(() => { resize(); if (!running) frame(performance.now()); }).observe(stage);
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; update(); }).observe(stage);
  document.addEventListener('visibilitychange', update);
  reduceMotion.addEventListener('change', () => { update(); if (!running) frame(performance.now()); });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); running = false; stage.classList.remove('is-live'); });

  frame(performance.now());
  update();
  requestAnimationFrame(() => stage.classList.add('is-live'));
}
