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

  /* ---------- masapooja offering selector ---------- */
  var poojaSelector = document.getElementById('poojaSelector');
  if (poojaSelector) {
    var poojaRows = Array.prototype.slice.call(poojaSelector.querySelectorAll('.pooja-row'));
    var totalEl = document.getElementById('poojaTotalAmount');
    var bookBtn = document.getElementById('poojaBookBtn');
    var selectAllBtn = document.getElementById('poojaSelectAll');
    var clearAllBtn = document.getElementById('poojaClearAll');

    function clampQty(v) {
      v = parseInt(v, 10);
      if (isNaN(v) || v < 0) v = 0;
      if (v > 99) v = 99;
      return v;
    }

    function refreshPooja() {
      var total = 0;
      var chosen = [];
      poojaRows.forEach(function (row) {
        var input = row.querySelector('.qty-input');
        var qty = clampQty(input.value);
        var price = parseInt(row.dataset.price, 10) || 0;
        row.classList.toggle('has-qty', qty > 0);
        if (qty > 0) {
          total += qty * price;
          chosen.push(row.dataset.name + ' × ' + qty);
        }
      });
      if (totalEl) totalEl.textContent = '₹' + total.toLocaleString('en-IN');
      if (bookBtn) {
        var msg = chosen.length
          ? 'നമസ്കാരം, എനിക്ക് ഈ വഴിപാടുകൾ ബുക്ക് ചെയ്യണം:\n' + chosen.join('\n') + '\nആകെ: ₹' + total.toLocaleString('en-IN')
          : 'നമസ്കാരം, മാസപൂജയെക്കുറിച്ച് അറിയാൻ ആഗ്രഹിക്കുന്നു.';
        bookBtn.href = 'https://wa.me/919847501188?text=' + encodeURIComponent(msg);
      }
    }

    poojaSelector.addEventListener('click', function (e) {
      var btn = e.target.closest('.qbtn');
      if (!btn) return;
      var row = btn.closest('.pooja-row');
      var input = row.querySelector('.qty-input');
      var qty = clampQty(input.value);
      qty = btn.dataset.action === 'inc' ? qty + 1 : Math.max(0, qty - 1);
      input.value = qty;
      refreshPooja();
    });

    poojaSelector.addEventListener('input', function (e) {
      if (!e.target.classList.contains('qty-input')) return;
      e.target.value = clampQty(e.target.value);
      refreshPooja();
    });

    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', function () {
        poojaRows.forEach(function (row) {
          var input = row.querySelector('.qty-input');
          if (clampQty(input.value) === 0) input.value = 1;
        });
        refreshPooja();
      });
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', function () {
        poojaRows.forEach(function (row) { row.querySelector('.qty-input').value = 0; });
        refreshPooja();
      });
    }

    refreshPooja();
  }

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
