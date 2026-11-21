import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from './site.config.js';
import { get, missing, publishable } from './scripts/launch-check.js';
import { translateHtml } from './scripts/i18n-core.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));

// Le site est en corse par défaut : chaque texte français connu de i18n/co.json est remplacé à la
// construction. Le bouton « Lire cette page en français » remet le français (src/lang.js).
// Les textes légaux restent en français (seuls l'en-tête et le pied de page sont traduits).
const CO = JSON.parse(fs.readFileSync(path.join(root, 'i18n', 'co.json'), 'utf8'));
const LEGAL = ['mentions-legales', 'confidentialite', 'conditions', 'credits'];

// Pages publiques : clé → fichier source.
const PAGES = {
  accueil: 'index.html',
  methode: 'methode/index.html',
  offre: 'offre/index.html',
  contact: 'contact/index.html',
  'mentions-legales': 'mentions-legales/index.html',
  confidentialite: 'confidentialite/index.html',
  conditions: 'conditions/index.html',
  credits: 'credits/index.html',
  404: '404.html',
};

const AUDIO = [
  { id: 'bonifacio', name: 'Bonifacio', page: 'https://commons.wikimedia.org/wiki/File:Co-Bonifacio.ogg' },
  { id: 'bustanico', name: 'Bustanico', page: 'https://commons.wikimedia.org/wiki/File:Co-Bustanico.oga' },
  { id: 'serriera', name: 'Serriera', page: 'https://commons.wikimedia.org/wiki/File:Co-Serriera.ogg' },
];

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const todo = (label) => `<mark class="todo">À compléter&nbsp;: ${esc(label)}</mark>`;

function pageKey(file) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  return Object.keys(PAGES).find((k) => PAGES[k] === rel) ?? 'accueil';
}

function urlFor(key) {
  if (key === 'accueil') return '/';
  if (key === '404') return '/404.html';
  return `/${key}/`;
}

function audioAvailable() {
  return AUDIO.every((a) => fs.existsSync(path.join(root, 'public/audio', `co-${a.id}.mp3`)));
}

function render(html, key) {
  const ok = publishable(config);
  const open = config.status === 'ouvert';
  const hasAudio = audioAvailable();
  const hasShots = Array.isArray(config.screenshots) && config.screenshots.length > 0;
  const flags = {
    open,
    preopen: !open,
    draft: !ok,
    final: ok,
    audio: hasAudio,
    noaudio: !hasAudio,
    screens: hasShots,
    noscreens: !hasShots,
    app: !!config.appUrl,
    noapp: !config.appUrl,
  };

  // Inclusions
  html = html.replace(/<!--@include (\w+)-->/g, (_, name) =>
    fs.readFileSync(path.join(root, 'partials', `${name}.html`), 'utf8'),
  );

  // Conditions (non imbriquées)
  html = html.replace(/<!--@if (!?)(\w+)-->([\s\S]*?)<!--@endif-->/g, (_, not, flag, body) => {
    if (!(flag in flags)) throw new Error(`Condition inconnue : ${flag}`);
    return (not ? !flags[flag] : flags[flag]) ? body : '';
  });

  // Corse par défaut (avant les champs {{…}}, pour que les phrases restent entières)
  html = translateHtml(html, CO);
  const corsican = !LEGAL.includes(key);
  html = html.replace('<html lang="fr">', `<html lang="${corsican ? 'co' : 'fr'}">`);

  // Page courante dans la navigation
  html = html.replace(new RegExp(`data-nav="${key}"`, 'g'), `data-nav="${key}" aria-current="page"`);

  // En-tête : titre, description, canonical, aperçu social, robots
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || config.brand;
  const description = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const abs = (p) => (config.siteUrl ? config.siteUrl.replace(/\/$/, '') + p : p);
  const head = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="${corsican ? 'co_FR' : 'fr_FR'}">`,
    `<meta property="og:site_name" content="${esc(config.brand)}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:image" content="${abs('/og-image.png')}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    config.siteUrl && key !== '404' ? `<link rel="canonical" href="${abs(urlFor(key))}">` : '',
    `<meta property="og:url" content="${abs(urlFor(key))}">`,
    // Pas d'indexation tant que les mentions obligatoires ne sont pas complètes.
    !ok || key === '404' ? `<meta name="robots" content="noindex">` : '',
  ]
    .filter(Boolean)
    .join('\n    ');
  html = html.replace('<!--@seo-->', head);

  // Champs du propriétaire : {{f:chemin|Libellé}}
  html = html.replace(/\{\{f:([\w.]+)\|([^}]+)\}\}/g, (_, p, label) => {
    const v = String(get(config, p) ?? '').trim();
    return v ? esc(v) : todo(label);
  });

  // Contact
  html = html.replace(/\{\{mail\}\}/g, () =>
    config.contactEmail
      ? `<a href="mailto:${esc(config.contactEmail)}">${esc(config.contactEmail)}</a>`
      : todo('adresse e-mail de contact'),
  );
  html = html.replace(/\{\{appUrl\}\}/g, esc(config.appUrl || '/offre/'));
  html = html.replace(/\{\{updated\}\}/g, esc(config.lastUpdated));
  html = html.replace(/\{\{year\}\}/g, '2026');

  // Liste des manques (pages légales / contact)
  html = html.replace(/\{\{missing\}\}/g, () => {
    const m = missing(config).publication;
    return m.length ? `<ul>${m.map(([, l]) => `<li>${esc(l)}</li>`).join('')}</ul>` : '';
  });

  // Bibliothèque d'écoute
  html = html.replace(/\{\{audio\}\}/g, () =>
    AUDIO.map(
      (a) => `<figure class="voice">
        <figcaption><span class="voice__name">${a.name}</span>
          <a href="${a.page}" rel="noopener" target="_blank">Source et licence<span class="sr-only"> (${a.name}, nouvel onglet)</span></a></figcaption>
        ${
          hasAudio
            ? `<audio controls preload="none" data-voice><source src="/audio/co-${a.id}.ogg" type="audio/ogg"><source src="/audio/co-${a.id}.mp3" type="audio/mpeg"></audio>`
            : `<a class="voice__listen" href="${a.page}" rel="noopener" target="_blank">Écouter sur Wikimedia Commons<span class="sr-only"> (nouvel onglet)</span></a>`
        }
      </figure>`,
    ).join('\n'),
  );

  // Captures réelles
  html = html.replace(/\{\{screens\}\}/g, () =>
    (config.screenshots || [])
      .map(
        (s) => `<figure class="shot reveal"><img src="${esc(s.src)}" alt="${esc(s.alt)}" loading="lazy" decoding="async">${
          s.caption ? `<figcaption>${esc(s.caption)}</figcaption>` : ''
        }</figure>`,
      )
      .join('\n'),
  );

  const left = html.match(/\{\{[^}]*\}\}|<!--@[^>]*-->/);
  if (left) throw new Error(`Jeton non traité dans ${key} : ${left[0]}`);
  return html;
}

function ampara() {
  let printed = false;
  return {
    name: 'ampara-pages',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        return render(html, pageKey(ctx.filename));
      },
    },
    generateBundle() {
      const ok = publishable(config);
      const lines = ['User-agent: *'];
      if (ok && config.siteUrl) {
        lines.push('Disallow: /404.html', `Sitemap: ${config.siteUrl.replace(/\/$/, '')}/sitemap.xml`);
        const urls = Object.keys(PAGES)
          .filter((k) => k !== '404')
          .map((k) => `  <url><loc>${config.siteUrl.replace(/\/$/, '')}${urlFor(k)}</loc></url>`)
          .join('\n');
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        });
      } else {
        // Préversion : informations légales incomplètes → pas d'indexation.
        lines.push('Disallow: /');
      }
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: lines.join('\n') + '\n' });
    },
    closeBundle() {
      if (printed) return;
      printed = true;
      const m = missing(config);
      if (m.publication.length) {
        console.log(
          `\n[Amparà] Préversion : ${m.publication.length} information(s) obligatoire(s) manquante(s) → noindex. Lancer « npm run check » pour le détail.\n`,
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [ampara()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(Object.entries(PAGES).map(([k, f]) => [k, path.resolve(root, f)])),
    },
    chunkSizeWarningLimit: 700,
  },
});
