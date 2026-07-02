/**
 * MindsEvo Shell  v1.0.0
 * ─────────────────────────────────────────────────────────
 * Shared foundation for ALL games and learning modules.
 *
 * Usage in any game page:
 *   <script src="../shell.js"></script>
 *   <script src="../i18n/strings.js"></script>   ← global strings
 *   <script src="./strings.js"></script>         ← game-specific strings
 *   <script src="./game.js"></script>
 *
 * Public API:
 *   shell.t(key, ...args)            bilingual text lookup
 *   shell.speak(text, lang?)         text-to-speech
 *   shell.setLang(lang)              'zh' | 'en'
 *   shell.storage.get/set/remove()   localStorage with namespace + prefix
 *   shell.nav.goto/home/back()       page navigation
 *   shell.user.profile               user profile object
 *   shell.report(payload)            game session reporting
 *   shell.registerStrings(obj)       register translation strings
 *
 * Storage key convention:
 *   {game}:{category}:{key}
 *   e.g.  pattern-hunter:progress:unit1
 *         user:settings:lang
 *         user:profile
 *         sys:syncPending
 * ─────────────────────────────────────────────────────────
 */

(function (global) {
  'use strict';

  // ── Private string registry ──────────────────────────────────
  const _strings = {};

  // ── i18n ────────────────────────────────────────────────────
  /**
   * Look up a translation key for the current language.
   * Supports simple positional template: t('key', arg0, arg1)  →  '{0}' replaced.
   */
  function t(key) {
    const args = Array.prototype.slice.call(arguments, 1);
    const lang  = shell.lang;
    const entry = _strings[key];
    if (!entry) {
      console.warn('[shell] missing string key:', key);
      return key;
    }
    const str = entry[lang] || entry['zh'] || key;
    return str.replace(/\{(\d+)\}/g, function (_, i) {
      return args[i] !== undefined ? args[i] : '';
    });
  }

  function registerStrings(strings) {
    Object.assign(_strings, strings);
  }

  // ── Storage ─────────────────────────────────────────────────
  // All keys are prefixed with 'me:' to avoid collision with other apps.
  const storage = {
    get: function (key, defaultValue) {
      if (defaultValue === undefined) defaultValue = null;
      try {
        var raw = localStorage.getItem('me:' + key);
        return raw !== null ? JSON.parse(raw) : defaultValue;
      } catch (e) {
        return defaultValue;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem('me:' + key, JSON.stringify(value));
      } catch (e) {
        console.warn('[shell] storage.set failed:', key, e);
      }
    },
    remove: function (key) {
      localStorage.removeItem('me:' + key);
    }
  };

  // ── Speech ───────────────────────────────────────────────────
  // Strip emoji/symbols so TTS doesn't read out icon names
  function stripEmoji(text) {
    return text
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // surrogate pairs (most emoji)
      .replace(/[\u2600-\u27BF]/g, '')                 // misc symbols & dingbats
      .replace(/[\u2B00-\u2BFF]/g, '')                 // misc symbols extended
      .replace(/\uFE0F/g, '')                          // variation selector-16
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Pre-load voices (required on Android Chrome)
  function _loadVoices() {
    if (!window.speechSynthesis) return;
    if (!speechSynthesis.getVoices().length) {
      speechSynthesis.addEventListener('voiceschanged', function () {
        speechSynthesis.getVoices();
      });
    }
  }
  _loadVoices();

  function speak(text, lang) {
    // Always show full text (with emoji) in transcript
    showVoiceTranscript(text);

    if (!window.speechSynthesis) return;
    if (!storage.get('user:settings:voice', true)) return;

    speechSynthesis.cancel();

    var targetLang = ((lang || shell.lang) === 'zh') ? 'zh-CN' : 'en-US';
    var u = new SpeechSynthesisUtterance(stripEmoji(text));
    u.lang  = targetLang;
    u.rate  = 0.88;
    u.pitch = 1.05;

    // Android: pick a matching voice if available
    var voices = speechSynthesis.getVoices();
    if (voices.length) {
      var langPrefix = targetLang.split('-')[0];
      var match = voices.find(function (v) {
        return v.lang === targetLang || v.lang.indexOf(langPrefix) === 0;
      });
      if (match) u.voice = match;
    }

    // Small delay fixes Android Chrome first-utterance block
    setTimeout(function () {
      try { speechSynthesis.speak(u); } catch (e) {}
    }, 50);
  }

  function showVoiceTranscript(text) {
    var box = document.getElementById('voiceTranscript');
    var textEl = document.getElementById('voiceTranscriptText');
    if (!box || !textEl) return;
    
    textEl.textContent = text;
    box.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    clearTimeout(shell._transcriptTimer);
    shell._transcriptTimer = setTimeout(function () {
      box.classList.add('hidden');
    }, 5000);
  }

  // ── Navigation ───────────────────────────────────────────────
  var nav = {
    // goto('pattern-hunter')  →  /games/pattern-hunter/index.html
    goto: function (game) {
      window.location.href = '/games/' + game + '/index.html';
    },
    home: function () {
      window.location.href = '/index.html';
    },
    back: function () {
      window.history.back();
    }
  };

  // ── User Profile ─────────────────────────────────────────────
  var user = {
    get profile() {
      return storage.get('user:profile', {
        id:        null,
        name:      '',
        email:     '',
        createdAt: null
      });
    },
    set profile(data) {
      storage.set('user:profile', data);
    },
    isLoggedIn: function () {
      return !!user.profile.id;
    }
  };

  // ── Report ───────────────────────────────────────────────────
  /**
   * Call at the end of each game session.
   *
   * payload = {
   *   gameId:    string     e.g. 'pattern-hunter'
   *   geneIds:   string[]   root gene IDs, e.g. ['PTRN.visual.sequence.L1.arith.PH001.v1']
   *   levelId:   string     e.g. 'L1-stage2-q5'
   *   success:   boolean
   *   solutions: number     how many solutions the player found
   *   attempts:  number
   *   timeMs:    number
   * }
   */
  function report(payload) {
    var record = Object.assign({}, payload, {
      ts:   Date.now(),
      lang: shell.lang,
      ver:  shell.version
    });

    // 1. Persist locally
    var key = payload.gameId + ':history:' + record.ts;
    storage.set(key, record);

    // 2. Queue for background server sync
    _queueSync(record);
  }

  // ── Background sync queue ────────────────────────────────────
  function _queueSync(record) {
    var pending = storage.get('sys:syncPending', []);
    pending.push(record);
    storage.set('sys:syncPending', pending);

    // Attempt upload if online (non-blocking, fails silently)
    if (navigator.onLine) {
      _flushSync();
    }
  }

  function _flushSync() {
    // TODO: replace stub with real POST to server API when backend is ready.
    // var pending = storage.get('sys:syncPending', []);
    // if (!pending.length) return;
    // fetch('/api/sync', { method:'POST', body: JSON.stringify(pending) })
    //   .then(function(r){ if(r.ok) storage.set('sys:syncPending', []); });
  }

  // ── Language ─────────────────────────────────────────────────
  function setLang(lang) {
    shell.lang = lang;
    storage.set('user:settings:lang', lang);
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
    // Notify all listeners (games can react to re-render)
    document.dispatchEvent(new CustomEvent('shell:langchange', { detail: { lang: lang } }));
  }

  // ── Public shell object ──────────────────────────────────────
  var shell = {
    version:         '1.0.0',
    lang:            storage.get('user:settings:lang', 'zh') || 'zh',
    t:               t,
    speak:           speak,
    setLang:         setLang,
    registerStrings: registerStrings,
    storage:         storage,
    nav:             nav,
    user:            user,
    report:          report
  };

  global.shell = shell;

  // Apply persisted language to <html> on load
  document.documentElement.setAttribute('lang', shell.lang === 'zh' ? 'zh-CN' : 'en');

})(window);
