/**
 * Logic Pattern Hunter — Game Logic  v1.0.0  (Shell-2)
 * ─────────────────────────────────────────────────────────
 * Uses shell.createReasoningGame().
 * Shell-2 renders premises + question automatically from data.
 * Game only provides: renderOption, checkAnswer.
 * Depends on: shell.js, data.js
 * ─────────────────────────────────────────────────────────
 */

var _lpErrorLog = {};

shell.createReasoningGame({
  id:        'logic-pattern-hunter',
  theme:     { primary: '#7c3aed', primary2: '#6d28d9', bg: '#f5f3ff' },
  title:    { zh: '🧠 逻辑推理', en: '🧠 Logic Pattern' },
  subtitle: { zh: '读懂条件，推导结论', en: 'Read the clues and find the answer' },
  passScore: 4,
  units:     LP_DATA.units,

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
  }
});
