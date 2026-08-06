/**
 * clio-audio.js  –  shared music + SFX for all Clio workshop games
 *
 * Usage (in every game):
 *   ClioAudio.init(lang);
 *   ClioAudio.bindMusicBtn(el);
 *   ClioAudio.bindSfxBtn(el);
 *   ClioAudio.startBgm();   // when gameplay begins
 *   ClioAudio.stopBgm();    // when gameplay ends / pauses
 *   ClioAudio.sfx('correct' | 'wrong' | 'win' | 'fail' | 'tap' | 'hop' | 'bump');
 *   ClioAudio.setLang(lang); // call after language switches to refresh button text
 *   ClioAudio.bindVoiceBtn(el);
 *   ClioAudio.speak('中文提示', 'English hint'); // narrate at key moments
 */
(function (global) {
  "use strict";

  // ── internal state ─────────────────────────────────────────────────────────
  var _ctx       = null;
  var _musicLoop = null;
  var _beat      = 0;
  var _musicBtns = [];
  var _sfxBtns   = [];
  var _voiceBtns = [];

  var _s = {
    lang:         "zh",
    musicEnabled: true,
    sfxEnabled:   true,
    voiceEnabled: true
  };

  // C-major pentatonic: C4 D4 E4 G4 A4 G4 E4 D4
  var _MELODY = [261.63, 293.66, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66];

  var _TEXT = {
    zh: { music: "音乐", sfx: "音效", voice: "语音", on: "开", off: "关" },
    en: { music: "Music", sfx: "SFX",  voice: "Voice", on: "On", off: "Off" }
  };

  // ── AudioContext ───────────────────────────────────────────────────────────
  function _ctx2() {
    if (!_ctx) {
      try { _ctx = new (global.AudioContext || global.webkitAudioContext)(); } catch (e) {}
    }
    if (_ctx && _ctx.state === "suspended") { try { _ctx.resume(); } catch (e) {} }
    return _ctx;
  }

  function _tone(freq, type, vol, dur) {
    var ac = _ctx2(); if (!ac) return;
    var osc  = ac.createOscillator();
    var gain = ac.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    osc.connect(gain); gain.connect(ac.destination);
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + dur + 0.01);
  }

  // ── SFX library ────────────────────────────────────────────────────────────
  var _SFX = {
    correct: function () {
      _tone(523.25, "sine", 0.18, 0.07);
      setTimeout(function () { _tone(659.25, "sine", 0.18, 0.09); }, 80);
      setTimeout(function () { _tone(783.99, "sine", 0.18, 0.14); }, 170);
    },
    wrong: function () {
      var ac = _ctx2(); if (!ac) return;
      var buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.08), ac.sampleRate);
      var d   = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * 0.6;
      var src  = ac.createBufferSource();
      var gain = ac.createGain();
      src.buffer = buf; src.connect(gain); gain.connect(ac.destination);
      gain.gain.value = 0.22; src.start(ac.currentTime);
    },
    win: function () {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
        setTimeout(function () { _tone(f, "sine", 0.22, 0.28); }, i * 150);
      });
    },
    fail: function () {
      _tone(300, "sawtooth", 0.14, 0.10);
      setTimeout(function () { _tone(190, "sawtooth", 0.14, 0.18); }, 130);
    },
    tap:  function () { _tone(660, "sine", 0.12, 0.06); },
    hop:  function () {
      _tone(520, "sine", 0.16, 0.055);
      setTimeout(function () { _tone(780, "sine", 0.14, 0.08); }, 50);
    },
    bump: function () {
      var ac = _ctx2(); if (!ac) return;
      var buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.07), ac.sampleRate);
      var d   = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * 0.8;
      var src  = ac.createBufferSource();
      var gain = ac.createGain();
      src.buffer = buf; src.connect(gain); gain.connect(ac.destination);
      gain.gain.value = 0.28; src.start(ac.currentTime);
    }
  };

  // ── BGM ────────────────────────────────────────────────────────────────────
  function _nextNote() {
    if (!_s.musicEnabled) return;
    var ac = _ctx2(); if (!ac) return;
    _tone(_MELODY[_beat % _MELODY.length], "sine", 0.055, 0.44);
    _beat++;
    _musicLoop = setTimeout(_nextNote, 530);
  }

  // ── Button text helper ─────────────────────────────────────────────────────
  function _T(k) { return (_TEXT[_s.lang] || _TEXT.zh)[k]; }

  function _setBtnText(btn, key, enabled) {
    if (btn) btn.textContent = _T(key) + ": " + (enabled ? _T("on") : _T("off"));
  }

  function _refreshAll() {
    _musicBtns.forEach(function (b) { _setBtnText(b, "music", _s.musicEnabled); });
    _sfxBtns.forEach(function (b)   { _setBtnText(b, "sfx",   _s.sfxEnabled);   });
    _voiceBtns.forEach(function (b) { _setBtnText(b, "voice", _s.voiceEnabled); });
  }

  // ── TTS (Web Speech API) ────────────────────────────────────────────────────
  function _speak(textZh, textEn) {
    if (!_s.voiceEnabled) return;
    if (!global.speechSynthesis) return;
    var text = _s.lang === "en" ? (textEn || textZh) : (textZh || textEn);
    if (!text) return;
    global.speechSynthesis.cancel();
    var utt  = new global.SpeechSynthesisUtterance(text);
    utt.lang  = _s.lang === "en" ? "en-US" : "zh-CN";
    utt.rate  = 0.88;
    utt.pitch = 1.05;
    global.speechSynthesis.speak(utt);
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  global.ClioAudio = {

    /** Call once per game page, before bindMusicBtn / bindSfxBtn. */
    init: function (lang) {
      if (lang) _s.lang = lang;
    },

    /** Re-render button labels after the game switches language. */
    setLang: function (lang) {
      _s.lang = lang;
      _refreshAll();
    },

    /** Bind and initialise the music toggle button. */
    bindMusicBtn: function (btn) {
      if (!btn) return;
      _musicBtns.push(btn);
      _setBtnText(btn, "music", _s.musicEnabled);
      btn.addEventListener("click", function () {
        _ctx2();  // unlock AudioContext on first user gesture
        _s.musicEnabled = !_s.musicEnabled;
        _setBtnText(btn, "music", _s.musicEnabled);
        if (_s.musicEnabled) { _nextNote(); }
        else { if (_musicLoop) { clearTimeout(_musicLoop); _musicLoop = null; } }
      });
    },

    /** Bind and initialise the SFX toggle button. */
    bindSfxBtn: function (btn) {
      if (!btn) return;
      _sfxBtns.push(btn);
      _setBtnText(btn, "sfx", _s.sfxEnabled);
      btn.addEventListener("click", function () {
        _ctx2();
        _s.sfxEnabled = !_s.sfxEnabled;
        _setBtnText(btn, "sfx", _s.sfxEnabled);
      });
    },

    /** Bind and initialise the voice/TTS toggle button. */
    bindVoiceBtn: function (btn) {
      if (!btn) return;
      _voiceBtns.push(btn);
      _setBtnText(btn, "voice", _s.voiceEnabled);
      btn.addEventListener("click", function () {
        _s.voiceEnabled = !_s.voiceEnabled;
        _setBtnText(btn, "voice", _s.voiceEnabled);
        if (!_s.voiceEnabled && global.speechSynthesis) global.speechSynthesis.cancel();
      });
    },

    /**
     * Speak text using Web Speech API.
     * Pass both languages; the current lang is used automatically.
     */
    speak: _speak,

    /** Start background music loop. */
    startBgm: function () {
      if (_musicLoop) { clearTimeout(_musicLoop); _musicLoop = null; }
      _beat = 0;
      if (_s.musicEnabled) _nextNote();
    },

    /** Stop background music loop. */
    stopBgm: function () {
      if (_musicLoop) { clearTimeout(_musicLoop); _musicLoop = null; }
    },

    /**
     * Play a named sound effect.
     * Types: 'correct' 'wrong' 'win' 'fail' 'tap' 'hop' 'bump'
     */
    sfx: function (type) {
      if (!_s.sfxEnabled) return;
      if (_SFX[type]) _SFX[type]();
    }
  };

})(window);
