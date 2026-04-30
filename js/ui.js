/* ══════════════════════════════════════════════════════════
   UI.JS — Interface & DOM Management
   - Toast notifications
   - Giant mood display + color theming
   - Mood distribution bars
   - Stats bar (total + dominant)
   - Ticker feed (rolling signal announcements)
   - Submit overlay (reflection screen)
   - View mode switching (globe ↔ map)
   - Input animations + preview
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const UI = {};
  GMR.ui = UI;

  /* ══════════════════════════════════════════════════════
     TOAST
     ══════════════════════════════════════════════════════ */
  UI._toastTimer = null;

  UI.toast = function (msg, duration = 3200) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
    clearTimeout(UI._toastTimer);
    UI._toastTimer = setTimeout(() => el.classList.remove('visible'), duration);
  };

  /* ══════════════════════════════════════════════════════
     GIANT MOOD DISPLAY
     ══════════════════════════════════════════════════════ */
  UI.updateGiantMood = function (moodType, sentence) {
    const col     = GMR.TYPE_COLOR[moodType] || '#4af0c8';
    const emoji   = GMR.TYPE_EMOJI[moodType] || '◉';
    const typeEl  = document.getElementById('giant-type');
    const sentEl  = document.getElementById('giant-sentence');
    const dotEl   = document.getElementById('mood-glow-dot');

    if (typeEl) {
      typeEl.textContent  = (moodType || 'SIGNAL').toUpperCase();
      typeEl.style.color  = col;
      typeEl.style.textShadow = `0 0 40px ${col}66`;
    }
    if (sentEl && sentence) {
      sentEl.textContent = sentence;
      sentEl.style.opacity = '1';
    }
    if (dotEl) {
      dotEl.style.background = col;
      dotEl.style.boxShadow  = `0 0 24px 6px ${col}88`;
    }

    /* Update CSS accent throughout the page */
    document.documentElement.style.setProperty('--accent', col);
    document.documentElement.style.setProperty('--accent-glow', col + '44');

    /* Mood emoji in giant display */
    const giantMoodEl = document.getElementById('giant-mood');
    if (giantMoodEl) {
      giantMoodEl.textContent   = emoji;
      giantMoodEl.style.filter  = `drop-shadow(0 0 20px ${col})`;
    }
  };

  /* ══════════════════════════════════════════════════════
     MOOD DISTRIBUTION BARS
     ══════════════════════════════════════════════════════ */
  UI.updateDistribution = function (counts) {
    const el = document.getElementById('distribution-bars');
    if (!el) return;

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    el.innerHTML = sorted.map(([type, n]) => {
      const pct = Math.round((n / total) * 100);
      const col = GMR.TYPE_COLOR[type] || '#4af0c8';
      const emoji = GMR.TYPE_EMOJI[type] || '';
      return `
        <div class="dist-row">
          <div class="dist-label">
            <span class="dist-emoji">${emoji}</span>
            <span class="dist-type">${type}</span>
          </div>
          <div class="dist-bar-wrap">
            <div class="dist-bar" style="width:${pct}%;background:${col};box-shadow:0 0 6px ${col}88"></div>
          </div>
          <span class="dist-pct" style="color:${col}">${pct}%</span>
        </div>`;
    }).join('');
  };

  /* ══════════════════════════════════════════════════════
     STATS BAR
     ══════════════════════════════════════════════════════ */
  UI.updateStats = function () {
    const totalEl = document.getElementById('stat-total');
    const domEl   = document.getElementById('stat-dominant');
    const state   = GMR.state || {};
    if (totalEl) {
      totalEl.textContent = UI._formatNum(state.totalSignals || 0);
    }
    if (domEl) {
      const dom = state.dominantType || 'serenity';
      const col = GMR.TYPE_COLOR[dom] || '#4af0c8';
      domEl.textContent  = dom.toUpperCase();
      domEl.style.color  = col;
    }
  };

  UI._formatNum = function (n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
    return String(n);
  };

  /* ══════════════════════════════════════════════════════
     TICKER FEED
     ══════════════════════════════════════════════════════ */
  UI._tickerQueue = [];
  UI._tickerRunning = false;

  UI.addTicker = function (word, city, moodType) {
    UI._tickerQueue.push({ word, city, moodType });
    if (!UI._tickerRunning) UI._drainTicker();
  };

  UI._drainTicker = function () {
    const list = document.getElementById('ticker-list');
    if (!list || !UI._tickerQueue.length) { UI._tickerRunning = false; return; }

    UI._tickerRunning = true;
    const item = UI._tickerQueue.shift();
    const col  = GMR.TYPE_COLOR[item.moodType] || '#4af0c8';
    const emoji = GMR.TYPE_EMOJI[item.moodType] || '◉';

    const li = document.createElement('li');
    li.className = 'ticker-item';
    li.innerHTML = `
      <span class="tick-emoji" style="color:${col}">${emoji}</span>
      <span class="tick-word" style="color:${col}">${GMR.esc(item.word)}</span>
      <span class="tick-sep">from</span>
      <span class="tick-city">${GMR.esc(item.city)}</span>`;

    /* Slide in */
    li.style.opacity   = '0';
    li.style.transform = 'translateY(-6px)';
    list.prepend(li);

    requestAnimationFrame(() => {
      li.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      li.style.opacity    = '1';
      li.style.transform  = 'translateY(0)';
    });

    /* Cap at 12 items */
    while (list.children.length > 12) {
      const last = list.lastChild;
      last.style.opacity = '0';
      setTimeout(() => last.remove(), 300);
    }

    setTimeout(UI._drainTicker, 600);
  };

  /* ══════════════════════════════════════════════════════
     SUBMIT OVERLAY
     ══════════════════════════════════════════════════════ */
  UI.showSubmitOverlay = function (word, result, city) {
    const overlay = document.getElementById('submit-overlay');
    if (!overlay) return;

    const col   = result.color || GMR.TYPE_COLOR[result.type] || '#4af0c8';
    const bg    = document.getElementById('so-bg');
    const emoji = document.getElementById('so-emoji');
    const wEl   = document.getElementById('so-word');
    const rEl   = document.getElementById('so-reflection');
    const cEl   = document.getElementById('so-city');

    if (bg) bg.style.background = `radial-gradient(ellipse at 50% 40%, ${col}22 0%, transparent 65%)`;
    if (emoji) { emoji.textContent = result.emoji || '◉'; emoji.style.filter = `drop-shadow(0 0 30px ${col})`; }
    if (wEl) { wEl.textContent = word.toUpperCase(); wEl.style.color = col; }
    if (rEl) { rEl.textContent = result.reflection || ''; }
    if (cEl) { cEl.textContent = city ? `Resonating from ${city.name}, ${city.country}` : 'Signal received'; }

    /* Twin button */
    const twinBtn = document.getElementById('so-twin-btn');
    if (twinBtn && city) {
      twinBtn.style.borderColor = col + '66';
      twinBtn.style.color       = col;
      twinBtn.onclick = () => {
        UI.hideSubmitOverlay();
        GMR.viral.findMoodTwin(result.type, word);
      };
    }

    overlay.classList.add('visible');

    /* Auto-dismiss after 7s */
    clearTimeout(UI._overlayTimer);
    UI._overlayTimer = setTimeout(UI.hideSubmitOverlay, 7000);
  };

  UI.hideSubmitOverlay = function () {
    const overlay = document.getElementById('submit-overlay');
    if (overlay) overlay.classList.remove('visible');
    clearTimeout(UI._overlayTimer);
  };

  /* ══════════════════════════════════════════════════════
     VIEW MODE (globe ↔ map)
     ══════════════════════════════════════════════════════ */
  UI.setViewMode = function (mode) {
    if (GMR.state) GMR.state.viewMode = mode;
    const globeWrap = document.getElementById('globe-wrap');
    const mapWrap   = document.getElementById('map-wrap');
    const btnGlobe  = document.getElementById('btn-globe');
    const btnMap    = document.getElementById('btn-map');

    if (mode === 'map') {
      globeWrap.classList.remove('active'); globeWrap.classList.add('hidden');
      mapWrap.classList.add('active');      mapWrap.classList.remove('hidden');
      btnMap.classList.add('active');       btnGlobe.classList.remove('active');
      if (GMR.map && !GMR.map.inited) GMR.map.init();
    } else {
      mapWrap.classList.remove('active');   mapWrap.classList.add('hidden');
      globeWrap.classList.add('active');    globeWrap.classList.remove('hidden');
      btnGlobe.classList.add('active');     btnMap.classList.remove('active');
    }
  };

  /* ══════════════════════════════════════════════════════
     INPUT ANIMATIONS
     ══════════════════════════════════════════════════════ */
  UI.pulseInput = function (moodType) {
    const wrap = document.getElementById('input-wrap');
    if (!wrap) return;
    const col = GMR.TYPE_COLOR[moodType] || '#4af0c8';
    wrap.style.boxShadow = `0 0 0 2px ${col}88, 0 0 24px ${col}44`;
    setTimeout(() => { wrap.style.boxShadow = ''; }, 900);
  };

  UI.updateInputPreview = function (word) {
    const hint = document.getElementById('signal-hint');
    if (!hint || !word) return;

    /* Live keyword lookup */
    const lower = word.toLowerCase().trim();
    let matchedType = null;
    if (lower.length >= 3 && GMR.MOOD_MAP) {
      for (const [key, type] of Object.entries(GMR.MOOD_MAP)) {
        if (key.startsWith(lower) || lower.startsWith(key)) {
          matchedType = type;
          break;
        }
      }
    }

    if (matchedType) {
      const col = GMR.TYPE_COLOR[matchedType] || '#4af0c8';
      const emoji = GMR.TYPE_EMOJI[matchedType] || '';
      hint.textContent = `${emoji} ${matchedType}`;
      hint.style.color  = col;
      hint.style.opacity = '0.9';
    } else {
      hint.textContent = word.length > 0 ? 'send your signal →' : '';
      hint.style.color  = 'rgba(255,255,255,0.3)';
      hint.style.opacity = '0.6';
    }
  };

  /* ══════════════════════════════════════════════════════
     LOADER
     ══════════════════════════════════════════════════════ */
  UI.hideLoader = function () {
    const loader = document.getElementById('loader');
    if (!loader) return;
    loader.style.opacity = '0';
    setTimeout(() => { loader.style.display = 'none'; }, 600);
  };

  /* ══════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════ */
  UI.init = function () {
    /* Keyboard: Escape closes overlays */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        UI.hideSubmitOverlay();
        GMR.viral && GMR.viral.closeTwin();
        GMR.viral && GMR.viral.closeWrapped();
        GMR.monetize && GMR.monetize.closeProGate();
        GMR.monetize && GMR.monetize.closePrintShop();
      }
    });

    /* Click outside submit overlay to close */
    const overlay = document.getElementById('submit-overlay');
    if (overlay) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) UI.hideSubmitOverlay();
      });
    }

    /* Input live preview */
    const input = document.getElementById('mood-input');
    if (input) {
      input.addEventListener('input', () => {
        UI.updateInputPreview(input.value);
        GMR.viral && GMR.viral.updateShareUrl(input.value.trim());
      });
    }

    /* Initial mood display */
    UI.updateGiantMood((GMR.state && GMR.state.dominantType) || 'serenity');
    UI.updateStats();

    console.log('[GMR UI] Module initialized');
  };

  /* ── Expose ── */
  window.setViewMode       = (m) => GMR.ui.setViewMode(m);
  window.hideSubmitOverlay = () => GMR.ui.hideSubmitOverlay();
  window.showForecast      = () => {
    if (GMR.monetize && !GMR.monetize.isPro()) { GMR.monetize.showProGate('forecast'); return; }
    GMR.ai && GMR.ai.getForecast();
  };

})();