import { H as Hls } from './video-player-dru42stk.js';

export function initVideoPlayer(root, sourceUrl) {
  if (!root) return;

  const video = root.querySelector('video');
  const cover = root.querySelector('[data-player-cover]');
  const trigger = root.querySelector('[data-player-trigger]');
  if (!video || !sourceUrl) return;

  let hls = null;
  let started = false;

  const hideCover = () => {
    if (cover) cover.hidden = true;
  };

  const ensureSource = () => {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      if (video.src !== sourceUrl) video.src = sourceUrl;
      return;
    }

    if (Hls && Hls.isSupported()) {
      if (!hls) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(sourceUrl);
        hls.attachMedia(video);
      }
      return;
    }

    video.src = sourceUrl;
  };

  const play = async () => {
    ensureSource();
    hideCover();
    if (started) {
      try { await video.play(); } catch (error) {}
      return;
    }
    started = true;
    try {
      await video.play();
    } catch (error) {
      setTimeout(() => {
        video.play().catch(() => {});
      }, 120);
    }
  };

  if (cover) {
    cover.addEventListener('click', play);
  }
  if (trigger) {
    trigger.addEventListener('click', play);
  }
  video.addEventListener('click', play);
  video.addEventListener('play', hideCover);
}
