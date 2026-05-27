(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return (value || '').toString().trim().toLowerCase();
  }

  function setupMenu() {
    var toggle = $('.menu-toggle');
    var panel = $('.mobile-panel');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      panel.classList.toggle('open');
      document.body.classList.toggle('menu-open', panel.classList.contains('open'));
    });
  }

  function setupHero() {
    var hero = $('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = $all('.hero-slide', hero);
    var dots = $all('.hero-dot', hero);
    var prev = $('.hero-prev', hero);
    var next = $('.hero-next', hero);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(parseInt(dot.getAttribute('data-slide'), 10) || 0);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupFilters() {
    $all('[data-filter-area]').forEach(function (area) {
      var input = $('.local-filter', area);
      var cards = $all('.movie-card', area);
      var chips = $all('.filter-chip', area);
      var activeChip = '';
      var params = new URLSearchParams(window.location.search);
      var initial = params.get('q') || '';

      function apply() {
        var query = normalize(input ? input.value : '');
        var chip = normalize(activeChip);
        cards.forEach(function (card) {
          var haystack = normalize(card.getAttribute('data-keywords') || card.textContent);
          var matchesQuery = !query || haystack.indexOf(query) !== -1;
          var matchesChip = !chip || chip === '全部' || haystack.indexOf(chip) !== -1;
          card.classList.toggle('hidden', !(matchesQuery && matchesChip));
        });
      }

      if (input) {
        input.value = initial;
        input.addEventListener('input', apply);
      }
      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          chips.forEach(function (item) {
            item.classList.remove('active');
          });
          chip.classList.add('active');
          activeChip = chip.getAttribute('data-filter') || '';
          if (activeChip === '全部') {
            activeChip = '';
          }
          apply();
        });
      });
      apply();
    });
  }

  window.initMoviePlayer = function (videoId, coverId, source) {
    var video = document.getElementById(videoId);
    var cover = document.getElementById(coverId);
    if (!video || !cover || !source) {
      return;
    }
    var hlsReady = false;

    function useNative() {
      video.src = source;
      video.play().catch(function () {});
    }

    function useHls() {
      if (!window.Hls || !window.Hls.isSupported()) {
        useNative();
        return;
      }
      if (!hlsReady) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(function () {});
        });
        hlsReady = true;
      } else {
        video.play().catch(function () {});
      }
    }

    function play() {
      cover.classList.add('is-hidden');
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        useNative();
      } else {
        useHls();
      }
    }

    cover.addEventListener('click', play);
    cover.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        play();
      }
    });
    $all('[data-play-target="' + videoId + '"]').forEach(function (button) {
      button.addEventListener('click', play);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupHero();
    setupFilters();
  });
})();
