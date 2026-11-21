#!/usr/bin/env node
// Liste tous les textes français des pages vitrines (pas les pages légales) dans i18n/a-traduire.json.
// Usage : node scripts/i18n-extract.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { textsOf } from './i18n-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = ['index.html', 'methode/index.html', 'offre/index.html', 'contact/index.html', '404.html',
  'partials/header.html', 'partials/footer.html', 'partials/faq.html', 'partials/mobile.html', 'partials/offer.html', 'partials/head.html'];
const seen = new Map();
for (const f of SOURCES) for (const t of textsOf(fs.readFileSync(path.join(root, f), 'utf8'))) if (!seen.has(t)) seen.set(t, f);
const out = Object.fromEntries([...seen.keys()].map((t) => [t, '']));
fs.writeFileSync(path.join(root, 'i18n', 'a-traduire.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`${seen.size} textes`);
