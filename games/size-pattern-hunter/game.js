/**
 * Size Pattern Hunter — Game Logic  v1.2.0  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * Pure geometric size perception.
 * No numeric labels, no extra semantic clues.
 * Depends on: shell.js, data.js
 * ─────────────────────────────────────────────────────────
 */

function ensureSizeStyles() {
  if (document.getElementById('sp-style')) return;
  var css = '' +
    '.sp-seq{display:flex;align-items:flex-end;justify-content:center;gap:14px;min-height:108px;padding-bottom:4px;flex-wrap:wrap;}' +
    '.sp-item{display:inline-flex;align-items:flex-end;justify-content:center;min-height:86px;min-width:72px;}' +
    '.sp-q{display:inline-flex;align-items:flex-end;justify-content:center;min-height:86px;min-width:72px;}' +
    '.sp-dot{display:inline-block;border-radius:50%;background:#f59e0b;border:2px solid rgba(120,53,15,.35);box-shadow:none;}' +
    '.sp-s1{width:20px;height:20px;}' +
    '.sp-s2{width:35px;height:35px;}' +
    '.sp-s3{width:50px;height:50px;}' +
    '.sp-s4{width:65px;height:65px;}' +
    '.sp-mystery{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;width:44px;height:44px;border:2px dashed #cbd5e1;color:#64748b;background:#f8fafc;font-size:26px;font-weight:900;line-height:1;}' +
    '.s1-opt{background:#ffffff !important;}' +
    '.s1-opt.s1-correct,.s1-opt.s1-wrong{background:#ffffff !important;color:inherit !important;}' +
    '.s1-opt.s1-correct{border-color:#22c55e !important;}' +
    '.s1-opt.s1-wrong{border-color:#ef4444 !important;}' +
    '@media (max-width:520px){' +
      '.sp-seq{gap:10px;min-height:90px;}' +
      '.sp-item,.sp-q{min-height:72px;min-width:58px;}' +
      '.sp-s1{width:16px;height:16px;}' +
      '.sp-s2{width:28px;height:28px;}' +
      '.sp-s3{width:40px;height:40px;}' +
      '.sp-s4{width:54px;height:54px;}' +
      '.sp-mystery{width:36px;height:36px;font-size:22px;}' +
    '}';
  var styleEl = document.createElement('style');
  styleEl.id = 'sp-style';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
}

function sizeToken(level, className) {
  className = className || '';
  return '<span class="sp-item ' + className + '">' +
    '<span class="sp-dot sp-' + level + '"></span>' +
    '</span>';
}

var _errorLog = {};

ensureSizeStyles();

shell.createGame({
  id: 'size-pattern-hunter',
  theme: { primary: '#f59e0b', primary2: '#ea580c', bg: '#fff7ed' },
  title: { zh: '📏 大小规律', en: '📏 Size Pattern' },
  subtitle: { zh: '看懂大小变化，预测下一步', en: 'Read size changes and predict the next step' },
  passScore: 4,
  units: SPH_DATA.units,

  renderSequence: function (q, container) {
    var html = '<div class="sp-seq">';
    q.sequence.forEach(function (item) {
      html += (item === '?')
        ? '<span class="sp-q"><span class="sp-mystery">?</span></span>'
        : sizeToken(item, 'sp-q');
    });
    html += '</div>';
    container.innerHTML = html;
  },

  renderOption: function (opt) {
    return sizeToken(opt, 'sp-opt');
  },

  checkAnswer: function (selected, q) {
    return String(selected) === String(q.answer);
  },

  onAnswer: function (selected, q, isCorrect) {
    var key = String(selected);
    var type = (q.optionTypes && q.optionTypes[key]) || (isCorrect ? 'correct' : 'random');
    SPH_DATA.units.forEach(function (unit) {
      if (unit.questions.indexOf(q) !== -1) {
        if (!_errorLog[unit.id]) _errorLog[unit.id] = {};
        _errorLog[unit.id][type] = (_errorLog[unit.id][type] || 0) + 1;
      }
    });
  },

  getVoiceText: function (q, idx) {
    return shell.lang === 'zh'
      ? '第' + (idx + 1) + '题，下一个大小是什么？'
      : 'Question ' + (idx + 1) + ', what size comes next?';
  }
});
