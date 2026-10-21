'use strict';

/**
 * Learning Math Number Sense — Shell-1 wiring.
 *
 * Questions come from NS_GEN (generator.js): a type x grade table, refilled
 * after every finished session. See the GRADIENT RULE at the top of that file.
 *
 * Radar contract: LEVEL_GRADE, NUMBER_SENSE_TYPE_OF and the `base` table
 * inside difficultyAxisFor() are read as literal text by
 * metadata/validate.js (S2/S3/S4) against metadata/metathinking/number-sense.json.
 * Keep them as flat, literal object declarations — do not compute them.
 */
(function () {
  'use strict';

  var MODULE_ID = 'number-sense';
  var MODULE_TYPE = 'metathinking';
  var SOURCE_GAME_ID = 'learning-math-number-sense';
  var SESSION_SIZE = 8;

  var LEVEL_GRADE = { L1: 'K1', L2: 'K2', L3: 'G1', L4: 'G2' };

  var NUMBER_SENSE_TYPE_OF = {
    quantity: 'quantity',
    part_whole: 'part_whole',
    composition: 'composition',
    representation: 'representation',
    order: 'order',
    estimation: 'estimation',
    operation: 'operation',
    magnitude: 'magnitude'
  };

  var TYPE_GENES = {
    quantity: 'RG.MATH.NUMBER_SENSE.QUANTITY',
    part_whole: 'RG.MATH.NUMBER_SENSE.PART_WHOLE',
    composition: 'RG.MATH.NUMBER_SENSE.COMPOSITION',
    representation: 'RG.MATH.NUMBER_SENSE.REPRESENTATION',
    order: 'RG.MATH.NUMBER_SENSE.ORDER',
    estimation: 'RG.MATH.NUMBER_SENSE.ESTIMATION',
    operation: 'RG.MATH.NUMBER_SENSE.OPERATION',
    magnitude: 'RG.MATH.NUMBER_SENSE.MAGNITUDE'
  };

  var CHIPS = {
    quantity: ['数量感知', 'Quantity'], part_whole: ['部分与整体', 'Part-Whole'], composition: ['组合拆分', 'Composition'],
    representation: ['数的表示', 'Representation'], order: ['数序与距离', 'Order & Distance'],
    estimation: ['估计', 'Estimation'], operation: ['运算直觉', 'Operation Sense'], magnitude: ['数量级', 'Magnitude']
  };

  var STYLE = [
    '.ns-wrap{display:grid;gap:12px;justify-items:center;}',
    '.ns-chip{font-size:12px;font-weight:800;padding:4px 10px;border-radius:999px;background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;}',
    '.ns-q{font-size:20px;font-weight:900;color:#92400e;line-height:1.35;text-align:center;}',
    '.ns-expr{font-size:34px;font-weight:900;color:#1e293b;letter-spacing:1px;text-align:center;}',
    '.ns-flash-hidden{visibility:hidden;}',
    '.ns-flash-zone{background:#fff;border:3px solid var(--fc,#2563eb);border-radius:16px;padding:12px;box-shadow:0 0 0 4px rgba(255,255,255,.55);}',
    '.ns-flash-zone .ns-group{background:#fff;border:0;}',
    '.ns-fdot{display:block;width:22px;height:22px;border-radius:50%;background:var(--fc,#2563eb);animation:ns-blink .5s ease-in-out infinite;}',
    '.ns-icons.tiny .ns-fdot{width:11px;height:11px;}',
    '@keyframes ns-blink{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.25;transform:scale(.8);}}',
    '.ns-pair{display:flex;gap:24px;align-items:center;justify-content:center;flex-wrap:wrap;}',
    '.ns-group{padding:8px;border-radius:12px;background:#fffbeb;border:1px dashed #fcd34d;}',
    '.ns-icons{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;max-width:210px;font-size:22px;line-height:1.1;}',
    '.ns-icons.spread{gap:16px;max-width:260px;}',
    '.ns-icons.tiny{font-size:10px;gap:3px;max-width:230px;}',
    '.ns-rows{display:flex;flex-direction:column;gap:4px;align-items:center;}',
    '.ns-rows .ns-icons{flex-wrap:nowrap;max-width:none;}',
    '.ns-seq{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;}',
    '.ns-box{min-width:46px;padding:8px 10px;border-radius:10px;background:#fff;border:2px solid #fcd34d;font-size:26px;font-weight:900;color:#1e293b;text-align:center;}',
    '.ns-box.hole{background:#fef3c7;border-style:dashed;color:#b45309;}',
    '.ns-bond{display:grid;gap:6px;justify-items:center;}',
    '.ns-bond-top{width:64px;height:64px;border-radius:50%;background:#fde68a;border:3px solid #f59e0b;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;}',
    '.ns-bond-row{display:flex;gap:56px;}',
    '.ns-bond-leaf{width:54px;height:54px;border-radius:50%;background:#fff;border:3px solid #fbbf24;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;}',
    '.ns-bond-leaf.hole{background:#fef3c7;border-style:dashed;color:#b45309;}',
    '.ns-frame{display:grid;grid-template-columns:repeat(5,22px);gap:3px;padding:4px;background:#e2e8f0;border-radius:6px;}',
    '.ns-cell{width:22px;height:22px;border-radius:50%;background:#f8fafc;}',
    '.ns-cell.on{background:#d97706;}',
    '.ns-frames{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;}',
    '.ns-face{display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap;font-size:24px;font-weight:900;color:#1e293b;}',
    '.ns-pile{display:inline-grid;grid-template-columns:repeat(5,18px);gap:5px;padding:6px;border-radius:10px;background:#fff;border:2px solid #fcd34d;}',
    '.ns-pile.b{border-color:#93c5fd;}',
    '.ns-pile i{width:18px;height:18px;border-radius:50%;background:#d97706;display:block;}',
    '.ns-pile.b i{background:#2563eb;}',
    '.ns-plus{font-size:30px;font-weight:900;color:#92400e;padding:0 4px;}',
    '.ns-face .die{font-size:44px;line-height:1;}',
    '.ns-tickrow{display:flex;gap:2px;width:min(100%,520px);align-items:flex-end;}',
    '.ns-tick{flex:1;min-width:14px;border:0;background:none;padding:2px 0 0;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;}',
    '.ns-tick .dot{height:20px;width:100%;display:flex;align-items:flex-end;justify-content:center;}',
    '.ns-tick.sel .dot::after{content:"";width:16px;height:16px;border-radius:50%;background:#ef4444;}',
    '.ns-tick .bar{width:3px;height:22px;background:#92400e;border-radius:2px;}',
    '.ns-tick .lab{font-size:13px;font-weight:800;color:#92400e;height:16px;}',
    '.ns-axis{width:min(100%,520px);height:4px;background:#92400e;border-radius:2px;margin-top:-26px;margin-bottom:22px;}',
    '.ns-plate{min-height:64px;min-width:190px;border:3px dashed #f59e0b;border-radius:16px;padding:8px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;background:#fffbeb;}',
    '.ns-pool{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:300px;}',
    '.ns-tap{font-size:30px;line-height:1;border:2px solid #fcd34d;border-radius:12px;background:#fff;padding:4px 6px;cursor:pointer;}',
    '.ns-tap.on{background:#fde68a;border-color:#f59e0b;opacity:.5;}',
    '.ns-fcell{width:34px;height:34px;border-radius:50%;border:2px solid #cbd5e1;background:#f8fafc;cursor:pointer;padding:0;}',
    '.ns-fcell.on{background:#d97706;border-color:#b45309;}',
    '.ns-cutrow{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:0;font-size:30px;}',
    '.ns-cutrow .it{padding:0 2px;}',
    '.ns-cutrow .it.l{filter:none;}',
    '.ns-cutrow .it.r{filter:hue-rotate(160deg);}',
    '.ns-cutrow button.gap{width:14px;height:40px;border:0;background:none;cursor:pointer;position:relative;padding:0;}',
    '.ns-cutrow button.gap::after{content:"";position:absolute;left:6px;top:4px;bottom:4px;width:2px;background:#cbd5e1;}',
    '.ns-cutrow button.gap.cut::after{width:4px;left:5px;background:#ef4444;}',
    '.ns-btn{font-size:18px;font-weight:900;padding:8px 14px;border-radius:12px;border:2px solid #f59e0b;background:#fff;color:#92400e;cursor:pointer;}',
    '.ns-blocks{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:320px;min-height:44px;}',
    '.ns-ten{width:18px;height:44px;border-radius:4px;background:#2563eb;}',
    '.ns-one{width:18px;height:18px;border-radius:4px;background:#d97706;align-self:flex-end;}',
    '.ns-mcards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:min(100%,520px);}',
    '.ns-mcard{min-height:70px;border:3px solid #e2e8f0;border-radius:12px;background:#fff;padding:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;}',
    '.ns-mcard.sel{border-color:#d97706;background:#fef3c7;}',
    '.ns-count{font-size:15px;font-weight:800;color:#64748b;}',
    '.ns-opt{display:grid;gap:6px;justify-items:center;align-content:center;min-height:68px;}',
    '.ns-opt-val{font-size:28px;font-weight:900;color:#0f172a;line-height:1;}',
    '.ns-opt-pair{font-size:24px;font-weight:900;color:#1e293b;}',
    '.s1-opt{min-height:90px !important;}'
  ].join('');
  (function () { var s = document.createElement('style'); s.id = 'ns-shell-style'; s.textContent = STYLE; document.head.appendChild(s); }());

  function difficultyAxisFor(levelId, type) {
    var base = {
      L1: { object_complexity: 'concrete', dimension_complexity: 'single',
            relation_complexity: 'direct', language_complexity: 'question',
            transfer_complexity: 'within-domain' },
      L2: { object_complexity: 'pictorial', dimension_complexity: 'single',
            relation_complexity: 'direct', language_complexity: 'question',
            transfer_complexity: 'within-domain' },
      L3: { object_complexity: 'pictorial', dimension_complexity: 'dual',
            relation_complexity: 'indirect', language_complexity: 'question',
            transfer_complexity: 'within-domain' },
      L4: { object_complexity: 'symbolic', dimension_complexity: 'dual',
            relation_complexity: 'indirect', language_complexity: 'question',
            transfer_complexity: 'within-domain' }
    };
    var row = base[levelId];
    if (!row) return null;
    var axis = Object.assign({}, row);
    if ((type === 'composition' || type === 'operation') && (levelId === 'L3' || levelId === 'L4')) {
      axis.transfer_complexity = 'strategy';
    }
    return axis;
  }

  function buildRadarContext(levelId, type, extra) {
    var ctx = {
      moduleId: MODULE_ID, moduleType: MODULE_TYPE, levelId: levelId,
      gradeCode: LEVEL_GRADE[levelId] || null,
      numberSenseType: NUMBER_SENSE_TYPE_OF[type] || null,
      difficultyAxis: difficultyAxisFor(levelId, type),
      sourceGameId: SOURCE_GAME_ID
    };
    return extra ? Object.assign(ctx, extra) : ctx;
  }

  function _dominantType(unit) {
    var counts = {}, best = null, bestCount = -1;
    (unit.questions || []).forEach(function (q) { counts[q.type] = (counts[q.type] || 0) + 1; });
    Object.keys(NUMBER_SENSE_TYPE_OF).forEach(function (t) {
      var c = counts[t] || 0;
      if (c > bestCount) { best = t; bestCount = c; }
    });
    return best;
  }

  function genesFor(unit) {
    var seen = [];
    (unit.questions || []).forEach(function (q) {
      var gene = TYPE_GENES[q.type];
      if (gene && seen.indexOf(gene) === -1) seen.push(gene);
    });
    return seen;
  }

  // ── Rendering helpers ──────────────────────────────────────────────────────

  function bi(zh, en) { return '<span class="zh">' + zh + '</span><span class="en">' + en + '</span>'; }

  function rowCounts(n) {
    if (n <= 6) return [n];
    var half = Math.floor(n / 2);
    if (half <= 6) { var r = [half, half]; if (n - half * 2 > 0) r.push(n - half * 2); return r; }
    var b = Math.floor(n / 3), rem = n - b * 3, r3 = [b, b, b];
    for (var i = 0; i < rem; i++) r3[r3.length - 1 - i] += 1;
    return r3;
  }
  var FLASH_COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#db2777'];
  function flashStyle(v) {
    var k = String(v.icon || '').charCodeAt(0) || 0;
    return ' style="--fc:' + FLASH_COLORS[k % FLASH_COLORS.length] + '"';
  }
  function iconRow(count, icon, cls) {
    var o = ''; for (var i = 0; i < count; i++) o += icon === '#' ? '<i class="ns-fdot"></i>' : '<span>' + icon + '</span>';
    return '<div class="ns-icons' + (cls ? ' ' + cls : '') + '">' + o + '</div>';
  }
  function iconsHtml(n, icon, opts) {
    opts = opts || {};
    if (opts.scatter) return iconRow(n, '#', 'tiny');
    if (opts.spread) return iconRow(n, icon, 'spread');
    var rows = rowCounts(n);
    if (rows.length === 1) return iconRow(n, icon);
    return '<div class="ns-rows">' + rows.map(function (c) { return iconRow(c, icon); }).join('') + '</div>';
  }
  function frameHtml(n) {
    var out = '';
    for (var f = 0; f < Math.ceil(n / 10); f++) {
      var cells = '';
      for (var i = 0; i < 10; i++) cells += '<span class="ns-cell' + (f * 10 + i < n ? ' on' : '') + '"></span>';
      out += '<div class="ns-frame">' + cells + '</div>';
    }
    return '<div class="ns-frames">' + out + '</div>';
  }
  function dice(n) {
    var one = function (k) { return '<span class="die">' + String.fromCharCode(0x267F + k) + '</span>'; };
    return n <= 6 ? one(n) : one(6) + '<b>+</b>' + one(n - 6);
  }
  function fingers(n) {
    return n <= 5 ? '<span style="font-size:30px">' + new Array(n + 1).join('☝️') + '</span>'
                  : '<span style="font-size:30px">🖐' + new Array(n - 4).join('☝️') + '</span>';
  }
  function pile(n, cls) {
    var o = ''; for (var i = 0; i < n; i++) o += '<i></i>';
    return '<span class="ns-pile' + (cls ? ' ' + cls : '') + '">' + o + '</span>';
  }
  function faceHtml(f) {
    switch (f.kind) {
      case 'num': return '<div class="ns-face">' + f.n + '</div>';
      case 'dots': return '<div class="ns-face">' + pile(f.n) + '</div>';
      case 'fingers': return '<div class="ns-face">' + fingers(f.n) + '</div>';
      case 'dice': return '<div class="ns-face">' + dice(f.n) + '</div>';
      case 'split': return '<div class="ns-face">' + pile(f.a) + '<span class="ns-plus">+</span>' + pile(f.b, 'b') + '</div>';
      case 'frame': return '<div class="ns-face">' + frameHtml(f.n) + '</div>';
      case 'sum': return '<div class="ns-face">' + f.a + ' + ' + (f.n - f.a) + '</div>';
      case 'tens': return '<div class="ns-face">' + bi(f.tens + ' 个十 + ' + f.ones + ' 个一', f.tens + ' tens + ' + f.ones + ' ones') + '</div>';
    }
    return '';
  }
  function numberLine(lo, hi, value, step) {
    var W = 280, pad = 16, x = function (v) { return pad + (v - lo) / (hi - lo) * (W - pad * 2); }, t = '';
    for (var v = lo; v <= hi; v += step) {
      t += '<line x1="' + x(v) + '" y1="26" x2="' + x(v) + '" y2="38" stroke="#92400e" stroke-width="2"/>' +
           '<text x="' + x(v) + '" y="54" font-size="12" font-weight="800" text-anchor="middle" fill="#92400e">' + v + '</text>';
    }
    var m = value == null ? '' : '<circle cx="' + x(value) + '" cy="22" r="8" fill="#ef4444"/>';
    return '<svg viewBox="0 0 ' + W + ' 62" width="' + W + '" height="62"><line x1="' + pad + '" y1="32" x2="' + (W - pad) + '" y2="32" stroke="#92400e" stroke-width="3"/>' + t + m + '</svg>';
  }
  function bondHtml(whole, partA) {
    return '<div class="ns-bond"><div class="ns-bond-top">' + whole + '</div>' +
      '<div class="ns-bond-row"><div class="ns-bond-leaf">' + partA + '</div><div class="ns-bond-leaf hole">?</div></div></div>';
  }

  // ── Per-type scene ─────────────────────────────────────────────────────────

  function scene(q) {
    var v = q.view || {};
    switch (q.type + '/' + q.mode) {
      case 'quantity/flash':
        return { body: '<div class="ns-flash-zone"' + flashStyle(v) + '>' + iconsHtml(v.dots, '#', { scatter: v.scatter }) + '</div>', flash: v.flashMs,
          zh: v.scatter ? '刚才大约有多少个？' : '刚才显示的有几个？', en: v.scatter ? 'About how many were there?' : 'How many were shown?' };
      case 'quantity/compare':
        return { body: '<div class="ns-flash-zone ns-pair"' + flashStyle(v) + '><div class="ns-group">' + iconsHtml(v.left, '#', { spread: v.decoy && v.left < v.right }) + '</div>' +
          '<div class="ns-group">' + iconsHtml(v.right, '#', { spread: v.decoy && v.right < v.left }) + '</div></div>', flash: v.flashMs, zh: '哪边更多？', en: 'Which side had more?' };
      case 'representation/same_number':
        return { body: '<div class="ns-group">' + faceHtml(v.face) + '</div>', zh: '哪一个和它表示同样多？', en: 'Which one means the same amount?' };
      case 'representation/tens_to_num':
        return { body: '<div class="ns-group">' + faceHtml(v.face) + '</div>', zh: '合起来是多少？', en: 'How much is it altogether?' };
      case 'order/missing':
        return { body: '<div class="ns-seq">' + v.seq.map(function (n) { return '<div class="ns-box' + (n == null ? ' hole' : '') + '">' + (n == null ? '?' : n) + '</div>'; }).join('') + '</div>',
          zh: '缺的数是几？', en: 'Which number is missing?' };
      case 'order/closer':
        return { body: numberLine(0, v.max, v.target, 1) + '<div class="ns-expr">' + v.target + '</div>', zh: '哪个数离 ' + v.target + ' 更近？', en: 'Which number is closer to ' + v.target + '?' };
      case 'order/line_pos':
        return { body: numberLine(v.lo, v.hi, v.value, 5), zh: '红点最靠近哪个整十数？', en: 'Which multiple of ten is the red dot closest to?' };
      case 'part_whole/hidden_part':
        return { body: '<div class="ns-expr">' + v.whole + '</div><div class="ns-pair"><div class="ns-group">' + iconRow(v.shown, v.icon) + '</div><div class="ns-group" style="font-size:30px">🧺 ?</div></div>',
          zh: '一共 ' + v.whole + ' 个，篮子里藏了几个？', en: v.whole + ' in all — how many are hidden in the basket?' };
      case 'part_whole/bond':
        return { body: bondHtml(v.whole, v.partA), zh: '另一份是多少？', en: 'What is the other part?' };
      case 'composition/make':
        return { body: '<div class="ns-expr">' + v.target + '</div>' + iconRow(v.given, '🟠') + '<div class="ns-q"></div>',
          zh: '要凑成 ' + v.target + '，还差几个？', en: 'To make ' + v.target + ', how many more?' };
      case 'composition/pair_makes':
        return { body: '<div class="ns-expr">' + v.target + '</div>', zh: '哪一对加起来正好是 ' + v.target + '？', en: 'Which pair adds up to exactly ' + v.target + '?' };
      case 'composition/make_ten':
        return { body: '<div class="ns-expr">' + v.number + ' + ? = ' + (Math.floor(v.number / 10) * 10 + 10) + '</div>' + frameHtml(v.number),
          zh: '再加几，凑成下一个整十？', en: 'How many more make the next ten?' };
      case 'composition/split_tens':
        return { body: '<div class="ns-expr">' + v.target + '</div>', zh: '哪一种拆法是对的？', en: 'Which split is right?' };
      case 'order/place':
        return { body: '<div class="ns-expr">' + v.target + '</div><div id="ns-widget"></div>', zh: '把 ' + v.target + ' 放到数轴上正确的位置（点一下刻度）', en: 'Tap where ' + v.target + ' goes on the number line' };
      case 'quantity/make':
        return { body: '<div class="ns-expr">' + v.target + '</div><div id="ns-widget"></div>', zh: '拿出 ' + v.target + ' 个（一个一个点）', en: 'Take ' + v.target + ' (tap them one by one)' };
      case 'representation/build_frame':
        return { body: '<div class="ns-expr">' + v.target + '</div><div id="ns-widget"></div>', zh: '在十格阵里涂出 ' + v.target + ' 个', en: 'Fill ' + v.target + ' dots in the ten-frames' };
      case 'representation/build_tens':
        return { body: '<div class="ns-expr">' + v.target + '</div><div id="ns-widget"></div>', zh: '用「十」和「一」搭出 ' + v.target, en: 'Build ' + v.target + ' with tens and ones' };
      case 'composition/split_cut':
        return { body: '<div class="ns-expr">' + v.n + '</div><div id="ns-widget"></div>',
          zh: v.equal ? '把 ' + v.n + ' 个分成一样多的两份（点一下分开的位置）' : '把 ' + v.n + ' 个分成两份，左边 ' + v.a + ' 个（点一下分开的位置）',
          en: v.equal ? 'Split ' + v.n + ' into two equal parts (tap where to cut)' : 'Split ' + v.n + ' so the left side has ' + v.a + ' (tap where to cut)' };
      case 'representation/multi':
        return { body: '<div class="ns-expr">' + v.n + '</div><div id="ns-widget"></div>', zh: '选出所有表示 ' + v.n + ' 的(可以选好几个)', en: 'Pick every card that means ' + v.n + ' (more than one)' };
      case 'composition/count_ways':
        return { body: '<div class="ns-expr">' + v.n + '</div>', zh: v.tens ? '把 ' + v.n + ' 拆成两个整十数,有几种拆法?' : '把 ' + v.n + ' 拆成两份,有几种不同的拆法?', en: v.tens ? 'Split ' + v.n + ' into two whole tens — how many ways?' : 'Split ' + v.n + ' into two parts — how many different ways?' };
      case 'composition/valid_check':
        return { body: '<div class="ns-expr">' + v.n + '</div>', zh: '哪一对加起来不等于 ' + v.n + '?', en: 'Which pair does not add up to ' + v.n + '?' };
      case 'estimation/few_many':
        return { body: '<div class="ns-flash-zone"' + flashStyle(v) + '>' + iconsHtml(v.dots, '#', {}) + '</div>', flash: v.flashMs, zh: '刚才是很少还是很多?', en: 'Was that very few, or a lot?' };
      case 'estimation/bucket':
        return { body: '<div class="ns-flash-zone"' + flashStyle(v) + '>' + iconsHtml(v.dots, '#', { scatter: v.scatter }) + '</div>', flash: v.flashMs, zh: '大约有多少个？', en: 'About how many?' };
      case 'estimation/reasonable':
        return { body: '<div class="ns-expr">' + v.a + ' + ' + v.b + ' ≈ ?</div>', zh: '不用算准，哪个答案最合理？', en: 'No exact sum — which answer is most reasonable?' };
      case 'operation/change':
        return { body: '<div class="ns-group">' + iconRow(v.start, v.icon) + '</div><div class="ns-expr">' + (v.add ? '＋' : '－') + ' ' + v.delta + '</div>',
          zh: v.add ? '又拿来 ' + v.delta + ' 个，现在比刚才……' : '拿走了 ' + v.delta + ' 个，现在比刚才……', en: v.add ? 'Then ' + v.delta + ' more came. Now there are…' : v.delta + ' were taken away. Now there are…' };
      case 'operation/result':
        return { body: '<div class="ns-expr">' + v.start + ' ' + (v.add ? '＋' : '－') + ' ' + v.delta + ' = ?</div>', zh: '变化以后是多少？', en: 'What is it after the change?' };
      case 'operation/reasonable':
        return { body: '<div class="ns-expr">' + v.a + ' + ' + v.b + ' ≈ ?</div>', zh: '不用算准，哪个答案最合理？', en: 'No exact sum — which answer is most reasonable?' };
      case 'magnitude/which_big':
        return { body: '<div class="ns-pair"><div class="ns-group">' + iconRow(v.left, '●') + '</div><div class="ns-group">' + iconRow(v.right, '●') + '</div></div>',
          zh: '哪一堆数量多？', en: 'Which pile is much bigger?' };
      case 'magnitude/how_many_times':
        return { body: '<div class="ns-pair"><div class="ns-group">' + iconRow(v.small, '🟦') + '</div><div class="ns-group">' + iconRow(v.big, '🟦') + '</div></div>',
          zh: v.big + ' 是 ' + v.small + ' 的几倍？', en: v.big + ' is how many times ' + v.small + '?' };
      case 'magnitude/scale':
        return { body: '<div class="ns-group">' + iconRow(10, v.base === 1 ? '·' : '🔟') + '</div>', zh: '10 个 ' + v.base + ' 合起来是多少？', en: '10 groups of ' + v.base + ' make…?' };
    }
    return { body: '', zh: '选出正确答案。', en: 'Choose the correct answer.' };
  }


  // ── Interactive widgets (second batch) ────────────────────────────────────
  var _cur = { value: null };

  function widget(q, host) {
    var v = q.view || {};
    _cur.value = null;
    var key = q.type + '/' + q.mode;
    if (key === 'order/place') {
      var h = '<div class="ns-tickrow">';
      for (var n = v.lo; n <= v.hi; n += v.step) {
        h += '<button class="ns-tick" data-v="' + n + '"><span class="dot"></span><span class="bar"></span><span class="lab">' +
          (n === v.lo || n === v.hi || n % v.label === 0 ? n : '') + '</span></button>';
      }
      host.innerHTML = h + '</div><div class="ns-axis"></div>';
      host.addEventListener('click', function (e) {
        var b = e.target.closest('.ns-tick'); if (!b) return;
        _cur.value = Number(b.dataset.v);
        host.querySelectorAll('.ns-tick').forEach(function (t) { t.classList.toggle('sel', t === b); });
      });
    } else if (key === 'quantity/make') {
      var pool = '';
      for (var i = 0; i < v.pool; i++) pool += '<button class="ns-tap" data-i="' + i + '">' + v.icon + '</button>';
      host.innerHTML = '<div class="ns-pool" id="ns-pool">' + pool + '</div><div class="ns-count"><span class="zh">盘子里的会变灰，再点一下可以拿回来</span><span class="en">Tapped ones turn grey; tap again to take back</span></div>';
      host.addEventListener('click', function (e) {
        var b = e.target.closest('.ns-tap'); if (!b) return;
        b.classList.toggle('on');
        _cur.value = host.querySelectorAll('.ns-tap.on').length;
      });
      _cur.value = 0;
    } else if (key === 'representation/build_frame') {
      var fr = '';
      for (var f = 0; f < 2; f++) {
        var cells = '';
        for (var c = 0; c < 10; c++) cells += '<button class="ns-fcell"></button>';
        fr += '<div class="ns-frame" style="grid-template-columns:repeat(5,36px)">' + cells + '</div>';
      }
      host.innerHTML = '<div class="ns-frames">' + fr + '</div>';
      _cur.value = 0;
      host.addEventListener('click', function (e) {
        var b = e.target.closest('.ns-fcell'); if (!b) return;
        b.classList.toggle('on');
        _cur.value = host.querySelectorAll('.ns-fcell.on').length;
      });
    } else if (key === 'representation/build_tens') {
      _cur.value = 0;
      var draw = function () {
        var t = Math.floor(_cur.value / 10), o = _cur.value % 10, b = '';
        for (var i = 0; i < t; i++) b += '<span class="ns-ten"></span>';
        for (var j = 0; j < o; j++) b += '<span class="ns-one"></span>';
        host.querySelector('.ns-blocks').innerHTML = b;
        host.querySelector('.ns-count').textContent = '';
      };
      host.innerHTML = '<div class="ns-blocks"></div><div class="ns-count"></div><div class="ns-pair">' +
        '<button class="ns-btn" data-d="10">+ 10</button><button class="ns-btn" data-d="1">+ 1</button>' +
        '<button class="ns-btn" data-d="0">' + bi('清空', 'Clear') + '</button></div>';
      host.addEventListener('click', function (e) {
        var b = e.target.closest('.ns-btn'); if (!b) return;
        var d = Number(b.dataset.d);
        _cur.value = d === 0 ? 0 : Math.min(99, _cur.value + d);
        draw();
      });
    } else if (key === 'representation/multi') {
      _cur.value = [];
      host.innerHTML = '<div class="ns-mcards">' + v.cards.map(function (c, i) { return '<button class="ns-mcard" data-i="' + i + '">' + faceHtml(c.face) + '</button>'; }).join('') + '</div>';
      host.addEventListener('click', function (e) {
        var b = e.target.closest('.ns-mcard'); if (!b) return;
        b.classList.toggle('sel');
        _cur.value = [].map.call(host.querySelectorAll('.ns-mcard.sel'), function (x) { return Number(x.dataset.i); }).sort(function (a, b2) { return a - b2; });
      });
    } else if (key === 'composition/split_cut') {
      var row = '';
      for (var k = 0; k < v.n; k++) {
        row += '<span class="it" data-k="' + k + '">' + v.icon + '</span>';
        if (k < v.n - 1) row += '<button class="gap" data-cut="' + (k + 1) + '"></button>';
      }
      host.innerHTML = '<div class="ns-cutrow">' + row + '</div><div class="ns-count" id="ns-cutinfo"></div>';
      host.addEventListener('click', function (e) {
        var b = e.target.closest('.gap'); if (!b) return;
        var cut = Number(b.dataset.cut); _cur.value = cut;
        host.querySelectorAll('.gap').forEach(function (x) { x.classList.toggle('cut', x === b); });
        host.querySelectorAll('.it').forEach(function (x) { var l = Number(x.dataset.k) < cut; x.classList.toggle('l', l); x.classList.toggle('r', !l); });
        host.querySelector('#ns-cutinfo').textContent = cut + ' + ' + (v.n - cut);
      });
    }
  }

  function renderSequence(q, container) {
    var sc = scene(q), chip = CHIPS[q.type] || ['', ''];
    container.innerHTML = '<div class="ns-wrap"><span class="ns-chip">' + bi(chip[0], chip[1]) + '</span>' + sc.body +
      '<div class="ns-q">' + bi(sc.zh, sc.en) + '</div></div>';
    var host = container.querySelector('#ns-widget');
    if (host) widget(q, host);
    var zone = container.querySelector('.ns-flash-zone');
    if (zone && sc.flash) setTimeout(function () { if (zone.parentNode) zone.classList.add('ns-flash-hidden'); }, sc.flash);
  }

  function renderOption(opt, q) {
    var v = q.view || {};
    if (q.interactive) return '<div class="ns-opt"><div class="ns-opt-val" style="font-size:22px">' + bi('✔ 确定', '✔ Check') + '</div></div>';
    if (opt && typeof opt === 'object' && !Array.isArray(opt)) return '<div class="ns-opt">' + faceHtml(opt.face) + '</div>';
    if (Array.isArray(opt)) return '<div class="ns-opt"><div class="ns-opt-pair">' + opt[0] + ' + ' + opt[1] + '</div></div>';
    if (opt === 'few') return '<div class="ns-opt"><div class="ns-opt-val">' + bi('很少', 'Few') + '</div></div>';
    if (opt === 'many') return '<div class="ns-opt"><div class="ns-opt-val">' + bi('很多', 'Many') + '</div></div>';
    if (opt === 'more') return '<div class="ns-opt"><div class="ns-opt-val">' + bi('更多', 'More') + '</div></div>';
    if (opt === 'less') return '<div class="ns-opt"><div class="ns-opt-val">' + bi('更少', 'Fewer') + '</div></div>';
    if (opt === 'same') return '<div class="ns-opt"><div class="ns-opt-val">' + bi('一样多', 'Same') + '</div></div>';
    if (opt === 'left' || opt === 'right') {
      if (q.type === 'order' && q.mode === 'closer') return '<div class="ns-opt"><div class="ns-opt-val">' + v[opt] + '</div></div>';
      var l = opt === 'left';
      return '<div class="ns-opt"><div class="ns-opt-val">' + bi(l ? '左边' : '右边', l ? 'Left' : 'Right') + '</div></div>';
    }
    return '<div class="ns-opt"><div class="ns-opt-val">' + String(opt) + '</div></div>';
  }

  function checkAnswer(selected, q) {
    if (q.interactive) return JSON.stringify(_cur.value) === JSON.stringify(q.target);
    return JSON.stringify(selected) === JSON.stringify(q.options[q.answer]);
  }

  function getVoiceText(q) {
    var sc = scene(q);
    return shell.lang === 'zh' ? sc.zh : sc.en;
  }

  // ── Units ──────────────────────────────────────────────────────────────────

  var UNIT_META = {
    L1: { nameZh: 'K1 · 一眼看出多少', nameEn: 'K1 · Seeing Numbers', descZh: '5 以内：一眼数量、不同的表示、数序、初识整体与部分。', descEn: 'Within 5: quantity at a glance, different faces of a number, order, first whole-and-parts.' },
    L2: { nameZh: 'K2 · 表示、估计、拆分', nameEn: 'K2 · Representing, Estimating, Splitting', descZh: '10 以内：数的多种表示、离谁更近、估计、增减变化。', descEn: 'Within 10: faces of a number, closer to which, estimating, more or less.' },
    L3: { nameZh: 'G1 · 数是怎样搭起来的', nameEn: 'G1 · How Numbers Are Built', descZh: '20 以内：十格阵、凑十、规律数列、估计、运算变化。', descEn: 'Within 20: ten-frames, making ten, number runs, estimating, change.' },
    L4: { nameZh: 'G2 · 灵活地用数', nameEn: 'G2 · Thinking With Numbers', descZh: '100 以内：几十几、数轴、拆成整十、合理的估算、数量级。', descEn: 'Within 100: tens and ones, the number line, splitting into tens, sensible estimates, scale.' }
  };
  var GRADE_OF = { L1: 'K1', L2: 'K2', L3: 'G1', L4: 'G2' };

  var UNITS = ['L1', 'L2', 'L3', 'L4'].map(function (id) {
    return Object.assign({ id: id, icon: '🔢', questions: NS_GEN.generate(GRADE_OF[id], SESSION_SIZE) }, UNIT_META[id]);
  });

  // shell calls getReportContext right after the result screen is built, so
  // refill on the next tick — the report must describe the questions just seen.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) { if (u.id === unitId) u.questions = NS_GEN.generate(GRADE_OF[u.id], SESSION_SIZE); });
    }, 0);
  }

  shell.createGame({
    id: 'learning-math-number-sense',
    theme: { primary: '#d97706', primary2: '#f59e0b', bg: '#fffbeb' },
    gui: {
      header: { show: true, showBack: true },
      language: { enabled: true, default: 'en' },
      audio: { music: { enabled: true, defaultOn: false }, sound: { enabled: true, defaultOn: true } },
      history: { enabled: true },
      help: {
        enabled: true,
        contentZh: '不用心算，凭感觉判断数量、数的不同表示、数序与远近、整体与部分、估计和变化。',
        contentEn: 'Judge quantity, the different faces of a number, order and distance, whole-and-parts, estimates and change by feel — not by calculating.'
      }
    },
    title: { zh: '🔢 数感', en: '🔢 Number Sense' },
    subtitle: { zh: '数量 · 表示 · 数序 · 拆分 · 估计 · 变化', en: 'Quantity · Representation · Order · Split · Estimate · Change' },
    passScore: 6,
    units: UNITS,

    renderSequence: renderSequence,
    renderOption: renderOption,
    checkAnswer: checkAnswer,
    getVoiceText: getVoiceText,

    onAnswer: function (selected, q, correct) {
      // the lone 确定 button would stay locked after a wrong try; re-open it for a retry
      if (q.interactive && !correct) setTimeout(function () {
        var b = document.querySelector('.s1-opt'); if (b) { b.disabled = false; b.classList.remove('s1-wrong'); }
      }, 450);
    },

    registerRootGenes: function (ctx) { return genesFor((ctx && ctx.unit) || {}); },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var levelId = String(unit.id || 'L1');
      var type = _dominantType(unit) || 'quantity';
      refillUnit(levelId);
      return buildRadarContext(levelId, type, {});
    }
  });
}());
