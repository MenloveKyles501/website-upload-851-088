import { H as Hls } from './hls-dru42stk.js';

const players = document.querySelectorAll('.js-player');

players.forEach((player) => {
  const video = player.querySelector('video');
  const button = player.querySelector('[data-play-button]');
  const status = player.querySelector('[data-player-status]');
  const source = player.dataset.src;
  let hlsInstance = null;

  const setStatus = (message) => {
    if (status) {
      status.textContent = message;
    }
  };

  const startPlayback = async () => {
    if (!video || !source) {
      setStatus('未找到可用播放源。');
      return;
    }

    if (button) {
      button.classList.add('is-hidden');
    }

    setStatus('正在加载高清播放源...');

    try {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else if (Hls && Hls.isSupported()) {
        if (!hlsInstance) {
          hlsInstance = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
            if (data && data.fatal) {
              setStatus('播放源加载失败，请刷新页面后重试。');
            }
          });
        }
      } else {
        video.src = source;
      }

      await video.play();
      setStatus('正在播放。');
    } catch (error) {
      setStatus('浏览器阻止自动播放，请再次点击播放按钮。');
      if (button) {
        button.classList.remove('is-hidden');
      }
    }
  };

  if (button) {
    button.addEventListener('click', startPlayback);
  }

  if (video) {
    video.addEventListener('play', () => setStatus('正在播放。'));
    video.addEventListener('pause', () => setStatus('已暂停。'));
    video.addEventListener('ended', () => setStatus('播放结束。'));
  }
});
