import './styles.css';
import { initFx } from './fx.js';
import { applyLanguage } from './lang.js';

const root = document.documentElement;
root.classList.add('js');
// La langue d'abord : les animations de titres découpent ensuite le texte affiché.
applyLanguage();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
initFx(reduceMotion);

/* ---------- En-tête : ombre au défilement ---------- */
const header = document.querySelector('[data-header]');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- Menu mobile ---------- */
const toggle = document.querySelector('[data-nav-toggle]');
const menu = document.querySelector('[data-nav-menu]');
if (toggle && menu) {
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => e.matches && setOpen(false));
}

/* ---------- Apparitions au défilement ---------- */
const reveals = document.querySelectorAll('.reveal');
if (!('IntersectionObserver' in window) || reduceMotion.matches) {
  reveals.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  reveals.forEach((el, i) => {
    // Léger décalage entre éléments voisins d'une même grille
    const siblings = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains('reveal')) : [];
    const idx = siblings.indexOf(el);
    if (idx > 0) el.style.transitionDelay = `${Math.min(idx, 4) * 90}ms`;
    io.observe(el);
  });
}

/* ---------- Lecteurs audio : un seul à la fois, lecture ralentie ---------- */
const players = document.querySelectorAll('audio[data-voice]');
players.forEach((audio) => {
  audio.addEventListener('play', () => {
    players.forEach((other) => other !== audio && other.pause());
  });
});

/* ---------- Île 3D (chargée à part, jamais nécessaire pour lire la page) ---------- */
const stage = document.querySelector('[data-island]');

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

if (stage && webglAvailable()) {
  const start = () =>
    import('./island.js')
      .then((m) =>
        m.mountIsland(stage, {
          reduceMotion,
          pins: {
            container: document.querySelector('[data-pins]'),
            items: [
              { label: 'A0', sub: 'Disponible', on: true },
              { label: 'A1', sub: 'Disponible', on: true },
              { label: 'A2', sub: 'En préparation' },
              { label: 'B1', sub: 'En préparation' },
            ],
          },
        }),
      )
      .catch(() => {
        /* L'illustration statique reste affichée. */
      });
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1200 });
  else setTimeout(start, 300);
}

/* ---------- Escales en 3D (chargées quand la section approche) ---------- */
const steps = document.querySelector('[data-steps3d]');
if (steps && webglAvailable() && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    import('./steps3d.js')
      .then((m) => m.mountSteps(steps, { reduceMotion }))
      .catch(() => { /* l'illustration SVG reste affichée */ });
  }, { rootMargin: '400px 0px' });
  io.observe(steps);
}

/* ---------- Liste d'attente de l'application mobile ---------- */
const waitlist = document.querySelector('[data-waitlist]');
if (waitlist) {
  const status = waitlist.querySelector('.mobile__status');
  const submit = waitlist.querySelector('[data-waitlist-submit]');
  const say = (msg, kind = '') => { status.textContent = msg; status.dataset.kind = kind; };
  const KEY = 'ampara_waitlist_mobile';
  let done = false;
  try { if (localStorage.getItem(KEY)) { done = true; waitlist.classList.add('is-done'); submit.disabled = true; say('Tu es sur la liste : on te prévient dès la sortie.', 'ok'); } } catch { /* stockage indisponible */ }
  waitlist.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (done) return;
    const data = new FormData(waitlist);
    const input = waitlist.elements.namedItem('email');
    const email = String(data.get('email') || '').trim();
    if (!email || !input.checkValidity()) { say('Indique une adresse e-mail valide.', 'error'); input.focus(); return; }
    if (!data.get('consent')) { say('Coche la case pour accepter d’être prévenu(e).', 'error'); return; }
    submit.disabled = true;
    say('Inscription…');
    try {
      const r = await fetch(waitlist.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, platform: data.get('platform') || '', consent: true, source: 'site', website: data.get('website') || '' }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Inscription impossible pour le moment.');
      done = true;
      waitlist.classList.add('is-done');
      say(j.already ? 'Tu étais déjà inscrit(e) : on te prévient dès la sortie.' : 'C’est noté ! On te prévient dès la sortie. En attendant, Amparà marche déjà sur ton téléphone.', 'ok');
      try { localStorage.setItem(KEY, new Date().toISOString()); } catch { /* stockage indisponible */ }
    } catch (err) {
      say(err instanceof TypeError ? 'Connexion impossible. Vérifie ta connexion et réessaie.' : err.message, 'error');
      submit.disabled = false;
    }
  });
}

// Provenance : les paramètres UTM du lien (vidéo, pub, créateur) suivent le visiteur jusqu'à l'app,
// qui les joint à la commande. Sans eux, impossible de savoir quelle vidéo a vendu.
(() => {
  const q = new URLSearchParams(location.search);
  const keep = new URLSearchParams();
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref']) {
    const v = q.get(k);
    if (v) keep.set(k, v.slice(0, 60));
  }
  if (![...keep.keys()].length) return;
  document.querySelectorAll('a[href^="https://ampara-app-virid.vercel.app"]').forEach((a) => {
    const u = new URL(a.href);
    keep.forEach((v, k) => u.searchParams.set(k, v));
    a.href = u.toString();
  });
})();
