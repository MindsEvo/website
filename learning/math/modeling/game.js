'use strict';

/**
 * Learning Math Modeling — Shell-1 wiring.
 *
 * Radar contract: LEVEL_GRADE, MODELING_TYPE_OF and the `base` table
 * inside difficultyAxisFor() are read as literal text by
 * metadata/validate.js (S2/S3/S4) against metadata/metathinking/modeling.json.
 * Keep them as flat, literal object declarations — do not compute them.
 */
(function () {
  'use strict';

  var MODULE_ID = 'modeling';
  var MODULE_TYPE = 'metathinking';
  var SOURCE_GAME_ID = 'learning-math-modeling';

  var LEVEL_GRADE = { L1: 'K1', L2: 'K2', L3: 'G1', L4: 'G2' };

  // unit.id -> levelId. One id per themed unit: '<levelId>-<key>' (generator.js).
  var UNIT_LEVEL = {
    'L1-map': 'L1', 'L1-group': 'L1', 'L1-space': 'L1',
    'L2-represent': 'L2', 'L2-relation': 'L2', 'L2-process': 'L2', 'L2-rule': 'L2',
    'L3-story': 'L3', 'L3-route': 'L3', 'L3-link': 'L3', 'L3-rule': 'L3',
    'L4-quant': 'L4', 'L4-choose': 'L4', 'L4-space': 'L4', 'L4-system': 'L4', 'L4-rule': 'L4'
  };

  // question.type -> modeling.json typeTree id.
  var MODELING_TYPE_OF = {
    mapping: 'mapping',
    grouping: 'grouping',
    relationship: 'relationship',
    spatial: 'spatial',
    process: 'process',
    quantitative: 'quantitative',
    rule: 'rule'
  };

  // question.type -> the single rootGene it trains.
  var TYPE_GENES = {
    mapping: 'RG.MODELING.MAPPING.BASIC',
    grouping: 'RG.MODELING.GROUPING.PURPOSE',
    relationship: 'RG.MODELING.RELATIONSHIP.BASIC',
    spatial: 'RG.MODELING.SPATIAL.BASIC',
    process: 'RG.MODELING.PROCESS.SEQUENCE',
    quantitative: 'RG.MODELING.EQUATION.RELATION',
    rule: 'RG.MODELING.RULE.SYSTEM'
  };

  function injectModelingStyles() {
    if (document.getElementById('mm-shell-style')) return;
    var s = document.createElement('style');
    s.id = 'mm-shell-style';
    s.textContent = [
      '.mystery{color:#0d9488;font-weight:900;}',
      '.mm-wrap{display:grid;gap:12px;justify-items:center;}',
      '.mm-chip{font-size:12px;font-weight:800;padding:4px 10px;border-radius:999px;background:#ecfdf5;color:#065f46;border:1px solid #99f6e4;}',
      '.mm-q{font-size:20px;font-weight:900;color:#065f46;line-height:1.4;text-align:center;max-width:320px;}',
      '.mm-symbol{font-size:56px;line-height:1;}',
      '.mm-opt{display:grid;gap:6px;justify-items:center;align-content:center;min-height:68px;}',
      '.mm-opt-symbol{font-size:32px;line-height:1;}',
      '.mm-opt-text{font-size:16px;font-weight:800;color:#0f172a;}',
      '.mm-story{font-size:18px;font-weight:800;color:#0f172a;text-align:center;max-width:320px;line-height:1.5;background:#f0fdfa;border-radius:12px;padding:10px 14px;}',
      '.mm-rule{font-size:16px;font-weight:900;color:#7c2d12;background:#ffedd5;border:2px dashed #fb923c;border-radius:12px;padding:8px 14px;text-align:center;}',
      '.mm-big{font-size:34px;line-height:1.25;text-align:center;word-break:break-all;max-width:320px;background:#fff;border:2px solid #99f6e4;border-radius:14px;padding:6px 14px;}',
      '.mm-legend{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;background:#fff;border:2px solid #99f6e4;border-radius:12px;padding:8px 12px;font-size:24px;font-weight:800;}',
      '.mm-legend span{white-space:nowrap;}',
      '.mm-grid{display:grid;gap:4px;}',
      '.mm-cell{display:flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:10px;background:#fff;border:2px solid #99f6e4;font-size:26px;}',
      '.mm-axis{display:flex;align-items:center;justify-content:center;width:46px;height:22px;font-size:13px;font-weight:900;color:#0d9488;}',
      '.mm-axisr{width:22px;height:46px;}',
      '.mm-chain{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;font-size:34px;}',
      '.mm-cap{font-size:12px;font-weight:800;color:#475569;line-height:1.1;margin-top:2px;}',
      '.mm-step-e{font-size:32px;line-height:1.1;}',
      '.mm-step{position:relative;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;min-width:60px;min-height:62px;padding:2px 4px;background:#fff;border:2px solid #99f6e4;border-radius:12px;}',
      '.mm-step b{position:absolute;left:-6px;top:-8px;width:20px;height:20px;border-radius:50%;background:#0d9488;color:#fff;font-size:12px;line-height:20px;text-align:center;}',
      '.mm-arrow{color:#0d9488;font-size:22px;font-weight:900;}',
      '.mm-pairs{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;font-size:26px;}',
      '.mm-pair{background:#fff;border:2px solid #99f6e4;border-radius:12px;padding:4px 10px;}',
      '.mm-bal{display:flex;align-items:center;gap:14px;font-size:30px;font-weight:900;}',
      '.mm-bal .box{min-width:70px;padding:8px 10px;border-radius:12px;background:#fff;border:2px solid #99f6e4;text-align:center;}',
      '.mm-dots{display:inline-flex;gap:3px;align-items:center;flex-wrap:wrap;justify-content:center;max-width:150px;}',
      '.mm-dots i{display:block;width:14px;height:14px;border-radius:50%;background:#2563eb;}',
      '.mm-dots i.b{background:#7c3aed;}.mm-dots i.x{position:relative;opacity:.45;}',
      '.mm-dots i.x::after{content:"✕";position:absolute;left:0;top:-3px;width:14px;text-align:center;font-style:normal;font-size:14px;line-height:20px;color:#dc2626;font-weight:900;}',
      '.mm-dots em{font-style:normal;font-weight:900;color:#0d9488;margin:0 3px;}'
    ].join('');
    document.head.appendChild(s);
  }
  injectModelingStyles();

  /**
   * The five difficulty axes declared in modeling.json, per level.
   * A representative axis per (levelId, type) pair for unit-level
   * reporting — each question also carries its own difficultyAxis,
   * used for authoring, not for the radar report.
   */
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
    if (type === 'grouping' && (levelId === 'L3' || levelId === 'L4')) {
      axis.transfer_complexity = 'strategy';
    }
    return axis;
  }

  function buildRadarContext(levelId, type, extra) {
    var ctx = {
      moduleId: MODULE_ID,
      moduleType: MODULE_TYPE,
      levelId: levelId,
      gradeCode: LEVEL_GRADE[levelId] || null,
      modelingType: MODELING_TYPE_OF[type] || null,
      difficultyAxis: difficultyAxisFor(levelId, type),
      sourceGameId: SOURCE_GAME_ID
    };
    return extra ? Object.assign(ctx, extra) : ctx;
  }

  // A unit mixes types/levels in varying proportion. The dominant type (by
  // question count, ties broken mapping > grouping > spatial > quantitative)
  // and dominant levelId (unit.id is not itself a levelId here — unlike
  // number-sense — so it must be read off the questions) stand in for the
  // whole session in getReportContext(); registerRootGenes() instead
  // reports every gene actually touched.
  function _dominantType(unit) {
    var counts = {};
    (unit.questions || []).forEach(function (q) {
      counts[q.type] = (counts[q.type] || 0) + 1;
    });
    var best = null;
    var bestCount = -1;
    ['mapping', 'grouping', 'relationship', 'spatial', 'process', 'quantitative', 'rule'].forEach(function (t) {
      var c = counts[t] || 0;
      if (c > bestCount) { best = t; bestCount = c; }
    });
    return best;
  }

  function _dominantLevel(unit) {
    var counts = {};
    (unit.questions || []).forEach(function (q) {
      counts[q.levelId] = (counts[q.levelId] || 0) + 1;
    });
    var best = null;
    var bestCount = -1;
    ['L1', 'L2', 'L3', 'L4'].forEach(function (l) {
      var c = counts[l] || 0;
      if (c > bestCount) { best = l; bestCount = c; }
    });
    return best;
  }

  function _uniqueOf(qs, key) {
    return qs.map(function (q) { return q[key]; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
  }
  function _dominantOf(qs, key) {
    var t = {}, best = null, n = 0;
    qs.forEach(function (q) { var v = q[key]; if (!v) return; t[v] = (t[v] || 0) + 1; if (t[v] > n) { n = t[v]; best = v; } });
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

  // ── Units: fresh questions from MD_GEN, refilled after every finished session ──
  var SESSION_SIZE = 10;
  var _units = {};

  function buildUnits(levelId) {
    return MD_GEN.GRADE_UNITS[LEVEL_KEY[levelId]].map(function (d) {
      var id = levelId + '-' + d.key;
      var u = { id: id, icon: d.icon, nameZh: d.zh, nameEn: d.en, descZh: d.dzh, descEn: d.den,
        questions: MD_GEN.generate(LEVEL_KEY[levelId], SESSION_SIZE, d.key) };
      _units[id] = u;
      return u;
    });
  }
  var LEVEL_KEY = { L1: 'K1', L2: 'K2', L3: 'G1', L4: 'G2' };
  function refillUnit(unitId) {
    setTimeout(function () {
      var u = _units[unitId];
      if (u) u.questions = MD_GEN.generate(LEVEL_KEY[UNIT_LEVEL[unitId]], SESSION_SIZE, unitId.split('-')[1]);
    }, 0);
  }

  // ── Rendering (generator.js scene blocks / option tokens) ──────────────────
  function bi(zh, en) { return '<span class="zh">' + zh + '</span><span class="en">' + en + '</span>'; }

  function dotsHtml(tok) {
    var m = /^dots:(\d+)(?:([+-])(\d+))?$/.exec(tok), a = Number(m[1]), b = m[3] ? Number(m[3]) : 0, o = '', i;
    if (m[2] === '+') {
      for (i = 0; i < a; i++) o += '<i></i>';
      o += '<em>+</em>';
      for (i = 0; i < b; i++) o += '<i class="b"></i>';
    } else if (m[2] === '-') {
      for (i = 0; i < a - b; i++) o += '<i></i>';
      for (i = 0; i < b; i++) o += '<i class="x"></i>';
    } else {
      for (i = 0; i < a; i++) o += '<i></i>';
    }
    return '<span class="mm-dots">' + o + '</span>';
  }

  function sceneHtml(blocks) {
    return blocks.map(function (b) {
      switch (b.k) {
        case 'story': return '<div class="mm-story">' + bi(b.zh, b.en) + '</div>';
        case 'rule':  return '<div class="mm-rule">' + bi(b.zh, b.en) + '</div>';
        case 'big':   return '<div class="mm-big">' + b.v + '</div>';
        case 'legend':
          return '<div class="mm-legend">' + b.items.map(function (p) { return '<span>' + p[0] + ' = ' + p[1] + '</span>'; }).join('') + '</div>';
        case 'grid': {
          var h = '<div class="mm-grid" style="grid-template-columns:' + (b.axes ? '22px ' : '') + 'repeat(' + b.cols + ',46px)">';
          var rows = Math.ceil(b.cells.length / b.cols), r, c;
          if (b.axes) { h += '<div></div>'; for (c = 1; c <= b.cols; c++) h += '<div class="mm-axis">' + c + '</div>'; }
          for (r = 0; r < rows; r++) {
            if (b.axes) h += '<div class="mm-axis mm-axisr">' + (r + 1) + '</div>';
            for (c = 0; c < b.cols; c++) h += '<div class="mm-cell">' + (b.cells[r * b.cols + c] || '') + '</div>';
          }
          return h + '</div>';
        }
        case 'chain':
          return '<div class="mm-chain">' + b.steps.map(function (s, i) {
            var p = s === '?' ? null : s.split('~');
            var inner = s === '?' ? '<span class="mystery">?</span>' : '<span class="mm-step-e">' + p[0] + '</span>' + (p[1] ? '<span class="mm-cap">' + bi(p[1], p[2]) + '</span>' : '');
            return (i ? '<span class="mm-arrow">→</span>' : '') + '<span class="mm-step">' + (b.numbered ? '<b>' + (i + 1) + '</b>' : '') + inner + '</span>';
          }).join('') + '</div>';
        case 'graph':
          return '<div class="mm-pairs">' + b.pairs.map(function (p) { return '<span class="mm-pair">' + p[0] + ' — ' + p[1] + '</span>'; }).join('') + '</div>';
        case 'balance':
          return '<div class="mm-bal"><span class="box">' + b.left.join(' + ') + '</span><span>⚖️</span><span class="box">' + b.right + '</span></div>';
      }
      return '';
    }).join('');
  }

  // Prompts write "小熊（🐻）": speak the word, drop the bracketed picture.
  function _speakable(t) {
    return t.replace(/\s*[（(][^）)]*[）)]/g, function (m) { return /\p{Extended_Pictographic}/u.test(m) ? '' : m; })
            .replace(/\p{Extended_Pictographic}\uFE0F?/gu, '').replace(/\s{2,}/g, ' ').trim();
  }

  var CHIP = {
    mapping: ['对应模型', 'Correspondence'], grouping: ['分类模型', 'Grouping'], relationship: ['关系模型', 'Relationship'],
    spatial: ['空间模型', 'Spatial'], process: ['过程模型', 'Process'], quantitative: ['数量模型', 'Quantitative'], rule: ['规则模型', 'Rule']
  };

  function _renderQuestion(q, container) {
    var c = CHIP[q.type];
    container.innerHTML = '<div class="mm-wrap"><span class="mm-chip">' + bi(c[0], c[1]) + '</span>' + sceneHtml(q.scene) +
      '<div class="mm-q">' + bi(q.promptZh, q.promptEn) + '</div></div>';
  }


  // ── Interactive activities (match / build / group) ─────────────────────────
  // Reuses comparison's runtimes through ActivityRunner, launched from ONE "🎮"
  // button + menu in the grade page header (same idiom as pattern). Every
  // variant is generated fresh at launch.
  function pk(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shf(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function rep(e, n) { return new Array(n + 1).join(e); }
  function ri2(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function vid(id) { return id + '-' + Math.floor(Math.random() * 1e6); }

  function _matchDots() {
    var ns = shf([2, 3, 4, 5]).slice(0, 3), th = shf(['🍎', '🐟', '🐰', '🍪']).slice(0, 3);
    return { seqMode: true, compareKey: 'signature',
      leftItems:  shf(ns.map(function (n, i) { return { id: 'L' + i, emoji: rep(th[i], n), signature: 'n' + n, nameZh: '实物', nameEn: 'Things' }; })),
      rightSlots: shf(ns.map(function (n, i) { return { id: 'R' + i, emoji: rep('🔵', n), signature: 'n' + n, nameZh: '点', nameEn: 'Dots' }; })) };
  }
  function _matchStory() {
    var th = shf(['🍓', '🍎', '🍪', '🐟']).slice(0, 3), kinds = shf(['+', '+', '-']), out = { l: [], r: [] };
    var seen = {};
    kinds.forEach(function (k, i) {
      var a, b, key;
      do { a = k === '+' ? ri2(2, 8) : ri2(5, 12); b = k === '+' ? ri2(1, 9) : ri2(1, a - 2); key = a + k + b; } while (seen[key] || (k === '+' && a + b > 20));
      seen[key] = 1;
      out.l.push({ id: 'L' + i, emoji: rep(th[i], a) + (k === '+' ? ' ➕ ' : ' ➖ ') + rep(th[i], b), signature: key, nameZh: '情境', nameEn: 'Story' });
      out.r.push({ id: 'R' + i, emoji: a + (k === '+' ? ' + ' : ' − ') + b, signature: key, nameZh: '算式', nameEn: 'Equation' });
    });
    return { seqMode: true, compareKey: 'signature', leftItems: shf(out.l), rightSlots: shf(out.r) };
  }
  var BEST = [
    { k: 'eq', e: '📦', zh: '3 盒各 4 个，一共几个', en: '3 boxes of 4 — how many in all' },
    { k: 'table', e: '🌡️', zh: '记下周一到周五每天的气温', en: 'Record each weekday\'s temperature' },
    { k: 'map', e: '🏫', zh: '告诉别人从家到学校怎么走', en: 'Tell someone the way from home to school' },
    { k: 'bar', e: '🏆', zh: '一眼比较 4 个班谁的人最多', en: 'See which of 4 classes is biggest' }
  ];
  var BEST_R = { eq: ['🔢', '算式', 'Equation'], table: ['📋', '表格', 'Table'], map: ['🗺️', '地图', 'Map'], bar: ['📊', '柱状图', 'Bar chart'] };
  function _matchModel() {
    var set = shf(BEST).slice(0, 4);
    return { seqMode: true, compareKey: 'signature',
      leftItems:  shf(set.map(function (b, i) { return { id: 'L' + i, emoji: b.e, signature: b.k, nameZh: b.zh, nameEn: b.en }; })),
      rightSlots: shf(set.map(function (b, i) { var r = BEST_R[b.k]; return { id: 'R' + i, emoji: r[0], signature: b.k, nameZh: r[1], nameEn: r[2] }; })) };
  }

  // build: arrange tiles into the equation the story tells (order matters)
  function _buildEq(g) {
    var a, b, c, op, story, storyEn, th = pk(['🍓', '🍎', '🍪', '🐟']);
    var mode = g === 'L4' ? pk(['+', '-', 'x']) : pk(['+', '-']);
    do {
      if (mode === 'x') { a = ri2(2, 9); b = ri2(2, 9); c = a * b; op = '×'; }
      else if (mode === '+') { a = ri2(2, g === 'L4' ? 60 : 9); b = ri2(2, g === 'L4' ? 30 : 9); c = a + b; op = '+'; }
      else { a = ri2(g === 'L4' ? 30 : 6, g === 'L4' ? 90 : 15); b = ri2(2, a - 2); c = a - b; op = '−'; }
    } while (a === b || a === c || b === c || c > (g === 'L4' ? 100 : 20) && mode !== 'x');
    story = mode === 'x' ? a + ' 盒，每盒 ' + b + ' 个' + th : mode === '+' ? '有 ' + a + ' 个' + th + '，又放进 ' + b + ' 个' : '有 ' + a + ' 个' + th + '，拿走 ' + b + ' 个';
    storyEn = mode === 'x' ? a + ' boxes with ' + b + ' ' + th + ' each' : mode === '+' ? a + ' ' + th + ', and ' + b + ' more are put in' : a + ' ' + th + ', and ' + b + ' are taken away';
    var tiles = [String(a), op, String(b), '=', String(c)].map(function (t, i) { return { id: 'T' + i, emoji: t }; });
    return { targetOrder: tiles.map(function (t) { return t.id; }), lowZh: '先', lowEn: 'First', highZh: '后', highEn: 'Last',
      items: shf(tiles), instrZh: story + '。把卡片排成算式 →', instrEn: storyEn + '. Arrange the cards into the equation →' };
  }
  function _buildChain() {
    var ch = pk(MD_GEN.CHAINS), items = ch.map(function (s, i) { return { id: 'S' + i, emoji: s[0], captionZh: s[1], captionEn: s[2] }; });
    return { targetOrder: items.map(function (t) { return t.id; }), lowZh: '先', lowEn: 'First', highZh: '后', highEn: 'Last',
      items: shf(items), instrZh: '把这个过程的步骤按先后排好 →', instrEn: 'Put the steps of this process in order →' };
  }

  // group: two bins decided by the stated purpose
  function _group(n, passMode) {
    var I = MD_GEN.ITEMS, attr = pk(['k', 'c']), vals = {};
    I.forEach(function (i) { vals[i[attr]] = 1; });
    var v = shf(Object.keys(vals)), A = v[0], B = v[1];
    var pool = shf(I.filter(function (i) { return i[attr] === A || i[attr] === B; }));
    var chosen = []; [A, B].forEach(function (x) { chosen = chosen.concat(pool.filter(function (i) { return i[attr] === x; }).slice(0, n / 2)); });
    var nm = attr === 'k' ? MD_GEN.KIND : MD_GEN.COLOUR;
    var bins = passMode
      ? [{ id: 'yes', emoji: '✅', labelZh: '能通过', labelEn: 'Can pass' }, { id: 'no', emoji: '❌', labelZh: '不能通过', labelEn: 'Cannot pass' }]
      : [{ id: 'a', emoji: '🧺', labelZh: nm[A][0], labelEn: nm[A][1] }, { id: 'b', emoji: '🧺', labelZh: nm[B][0], labelEn: nm[B][1] }];
    var items = shf(chosen).map(function (i, k) {
      var w = MD_GEN.EMO[i.e] || ['', ''];
      return { id: 'G' + k, emoji: i.e, nameZh: w[0], nameEn: w[1], bin: passMode ? (i[attr] === A ? 'yes' : 'no') : (i[attr] === A ? 'a' : 'b') };
    });
    var purposeZh = attr === 'k' ? '种类' : '颜色', purposeEn = attr === 'k' ? 'kind' : 'colour';
    return { bins: bins, items: items,
      hintZh: passMode ? '规则：只有' + nm[A][0] + '能通过。把它们分开' : '这次的目的：按' + purposeZh + '分',
      hintEn: passMode ? 'Rule: only ' + nm[A][1] + ' passes. Sort them' : 'Purpose: group by ' + purposeEn };
  }


  // relationship / spatial drag games ------------------------------------------------
  var ANIMALS = ['🐻', '🐰', '🐱', '🐶', '🐵', '🐼'];
  function _nameOf(e, lang) { var w = MD_GEN.EMO[e]; return w ? (lang === 'zh' ? w[0] : w[1]) : e; }
  // K1 spatial: put each animal on the side of the tree the sentences say
  function _placeAnimals() {
    var an = shf(ANIMALS).slice(0, 3), sides = shf(['l', 'l', 'r']);
    if (Math.random() < 0.5) sides = shf(['l', 'r', 'r']);
    var items = an.map(function (e, i) { return { id: 'P' + i, emoji: e, nameZh: _nameOf(e, 'zh'), nameEn: _nameOf(e, 'en'), bin: sides[i] }; });
    var zh = items.map(function (i) { return i.nameZh + '在大树的' + (i.bin === 'l' ? '左边' : '右边'); }).join('，');
    var en = items.map(function (i) { return 'the ' + i.nameEn + ' is on the ' + (i.bin === 'l' ? 'left' : 'right') + ' of the tree'; }).join(', ');
    return { bins: [{ id: 'l', emoji: '🌳', labelZh: '大树的左边', labelEn: 'Left of the tree' }, { id: 'r', emoji: '🌳', labelZh: '大树的右边', labelEn: 'Right of the tree' }],
      items: items, hintZh: zh + '。把它们放到对的位置', hintEn: en.charAt(0).toUpperCase() + en.slice(1) + '. Put them in the right place' };
  }
  // K2/G1 relationship: line up left to right from "who is right of whom"
  function _buildOrder(n) {
    var an = shf(ANIMALS).slice(0, n), zh = [], en = [];
    for (var i = 0; i < n - 1; i++) {
      var A = an[i], B = an[i + 1], flip = Math.random() < 0.5;
      zh.push(flip ? _nameOf(B, 'zh') + '在' + _nameOf(A, 'zh') + '的右边' : _nameOf(A, 'zh') + '在' + _nameOf(B, 'zh') + '的左边');
      en.push(flip ? 'the ' + _nameOf(B, 'en') + ' is right of the ' + _nameOf(A, 'en') : 'the ' + _nameOf(A, 'en') + ' is left of the ' + _nameOf(B, 'en'));
    }
    zh = shf(zh); en = shf(en);
    var items = an.map(function (e, i) { return { id: 'O' + i, emoji: e, captionZh: _nameOf(e, 'zh'), captionEn: _nameOf(e, 'en') }; });
    return { targetOrder: items.map(function (t) { return t.id; }), lowZh: '左', lowEn: 'Left', highZh: '右', highEn: 'Right',
      items: shf(items), instrZh: zh.join('，') + '。从左到右排好 →', instrEn: en.join(', ').replace(/^t/, 'T') + '. Line them up from left to right →' };
  }

  var ACTS = {
    L1: [{ id: 'k1-match-dots', rt: 'match', type: 'mapping', abs: 'match', icon: '🔵', zh: '实物配点', en: 'Things to dots', make: _matchDots },
         { id: 'k1-group', rt: 'group', type: 'grouping', abs: 'build', icon: '🧺', zh: '按目的分一分', en: 'Group by purpose', make: function () { return _group(4, false); } },
         { id: 'k1-place', rt: 'group', type: 'spatial', abs: 'build', icon: '🌳', zh: '把动物放到位置上', en: 'Put animals in place', make: _placeAnimals }],
    L2: [{ id: 'k2-order', rt: 'sort', type: 'relationship', abs: 'build', icon: '↔️', zh: '照句子排队', en: 'Line up from the clues', make: function () { return _buildOrder(3); } },
         { id: 'k2-build-chain', rt: 'sort', type: 'process', abs: 'build', icon: '🪜', zh: '排出过程', en: 'Order the steps', make: _buildChain },
         { id: 'k2-group-rule', rt: 'group', type: 'rule', abs: 'use', icon: '🚪', zh: '规则小门', en: 'Rule door', make: function () { return _group(6, true); } }],
    L3: [{ id: 'g1-match-story', rt: 'match', type: 'quantitative', abs: 'match', icon: '🍓', zh: '情境配算式', en: 'Story to equation', make: _matchStory },
         { id: 'g1-build-eq', rt: 'sort', type: 'quantitative', abs: 'build', icon: '🧮', zh: '搭出算式', en: 'Build the equation', make: function () { return _buildEq('L3'); } },
         { id: 'g1-build-chain', rt: 'sort', type: 'process', abs: 'build', icon: '🪜', zh: '排出过程', en: 'Order the steps', make: _buildChain },
         { id: 'g1-order4', rt: 'sort', type: 'relationship', abs: 'build', icon: '↔️', zh: '照句子排 4 个', en: 'Line up four from the clues', make: function () { return _buildOrder(4); } }],
    L4: [{ id: 'g2-match-model', rt: 'match', type: 'quantitative', abs: 'evaluate', icon: '🧐', zh: '情境配最合适的表示', en: 'Situation to best model', make: _matchModel },
         { id: 'g2-build-eq', rt: 'sort', type: 'quantitative', abs: 'build', icon: '🧮', zh: '搭出算式', en: 'Build the equation', make: function () { return _buildEq('L4'); } },
         { id: 'g2-group-rule', rt: 'group', type: 'rule', abs: 'use', icon: '🚪', zh: '规则小门', en: 'Rule door', make: function () { return _group(8, true); } }]
  };

  function _launchActivity(levelId, act) {
    var v = act.make(), isMatch = act.rt === 'match';
    v.variantId = vid(act.id);
    var tpl = { id: 'mod-' + act.id, level: levelId, type: act.type, mode: act.rt === 'match' ? 'match' : (act.rt === 'group' ? 'group' : 'create'), runtime: act.rt,
      compareKey: isMatch ? 'signature' : undefined, modeLabelZh: act.rt === 'sort' ? '搭建' : undefined, modeLabelEn: act.rt === 'sort' ? 'Build' : undefined,
      instrZh: v.instrZh || '把左边的拖到对得上的一项上 →', instrEn: v.instrEn || 'Drag each one onto the item that matches →',
      holdingLabelZh: '拖动卡片', holdingLabelEn: 'Drag cards' };
    ActivityRunner.launch(tpl, v, {
      levelId: LEVEL_GRADE[levelId], onBack: function () {},
      onComplete: function (attempt) {
        if (!shell || typeof shell.report !== 'function') return;
        shell.report({
          gameId: SOURCE_GAME_ID, unitId: act.id, templateId: attempt.templateId, variantId: attempt.variantId || null,
          score: attempt.result === 'correct' ? 1 : 0, total: 1, timeMs: attempt.responseMs || 0, hintsUsed: 0,
          geneIds: [TYPE_GENES[act.type]], shell: 'shell-1', activityRuntime: 'interaction', activityMode: tpl.mode,
          result: attempt.result || null, levelId: levelId, gradeCode: LEVEL_GRADE[levelId],
          context: buildRadarContext(levelId, act.type, { abstractionLevel: act.abs, taskType: tpl.mode, activityRuntime: 'interaction' })
        });
      }
    });
  }

  // Mini games are listed on the grade home, after the unit cards (shell.homeExtras).
  function _homeExtras(levelId) {
    return function (list) {
      if (!ACTS[levelId]) return;
      var head = document.createElement('div');
      head.className = 'mm-gm-head';
      head.innerHTML = '<span class="zh">🎮 小游戏</span><span class="en">🎮 Mini games</span>';
      list.appendChild(head);
      ACTS[levelId].forEach(function (a) {
        var tag = a.rt === 'match' ? ['配对', 'Match'] : a.rt === 'group' ? ['分类', 'Group'] : ['搭建', 'Build'];
        var card = document.createElement('div');
        card.className = 's1-card';
        card.innerHTML = '<div class="s1-cicon">' + a.icon + '</div><div class="s1-cinfo"><div class="s1-cname">' + bi(a.zh, a.en) +
          '</div></div><div class="s1-cstat">' + bi(tag[0], tag[1]) + '</div>';
        card.addEventListener('click', function () { _launchActivity(levelId, a); });
        list.appendChild(card);
      });
    };
  }

  (function () {
    var st = document.createElement('style');
    st.textContent = [
      '.mm-gm-head{font-size:15px;font-weight:900;color:#065f46;margin:14px 2px 2px;}',
      // header: back button + title stay on one line
      '#s1-home .s1-hdr{flex-wrap:nowrap;gap:8px;}',
      '#s1-home .s1-title{white-space:nowrap;font-size:clamp(20px,5.5vw,32px);min-width:0;}',
      '#mm-home-back{flex:0 0 auto;background:none;border:none;cursor:pointer;font-size:20px;padding:4px 6px;line-height:1;}'
    ].join('');
    document.head.appendChild(st);
  })();

  // ── Grade level selector ───────────────────────────────────────────────────
  // Mirrors pattern's own K/G grade chooser (pattern/game.js GRADE_LEVELS +
  // _showLevelSelector): the child picks a grade card before ever seeing a
  // unit, instead of one flat list spanning K1 through G2.

  var GRADE_LEVELS = [
    { id: 'L1', badge: 'K1', nameZh: '幼儿园小/中班', nameEn: 'Pre-K',        descZh: '4–5岁 · 看得见的模型',  descEn: 'Age 4–5 · Models you can see' },
    { id: 'L2', badge: 'K2', nameZh: '幼儿园大班',    nameEn: 'Kindergarten', descZh: '5–6岁 · 关系·步骤·规则', descEn: 'Age 5–6 · Relations, steps, rules' },
    { id: 'L3', badge: 'G1', nameZh: '小学一年级',    nameEn: 'Grade 1',      descZh: '6–7岁 · 场景到抽象表示',   descEn: 'Age 6–7 · From scene to abstraction' },
    { id: 'L4', badge: 'G2', nameZh: '小学二年级',    nameEn: 'Grade 2',      descZh: '7–8岁 · 选模型、评模型',   descEn: 'Age 7–8 · Choose and judge models' }
  ];

  // Same idiom as injectModelingStyles: a small self-scoped stylesheet,
  // because only the grade selector screen uses these classes.
  function _injectLevelSelectorStyles() {
    if (document.getElementById('mm-lvl-style')) return;
    var s = document.createElement('style');
    s.id = 'mm-lvl-style';
    s.textContent = [
      '.mm-lvl-wrap{display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px 16px;}',
      '.mm-lvl-title-bar{display:flex;align-items:center;width:100%;max-width:520px;gap:8px;}',
      '.mm-lvl-title{font-size:20px;font-weight:900;color:#065f46;text-align:center;flex:1;}',
      '.mm-lvl-back{background:none;border:none;cursor:pointer;font-size:14px;font-weight:700;color:#0d9488;padding:4px 6px;border-radius:8px;white-space:nowrap;flex:0 0 auto;}',
      '.mm-lvl-back:hover{background:#ecfdf5;}',
      '.mm-lvl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;width:100%;max-width:440px;}',
      '.mm-lvl-card{border:2px solid #99f6e4;border-radius:16px;padding:18px 14px;cursor:pointer;text-align:center;background:#fff;transition:transform .16s,border-color .16s,box-shadow .16s;}',
      '.mm-lvl-card:hover{transform:translateY(-2px);border-color:#0d9488;box-shadow:0 8px 20px rgba(13,148,136,0.12);}',
      '.mm-lvl-badge{font-size:26px;font-weight:900;color:#065f46;margin-bottom:4px;}',
      '.mm-lvl-name{font-size:13px;font-weight:700;color:#334155;}',
      '.mm-lvl-desc{font-size:11px;color:#94a3b8;margin-top:4px;}'
    ].join('');
    document.head.appendChild(s);
  }

  function _showLevelSelector() {
    _injectLevelSelectorStyles();
    var lang = shell.lang || 'zh';
    var wrap = document.createElement('div');
    wrap.id = 'mm-lvl-selector';
    wrap.innerHTML = '<div class="mm-lvl-wrap">' +
      '<div class="mm-lvl-title-bar">' +
        '<button class="mm-lvl-back" id="mm-sel-back">⬅️ <span class="zh">数学启智</span><span class="en">Math</span></button>' +
        '<div class="mm-lvl-title"><span class="zh">建模 · 选择年级</span><span class="en">Modeling · Grade</span></div>' +
        IH.controlsHtml('lvl') +
      '</div>' +
      '<div class="mm-lvl-grid">' +
      GRADE_LEVELS.map(function (lvl) {
        return '<div class="mm-lvl-card" data-level="' + lvl.id + '">' +
          '<div class="mm-lvl-badge">' + lvl.badge + '</div>' +
          '<div class="mm-lvl-name"><span class="zh">' + lvl.nameZh + '</span><span class="en">' + lvl.nameEn + '</span></div>' +
          '<div class="mm-lvl-desc"><span class="zh">' + lvl.descZh + '</span><span class="en">' + lvl.descEn + '</span></div>' +
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

    var backBtn = document.getElementById('mm-sel-back');
    if (backBtn) backBtn.addEventListener('click', function () { window.location.href = '../index.html'; });

    wrap.addEventListener('click', function (e) {
      var card = e.target.closest('.mm-lvl-card');
      if (!card) return;
      wrap.remove();
      _launchGrade(card.getAttribute('data-level'));
    });
  }

  // shell.createGame() has no cfg.onBack hook, and its own #s1-back button
  // (in-game header only — the home/unit-list header ships no back button
  // at all) only ever reaches shell's internal home screen, never anything
  // that existed before createGame() was called. So we tear shell's DOM
  // down ourselves and re-show our own grade selector, same idiom as
  // comparison/game.js's _tearDownShell/_injectShellHomeBackButton.
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
    if (homeHdr && !document.getElementById('mm-home-back')) {
      var btn = document.createElement('button');
      btn.id = 'mm-home-back';
      btn.innerHTML = '⬅️';
      btn.title = '返回选择年级 / Back to grade selector';
      btn.addEventListener('click', function () {
        _tearDownShell();
        _showLevelSelector();
      });
      homeHdr.insertBefore(btn, homeHdr.firstChild);
    }

    // #s1-back only exists in the in-game header; addEventListener stacks
    // on top of shell's own _goHome listener rather than replacing it, so
    // both fire (harmless — ours runs the actual navigation regardless).
    var gameBack = document.getElementById('s1-back');
    if (gameBack) {
      gameBack.addEventListener('click', function () {
        _tearDownShell();
        _showLevelSelector();
      });
    }
  }

  function _launchGrade(levelId) {
  shell.createGame({
    id:       'learning-math-modeling',
    theme:    { primary: '#0d9488', primary2: '#065f46' },
    gui: {
      header: { show: true, showBack: true },
      language: { enabled: true, default: 'en' },
      audio: { music: { enabled: true, defaultOn: false }, sound: { enabled: true, defaultOn: true } },
      history: { enabled: true },
      help: { enabled: true, contentZh: '把一个具体情境转换成一个更简单的结构——符号、分组、示意图或等式——再用这个结构去回答问题。', contentEn: 'Turn a situation into a simpler structure — a symbol, a grouping, a diagram or an equation — then use that structure to answer.' },
      video: { enabled: true, videoId: 'learning-math-modeling-intro-001' }
    },
    title:    { zh: '⚖️ 建立模型', en: '⚖️ Modeling' },
    subtitle: { zh: '对应 · 分组 · 关系 · 空间 · 过程 · 数量 · 规则', en: 'Map · Group · Relate · Space · Process · Quantity · Rule' },
    passScore: 7,
    units:    buildUnits(levelId),
    homeExtras: _homeExtras(levelId),

    renderSequence: function (q, container) { _renderQuestion(q, container); },

    renderOption: function (opt, q) {
      var s = String(opt), m;
      if (s.indexOf('dots:') === 0) return '<div class="mm-opt">' + dotsHtml(s) + '</div>';
      if ((m = /^tx:(.*)\|(.*)$/.exec(s))) return '<div class="mm-opt"><div class="mm-opt-text">' + bi(m[1], m[2]) + '</div></div>';
      if ((m = /^(.+)~(.*)~(.*)$/.exec(s))) return '<div class="mm-opt"><div class="mm-opt-symbol">' + m[1] + '</div>' + (m[2] ? '<div class="mm-cap">' + bi(m[2], m[3]) + '</div>' : '') + '</div>';
      return '<div class="mm-opt"><div class="mm-opt-symbol">' + s + '</div></div>';
    },

    checkAnswer: function (selected, q) { return String(selected) === String(q.answer); },

    getVoiceText: function (q) {
      var zh = shell.lang === 'zh', st = q.scene.filter(function (b) { return b.k === 'story' || b.k === 'rule'; })
        .map(function (b) { return zh ? b.zh : b.en; }).join('。 ');
      var ch = q.scene.filter(function (b) { return b.k === 'chain'; })[0];
      if (ch) st = (st ? st + '。 ' : '') + ch.steps.map(function (s) { var p = s.split('~'); return s === '?' ? (zh ? '问号' : 'blank') : (zh ? p[1] : p[2]); }).join(zh ? '，' : ', ');
      return _speakable((st ? st + '。 ' : '') + (zh ? q.promptZh : q.promptEn));
    },

    registerRootGenes: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      return genesFor(unit);
    },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var levelId = UNIT_LEVEL[String(unit.id)] || _dominantLevel(unit) || 'L1';
      var type = _dominantType(unit) || 'mapping';
      var qs = unit.questions || [];
      var out = buildRadarContext(levelId, type, {
        unitId: String(unit.id),
        modelingTypes: _uniqueOf(qs, 'type'),
        abstractionLevels: _uniqueOf(qs, 'abstraction'),
        abstractionLevel: _dominantOf(qs, 'abstraction'),
        activityRuntime: 'puzzle'
      });
      refillUnit(String(unit.id));
      return out;
    }
  });

  _injectShellBackButtons();
}

  _showLevelSelector();
}());
