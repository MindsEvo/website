/**
 * Quantity Pattern Hunter — Game Logic  v1.0.0  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * Concrete quantity relationships without Arabic numerals in UI text.
 * Depends on: shell.js, data.js
 * ─────────────────────────────────────────────────────────
 */

var QPH_ASSETS = {
  apple:  { e: '🍎', zh: '苹果', en: 'apple' },
  fish:   { e: '🐟', zh: '小鱼', en: 'fish' },
  star:   { e: '⭐', zh: '星星', en: 'star' },
  bird:   { e: '🐦', zh: '小鸟', en: 'bird' },
  flower: { e: '🌸', zh: '花朵', en: 'flower' },
  dot:    { e: '●', zh: '圆点', en: 'dot' }
};

function ensureQuantityStyles() {
  if (document.getElementById('qph-style')) return;
  var css = '' +
    '.qph-pack{display:inline-flex;align-items:center;justify-content:center;gap:3px;min-height:42px;min-width:68px;flex-wrap:wrap;padding:4px 6px;border-radius:10px;background:#ffffff;}' +
    '.qph-item{font-size:24px;line-height:1;}' +
    '.qph-empty{display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:900;color:#64748b;line-height:1;}' +
    '.qph-empty-dot{font-size:16px;color:#94a3b8;line-height:1;}' +
    '.qph-row{display:inline-flex;align-items:center;justify-content:center;gap:8px;}' +
    '.qph-label{font-size:11px;color:#64748b;font-weight:800;}' +
    '.qph-opt-wrap{display:flex;flex-direction:column;align-items:center;gap:4px;}' +
    '@media (max-width:520px){' +
      '.qph-pack{min-width:56px;min-height:36px;padding:3px 5px;gap:2px;}' +
      '.qph-item{font-size:20px;}' +
      '.qph-empty{font-size:11px;}' +
      '.qph-empty-dot{font-size:13px;}' +
      '.qph-label{font-size:10px;}' +
    '}';
  var styleEl = document.createElement('style');
  styleEl.id = 'qph-style';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
}

function renderQuantity(count, assetKey) {
  var asset = QPH_ASSETS[assetKey] || QPH_ASSETS.dot;
  if (count === 0) {
    return '<span class="qph-pack"><span class="qph-empty"><span class="qph-empty-dot">○</span><span class="zh">没有了</span><span class="en">empty</span></span></span>';
  }
  var html = '<span class="qph-pack">';
  for (var i = 0; i < count; i++) {
    html += '<span class="qph-item">' + asset.e + '</span>';
  }
  html += '</span>';
  return html;
}

var _errorLog = {};

ensureQuantityStyles();

shell.createGame({
  id: 'quantity-pattern-hunter',
  theme: { primary: '#16a34a', primary2: '#15803d', bg: '#f0fdf4' },
  title: { zh: '🧮 数量规律', en: '🧮 Quantity Pattern' },
  subtitle: { zh: '看懂数量的变化，预测下一步', en: 'Read quantity relationships and predict the next step' },
  passScore: 4,
  units: QPH_DATA.units,

  renderSequence: function (q, container) {
    var html = '<div class="qph-row">';
    q.sequence.forEach(function (item) {
      if (item === '?') {
        html += '<span class="mystery">?</span>';
      } else {
        html += renderQuantity(Number(item), q.asset);
      }
    });
    html += '</div>';
    container.innerHTML = html;
  },

  renderOption: function (optKey, q) {
    var count = q.optionDefs[optKey];
    var asset = QPH_ASSETS[q.asset] || QPH_ASSETS.dot;
    var labelZh = count === 0 ? '没有了' : asset.zh;
    var labelEn = count === 0 ? 'empty' : asset.en;
    return '<span class="qph-opt-wrap">' +
      renderQuantity(Number(count), q.asset) +
      '<span class="qph-label"><span class="zh">' + labelZh + '</span><span class="en">' + labelEn + '</span></span>' +
      '</span>';
  },

  checkAnswer: function (selected, q) {
    return String(selected) === String(q.answer);
  },

  onAnswer: function (selected, q, isCorrect) {
    var key = String(selected);
    var type = (q.optionTypes && q.optionTypes[key]) || (isCorrect ? 'correct' : 'pattern_misread');
    var pType = q.patternType || 'unknown';
    if (!_errorLog[pType]) _errorLog[pType] = {};
    _errorLog[pType][type] = (_errorLog[pType][type] || 0) + 1;
  },

  getVoiceText: function (q, idx) {
    return shell.lang === 'zh'
      ? '看图形，问号处应该是什么？'
      : 'Look at the objects and choose what comes next.';
  }
});
