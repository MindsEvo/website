/**
 * Math Pattern — Game Logic  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * Learning Foundation · Math Thinking · Pattern 规律
 *
 * Shares shell.createGame() engine with Sprite Pattern Hunter.
 * Stats stored under separate gameId → completely independent history.
 * Depends on: shell.js, data.js (MP_DATA)
 */

shell.createGame({
  id:       'learning-math-pattern',
  theme:    { primary: '#d97706', primary2: '#92400e' },   // amber — distinct from Sprite purple
  title:    { zh: '🔢 数学规律',              en: '🔢 Math Patterns' },
  subtitle: { zh: '在数字中发现规律，训练预测与归纳能力', en: 'Discover patterns in numbers — build prediction & generalization' },
  passScore: 7,
  units:    MP_DATA.units,

  /**
   * Render the number sequence.
   * Uses the same mystery-token style as Sprite Pattern Hunter.
   */
  renderSequence: function (q, container) {
    container.innerHTML = q.seq.map(function (n) {
      return n === '?'
        ? '<span class="mystery">?</span>'
        : '<span>' + n + '</span>';
    }).join(' ');
  },

  /** Each option button shows the number as plain text. */
  renderOption: function (opt) {
    return String(opt);
  },

  /** Correct when selected number equals the answer. */
  checkAnswer: function (selected, q) {
    return Number(selected) === q.answer;
  },

  /**
   * Voice prompt — reads the sequence aloud then asks the question.
   * Independent from Sprite's voice (different sentence structure for math context).
   */
  getVoiceText: function (q) {
    var items = q.seq.map(function (n) {
      return n === '?' ? (shell.lang === 'zh' ? '问号' : 'blank') : String(n);
    });
    return shell.lang === 'zh'
      ? items.join('，') + '。问号是几？'
      : items.join(', ') + '. What is the missing number?';
  }
});
