'use strict';

/**
 * Number Sense generator — one table of question types x grades.
 *
 * GRADIENT RULE (the design principle of this module):
 *   grades differ by STRUCTURE / ABSTRACTION / REPRESENTATION first; the number
 *   range only follows. A type may appear at several grades only if each grade
 *   asks something structurally different (see GRADE_TYPES + the `mode` lists).
 *   Hard ranges: K1 <= 5, K2 <= 10, G1 <= 20, G2 <= 100.
 *
 * Question shape (consumed by game.js):
 *   { type: 'quantity'|'part_whole'|'composition'|'representation'|
 *           'order'|'estimation'|'operation'|'magnitude',
 *     mode, view, options: [...], answer: <index>, hintZh, hintEn, ... }
 * `view` is a ready-made description of what to draw; game.js only renders it.
 */
var NS_GEN = (function () {

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[ri(0, a.length - 1)]; }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = ri(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function uniq(a) { var s = {}; return a.filter(function (x) { var k = JSON.stringify(x); return s[k] ? false : (s[k] = 1); }); }

  var ICONS = ['🍎', '🍓', '⭐', '🎈', '🐟', '🚗', '🌸', '🍪'];

  // numeric options around `n`: n plus two distinct near-misses, all within [lo,hi]
  function numOptions(n, lo, hi, step) {
    step = step || 1;
    var c = uniq([n, n - step, n + step, n - 2 * step, n + 2 * step].filter(function (v) { return v >= lo && v <= hi; }));
    var wrong = shuffle(c.filter(function (v) { return v !== n; })).slice(0, 2);
    return shuffle([n].concat(wrong));
  }
  function finish(q, correctValue) {
    q.answer = q.options.map(function (o) { return JSON.stringify(o); }).indexOf(JSON.stringify(correctValue));
    return q;
  }


  // ── Second batch: interactive questions (tap to build / place / cut) ──────
  // One 确定 button is the only option; the widget in game.js keeps the child's
  // current value and checkAnswer compares it with q.target.
  function inter(q, target) { q.interactive = true; q.options = ['ok']; q.answer = 0; q.target = target; return q; }

  function placeLine(g) {
    var c = { K1: [0, 5, 1, 1], K2: [0, 10, 1, 5], G1: [0, 20, 1, 5], G2: [0, 100, 10, 50] }[g];
    var lo = c[0], hi = c[1], step = c[2], label = c[3], t;
    do { t = g === 'G2' ? ri(1, 9) * 10 : ri(1, hi - 1); } while (g !== 'K1' && t % label === 0);
    return inter({ type: 'order', mode: 'place', view: { lo: lo, hi: hi, step: step, label: label, target: t },
      hintZh: '先找标出来的数，再数一数离它几格。', hintEn: 'Find the numbers shown, then count the steps from them.' }, t);
  }
  function makeN(g, icon) {
    var t = g === 'K1' ? ri(2, 5) : ri(4, 10);
    return inter({ type: 'quantity', mode: 'make', view: { target: t, icon: icon, pool: t + (g === 'K1' ? 2 : 3) },
      hintZh: '一个一个点，放进盘子里，够了就停。', hintEn: 'Tap them one by one onto the plate, stop when you have enough.' }, t);
  }
  function splitCut(g) {
    var n, a, equal = false;
    if (g === 'K1') { n = ri(3, 5); a = ri(1, n - 1); }
    else if (g === 'K2') { n = ri(6, 10); a = ri(1, n - 1); }
    else { n = ri(5, 10) * 2; a = n / 2; equal = true; }
    return inter({ type: 'composition', mode: 'split_cut', view: { n: n, a: a, equal: equal, icon: pick(ICONS) },
      hintZh: equal ? '分成一样多，每份是一半。' : '点一下，让左边刚好是 ' + a + ' 个。', hintEn: equal ? 'Equal parts — each is half.' : 'Tap so the left side has exactly ' + a + '.' }, a);
  }
  function buildNum(g) {
    if (g === 'G1') { var t = ri(11, 20);
      return inter({ type: 'representation', mode: 'build_frame', view: { target: t },
        hintZh: '先把第一个十格涂满，再涂剩下的。', hintEn: 'Fill the first ten-frame, then the rest.' }, t); }
    var t2 = ri(2, 9) * 10 + ri(1, 9);
    return inter({ type: 'representation', mode: 'build_tens', view: { target: t2 },
      hintZh: '几个十，再加几个一。', hintEn: 'Some tens, then some ones.' }, t2);
  }


  // ── Multi-select: tap every card that shows the same number ───────────────
  function multiRep(g) {
    var kinds, n, hi;
    if (g === 'K2') { kinds = ['num', 'dots', 'fingers', 'dice', 'split']; n = ri(3, 10); hi = 10; }
    else if (g === 'G1') { kinds = ['num', 'dots', 'split', 'frame', 'sum']; n = ri(11, 20); hi = 20; }
    else { kinds = ['num', 'tens', 'sum']; n = ri(21, 89); hi = 99; }
    var good = Math.min(ri(2, 3), kinds.length), ks = shuffle(kinds).slice(0, good);
    var near = [n - 1, n + 1, n - 2, n + 2];
    if (g === 'G2') near = near.concat([n + 10, n - 10, (n % 10) * 10 + Math.floor(n / 10)]);
    near = shuffle(uniq(near).filter(function (v) { return v >= 2 && v <= hi && v !== n; })).slice(0, 6 - good);
    var cards = ks.map(function (k) { return { face: faceOf(k, n), ok: true }; })
      .concat(near.map(function (w) { return { face: faceOf(pick(kinds), w), ok: false }; }));
    cards = shuffle(cards);
    var target = []; cards.forEach(function (c, i) { if (c.ok) target.push(i); });
    cards.forEach(function (c) { delete c.ok; });
    return inter({ type: 'representation', mode: 'multi', view: { n: n, cards: cards },
      hintZh: '长得不一样也可能是同一个数,把所有表示 ' + n + ' 的都选出来。', hintEn: 'Different looks can mean the same number — pick every card that means ' + n + '.' }, target);
  }

  // ── Composition: how many splits / which pair is wrong ────────────────────
  function countWays(g) {
    var n, ways, tens = false;
    if (g === 'K2') { n = ri(4, 8); ways = Math.floor(n / 2); }
    else if (g === 'G1') { n = ri(9, 14); ways = Math.floor(n / 2); }
    else { n = ri(3, 9) * 10; ways = Math.floor(n / 20); tens = true; }
    return finish({ type: 'composition', mode: 'count_ways', view: { n: n, tens: tens }, options: numOptions(ways, 1, Math.max(4, ways + 2)),
      hintZh: tens ? '两份都是整十数:10+?、20+?……一个一个列。' : '从 1 + ? 开始,一个一个列,别重复(2+3 和 3+2 算一种)。',
      hintEn: tens ? 'Both parts are whole tens: 10+?, 20+?... list them.' : 'Start at 1 + ? and list them; 2+3 and 3+2 count once.' }, ways);
  }
  function validCheck(g) {
    var n, lo = 1, bad;
    if (g === 'K2') n = ri(5, 10); else if (g === 'G1') n = ri(11, 20); else n = ri(31, 99);
    var pairs = [], bads = [], tries = 0;
    while (pairs.length < 2 && tries++ < 60) {
      var a = ri(lo, n - 1), p = [a, n - a];
      if (!pairs.some(function (q) { return q[0] === p[0] || q[1] === p[0]; })) pairs.push(p);
    }
    var a2 = ri(lo, n - 2), d = g === 'G2' ? pick([1, 10]) : 1;
    bad = [a2, n - a2 + (Math.random() < 0.5 ? d : -d)];
    if (bad[1] < 1 || bad[0] + bad[1] === n) bad[1] = n - a2 + d;
    var opts = shuffle(pairs.slice(0, 2).concat([bad]).map(function (q) { return Math.random() < 0.5 ? q : [q[1], q[0]]; }));
    var answerPair = opts.filter(function (q) { return q[0] + q[1] !== n; })[0];
    if (opts.length < 3 || !answerPair) return null;
    return finish({ type: 'composition', mode: 'valid_check', view: { n: n }, options: opts,
      hintZh: '把每一对加起来看看,哪一对不等于 ' + n + '。', hintEn: 'Add each pair — which one does not make ' + n + '?' }, answerPair);
  }

  // ── NS01 Quantity ──────────────────────────────────────────────────────────
  // K1: flash a small set, how many?   K2: flash up to 10 in a structured layout
  // G1: compare two groups with a decoy layout   G2: estimate a big scatter by 10s
  function quantity(g) {
    var icon = pick(ICONS);
    if ((g === 'K1' || g === 'K2') && Math.random() < 0.3) return makeN(g, icon);
    if (g === 'K1') {
      if (Math.random() < 0.5) { var n = ri(1, 5); return finish({ type: 'quantity', mode: 'flash', view: { dots: n, icon: icon, flashMs: 1800 }, options: numOptions(n, 1, 5), hintZh: '不用数，一眼看有几个。', hintEn: 'Do not count — see how many at a glance.' }, n); }
      var a = ri(1, 5), b; do { b = ri(1, 5); } while (b === a);
      return finish({ type: 'quantity', mode: 'compare', view: { left: a, right: b, icon: icon, flashMs: 1800 }, options: ['left', 'right'], hintZh: '哪边看起来更多？', hintEn: 'Which side looks like more?' }, a > b ? 'left' : 'right');
    }
    if (g === 'K2') {
      var m = ri(5, 10);
      return finish({ type: 'quantity', mode: 'flash', view: { dots: m, icon: icon, flashMs: 1600, rows: true }, options: numOptions(m, 1, 10), hintZh: '分成两行看，更容易一眼看出来。', hintEn: 'Seeing it as two rows makes it easier.' }, m);
    }
    if (g === 'G1') {
      var l = ri(8, 19), r; do { r = ri(8, 19); } while (Math.abs(l - r) < 2);
      return finish({ type: 'quantity', mode: 'compare', view: { left: l, right: r, icon: icon, flashMs: 1400, decoy: true }, options: ['left', 'right'], hintZh: '排得开不一定多，看数量。', hintEn: 'Spread out does not mean more — look at the amount.' }, l > r ? 'left' : 'right');
    }
    var big = ri(3, 9) * 10 + pick([0, 0, 5]);
    return finish({ type: 'quantity', mode: 'flash', view: { dots: big, icon: icon, flashMs: 1500, scatter: true }, options: numOptions(big, 10, 100, 10), hintZh: '大约有几十个？十个十个地估。', hintEn: 'About how many tens? Estimate by tens.' }, big);
  }

  // ── NS02 Representation: same number, different faces ─────────────────────
  function faceOf(kind, n) {
    if (kind === 'num') return { kind: 'num', n: n };
    if (kind === 'dots') return { kind: 'dots', n: n };
    if (kind === 'fingers') return { kind: 'fingers', n: n };
    if (kind === 'dice') return { kind: 'dice', n: n };
    if (kind === 'split') { var a = ri(1, n - 1); return { kind: 'split', a: a, b: n - a, n: n }; }
    if (kind === 'frame') return { kind: 'frame', n: n };
    if (kind === 'tens') return { kind: 'tens', tens: Math.floor(n / 10), ones: n % 10, n: n };
    return { kind: 'sum', a: ri(1, n - 1), n: n };
  }
  function representation(g) {
    if ((g === 'G1' || g === 'G2') && Math.random() < 0.4) return buildNum(g);
    if (g !== 'K1' && Math.random() < 0.3) return multiRep(g);
    var kinds, lo, hi, prompt;
    if (g === 'K1') { kinds = ['num', 'dots', 'fingers']; lo = 1; hi = 5; }
    else if (g === 'K2') { kinds = ['num', 'dots', 'fingers', 'dice', 'split']; lo = 2; hi = 10; }
    else if (g === 'G1') { kinds = ['num', 'dots', 'split', 'frame', 'sum']; lo = 6; hi = 20; }
    else { kinds = ['num', 'split', 'sum', 'frame']; lo = 20; hi = 100; }
    var n = ri(Math.max(lo, 2), g === 'K1' ? 5 : (g === 'K2' ? 10 : (g === 'G1' ? 20 : 99)));
    if (g === 'G2') n = ri(20, 99);
    var ks = shuffle(kinds), prompt = ks[0], target;
    if (g === 'G2') { // number written as tens+ones vs the number itself
      var t = Math.floor(n / 10), o = n % 10;
      target = { kind: 'tens', tens: t, ones: o, n: n };
      var wrongs = uniq([n + 1, n - 1, n + 10, n - 10, t * 10 + (o + 1) % 10, o * 10 + t]).filter(function (v) { return v !== n && v > 0 && v < 100; });
      var opts = shuffle([n].concat(shuffle(wrongs).slice(0, 2)));
      return finish({ type: 'representation', mode: 'tens_to_num', view: { face: target }, options: opts, hintZh: '几个十和几个一合起来是多少？', hintEn: 'How much is this many tens and ones together?' }, n);
    }
    // K1-G1: show one face, choose the option that is the SAME number in a different face
    var shown = faceOf(prompt, n), correctKind = ks[1] || 'num';
    var wrongNs = shuffle(uniq([n - 1, n + 1, n - 2, n + 2]).filter(function (v) { return v >= 2 && v <= hi; })).slice(0, 2);
    var options = shuffle([{ face: faceOf(correctKind, n), n: n }].concat(wrongNs.map(function (w) { return { face: faceOf(shuffle(kinds)[0], w), n: w }; })));
    return finish({ type: 'representation', mode: 'same_number', view: { face: shown }, options: options, hintZh: '长得不一样，但表示同样多的是哪个？', hintEn: 'Looks different, but which one means the same amount?' }, options.filter(function (o) { return o.n === n; })[0]);
  }

  // ── NS03 Order & distance ──────────────────────────────────────────────────
  function order(g) {
    if (Math.random() < 0.4) return placeLine(g);
    if (g === 'K1') {
      var s = 1, seq = [s, s + 1, s + 2, s + 3, s + 4], hole = ri(1, 3), val = seq[hole];
      seq[hole] = null;
      return finish({ type: 'order', mode: 'missing', view: { seq: seq }, options: numOptions(val, 1, 7), hintZh: '数字按顺序排队，缺的是哪个？', hintEn: 'Numbers line up in order — which one is missing?' }, val);
    }
    if (g === 'K2') {
      var a = ri(2, 9), b = ri(1, 10), c = ri(1, 10);
      do { b = ri(1, 10); c = ri(1, 10); } while (b === c || Math.abs(a - b) === Math.abs(a - c));
      return finish({ type: 'order', mode: 'closer', view: { target: a, left: b, right: c, max: 10 }, options: ['left', 'right'], hintZh: '想一想数轴，哪个离它更近？', hintEn: 'Think of the number line — which is closer?' }, Math.abs(a - b) < Math.abs(a - c) ? 'left' : 'right');
    }
    if (g === 'G1') {
      var step = pick([2, 5]), p = ri(0, step === 2 ? 14 : 5), run = [p, p + step, p + 2 * step, p + 3 * step], h = ri(1, 2), v = run[h];
      run[h] = null;
      return finish({ type: 'order', mode: 'missing', view: { seq: run }, options: numOptions(v, 0, 20, step), hintZh: '每次增加同样多，缺的是哪个？', hintEn: 'It grows by the same amount each time — which is missing?' }, v);
    }
    var lo = pick([0, 20, 40, 60]), hi = lo + 20, x = ri(lo + 2, hi - 2);
    var near = Math.round(x / 10) * 10;
    return finish({ type: 'order', mode: 'line_pos', view: { lo: lo, hi: hi, value: x }, options: uniq([near, near + 10, near - 10]).filter(function (v) { return v >= lo && v <= hi; }).slice(0, 3).sort(function (m, n2) { return m - n2; }), hintZh: '数轴上那个点最靠近哪个整十数？', hintEn: 'Which multiple of ten is that point closest to?' }, near);
  }

  // ── NS04 Part–whole: concrete -> pictorial -> number bond ─────────────────
  function part_whole(g) {
    var icon = pick(ICONS);
    if (g === 'K1') { var w = ri(2, 5), a = ri(1, w - 1);
      return finish({ type: 'part_whole', mode: 'hidden_part', view: { whole: w, shown: a, icon: icon, style: 'objects' }, options: numOptions(w - a, 1, 5), hintZh: '一共有几个？看到几个？还有几个藏起来了？', hintEn: 'How many in all? How many can you see? How many are hidden?' }, w - a); }
    if (g === 'K2') { var w2 = ri(5, 10), a2 = ri(1, w2 - 1);
      return finish({ type: 'part_whole', mode: 'bond', view: { whole: w2, partA: a2, style: 'bond' }, options: numOptions(w2 - a2, 0, 10), hintZh: '整体等于两份加起来。', hintEn: 'The whole is the two parts together.' }, w2 - a2); }
    if (g === 'G1') { var w3 = ri(11, 20), a3 = ri(2, w3 - 2);
      return finish({ type: 'part_whole', mode: 'bond', view: { whole: w3, partA: a3, style: 'bond' }, options: numOptions(w3 - a3, 0, 20), hintZh: '整体减去一份，剩下另一份。', hintEn: 'Whole minus one part leaves the other.' }, w3 - a3); }
    var w4 = ri(5, 9) * 10 + ri(0, 9), a4 = ri(2, 7) * 10 + ri(0, 4);
    if (a4 >= w4) a4 = w4 - 12;
    var d = w4 - a4;
    return finish({ type: 'part_whole', mode: 'bond', view: { whole: w4, partA: a4, style: 'bond' }, options: numOptions(d, 1, 99, pick([1, 10])), hintZh: '先减十位，再减个位。', hintEn: 'Take away the tens first, then the ones.' }, d);
  }

  // ── NS05 Composition / decomposition ───────────────────────────────────────
  function composition(g) {
    if (g !== 'G2' && Math.random() < 0.3) return splitCut(g);
    if (g !== 'K1') { var rr = Math.random(); if (rr < 0.3) return countWays(g); if (rr < 0.55) return validCheck(g); }
    if (g === 'K1') { var n = ri(3, 5), a = ri(1, n - 1);
      return finish({ type: 'composition', mode: 'make', view: { target: n, given: a }, options: numOptions(n - a, 1, 4), hintZh: '要凑成目标，还差几个？', hintEn: 'How many more to reach the target?' }, n - a); }
    if (g === 'K2') { var t = pick([5, 8, 10]), x = ri(1, t - 1);
      var good = [x, t - x], bad = uniq([[x, t - x + 1], [x + 1, t - x], [x, t - x - 1]]).filter(function (p) { return p[0] + p[1] !== t && p[0] > 0 && p[1] > 0; });
      var opts = shuffle([good].concat(shuffle(bad).slice(0, 2)));
      return finish({ type: 'composition', mode: 'pair_makes', view: { target: t }, options: opts, hintZh: '哪一对加起来正好是目标？', hintEn: 'Which pair adds up exactly to the target?' }, good); }
    if (g === 'G1') { var k = ri(11, 19), ones = k % 10, need = 10 - ones;
      return finish({ type: 'composition', mode: 'make_ten', view: { number: k, ones: ones }, options: numOptions(need, 1, 9), hintZh: '再加几凑成整十？', hintEn: 'How many more make the next ten?' }, need); }
    var big = ri(2, 8) * 10 + ri(1, 9), tens = Math.floor(big / 10) * 10, one = big - tens;
    var good2 = [tens, one], bad2 = uniq([[tens - 10, one], [tens, one + 1], [tens + 10, one]]).filter(function (p) { return p[0] + p[1] !== big; });
    return finish({ type: 'composition', mode: 'split_tens', view: { target: big }, options: shuffle([good2].concat(shuffle(bad2).slice(0, 2))), hintZh: '把它拆成几十和几。', hintEn: 'Split it into tens and ones.' }, good2);
  }

  // ── NS06 Estimation ────────────────────────────────────────────────────────
  function estimation(g) {
    var icon = pick(ICONS);
    if (g === 'K1') { var few = Math.random() < 0.5, dd = few ? ri(1, 2) : ri(4, 5);
      return finish({ type: 'estimation', mode: 'few_many', view: { dots: dd, icon: icon, flashMs: 1800 }, options: shuffle(['few', 'many']), hintZh: '不用数,是很少还是很多?', hintEn: 'No counting — very few, or a lot?' }, few ? 'few' : 'many'); }
    if (g === 'K2') { var n = pick([2, 3, 5, 6, 9, 10]);
      var near = [2, 5, 10].sort(function (x, y) { return Math.abs(x - n) - Math.abs(y - n); })[0];
      return finish({ type: 'estimation', mode: 'bucket', view: { dots: n, icon: icon, flashMs: 2200 }, options: [2, 5, 10], hintZh: '不用数，大概是 2 个、5 个还是 10 个？', hintEn: 'No counting — about 2, 5 or 10?' }, near); }
    if (g === 'G1') { var m = ri(11, 19);
      var c = m <= 14 ? 10 : 20;
      return finish({ type: 'estimation', mode: 'bucket', view: { dots: m, icon: icon, flashMs: 2200 }, options: [5, 10, 20], hintZh: '不用数，大概是 5 个、10 个还是 20 个？', hintEn: 'No counting — about 5, 10 or 20?' }, c); }
    var a = ri(2, 6) * 10, b = ri(2, 3) * 10 + pick([0, 2, 3, 7]);
    return finish({ type: 'estimation', mode: 'reasonable', view: { a: a, b: b }, options: shuffle([a + b].concat(shuffle(uniq([a + b + 30, a + b - 30, a + b + 50, a + b - 50]).filter(function (v) { return v >= 10 && v <= 100; })).slice(0, 2))), hintZh: '不用算准，哪个答案最合理？', hintEn: 'No exact sum — which answer is most reasonable?' }, a + b);
  }

  // ── NS07 Operation sense ───────────────────────────────────────────────────
  function operation(g) {
    var icon = pick(ICONS);
    if (g === 'K1') { var addK = Math.random() < 0.5, nK = addK ? ri(1, 3) : ri(2, 4), dK = addK ? ri(1, Math.min(2, 5 - nK)) : ri(1, Math.min(2, nK - 1));
      return finish({ type: 'operation', mode: 'change', view: { start: nK, delta: dK, add: addK, icon: icon }, options: shuffle(['more', 'less']), hintZh: '加进来变多,拿走变少。', hintEn: 'Adding makes more, taking away makes less.' }, addK ? 'more' : 'less'); }
    if (g === 'K2') { var n = ri(2, 6), d = ri(1, 3), add = Math.random() < 0.5;
      return finish({ type: 'operation', mode: 'change', view: { start: n, delta: d, add: add, icon: icon }, options: ['more', 'less', 'same'], hintZh: '加进来变多，拿走变少。', hintEn: 'Adding makes more, taking away makes less.' }, add ? 'more' : 'less'); }
    if (g === 'G1') { var s = ri(5, 15), dd = ri(1, 5), plus = Math.random() < 0.5, res = plus ? s + dd : s - dd;
      return finish({ type: 'operation', mode: 'result', view: { start: s, delta: dd, add: plus }, options: numOptions(res, 0, 20), hintZh: '一步一步地数，想象它变化。', hintEn: 'Step through it and picture the change.' }, res); }
    var x = ri(1, 4) * 10 + ri(1, 9), y = ri(1, 4) * 10 + ri(1, 9), sum = x + y;
    return finish({ type: 'operation', mode: 'reasonable', view: { a: x, b: y, op: '+' }, options: shuffle([Math.round(sum / 10) * 10].concat(shuffle(uniq([Math.round(sum / 10) * 10 + 30, Math.round(sum / 10) * 10 - 30, Math.round(sum / 10) * 10 + 50, Math.round(sum / 10) * 10 - 50]).filter(function (v) { return v >= 10 && v <= 100; })).slice(0, 2))), hintZh: '不用算准，凑近整十来想。', hintEn: 'No exact answer — round to the nearest ten.' }, Math.round(sum / 10) * 10);
  }

  // ── NS08 Magnitude & scale ─────────────────────────────────────────────────
  function magnitude(g) {
    if (g === 'K1') { var bigL = Math.random() < 0.5;
      return finish({ type: 'magnitude', mode: 'which_big', view: { left: bigL ? 5 : 1, right: bigL ? 1 : 5 }, options: ['left', 'right'], hintZh: '想一想,哪一堆大得多?', hintEn: 'Which pile is much bigger?' }, bigL ? 'left' : 'right'); }
    if (g === 'K2') { var lo = ri(1, 2), hi = pick([8, 9, 10]), bigLeft = Math.random() < 0.5;
      return finish({ type: 'magnitude', mode: 'which_big', view: { left: bigLeft ? hi : lo, right: bigLeft ? lo : hi }, options: ['left', 'right'], hintZh: '想一想，哪一堆数量多？', hintEn: 'Which pile is much bigger?' }, bigLeft ? 'left' : 'right'); }
    if (g === 'G1') { var m = pick([1, 2]), kk = pick([2, 5, 10]);
      return finish({ type: 'magnitude', mode: 'how_many_times', view: { small: m, big: m * kk }, options: [2, 5, 10], hintZh: '大的里面装了几个小的？', hintEn: 'How many of the small fit in the big?' }, kk); }
    var base = pick([1, 10]), v = base * 10;
    return finish({ type: 'magnitude', mode: 'scale', view: { base: base }, options: shuffle([v, v / 10, v / 2]), hintZh: '10 个一是十，10 个十是一百。', hintEn: '10 ones make ten, 10 tens make a hundred.' }, v);
  }

  // ── Grade x type matrix: which types appear, and how often ────────────────
  // Counts per 8-question session. Types a grade does not list never appear.
  var GRADE_TYPES = {
    K1: { quantity: 2, representation: 1, order: 1, part_whole: 1, composition: 1, estimation: 1, operation: 1, magnitude: 1 },
    K2: { quantity: 1, representation: 1, order: 1, part_whole: 1, composition: 1, estimation: 1, operation: 1, magnitude: 1 },
    G1: { quantity: 1, representation: 1, order: 1, part_whole: 1, composition: 2, estimation: 1, operation: 1 },
    G2: { representation: 1, order: 1, part_whole: 1, composition: 2, estimation: 1, operation: 1, magnitude: 1 }
  };
  var MAKERS = { quantity: quantity, representation: representation, order: order, part_whole: part_whole, composition: composition, estimation: estimation, operation: operation, magnitude: magnitude };

  function generate(grade, size) {
    var plan = [];
    var table = GRADE_TYPES[grade];
    Object.keys(table).forEach(function (t) { for (var i = 0; i < table[t]; i++) plan.push(t); });
    plan = shuffle(plan);
    var out = [], tries = 0;
    while (out.length < size && tries++ < size * 20) {
      var t = plan[out.length % plan.length], q = MAKERS[t](grade);
      if (!q || q.answer < 0) continue;
      var sig = q.type + '|' + q.mode + '|' + JSON.stringify(q.view);
      if (out.some(function (o) { return o._sig === sig; })) continue;
      q._sig = sig; out.push(q);
    }
    return out;
  }

  return { generate: generate, GRADE_TYPES: GRADE_TYPES };
}());
