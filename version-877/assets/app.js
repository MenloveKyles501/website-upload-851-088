(() => {
  const menuButton = document.querySelector('[data-menu-button]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      mobileNav.classList.toggle('is-open');
    });
  }

  const hero = document.querySelector('[data-hero]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    let current = 0;
    let timer = null;

    const showSlide = (index) => {
      if (!slides.length) return;
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    };

    const schedule = () => {
      clearInterval(timer);
      timer = setInterval(() => showSlide(current + 1), 5200);
    };

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        showSlide(Number(dot.dataset.heroDot || 0));
        schedule();
      });
    });

    if (prev) {
      prev.addEventListener('click', () => {
        showSlide(current - 1);
        schedule();
      });
    }

    if (next) {
      next.addEventListener('click', () => {
        showSlide(current + 1);
        schedule();
      });
    }

    showSlide(0);
    schedule();
  }

  document.querySelectorAll('[data-filter-panel]').forEach((panel) => {
    const input = panel.querySelector('[data-search-input]');
    const scope = panel.parentElement || document;
    const list = scope.querySelector('[data-card-list]') || document.querySelector('[data-card-list]');
    const counter = panel.querySelector('[data-filter-count]');

    if (!input || !list) return;

    const getCards = () => Array.from(list.querySelectorAll('[data-card]'));

    const update = () => {
      const term = input.value.trim().toLowerCase();
      let visible = 0;
      const cards = getCards();

      cards.forEach((card) => {
        const text = (card.dataset.search || card.textContent || '').toLowerCase();
        const matched = !term || text.includes(term);
        card.classList.toggle('is-filter-hidden', !matched);
        if (matched) visible += 1;
      });

      if (counter) {
        counter.textContent = term
          ? `已筛选出 ${visible} 条内容`
          : `当前显示 ${visible} 条内容`;
      }
    };

    panel.querySelectorAll('[data-quick-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        input.value = button.dataset.quickFilter || '';
        update();
        input.focus();
      });
    });

    input.addEventListener('input', update);
    update();
  });
})();
