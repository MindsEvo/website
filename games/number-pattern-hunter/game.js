/**
 * Number Pattern Hunter — Game Logic  v2.0.0  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * Games only implement renderSequence, renderOption, checkAnswer.
 * All UI, state management, and storage are handled by shell.createGame().
 * Depends on: shell.js, data.js
 * ─────────────────────────────────────────────────────────
 */

shell.createGame({
  id:       'number-pattern-hunter',
  theme:    { primary: '#667eea', primary2: '#764ba2' },
  title:    { zh: '🎯 找规律',              en: '🎯 Pattern Hunter' },
  subtitle: { zh: '循序渐进，掌握数字规律', en: 'Master number patterns step by step' },
  passScore: 8,
  units:    NPH_DATA.units,

  // Render the number sequence into the container element
  renderSequence: function (q, container) {
    container.innerHTML = q.seq.map(function (n) {
      return n === '?'
        ? '<span class="mystery">?</span>'
        : '<span>' + n + '</span>';
    }).join(' ');
  },

  // Return the HTML content for each option button
  renderOption: function (opt) {
    return String(opt);
  },

  // Return true if the selected option is correct
  checkAnswer: function (selected, q) {
    return Number(selected) === q.answer;
  },

  // Return the voice prompt text for each question
  getVoiceText: function (q) {
    var items = q.seq.map(function (n) {
      return n === '?' ? (shell.lang === 'zh' ? '问号' : 'blank') : String(n);
    });
    return shell.lang === 'zh'
      ? items.join('，') + '，问号是几？'
      : items.join(', ') + '. What is the blank?';
  }
});
