// Effets d'interface : reflets « liquid glass », inclinaison 3D, boutons aimantés,
// titres mot à mot, barre de progression, halo du curseur.
// Tout est décoratif et désactivé si l'utilisateur réduit les animations.

export function initFx(reduceMotion) {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Titres découpés en mots (le texte reste lisible par les lecteurs d'écran). */
  document.querySelectorAll('[data-split]').forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement('span');
            w.className = 'w';
            w.style.setProperty('--i', String(i++));
            w.textContent = part;
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && !child.matches('svg')) {
          walk(child);
        }
      });
    };
    walk(el);
    el.classList.add('is-split');
  });

  const split = document.querySelectorAll('[data-split]');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    split.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.3 });
    split.forEach((el) => io.observe(el));
  }

  /* Barre de progression de lecture. */
  const bar = document.querySelector('[data-progress]');
  if (bar) {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (reduceMotion.matches || !finePointer) return;

  /* Reflet spéculaire qui suit le pointeur sur toutes les surfaces de verre. */
  const glassSel = '.lg, .glass, .feature, .offer, .faq__item, .step, .card, .voice, .sources li, .site-header__inner, .btn';
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest?.(glassSel);
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  }, { passive: true });

  /* Inclinaison 3D des cartes. */
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    let raf = 0;
    el.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${(-y * 9).toFixed(2)}deg) rotateY(${(x * 11).toFixed(2)}deg) translateZ(6px)`;
      });
    });
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      el.style.transform = '';
    });
  });

  /* Boutons aimantés. */
  document.querySelectorAll('.btn--primary, .btn--ghost, .btn--sun, .btn--ghost-light').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      b.style.translate = `${(x * 0.18).toFixed(1)}px ${(y * 0.28).toFixed(1)}px`;
    });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; });
  });

  /* Halo lumineux qui suit le curseur. */
  const halo = document.createElement('div');
  halo.className = 'cursor-halo';
  halo.setAttribute('aria-hidden', 'true');
  document.body.append(halo);
  let hx = innerWidth / 2, hy = innerHeight / 2, tx = hx, ty = hy, moving = false;
  window.addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    halo.classList.add('is-on');
    if (!moving) { moving = true; requestAnimationFrame(follow); }
  }, { passive: true });
  function follow() {
    hx += (tx - hx) * 0.14; hy += (ty - hy) * 0.14;
    halo.style.transform = `translate(${hx.toFixed(1)}px, ${hy.toFixed(1)}px)`;
    if (Math.abs(tx - hx) + Math.abs(ty - hy) > 0.5) requestAnimationFrame(follow);
    else moving = false;
  }
  document.addEventListener('pointerleave', () => halo.classList.remove('is-on'));
}
