// `npm run verify` — contrôle du site construit (lancer `npm run build` puis `npm run preview` avant).
// Vérifie : erreurs console, liens internes, débordement horizontal (390 px et 1280 px),
// accessibilité (axe-core, WCAG A/AA), lisibilité sans WebGL et en mouvement réduit.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const PAGES = ['/', '/methode/', '/offre/', '/contact/', '/mentions-legales/', '/confidentialite/', '/conditions/', '/credits/', '/404.html'];
let failures = 0;
const fail = (m) => { failures++; console.log('  ✗ ' + m); };

const browser = await chromium.launch();
const seen = new Set();
const links = new Set();

for (const [w, h, scheme] of [[390, 844, 'light'], [1280, 860, 'light'], [1280, 860, 'dark']]) {
  console.log(`\n${w}px, ${scheme}`);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
  for (const path of PAGES) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    const res = await page.goto(BASE + path, { waitUntil: 'networkidle' });
    if (!res || (res.status() >= 400 && path !== '/404.html')) fail(`${path} → HTTP ${res?.status()}`);
    // Révéler tout le contenu avant l'audit
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('is-in')));
    await page.waitForTimeout(1200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) fail(`${path} : débordement horizontal de ${overflow}px`);
    if (errors.length) fail(`${path} : erreurs console ${errors.join(' | ')}`);
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    for (const href of hrefs) {
      if (/localhost|file:|example\.com/.test(href)) fail(`${path} : lien interdit ${href}`);
      if (href.startsWith('/')) links.add(href.split('#')[0] || '/');
    }
    if (!seen.has(path + scheme)) {
      seen.add(path + scheme);
      await page.addScriptTag({ content: axeSource });
      const r = await page.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'best-practice'] })).violations);
      for (const v of r) fail(`${path} : axe ${v.id} (${v.impact}) ×${v.nodes.length} — ${v.nodes[0].target.join(' ')}`);
    }
    await page.close();
  }
  await ctx.close();
}

console.log('\nLiens internes');
for (const l of links) {
  const r = await fetch(BASE + l);
  if (r.status !== 200) fail(`${l} → HTTP ${r.status}`);
}
console.log(`  ${links.size} liens contrôlés`);

console.log('\nSans WebGL et en mouvement réduit');
{
  const b2 = await chromium.launch({ args: ['--disable-gpu', '--disable-webgl', '--disable-3d-apis'] });
  const p = await b2.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const ok = await p.evaluate(() => {
    const f = document.querySelector('.island-fallback');
    return !!f && getComputedStyle(f).opacity === '1' && !document.querySelector('[data-island] canvas') && document.querySelector('h1').getBoundingClientRect().height > 0;
  });
  if (!ok) fail('sans WebGL : illustration de secours ou titre absent'); else console.log('  ✓ illustration de secours affichée, contenu lisible');
  await b2.close();
  const p2 = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  await p2.goto(BASE + '/', { waitUntil: 'networkidle' });
  const hidden = await p2.evaluate(() => [...document.querySelectorAll('.reveal')].filter((e) => getComputedStyle(e).opacity !== '1').length);
  if (hidden) fail(`mouvement réduit : ${hidden} éléments masqués`); else console.log('  ✓ tout le contenu visible sans animation');
}

await browser.close();
console.log(failures ? `\n${failures} problème(s).` : '\nAucun problème détecté.');
process.exit(failures ? 1 : 0);
