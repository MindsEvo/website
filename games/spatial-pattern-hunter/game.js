'use strict';

(function injectRouteScoutStyles() {
  if (document.getElementById('rs-shell-style')) return;
  var s = document.createElement('style');
  s.id = 'rs-shell-style';
  s.textContent = [
    '.rs-wrap{display:grid;gap:10px;justify-items:center;}',
    '.rs-q{font-size:21px;font-weight:900;color:#0f172a;line-height:1.3;text-align:center;}',
    '.rs-sub{font-size:13px;font-weight:700;color:#64748b;text-align:center;}',
    '.rs-board{display:grid;gap:2px;background:#cbd5e1;padding:4px;border-radius:10px;box-shadow:0 6px 18px rgba(15,23,42,.08);}',
    '.rs-cell{width:30px;height:30px;background:#fff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#0f172a;}',
    '.rs-wall{background:#334155;color:#334155;}',
    '.rs-start{background:#bbf7d0;color:#166534;}',
    '.rs-goal{background:#fde68a;color:#92400e;}',
    '.rs-empty{background:#f8fafc;color:transparent;}',
    '.rs-opt{display:grid;gap:4px;justify-items:center;align-content:center;min-height:72px;}',
    '.rs-route{font-size:22px;font-weight:900;color:#0f172a;line-height:1;letter-spacing:1px;}',
    '.rs-route-sub{font-size:11px;font-weight:700;color:#64748b;}',
    '.rs-legend{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}',
    '.rs-legend-item{font-size:11px;font-weight:700;color:#475569;background:#f8fafc;border:1px solid #e2e8f0;border-radius:999px;padding:3px 8px;}',
    '@media (max-width:520px){.rs-cell{width:24px;height:24px;font-size:13px;}.rs-route{font-size:18px;}}'
  ].join('');
  document.head.appendChild(s);
}());

function parseMap(rows) {
  return rows.map(function (row) { return row.split(''); });
}

function findChar(board, ch) {
  for (var r = 0; r < board.length; r++) {
    for (var c = 0; c < board[r].length; c++) {
      if (board[r][c] === ch) return { r: r, c: c };
    }
  }
  return null;
}

function routeToArrows(route) {
  var out = '';
  for (var i = 0; i < route.length; i++) {
    var step = route.charAt(i);
    out += step === 'U' ? '↑' : step === 'D' ? '↓' : step === 'L' ? '←' : '→';
  }
  return out;
}

function nextPos(pos, step) {
  var r = pos.r;
  var c = pos.c;
  if (step === 'U') r--;
  else if (step === 'D') r++;
  else if (step === 'L') c--;
  else if (step === 'R') c++;
  return { r: r, c: c };
}

function isValidRoute(q, route) {
  var board = parseMap(q.map);
  var start = findChar(board, 'S');
  var goal = findChar(board, 'G');
  if (!start || !goal) return false;

  var pos = { r: start.r, c: start.c };
  for (var i = 0; i < route.length; i++) {
    pos = nextPos(pos, route.charAt(i));
    if (pos.r < 0 || pos.r >= board.length) return false;
    if (pos.c < 0 || pos.c >= board[0].length) return false;
    if (board[pos.r][pos.c] === '#') return false;
  }
  return pos.r === goal.r && pos.c === goal.c;
}

function renderBoard(q) {
  var board = parseMap(q.map);
  var html = '<div class="rs-board" style="grid-template-columns:repeat(' + board[0].length + ',1fr)">';
  for (var r = 0; r < board.length; r++) {
    for (var c = 0; c < board[r].length; c++) {
      var cell = board[r][c];
      var cls = 'rs-cell ';
      var text = '';
      if (cell === '#') {
        cls += 'rs-wall';
      } else if (cell === 'S') {
        cls += 'rs-start';
        text = 'S';
      } else if (cell === 'G') {
        cls += 'rs-goal';
        text = 'G';
      } else {
        cls += 'rs-empty';
        text = '·';
      }
      html += '<span class="' + cls + '">' + text + '</span>';
    }
  }
  html += '</div>';
  return html;
}

shell.createGame({
  id: 'spatial-pattern-hunter',
  theme: { primary: '#0ea5e9', primary2: '#0284c7', bg: '#f0f9ff' },
  gui: {
    header: { show: true, showBack: true },
    language: { enabled: true, default: 'zh' },
    audio: {
      music: { enabled: true, defaultOn: false },
      sound: { enabled: true, defaultOn: true }
    },
    history: { enabled: true },
    help: {
      enabled: true,
      contentZh: '只保留路线规划核心：看地图、避开墙、选能到终点的路径。',
      contentEn: 'Keep core route planning only: read the map, avoid walls, and pick the path that reaches goal.'
    },
    video: {
      enabled: true,
      videoId: 'mindseeds-spatial-pattern-intro-001'
    }
  },
  title: { zh: '🧭 空间关系', en: '🧭 Spatial Pattern' },
  subtitle: { zh: 'Route Scout：保留规划思维，简化复杂操作', en: 'Route Scout: keep planning value, simplify complex operations' },
  passScore: 3,
  units: SPATIAL_DATA.units,

  renderSequence: function (q, container) {
    container.innerHTML = '<div class="rs-wrap">' +
      '<div class="rs-q"><span class="zh">哪条路线能到达终点？</span><span class="en">Which route reaches the goal?</span></div>' +
      '<div class="rs-sub"><span class="zh">S 为起点，G 为终点，# 为障碍</span><span class="en">S is start, G is goal, # is wall</span></div>' +
      renderBoard(q) +
      '<div class="rs-legend">' +
        '<span class="rs-legend-item"><span class="zh">只选一条可达路线</span><span class="en">Only one route is reachable</span></span>' +
      '</div>' +
    '</div>';
  },

  renderOption: function (opt) {
    return '<div class="rs-opt"><span class="rs-route">' + routeToArrows(opt) + '</span>' +
      '<span class="rs-route-sub">' + opt + '</span></div>';
  },

  checkAnswer: function (selected, q) {
    return String(selected) === String(q.answer);
  },

  getVoiceText: function (q, idx) {
    return shell.lang === 'zh'
      ? '第' + (idx + 1) + '题，哪条路线可以到达终点？'
      : 'Question ' + (idx + 1) + ', which route can reach the goal?';
  },

  registerRootGenes: function (ctx) {
    var unit = (ctx && ctx.unit) || {};
    var unitId = String(unit.id || 'u0');
    return [
      'RG.PATTERN.SPATIAL.RELATION',
      'RG.STRATEGY.DECISION.PLANNING',
      'RG.MINDSEEDS.SPATIAL_PATTERN.' + unitId
    ];
  },

  onCorrect: function (q, acts) {
    if (!isValidRoute(q, q.answer)) {
      var warn = document.createElement('div');
      warn.className = 's1-fb s1-fb-err';
      warn.textContent = 'Data warning: answer route does not reach goal.';
      acts.parentNode.insertBefore(warn, acts);
    }
  }
});
