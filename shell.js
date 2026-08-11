/**
 * MindsEvo Shell  v1.1.0
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
  const _videoCatalog = Object.create(null);
  var _videoCatalogLoaded = false;

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

  // Unlock speech synthesis on first user gesture (Android phone Chrome requirement)
  // Tablets/iPad are lenient; Android phone Chrome blocks speech without a prior gesture.
  var _speechUnlocked = false;
  function _unlockSpeech() {
    if (_speechUnlocked || !window.speechSynthesis) return;
    _speechUnlocked = true;
    var dummy = new SpeechSynthesisUtterance('');
    dummy.volume = 0;
    speechSynthesis.speak(dummy);
    speechSynthesis.cancel();
  }
  document.addEventListener('touchstart', _unlockSpeech, { once: true, passive: true });
  document.addEventListener('click',      _unlockSpeech, { once: true });

  function speak(text, lang) {
    // Always show full text (with emoji) in transcript
    showVoiceTranscript(text);

    if (!window.speechSynthesis) return;
    if (!storage.get('user:settings:voice', true)) return;

    speechSynthesis.cancel();

    var targetLang = ((lang || shell.lang) === 'zh') ? 'zh-CN' : 'en-US';
    var u = new SpeechSynthesisUtterance(stripEmoji(text));
    u.lang   = targetLang;
    u.rate   = 0.88;
    u.pitch  = 1.05;
    u.volume = getVolume() / 100;

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
    // Support both Shell-1 (s1-) and legacy element IDs
    var box    = document.getElementById('s1-transcript')    || document.getElementById('voiceTranscript');
    var textEl = document.getElementById('s1-transcript-text') || document.getElementById('voiceTranscriptText');
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
    document.dispatchEvent(new CustomEvent('shell:gui:languageChanged', { detail: { lang: lang } }));
  }

  function getSoundEnabled() {
    var sound = storage.get('user:settings:sound', null);
    if (sound === null) {
      // Backward compatibility with old voice key.
      sound = storage.get('user:settings:voice', true);
      storage.set('user:settings:sound', !!sound);
    }
    return !!sound;
  }

  function setSoundEnabled(on) {
    var val = !!on;
    storage.set('user:settings:sound', val);
    // Keep legacy key in sync for existing checks.
    storage.set('user:settings:voice', val);
    if (!val && window.speechSynthesis) speechSynthesis.cancel();
    document.dispatchEvent(new CustomEvent('shell:gui:audioChanged', {
      detail: { musicOn: getMusicEnabled(), soundOn: val }
    }));
  }

  function getMusicEnabled() {
    return !!storage.get('user:settings:music', false);
  }

  function setMusicEnabled(on) {
    var val = !!on;
    storage.set('user:settings:music', val);
    document.dispatchEvent(new CustomEvent('shell:gui:audioChanged', {
      detail: { musicOn: val, soundOn: getSoundEnabled(), volume: getVolume() }
    }));
  }

  function getVolume() {
    return Number(storage.get('user:settings:volume', 80));
  }

  function setVolume(v) {
    var val = Math.max(0, Math.min(100, Number(v) || 0));
    storage.set('user:settings:volume', val);
    document.dispatchEvent(new CustomEvent('shell:gui:volumeChanged', {
      detail: { volume: val, musicOn: getMusicEnabled(), soundOn: getSoundEnabled() }
    }));
    // also fire audioChanged so existing listeners see the update
    document.dispatchEvent(new CustomEvent('shell:gui:audioChanged', {
      detail: { musicOn: getMusicEnabled(), soundOn: getSoundEnabled(), volume: val }
    }));
  }

  function registerVideoCatalog(catalog) {
    var items = [];
    if (Array.isArray(catalog)) {
      items = catalog;
    } else if (catalog && Array.isArray(catalog.videos)) {
      items = catalog.videos;
    }

    items.forEach(function (item) {
      if (!item || !item.id) return;
      _videoCatalog[item.id] = Object.assign({}, item);
    });
    if (items.length) _videoCatalogLoaded = true;
  }

  function loadVideoCatalog(url) {
    if (!url || typeof fetch !== 'function') {
      return Promise.resolve({ loaded: 0 });
    }
    return fetch(url)
      .then(function (res) {
        if (!res.ok) {
          throw new Error('Failed to load video catalog: ' + res.status);
        }
        return res.json();
      })
      .then(function (data) {
        registerVideoCatalog(data);
        var count = data && Array.isArray(data.videos)
          ? data.videos.length
          : (Array.isArray(data) ? data.length : 0);
        _videoCatalogLoaded = count > 0;
        return { loaded: count };
      });
  }

  function autoLoadVideoCatalog() {
    if (_videoCatalogLoaded) return;
    if (!global.location || !global.location.protocol) return;
    var p = global.location.protocol;
    if (p !== 'http:' && p !== 'https:') return;

    loadVideoCatalog('/metadata/video.json').catch(function () {
      // Keep silent to avoid polluting game consoles in local dev.
    });
  }

  function resolveVideo(videoId, lang) {
    if (!videoId) return null;
    var entry = _videoCatalog[videoId];
    if (!entry) return null;

    var targetLang = (lang === 'en') ? 'en' : 'zh';
    var url = '';

    if (entry.urls && typeof entry.urls === 'object') {
      url = entry.urls[targetLang] || entry.urls.default || '';
    }
    if (!url) {
      url = targetLang === 'zh' ? (entry.urlZh || '') : (entry.urlEn || '');
    }
    if (!url) {
      url = entry.url || '';
    }

    return {
      id: entry.id,
      titleZh: entry.titleZh || '',
      titleEn: entry.titleEn || '',
      url: url
    };
  }

  function buildGuiConfig(cfg) {
    var gui = cfg && cfg.gui ? cfg.gui : {};
    var header = gui.header || {};
    var language = gui.language || {};
    var audio = gui.audio || {};
    var music = audio.music || {};
    var sound = audio.sound || {};
    var history = gui.history || {};
    var help = gui.help || {};
    var video = gui.video || {};
    return {
      header: {
        show: header.show !== false,
        showBack: header.showBack !== false
      },
      language: {
        enabled: language.enabled !== false,
        default: language.default === 'en' ? 'en' : 'zh'
      },
      audio: {
        music: {
          enabled: music.enabled === true,
          defaultOn: music.defaultOn === true
        },
        sound: {
          enabled: sound.enabled !== false,
          defaultOn: sound.defaultOn !== false
        }
      },
      history: {
        enabled: history.enabled !== false
      },
      help: {
        enabled: help.enabled === true,
        contentZh: help.contentZh || '',
        contentEn: help.contentEn || ''
      },
      video: {
        enabled: video.enabled === true,
        videoId: video.videoId || '',
        url: video.url || ''
      }
    };
  }

  function initGuiState(guiCfg) {
    if (!storage.get('user:settings:lang', null)) {
      setLang(guiCfg.language.default);
    }
    if (storage.get('user:settings:sound', null) === null && storage.get('user:settings:voice', null) === null) {
      setSoundEnabled(guiCfg.audio.sound.defaultOn);
    } else {
      // Ensure legacy and new key are aligned.
      setSoundEnabled(getSoundEnabled());
    }
    if (storage.get('user:settings:music', null) === null) {
      setMusicEnabled(guiCfg.audio.music.defaultOn);
    }
  }

  function buildGuiRuntimeApi() {
    return {
      getState: function () {
        return {
          lang: shell.lang,
          musicOn: getMusicEnabled(),
          soundOn: getSoundEnabled()
        };
      },
      setLanguage: function (lang) {
        if (lang !== 'zh' && lang !== 'en') return;
        setLang(lang);
      },
      setMusic: function (on) {
        setMusicEnabled(on);
      },
      setSound: function (on) {
        setSoundEnabled(on);
      },
      openHelp: function () {
        document.dispatchEvent(new CustomEvent('shell:gui:helpOpened'));
      },
      openHistory: function () {
        document.dispatchEvent(new CustomEvent('shell:gui:historyOpened'));
      },
      openVideo: function (videoId) {
        var resolved = resolveVideo(videoId || '', shell.lang);
        if (resolved && resolved.url) {
          window.open(resolved.url, '_blank');
        }
        document.dispatchEvent(new CustomEvent('shell:gui:videoOpened', {
          detail: {
            videoId: videoId || '',
            url: resolved && resolved.url ? resolved.url : ''
          }
        }));
        return resolved;
      }
    };
  }

  function resolveRootGenes(cfg, context) {
    var genes = [];

    if (cfg && typeof cfg.registerRootGenes === 'function') {
      try {
        genes = cfg.registerRootGenes(context) || [];
      } catch (err) {
        console.warn('[shell] registerRootGenes failed:', err);
      }
    } else if (cfg && Array.isArray(cfg.rootGeneIds)) {
      genes = cfg.rootGeneIds;
    }

    if (!Array.isArray(genes)) return [];

    var out = [];
    var seen = Object.create(null);
    genes.forEach(function (id) {
      if (typeof id !== 'string') return;
      var key = id.trim();
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push(key);
    });
    return out;
  }

  // ── Runtime Compatibility Layer (shared) ──
  function createRuntimeLayer() {
    var sessionSeq = 0;
    var activeSession = null;
    var lifecycleListeners = [];
    var timerRegistry = Object.create(null);
    var logs = [];
    var diagnosticsEnabled = false;

    function now() {
      return Date.now();
    }

    function log(kind, payload) {
      if (!diagnosticsEnabled) return;
      logs.push({ ts: now(), kind: kind, payload: payload || null });
      if (logs.length > 800) logs.shift();
    }

    function beginSession(label) {
      sessionSeq += 1;
      activeSession = {
        token: sessionSeq,
        label: label || 'default',
        startedAt: now()
      };
      log('session:begin', activeSession);
      return activeSession.token;
    }

    function getActiveSessionToken() {
      return activeSession ? activeSession.token : null;
    }

    function isActiveSession(token) {
      return !!activeSession && activeSession.token === token;
    }

    function emitLifecycle(eventName, payload) {
      log('lifecycle:' + eventName, payload);
      lifecycleListeners.forEach(function (fn) {
        try {
          fn(eventName, payload || {});
        } catch (e) {
          console.warn('[shell.runtime] lifecycle listener error', e);
        }
      });
    }

    function onLifecycle(listener) {
      if (typeof listener !== 'function') return function () {};
      lifecycleListeners.push(listener);
      return function off() {
        lifecycleListeners = lifecycleListeners.filter(function (fn) { return fn !== listener; });
      };
    }

    function timerKey(owner, key) {
      return String(owner || 'global') + '::' + String(key || 'default');
    }

    function clearTimer(owner, key) {
      var k = timerKey(owner, key);
      var item = timerRegistry[k];
      if (!item) return;
      clearTimeout(item.id);
      delete timerRegistry[k];
      log('timer:clear', { owner: owner, key: key });
    }

    function clearOwnerTimers(owner) {
      var prefix = String(owner || 'global') + '::';
      Object.keys(timerRegistry).forEach(function (k) {
        if (k.indexOf(prefix) === 0) {
          clearTimeout(timerRegistry[k].id);
          delete timerRegistry[k];
        }
      });
      log('timer:clearOwner', { owner: owner });
    }

    function setGuardedTimer(owner, key, ms, callback, sessionToken) {
      clearTimer(owner, key);
      var k = timerKey(owner, key);
      var issuedAt = now();
      var id = setTimeout(function () {
        var item = timerRegistry[k];
        if (!item) return;
        delete timerRegistry[k];
        if (sessionToken != null && !isActiveSession(sessionToken)) {
          log('timer:stale', { owner: owner, key: key, token: sessionToken });
          return;
        }
        log('timer:fire', { owner: owner, key: key, delay: ms, age: now() - issuedAt });
        callback();
      }, ms);
      timerRegistry[k] = {
        id: id,
        owner: owner || 'global',
        key: key || 'default',
        sessionToken: sessionToken == null ? null : sessionToken,
        issuedAt: issuedAt,
        delayMs: ms
      };
      log('timer:set', { owner: owner, key: key, delay: ms, token: sessionToken });
      return id;
    }

    function bindUnifiedTap(element, handler) {
      if (!element || typeof handler !== 'function') return function () {};

      var lastTouchTs = 0;
      function invoke(ev) {
        if (ev && ev.cancelable) ev.preventDefault();
        handler(ev);
      }

      function onTouchEnd(ev) {
        lastTouchTs = (window.performance && performance.now) ? performance.now() : now();
        invoke(ev);
      }

      function onClick(ev) {
        var t = (window.performance && performance.now) ? performance.now() : now();
        if (t - lastTouchTs < 500) return;
        invoke(ev);
      }

      element.addEventListener('touchend', onTouchEnd, { passive: false });
      element.addEventListener('click', onClick);

      return function unbind() {
        element.removeEventListener('touchend', onTouchEnd);
        element.removeEventListener('click', onClick);
      };
    }

    function commitAnimationStart(elements) {
      var list = Array.isArray(elements) ? elements : [elements];
      list.forEach(function (el) {
        if (!el) return;
        void el.offsetHeight;
      });
      log('anim:commitStart', { count: list.length });
    }

    function nextFrame(callback, frames) {
      var count = Math.max(1, Number(frames || 1));
      function step() {
        if (count <= 1) {
          callback();
          return;
        }
        count -= 1;
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) emitLifecycle('background', {});
      else emitLifecycle('foreground', {});
    });

    return {
      beginSession: beginSession,
      getActiveSessionToken: getActiveSessionToken,
      isActiveSession: isActiveSession,
      setGuardedTimer: setGuardedTimer,
      clearTimer: clearTimer,
      clearOwnerTimers: clearOwnerTimers,
      onLifecycle: onLifecycle,
      emitLifecycle: emitLifecycle,
      bindUnifiedTap: bindUnifiedTap,
      commitAnimationStart: commitAnimationStart,
      nextFrame: nextFrame,
      diagnostics: {
        enable: function () { diagnosticsEnabled = true; },
        disable: function () { diagnosticsEnabled = false; },
        getLogs: function () { return logs.slice(); },
        clear: function () { logs = []; }
      }
    };
  }
  // ── Shell-1 Game Framework ───────────────────────────────────
  /**
   * shell.createGame(config)
   *
   * Generates the full game UI and runs the state machine.
   * Games only provide their unique logic via config.
   *
   * config = {
   *   id:             string,           // e.g. 'number-pattern-hunter'
   *   title:          { zh, en },       // game title
   *   subtitle:       { zh, en },       // game subtitle
   *   theme:          { primary, primary2, bg? },  // optional color override
   *   passScore:      number,           // score needed to unlock next unit (default 8)
   *   debug:          boolean,          // unlock all units (default true)
   *   units:          Unit[],           // see Shell-1 data format below
   *
   *   // Game-specific renderers (required):
   *   renderSequence(q, containerEl),   // render question sequence into container
   *   renderOption(opt, q) → string,    // return innerHTML for each option button
   *   checkAnswer(selected, q) → bool,  // return true if answer is correct
   *
   *   // Optional:
   *   getVoiceText(q, qIndex) → string  // voice prompt text for each question
   * }
   *
   * Shell-1 standard Unit format:
   * {
   *   id:     string,   nameZh: string,  nameEn: string,
   *   icon:   string,   descZh: string,  descEn: string,
   *   questions: [{
   *     answer:  any,      options: any[],
   *     hintZh:  string,   hintEn:  string,
   *     // + any game-specific fields (passed through to renderers)
   *   }]
   * }
   */
  function createGame(config) {
    var guiCfg = buildGuiConfig(config);
    initGuiState(guiCfg);

    // Inject theme CSS variables
    if (config.theme) {
      var t = config.theme;
      var css = ':root{';
      if (t.primary)  css += '--s1-primary:'  + t.primary  + ';';
      if (t.primary2) css += '--s1-primary2:' + t.primary2 + ';';
      if (t.bg)       css += '--s1-bg:'       + t.bg       + ';';
      css += '}';
      var styleEl = document.createElement('style');
      styleEl.textContent = css;
      document.head.appendChild(styleEl);
    }

    // Set page title
    if (config.title) {
      document.title = stripEmoji((shell.lang === 'zh' ? config.title.zh : config.title.en) || '') + ' | MindsEvo';
    }

    // Build and inject full game HTML
    document.body.insertAdjacentHTML('beforeend', _buildGameHTML());

    // Wire voice transcript to s1- elements
    shell._s1TranscriptEl = document.getElementById('s1-transcript-text');

    // Run the game state machine
    _runGame(config, guiCfg);
  }


  function _buildGameHTML() {
    return [
      '<div class="s1-wrap">',

      // ── HOME ──
      '<div id="s1-home" class="s1-screen">',
        '<div class="s1-hdr">',
          '<div class="s1-title" id="s1-title"></div>',
          '<div class="s1-controls">',
            '<button class="s1-btn s1-help" id="s1-help">❓</button>',
            '<button class="s1-btn s1-video" id="s1-video">🎬</button>',
            '<button class="s1-btn s1-music" id="s1-music">🎵</button>',
            '<button class="s1-btn s1-mute" id="s1-mute">🔊</button>',
            '<button class="s1-btn s1-lang" id="s1-lang">EN</button>',
            '<input type="range" class="s1-vol" id="s1-vol" min="0" max="100" title="Volume">',
          '</div>',
        '</div>',
        '<div class="s1-sub" id="s1-sub"></div>',
        '<div class="s1-units" id="s1-units"></div>',
        '<div class="s1-summary">',
          '<div class="s1-sums">',
            '<div class="s1-sum-hdr" id="s1-sum-sess-hdr">',
              '<span><span class="zh">📝 本次练习</span><span class="en">📝 Current Session</span></span>',
              '<span class="s1-arrow" id="s1-sum-sess-arr">▼</span>',
            '</div>',
            '<div class="s1-sum-body" id="s1-sum-sess-body"></div>',
          '</div>',
          '<div class="s1-sums">',
            '<div class="s1-sum-hdr" id="s1-sum-hist-hdr">',
              '<span><span class="zh">📊 历史总览</span><span class="en">📊 All History</span></span>',
              '<span class="s1-arrow" id="s1-sum-hist-arr">▼</span>',
            '</div>',
            '<div class="s1-sum-body" id="s1-sum-hist-body"></div>',
          '</div>',
        '</div>',
      '</div>',

      // ── GAME ──
      '<div id="s1-game" class="s1-screen s1-hidden">',
        '<div class="s1-ghdr">',
          '<button class="s1-back" id="s1-back">⬅️</button>',
          '<div class="s1-utitle" id="s1-utitle"></div>',
          '<div class="s1-controls">',
            '<button class="s1-btn s1-help" id="s1-ghelp">❓</button>',
            '<button class="s1-btn s1-video" id="s1-gvideo">🎬</button>',
            '<button class="s1-btn s1-music" id="s1-gmusic">🎵</button>',
            '<button class="s1-btn s1-mute" id="s1-gmute">🔊</button>',
            '<button class="s1-btn s1-lang" id="s1-glang">EN</button>',
            '<input type="range" class="s1-vol" id="s1-gvol" min="0" max="100" title="Volume">',
          '</div>',
        '</div>',
        '<div class="s1-ginfo">',
          '<div class="s1-prog">',
            '<span class="zh">第<span id="s1-qi">1</span>/<span id="s1-qt">10</span>题</span>',
            '<span class="en">Q<span id="s1-qi-e">1</span>/<span id="s1-qt-e">10</span></span>',
          '</div>',
          '<div class="s1-score">',
            '<span class="zh">得分：<span id="s1-sc">0</span></span>',
            '<span class="en">Score: <span id="s1-sc-e">0</span></span>',
          '</div>',
        '</div>',
        '<div class="s1-dots" id="s1-dots"></div>',
        '<div class="s1-seq">',
          '<button class="s1-replay" id="s1-replay">🔊</button>',
          '<div id="s1-seqin"></div>',
        '</div>',
        '<div class="s1-opts" id="s1-opts"></div>',
        '<div class="s1-fb" id="s1-fb"></div>',
        '<div class="s1-hint s1-hidden" id="s1-hint"></div>',
        '<div class="s1-acts" id="s1-acts"></div>',
      '</div>',

      // ── RESULT ──
      '<div id="s1-result" class="s1-screen s1-hidden">',
        '<div class="s1-rem" id="s1-rem">🏆</div>',
        '<div class="s1-rtitle" id="s1-rtitle"></div>',
        '<div class="s1-rstats">',
          '<div class="s1-rscore" id="s1-rscore"></div>',
          '<div class="s1-rdet"   id="s1-rdet"></div>',
        '</div>',
        '<div class="s1-rmsg"  id="s1-rmsg"></div>',
        '<div class="s1-acts" id="s1-racts"></div>',
      '</div>',

      '</div>', // .s1-wrap

      // ── VOICE TRANSCRIPT BAR ──
      '<div id="s1-transcript" class="s1-transcript s1-hidden">',
        '<div id="s1-transcript-text"></div>',
      '</div>',

      '<div id="s1-overlay" class="s1-overlay s1-hidden">',
        '<div class="s1-overlay-card">',
          '<div class="s1-overlay-hdr">',
            '<div class="s1-overlay-title" id="s1-overlay-title"></div>',
            '<button class="s1-overlay-close" id="s1-overlay-close">✕</button>',
          '</div>',
          '<div class="s1-overlay-body" id="s1-overlay-body"></div>',
        '</div>',
      '</div>'
    ].join('');
  }

  function _runGame(cfg, guiCfg) {
    var GAME_ID    = cfg.id;
    var PASS_SCORE = cfg.passScore || 8;
    var DEBUG      = cfg.debug !== false;

    var state = {
      unitIdx: 0, qIdx: 0, score: 0,
      hints: 0, startTime: 0, firstWrong: false, hintShown: false
    };
    var sessionStats = {};

    var $home   = document.getElementById('s1-home');
    var $game   = document.getElementById('s1-game');
    var $result = document.getElementById('s1-result');

    // Debug: unlock all units
    if (DEBUG) {
      cfg.units.forEach(function (u) {
        var s = _unitSave(u.id);
        if (!s.unlocked) { s.unlocked = true; _saveUnit(u.id, s); }
      });
    }

    _applyGuiLayout();

    // Bind common event handlers
    _bindClick('s1-mute', _toggleMute);
    _bindClick('s1-lang', _toggleLang);
    _bindClick('s1-gmute', _toggleMute);
    _bindClick('s1-glang', _toggleLang);
    _bindClick('s1-music', _toggleMusic);
    _bindClick('s1-gmusic', _toggleMusic);
    _bindClick('s1-help', _openHelp);
    _bindClick('s1-ghelp', _openHelp);
    _bindClick('s1-video', _openVideo);
    _bindClick('s1-gvideo', _openVideo);
    _bindClick('s1-overlay-close', _closeOverlay);
    _bindClick('s1-back', _goHome);
    _bindClick('s1-replay', _replay);
    _bindClick('s1-sum-sess-hdr', function () { _toggleSum('sess'); });
    _bindClick('s1-sum-hist-hdr', function () { _toggleSum('hist'); });

    _bindVol('s1-vol');
    _bindVol('s1-gvol');

    // Language change → re-render current screen
    document.addEventListener('shell:langchange', function () {
      _updLang();
      if (!$home.classList.contains('s1-hidden'))   _renderHome();
      if (!$game.classList.contains('s1-hidden'))   _renderQ();
      if (!$result.classList.contains('s1-hidden')) _renderResult();
    });

    _renderHome();
    _updMute();
    _updMusic();
    _updVol();
    _updLang();

    function _bindClick(id, handler) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', handler);
    }

    function _applyGuiLayout() {
      var homeHdr = document.querySelector('#s1-home .s1-hdr');
      var gameHdr = document.querySelector('#s1-game .s1-ghdr');
      var backBtn = document.getElementById('s1-back');
      var summary = document.querySelector('#s1-home .s1-summary');

      if (homeHdr) homeHdr.style.display = guiCfg.header.show ? '' : 'none';
      if (gameHdr) gameHdr.style.display = guiCfg.header.show ? '' : 'none';
      if (backBtn) backBtn.style.display = guiCfg.header.showBack ? '' : 'none';
      if (summary) summary.style.display = guiCfg.history.enabled ? '' : 'none';

      document.querySelectorAll('.s1-lang').forEach(function (el) {
        el.style.display = guiCfg.language.enabled ? '' : 'none';
      });
      document.querySelectorAll('.s1-mute').forEach(function (el) {
        el.style.display = guiCfg.audio.sound.enabled ? '' : 'none';
      });
      document.querySelectorAll('.s1-music').forEach(function (el) {
        el.style.display = guiCfg.audio.music.enabled ? '' : 'none';
      });
      document.querySelectorAll('.s1-help').forEach(function (el) {
        el.style.display = guiCfg.help.enabled ? '' : 'none';
      });
      document.querySelectorAll('.s1-video').forEach(function (el) {
        el.style.display = guiCfg.video.enabled ? '' : 'none';
      });
    }

    function _openHelp() {
      var titleZh = '使用帮助';
      var titleEn = 'Help';
      var bodyZh = guiCfg.help.contentZh || '请观察题目规律，选择最合适的答案。';
      var bodyEn = guiCfg.help.contentEn || 'Observe the pattern and choose the best answer.';
      _showOverlay(titleZh, titleEn, bodyZh, bodyEn);
      document.dispatchEvent(new CustomEvent('shell:gui:helpOpened'));
    }

    function _openVideo() {
      var resolved = null;
      if (guiCfg.video.videoId) {
        resolved = resolveVideo(guiCfg.video.videoId, shell.lang);
      }

      var targetUrl = guiCfg.video.url || (resolved && resolved.url ? resolved.url : '');
      if (targetUrl) {
        window.open(targetUrl, '_blank');
      } else {
        var tipZh = guiCfg.video.videoId
          ? ('视频 ID：' + guiCfg.video.videoId + '（未命中 video.json）')
          : '暂未配置视频链接';
        var tipEn = guiCfg.video.videoId
          ? ('Video ID: ' + guiCfg.video.videoId + ' (not found in video.json)')
          : 'No video URL configured yet';
        _showOverlay('视频入口', 'Video', tipZh, tipEn);
      }
      document.dispatchEvent(new CustomEvent('shell:gui:videoOpened', {
        detail: {
          videoId: guiCfg.video.videoId || '',
          url: targetUrl
        }
      }));
    }

    function _showOverlay(titleZh, titleEn, bodyZh, bodyEn) {
      var overlay = document.getElementById('s1-overlay');
      var titleEl = document.getElementById('s1-overlay-title');
      var bodyEl = document.getElementById('s1-overlay-body');
      if (!overlay || !titleEl || !bodyEl) return;
      titleEl.innerHTML = _bispan(titleZh, titleEn);
      bodyEl.innerHTML = '<p>' + _bispan(bodyZh, bodyEn) + '</p>';
      overlay.classList.remove('s1-hidden');
    }

    function _closeOverlay() {
      var overlay = document.getElementById('s1-overlay');
      if (overlay) overlay.classList.add('s1-hidden');
    }

    // ── HOME ────────────────────────────────────────────────────
    function _renderHome() {
      var titleEl = document.getElementById('s1-title');
      var subEl   = document.getElementById('s1-sub');
      if (cfg.title) {
        titleEl.innerHTML = _bispan(cfg.title.zh, cfg.title.en);
      }
      if (cfg.subtitle) {
        subEl.innerHTML = _bispan(cfg.subtitle.zh, cfg.subtitle.en);
      }

      var list = document.getElementById('s1-units');
      list.innerHTML = '';
      cfg.units.forEach(function (unit, i) {
        var save   = _unitSave(unit.id);
        var locked = !save.unlocked;
        var best   = save.bestScore;
        var total  = unit.questions.length;

        var statZh = locked ? '🔒 未解锁' : (best !== null ? '最佳 ' + best + '/' + total : '🆕 新');
        var statEn = locked ? '🔒 Locked'  : (best !== null ? 'Best ' + best + '/' + total  : '🆕 New');

        var card = document.createElement('div');
        card.className = 's1-card' + (locked ? ' s1-locked' : '');
        card.innerHTML =
          '<div class="s1-cicon">' + (unit.icon || '') + '</div>' +
          '<div class="s1-cinfo">' +
            '<div class="s1-cname">' + _bispan(unit.nameZh, unit.nameEn) + '</div>' +
            '<div class="s1-cdesc">' + _bispan(unit.descZh, unit.descEn) + '</div>' +
          '</div>' +
          '<div class="s1-cstat">' + _bispan(statZh, statEn) + '</div>';

        if (!locked) {
          (function (idx) {
            card.addEventListener('click', function () { _startUnit(idx); });
          })(i);
        }
        list.appendChild(card);
      });

      // Re-render open summary panels (handles lang switch)
      var sessBody = document.getElementById('s1-sum-sess-body');
      var histBody = document.getElementById('s1-sum-hist-body');
      if (sessBody && sessBody.classList.contains('s1-open')) _renderSess();
      if (histBody && histBody.classList.contains('s1-open')) _renderHist();
    }

    // ── GAME ────────────────────────────────────────────────────
    function _startUnit(idx) {
      state.unitIdx  = idx;
      state.qIdx     = 0;
      state.score    = 0;
      state.hints    = 0;
      state.startTime = Date.now();
      _show($game); _hide($home); _hide($result);
      _renderQ();
    }

    function _renderQ() {
      var unit  = cfg.units[state.unitIdx];
      var q     = unit.questions[state.qIdx];
      var total = unit.questions.length;

      document.getElementById('s1-utitle').innerHTML = _bispan(unit.nameZh, unit.nameEn);

      // Progress counters (zh + en copies share same values)
      ['s1-qi','s1-qi-e'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.textContent = state.qIdx + 1;
      });
      ['s1-qt','s1-qt-e'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.textContent = total;
      });
      _updScore();

      // Progress dots
      var dotsEl = document.getElementById('s1-dots');
      dotsEl.innerHTML = '';
      for (var i = 0; i < total; i++) {
        var d = document.createElement('div');
        d.className = 's1-dot' +
          (i < state.qIdx  ? ' s1-done' : '') +
          (i === state.qIdx ? ' s1-cur'  : '');
        dotsEl.appendChild(d);
      }

      // Sequence (game-specific)
      cfg.renderSequence(q, document.getElementById('s1-seqin'), unit);

      // Options (game-specific)
      var optsEl = document.getElementById('s1-opts');
      optsEl.innerHTML = '';
      q.options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.className = 's1-opt';
        var inner = cfg.renderOption(opt, q, unit);
        if (typeof inner === 'string') btn.innerHTML = inner;
        btn.setAttribute('data-val', String(opt));
        (function (o) {
          btn.addEventListener('click', function () { _answer(o, btn, q); });
        })(opt);
        optsEl.appendChild(btn);
      });

      // Reset per-question UI
      var fb = document.getElementById('s1-fb');
      fb.className = 's1-fb'; fb.innerHTML = '';
      var hint = document.getElementById('s1-hint');
      hint.classList.add('s1-hidden'); hint.innerHTML = '';
      document.getElementById('s1-acts').innerHTML = '';
      state.firstWrong = false; state.hintShown = false;

      // Voice
      if (cfg.getVoiceText) shell.speak(cfg.getVoiceText(q, state.qIdx));
    }

    function _answer(selected, btn, q) {
      var correct = cfg.checkAnswer(selected, q);

      // Optional callback: game can track error types here
      if (cfg.onAnswer) cfg.onAnswer(selected, q, correct);

      var fb   = document.getElementById('s1-fb');
      var acts = document.getElementById('s1-acts');

      if (correct) {
        // Lock ALL options and highlight the correct choice
        document.querySelectorAll('.s1-opt').forEach(function (b) {
          b.disabled = true;
          if (b === btn) b.classList.add('s1-correct');
        });

        fb.className = 's1-fb s1-fb-ok';
        fb.innerHTML = '<span class="zh">🎉 答对了！</span><span class="en">🎉 Correct!</span>';
        shell.speak(shell.lang === 'zh' ? '答对了！' : 'Correct!');

        if (!state.firstWrong && !state.hintShown) {
          state.score++;
          _updScore();
        }

        var isLast = state.qIdx >= cfg.units[state.unitIdx].questions.length - 1;
        var nxtBtn = document.createElement('button');
        nxtBtn.className = 's1-abtn s1-primary';
        nxtBtn.innerHTML = isLast
          ? '<span class="zh">查看结果</span><span class="en">See Results</span>'
          : '<span class="zh">下一题 →</span><span class="en">Next →</span>';
        nxtBtn.addEventListener('click', function () {
          state.qIdx++;
          if (state.qIdx >= cfg.units[state.unitIdx].questions.length) {
            _finish();
          } else {
            _renderQ();
          }
        });
        acts.innerHTML = '';
        if (cfg.onCorrect) cfg.onCorrect(q, acts, cfg.units[state.unitIdx]);
        acts.appendChild(nxtBtn);

      } else {
        // Only disable the clicked wrong option — other options stay enabled for retry
        btn.classList.add('s1-wrong');
        btn.disabled = true;

        fb.className = 's1-fb s1-fb-err';
        fb.innerHTML = '<span class="zh">❌ 再想想！</span><span class="en">❌ Try again!</span>';
        shell.speak(shell.lang === 'zh' ? '再想想！' : 'Try again!');
        if (!state.firstWrong) state.firstWrong = true;

        // Show hint button only once (if hint not already shown)
        if (!state.hintShown) {
          var hintBtn = document.createElement('button');
          hintBtn.className = 's1-abtn s1-secondary';
          hintBtn.innerHTML = '<span class="zh">看提示 💡</span><span class="en">Show Hint 💡</span>';
          hintBtn.addEventListener('click', function () {
            var hintEl = document.getElementById('s1-hint');
            hintEl.innerHTML = '<span class="zh">💡 ' + (q.hintZh || '') + '</span>' +
                               '<span class="en">💡 ' + (q.hintEn || '') + '</span>';
            hintEl.classList.remove('s1-hidden');
            state.hintShown = true;
            state.hints++;
            shell.speak(shell.lang === 'zh' ? (q.hintZh || '') : (q.hintEn || ''));
            acts.innerHTML = '';  // remove hint button after showing
          });
          acts.innerHTML = '';
          acts.appendChild(hintBtn);
        }
      }
    }

    // ── RESULT ──────────────────────────────────────────────────
    function _finish() {
      var unit   = cfg.units[state.unitIdx];
      var total  = unit.questions.length;
      var elapsed = Date.now() - state.startTime;
      var passed  = state.score >= PASS_SCORE;
      var isLast  = state.unitIdx === cfg.units.length - 1;

      // Session stats (in-memory)
      sessionStats[unit.id] = {
        score: state.score, wrong: total - state.score,
        hints: state.hints, timeMs: elapsed
      };

      // Persist unit progress
      var save = _unitSave(unit.id);
      if (save.bestScore === null || state.score > save.bestScore) save.bestScore = state.score;
      save.playCount = (save.playCount || 0) + 1;
      _saveUnit(unit.id, save);

      // Unlock next unit
      if (passed && !isLast) {
        var next = cfg.units[state.unitIdx + 1];
        var ns   = _unitSave(next.id);
        ns.unlocked = true;
        _saveUnit(next.id, ns);
      }

      // Report to shell analytics
      var geneIds = resolveRootGenes(cfg, {
        shell: 'shell-1',
        gameId: GAME_ID,
        unit: unit,
        state: {
          score: state.score,
          total: total,
          hints: state.hints,
          passed: passed,
          elapsedMs: elapsed
        }
      });

      var reportContext = {};
      if (cfg && typeof cfg.getReportContext === 'function') {
        try {
          reportContext = cfg.getReportContext({
            gameId: GAME_ID,
            unit: unit,
            state: {
              score: state.score,
              total: total,
              hints: state.hints,
              passed: passed,
              elapsedMs: elapsed
            }
          }) || {};
        } catch (err) {
          console.warn('[shell] getReportContext failed:', err);
          reportContext = {};
        }
      }

      shell.report({
        gameId:    GAME_ID,
        unitId:    unit.id,
        score:     state.score,
        total:     total,
        timeMs:    elapsed,
        hintsUsed: state.hints,
        geneIds:   geneIds,
        shell:     'shell-1',
        levelId:   reportContext.levelId || null,
        comparisonType: reportContext.comparisonType || null,
        difficultyAxis: reportContext.difficultyAxis || null,
        moduleId: reportContext.moduleId || null,
        moduleType: reportContext.moduleType || null,
        context: reportContext
      });

      // Stash for lang-switch re-render
      $result.dataset.passed  = passed;
      $result.dataset.isLast  = isLast;
      $result.dataset.elapsed = elapsed;
      $result.dataset.total   = total;

      _show($result); _hide($game);
      _renderResult();
    }

    function _renderResult() {
      var passed  = $result.dataset.passed  === 'true';
      var isLast  = $result.dataset.isLast  === 'true';
      var elapsed = parseInt($result.dataset.elapsed) || 0;
      var total   = parseInt($result.dataset.total)   || 10;

      document.getElementById('s1-rem').textContent = passed ? '🏆' : '💪';
      document.getElementById('s1-rtitle').innerHTML = passed
        ? _bispan(isLast ? '🎊 全部完成！' : '⭐ 太棒了！', isLast ? '🎊 All Done!' : '⭐ Great Job!')
        : _bispan('💪 继续加油！', '💪 Keep Going!');

      document.getElementById('s1-rscore').textContent = state.score + '/' + total;

      var s = Math.floor(elapsed / 1000), m = Math.floor(s / 60);
      document.getElementById('s1-rdet').innerHTML = m > 0
        ? _bispan(m + '分' + (s % 60) + '秒', m + 'm ' + (s % 60) + 's')
        : _bispan(s + '秒', s + 's');

      document.getElementById('s1-rmsg').innerHTML = passed
        ? _bispan('恭喜通关！', 'Level complete!')
        : _bispan('再练一次，会更好！', 'Practice once more!');

      if (cfg.onResult) cfg.onResult({ score: state.score, total: total, passed: passed, elapsed: elapsed }, document.getElementById('s1-rmsg'));

      var acts = document.getElementById('s1-racts');
      acts.innerHTML = '';

      var retryBtn = document.createElement('button');
      retryBtn.className = 's1-abtn s1-outline';
      retryBtn.innerHTML = _bispan('再试一次', 'Try Again');
      retryBtn.addEventListener('click', function () { _startUnit(state.unitIdx); });
      acts.appendChild(retryBtn);

      if (passed && !isLast) {
        var nextBtn = document.createElement('button');
        nextBtn.className = 's1-abtn s1-primary';
        nextBtn.innerHTML = _bispan('下一关 →', 'Next Level →');
        nextBtn.addEventListener('click', function () { _startUnit(state.unitIdx + 1); });
        acts.appendChild(nextBtn);
      }

      var homeBtn = document.createElement('button');
      homeBtn.className = 's1-abtn s1-outline';
      homeBtn.innerHTML = _bispan('返回主页', 'Home');
      homeBtn.addEventListener('click', _goHome);
      acts.appendChild(homeBtn);

      shell.speak(passed ? (shell.lang === 'zh' ? '太棒了！' : 'Great job!') : (shell.lang === 'zh' ? '继续加油！' : 'Keep going!'));
    }

    // ── SUMMARY ─────────────────────────────────────────────────
    function _toggleSum(which) {
      var bodyId = which === 'sess' ? 's1-sum-sess-body' : 's1-sum-hist-body';
      var arrId  = which === 'sess' ? 's1-sum-sess-arr'  : 's1-sum-hist-arr';
      var body   = document.getElementById(bodyId);
      var arr    = document.getElementById(arrId);
      var open   = body.classList.toggle('s1-open');
      if (arr) arr.textContent = open ? '▲' : '▼';
      if (open) { if (which === 'sess') _renderSess(); else _renderHist(); }
    }

    function _renderSess() {
      var body = document.getElementById('s1-sum-sess-body');
      if (!body) return;
      var zh = shell.lang === 'zh';
      var hasData = Object.keys(sessionStats).length > 0;

      if (!hasData) {
        body.innerHTML = '<div class="s1-empty">' +
          _bispan('本次尚未完成任何练习', 'No practice completed this session') + '</div>';
        return;
      }

      var th = zh
        ? '<th>关卡</th><th>答对</th><th>答错</th><th>提示</th><th>用时</th>'
        : '<th>Unit</th><th>Correct</th><th>Wrong</th><th>Hints</th><th>Time</th>';
      var html = '<table class="s1-table"><thead><tr>' + th + '</tr></thead><tbody>';

      cfg.units.forEach(function (u) {
        var d    = sessionStats[u.id];
        var name = zh ? (u.nameZh || '') : (u.nameEn || '');
        if (d) {
          html += '<tr>' +
            '<td class="s1-tname">' + (u.icon || '') + ' ' + name + '</td>' +
            '<td class="s1-tok">'  + d.score + '</td>' +
            '<td class="s1-terr">' + d.wrong + '</td>' +
            '<td>' + d.hints + '</td>' +
            '<td>' + _fmtTime(d.timeMs) + '</td>' +
            '</tr>';
        } else {
          html += '<tr class="s1-tidle"><td class="s1-tname">' +
            (u.icon || '') + ' ' + name + '</td><td colspan="4">—</td></tr>';
        }
      });
      html += '</tbody></table>';
      body.innerHTML = html;
    }

    function _renderHist() {
      var body = document.getElementById('s1-sum-hist-body');
      if (!body) return;
      var zh   = shell.lang === 'zh';
      var data = _calcHist();

      if (data.sessions === 0) {
        body.innerHTML = '<div class="s1-empty">' +
          _bispan('还没有历史记录', 'No history yet') + '</div>';
        return;
      }

      body.innerHTML =
        '<div class="s1-hstats">' +
          _stat(data.sessions,          zh ? '完成局数' : 'Sessions') +
          _stat(data.correct,           zh ? '总答对'   : 'Correct') +
          _stat(data.wrong,             zh ? '总答错'   : 'Wrong') +
          _stat(data.hints,             zh ? '用提示'   : 'Hints') +
          _stat(_fmtTime(data.totalMs), zh ? '总用时'   : 'Total Time') +
        '</div>' +
        '<div class="s1-hclear"><button class="s1-clearbtn" id="s1-clearbtn">' +
          (zh ? '🗑 清除历史记录' : '🗑 Clear History') +
        '</button></div>';

      document.getElementById('s1-clearbtn').addEventListener('click', function () {
        var msg = zh ? '确认清除所有历史记录？此操作不可恢复。' : 'Clear all history? Cannot be undone.';
        if (!confirm(msg)) return;
        var prefix = 'me:' + GAME_ID + ':history:';
        var toRemove = [];
        for (var k = 0; k < localStorage.length; k++) {
          var key = localStorage.key(k);
          if (key && key.indexOf(prefix) === 0) toRemove.push(key);
        }
        toRemove.forEach(function (k) { localStorage.removeItem(k); });
        cfg.units.forEach(function (u) { shell.storage.remove(GAME_ID + ':unit:' + u.id); });
        _renderHome();
        _renderHist();
      });
    }

    function _calcHist() {
      var prefix = 'me:' + GAME_ID + ':history:';
      var sessions = 0, correct = 0, wrong = 0, hints = 0, totalMs = 0;
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf(prefix) === 0) {
          try {
            var r = JSON.parse(localStorage.getItem(key));
            if (r && r.total) {
              sessions++;
              correct  += (r.score     || 0);
              wrong    += (r.total - (r.score || 0));
              hints    += (r.hintsUsed || 0);
              totalMs  += (r.timeMs    || 0);
            }
          } catch (e) {}
        }
      }
      return { sessions: sessions, correct: correct, wrong: wrong, hints: hints, totalMs: totalMs };
    }

    // ── Helpers ─────────────────────────────────────────────────
    function _goHome() { _show($home); _hide($game); _hide($result); _renderHome(); }
    function _replay()  {
      if (cfg.getVoiceText) {
        var q = cfg.units[state.unitIdx].questions[state.qIdx];
        shell.speak(cfg.getVoiceText(q, state.qIdx));
      }
    }

    function _toggleMute() {
      var cur = getSoundEnabled();
      setSoundEnabled(!cur);
      _updMute();
    }
    function _toggleLang() {
      if (!guiCfg.language.enabled) return;
      shell.setLang(shell.lang === 'zh' ? 'en' : 'zh');
    }
    function _toggleMusic() {
      var cur = getMusicEnabled();
      setMusicEnabled(!cur);
      _updMusic();
    }
    function _updMute() {
      var on = getSoundEnabled();
      document.querySelectorAll('.s1-mute').forEach(function (b) {
        b.textContent = on ? '🔊' : '🔇';
        b.classList.toggle('s1-active', on);
      });
    }
    function _updMusic() {
      var on = getMusicEnabled();
      document.querySelectorAll('.s1-music').forEach(function (b) {
        b.textContent = on ? '🎵' : '🎶';
        b.classList.toggle('s1-active', on);
      });
    }
    function _updVol() {
      var v = getVolume();
      document.querySelectorAll('.s1-vol').forEach(function (el) { el.value = v; });
    }
    function _bindVol(id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function () { setVolume(Number(el.value)); });
      // Keep all sliders in sync when one changes
      document.addEventListener('shell:gui:volumeChanged', function () { _updVol(); });
    }
    function _updLang() {
      var label = shell.lang === 'zh' ? 'EN' : 'CN';
      document.querySelectorAll('.s1-lang').forEach(function (b) { b.textContent = label; });
    }
    function _updScore() {
      ['s1-sc','s1-sc-e'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.textContent = state.score;
      });
    }

    function _unitSave(id) {
      // parallelUnits: all units unlocked from start (for games where units test
      // different cognitive abilities, not progressive difficulty)
      var defaultUnlocked = cfg.parallelUnits ? true : (String(id) === '1');
      return shell.storage.get(GAME_ID + ':unit:' + id,
        { unlocked: defaultUnlocked, bestScore: null, playCount: 0 });
    }
    function _saveUnit(id, data) {
      shell.storage.set(GAME_ID + ':unit:' + id, data);
    }

    function _fmtTime(ms) {
      var s = Math.floor(ms / 1000), m = Math.floor(s / 60);
      return m > 0
        ? _bispan(m + '分' + (s % 60) + '秒', m + 'm ' + (s % 60) + 's')
        : _bispan(s + '秒', s + 's');
    }
    function _stat(val, label) {
      return '<div class="s1-hstat"><div class="s1-hsval">' + val + '</div>' +
             '<div class="s1-hslbl">' + label + '</div></div>';
    }
    function _bispan(zh, en) {
      return '<span class="zh">' + (zh || '') + '</span>' +
             '<span class="en">' + (en || '') + '</span>';
    }
    function _show(el) { el.classList.remove('s1-hidden'); }
    function _hide(el) { el.classList.add('s1-hidden'); }
  }


  // ── Public shell object ──────────────────────────────────────
  var shell = {
    version:         '1.3.0',
    lang:            storage.get('user:settings:lang', 'en') || 'en',
    t:               t,
    speak:           speak,
    setLang:         setLang,
    registerStrings: registerStrings,
    registerVideoCatalog: registerVideoCatalog,
    loadVideoCatalog: loadVideoCatalog,
    resolveVideo:    resolveVideo,
    createGame:          createGame,
    getVolume:           getVolume,
    setVolume:           setVolume,
    gui:                 buildGuiRuntimeApi(),
    storage:             storage,
    runtime:             createRuntimeLayer(),
    nav:             nav,
    user:            user,
    report:          report
  };

  global.shell = shell;

  autoLoadVideoCatalog();

  // Apply persisted language to <html> on load
  document.documentElement.setAttribute('lang', shell.lang === 'zh' ? 'zh-CN' : 'en');

})(window);
