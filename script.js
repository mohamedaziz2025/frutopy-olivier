/* ============================================================
   FRUTOPY × TACAPAE — Présentation
   GSAP + ScrollTrigger + Lenis
   ============================================================ */
(function () {
  'use strict';

  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isFine = window.matchMedia('(pointer: fine)').matches;

  document.body.classList.remove('no-js');

  if (!hasGsap) {
    // Fallback : tout le contenu reste visible, le scroll natif fonctionne.
    finishStaticUI();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------
     Lenis (smooth scroll) — désactivé si réduction de mouvement
     --------------------------------------------------------- */
  var lenis = null;
  if (!reduced && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target) {
    if (lenis) { lenis.scrollTo(target, { offset: 0, duration: 1.7 }); return; }
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------------------------------------------------------
     Découpage des titres en mots (élégance mot à mot)
     --------------------------------------------------------- */
  function splitWords(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (chunk) {
        if (/^\s+$/.test(chunk) || chunk === '') { frag.appendChild(document.createTextNode(chunk)); return; }
        var w = document.createElement('span');
        w.className = 'w';
        var i = document.createElement('span');
        i.className = 'wi';
        i.textContent = chunk;
        w.appendChild(i);
        frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  gsap.utils.toArray('.w-split').forEach(splitWords);

  /* ---------------------------------------------------------
     UI statique : progress bar, index, rail, clics nav
     --------------------------------------------------------- */
  function finishStaticUI() {
    var sections = gsap.utils.toArray('.section');
    var railItems = gsap.utils.toArray('.rail-item');
    var curEl = document.querySelector('.idx-current');

    sections.forEach(function (sec, i) {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: function (self) {
          if (!self.isActive) return;
          var idx = String(i + 1).padStart(2, '0');
          if (curEl) curEl.textContent = idx;
          railItems.forEach(function (it, j) {
            var on = j === i;
            it.classList.toggle('is-active', on);
            if (on) it.setAttribute('aria-current', 'true');
            else it.removeAttribute('aria-current');
          });
        }
      });
    });

    ScrollTrigger.create({
      trigger: '#stage',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: function (self) {
        gsap.set('.progress-top', { scaleX: self.progress });
      }
    });

    if (lenis) {
      gsap.utils.toArray('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          scrollToTarget(a.getAttribute('href'));
        });
      });
    }

    railItems.forEach(function (it) {
      it.addEventListener('click', function () {
        scrollToTarget('#' + it.dataset.target);
      });
    });
  }

  if (reduced) {
    // Aucune animation. On affiche seulement le scoreboard statique.
    gsap.utils.toArray('.count').forEach(function (el) {
      el.textContent = (el.dataset.prefix || '') + formatVal(parseFloat(el.dataset.val), el.dataset.dec);
    });
    finishStaticUI();
    return;
  }

  /* ---------------------------------------------------------
     Outils
     --------------------------------------------------------- */
  function formatVal(v, dec) {
    if (dec) return v.toLocaleString('fr-FR', { minimumFractionDigits: +dec, maximumFractionDigits: +dec });
    return Math.round(v).toLocaleString('fr-FR');
  }

  /* ---------------------------------------------------------
     Curseur custom (desktop uniquement)
     --------------------------------------------------------- */
  if (isFine) {
    (function () {
      var cur = document.querySelector('.cursor');
      if (!cur) return;
      var label = cur.querySelector('.cursor-label');
      var xTo = gsap.quickTo(cur, 'x', { duration: 0.4, ease: 'power3' });
      var yTo = gsap.quickTo(cur, 'y', { duration: 0.4, ease: 'power3' });
      gsap.set(cur, { xPercent: -50, yPercent: -50 });

      document.addEventListener('mousemove', function (e) {
        xTo(e.clientX);
        yTo(e.clientY);
      });

      var labelFor = function (t) {
        if (t.dataset.cursor === 'view') return 'VIEW';
        if (t.dataset.cursor === 'open') return 'OPEN';
        return 'OPEN';
      };

      document.addEventListener('mouseover', function (e) {
        var t = e.target.closest && e.target.closest('a, button, [data-cursor]');
        if (t && t.dataset.cursor && t.dataset.cursor === 'view') {
          if (label) label.textContent = 'VIEW';
          cur.classList.add('is-hover');
        } else if (t) {
          if (label) label.textContent = 'OPEN';
          cur.classList.add('is-hover');
        } else {
          cur.classList.remove('is-hover');
        }
      });
      document.addEventListener('mousedown', function () { gsap.to(cur, { scale: 0.82, duration: 0.2 }); });
      document.addEventListener('mouseup', function () { gsap.to(cur, { scale: 1, duration: 0.3, ease: 'power3.out' }); });
    })();
  }

  /* ---------------------------------------------------------
     HERO
     --------------------------------------------------------- */
  (function () {
    var hero = document.querySelector('.hero');
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo('.hero-img', { scale: 1.18 }, { scale: 1.03, duration: 3.4, ease: 'power2.out' })
      .fromTo('.hero-img', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4 }, 0)

      .fromTo('.hero-eyebrow', { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 1 }, 0.5)
      .fromTo('.hero-title .line:first-child .wi', { yPercent: 118 }, { yPercent: 0, duration: 1.15, stagger: 0.11 }, 0.65)
      .fromTo('.hero-title .line-2 .wi', { yPercent: 118 }, { yPercent: 0, duration: 1.15, stagger: 0.1 }, 1.05)
      .fromTo('.hero-sub', { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.95 }, 1.5)
      .fromTo('.hero-rule', { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power3.inOut' }, 1.7)
      .fromTo('.hero-meta', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 1.9)
      .fromTo('.hero-scroll', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 2.05);

    // léger zoom au scroll
    gsap.fromTo('.hero-img',
      { yPercent: -8 },
      { yPercent: 6, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  })();

  /* ---------------------------------------------------------
     Reveal génériques (hors hero)
     --------------------------------------------------------- */
  function bindReveals() {
    gsap.utils.toArray('.reveal-up').filter(function (el) { return !el.closest('#s01'); })
      .forEach(function (el) {
        gsap.fromTo(el, { autoAlpha: 0, y: 44 }, {
          autoAlpha: 1, y: 0, duration: 1.15, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      });

    gsap.utils.toArray('.reveal-plan').forEach(function (el, i) {
      gsap.fromTo(el, { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, duration: 0.95, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true, toggleActions: 'play none none none' },
        delay: (i % 3) * 0.08
      });
    });

    // titres découpés mot à mot
    gsap.utils.toArray('.w-split').filter(function (el) { return !el.closest('#s01'); })
      .forEach(function (el) {
        gsap.fromTo(el.querySelectorAll('.wi'), { yPercent: 115 }, {
          yPercent: 0, duration: 1.15, ease: 'power3.out', stagger: 0.07,
          scrollTrigger: { trigger: el, start: 'top 82%', once: true }
        });
      });

    // figures révélées par masque
    gsap.utils.toArray('.mask-rev').forEach(function (fig) {
      gsap.fromTo(fig, { clipPath: 'inset(14% 16% 14% 16%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power3.inOut',
        scrollTrigger: { trigger: fig, start: 'top 84%', once: true }
      });
    });

    // parallaxe d'images de fond
    gsap.utils.toArray('.parallax-img').forEach(function (wrap) {
      var img = wrap.querySelector('img');
      if (!img) return;
      gsap.fromTo(img, { yPercent: -10 }, {
        yPercent: 10, ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------------------------------------------------------
     S02 · vision — mots à droite
     --------------------------------------------------------- */
  function bindVision() {
    gsap.utils.toArray('.virtue').forEach(function (v, i) {
      gsap.fromTo(v, { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: i * 0.08,
        scrollTrigger: { trigger: v, start: 'top 96%', once: true }
      });
    });
    gsap.fromTo('.vision-bgimg', { y: 34, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: 1.4, ease: 'power2.out',
      scrollTrigger: { trigger: '.vision', start: 'top 70%', once: true }
    });
  }

  /* ---------------------------------------------------------
     S03 · deux univers — colonnes depuis deux directions
     --------------------------------------------------------- */
  function bindUnivers() {
    var isMobile = window.matchMedia('(max-width: 900px)').matches;
    var fx = isMobile ? 0 : -70;
    var fy = isMobile ? 60 : 0;
    var tx = isMobile ? 0 : 70;
    var ty = isMobile ? 60 : 0;
    gsap.fromTo('.uni-frutopy', { x: fx, y: fy, autoAlpha: 0 }, {
      x: 0, y: 0, autoAlpha: 1, duration: 1.3, ease: 'power3.out',
      scrollTrigger: { trigger: '.uni-cols', start: 'top 78%', once: true }
    });
    gsap.fromTo('.uni-tacapae', { x: tx, y: ty, autoAlpha: 0 }, {
      x: 0, y: 0, autoAlpha: 1, duration: 1.3, ease: 'power3.out',
      scrollTrigger: { trigger: '.uni-cols', start: 'top 78%', once: true }
    });
  }

  /* ---------------------------------------------------------
     S04 · collaboration — mise en scène bouteille
     --------------------------------------------------------- */
  function bindCollab() {
    gsap.fromTo('.vol', { autoAlpha: 0, y: 46 }, {
      autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.16,
      scrollTrigger: { trigger: '.collab-text', start: 'top 80%', once: true }
    });

    gsap.fromTo('.drink-stage', { scale: 0.85, rotation: -3, y: 36 }, {
      scale: 1, rotation: 0, y: 0, duration: 1.6, ease: 'power3.out',
      scrollTrigger: { trigger: '.drink-fig', start: 'top 75%', once: true }
    });
    gsap.fromTo('.drink-halo', { autoAlpha: 0, scale: 0.8 }, {
      autoAlpha: 1, scale: 1, duration: 1.4, ease: 'power2.out',
      scrollTrigger: { trigger: '.drink-fig', start: 'top 75%', once: true }
    });
    gsap.fromTo('.drink-sheen', { xPercent: -330 }, {
      xPercent: 360, duration: 2.4, ease: 'power3.inOut', delay: 0.7,
      scrollTrigger: { trigger: '.drink-fig', start: 'top 75%', once: true }
    });
  }

  /* ---------------------------------------------------------
     S05 · volet 1 — ligne de croissance + étapes
     --------------------------------------------------------- */
  function bindOlivier() {
    gsap.fromTo('.tline-fill', { scaleY: 0 }, {
      scaleY: 1, ease: 'none', transformOrigin: 'top',
      scrollTrigger: { trigger: '.timeline', start: 'top 75%', end: 'bottom 55%', scrub: 0.7 }
    });

    gsap.utils.toArray('.tstep').forEach(function (step) {
      gsap.fromTo(step, { autoAlpha: 0, y: 44 }, {
        autoAlpha: 1, y: 0, duration: 0.95, ease: 'power3.out',
        scrollTrigger: {
          trigger: step, start: 'top 72%', once: true,
          onEnter: function () { step.classList.add('is-live'); }
        }
      });
    });

    // légère parallaxe de l'image récolte
    var img = document.querySelector('.ol-img img');
    if (img) {
      gsap.fromTo(img, { yPercent: -14 }, {
        yPercent: 14, ease: 'none',
        scrollTrigger: { trigger: '.ol-img', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
  }

  /* ---------------------------------------------------------
     S06 · volet 2 — bouteille épinglée (desktop) / simple (mobile)
     --------------------------------------------------------- */
  function bindBouteillePin() {
    var mm = gsap.matchMedia();

    mm.add('(min-width: 901px)', function () {
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: '.pin-sec', start: 'top top', end: '+=260%', pin: '.pin-panel', scrub: 1
        }
      });

      tl.fromTo('.pin-head', { autoAlpha: 0, y: -36 }, { autoAlpha: 1, y: 0, duration: 0.16 })
        .fromTo('.ring-1', { rotation: -10, scale: 0.92 }, { rotation: 6, scale: 1, duration: 0.4 }, 0)
        .fromTo('.ring-3', { rotation: 14 }, { rotation: -20, duration: 0.4 }, 0)
        .fromTo('.pin-drink', { y: 64 }, { y: -12, duration: 0.42 }, 0)
        .fromTo('.bouteilles-fig', { y: 54, autoAlpha: 0 }, { y: -26, autoAlpha: 1, duration: 0.32 }, 0.1)
        .fromTo('.pin-sheen', { xPercent: -330 }, { xPercent: 360, duration: 0.5 }, 0.08)
        .fromTo('.pin-info', { autoAlpha: 0, y: 26 }, {
          autoAlpha: 1, y: 0, duration: 0.13, stagger: 0.17, ease: 'power2.out'
        }, 0.24)
        .fromTo('.pin-note', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.09 }, 0.72);

      return function () { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); };
    });

    mm.add('(max-width: 900px)', function () {
      gsap.utils.toArray([].concat(gsap.utils.toArray('.pin-info'), ['.pin-head', '.pin-note'])).forEach(function (el, i) {
        gsap.fromTo(el, { autoAlpha: 0, y: 26 }, {
          autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: (i % 4) * 0.08,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      });
    });
  }

  /* ---------------------------------------------------------
     S07 · offres
     --------------------------------------------------------- */
  function bindOffres() {
    gsap.utils.toArray('.off-card').forEach(function (card) {
      gsap.fromTo(card, { autoAlpha: 0, y: 60 }, {
        autoAlpha: 1, y: 0, duration: 1.05, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 84%', once: true }
      });
    });
  }

  /* ---------------------------------------------------------
     S08 · complémentarité — formule + colonnes
     --------------------------------------------------------- */
  function bindCompl() {
    var formula = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: '.formula', start: 'top 86%', once: true }
    });
    formula
      .fromTo('.f-frutopy', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8 })
      .fromTo('.f-plus', { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.55 }, '-=0.4')
      .fromTo('.f-tacapae', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8 }, '-=0.35')
      .fromTo('.f-eq', { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.55 }, '-=0.35')
      .fromTo('.f-result', { autoAlpha: 0, y: 30, blur: 8 }, { autoAlpha: 1, y: 0, blur: 0, duration: 1 }, '-=0.3');

    gsap.utils.toArray('.comp-col').forEach(function (col) {
      gsap.fromTo(col, { autoAlpha: 0, y: 64 }, {
        autoAlpha: 1, y: 0, duration: 1.15, ease: 'power3.out',
        scrollTrigger: { trigger: col, start: 'top 84%', once: true }
      });
    });
  }

  /* ---------------------------------------------------------
     S09 · pourquoi — cascade
     --------------------------------------------------------- */
  function bindPourquoi() {
    gsap.utils.toArray('.why-item').forEach(function (it) {
      gsap.fromTo(it, { autoAlpha: 0, y: 56 }, {
        autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: it, start: 'top 88%', once: true }
      });
    });
  }

  /* ---------------------------------------------------------
     S10 · feuille de route — ligne + étapes
     --------------------------------------------------------- */
  function bindRoad() {
    gsap.fromTo('.road-line', { scaleX: 0 }, {
      scaleX: 1, ease: 'none', transformOrigin: 'left',
      scrollTrigger: { trigger: '.rsteps', start: 'top 82%', end: 'bottom 60%', scrub: 0.6 }
    });
    gsap.utils.toArray('.rstep').forEach(function (step) {
      gsap.fromTo(step, { autoAlpha: 0, y: 44 }, {
        autoAlpha: 1, y: 0, duration: 0.95, ease: 'power3.out',
        scrollTrigger: {
          trigger: step, start: 'top 78%', once: true,
          onEnter: function () { step.classList.add('is-live'); }
        }
      });
    });
  }

  /* ---------------------------------------------------------
     S11 · finale — fondu vers la campagne, mots immenses
     --------------------------------------------------------- */
  function bindFinale() {
    gsap.fromTo('.fin-viz', { autoAlpha: 0 }, {
      autoAlpha: 1, ease: 'none',
      scrollTrigger: { trigger: '.finale', start: 'top 30%', end: 'bottom bottom', scrub: 0.8 }
    });

    gsap.utils.toArray('.fin-item').forEach(function (item) {
      gsap.fromTo(item, { autoAlpha: 0, y: 34 }, {
        autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 88%', once: true }
      });
    });

    ['fin-h', 'fin-script'].forEach(function (sel) {
      gsap.fromTo('.' + sel, { autoAlpha: 0, y: 60 }, {
        autoAlpha: 1, y: 0, duration: 1.3, ease: 'power3.out',
        scrollTrigger: { trigger: '.' + sel, start: 'top 84%', once: true }
      });
    });
    gsap.fromTo('.fin-brand', { autoAlpha: 0, letterSpacing: '0.6em' }, {
      autoAlpha: 1, letterSpacing: '0.38em', duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: '.fin-brand', start: 'top 90%', once: true }
    });
  }

  /* ---------------------------------------------------------
     Compteurs de chiffres
     --------------------------------------------------------- */
  function bindCounters() {
    gsap.utils.toArray('.count').forEach(function (el) {
      var to = parseFloat(el.dataset.val);
      var dec = el.dataset.dec;
      var prefix = el.dataset.prefix || '';
      var obj = { v: 0 };
      gsap.to(obj, {
        v: to, duration: 2.4, ease: 'power2.out',
        onUpdate: function () {
          var val = dec ? obj.v.toLocaleString('fr-FR', { minimumFractionDigits: +dec, maximumFractionDigits: +dec })
                        : Math.round(obj.v).toLocaleString('fr-FR');
          el.textContent = prefix + val;
        },
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
  }

  /* ---------------------------------------------------------
     Filet de sécurité : rend visible tout contenu encore masqué
     qui est déjà dans le viewport (anticipe un éventuel saut de
     déclencheur ScrollTrigger).
     --------------------------------------------------------- */
  function safetyNet() {
    var targets = '.reveal-up,.reveal-plan,.virtue,.tstep,.rstep,.off-card,.why-item,.fin-item,.pin-info,.drink-stage,.comp-col,.uni-col';
    var els = document.querySelectorAll(targets);
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top > window.innerHeight || r.bottom < 0) return;
      var cs = getComputedStyle(el);
      if (cs.opacity === '0' || cs.visibility === 'hidden') {
        gsap.to(el, { autoAlpha: 1, opacity: 1, y: 0, visibility: 'inherit', duration: 0.55, ease: 'power1.out' });
      }
    });
  }
  var netTicks = 0;
  var netTimer = setInterval(function () {
    safetyNet();
    if (++netTicks >= 24) clearInterval(netTimer); // ~12 s
  }, 500);

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  bindReveals();
  bindVision();
  bindUnivers();
  bindCollab();
  bindOlivier();
  bindBouteillePin();
  bindOffres();
  bindCompl();
  bindPourquoi();
  bindRoad();
  bindFinale();
  bindCounters();
  finishStaticUI();

  window.addEventListener('load', function () {
    ScrollTrigger.refresh();
    setTimeout(function () { ScrollTrigger.refresh(); safetyNet(); }, 800);
  });
})();