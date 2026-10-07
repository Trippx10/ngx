/* Portfolio — interactions. Контент и ссылки редактируются в js/config.js */
(function () {
  'use strict';

  var C = window.PORTFOLIO || { projects: [] };
  var P = C.projects || [];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var hostOf = function (url) {
    if (!url) return 'скоро онлайн';
    try { var u = new URL(url, location.href); return u.protocol.indexOf('http') === 0 ? u.host + (u.pathname === '/' ? '' : u.pathname) : url.replace(/^\.\.\//, '').replace(/\/index\.html$/, ''); }
    catch (e) { return url; }
  };

  /* ---------------- Config → page ---------------- */
  $$('[data-name]').forEach(function (el) { el.textContent = C.name || el.textContent; });
  $$('[data-year]').forEach(function (el) { el.textContent = C.year || new Date().getFullYear(); });
  $$('[data-role]').forEach(function (el) { el.textContent = C.role || el.textContent; });
  if (C.name) document.title = C.name + ' — разработка сайтов и веб-дизайн';

  var socials = C.socials || [];
  var extLink = function (url) { return /^https?:/.test(url) ? ' target="_blank" rel="noopener"' : ''; };
  $$('[data-socials]').forEach(function (el) {
    el.innerHTML = socials.map(function (s) { return '<a href="' + esc(s.url) + '"' + extLink(s.url) + '>' + esc(s.label) + ' ↗</a>'; }).join('');
  });
  $$('[data-socials-list]').forEach(function (el) {
    el.innerHTML = socials.map(function (s) { return '<li><a href="' + esc(s.url) + '"' + extLink(s.url) + '>' + esc(s.label) + ' ↗</a></li>'; }).join('');
  });
  var ct = C.contacts || {};
  var mainContact = $('[data-contact-main]');
  if (mainContact) {
    var mc = ct.telegram || (ct.email ? 'mailto:' + ct.email : '#');
    mainContact.href = mc;
    if (/^https?:/.test(mc)) { mainContact.target = '_blank'; mainContact.rel = 'noopener'; }
  }
  var cl = $('[data-contact-links]');
  if (cl) {
    var items = [];
    var tgs = [ct.telegram, ct.telegram2].filter(Boolean);
    var tgName = function (u) { return u.replace(/^https?:\/\/(t\.me\/)?/, '@'); };
    var html = items.map(function (i) { return '<li><a href="' + esc(i.u) + '"' + extLink(i.u) + '><small>' + esc(i.k) + '</small><span>' + esc(i.v) + '</span></a></li>'; }).join('');
    var mails = [ct.email, ct.email2].filter(Boolean);
    if (mails.length) html += '<li class="cta__tg"><small>Email</small>' + mails.map(function (e) { return '<a href="mailto:' + esc(e) + '"><span>' + esc(e) + '</span></a>'; }).join('') + '</li>';
    if (tgs.length) html += '<li class="cta__tg"><small>Telegram</small>' + tgs.map(function (u) { return '<a href="' + esc(u) + '"' + extLink(u) + '><span>' + esc(tgName(u)) + '</span></a>'; }).join('') + '</li>';
    cl.innerHTML = html;
  }
  var tm = $('[data-tech-main]'), tx = $('[data-tech-extra]');
  if (tm) tm.innerHTML = ((C.tech && C.tech.main) || []).map(function (t, i) { return '<li class="reveal" style="--d:' + (i * .08) + 's">' + esc(t) + '</li>'; }).join('');
  if (tx) {
    var ex = (C.tech && C.tech.extra) || [];
    tx.innerHTML = ex.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
    if (!ex.length) tx.parentNode.hidden = true;
  }

  /* ---------------- Hero thumbs ---------------- */
  var ht = $('[data-hero-thumbs]');
  if (ht) ht.innerHTML = P.map(function (p, i) {
    return '<li><button type="button" class="hero__thumb" data-open="' + esc(p.id) + '" aria-label="Открыть кейс ' + esc(p.title) + '">' +
      '<img src="' + esc(p.mobile || p.cover) + '" alt="" loading="' + (i < 2 ? 'eager' : 'lazy') + '" decoding="async"><span>' + pad(i + 1) + '</span></button></li>';
  }).join('');

  /* ---------------- Ticker ---------------- */
  var tk = $('[data-ticker]');
  if (tk) {
    var words = P.map(function (p) { return p.title; }).concat(['Web Design', 'Development', 'UI/UX', 'Animation']);
    var row = words.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('');
    tk.innerHTML = row + row;
  }

  /* ---------------- Project cards ---------------- */
  var layout = ['full', 'half', 'half', 'half', 'half', 'half', 'half'];
  var frameBar = function (p) { return '<div class="frame__bar"><i></i><i></i><i></i><b>' + esc(hostOf(p.url)) + '</b></div>'; };
  var phonesHTML = function (p, n) {
    return (p.gallery || [p.mobile]).slice(0, n).map(function (src) { return '<div class="phone"><img src="' + esc(src) + '" alt="" loading="lazy" decoding="async"></div>'; }).join('');
  };
  var cards = $('[data-cards]');
  if (cards) cards.innerHTML = P.map(function (p, i) {
    var size = layout[i % layout.length];
    var media = p.botLayout
      ? '<div class="bot-media"><img class="bot-media__logo" src="' + esc(p.cover) + '" alt="Логотип: ' + esc(p.subtitle) + '" loading="lazy" decoding="async"></div>'
      : p.phoneLayout
      ? '<div class="phones phones--one" data-parallax><div class="phone phone--pro"><span class="phone__screen"><img src="' + esc((p.gallery || [p.mobile])[0]) + '" alt="Превью: ' + esc(p.subtitle) + '" loading="lazy" decoding="async"></span><i class="phone__island"></i><i class="phone__btn phone__btn--l"></i><i class="phone__btn phone__btn--l2"></i><i class="phone__btn phone__btn--r"></i></div></div>'
      : '<div class="card__frame" data-parallax><img src="' + esc(p.cover) + '" alt="Превью сайта ' + esc(p.subtitle) + '" loading="' + (i === 0 ? 'eager' : 'lazy') + '" decoding="async"></div>';
    return '<article class="card' + (size === 'half' ? ' card--half' : '') + '" style="--pbg:' + esc(p.bg) + '">' +
      '<a class="card__link" href="#case/' + esc(p.id) + '" data-open="' + esc(p.id) + '" aria-label="Открыть кейс: ' + esc(p.title) + ' — ' + esc(p.subtitle) + '">' +
        '<div class="card__media" style="--pfg:' + (p.light ? '#1a1a1a' : '#fff') + '">' +
          media +
          '<span class="card__shade"></span>' +
          '<span class="card__hoverbtn btn btn--light btn--sm"><span class="btn__text" data-text="Открыть проект">Открыть проект</span></span>' +
        '</div>' +
        '<div class="card__info">' +
          '<div><h3 class="card__title">' + esc(p.title) + '</h3><p class="card__sub">' + esc(p.subtitle) + '</p></div>' +
          '<p class="card__cat">' + esc((p.category || []).join(' / ')) + '</p>' +
          '<p class="card__desc">' + esc(p.short) + '</p>' +
          '<div class="card__foot"><ul class="tags">' + (p.stack || []).slice(0, 4).map(function (t) { return '<li class="tag">' + esc(t) + '</li>'; }).join('') + '</ul>' +
          '<span class="card__open">Открыть проект <span class="arr" aria-hidden="true">→</span></span></div>' +
        '</div>' +
      '</a></article>';
  }).join('');

  /* ---------------- Showcase ---------------- */
  var tabs = $('[data-sc-tabs]'), slides = $('[data-stage-slides]');
  if (tabs) tabs.innerHTML = P.map(function (p, i) {
    return '<button type="button" class="sc-tab" role="tab" id="sc-tab-' + i + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '" data-sc="' + i + '"><small>' + pad(i + 1) + '</small>' + esc(p.title.split(' ')[0] === 'BEAUTY' ? 'BEAUTY' : p.title) + '</button>';
  }).join('');
  if (slides) slides.innerHTML = P.map(function (p, i) {
    var dark = !p.light;
    if (p.phoneLayout) {
      return '<div class="slide slide--phones' + (i === 0 ? ' is-active' : '') + '" style="--sbg:' + esc(p.bg) + ';--sfg:rgba(255,255,255,.14)" aria-hidden="' + (i !== 0) + '">' +
        '<span class="slide__big">' + esc(p.title) + '</span><div class="slide__trio">' +
        (p.gallery || []).slice(0, 4).map(function (src, k) { return '<div class="phone" style="--oy:' + [8, -4, 6, -2][k] + '%"><img src="' + esc(src) + '" alt="" loading="lazy" decoding="async"></div>'; }).join('') +
        '</div></div>';
    }
    return '<div class="slide' + (i === 0 ? ' is-active' : '') + '" style="--sbg:' + esc(p.bg) + ';--sfg:' + (dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)') + '" aria-hidden="' + (i !== 0) + '">' +
      '<span class="slide__big">' + esc(p.title) + '</span>' +
      '<div class="slide__desk"><img src="' + esc(p.cover) + '" alt="" loading="lazy" decoding="async"></div>' +
      '<div class="slide__phone"><img src="' + esc(p.mobile) + '" alt="" loading="lazy" decoding="async"></div></div>';
  }).join('');
  var total = $('[data-sc-total]'); if (total) total.textContent = pad(P.length);

  /* ---------------- Button text roll ---------------- */
  $$('.btn__text').forEach(function (el) {
    if (el.querySelector('.btn__roll')) return;
    var t = el.textContent;
    el.innerHTML = '<span class="btn__roll" data-text="' + esc(t) + '">' + esc(t) + '</span>';
  });

  /* ---------------- Split words ---------------- */
  $$('.split').forEach(function (el) {
    var i = 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var s = document.createElement('span'); s.textContent = part; s.style.setProperty('--d', (i++ * 0.07) + 's');
            w.appendChild(s); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  });
  $$('.line__in').forEach(function (el, i) {
    var parent = el.closest('h1, h2');
    var idx = parent ? $$('.line__in', parent).indexOf(el) : i;
    el.style.setProperty('--d', (0.12 + idx * 0.1) + 's');
  });

  /* Scrub text (about) */
  $$('.scrub').forEach(function (el) {
    var html = el.innerHTML.replace(/&nbsp;/g, ' ');
    var tmp = document.createElement('div'); tmp.innerHTML = html;
    var text = tmp.textContent;
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(' ').map(function (w) { return '<span class="sw" aria-hidden="true">' + esc(w) + '</span>'; }).join(' ');
  });

  /* ---------------- Reveal on scroll ---------------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  $$('.reveal, .split, .card, .cta__title, .process li').forEach(function (el) { io.observe(el); });
  // stagger siblings
  $$('.stats, .svc, .process, .hero__bottom').forEach(function (group) {
    $$('.reveal', group).forEach(function (el, i) { el.style.setProperty('--d', (i * 0.09) + 's'); });
  });

  // hero intro
  requestAnimationFrame(function () {
    setTimeout(function () {
      document.querySelector('.hero__title').classList.add('is-in');
      $$('.hero .reveal').forEach(function (el, i) { el.style.setProperty('--d', (0.5 + i * 0.08) + 's'); el.classList.add('is-in'); });
    }, 80);
  });

  /* ---------------- Header ---------------- */
  var header = $('#header');
  var navLinks = $$('.nav__link'), pill = $('.nav__pill');
  var activeLink = null;
  var movePill = function (link) {
    if (!pill) return;
    if (!link) { pill.classList.remove('is-on'); return; }
    pill.style.width = link.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    pill.classList.add('is-on');
  };
  var setActive = function (id) {
    navLinks.forEach(function (l) {
      var on = l.dataset.section === id;
      l.classList.toggle('is-active', on);
      if (on) { l.setAttribute('aria-current', 'true'); activeLink = l; } else l.removeAttribute('aria-current');
    });
    movePill(activeLink);
  };
  navLinks.forEach(function (l) {
    l.addEventListener('mouseenter', function () { movePill(l); });
    l.addEventListener('focus', function () { movePill(l); });
  });
  var navList = $('.nav__list');
  if (navList) navList.addEventListener('mouseleave', function () { movePill(activeLink); });
  var sectionIds = ['top', 'projects', 'about', 'services', 'contact'];
  var map = { showcase: 'projects', tech: 'services' };
  var secIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { var id = map[e.target.id] || e.target.id; if (sectionIds.indexOf(id) > -1) setActive(id); }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(function (s) { secIO.observe(s); });
  window.addEventListener('resize', function () { movePill(activeLink); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { movePill(activeLink); });

  /* ---------------- Mobile menu ---------------- */
  var burger = $('.burger'), menu = $('#menu');
  var setMenu = function (open) {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', !open);
    header.classList.toggle('menu-open', open);
    document.body.classList.toggle('is-locked', open);
    if (open) setTimeout(function () { var a = $('.menu__list a', menu); a && a.focus({ preventScroll: true }); }, 400);
  };
  if (burger) burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); } });

  /* ---------------- Scroll loop: header, parallax, scrub ---------------- */
  var parallaxEls = $$('[data-parallax]');
  var scrubEls = $$('.scrub');
  var heroTitle = $('.hero__title');
  var ticking = false;
  var onScroll = function () {
    var y = window.scrollY, vh = window.innerHeight;
    header.classList.toggle('is-compact', y > 40);
    if (!reduce) {
      parallaxEls.forEach(function (el) {
        var r = el.parentNode.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var prog = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
        el.style.setProperty('--py', (prog * 14).toFixed(1) + 'px');
      });
      if (heroTitle && y < vh) heroTitle.style.transform = 'translate3d(0,' + (y * 0.18).toFixed(1) + 'px,0)';
    }
    scrubEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var prog = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      var ws = el.children, n = Math.round(prog * ws.length);
      for (var i = 0; i < ws.length; i++) ws[i].classList.toggle('on', i < n);
    });
    ticking = false;
  };
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------------- Count up ---------------- */
  $$('[data-count]').forEach(function (el) {
    var end = +el.dataset.count;
    var cio = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return; cio.disconnect();
      if (reduce) return;
      var t0 = performance.now();
      (function step(t) { var k = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); })(t0);
    });
    cio.observe(el);
  });

  /* ---------------- Hero glow follows pointer ---------------- */
  var hero = $('.hero');
  if (hero && finePointer && !reduce) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* ---------------- Magnetic buttons ---------------- */
  if (finePointer && !reduce) {
    $$('.magnetic').forEach(function (el) {
      var s = el.classList.contains('cta__btn') ? 0.35 : 0.22;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate3d(' + (x * s).toFixed(1) + 'px,' + (y * s).toFixed(1) + 'px,0)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------------- Showcase logic ---------------- */
  var cur = 0, busy = false;
  var tabEls = $$('.sc-tab'), slideEls = $$('.slide'), ind = $('.showcase__ind');
  var meta = $('[data-stage-meta]'), prog = $('[data-stage-progress]'), curEl = $('[data-sc-cur]');
  var moveInd = function () {
    var t = tabEls[cur]; if (!t || !ind) return;
    ind.style.width = t.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + (t.offsetLeft - t.parentNode.parentNode.scrollLeft) + 'px)';
  };
  var renderMeta = function () {
    var p = P[cur]; if (!p || !meta) return;
    meta.innerHTML = '<span>' + pad(cur + 1) + ' — ' + esc((p.category || []).join(' / ')) + '</span><strong>' + esc(p.subtitle) + '</strong>';
  };
  var go = function (i, dir) {
    if (!P.length) return;
    i = (i + P.length) % P.length;
    if (i === cur || busy) return;
    dir = dir || (i > cur ? 1 : -1);
    busy = true;
    var prev = slideEls[cur], next = slideEls[i];
    next.classList.remove('is-active', 'is-leaving');
    next.classList.toggle('from-left', dir < 0);
    void next.offsetWidth;
    prev.classList.add('is-leaving'); prev.classList.remove('is-active'); prev.setAttribute('aria-hidden', 'true');
    next.classList.add('is-active'); next.setAttribute('aria-hidden', 'false');
    setTimeout(function () { prev.classList.remove('is-leaving', 'from-left'); busy = false; }, reduce ? 0 : 900);
    tabEls[cur].setAttribute('aria-selected', 'false'); tabEls[cur].tabIndex = -1;
    cur = i;
    tabEls[cur].setAttribute('aria-selected', 'true'); tabEls[cur].tabIndex = 0;
    var sc = tabEls[cur].parentNode.parentNode;
    if (sc.scrollWidth > sc.clientWidth) sc.scrollTo({ left: tabEls[cur].offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
    moveInd(); renderMeta();
    if (prog) prog.style.transform = 'translateX(' + (cur * 100) + '%)';
    if (curEl) curEl.textContent = pad(cur + 1);
  };
  if (prog) prog.style.width = (100 / Math.max(1, P.length)) + '%';
  renderMeta(); setTimeout(moveInd, 60);
  window.addEventListener('resize', moveInd);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInd);
  var tabsWrap = $('.showcase__tabs'); if (tabsWrap) tabsWrap.addEventListener('scroll', moveInd, { passive: true });
  tabEls.forEach(function (t, i) {
    t.addEventListener('click', function () { go(i); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = (i + (e.key === 'ArrowRight' ? 1 : -1) + P.length) % P.length; go(n); tabEls[n].focus(); }
    });
  });
  var btnPrev = $('[data-sc-prev]'), btnNext = $('[data-sc-next]');
  if (btnPrev) btnPrev.addEventListener('click', function () { go(cur - 1, -1); });
  if (btnNext) btnNext.addEventListener('click', function () { go(cur + 1, 1); });
  var stage = $('[data-stage]');
  if (stage) {
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1, 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1, -1); }
      if (e.key === 'Enter' && e.target === stage) openCase(P[cur].id);
    });
    var sx = 0, sy = 0, dragging = false, moved = false;
    stage.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      dragging = true; moved = false; sx = e.clientX; sy = e.clientY; stage.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) moved = true;
      if (moved && Math.abs(dx) > 60) { go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); dragging = false; stage.classList.remove('is-dragging'); }
    });
    var endDrag = function (e) {
      if (!dragging) return;
      dragging = false; stage.classList.remove('is-dragging');
      if (!moved && e && e.type === 'pointerup' && !e.target.closest('button')) openCase(P[cur].id);
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', function () { dragging = false; stage.classList.remove('is-dragging'); });
    // touch swipe fallback (iOS scroll-friendly)
    var tsx = 0, tsy = 0;
    stage.addEventListener('touchstart', function (e) { tsx = e.touches[0].clientX; tsy = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tsx, dy = e.changedTouches[0].clientY - tsy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    }, { passive: true });
    var so = $('[data-stage-open]'); if (so) so.addEventListener('click', function () { openCase(P[cur].id); });
  }

  /* ---------------- Case study overlay ---------------- */
  var caseEl = $('#case'), caseBody = $('[data-case-body]'), caseScroll = $('[data-case-scroll]'), crumb = $('[data-case-crumb]');
  var lastFocus = null, liveFrame = null, liveW = 1440, isOpen = false;

  var buildCase = function (p, i) {
    var next = P[(i + 1) % P.length];
    var siteBtn = p.url
      ? '<a class="btn btn--accent magnetic" href="' + esc(p.url) + '" target="_blank" rel="noopener"><span class="btn__text" data-text="' + (p.botLayout ? 'Открыть бота' : 'Посмотреть сайт') + '">' + (p.botLayout ? 'Открыть бота' : 'Посмотреть сайт') + '</span><span class="btn__icon" aria-hidden="true">↗</span></a>'
      : '<span class="btn btn--accent" aria-disabled="true"><span class="btn__text">Ссылка скоро</span></span>';
    var canLive = p.livePreview !== false && (p.previewUrl || p.url);
    var preview;
    if (p.botLayout) {
      preview = '<div class="cs-preview__stage cs-bot" style="--pbg:' + esc(p.bg) + '"><img class="cs-bot__logo" src="' + esc(p.cover) + '" alt="Логотип: ' + esc(p.subtitle) + '"></div>';
    } else if (p.phoneLayout) {
      preview = canLive
        ? '<div class="cs-preview__stage cs-app" style="--pbg:' + esc(p.bg) + '"><div class="phone phone--pro"><span class="phone__screen phone__screen--live"><span class="phone__app" data-appvp><iframe src="' + esc((p.previewUrl || p.url) + ((p.previewUrl || p.url).indexOf('?') < 0 ? '?frame=1' : '&frame=1')) + '" title="Живое приложение: ' + esc(p.subtitle) + '"></iframe></span></span><i class="phone__island"></i><i class="phone__btn phone__btn--l"></i><i class="phone__btn phone__btn--l2"></i><i class="phone__btn phone__btn--r"></i></div><p class="cs-app__hint">Это работающее приложение: листайте меню, добавляйте блюда в корзину и оформляйте демо-заказ.</p></div>'
        : '<div class="cs-preview__stage" style="--pbg:' + esc(p.bg) + '"><div class="cs-phones">' + phonesHTML(p, 4) + '</div></div>';
    } else {
      preview = '<div class="cs-preview__stage" style="--pbg:' + esc(p.bg) + '">' +
        (canLive ? '<div class="cs-device-toggle" role="group" aria-label="Вид превью"><button type="button" aria-pressed="true" data-dev="desk">Desktop</button><button type="button" aria-pressed="false" data-dev="mob">Mobile</button></div>' : '') +
        '<div class="cs-browser" data-browser>' + '<div class="frame__bar"><i></i><i></i><i></i></div>' +
          '<div class="cs-viewport" data-viewport><img src="' + esc(p.cover) + '" alt="Превью сайта ' + esc(p.subtitle) + '" data-shot-desk>' +
          (canLive ? '<button type="button" class="btn btn--light btn--sm cs-live" data-live><span class="btn__text" data-text="Живое превью">Живое превью</span><span class="btn__icon" aria-hidden="true">▶</span></button>' : '') +
          '</div></div>' +
        (canLive ? '<div class="cs-app cs-app--site" data-phone hidden><div class="phone phone--pro"><span class="phone__screen phone__screen--site" style="--sb:' + esc(p.bg) + '"><span class="phone__app" data-appvp></span></span><i class="phone__island"></i><i class="phone__btn phone__btn--l"></i><i class="phone__btn phone__btn--l2"></i><i class="phone__btn phone__btn--r"></i></div></div>' : '') +
        '</div>';
    }
    var gal = (p.gallery || []).map(function (src, k) {
      return '<figure><img src="' + esc(src) + '" alt="' + esc(p.subtitle) + ' — экран ' + (k + 1) + '" loading="lazy" decoding="async"></figure>';
    }).join('');
    return '' +
      '<header class="cs-hero">' +
        '<div class="cs-hero__top"><p class="eyebrow">' + pad(i + 1) + ' / ' + pad(P.length) + ' — ' + esc((p.category || []).join(' / ')) + '</p><p class="eyebrow">' + esc(p.subtitle) + '</p></div>' +
        '<h2 class="cs-title" id="case-title" style="--pacc:' + esc(p.accent) + '">' + esc(p.title) + '<span class="accent">.</span></h2>' +
        '<div class="cs-hero__row"><p class="cs-lead">' + esc(p.short) + '</p><div class="cs-actions">' + siteBtn + '</div></div>' +
      '</header>' +
      '<div class="cs-preview">' + preview + '</div>' +
      '<section class="cs-section"><h3>Задача</h3><p class="cs-section__text">' + esc(p.task) + '</p></section>' +
      '<section class="cs-section"><h3>Основные особенности</h3><ul class="cs-features">' + (p.features || []).map(function (f, k) { return '<li><small>' + pad(k + 1) + '</small>' + esc(f) + '</li>'; }).join('') + '</ul></section>' +
      '<section class="cs-section"><h3>Технологии</h3><div><ul class="cs-stack">' + (p.stack || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' + (p.note ? '<p class="cs-note">' + esc(p.note) + '</p>' : '') + '</div></section>' +
      (gal && !(p.phoneLayout && canLive) ? '<div class="cs-gallery' + (p.botLayout ? ' cs-gallery--chat' : p.phoneLayout ? ' cs-gallery--phones' : '') + '">' + gal + '</div>' : '') +
      '<nav class="cs-next" aria-label="Следующий проект"><a href="#case/' + esc(next.id) + '" data-next="' + esc(next.id) + '"><small>Следующий проект</small><strong><span>' + esc(next.title) + '</span><span aria-hidden="true">→</span></strong></a></nav>';
  };

  var fitFrame = function () {
    if (!liveFrame) return;
    var vp = liveFrame.parentNode, w = vp.clientWidth, h = vp.clientHeight, s = w / liveW;
    liveFrame.style.width = liveW + 'px';
    liveFrame.style.height = (h / s) + 'px';
    liveFrame.style.transform = 'scale(' + s + ')';
  };
  window.addEventListener('resize', fitFrame);
  var fitApp = function () {
    var vp = $('[data-appvp]', caseBody); if (!vp) return;
    var f = $('iframe', vp), s = vp.clientWidth / 390;
    if (!s) return;
    f.style.width = '390px'; f.style.height = (vp.clientHeight / s) + 'px'; f.style.transform = 'scale(' + s + ')';
  };
  window.addEventListener('resize', fitApp);

  var bindCase = function (p) {
    $$('.btn__text', caseBody).forEach(function (el) {
      if (el.querySelector('.btn__roll')) return;
      var t = el.textContent; el.innerHTML = '<span class="btn__roll" data-text="' + esc(t) + '">' + esc(t) + '</span>';
    });
    var live = $('[data-live]', caseBody), vp = $('[data-viewport]', caseBody), browser = $('[data-browser]', caseBody);
    var startLive = function () {
      if (liveFrame) return;
      var f = document.createElement('iframe');
      f.src = p.previewUrl || p.url;
      f.title = 'Живое превью: ' + p.subtitle;
      f.loading = 'lazy';
      f.setAttribute('referrerpolicy', 'no-referrer');
      vp.insertAdjacentHTML('beforeend', '<div class="cs-loading">Загрузка…</div>');
      f.addEventListener('load', function () { var l = $('.cs-loading', vp); l && l.remove(); });
      vp.appendChild(f); liveFrame = f; fitFrame();
      var img = $('[data-shot-desk]', vp); if (img) img.style.visibility = 'hidden';
      if (live) live.remove();
    };
    if (live) live.addEventListener('click', startLive);
    var phoneWrap = $('[data-phone]', caseBody);
    $$('[data-dev]', caseBody).forEach(function (b) {
      b.addEventListener('click', function () {
        var mob = b.dataset.dev === 'mob';
        $$('[data-dev]', caseBody).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        if (phoneWrap) {
          browser.hidden = mob; phoneWrap.hidden = !mob;
          if (mob) {
            var avp = $('[data-appvp]', phoneWrap);
            if (!$('iframe', avp)) {
              var f = document.createElement('iframe');
              f.src = p.previewUrl || p.url; f.title = 'Мобильная версия: ' + p.subtitle;
              avp.appendChild(f);
            }
            setTimeout(fitApp, 20); setTimeout(fitApp, 400);
          } else { startLive(); setTimeout(fitFrame, 20); }
          return;
        }
        browser.classList.toggle('is-mobile', mob);
        liveW = mob ? 390 : 1440;
        var img = $('[data-shot-desk]', vp);
        if (img) img.src = mob ? p.mobile : p.cover;
        startLive();
        setTimeout(fitFrame, 20); setTimeout(fitFrame, 850);
      });
    });
    var nx = $('[data-next]', caseBody);
    if (nx) nx.addEventListener('click', function (e) { e.preventDefault(); swapCase(nx.dataset.next); });
    if (finePointer && !reduce) $$('.magnetic', caseBody).forEach(function (el) {
      el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); el.style.transform = 'translate3d(' + ((e.clientX - r.left - r.width / 2) * .2).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .2).toFixed(1) + 'px,0)'; });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  };

  var render = function (id) {
    var i = P.findIndex(function (p) { return p.id === id; });
    if (i < 0) return false;
    liveFrame = null; liveW = 1440;
    caseBody.innerHTML = buildCase(P[i], i);
    crumb.textContent = (C.name || '') + ' / Проекты / ' + P[i].title;
    bindCase(P[i]);
    setTimeout(fitApp, 30); setTimeout(fitApp, 1000);
    caseScroll.scrollTop = 0;
    return true;
  };

  function openCase(id, fromHash) {
    if (!render(id)) return;
    if (!isOpen) {
      lastFocus = document.activeElement;
      caseEl.hidden = false;
      document.body.classList.add('is-locked');
      void caseEl.offsetWidth;
      caseEl.classList.remove('is-closing');
      caseEl.classList.add('is-open');
      isOpen = true;
      setTimeout(function () { $('[data-case-close]').focus({ preventScroll: true }); }, reduce ? 0 : 500);
    }
    if (!fromHash && location.hash !== '#case/' + id) history.pushState(null, '', '#case/' + id);
  }
  function swapCase(id) {
    caseBody.style.transition = 'opacity .4s';
    caseBody.style.opacity = '0';
    setTimeout(function () {
      render(id);
      history.replaceState(null, '', '#case/' + id);
      caseBody.style.opacity = '1';
    }, reduce ? 0 : 400);
  }
  function closeCase(fromHash) {
    if (!isOpen) return;
    isOpen = false;
    caseEl.classList.add('is-closing');
    caseEl.classList.remove('is-open');
    setTimeout(function () {
      caseEl.hidden = true; caseEl.classList.remove('is-closing');
      caseBody.innerHTML = ''; liveFrame = null;
      document.body.classList.remove('is-locked');
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }, reduce ? 0 : 1000);
    if (!fromHash && location.hash.indexOf('#case/') === 0) history.pushState(null, '', location.pathname + location.search + '#projects');
  }
  window.openCase = openCase;

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open]');
    if (t && !t.closest('#case')) { e.preventDefault(); openCase(t.dataset.open); }
  });
  $('[data-case-close]').addEventListener('click', function () { closeCase(); });
  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') closeCase();
    if (e.key === 'Tab') {
      var f = $$('a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])', caseEl).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  var fromHash = function () {
    var m = location.hash.match(/^#case\/([\w-]+)/);
    if (m) openCase(m[1], true); else closeCase(true);
  };
  window.addEventListener('popstate', fromHash);
  if (/^#case\//.test(location.hash)) setTimeout(fromHash, 300);
})();
