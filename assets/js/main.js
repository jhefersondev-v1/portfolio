(() => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav-links');
  const closeMenu = () => { nav?.classList.remove('open'); toggle?.setAttribute('aria-expanded','false'); document.body.style.overflow=''; };
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if(e.key === 'Escape') { closeMenu(); toggle?.focus(); } });
  document.addEventListener('click', e => { if(nav?.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) closeMenu(); });

  const reveal = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('visible'); io.unobserve(entry.target); } }), {threshold:.1});
    reveal.forEach(el => io.observe(el));
  } else reveal.forEach(el => el.classList.add('visible'));

  const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = [...document.querySelectorAll('main section[id]')];
  if('IntersectionObserver' in window){
    const spy = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`)); }), {rootMargin:'-35% 0px -55%'});
    sections.forEach(s => spy.observe(s));
  }

  const copy = document.querySelector('[data-copy-email]');
  const status = document.querySelector('[data-copy-status]');
  copy?.addEventListener('click', async () => {
    const email = copy.dataset.copyEmail;
    try { await navigator.clipboard.writeText(email); status.textContent='Correo copiado.'; setTimeout(()=>status.textContent='',2200); }
    catch { location.href=`mailto:${email}`; }
  });
  const year = document.querySelector('[data-year]'); if(year) year.textContent = new Date().getFullYear();
})();
