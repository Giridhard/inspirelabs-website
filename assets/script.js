/* ================================================================
   Inspirelabs — shared interactivity
   ================================================================ */
(function () {
  'use strict';

  // ----------------------------------------------------------------
  // 1. Sticky nav (blur on scroll)
  // ----------------------------------------------------------------
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 8) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ----------------------------------------------------------------
  // 2. Mobile drawer
  // ----------------------------------------------------------------
  const toggle = document.getElementById('menu-toggle');
  const drawer = document.getElementById('mobile-drawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      drawer.classList.toggle('open');
      toggle.setAttribute('aria-expanded', drawer.classList.contains('open'));
    });
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => drawer.classList.remove('open'));
    });
  }

  // ----------------------------------------------------------------
  // 3. Smooth-scroll for in-page anchors only
  // ----------------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ----------------------------------------------------------------
  // 4. Reveal-on-scroll
  // ----------------------------------------------------------------
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger, .stat');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  // ----------------------------------------------------------------
  // 5. Animated counters — handled by section 11b (animateCount) below.
  //    The legacy implementation that lived here was wiping inner spans
  //    via textContent = '0', so it's been removed entirely.
  // ----------------------------------------------------------------

  // ----------------------------------------------------------------
  // 6. Tabs (product showcase)
  // ----------------------------------------------------------------
  const tabs = document.querySelectorAll('.product-tab');
  const panels = document.querySelectorAll('.product-panel');
  if (tabs.length) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const id = tab.dataset.tab;
        tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const panel = document.querySelector(`[data-panel="${id}"]`);
        if (panel) panel.classList.add('active');
      });
      tab.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        const arr = Array.from(tabs);
        const i = arr.indexOf(tab);
        const next = e.key === 'ArrowRight' ? arr[(i + 1) % arr.length] : arr[(i - 1 + arr.length) % arr.length];
        next.click();
        next.focus();
      });
    });
  }

  // ----------------------------------------------------------------
  // 7. Filter chips (careers, insights)
  // ----------------------------------------------------------------
  document.querySelectorAll('[data-filter-group]').forEach(group => {
    const chips = group.querySelectorAll('.filter-chip');
    const targetSelector = group.dataset.filterGroup;
    const items = document.querySelectorAll(targetSelector);

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const filter = chip.dataset.filter;
        items.forEach(item => {
          if (filter === 'all' || (item.dataset.tags || '').split(',').includes(filter)) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  });

  // ----------------------------------------------------------------
  // 8. Forms (contact, partnership) — front-end demo
  //    POST to /api/contact in production. Falls back to mailto.
  // ----------------------------------------------------------------
  document.querySelectorAll('form[data-form]').forEach(form => {
    const success = form.querySelector('.form-success');
    const inboxAttr = form.dataset.inbox || 'partnerships@inspirelabs.com';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const data = new FormData(form);
      const subject = encodeURIComponent('Inspirelabs enquiry · ' + (data.get('company') || data.get('name') || 'New enquiry'));
      const lines = [];
      data.forEach((v, k) => { lines.push(k + ': ' + v); });
      const body = encodeURIComponent(lines.join('\n'));
      window.setTimeout(() => {
        window.location.href = `mailto:${inboxAttr}?subject=${subject}&body=${body}`;
      }, 350);
      if (success) success.classList.add('show');
      form.reset();
    });
  });

  // ----------------------------------------------------------------
  // 9. Subtle parallax on hero orbs
  // ----------------------------------------------------------------
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && window.matchMedia('(min-width: 900px)').matches) {
    const orbs = document.querySelectorAll('.hero-orb, .page-header-orb');
    if (orbs.length) {
      let lastX = 0, lastY = 0, raf;
      window.addEventListener('mousemove', (e) => {
        lastX = (e.clientX / window.innerWidth - 0.5);
        lastY = (e.clientY / window.innerHeight - 0.5);
        if (!raf) raf = requestAnimationFrame(applyParallax);
      });
      function applyParallax() {
        orbs.forEach((orb, i) => {
          const f = (i + 1) * 8;
          const cur = orb.style.transform || '';
          // preserve drift animation by using translate3d on top
          orb.style.translate = `${lastX * f}px ${lastY * f}px`;
        });
        raf = null;
      }
    }
  }

  // ----------------------------------------------------------------
  // 10c. Quote carousel — 5 partner testimonials, continuous auto-advance
  // ----------------------------------------------------------------
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const slides = Array.from(carousel.querySelectorAll('[data-quote-slide]'));
    const dots = Array.from(carousel.querySelectorAll('[data-quote-go]'));
    const prev = carousel.querySelector('[data-quote-prev]');
    const next = carousel.querySelector('[data-quote-next]');
    if (!slides.length) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ADVANCE_MS = 5500;
    let idx = slides.findIndex(s => s.classList.contains('is-active'));
    if (idx < 0) idx = 0;
    let timer = null;

    function show(n) {
      idx = ((n % slides.length) + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    }
    function start() {
      if (reduce) return;
      stop();
      timer = setInterval(() => show(idx + 1), ADVANCE_MS);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    // Manual nav: clicking restarts the timer fresh from the new slide
    if (prev) prev.addEventListener('click', () => { show(idx - 1); start(); });
    if (next) next.addEventListener('click', () => { show(idx + 1); start(); });
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const n = parseInt(dot.dataset.quoteGo, 10);
        if (!isNaN(n)) { show(n); start(); }
      });
    });

    // Pause only when the page tab is hidden, so auto-scroll never freezes
    // because the cursor happens to be over the carousel.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else start();
    });

    // Keyboard arrows when the carousel has focus
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { show(idx - 1); start(); }
      if (e.key === 'ArrowRight') { show(idx + 1); start(); }
    });

    show(idx);
    start();
  });

  // ----------------------------------------------------------------
  // 11. Footer year
  // ----------------------------------------------------------------
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  // ----------------------------------------------------------------
  // 11b. Rolling number counters — animate from 0 to target on scroll-in
  // ----------------------------------------------------------------
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function formatNum(n, fmt) {
      n = Math.round(n);
      if (fmt === 'comma') return n.toLocaleString('en-US');
      return String(n);
    }

    function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

    function animateCount(el) {
      const target = parseFloat(el.dataset.count);
      const fmt = el.dataset.format || 'plain';
      const suffix = el.dataset.suffix || '';
      if (isNaN(target)) return;

      // Build the DOM ONCE so the gradient/shimmer animation isn't
      // restarted every frame. We then only update the text node.
      let numEl = el.querySelector('.big-number-num');
      if (!numEl) {
        numEl = document.createElement('span');
        numEl.className = 'big-number-num';
        el.innerHTML = '';
        el.appendChild(numEl);
        if (suffix === 'M+') {
          el.insertAdjacentHTML('beforeend', 'M');
          el.insertAdjacentHTML('beforeend', '<span class="accent">+</span>');
        } else if (suffix === '+') {
          el.insertAdjacentHTML('beforeend', '<span class="accent">+</span>');
        } else if (suffix) {
          el.insertAdjacentHTML('beforeend', suffix);
        }
      }
      // Lock final width so digits rolling shorter→longer don't reflow the layout
      numEl.style.minWidth = numEl.getBoundingClientRect().width + 'px';
      numEl.style.display = 'inline-block';
      numEl.style.textAlign = 'left';

      if (reduce) {
        numEl.textContent = formatNum(target, fmt);
        return;
      }

      const duration = 900;
      const start = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / duration);
        const eased = easeOutExpo(t);
        numEl.textContent = formatNum(target * eased, fmt);
        if (t < 1) requestAnimationFrame(tick);
      }
      numEl.textContent = formatNum(0, fmt);
      requestAnimationFrame(tick);
    }

    const counterObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          counterObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4, rootMargin: '0px 0px -10% 0px' });

    counters.forEach(el => counterObs.observe(el));
  }

  // ----------------------------------------------------------------
  // 12. Mark current nav item by pathname
  // ----------------------------------------------------------------
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-link[data-route]').forEach(link => {
    const route = link.dataset.route.toLowerCase();
    if (route === path || (route === 'index.html' && (path === '' || path === '/'))) {
      link.classList.add('active');
    }
  });

  // ================================================================
  // ★ WOW LAYER — premium animation hooks
  // ================================================================
  const reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = reduceMotionMQ.matches;

  // ----------------------------------------------------------------
  // 13. Scroll progress bar (top-of-page, gradient)
  // ----------------------------------------------------------------
  (function () {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = p + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  })();

  // ----------------------------------------------------------------
  // 14. Word-splitter for hero h1.display-1 — wraps each word in <span class="word">
  //     so the per-word stagger CSS can take effect.
  //     Skip if author already wrapped them.
  // ----------------------------------------------------------------
  document.querySelectorAll('.hero h1.display-1').forEach(h => {
    if (h.querySelector('.word')) return;
    // Walk children: text nodes get split into words; <em>/<br>/<span> kept intact (wrapped)
    const wrap = (text) => text.split(/(\s+)/).map(t => /^\s+$/.test(t) ? t : `<span class="word">${t}</span>`).join('');
    const newHTML = Array.from(h.childNodes).map(n => {
      if (n.nodeType === Node.TEXT_NODE) return wrap(n.textContent);
      if (n.nodeType === Node.ELEMENT_NODE) {
        const tag = n.tagName.toLowerCase();
        if (tag === 'br') return '<br/>';
        // wrap inner text of inline elements (em/span) as word, keep wrapper class
        const cls = n.className ? ` class="word ${n.className}"` : ' class="word"';
        return `<span${cls}>${n.outerHTML}</span>`;
      }
      return '';
    }).join('');
    h.innerHTML = newHTML;
  });

  // ----------------------------------------------------------------
  // 15. Magnetic buttons — subtle pull toward cursor (desktop only, prefers-motion)
  // ----------------------------------------------------------------
  if (!reducedMotion && window.matchMedia('(min-width: 900px) and (hover: hover)').matches) {
    document.querySelectorAll('.btn-primary, .btn-accent').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // ----------------------------------------------------------------
  // 16. Card tilt — subtle 3D tilt on portfolio + proof cards
  // ----------------------------------------------------------------
  if (!reducedMotion && window.matchMedia('(min-width: 900px) and (hover: hover)').matches) {
    document.querySelectorAll('.portfolio-card, .proof-card').forEach(card => {
      let raf;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (py - 0.5) * -4;
        const ry = (px - 0.5) * 4;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
        });
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ----------------------------------------------------------------
  // 17. Big-number + number-row + ai-section + quote — extend reveal IO
  // ----------------------------------------------------------------
  const wowEls = document.querySelectorAll('.big-number, .number-row, .ai-section, .quote-section');
  if (wowEls.length && 'IntersectionObserver' in window) {
    const wowIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          wowIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    wowEls.forEach(el => wowIo.observe(el));
  } else {
    wowEls.forEach(el => el.classList.add('in-view'));
  }

  // ----------------------------------------------------------------
  // 18. Hero parallax — orb soft floats follow cursor (desktop)
  // ----------------------------------------------------------------
  if (!reducedMotion && window.matchMedia('(min-width: 900px) and (hover: hover)').matches) {
    const heroOrbs = document.querySelectorAll('.hero-orb-soft');
    if (heroOrbs.length) {
      let raf;
      window.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5);
        const y = (e.clientY / window.innerHeight - 0.5);
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          heroOrbs.forEach((o, i) => {
            const f = (i + 1) * 14;
            o.style.translate = `${x * f}px ${y * f}px`;
          });
        });
      });
    }
  }
  /* ==========================================================
     PILLARTHEATRE — continuous scroll choreography
     For each act we compute a smooth "centeredness" value
     in [-1, 0, +1] using a bell curve, then write per-act
     CSS variables: --pop (opacity), --pty (translateY),
     --psc (scale), --pbl (blur). The CSS reads these to
     produce a true cinematic crossfade between acts —
     no discrete snapping. The pillar visual moves on a
     SLOWER parallax track than the copy beside it.
     ========================================================== */
  const ptSection = document.getElementById('framework');
  if (ptSection && ptSection.classList.contains('pillarstheatre')) {
    const fillSpan = ptSection.querySelector('.pt-rail-fill span');
    const railLi  = ptSection.querySelectorAll('.pt-rail li');
    const acts    = ptSection.querySelectorAll('.pt-act');
    const finale  = ptSection.querySelector('.pt-finale');
    const header  = ptSection.querySelector('.pt-header');
    const orb1    = ptSection.querySelector('.pt-orb-1');
    const orb2    = ptSection.querySelector('.pt-orb-2');
    let curAct = 0;
    let raf = null;

    // Per-act backdrop colors (for orb interpolation)
    const ACT_COLORS = [
      ['rgba(141, 170, 81, 0.32)', 'rgba(107, 138, 58, 0.22)'],   // 01 Awareness
      ['rgba(255, 213, 138, 0.32)', 'rgba(197, 134, 32, 0.22)'],  // 02 Discovery
      ['rgba(255, 183, 181, 0.32)', 'rgba(192, 71, 63, 0.22)'],   // 03 Engagement
      ['rgba(181, 217, 244, 0.32)', 'rgba(46, 111, 160, 0.22)'],  // 04 Acquisition
      ['rgba(141, 170, 81, 0.18)', 'rgba(46, 111, 160, 0.18)']    // 05 Architecture
    ];

    function smoothstep(e0, e1, x) {
      const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
      return t * t * (3 - 2 * t);
    }
    function bell(x) {
      const t = Math.abs(x);
      if (t >= 1) return 0;
      return 1 - smoothstep(0, 1, t);
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function lerpColor(a, b, t) {
      const pa = a.match(/[\d.]+/g).map(Number);
      const pb = b.match(/[\d.]+/g).map(Number);
      const r = Math.round(lerp(pa[0], pb[0], t));
      const g = Math.round(lerp(pa[1], pb[1], t));
      const bl = Math.round(lerp(pa[2], pb[2], t));
      const al = lerp(pa[3] != null ? pa[3] : 1, pb[3] != null ? pb[3] : 1, t);
      return `rgba(${r}, ${g}, ${bl}, ${al.toFixed(2)})`;
    }

    function update() {
      raf = null;
      const rect = ptSection.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const total = ptSection.offsetHeight - vh;
      const raw = -rect.top;
      let p = total > 0 ? raw / total : 0;
      p = Math.max(0, Math.min(1, p));

      // Five acts, each occupying 1/5 of the scroll progress.
      const N = 5;
      const slice = 1 / N;

      // For each pillar act (1..4), compute continuous "centeredness"
      acts.forEach((el, idx) => {
        const center = (idx + 0.5) * slice;
        // t = signed distance / (slice * 0.85), so neighbouring acts overlap softly
        const t = (p - center) / (slice * 0.85);
        const tClamped = Math.max(-1.4, Math.min(1.4, t));
        const op = bell(tClamped);
        const ty = tClamped * 60;            // pillar copy translateY
        const tyPillar = tClamped * 36;      // pillar VISUAL translates slower (parallax)
        const sc = lerp(0.94, 1.0, op);
        const bl = (1 - op) * 8;

        el.style.setProperty('--pop', op.toFixed(3));
        el.style.setProperty('--pty', ty.toFixed(2) + 'px');
        el.style.setProperty('--ptyP', tyPillar.toFixed(2) + 'px');
        el.style.setProperty('--psc', sc.toFixed(3));
        el.style.setProperty('--pbl', bl.toFixed(2) + 'px');
      });

      // Finale (act 5) — proximity to its centre
      if (finale) {
        const center = 4.5 * slice;
        const t = (p - center) / (slice * 0.85);
        const tClamped = Math.max(-1.4, Math.min(1.4, t));
        const op = bell(tClamped);
        const ty = (1 - op) * 50;
        finale.style.setProperty('--pop', op.toFixed(3));
        finale.style.setProperty('--pty', ty.toFixed(2) + 'px');
      }

      // Header — dim during pillar acts, return for finale
      if (header) {
        const intro  = 1 - smoothstep(0.04, 0.18, p);
        const finalF = smoothstep(0.78, 0.94, p);
        const op = Math.max(0.32, Math.max(intro, finalF) * 0.68 + 0.32);
        header.style.setProperty('--hop', op.toFixed(3));
      }

      // Background orb color blends smoothly between adjacent acts
      const fpos = p / slice;        // 0..5
      const i = Math.min(4, Math.floor(fpos));
      const frac = fpos - i;
      const a = ACT_COLORS[i];
      const b = ACT_COLORS[Math.min(4, i + 1)] || a;
      const mix = smoothstep(0.2, 0.8, frac);
      const c1 = lerpColor(a[0], b[0], mix);
      const c2 = lerpColor(a[1], b[1], mix);
      if (orb1) orb1.style.background = `radial-gradient(circle, ${c1} 0%, transparent 70%)`;
      if (orb2) orb2.style.background = `radial-gradient(circle, ${c2} 0%, transparent 70%)`;

      // Discrete attribute for the rail and a few CSS hooks
      let act = 1;
      if      (p >= 0.78) act = 5;
      else if (p >= 0.58) act = 4;
      else if (p >= 0.38) act = 3;
      else if (p >= 0.18) act = 2;
      if (act !== curAct) {
        ptSection.setAttribute('data-act', String(act));
        curAct = act;
      }
      if (fillSpan) fillSpan.style.width = (p * 100).toFixed(2) + '%';
    }

    function onScroll() {
      if (raf == null) raf = requestAnimationFrame(update);
    }
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Rail click → jump to act centre
    railLi.forEach(li => {
      li.addEventListener('click', () => {
        const idx = parseInt(li.getAttribute('data-act'), 10);
        const vh = window.innerHeight || 800;
        const total = ptSection.offsetHeight - vh;
        const centres = [0.08, 0.28, 0.48, 0.68, 0.88];
        const target = centres[idx - 1] || 0;
        const y = ptSection.getBoundingClientRect().top + window.pageYOffset + (target * total);
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });

    // Keyboard shortcuts: ← / → to jump between acts when section is in view
    window.addEventListener('keydown', (e) => {
      const rect = ptSection.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.5;
      if (!inView) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const next = Math.max(1, Math.min(5, curAct + (e.key === 'ArrowRight' ? 1 : -1)));
      const vh = window.innerHeight || 800;
      const total = ptSection.offsetHeight - vh;
      const centres = [0.08, 0.28, 0.48, 0.68, 0.88];
      const y = ptSection.getBoundingClientRect().top + window.pageYOffset + (centres[next - 1] * total);
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  }

  /* ==========================================================
     HERO v2 CINEMATIC — cursor spotlight that follows the mouse
     ========================================================== */
  const heroCine = document.querySelector('.hero-v2-cinematic');
  if (heroCine && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let spotRaf = null;
    let lastSpot = null;
    function paintSpot() {
      spotRaf = null;
      if (!lastSpot) return;
      const rect = heroCine.getBoundingClientRect();
      const mx = ((lastSpot.clientX - rect.left) / rect.width)  * 100;
      const my = ((lastSpot.clientY - rect.top)  / rect.height) * 100;
      heroCine.style.setProperty('--mx', mx.toFixed(2) + '%');
      heroCine.style.setProperty('--my', my.toFixed(2) + '%');
    }
    heroCine.addEventListener('mousemove', e => {
      lastSpot = e;
      if (spotRaf == null) spotRaf = requestAnimationFrame(paintSpot);
    });
  }

  /* ==========================================================
     HERO v2 — pointer parallax + gentle float for product cards
     ========================================================== */
  const heroStack = document.querySelector('.hero-v2-stack');
  if (heroStack && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const cards = heroStack.querySelectorAll('.hero-stack-card');
    const baseTransforms = new Map();
    cards.forEach(c => {
      // Read the inline / computed transform once and store it
      const cs = window.getComputedStyle(c).transform;
      baseTransforms.set(c, cs === 'none' ? '' : cs);
    });

    let pointerRaf = null;
    let lastEvent = null;
    function applyPointer() {
      pointerRaf = null;
      if (!lastEvent) return;
      const rect = heroStack.getBoundingClientRect();
      const cx = (lastEvent.clientX - rect.left) / rect.width - 0.5;
      const cy = (lastEvent.clientY - rect.top) / rect.height - 0.5;
      cards.forEach((c, i) => {
        const depth = (i + 1) * 4;
        const tx = -cx * depth;
        const ty = -cy * depth;
        const rotX = -cy * 4;
        const rotY = cx * 4;
        c.style.transform =
          `${baseTransforms.get(c) || ''} translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)` +
          ` rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      });
    }
    heroStack.addEventListener('mousemove', e => {
      lastEvent = e;
      if (pointerRaf == null) pointerRaf = requestAnimationFrame(applyPointer);
    });
    heroStack.addEventListener('mouseleave', () => {
      cards.forEach(c => { c.style.transform = baseTransforms.get(c) || ''; });
    });

    // Subtle ambient float — Web Animations API, additive on top of base transform
    cards.forEach((c, i) => {
      const dur = (6 + i * 0.7) * 1000;
      const offset = (i % 2 === 0) ? 4 : -4;
      try {
        c.animate(
          [{ translate: '0 0' }, { translate: `0 ${offset}px` }, { translate: '0 0' }],
          { duration: dur, iterations: Infinity, easing: 'ease-in-out', delay: i * 400 }
        );
      } catch (e) { /* old browser, fine */ }
    });
  }

})();
