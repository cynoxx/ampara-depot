// Traduction du site, partagée par la construction (vite.config.js) et les outils.
// Le dictionnaire i18n/co.json associe chaque texte français (espaces normalisés) à sa version corse.

const SKIP = /<(script|style|svg|template|textarea)\b[\s\S]*?<\/\1>/gi;
const ATTRS = ['aria-label', 'alt', 'title', 'placeholder'];
export const norm = (s) => s.replace(/\s+/g, ' ').trim();
const isText = (s) => /[A-Za-zÀ-ÿ]/.test(s) && !/^\{\{[^}]+\}\}$/.test(s.trim()) && !/^<!--/.test(s.trim());

/** Textes visibles (nœuds texte + attributs + titre + description) d'un fragment HTML. */
export function textsOf(html) {
  const out = [];
  const clean = html.replace(SKIP, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const m of clean.matchAll(/>([^<>]+)</g)) {
    const t = norm(m[1]);
    if (t && isText(t)) out.push(t);
  }
  for (const a of ATTRS) for (const m of clean.matchAll(new RegExp(`\\s${a}="([^"]+)"`, 'g'))) {
    const t = norm(m[1]);
    if (t && isText(t)) out.push(t);
  }
  for (const m of clean.matchAll(/<meta name="description" content="([^"]+)"/g)) out.push(norm(m[1]));
  return out;
}

/** Remplace dans le HTML chaque texte connu du dictionnaire par sa version corse. */
export function translateHtml(html, dict) {
  const parts = html.split(/(<(?:script|style|svg|template|textarea)\b[\s\S]*?<\/(?:script|style|svg|template|textarea)>)/i);
  return parts.map((part, i) => {
    if (i % 2 === 1) return part; // blocs à ne pas toucher
    let h = part.replace(/>([^<>]+)</g, (whole, text) => {
      const key = norm(text);
      const co = dict[key];
      if (!co) return whole;
      const lead = text.match(/^\s*/)[0];
      const trail = text.match(/\s*$/)[0];
      return `>${lead}${co}${trail}<`;
    });
    h = h.replace(new RegExp(`(\\s(?:${ATTRS.join('|')})=")([^"]+)(")`, 'g'), (whole, a, text, b) => {
      const co = dict[norm(text)];
      return co ? `${a}${co}${b}` : whole;
    });
    h = h.replace(/(<meta (?:name="description"|property="og:(?:title|description)") content=")([^"]+)(")/g, (whole, a, text, b) => {
      const co = dict[norm(text)];
      return co ? `${a}${co}${b}` : whole;
    });
    return h;
  }).join('');
}
