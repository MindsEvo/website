'use strict';

/**
 * Logic generator — 7 reasoning types x grades, themed units.
 *
 * GRADIENT RULE (the design principle of this module):
 *   grades differ by REASONING STRUCTURE first — how many conditions, how many
 *   objects, how many steps, which kind of condition (positive / NOT / AND-OR),
 *   and whether the information is complete — and only then by language.
 *     K1  one rule + one action, pictures with a spoken question, <= 3 objects.
 *     K2  two conditions (AND / NOT), 3-object elimination, a 3-step chain, if-then picks.
 *     G1  if-then, OR / NOT NOT, a cause and its result, certain / possible / impossible,
 *         3-object puzzles with 3 clues, sentences.
 *     G2  chains of 4, 4-object logic grid, constraint puzzles, 3 conditions,
 *         "cannot be told", the converse trap, two draws.
 *   The core of every item: conditions -> relation -> inference -> conclusion.
 *
 * CONSTRAINT ENGINE (internal, shared by elimination / matching / ordering /
 * constraint puzzles): a puzzle is "pick a random solution, add true clues until the
 * solution is unique, drop redundant clues". Clues are predicates over an
 * assignment (person -> item or person -> slot), so one solver serves them all.
 *
 * Question shape (consumed by game.js):
 *   { type, mode, promptZh, promptEn, scene: [block...], options: [token...],
 *     answer: token, hintZh, hintEn, ax: {...difficulty values} }
 * Option tokens: 'tx:zh|en' bilingual text, 'emoji~zh~en' a captioned picture,
 * anything else is shown as is.
 * Scene blocks: story, rule, big, cells, clues, bag.
 */
var LG_GEN = (function () {

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[ri(0, a.length - 1)]; }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = ri(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function tx(zh, en) { return 'tx:' + zh + '|' + en; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // difficulty values (see logic.json difficultyAxes)
  function mk(type, mode, zh, en, hzh, hen, ax) {
    var a = { condition_count: 'single', object_count: 'three', inference_depth: 'one_step', condition_type: 'positive', information_state: 'complete' };
    Object.keys(ax || {}).forEach(function (k) { a[k] = ax[k]; });
    return { type: type, mode: mode, promptZh: zh, promptEn: en, hintZh: hzh || '', hintEn: hen || '', scene: [], ax: a };
  }
  function opts(q, ans, wrongs, n) {
    ans = String(ans);
    var w = shuffle(uniq(wrongs.map(String)).filter(function (x) { return x !== ans; })).slice(0, n - 1);
    q.options = shuffle([ans].concat(w));
    q.answer = ans;
    return q;
  }
  var YES = tx('一定是 ✅', 'Definitely yes ✅'), NO = tx('一定不是 ❌', 'Definitely no ❌'), MAYBE = tx('不一定 ❓', 'Not necessarily ❓');
  var RIGHT = tx('对 ✅', 'Right ✅'), WRONG = tx('不对 ❌', 'Wrong ❌');
  var TELL = tx('无法确定 ❓', 'Cannot tell ❓');

  // ── entities: a picture + a word; sentences carry the emoji in brackets ───
  function ent(e, zh, en, bare) {
    return {
      e: e, zh: zh, en: en, bare: !!bare,
      say: function (l) { var w = l === 'zh' ? zh : (bare ? en : 'the ' + en); return bare ? w : (l === 'zh' ? w + '（' + e + '）' : w + ' (' + e + ')'); },
      tok: e + '~' + zh + '~' + en, cell: { e: e, zh: zh, en: en }
    };
  }
  function kid(zh, en) {
    return { e: null, zh: zh, en: en, say: function (l) { return l === 'zh' ? zh : en; }, tok: tx(zh, en), cell: null };
  }
  var ANIMALS = [ent('🐰', '兔子', 'rabbit'), ent('🐱', '小猫', 'cat'), ent('🐶', '小狗', 'dog'), ent('🐸', '青蛙', 'frog'),
    ent('🐻', '小熊', 'bear'), ent('🐵', '猴子', 'monkey'), ent('🐼', '熊猫', 'panda')];
  var FOODS = [ent('🍎', '苹果', 'apple'), ent('🍌', '香蕉', 'banana'), ent('🍊', '橘子', 'orange'), ent('🍇', '葡萄', 'grapes'),
    ent('🍓', '草莓', 'strawberry'), ent('🍪', '饼干', 'cookie')];
  var KIDS = [kid('小明', 'Sam'), kid('小红', 'Amy'), kid('小华', 'Lee'), kid('小刚', 'Max'), kid('小丽', 'Mia')];
  var PLACE = {
    house: [['🟥', '红房子', 'red house'], ['🟦', '蓝房子', 'blue house'], ['🟩', '绿房子', 'green house'], ['🟪', '紫房子', 'purple house']],
    door:  [['🟥', '红门', 'red door'], ['🟦', '蓝门', 'blue door'], ['🟩', '绿门', 'green door'], ['🟪', '紫门', 'purple door']],
    box:   [['🟥', '红盒子', 'red box'], ['🟦', '蓝盒子', 'blue box'], ['🟩', '绿盒子', 'green box'], ['🟪', '紫盒子', 'purple box']]
  };
  function places(kind, n) { return shuffle(PLACE[kind]).slice(0, n).map(function (p) { return ent(p[0], p[1], p[2], true); }); }
  function cellsOf(list) { return { k: 'cells', items: list.map(function (x) { return x.cell; }) }; }

  // ── constraint engine ─────────────────────────────────────────────────────
  var _permCache = {};
  function perms(n) {
    if (_permCache[n]) return _permCache[n];
    var out = [];
    (function go(a, rest) {
      if (!rest.length) { out.push(a); return; }
      rest.forEach(function (x, i) { go(a.concat([x]), rest.slice(0, i).concat(rest.slice(i + 1))); });
    })([], Array.apply(null, Array(n)).map(function (_, i) { return i; }));
    return (_permCache[n] = out);
  }
  function sols(n, clues) { return perms(n).filter(function (a) { return clues.every(function (c) { return c.f(a); }); }); }
  // candidates: every TRUE clue for the hidden solution; build until unique, then prune
  function buildPuzzle(n, sol, cands, cmin, cmax) {
    var chosen = [], pool = shuffle(cands);
    for (var i = 0; i < pool.length && sols(n, chosen).length > 1; i++) {
      var next = chosen.concat([pool[i]]);
      if (sols(n, next).length < sols(n, chosen).length) chosen = next;
    }
    if (sols(n, chosen).length !== 1) return null;
    for (var j = chosen.length - 1; j >= 0; j--) {
      var rest = chosen.slice(0, j).concat(chosen.slice(j + 1));
      if (sols(n, rest).length === 1) chosen = rest;
    }
    // minimal set: no padding with redundant clues (a clue implied by the others adds nothing)
    return chosen.length >= cmin && chosen.length <= cmax ? shuffle(chosen) : null;
  }

  // ── CLASSIFICATION ────────────────────────────────────────────────────────
  var KINDS = {
    fruit:   [['🍎', '苹果', 'apple'], ['🍌', '香蕉', 'banana'], ['🍊', '橘子', 'orange'], ['🍇', '葡萄', 'grapes'], ['🍓', '草莓', 'strawberry']],
    vehicle: [['🚗', '汽车', 'car'], ['🚌', '公共汽车', 'bus'], ['🚲', '自行车', 'bicycle'], ['🚂', '火车', 'train'], ['🚒', '消防车', 'fire truck']],
    animal:  [['🐶', '小狗', 'dog'], ['🐱', '小猫', 'cat'], ['🐰', '兔子', 'rabbit'], ['🐸', '青蛙', 'frog'], ['🐻', '小熊', 'bear']],
    toy:     [['⚽', '皮球', 'ball'], ['🧸', '玩具熊', 'teddy bear'], ['🪁', '风筝', 'kite'], ['🎈', '气球', 'balloon'], ['🎲', '骰子', 'dice']]
  };
  var KIND_NAME = { fruit: ['水果', 'fruit'], vehicle: ['车', 'vehicles'], animal: ['动物', 'animals'], toy: ['玩具', 'toys'] };
  function oddOne(g) {
    var ks = shuffle(Object.keys(KINDS)), main = ks[0], odd = ks[1];
    var three = shuffle(KINDS[main]).slice(0, 3), stray = pick(KINDS[odd]);
    var all = shuffle(three.concat([stray])).map(function (x) { return ent(x[0], x[1], x[2]); });
    var q = mk('classification', 'odd', '哪一个和其他的不是一类？', 'Which one is not like the others?', '先想想：其他三个是什么', 'First think: what are the other three?',
      { object_count: 'four', condition_type: 'positive' });
    q.scene.push(cellsOf(all));
    return opts(q, stray[0], three.map(function (x) { return x[0]; }), 4);
  }

  // shapes x colours (hearts, circles, squares)
  var SHAPES = { heart: ['爱心', 'heart'], circle: ['圆形', 'circle'], square: ['方形', 'square'] };
  var COLORS = { red: ['红色', 'red'], blue: ['蓝色', 'blue'], green: ['绿色', 'green'], purple: ['紫色', 'purple'] };
  var OBJ_E = { heart: { red: '❤️', blue: '💙', green: '💚', purple: '💜' }, circle: { red: '🔴', blue: '🔵', green: '🟢', purple: '🟣' }, square: { red: '🟥', blue: '🟦', green: '🟩', purple: '🟪' } };
  var OBJS = [];
  Object.keys(OBJ_E).forEach(function (s) { Object.keys(OBJ_E[s]).forEach(function (c) { OBJS.push({ e: OBJ_E[s][c], s: s, c: c }); }); });
  function S(s) { return SHAPES[s]; } function C(c) { return COLORS[c]; }

  // Pick a target and 3 distractors that FAIL the condition; near misses first.
  function attrQuestion(q, f, parts, target) {
    var fails = shuffle(OBJS.filter(function (o) { return !f(o); }));
    var score = function (o) { return parts.filter(function (p) { return p(o); }).length; };
    fails.sort(function (a, b) { return score(b) - score(a); });
    var picked = [], seenE = {};
    fails.forEach(function (o) { if (picked.length < 3 && !seenE[o.e]) { seenE[o.e] = 1; picked.push(o); } });
    return opts(q, target.e, picked.map(function (o) { return o.e; }), 4);
  }
  function andCond(g) {
    var t = pick(OBJS), c = t.c, s = t.s, q;
    q = mk('condition', 'and', '找出' + C(c)[0] + '的' + S(s)[0] + '。', 'Find the ' + C(c)[1] + ' ' + S(s)[1] + '.', '两个条件都要符合', 'Both conditions must fit',
      { condition_count: 'double', condition_type: 'and_or', object_count: 'four' });
    q.scene.push({ k: 'rule', zh: '要同时满足：' + C(c)[0] + '，并且是' + S(s)[0], en: 'Both: ' + C(c)[1] + ' AND a ' + S(s)[1] });
    return attrQuestion(q, function (o) { return o.c === c && o.s === s; }, [function (o) { return o.c === c; }, function (o) { return o.s === s; }], t);
  }
  function notCond(g) {
    var t = pick(OBJS), s = t.s, nc = pick(Object.keys(COLORS).filter(function (x) { return x !== t.c; })), q;
    q = mk('condition', 'not', '找出不是' + C(nc)[0] + '的' + S(s)[0] + '。', 'Find the ' + S(s)[1] + ' that is not ' + C(nc)[1] + '.', '先找出' + S(s)[0] + '，再把' + C(nc)[0] + '的去掉', 'Find the ' + S(s)[1] + 's, then rule out the ' + C(nc)[1] + ' ones',
      { condition_count: 'double', condition_type: 'negation', object_count: 'four' });
    q.scene.push({ k: 'rule', zh: '是' + S(s)[0] + '，但不是' + C(nc)[0], en: 'A ' + S(s)[1] + ', but not ' + C(nc)[1] });
    return attrQuestion(q, function (o) { return o.s === s && o.c !== nc; }, [function (o) { return o.s === s; }, function (o) { return o.c !== nc; }], t);
  }
  function orCond(g) {
    var cs = shuffle(Object.keys(COLORS)), a = cs[0], b = cs[1], t = pick(OBJS.filter(function (o) { return o.c === a || o.c === b; })), q;
    q = mk('condition', 'or', '找出' + C(a)[0] + '或者' + C(b)[0] + '的。', 'Find the one that is ' + C(a)[1] + ' or ' + C(b)[1] + '.', '只要符合其中一个就可以', 'Either one is enough',
      { condition_count: 'double', condition_type: 'and_or', object_count: 'four' });
    q.scene.push({ k: 'rule', zh: C(a)[0] + '，或者' + C(b)[0] + '，都可以', en: C(a)[1] + ' OR ' + C(b)[1] + ' will do' });
    return attrQuestion(q, function (o) { return o.c === a || o.c === b; }, [function () { return false; }], t);
  }
  function notNot(g) {
    var t = pick(OBJS), ns = pick(Object.keys(SHAPES).filter(function (x) { return x !== t.s; })), nc = pick(Object.keys(COLORS).filter(function (x) { return x !== t.c; })), q;
    q = mk('condition', 'notnot', '哪一个既不是' + S(ns)[0] + '，也不是' + C(nc)[0] + '？', 'Which one is neither a ' + S(ns)[1] + ' nor ' + C(nc)[1] + '?', '两个都要排除', 'Rule out both',
      { condition_count: 'double', condition_type: 'negation', inference_depth: 'two_step', object_count: 'four' });
    q.scene.push({ k: 'rule', zh: '不是' + S(ns)[0] + '，也不是' + C(nc)[0], en: 'Not a ' + S(ns)[1] + ' and not ' + C(nc)[1] });
    return attrQuestion(q, function (o) { return o.s !== ns && o.c !== nc; }, [function (o) { return o.s !== ns; }, function (o) { return o.c !== nc; }], t);
  }
  function multiCond(g) {
    var t = pick(OBJS), others = Object.keys(SHAPES).filter(function (x) { return x !== t.s; }), q;
    q = mk('condition', 'multi', '找出：' + C(t.c)[0] + '的，不是' + S(others[0])[0] + '，也不是' + S(others[1])[0] + '。', 'Find the one that is ' + C(t.c)[1] + ', not a ' + S(others[0])[1] + ' and not a ' + S(others[1])[1] + '.',
      '三个条件一个一个排除', 'Rule out with the three conditions one at a time', { condition_count: 'multi', condition_type: 'mixed', inference_depth: 'two_step', object_count: 'four' });
    q.scene.push({ k: 'clues', items: [['是' + C(t.c)[0], 'It is ' + C(t.c)[1]], ['不是' + S(others[0])[0], 'It is not a ' + S(others[0])[1]], ['不是' + S(others[1])[0], 'It is not a ' + S(others[1])[1]]] });
    return attrQuestion(q, function (o) { return o.c === t.c && o.s === t.s; },
      [function (o) { return o.c === t.c; }, function (o) { return o.s !== others[0]; }, function (o) { return o.s !== others[1]; }], t);
  }

  // ── CONDITION: simple rules, if-then ──────────────────────────────────────
  function simpleCond(g) {
    var bx = places('box', 3), cs = ['red', 'blue', 'green'], cname = { red: 0, blue: 1, green: 2 };
    var order = shuffle(['red', 'blue', 'green']), ruleCols = order.slice(0, 2), t = pick(OBJS.filter(function (o) { return ruleCols.indexOf(o.c) >= 0 && o.s === 'circle'; }));
    var boxOf = function (c) { return PLACE.box[{ red: 0, blue: 1, green: 2 }[c]]; };
    var q = mk('condition', 'simple', '这个' + C(t.c)[0] + '的东西，放进哪个盒子？', 'Which box does this ' + C(t.c)[1] + ' thing go into?', '照规则找：它是什么颜色',
      'Follow the rule: what colour is it?', { object_count: 'three' });
    q.scene.push({ k: 'rule', zh: ruleCols.map(function (c) { return C(c)[0] + '的放进' + boxOf(c)[1]; }).join('；'), en: ruleCols.map(function (c) { return C(c)[1] + ' goes into the ' + boxOf(c)[2]; }).join('; ') });
    q.scene.push({ k: 'big', v: t.e });
    var all = ['red', 'blue', 'green'].map(function (c) { return boxOf(c)[0] + '~' + boxOf(c)[1] + '~' + boxOf(c)[2]; });
    return opts(q, boxOf(t.c)[0] + '~' + boxOf(t.c)[1] + '~' + boxOf(t.c)[2], all, 3);
  }
  var TOYS = KINDS.toy, FRUITS = KINDS.fruit;
  function condSelect(g) {
    var f = pick(FRUITS), t = pick(TOYS), tgt = Math.random() < 0.5 ? f : t, isFruit = tgt === f;
    var q = mk('condition', 'select', '这个' + tgt[1] + '（' + tgt[0] + '）放进哪里？', 'Where does the ' + tgt[2] + ' (' + tgt[0] + ') go?', '先看它是水果还是玩具', 'Is it a fruit or a toy?',
      { condition_count: 'double', condition_type: 'positive', object_count: 'two' });
    q.scene.push({ k: 'rule', zh: '如果是水果，就放进篮子；如果是玩具，就放进箱子', en: 'If it is fruit, it goes in the basket; if it is a toy, it goes in the box' });
    q.scene.push({ k: 'big', v: tgt[0] });
    return opts(q, isFruit ? '🧺~篮子~basket' : '📦~箱子~box', ['🧺~篮子~basket', '📦~箱子~box'], 2);
  }
  var IFS = [
    { r: ['如果下雨，小明就带伞', 'If it rains, Sam takes an umbrella'], t: ['今天下雨了', 'It rains today'], nt: ['今天没下雨', 'It does not rain today'], c: ['小明带伞了', 'Sam took an umbrella'], nc: ['小明没带伞', 'Sam did not take an umbrella'], qc: ['小明会带伞吗？', 'Will Sam take an umbrella?'], qt: ['今天下雨了吗？', 'Did it rain today?'] },
    { r: ['如果饿了，小红就吃饼干', 'If Amy is hungry, she eats a cookie'], t: ['小红饿了', 'Amy is hungry'], nt: ['小红不饿', 'Amy is not hungry'], c: ['小红吃了饼干', 'Amy ate a cookie'], nc: ['小红没吃饼干', 'Amy did not eat a cookie'], qc: ['小红会吃饼干吗？', 'Will Amy eat a cookie?'], qt: ['小红饿了吗？', 'Is Amy hungry?'] },
    { r: ['如果是红灯，汽车就停下', 'If the light is red, the car stops'], t: ['现在是红灯', 'The light is red now'], nt: ['现在不是红灯', 'The light is not red now'], c: ['汽车停下了', 'The car stopped'], nc: ['汽车没有停', 'The car did not stop'], qc: ['汽车会停下吗？', 'Will the car stop?'], qt: ['现在是红灯吗？', 'Is the light red?'] },
    { r: ['如果天冷，小华就穿外套', 'If it is cold, Lee wears a coat'], t: ['今天很冷', 'It is cold today'], nt: ['今天不冷', 'It is not cold today'], c: ['小华穿了外套', 'Lee wore a coat'], nc: ['小华没穿外套', 'Lee did not wear a coat'], qc: ['小华会穿外套吗？', 'Will Lee wear a coat?'], qt: ['今天冷吗？', 'Is it cold today?'] },
    { r: ['如果困了，小刚就去睡觉', 'If Max is sleepy, he goes to bed'], t: ['小刚困了', 'Max is sleepy'], nt: ['小刚不困', 'Max is not sleepy'], c: ['小刚去睡觉了', 'Max went to bed'], nc: ['小刚没去睡觉', 'Max did not go to bed'], qc: ['小刚会去睡觉吗？', 'Will Max go to bed?'], qt: ['小刚困了吗？', 'Is Max sleepy?'] },
    { r: ['如果是鸟，它就会飞', 'If it is a bird, it can fly'], t: ['这是一只鸟', 'This is a bird'], nt: ['这不是鸟', 'This is not a bird'], c: ['它会飞', 'It can fly'], nc: ['它不会飞', 'It cannot fly'], qc: ['它会飞吗？', 'Can it fly?'], qt: ['它是鸟吗？', 'Is it a bird?'] }
  ];
  function ifThen(g) {
    var b = pick(IFS), kinds = g === 'G2' ? ['mp', 'deny', 'aff', 'mt'] : ['mp', 'mp', 'deny'], k = pick(kinds), fact, ask, ans, depth = 'one_step', ct = 'positive';
    if (k === 'mp') { fact = b.t; ask = b.qc; ans = YES; }
    else if (k === 'deny') { fact = b.nt; ask = b.qc; ans = MAYBE; ct = 'negation'; }
    else if (k === 'aff') { fact = b.c; ask = b.qt; ans = MAYBE; depth = 'two_step'; }
    else { fact = b.nc; ask = b.qt; ans = NO; depth = 'two_step'; ct = 'negation'; }
    var q = mk('condition', 'ifthen', ask[0], ask[1], '先看「如果」后面的事，什么时候一定会发生？', 'Look at the "if" part: when is it certain?', { condition_count: 'double', inference_depth: depth, condition_type: ct, object_count: 'two' });
    q.scene.push({ k: 'rule', zh: b.r[0], en: b.r[1] });
    q.scene.push({ k: 'story', zh: fact[0], en: fact[1] });
    return opts(q, ans, [YES, NO, MAYBE], 3);
  }
  var CAUSES = [
    { g: 'heat', s: ['冰放在太阳下面', 'Ice is left in the sun'], r: ['冰化成水了', 'The ice melts'] },
    { g: 'fall', s: ['小球从桌子上滚下去', 'A ball rolls off the table'], r: ['小球掉到地上', 'The ball falls to the floor'] },
    { g: 'plant', s: ['花很久没有浇水', 'The flower has had no water for days'], r: ['花枯萎了', 'The flower wilts'] },
    { g: 'pop', s: ['气球被针扎了一下', 'A balloon is pricked with a pin'], r: ['气球爆了', 'The balloon pops'] },
    { g: 'heat', s: ['蜡烛点了很久很久', 'A candle burns for a very long time'], r: ['蜡烛变短了', 'The candle gets shorter'] },
    { g: 'fall', s: ['盘子从手里滑掉', 'A plate slips from a hand'], r: ['盘子摔碎了', 'The plate breaks'] },
    { g: 'water', s: ['水倒进杯子里倒满了还在倒', 'Water keeps pouring into a full cup'], r: ['水流出来了', 'The water spills over'] }
  ];
  function causeResult(g) {
    var p = pick(CAUSES), q = mk('inference', 'cause', '接下来最可能发生什么？', 'What is most likely to happen next?', '想想平时见过的', 'Think of what you have seen before',
      { inference_depth: 'one_step', object_count: 'two' });
    q.scene.push({ k: 'story', zh: p.s[0], en: p.s[1] });
    var wr = shuffle(CAUSES.filter(function (x) { return x.g !== p.g; })).slice(0, 3).map(function (x) { return tx(x.r[0], x.r[1]); });
    return opts(q, tx(p.r[0], p.r[1]), wr, 4);
  }
  function allRule(g) {
    var cs = shuffle(Object.keys(COLORS)).slice(0, 2), a = cs[0], b = cs[1], conv = g === 'G2' && Math.random() < 0.5;
    var boxA = PLACE.box[{ red: 0, blue: 1, green: 2, purple: 3 }[a]], boxB = PLACE.box[{ red: 0, blue: 1, green: 2, purple: 3 }[b]], q;
    if (!conv) {
      q = mk('inference', 'all', '它在哪个盒子里？', 'Which box is it in?', '规则说「所有」，它是' + C(a)[0] + '的', 'The rule says "all" and it is ' + C(a)[1], { condition_count: 'double', object_count: 'three' });
      q.scene.push({ k: 'rule', zh: '所有' + C(a)[0] + '的球都放在' + boxA[1] + '里', en: 'All ' + C(a)[1] + ' balls are in the ' + boxA[2] });
      q.scene.push({ k: 'story', zh: '这是一个' + C(a)[0] + '的球', en: 'This is a ' + C(a)[1] + ' ball' });
      return opts(q, boxA[0] + '~' + boxA[1] + '~' + boxA[2], [boxB[0] + '~' + boxB[1] + '~' + boxB[2], '❔~不知道~Don\'t know'], 3);
    }
    q = mk('inference', 'converse', '它一定是' + C(a)[0] + '的球吗？', 'Is it definitely a ' + C(a)[1] + ' ball?', '规则只说了「红的在红盒」，没说「红盒里全是红的」', 'The rule says red goes in the red box, not that the red box holds only red',
      { condition_count: 'double', inference_depth: 'two_step', object_count: 'three' });
    q.scene.push({ k: 'rule', zh: '所有' + C(a)[0] + '的球都放在' + boxA[1] + '里', en: 'All ' + C(a)[1] + ' balls are in the ' + boxA[2] });
    q.scene.push({ k: 'story', zh: '有一个球在' + boxA[1] + '里', en: 'A ball is in the ' + boxA[2] });
    return opts(q, MAYBE, [YES, NO], 3);
  }

  // ── ELIMINATION & MATCHING (constraint engine) ────────────────────────────
  function assignClueText(c, people, items, verbs) {
    var P = people[c.p], I = items[c.i];
    if (c.k === 'is') return [cap(P.say('zh') + verbs.is[0] + I.say('zh') + '。'), cap(P.say('en') + ' ' + verbs.is[1] + ' ' + I.say('en') + '.')];
    return [cap(P.say('zh') + verbs.not[0] + I.say('zh') + '。'), cap(P.say('en') + ' ' + verbs.not[1] + ' ' + I.say('en') + '.')];
  }
  function assignPuzzle(n, cmin, cmax, needInfer) {
    for (var t = 0; t < 400; t++) {
      var sol = pick(perms(n)), cands = [];
      for (var p = 0; p < n; p++) for (var i = 0; i < n; i++) (function (p, i) {
        cands.push(sol[p] === i ? { k: 'is', p: p, i: i, f: function (a) { return a[p] === i; } } : { k: 'not', p: p, i: i, f: function (a) { return a[p] !== i; } });
      })(p, i);
      var clues = buildPuzzle(n, sol, cands, cmin, cmax);
      if (!clues) continue;
      var hasNot = clues.some(function (c) { return c.k === 'not'; });
      var direct = clues.filter(function (c) { return c.k === 'is'; }).map(function (c) { return c.p; });
      var open = []; for (var x = 0; x < n; x++) if (direct.indexOf(x) < 0) open.push(x);
      if (!hasNot || (needInfer && !open.length)) continue;
      return { sol: sol, clues: clues, ask: pick(needInfer ? open : Array.apply(null, Array(n)).map(function (_, i) { return i; })) };
    }
    return null;
  }
  function assignQuestion(type, mode, g, n, cmin, cmax, people, items, verbs, askZh, askEn, scenePlaces, hz, he) {
    var pz = assignPuzzle(n, cmin, cmax, true) || assignPuzzle(n, cmin, cmax + 1, false);
    var q = mk(type, mode, askZh(people[pz.ask]), askEn(people[pz.ask]), hz, he,
      { condition_count: pz.clues.length >= 4 ? 'multi' : 'double', object_count: n === 4 ? 'four' : 'three', inference_depth: n === 4 ? 'multi_step' : 'two_step', condition_type: 'negation' });
    if (scenePlaces) q.scene.push(cellsOf(items));
    q.scene.push({ k: 'clues', items: pz.clues.map(function (c) { return assignClueText(c, people, items, verbs); }) });
    var ans = items[pz.sol[pz.ask]];
    return opts(q, ans.tok, items.map(function (x) { return x.tok; }), n);
  }
  function elimDoor1(g) {
    var an = pick(ANIMALS), ds = places('door', 3), win = pick(ds), others = ds.filter(function (d) { return d !== win; });
    var q = mk('elimination', 'door1', an.zh + '（' + an.e + '）在哪个门里？', 'Which door is the ' + an.en + ' (' + an.e + ') behind?', '一个一个排除，剩下的就是答案', 'Rule them out one by one; what is left is the answer',
      { condition_count: 'double', condition_type: 'negation', object_count: 'three' });
    q.scene.push(cellsOf(ds));
    q.scene.push({ k: 'clues', items: others.map(function (d) { return [an.say('zh') + '不在' + d.zh + '后面。', cap(an.say('en')) + ' is not behind the ' + d.en + '.']; }) });
    return opts(q, win.tok, ds.map(function (d) { return d.tok; }), 3);
  }
  function elimHouse(g) {
    var n = g === 'G2' ? 4 : 3, people = shuffle(ANIMALS).slice(0, n), kind = pick(['house', 'door', 'box']);
    var items = places(kind, n), verbs = kind === 'house' ? { is: ['住在', 'lives in'], not: ['不住在', 'does not live in'] } : { is: ['在', 'is behind'], not: ['不在', 'is not behind'] };
    if (kind === 'box') verbs = { is: ['在', 'is in'], not: ['不在', 'is not in'] };
    var where = kind === 'house' ? ['住在哪个房子', 'live'] : ['在哪里', 'be'];
    return assignQuestion('elimination', 'house', g, n, g === 'K2' ? 2 : 3, g === 'G2' ? 5 : 3, people, items, verbs,
      function (p) { return p.say('zh') + where[0] + '？'; }, function (p) { return 'Where is ' + p.say('en') + '?'; }, true,
      '先看哪个位置已经被占了', 'See which place is already taken');
  }
  function matchClues(g) {
    var n = g === 'G2' ? 4 : 3, people = g === 'G2' ? shuffle(KIDS).slice(0, n) : (Math.random() < 0.5 ? shuffle(ANIMALS).slice(0, n) : shuffle(KIDS).slice(0, n));
    var items = shuffle(FOODS).slice(0, n), verbs = { is: ['喜欢', 'likes'], not: ['不喜欢', 'does not like'] };
    var mode = g === 'G2' ? 'grid' : 'match';
    return assignQuestion('matching', mode, g, n, g === 'K2' ? 2 : 3, g === 'G2' ? 6 : 4, people, items, verbs,
      function (p) { return p.say('zh') + '喜欢什么？'; }, function (p) { return 'What does ' + p.say('en') + ' like?'; }, true,
      '一一对应：每人一样，不重复', 'One each: nobody shares', 'One each: nobody shares');
  }
  // "Find the rule": the examples fix the answer, common sense cannot help.
  // Pairs share ONE visible feature (same colour / same number / same kind).
  var COLOR_THINGS = {
    red: [['🍎', '苹果', 'apple'], ['🚒', '消防车', 'fire truck'], ['🍓', '草莓', 'strawberry'], ['🐞', '瓢虫', 'ladybug']],
    yellow: [['🍌', '香蕉', 'banana'], ['🚕', '出租车', 'taxi'], ['🐥', '小鸡', 'chick'], ['🍋', '柠檬', 'lemon']],
    green: [['🍏', '青苹果', 'green apple'], ['🐸', '青蛙', 'frog'], ['🐢', '乌龟', 'turtle'], ['🥒', '黄瓜', 'cucumber']],
    blue: [['🚙', '越野车', 'jeep'], ['🐳', '鲸鱼', 'whale'], ['🧢', '蓝帽子', 'blue cap'], ['🫐', '蓝莓', 'blueberries']]
  };
  var DOTS = { red: '🔴', yellow: '🟡', green: '🟢', blue: '🔵' };
  function tokOf(x) { return x[0] + '~' + x[1] + '~' + x[2]; }
  function simpleMatch(g) {
    var mode = pick(['color', 'color', 'count', 'kind']), q;
    if (mode === 'color') {
      var cs = shuffle(Object.keys(COLOR_THINGS)), c1 = cs[0], c2 = cs[1], c3 = cs[2];
      var x1 = pick(COLOR_THINGS[c1]), x2 = pick(COLOR_THINGS[c2]), x3 = pick(COLOR_THINGS[c3]);
      q = mk('matching', 'rule', '问号处应该是哪一个？', 'What goes in place of the question mark?', '看看每一行，圆点和东西有什么相同', 'Look at each row: what do the dot and the thing share?', { condition_count: 'double', object_count: 'three' });
      q.scene.push({ k: 'pairs', items: [[DOTS[c1], x1[0]], [DOTS[c2], x2[0]]] });
      q.scene.push({ k: 'pairs', items: [[DOTS[c3], '❓']] });
      var wrong = [];
      Object.keys(COLOR_THINGS).forEach(function (c) { if (c !== c3) wrong.push(pick(COLOR_THINGS[c])); });
      return opts(q, tokOf(x3), wrong.map(tokOf), 3);
    }
    if (mode === 'count') {
      var ns = shuffle([1, 2, 3, 4, 5]), n1 = ns[0], n2 = ns[1], n3 = ns[2], th = shuffle(['🍎', '🐟', '🍪', '🎈']);
      var rep = function (e, n) { return new Array(n + 1).join(e); };
      q = mk('matching', 'rule', '问号处应该是哪一个？', 'What goes in place of the question mark?', '数一数，每一行左右两边有什么相同', 'Count: what do the two sides of each row share?', { condition_count: 'double', object_count: 'three' });
      q.scene.push({ k: 'pairs', items: [[rep(th[0], n1), n1 + ''], [rep(th[1], n2), n2 + '']] });
      q.scene.push({ k: 'pairs', items: [[rep(th[2], n3), '❓']] });
      return opts(q, String(n3), [n1, n2, n3 - 1 < 1 ? n3 + 3 : n3 - 1, n3 + 1 > 5 ? n3 - 2 : n3 + 1].map(String), 4);
    }
    var kinds = shuffle(Object.keys(KINDS)), k1 = kinds[0], k2 = kinds[1], k3 = kinds[2];
    var a1 = shuffle(KINDS[k1]), a2 = shuffle(KINDS[k2]), a3 = shuffle(KINDS[k3]);
    q = mk('matching', 'rule', '问号处应该是哪一个？', 'What goes in place of the question mark?', '看看每一行，两个东西有什么相同', 'Look at each row: what do the two things share?', { condition_count: 'double', object_count: 'three' });
    q.scene.push({ k: 'pairs', items: [[a1[0][0], a1[1][0]], [a2[0][0], a2[1][0]]] });
    q.scene.push({ k: 'pairs', items: [[a3[0][0], '❓']] });
    // distractors come from the OTHER kinds only, so exactly one option is the same kind
    var wr = kinds.filter(function (k) { return k !== k3; }).slice(0, 3).map(function (k) { return pick(KINDS[k]); });
    return opts(q, tokOf(a3[1]), wr.map(tokOf), 4);
  }


  // ── information state: a clue that is not needed ─────────────────────────
  var IRRELEVANT = [
    ['今天天气很好。', 'The weather is nice today.'], ['教室里有一盏灯。', 'There is a lamp in the classroom.'],
    ['桌子是圆的。', 'The table is round.'], ['窗外有一只小鸟。', 'A little bird is outside the window.'],
    ['现在是下午三点。', 'It is three o\'clock in the afternoon.']
  ];
  function clueNo(i) { return tx('线索 ' + (i + 1), 'Clue ' + (i + 1)); }
  // an unrelated sentence is mixed into the clues: ignore it, or point it out
  function clueDistract(g) {
    var n = 3, people = shuffle(KIDS).slice(0, n), items = shuffle(FOODS).slice(0, n), verbs = { is: ['喜欢', 'likes'], not: ['不喜欢', 'does not like'] };
    var pz = assignPuzzle(n, 2, 5, true) || assignPuzzle(n, 2, 6, false);
    var texts = pz.clues.map(function (c) { return assignClueText(c, people, items, verbs); });
    var extra = pick(IRRELEVANT), at = ri(0, texts.length);
    texts.splice(at, 0, extra);
    var which = Math.random() < 0.5, q;
    if (which) {
      q = mk('elimination', 'distract', '哪一条线索和「谁喜欢什么」没有关系？', 'Which clue has nothing to do with who likes what?', '看哪一条根本没有说到人和食物', 'Find the clue that mentions neither a person nor a food',
        { condition_count: 'multi', object_count: 'three', information_state: 'distractor', inference_depth: 'two_step', condition_type: 'negation' });
    } else {
      q = mk('elimination', 'distract', people[pz.ask].say('zh') + '喜欢什么？', 'What does ' + people[pz.ask].say('en') + ' like?', '有一条线索和问题没有关系，不用管它', 'One clue has nothing to do with the question — ignore it',
        { condition_count: 'multi', object_count: 'three', information_state: 'distractor', inference_depth: 'two_step', condition_type: 'negation' });
    }
    q.scene.push(cellsOf(items));
    q.scene.push({ k: 'clues', items: texts });
    if (which) return opts(q, clueNo(at), texts.map(function (t, i) { return clueNo(i); }), 4);
    return opts(q, items[pz.sol[pz.ask]].tok, items.map(function (x) { return x.tok; }), 3);
  }
  // one clue only repeats what the others already imply
  function clueRedundant(g) {
    var p = shuffle(KIDS).slice(0, 3), rel = pick(['tall', 'fast']), R = REL[rel];
    var cl = [clueText(p[0], p[1], rel, Math.random() < 0.5), clueText(p[1], p[2], rel, Math.random() < 0.5), clueText(p[0], p[2], rel, Math.random() < 0.5)];
    var order = shuffle([0, 1, 2]), texts = order.map(function (i) { return cl[i]; }), spare = order.indexOf(2);
    var middle = Math.random() < 0.4, q;
    if (middle) {
      q = mk('ordering', 'redundant', '排在中间的是谁？', 'Who is in the middle?', '有一条线索可以不用，其他两条已经够了', 'One clue is not needed — the other two are enough',
        { condition_count: 'multi', object_count: 'three', information_state: 'redundant', inference_depth: 'two_step' });
    } else {
      q = mk('ordering', 'redundant', '要排出三个人的顺序，哪一条线索可以不要？', 'To put the three in order, which clue is not needed?', '去掉它以后，剩下两条还能排出顺序', 'Without it, the other two still give the order',
        { condition_count: 'multi', object_count: 'three', information_state: 'redundant', inference_depth: 'two_step' });
    }
    q.scene.push({ k: 'clues', items: texts });
    if (middle) return opts(q, p[1].tok, p.map(function (x) { return x.tok; }), 3);
    return opts(q, clueNo(spare), [0, 1, 2].map(clueNo), 3);
  }

  // ── ORDERING ──────────────────────────────────────────────────────────────
  var SIZED = [ent('🐭', '老鼠', 'mouse'), ent('🐱', '小猫', 'cat'), ent('🐶', '小狗', 'dog'), ent('🐻', '小熊', 'bear'), ent('🐘', '大象', 'elephant')];
  var REL = {
    big:   { a: ['大', 'bigger than'], b: ['小', 'smaller than'], top: ['最大', 'biggest'], bot: ['最小', 'smallest'] },
    tall:  { a: ['高', 'taller than'], b: ['矮', 'shorter than'], top: ['最高', 'tallest'], bot: ['最矮', 'shortest'] },
    queue: { a: ['在前面', 'is ahead of'], b: ['在后面', 'is behind'], top: ['排最前面', 'first in line'], bot: ['排最后面', 'last in line'] },
    fast:  { a: ['跑得快', 'runs faster than'], b: ['跑得慢', 'runs slower than'], top: ['跑得最快', 'the fastest'], bot: ['跑得最慢', 'the slowest'] }
  };
  function clueText(hi, lo, rel, flip) { // "hi is more X than lo" (hi ranks above lo)
    var R = REL[rel], H = hi.say('zh'), L = lo.say('zh'), He = hi.say('en'), Le = lo.say('en');
    if (rel === 'queue') return flip ? [cap(L + '在' + H + '后面。'), cap(Le + ' is behind ' + He + '.')] : [cap(H + '在' + L + '前面。'), cap(He + ' is ahead of ' + Le + '.')];
    if (!flip) return [cap(H + '比' + L + R.a[0] + '。'), cap(He + ' is ' + R.a[1] + ' ' + Le + '.')];
    return [cap(L + '比' + H + R.b[0] + '。'), cap(Le + ' is ' + (rel === 'big' ? 'smaller than' : rel === 'tall' ? 'shorter than' : rel === 'fast' ? 'slower than' : 'behind') + ' ' + He + '.')];
  }
  function orderChain(g, n, rel, pictures) {
    var pool = pictures ? SIZED : KIDS, people = pictures ? SIZED.slice(0).sort(function () { return 0; }) : shuffle(KIDS).slice(0, n);
    var order;
    if (pictures) { var idx = shuffle([0, 1, 2, 3, 4]).slice(0, n).sort(function (a, b) { return b - a; }); order = idx.map(function (i) { return SIZED[i]; }); }
    else order = people;
    var R = REL[rel], clues = [];
    for (var i = 0; i < n - 1; i++) clues.push(clueText(order[i], order[i + 1], rel, Math.random() < 0.5));
    clues = shuffle(clues);
    var rank = n === 3 ? pick([0, 1, 2]) : pick([0, 1, 2, 3]);
    var askZh = rank === 0 ? '谁' + R.top[0] + '？' : rank === n - 1 ? '谁' + R.bot[0] + '？' : rank === 1 && n === 3 ? '排在中间的是谁？' : '从' + (rel === 'queue' ? '前' : '高到矮') + '数，第 ' + (rank + 1) + ' 个是谁？';
    var askEn = rank === 0 ? 'Who is ' + R.top[1] + '?' : rank === n - 1 ? 'Who is ' + R.bot[1] + '?' : rank === 1 && n === 3 ? 'Who is in the middle?' : 'Counting from the ' + (rel === 'queue' ? 'front' : 'tallest') + ', who is number ' + (rank + 1) + '?';
    if (rel === 'big' || rel === 'fast') { if (rank !== 0 && rank !== n - 1 && !(rank === 1 && n === 3)) { askZh = '按从' + (rel === 'big' ? '大到小' : '快到慢') + '排，第 ' + (rank + 1) + ' 个是谁？'; askEn = 'Ordered from ' + (rel === 'big' ? 'biggest to smallest' : 'fastest to slowest') + ', who is number ' + (rank + 1) + '?'; } }
    var q = mk('ordering', 'chain', askZh, askEn, '把线索接起来，排出整个顺序', 'Join the clues and build the whole order',
      { condition_count: n === 3 ? 'double' : 'multi', object_count: n === 3 ? 'three' : 'four', inference_depth: n === 3 ? 'two_step' : 'multi_step' });
    q.scene.push({ k: 'clues', items: clues });
    return opts(q, order[rank].tok, order.map(function (x) { return x.tok; }), n);
  }
  function orderK2(g) { return orderChain(g, 3, pick(['big']), true); }
  function orderPeople3(g) { return orderChain(g, 3, pick(['tall', 'queue', 'fast']), false); }
  function orderPeople4(g) { return orderChain(g, 4, pick(['tall', 'queue', 'fast']), false); }
  // not enough information: the child must not guess
  function orderUnknown(g) {
    var p = shuffle(KIDS).slice(0, 3), A = p[0], B = p[1], C2 = p[2], rel = pick(['tall', 'fast']), R = REL[rel], det = Math.random() < 0.4, clues, askA, askB, ans;
    if (det) { clues = [clueText(A, B, rel, false), clueText(B, C2, rel, false)]; askA = A; askB = C2; ans = A; }
    else if (Math.random() < 0.5) { clues = [clueText(A, B, rel, false), clueText(A, C2, rel, false)]; askA = B; askB = C2; ans = null; }
    else { clues = [clueText(A, C2, rel, false), clueText(B, C2, rel, false)]; askA = A; askB = B; ans = null; }
    clues = shuffle(clues);
    var more = rel === 'tall' ? ['高', 'taller'] : ['快', 'faster'];
    var q = mk('ordering', 'unknown', askA.say('zh') + '和' + askB.say('zh') + '，谁' + (rel === 'tall' ? '更高' : '跑得更快') + '？', 'Who is ' + more[1] + ': ' + askA.say('en') + ' or ' + askB.say('en') + '?',
      '线索不够的时候，不能猜', 'When the clues are not enough, do not guess', { condition_count: 'double', inference_depth: 'two_step', information_state: 'missing' });
    q.scene.push({ k: 'clues', items: clues });
    return opts(q, ans ? ans.tok : TELL, [askA.tok, askB.tok, TELL], 3);
  }
  // constraint puzzle: slots in a row
  function slotClueText(c, E) {
    var P = E[c.p] && E[c.p].say, Q = E[c.q] && E[c.q].say;
    if (c.k === 'pos') return [cap(P('zh') + '在' + (c.s === 0 ? '第一格' : '最后一格') + '。'), cap(P('en') + ' is in the ' + (c.s === 0 ? 'first' : 'last') + ' square.')];
    if (c.k === 'npos') return [cap(P('zh') + '不在第 ' + (c.s + 1) + ' 格。'), cap(P('en') + ' is not in square ' + (c.s + 1) + '.')];
    if (c.k === 'before') return [cap(P('zh') + '在' + Q('zh') + '的左边。'), cap(P('en') + ' is to the left of ' + Q('en') + '.')];
    return [cap(P('zh') + '紧挨在' + Q('zh') + '的左边。'), cap(P('en') + ' is right next to ' + Q('en') + ', on its left.')];
  }
  function constraintData() {
    var n = 4, E = shuffle(ANIMALS).slice(0, n);
    for (var t = 0; t < 400; t++) {
      var sol = pick(perms(n)), cands = [], p, q2, s;
      for (p = 0; p < n; p++) {
        for (s = 0; s < n; s++) (function (p, s) {
          if (sol[p] === s && (s === 0 || s === n - 1)) cands.push({ k: 'pos', p: p, s: s, f: function (a) { return a[p] === s; } });
          if (sol[p] !== s) cands.push({ k: 'npos', p: p, s: s, f: function (a) { return a[p] !== s; } });
        })(p, s);
        for (q2 = 0; q2 < n; q2++) if (p !== q2) (function (p, q2) {
          if (sol[p] < sol[q2]) cands.push({ k: 'before', p: p, q: q2, f: function (a) { return a[p] < a[q2]; } });
          if (sol[q2] === sol[p] + 1) cands.push({ k: 'imm', p: p, q: q2, f: function (a) { return a[q2] === a[p] + 1; } });
        })(p, q2);
      }
      var clues = buildPuzzle(n, sol, cands, 3, 5);
      if (!clues) continue;
      var direct = clues.filter(function (c) { return c.k === 'pos'; }).map(function (c) { return c.p; }), open = [];
      for (p = 0; p < n; p++) if (direct.indexOf(p) < 0) open.push(p);
      if (!open.length || !clues.some(function (c) { return c.k === 'npos'; })) continue;
      return { E: E, sol: sol, clues: clues, ask: pick(open) };
    }
    return null;
  }
  function constraintPuzzle(g) {
    var d = constraintData();
    if (!d) return orderPeople4(g);
    var E = d.E, sol = d.sol, ask = d.ask;
    var qq = mk('ordering', 'constraint', E[ask].say('zh') + '在第几格？', 'Which square is ' + E[ask].say('en') + ' in?', '先把能确定的放进格子，再看剩下的', 'Place what you can first, then look at the rest',
      { condition_count: 'multi', object_count: 'four', inference_depth: 'multi_step', condition_type: 'mixed' });
    qq.scene.push({ k: 'cells', items: [0, 1, 2, 3].map(function (i) { return { e: '⬜', zh: '第 ' + (i + 1) + ' 格', en: 'Square ' + (i + 1) }; }) });
    qq.scene.push({ k: 'clues', items: d.clues.map(function (c) { return slotClueText(c, E); }) });
    return opts(qq, tx(String(sol[ask] + 1), String(sol[ask] + 1)), [1, 2, 3, 4].map(function (i) { return tx(String(i), String(i)); }), 4);
  }

  // ── TRUTH ─────────────────────────────────────────────────────────────────
  function truthCount(g) {
    var fs = shuffle(['🍎', '🍌', '🍓', '🍪', '🐟']).slice(0, 2), A = fs[0], B = fs[1], max = g === 'K1' ? 5 : 8;
    var a = ri(1, max), b = ri(1, max), rep = function (e, n) { return new Array(n + 1).join(e); };
    var nm = { '🍎': ['苹果', 'apples'], '🍌': ['香蕉', 'bananas'], '🍓': ['草莓', 'strawberries'], '🍪': ['饼干', 'cookies'], '🐟': ['小鱼', 'fish'] };
    var kind = pick(g === 'K1' ? ['more', 'fewer'] : ['more', 'fewer', 'same', 'num']), truth;
    var say, sayEn;
    if (kind === 'more') { truth = a > b; say = nm[A][0] + '（' + A + '）比' + nm[B][0] + '（' + B + '）多'; sayEn = nm[A][1] + ' (' + A + ') are more than ' + nm[B][1] + ' (' + B + ')'; }
    else if (kind === 'fewer') { truth = a < b; say = nm[A][0] + '（' + A + '）比' + nm[B][0] + '（' + B + '）少'; sayEn = nm[A][1] + ' (' + A + ') are fewer than ' + nm[B][1] + ' (' + B + ')'; }
    else if (kind === 'same') { if (Math.random() < 0.5) b = a; truth = a === b; say = nm[A][0] + '（' + A + '）和' + nm[B][0] + '（' + B + '）一样多'; sayEn = nm[A][1] + ' (' + A + ') and ' + nm[B][1] + ' (' + B + ') are equal in number'; }
    else { var claim = Math.random() < 0.5 ? a : ri(1, max); truth = claim === a; say = nm[A][0] + '（' + A + '）有 ' + claim + ' 个'; sayEn = 'There are ' + claim + ' ' + nm[A][1] + ' (' + A + ')'; }
    var q = mk('truth', 'count', '这句话对吗？', 'Is this sentence right?', '先数一数，再判断', 'Count first, then decide', { condition_count: 'single', object_count: 'two', inference_depth: 'direct' });
    q.scene.push({ k: 'big', v: rep(A, a) + '<br>' + rep(B, b) });
    q.scene.push({ k: 'rule', zh: say, en: sayEn });
    return opts(q, truth ? RIGHT : WRONG, [RIGHT, WRONG], 2);
  }
  function truthAll(g) {
    var n = g === 'K2' ? 4 : 5, row = shuffle(OBJS).slice(0, n), s = pick(Object.keys(SHAPES)), c = pick(Object.keys(COLORS)), kind = pick(['all', 'some', 'none']);
    var withS = row.filter(function (o) { return o.s === s; }), truth, zh, en;
    if (kind === 'all') { truth = withS.length > 0 && withS.every(function (o) { return o.c === c; }); zh = '所有的' + S(s)[0] + '都是' + C(c)[0] + '的'; en = 'Every ' + S(s)[1] + ' is ' + C(c)[1]; }
    else if (kind === 'some') { truth = withS.some(function (o) { return o.c === c; }); zh = '有的' + S(s)[0] + '是' + C(c)[0] + '的'; en = 'Some ' + S(s)[1] + 's are ' + C(c)[1]; }
    else { truth = !withS.some(function (o) { return o.c === c; }); zh = '没有' + C(c)[0] + '的' + S(s)[0]; en = 'There is no ' + C(c)[1] + ' ' + S(s)[1]; }
    if (kind === 'all' && !withS.length) { return truthAll(g); }
    var q = mk('truth', 'quant', '看图，这句话对吗？', 'Look at the picture. Is this sentence right?', '一个一个对着图检查', 'Check against the picture one by one',
      { condition_count: 'single', object_count: n === 4 ? 'four' : 'four', inference_depth: 'one_step' });
    q.scene.push({ k: 'big', v: row.map(function (o) { return o.e; }).join(' ') });
    q.scene.push({ k: 'rule', zh: zh, en: en });
    return opts(q, truth ? RIGHT : WRONG, [RIGHT, WRONG], 2);
  }

  // ── certain / possible / impossible ───────────────────────────────────────
  var BALL = { red: '🔴', blue: '🔵', green: '🟢' };
  function bag(g) {
    var cols = shuffle(['red', 'blue', 'green']), balls = [], two = g === 'G2' && Math.random() < 0.7, n = ri(3, 5);
    var mixKinds = pick(['mixed', 'mixed', 'single']);
    if (mixKinds === 'single') { for (var i = 0; i < n; i++) balls.push(cols[0]); }
    else { for (var j = 0; j < n; j++) balls.push(j === 0 ? cols[1] : pick([cols[0], cols[0], cols[1]])); }
    var event = pick([{ c: cols[0], zh: C(cols[0])[0] + '球', en: 'a ' + C(cols[0])[1] + ' ball' }, { c: cols[1], zh: C(cols[1])[0] + '球', en: 'a ' + C(cols[1])[1] + ' ball' }, { c: cols[2], zh: C(cols[2])[0] + '球', en: 'a ' + C(cols[2])[1] + ' ball' }]);
    var verdict, claimZh, claimEn, outcomes = [];
    if (!two) {
      balls.forEach(function (b) { outcomes.push(b === event.c); });
      claimZh = '随便拿出一个，是' + event.zh; claimEn = 'Take one without looking: it is ' + event.en;
    } else {
      var kind = pick(['both', 'atleast']);
      balls.forEach(function (b1, i) { balls.forEach(function (b2, j) { if (i !== j) outcomes.push(kind === 'both' ? (b1 === event.c && b2 === event.c) : (b1 === event.c || b2 === event.c)); }); });
      claimZh = kind === 'both' ? '连续拿两次（不放回），两次都是' + event.zh : '连续拿两次（不放回），至少有一次是' + event.zh;
      claimEn = kind === 'both' ? 'Take two in a row (no putting back): both are ' + event.en : 'Take two in a row (no putting back): at least one is ' + event.en;
    }
    verdict = outcomes.every(Boolean) ? 'certain' : outcomes.some(Boolean) ? 'possible' : 'impossible';
    var q = mk('inference', 'bag', claimZh + '。', claimEn + '.', '想想：每一种拿法，会不会都这样？', 'Think: does every way of taking give this?',
      { condition_count: two ? 'double' : 'single', inference_depth: two ? 'two_step' : 'one_step', object_count: 'four', information_state: 'complete' });
    q.promptZh = '这件事…'; q.promptEn = 'This is…';
    q.scene.push({ k: 'story', zh: '袋子里有这些球', en: 'The bag holds these balls' });
    q.scene.push({ k: 'big', v: balls.map(function (b) { return BALL[b]; }).join(' ') });
    q.scene.push({ k: 'rule', zh: claimZh, en: claimEn });
    var T = { certain: tx('一定会 ✅', 'Certain ✅'), possible: tx('可能会 🤔', 'Possible 🤔'), impossible: tx('不可能 ❌', 'Impossible ❌') };
    return opts(q, T[verdict], [T.certain, T.possible, T.impossible], 3);
  }


  // ── ACTIVITY DATA (drag / grid mini games; same engine, interactive shape) ──
  function itemOf(x, i, pre) { // a draggable card: picture + caption
    return x.e ? { id: pre + i, emoji: x.e, captionZh: x.zh, captionEn: x.en } : { id: pre + i, emoji: '🧒', captionZh: x.zh, captionEn: x.en };
  }
  function sayClues(clues) { return { zh: clues.map(function (c) { return c[0]; }).join(' '), en: clues.map(function (c) { return c[1]; }).join(' ') }; }
  // rank ordering by clues: sort slots run low -> high (or front -> back)
  function actOrder(n, pictures) {
    var rel = pictures ? 'big' : pick(['tall', 'queue', 'fast']), R = REL[rel], order;
    if (pictures) { var idx = shuffle([0, 1, 2, 3, 4]).slice(0, n).sort(function (a, b) { return b - a; }); order = idx.map(function (i) { return SIZED[i]; }); }
    else order = shuffle(KIDS).slice(0, n);
    var clues = [];
    for (var i = 0; i < n - 1; i++) clues.push(clueText(order[i], order[i + 1], rel, Math.random() < 0.5));
    clues = shuffle(clues);
    var asc = rel !== 'queue', seq = asc ? order.slice().reverse() : order.slice();
    var lbl = { big: ['小', 'Small', '大', 'Big'], tall: ['矮', 'Short', '高', 'Tall'], fast: ['慢', 'Slow', '快', 'Fast'], queue: ['前', 'Front', '后', 'Back'] }[rel];
    var items = seq.map(function (x, i) { return itemOf(x, i, 'O'); });
    var say = sayClues(clues);
    return { targetOrder: items.map(function (t) { return t.id; }), items: shuffle(items),
      lowZh: lbl[0], lowEn: lbl[1], highZh: lbl[2], highEn: lbl[3],
      instrZh: say.zh + ' 把他们排好 →', instrEn: say.en + ' Put them in order →' };
  }
  function actConstraint() {
    var d = constraintData(); if (!d) return actOrder(4, false);
    var E = d.E, items = [0, 1, 2, 3].map(function (slot) { var who = d.sol.indexOf(slot); return itemOf(E[who], slot, 'C'); });
    var say = sayClues(d.clues.map(function (c) { return slotClueText(c, E); }));
    return { targetOrder: items.map(function (t) { return t.id; }), items: shuffle(items), lowZh: '第1格', lowEn: 'Square 1', highZh: '第4格', highEn: 'Square 4',
      instrZh: say.zh + ' 把它们排进格子 →', instrEn: say.en + ' Put them in the squares →' };
  }
  function actGrid(n) {
    var pz = assignPuzzle(n, n === 4 ? 4 : 3, n === 4 ? 7 : 5, false) || assignPuzzle(n, 2, 8, false);
    var people = n === 4 ? shuffle(KIDS).slice(0, n) : shuffle(ANIMALS).slice(0, n), foods = shuffle(FOODS).slice(0, n);
    var verbs = { is: ['喜欢', 'likes'], not: ['不喜欢', 'does not like'] };
    return { people: people.map(function (p, i) { return { id: 'P' + i, e: p.e, zh: p.zh, en: p.en }; }),
      items: foods.map(function (f, i) { return { id: 'F' + i, e: f.e, zh: f.zh, en: f.en }; }),
      solution: pz.sol, clues: pz.clues.map(function (c) { return assignClueText(c, people, foods, verbs); }),
      instrZh: '根据线索，找出每个人喜欢什么', instrEn: 'Use the clues to find what each one likes' };
  }
  function actGroupColors(n) { // follow a colour rule: each thing goes in its colour's box
    var cs = shuffle(Object.keys(COLOR_THINGS)).slice(0, 2), items = [], k = 0;
    cs.forEach(function (c) { shuffle(COLOR_THINGS[c]).slice(0, n / 2).forEach(function (x) { items.push({ id: 'G' + (k++), emoji: x[0], nameZh: x[1], nameEn: x[2], bin: c }); }); });
    var bn = { red: ['🟥', '红盒子', 'Red box'], yellow: ['🟨', '黄盒子', 'Yellow box'], green: ['🟩', '绿盒子', 'Green box'], blue: ['🟦', '蓝盒子', 'Blue box'] };
    return { bins: cs.map(function (c) { return { id: c, emoji: bn[c][0], labelZh: bn[c][1], labelEn: bn[c][2] }; }), items: shuffle(items),
      hintZh: '规则：' + cs.map(function (c) { return bn[c][1].replace('盒子', '') + '的放进' + bn[c][1]; }).join('；'), hintEn: 'Rule: ' + cs.map(function (c) { return bn[c][2].replace(' box', '') + ' goes in the ' + bn[c][2].toLowerCase(); }).join('; ') };
  }
  function actGroupIf(n) { // if fruit then basket, if toy then box
    var items = [], k = 0;
    shuffle(KINDS.fruit).slice(0, n / 2).forEach(function (x) { items.push({ id: 'G' + (k++), emoji: x[0], nameZh: x[1], nameEn: x[2], bin: 'basket' }); });
    shuffle(KINDS.toy).slice(0, n / 2).forEach(function (x) { items.push({ id: 'G' + (k++), emoji: x[0], nameZh: x[1], nameEn: x[2], bin: 'box' }); });
    return { bins: [{ id: 'basket', emoji: '🧺', labelZh: '篮子', labelEn: 'Basket' }, { id: 'box', emoji: '📦', labelZh: '箱子', labelEn: 'Box' }], items: shuffle(items),
      hintZh: '如果是水果，就放进篮子；如果是玩具，就放进箱子', hintEn: 'If it is fruit, put it in the basket; if it is a toy, put it in the box' };
  }
  function actMatchColor(n) { // same colour goes together
    var cs = shuffle(Object.keys(COLOR_THINGS)).slice(0, n), nm = { red: ['红色', 'Red'], yellow: ['黄色', 'Yellow'], green: ['绿色', 'Green'], blue: ['蓝色', 'Blue'] };
    return { seqMode: true, compareKey: 'signature',
      leftItems: shuffle(cs.map(function (c, i) { return { id: 'L' + i, emoji: DOTS[c], signature: c, nameZh: nm[c][0], nameEn: nm[c][1] }; })),
      rightSlots: shuffle(cs.map(function (c, i) { var x = pick(COLOR_THINGS[c]); return { id: 'R' + i, emoji: x[0], signature: c, nameZh: x[1], nameEn: x[2] }; })),
      instrZh: '把圆点拖到颜色一样的东西上 →', instrEn: 'Drag each dot onto the thing of the same colour →' };
  }
  function actMatchKind(n) { // same kind goes together
    var ks = shuffle(Object.keys(KINDS)).slice(0, n);
    return { seqMode: true, compareKey: 'signature',
      leftItems: shuffle(ks.map(function (k, i) { var x = pick(KINDS[k]); return { id: 'L' + i, emoji: x[0], signature: k, nameZh: x[1], nameEn: x[2] }; })),
      rightSlots: shuffle(ks.map(function (k, i) { return { id: 'R' + i, emoji: { fruit: '🧺', vehicle: '🛣️', animal: '🌳', toy: '🧸' }[k], signature: k, nameZh: KIND_NAME[k][0], nameEn: KIND_NAME[k][1] }; })),
      instrZh: '把东西拖到它们所属的那一类上 →', instrEn: 'Drag each thing onto the group it belongs to →' };
  }

  // ── makers & themed units ─────────────────────────────────────────────────
  var MAKERS = {
    oddOne: oddOne, simpleMatch: simpleMatch, simpleCond: simpleCond, elimDoor1: elimDoor1, truthCount: truthCount, truthAll: truthAll,
    andCond: andCond, notCond: notCond, orCond: orCond, notNot: notNot, multiCond: multiCond,
    elimHouse: elimHouse, matchClues: matchClues, orderK2: orderK2, orderPeople3: orderPeople3, orderPeople4: orderPeople4, orderUnknown: orderUnknown,
    clueDistract: clueDistract, clueRedundant: clueRedundant, condSelect: condSelect, ifThen: ifThen, causeResult: causeResult, allRule: allRule, bag: bag, constraintPuzzle: constraintPuzzle
  };

  var GRADE_UNITS = {
    K1: [
      { key: 'odd', icon: '🧩', zh: '找不同类', en: 'Odd One Out', dzh: '三个是一类，哪一个不是？', den: 'Three belong together. Which does not?',
        slots: ['oddOne', 'oddOne', 'oddOne', 'oddOne', 'oddOne', 'oddOne', 'oddOne', 'oddOne', 'oddOne', 'oddOne'] },
      { key: 'match', icon: '🔗', zh: '找出规则', en: 'Find the Rule', dzh: '看两行例子，发现它们相同的地方，再用到新的一行。', den: 'Look at two example rows, find what they share, and use it on a new row.',
        slots: ['simpleMatch', 'simpleMatch', 'simpleMatch', 'simpleMatch', 'simpleMatch', 'simpleMatch', 'simpleMatch', 'simpleMatch', 'simpleMatch', 'simpleMatch'] },
      { key: 'rule', icon: '📦', zh: '照规则做', en: 'Follow the Rule', dzh: '红的放红盒子；它不在这个门里。', den: 'Red goes in the red box; it is not behind this door.',
        slots: ['simpleCond', 'elimDoor1', 'simpleCond', 'elimDoor1', 'simpleCond', 'elimDoor1', 'simpleCond', 'elimDoor1', 'simpleCond', 'elimDoor1'] },
      { key: 'truth', icon: '✅', zh: '对不对', en: 'Right or Wrong', dzh: '数一数，看一看，这句话对吗？', den: 'Count and look. Is the sentence right?',
        slots: ['truthCount', 'truthCount', 'truthCount', 'truthCount', 'truthCount', 'truthCount', 'truthCount', 'truthCount', 'truthCount', 'truthCount'] }
    ],
    K2: [
      { key: 'attr', icon: '🎨', zh: '两个条件', en: 'Two Conditions', dzh: '红色而且是圆形的；不是蓝色的方形。', den: 'Red AND a circle; a square that is not blue.',
        slots: ['andCond', 'notCond', 'andCond', 'notCond', 'andCond', 'notCond', 'andCond', 'notCond', 'andCond', 'notCond'] },
      { key: 'elim', icon: '🏠', zh: '谁住哪里', en: 'Who Lives Where', dzh: '一个一个排除，剩下的就是答案。', den: 'Rule them out one by one; what is left is the answer.',
        slots: ['elimHouse', 'elimHouse', 'elimHouse', 'elimHouse', 'elimHouse', 'elimHouse', 'elimHouse', 'elimHouse', 'elimHouse', 'elimHouse'] },
      { key: 'order', icon: '📏', zh: '比大小排队', en: 'Line Up by Size', dzh: '老鼠比小猫小，小猫比小狗小……谁最大？', den: 'The mouse is smaller than the cat, the cat than the dog… who is biggest?',
        slots: ['orderK2', 'orderK2', 'orderK2', 'orderK2', 'orderK2', 'orderK2', 'orderK2', 'orderK2', 'orderK2', 'orderK2'] },
      { key: 'cond', icon: '🧺', zh: '如果…就…', en: 'If… Then…', dzh: '如果是水果放篮子；谁喜欢什么？', den: 'If fruit, into the basket; who likes what?',
        slots: ['condSelect', 'matchClues', 'condSelect', 'truthAll', 'condSelect', 'matchClues', 'condSelect', 'truthAll', 'matchClues', 'truthAll'] }
    ],
    G1: [
      { key: 'ifthen', icon: '☔', zh: '如果…那么…', en: 'If… Then…', dzh: '如果下雨就带伞，今天下雨了，会怎样？', den: 'If it rains, take an umbrella. It rains. What happens?',
        slots: ['ifThen', 'ifThen', 'causeResult', 'ifThen', 'allRule', 'ifThen', 'causeResult', 'allRule', 'ifThen', 'causeResult'] },
      { key: 'logic', icon: '🎛️', zh: '并且·或者·不是', en: 'And, Or, Not', dzh: '红色并且圆；红色或者蓝色；既不是…也不是…', den: 'Red and round; red or blue; neither… nor…',
        slots: ['andCond', 'orCond', 'notCond', 'notNot', 'orCond', 'andCond', 'notNot', 'notCond', 'orCond', 'notNot'] },
      { key: 'order', icon: '📏', zh: '排队与比较', en: 'Order from Clues', dzh: '谁在前面，谁最高，谁最快？', den: 'Who is ahead, who is tallest, who is fastest?',
        slots: ['orderPeople3', 'orderPeople3', 'orderPeople3', 'orderPeople3', 'orderPeople3', 'orderPeople3', 'orderPeople3', 'orderPeople3', 'orderPeople3', 'orderPeople3'] },
      { key: 'puzzle', icon: '🧮', zh: '线索小谜题', en: 'Clue Puzzles', dzh: '三个对象，三条线索，一个一个排除。', den: 'Three objects, three clues, rule them out one by one.',
        slots: ['elimHouse', 'matchClues', 'elimHouse', 'matchClues', 'elimHouse', 'matchClues', 'elimHouse', 'clueDistract', 'elimHouse', 'clueDistract'] },
      { key: 'check', icon: '🎲', zh: '一定·可能·不可能', en: 'Certain, Possible, Impossible', dzh: '袋子里有这些球，会拿到…吗？', den: 'The bag holds these balls. Will you get…?',
        slots: ['bag', 'truthAll', 'bag', 'bag', 'truthAll', 'bag', 'truthAll', 'bag', 'bag', 'truthAll'] }
    ],
    G2: [
      { key: 'chain', icon: '🔗', zh: '长一点的顺序', en: 'Longer Chains', dzh: '四个对象，三条线索，第几个是谁？', den: 'Four objects, three clues — who is number what?',
        slots: ['orderPeople4', 'orderPeople4', 'orderPeople4', 'orderPeople4', 'orderPeople4', 'orderPeople4', 'orderPeople4', 'orderPeople4', 'orderPeople4', 'orderPeople4'] },
      { key: 'grid', icon: '🧮', zh: '逻辑表', en: 'Logic Grid', dzh: '四个人，四样东西，一一对应。', den: 'Four people, four things, one each.',
        slots: ['matchClues', 'matchClues', 'elimHouse', 'matchClues', 'matchClues', 'elimHouse', 'matchClues', 'matchClues', 'elimHouse', 'matchClues'] },
      { key: 'multi', icon: '🎛️', zh: '多个条件', en: 'Many Conditions', dzh: '是蓝色，不是圆形，也不是方形…', den: 'Blue, not a circle, not a square…',
        slots: ['multiCond', 'notNot', 'multiCond', 'orCond', 'multiCond', 'notNot', 'multiCond', 'andCond', 'multiCond', 'notNot'] },
      { key: 'constraint', icon: '🧩', zh: '格子里的约束', en: 'Square Constraints', dzh: '猫不在第一格，狗在猫的左边……', den: 'The cat is not first, the dog is left of the cat…',
        slots: ['constraintPuzzle', 'constraintPuzzle', 'constraintPuzzle', 'constraintPuzzle', 'constraintPuzzle', 'constraintPuzzle', 'constraintPuzzle', 'constraintPuzzle', 'constraintPuzzle', 'constraintPuzzle'] },
      { key: 'extra', icon: '🗑️', zh: '多余的线索', en: 'Extra Clues', dzh: '有的线索用不上：不相干的话、重复的话。', den: 'Some clues are not needed: unrelated remarks, repeated facts.',
        slots: ['clueDistract', 'clueRedundant', 'clueDistract', 'clueRedundant', 'clueDistract', 'clueRedundant', 'clueDistract', 'clueRedundant', 'clueDistract', 'clueRedundant'] },
      { key: 'unknown', icon: '❓', zh: '信息够不够', en: 'Is It Enough?', dzh: '线索不够时不能猜：一定、不一定、无法确定。', den: 'When the clues are not enough, do not guess.',
        slots: ['orderUnknown', 'ifThen', 'allRule', 'orderUnknown', 'ifThen', 'allRule', 'orderUnknown', 'ifThen', 'allRule', 'orderUnknown'] },
      { key: 'certain', icon: '🎲', zh: '一定·可能·不可能', en: 'Certain, Possible, Impossible', dzh: '拿一次，还是连续拿两次？', den: 'Take once, or twice in a row?',
        slots: ['bag', 'bag', 'bag', 'bag', 'bag', 'bag', 'bag', 'bag', 'bag', 'bag'] }
    ]
  };

  // each session: easy -> hard is encoded in the slot order; generate() just fills it
  function generate(grade, count, unitKey) {
    var units = GRADE_UNITS[grade] || GRADE_UNITS.K1;
    var u = units.filter(function (x) { return x.key === unitKey; })[0] || units[0];
    var out = [];
    for (var i = 0; i < count; i++) {
      var q = MAKERS[u.slots[i % u.slots.length]](grade);
      q.grade = grade;
      out.push(q);
    }
    return out;
  }

  return { generate: generate, GRADE_UNITS: GRADE_UNITS, MAKERS: MAKERS,
    ACT: { order: actOrder, constraint: actConstraint, grid: actGrid, groupColors: actGroupColors, groupIf: actGroupIf, matchColor: actMatchColor, matchKind: actMatchKind } };
})();
