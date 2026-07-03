/**
 * Motion Pattern Hunter — Game Logic  v1.0.0  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * 3 renderers:  direction cards | action cards | position track
 * Shell-1 handles all UI, state, storage, reports.
 * Depends on: shell.js, data.js
 * ─────────────────────────────────────────────────────────
 */

// ── Direction symbols ──────────────────────────────────────────
var MPH_DIRS = {
  left:  '⬅️',
  right: '➡️',
  up:    '⬆️',
  down:  '⬇️'
};

// ── Action labels (bilingual + emoji) ─────────────────────────
var MPH_ACTS = {
  jump:  { zh: '跳', en: 'Jump',  e: '🦘' },
  squat: { zh: '蹲', en: 'Squat', e: '🐸' },
  turn:  { zh: '转', en: 'Turn',  e: '🌀' },
  run:   { zh: '跑', en: 'Run',   e: '🏃' }
};

// ── Render helpers ─────────────────────────────────────────────
function dirCard(dir) {
  return '<span class="s1-motion-card">' + (MPH_DIRS[dir] || dir) + '</span>';
}

function actCard(act) {
  var a = MPH_ACTS[act] || { zh: act, en: act, e: '▪' };
  return '<span class="s1-motion-card">' + a.e +
    '<small><span class="zh">' + a.zh + '</span><span class="en">' + a.en + '</span></small>' +
    '</span>';
}

function renderTrack(q, container) {
  // Switch s1-seq to track style
  container.parentElement.classList.add('s1-seq--track');

  var trackSize = q.trackSize || 10;
  var positions = q.positions;
  var lastPos   = positions[positions.length - 1];
  var stepNums  = ['①','②','③','④','⑤','⑥'];

  // ── Top row: grid cells ──────────────────────────────────────
  // Visited cells animate in one by one (CSS animation-delay)
  // Current (last) cell also animates, slightly after
  var html = '<div class="s1-track">';
  for (var i = 1; i <= trackSize; i++) {
    var posIdx  = positions.indexOf(i);
    var isLast  = (i === lastPos);
    var isStep  = posIdx !== -1;            // visited OR current
    var delay   = isStep ? (posIdx * 0.38) + 's' : null;

    var cls = 's1-track-cell';
    if (isLast)  cls += ' s1-track-cur s1-track-reveal';
    else if (isStep) cls += ' s1-track-vis s1-track-reveal';

    var style = delay ? ' style="animation-delay:' + delay + '"' : '';
    html += '<div class="s1-track-cell-wrap">';
    html += '<div class="' + cls + '"' + style + '>' + i + '</div>';
    // Step number badge + connecting arrow below each visited cell
    if (isStep) {
      var badge = '<div class="s1-track-badge"' + style + '>' + (stepNums[posIdx] || (posIdx+1)) + '</div>';
      var arrow = (posIdx < positions.length - 1)
        ? '<div class="s1-track-arrow" style="animation-delay:' + (posIdx * 0.38 + 0.2) + 's">→</div>'
        : '<div class="s1-track-arrow" style="animation-delay:' + (posIdx * 0.38 + 0.2) + 's">→<span class="mystery s1-track-q">?</span></div>';
      html += badge + arrow;
    }
    html += '</div>';
  }
  html += '</div>';

  container.innerHTML = html;
}

// ── Error type tracking ────────────────────────────────────────
var _errorLog = {};

// ── Shell-1 game config ───────────────────────────────────────
shell.createGame({
  id:            'motion-pattern-hunter',
  parallelUnits: true,
  theme:         { primary: '#0ea5e9', primary2: '#7c3aed', bg: '#f0f9ff' },
  title:         { zh: '🏃 动作规律',              en: '🏃 Motion Pattern' },
  subtitle:      { zh: '看懂动作的节奏，预测下一步', en: 'Read the rhythm, predict the next move' },
  passScore:     5,
  units:         MPH_DATA.units,

  // ── Render question sequence ──────────────────────────────────
  renderSequence: function (q, container, unit) {
    var seqEl = container.parentElement;
    if (q.layout === 'track') {
      renderTrack(q, container);
    } else {
      seqEl.classList.remove('s1-seq--track');
      container.innerHTML = q.cells.map(function (cell) {
        if (cell === '?') return '<span class="mystery">?</span>';
        return (q.layout === 'direction') ? dirCard(cell) : actCard(cell);
      }).join(' ');
    }
  },

  // ── Render each option button ─────────────────────────────────
  renderOption: function (opt, q, unit) {
    if (q.layout === 'track')     return '<span class="s1-pos-badge">' + opt + '</span>';
    if (q.layout === 'direction') return dirCard(opt);
    return actCard(opt);
  },

  // ── Answer checking ───────────────────────────────────────────
  checkAnswer: function (selected, q) {
    if (q.layout === 'track') return Number(selected) === Number(q.answer);
    return selected === q.answer;
  },

  // ── Error analytics ───────────────────────────────────────────
  onAnswer: function (selected, q, isCorrect) {
    var key  = String(selected);
    var type = (q.optionTypes && q.optionTypes[key]) || (isCorrect ? 'correct' : 'unknown');
    MPH_DATA.units.forEach(function (unit) {
      if (unit.questions.indexOf(q) !== -1) {
        if (!_errorLog[unit.id]) _errorLog[unit.id] = {};
        _errorLog[unit.id][type] = (_errorLog[unit.id][type] || 0) + 1;
      }
    });
  },

  // ── Voice prompt ──────────────────────────────────────────────
  getVoiceText: function (q, idx) {
    if (q.layout === 'track') {
      return shell.lang === 'zh'
        ? '第' + (idx + 1) + '题，下一步跳到哪个格子？'
        : 'Question ' + (idx + 1) + ', which cell comes next?';
    }
    return shell.lang === 'zh'
      ? '第' + (idx + 1) + '题，下一个是什么？'
      : 'Question ' + (idx + 1) + ', what comes next?';
  }
});
