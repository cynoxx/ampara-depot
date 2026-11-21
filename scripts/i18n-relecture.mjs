#!/usr/bin/env node
// Fabrique i18n/RELECTURE-PROF.md : chaque texte du site en français puis en corse, à faire relire.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const co = JSON.parse(fs.readFileSync(path.join(root, 'i18n', 'co.json'), 'utf8'));
const clean = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\|/g, '\\|');
const lines = [
  '# Site Amparà : texte corse à relire',
  '',
  'Le site s’affiche en corse par défaut ; un bouton « Lire cette page en français » remet le français.',
  'Chaque mot corse a été cherché dans INFCOR (ADECEC), mais les tournures n’ont pas été relues par un corsophone.',
  '',
  '**Pour corriger :** note le numéro et la nouvelle phrase (ou corrige directement le fichier `i18n/co.json`).',
  '',
  '| N° | Français | Corse |',
  '|---|---|---|',
  ...Object.entries(co).map(([fr, c], i) => `| ${i + 1} | ${clean(fr)} | ${clean(c)} |`),
  '',
];
fs.writeFileSync(path.join(root, 'i18n', 'RELECTURE-PROF.md'), lines.join('\n'));
console.log(`${Object.keys(co).length} phrases dans i18n/RELECTURE-PROF.md`);
