/* ══════════════════════════════════════════════════════════
   AI.JS — Claude API Integration
   - Mood reflection overlay (on submit)
   - AI mood journalist (live narration panel)
   - Mood story generator (city-based micro-fiction)
   - Mood forecast (tomorrow's emotional weather)
   - Sentiment news overlay logic
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const AI = {};
  GMR.ai = AI;

  const API = 'https://api.anthropic.com/v1/messages';
  const MODEL = 'claude-sonnet-4-20250514';

  async function callClaude(system, userMsg, maxTokens = 300) {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });
    const data = await res.json();
    return data.content.map(c => c.text || '').join('');
  }

  async function callClaudeJSON(system, userMsg, maxTokens = 400) {
    const raw = await callClaude(system, userMsg, maxTokens);
    try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); }
    catch (_) { return null; }
  }

  /* ══════════════════════════════════════════════════════
     1. MOOD REFLECTION — shown on submit overlay
     ══════════════════════════════════════════════════════ */
  AI.getMoodReflection = async function (word, moodObj) {
    const fallbacks = {
      joy:      'There are moments when the light agrees with everything. This is one of them, and you are carrying it forward.',
      sadness:  'Grief is the price of having loved something that mattered. The ache you carry is the shape of what was beautiful.',
      anger:    'Anger is grief that has learned to stand. Let it stand, let it speak — then let it dissolve into motion.',
      fear:     'Anxiety is future-time leaking into the present. Breathe — you are here, and here is survivable.',
      serenity: 'Stillness is not the absence of the storm — it is the eye that watches it, sovereign and unhurried.',
      love:     'Love is not a feeling — it is the frequency the universe resonates at when it remembers itself.',
      surprise: 'You are a frequency the universe has been trying to play for a long time. Finally, it has the right instrument.',
      neutral:  'Some words resist translation. They live in the pause between heartbeats, illuminated by something older than language.',
    };

    try {
      const result = await callClaudeJSON(
        `You are the poetic intelligence behind the Global Mood Ring — a real-time emotional map of Earth.
When given a mood word, write a two-sentence poetic reflection — cinematic, spacious, evocative, not clichéd. Like Hans Zimmer translated to language.
Classify the mood into one of: joy, sadness, anger, fear, serenity, love, surprise, neutral.
Reply ONLY with valid JSON: {"type":"<mood type>","emoji":"<single emoji>","color":"<hex color matching the mood>","reflection":"<two sentence reflection>"}`,
        `The mood word is: "${word}"`
      );
      if (result && result.reflection) return result;
    } catch (_) {}

    return { type: moodObj.t, emoji: moodObj.e, color: moodObj.c, reflection: fallbacks[moodObj.t] || fallbacks.neutral };
  };

  /* ══════════════════════════════════════════════════════
     2. AI JOURNALIST — live narration of global mood
     ══════════════════════════════════════════════════════ */
  AI.lastJournalistUpdate = 0;
  AI.journalistTimer = null;

  AI.startJournalist = function () {
    AI._runJournalist();
    AI.journalistTimer = setInterval(AI._runJournalist, 45000);
  };

  AI.stopJournalist = function () {
    clearInterval(AI.journalistTimer);
  };

  AI._runJournalist = async function () {
    const panel = document.getElementById('journalist-text');
    if (!panel) return;

    // Build context from recent signals
    const counts = GMR.state.moodCounts || {};
    const top3 = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const dominant = top3[0]?.[0] || 'serenity';
    const total = GMR.state.totalSignals || 0;
    const recentCities = GMR.WORLD_CITIES.slice(0, 5).map(c => `${c.name} (${c.mood})`).join(', ');

    panel.textContent = 'Tuning in…';
    panel.style.opacity = '0.5';

    try {
      const narration = await callClaude(
        `You are a live correspondent for the Global Mood Ring — a real-time emotional pulse of humanity.
Write 2-3 sentences of cinematic live journalism narrating the current global mood.
Be specific, poetic, and surprising. Reference actual cities or regions when relevant.
Never use the word "literally". Never use generic phrases like "it seems" or "it appears".
Keep it under 80 words. Write as if broadcasting from the emotional core of Earth.`,
        `Current data: ${total} total signals. Dominant mood: ${dominant}. 
Top moods: ${top3.map(([t, n]) => `${t} (${n})`).join(', ')}.
Active cities include: ${recentCities}.
Time: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}.`
      );

      panel.textContent = narration;
      panel.style.opacity = '1';
      AI.lastJournalistUpdate = Date.now();

      // Update timestamp
      const ts = document.getElementById('journalist-ts');
      if (ts) ts.textContent = 'LIVE · ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      panel.textContent = 'The signal is searching for words…';
      panel.style.opacity = '0.6';
    }
  };

  /* ══════════════════════════════════════════════════════
     3. MOOD STORY GENERATOR — micro-fiction for mood twin
     ══════════════════════════════════════════════════════ */
  AI.generateMoodStory = async function (moodWord, city) {
    try {
      return await callClaude(
        `You are a micro-fiction author writing for the Global Mood Ring app.
Write exactly 3 sentences of evocative micro-fiction set in the given city, 
inspired by the given mood word. Sensory, specific, cinematic — not generic.
Name a real street, food, sound, or landmark if it helps. 
No clichés. No metaphors about seasons or waves unless genuinely original.`,
        `Mood: "${moodWord}". City: ${city.name}, ${city.country}. 
Context: ${city.sentence}`
      );
    } catch (_) {
      return `In ${city.name}, someone feels exactly what you feel right now. They're standing by a window, watching the city breathe. It knows.`;
    }
  };

  /* ══════════════════════════════════════════════════════
     4. MOOD FORECAST — tomorrow's emotional weather
     ══════════════════════════════════════════════════════ */
  AI.getForecast = async function () {
    const panel = document.getElementById('forecast-content');
    if (!panel) return;

    panel.innerHTML = '<span style="opacity:.5;font-size:11px;letter-spacing:.1em">CALCULATING FORECAST…</span>';

    const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const hour = new Date().getHours();
    const dominant = GMR.state.dominantType || 'serenity';
    const total = GMR.state.totalSignals || 0;

    try {
      const result = await callClaudeJSON(
        `You are the forecasting intelligence for the Global Mood Ring.
Based on the day of week, time of day, current dominant mood, and general patterns in human emotional cycles,
predict tomorrow's likely dominant global mood.
Reply ONLY with valid JSON: {
  "mood": "<one of: joy|sadness|anger|fear|serenity|love|surprise|neutral>",
  "confidence": <number 60-95>,
  "headline": "<8-word max bold prediction>",
  "reasoning": "<2 sentence explanation — poetic, not clinical>"
}`,
        `Today is ${day}, ${hour}:00. Current dominant mood: ${dominant}. Total signals today: ${total}.
Historical note: Sundays tend toward serenity. Mondays often spike anxiety. Fridays lean joy.`
      );

      if (result) {
        const col = GMR.TYPE_COLOR[result.mood] || '#4af0c8';
        panel.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-family:'Bebas Neue',cursive;font-size:28px;color:${col};letter-spacing:.08em">${result.mood.toUpperCase()}</span>
            <span style="font-size:10px;color:${col};background:${col}22;border:1px solid ${col}44;border-radius:20px;padding:2px 10px;letter-spacing:.1em">${result.confidence}% CONFIDENCE</span>
          </div>
          <div style="font-family:'Cinzel',serif;font-size:12px;letter-spacing:.12em;color:rgba(255,255,255,.8);margin-bottom:8px">${result.headline}</div>
          <div style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:13px;color:rgba(255,255,255,.45);line-height:1.7">${result.reasoning}</div>
        `;
      }
    } catch (_) {
      panel.innerHTML = '<span style="color:rgba(255,255,255,.3);font-size:12px">Forecast unavailable — the atmosphere is unreadable today.</span>';
    }
  };

  /* ══════════════════════════════════════════════════════
     5. DAILY MOOD LETTER — "The Pulse"
     ══════════════════════════════════════════════════════ */
  AI.generateDailyLetter = async function () {
    const counts = GMR.state.moodCounts || {};
    const top3 = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const dominant = top3[0]?.[0] || 'serenity';
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    try {
      return await callClaude(
        `You are the author of "The Pulse" — a daily emotional dispatch from the Global Mood Ring.
Write a poetic 150-word letter summarizing Earth's emotional day.
Structure: 1 opening line (stunning), 2-3 body sentences (specific, surprising, human), 1 closing line (memorable).
Reference real mood data. Be a journalist-poet.
Sign it: — The Pulse`,
        `Date: ${date}. Dominant mood: ${dominant}. Signal breakdown: ${top3.map(([t, n]) => `${t}: ${n}`).join(', ')}.`,
        400
      );
    } catch (_) {
      return `On ${date}, Earth breathed ${dominant}.\n\nThe signals came from everywhere and nowhere — from kitchens and commutes, from the space between sleep and waking. The planet chose its frequency and held it.\n\nTomorrow, something new.\n\n— The Pulse`;
    }
  };

  /* ══════════════════════════════════════════════════════
     6. MOOD WRAPPED — annual/monthly report narrative
     ══════════════════════════════════════════════════════ */
  AI.generateWrapped = async function (userData) {
    try {
      return await callClaudeJSON(
        `You are the narrator for Mood Ring Wrapped — a personal annual emotional report.
Given the user's mood history data, write a poetic, insightful personal narrative.
Reply ONLY with valid JSON: {
  "headline": "<one stunning sentence about their year>",
  "identity": "<their emotional archetype — e.g. 'The Seeker', 'The Flame', 'The Tide'>",
  "narrative": "<3 sentences — emotional arc, surprising observations>",
  "affirmation": "<1 closing sentence — warm, specific, not generic>"
}`,
        `User mood data: Top mood: ${userData.topMood}. Streak: ${userData.streak} days. Total signals: ${userData.total}. 
Mood mix: ${JSON.stringify(userData.breakdown)}. Mood twin cities: ${userData.twinCities?.join(', ')}.`,
        500
      );
    } catch (_) {
      return {
        headline: 'You were here, and you felt it fully.',
        identity: 'The Witness',
        narrative: 'You showed up, mood after mood, and gave the planet something real. Your signals are part of the record now.',
        affirmation: 'Whatever you felt was true — and that makes it worth something.'
      };
    }
  };

  console.log('[GMR AI] Module loaded');

})();
