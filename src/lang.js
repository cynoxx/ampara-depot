// Langue du site : corse par défaut (pages construites en corse), français sur demande.
// Le bouton « Lire cette page en français » mémorise le choix et recharge la page ;
// le français est alors remis avant les animations de titres (qui découpent le texte).
import co from '../i18n/co.json';

const KEY = 'ampara-site-langue';
const ATTRS = ['aria-label', 'alt', 'title', 'placeholder'];
const ENTITIES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const decode = (s) => s.replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m] ?? m);
const norm = (s) => s.replace(/\s+/g, ' ').trim();

function preferred() {
  try { return localStorage.getItem(KEY) === 'fr' ? 'fr' : 'co'; } catch { return 'co'; }
}

function remember(lang) {
  try { localStorage.setItem(KEY, lang); } catch { /* navigation privée : le choix vaut pour cette page */ }
}

/** Remet le texte français d'origine à la place du corse (texte, attributs, titre, description). */
function toFrench() {
  const back = new Map(Object.entries(co).map(([fr, c]) => [norm(decode(c)), decode(fr)]));
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest('script,style,[data-no-i18n]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const fr = back.get(norm(n.nodeValue));
    if (fr) n.nodeValue = n.nodeValue.match(/^\s*/)[0] + fr + n.nodeValue.match(/\s*$/)[0];
  }
  document.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(',')).forEach((el) => {
    if (el.closest('[data-no-i18n]')) return;
    for (const a of ATTRS) {
      const fr = el.hasAttribute(a) && back.get(norm(el.getAttribute(a)));
      if (fr) el.setAttribute(a, fr);
    }
  });
  const title = back.get(norm(document.title));
  if (title) document.title = title;
  const desc = document.querySelector('meta[name="description"]');
  const d = desc && back.get(norm(desc.content));
  if (d) desc.content = d;
  document.documentElement.lang = 'fr';
}

export function applyLanguage() {
  const lang = preferred();
  const page = document.documentElement.lang;
  if (lang === 'fr' && page !== 'fr') toFrench();
  const btn = document.querySelector('[data-lang-toggle]');
  if (!btn) return;
  const french = document.documentElement.lang === 'fr' && lang === 'fr';
  btn.querySelector('.lang-toggle__badge').textContent = french ? 'CO' : 'FR';
  btn.querySelector('[data-lang-long]').textContent = french ? 'Leghje sta pagina in corsu' : 'Lire cette page en français';
  btn.querySelector('[data-lang-short]').textContent = french ? 'In corsu' : 'En français';
  btn.setAttribute('aria-label', french ? 'Leghje sta pagina in corsu' : 'Lire cette page en français');
  btn.lang = french ? 'co' : 'fr';
  btn.hidden = false;
  btn.addEventListener('click', () => {
    remember(french ? 'co' : 'fr');
    window.location.reload();
  });
}
