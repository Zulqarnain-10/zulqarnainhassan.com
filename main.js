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
    addEventListener('pointerdown', e => {
      if (nav.classList.contains('open') && !nav.contains(e.target)) closeMenu(false);
    });
  }

  // pause the marquee on tap (hover and focus are handled in CSS)
  const marquee = document.querySelector('.marquee');
  if (marquee) marquee.addEventListener('touchstart', () => marquee.classList.toggle('paused'), {passive: true});

  // rotating recommendations (about page only)
  const rotator = document.getElementById('quoteRotator');
  if (rotator) {
    const slides = Array.from(rotator.querySelectorAll('.pull-slide'));
    const dots = Array.from(rotator.querySelectorAll('.pull-dots button'));
    let cur = 0, timer = null;
    const show = i => {
      cur = i;
      slides.forEach((s, k) => s.classList.toggle('is-on', k === i));
      dots.forEach((d, k) => d.setAttribute('aria-pressed', k === i ? 'true' : 'false'));
    };
    const arm = () => {
      if (reduce) return;
      clearInterval(timer);
      timer = setInterval(() => show((cur + 1) % slides.length), 6500);
    };
    dots.forEach((d, i) => d.addEventListener('click', () => { show(i); arm(); }));
    rotator.addEventListener('mouseenter', () => clearInterval(timer));
    rotator.addEventListener('mouseleave', arm);
    rotator.addEventListener('focusin', () => clearInterval(timer));
    rotator.addEventListener('focusout', arm);
    arm();
  }

  // copy email (contact page only)
  const copyBtn = document.getElementById('copyEmail');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const email = 'zulqarnainhsyed@gmail.com';
      const done = () => {
        copyBtn.classList.add('copied');
        copyBtn.textContent = 'Copied';
        setTimeout(() => { copyBtn.classList.remove('copied'); copyBtn.textContent = 'Copy email'; }, 2200);
      };
      const legacy = () => {
        const ta = document.createElement('textarea');
        ta.value = email;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        done();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done).catch(legacy);
      } else {
        legacy();
      }
    });
  }

  // moments photo lightbox (about page only)
  const momentImgs = document.querySelectorAll('.moment img');
  if (momentImgs.length) {
    const lb = document.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<img alt=""><p class="lb-cap"></p><button class="lb-x" type="button" aria-label="Close photo">✕</button>';
    document.body.appendChild(lb);
    const im = lb.querySelector('img');
    const cap = lb.querySelector('.lb-cap');
    const x = lb.querySelector('.lb-x');
    let last = null;
    const close = () => {
      lb.classList.remove('on');
      document.body.style.overflow = '';
      if (last) last.focus();
    };
    const open = t => {
      im.src = t.src;
      im.alt = t.alt;
      const fc = t.closest('.moment').querySelector('figcaption');
      cap.textContent = fc ? fc.textContent : '';
      lb.classList.add('on');
      document.body.style.overflow = 'hidden';
      last = t;
      x.focus();
    };
    momentImgs.forEach(m => {
      m.setAttribute('tabindex', '0');
      m.setAttribute('role', 'button');
      m.addEventListener('click', () => open(m));
      m.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(m); } });
    });
    x.addEventListener('click', close);
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('on')) close(); });
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
