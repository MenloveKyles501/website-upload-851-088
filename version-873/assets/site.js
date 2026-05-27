
(function () {
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function initNav() {
    const toggle = qs('[data-nav-toggle]');
    const panel = qs('[data-nav-panel]');
    if (!toggle || !panel) return;
    toggle.addEventListener('click', () => {
      panel.classList.toggle('hidden');
    });
  }

  function initHeroCarousel() {
    const root = qs('[data-hero-carousel]');
    if (!root) return;
    const slides = qsa('[data-hero-slide]', root);
    const dots = qsa('[data-hero-dot]', root);
    const prev = qs('[data-hero-prev]', root);
    const next = qs('[data-hero-next]', root);
    if (!slides.length) return;
    let index = 0;
    let timer = null;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((slide, idx) => {
        slide.classList.toggle('is-active', idx === index);
      });
      dots.forEach((dot, idx) => {
        dot.classList.toggle('is-active', idx === index);
      });
    }

    function restart() {
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(() => show(index + 1), 5500);
    }

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        show(idx);
        restart();
      });
    });
    prev && prev.addEventListener('click', () => {
      show(index - 1);
      restart();
    });
    next && next.addEventListener('click', () => {
      show(index + 1);
      restart();
    });

    show(0);
    restart();
  }

  function normalizeText(text) {
    return (text || '').toLowerCase().replace(/\s+/g, '');
  }

  function initFilterRoot() {
    const root = qs('[data-filter-root]');
    if (!root) return;
    const input = qs('[data-filter-input]', root);
    const cards = qsa('[data-card]', root);
    const count = qs('[data-filter-count]', root);
    const reset = qs('[data-filter-reset]', root);

    function apply() {
      const query = normalizeText(input ? input.value : '');
      let visible = 0;
      cards.forEach((card) => {
        const text = normalizeText(card.dataset.search || card.textContent);
        const ok = !query || text.includes(query);
        card.classList.toggle('filter-hidden', !ok);
        if (ok) visible += 1;
      });
      if (count) count.textContent = String(visible);
    }

    if (input) input.addEventListener('input', apply);
    if (reset) {
      reset.addEventListener('click', () => {
        if (input) input.value = '';
        apply();
        input && input.focus();
      });
    }
    apply();
  }

  function initPlayer() {
    qsa('[data-player]').forEach((video) => {
      const hlsSrc = video.dataset.hlsSrc;
      const fallbackSrc = video.dataset.fallbackSrc;
      const poster = video.dataset.poster || video.getAttribute('poster');
      const wrapper = video.closest('[data-player-wrap]');
      const playBtn = wrapper ? qs('[data-play-toggle]', wrapper) : null;
      let hls = null;

      function useFallback() {
        if (video.src !== fallbackSrc) {
          video.src = fallbackSrc;
        }
      }

      function useHls() {
        if (!window.Hls || !window.Hls.isSupported()) {
          useFallback();
          return;
        }
        if (hls) {
          try { hls.destroy(); } catch (e) {}
          hls = null;
        }
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hls.loadSource(hlsSrc);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            useFallback();
          }
        });
      }

      if (hlsSrc) {
        // keep local preview available as immediate fallback
        useFallback();
        let upgraded = false;

        const tryUpgrade = () => {
          if (!upgraded && window.Hls && window.Hls.isSupported()) {
            upgraded = true;
            useHls();
            return true;
          }
          return false;
        };

        if (!tryUpgrade()) {
          let attempts = 0;
          const timer = window.setInterval(() => {
            attempts += 1;
            if (tryUpgrade() || attempts > 20) {
              window.clearInterval(timer);
            }
          }, 300);
        }
      }

      const togglePlay = () => {
        if (video.paused) {
          const p = video.play();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {});
          }
        } else {
          video.pause();
        }
      };

      if (playBtn) {
        playBtn.addEventListener('click', togglePlay);
      }
      video.addEventListener('click', togglePlay);
      video.addEventListener('play', () => {
        if (playBtn) playBtn.classList.add('opacity-0', 'pointer-events-none');
      });
      video.addEventListener('pause', () => {
        if (playBtn) playBtn.classList.remove('opacity-0', 'pointer-events-none');
      });
      video.addEventListener('ended', () => {
        if (playBtn) playBtn.classList.remove('opacity-0', 'pointer-events-none');
      });
    });
  }

  function initSearchPage() {
    const root = qs('[data-search-page]');
    if (!root) return;
    const input = qs('[data-search-input]', root);
    const results = qs('[data-search-results]', root);
    const counter = qs('[data-search-counter]', root);
    const chips = qsa('[data-search-chip]', root);
    const sort = qs('[data-search-sort]', root);
    const pageTitle = qs('[data-search-query]', root);
    const queryFromUrl = new URLSearchParams(location.search).get('q') || '';
    if (input && queryFromUrl) input.value = queryFromUrl;
    if (pageTitle) pageTitle.textContent = queryFromUrl || '全部影片';
    let all = [];

    const render = (list) => {
      if (!results) return;
      results.innerHTML = list.map((item) => `
        <article class="movie-card group" data-card data-search="${escapeHtml(
          [item.title, item.region, item.year, item.genre, item.one_line, (item.tags || []).join(' ')].join(' ')
        )}">
          <a href="${item.page}" class="block overflow-hidden rounded-2xl border border-white/8 bg-dark-800/80">
            <div class="relative aspect-[3/4] overflow-hidden">
              <img src="${item.poster}" alt="${escapeHtml(item.title)}" loading="lazy" class="h-full w-full object-cover">
              <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
              <div class="absolute left-0 right-0 bottom-0 p-4">
                <h3 class="text-base font-semibold text-white line-clamp-2 leading-snug">${escapeHtml(item.title)}</h3>
                <p class="mt-2 text-xs text-gray-300 line-clamp-2">${escapeHtml(item.one_line || '')}</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span class="source-badge">${escapeHtml(item.region)}</span>
                  <span class="source-badge">${escapeHtml(item.year)}</span>
                </div>
              </div>
            </div>
          </a>
        </article>
      `).join('');
      if (counter) counter.textContent = String(list.length);
    };

    function applyFilters() {
      const q = normalizeText(input ? input.value : '');
      let list = all.slice();

      if (q) {
        list = list.filter((item) => normalizeText(
          [item.title, item.region, item.year, item.genre, item.one_line, (item.tags || []).join(' '), item.summary].join(' ')
        ).includes(q));
      }

      const activeChip = chips.find((c) => c.classList.contains('is-active'));
      if (activeChip && activeChip.dataset.value && activeChip.dataset.value !== 'all') {
        const v = activeChip.dataset.value;
        list = list.filter((item) => {
          if (v.startsWith('year-')) return item.year === v.slice(5);
          if (v.startsWith('region-')) return item.region.includes(v.slice(7));
          if (v.startsWith('type-')) return item.type.includes(v.slice(5));
          return true;
        });
      }

      const sortValue = sort ? sort.value : 'score';
      list.sort((a, b) => {
        if (sortValue === 'year') return Number(b.year) - Number(a.year);
        if (sortValue === 'title') return a.title.localeCompare(b.title, 'zh-Hans-CN');
        return Number(b.score) - Number(a.score);
      });
      render(list);
    }

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        applyFilters();
      });
    });
    if (input) input.addEventListener('input', applyFilters);
    if (sort) sort.addEventListener('change', applyFilters);

    fetch('assets/search-index.json')
      .then((r) => r.json())
      .then((json) => {
        all = json;
        applyFilters();
      })
      .catch(() => {
        if (results) results.innerHTML = '<div class="text-gray-400">搜索索引加载失败。</div>';
      });
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initHeroCarousel();
    initFilterRoot();
    initPlayer();
    initSearchPage();
  });
})();
