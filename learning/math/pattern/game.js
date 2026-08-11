﻿/**
 * Math Pattern — Game Logic  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * Learning Foundation · Math Thinking · Pattern 规律
 *
 * Shares shell.createGame() engine with MindSeeds Pattern Hunter.
 * Stats stored under separate gameId → completely independent history.
 * Depends on: shell.js, data.js (MP_DATA)
 */

shell.createGame({
  id:       'learning-math-pattern',
  theme:    { primary: '#d97706', primary2: '#92400e' },   // amber — distinct from MindSeeds purple
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
      contentZh: '先识别重复节奏，再判断数字是递增、递减还是交替。',
      contentEn: 'Find the repeating rhythm first, then decide whether the numbers increase, decrease, or alternate.'
    },
    video: {
      enabled: true,
      videoId: 'learning-math-pattern-intro-001'
    }
  },
  title:    { zh: '🔢 数学规律',              en: '🔢 Math Patterns' },
  subtitle: { zh: '在数字中发现规律，训练预测与归纳能力', en: 'Discover patterns in numbers — build prediction & generalization' },
  passScore: 7,
  units:    MP_DATA.units,

  /**
   * Render the number sequence.
  * Uses the same mystery-token style as MindSeeds Pattern Hunter.
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
  * Independent from MindSeeds voice (different sentence structure for math context).
   */
  getVoiceText: function (q) {
    var items = q.seq.map(function (n) {
      return n === '?' ? (shell.lang === 'zh' ? '问号' : 'blank') : String(n);
    });
    return shell.lang === 'zh'
      ? items.join('，') + '。问号是几？'
      : items.join(', ') + '. What is the missing number?';
  },

  // Stage-3 RootGene pilot: attach core and unit-level RootGene IDs.
  registerRootGenes: function (ctx) {
    var unit = (ctx && ctx.unit) || {};
    var unitId = String(unit.id || 'u0');
    return [
      'RG.PATTERN.SEQUENCE.BASIC',
      'RG.LEARNING.MATH.PATTERN.' + unitId
    ];
  }
});
