(() => {
    const menuButton = document.querySelector('[data-mobile-menu-button]');
    const mobileMenu = document.querySelector('[data-mobile-menu]');

    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
        });
    }

    const slider = document.querySelector('[data-hero-slider]');

    if (slider) {
        const slides = Array.from(slider.querySelectorAll('[data-hero-slide]'));
        const dots = Array.from(slider.querySelectorAll('[data-hero-dot]'));
        const prev = slider.querySelector('[data-hero-prev]');
        const next = slider.querySelector('[data-hero-next]');
        let index = 0;
        let timer = null;

        const showSlide = (nextIndex) => {
            if (!slides.length) {
                return;
            }

            index = (nextIndex + slides.length) % slides.length;

            slides.forEach((slide, slideIndex) => {
                slide.classList.toggle('active', slideIndex === index);
            });

            dots.forEach((dot, dotIndex) => {
                dot.classList.toggle('active', dotIndex === index);
            });
        };

        const start = () => {
            stop();
            timer = window.setInterval(() => showSlide(index + 1), 5000);
        };

        const stop = () => {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        };

        dots.forEach((dot) => {
            dot.addEventListener('click', () => {
                showSlide(Number(dot.dataset.heroDot || 0));
                start();
            });
        });

        if (prev) {
            prev.addEventListener('click', () => {
                showSlide(index - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener('click', () => {
                showSlide(index + 1);
                start();
            });
        }

        slider.addEventListener('mouseenter', stop);
        slider.addEventListener('mouseleave', start);
        start();
    }

    const filterScopes = Array.from(document.querySelectorAll('.filter-scope'));

    filterScopes.forEach((scope) => {
        const keywordInput = scope.querySelector('[data-filter-keyword]');
        const yearSelect = scope.querySelector('[data-filter-year]');
        const typeSelect = scope.querySelector('[data-filter-type]');
        const cards = Array.from(scope.querySelectorAll('[data-movie-card]'));
        const count = scope.querySelector('[data-filter-count]');

        const applyFilter = () => {
            const keyword = (keywordInput?.value || '').trim().toLowerCase();
            const year = yearSelect?.value || '';
            const type = typeSelect?.value || '';
            let visible = 0;

            cards.forEach((card) => {
                const haystack = [
                    card.dataset.title,
                    card.dataset.region,
                    card.dataset.year,
                    card.dataset.type,
                    card.dataset.genre,
                    card.dataset.tags
                ].join(' ').toLowerCase();
                const matchesKeyword = !keyword || haystack.includes(keyword);
                const matchesYear = !year || card.dataset.year === year;
                const matchesType = !type || card.dataset.type === type;
                const shouldShow = matchesKeyword && matchesYear && matchesType;

                card.style.display = shouldShow ? '' : 'none';
                if (shouldShow) {
                    visible += 1;
                }
            });

            if (count) {
                count.textContent = `当前显示 ${visible} 部`;
            }
        };

        [keywordInput, yearSelect, typeSelect].forEach((control) => {
            if (control) {
                control.addEventListener('input', applyFilter);
                control.addEventListener('change', applyFilter);
            }
        });
    });

    const searchPage = document.querySelector('[data-search-page]');

    if (searchPage) {
        const input = searchPage.querySelector('[data-search-input]');
        const typeSelect = searchPage.querySelector('[data-search-type]');
        const yearSelect = searchPage.querySelector('[data-search-year]');
        const status = searchPage.querySelector('[data-search-status]');
        const results = searchPage.querySelector('[data-search-results]');
        const dataNode = document.getElementById('movie-search-data');
        const params = new URLSearchParams(window.location.search);
        const initialQuery = params.get('q') || '';
        let movies = [];

        try {
            movies = JSON.parse(dataNode?.textContent || '[]');
        } catch (error) {
            movies = [];
        }

        if (input) {
            input.value = initialQuery;
        }

        const escapeHtml = (value) => String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        const renderCard = (movie) => {
            const tags = (movie.tags || []).slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');

            return `<article class="movie-card">
                <a href="${escapeHtml(movie.url)}" aria-label="观看 ${escapeHtml(movie.title)}">
                    <div class="poster-frame">
                        <img src="${escapeHtml(movie.image)}" alt="${escapeHtml(movie.title)} 封面" loading="lazy">
                        <span class="poster-type">${escapeHtml(movie.type)}</span>
                        <span class="poster-year">${escapeHtml(movie.year)}</span>
                    </div>
                    <div class="movie-card-body">
                        <h3>${escapeHtml(movie.title)}</h3>
                        <p>${escapeHtml(movie.one_line)}</p>
                        <div class="movie-meta-row">
                            <span>${escapeHtml(movie.region)}</span>
                            <span>${escapeHtml(movie.genre)}</span>
                        </div>
                        <div class="tag-row">${tags}</div>
                    </div>
                </a>
            </article>`;
        };

        const applySearch = () => {
            const keyword = (input?.value || '').trim().toLowerCase();
            const type = typeSelect?.value || '';
            const year = yearSelect?.value || '';

            const matched = movies.filter((movie) => {
                const haystack = [
                    movie.title,
                    movie.region,
                    movie.type,
                    movie.year,
                    movie.genre,
                    movie.category,
                    (movie.tags || []).join(' '),
                    movie.one_line
                ].join(' ').toLowerCase();

                const matchesKeyword = !keyword || haystack.includes(keyword);
                const matchesType = !type || movie.type === type;
                const matchesYear = !year || movie.year === year;

                return matchesKeyword && matchesType && matchesYear;
            });

            if (status) {
                status.textContent = keyword || type || year
                    ? `找到 ${matched.length} 部影片`
                    : `默认展示全部 ${matched.length} 部影片`;
            }

            if (results) {
                results.innerHTML = matched.map(renderCard).join('');
            }
        };

        [input, typeSelect, yearSelect].forEach((control) => {
            if (control) {
                control.addEventListener('input', applySearch);
                control.addEventListener('change', applySearch);
            }
        });

        applySearch();
    }
})();
