// @name          Hulk’s No-Ad Rampage for YT
// @namespace     http://tampermonkey.net/
// @version       459
// @description   Ad skip & mute toggles docked below YouTube player, resizable strap shape, synced theme, saves width, SponsorBlock skip, reload & resume
// @author        HulkBhai
// @match         https://www.youtube.com/watch*
// @match         https://www.youtube.com/*
// @match         https://www.youtube.com/embed/*
// @match         https://www.youtube-nocookie.com/embed/*
// @match         https://www.youtube.com/live_chat*
// @match         https://www.youtube.com/live_chat_replay*
// @match         https://music.youtube.com/*
// @grant         GM_xmlhttpRequest
// @connect       sponsor.ajay.app
// ==/UserScript==

(function () {
  'use strict';

  const SETTINGS = {
    muteDuringAds: true,
    reloadOnAd: true,
    sponsorBlock: true,
  };

  const MAX_RELOAD_ATTEMPTS = 5;
  let reloadAttempts = 0;
  let lastTime = 0;
  let video = null;
  let sponsorSegments = [];

  function loadSettings() {
    const saved = localStorage.getItem('hulkAdHandlerSettings');
    if (saved) {
      try {
        const loaded = JSON.parse(saved);
        Object.assign(SETTINGS, loaded);
      } catch { }
    }
  }

  function saveSettings() {
    localStorage.setItem('hulkAdHandlerSettings', JSON.stringify(SETTINGS));
  }

  function savePanelWidth(width) {
    localStorage.setItem('hulkPanelWidth', width);
  }

  function loadPanelWidth() {
    const w = localStorage.getItem('hulkPanelWidth');
    return w ? w : '320px';
  }

  function applyTheme(panel) {
    if (!panel) panel = document.getElementById('hulk-ad-handler-ui');
    if (!panel) return;

    const isDark = document.documentElement.getAttribute('dark') !== null ||
      document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark');

    if (isDark) {
      panel.style.backgroundColor = '#202020';
      panel.style.color = '#39ff14';
      panel.style.border = '2px solid #39ff14';
      panel.style.boxShadow = '0 0 6px rgba(57, 255, 20, 0.6)';
    } else {
      panel.style.backgroundColor = '#f0f0f0';
      panel.style.color = '#222';
      panel.style.border = '2px solid #666';
      panel.style.boxShadow = '0 0 5px rgba(0,0,0,0.15)';
    }
  }

  function observeThemeChanges() {
    const observer = new MutationObserver(() => {
      applyTheme();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'dark'] });
  }

  function createPanel(playerContainer) {
    const oldPanel = document.getElementById('hulk-ad-handler-ui');
    if (oldPanel) oldPanel.remove();

    const panel = document.createElement('div');
    panel.id = 'hulk-ad-handler-ui';
    panel.style.position = 'relative';
    panel.style.marginTop = '6px';
    panel.style.marginLeft = 'auto';
    panel.style.backgroundColor = '#202020';
    panel.style.color = '#39ff14';
    panel.style.border = '2px solid #39ff14';
    panel.style.borderRadius = '12px';
    panel.style.padding = '8px 12px';
    panel.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    panel.style.fontSize = '14px';
    panel.style.userSelect = 'none';
    panel.style.cursor = 'default';
    panel.style.maxWidth = 'calc(100vw - 40px)';
    panel.style.width = loadPanelWidth();
    panel.style.height = '44px';
    panel.style.resize = 'horizontal';
    panel.style.overflow = 'auto';
    panel.style.display = 'flex';
    panel.style.alignItems = 'center';
    panel.style.gap = '12px';

    const title = document.createElement('div');
    title.textContent = '🎯 Ad Handler by Hulk';
    title.style.fontWeight = 'bold';
    title.style.whiteSpace = 'nowrap';
    panel.appendChild(title);

    const togglesContainer = document.createElement('div');
    togglesContainer.style.display = 'flex';
    togglesContainer.style.gap = '12px';
    togglesContainer.style.flexWrap = 'nowrap';
    togglesContainer.style.alignItems = 'center';
    togglesContainer.style.justifyContent = 'flex-end';
    togglesContainer.style.flexGrow = '1';

    const toggles = [
      { key: 'muteDuringAds', label: 'Mute during ads' },
      { key: 'reloadOnAd', label: 'Reload & resume' },
      { key: 'sponsorBlock', label: 'Skip sponsors' },
    ];

    toggles.forEach(({ key, label }) => {
      const labelEl = document.createElement('label');
      labelEl.style.cursor = 'pointer';
      labelEl.style.whiteSpace = 'nowrap';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = SETTINGS[key];
      checkbox.style.marginRight = '6px';

      checkbox.addEventListener('change', () => {
        SETTINGS[key] = checkbox.checked;
        saveSettings();
        if (key === 'sponsorBlock' && checkbox.checked) {
          fetchSponsorSegments();
        }
      });

      labelEl.appendChild(checkbox);
      labelEl.append(label);
      togglesContainer.appendChild(labelEl);
    });

    panel.appendChild(togglesContainer);

    panel.addEventListener('mouseup', () => {
      savePanelWidth(panel.style.width);
    });
    panel.addEventListener('touchend', () => {
      savePanelWidth(panel.style.width);
    });

    playerContainer.appendChild(panel);
    applyTheme(panel);
  }

  function fetchSponsorSegments() {
    if (!video) return;
    const vid = getVideoId();
    if (!vid) return;

    GM_xmlhttpRequest({
      method: "GET",
      url: `https://sponsor.ajay.app/api/skipSegments?videoID=${vid}`,
      onload: function (res) {
        try {
          sponsorSegments = JSON.parse(res.responseText);
        } catch (e) {
          sponsorSegments = [];
        }
      },
      onerror: function () {
        sponsorSegments = [];
      }
    });
  }

  function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  function skipSponsorSegments() {
    if (!SETTINGS.sponsorBlock || !video || sponsorSegments.length === 0) return;
    const t = video.currentTime;
    for (const seg of sponsorSegments) {
      const [start, end] = seg.segment;
      if (t >= start && t < end) {
        video.currentTime = end + 0.1;
        break;
      }
    }
  }

  function isAdPlaying() {
    return document.body.classList.contains('ad-showing');
  }

  function reloadAndResume() {
    if (!SETTINGS.reloadOnAd || !video) return;
    const time = video.currentTime;
    sessionStorage.setItem('yt_resume_time', time);
    location.reload();
  }

  function resumePlayback() {
    if (!video) return;
    const resume = sessionStorage.getItem('yt_resume_time');
    if (resume) {
      video.currentTime = parseFloat(resume);
      sessionStorage.removeItem('yt_resume_time');
    }
  }

  function monitorAds() {
    if (!video) return;

    if (isAdPlaying()) {
      if (SETTINGS.muteDuringAds && !video.muted) {
        video.muted = true;
      }
      if (SETTINGS.reloadOnAd) {
        if (video.currentTime === lastTime) {
          reloadAttempts++;
          if (reloadAttempts <= MAX_RELOAD_ATTEMPTS) {
            reloadAndResume();
          }
        } else {
          reloadAttempts = 0;
        }
      }
    } else {
      if (video.muted && SETTINGS.muteDuringAds) {
        video.muted = false;
      }
      reloadAttempts = 0;
      skipSponsorSegments();
    }
    lastTime = video.currentTime;
  }

  function observeVideoChanges() {
    const player = document.querySelector('.html5-video-player');
    if (!player) return;

    const observer = new MutationObserver(() => {
      const newVideo = document.querySelector('video');
      if (newVideo && newVideo !== video) {
        video = newVideo;
        reloadAttempts = 0;
        lastTime = 0;
        sponsorSegments = [];
        if (SETTINGS.sponsorBlock) fetchSponsorSegments();
        resumePlayback();
      }
    });

    observer.observe(player, { attributes: true, attributeFilter: ['class'] });
  }

  function main() {
    loadSettings();
    let playerContainer = document.getElementById('player-container-outer') ||
                          document.getElementById('player') ||
                          document.querySelector('.html5-video-player');
    if (!playerContainer) return;
    createPanel(playerContainer);
    observeThemeChanges();
    video = document.querySelector('video');
    if (!video) return;
    if (SETTINGS.sponsorBlock) fetchSponsorSegments();
    resumePlayback();
    observeVideoChanges();
    setInterval(monitorAds, 1000);
  }

  function waitForPlayerAndRun() {
    const check = setInterval(() => {
      const player = document.querySelector('video');
      if (player) {
        clearInterval(check);
        main();
      }
    }, 1000);
  }

  waitForPlayerAndRun();

})();
