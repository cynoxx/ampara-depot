// `npm run images` — régénère public/og-image.png (1200×630) et public/apple-touch-icon.png
// à partir du site lui-même (preview lancé sur le port 4173).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://localhost:4173';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: 'reduce' });
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await p.addStyleTag({ content: `.status-bar,.site-header,.hero__actions,.hero__cards,.hero__stage-note{display:none!important}
  .hero{margin:0!important;padding:0 0 70px!important;min-height:630px!important;height:630px}.hero__title{font-size:74px!important}.hero__lead{font-size:21px!important;max-width:30em}` });
await p.waitForTimeout(3500);
await p.screenshot({ path: 'public/og-image.png' });
// Vue aérienne de l'île, utilisée dans la maquette de tablette.
const a = await b.newPage({ viewport: { width: 1200, height: 760 }, reducedMotion: 'reduce' });
await a.goto(BASE + '/', { waitUntil: 'networkidle' });
await a.addStyleTag({ content: `.status-bar,.site-header,.hero__inner,.pins,.hero__shade,.hero__stage-note,.island-fallback{display:none!important}
  .hero{margin:0!important;padding:0!important;min-height:760px!important;height:760px}` });
await a.waitForTimeout(3500);
await (await a.$('.hero__scene')).screenshot({ path: 'public/ile-aerienne.jpg', type: 'jpeg', quality: 82 });
const i = await b.newPage({ viewport: { width: 180, height: 180 } });
await i.setContent(`<body style="margin:0;background:#0b1510"><img src="${BASE}/favicon.svg" style="width:180px;height:180px;display:block"></body>`);
await i.waitForTimeout(300);
await i.screenshot({ path: 'public/apple-touch-icon.png' });
await b.close();
console.log('Images générées.');
