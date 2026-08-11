/**
 * Math Modeling — Game Logic  (Shell-1)
 * ---------------------------------------------------------
 * Learning Foundation · Math Thinking · Modeling ??
 *
 * Uses shell.createGame() — same engine as Pattern module.
 * Key difference: renderSequence replaces ? with the mystery
 * token so the equation is displayed intact.
 *
 * Stats stored under 'learning-math-modeling' — independent
 * from all other modules (MindSeeds and Learning alike).
 *
 * Depends on: shell.js, data.js (MM_DATA)
 */

shell.createGame({
  id:       'learning-math-modeling',
  theme:    { primary: '#0d9488', primary2: '#065f46' },  // teal — distinct color identity
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
      contentZh: '??????,????????????????',
      contentEn: 'Find equal relationships first, then infer the unknown value in the blank.'
    },
    video: {
      enabled: true,
      videoId: 'learning-math-modeling-intro-001'
    }
  },
  title:    { zh: '?? ????',             en: '?? Modeling' },
  subtitle: { zh: '??????,?????????', en: 'Find equal relationships — plant the seeds of algebraic thinking' },
  passScore: 7,
  units:    MM_DATA.units,

  /**
   * Render the equation.
   * Replaces ? with the red mystery token from shell-1.css.
   * The ?? emoji (Unit 4 & 6 balance questions) renders inline.
   */
  renderSequence: function (q, container) {
    container.innerHTML = q.display
      .replace(/?/g, '<span class="mystery">?</span>');
  },

  /** Option buttons show the candidate numbers. */
  renderOption: function (opt) {
    return String(opt);
  },

  /** Correct when the selected number matches the answer. */
  checkAnswer: function (selected, q) {
    return Number(selected) === q.answer;
  },

  /**
   * Voice: reads the equation aloud, then asks the question.
   * Strips the ?? symbol so TTS doesn't read "scales" emoji name.
   */
  getVoiceText: function (q) {
    var text = q.display
      .replace('??', '')
      .replace(/?/g, shell.lang === 'zh' ? '??' : 'blank')
      .trim();
    return shell.lang === 'zh'
      ? text + ',?????'
      : text + '. What is blank?';
  },

  registerRootGenes: function (ctx) {
    var unit = (ctx && ctx.unit) || {};
    var unitId = String(unit.id || 'u0');
    return [
      'RG.MODELING.EQUATION.RELATION',
      'RG.LEARNING.MATH.MODELING.' + unitId
    ];
  }
});
