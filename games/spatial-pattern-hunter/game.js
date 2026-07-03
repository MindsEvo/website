/**
 * Spatial Pattern Hunter — Game Logic  v1.0.0  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * Spatial relationship only:
 * - position_swap
 * - shape_rotation
 *
 * Excludes trajectory movement and single-symbol orientation rotation.
 * Depends on: shell.js, data.js
 * ─────────────────────────────────────────────────────────
 */

function ensureSpatialStyles() {
  if (document.getElementById('spa-style')) return;
  var css = '' +
    '.spa-row{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;}' +
    '.spa-step{display:flex;align-items:center;justify-content:center;}' +
    '.spa-sep{font-size:18px;font-weight:900;color:#64748b;line-height:1;}' +
    '.spa-grid{display:grid;grid-template-columns:repeat(3,26px);grid-template-rows:repeat(3,26px);border:2px solid #94a3b8;border-radius:8px;background:#fff;overflow:hidden;}' +
    '.spa-cell{width:26px;height:26px;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;display:flex;align-items:center;justify-content:center;color:#0f172a;line-height:1;}' +
    '.spa-sym{font-size:18px;font-weight:900;display:inline-block;transform:translateY(-0.5px);}' +
    '.spa-cell:nth-child(3n){border-right:none;}' +
    '.spa-cell:nth-child(n+7){border-bottom:none;}' +
    '.spa-q{font-size:20px;font-weight:900;color:#ef4444;}' +
    '.spa-seq-grid{transform:scale(1.04);}' +
    '.spa-opt-grid{transform:scale(1.12);}' +
    '@media (max-width:520px){' +
      '.spa-grid{grid-template-columns:repeat(3,20px);grid-template-rows:repeat(3,20px);}' +
      '.spa-cell{width:20px;height:20px;}' +
      '.spa-sym{font-size:15px;}' +
      '.spa-opt-grid{transform:scale(1.06);}' +
      '.spa-seq-grid{transform:scale(1);}' +
      '.spa-sep{font-size:16px;}' +
    '}';
  var styleEl = document.createElement('style');
  styleEl.id = 'spa-style';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
}

function emptyBoard() {
  var b = [];
  for (var r = 0; r < 3; r++) {
    var row = [];
    for (var c = 0; c < 3; c++) row.push('');
    b.push(row);
  }
  return b;
}

function slotsByOrientation(orientation) {
  return orientation === 'vertical'
    ? [[0, 1], [2, 1]]
    : [[1, 0], [1, 2]];
}

function renderGrid(board, extraClass) {
  extraClass = extraClass || '';
  var html = '<div class="spa-grid ' + extraClass + '">';
  for (var r = 0; r < 3; r++) {
    for (var c = 0; c < 3; c++) {
      var val = board[r][c] || '';
      if (val && val.indexOf('<') === -1) {
        val = '<span class="spa-sym">' + val + '</span>';
      }
      html += '<span class="spa-cell">' + val + '</span>';
    }
  }
  html += '</div>';
  return html;
}

function boardForSwapState(q, stateKey) {
  var board = emptyBoard();
  var slots = slotsByOrientation(q.orientation);
  var symbols = q.symbols || {};

  var a = stateKey && stateKey.length > 0 ? stateKey.charAt(0) : 'A';
  var b = stateKey && stateKey.length > 1 ? stateKey.charAt(1) : 'B';

  board[slots[0][0]][slots[0][1]] = symbols[a] || '';
  board[slots[1][0]][slots[1][1]] = symbols[b] || '';
  return board;
}

function baseShapeCells(kind) {
  if (kind === 'line2') return [[1, 0], [1, 1]];
  return [[1, 1], [1, 2], [2, 1]]; // L3 default
}

function rotateCw(cell) {
  return [cell[1], 2 - cell[0]];
}

function boardForRotation(kind, angle) {
  var board = emptyBoard();
  var turns = ((Number(angle) % 360) + 360) % 360;
  turns = Math.floor(turns / 90);
  var cells = baseShapeCells(kind).map(function (p) { return [p[0], p[1]]; });

  for (var i = 0; i < turns; i++) {
    cells = cells.map(rotateCw);
  }
  cells.forEach(function (p) {
    board[p[0]][p[1]] = '●';
  });
  return board;
}

function renderSwapState(q, stateKey, mode) {
  if (stateKey === '?') {
    var qb = emptyBoard();
    qb[1][1] = '<span class="spa-q">?</span>';
    return renderGrid(qb, mode === 'option' ? 'spa-opt-grid' : 'spa-seq-grid');
  }
  var board = boardForSwapState(q, stateKey);
  return renderGrid(board, mode === 'option' ? 'spa-opt-grid' : 'spa-seq-grid');
}

function renderRotationState(q, angle, mode) {
  if (angle === '?') {
    var qb = emptyBoard();
    qb[1][1] = '<span class="spa-q">?</span>';
    return renderGrid(qb, mode === 'option' ? 'spa-opt-grid' : 'spa-seq-grid');
  }
  var board = boardForRotation(q.shapeKind, angle);
  return renderGrid(board, mode === 'option' ? 'spa-opt-grid' : 'spa-seq-grid');
}

var _errorLog = {};

ensureSpatialStyles();

shell.createGame({
  id: 'spatial-pattern-hunter',
  theme: { primary: '#0ea5e9', primary2: '#0284c7', bg: '#f0f9ff' },
  title: { zh: '🧭 空间关系', en: '🧭 Spatial Pattern' },
  subtitle: { zh: '看懂位置的关系，预测下一步', en: 'Read position relationships and predict the next step' },
  passScore: 4,
  units: SPATIAL_DATA.units,

  renderSequence: function (q, container) {
    var html = '<div class="spa-row">';
    if (q.layout === 'swap') {
      q.sequence.forEach(function (state, idx) {
        html += '<span class="spa-step">' + renderSwapState(q, state, 'sequence') + '</span>';
        if (idx < q.sequence.length - 1) html += '<span class="spa-sep">→</span>';
      });
    } else {
      q.sequence.forEach(function (angle, idx) {
        html += '<span class="spa-step">' + renderRotationState(q, angle, 'sequence') + '</span>';
        if (idx < q.sequence.length - 1) html += '<span class="spa-sep">→</span>';
      });
    }
    html += '</div>';
    container.innerHTML = html;
  },

  renderOption: function (optKey, q) {
    var def = q.optionDefs[optKey];
    if (q.layout === 'swap') {
      return renderSwapState(q, def.state, 'option');
    }
    return renderGrid(boardForRotation(def.shapeKind, def.angle), 'spa-opt-grid');
  },

  checkAnswer: function (selected, q) {
    return String(selected) === String(q.answer);
  },

  onAnswer: function (selected, q, isCorrect) {
    var key = String(selected);
    var type = (q.optionTypes && q.optionTypes[key]) || (isCorrect ? 'correct' : 'unknown');
    SPATIAL_DATA.units.forEach(function (unit) {
      if (unit.questions.indexOf(q) !== -1) {
        if (!_errorLog[unit.patternType]) _errorLog[unit.patternType] = {};
        _errorLog[unit.patternType][type] = (_errorLog[unit.patternType][type] || 0) + 1;
      }
    });
  },

  getVoiceText: function (q, idx) {
    return shell.lang === 'zh'
      ? '第' + (idx + 1) + '题，下一步的空间关系是什么？'
      : 'Question ' + (idx + 1) + ', what is the next spatial relationship?';
  }
});
