// header-rand bij scrollen
const header = document.querySelector('.site-header');
const onScroll = () => header && header.classList.toggle('scrolled', scrollY > 8); onScroll(); addEventListener('scroll', onScroll, { passive: true });
// mobiel menu
const burger = document.querySelector('.burger'), menu = document.querySelector('.mobile-menu');
const setMenu = o => { menu.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); burger.textContent = o ? '✕' : '☰'; };
if (burger && menu) { burger.addEventListener('click', () => setMenu(!menu.classList.contains('open'))); addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } }); menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false))); }
// tennis / padel in de hero
const hero = document.querySelector('.hero[data-sport]');
if (hero) {
  const copy = {
    tennis: { h: 'Tennis en padel aan de <span>Bosstraat</span>, sinds 1976.', p: '4 gravelbanen in Groot-Bijgaarden, open van april tot en met oktober. Kinderen spelen al vanaf € 70 per seizoen.' },
    padel:  { h: 'Padel het <span>hele jaar</span>, voor jong en oud.', p: '3 nieuwe padelterreinen, lessen op maandag en woensdag, tornooien in april, juni en augustus. Jeugd vanaf € 120 per jaar.' }
  };
  const set = (s, from3d) => { hero.dataset.sport = s; if (!from3d && window.hero3d) window.hero3d.setSport(s); hero.querySelectorAll('.seg button').forEach(b => b.classList.toggle('on', b.dataset.sport === s)); hero.querySelector('h1').innerHTML = copy[s].h; hero.querySelector('.lead').textContent = copy[s].p; };
  hero.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => set(b.dataset.sport)));
  window.setHeroSport = set;
}
// kalenderfilters
document.querySelectorAll('.filters').forEach(f => f.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  f.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  const k = b.dataset.f; document.querySelectorAll('.ev[data-k]').forEach(ev => ev.classList.toggle('hide', k !== 'alle' && ev.dataset.k !== k));
}));
// formulieren: stellen een e-mail op naar info@trgb.be (werkt zonder server)
document.querySelectorAll('form.form').forEach(fm => fm.addEventListener('submit', e => {
  e.preventDefault(); if (!fm.reportValidity()) return;
  const subject = fm.dataset.subject || 'Bericht via trgb.be';
  const lines = [...fm.querySelectorAll('input,select,textarea')].filter(i => i.type !== 'checkbox' && i.type !== 'submit' && i.value).map(i => `${i.dataset.label || i.name || i.placeholder || 'Veld'}: ${i.value}`);
  const body = lines.join('\n');
  const mailto = `mailto:info@trgb.be?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const ok = fm.querySelector('.ok');
  ok.innerHTML = `Je e-mailprogramma opent met dit bericht. Opent er niets? Kopieer de tekst hieronder en mail naar <b>info@trgb.be</b>.<textarea readonly>Onderwerp: ${subject}\n\n${body}</textarea><button type="button" class="btn btn-sm copy">Kopieer tekst</button> <a class="btn btn-sm btn-quiet" href="${mailto}">Open e-mail</a>`;
  ok.style.display = 'block'; ok.querySelector('.copy').addEventListener('click', ev => { navigator.clipboard?.writeText(ok.querySelector('textarea').value).then(() => ev.target.textContent = 'Gekopieerd ✓').catch(() => {}); });
  location.href = mailto;
}));


// pauzeknop: sponsorband en 3D-scène (richtlijn: bewegende inhoud langer dan 5 s moet te pauzeren zijn)
const pauseBtn = document.querySelector('.pause');
if (pauseBtn) pauseBtn.addEventListener('click', () => { const on = pauseBtn.getAttribute('aria-pressed') !== 'true'; pauseBtn.setAttribute('aria-pressed', on); pauseBtn.textContent = on ? 'Hervat' : 'Pauzeer'; document.documentElement.classList.toggle('paused', on); if (window.hero3d) window.hero3d[on ? 'pause' : 'resume'](); });
