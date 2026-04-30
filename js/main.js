/* ══════════════════════════════════════════════════════════
   MAIN.JS — Application Boot & Signal Pipeline
   - Module initialization sequence
   - Supabase realtime sync (with simulation fallback)
   - submitMood() — full pipeline
   - Background signal simulation
   - Event wiring (input, keyboard, nav)
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const MAIN = {};
  GMR.main = MAIN;

  /* ── Fallback color/emoji maps (mirror ui.js) ── */
  const _MC = {
    joy:'#f7c948',sadness:'#5b8cff',anger:'#ff4d4d',
    fear:'#b84dff',serenity:'#4af0c8',love:'#ff6eb4',
    surprise:'#ff9f1c',neutral:'#a0aec0',
  };
  const _ME = {
    joy:'😊',sadness:'😢',anger:'😠',
    fear:'😨',serenity:'🌿',love:'❤️',
    surprise:'😲',neutral:'😶',
  };
  /* Capture once at boot so the helpers never self-recurse */
  const mColor = t => { const m = GMR.TYPE_COLOR || {}; return m[t] || _MC[t] || '#4af0c8'; };
  const mEmoji = t => { const m = GMR.TYPE_EMOJI || {}; return m[t] || _ME[t] || '◉'; };

  /* ══════════════════════════════════════════════════════
     1. MOOD CLASSIFICATION (local fallback)
     ══════════════════════════════════════════════════════ */
  MAIN.classifyMood = function (word) {
    const lower = word.toLowerCase().trim();
    if (!lower) return 'neutral';

    /* Direct lookup */
    const _mm = GMR.MOOD_MAP || {};
    if (_mm[lower]) return _mm[lower];

    /* Prefix scan */
    for (const [key, type] of Object.entries(_mm)) {
      if (lower.includes(key) || key.includes(lower.slice(0, 4))) return type;
    }

    /* Fallback heuristics */
    if (/happy|great|amaz|excit|wonder|fantas|brilliant|joy|bliss|glee/.test(lower)) return 'joy';
    if (/sad|grief|loss|cry|miss|mourn|hollow|broken|empty|desolat/.test(lower)) return 'sadness';
    if (/angry|rage|furi|mad|hate|livid|bitter|resent|wrathful/.test(lower)) return 'anger';
    if (/scare|fear|anxious|panic|dread|terror|nerv|worry|tremble/.test(lower)) return 'fear';
    if (/calm|peace|serene|still|quiet|tranquil|zen|gentle|sooth/.test(lower)) return 'serenity';
    if (/love|adore|tender|warmth|cherish|devot|heart|affection/.test(lower)) return 'love';
    if (/wow|shock|amaze|gasp|startl|unexpected|unbeliev|astonish/.test(lower)) return 'surprise';

    return 'neutral';
  };

  /* ══════════════════════════════════════════════════════
     2. ON MOOD INPUT (called by viral URL handler)
     ══════════════════════════════════════════════════════ */
  MAIN.onMoodInput = function (word) {
    const input = document.getElementById('mood-input');
    if (input) input.value = word;
    GMR.ui && GMR.ui.updateInputPreview(word);
  };

  /* ══════════════════════════════════════════════════════
     3. SUBMIT MOOD — Full pipeline
     ══════════════════════════════════════════════════════ */
  MAIN.submitting = false;

  window.submitMood = async function () {
    if (MAIN.submitting) return;

    const input = document.getElementById('mood-input');
    const word  = (input ? input.value : '').trim();
    if (!word || word.length < 2) {
      GMR.ui && GMR.ui.toast('Type a mood word first…');
      return;
    }

    MAIN.submitting = true;
    const btn = document.getElementById('submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = '…'; }

    /* Resume audio context on user gesture */
    GMR.audio && GMR.audio.resume();

    /* ① Local classification (fast) */
    const localType = MAIN.classifyMood(word);
    const localMoodObj = {
      t: localType,
      e: mEmoji(localType) || '◉',
      c: mColor(localType)  || '#4af0c8',
    };

    /* Immediately update globe/map with optimistic signal */
    const city = MAIN._pickCity(localType);
    MAIN._applySignal(word, localType, city, localMoodObj);

    /* ② AI reflection (async — updates overlay when ready) */
    let result = localMoodObj;
    try {
      if (GMR.ai) {
        result = await GMR.ai.getMoodReflection(word, localMoodObj);
        result = result || localMoodObj;
      }
    } catch (_) {}

    /* Merge AI type into local if it differs */
    const finalType = result.type || localType;
    if (finalType !== localType) {
      MAIN._applySignal(word, finalType, city, result);
    }

    /* ③ Show reflection overlay */
    GMR.ui && GMR.ui.showSubmitOverlay(word, result, city);

    /* ④ Streak record */
    GMR.streaks && GMR.streaks.recordSignal(word, finalType);

    /* ⑤ Waveform */
    GMR.viral && GMR.viral.addWaveformPoint(finalType);

    /* ⑥ Push to Supabase */
    MAIN._pushToSupabase(word, finalType, city);

    /* ⑦ Update share URL */
    GMR.viral && GMR.viral.updateShareUrl(word);

    /* ⑧ Weather chip */
    GMR.viral && GMR.viral.updateWeather(finalType);

    /* ⑨ Reset input */
    if (input) { input.value = ''; input.blur(); }
    GMR.ui && GMR.ui.updateInputPreview('');

    /* Reset button */
    setTimeout(() => {
      MAIN.submitting = false;
      if (btn) { btn.disabled = false; btn.textContent = 'SEND'; }
    }, 1500);
  };

  MAIN._applySignal = function (word, moodType, city, moodObj) {
    const col = moodObj.c || mColor(moodType) || '#4af0c8';
    const hex = parseInt(col.slice(1), 16);

    /* Globe dot */
    if (GMR.globe && GMR.state.viewMode === 'globe') {
      GMR.globe.addSignalDot(city.lat, city.lon, hex);
      GMR.globe.setColor(col);
    }

    /* Map ripple */
    if (GMR.map && GMR.state.viewMode === 'map') {
      const x = GMR.mX(city.lon) * (window.innerWidth / GMR.MAP_W);
      const y = GMR.mY(city.lat) * (window.innerHeight / GMR.MAP_H);
      GMR.map._spawnRipple(x, y, col);
    }

    /* Update global state */
    if (!GMR.state) GMR.state = { totalSignals: 0, moodCounts: {}, dominantType: 'serenity' };
    GMR.state.totalSignals++;
    GMR.state.moodCounts[moodType] = (GMR.state.moodCounts[moodType] || 0) + 1;
    GMR.state.currentMoodType = moodType;

    /* Recalculate dominant */
    const dom = Object.entries(GMR.state.moodCounts).sort((a, b) => b[1] - a[1])[0];
    GMR.state.dominantType = dom ? dom[0] : 'serenity';

    /* Audio */
    GMR.audio && GMR.audio.chime();
    GMR.audio && GMR.audio.shiftMood(moodType);

    /* UI updates */
    GMR.ui && GMR.ui.updateGiantMood(moodType, moodObj.reflection || city.sentence);
    GMR.ui && GMR.ui.updateStats();
    GMR.ui && GMR.ui.updateDistribution(GMR.state.moodCounts);
    GMR.ui && GMR.ui.addTicker(word, city.name, moodType);
    GMR.ui && GMR.ui.pulseInput(moodType);
  };

  /* User's real location from IP — fetched once on boot */
  MAIN._userCity = null;

  MAIN._fetchUserLocation = async function () {
    try {
      const res  = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data && data.city) {
        MAIN._userCity = {
          name:    data.city,
          country: data.country_name || data.country || '',
          lat:     parseFloat(data.latitude)  || 0,
          lon:     parseFloat(data.longitude) || 0,
          mood:    'neutral',
          sentence: '',
        };
        console.log('[GMR] User location:', MAIN._userCity.name, MAIN._userCity.country);
      }
    } catch (_) { /* silently fall back to random city */ }
  };

  MAIN._pickCity = function (moodType) {
    /* Use the user's real city for their own submissions if available */
    if (MAIN._userCity) {
      const city = Object.assign({}, MAIN._userCity, { mood: moodType });
      MAIN._userCity = null; /* use once per submission, then rotate */
      return city;
    }
    /* Otherwise prefer a city matching mood, fallback random */
    const _wc = GMR.WORLD_CITIES || [{name:'Earth',country:'',lat:0,lon:0,mood:moodType,sentence:'A signal arrives.'}];
    const matches = _wc.filter(c => c.mood === moodType);
    const pool = matches.length > 0 ? matches : _wc;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  /* ══════════════════════════════════════════════════════
     4. SUPABASE
     ══════════════════════════════════════════════════════ */
  MAIN._supabase = null;
  MAIN._tbl = 'mood_signals';

  /* ── City coords lookup — gracefully builds from WORLD_CITIES or falls back ── */
  MAIN._cityForSignal = function (signal) {
    /* 1. Try exact name match in WORLD_CITIES */
    const wc = GMR.WORLD_CITIES || [];
    const found = wc.find(c => c.name === signal.city);
    if (found) return found;
    /* 2. Build a minimal city object — place dot at a plausible lat/lon */
    return {
      name:    signal.city    || 'Earth',
      country: signal.country || '',
      mood:    signal.mood_type,
      sentence: '',
      lat: (Math.random() * 140) - 70,   /* rough random — better than 0,0 */
      lon: (Math.random() * 360) - 180,
    };
  };

  MAIN._initSupabase = async function () {
    try {
      if (typeof supabase === 'undefined') throw new Error('No Supabase SDK');
      if (!GMR.SUPABASE_URL || GMR.SUPABASE_URL === 'YOUR_SUPABASE_URL') throw new Error('No Supabase config');

      MAIN._supabase = supabase.createClient(GMR.SUPABASE_URL, GMR.SUPABASE_KEY);
      MAIN._tbl = (GMR.DB && GMR.DB.table) || 'mood_signals';

      /* ── Load existing rows to populate counts & ticker ── */
      const { data: rows, error: fetchErr } = await MAIN._supabase
        .from(MAIN._tbl)
        .select('word, mood_type, city, country')
        .order('created_at', { ascending: false })
        .limit(200);

      if (fetchErr) throw fetchErr;

      /* Seed counts from DB without firing animations */
      (rows || []).reverse().forEach(row => {
        if (!row.mood_type) return;
        GMR.state.totalSignals++;
        GMR.state.moodCounts[row.mood_type] = (GMR.state.moodCounts[row.mood_type] || 0) + 1;
      });
      /* Recalc dominant */
      const dom = Object.entries(GMR.state.moodCounts).sort((a,b) => b[1]-a[1])[0];
      if (dom) GMR.state.dominantType = dom[0];
      GMR.ui && GMR.ui.updateStats();
      GMR.ui && GMR.ui.updateDistribution(GMR.state.moodCounts);
      GMR.ui && GMR.ui.updateGiantMood(GMR.state.dominantType);

      /* Add last 8 to ticker */
      (rows || []).slice(0, 8).forEach(row => {
        GMR.ui && GMR.ui.addTicker(row.word || '…', row.city || 'Earth', row.mood_type);
      });

      /* ── Subscribe to new inserts ── */
      MAIN._supabase
        .channel('gmr-signals')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: MAIN._tbl },
          payload => MAIN._handleIncomingSignal(payload.new)
        )
        .subscribe(status => {
          console.log('[GMR] Realtime status:', status);
        });

      console.log('[GMR] Supabase connected —', rows.length, 'historical rows loaded');
    } catch (e) {
      console.warn('[GMR] Supabase unavailable:', e.message);
      /* Only run simulation if there are truly no credentials */
      if (!GMR.SUPABASE_URL || GMR.SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        MAIN._startSimulation();
      }
    }
  };

  MAIN._pushToSupabase = async function (word, moodType, city) {
    if (!MAIN._supabase) return;
    try {
      const { error } = await MAIN._supabase.from(MAIN._tbl).insert({
        word,
        mood_type:  moodType,
        city:       city.name    || '',
        country:    city.country || '',
        created_at: new Date().toISOString(),
      });
      if (error) console.warn('[GMR] Insert error:', error.message);
    } catch (e) { console.warn('[GMR] Push failed:', e.message); }
  };

  MAIN._handleIncomingSignal = function (signal) {
    if (!signal || !signal.mood_type) return;
    const city = MAIN._cityForSignal(signal);
    const moodObj = {
      t: signal.mood_type,
      e: mEmoji(signal.mood_type),
      c: mColor(signal.mood_type),
    };
    MAIN._applySignal(signal.word || '…', signal.mood_type, city, moodObj);
  };

  /* ══════════════════════════════════════════════════════
     5. SIMULATION (when Supabase is absent)
     ══════════════════════════════════════════════════════ */
  MAIN._simTimer = null;

  MAIN._startSimulation = function () {
    const tick = () => {
      const types = Object.keys(GMR.SIM_WORDS || _MC);
      const type  = types[Math.floor(Math.random() * types.length)];
      const words = (GMR.SIM_WORDS || {})[type] || ['signal'];
      const word  = words[Math.floor(Math.random() * words.length)];
      const city  = MAIN._pickCity(type);
      const moodObj = {
        t: type,
        e: mEmoji(type) || '◉',
        c: mColor(type)  || '#4af0c8',
      };

      MAIN._applySignal(word, type, city, moodObj);
      MAIN._simTimer = setTimeout(tick, 2000 + Math.random() * 4000);
    };

    MAIN._simTimer = setTimeout(tick, 3000);
    console.log('[GMR] Simulation started');
  };

  /* ══════════════════════════════════════════════════════
     6. BOOT
     ══════════════════════════════════════════════════════ */
  MAIN.boot = function () {
    console.log('[GMR] Booting…');

    /* ── Always start from zero — real data loads from Supabase ── */
    GMR.state = {
      viewMode:        'globe',
      currentMoodType: 'serenity',
      dominantType:    'serenity',
      totalSignals:    0,
      moodCounts:      { serenity:0, joy:0, love:0, neutral:0, sadness:0, anger:0, fear:0, surprise:0 },
      signalQueue:     [],
      submitting:      false,
    };


    /* ① Core modules */
    GMR.ui       && GMR.ui.init();
    GMR.streaks  && GMR.streaks.init();
    GMR.monetize && GMR.monetize.init();

    /* ② Globe (default view) */
    GMR.ui && GMR.ui.setViewMode('globe');
    if (GMR.globe) GMR.globe.init();

    /* ③ Waveform (Pro or open) */
    if (GMR.viral) {
      GMR.viral.initWaveform();
      GMR.viral.updateWeather(GMR.state.dominantType || 'serenity');
    }

    /* ④ Initial distribution render */
    GMR.ui && GMR.ui.updateDistribution(GMR.state.moodCounts);
    GMR.ui && GMR.ui.updateStats();

    /* ⑤ IP geolocation + Supabase (parallel) */
    MAIN._fetchUserLocation();
    MAIN._initSupabase();

    /* ⑥ Journalist starts after 2s (Pro) */
    setTimeout(() => {
      if (GMR.ai) GMR.ai.startJournalist();
    }, 2000);

    /* ⑦ URL mood handler */
    setTimeout(() => {
      GMR.viral && GMR.viral.handleUrlMood();
    }, 1200);

    /* ⑧ Hide loader after 1.2s */
    setTimeout(() => {
      GMR.ui && GMR.ui.hideLoader();
    }, 1200);

    /* ⑨ Wire form submit */
    const form = document.getElementById('input-bar');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        window.submitMood();
      });
    }

    /* ⑩ Wire submit button */
    const btn = document.getElementById('submit-btn');
    if (btn) btn.addEventListener('click', window.submitMood);

    /* ⑪ Enter key on input */
    const inp = document.getElementById('mood-input');
    if (inp) {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); window.submitMood(); }
      });
    }

    /* ⑫ Nav buttons */
    const btnGlobe = document.getElementById('btn-globe');
    const btnMap   = document.getElementById('btn-map');
    if (btnGlobe) btnGlobe.addEventListener('click', () => GMR.ui.setViewMode('globe'));
    if (btnMap)   btnMap.addEventListener('click',   () => {
      if (!GMR.map.inited) GMR.map.init();
      GMR.ui.setViewMode('map');
    });

    /* ⑬ Forecast button */
    const fcBtn = document.getElementById('forecast-btn');
    if (fcBtn) fcBtn.addEventListener('click', window.showForecast);

    /* ⑭ Wrapped button (streak widget area) */
    const wrappedBtns = document.querySelectorAll('[data-action="wrapped"]');
    wrappedBtns.forEach(b => b.addEventListener('click', window.showWrapped));

    /* ⑮ Periodic stats refresh */
    setInterval(() => {
      GMR.ui && GMR.ui.updateStats();
    }, 5000);

    console.log('[GMR] Boot complete');
  };

  /* ══════════════════════════════════════════════════════
     DOM READY
     ══════════════════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', MAIN.boot);
  } else {
    MAIN.boot();
  }

})();