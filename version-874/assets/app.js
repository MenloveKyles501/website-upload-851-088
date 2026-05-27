(function () {
    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    function initMenu() {
        var toggle = document.querySelector('[data-menu-toggle]');
        var links = document.querySelector('[data-nav-links]');
        if (!toggle || !links) {
            return;
        }
        toggle.addEventListener('click', function () {
            links.classList.toggle('open');
            document.body.classList.toggle('menu-open');
        });
        links.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                links.classList.remove('open');
                document.body.classList.remove('menu-open');
            });
        });
    }

    function initHero() {
        var hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var previous = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (previous) {
            previous.addEventListener('click', function () {
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
        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener('click', function () {
                show(dotIndex);
                start();
            });
        });
        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function normalizeText(value) {
        return (value || '').toString().trim().toLowerCase();
    }

    function initSearchPanels() {
        document.querySelectorAll('[data-search-panel]').forEach(function (panel) {
            var input = panel.querySelector('[data-search-input]');
            var scopeId = panel.getAttribute('data-scope');
            var grid = scopeId ? document.getElementById(scopeId) : panel.parentElement.querySelector('[data-search-grid]');
            var buttons = Array.prototype.slice.call(panel.querySelectorAll('[data-filter-button]'));
            var empty = panel.parentElement.querySelector('[data-empty]');
            if (!grid) {
                return;
            }
            var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-movie-card]'));
            var activeFilter = 'all';

            function apply() {
                var query = normalizeText(input ? input.value : '');
                var visible = 0;
                cards.forEach(function (card) {
                    var searchText = normalizeText(card.getAttribute('data-search'));
                    var category = card.getAttribute('data-category') || '';
                    var matchQuery = !query || searchText.indexOf(query) !== -1;
                    var matchFilter = activeFilter === 'all' || category === activeFilter;
                    var show = matchQuery && matchFilter;
                    card.style.display = show ? '' : 'none';
                    if (show) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle('show', visible === 0);
                }
            }

            if (input) {
                input.addEventListener('input', apply);
            }
            buttons.forEach(function (button) {
                button.addEventListener('click', function () {
                    activeFilter = button.getAttribute('data-filter-button') || 'all';
                    buttons.forEach(function (item) {
                        item.classList.toggle('active', item === button);
                    });
                    apply();
                });
            });
            apply();
        });
    }

    function bindStream(video, stream) {
        if (video.getAttribute('data-ready') === '1') {
            return;
        }
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = stream;
            video.setAttribute('data-ready', '1');
            return;
        }
        if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
                maxBufferLength: 30,
                enableWorker: true
            });
            hls.loadSource(stream);
            hls.attachMedia(video);
            video.setAttribute('data-ready', '1');
            return;
        }
        video.src = stream;
        video.setAttribute('data-ready', '1');
    }

    function initPlayers() {
        document.querySelectorAll('[data-player]').forEach(function (player) {
            var video = player.querySelector('video');
            var overlay = player.querySelector('[data-player-overlay]');
            var stream = player.getAttribute('data-stream');
            if (!video || !stream) {
                return;
            }
            function start() {
                bindStream(video, stream);
                if (overlay) {
                    overlay.classList.add('hidden');
                }
                var request = video.play();
                if (request && typeof request.catch === 'function') {
                    request.catch(function () {});
                }
            }
            if (overlay) {
                overlay.addEventListener('click', start);
            }
            video.addEventListener('click', function () {
                if (video.paused) {
                    start();
                }
            });
        });
    }

    ready(function () {
        initMenu();
        initHero();
        initSearchPanels();
        initPlayers();
    });
}());
