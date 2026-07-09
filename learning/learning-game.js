/**
 * learning-game.js  v1.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared infrastructure for ALL standalone Learning game modules.
 *
 * Exposes window.LG with:
 *   LG.speak(text)
 *   LG.saveSession(histPrefix, levelId, score, total, trials)
 *   LG.renderTrialLog(el, trials, getLabelFn)
 *   LG.renderHistorySection(el, histPrefix)
 *   LG.applyLang(lang)
 *   LG.initLang(onChanged?)
 *
 * Also injects the shared CSS for .tlog-* and .hist-* classes so
 * each module's own style.css does not need to duplicate them.
 *
 * Load order in each module's index.html:
 *   <link rel="stylesheet" href="style.css" />
 *   (in body:)
 *   <script src="../../learning-game.js"></script>
 *   <script src="data.js"></script>
 *   <script src="game.js"></script>
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function (global) {
  'use strict';

  // ── Inject shared CSS (trial log + history accordion) ──────────────────────
  var _css = document.createElement('style');
  _css.textContent = [
    /* ── Trial Log ── */
    '.tlog-header{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;',
    'color:#64748b;text-align:left;margin-bottom:8px;padding:0 2px}',
    '.tlog-rows{display:flex;flex-direction:column;gap:5px}',
    '.tlog-row{display:grid;grid-template-columns:22px 1fr 22px 42px;',
    'align-items:center;gap:6px;padding:7px 12px;border-radius:10px}',
    '.tlog-ok{background:#f0fdf4;border:1px solid #bbf7d0}',
    '.tlog-err{background:#fff1f2;border:1px solid #fecdd3}',
    '.tlog-n{font-size:11px;font-weight:700;color:#64748b}',
    '.tlog-label{font-size:13px;font-weight:800;color:#0f172a}',
    '.tlog-icon{font-size:13px;text-align:center}',
    '.tlog-time{font-size:12px;font-weight:700;color:#64748b;text-align:right}',
    '.tlog-footer{margin-top:8px;font-size:12px;font-weight:700;color:#64748b;text-align:center}',
    /* ── History Accordion ── */
    '.hist-toggle{display:flex;justify-content:space-between;align-items:center;',
    'padding:11px 14px;background:#f8fafc;border:1.5px solid #dde8f5;',
    'border-radius:12px;cursor:pointer;font-size:13px;font-weight:800;color:#0f172a;',
    'transition:border-color .15s}',
    '.hist-toggle:hover{border-color:#93c5fd}',
    '.hist-arrow{font-size:11px;color:#64748b}',
    '.hist-body{padding:18px 14px 14px;background:#fff;border:1.5px solid #dde8f5;',
    'border-top:none;border-radius:0 0 12px 12px;margin-top:-6px}',
    '.hist-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}',
    '.hist-stat{text-align:center}',
    '.hstat-val{font-size:18px;font-weight:900;color:#2563eb}',
    '.hstat-lbl{font-size:11px;color:#64748b;font-weight:600;margin-top:2px}'
  ].join('');
  document.head.appendChild(_css);

  // ── Speech ─────────────────────────────────────────────────────────────────
  // Unlock on first user gesture (required on Android Chrome)
  (function () {
    var h = function () {
      if (!window.speechSynthesis) return;
      var u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      speechSynthesis.speak(u);
      speechSynthesis.cancel();
    };
    document.addEventListener('touchstart', h, { once: true, passive: true });
    document.addEventListener('click', h, { once: true });
  }());

  if (window.speechSynthesis) {
    speechSynthesis.addEventListener('voiceschanged', function () {
      speechSynthesis.getVoices();
    });
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    var lang = document.body.getAttribute('data-lang') || 'zh';
    var u = new SpeechSynthesisUtterance(text);
    u.lang  = lang === 'zh' ? 'zh-CN' : 'en-US';
    u.rate  = 0.88;
    u.pitch = 1.1;
    var voices = speechSynthesis.getVoices();
    if (voices.length) {
      var prefix = u.lang.split('-')[0];
      var match  = voices.filter(function (v) {
        return v.lang === u.lang || v.lang.indexOf(prefix) === 0;
      })[0];
      if (match) u.voice = match;
    }
    setTimeout(function () { try { speechSynthesis.speak(u); } catch (e) {} }, 50);
  }

  // ── Session persistence ─────────────────────────────────────────────────────
  /**
   * Save one completed session to localStorage.
   * @param {string}   histPrefix  e.g. 'me:comparison-math:session:'
   * @param {string}   levelId     e.g. 'L1'
   * @param {number}   score       correct answers
   * @param {number}   total       total questions
   * @param {Array}    trials      per-question trial objects
   */
  function saveSession(histPrefix, levelId, score, total, trials) {
    try {
      var ts  = Date.now();
      var rec = { levelId: levelId, score: score, total: total, trials: trials, ts: ts };
      localStorage.setItem(histPrefix + ts, JSON.stringify(rec));
    } catch (e) {}
  }

  // ── Trial log renderer ──────────────────────────────────────────────────────
  /**
   * Render a per-question result table into `el`.
   * @param {Element}  el           target container
   * @param {Array}    trials       array of trial objects with .isCorrect and .timeMs
   * @param {Function} getLabelFn   (trial, isZh) → string for the label column
   */
  function renderTrialLog(el, trials, getLabelFn) {
    if (!el || !trials || !trials.length) return;
    var zh     = (document.body.getAttribute('data-lang') || 'zh') === 'zh';
    var header = zh ? '本次答题详情' : 'Session Details';
    var totalMs = trials.reduce(function (s, t) { return s + (t.timeMs || 0); }, 0);
    var avgMs   = trials.length ? totalMs / trials.length : 0;

    var rows = trials.map(function (t, i) {
      var label = getLabelFn ? getLabelFn(t, zh) : '';
      return (
        '<div class="tlog-row ' + (t.isCorrect ? 'tlog-ok' : 'tlog-err') + '">' +
          '<span class="tlog-n">'     + (i + 1) + '</span>' +
          '<span class="tlog-label">' + label   + '</span>' +
          '<span class="tlog-icon">'  + (t.isCorrect ? '✅' : '❌') + '</span>' +
          '<span class="tlog-time">'  + (t.timeMs / 1000).toFixed(1) + 's</span>' +
        '</div>'
      );
    }).join('');

    var footer = zh
      ? ('总用时 ' + (totalMs / 1000).toFixed(1) + 's · 平均 ' + (avgMs / 1000).toFixed(1) + 's/题')
      : ('Total ' + (totalMs / 1000).toFixed(1) + 's · Avg ' + (avgMs / 1000).toFixed(1) + 's/q');

    el.innerHTML =
      '<div class="tlog-header">' + header + '</div>' +
      '<div class="tlog-rows">'   + rows   + '</div>' +
      '<div class="tlog-footer">' + footer + '</div>';
  }

  // ── History accordion renderer ──────────────────────────────────────────────
  /**
   * Render a collapsible history summary (shown after 2+ sessions).
   * @param {Element} el          target container
   * @param {string}  histPrefix  same prefix used in saveSession
   */
  function renderHistorySection(el, histPrefix) {
    if (!el) return;
    var zh = (document.body.getAttribute('data-lang') || 'zh') === 'zh';
    var sessions = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf(histPrefix) === 0) {
          var r = JSON.parse(localStorage.getItem(key));
          if (r && r.total) sessions.push(r);
        }
      }
    } catch (e) {}
    if (sessions.length < 2) { el.innerHTML = ''; return; }

    var total   = sessions.reduce(function (s, r) { return s + r.total; }, 0);
    var correct = sessions.reduce(function (s, r) { return s + r.score; }, 0);
    var totalMs = sessions.reduce(function (s, r) {
      return s + (r.trials || []).reduce(function (t, tr) { return t + (tr.timeMs || 0); }, 0);
    }, 0);
    var pct   = total ? Math.round(correct / total * 100) : 0;
    var avgMs = total ? totalMs / total : 0;

    var vals = [sessions.length, correct + '/' + total, pct + '%', (avgMs / 1000).toFixed(1) + 's'];
    var lbls = zh
      ? ['完成局数', '答对/总题', '正确率', '平均用时/题']
      : ['Sessions', 'Correct',  'Accuracy', 'Avg/q'];

    var statsHtml = vals.map(function (v, i) {
      return '<div class="hist-stat"><div class="hstat-val">' + v +
             '</div><div class="hstat-lbl">' + lbls[i] + '</div></div>';
    }).join('');

    el.innerHTML =
      '<div class="hist-toggle" id="lg-hist-toggle">' +
        '<span>' + (zh ? '📊 历史总览' : '📊 All History') + ' (' + sessions.length + ')</span>' +
        '<span class="hist-arrow">▼</span>' +
      '</div>' +
      '<div class="hist-body hidden" id="lg-hist-body">' +
        '<div class="hist-stats">' + statsHtml + '</div>' +
      '</div>';

    document.getElementById('lg-hist-toggle').addEventListener('click', function () {
      var body  = el.querySelector('#lg-hist-body');
      var arrow = el.querySelector('.hist-arrow');
      body.classList.toggle('hidden');
      arrow.textContent = body.classList.contains('hidden') ? '▼' : '▲';
    });
  }

  // ── Language helpers ────────────────────────────────────────────────────────
  /**
   * Apply a language choice: update body attribute, html lang, button active states,
   * and persist to localStorage.
   * Assumes button IDs 'btn-lang-zh' and 'btn-lang-en' (override via options).
   */
  function applyLang(lang, opts) {
    opts = opts || {};
    document.body.setAttribute('data-lang', lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    var zhId = opts.zhId || 'btn-lang-zh';
    var enId = opts.enId || 'btn-lang-en';
    var btnZh = document.getElementById(zhId);
    var btnEn = document.getElementById(enId);
    if (btnZh) btnZh.classList.toggle('active', lang === 'zh');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
    localStorage.setItem('mindsevo-lang', lang);
  }

  /**
   * Read persisted language, apply it, and call onChanged(lang) if provided.
   * Returns the resolved language string.
   */
  function initLang(onChanged) {
    var lang = localStorage.getItem('mindsevo-lang') === 'en' ? 'en' : 'zh';
    applyLang(lang);
    if (typeof onChanged === 'function') onChanged(lang);
    return lang;
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  global.LG = {
    speak:                speak,
    saveSession:          saveSession,
    renderTrialLog:       renderTrialLog,
    renderHistorySection: renderHistorySection,
    applyLang:            applyLang,
    initLang:             initLang
  };

}(window));
