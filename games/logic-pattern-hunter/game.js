﻿/**
 * Logic Pattern Hunter — Game Logic  v1.1.0  (Unified Shell GUI)
 * ─────────────────────────────────────────────────────────
 * Uses shell.createGame() with a reasoning-style renderSequence.
 * GUI shell is unified with other MindSeeds games.
 * Depends on: shell.js, data.js
 * ─────────────────────────────────────────────────────────
 */

(function injectLogicStyles() {
  if (document.getElementById('lph-style')) return;
  var s = document.createElement('style');
  s.id = 'lph-style';
  s.textContent = [
    '.lph-wrap{display:grid;gap:10px;text-align:left;width:100%;}',
    '.lph-premise{display:flex;gap:8px;align-items:flex-start;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;}',
    '.lph-num{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:#ede9fe;color:#6d28d9;font-size:12px;font-weight:900;flex-shrink:0;margin-top:1px;}',
    '.lph-text{color:#334155;font-size:14px;line-height:1.55;font-weight:700;}',
    '.lph-q{background:#faf5ff;border:1px solid #ddd6fe;border-radius:10px;padding:10px 12px;color:#3b0764;font-size:15px;font-weight:900;line-height:1.5;}'
  ].join('');
  document.head.appendChild(s);
}());

var _lpErrorLog = {};

shell.createGame({
  id:        'logic-pattern-hunter',
  theme:     { primary: '#7c3aed', primary2: '#6d28d9', bg: '#f5f3ff' },
  gui: {
    header: { show: true, showBack: true },
    language: { enabled: true, default: 'en' },
    audio: {
      music: { enabled: true, defaultOn: false },
      sound: { enabled: true, defaultOn: true }
    },
    history: { enabled: true },
    help: {
      enabled: true,
      contentZh: '先读清前提条件，再逐项排除不符合逻辑的选项。',
      contentEn: 'Read premises carefully, then eliminate options that violate logic.'
    },
    video: {
      enabled: true,
      videoId: 'mindseeds-logic-pattern-intro-001'
    }
  },
  title:    { zh: '🧠 逻辑推理', en: '🧠 Logic Pattern' },
  subtitle: { zh: '读懂条件，推导结论', en: 'Read the clues and find the answer' },
  passScore: 4,
  units:     LP_DATA.units,

  renderSequence: function (q, container) {
    var premises = Array.isArray(q.premises) ? q.premises : [];
    var premiseHtml = premises.map(function (p, i) {
      return '<div class="lph-premise">' +
        '<span class="lph-num">' + (i + 1) + '</span>' +
        '<span class="lph-text"><span class="zh">' + (p.zh || '') + '</span><span class="en">' + (p.en || '') + '</span></span>' +
      '</div>';
    }).join('');

    container.innerHTML = '<div class="lph-wrap">' +
      premiseHtml +
      '<div class="lph-q">' +
        '<span class="zh">' + (q.questionZh || '') + '</span>' +
        '<span class="en">' + (q.questionEn || '') + '</span>' +
      '</div>' +
    '</div>';
  },

  renderOption: function (opt, q) {
    var def = q.optionDefs && q.optionDefs[opt];
    if (!def) return String(opt);
    return '<span class="zh">' + def.zh + '</span><span class="en">' + def.en + '</span>';
  },

  checkAnswer: function (selected, q) {
    return selected === q.answer;
  },

  onAnswer: function (selected, q, isCorrect) {
    var type = (q.optionTypes && q.optionTypes[selected]) || (isCorrect ? 'correct' : 'unknown');
    var pType = q.pattern_type || 'unknown';
    if (!_lpErrorLog[pType]) _lpErrorLog[pType] = {};
    _lpErrorLog[pType][type] = (_lpErrorLog[pType][type] || 0) + 1;
  },

  getVoiceText: function (q) {
    var parts = (q.premises || []).map(function (p) {
      return shell.lang === 'zh' ? p.zh : p.en;
    });
    var question = shell.lang === 'zh' ? (q.questionZh || '') : (q.questionEn || '');
    return parts.join(shell.lang === 'zh' ? '，' : '. ') + (shell.lang === 'zh' ? '。' : '. ') + question;
  },

  registerRootGenes: function () {
    // Ability genes only. The unit location used to be appended here as a
    // third gene; it now travels as unitId in the report, so the same ability
    // trained in different units lands on one radar axis instead of many.
    // See docs/rootgene/ROOTGENE-FRAMEWORK.md §5.
    return [
      'RG.LOGIC.REASONING.BASIC'
    ];
  }
});
