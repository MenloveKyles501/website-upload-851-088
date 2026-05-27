(() => {
  const body = document.body;

  const menuBtn = document.querySelector('[data-menu-toggle]');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      body.classList.toggle('nav-open');
    });
  }

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) {
      body.classList.remove('nav-open');
    }
  });

  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll('[data-slide]'));
    const dots = Array.from(carousel.querySelectorAll('[data-dot]'));
    const prev = carousel.querySelector('[data-prev]');
    const next = carousel.querySelector('[data-next]');
    if (!slides.length) return;

    let index = 0;
    let timer = null;

    const show = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    };

    const step = (delta) => show(index + delta);

    prev && prev.addEventListener('click', () => step(-1));
    next && next.addEventListener('click', () => step(1));
    dots.forEach((dot, dotIndex) => dot.addEventListener('click', () => show(dotIndex)));

    const start = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => step(1), 6000);
    };

    carousel.addEventListener('mouseenter', () => timer && clearInterval(timer));
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('touchstart', () => timer && clearInterval(timer), { passive: true });
    carousel.addEventListener('touchend', start);

    show(0);
    start();
  });

  document.querySelectorAll('[data-filter-form]').forEach((form) => {
    const input = form.querySelector('[data-filter-input]');
    const grid = document.querySelector(form.dataset.target || '');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('[data-card]'));
    const chips = Array.from(form.querySelectorAll('[data-filter-chip]'));
    const clearBtn = form.querySelector('[data-filter-clear]');

    const apply = () => {
      const query = (input?.value || '').trim().toLowerCase();

      cards.forEach((card) => {
        const haystack = [
          card.dataset.title || '',
          card.dataset.summary || '',
          card.dataset.tags || '',
          card.dataset.region || '',
          card.dataset.genre || '',
          card.dataset.type || '',
          card.dataset.year || '',
          card.dataset.bucket || '',
        ].join(' ').toLowerCase();

        const visible = !query || haystack.includes(query);
        card.hidden = !visible;
      });
    };

    input && input.addEventListener('input', apply);

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const value = chip.dataset.filterChip || '';
        if (input) input.value = value;
        chips.forEach((item) => item.classList.remove('is-active'));
        chip.classList.add('is-active');
        apply();
      });
    });

    clearBtn && clearBtn.addEventListener('click', () => {
      if (input) input.value = '';
      chips.forEach((item) => item.classList.remove('is-active'));
      apply();
      if (chips[0]) chips[0].classList.add('is-active');
    });

    apply();
  });

  const toTop = document.querySelector('[data-back-top]');
  if (toTop) {
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
})();
