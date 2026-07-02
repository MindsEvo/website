/**
 * Color Pattern Hunter — Game Logic  v1.0.0  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * Depends on: shell.js, data.js
 * Ability tags: discrete-color-sequence, working-memory-compound
 * ─────────────────────────────────────────────────────────
 */

// ── Color palette (discrete, high-contrast, color-blind safe) ──
var CPH_COLORS = {
  red:    '#ef4444',
  blue:   '#3b82f6',
  yellow: '#eab308',
  green:  '#22c55e',
  purple: '#a855f7',
  orange: '#f97316'
};

// ── Rendering helpers ─────────────────────────────────────────
function cDot(color, size) {
  size = size || 46;
  var hex = CPH_COLORS[color] || '#94a3b8';
  return '<span class="s1-cdot" style="background:' + hex + ';width:' + size + 'px;height:' + size + 'px"></span>';
}

function cCapsule(pair) {
  return '<span class="s1-ccapsule">' + cDot(pair[0], 34) + cDot(pair[1], 34) + '</span>';
}

// ── Error type tracking (per session) ─────────────────────────
var _errorTypes = {};  // { unitId: { correct:n, adjacent_error:n, rule_error:n, ... } }

function recordError(unitId, type) {
  if (!_errorTypes[unitId]) _errorTypes[unitId] = {};
  _errorTypes[unitId][type] = (_errorTypes[unitId][type] || 0) + 1;
}

// ── Shell-1 game config ───────────────────────────────────────
shell.createGame({
  id:            'color-pattern-hunter',
  parallelUnits: true,   // all 3 units unlocked from start (different abilities)
  theme:         { primary: '#f97316', primary2: '#dc2626', bg: '#fff7ed' },
  title:         { zh: '🎨 颜色规律',          en: '🎨 Color Pattern' },
  subtitle:      { zh: '发现颜色变化的规律',    en: 'Discover the color pattern' },
  passScore:     5,
  units:         CPH_DATA.units,

  // ── Render the question sequence ──────────────────────────────
  renderSequence: function (q, container, unit) {
    if (q.layout === 'grid') {
      // L2: matrix with row separators
      var html = '<div class="s1-cgrid" style="grid-template-columns: repeat(' + q.cols + ', auto);">';
      q.cells.forEach(function (cell, i) {
        // Insert row separator (except before first row)
        if (i > 0 && i % q.cols === 0) {
          html += '<div class="s1-cgrid-sep"></div>';
        }
        html += (cell === '?')
          ? '<span class="mystery" style="font-size:24px;padding:6px 14px;">?</span>'
          : cDot(cell, 46);
      });
      html += '</div>';
      container.innerHTML = html;

    } else if (q.layout === 'pair') {
      // L4: capsule pairs
      container.innerHTML = q.cells.map(function (cell) {
        return (cell === null)
          ? '<span class="mystery">?</span>'
          : cCapsule(cell);
      }).join(' ');

    } else {
      // L1: linear dots
      container.innerHTML = q.cells.map(function (cell) {
        return (cell === '?')
          ? '<span class="mystery">?</span>'
          : cDot(cell, 50);
      }).join(' ');
    }
  },

  // ── Render each option button ─────────────────────────────────
  renderOption: function (opt, q, unit) {
    if (Array.isArray(opt)) return cCapsule(opt);
    return cDot(opt, 52);
  },

  // ── Answer checking ───────────────────────────────────────────
  checkAnswer: function (selected, q) {
    if (Array.isArray(selected) && Array.isArray(q.answer)) {
      return selected.join(',') === q.answer.join(',');
    }
    return selected === q.answer;
  },

  // ── Error type analytics (called by Shell-1 after each answer) ─
  onAnswer: function (selected, q, isCorrect) {
    var key = Array.isArray(selected) ? selected.join(',') : selected;
    var type = (q.optionTypes && q.optionTypes[key]) || (isCorrect ? 'correct' : 'unknown');
    // Find current unit id from the question (stored in data.js per unit)
    // We use the unit.id from the closure via VPH_DATA
    CPH_DATA.units.forEach(function (unit) {
      if (unit.questions.indexOf(q) !== -1) {
        recordError(unit.id, type);
      }
    });
  },

  // ── Voice prompt ──────────────────────────────────────────────
  getVoiceText: function (q, idx) {
    return shell.lang === 'zh'
      ? '第' + (idx + 1) + '题，下一个是什么颜色？'
      : 'Question ' + (idx + 1) + ', what color comes next?';
  }
});
