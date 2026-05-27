
(function () {
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function makeCard(movie) {
    const a = document.createElement("a");
    a.className = "movie-card";
    a.href = movie.link;
    a.innerHTML = `
      <div class="thumb">
        <img src="${movie.poster}" alt="${movie.title}" loading="lazy">
      </div>
      <div class="body">
        <div class="meta-row">
          <span>${movie.year || ""}</span>
          <span>${movie.region || ""}</span>
        </div>
        <h3>${movie.title}</h3>
        <p>${movie.one_line || movie.summary || ""}</p>
        <div class="meta">
          ${(movie.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join("")}
        </div>
        <div class="footer">
          <span class="link">查看详情</span>
          <span class="meta-row"><span>${movie.primary_genre || movie.genre || ""}</span></span>
        </div>
      </div>
    `;
    return a;
  }

  function renderCards(container, items) {
    container.innerHTML = "";
    if (!items.length) {
      container.innerHTML = '<div class="empty-state">没有找到匹配结果，请尝试更换关键词。</div>';
      return;
    }
    const frag = document.createDocumentFragment();
    items.forEach(item => frag.appendChild(makeCard(item)));
    container.appendChild(frag);
  }

  function readCatalog() {
    return Array.isArray(window.MOVIE_CATALOG) ? window.MOVIE_CATALOG : [];
  }

  function filterCatalog(catalog, query, genre, year) {
    const q = (query || "").trim().toLowerCase();
    return catalog.filter(movie => {
      if (genre && genre !== "all" && movie.primary_genre !== genre) return false;
      if (year && year !== "all" && String(movie.year) !== String(year)) return false;
      if (!q) return true;
      const hay = [
        movie.title,
        movie.region,
        movie.type,
        movie.genre,
        movie.primary_genre,
        movie.one_line,
        movie.summary,
        (movie.tags || []).join(" ")
      ].join(" ").toLowerCase();
      return hay.includes(q);
    }).sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  function initSearchPage() {
    const root = qs("[data-search-root]");
    if (!root) return;

    const catalog = readCatalog();
    const cards = qs("[data-search-results]", root);
    const input = qs("[data-search-input]", root);
    const genre = qs("[data-filter-genre]", root);
    const year = qs("[data-filter-year]", root);
    const count = qs("[data-search-count]", root);

    const url = new URL(window.location.href);
    const initialQuery = url.searchParams.get("q") || "";
    const initialGenre = url.searchParams.get("genre") || "all";
    const initialYear = url.searchParams.get("year") || "all";

    if (input) input.value = initialQuery;
    if (genre) genre.value = initialGenre;
    if (year) year.value = initialYear;

    function syncUrl() {
      const next = new URL(window.location.href);
      const q = (input && input.value || "").trim();
      const g = genre ? genre.value : "all";
      const y = year ? year.value : "all";
      if (q) next.searchParams.set("q", q); else next.searchParams.delete("q");
      if (g && g !== "all") next.searchParams.set("genre", g); else next.searchParams.delete("genre");
      if (y && y !== "all") next.searchParams.set("year", y); else next.searchParams.delete("year");
      history.replaceState(null, "", next);
    }

    function refresh() {
      const result = filterCatalog(catalog, input ? input.value : "", genre ? genre.value : "all", year ? year.value : "all");
      if (count) count.textContent = `${result.length} 部影片`;
      renderCards(cards, result.slice(0, 240));
      syncUrl();
    }

    [input, genre, year].filter(Boolean).forEach(el => {
      el.addEventListener(el.tagName === "INPUT" ? "input" : "change", refresh);
    });

    refresh();
  }

  async function setupHlsPlayer(video) {
    const src = video.dataset.src;
    if (!src) return;

    // Native HLS on Safari and some environments.
    if (video.canPlayType && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    // Load hls.js only when needed.
    if (!window.Hls) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      }).catch(() => null);
    }

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      video._hls = hls;
      return;
    }

    // Last resort: attempt to set the source directly.
    video.src = src;
  }

  function initPlayers() {
    qsa("[data-movie-player]").forEach(video => {
      if (!video.dataset.inited) {
        video.dataset.inited = "1";
        setupHlsPlayer(video);
      }
    });
  }

  function initMobileMenu() {
    const btn = qs("[data-menu-toggle]");
    const menu = qs("[data-mobile-menu]");
    if (!btn || !menu) return;
    btn.addEventListener("click", () => {
      menu.classList.toggle("open");
      const open = menu.classList.contains("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function initHeroControls() {
    qsa("[data-scroll-target]").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = qs(btn.getAttribute("data-scroll-target"));
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initMobileMenu();
    initHeroControls();
    initSearchPage();
    initPlayers();
  });
})();
