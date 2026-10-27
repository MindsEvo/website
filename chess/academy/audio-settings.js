(function () {
  'use strict';

  var STORAGE_KEY = 'chessAcademyAudioSettings';
  var defaults = { volume: 80, speed: 5 };
  var activeMedia = [];
  var settings = readSettings();

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  // speed=5 is native rate (1.0); 1..5 ramps down to 0.55, 5..10 ramps up to 1.6 — wide enough to be clearly audible.
  function speedToRate(speed) {
    var s = clamp(Number(speed) || 5, 1, 10);
    if (s <= 5) return 0.55 + (s - 1) * (1.0 - 0.55) / 4;
    return 1.0 + (s - 5) * (1.6 - 1.0) / 5;
  }

  function readSettings() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        volume: clamp(saved.volume === undefined ? defaults.volume : Number(saved.volume), 0, 100),
        speed: clamp(saved.speed === undefined ? defaults.speed : Number(saved.speed), 1, 10)
      };
    } catch (error) {
      return { volume: defaults.volume, speed: defaults.speed };
    }
  }

  function currentSettings() {
    return readSettings();
  }

  function updateValueLabels() {
    var volumeValue = document.getElementById('volumeValue');
    var speedValue = document.getElementById('speedValue');
    if (volumeValue) volumeValue.textContent = String(settings.volume);
    if (speedValue) speedValue.textContent = String(settings.speed);
  }

  function syncControls() {
    var volumeRange = document.getElementById('volumeRange');
    var speedRange = document.getElementById('speedRange');
    if (volumeRange) volumeRange.value = String(settings.volume);
    if (speedRange) speedRange.value = String(settings.speed);
    updateValueLabels();
  }

  function persistSettings() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {}
    updateValueLabels();
    applyVolumeToActiveMedia();
  }

  function applyVolumeToActiveMedia() {
    activeMedia = activeMedia.filter(function (media) {
      if (!media || media.ended || media.paused) return false;
      media.volume = settings.volume / 100;
      return true;
    });
  }

  function removeSpeechIcons(text) {
    return String(text || '').replace(/[\u{1F000}-\u{1FAFF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '').replace(/\s+/g, ' ').trim();
  }

  function withoutSpeechIcons(utterance) {
    var text = removeSpeechIcons(utterance.text);
    if (text === utterance.text) return utterance;

    var cleanUtterance = new SpeechSynthesisUtterance(text);
    ['lang', 'pitch', 'voice', 'onboundary', 'onend', 'onerror', 'onmark', 'onpause', 'onresume', 'onstart'].forEach(function (property) {
      cleanUtterance[property] = utterance[property];
    });
    return cleanUtterance;
  }

  function bindControls() {
    syncControls();
    var volumeRange = document.getElementById('volumeRange');
    var speedRange = document.getElementById('speedRange');
    if (volumeRange) {
      volumeRange.addEventListener('input', function () {
        settings.volume = clamp(Number(volumeRange.value), 0, 100);
        persistSettings();
      });
    }
    if (speedRange) {
      speedRange.addEventListener('input', function () {
        settings.speed = clamp(Number(speedRange.value), 1, 10);
        persistSettings();
      });
    }
  }

  if (window.speechSynthesis && typeof window.speechSynthesis.speak === 'function') {
    var nativeSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = function (utterance) {
      var current = currentSettings();
      utterance = withoutSpeechIcons(utterance);
      utterance.volume = current.volume / 100;
      utterance.rate = speedToRate(current.speed);
      return nativeSpeak(utterance);
    };
  }

  if (window.HTMLMediaElement && window.HTMLMediaElement.prototype.play) {
    var nativePlay = window.HTMLMediaElement.prototype.play;
    window.HTMLMediaElement.prototype.play = function () {
      this.volume = currentSettings().volume / 100;
      activeMedia.push(this);
      return nativePlay.apply(this, arguments);
    };
  }

  window.addEventListener('storage', function (event) {
    if (event.key !== STORAGE_KEY) return;
    settings = readSettings();
    syncControls();
    applyVolumeToActiveMedia();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindControls);
  } else {
    bindControls();
  }
}());
