/**
 * Math Logic — Game Logic  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * Learning Foundation · Math Thinking · Logic 逻辑
 *
 * renderSequence: displays a text premise + question instead of
 *   a number sequence. Injects extra CSS to make the text readable
 *   inside the s1-seq yellow card.
 * renderOption: shows bilingual option labels.
 * checkAnswer: string comparison (options are text labels).
 *
 * Stats stored under 'learning-math-logic' — independent from
 * all other modules.
 *
 * Depends on: shell.js, data.js (ML_DATA)
 */

// ── Inject CSS so text fits inside the s1-seq card ───────────────────────────
(function () {
  var s = document.createElement('style');
  s.textContent = [
    '.s1-seq {',
    '  font-size: 15px !important;',
    '  line-height: 1.75 !important;',
    '  padding: 18px 20px !important;',
    '  text-align: left !important;',
    '  letter-spacing: 0 !important;',
    '  min-height: 90px !important;',
    '}',
    '.lm-premise {',
    '  color: #334155;',
    '  margin-bottom: 10px;',
    '}',
    '.lm-question {',
    '  font-size: 16px !important;',
    '  font-weight: 900 !important;',
    '  color: #0f172a !important;',
    '  padding-top: 8px;',
    '  border-top: 1px solid rgba(0,0,0,0.10);',
    '}',
    '.s1-opt {',
    '  font-size: 14px !important;',
    '  min-height: 48px !important;',
    '  text-align: left !important;',
    '  padding: 10px 14px !important;',
    '  line-height: 1.5 !important;',
    '}'
  ].join('\n');
  document.head.appendChild(s);
}());

shell.createGame({
  id:       'learning-math-logic',
  theme:    { primary: '#7c3aed', primary2: '#4c1d95' },  // deep purple — logic identity
  title:    { zh: '🧠 逻辑推理',             en: '🧠 Logic Reasoning' },
  subtitle: { zh: '从线索出发，用推理找到唯一正确的答案', en: 'Follow the clues — use reasoning to find the one correct answer' },
  passScore: 7,
  units:    ML_DATA.units,

  /**
   * Render the premise (gray) and question (bold) inside the sequence area.
   * Uses premiseZh/premiseEn and questionZh/questionEn from the question object.
   */
  renderSequence: function (q, container) {
    var zh = shell.lang === 'zh';
    container.innerHTML =
      '<div class="lm-premise">' + (zh ? q.premiseZh : q.premiseEn) + '</div>' +
      '<div class="lm-question">' + (zh ? q.questionZh : q.questionEn) + '</div>';
  },

  /**
   * Display option labels bilingually.
   * `options` holds Chinese values used for comparison;
   * `optionsEn` holds the parallel English display labels.
   */
  renderOption: function (opt, q) {
    if (shell.lang === 'zh') return opt;
    var idx = q.options.indexOf(opt);
    return (q.optionsEn && q.optionsEn[idx] !== undefined) ? q.optionsEn[idx] : opt;
  },

  /** Correct when the selected option text matches q.answer exactly. */
  checkAnswer: function (selected, q) {
    return selected === q.answer;
  },

  /** Read the premise and question aloud. */
  getVoiceText: function (q) {
    return shell.lang === 'zh'
      ? q.premiseZh + '。' + q.questionZh
      : q.premiseEn + '. ' + q.questionEn;
  }
});
