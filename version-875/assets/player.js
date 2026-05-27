(() => {
    const video = document.querySelector('[data-player]');

    if (!video) {
        return;
    }

    const source = video.dataset.src;
    const playLayer = document.querySelector('[data-play-layer]');
    const message = document.querySelector('[data-player-message]');
    let hls = null;
    let initialized = false;

    const setMessage = (text) => {
        if (message) {
            message.textContent = text;
        }
    };

    const hideLayer = () => {
        if (playLayer) {
            playLayer.classList.add('hidden');
        }
    };

    const initPlayer = () => {
        if (initialized || !source) {
            return Promise.resolve();
        }

        initialized = true;
        setMessage('正在初始化播放源...');

        return new Promise((resolve) => {
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });

                hls.loadSource(source);
                hls.attachMedia(video);

                hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
                    setMessage('播放源加载完成，可直接观看。');
                    resolve();
                });

                hls.on(window.Hls.Events.ERROR, (event, data) => {
                    if (data && data.fatal) {
                        setMessage('播放源暂时无法加载，请稍后重试或更换浏览器。');
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
                video.addEventListener('loadedmetadata', () => resolve(), { once: true });
                setMessage('浏览器正在使用原生 HLS 能力播放。');
            } else {
                setMessage('当前浏览器不支持 HLS 播放，请使用最新版 Chrome、Edge、Safari 或 Firefox。');
                resolve();
            }
        });
    };

    const startPlayback = async () => {
        await initPlayer();

        try {
            await video.play();
            hideLayer();
        } catch (error) {
            setMessage('浏览器阻止了自动播放，请再次点击视频播放按钮。');
        }
    };

    if (playLayer) {
        playLayer.addEventListener('click', startPlayback);
    }

    video.addEventListener('play', hideLayer);
    video.addEventListener('pause', () => {
        if (playLayer && video.currentTime === 0) {
            playLayer.classList.remove('hidden');
        }
    });

    window.addEventListener('beforeunload', () => {
        if (hls) {
            hls.destroy();
        }
    });
})();
