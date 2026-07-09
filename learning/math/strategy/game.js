/**
 * Math Strategy — Game Logic  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * Learning Foundation · Math Thinking · Strategy 策略
 *
 * Same shell approach as Logic module:
 *   - CSS injected to make text readable inside s1-seq
 *   - renderSequence: displays premiseZh/En + questionZh/En
 *   - renderOption: bilingual labels (options = Chinese keys,
 *                   optionsEn = English display)
 *   - checkAnswer: exact string match against options
 *
 * gameId: 'learning-math-strategy' — stats fully independent.
 * Theme: orange-red — distinct visual identity.
 *
 * Depends on: shell.js, data.js (MS_DATA)
 */

// ── Inject CSS for text-based sequence display ────────────────────────────────
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
  id:       'learning-math-strategy',
  theme:    { primary: '#ea580c', primary2: '#9a3412' },  // orange-red — strategy identity
  title:    { zh: '🧭 策略思维',             en: '🧭 Strategic Thinking' },
  subtitle: { zh: '先规划，后行动——好的策略让结果更好', en: 'Plan before you act — a good strategy leads to a better outcome' },
  passScore: 7,
  units:    MS_DATA.units,

  /** Display premise (gray context) + question (bold). */
  renderSequence: function (q, container) {
    var zh = shell.lang === 'zh';
    container.innerHTML =
      '<div class="lm-premise">' + (zh ? q.premiseZh : q.premiseEn) + '</div>' +
      '<div class="lm-question">' + (zh ? q.questionZh : q.questionEn) + '</div>';
  },

  /**
   * Show bilingual option labels.
   * `options` = Chinese keys used for comparison.
   * `optionsEn` = parallel English display labels.
   */
  renderOption: function (opt, q) {
    if (shell.lang === 'zh') return opt;
    var idx = q.options.indexOf(opt);
    return (q.optionsEn && q.optionsEn[idx] !== undefined) ? q.optionsEn[idx] : opt;
  },

  /** Correct when selected text matches q.answer exactly. */
  checkAnswer: function (selected, q) {
    return selected === q.answer;
  },

  /** Voice: read premise then question. */
  getVoiceText: function (q) {
    return shell.lang === 'zh'
      ? q.premiseZh + '。' + q.questionZh
      : q.premiseEn + '. ' + q.questionEn;
  }
});
