// ==UserScript==
// @name         Hulk’s No-Ad Rampage for YT
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Hulk-style YouTube ad blocker with themes, mute during ads, reload & resume, SponsorBlock skip, and a draggable Hulk-themed control panel below the video
// @author       HulkBhai
// @match        https://www.youtube.com/watch*
// @match        https://www.youtube.com/*
// @match        https://www.youtube.com/embed/*
// @match        https://www.youtube-nocookie.com/embed/*
// @match        https://www.youtube.com/live_chat*
// @match        https://www.youtube.com/live_chat_replay*
// @match        https://music.youtube.com/*
// @grant        GM_xmlhttpRequest
// @connect      sponsor.ajay.app
// ==/UserScript==

(function () {
  'use strict';

  // Settings & State
  const SETTINGS = {
    muteDuringAds: true,
    reloadOnAd: true,
    sponsorBlock: true,
    theme: 'hulk',
  };

  const THEMES = {
    hulk: { bg: '#3a6e37', color: '#a2d149', border: '#2e5b29', backdrop: false },
    dark: { bg: '#1e1e1e', color: '#fff', border: '#444', backdrop: false },
    light: { bg: '#ffffff', color: '#111', border: '#ccc', backdrop: false },
    neon: { bg: '#0f0f0f', color: '#39ff14', border: '#0f0', backdrop: false },
    retro: { bg: '#f4ecd8', color: '#5c3317', border: '#a0522d', backdrop: false },
    glass: { bg: 'rgba(255,255,255,0.1)', color: '#fff', border: '#ccc', backdrop: true },
    ocean: { bg: '#001f3f', color: '#7FDBFF', border: '#0074D9', backdrop: false },
    sunset: { bg: '#FF5733', color: '#FFF', border: '#C70039', backdrop: false },
    cyberpunk: { bg: '#0d0221', color: '#ff00c8', border: '#fffb00', backdrop: false },
    forest: { bg: '#0b3d0b', color: '#8fbc8f', border: '#2e8b57', backdrop: false },
    pastel: { bg: '#ffe0f0', color: '#8b008b', border: '#ff69b4', backdrop: false }
  };

  const MAX_RELOAD_ATTEMPTS = 5;
  let reloadAttempts = 0;
  let lastTime = 0;
  let video = null;
  let sponsorSegments = [];

  // Create draggable control panel below video
  function createUI() {
    if (document.getElementById('hulk-no-ad-panel')) return; // avoid duplicates

    const container = document.createElement('div');
    container.id = 'hulk-no-ad-panel';
    container.style.position = 'absolute';
    container.style.top = '100%';  // right below video container
    container.style.left = '0';
    container.style.zIndex = '99999';
    container.style.padding = '10px 14px';
    container.style.marginTop = '5px';
    container.style.borderRadius = '12px';
    container.style.fontSize = '14px';
    container.style.userSelect = 'none';
    container.style.cursor = 'move';
    container.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)';
    container.style.minWidth = '280px';
    container.style.maxWidth = '350px';
    container.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

    // Hulk funny logo
    const logo = document.createElement('div');
    logo.innerHTML = `<span style="
      font-weight: 900; 
      font-size: 18px; 
      color: #2ecc40; 
      text-shadow: 0 0 8px #2ecc40, 0 0 15px #27ae60;">HULK'S <span style="color:#ff4136;">NO-AD</span> RAMPAGE 💥</span>`;
    logo.style.textAlign = 'center';
    logo.style.marginBottom = '10px';
    container.appendChild(logo);

    // Toggle options
    const options = [
      { key: 'muteDuringAds', label: 'Mute During Ads' },
      { key: 'reloadOnAd', label: 'Reload & Resume on Ad' },
      { key: 'sponsorBlock', label: 'Skip Sponsors (SponsorBlock)' },
    ];

    options.forEach(opt => {
      const label = document.createElement('label');
      label.style.display = 'block';
      label.style.margin = '6px 0';
      label.style.cursor = 'pointer';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = SETTINGS[opt.key];
      checkbox.style.marginRight = '8px';
      checkbox.addEventListener('change', () => {
        SETTINGS[opt.key] = checkbox.checked;
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(opt.label));
      container.appendChild(label);
    });

    // Theme selector title
    const themeTitle = document.createElement('div');
    themeTitle.textContent = '🎨 Select Theme:';
    themeTitle.style.marginTop = '12px';
    themeTitle.style.marginBottom = '6px';
    themeTitle.style.fontWeight = '600';
    container.appendChild(themeTitle);

    // Theme buttons container
    const themeContainer = document.createElement('div');
    themeContainer.style.display = 'flex';
    themeContainer.style.flexWrap = 'wrap';
    themeContainer.style.gap = '6px';

    Object.keys(THEMES).forEach(theme => {
      const btn = document.createElement('button');
      btn.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
      const t = THEMES[theme];
      btn.style.background = t.bg;
      btn.style.color = t.color;
      btn.style.border = `2px solid ${t.border}`;
      btn.style.borderRadius = '8px';
      btn.style.padding = '6px 10px';
      btn.style.cursor = 'pointer';
      btn.style.flex = '1 1 30%';
      btn.style.fontWeight = '700';
      btn.addEventListener('click', () => applyTheme(theme));
      themeContainer.appendChild(btn);
    });

    container.appendChild(themeContainer);

    // Append to video player container (below video)
    const videoContainer = document.querySelector('#player-container') || document.querySelector('.html5-video-player');
    if (videoContainer) {
      // For absolute positioning relative to container
      videoContainer.style.position = 'relative';
      videoContainer.appendChild(container);
    } else {
      document.body.appendChild(container);
    }

    makeDraggable(container);
    applyTheme(SETTINGS.theme);
  }

  // Apply chosen theme to panel UI
  function applyTheme(theme) {
    SETTINGS.theme = theme;
    const panel = document.getElementById('hulk-no-ad-panel');
    if (!panel) return;
    const t = THEMES[theme];
    panel.style.background = t.bg;
    panel.style.color = t.color;
    panel.style.border = `2px solid ${t.border}`;
    if (t.backdrop) {
      panel.style.backdropFilter = 'blur(8px)';
      panel.style.background = t.bg;
    } else {
      panel.style.backdropFilter = 'none';
    }
  }

  // Make panel draggable
  function makeDraggable(el) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    el.onmousedown = function (e) {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDrag;
      document.onmousemove = drag;
    };
    function drag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      el.style.top = (el.offsetTop - pos2) + "px";
      el.style.left = (el.offsetLeft - pos1) + "px";
    }
    function closeDrag() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // SponsorBlock API call
  async function fetchSponsorSegments(videoId) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: `https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}`,
        onload: res => resolve(JSON.parse(res.responseText)),
        onerror: err => reject(err),
      });
    });
  }

  // Skip sponsor segments if active
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

  // Detect if ad is playing on YouTube
  function isAdPlaying() {
    return document.body.classList.contains('ad-showing');
  }

  // Reload & resume video on ad detection
  function reloadAndResume() {
    if (!SETTINGS.reloadOnAd) return;
    const time = video.currentTime;
    sessionStorage.setItem('hulks_no_ad_resume_time', time);
    location.reload();
  }

  // Fallback: back then forward navigation to try resuming video
  function fallbackBackForward() {
    const time = video.currentTime;
    sessionStorage.setItem('hulks_no_ad_resume_time', time);
    history.back();
    setTimeout(() => history.forward(), 1500);
  }

  // Resume playback after reload or nav
  function resumePlayback() {
    const resume = sessionStorage.getItem('hulks_no_ad_resume_time');
    if (resume && video) {
      video.currentTime = parseFloat(resume);
      sessionStorage.removeItem('hulks_no_ad_resume_time');
    }
  }

  // Main ad monitor loop
  function monitorAds() {
    if (!video) return;

    if (isAdPlaying()) {
      if (SETTINGS.muteDuringAds && !video.muted) video.muted = true;
      if (SETTINGS.reloadOnAd && video.currentTime === lastTime) {
        reloadAttempts++;
        if (reloadAttempts <= MAX_RELOAD_ATTEMPTS) reloadAndResume();
        else {
          fallbackBackForward();
          reloadAttempts = 0;
        }
      }
    } else {
      if (video.muted && SETTINGS.muteDuringAds) video.muted = false;
      reloadAttempts = 0;
    }

    skipSponsorSegments();
    lastTime = video.currentTime;
  }

  // Initialization & setup
  function init() {
    video = document.querySelector('video');
    if (!video) {
      setTimeout(init, 1000);
      return;
    }

    // Load SponsorBlock data for current video
    const videoIdMatch = location.href.match(/v=([^&]+)/);
    if (videoIdMatch && SETTINGS.sponsorBlock) {
      fetchSponsorSegments(videoIdMatch[1]).then(segments => {
        sponsorSegments = segments;
      }).catch(() => {
        sponsorSegments = [];
      });
    }

    createUI();

    // Resume playback after reload if needed
    video.addEventListener('loadedmetadata', () => {
      resumePlayback();
    });

    // Ad monitor interval
    setInterval(monitorAds, 1200);
  }

  window.addEventListener('yt-navigate-finish', () => {
    // Reset on page navigation
    sponsorSegments = [];
    reloadAttempts = 0;
    lastTime = 0;
    video = null;
    init();
  });

  // Start the script
  init();

})();
