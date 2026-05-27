import { H as Hls } from './video-player-dru42stk.js';
import { MOVIES } from './movies-data.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function setupMenu() {
  const toggle = $('[data-menu-toggle]');
  const nav = $('[data-mobile-nav]');
  if (!toggle || !nav) {
    return;
  }
  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
}

function setupHero() {
  const hero = $('[data-hero]');
  if (!hero) {
    return;
  }

  const slides = $$('[data-hero-slide]', hero);
  const dots = $$('[data-hero-dot]', hero);
  const prev = $('[data-hero-prev]', hero);
  const next = $('[data-hero-next]', hero);
  let index = 0;
  let timer = null;

  const show = (nextIndex) => {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('active', slideIndex === index);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === index);
    });
  };

  const restart = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => show(index + 1), 5000);
  };

  prev?.addEventListener('click', () => {
    show(index - 1);
    restart();
  });

  next?.addEventListener('click', () => {
    show(index + 1);
    restart();
  });

  dots.forEach((dot, dotIndex) => {
    dot.addEventListener('click', () => {
      show(dotIndex);
      restart();
    });
  });

  restart();
}

function setupFilterGrids() {
  const grid = $('[data-filter-grid]');
  const input = $('[data-grid-filter]');
  const yearSelect = $('[data-grid-year]');
  if (!grid || (!input && !yearSelect)) {
    return;
  }

  const cards = $$('[data-card]', grid);
  const apply = () => {
    const q = (input?.value || '').trim().toLowerCase();
    const year = yearSelect?.value || '';
    cards.forEach((card) => {
      const haystack = [card.dataset.title, card.dataset.region, card.dataset.year, card.dataset.tags]
        .join(' ')
        .toLowerCase();
      const matchText = !q || haystack.includes(q);
      const matchYear = !year || card.dataset.year === year;
      card.hidden = !(matchText && matchYear);
    });
  };

  input?.addEventListener('input', apply);
  yearSelect?.addEventListener('change', apply);
}

function cardTemplate(movie) {
  const tags = movie.tags.slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
  return `
    <article class="movie-card" data-card>
      <a class="poster-wrap" href="movie/${movie.id}.html" aria-label="查看${escapeHtml(movie.title)}详情">
        <img src="./${movie.coverIndex}.jpg" alt="${escapeHtml(movie.title)}封面" loading="lazy" onerror="this.style.display='none'" />
        <span class="badge score">${Number(movie.score).toFixed(1)}</span>
        <span class="badge type">${escapeHtml(movie.type)}</span>
      </a>
      <div class="movie-card-body">
        <h3><a href="movie/${movie.id}.html">${escapeHtml(movie.title)}</a></h3>
        <p class="meta">${escapeHtml(movie.region)} · ${escapeHtml(movie.year)} · ${escapeHtml(movie.duration)}</p>
        <p class="one-line">${escapeHtml(movie.oneLine)}</p>
        <div class="tag-row">${tags}</div>
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setupSearchPage() {
  const app = $('[data-search-app]');
  if (!app) {
    return;
  }

  const input = $('[data-search-input]', app);
  const category = $('[data-search-category]', app);
  const type = $('[data-search-type]', app);
  const year = $('[data-search-year]', app);
  const reset = $('[data-search-reset]', app);
  const count = $('[data-search-count]', app);
  const results = $('[data-search-results]', app);
  const params = new URLSearchParams(window.location.search);

  input.value = params.get('q') || '';
  category.value = params.get('category') || '';
  year.value = params.get('year') || '';

  const render = () => {
    const q = input.value.trim().toLowerCase();
    const categoryValue = category.value;
    const typeValue = type.value;
    const yearValue = year.value.trim();

    const matched = MOVIES.filter((movie) => {
      const haystack = [
        movie.title,
        movie.region,
        movie.type,
        movie.year,
        movie.genre,
        movie.categoryName,
        movie.oneLine,
        movie.tags.join(' '),
      ].join(' ').toLowerCase();

      return (!q || haystack.includes(q))
        && (!categoryValue || movie.categorySlug === categoryValue)
        && (!typeValue || movie.type.includes(typeValue))
        && (!yearValue || movie.year === yearValue);
    });

    count.textContent = `共找到 ${matched.length} 条结果，当前显示前 ${Math.min(matched.length, 120)} 条。`;
    results.innerHTML = matched.slice(0, 120).map(cardTemplate).join('');
  };

  [input, category, type, year].forEach((control) => {
    control.addEventListener('input', render);
    control.addEventListener('change', render);
  });

  reset.addEventListener('click', () => {
    input.value = '';
    category.value = '';
    type.value = '';
    year.value = '';
    render();
  });

  render();
}

function setupPlayers() {
  $$('[data-player]').forEach((player) => {
    const video = $('video', player);
    const start = $('[data-player-start]', player);
    const errorBox = $('[data-player-error]', player);
    const source = player.dataset.videoSrc;
    let hls = null;
    let initialized = false;

    if (!video || !source) {
      return;
    }

    const setError = (message) => {
      player.classList.remove('loading');
      player.classList.add('error');
      errorBox.textContent = message;
    };

    const initialize = () => {
      if (initialized) {
        return Promise.resolve();
      }
      initialized = true;
      player.classList.add('loading');

      return new Promise((resolve) => {
        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            player.classList.remove('loading');
            resolve();
          });
          hls.on(Hls.Events.ERROR, (eventName, data) => {
            if (data?.fatal) {
              setError('视频加载失败，请稍后重试');
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.addEventListener('loadedmetadata', () => {
            player.classList.remove('loading');
            resolve();
          }, { once: true });
          video.addEventListener('error', () => setError('当前浏览器无法加载该视频源'), { once: true });
        } else {
          setError('您的浏览器不支持 HLS 视频播放');
          resolve();
        }
      });
    };

    const play = async () => {
      try {
        await initialize();
        await video.play();
        player.classList.add('playing');
        video.setAttribute('controls', 'controls');
      } catch (error) {
        setError('播放被浏览器阻止，请再次点击播放');
      }
    };

    start?.addEventListener('click', play);
    video.addEventListener('click', () => {
      if (video.paused) {
        play();
      } else {
        video.pause();
      }
    });
    video.addEventListener('play', () => player.classList.add('playing'));
    video.addEventListener('pause', () => player.classList.remove('playing'));

    window.addEventListener('pagehide', () => {
      hls?.destroy();
    });
  });
}

setupMenu();
setupHero();
setupFilterGrids();
setupSearchPage();
setupPlayers();
