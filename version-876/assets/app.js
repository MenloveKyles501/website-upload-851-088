
(function () {
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function initMobileNav() {
    const toggle = qs('[data-mobile-toggle]');
    const nav = qs('[data-mobile-nav]');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      nav.classList.toggle('show');
      toggle.setAttribute('aria-expanded', nav.classList.contains('show') ? 'true' : 'false');
    });
  }

  function initAnchors() {
    qsa('[data-scroll-to]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const target = document.getElementById(btn.getAttribute('data-scroll-to'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function initPlayer() {
    const player = qs('[data-player]');
    if (!player) return;
    const video = qs('video', player);
    const overlay = qs('[data-play-overlay]', player);
    if (!video || !overlay) return;
    function play() {
      player.classList.add('playing');
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          player.classList.remove('playing');
        });
      }
    }
    overlay.addEventListener('click', play);
    video.addEventListener('play', function () {
      player.classList.add('playing');
    });
    video.addEventListener('pause', function () {
      player.classList.remove('playing');
    });
  }

  function cardMatches(card, keyword) {
    if (!keyword) return true;
    const hay = (card.getAttribute('data-search') || '').toLowerCase();
    return hay.indexOf(keyword) !== -1;
  }

  function initLocalFilter() {
    const wrapper = qs('[data-live-filter]');
    if (!wrapper) return;
    const input = qs('[data-filter-input]', wrapper);
    const selects = qsa('[data-filter-select]', wrapper);
    const cards = qsa('[data-filter-card]', wrapper);
    if (!input) return;

    function apply() {
      const kw = (input.value || '').trim().toLowerCase();
      const cat = selects[0] ? selects[0].value : '';
      const year = selects[1] ? selects[1].value : '';
      cards.forEach(function (card) {
        const matchText = cardMatches(card, kw);
        const matchCat = !cat || card.getAttribute('data-cat') === cat;
        const matchYear = !year || card.getAttribute('data-year') === year;
        card.style.display = matchText && matchCat && matchYear ? '' : 'none';
      });
    }
    input.addEventListener('input', apply);
    selects.forEach(function (sel) {
      sel.addEventListener('change', apply);
    });
    apply();
  }

  function initSearchPage() {
    const root = qs('[data-search-page]');
    if (!root || !window.SITE_MOVIES) return;
    const input = qs('[data-search-query]', root);
    const cat = qs('[data-search-cat]', root);
    const year = qs('[data-search-year]', root);
    const sort = qs('[data-search-sort]', root);
    const results = qs('[data-search-results]', root);
    const summary = qs('[data-search-summary]', root);
    if (!results || !input) return;

    const params = new URLSearchParams(location.search);
    if (params.get('q') && !input.value) input.value = params.get('q');
    if (params.get('cat') && cat) cat.value = params.get('cat');
    if (params.get('year') && year) year.value = params.get('year');
    if (params.get('sort') && sort) sort.value = params.get('sort');

    function scoreYear(m) {
      return parseInt(m.year || 0, 10) || 0;
    }

    function render() {
      const kw = (input.value || '').trim().toLowerCase();
      const c = cat ? cat.value : '';
      const y = year ? year.value : '';
      const s = sort ? sort.value : 'score';
      let items = window.SITE_MOVIES.filter(function (m) {
        const hay = [m.title, m.region, m.type, m.genre, m.oneLine, (m.tags || []).join(' '), m.summary || ''].join(' ').toLowerCase();
        const okKw = !kw || hay.indexOf(kw) !== -1;
        const okCat = !c || m.cat === c;
        const okYear = !y || String(m.year) === y;
        return okKw && okCat && okYear;
      });

      items.sort(function (a, b) {
        if (s === 'year') return (b.year || 0) - (a.year || 0) || (b.score || 0) - (a.score || 0);
        if (s === 'title') return String(a.title).localeCompare(String(b.title), 'zh-Hans-CN');
        return (b.score || 0) - (a.score || 0) || (b.year || 0) - (a.year || 0);
      });

      summary.textContent = '共找到 ' + items.length + ' 条结果';
      results.innerHTML = items.slice(0, 200).map(function (m) {
        return `
          <a class="movie-card" href="${m.url}" data-filter-card data-search="${escapeHTML([m.title, m.region, m.type, m.genre, m.oneLine, (m.tags || []).join(' ')].join(' '))}" data-cat="${m.cat}" data-year="${m.year}">
            <div class="movie-poster">
              <img src="${m.cover}" alt="${escapeHTML(m.title)}">
              <span class="type-badge">${escapeHTML(m.type)}</span>
            </div>
            <div class="movie-body">
              <h3 class="movie-title">${escapeHTML(m.title)}</h3>
              <div class="movie-meta"><span>${escapeHTML(m.region)}</span><span>•</span><span>${escapeHTML(String(m.year))}</span></div>
              <p class="movie-line">${escapeHTML(m.oneLine || m.summary || '')}</p>
              <div class="chip-row">${(m.tags || []).slice(0,3).map(function (t) { return '<span class="chip muted">' + escapeHTML(t) + '</span>'; }).join('')}</div>
            </div>
          </a>`;
      }).join('');
    }

    function escapeHTML(str) {
      return String(str).replace(/[&<>"']/g, function (ch) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
      });
    }

    [input, cat, year, sort].forEach(function (el) {
      if (el) el.addEventListener('input', render);
      if (el) el.addEventListener('change', render);
    });
    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initAnchors();
    initPlayer();
    initLocalFilter();
    initSearchPage();
  });
})();
