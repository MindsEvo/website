/**
 * Visual Pattern Hunter — Game Logic  v2.0.0  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * Only game-specific rendering logic here.
 * All UI, state, storage handled by shell.createGame().
 * Depends on: shell.js, data.js
 * ─────────────────────────────────────────────────────────
 */

// ── SVG Shape Renderer (game-specific) ───────────────────────
function generateShape(type, size, color, rotation) {
  size  = size  || 40;
  color = color || '#667eea';
  rotation = rotation || 0;
  var s = size, h = s / 2;
  var svg = '<svg width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + ' ' + s + '" style="display:inline-block;vertical-align:middle;transform:rotate(' + rotation + 'deg)">';
  switch (type) {
    case 'circle':
      svg += '<circle cx="' + h + '" cy="' + h + '" r="' + (h-2) + '" fill="' + color + '" stroke="#334155" stroke-width="2"/>';
      break;
    case 'square':
      svg += '<rect x="2" y="2" width="' + (s-4) + '" height="' + (s-4) + '" fill="' + color + '" stroke="#334155" stroke-width="2"/>';
      break;
    case 'triangle':
      svg += '<polygon points="' + h + ',4 ' + (s-4) + ',' + (s-4) + ' 4,' + (s-4) + '" fill="' + color + '" stroke="#334155" stroke-width="2"/>';
      break;
    case 'star':
      svg += '<polygon points="20,2 26,14 39,16 29,26 32,39 20,32 8,39 11,26 1,16 14,14" fill="' + color + '" stroke="#334155" stroke-width="2"/>';
      break;
    case 'arrow':
      svg += '<polygon points="20,4 28,16 24,16 24,36 16,36 16,16 12,16" fill="' + color + '" stroke="#334155" stroke-width="2"/>';
      break;
    case 'diamond':
      svg += '<polygon points="20,2 38,20 20,38 2,20" fill="' + color + '" stroke="#334155" stroke-width="2"/>';
      break;
    default:
      svg += '<circle cx="' + h + '" cy="' + h + '" r="' + (h-2) + '" fill="' + color + '"/>';
  }
  return svg + '</svg>';
}

function shapeFor(item, unit) {
  var color = '#06b6d4';
  if (unit.patternType === 'shape')  return generateShape(item, 50, color, 0);
  if (unit.patternType === 'rotate') return generateShape(unit.rotateShape || 'arrow', 50, color, item);
  return String(item);
}

// ── Shell-1 game config ───────────────────────────────────────
shell.createGame({
  id:       'visual-pattern-hunter',
  theme:    { primary: '#06b6d4', primary2: '#0891b2', bg: '#f0f9ff' },
  title:    { zh: '🎨 视觉规律',       en: '🎨 Visual Pattern Hunter' },
  subtitle: { zh: '观察图形，发现规律', en: 'Observe shapes and find patterns' },
  passScore: 4,
  units:    VPH_DATA.units,

  renderSequence: function (q, container, unit) {
    container.innerHTML = q.sequence.map(function (item) {
      return item === '?' ? '<span class="mystery">?</span>' : shapeFor(item, unit);
    }).join(' ');
  },

  renderOption: function (opt, q, unit) {
    return shapeFor(opt, unit);
  },

  checkAnswer: function (selected, q) {
    return String(selected) === String(q.answer);
  },

  getVoiceText: function (q, idx) {
    return shell.lang === 'zh'
      ? '第' + (idx + 1) + '题，下一个是什么？'
      : 'Question ' + (idx + 1) + ', what comes next?';
  }
});
