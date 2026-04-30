/* ══════════════════════════════════════════════════════════
   STREAKS.JS — Mood Streak Engine
   - Track consecutive days of mood signals
   - Aura Identity unlock at 7 days
   - User profile persistence (localStorage + Supabase)
   - Streak display widget
   - Emotional archetype system
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const S = {};
  GMR.streaks = S;

  const KEY_PROFILE  = 'gmr_profile';
  const KEY_HISTORY  = 'gmr_history';
  const KEY_STREAK   = 'gmr_streak';

  /* ── Archetypes unlocked at milestones ── */
  const ARCHETYPES = {
    joy:      { name: 'The Radiant',   symbol: '☀', desc: 'Your signal lifts the planet every time.', color: '#ffd166' },
    sadness:  { name: 'The Depth',     symbol: '🌊', desc: 'You feel what others dare not look at.',   color: '#4895ef' },
    anger:    { name: 'The Flame',     symbol: '🔥', desc: 'Your fire clears the way for something new.', color: '#ef233c' },
    fear:     { name: 'The Navigator', symbol: '🌀', desc: 'You map the territory others avoid.',       color: '#9b5de5' },
    serenity: { name: 'The Still',     symbol: '☯',  desc: 'Your calm is a gift to the noise of the world.', color: '#4af0c8' },
    love:     { name: 'The Weaver',    symbol: '💗', desc: 'You hold the thread that connects us.',    color: '#ff6b9d' },
    surprise: { name: 'The Spark',     symbol: '✦',  desc: 'You keep the universe guessing.',          color: '#f77f00' },
    neutral:  { name: 'The Witness',   symbol: '◌',  desc: 'You see everything clearly, without flinching.', color: '#7a8fb5' },
  };

  /* ── State ── */
  S.profile = null;

  /* ── Load or create profile ── */
  S.init = function () {
    try {
      const raw = localStorage.getItem(KEY_PROFILE);
      S.profile = raw ? JSON.parse(raw) : S._createProfile();
    } catch (_) {
      S.profile = S._createProfile();
    }
    S._renderStreak();
    console.log('[GMR Streaks] Profile loaded:', S.profile.streak, 'day streak');
  };

  S._createProfile = function () {
    const p = {
      id:         Math.random().toString(36).slice(2),
      streak:     0,
      lastSent:   null,
      totalSent:  0,
      moodHistory: [],     // [{date, word, type}]
      topMood:    'neutral',
      archetype:  null,
      unlockedAt: {},      // milestone → date
      twinCities: [],
    };
    S._save(p);
    return p;
  };

  S._save = function (p) {
    try { localStorage.setItem(KEY_PROFILE, JSON.stringify(p)); } catch (_) {}
  };

  /* ── Record a signal ── */
  S.recordSignal = function (word, moodType) {
    const p = S.profile;
    const today = new Date().toDateString();
    const wasToday = p.lastSent === today;

    if (!wasToday) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      p.streak = (p.lastSent === yesterday) ? p.streak + 1 : 1;
      p.lastSent = today;
    }

    p.totalSent++;
    p.moodHistory.push({ date: today, word, type: moodType });
    if (p.moodHistory.length > 365) p.moodHistory.shift();

    // Update top mood
    const counts = {};
    p.moodHistory.forEach(m => { counts[m.type] = (counts[m.type] || 0) + 1; });
    p.topMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

    // Check milestones
    S._checkMilestones(p);

    S._save(p);
    S._renderStreak();
  };

  /* ── Milestones ── */
  S._checkMilestones = function (p) {
    const milestones = [3, 7, 14, 30, 60, 100];
    milestones.forEach(m => {
      if (p.streak >= m && !p.unlockedAt[m]) {
        p.unlockedAt[m] = new Date().toISOString();
        S._celebrateMilestone(m, p);
      }
    });

    // Archetype unlock at 7 days
    if (p.streak >= 7 && !p.archetype) {
      p.archetype = p.topMood;
      S._showArchetypeUnlock(p);
    }
  };

  S._celebrateMilestone = function (days, p) {
    const messages = {
      3:   `3-day streak! The signal is becoming a pattern.`,
      7:   `7 days. Your Aura Identity has been revealed.`,
      14:  `Two weeks. The planet knows your frequency.`,
      30:  `30 days. You are a fixture in Earth's emotional record.`,
      60:  `60 days. A rare signal — deeply consistent.`,
      100: `100 days. You are now part of this planet's permanent mood archive.`,
    };
    GMR.ui.toast(`🔥 ${messages[days]}`);
  };

  /* ── Archetype unlock panel ── */
  S._showArchetypeUnlock = function (p) {
    const arch = ARCHETYPES[p.topMood] || ARCHETYPES.neutral;
    const panel = document.getElementById('archetype-panel');
    if (!panel) return;

    document.getElementById('arch-symbol').textContent = arch.symbol;
    document.getElementById('arch-name').textContent   = arch.name;
    document.getElementById('arch-desc').textContent   = arch.desc;
    document.getElementById('arch-symbol').style.color = arch.color;
    document.getElementById('arch-name').style.color   = arch.color;

    panel.classList.add('visible');
    setTimeout(() => panel.classList.remove('visible'), 8000);
  };

  /* ── Get streak summary for Wrapped ── */
  S.getWrappedData = function () {
    const p = S.profile;
    const counts = {};
    p.moodHistory.forEach(m => { counts[m.type] = (counts[m.type] || 0) + 1; });
    return {
      streak:     p.streak,
      total:      p.totalSent,
      topMood:    p.topMood,
      breakdown:  counts,
      archetype:  p.archetype ? (ARCHETYPES[p.archetype]?.name || 'Unknown') : null,
      twinCities: p.twinCities,
    };
  };

  /* ── Record twin city ── */
  S.recordTwinCity = function (cityName) {
    if (!S.profile.twinCities.includes(cityName)) {
      S.profile.twinCities.push(cityName);
      if (S.profile.twinCities.length > 10) S.profile.twinCities.shift();
      S._save(S.profile);
    }
  };

  /* ── Render streak widget ── */
  S._renderStreak = function () {
    const p = S.profile;
    const el = document.getElementById('streak-widget');
    if (!el) return;

    const arch = p.archetype ? ARCHETYPES[p.archetype] : null;
    const col  = arch ? arch.color : '#4af0c8';
    const days = ['S','M','T','W','T','F','S'];
    const today = new Date().getDay();
    const dotHtml = days.map((d, i) => {
      const active = i <= today && p.streak > (today - i);
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px">
        <div style="width:8px;height:8px;border-radius:50%;background:${active ? col : 'rgba(255,255,255,.1)'}${active ? ';box-shadow:0 0 6px ' + col : ''}"></div>
        <span style="font-size:8px;color:rgba(255,255,255,.25);font-family:'Tenor Sans',sans-serif">${d}</span>
      </div>`;
    }).join('');

    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <span style="font-family:'Cinzel',serif;font-size:8.5px;letter-spacing:.22em;color:rgba(255,255,255,.4);text-transform:uppercase">Your Streak</span>
        ${arch ? `<span style="font-size:9px;letter-spacing:.15em;color:${col};font-family:'Tenor Sans',sans-serif">${arch.symbol} ${arch.name.toUpperCase()}</span>` : ''}
      </div>
      <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:10px">
        <span style="font-family:'Bebas Neue',cursive;font-size:36px;color:${col};letter-spacing:.05em;line-height:1;text-shadow:0 0 20px ${col}88">${p.streak}</span>
        <span style="font-size:10px;color:rgba(255,255,255,.4);letter-spacing:.1em;font-family:'Tenor Sans',sans-serif">DAYS</span>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:8px">${dotHtml}</div>
      <div style="font-size:9px;color:rgba(255,255,255,.25);letter-spacing:.08em;font-family:'Tenor Sans',sans-serif">${p.totalSent} total signals</div>
    `;
  };

  /* ── Expose archetype for external use ── */
  S.getArchetype = () => {
    const p = S.profile;
    if (!p || !p.archetype) return null;
    return ARCHETYPES[p.archetype] || null;
  };

})();
