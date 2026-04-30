/* ══════════════════════════════════════════════════════════
   AUDIO.JS — Cinematic Audio Engine
   - Mood-reactive drone synthesis
   - Chord swells and arpeggios
   - Click boom sound effects
   - Signal chime
   - Reverb convolution
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const A = {};
  GMR.audio = A;

  A.ctx      = null;
  A.master   = null;
  A.comp     = null;
  A.reverb   = null;
  A.nodes    = [];
  A.on       = false;

  /* ── Toggle ── */
  A.toggle = function () {
    if (A.on) A.stop();
    else      A.start();
  };

  /* ── Start ── */
  A.start = function () {
    try {
      A.ctx    = new (window.AudioContext || window.webkitAudioContext)();
      A.master = A.ctx.createGain();
      A.master.gain.setValueAtTime(0, A.ctx.currentTime);
      A.master.gain.linearRampToValueAtTime(0.15, A.ctx.currentTime + 2.5);

      A.comp = A.ctx.createDynamicsCompressor();
      A.comp.threshold.value = -24; A.comp.knee.value = 10;
      A.comp.ratio.value = 8; A.comp.attack.value = 0.003; A.comp.release.value = 0.25;
      A.master.connect(A.comp); A.comp.connect(A.ctx.destination);

      A.reverb = A._createReverb();
      A.reverb.connect(A.comp);

      A._buildDrone(GMR.state.currentMoodType || 'serenity');
      A._scheduleSwells();

      A.on = true;
      const btn = document.getElementById('btn-audio');
      if (btn) { btn.classList.add('active'); document.getElementById('audio-icon-glyph').textContent = '◉'; }
    } catch (e) {
      GMR.ui.toast('Audio unavailable in this browser');
    }
  };

  /* ── Stop ── */
  A.stop = function () {
    A.nodes.forEach(n => { try { n.stop(); } catch (_) {} });
    A.nodes = [];
    if (A.master) A.master.gain.linearRampToValueAtTime(0, A.ctx.currentTime + 0.5);
    setTimeout(() => { if (A.ctx) { A.ctx.close(); A.ctx = null; } }, 600);
    A.on = false;
    const btn = document.getElementById('btn-audio');
    if (btn) { btn.classList.remove('active'); document.getElementById('audio-icon-glyph').textContent = '◎'; }
  };

  /* ── Shift mood ── */
  A.shiftMood = function (moodType) {
    if (!A.on || !A.ctx) return;
    A.master.gain.linearRampToValueAtTime(0, A.ctx.currentTime + 0.8);
    setTimeout(() => {
      A._buildDrone(moodType);
      A.master.gain.setValueAtTime(0, A.ctx.currentTime);
      A.master.gain.linearRampToValueAtTime(0.15, A.ctx.currentTime + 1.2);
    }, 850);
  };

  /* ── Build drone ── */
  A._buildDrone = function (moodType) {
    A.nodes.forEach(n => { try { n.stop(); } catch (_) {} });
    A.nodes = [];

    const freqs = GMR.AUDIO_FREQS[moodType] || GMR.AUDIO_FREQS.neutral;
    freqs.forEach((freq, i) => {
      const osc    = A.ctx.createOscillator();
      const gain   = A.ctx.createGain();
      const lfo    = A.ctx.createOscillator();
      const lfog   = A.ctx.createGain();
      const filter = A.ctx.createBiquadFilter();

      osc.type          = i % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.value = freq * (i > 1 ? 2 : 1);
      osc.detune.value  = (Math.random() - 0.5) * 8;

      filter.type            = 'lowpass';
      filter.frequency.value = 400 + i * 100;
      filter.Q.value         = 1.5;

      lfo.frequency.value = 0.06 + i * 0.025;
      lfog.gain.value     = 180;
      gain.gain.value     = 0.06 / (i + 1);

      lfo.connect(lfog); lfog.connect(filter.frequency);
      osc.connect(filter); filter.connect(gain); gain.connect(A.master);
      gain.connect(A.reverb);

      lfo.start(); osc.start();
      A.nodes.push(osc, lfo);
    });
  };

  /* ── Chord swells ── */
  A._scheduleSwells = function () {
    const doSwell = () => {
      if (!A.on || !A.ctx) return;
      const freqs = GMR.AUDIO_FREQS[GMR.state.dominantType] || GMR.AUDIO_FREQS.neutral;
      freqs.slice(0, 3).forEach((freq, i) => {
        setTimeout(() => {
          const osc  = A.ctx.createOscillator();
          const gain = A.ctx.createGain();
          osc.type = ['sawtooth', 'sine', 'triangle'][i % 3];
          osc.frequency.value = freq * (i % 2 === 0 ? 1 : 2);
          osc.detune.value    = (Math.random() - 0.5) * 6;
          gain.gain.setValueAtTime(0, A.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.04, A.ctx.currentTime + 2);
          gain.gain.setValueAtTime(0.04, A.ctx.currentTime + 6);
          gain.gain.linearRampToValueAtTime(0, A.ctx.currentTime + 10);
          osc.connect(gain); gain.connect(A.reverb || A.master);
          osc.start(); osc.stop(A.ctx.currentTime + 11);
        }, i * 700);
      });
      setTimeout(doSwell, 13000 + Math.random() * 5000);
    };
    setTimeout(doSwell, 4000);
  };

  /* ── Chime on signal ── */
  A.chime = function () {
    if (!A.on || !A.ctx) return;
    try {
      const osc = A.ctx.createOscillator(), env = A.ctx.createGain();
      osc.frequency.value = 880; osc.type = 'sine';
      env.gain.setValueAtTime(0.08, A.ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, A.ctx.currentTime + 0.6);
      osc.connect(env); env.connect(A.ctx.destination);
      osc.start(); osc.stop(A.ctx.currentTime + 0.6);
    } catch (_) {}
  };

  /* ── Click boom ── */
  A.playClickBoom = function () {
    if (!A.ctx || !A.on) return;
    try {
      /* Sub bass */
      const sub = A.ctx.createOscillator(), subG = A.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(80, A.ctx.currentTime);
      sub.frequency.exponentialRampToValueAtTime(28, A.ctx.currentTime + 0.35);
      subG.gain.setValueAtTime(0.35, A.ctx.currentTime);
      subG.gain.exponentialRampToValueAtTime(0.001, A.ctx.currentTime + 0.45);
      sub.connect(subG); subG.connect(A.comp || A.ctx.destination);
      sub.start(); sub.stop(A.ctx.currentTime + 0.5);

      /* Metallic partials */
      [1.0, 2.756, 5.404].forEach(ratio => {
        const o = A.ctx.createOscillator(), g = A.ctx.createGain();
        o.type = 'triangle'; o.frequency.value = 200 * ratio;
        g.gain.setValueAtTime(0.07, A.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, A.ctx.currentTime + 0.5);
        o.connect(g); g.connect(A.reverb || A.ctx.destination);
        o.start(); o.stop(A.ctx.currentTime + 0.6);
      });

      /* Noise whoosh */
      const bSz  = A.ctx.sampleRate * 0.25;
      const nBuf = A.ctx.createBuffer(1, bSz, A.ctx.sampleRate);
      const nd   = nBuf.getChannelData(0);
      for (let i = 0; i < bSz; i++) nd[i] = (Math.random() * 2 - 1);
      const ns = A.ctx.createBufferSource(); ns.buffer = nBuf;
      const nf = A.ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 2000; nf.Q.value = 0.5;
      const ng = A.ctx.createGain();
      ng.gain.setValueAtTime(0.12, A.ctx.currentTime);
      ng.gain.exponentialRampToValueAtTime(0.001, A.ctx.currentTime + 0.25);
      ns.connect(nf); nf.connect(ng); ng.connect(A.comp || A.ctx.destination);
      ns.start(); ns.stop(A.ctx.currentTime + 0.3);
    } catch (_) {}
  };

  /* ── Reverb ── */
  A._createReverb = function () {
    const conv = A.ctx.createConvolver();
    const sr = A.ctx.sampleRate, len = sr * 3;
    const buf = A.ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
    conv.buffer = buf;
    return conv;
  };

  /* ── Resume on user interaction ── */
  A.resume = function () {
    if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume();
  };

  /* ── Expose ── */
  window.toggleAudio = () => GMR.audio.toggle();

})();
