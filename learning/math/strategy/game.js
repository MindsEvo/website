/**
 * Math Strategy — Game Logic  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * Learning Foundation · Math Thinking · Strategy 策略
 *
 * Same shell approach as Logic module:
 *   - CSS injected to make text readable inside s1-seq
 *   - renderSequence: displays premiseZh/En + questionZh/En
 *   - renderOption: bilingual labels (options = Chinese keys,
 *                   optionsEn = English display)
 *   - checkAnswer: exact string match against options
 *
 * gameId: 'learning-math-strategy' — stats fully independent.
 * Theme: orange-red — distinct visual identity.
 *
 * Depends on: shell.js, generator.js (ST_GEN)
 */

// Radar contract: LEVEL_GRADE, STRATEGY_TYPE_OF and the `base` table inside
// difficultyAxisFor() are read as literal text by metadata/validate.js against
// metadata/metathinking/strategy.json. Keep them flat, literal declarations.
var MODULE_ID = 'strategy';
var MODULE_TYPE = 'metathinking';
var SOURCE_GAME_ID = 'learning-math-strategy';
var SESSION_SIZE = 8;

var LEVEL_GRADE = { L1: 'K1', L2: 'K2', L3: 'G1', L4: 'G2' };
var LEVEL_KEY = { L1: 'K1', L2: 'K2', L3: 'G1', L4: 'G2' };

// unit.id -> levelId. Generated units: '<levelId>-<key>' (generator.js).
// Ids '1'..'6' / 'sequence-1' are the old static units, still served for K2-G2
// until their generated worlds replace them.
var UNIT_LEVEL = {
  'L1-near': 'L1', 'L1-trap': 'L1', 'L1-mix': 'L1',
  'L2-order': 'L2', 'L2-via': 'L2', 'L2-limit': 'L2', 'L2-tap': 'L2',
  'L3-budget': 'L3', 'L3-energy': 'L3', 'L3-keydoor': 'L3', 'L3-basket': 'L3', 'L3-judge': 'L3',
  'L4-nim': 'L4', 'L4-ops': 'L4', 'L4-buy': 'L4', 'L4-power': 'L4', 'L4-press': 'L4', 'L4-cookie': 'L4', 'L4-judge': 'L4'
};

// question.kind -> strategy.json typeTree id.
var STRATEGY_TYPE_OF = {
  near: 'path_planning', trap: 'path_planning', mix: 'path_planning', via: 'path_planning',
  order: 'sequencing', limit: 'constraint_strategy',
  budget: 'resource_allocation', energy: 'constraint_strategy', keydoor: 'sequencing',
  ordertap: 'sequencing', basket: 'resource_allocation', press: 'look_ahead', cookie: 'action_choice',
  judgebuy: 'resource_allocation', judgenim: 'action_choice',
  nim: 'action_choice', ops: 'look_ahead', buy: 'resource_allocation', power: 'adaptation_optimization'
};

function difficultyAxisFor(levelId) {
  var base = {
    L1: { goal_count: 'single', option_count: 'few', step_depth: 'short', constraint_count: 'none',
          state_change: 'none', language_complexity: 'picture' },
    L2: { goal_count: 'single', option_count: 'few', step_depth: 'medium', constraint_count: 'one',
          state_change: 'none', language_complexity: 'picture' },
    L3: { goal_count: 'single', option_count: 'several', step_depth: 'medium', constraint_count: 'one',
          state_change: 'none', language_complexity: 'sentence' },
    L4: { goal_count: 'multi', option_count: 'several', step_depth: 'long', constraint_count: 'multi',
          state_change: 'changing', language_complexity: 'sentence' }
  };
  return base[levelId] || null;
}

function bolt(s) { return String(s).replace(/⚡/g, '<span class="bolt"></span>'); }
function bi(zh, en) { return '<span class="zh">' + bolt(zh) + '</span><span class="en">' + bolt(en) + '</span>'; }

// Option buttons: text/emoji strings from generator.js, left-aligned and compact.
(function () {
  var s = document.createElement('style');
  s.textContent = '.st-seq{padding:14px 12px !important;letter-spacing:0 !important;text-align:center !important;}' +
    '.s1-opt{font-size:14px !important;min-height:48px !important;padding:10px 14px !important;line-height:1.5 !important;}';
  document.head.appendChild(s);
}());

// ── Grade level selector ───────────────────────────────────────────────────
// Mirrors logic's own K/G grade chooser: the child picks a grade card
// before ever seeing a unit, instead of one flat list.

var GRADE_LEVELS = [
  { id: 'L1', badge: 'K1', nameZh: '幼儿园小/中班', nameEn: 'Pre-K',        descZh: '4–5岁 · 目标选择',   descEn: 'Age 4–5 · Goal choice' },
  { id: 'L2', badge: 'K2', nameZh: '幼儿园大班',    nameEn: 'Kindergarten', descZh: '5–6岁 · 行动顺序',   descEn: 'Age 5–6 · Action sequencing' },
  { id: 'L3', badge: 'G1', nameZh: '小学一年级',    nameEn: 'Grade 1',      descZh: '6–7岁 · 步骤与分配', descEn: 'Age 6–7 · Planning & allocation' },
  { id: 'L4', badge: 'G2', nameZh: '小学二年级',    nameEn: 'Grade 2',      descZh: '7–8岁 · 预测与博弈', descEn: 'Age 7–8 · Prediction & game strategy' }
];

var _units = {};
function _unitsForLevel(levelId) {
  var out = [];
  (ST_GEN.GRADE_UNITS[LEVEL_KEY[levelId]] || []).forEach(function (d) {
    var id = levelId + '-' + d.key;
    var u = { id: id, icon: d.icon, gradeCode: LEVEL_GRADE[levelId], nameZh: d.zh, nameEn: d.en, descZh: d.dzh, descEn: d.den,
      questions: ST_GEN.generate(LEVEL_KEY[levelId], SESSION_SIZE, d.key) };
    _units[id] = u; out.push(u);
  });
  return out;
}
// getReportContext runs right after the result screen is built: refill on the next tick.
function refillUnit(unitId) {
  setTimeout(function () {
    var u = _units[unitId];
    if (u) u.questions = ST_GEN.generate(LEVEL_KEY[UNIT_LEVEL[unitId]], SESSION_SIZE, unitId.split('-')[1]);
  }, 0);
}
function _dominantOf(qs, pick) {
  var t = {}, best = null, n = 0;
  qs.forEach(function (q) { var v = pick(q); if (!v) return; t[v] = (t[v] || 0) + 1; if (t[v] > n) { n = t[v]; best = v; } });
  return best;
}

// ── Strategy boards (generator.js maps) ──────────────────────────────────────
var ROUTE_COLOR = ['#2563eb', '#16a34a', '#7c3aed'];
(function () {
  var s = document.createElement('style');
  s.textContent = [
    '.st-wrap{display:grid;gap:10px;justify-items:center;width:100%;}',
    '.st-q{font-size:17px;font-weight:900;color:#9a3412;text-align:center;line-height:1.45;max-width:340px;letter-spacing:0;}',
    '.st-map{background:#fff;border:2px solid #fed7aa;border-radius:14px;max-width:100%;height:auto;}',
    '.st-places{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}',
    '.st-place{display:flex;flex-direction:column;align-items:center;min-width:76px;padding:6px 8px;background:#fff;border:2px solid #fed7aa;border-radius:12px;font-size:13px;font-weight:800;color:#475569;}',
    '.st-place .e{font-size:34px;line-height:1.2;}',
    '.st-rules{display:grid;gap:6px;width:min(340px,100%);}',
    '.st-rule{display:flex;gap:8px;align-items:flex-start;background:#fff7ed;border:2px solid #fed7aa;border-radius:12px;padding:7px 10px;font-size:15px;font-weight:800;color:#1e293b;line-height:1.45;}',
    '.st-rule b{flex:0 0 auto;width:22px;height:22px;border-radius:50%;background:#ea580c;color:#fff;font-size:12px;line-height:22px;text-align:center;}',
    '.st-legend{font-size:13px;font-weight:800;color:#9a3412;background:#fff7ed;border-radius:999px;padding:3px 12px;}',
    '.st-big{font-size:34px;font-weight:900;color:#9a3412;background:#fff;border:2px solid #fed7aa;border-radius:14px;padding:6px 20px;}',
    '.st-calc{display:flex;gap:10px;align-items:center;font-size:22px;font-weight:900;color:#9a3412;}',
    '.st-calc b{background:#fff;border:2px solid #fed7aa;border-radius:12px;padding:4px 14px;font-size:28px;}',
    '.st-place b{font-size:20px;color:#9a3412;}',
    '.st-tap{cursor:pointer;touch-action:manipulation;font-family:inherit;position:relative;}',
    '.st-tap.on{background:#dbeafe;border-color:#3b82f6;}',
    '.st-tap i{position:absolute;top:-8px;right:-8px;width:22px;height:22px;border-radius:50%;background:#ea580c;color:#fff;font-size:12px;font-style:normal;line-height:22px;}',
    '.st-key b{font-size:22px;}',
    '.st-msg{min-height:22px;font-size:14px;font-weight:800;color:#9a3412;text-align:center;}',
    '.bolt{display:inline-block;width:1em;height:1em;vertical-align:-0.14em;background:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M13.5 1 4 13.5h6.2L8.8 23 20 9.6h-6.6z\' fill=\'%23dc2626\' stroke=\'%23991b1b\' stroke-width=\'1\' stroke-linejoin=\'round\'/%3E%3C/svg%3E") center/contain no-repeat;}',
    '.st-opt{font-size:19px;font-weight:900;text-align:center;display:block;}'
  ].join('');
  document.head.appendChild(s);
}());

// Three routes fan out between the start and the goal. K1: every dot is one stone = one step.
// K2 ('numbers'): a number on each stretch says how many steps it takes.
function _hops(r) { return r.w ? r.w.length : r.n + 1; }
function _txt(x, y, size, body, extra) {
  return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" text-anchor="middle" dominant-baseline="central" ' + (extra || '') + '>' + body + '</text>';
}

function _mapSvg(q) {
  var m = q.map, th = q.theme, v = m.vertical, W = v ? 250 : 320, H = v ? 320 : 250, L = 260, mid = 125;
  var AMP = [-78, 0, 78];
  function P(t, amp) { var along = 30 + L * t, across = mid + amp; return v ? [across, along] : [along, across]; }
  var svg = '<svg class="st-map" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">';
  m.routes.forEach(function (r, i) {
    var col = ROUTE_COLOR[i], hops = _hops(r), pts = [], dots = '', nums = '', k, j, p;
    for (k = 0; k <= 16; k++) { p = P(k / 16, AMP[i] * Math.sin(Math.PI * k / 16)); pts.push(p[0].toFixed(1) + ',' + p[1].toFixed(1)); }
    for (j = 1; j < hops; j++) {
      p = P(j / hops, AMP[i] * Math.sin(Math.PI * j / hops));
      if (r.trap === j) dots += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="16" fill="#fee2e2" stroke="#ef4444" stroke-width="3"/>' + _txt(p[0], p[1], 20, m.trapIcon[0]);
      else if (r.item === j) dots += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="16" fill="#dcfce7" stroke="#16a34a" stroke-width="3"/>' + _txt(p[0], p[1], 20, m.item[0]);
      else dots += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (m.numbers ? 5 : 9) + '" fill="#fff" stroke="' + col + '" stroke-width="3"/>';
    }
    if (m.numbers) for (j = 1; j <= hops; j++) {
      var t = (j - 0.5) / hops; p = P(t, AMP[i] * Math.sin(Math.PI * t));
      nums += _txt(p[0], p[1], 17, r.w[j - 1], 'font-weight="900" fill="' + col + '" stroke="#fff" stroke-width="5" paint-order="stroke"');
    }
    var lab = P(0.5, AMP[i] + (AMP[i] > 0 ? 28 : -28));
    svg += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + col + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>' + dots + nums +
      '<circle cx="' + lab[0] + '" cy="' + lab[1] + '" r="12" fill="' + col + '"/>' + _txt(lab[0], lab[1], 14, 'ABC'.charAt(i), 'font-weight="900" fill="#fff"');
  });
  var s0 = P(0, 0), s1 = P(1, 0);
  return svg + _txt(s0[0], s0[1], 32, th[0]) + _txt(s1[0], s1[1], 32, th[3]) + '</svg>';
}

// Small route graphs (K2 pick-up, G1 key and door): numbers on the lines are steps.
function _graphSvg(N, E, nodes) {
  var svg = '<svg class="st-map" viewBox="0 0 320 250" width="320" height="250">', lines = '', nums = '';
  E.forEach(function (e) {
    var a = N[e[0]], b = N[e[1]], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    lines += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>';
    nums += _txt(mx, my, 18, e[2], 'font-weight="900" fill="#9a3412" stroke="#fff" stroke-width="5" paint-order="stroke"');
  });
  var ns = '';
  nodes.forEach(function (n) { ns += '<circle cx="' + N[n[0]][0] + '" cy="' + N[n[0]][1] + '" r="22" fill="#fff" stroke="' + n[2] + '" stroke-width="3"/>' + _txt(N[n[0]][0], N[n[0]][1], 26, n[1]); });
  return svg + lines + nums + ns + '</svg>';
}
function _viaSvg(q) {
  var g = q.graph, th = q.theme, it = q.items;
  return _graphSvg({ S: [38, 125], A: [160, 48], B: [160, 202], G: [282, 125] },
    [['S', 'A', g.sa], ['S', 'B', g.sb], ['A', 'B', g.ab], ['A', 'G', g.ag], ['B', 'G', g.bg]],
    [['S', th[0], '#94a3b8'], ['A', it[0][0], '#16a34a'], ['B', it[1][0], '#16a34a'], ['G', th[3], '#94a3b8']]);
}
function _keySvg(q) {
  var g = q.graph, th = q.theme;
  return _graphSvg({ S: [38, 125], K: [160, 48], D: [160, 202], G: [282, 125] },
    [['S', 'K', g.sk], ['S', 'D', g.sd], ['K', 'D', g.kd], ['D', 'G', g.dg]],
    [['S', th[0], '#94a3b8'], ['K', '🔑', '#16a34a'], ['D', '🚪', '#ef4444'], ['G', th[3], '#94a3b8']]);
}

function _nm(p, zh) { return zh ? p[1] + '（' + p[0] + '）' : p[2] + ' (' + p[0] + ')'; }
function _ruleText(q, r, zh) {
  var a = _nm(q.places[r.a], zh), b = r.b === undefined ? '' : _nm(q.places[r.b], zh);
  if (r.t === 'before') return zh ? a + '要在' + b + '之前去' : a + ' comes before ' + b;
  return zh ? a + (r.t === 'first' ? '第一个去' : '最后去') : a + (r.t === 'first' ? ' is first' : ' is last');
}

function _sceneText(q) {
  var th = q.theme, tr = q.map && q.map.trapIcon, hd = th[1] + '（' + th[0] + '）', he = th[2] + ' (' + th[0] + ')';
  var gz = th[4] + '（' + th[3] + '）', ge = th[5] + ' (' + th[3] + ')';
  if (q.kind === 'order') return {
    zh: hd + '要把三个地方各去一次。规则：' + q.rules.map(function (r) { return _ruleText(q, r, true); }).join('；') + '。该怎么走？',
    en: he + ' must visit three places, once each. Rules: ' + q.rules.map(function (r) { return _ruleText(q, r, false); }).join('; ') + '. Which order?' };
  if (q.kind === 'via') return {
    zh: hd + '要把' + _nm(q.items[0], true) + '和' + _nm(q.items[1], true) + '都拿到（少一样不行），再走到' + gz + '。线上的数字是这一段要走几步。哪种走法加起来总步数最少？',
    en: he + ' must pick up both ' + _nm(q.items[0], false) + ' and ' + _nm(q.items[1], false) + ' (missing one is not allowed), then reach ' + ge + '. The number on each line is the steps for that stretch. Which way takes the fewest steps added up?' };
  if (q.kind === 'ordertap') return {
    zh: hd + '要把三个地方各去一次。规则：' + q.rules.map(function (r) { return _ruleText(q, r, true); }).join('；') + '。按去的先后，一个一个点出来。',
    en: he + ' must visit three places, once each. Rules: ' + q.rules.map(function (r) { return _ruleText(q, r, false); }).join('; ') + '. Tap the places in the order of the visit.' };
  if (q.kind === 'basket') return {
    zh: hd + '有 ' + q.coins + ' 个金币（🪙）。点一点想买的东西放进篮子，总价不能超过 ' + q.coins + '，要尽量花得多，然后按「买好了」。',
    en: he + ' has ' + q.coins + ' coins (🪙). Tap things to put them in the basket. The total must not go over ' + q.coins + ', and should be as much as possible. Then press Done.' };
  if (q.kind === 'press') return {
    zh: '自己按按钮：从 ' + q.start + ' 开始，变成 ' + q.target + '。按的次数越少越好。',
    en: 'Press the buttons yourself: start at ' + q.start + ' and reach ' + q.target + '. The fewer presses, the better.' };
  if (q.kind === 'cookie') return {
    zh: hd + '和电脑玩取饼干（🍪）：共 ' + q.total + ' 块，轮流拿 1 到 ' + q.max + ' 块，谁拿走最后一块谁赢。先选谁先拿，电脑很聪明。卡住了可以点「提示」。',
    en: he + ' plays the cookie game (🍪) against the computer: ' + q.total + ' cookies, take 1 to ' + q.max + ' in turn, and whoever takes the last one wins. First choose who goes first; the computer is clever. Press Hint if you are stuck.' };
  if (q.kind === 'judgebuy') return {
    zh: hd + '有 ' + q.coins + ' 个金币（🪙），他说：「我买 ' + q.said + '，一共 ' + q.sum + ' 个金币，这样买最好（不超过金币，又花得最多）。」他说得对吗？',
    en: he + ' has ' + q.coins + ' coins (🪙) and says: "I buy ' + q.said + ', ' + q.sum + ' coins in total. This is the best buy (not over the coins, and spending the most)." Is that right?' };
  if (q.kind === 'judgenim') return {
    zh: hd + '和对手玩取饼干（🍪）：共 ' + q.total + ' 块，轮流拿 1 到 ' + q.max + ' 块，拿走最后一块的赢。' + th[1] + '先拿 ' + q.first + ' 块，对手之后每次都拿得最好。' + th[1] + '会怎样？',
    en: he + ' plays the cookie game (🍪): ' + q.total + ' cookies, take 1 to ' + q.max + ' in turn, and taking the last one wins. ' + th[2] + ' takes ' + q.first + ' first, and the rival then always plays its best. What happens?' };
  if (q.kind === 'nim') return {
    zh: hd + '和对手玩取饼干（🍪）：桌上有 ' + q.total + ' 块，两人轮流拿，每次拿 1 到 ' + q.max + ' 块，谁拿走最后一块谁赢。' + th[1] + '先拿，拿几块才能保证赢？',
    en: he + ' plays the cookie game (🍪) against a rival: ' + q.total + ' cookies, players take turns taking 1 to ' + q.max + ', and whoever takes the last cookie wins. ' + th[2] + ' goes first. How many should be taken to be sure of winning?' };
  if (q.kind === 'ops') return {
    zh: '数字机器有两个按钮：' + q.buttons.join('、') + '。从 ' + q.start + ' 开始，要变成 ' + q.target + '，按的次数越少越好。选哪种按法？',
    en: 'A number machine has two buttons: ' + q.buttons.join(', ') + '. Start at ' + q.start + ' and reach ' + q.target + ' with as few presses as possible. Which presses?' };
  if (q.kind === 'buy') return {
    zh: hd + '有 ' + q.coins + ' 个金币（🪙），每种东西都要买，至少各买 1 个，总价不能超过 ' + q.coins + ' 个金币，还要让买到的个数最多。怎么买？',
    en: he + ' has ' + q.coins + ' coins (🪙) and must buy at least one of each kind, spending no more than ' + q.coins + ' coins, and wants as many items as possible. How should ' + th[2] + ' buy?' };
  if (q.kind === 'power') return {
    zh: hd + '一开始有 ' + q.start + ' 点能量（⚡），最多只能存 ' + q.cap + ' 点，多出来的会浪费。走路（🥾）用掉能量，电池（🔋）补充能量，能量不能少于 0。哪种顺序走完后剩下的能量最多？',
    en: he + ' starts with ' + q.start + ' energy (⚡) and can store at most ' + q.cap + '; any extra is wasted. Walking (🥾) uses energy, batteries (🔋) add energy, and it can never drop below 0. Which order leaves the most energy at the end?' };
  if (q.kind === 'budget') return {
    zh: hd + '有 ' + q.coins + ' 个金币（🪙），想买 2 样东西。两样加起来的价钱不能超过 ' + q.coins + ' 个金币，还要尽量花得多。买哪两样？',
    en: he + ' has ' + q.coins + ' coins (🪙) and wants to buy 2 things. The two prices added up must not go over ' + q.coins + ' coins, and the spending should be as much as possible. Which two?' };
  if (q.kind === 'energy') return {
    zh: hd + '一开始有 ' + q.start + ' 点能量（⚡）。走一段路（🥾）要用掉能量，电池（🔋）能补充能量。能量不能少于 0。这些路段该按什么顺序走？',
    en: he + ' starts with ' + q.start + ' energy (⚡). Each stretch (🥾) uses energy and a battery (🔋) adds some. Energy can never go below 0. In which order should the stretches be taken?' };
  if (q.kind === 'keydoor') return {
    zh: hd + '要走到' + gz + '那里，必须打开门（🚪）。门要先拿到钥匙（🔑）才能打开。线上的数字是这一段要走几步。哪条路能走通、步数又最少？',
    en: he + ' wants to reach ' + ge + ', and must open the door (🚪). The door opens only after you have the key (🔑). The number on each line is the steps for that stretch. Which route works and takes the fewest steps?' };
  if (q.kind === 'limit') return {
    zh: hd + '要走到' + gz + '，路上要拿到' + _nm(q.map.item, true) + '，而且总共最多只能走 ' + q.map.cap + ' 步。路上的数字是这一段要走几步，把它们加起来。选哪条路？',
    en: he + ' wants to reach ' + ge + ', pick up ' + _nm(q.map.item, false) + ' on the way, and take at most ' + q.map.cap + ' steps in total. The number on each stretch is its steps — add them up. Which route?' };
  var tz = hd + '要走到' + gz + '那里。每个圆点是一块垫脚石，踩一块走一步。';
  var te = he + ' wants to reach ' + ge + '. Each dot is a stone — one stone, one step. ';
  if (q.kind === 'near') return { zh: tz + '哪条路踩的石头最少？', en: te + 'Which route has the fewest stones?' };
  return { zh: tz + '有' + tr[1] + '（' + tr[0] + '）的路过不去。选一条走得通、石头又最少的路。', en: te + 'A route with ' + tr[2] + ' (' + tr[0] + ') cannot be passed. Pick the route that works and has the fewest stones.' };
}

function _speakable(t) { return String(t).replace(/（[^）]*）/g, '').replace(/ \([^)]*\)/g, ''); }

function _renderStrategy(q, container) {
  container.classList.add('st-seq');
  var sc = _sceneText(q), body;
  if (q.interactive) {
    body = '<div id="st-host"></div>';
  } else if (q.kind === 'order') {
    body = '<div class="st-places">' + q.shown.map(function (i) {
      return '<div class="st-place"><span class="e">' + q.places[i][0] + '</span>' + bi(q.places[i][1], q.places[i][2].replace(/^the /, '')) + '</div>';
    }).join('') + '</div><div class="st-rules">' + q.rules.map(function (r, i) {
      return '<div class="st-rule"><b>' + (i + 1) + '</b><span>' + bi(_ruleText(q, r, true), _ruleText(q, r, false)) + '</span></div>';
    }).join('') + '</div>';
    sc = { zh: '🧭 按规则，该怎么走？', en: '🧭 Which order follows the rules?' };
    var th = q.theme;
    body = '<div class="st-q">' + bi(th[1] + '（' + th[0] + '）要把三个地方各去一次。', th[2] + ' (' + th[0] + ') must visit three places, once each.') + '</div>' + body;
  } else if (q.kind === 'judgenim') {
    body = '<div class="st-big">🍪 × ' + q.total + '</div><div class="st-legend">' + bi('先拿 ' + q.first + ' 块，剩 ' + (q.total - q.first) + ' 块', 'Takes ' + q.first + ' first, ' + (q.total - q.first) + ' left') + '</div>';
  } else if (q.kind === 'judgebuy') {
    body = _shelfHtml(q) + '<div class="st-big">' + q.said + '</div>';
  } else if (q.interactive) {
    body = '<div id="st-host"></div>';
  } else if (q.kind === 'nim') {
    body = '<div class="st-big">🍪 × ' + q.total + '</div><div class="st-legend">' + bi('每次拿 1 到 ' + q.max + ' 块　拿走最后一块的赢', 'Take 1 to ' + q.max + ' each turn · taking the last one wins') + '</div>';
  } else if (q.kind === 'ops') {
    body = '<div class="st-calc"><b>' + q.start + '</b><span>→ ? →</span><b>' + q.target + '</b></div><div class="st-places">' + q.buttons.map(function (b) { return '<div class="st-place"><b>' + b + '</b></div>'; }).join('') + '</div>';
  } else if (q.kind === 'power') {
    body = '<div class="st-legend">' + bi('⚡ 开始：' + q.start + '　最多存 ' + q.cap + '　🥾 − 用掉　🔋 + 补充', '⚡ Start: ' + q.start + ' · Max ' + q.cap + ' · 🥾 − uses · 🔋 + adds') + '</div>';
  } else if (q.kind === 'budget' || q.kind === 'buy') {
    body = _shelfHtml(q);
  } else if (q.kind === 'energy') {
    body = '<div class="st-legend">' + bi('⚡ 开始：' + q.start + '　🥾 − 用掉　🔋 + 补充', '⚡ Start: ' + q.start + '　🥾 − uses　🔋 + adds') + '</div>';
  } else body = _mapOf(q);
  container.innerHTML = '<div class="st-wrap">' + (q.kind === 'order' ? body + '<div class="st-q">' + bi(sc.zh, sc.en) + '</div>'
    : '<div class="st-q">' + bi(sc.zh, sc.en) + '</div>' + body) + '</div>';
  if (q.interactive) {
    q.result = null;
    _playHost = container.querySelector('#st-host');
    PLAYERS[q.kind](q, _playHost);
    setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) b.style.display = 'none'; }, 0);
  }
}
var _playHost = null;
function _shelfHtml(q) {
  return '<div class="st-places">' + q.icons.map(function (e, i) {
    return '<div class="st-place"><span class="e">' + e + '</span><b>🪙 ' + q.prices[i] + '</b></div>';
  }).join('') + '</div>';
}

// ── Playable boards (the child acts; finishing passes, the number of tries sets the tier) ──
var _play = null;
function _finish(q, r) {
  q.result = r;
  setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) b.click(); }, 700);
}
function _say(host, zh, en) {
  var n = host.querySelector('.st-msg'); if (!n) return;
  n.innerHTML = bi(zh, en);
  n.querySelectorAll('.zh').forEach(function (x) { x.style.display = shell.lang === 'zh' ? '' : 'none'; });
  n.querySelectorAll('.en').forEach(function (x) { x.style.display = shell.lang === 'en' ? '' : 'none'; });
}
function _tier(extra) { return ST_GEN.ENGINE.tierOf(extra, 0); }

function _playOrderTap(q, host) {
  var tapped = [], resets = 0, done = false;
  function holds(r, perm) {
    var pos = {}; perm.forEach(function (p, i) { pos[p] = i; });
    return r.t === 'before' ? pos[r.a] < pos[r.b] : r.t === 'first' ? pos[r.a] === 0 : pos[r.a] === 2;
  }
  function draw() {
    host.innerHTML = '<div class="st-places">' + q.shown.map(function (i) {
      var k = tapped.indexOf(i);
      return '<button class="st-place st-tap' + (k >= 0 ? ' on' : '') + '" data-i="' + i + '"><span class="e">' + q.places[i][0] + '</span>' + bi(q.places[i][1], q.places[i][2].replace(/^the /, '')) + (k >= 0 ? '<i>' + (k + 1) + '</i>' : '') + '</button>';
    }).join('') + '</div><div class="st-rules">' + q.rules.map(function (r, i) {
      return '<div class="st-rule"><b>' + (i + 1) + '</b><span>' + bi(_ruleText(q, r, true), _ruleText(q, r, false)) + '</span></div>';
    }).join('') + '</div><div class="st-msg"></div>';
    host.querySelectorAll('.st-tap').forEach(function (b) {
      b.addEventListener('click', function () {
        if (done) return;
        var i = +b.getAttribute('data-i'); if (tapped.indexOf(i) >= 0) return;
        tapped.push(i); draw();
        if (tapped.length < 3) return;
        var bad = q.rules.map(function (r, n) { return holds(r, tapped) ? 0 : n + 1; }).filter(Boolean);
        if (!bad.length) {
          done = true; _say(host, '✅ 符合所有规则！', '✅ All rules are met!');
          return _finish(q, { used: resets, optimal: 0, resets: resets, tier: _tier(resets), zh: '重来了 ' + resets + ' 次', en: 'Restarts: ' + resets });
        }
        resets++; tapped = [];
        setTimeout(function () { draw(); _say(host, '❌ 规则 ' + bad.join('、') + ' 没做到，重新点。', '❌ Rule ' + bad.join(', ') + ' is broken. Try again.'); }, 500);
      });
    });
  }
  draw();
}

function _playBasket(q, host) {
  var pick = {}, tries = 0, done = false;
  function total() { return q.icons.reduce(function (n, e, i) { return n + (pick[i] ? q.prices[i] : 0); }, 0); }
  function draw() {
    var sum = total();
    host.innerHTML = '<div class="st-places">' + q.icons.map(function (e, i) {
      return '<button class="st-place st-tap' + (pick[i] ? ' on' : '') + '" data-i="' + i + '"><span class="e">' + e + '</span><b>🪙 ' + q.prices[i] + '</b></button>';
    }).join('') + '</div><div class="st-calc"><span>' + bi('篮子里', 'Basket') + '</span><b style="' + (sum > q.coins ? 'color:#dc2626;border-color:#ef4444' : '') + '">' + sum + '</b><span>/ ' + q.coins + ' 🪙</span></div>' +
      '<button class="st-reset" id="st-ok">' + bi('✔ 买好了', '✔ Done') + '</button><div class="st-msg"></div>';
    host.querySelectorAll('.st-tap').forEach(function (b) {
      b.addEventListener('click', function () { if (done) return; var i = +b.getAttribute('data-i'); pick[i] = !pick[i]; draw(); });
    });
    host.querySelector('#st-ok').addEventListener('click', function () {
      if (done) return;
      var s = total();
      if (!s) return _say(host, '先点几样东西放进篮子。', 'Tap some things into the basket first.');
      if (s > q.coins) { tries++; return _say(host, '❌ 总价 ' + s + ' 超过了 ' + q.coins + '，拿掉一样。', '❌ Total ' + s + ' is over ' + q.coins + '. Remove something.'); }
      done = true;
      var gap = q.optimal - s;
      _finish(q, { used: s, optimal: q.optimal, resets: tries, tier: _tier(gap),
        zh: gap ? '花了 ' + s + '，最多可以花 ' + q.optimal : '花了 ' + s + '，正好是最多', en: gap ? 'Spent ' + s + '; the most possible is ' + q.optimal : 'Spent ' + s + ' — the most possible' });
      _say(host, '✅ 买好了！', '✅ Bought!');
    });
  }
  draw();
}

function _playPress(q, host) {
  var OPS = { '+2': function (v) { return v + 2; }, '+3': function (v) { return v + 3; }, '+5': function (v) { return v + 5; }, '×2': function (v) { return v * 2; }, '×3': function (v) { return v * 3; } };
  var val = q.start, hist = [], resets = 0, done = false;
  function draw() {
    host.innerHTML = '<div class="st-calc"><b>' + val + '</b><span>→</span><b style="background:#dcfce7;border-color:#4ade80">' + q.target + '</b></div>' +
      '<div class="st-places">' + q.buttons.map(function (b) { return '<button class="st-place st-tap st-key" data-b="' + b + '"><b>' + b + '</b></button>'; }).join('') + '</div>' +
      '<div class="st-info">' + bi('已按 ' + hist.length + ' 次：' + (hist.join(' → ') || '—'), 'Presses: ' + hist.length + ' — ' + (hist.join(' → ') || '—')) + '</div>' +
      '<div><button class="st-reset" id="st-undo">' + bi('↶ 撤销', '↶ Undo') + '</button> <button class="st-reset" id="st-again">' + bi('↺ 重来', '↺ Restart') + '</button></div><div class="st-msg"></div>';
    host.querySelectorAll('.st-key').forEach(function (b) {
      b.addEventListener('click', function () {
        if (done) return;
        hist.push(b.getAttribute('data-b')); val = OPS[b.getAttribute('data-b')](val); draw();
        if (val === q.target) {
          done = true; _say(host, '🎯 到了！', '🎯 Reached it!');
          var extra = hist.length - q.optimal;
          _finish(q, { used: hist.length, optimal: q.optimal, resets: resets, tier: _tier(extra),
            zh: extra > 0 ? '按了 ' + hist.length + ' 次（最少 ' + q.optimal + ' 次）' : '按了 ' + hist.length + ' 次，是最少的', en: extra > 0 ? 'Pressed ' + hist.length + ' times (fewest is ' + q.optimal + ')' : 'Pressed ' + hist.length + ' times — the fewest' });
        } else if (val > q.target) _say(host, '超过了！点「撤销」或「重来」。', 'Too big! Use Undo or Restart.');
      });
    });
    host.querySelector('#st-undo').addEventListener('click', function () {
      if (done || !hist.length) return; hist.pop(); val = hist.reduce(function (v, o) { return OPS[o](v); }, q.start); draw();
    });
    host.querySelector('#st-again').addEventListener('click', function () {
      if (done) return; resets++; hist = []; val = q.start; draw();
    });
  }
  draw();
}

function _playCookie(q, host) {
  var M = q.max + 1, left = q.total, resets = 0, helps = 0, done = false, wait = false, log = '', mode = null, lit = 0;
  function targets() { var t = []; for (var v = M; v < q.total; v += M) t.push(v); return t.slice(0, 5).join('、') + '…'; }
  function key() { return left % M; }                       // taking this many leaves a multiple of M
  function say(zh, en) { _say(host, zh, en); }
  function chooser() {
    host.innerHTML = '<div class="st-big">🍪 × ' + q.total + '</div><div class="st-q">' + bi('谁先拿？', 'Who goes first?') + '</div>' +
      '<div class="st-places"><button class="st-place st-tap st-key" data-m="me"><b>' + bi('🧒 我先拿', '🧒 Me first') + '</b></button>' +
      '<button class="st-place st-tap st-key" data-m="pc"><b>' + bi('💻 电脑先拿', '💻 Computer first') + '</b></button></div>' +
      '<div class="st-legend">' + bi('我先拿：电脑很聪明，难！　电脑先拿：电脑第一步会拿错，抓住机会！', 'Me first: the computer is clever — hard! Computer first: it slips on move one — seize it!') + '</div><div class="st-msg"></div>';
    host.querySelectorAll('.st-key').forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.getAttribute('data-m'); left = q.total; log = ''; lit = 0; done = false;
        if (mode === 'pc') {                               // the computer's slip: never the winning take
          var opts = []; for (var i = 1; i <= q.max; i++) if (i !== q.total % M) opts.push(i);
          var t = opts[Math.floor(Math.random() * opts.length)]; left -= t; log += '💻 −' + t + '　';
        }
        draw();
        if (mode === 'pc') say('电脑拿错了第一步！现在轮到你。', 'The computer slipped on its first move! Your turn.');
      });
    });
  }
  function draw(msgZh, msgEn) {
    var btns = '', i;
    for (i = 1; i <= Math.min(q.max, left); i++) btns += '<button class="st-place st-tap st-key' + (lit === i ? ' on' : '') + '" data-n="' + i + '"><b>' + bi('拿 ' + i, 'Take ' + i) + '</b></button>';
    host.innerHTML = '<div class="st-big">🍪 × ' + left + '</div><div class="st-places">' + (left && !done ? btns : '') + '</div>' +
      '<div class="st-info">' + log + '</div>' +
      (left === 0 && !done ? '<button class="st-reset" id="st-again">' + bi('↺ 再来一次', '↺ Try again') + '</button>' : '') +
      (left && !done ? '<button class="st-reset" id="st-hint" style="background:#0ea5e9">' + bi('💡 提示', '💡 Hint') + '</button>' : '') + '<div class="st-msg"></div>';
    if (msgZh) _say(host, msgZh, msgEn);
    host.querySelectorAll('.st-key').forEach(function (b) {
      b.addEventListener('click', function () {
        if (done || wait) return;
        var n = +b.getAttribute('data-n'); left -= n; log += '🧒 −' + n + '　'; lit = 0;
        if (!left) {
          done = true; draw('🎉 你拿走了最后一块，你赢了！', '🎉 You took the last one — you win!');
          var extra = resets + (helps > 1 ? 1 : 0);
          return _finish(q, { used: extra, optimal: 0, resets: resets, tier: _tier(extra), zh: resets || helps > 1 ? '重来 ' + resets + ' 次，看答案提示 ' + (helps > 1 ? '用了' : '没用') : '一次就赢了', en: resets || helps > 1 ? 'Restarts: ' + resets + (helps > 1 ? ', used the answer hint' : '') : 'Won on the first try' });
        }
        wait = true; draw('💻 电脑在想…', '💻 The computer is thinking…');
        setTimeout(function () {
          var take = left % M || 1; left -= take; log += '💻 −' + take + '　'; wait = false;
          if (!left) draw('😢 电脑拿走了最后一块。点「再来一次」，想想怎么拿。', '😢 The computer took the last one. Try again and think about how to take.');
          else draw();
        }, 700);
      });
    });
    var again = host.querySelector('#st-again');
    if (again) again.addEventListener('click', function () { resets++; chooser(); });
    var hint = host.querySelector('#st-hint');
    if (hint) hint.addEventListener('click', function () {
      if (done || wait) return;
      helps++;
      if (helps === 1) return say('💡 想一想：让剩下的饼干变成 ' + targets() + '，你就一定赢。再点一次「提示」告诉你拿几块。', '💡 Think: leave ' + targets() + ' cookies and you always win. Press Hint again to see how many to take.');
      if (key()) { lit = key(); draw('💡 拿 ' + key() + ' 块，剩下的就是 ' + M + ' 的倍数。', '💡 Take ' + key() + ' — what is left is a multiple of ' + M + '.'); }
      else say('💡 现在怎么拿都会让电脑占便宜，先拿 1 块，等它拿错。', '💡 Any move favours the computer now. Take 1 and wait for a slip.');
    });
  }
  chooser();
}

var PLAYERS = { ordertap: _playOrderTap, basket: _playBasket, press: _playPress, cookie: _playCookie };

function _mapOf(q) {
  var svg = q.kind === 'via' ? _viaSvg(q) : q.kind === 'keydoor' ? _keySvg(q) : _mapSvg(q);
  var numbered = q.kind === 'via' || q.kind === 'keydoor' || (q.map && q.map.numbers);
  return svg + (numbered ? '<div class="st-legend">' + bi('🔢 线上的数字 ＝ 这一段要走几步', '🔢 The number on a line = steps for that stretch') + '</div>' : '');
}

// Same idiom as the s1-seq style injection above: a small self-scoped
// stylesheet, because only the grade selector screen uses these classes.
function _injectLevelSelectorStyles() {
  if (document.getElementById('ms-lvl-style')) return;
  var s = document.createElement('style');
  s.id = 'ms-lvl-style';
  s.textContent = [
    '.ms-lvl-wrap{display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px 16px;}',
    '.ms-lvl-title-bar{display:flex;align-items:center;width:100%;max-width:520px;gap:8px;}',
    '.ms-lvl-title{font-size:20px;font-weight:900;color:#9a3412;text-align:center;flex:1;}',
    '.ms-lvl-back{background:none;border:none;cursor:pointer;font-size:14px;font-weight:700;color:#ea580c;padding:4px 6px;border-radius:8px;white-space:nowrap;flex:0 0 auto;}',
    '.ms-lvl-back:hover{background:#fff7ed;}',
    '.ms-lvl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;width:100%;max-width:440px;}',
    '.ms-lvl-card{border:2px solid #fed7aa;border-radius:16px;padding:18px 14px;cursor:pointer;text-align:center;background:#fff;transition:transform .16s,border-color .16s,box-shadow .16s;}',
    '.ms-lvl-card:hover{transform:translateY(-2px);border-color:#ea580c;box-shadow:0 8px 20px rgba(234,88,12,0.12);}',
    '.ms-lvl-badge{font-size:26px;font-weight:900;color:#9a3412;margin-bottom:4px;}',
    '.ms-lvl-name{font-size:13px;font-weight:700;color:#334155;}',
    '.ms-lvl-desc{font-size:11px;color:#94a3b8;margin-top:4px;}'
  ].join('');
  document.head.appendChild(s);
}

function _showLevelSelector() {
  _injectLevelSelectorStyles();
  var lang = shell.lang || 'zh';
  var wrap = document.createElement('div');
  wrap.id = 'ms-lvl-selector';
  wrap.innerHTML = '<div class="ms-lvl-wrap">' +
    '<div class="ms-lvl-title-bar">' +
      '<button class="ms-lvl-back" id="ms-sel-back">⬅️ <span class="zh">数学启智</span><span class="en">Math</span></button>' +
      '<div class="ms-lvl-title"><span class="zh">策略 · 选择年级</span><span class="en">Strategy · Grade</span></div>' +
      IH.controlsHtml('lvl') +
    '</div>' +
    '<div class="ms-lvl-grid">' +
    GRADE_LEVELS.map(function (lvl) {
      return '<div class="ms-lvl-card" data-level="' + lvl.id + '">' +
        '<div class="ms-lvl-badge">' + lvl.badge + '</div>' +
        '<div class="ms-lvl-name"><span class="zh">' + lvl.nameZh + '</span><span class="en">' + lvl.nameEn + '</span></div>' +
        '<div class="ms-lvl-desc"><span class="zh">' + lvl.descZh + '</span><span class="en">' + lvl.descEn + '</span></div>' +
      '</div>';
    }).join('') +
    '</div></div>';

  function applyLang(l) {
    wrap.querySelectorAll('.zh').forEach(function (el) { el.style.display = l === 'zh' ? '' : 'none'; });
    wrap.querySelectorAll('.en').forEach(function (el) { el.style.display = l === 'en' ? '' : 'none'; });
  }
  applyLang(lang);
  document.addEventListener('shell:langchange', function (e) { applyLang(e.detail && e.detail.lang); });
  document.body.appendChild(wrap);
  IH.wire('lvl');

  var backBtn = document.getElementById('ms-sel-back');
  if (backBtn) backBtn.addEventListener('click', function () { window.location.href = '../index.html'; });

  wrap.addEventListener('click', function (e) {
    var card = e.target.closest('.ms-lvl-card');
    if (!card) return;
    wrap.remove();
    _launchGrade(card.getAttribute('data-level'));
  });
}

// shell.createGame() has no cfg.onBack hook, and its own #s1-back button
// (in-game header only) only ever reaches shell's internal home screen, never
// anything that existed before createGame() was called. So we tear shell's
// DOM down ourselves and re-show our own grade selector, same idiom as
// logic/game.js's _tearDownShell/_injectShellBackButtons.
function _tearDownShell() {
  var wrap = document.querySelector('.s1-wrap');
  var transcript = document.getElementById('s1-transcript');
  var overlay = document.getElementById('s1-overlay');
  if (wrap) wrap.remove();
  if (transcript) transcript.remove();
  if (overlay) overlay.remove();
}

function _injectShellBackButtons() {
  var homeHdr = document.querySelector('#s1-home .s1-hdr');
  if (homeHdr && !document.getElementById('ms-home-back')) {
    var btn = document.createElement('button');
    btn.id = 'ms-home-back';
    btn.innerHTML = '⬅️';
    btn.title = '返回选择年级 / Back to grade selector';
    btn.addEventListener('click', function () {
      _tearDownShell();
      _showLevelSelector();
    });
    homeHdr.insertBefore(btn, homeHdr.firstChild);
  }

  // The in-game back button (#s1-back) is left to shell: it returns to the unit list;
  // the unit list's own back button (above) then returns to the grade chooser.
}

function _launchGrade(levelId) {
  shell.createGame({
  id:       'learning-math-strategy',
  theme:    { primary: '#ea580c', primary2: '#9a3412' },  // orange-red — strategy identity
  gui: {
    header: { show: true, showBack: true },
    language: { enabled: true, default: 'en' },
    audio: {
      music: { enabled: true, defaultOn: false },
      sound: { enabled: true, defaultOn: true }
    },
    history: { enabled: true },
    help: {
      enabled: true,
      contentZh: '先比较各方案的收益与代价，再选择更优策略。',
      contentEn: 'Compare benefit and cost of each plan before choosing the better strategy.'
    },
    video: {
      enabled: true,
      videoId: 'learning-math-strategy-intro-001'
    }
  },
  title:    { zh: '🧭 策略思维',             en: '🧭 Strategic Thinking' },
  subtitle: { zh: '先规划，后行动——好的策略让结果更好', en: 'Plan before you act — a good strategy leads to a better outcome' },
  passScore: 7,
  units:    _unitsForLevel(levelId),

  renderSequence: function (q, container) { _renderStrategy(q, container); },

  renderOption: function (opt) {
    var m = /^tx:(.*)\|(.*)$/.exec(String(opt));
    if (opt === 'done') return '<span class="st-opt">✔</span>';
    return '<span class="st-opt">' + (m ? bi(m[1], m[2]) : String(opt)) + '</span>';
  },

  checkAnswer: function (selected, q) {
    if (q.interactive) return !!q.result;
    return selected === q.answer;
  },

  getVoiceText: function (q) {
    var sc = _sceneText(q);
    return _speakable(shell.lang === 'zh' ? sc.zh : sc.en);
  },

  /** Playable questions: show the tier under the usual "Correct!" (finishing passes; optimal gets a star). */
  onAnswer: function (selected, q, correct) {
    if (!correct || !q.result) return;
    var r = q.result;
    setTimeout(function () {
      var fb = document.getElementById('s1-fb'); if (!fb) return;
      fb.innerHTML += '<div>' + bi((r.tier === 'best' ? '⭐ 最优！' : '') + r.zh, (r.tier === 'best' ? '⭐ Best! ' : '') + r.en) + '</div>';
      fb.querySelectorAll('.zh').forEach(function (n) { n.style.display = shell.lang === 'zh' ? '' : 'none'; });
      fb.querySelectorAll('.en').forEach(function (n) { n.style.display = shell.lang === 'en' ? '' : 'none'; });
    }, 0);
  },

  getReportContext: function (ctx) {
    var unit = (ctx && ctx.unit) || {}, qs = unit.questions || [], unitId = String(unit.id);
    var levelId = UNIT_LEVEL[unitId] || 'L1';
    var out = {
      moduleId: MODULE_ID, moduleType: MODULE_TYPE, levelId: levelId, gradeCode: LEVEL_GRADE[levelId] || null,
      unitId: unitId, strategyType: STRATEGY_TYPE_OF[_dominantOf(qs, function (q) { return q.kind; })] || null,
      difficultyAxis: difficultyAxisFor(levelId),
      activityRuntime: 'puzzle', sourceGameId: SOURCE_GAME_ID
    };
    var played = qs.filter(function (q) { return q.result; });
    if (played.length) {
      var tiers = { best: 0, better: 0, good: 0, valid: 0 };
      played.forEach(function (q) { tiers[q.result.tier]++; });
      out.process = { tiers: tiers, optimalCount: tiers.best, restarts: played.reduce(function (n, q) { return n + q.result.resets; }, 0) };
    }
    refillUnit(unitId);
    return out;
  },

  registerRootGenes: function (ctx) {
    // Ability genes only (unit location travels as unitId in the report).
    var u = (ctx && ctx.unit) || {}, t = STRATEGY_TYPE_OF[_dominantOf(u.questions || [], function (q) { return q.kind; })];
    var out = ['RG.STRATEGY.DECISION.PLANNING'];
    if (t === 'resource_allocation' || t === 'constraint_strategy') out.push('RG.STRATEGY.RESOURCE.TRADEOFF');
    if (t === 'look_ahead' || t === 'action_choice' || t === 'adaptation_optimization') out.push('RG.STRATEGY.PREDICT.CONSEQUENCE');
    return out;
  }
  });

  _injectShellBackButtons();
}

_showLevelSelector();
