// Bewegingssysteem: GSAP + ScrollTrigger op de gewone, native scroll.
// Statische eerste frame blijft compleet zonder JS; onder "verminderde beweging" tonen we meteen de eindstand.
(function () {
  if (!window.gsap) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.config({ ignoreMobileResize: true });

  // ---- koppen in woorden splitsen, toegankelijk (volledige naam blijft op het element) ----
  const splitWords = el => {
    if (el.dataset.split || el.querySelector('*')) return null; // geen inline markup splitsen
    const text = el.textContent.trim(); el.setAttribute('aria-label', text); el.dataset.split = '1';
    el.innerHTML = text.split(/\s+/).map(w => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
    return el.querySelectorAll('.w');
  };

  if (reduce) { document.documentElement.classList.add('motion-done'); return; }

  // ---- hero-intro: kort, gecomponeerd, knoppen blijven bruikbaar ----
  const hero = document.querySelector('.hero');
  if (hero) {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(hero.querySelector('.seg'), { y: 10, opacity: 0, duration: .5 }, 0)
      .from(hero.querySelector('h1'), { y: 24, opacity: 0, duration: .8 }, .05)
      .from(hero.querySelector('.lead'), { y: 16, opacity: 0, duration: .6 }, .25)
      .from(hero.querySelectorAll('.actions > *'), { opacity: 0, duration: .5, stagger: .07 }, .35)
      .from(hero.querySelector('.art'), { scale: .96, opacity: 0, duration: .9, transformOrigin: '50% 60%' }, .15)
      .from(document.querySelector('.sponsor-band'), { opacity: 0, y: 12, duration: .6 }, .6);
  } else {
    const ph = document.querySelector('.page-hero');
    if (ph) gsap.from(ph.querySelectorAll('h1, .lead, .btn, .crumbs, .seg'), { y: 16, opacity: 0, duration: .6, stagger: .06, ease: 'power3.out' });
  }

  // ---- sectiekoppen: woord voor woord, ingehouden ----
  document.querySelectorAll('section h2, .page-hero + section h2').forEach(h => {
    const words = splitWords(h); if (!words) return;
    gsap.from(words, { yPercent: 40, opacity: 0, duration: .5, stagger: .04, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 85%', once: true } });
  });
  // ---- kaarten en blokken: zachte reveal ----
  document.querySelectorAll('.paths > *, .cards > *, .cal, .prices > *, .tbl, .form, .split > *, .team, .steps > *, .logos').forEach(el => {
    gsap.from(el, { y: 20, opacity: 0, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  // ---- tagline: woorden lichten op bij het scrollen, gescrubd ----
  document.querySelectorAll('.reveal-words').forEach(el => {
    const words = splitWords(el); if (!words) return;
    gsap.fromTo(words, { opacity: .25 }, { opacity: 1, stagger: .08, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: .6 } });
  });
  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
