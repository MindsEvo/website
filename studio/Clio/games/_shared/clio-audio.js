/**
 * clio-audio.js  –  shared music + SFX for all Clio workshop games
 *
 * Public API stays backward compatible with existing workshops. When MindsEvo
 * Shell is present, music, sound and volume follow the shared GUI settings.
 * Voice remains a Clio-specific control.
 */
(function (global) {
  "use strict";

  // ── internal state ─────────────────────────────────────────────────────────
  var _ctx       = null;
  var _master    = null;
  var _musicLoop = null;
  var _musicWanted = false;
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

  function _shellGui() {
    return global.shell && global.shell.gui ? global.shell.gui : null;
  }

  function _shellVolume() {
    if (global.shell && typeof global.shell.getVolume === "function") {
      return global.shell.getVolume();
    }
    return 100;
  }

  function _syncShellState() {
    var gui = _shellGui();
    if (!gui || typeof gui.getState !== "function") return;
    var state = gui.getState();
    _s.musicEnabled = !!state.musicOn;
    _s.sfxEnabled = !!state.soundOn;
  }

  // ── AudioContext ───────────────────────────────────────────────────────────
  function _ctx2() {
    if (!_ctx) {
      try {
        _ctx = new (global.AudioContext || global.webkitAudioContext)();
        _master = _ctx.createGain();
        _master.connect(_ctx.destination);
        _applyVolume();
      } catch (e) {}
    }
    if (_ctx && _ctx.state === "suspended") {
      try { _ctx.resume(); } catch (e) {}
    }
    return _ctx;
  }

  function _applyVolume() {
    if (!_master) return;
    var volume = Math.max(0, Math.min(100, Number(_shellVolume()) || 0));
    _master.gain.value = volume / 100;
  }

  function _connectOutput(node) {
    if (_master) node.connect(_master);
    else if (_ctx) node.connect(_ctx.destination);
  }

  function _tone(freq, type, vol, dur) {
    var ac = _ctx2(); if (!ac) return;
    var osc  = ac.createOscillator();
    var gain = ac.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    _connectOutput(gain);
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
      for (var i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * 0.6;
      }
      var src  = ac.createBufferSource();
      var gain = ac.createGain();
      src.buffer = buf;
      src.connect(gain);
      _connectOutput(gain);
      gain.gain.value = 0.22;
      src.start(ac.currentTime);
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
    tap: function () {
      _tone(660, "sine", 0.12, 0.06);
    },
    hop: function () {
      _tone(520, "sine", 0.16, 0.055);
      setTimeout(function () { _tone(780, "sine", 0.14, 0.08); }, 50);
    },
    bump: function () {
      var ac = _ctx2(); if (!ac) return;
      var buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.07), ac.sampleRate);
      var d   = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * 0.8;
      }
      var src  = ac.createBufferSource();
      var gain = ac.createGain();
      src.buffer = buf;
      src.connect(gain);
      _connectOutput(gain);
      gain.gain.value = 0.28;
      src.start(ac.currentTime);
    }
  };

  // ── BGM ────────────────────────────────────────────────────────────────────
  function _stopLoop() {
    if (_musicLoop) {
      clearTimeout(_musicLoop);
      _musicLoop = null;
    }
  }

  function _nextNote() {
    _musicLoop = null;
    if (!_musicWanted || !_s.musicEnabled) return;
    var ac = _ctx2(); if (!ac) return;
    _tone(_MELODY[_beat % _MELODY.length], "sine", 0.055, 0.44);
    _beat++;
    if (!_musicLoop && _musicWanted && _s.musicEnabled) {
      _musicLoop = setTimeout(_nextNote, 530);
    }
  }

  function _startLoop() {
    if (!_musicWanted || !_s.musicEnabled || _musicLoop) return;
    _nextNote();
  }

  // ── Button text helper ─────────────────────────────────────────────────────
  function _T(k) {
    return (_TEXT[_s.lang] || _TEXT.zh)[k];
  }

  function _setBtnText(btn, key, enabled) {
    if (btn) btn.textContent = _T(key) + ": " + (enabled ? _T("on") : _T("off"));
  }

  function _refreshAll() {
    _musicBtns.forEach(function (b) { _setBtnText(b, "music", _s.musicEnabled); });
    _sfxBtns.forEach(function (b)   { _setBtnText(b, "sfx", _s.sfxEnabled); });
    _voiceBtns.forEach(function (b) { _setBtnText(b, "voice", _s.voiceEnabled); });
  }

  function _onAudioChanged(event) {
    var detail = event && event.detail ? event.detail : {};
    var gui = _shellGui();
    var state = gui && typeof gui.getState === "function" ? gui.getState() : null;

    _s.musicEnabled = detail.musicOn != null
      ? !!detail.musicOn
      : (state ? !!state.musicOn : _s.musicEnabled);
    _s.sfxEnabled = detail.soundOn != null
      ? !!detail.soundOn
      : (state ? !!state.soundOn : _s.sfxEnabled);

    // shell.audio already follows this event. Never start a second Clio music
    // loop when the shared engine is present; only keep the private fallback
    // alive on pages that do not provide shell.audio.
    if (global.shell && global.shell.audio) {
      _stopLoop();
    } else if (_s.musicEnabled) {
      _startLoop();
    } else {
      _stopLoop();
    }

    _applyVolume();
    _refreshAll();
  }

  // ── TTS (Web Speech API) ──────────────────────────────────────────────────
  function _speak(textZh, textEn) {
    if (!_s.voiceEnabled) return;
    if (!global.speechSynthesis) return;
    var text = _s.lang === "en" ? (textEn || textZh) : (textZh || textEn);
    if (!text) return;
    global.speechSynthesis.cancel();
    var utt = new global.SpeechSynthesisUtterance(text);
    utt.lang  = _s.lang === "en" ? "en-US" : "zh-CN";
    utt.rate  = 0.88;
    utt.pitch = 1.05;
    utt.volume = Math.max(0, Math.min(1, _shellVolume() / 100));
    global.speechSynthesis.speak(utt);
  }

  document.addEventListener("shell:gui:audioChanged", _onAudioChanged);
  document.addEventListener("shell:gui:volumeChanged", _applyVolume);

  // ── Public API ─────────────────────────────────────────────────────────────
  global.ClioAudio = {
    init: function (lang) {
      if (lang) _s.lang = lang;
      _syncShellState();
      _applyVolume();
      _refreshAll();
    },

    setLang: function (lang) {
      _s.lang = lang;
      _refreshAll();
    },

    bindMusicBtn: function (btn) {
      if (!btn) return;
      _musicBtns.push(btn);
      _setBtnText(btn, "music", _s.musicEnabled);
      btn.addEventListener("click", function () {
        _ctx2();
        var gui = _shellGui();
        if (gui && typeof gui.setMusic === "function") {
          gui.setMusic(!_s.musicEnabled);
        } else {
          _s.musicEnabled = !_s.musicEnabled;
          if (_s.musicEnabled) _startLoop();
          else _stopLoop();
          _refreshAll();
        }
      });
    },

    bindSfxBtn: function (btn) {
      if (!btn) return;
      _sfxBtns.push(btn);
      _setBtnText(btn, "sfx", _s.sfxEnabled);
      btn.addEventListener("click", function () {
        _ctx2();
        var gui = _shellGui();
        if (gui && typeof gui.setSound === "function") {
          gui.setSound(!_s.sfxEnabled);
        } else {
          _s.sfxEnabled = !_s.sfxEnabled;
          _refreshAll();
        }
      });
    },

    bindVoiceBtn: function (btn) {
      if (!btn) return;
      _voiceBtns.push(btn);
      _setBtnText(btn, "voice", _s.voiceEnabled);
      btn.addEventListener("click", function () {
        _s.voiceEnabled = !_s.voiceEnabled;
        _setBtnText(btn, "voice", _s.voiceEnabled);
        if (!_s.voiceEnabled && global.speechSynthesis) {
          global.speechSynthesis.cancel();
        }
      });
    },

    speak: _speak,

    startBgm: function () {
      _musicWanted = true;
      _beat = 0;
      _stopLoop();

      if (global.shell && global.shell.audio &&
          typeof global.shell.audio.startMusic === "function") {
        global.shell.audio.startMusic();
        return;
      }

      _startLoop();
    },

    stopBgm: function () {
      _musicWanted = false;
      _stopLoop();

      if (global.shell && global.shell.audio &&
          typeof global.shell.audio.stopMusic === "function") {
        global.shell.audio.stopMusic();
      }
    },

    sfx: function (type) {
      if (!_s.sfxEnabled) return;

      if (global.shell && global.shell.audio &&
          typeof global.shell.audio.sfx === "function") {
        global.shell.audio.sfx(type);
        return;
      }

      if (_SFX[type]) _SFX[type]();
    }
  };

})(window);
