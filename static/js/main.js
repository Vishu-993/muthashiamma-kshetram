(function () {
  'use strict';
  document.documentElement.classList.add('js-ready');

  var header = document.getElementById('siteHeader');
  var burger = document.getElementById('burgerBtn');
  var navlinks = document.getElementById('navlinks');
  var overlay = document.getElementById('navOverlay');
  var progressBar = document.getElementById('progressBar');
  var topFloat = document.getElementById('topFloat');
  var toast = document.getElementById('toast');
  var subnavScroll = document.getElementById('subnav');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header height -> CSS var (keeps sticky subnav from overlapping when topbar wraps) ---------- */
  function syncHeaderHeight() {
    if (!header) return;
    document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  }
  syncHeaderHeight();
  window.addEventListener('resize', debounce(syncHeaderHeight, 150));
  if ('ResizeObserver' in window && header) {
    new ResizeObserver(syncHeaderHeight).observe(header);
  }

  /* ---------- mobile drawer ---------- */
  var lastFocused = null;

  function openDrawer() {
    if (!navlinks) return;
    lastFocused = document.activeElement;
    navlinks.classList.add('open');
    burger.classList.add('active');
    burger.setAttribute('aria-expanded', 'true');
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add('show'); });
    document.documentElement.classList.add('no-scroll');
    document.body.classList.add('no-scroll');
    var firstLink = navlinks.querySelector('a, button');
    if (firstLink) firstLink.focus({ preventScroll: true });
  }

  function closeDrawer() {
    if (!navlinks) return;
    navlinks.classList.remove('open');
    burger.classList.remove('active');
    burger.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('show');
    document.documentElement.classList.remove('no-scroll');
    document.body.classList.remove('no-scroll');
    setTimeout(function () { if (!navlinks.classList.contains('open')) overlay.hidden = true; }, 350);
    if (lastFocused) lastFocused.focus({ preventScroll: true });
  }

  function toggleDrawer() {
    navlinks.classList.contains('open') ? closeDrawer() : openDrawer();
  }

  if (burger && navlinks && overlay) {
    burger.addEventListener('click', toggleDrawer);
    overlay.addEventListener('click', closeDrawer);

    navlinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navlinks.classList.contains('open')) closeDrawer();
    });

    // basic focus trap while drawer open
    navlinks.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !navlinks.classList.contains('open')) return;
      var focusables = navlinks.querySelectorAll('a, button');
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // close drawer automatically if resized to desktop width
    window.addEventListener('resize', debounce(function () {
      if (window.innerWidth > 880 && navlinks.classList.contains('open')) closeDrawer();
    }, 150));
  }

  /* ---------- scroll-driven UI: progress bar, header shadow, back-to-top, active pill ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('main [id]'));
  var pills = Array.prototype.slice.call(document.querySelectorAll('.pill'));
  var ticking = false;

  function onScroll() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (progressBar) progressBar.style.width = pct + '%';
    if (header) header.classList.toggle('scrolled', scrollTop > 8);
    if (topFloat) topFloat.classList.toggle('show', scrollTop > 480);

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------- active subnav pill + nav link, via IntersectionObserver ---------- */
  if ('IntersectionObserver' in window && sections.length) {
    var activeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;

        pills.forEach(function (p) {
          p.classList.toggle('active', p.dataset.target === id);
        });
        var pillActive = document.querySelector('.pill.active');
        if (pillActive && subnavScroll) {
          subnavScroll.scrollTo({
            left: pillActive.offsetLeft - 24,
            behavior: reducedMotion ? 'auto' : 'smooth'
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { activeObserver.observe(s); });
  }

  /* ---------- reveal / stagger animations ---------- */
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.reveal, .stagger').forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal, .stagger').forEach(function (el) {
      el.classList.add('in');
    });
  }

  /* ---------- back to top ---------- */
  if (topFloat) {
    topFloat.addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('top').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- toast helper (available for copy-to-clipboard etc.) ---------- */
  var toastTimer = null;
  window.showToast = function (msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  };

  /* ---------- utils ---------- */
  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      var args = arguments, ctx = this;
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }
})();
