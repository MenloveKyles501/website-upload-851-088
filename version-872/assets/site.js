(() => {
  const menuButton = document.querySelector('.menu-button');
  const mobilePanel = document.querySelector('.mobile-panel');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', () => {
      const expanded = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!expanded));
      mobilePanel.hidden = expanded;
    });
  }

  document.querySelectorAll('img').forEach((image) => {
    image.addEventListener('error', () => {
      const frame = image.closest('.poster-frame');
      if (frame) {
        frame.classList.add('is-empty');
      }
      image.removeAttribute('src');
    }, { once: true });
  });

  const hero = document.querySelector('[data-hero]');
  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    let index = 0;
    let timer = null;

    const show = (target) => {
      if (!slides.length) {
        return;
      }
      index = (target + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === index);
      });
    };

    const restart = () => {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(() => show(index + 1), 5200);
    };

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        show(Number(dot.dataset.heroDot || 0));
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', () => {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', () => {
        show(index + 1);
        restart();
      });
    }

    restart();
  }

  document.querySelectorAll('[data-filter-form]').forEach((form) => {
    const scope = form.closest('main')?.querySelector('[data-filter-scope]') || document.querySelector('.home-filter-scope');
    if (!scope) {
      return;
    }

    const cards = Array.from(scope.querySelectorAll('.movie-card'));
    const empty = scope.parentElement?.querySelector('.no-result');

    const filter = () => {
      const data = new FormData(form);
      const q = String(data.get('q') || '').trim().toLowerCase();
      const genre = String(data.get('genre') || '').trim().toLowerCase();
      const region = String(data.get('region') || '').trim().toLowerCase();
      const year = String(data.get('year') || '').trim().toLowerCase();
      let visible = 0;

      cards.forEach((card) => {
        const text = [
          card.dataset.title,
          card.dataset.region,
          card.dataset.genre,
          card.dataset.year,
          card.textContent
        ].join(' ').toLowerCase();
        const ok = (!q || text.includes(q)) &&
          (!genre || text.includes(genre)) &&
          (!region || text.includes(region)) &&
          (!year || text.includes(year));

        card.hidden = !ok;
        if (ok) {
          visible += 1;
        }
      });

      if (empty) {
        empty.hidden = visible !== 0;
      }
    };

    form.addEventListener('input', filter);
    form.addEventListener('change', filter);
  });

  const playerMap = new WeakMap();

  const prepareVideo = (box) => {
    const video = box.querySelector('video');
    const message = box.querySelector('.player-state');
    if (!video) {
      return null;
    }

    const source = video.dataset.stream;
    if (!source) {
      return video;
    }

    if (video.dataset.ready === '1') {
      return video;
    }

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR, (_, data) => {
        if (data && data.fatal && message) {
          message.textContent = '播放失败，请稍后再试';
          message.hidden = false;
        }
      });
      playerMap.set(box, hls);
    } else {
      video.src = source;
    }

    video.dataset.ready = '1';
    return video;
  };

  document.querySelectorAll('[data-player]').forEach((box) => {
    const cover = box.querySelector('.play-cover');
    const video = box.querySelector('video');

    const play = () => {
      const target = prepareVideo(box);
      if (!target) {
        return;
      }
      box.classList.add('playing');
      const result = target.play();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {
          box.classList.remove('playing');
        });
      }
    };

    if (cover) {
      cover.addEventListener('click', play);
    }

    if (video) {
      video.addEventListener('play', () => box.classList.add('playing'));
      video.addEventListener('pause', () => {
        if (video.currentTime === 0 || video.ended) {
          box.classList.remove('playing');
        }
      });
    }
  });

  window.addEventListener('pagehide', () => {
    document.querySelectorAll('[data-player]').forEach((box) => {
      const hls = playerMap.get(box);
      if (hls) {
        hls.destroy();
      }
    });
  });
})();
