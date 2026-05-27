
(function () {
  async function attach(video) {
    const src = video.dataset.src;
    if (!src) return;

    if (video.canPlayType && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    if (!window.Hls) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      }).catch(() => null);
    }

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      video._hls = hls;
      return;
    }

    video.src = src;
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-movie-player]").forEach(v => {
      if (!v.dataset.ready) {
        v.dataset.ready = "1";
        attach(v);
      }
    });
  });
})();
