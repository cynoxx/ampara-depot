import './styles.css';

const root = document.documentElement;
root.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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
