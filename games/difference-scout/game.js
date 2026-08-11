'use strict';

(function injectDifferenceScoutStyles() {
  if (document.getElementById('ds-shell-style')) return;
  var s = document.createElement('style');
  s.id = 'ds-shell-style';
  s.textContent = [
    '.ds-wrap{display:grid;gap:10px;justify-items:center;}',
    '.ds-q{font-size:22px;font-weight:900;color:#0f172a;line-height:1.3;text-align:center;}',
    '.ds-sub{font-size:13px;font-weight:700;color:#64748b;text-align:center;}',
    '.ds-boards{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:460px;}',
    '.ds-board{background:#fff;border:1px solid #dbeafe;border-radius:12px;padding:8px;display:grid;gap:8px;}',
    '.ds-title{font-size:12px;font-weight:800;color:#475569;text-align:center;}',
    '.ds-row{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:6px;}',
    '.ds-cell{border:1px solid #dbeafe;background:#f8fafc;border-radius:10px;padding:6px 4px;display:grid;gap:2px;justify-items:center;}',
    '.ds-icon{font-size:21px;line-height:1;}',
    '.ds-idx{font-size:11px;font-weight:800;color:#64748b;}',
    '.ds-opt{font-size:26px;font-weight:900;color:#0f172a;line-height:1;}',
    '.ds-opt-sub{display:block;font-size:12px;font-weight:700;color:#64748b;margin-top:4px;}'
  ].join('');
  document.head.appendChild(s);
}());

function renderStrip(items) {
  var html = '<div class="ds-row">';
  for (var i = 0; i < items.length; i++) {
    html += '<div class="ds-cell">' +
      '<span class="ds-icon">' + items[i] + '</span>' +
      '<span class="ds-idx">' + (i + 1) + '</span>' +
      '</div>';
  }
  html += '</div>';
  return html;
}

shell.createGame({
  id: 'difference-scout',
  theme: { primary: '#7c3aed', primary2: '#6d28d9', bg: '#f5f3ff' },
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
      contentZh: '左右两列只有一格不同，按序号选出差异位置。',
      contentEn: 'Only one slot differs between left and right strips. Pick its index.'
    },
    video: {
      enabled: true,
      videoId: 'mindseeds-difference-scout-intro-001'
    }
  },
  title: { zh: '🕵️ 找不同侦探', en: '🕵️ Difference Scout' },
  subtitle: { zh: '比较左右图列，锁定唯一差异', en: 'Compare both strips and lock the single mismatch' },
  passScore: 3,
  units: DS_DATA.units,

  renderSequence: function (q, container) {
    container.innerHTML = '<div class="ds-wrap">' +
      '<div class="ds-q"><span class="zh">哪一格不一样？</span><span class="en">Which slot is different?</span></div>' +
      '<div class="ds-sub"><span class="zh">观察左右对应位置，找到唯一不同点</span><span class="en">Compare paired positions and find the only mismatch</span></div>' +
      '<div class="ds-boards">' +
        '<div class="ds-board"><div class="ds-title"><span class="zh">左边</span><span class="en">Left</span></div>' + renderStrip(q.left) + '</div>' +
        '<div class="ds-board"><div class="ds-title"><span class="zh">右边</span><span class="en">Right</span></div>' + renderStrip(q.right) + '</div>' +
      '</div>' +
    '</div>';
  },

  renderOption: function (opt) {
    return '<div class="ds-opt">' + opt + '<span class="ds-opt-sub"><span class="zh">号位置</span><span class="en">slot</span></span></div>';
  },

  checkAnswer: function (selected, q) {
    return Number(selected) === Number(q.answer);
  },

  getVoiceText: function (q, idx) {
    return shell.lang === 'zh'
      ? '第' + (idx + 1) + '题，哪一格不一样？'
      : 'Question ' + (idx + 1) + ', which slot is different?';
  },

  registerRootGenes: function (ctx) {
    var unit = (ctx && ctx.unit) || {};
    var unitId = String(unit.id || 'u0');
    return [
      'RG.LOGIC.COMPARISON.BASIC',
      'RG.MINDSEEDS.DIFFERENCE_SCOUT.' + unitId
    ];
  }
});
