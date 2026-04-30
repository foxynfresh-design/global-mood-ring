/* ══════════════════════════════════════════════════════════
   VIRAL.JS — Viral Mechanics Engine
   - Mood twin city finder
   - Mood Wrapped (annual/monthly emotional report)
   - 24-hour mood waveform visualization
   - Share mechanics (URL, aura card, stories)
   - Mood weather system overlay
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const V = {};
  GMR.viral = V;

  /* ══════════════════════════════════════════════════════
     1. MOOD TWIN FINDER
     ══════════════════════════════════════════════════════ */
  V.findMoodTwin = function (moodType, moodWord) {
    const cities = GMR.WORLD_CITIES;
    // Find cities whose mood matches
    const matches = cities.filter(c => c.mood === moodType);
    const pool = matches.length > 0 ? matches : cities;
    const twin = pool[Math.floor(Math.random() * pool.length)];

    // Record for streaks
    if (GMR.streaks) GMR.streaks.recordTwinCity(twin.name);

    V._showTwinPanel(twin, moodWord);
    return twin;
  };

  V.showMoodTwinForCity = function (city) {
    V._showTwinPanel(city, city.moodKey || city.mood);
  };

  V._showTwinPanel = async function (city, moodWord) {
    const panel = document.getElementById('twin-panel');
    if (!panel) return;

    const col = GMR.TYPE_COLOR[city.mood] || '#4af0c8';

    // Show panel with city info
    document.getElementById('twin-city-name').textContent    = city.name.toUpperCase();
    document.getElementById('twin-city-country').textContent = city.country || '';
    document.getElementById('twin-city-sent').textContent    = city.sentence || '';
    document.getElementById('twin-city-name').style.color    = col;
    document.getElementById('twin-mood-dot').style.background = col;
    document.getElementById('twin-mood-dot').style.boxShadow  = `0 0 10px ${col}`;
    document.getElementById('twin-story').textContent = 'Composing your story…';

    panel.classList.add('visible');

    // Generate micro-story
    if (GMR.ai) {
      const story = await GMR.ai.generateMoodStory(moodWord, city);
      document.getElementById('twin-story').textContent = story;
    }

    // Share button
    document.getElementById('twin-share-btn').onclick = () => V.shareTwin(city, moodWord);
  };

  V.closeTwin = function () {
    const panel = document.getElementById('twin-panel');
    if (panel) panel.classList.remove('visible');
  };

  V.shareTwin = function (city, moodWord) {
    const text = `Right now I feel like ${city.name}.\n\nI sent "${moodWord}" to the Global Mood Ring and it matched me with ${city.name}, ${city.country}.\n\nglobalmoodnring.app`;
    if (navigator.share) {
      navigator.share({ title: 'My Mood Twin', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => GMR.ui.toast('📋 Story copied — paste it anywhere'));
    }
  };

  /* ══════════════════════════════════════════════════════
     2. MOOD WAVEFORM — 24h emotional timeline
     ══════════════════════════════════════════════════════ */
  V.waveformData = []; // [{hour, type, count}]
  V.waveformCanvas = null;
  V.waveCtx = null;

  V.initWaveform = function () {
    const canvas = document.getElementById('waveform-canvas');
    if (!canvas) return;
    V.waveformCanvas = canvas;
    V.waveCtx = canvas.getContext('2d');

    // Seed with simulated data
    for (let h = 0; h < 24; h++) {
      const types = Object.keys(GMR.TYPE_COLOR);
      const type = types[Math.floor(Math.random() * types.length)];
      V.waveformData.push({ hour: h, type, count: 5 + Math.floor(Math.random() * 40) });
    }

    V._drawWaveform();
    window.addEventListener('resize', V._drawWaveform);
  };

  V.addWaveformPoint = function (type) {
    const hour = new Date().getHours();
    const existing = V.waveformData.find(d => d.hour === hour);
    if (existing) {
      existing.count++;
      if (existing.count > 1) existing.type = type; // dominant
    } else {
      V.waveformData.push({ hour, type, count: 1 });
    }
    V._drawWaveform();
  };

  V._drawWaveform = function () {
    const canvas = V.waveformCanvas;
    if (!canvas) return;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width  = w * window.devicePixelRatio;
    canvas.height = h * window.devicePixelRatio;
    const ctx = V.waveCtx;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, w, h);

    if (!V.waveformData.length) return;

    const maxCount = Math.max(...V.waveformData.map(d => d.count), 1);
    const slotW = w / 24;
    const currentHour = new Date().getHours();

    // Draw hour slots
    V.waveformData.forEach(d => {
      const x    = d.hour * slotW;
      const barH = (d.count / maxCount) * (h * 0.7);
      const y    = h - barH - 10;
      const col  = GMR.TYPE_COLOR[d.type] || '#4af0c8';
      const alpha = d.hour <= currentHour ? 1 : 0.3;

      // Glow
      ctx.shadowBlur  = 8;
      ctx.shadowColor = col;
      ctx.fillStyle   = col + Math.round(alpha * 200).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.roundRect(x + 2, y, slotW - 4, barH, 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Hour label
      if (d.hour % 6 === 0) {
        ctx.fillStyle   = 'rgba(255,255,255,0.25)';
        ctx.font        = `9px 'Tenor Sans', sans-serif`;
        ctx.textAlign   = 'center';
        ctx.fillText(`${d.hour}h`, x + slotW / 2, h - 2);
      }
    });

    // Current time indicator
    const nowX = currentHour * slotW + slotW / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(nowX, 0); ctx.lineTo(nowX, h - 12);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  /* ══════════════════════════════════════════════════════
     3. MOOD WRAPPED
     ══════════════════════════════════════════════════════ */
  V.showWrapped = async function () {
    const overlay = document.getElementById('wrapped-overlay');
    if (!overlay) return;

    const userData = GMR.streaks ? GMR.streaks.getWrappedData() : { topMood: 'serenity', streak: 0, total: 0, breakdown: {}, twinCities: [] };
    const col = GMR.TYPE_COLOR[userData.topMood] || '#4af0c8';

    overlay.classList.add('visible');
    document.getElementById('wrapped-loading').style.display = 'block';
    document.getElementById('wrapped-content').style.display = 'none';

    const data = await GMR.ai.generateWrapped(userData);

    document.getElementById('wrapped-loading').style.display = 'none';
    document.getElementById('wrapped-content').style.display = 'block';

    document.getElementById('wrapped-identity').textContent  = data.identity || 'The Witness';
    document.getElementById('wrapped-identity').style.color  = col;
    document.getElementById('wrapped-headline').textContent  = data.headline || '';
    document.getElementById('wrapped-narrative').textContent = data.narrative || '';
    document.getElementById('wrapped-affirmation').textContent = data.affirmation || '';
    document.getElementById('wrapped-top-mood').textContent  = userData.topMood.toUpperCase();
    document.getElementById('wrapped-top-mood').style.color  = col;
    document.getElementById('wrapped-streak').textContent    = userData.streak + ' days';
    document.getElementById('wrapped-streak').style.color    = col;
    document.getElementById('wrapped-total').textContent     = userData.total + ' signals';

    // Mini distribution
    const distEl = document.getElementById('wrapped-dist');
    const total  = Object.values(userData.breakdown).reduce((a, b) => a + b, 0) || 1;
    distEl.innerHTML = Object.entries(userData.breakdown)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([type, n]) => {
        const pct = Math.round((n / total) * 100);
        const c   = GMR.TYPE_COLOR[type] || '#4af0c8';
        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <div style="width:60px;font-size:10px;color:rgba(255,255,255,.4);letter-spacing:.08em;font-family:'Tenor Sans',sans-serif">${type}</div>
          <div style="flex:1;height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${c};border-radius:2px;box-shadow:0 0 4px ${c}"></div>
          </div>
          <div style="width:28px;font-size:10px;color:rgba(255,255,255,.3);text-align:right;font-family:'Tenor Sans',sans-serif">${pct}%</div>
        </div>`;
      }).join('');
  };

  V.closeWrapped = function () {
    const overlay = document.getElementById('wrapped-overlay');
    if (overlay) overlay.classList.remove('visible');
  };

  /* ══════════════════════════════════════════════════════
     4. SHARE URL
     ══════════════════════════════════════════════════════ */
  V.updateShareUrl = function (word) {
    const badge = document.getElementById('share-badge'), urlEl = document.getElementById('share-url-text');
    if (!word || word.length < 2) { badge.classList.add('hidden'); return; }
    const url = `${location.origin}${location.pathname}?mood=${encodeURIComponent(word)}`;
    urlEl.textContent = url.replace(/^https?:\/\//, '');
    badge.classList.remove('hidden');
  };

  V.copyShareUrl = function () {
    const word = document.getElementById('mood-input').value.trim() || GMR.state.currentMoodType || 'calm';
    const url  = `${location.origin}${location.pathname}?mood=${encodeURIComponent(word)}`;
    navigator.clipboard.writeText(url)
      .then(() => GMR.ui.toast('🔗 Share link copied!'))
      .catch(() => GMR.ui.toast('Copy failed'));
  };

  V.handleUrlMood = function () {
    const params = new URLSearchParams(location.search), m = params.get('mood');
    if (!m) return;
    const input = document.getElementById('mood-input');
    input.value = m;
    GMR.main.onMoodInput(m);
    GMR.ui.toast(`Mood loaded: "${m}" ✦`);
  };

  /* ══════════════════════════════════════════════════════
     5. MOOD WEATHER SYSTEM
     ══════════════════════════════════════════════════════ */
  V.WEATHER_MAP = {
    joy:      { icon: '☀', label: 'Sunshine', particle: '#ffd166', css: 'weather-sun' },
    sadness:  { icon: '🌧', label: 'Rain',     particle: '#4895ef', css: 'weather-rain' },
    anger:    { icon: '⛈', label: 'Storm',    particle: '#ef233c', css: 'weather-storm' },
    fear:     { icon: '🌫', label: 'Fog',      particle: '#9b5de5', css: 'weather-fog' },
    serenity: { icon: '🌤', label: 'Clear',    particle: '#4af0c8', css: 'weather-clear' },
    love:     { icon: '🌸', label: 'Bloom',    particle: '#ff6b9d', css: 'weather-bloom' },
    surprise: { icon: '🌠', label: 'Meteor',   particle: '#f77f00', css: 'weather-meteor' },
    neutral:  { icon: '🌥', label: 'Overcast', particle: '#7a8fb5', css: 'weather-overcast' },
  };

  V.updateWeather = function (moodType) {
    const w = V.WEATHER_MAP[moodType] || V.WEATHER_MAP.neutral;
    const el = document.getElementById('weather-chip');
    if (el) {
      el.querySelector('.weather-icon').textContent  = w.icon;
      el.querySelector('.weather-label').textContent = w.label.toUpperCase();
      el.style.borderColor = GMR.TYPE_COLOR[moodType] + '66';
    }
  };

  /* ══════════════════════════════════════════════════════
     6. AURA CARD DOWNLOAD
     ══════════════════════════════════════════════════════ */
  V.prepareAuraCard = function (word, mood, city, country) {
    document.getElementById('aura-word').textContent = word.toUpperCase();
    document.getElementById('aura-type').textContent = (mood.t || 'neutral').toUpperCase();
    const loc = [city, country].filter(s => s && s !== 'Unknown').join(', ');
    document.getElementById('aura-loc').textContent  = loc || 'Somewhere on Earth';
    document.getElementById('aura-date').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    document.getElementById('aura-bg').style.background = `radial-gradient(ellipse at 30% 40%, ${mood.c} 0%, #050b1e 65%)`;
  };

  V.downloadAuraCard = async function () {
    const card = document.getElementById('aura-card');
    card.style.top = '-9999px'; card.style.left = '0px';
    try {
      const canvas = await html2canvas(card, { backgroundColor: null, scale: 2, useCORS: true, logging: false });
      const a = document.createElement('a');
      a.download = 'mood-aura.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
      GMR.ui.toast('🎴 Aura Card downloaded!');
    } catch (err) {
      console.warn('[AURA]', err);
    } finally {
      card.style.top = '-9999px'; card.style.left = '-9999px';
    }
  };

  /* ── Expose ── */
  window.closeTwinPanel    = () => GMR.viral.closeTwin();
  window.showWrapped       = () => GMR.viral.showWrapped();
  window.closeWrapped      = () => GMR.viral.closeWrapped();
  window.copyShareUrl      = () => GMR.viral.copyShareUrl();
  window.captureAuraCardAndDownload = () => GMR.viral.downloadAuraCard();

})();
