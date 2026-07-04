/**
 * Mixed Pattern Hunter — Game Logic  v1.0.0  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * Architecture: independent orthogonal dimension composition.
 * Each dimension uses its own rendering rule — NO cross-dimension
 * relationships are allowed (enforced by data design, not code).
 *
 * Shell-1 hooks used:
 *   onCorrect(q, actsEl, unit) → injects Patterns Detected reveal
 *   onResult(stats, rmsgEl)   → injects Thinking Score card
 *
 * Depends on: shell.js, data.js
 * ─────────────────────────────────────────────────────────
 */

// ── Color palette (same as color-pattern-hunter) ──────────────
var MXP_COLORS = {
  red:    '#ef4444',
  blue:   '#3b82f6',
  yellow: '#eab308',
  green:  '#22c55e',
  purple: '#a855f7',
  orange: '#f97316'
};

// ── Direction arrows ──────────────────────────────────────────
var MXP_DIRS = { left: '←', right: '→', up: '↑', down: '↓' };

// ── Size in px for dot radius ─────────────────────────────────
var MXP_DOT_PX = { s1: 18, s2: 30, s3: 42, s4: 54 };

// ── Arrow font sizes for size+direction ──────────────────────
var MXP_ARROW_EM = { s1: '1.4em', s2: '2em', s3: '2.6em', s4: '3.4em' };

function ensureMxStyles() {
  if (document.getElementById('mx-style')) return;
  var css = '' +
    '.mx-seq{display:flex;align-items:center;justify-content:center;gap:10px;' +
      'min-height:88px;flex-wrap:wrap;padding:4px 0;}' +
    '.mx-card{display:inline-flex;align-items:center;justify-content:center;' +
      'flex-wrap:wrap;min-width:56px;min-height:56px;gap:3px;padding:3px;}' +
    '.mx-arrow{font-weight:900;line-height:1;font-style:normal;}' +
    '.mx-reveal{background:#fdf4ff;border:1.5px solid #e9d5ff;border-radius:12px;' +
      'padding:10px 14px;margin-bottom:8px;width:100%;box-sizing:border-box;text-align:left;}' +
    '.mx-reveal-title{font-size:12px;font-weight:900;color:#7e22ce;margin-bottom:5px;' +
      'letter-spacing:.4px;text-transform:uppercase;}' +
    '.mx-reveal-dim{display:flex;align-items:center;gap:6px;font-size:14px;' +
      'font-weight:700;color:#374151;margin:3px 0;}' +
    '.mx-check{color:#16a34a;font-size:15px;flex-shrink:0;}' +
    '.mx-thinking{margin-top:12px;background:#fffbeb;border:1.5px solid #fcd34d;' +
      'border-radius:12px;padding:14px 18px;}' +
    '.mx-thinking-title{font-size:13px;font-weight:900;color:#92400e;margin-bottom:10px;' +
      'text-align:center;letter-spacing:.5px;}' +
    '.mx-bar-row{display:flex;align-items:center;gap:8px;margin:6px 0;}' +
    '.mx-bar-label{min-width:80px;font-size:13px;font-weight:700;color:#78350f;}' +
    '.mx-bar-track{flex:1;height:10px;background:#fef3c7;border-radius:6px;overflow:hidden;}' +
    '.mx-bar-fill{height:100%;background:linear-gradient(90deg,#f59e0b,#d97706);' +
      'border-radius:6px;transition:width .6s ease;}' +
    '.mx-bar-pct{min-width:36px;font-size:13px;font-weight:800;color:#92400e;text-align:right;}' +
    '@media (max-width:520px){' +
      '.mx-seq{gap:7px;min-height:76px;}' +
      '.mx-card{min-width:44px;min-height:44px;}' +
      '.mx-reveal{padding:8px 10px;}' +
      '.mx-reveal-dim{font-size:13px;}' +
      '.mx-thinking{padding:11px 14px;}' +
      '.mx-bar-label{min-width:68px;font-size:12px;}' +
      '.mx-bar-pct{font-size:12px;}' +
    '}';
  var el = document.createElement('style');
  el.id = 'mx-style';
  el.textContent = css;
  document.head.appendChild(el);
}

// ── Composite card renderers ───────────────────────────────────

function mxRenderColorSize(d) {
  var px = MXP_DOT_PX[d.size] || 30;
  var hex = MXP_COLORS[d.color] || '#94a3b8';
  return '<span class="s1-cdot" style="background:' + hex + ';width:' + px + 'px;height:' + px + 'px;flex-shrink:0;"></span>';
}

function mxRenderColorQty(d) {
  var hex = MXP_COLORS[d.color] || '#94a3b8';
  var html = '';
  for (var i = 0; i < d.quantity; i++) {
    html += '<span class="s1-cdot" style="background:' + hex + ';width:22px;height:22px;flex-shrink:0;"></span>';
  }
  return html;
}

function mxRenderColorDir(d) {
  var hex = MXP_COLORS[d.color] || '#94a3b8';
  return '<span class="mx-arrow" style="font-size:32px;color:' + hex + ';">' + (MXP_DIRS[d.direction] || '?') + '</span>';
}

function mxRenderSizeQty(d) {
  var px = MXP_DOT_PX[d.size] || 30;
  var html = '';
  for (var i = 0; i < d.quantity; i++) {
    html += '<span class="s1-cdot" style="background:#f59e0b;width:' + px + 'px;height:' + px + 'px;flex-shrink:0;"></span>';
  }
  return html;
}

function mxRenderSizeDir(d) {
  var em = MXP_ARROW_EM[d.size] || '2em';
  return '<span class="mx-arrow" style="font-size:' + em + ';color:#7c3aed;">' + (MXP_DIRS[d.direction] || '?') + '</span>';
}

function mxRenderQtyDir(d) {
  var arrow = MXP_DIRS[d.direction] || '?';
  var html = '';
  for (var i = 0; i < d.quantity; i++) {
    html += '<span class="mx-arrow" style="font-size:26px;color:#0ea5e9;">' + arrow + '</span>';
  }
  return html;
}

function mxRenderCard(data, dims) {
  if (data === '?') return '<span class="mystery">?</span>';
  var key = dims.slice().sort().join('+');
  var inner = '';
  switch (key) {
    case 'color+size':      inner = mxRenderColorSize(data); break;
    case 'color+quantity':  inner = mxRenderColorQty(data);  break;
    case 'color+direction': inner = mxRenderColorDir(data);  break;
    case 'quantity+size':   inner = mxRenderSizeQty(data);   break;
    case 'direction+size':  inner = mxRenderSizeDir(data);   break;
    case 'direction+quantity': inner = mxRenderQtyDir(data); break;
    default: inner = String(data);
  }
  return '<span class="mx-card">' + inner + '</span>';
}

// ── Per-question diagnostic tracking ──────────────────────────
// Records first-attempt dimension results per unit session
var _mxSession = {};   // { unitId_qIdx: { dim1, dim2, integration } }
var _mxUnitCtx = null; // current unit object

function mxTrackAnswer(selected, q, unit) {
  if (!unit || !q) return;
  var qIdx = unit.questions.indexOf(q);
  var key = unit.id + '_' + qIdx;
  if (_mxSession.hasOwnProperty(key)) return; // only first attempt
  var ot = q.optionTypes && q.optionTypes[selected];
  _mxSession[key] = {
    dim1:        (ot === 'both_correct' || ot === 'dim2_wrong'),
    dim2:        (ot === 'both_correct' || ot === 'dim1_wrong'),
    integration: (ot === 'both_correct')
  };
}

function mxComputeScores(unit) {
  var obsOk = 0, obsTotal = 0, intOk = 0, intTotal = 0;
  unit.questions.forEach(function (q, idx) {
    var key = unit.id + '_' + idx;
    var t = _mxSession[key];
    if (t) {
      obsOk += (t.dim1 ? 1 : 0) + (t.dim2 ? 1 : 0);
      obsTotal += 2;
      intOk    += (t.integration ? 1 : 0);
      intTotal += 1;
    }
  });
  return {
    obs: obsTotal > 0 ? Math.round(obsOk / obsTotal * 100) : 0,
    int: intTotal > 0 ? Math.round(intOk / intTotal * 100) : 0
  };
}

// ── Shell-1 game config ───────────────────────────────────────
ensureMxStyles();

shell.createGame({
  id:            'mixed-pattern-hunter',
  parallelUnits: true,
  theme:         { primary: '#ec4899', primary2: '#be185d', bg: '#fdf2f8' },
  title:    { zh: '🎯 综合规律',          en: '🎯 Mixed Pattern' },
  subtitle: { zh: '同时看懂两种规律',      en: 'Two Patterns, One Mind' },
  passScore: 3,
  units:    MXP_DATA.units,

  renderSequence: function (q, container, unit) {
    _mxUnitCtx = unit;
    var dims = q.dimensions || unit.dimensions || [];
    var html = '<div class="mx-seq">';
    q.cells.forEach(function (cell) {
      html += mxRenderCard(cell, dims);
    });
    html += '</div>';
    container.innerHTML = html;
  },

  renderOption: function (opt, q, unit) {
    var dims = q.dimensions || (unit && unit.dimensions) || [];
    var def  = q.optionDefs && q.optionDefs[opt];
    if (!def) return String(opt);
    return mxRenderCard(def, dims);
  },

  checkAnswer: function (selected, q) {
    return selected === q.answer;
  },

  onAnswer: function (selected, q, isCorrect) {
    mxTrackAnswer(selected, q, _mxUnitCtx);
  },

  // Patterns Detected reveal (injected above Next button)
  onCorrect: function (q, actsEl, unit) {
    var zh = shell.lang === 'zh';
    var dim1Name = zh ? (unit.dim1ZhName || '') : (unit.dim1EnName || '');
    var dim2Name = zh ? (unit.dim2ZhName || '') : (unit.dim2EnName || '');
    var dim1Rule = zh ? (q.dim1Rule && q.dim1Rule.zh) : (q.dim1Rule && q.dim1Rule.en);
    var dim2Rule = zh ? (q.dim2Rule && q.dim2Rule.zh) : (q.dim2Rule && q.dim2Rule.en);

    var titleZh = '🔍 发现的规律';
    var titleEn = '🔍 Patterns Detected';

    var reveal = document.createElement('div');
    reveal.className = 'mx-reveal';
    reveal.innerHTML =
      '<div class="mx-reveal-title"><span class="zh">' + titleZh + '</span><span class="en">' + titleEn + '</span></div>' +
      '<div class="mx-reveal-dim"><span class="mx-check">✓</span><span>' + dim1Name + (dim1Rule ? ' — <em>' + dim1Rule + '</em>' : '') + '</span></div>' +
      '<div class="mx-reveal-dim"><span class="mx-check">✓</span><span>' + dim2Name + (dim2Rule ? ' — <em>' + dim2Rule + '</em>' : '') + '</span></div>';
    actsEl.appendChild(reveal);
  },

  // Thinking Score card (injected after result rmsg)
  onResult: function (stats, rmsgEl) {
    if (!_mxUnitCtx) return;
    var scores = mxComputeScores(_mxUnitCtx);
    var zh = shell.lang === 'zh';

    var obsLabel  = zh ? '观察力' : 'Observation';
    var intLabel  = zh ? '综合力' : 'Integration';
    var titleText = zh ? '🧠 思维评分' : '🧠 Thinking Score';

    var card = document.createElement('div');
    card.className = 'mx-thinking';
    card.innerHTML =
      '<div class="mx-thinking-title">' + titleText + '</div>' +
      mxBar(obsLabel, scores.obs) +
      mxBar(intLabel, scores.int);
    rmsgEl.insertAdjacentElement('afterend', card);
  },

  getVoiceText: function (q, idx) {
    return shell.lang === 'zh'
      ? '第' + (idx + 1) + '题，同时找出两个维度的规律。'
      : 'Question ' + (idx + 1) + '. Find the pattern in both dimensions.';
  }
});

function mxBar(label, pct) {
  return '<div class="mx-bar-row">' +
    '<span class="mx-bar-label">' + label + '</span>' +
    '<div class="mx-bar-track"><div class="mx-bar-fill" style="width:' + pct + '%"></div></div>' +
    '<span class="mx-bar-pct">' + pct + '%</span>' +
    '</div>';
}
