(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.getElementById('sitenav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, {passive: true});
  onScroll();

  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    const closeMenu = refocus => {
      nav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      if (refocus) menuBtn.focus();
    };
    menuBtn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.addEventListener('click', e => {
      if (e.target.tagName === 'A') closeMenu(e.target.getAttribute('href').startsWith('#'));
    });
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('open')) closeMenu(true);
    });
  }

  // split the story statement into words (home page only)
  const scrubText = document.getElementById('scrubText');
  const words = [];
  if (scrubText) {
    const nodes = Array.from(scrubText.childNodes);
    scrubText.textContent = '';
    nodes.forEach(node => {
      const acc = node.nodeType === 1 ? node.getAttribute('data-acc') : null;
      (node.textContent || '').split(/\s+/).forEach(wd => {
        if (!wd) return;
        const s = document.createElement('span');
        s.className = 'w' + (acc === 'p' ? ' acc-p' : acc === 'b' ? ' acc-b' : '');
        s.textContent = wd;
        scrubText.appendChild(s);
        scrubText.appendChild(document.createTextNode(' '));
        words.push(s);
      });
    });
  }

  if (reduce || !('IntersectionObserver' in window)) {
    words.forEach(w => { w.style.opacity = '1'; });
    return;
  }
  document.documentElement.classList.add('js');

  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), {threshold: .12, rootMargin: '0px 0px -8% 0px'});
  document.querySelectorAll('.fx').forEach(el => io.observe(el));

  const fmt = (n, dec) => n.toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec});
  const animate = el => {
    const final = el.dataset.final;
    const m = final.match(/^([^0-9]*)([\d,.]+)(.*)$/);
    if (!m) { el.textContent = final; return; }
    const target = parseFloat(m[2].replace(/,/g, ''));
    const dec = (m[2].split('.')[1] || '').length;
    const t0 = performance.now(), dur = 1100;
    const step = t => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = m[1] + fmt(target * eased, dec) + m[3];
      if (p < 1) requestAnimationFrame(step); else el.textContent = final;
    };
    requestAnimationFrame(step);
  };
  const cio = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { animate(e.target); cio.unobserve(e.target); }
  }), {threshold: .6});
  document.querySelectorAll('[data-count]').forEach(el => {
    el.dataset.final = el.textContent;
    cio.observe(el);
  });

  // pinned word scrub + progress bar, one rAF loop
  const scrubWrap = document.getElementById('story');
  const progress = document.getElementById('progress');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let ticking = false;
  const apply = () => {
    ticking = false;
    if (progress) progress.style.transform = 'scaleX(' + clamp(scrollY / (document.documentElement.scrollHeight - innerHeight), 0, 1).toFixed(4) + ')';
    if (scrubWrap && words.length) {
      const vh = innerHeight;
      const rect = scrubWrap.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return; // scrub off-screen: skip the word loop
      const total = scrubWrap.offsetHeight - vh;
      if (total > 0) {
        const p = clamp(-rect.top / total, 0, 1);
        const n = words.length;
        for (let i = 0; i < n; i++) {
          const start = (i / n) * 0.68;
          words[i].style.opacity = String(0.45 + 0.55 * clamp((p - start) / 0.16, 0, 1));
        }
      }
    }
  };
  const schedule = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(apply);
    setTimeout(() => { ticking = false; }, 150); // rAF pauses in hidden tabs; don't let the throttle stick
  };
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule);
  apply();
})();
