'use strict';
/**
 * ST_ENGINE / ST_GEN — strategy engine and question generator.
 *
 * Engine (module-private; each strategy world owns its rules, no shared runtime):
 *   create(world) -> { getState, getAvailableActions, applyAction, isGoalReached,
 *                      evaluateState, reset, solve }
 *   world: { w, h, start:[x,y], goal:[x,y], blocks:[[x,y]...], items:[[x,y]...] }
 *   state: { x, y, got (bit per item collected), moves }
 *   solve(): breadth-first search -> { steps, path:'RRD..' } or null (unreachable).
 *
 * Feedback tiers (finishing = pass; the tier is only reported, never fails the child):
 *   best   = optimal number of moves        (shown with a ⭐)
 *   better = at most 2 extra moves
 *   good   = at most 4 extra moves
 *   valid  = reached the goal some other way
 *   failed = gave up / restarted before reaching it (counted as `resets`)
 *
 * Question shapes:
 *   findway: { type:'findway', mode:'move', interactive:true, world, optimal, theme, options:['go'], answer:'go' }
 *   pick:    { type:'pick', mode:'choose', world, routes:{A,B}, options:['tx:..','tx:..'], answer }
 */
var ST_ENGINE = (function () {
  var DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  var ORDER = ['U', 'D', 'L', 'R'];

  function create(world) {
    var blocked = {}, items = world.items || [];
    (world.blocks || []).forEach(function (b) { blocked[b[0] + ',' + b[1]] = 1; });
    var cur;

    function fresh() { return { x: world.start[0], y: world.start[1], got: 0, moves: 0 }; }
    function collect(s) { items.forEach(function (it, i) { if (it[0] === s.x && it[1] === s.y) s.got |= (1 << i); }); }
    function next(s, a) {                       // pure: new state, or null when the move is illegal
      var d = DIRS[a], x = s.x + d[0], y = s.y + d[1];
      if (x < 0 || y < 0 || x >= world.w || y >= world.h || blocked[x + ',' + y]) return null;
      var n = { x: x, y: y, got: s.got, moves: s.moves + 1 };
      collect(n);
      return n;
    }
    function reached(s) {
      return s.x === world.goal[0] && s.y === world.goal[1] && s.got === (1 << items.length) - 1;
    }
    function actions(s) { return ORDER.filter(function (a) { return next(s, a); }); }
    function key(s) { return s.x + ',' + s.y + ',' + s.got; }

    function solve() {
      var s0 = fresh(); collect(s0);
      var seen = {}, queue = [[s0, '']]; seen[key(s0)] = 1;
      for (var i = 0; i < queue.length; i++) {
        var s = queue[i][0], p = queue[i][1];
        if (reached(s)) return { steps: p.length, path: p };
        ORDER.forEach(function (a) {
          var n = next(s, a); if (!n || seen[key(n)]) return;
          seen[key(n)] = 1; queue.push([n, p + a]);
        });
      }
      return null;
    }

    var api = {
      reset: function () { cur = fresh(); collect(cur); },
      getState: function () { return { x: cur.x, y: cur.y, got: cur.got, moves: cur.moves }; },
      getAvailableActions: function () { return actions(cur); },
      applyAction: function (a) { var n = next(cur, a); if (!n) return false; cur = n; return true; },
      isGoalReached: function () { return reached(cur); },
      solve: solve,
      blocked: function (x, y) { return !!blocked[x + ',' + y]; }
    };
    api.reset();
    return api;
  }

  function tierOf(moves, optimal) {
    var extra = moves - optimal;
    return extra <= 0 ? 'best' : extra <= 2 ? 'better' : extra <= 4 ? 'good' : 'valid';
  }
  return { create: create, tierOf: tierOf, DIRS: DIRS };
})();

var ST_GEN = (function () {

  function rnd(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rnd(a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // [mover, zh, en, goal, zh, en]
  var THEMES = [
    ['🐰', '小兔', 'the bunny', '🥕', '胡萝卜', 'the carrot'],
    ['🐶', '小狗', 'the puppy', '🦴', '骨头', 'the bone'],
    ['🐻', '小熊', 'the bear', '🍯', '蜂蜜', 'the honey'],
    ['🐱', '小猫', 'the kitten', '🐟', '小鱼', 'the fish'],
    ['🐵', '小猴', 'the monkey', '🍌', '香蕉', 'the banana']
  ];
  // things a route cannot pass: [emoji, zh, en]
  var TRAPS = [['🌳', '大树', 'a tree'], ['🚧', '路障', 'a barrier'], ['🐊', '鳄鱼', 'a crocodile'], ['🔥', '火堆', 'a fire']];

  var AX = {
    K1: { goal_count: 'single', option_count: 'few', step_depth: 'short', constraint_count: 'none', state_change: 'none', language_complexity: 'picture' },
    G1: { goal_count: 'single', option_count: 'several', step_depth: 'medium', constraint_count: 'one', state_change: 'none', language_complexity: 'sentence' },
    G2: { goal_count: 'multi', option_count: 'several', step_depth: 'long', constraint_count: 'multi', state_change: 'changing', language_complexity: 'sentence' },
    K2: { goal_count: 'single', option_count: 'few', step_depth: 'medium', constraint_count: 'one', state_change: 'none', language_complexity: 'picture' }
  };

  var GRADE_UNITS = {
    K1: [
      { key: 'near', icon: '🛣️', zh: '三条路选最近', en: 'Pick the Shortest', dzh: '数一数，哪条路踩的石头最少', den: 'Count the stones — which route has the fewest?' },
      { key: 'trap', icon: '🚧', zh: '有陷阱的路', en: 'Watch Out for Traps', dzh: '最短的路可能过不去', den: 'The shortest route may be blocked' },
      { key: 'mix',  icon: '🧭', zh: '短路、长路和陷阱', en: 'Short, Long, Blocked', dzh: '先排除过不去的，再比长短', den: 'Rule out blocked routes, then compare' }
    ],
    K2: [
      { key: 'order', icon: '🔢', zh: '照规则排顺序', en: 'Order by the Rules', dzh: '先去哪、后去哪，规则里找答案', den: 'Which first, which last — the rules tell you' },
      { key: 'via',   icon: '🧺', zh: '顺路拿东西', en: 'Pick Up on the Way', dzh: '两样东西都要拿，先拿哪个更省步', den: 'Collect both — which order saves steps?' },
      { key: 'limit', icon: '⏱️', zh: '限步拿到', en: 'Within the Steps', dzh: '要拿到东西，步数又不能超', den: 'Get the item without too many steps' },
      { key: 'tap',   icon: '👆', zh: '点一点排顺序', en: 'Tap the Order', dzh: '按规则，一个一个点出走的顺序', den: 'Tap the places in the order the rules allow' }
    ],
    G1: [
      { key: 'budget', icon: '🪙', zh: '金币买东西', en: 'Spend the Coins', dzh: '钱不能超，又要花得最多', den: 'Stay in budget, spend the most' },
      { key: 'energy', icon: '🔋', zh: '能量不能没', en: 'Keep the Energy Up', dzh: '先走哪段，能量才够', den: 'Which stretch first so energy never runs out?' },
      { key: 'keydoor', icon: '🔑', zh: '钥匙和门', en: 'Key and Door', dzh: '没钥匙开不了门，哪条路最近', den: 'No key, no door — which route is shortest?' },
      { key: 'basket', icon: '🧺', zh: '自己选着买', en: 'Fill the Basket', dzh: '点一点，自己挑出花得最多的买法', den: 'Tap to pick the buy that spends the most' },
      { key: 'judge', icon: '🧐', zh: '他买得对吗', en: 'Is He Right?', dzh: '检查别人的买法', den: 'Check someone else\'s choice' }
    ],
    G2: [
      { key: 'nim',   icon: '🍪', zh: '取饼干比赛', en: 'Cookie Race', dzh: '轮流拿，拿到最后一个的赢', den: 'Take turns — whoever takes the last one wins' },
      { key: 'ops',   icon: '🎛️', zh: '按钮变数', en: 'Button Machine', dzh: '最少按几次变成目标数', den: 'Fewest presses to reach the target' },
      { key: 'buy',   icon: '🛒', zh: '两种都要买', en: 'Buy Both Kinds', dzh: '钱有限，要买到的个数最多', den: 'Limited coins — buy the most items' },
      { key: 'power', icon: '🔋', zh: '能量有上限', en: 'Energy With a Cap', dzh: '电池充太早会浪费', den: 'Charging too early wastes energy' },
      { key: 'press', icon: '🕹️', zh: '自己按按钮', en: 'Press the Buttons', dzh: '亲手按，越少次变成目标越好', den: 'Press them yourself — fewer is better' },
      { key: 'cookie', icon: '🥇', zh: '和电脑比赛', en: 'Play the Computer', dzh: '轮流拿饼干，别让电脑赢', den: 'Take turns with the computer' },
      { key: 'judge', icon: '🧐', zh: '他说得对吗', en: 'Is He Right?', dzh: '判断别人的第一步', den: 'Check someone else\'s first move' }
    ]
  };

  var LABELS = ['tx:路线 A|Route A', 'tx:路线 B|Route B', 'tx:路线 C|Route C'];
  var TRIPLES = [[2, 3, 4], [2, 3, 5], [2, 4, 5], [3, 4, 5]];

  // routes: [{n: stones, trap: stoneIndex|null, win: bool}] -> shuffled question
  function build(kind, routes, ax) {
    var trapIcon = pick(TRAPS), order = shuffle(routes), win = -1;
    order.forEach(function (r, i) { if (r.win) win = i; });
    return { type: 'pick', kind: kind, mode: 'choose', theme: pick(THEMES), optimal: order[win].n,
      map: { vertical: rnd(2) === 0, trapIcon: trapIcon, routes: order.map(function (r) { return { n: r.n, trap: r.trap }; }) },
      options: LABELS.slice(), answer: LABELS[win], ax: ax };
  }
  function stone(n) { return 1 + rnd(n); }

  function near(ax) {
    var t = pick(TRIPLES);
    return build('near', [{ n: t[0], trap: null, win: true }, { n: t[1], trap: null }, { n: t[2], trap: null }], ax);
  }
  function trap(ax) {                    // the shortest is blocked -> the middle one wins
    var t = pick(TRIPLES);
    return build('trap', [{ n: t[0], trap: stone(t[0]) }, { n: t[1], trap: null, win: true }, { n: t[2], trap: null }], ax);
  }
  function mix(ax) {
    var t = pick(TRIPLES), c = rnd(3);
    if (c === 0) {                       // two equally short routes, one blocked
      var a = pick([2, 3]), b = a + 2 + rnd(2);
      return build('mix', [{ n: a, trap: stone(a) }, { n: a, trap: null, win: true }, { n: b, trap: null }], ax);
    }
    if (c === 1) return build('mix', [{ n: t[0], trap: null, win: true }, { n: t[1], trap: null }, { n: t[2], trap: stone(t[2]) }], ax);   // the trap is on a route that loses anyway
    return build('mix', [{ n: t[0], trap: null, win: true }, { n: t[1], trap: stone(t[1]) }, { n: t[2], trap: null }], ax);
  }


  // ── K2 ────────────────────────────────────────────────────────────────────
  var ITEMS = [['🍎', '苹果', 'an apple'], ['🍇', '葡萄', 'grapes'], ['🍓', '草莓', 'a strawberry'], ['🥒', '黄瓜', 'a cucumber']];
  var PLACES = [['🏠', '房子', 'the house'], ['🌳', '大树', 'the tree'], ['⛲', '喷泉', 'the fountain'], ['🏫', '学校', 'the school'],
    ['🏪', '商店', 'the shop'], ['🌉', '桥', 'the bridge'], ['⛺', '帐篷', 'the tent'], ['🗼', '高塔', 'the tower']];
  var PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];

  function holds(rule, perm) {                         // perm = place ids in visiting order
    var pos = {}; perm.forEach(function (p, i) { pos[p] = i; });
    if (rule.t === 'before') return pos[rule.a] < pos[rule.b];
    if (rule.t === 'first') return pos[rule.a] === 0;
    return pos[rule.a] === 2;
  }

  // Order by the rules: two stated rules pin down exactly one order of three places.
  function order(ax) {
    for (var t = 0; t < 200; t++) {
      var cand = [{ t: 'before', a: 0, b: 1 }, { t: 'before', a: 1, b: 2 }, { t: 'before', a: 0, b: 2 }, { t: 'first', a: 0 }, { t: 'last', a: 2 }];
      var rules = shuffle(cand).slice(0, 2);
      var fits = PERMS.filter(function (p) { return rules.every(function (r) { return holds(r, p); }); });
      if (fits.length !== 1) continue;
      var places = shuffle(PLACES).slice(0, 3);
      function seq(p) { return p.map(function (i) { return places[i][0]; }).join('→'); }
      var wrong = shuffle(PERMS.filter(function (p) { return p.join() !== '0,1,2'; })).slice(0, 2);
      var opts = shuffle(['0,1,2'].concat(wrong.map(function (p) { return p.join(); }))).map(function (k) { return seq(k.split(',').map(Number)); });
      return { type: 'order', kind: 'order', mode: 'choose', theme: pick(THEMES), places: places, rules: rules,
        shown: shuffle([0, 1, 2]), options: opts, answer: seq([0, 1, 2]), key: JSON.stringify([places, rules]), ax: ax };
    }
    return null;
  }

  // split `total` into `parts` hops of 1..max steps
  function parts(total, n, max) {
    for (var t = 0; t < 60; t++) {
      var out = [], left = total, ok = true;
      for (var i = 0; i < n - 1; i++) { var v = 1 + rnd(max); out.push(v); left -= v; }
      if (left >= 1 && left <= max) { out.push(left); return out; }
    }
    return null;
  }

  // Pick Up on the Way: both items must be collected; the shorter-looking plan skips one.
  // Each option writes the steps of every stretch on its arrows, so the child adds them up.
  function via(ax) {
    for (var t = 0; t < 300; t++) {
      var g = { sa: 1 + rnd(4), sb: 1 + rnd(4), ab: 1 + rnd(4), ag: 1 + rnd(4), bg: 1 + rnd(4) };
      var p1 = g.sa + g.ab + g.bg, p2 = g.sb + g.ab + g.ag;
      var best = Math.min(p1, p2);
      if (p1 === p2 || best < 5 || Math.max(p1, p2) > 10) continue;
      var skips = [[g.sa + g.ag, 'SAG'], [g.sb + g.bg, 'SBG']].filter(function (s) { return s[0] < best; });
      if (!skips.length) continue;
      var th = pick(THEMES), it = shuffle(ITEMS).slice(0, 2), e = { S: th[0], A: it[0][0], B: it[1][0], G: th[3] };
      var W = { SA: g.sa, SB: g.sb, AB: g.ab, BA: g.ab, AG: g.ag, BG: g.bg };
      function seq(p) { var o = e[p[0]]; for (var i = 1; i < p.length; i++) o += ' ' + W[p[i - 1] + p[i]] + '→ ' + e[p[i]]; return o; }
      var good = p1 < p2 ? 'SABG' : 'SBAG', other = p1 < p2 ? 'SBAG' : 'SABG';
      return { type: 'via', kind: 'via', mode: 'choose', theme: th, items: it, graph: g, optimal: best,
        options: shuffle([good, other, pick(skips)[1]]).map(seq), answer: seq(good), key: JSON.stringify(g), ax: ax };
    }
    return null;
  }

  // Within the Steps: the route must pass the item AND fit the step limit; the shortest route lacks the item.
  function limit(ax) {
    for (var t = 0; t < 300; t++) {
      var W = 5 + rnd(4), cap = W + rnd(2), B = 3 + rnd(W - 3), C = cap + 1 + rnd(10 - cap);
      var hw = 2 + rnd(2), hc = 2 + rnd(2), hb = 1 + rnd(2);
      var ww = parts(W, hw, 5), wc = parts(C, hc, 5), wb = parts(B, hb, 5);
      if (!ww || !wc || !wb) continue;
      var routes = shuffle([{ w: ww, item: 1 + rnd(hw - 1), win: true }, { w: wb }, { w: wc, item: 1 + rnd(hc - 1) }]), win = 0;
      routes.forEach(function (r, i) { if (r.win) win = i; });
      return { type: 'pick', kind: 'limit', mode: 'choose', theme: pick(THEMES), optimal: W,
        map: { vertical: rnd(2) === 0, item: pick(ITEMS), cap: cap, numbers: true,
          routes: routes.map(function (r) { return { w: r.w, item: r.item || null }; }) },
        options: LABELS.slice(), answer: LABELS[win], ax: ax };
    }
    return null;
  }

  // ── G1 ────────────────────────────────────────────────────────────────────
  var SHELF = ['🍎', '🍌', '🍇', '🍓', '🥕', '🍉'];

  // Spend the Coins: buy 2 of 4 things, stay within the coins, spend as much as possible.
  function budget(ax) {
    for (var t = 0; t < 300; t++) {
      var N = 10 + rnd(8), icons = shuffle(SHELF).slice(0, 4), pr = shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4), pairs = [];
      for (var i = 0; i < 4; i++) for (var j = i + 1; j < 4; j++) pairs.push({ s: pr[i] + pr[j], t: icons[i] + ' + ' + icons[j] });
      var ok = pairs.filter(function (p) { return p.s <= N; }), over = pairs.filter(function (p) { return p.s > N; });
      if (!ok.length || !over.length) continue;
      var best = Math.max.apply(0, ok.map(function (p) { return p.s; }));
      var top = ok.filter(function (p) { return p.s === best; }), under = ok.filter(function (p) { return p.s < best; });
      if (top.length !== 1 || !under.length) continue;
      return { type: 'budget', kind: 'budget', mode: 'choose', theme: pick(THEMES), coins: N, icons: icons, prices: pr, optimal: best,
        options: shuffle([top[0], pick(under), pick(over)]).map(function (p) { return p.t; }), answer: top[0].t,
        key: JSON.stringify([N, icons, pr]), ax: ax };
    }
    return null;
  }

  // Keep the Energy Up: same stretches, different order; energy may never drop below 0.
  function energy(ax) {
    for (var t = 0; t < 400; t++) {
      var E = 2 + rnd(4), cs = [1 + rnd(4), 1 + rnd(4), 1 + rnd(4)], r = 3 + rnd(4), cost = cs[0] + cs[1] + cs[2];
      if (E + r > 9 || cost <= E || E + r - cost < 0) continue;
      var ev = cs.map(function (c) { return '🥾−' + c; }).concat('🔋+' + r), valid = [], bad = [], seen = {};
      (function walk(left, acc) {
        if (!left.length) {
          var key = acc.join(' → '); if (seen[key]) return; seen[key] = 1;
          var e = E, ok = true; acc.forEach(function (x) { e += (x.indexOf('−') >= 0 ? -1 : 1) * +x.match(/\d+/)[0]; if (e < 0) ok = false; });
          (ok ? valid : bad).push(key); return;
        }
        left.forEach(function (x, i) { walk(left.slice(0, i).concat(left.slice(i + 1)), acc.concat(x)); });
      })(ev, []);
      if (!valid.length || bad.length < 2) continue;
      var good = pick(valid);
      return { type: 'energy', kind: 'energy', mode: 'choose', theme: pick(THEMES), start: E, optimal: cost,
        options: shuffle([good].concat(shuffle(bad).slice(0, 2))), answer: good, key: E + good, ax: ax };
    }
    return null;
  }

  // Key and Door: the door opens only with the key in hand; the shortest-looking route skips it.
  function keydoor(ax) {
    for (var t = 0; t < 300; t++) {
      var g = { sk: 1 + rnd(5), sd: 1 + rnd(5), kd: 1 + rnd(5), dg: 1 + rnd(5) };
      var A = g.sd + g.dg, B = g.sk + g.kd + g.dg, C = 2 * g.sk + g.sd + g.dg;
      if (!(A < B && B < C) || C > 20) continue;
      var th = pick(THEMES), e = { S: th[0], K: '🔑', D: '🚪', G: th[3] };
      var W = { SK: g.sk, KS: g.sk, SD: g.sd, KD: g.kd, DK: g.kd, DG: g.dg };
      var seq = function (p) { var o = e[p[0]]; for (var i = 1; i < p.length; i++) o += ' ' + W[p[i - 1] + p[i]] + '→ ' + e[p[i]]; return o; };
      return { type: 'keydoor', kind: 'keydoor', mode: 'choose', theme: th, graph: g, optimal: B,
        options: shuffle(['SDG', 'SKDG', 'SKSDG']).map(seq), answer: seq('SKDG'), key: JSON.stringify(g), ax: ax };
    }
    return null;
  }

  // ── G2 ────────────────────────────────────────────────────────────────────
  // Cookie Race: take 1..m each turn, last one wins -> leave the other side a multiple of (m + 1).
  function nim(ax) {
    var m = pick([3, 4]), N = 6 + rnd(m === 3 ? 25 : 34);
    if (N % (m + 1) === 0) N++;
    var opts = [], i; for (i = 1; i <= m; i++) opts.push('tx:拿 ' + i + ' 个|Take ' + i);
    return { type: 'nim', kind: 'nim', mode: 'choose', theme: pick(THEMES), total: N, max: m, optimal: N % (m + 1),
      options: opts, answer: opts[N % (m + 1) - 1], key: N + ',' + m, ax: ax };
  }

  // Button Machine: fewest presses from start to target with two buttons.
  var OPS = { '+2': function (v) { return v + 2; }, '+3': function (v) { return v + 3; }, '+5': function (v) { return v + 5; },
    '×2': function (v) { return v * 2; }, '×3': function (v) { return v * 3; } };
  function run(start, seq) { return seq.reduce(function (v, o) { return OPS[o](v); }, start); }
  function ops(ax) {
    for (var t = 0; t < 400; t++) {
      var bt = shuffle(['+2', '+3', '+5', '×2', '×3']).slice(0, 2);
      if (bt[0].charAt(0) !== '×' && bt[1].charAt(0) !== '×') continue;
      var start = 1 + rnd(5), L = 3 + rnd(2), seq = [], i;
      for (i = 0; i < L; i++) seq.push(pick(bt));
      var target = run(start, seq);
      if (target > 100 || target < 12) continue;
      var all = {}, best = null;
      for (var len = 1; len <= L + 2; len++) {
        var tot = 1 << len; all[len] = [];
        for (var b = 0; b < tot; b++) {
          var sq = []; for (i = 0; i < len; i++) sq.push(bt[(b >> i) & 1]);
          if (run(start, sq) === target) all[len].push(sq);
        }
        if (!best && all[len].length) best = len;
      }
      if (best < 3 || all[best].length !== 1) continue;
      var longer = []; for (var l2 = best + 1; l2 <= L + 2; l2++) longer = longer.concat(all[l2]);
      var miss = [];
      for (i = 0; i < 40; i++) { var ms = []; for (var k = 0; k < best; k++) ms.push(pick(bt)); if (run(start, ms) !== target) miss.push(ms); }
      if (!longer.length || !miss.length) continue;
      var fmt = function (sq) { return sq.join(' → '); };
      return { type: 'ops', kind: 'ops', mode: 'choose', theme: pick(THEMES), buttons: bt, start: start, target: target, optimal: best,
        options: shuffle([all[best][0], pick(longer), pick(miss)]).map(fmt), answer: fmt(all[best][0]), key: bt.join() + start + target, ax: ax };
    }
    return null;
  }

  // Buy Both Kinds: at least one of each, within the coins, as many items as possible.
  function buy(ax) {
    for (var t = 0; t < 300; t++) {
      var a = 3 + rnd(4), b = a + 2 + rnd(5), M = 25 + rnd(36), ic = shuffle(SHELF).slice(0, 2);
      var y = 1, x = Math.floor((M - b * y) / a);
      if (x < 3) continue;
      var f = function (x, y) { return ic[0] + '×' + x + ' + ' + ic[1] + '×' + y; };
      var good = f(x, y), under = f(x - 1 - rnd(Math.min(2, x - 2)), y), over = f(x + 1 + rnd(2), y + 1 + rnd(2));
      if (a * (x + 1) + b <= M || a * (x + 2) + b * 2 <= M) continue;
      return { type: 'buy', kind: 'buy', mode: 'choose', theme: pick(THEMES), coins: M, icons: ic, prices: [a, b], optimal: x + y,
        options: shuffle([good, under, over]), answer: good, key: [a, b, M, ic.join('')].join(), ax: ax };
    }
    return null;
  }

  // Energy With a Cap: batteries are wasted above the cap, so charge when it is needed.
  function power(ax) {
    for (var t = 0; t < 400; t++) {
      var E = 8 + rnd(7), cap = 20, cs = [4 + rnd(7), 4 + rnd(7), 4 + rnd(7)], rs = [6 + rnd(5), 6 + rnd(5)];
      if (E + rs[0] + rs[1] > 40) continue;
      var ev = cs.map(function (c) { return '🥾−' + c; }).concat(rs.map(function (r) { return '🔋+' + r; }));
      var valid = [], bad = [], seen = {};
      (function walk(left, acc) {
        if (!left.length) {
          var key = acc.join(' → '); if (seen[key]) return; seen[key] = 1;
          var e = E, ok = true; acc.forEach(function (x) { var n = +x.match(/\d+/)[0]; e = x.indexOf('−') >= 0 ? e - n : Math.min(cap, e + n); if (e < 0) ok = false; });
          (ok ? valid : bad).push({ s: key, e: e }); return;
        }
        left.forEach(function (x, i) { walk(left.slice(0, i).concat(left.slice(i + 1)), acc.concat(x)); });
      })(ev, []);
      if (!valid.length || !bad.length) continue;
      var top = Math.max.apply(0, valid.map(function (v) { return v.e; }));
      var best = valid.filter(function (v) { return v.e === top; }), worse = valid.filter(function (v) { return v.e < top; });
      if (best.length < 1 || !worse.length) continue;
      var g = pick(best);
      return { type: 'power', kind: 'power', mode: 'choose', theme: pick(THEMES), start: E, cap: cap, optimal: top,
        options: shuffle([g.s, pick(worse).s, pick(bad).s]), answer: g.s, key: E + g.s, ax: ax };
    }
    return null;
  }

  // ── Interactive and checking units ──────────────────────────────────────────
  function play(q, kind) { q.kind = kind; q.interactive = true; q.options = ['done']; q.answer = 'done'; return q; }

  function orderTap(ax) { var q = order(ax); return q && play(q, 'ordertap'); }
  function opsPlay(ax) { var q = ops(ax); return q && play(q, 'press'); }
  function cookie(ax) { var q = nim(ax); return q && play(q, 'cookie'); }

  // Fill the Basket: tap items to buy; the goal is to spend as much as possible without going over.
  function basket(ax) {
    for (var t = 0; t < 300; t++) {
      var N = 12 + rnd(9), icons = shuffle(SHELF).slice(0, 5), pr = shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5), best = 0;
      for (var m = 1; m < 32; m++) {
        var sum = 0; for (var i = 0; i < 5; i++) if (m & (1 << i)) sum += pr[i];
        if (sum <= N && sum > best) best = sum;
      }
      if (best < N - 1 || pr.reduce(function (a, b) { return a + b; }, 0) <= N) continue;
      return play({ type: 'play', mode: 'play', theme: pick(THEMES), coins: N, icons: icons, prices: pr, optimal: best,
        key: [N, icons.join(''), pr.join('')].join(), ax: ax }, 'basket');
    }
    return null;
  }

  var JOPT = ['tx:对，这样最好|Yes, that is the best', 'tx:不对，超过了金币|No — it is over the coins', 'tx:不对，还能花得更多|No — he could spend more'];
  // Is He Right (buy): someone states a purchase; it is best, over budget, or leaves room to spend more.
  function judgeBuy(ax) {
    var q = budget(ax); if (!q) return null;
    var pairs = [], i, j;
    for (i = 0; i < 4; i++) for (j = i + 1; j < 4; j++) pairs.push({ s: q.prices[i] + q.prices[j], t: q.icons[i] + ' + ' + q.icons[j] });
    var kind = rnd(3), pool = pairs.filter(function (p) { return kind === 0 ? p.s === q.optimal : kind === 1 ? p.s > q.coins : p.s <= q.coins && p.s < q.optimal; });
    if (!pool.length) return null;
    var p = pick(pool);
    return { type: 'judge', kind: 'judgebuy', mode: 'choose', theme: q.theme, coins: q.coins, icons: q.icons, prices: q.prices, said: p.t, sum: p.s, optimal: q.optimal,
      options: JOPT.slice(), answer: JOPT[kind], key: q.key + p.t, ax: ax };
  }

  // Is He Right (cookies): the first move is claimed to win against a perfect opponent.
  function judgeNim(ax) {
    var q = nim(ax), k = rnd(2) ? q.optimal : 1 + rnd(q.max);
    var right = k === q.optimal, opts = ['tx:一定能赢|Sure to win', 'tx:不一定，要看对手会不会拿错|Not sure — depends on a mistake', 'tx:会输，对手有办法一直赢|Loses — the rival can always win'];
    return { type: 'judge', kind: 'judgenim', mode: 'choose', theme: q.theme, total: q.total, max: q.max, first: k, optimal: q.optimal,
      options: opts, answer: right ? opts[0] : opts[2], key: q.key + ',' + k, ax: ax };
  }

  var MAKERS = { K1: { near: near, trap: trap, mix: mix }, K2: { order: order, via: via, limit: limit, tap: orderTap },
    G1: { budget: budget, energy: energy, keydoor: keydoor, basket: basket, judge: judgeBuy },
    G2: { nim: nim, ops: ops, buy: buy, power: power, press: opsPlay, cookie: cookie, judge: judgeNim } };

  function generate(grade, count, unitKey) {
    var mk = MAKERS[grade] && MAKERS[grade][unitKey]; if (!mk) return [];
    var out = [], seen = {}, guard = 0;
    while (out.length < count && guard++ < count * 40) {
      var q = mk(AX[grade]); if (!q) continue; var k = q.key || JSON.stringify(q.map);
      if (seen[k]) continue;
      seen[k] = 1; out.push(q);
    }
    return out;
  }

  return { GRADE_UNITS: GRADE_UNITS, generate: generate, ENGINE: ST_ENGINE };
})();
