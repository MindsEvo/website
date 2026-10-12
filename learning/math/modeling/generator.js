'use strict';

/**
 * Modeling generator — 7 model types x grades, themed units.
 *
 * GRADIENT RULE (the design principle of this module):
 *   grades differ by the ABSTRACTION LEVEL of the model first; the number range
 *   only follows (K1 <= 5, K2 <= 10, G1 <= 20, G2 <= 100).
 *   abstraction ladder:  recognize -> match -> build -> use -> evaluate
 *     K1  recognize / use a legend: a picture <-> a simple symbol, one cue.
 *     K2  read relations, steps and rules; the diagram is not the thing itself.
 *     G1  scene -> dots -> equation; routes, graphs, rules with two conditions.
 *     G2  choose the model that fits the purpose, and judge a given model.
 *   (match / build need drag interaction and ship in the interactive batch.)
 *
 * Question shape (consumed by game.js):
 *   { type, mode, abstraction, promptZh, promptEn, scene: [block...],
 *     options: [token...], answer: token, hintZh, hintEn }
 * Option tokens: 'tx:zh|en' bilingual text, 'dots:5' / 'dots:3+2' / 'dots:5-2'
 * (5 dots / two groups / five with two crossed out), anything else is shown as is.
 * Scene blocks: story, rule, legend, big, grid, chain, graph, balance (see game.js).
 */
var MD_GEN = (function () {

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[ri(0, a.length - 1)]; }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = ri(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function tx(zh, en) { return 'tx:' + zh + '|' + en; }
  function mk(type, mode, abs, zh, en, hzh, hen) {
    return { type: type, mode: mode, abstraction: abs, promptZh: zh, promptEn: en, hintZh: hzh || '', hintEn: hen || '', scene: [] };
  }
  // answer + distractors -> options (n total), answer stored as the token
  function opts(q, ans, wrongs, n) {
    ans = String(ans);
    var w = shuffle(uniq(wrongs.map(String)).filter(function (x) { return x !== ans; })).slice(0, n - 1);
    q.options = shuffle([ans].concat(w));
    q.answer = ans;
    return q;
  }
  function nums(ans, cands, lo, hi) {
    return cands.filter(function (v) { return v >= lo && v <= hi && v !== ans; });
  }

  // ── items with two attributes (kind x colour) ─────────────────────────────
  // Only pictures whose colour is unmistakable in the emoji font (no butterfly,
  // no white car): the grouping questions are about colour, so it must be obvious.
  var ITEMS = [
    { e: '🍎', k: 'fruit', c: 'red' }, { e: '🍓', k: 'fruit', c: 'red' }, { e: '🍒', k: 'fruit', c: 'red' },
    { e: '🍌', k: 'fruit', c: 'yellow' }, { e: '🍋', k: 'fruit', c: 'yellow' }, { e: '🍏', k: 'fruit', c: 'green' },
    { e: '🚒', k: 'vehicle', c: 'red' }, { e: '🚕', k: 'vehicle', c: 'yellow' }, { e: '🚙', k: 'vehicle', c: 'blue' },
    { e: '🐞', k: 'animal', c: 'red' }, { e: '🐥', k: 'animal', c: 'yellow' }, { e: '🐸', k: 'animal', c: 'green' },
    { e: '🐢', k: 'animal', c: 'green' }, { e: '🐳', k: 'animal', c: 'blue' }
  ];
  var KIND = { fruit: ['水果', 'fruit'], vehicle: ['车', 'vehicle'], animal: ['动物', 'animal'] };
  var COLOUR = { red: ['红色', 'red'], yellow: ['黄色', 'yellow'], green: ['绿色', 'green'], blue: ['蓝色', 'blue'] };
  var CELLS = ['🐰', '🐱', '🐶', '🐸', '🐻', '🐵', '🐼', '🐯', '🍎', '🍌', '🍇', '🍓', '🚗', '🌳', '🏠', '⭐', '🎈', '🐟', '🦋', '🍪'];

  // ── MAPPING ───────────────────────────────────────────────────────────────
  var THINGS = ['🍎', '🐟', '🐰', '🚗', '🌳', '🏠'];
  var SYMS = ['🟦', '🟢', '🟣', '⬛'];

  function mapDots(g) {
    var n = ri(2, 5), th = pick(['🍎', '🐟', '🐰', '🐸']), q = mk('mapping', 'dots', 'recognize',
      '哪一组点代表这些东西？', 'Which dots stand for these things?', '一个东西用一个点', 'One dot for each thing');
    q.scene.push({ k: 'big', v: new Array(n + 1).join(th) });
    return opts(q, 'dots:' + n, nums(n, [n - 1, n + 1, n + 2, n - 2, n - 3], 1, 5).map(function (v) { return 'dots:' + v; }), 3);
  }
  function mapLegend(g) {
    var k = g === 'K1' ? 2 : 3, len = g === 'K1' ? 3 : 4;
    var th = shuffle(THINGS).slice(0, k), sy = shuffle(SYMS).slice(0, k), back = g !== 'K1' && Math.random() < 0.5;
    var idx = []; for (var i = 0; i < len; i++) idx.push(ri(0, k - 1));
    if (uniq(idx).length < 2) idx[0] = (idx[1] + 1) % k;
    var from = idx.map(function (x) { return (back ? sy : th)[x]; }), to = idx.map(function (x) { return (back ? th : sy)[x]; });
    var q = mk('mapping', 'legend', back ? 'recognize' : 'use',
      back ? '这排符号代表的是哪一排？' : '哪一排符号和这些东西对得上？',
      back ? 'Which row of things do these symbols stand for?' : 'Which row of symbols matches these things?',
      '先看上面的对照表', 'Check the key first');
    q.scene.push({ k: 'legend', items: th.map(function (t, i) { return [t, sy[i]]; }) });
    q.scene.push({ k: 'big', v: from.join('') });
    var wrongs = [], tries = 0;
    while (wrongs.length < 6 && tries++ < 50) {
      var w = to.slice(), at = ri(0, len - 1), pool = (back ? th : sy).filter(function (x) { return x !== w[at]; });
      w[at] = pick(pool);
      wrongs.push(w.join(''));
    }
    var swap = (back ? th : sy).slice(0, k); // swapped legend: map idx -> idx+1
    wrongs.push(idx.map(function (x) { return (back ? th : sy)[(x + 1) % k]; }).join(''));
    return opts(q, to.join(''), wrongs, g === 'K1' ? 3 : 4);
  }
  function pictograph(g) {
    var unit, k, th = pick(['🍎', '🐟', '🍪', '🎈']), sym = pick(['🔷', '🟢', '🟣']);
    var reverse = g === 'G2' && Math.random() < 0.4;
    if (g === 'G1') { unit = pick([2, 5]); k = unit === 2 ? ri(3, 8) : ri(2, 4); }
    else { unit = pick([5, 10]); k = unit === 10 ? ri(3, 9) : ri(4, 12); }
    var total = unit * k, q;
    q = mk('mapping', 'pictograph', 'use', reverse ? '要表示这么多，需要画几个符号？' : '一共有多少个？',
      reverse ? 'How many symbols do we draw for this many?' : 'How many are there in all?',
      '一个符号不是 1 个，要看对照表', 'One symbol is not one thing — read the key');
    q.scene.push({ k: 'legend', items: [[sym, unit + ' × ' + th]] });
    if (reverse) {
      q.scene.push({ k: 'story', zh: '一共要表示 ' + total + ' 个' + th, en: 'We need to show ' + total + ' ' + th });
      return opts(q, k, nums(k, [k + 1, k - 1, unit, total / 2, k + 2, k - 2], 1, 20), 4);
    }
    q.scene.push({ k: 'big', v: new Array(k + 1).join(sym) });
    return opts(q, total, nums(total, [k, total + unit, total - unit, total + 1, total - 1, k * 2], 1, 100), 4);
  }

  // ── GROUPING ──────────────────────────────────────────────────────────────
  function attrName(a, v) { return a === 'k' ? KIND[v] : COLOUR[v]; }
  function groupWith(g) {
    var attr = pick(['k', 'c']), other = attr === 'k' ? 'c' : 'k', ref = pick(ITEMS);
    var same = ITEMS.filter(function (i) { return i !== ref && i[attr] === ref[attr] && i[other] !== ref[other]; });
    var pool = ITEMS.filter(function (i) { return i[attr] !== ref[attr]; });
    if (!same.length || pool.length < 3) return groupWith(g);
    var a = pick(same), n = g === 'K1' ? 3 : 4, picked = [], used = {};
    shuffle(pool).forEach(function (i) { if (picked.length < n - 1 && !used[i[attr]]) { used[i[attr]] = 1; picked.push(i); } });
    shuffle(pool).forEach(function (i) { if (picked.length < n - 1 && picked.indexOf(i) < 0) picked.push(i); });
    var q = mk('grouping', 'with', 'use',
      '为了找出同样的「' + (attr === 'k' ? '种类' : '颜色') + '」，' + ref.e + ' 应该和谁一组？',
      'To find the same ' + (attr === 'k' ? 'kind' : 'colour') + ', which one goes with ' + ref.e + '?',
      '这次只看' + (attr === 'k' ? '种类' : '颜色') + '，别的先不管', 'Only look at the ' + (attr === 'k' ? 'kind' : 'colour') + ' this time');
    q.scene.push({ k: 'rule', zh: '这次的目的：按' + (attr === 'k' ? '种类' : '颜色') + '分', en: 'Purpose: group by ' + (attr === 'k' ? 'kind' : 'colour') });
    q.scene.push({ k: 'big', v: ref.e });
    return opts(q, nm(a.e), picked.map(function (i) { return nm(i.e); }), n);
  }
  function groupOdd(g) {
    for (var t = 0; t < 400; t++) {
      var four = shuffle(ITEMS).slice(0, 4), attr = pick(['k', 'c']), other = attr === 'k' ? 'c' : 'k';
      var cnt = function (a) { var m = {}; four.forEach(function (i) { m[i[a]] = (m[i[a]] || 0) + 1; }); return m; };
      var cp = cnt(attr), vals = Object.keys(cp);
      if (vals.length !== 2 || Math.max(cp[vals[0]], cp[vals[1]]) !== 3) continue;
      var oddV = cp[vals[0]] === 1 ? vals[0] : vals[1], odd = four.filter(function (i) { return i[attr] === oddV; })[0];
      var co = cnt(other), ov = Object.keys(co);
      var trap = ov.length === 2 && co[ov[0]] !== co[ov[1]] ? four.filter(function (i) { return co[i[other]] === 1; })[0] : null;
      if (trap && trap === odd) continue;
      if (ov.length === 2 && co[ov[0]] === 2) { /* 2/2 split under the other purpose: no trap, fine */ }
      var q = mk('grouping', 'odd', 'use',
        '这次按「' + (attr === 'k' ? '种类' : '颜色') + '」分，谁不属于这一组？',
        'Group by ' + (attr === 'k' ? 'kind' : 'colour') + ' this time. Which one does not belong?',
        '换了目的，要看的特征也换了', 'A new purpose means looking at a different feature');
      q.scene.push({ k: 'rule', zh: '目的：按' + (attr === 'k' ? '种类' : '颜色') + '分', en: 'Purpose: group by ' + (attr === 'k' ? 'kind' : 'colour') });
      q.scene.push({ k: 'big', v: four.map(function (i) { return i.e; }).join('  ') });
      return opts(q, nm(odd.e), four.filter(function (i) { return i !== odd; }).map(function (i) { return nm(i.e); }), 4);
    }
    return groupWith(g);
  }
  var PURPOSES = [
    { zh: '想把红色的东西挑出来做装饰', en: 'You want to pick out the red things for decorating', r: 'c' },
    { zh: '想让每个箱子里的颜色都一样', en: 'You want every box to hold one colour', r: 'c' },
    { zh: '想找出所有黄色的东西', en: 'You want to find everything yellow', r: 'c' },
    { zh: '想知道一共有几种水果', en: 'You want to know how many kinds of fruit there are', r: 'k' },
    { zh: '想把能坐的车放在一起', en: 'You want to put the rides together', r: 'k' },
    { zh: '想数一数动物有几只', en: 'You want to count the animals', r: 'k' }
  ];
  function groupRule(g) {
    var p = pick(PURPOSES), q = mk('grouping', 'rule', 'evaluate',
      '哪一种分法最适合这个目的？', 'Which way of grouping fits this purpose best?',
      '先想想：为了这个目的，要看什么特征', 'Think: which feature matters for this purpose?');
    q.scene.push({ k: 'story', zh: p.zh, en: p.en });
    q.scene.push({ k: 'big', v: shuffle(ITEMS).slice(0, 6).map(function (i) { return i.e; }).join(' ') });
    var C = tx('按颜色分', 'By colour'), K = tx('按种类分', 'By kind'), N = tx('按数量分', 'By number');
    return opts(q, p.r === 'c' ? C : K, [p.r === 'c' ? K : C, N], 3);
  }

  // ── RELATIONSHIP ──────────────────────────────────────────────────────────
  var NAMES = ['🐰', '🐱', '🐶', '🐸', '🐻', '🐵'];
  function relOrder(g) {
    var three = shuffle(NAMES).slice(0, 3), a = three[0], b = three[1], c = three[2], flip = Math.random() < 0.5;
    var q = mk('relationship', 'order', 'use', '它们是怎么排的？', 'How are they lined up?',
      '先找出谁在最左边', 'Find who is on the far left first');
    q.scene.push({ k: 'story', zh: flip ? c + ' 在 ' + b + ' 的右边，' + b + ' 在 ' + a + ' 的右边' : a + ' 在 ' + b + ' 的左边，' + b + ' 在 ' + c + ' 的左边',
      en: flip ? c + ' is right of ' + b + ', and ' + b + ' is right of ' + a : a + ' is left of ' + b + ', and ' + b + ' is left of ' + c });
    var perms = [[a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a]].map(function (p) { return p.join(' '); });
    return opts(q, [a, b, c].join(' '), perms.filter(function (x) { return x !== [a, b, c].join(' '); }), 4);
  }
  function relGraph(g) {
    var ns = shuffle(NAMES).slice(0, g === 'G1' ? 4 : 5);
    for (var t = 0; t < 200; t++) {
      var pairs = [], all = [];
      for (var i = 0; i < ns.length; i++) for (var j = i + 1; j < ns.length; j++) all.push([ns[i], ns[j]]);
      pairs = shuffle(all).slice(0, g === 'G1' ? 3 : ri(5, 6));
      var deg = {}; ns.forEach(function (n) { deg[n] = 0; });
      pairs.forEach(function (p) { deg[p[0]]++; deg[p[1]]++; });
      var q = mk('relationship', 'graph', 'use', '', '', '数一数每个名字出现了几次', 'Count how often each one appears');
      q.scene.push({ k: 'graph', pairs: pairs });
      if (g === 'G1') {
        var who = pick(ns), d = deg[who];
        q.promptZh = who + ' 有几个朋友？'; q.promptEn = 'How many friends does ' + who + ' have?';
        return opts(q, d, nums(d, [d + 1, d - 1, d + 2, 0, 1, 2], 0, 4), 3);
      }
      var mx = Math.max.apply(null, ns.map(function (n) { return deg[n]; }));
      var top = ns.filter(function (n) { return deg[n] === mx; });
      if (top.length !== 1) continue;
      q.promptZh = '谁的朋友最多？'; q.promptEn = 'Who has the most friends?';
      return opts(q, top[0], ns.filter(function (n) { return n !== top[0]; }), 4);
    }
    return relOrder(g);
  }

  // ── SPATIAL ───────────────────────────────────────────────────────────────
  function spaceRow(g) {
    var kind = pick(['lr', 'ud', 'mid']), three = shuffle(CELLS.slice(0, 8)).slice(0, 3), q;
    var col = kind === 'ud' || (kind === 'mid' && Math.random() < 0.5);
    q = mk('spatial', 'row', 'use', '', '', '先看清它们站成什么样', 'See how they are lined up first');
    q.scene.push({ k: 'grid', cols: col ? 1 : 3, cells: three });
    if (kind === 'mid') {
      q.promptZh = '谁在中间？'; q.promptEn = 'Who is in the middle?';
      return opts(q, three[1], [three[0], three[2], pick(CELLS.slice(8))], 3);
    }
    var a = three[0], b = three[2];
    if (kind === 'lr') {
      q.promptZh = a + ' 在 ' + b + ' 的哪一边？'; q.promptEn = 'Which side of ' + b + ' is ' + a + '?';
      return opts(q, tx('左边', 'Left'), [tx('右边', 'Right')], 2);
    }
    q.promptZh = a + ' 在 ' + b + ' 的哪一边？'; q.promptEn = 'Where is ' + a + ' compared with ' + b + '?';
    return opts(q, tx('上面', 'Above'), [tx('下面', 'Below')], 2);
  }
  function space2x2(g) {
    var four = shuffle(CELLS.slice(0, 12)).slice(0, 4), q = mk('spatial', 'grid2', 'use', '', '', '先找到它们在哪一格', 'Find their cells first');
    q.scene.push({ k: 'grid', cols: 2, cells: four });
    if (Math.random() < 0.5) {
      var corner = ri(0, 3), nm = [['左上角', 'top-left'], ['右上角', 'top-right'], ['左下角', 'bottom-left'], ['右下角', 'bottom-right']][corner];
      q.promptZh = nm[0] + '是谁？'; q.promptEn = 'Who is in the ' + nm[1] + ' corner?';
      return opts(q, four[corner], four.filter(function (x, i) { return i !== corner; }).concat([pick(CELLS.slice(12))]), 4);
    }
    var pairs = [[0, 1, tx('左边', 'Left')], [1, 0, tx('右边', 'Right')], [0, 2, tx('上面', 'Above')], [2, 0, tx('下面', 'Below')]];
    var p = pick(pairs);
    q.promptZh = four[p[0]] + ' 在 ' + four[p[0] === 0 || p[0] === 1 ? (p[1]) : (p[1])] + ' 的哪一边？';
    var a = p[0], b = p[1];
    q.promptZh = four[a] + ' 在 ' + four[b] + ' 的哪一边？'; q.promptEn = 'Where is ' + four[a] + ' compared with ' + four[b] + '?';
    return opts(q, p[2], [tx('左边', 'Left'), tx('右边', 'Right'), tx('上面', 'Above'), tx('下面', 'Below')], 4);
  }
  function spaceRoute(g) {
    var cols = 4, rows = 3, cells = shuffle(CELLS).slice(0, 12), arrows = { R: '→', L: '←', U: '↑', D: '↓' };
    for (var t = 0; t < 300; t++) {
      var pos = ri(0, 11), path = [pos], moves = [], n = ri(3, 4), ok = true;
      for (var s = 0; s < n && ok; s++) {
        var c = pos % cols, r = Math.floor(pos / cols), opt = [];
        if (c < cols - 1) opt.push(['R', pos + 1]); if (c > 0) opt.push(['L', pos - 1]);
        if (r < rows - 1) opt.push(['D', pos + cols]); if (r > 0) opt.push(['U', pos - cols]);
        var m = pick(opt); if (path.indexOf(m[1]) >= 0) { ok = false; break; }
        moves.push(m[0]); pos = m[1]; path.push(pos);
      }
      if (!ok) continue;
      var start = path[0], end = path[path.length - 1];
      var shown = cells.slice(); shown[start] = '🐰'; if (cells[start] === '🐰') continue;
      var q = mk('spatial', 'route', 'use', '🐰 照着路线走完，到了哪里？', 'Follow the route. Where does 🐰 end up?',
        '一步一步走，每走一步想想新的位置', 'Go one step at a time');
      q.scene.push({ k: 'grid', cols: cols, cells: shown });
      q.scene.push({ k: 'big', v: moves.map(function (x) { return arrows[x]; }).join(' ') });
      var wr = path.slice(1, -1).map(function (i) { return shown[i]; }).concat([shown[Math.min(11, end + 1)], shown[Math.max(0, end - 1)], shown[(end + cols) % 12]]);
      if (path.indexOf(end) !== path.length - 1) continue;
      return opts(q, shown[end], wr.filter(function (x) { return x !== shown[end] && x !== '🐰'; }), 4);
    }
    return space2x2(g);
  }
  function spaceCoord(g) {
    var cols = 5, rows = 4, cells = shuffle(CELLS).slice(0, 20), q;
    var c = ri(1, cols), r = ri(1, rows), idx = (r - 1) * cols + (c - 1), mode = pick(['at', 'where']);
    q = mk('spatial', 'coord', 'use', '', '', '先找列（横着数），再找行（竖着数）', 'Find the column (across) first, then the row (down)');
    q.scene.push({ k: 'grid', cols: cols, cells: cells, axes: true });
    if (mode === 'at') {
      q.promptZh = '(列 ' + c + '，行 ' + r + ') 是什么？'; q.promptEn = 'What is at (column ' + c + ', row ' + r + ')?';
      var near = [(r - 1) * cols + (c % cols), (r % rows) * cols + (c - 1), (c - 1) * 0 + ((c - 1) * cols + (r - 1)) % 20];
      return opts(q, cells[idx], near.map(function (i) { return cells[i]; }).concat([cells[(idx + 7) % 20]]), 4);
    }
    q.promptZh = cells[idx] + ' 在哪里？'; q.promptEn = 'Where is ' + cells[idx] + '?';
    var f = function (cc, rr) { return '(' + cc + ',' + rr + ')'; };
    return opts(q, f(c, r), [f(r > cols ? 1 : r, c > rows ? rows : c), f(c % cols + 1, r), f(c, r % rows + 1), f(Math.max(1, c - 1), r)], 4);
  }
  function spaceClaim(g) {
    var cols = 5, rows = 4, cells = shuffle(CELLS).slice(0, 20);
    var c = ri(1, cols), r = ri(1, rows), idx = (r - 1) * cols + (c - 1), tru = Math.random() < 0.5;
    var sc = tru ? c : (c % cols) + 1, sr = tru ? r : r;
    var q = mk('spatial', 'claim', 'evaluate', '小明说：' + cells[idx] + ' 在 (列 ' + sc + '，行 ' + sr + ')。对吗？',
      'Sam says ' + cells[idx] + ' is at (column ' + sc + ', row ' + sr + '). Is that right?', '自己在图上找一找，再判断', 'Find it on the map yourself, then decide');
    q.scene.push({ k: 'grid', cols: cols, cells: cells, axes: true });
    var rightTok = tx('对 ✅', 'Right ✅'), fix = tx('不对 ❌ 应该是 (' + c + ',' + r + ')', 'Wrong ❌ it is at (' + c + ',' + r + ')');
    var fix2 = tx('不对 ❌ 应该是 (' + r + ',' + c + ')', 'Wrong ❌ it is at (' + r + ',' + c + ')');
    if (r === c) fix2 = tx('不对 ❌ 应该是 (' + ((c % cols) + 1) + ',' + r + ')', 'Wrong ❌ it is at (' + ((c % cols) + 1) + ',' + r + ')');
    return opts(q, tru ? rightTok : fix, tru ? [fix, fix2] : [rightTok, fix2], 3);
  }

  // ── PROCESS ───────────────────────────────────────────────────────────────
  // each chain step: [emoji, zh word, en word] — the word is always shown
  var CHAINS = [
    [['🌰', '种子', 'seed'], ['🌱', '发芽', 'sprout'], ['🌳', '长大', 'grow'], ['🍎', '结果', 'fruit']],
    [['🥚', '鸡蛋', 'egg'], ['🐣', '出壳', 'hatch'], ['🐥', '小鸡', 'chick'], ['🐔', '长大', 'grown-up']],
    [['🍞', '面包', 'bread'], ['🧀', '加奶酪', 'add cheese'], ['🥬', '加青菜', 'add lettuce'], ['🥪', '做好了', 'sandwich']],
    [['🛏️', '起床', 'wake up'], ['👟', '穿鞋', 'put on shoes'], ['🚌', '坐车', 'take the bus'], ['🏫', '上学', 'at school']],
    [['🧼', '涂肥皂', 'soap up'], ['🚿', '冲水', 'rinse'], ['🧻', '擦干', 'dry off'], ['🙌', '干净了', 'all clean']]
  ];
  function stepTok(s) { return s[0] + '~' + s[1] + '~' + s[2]; }
  function procNext(g) {
    var ch = pick(CHAINS), blankMid = Math.random() < 0.5, from = ri(0, 1), steps = ch.slice(from, from + 3);
    var q = mk('process', 'blank', 'use', blankMid ? '缺的是哪一步？' : '接下来是哪一步？', blankMid ? 'Which step is missing?' : 'What comes next?',
      '想想先发生什么、后发生什么', 'Think about what happens first and next');
    var ans = blankMid ? steps[1] : steps[2];
    q.scene.push({ k: 'chain', steps: (blankMid ? [steps[0], '?', steps[2]] : [steps[0], steps[1], '?']).map(function (x) { return x === '?' ? '?' : stepTok(x); }) });
    // distractors: the chain's other steps (right content, wrong place) + one from another chain;
    // never a step already shown in the question
    var shown = steps.filter(function (x) { return x !== ans; });
    var own = ch.filter(function (x) { return x !== ans && shown.indexOf(x) < 0; });
    var other = shuffle(CHAINS.filter(function (c) { return c !== ch; })).map(function (c) { return pick(c); });
    var wr = own.concat(other.slice(0, 3 - own.length + 1));
    return opts(q, stepTok(ans), wr.map(stepTok), 4);
  }
  function procSwap(g) {
    var ch = pick(CHAINS), at = ri(0, 2), seq = ch.slice(), t = seq[at]; seq[at] = seq[at + 1]; seq[at + 1] = t;
    var q = mk('process', 'swap', 'evaluate', '哪两步的顺序放错了？', 'Which two steps are in the wrong order?',
      '从头想一遍：先发生的是哪个', 'Think it through from the start');
    q.scene.push({ k: 'chain', steps: seq.map(stepTok), numbered: true });
    var P = function (i) { return tx('第 ' + (i + 1) + '、' + (i + 2) + ' 步', 'Steps ' + (i + 1) + ' and ' + (i + 2)); };
    return opts(q, P(at), [P(0), P(1), P(2)], 3);
  }
  function procExtra(g) {
    var ch = pick(CHAINS), other = pick(CHAINS.filter(function (c) { return c !== ch; })), stray = pick(other);
    var seq = ch.slice(), at = ri(1, 3); seq.splice(at, 0, stray);
    var q = mk('process', 'extra', 'evaluate', '哪一步不属于这个过程？', 'Which step does not belong in this process?',
      '这个过程是要做成什么？', 'What is this process making or becoming?');
    q.scene.push({ k: 'chain', steps: seq.map(stepTok) });
    return opts(q, stepTok(stray), ch.map(stepTok), 4);
  }

  // ── QUANTITATIVE ──────────────────────────────────────────────────────────
  var STORY_THING = ['🍓', '🍎', '🍪', '🐟', '🎈'];
  function quantDots(g) {
    var add = Math.random() < 0.6, a, b, th = pick(STORY_THING);
    if (add) { a = ri(2, 6); b = ri(1, 10 - a); } else { a = ri(4, 9); b = ri(1, a - 1); }
    var q = mk('quantitative', 'dots', 'use', '哪一幅点图表示这件事？', 'Which dot picture shows this story?',
      add ? '又放进来，是把两堆合起来' : '吃掉了，是把一部分划掉', add ? 'Put in more: join two groups' : 'Eaten: cross some out');
    q.scene.push({ k: 'story', zh: add ? '盘子里有 ' + a + ' 个 ' + th + '，又放进 ' + b + ' 个' : '盘子里有 ' + a + ' 个 ' + th + '，吃掉了 ' + b + ' 个',
      en: add ? 'There are ' + a + ' ' + th + ' on the plate, and ' + b + ' more are put in' : 'There are ' + a + ' ' + th + ' on the plate, and ' + b + ' are eaten' });
    q.scene.push({ k: 'big', v: new Array(a + 1).join(th) });
    var good = add ? 'dots:' + a + '+' + b : 'dots:' + a + '-' + b;
    var wr = [add ? 'dots:' + a + '-' + Math.min(b, a - 1 || 1) : 'dots:' + a + '+' + b, add ? 'dots:' + a + '+' + (b + 1) : 'dots:' + a + '-' + (b + 1 < a ? b + 1 : Math.max(1, b - 1)),
      add ? 'dots:' + (a + b) : 'dots:' + (a - b), add ? 'dots:' + (a + 1) + '+' + b : 'dots:' + a + '-' + (b > 1 ? b - 1 : b + 1)];
    return opts(q, good, wr, 3);
  }
  function quantEq(g) {
    var big = g === 'G2', add = Math.random() < 0.55, a, b, th = pick(STORY_THING);
    if (big) { a = ri(20, 70); b = ri(10, 90 - 0); if (add) b = ri(10, 99 - a); else { a = ri(40, 90); b = ri(10, a - 5); } }
    else if (add) { a = ri(3, 12); b = ri(2, 20 - a); } else { a = ri(8, 18); b = ri(2, a - 2); }
    var op = add ? '+' : '−', E = function (x, o, y) { return x + ' ' + o + ' ' + y; };
    var q = mk('quantitative', 'eq', 'use', '哪个算式能表示这件事？', 'Which equation shows this story?',
      add ? '合起来用加' : '拿走用减', add ? 'Putting together: add' : 'Taking away: subtract');
    q.scene.push({ k: 'story', zh: add ? '篮子里有 ' + a + ' 个 ' + th + '，又放进 ' + b + ' 个' : '篮子里有 ' + a + ' 个 ' + th + '，拿走了 ' + b + ' 个',
      en: add ? 'A basket holds ' + a + ' ' + th + ', and ' + b + ' more are added' : 'A basket holds ' + a + ' ' + th + ', and ' + b + ' are taken out' });
    return opts(q, E(a, op, b), [E(a, add ? '−' : '+', b), E(a, op, b + 1), E(b, add ? '−' : '−', a > b ? a : b + 1), E(a + 1, op, b)], 3);
  }
  function quantMul(g) {
    var a = ri(2, 9), b = pick([2, 3, 4, 5, 6, 8, 9, 10]), th = pick(['🍎', '🍪', '🥚']);
    var q = mk('quantitative', 'mul', 'use', '哪个算式能表示这件事？', 'Which equation shows this story?', '每一份一样多，用乘', 'Equal groups: multiply');
    q.scene.push({ k: 'story', zh: a + ' 个盒子，每个盒子里有 ' + b + ' 个 ' + th, en: a + ' boxes, with ' + b + ' ' + th + ' in each' });
    return opts(q, a + ' × ' + b, [a + ' + ' + b, a + ' − ' + b, b + ' + ' + b, (a + 1) + ' × ' + b], 4);
  }
  function quantBalance(g) {
    var a = ri(10, 40), t = a + ri(5, 45), x = t - a, q = mk('quantitative', 'balance', 'use',
      '要让天平平衡，方块里应该是几？', 'What number in the box balances the scale?', '两边要一样重', 'Both sides must weigh the same');
    q.scene.push({ k: 'balance', left: [a, '□'], right: t });
    return opts(q, x, nums(x, [x + 1, x - 1, t + a, x + 10, x - 10, t], 1, 100), 4);
  }
  // ── de-duplication inside one session: a maker asks for a fresh entry ─────
  var _used = {};
  function fresh(key, list) {
    var seen = _used[key] || (_used[key] = []);
    var left = list.filter(function (x) { return seen.indexOf(x) < 0; });
    if (!left.length) { seen.length = 0; left = list.slice(); }
    var p = pick(left); seen.push(p); return p;
  }

  // ── evaluate: is the equation Sam wrote right? (direction / numbers / missing step) ──
  function quantClaim(g) {
    var kind = pick(['dir', 'num', 'miss']), right = Math.random() < 0.35, a = ri(20, 60), b = ri(5, 18), c = ri(3, 15);
    var add = Math.random() < 0.5, story, claim, bird = '🐦';
    if (kind === 'miss') {
      story = ['树上有 ' + a + ' 只鸟，飞走了 ' + b + ' 只，又飞来 ' + c + ' 只', a + ' birds sit in the tree, ' + b + ' fly away, then ' + c + ' fly in'];
      claim = right ? a + ' − ' + b + ' + ' + c : a + ' − ' + b;
    } else {
      story = add ? ['树上有 ' + a + ' 只鸟，又飞来 ' + b + ' 只', a + ' birds sit in the tree, and ' + b + ' more fly in']
                  : ['树上有 ' + a + ' 只鸟，飞走了 ' + b + ' 只', a + ' birds sit in the tree, and ' + b + ' fly away'];
      var op = add ? '+' : '−', wrongOp = add ? '−' : '+';
      if (kind === 'dir') claim = a + ' ' + (right ? op : wrongOp) + ' ' + b;
      else claim = a + ' ' + op + ' ' + (right ? b : b + pick([1, 2, -1, 3])) ;
    }
    var q = mk('quantitative', 'claim', 'evaluate', '小明列的算式：' + claim + '。对吗？', 'Sam wrote ' + claim + '. Is that right?',
      '把故事一步一步对着算式检查', 'Check the story against the equation step by step');
    q.scene.push({ k: 'story', zh: story[0], en: story[1] });
    var T = { R: tx('对 ✅', 'Right ✅'), dir: tx('不对 ❌ 加减用反了', 'Wrong ❌ add and subtract are mixed up'),
      num: tx('不对 ❌ 数字抄错了', 'Wrong ❌ a number is copied wrong'), miss: tx('不对 ❌ 漏掉了一步', 'Wrong ❌ a step is missing') };
    var key = right ? 'R' : kind;
    return opts(q, T[key], Object.keys(T).filter(function (k) { return k !== key; }).map(function (k) { return T[k]; }), 4);
  }

  // ── evaluate: what important information does this model leave out? ──────
  var MISSING = [
    { s: ['想告诉朋友从家走到学校', 'You want to tell a friend the way from home to school'], m: ['一张只画了「家」和「学校」的地图', 'a map showing only "home" and "school"'], x: ['中间怎么走（路线）', 'how to get between them (the route)'] },
    { s: ['想记录一周里每天的气温', 'You want to record each day\'s temperature this week'], m: ['一张表，只有「星期」一列', 'a table with only a "day" column'], x: ['气温那一列', 'the temperature column'] },
    { s: ['想比较三个班的人数', 'You want to compare the size of three classes'], m: ['一张柱状图，柱子下面没写班级', 'a bar chart whose bars have no class names'], x: ['每根柱子是哪个班', 'which class each bar is'] },
    { s: ['3 个盒子，每盒 4 个，一共有几个', '3 boxes with 4 in each — how many in all'], m: ['算式 4 + 4', 'the equation 4 + 4'], x: ['第 3 个盒子', 'the third box'] },
    { s: ['小明排在小红前面，小红排在小华前面', 'Sam is ahead of Amy, and Amy is ahead of Lee'], m: ['一张队伍图，只画了小明和小华', 'a queue picture showing only Sam and Lee'], x: ['站在中间的小红', 'Amy in the middle'] },
    { s: ['种子长成了苹果树', 'A seed grows into an apple tree'], m: ['一个流程，只画了「种子」和「苹果」', 'a process showing only "seed" and "apple"'], x: ['中间发芽、长大的步骤', 'the steps in between: sprouting and growing'] },
    { s: ['想知道班里男生女生各有多少人', 'You want to know how many boys and girls are in the class'], m: ['一张柱状图，旁边没有数字刻度', 'a bar chart with no number scale'], x: ['每根柱子代表多少人', 'how many people each bar stands for'] },
    { s: ['有 5 个苹果，吃掉 2 个，又买来 4 个', 'There are 5 apples, 2 are eaten, then 4 are bought'], m: ['算式 5 − 2', 'the equation 5 − 2'], x: ['又买来的 4 个', 'the 4 that were bought'] }
  ];
  function modelMissing(g) {
    var p = fresh('missing', MISSING), q = mk('quantitative', 'missing', 'evaluate', '这个表示漏掉了什么重要信息？', 'What important information does this model leave out?',
      '想想：要回答这个问题，还需要知道什么', 'What else would you need to answer the question?');
    q.scene.push({ k: 'story', zh: p.s[0], en: p.s[1] });
    q.scene.push({ k: 'rule', zh: '小明的表示：' + p.m[0], en: 'Sam\'s model: ' + p.m[1] });
    var wr = shuffle(MISSING.filter(function (x) { return x !== p; })).slice(0, 3).map(function (x) { return tx(x.x[0], x.x[1]); });
    return opts(q, tx(p.x[0], p.x[1]), wr, 4);
  }

  var CHOOSE = [
    { zh: '想知道 3 盒各 4 个，一共有几个', en: 'You want to know how many in all: 3 boxes of 4', a: 'eq' },
    { zh: '想知道买 2 支笔、每支 5 元，一共多少钱', en: 'You want to know the cost of 2 pens at 5 dollars each', a: 'eq' },
    { zh: '想知道原来有 8 个，吃掉 3 个，还剩几个', en: 'You want to know how many are left after 3 of 8 are eaten', a: 'eq' },
    { zh: '想知道有 6 颗糖，又得到 4 颗，一共几颗', en: 'You want to know the total after 6 sweets and 4 more', a: 'eq' },
    { zh: '想记下每个同学的名字、身高和体重', en: 'You want to note down each classmate\'s name, height and weight', a: 'table' },
    { zh: '想记下每天的日期、天气和气温', en: 'You want to note down each day\'s date, weather and temperature', a: 'table' },
    { zh: '想把图书角每本书的名字、作者和页数都列出来', en: 'You want to list each library book\'s title, author and pages', a: 'table' },
    { zh: '想告诉别人从家到学校怎么走', en: 'You want to tell someone the way from home to school', a: 'map' },
    { zh: '想让客人找到公园里的厕所', en: 'You want a visitor to find the toilets in the park', a: 'map' },
    { zh: '想说明教室、操场和食堂各在哪个位置', en: 'You want to show where the classroom, playground and canteen are', a: 'map' },
    { zh: '想一眼比较 4 个班谁的人数最多', en: 'You want to see at a glance which of 4 classes is biggest', a: 'bar' },
    { zh: '想一眼看出三种水果哪种卖得最多', en: 'You want to see at a glance which of three fruits sold most', a: 'bar' },
    { zh: '想一眼看出班里喜欢红、黄、蓝的人谁最多', en: 'You want to see at a glance which of red, yellow, blue is most liked', a: 'bar' }
  ];
  function chooseModel(g) {
    var p = fresh('choose', CHOOSE), T = { eq: tx('算式', 'Equation'), table: tx('表格', 'Table'), map: tx('地图', 'Map'), bar: tx('柱状图', 'Bar chart') };
    var q = mk('quantitative', 'choose', 'evaluate', '用哪一种表示最合适？', 'Which kind of model fits best?', '想想：这件事最想看清的是什么', 'What do you most want to see clearly?');
    q.scene.push({ k: 'story', zh: p.zh, en: p.en });
    return opts(q, T[p.a], Object.keys(T).filter(function (k) { return k !== p.a; }).map(function (k) { return T[k]; }), 4);
  }

  // ── RULE ──────────────────────────────────────────────────────────────────
  // rule text for one attribute value: colour -> "红色的东西", kind -> "水果"
  function valName(attr, v) {
    var n = attr === 'c' ? COLOUR[v] : KIND[v];
    return attr === 'c' ? { zh: n[0] + '的东西', en: n[1] + ' things' }
      : { zh: n[0], en: n[1] === 'animal' ? 'animals' : n[1] === 'vehicle' ? 'vehicles' : 'fruit' };
  }
  function doorPick() {
    for (var t = 0; t < 200; t++) {
      var attr = pick(['c', 'k']), v = pick(ITEMS)[attr];
      var yes = ITEMS.filter(function (i) { return i[attr] === v; }), no = ITEMS.filter(function (i) { return i[attr] !== v; });
      if (yes.length >= 2 && no.length >= 3) return { attr: attr, v: v, yes: yes, no: no };
    }
  }
  function ruleDoor(g) {
    var d = doorPick(), n = valName(d.attr, d.v);
    var q = mk('rule', 'door', 'use', '哪一个能通过？', 'Which one can pass?', '只看规则里说的特征', 'Only look at what the rule says');
    q.scene.push({ k: 'rule', zh: '规则：只有' + n.zh + '能进门', en: 'Rule: only ' + n.en + ' may go through' });
    return opts(q, nm(pick(d.yes).e), shuffle(d.no).slice(0, 3).map(function (i) { return nm(i.e); }), 3);
  }
  // the reverse rule: name what may NOT pass, the child finds the one that can
  function ruleDoorNot(g) {
    var d = doorPick(), n = valName(d.attr, d.v);
    var q = mk('rule', 'doorNot', 'use', '哪一个能通过？', 'Which one can pass?', '规则说的是谁不能进，剩下的才能进', 'The rule says who may NOT enter — everything else can');
    q.scene.push({ k: 'rule', zh: '规则：' + n.zh + '不能进门', en: 'Rule: ' + n.en + ' may NOT go through' });
    return opts(q, nm(pick(d.no).e), shuffle(d.yes).slice(0, 3).map(function (i) { return nm(i.e); }), 4);
  }
  function ruleDoor2(g) {
    for (var t = 0; t < 300; t++) {
      var kd = pick(Object.keys(KIND)), col = pick(Object.keys(COLOUR));
      var ok = ITEMS.filter(function (i) { return i.k === kd && i.c === col; });
      if (!ok.length) continue;
      var half = ITEMS.filter(function (i) { return (i.k === kd) !== (i.c === col); }), none = ITEMS.filter(function (i) { return i.k !== kd && i.c !== col; });
      if (half.length < 2 || !none.length) continue;
      var q = mk('rule', 'door2', 'use', '哪一个能通过？', 'Which one can pass?', '两个条件都要满足', 'Both conditions must hold');
      q.scene.push({ k: 'rule', zh: '规则：必须是' + COLOUR[col][0] + '，而且是' + KIND[kd][0], en: 'Rule: it must be ' + COLOUR[col][1] + ' AND a ' + KIND[kd][1] });
      return opts(q, nm(pick(ok).e), shuffle(half).slice(0, 2).concat([pick(none)]).map(function (i) { return nm(i.e); }), 4);
    }
    return ruleDoor(g);
  }
  function rulePath(g) {
    var cols = ri(2, 3), rows = ri(1, 2), rights = cols, downs = rows, A = { R: '→', D: '↓', L: '←', U: '↑' };
    var base = shuffle(new Array(rights + 1).join('R').split('').concat(new Array(downs + 1).join('D').split('')));
    var fmt = function (a) { return a.map(function (x) { return A[x]; }).join(' '); };
    var q = mk('rule', 'path', 'use', '哪条路线能走到 🥕？', 'Which route reaches 🥕?', '先看规则能往哪走，再数格子', 'Check which moves are allowed, then count squares');
    q.scene.push({ k: 'rule', zh: '规则：🐰 只能向右或向下走', en: 'Rule: 🐰 may only move right or down' });
    q.scene.push({ k: 'story', zh: '🥕 在 🐰 右边 ' + rights + ' 格、下面 ' + downs + ' 格', en: '🥕 is ' + rights + ' squares right and ' + downs + ' squares down from 🐰' });
    var good = fmt(base), wr = [];
    var viol = base.slice(); viol.splice(ri(0, viol.length), 0, 'L'); viol.splice(ri(0, viol.length), 0, 'R'); wr.push(fmt(viol));
    var less = base.slice(); less.splice(less.indexOf('R'), 1); wr.push(fmt(less));
    var more = base.slice(); more.push('D'); wr.push(fmt(more));
    var swapped = shuffle(new Array(rights + 1).join('R').split('').concat(new Array(downs + 2).join('D').split(''))); wr.push(fmt(swapped));
    return opts(q, good, wr, 4);
  }
  function ruleSteps(g) {
    var m = pick([2, 3, 5]), d = ri(m * 2 + 1, m * (g === 'G2' ? 9 : 4) + m - 1);
    if (d % m === 0) d += 1;
    var best = Math.floor(d / m) + (d % m);
    var q = mk('rule', 'steps', 'use', '最少要走几次？', 'What is the fewest number of moves?', '先用大步，剩下的用小步', 'Use big moves first, then small ones');
    q.scene.push({ k: 'rule', zh: '规则：🐰 每次只能向右跳 1 格或 ' + m + ' 格', en: 'Rule: 🐰 may only hop right by 1 or by ' + m });
    q.scene.push({ k: 'story', zh: '🥕 在右边 ' + d + ' 格', en: '🥕 is ' + d + ' squares to the right' });
    return opts(q, best, nums(best, [d, Math.floor(d / m), best + 1, best - 1, Math.ceil(d / m), best + 2], 1, 100), 4);
  }


  // ── words for emoji: prompts name every picture so voice can read it ──────
  // "🐻" in a sentence becomes "小熊（🐻）" / "bear (🐻)". game.js strips the
  // bracketed emoji again before speaking.
  var EMO = {
    '🐰': ['兔子', 'rabbit'], '🐱': ['小猫', 'cat'], '🐶': ['小狗', 'dog'], '🐸': ['青蛙', 'frog'], '🐻': ['小熊', 'bear'],
    '🐵': ['猴子', 'monkey'], '🐼': ['熊猫', 'panda'], '🐯': ['老虎', 'tiger'], '🍎': ['苹果', 'apple'], '🍌': ['香蕉', 'banana'],
    '🍇': ['葡萄', 'grapes'], '🍓': ['草莓', 'strawberry'], '🚗': ['汽车', 'car'], '🌳': ['大树', 'tree'], '🏠': ['房子', 'house'],
    '⭐': ['星星', 'star'], '🎈': ['气球', 'balloon'], '🐟': ['小鱼', 'fish'], '🦋': ['蝴蝶', 'butterfly'], '🍪': ['饼干', 'cookie'],
    '🍋': ['柠檬', 'lemon'], '🚒': ['消防车', 'fire truck'], '🚕': ['出租车', 'taxi'], '🚙': ['越野车', 'jeep'], '🐞': ['瓢虫', 'ladybug'],
    '🦀': ['螃蟹', 'crab'], '🐥': ['小鸡', 'chick'], '🐳': ['鲸鱼', 'whale'], '🥕': ['胡萝卜', 'carrot'], '🍒': ['樱桃', 'cherries'], '🍏': ['青苹果', 'green apple'], '🐢': ['乌龟', 'turtle'], '🥚': ['鸡蛋', 'egg']
  };
  var EMO_RE = new RegExp(Object.keys(EMO).join('|'), 'g');
  function nm(e) { var w = EMO[e]; return e + '~' + (w ? w[0] : '') + '~' + (w ? w[1] : ''); }
  function words(str, lang) {
    if (!str) return str;
    return str.replace(EMO_RE, function (e) { return lang === 'zh' ? EMO[e][0] + '（' + e + '）' : EMO[e][1] + ' (' + e + ')'; });
  }
  function wordify(q) {
    q.promptZh = words(q.promptZh, 'zh'); q.promptEn = words(q.promptEn, 'en');
    q.hintZh = words(q.hintZh, 'zh'); q.hintEn = words(q.hintEn, 'en');
    q.scene.forEach(function (b) {
      if (b.k === 'story' || b.k === 'rule') { b.zh = words(b.zh, 'zh'); b.en = words(b.en, 'en'); }
    });
    return q;
  }

  // ── makers & themed units ─────────────────────────────────────────────────
  var MAKERS = {
    mapDots: mapDots, mapLegend: mapLegend, pictograph: pictograph,
    groupWith: groupWith, groupOdd: groupOdd, groupRule: groupRule,
    relOrder: relOrder, relGraph: relGraph,
    spaceRow: spaceRow, space2x2: space2x2, spaceRoute: spaceRoute, spaceCoord: spaceCoord, spaceClaim: spaceClaim,
    procNext: procNext, procSwap: procSwap, procExtra: procExtra,
    quantDots: quantDots, quantEq: quantEq, quantMul: quantMul, quantBalance: quantBalance, quantClaim: quantClaim, modelMissing: modelMissing, chooseModel: chooseModel,
    ruleDoor: ruleDoor, ruleDoorNot: ruleDoorNot, ruleDoor2: ruleDoor2, rulePath: rulePath, ruleSteps: ruleSteps
  };

  var GRADE_UNITS = {
    K1: [
      { key: 'map', icon: '🔗', zh: '用符号代表', en: 'Symbols Stand For Things', dzh: '一个点、一个符号，代表一个东西。', den: 'A dot or a symbol stands for a thing.',
        slots: ['mapDots', 'mapLegend', 'mapDots', 'mapLegend', 'mapDots', 'mapLegend', 'mapDots', 'mapLegend', 'mapDots', 'mapLegend'] },
      { key: 'group', icon: '🗂️', zh: '为了目的分一分', en: 'Group With a Purpose', dzh: '这次看颜色，还是看种类？', den: 'Colour this time, or kind?',
        slots: ['groupWith', 'groupWith', 'groupWith', 'groupWith', 'groupWith', 'groupWith', 'groupWith', 'groupWith', 'groupWith', 'groupWith'] },
      { key: 'space', icon: '🗺️', zh: '位置示意图', en: 'Position Diagrams', dzh: '左右、上下、中间。', den: 'Left and right, above and below, the middle.',
        slots: ['spaceRow', 'spaceRow', 'spaceRow', 'spaceRow', 'spaceRow', 'spaceRow', 'spaceRow', 'spaceRow', 'spaceRow', 'spaceRow'] }
    ],
    K2: [
      { key: 'represent', icon: '🔗', zh: '表示与分组', en: 'Represent and Group', dzh: '对照表、符号还原，按目的分组。', den: 'Keys, reading symbols back, grouping by purpose.',
        slots: ['mapLegend', 'groupWith', 'mapLegend', 'groupWith', 'mapLegend', 'groupWith', 'mapLegend', 'groupWith', 'mapLegend', 'groupWith'] },
      { key: 'relation', icon: '↔️', zh: '位置与关系', en: 'Positions and Relations', dzh: '谁在谁的左边；四格图里找位置。', den: 'Who is left of whom; finding places in a four-square map.',
        slots: ['relOrder', 'space2x2', 'relOrder', 'space2x2', 'relOrder', 'space2x2', 'relOrder', 'space2x2', 'relOrder', 'space2x2'] },
      { key: 'process', icon: '🪜', zh: '一步接一步', en: 'Step by Step', dzh: '种子长大、小鸡出壳……缺哪一步？', den: 'A seed grows, a chick hatches… which step is missing?',
        slots: ['procNext', 'procNext', 'procNext', 'procNext', 'procNext', 'procNext', 'procNext', 'procNext', 'procNext', 'procNext'] },
      { key: 'rule', icon: '🚪', zh: '规则小世界', en: 'Small Rule Worlds', dzh: '只有符合规则的才能通过。', den: 'Only what fits the rule gets through.',
        slots: ['ruleDoor', 'ruleDoor', 'ruleDoor', 'ruleDoor', 'ruleDoor', 'ruleDoor', 'ruleDoor', 'ruleDoor', 'ruleDoor', 'ruleDoor'] }
    ],
    G1: [
      { key: 'story', icon: '🍓', zh: '情境到点图到算式', en: 'Story to Dots to Equation', dzh: '先画点图，再写算式。', den: 'Draw the dots first, then write the equation.',
        slots: ['quantDots', 'quantDots', 'quantEq', 'pictograph', 'quantDots', 'quantEq', 'pictograph', 'quantEq', 'quantDots', 'quantEq'] },
      { key: 'route', icon: '🧭', zh: '路线图', en: 'Route Maps', dzh: '照着箭头在格子地图上走。', den: 'Follow the arrows on a grid map.',
        slots: ['spaceRoute', 'spaceRoute', 'spaceRoute', 'spaceRoute', 'spaceRoute', 'spaceRoute', 'spaceRoute', 'spaceRoute', 'spaceRoute', 'spaceRoute'] },
      { key: 'link', icon: '🕸️', zh: '关系与流程', en: 'Links and Processes', dzh: '谁和谁是朋友；哪一步放错了。', den: 'Who is friends with whom; which step is out of order.',
        slots: ['relGraph', 'procSwap', 'relGraph', 'procSwap', 'relGraph', 'procSwap', 'relGraph', 'procSwap', 'relGraph', 'procSwap'] },
      { key: 'rule', icon: '🚪', zh: '规则与换目的', en: 'Rules and New Purposes', dzh: '两个条件的规则；只能向右向下的路线。', den: 'Two-condition rules; routes that may only go right and down.',
        slots: ['ruleDoor2', 'rulePath', 'groupOdd', 'ruleDoorNot', 'rulePath', 'groupOdd', 'ruleDoor2', 'rulePath', 'ruleDoorNot', 'groupOdd'] }
    ],
    G2: [
      { key: 'quant', icon: '⚖️', zh: '算式与天平', en: 'Equations and Scales', dzh: '把情境写成算式，让天平平衡。', den: 'Write the story as an equation; balance the scale.',
        slots: ['quantEq', 'quantMul', 'quantBalance', 'pictograph', 'quantEq', 'quantMul', 'quantBalance', 'pictograph', 'quantEq', 'quantBalance'] },
      { key: 'choose', icon: '🧐', zh: '选模型、评模型', en: 'Choose and Judge Models', dzh: '哪种表示最合适？这个模型对吗？', den: 'Which model fits best? Is this model right?',
        slots: ['chooseModel', 'quantClaim', 'modelMissing', 'spaceClaim', 'chooseModel', 'quantClaim', 'modelMissing', 'groupRule', 'chooseModel', 'modelMissing'] },
      { key: 'space', icon: '📍', zh: '坐标与地图', en: 'Coordinates and Maps', dzh: '(列，行) 找位置。', den: 'Find places with (column, row).',
        slots: ['spaceCoord', 'spaceCoord', 'spaceCoord', 'spaceCoord', 'spaceCoord', 'spaceCoord', 'spaceCoord', 'spaceCoord', 'spaceCoord', 'spaceCoord'] },
      { key: 'system', icon: '🧩', zh: '关系网与流程', en: 'Networks and Processes', dzh: '谁的朋友最多；哪一步不属于。', den: 'Who has the most friends; which step does not belong.',
        slots: ['relGraph', 'procExtra', 'relGraph', 'procExtra', 'relGraph', 'procExtra', 'relGraph', 'procExtra', 'relGraph', 'procExtra'] },
      { key: 'rule', icon: '🎲', zh: '规则系统', en: 'Rule Systems', dzh: '每次只能走 1 格或 m 格，最少几次？', den: 'Hop 1 or m squares at a time — fewest moves?',
        slots: ['ruleSteps', 'rulePath', 'ruleDoorNot', 'ruleDoor2', 'ruleSteps', 'rulePath', 'ruleSteps', 'ruleDoorNot', 'ruleSteps', 'ruleDoor2'] }
    ]
  };

  function generate(grade, count, unitKey) {
    var units = GRADE_UNITS[grade] || GRADE_UNITS.K1;
    var u = units.filter(function (x) { return x.key === unitKey; })[0] || units[0];
    var out = [];
    _used = {};
    for (var i = 0; i < count; i++) {
      var q = wordify(MAKERS[u.slots[i % u.slots.length]](grade));
      q.grade = grade;
      out.push(q);
    }
    return out;
  }

  return { generate: generate, GRADE_UNITS: GRADE_UNITS, MAKERS: MAKERS, ITEMS: ITEMS, EMO: EMO, nm: nm, words: words, KIND: KIND, COLOUR: COLOUR, CHAINS: CHAINS };
})();
