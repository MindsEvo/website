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

  // unit.id -> levelId, for the grade selector's pre-filter (mirrors
  // pattern/game.js's UNIT_LEVEL). Matches modeling.json's levelMap exactly.
  var UNIT_LEVEL = {
    'map-1': 'L1', 'spatial-1': 'L1',
    'map-2': 'L2', 'group-1': 'L2',
    'spatial-2': 'L3', '1': 'L3', '2': 'L3', '3': 'L3',
    'group-2': 'L4', '4': 'L4', '5': 'L4', '6': 'L4'
  };

  // question.type -> modeling.json typeTree id. Identity today; kept as an
  // explicit table because the validator reads this name as text.
  var MODELING_TYPE_OF = {
    mapping: 'mapping',
    grouping: 'grouping',
    spatial: 'spatial',
    quantitative: 'quantitative'
  };

  // question.type -> the single rootGene it trains (modeling.json's
  // geneReporting rule: each type reports its own gene, never all four).
  var TYPE_GENES = {
    mapping: 'RG.MODELING.MAPPING.BASIC',
    grouping: 'RG.MODELING.GROUPING.PURPOSE',
    spatial: 'RG.MODELING.SPATIAL.BASIC',
    quantitative: 'RG.MODELING.EQUATION.RELATION'
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
      '.mm-opt-text{font-size:16px;font-weight:800;color:#0f172a;}'
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
    ['mapping', 'grouping', 'spatial', 'quantitative'].forEach(function (t) {
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

  function genesFor(unit) {
    var seen = [];
    (unit.questions || []).forEach(function (q) {
      var gene = TYPE_GENES[q.type];
      if (gene && seen.indexOf(gene) === -1) seen.push(gene);
    });
    return seen;
  }

  // Static content is hand-authored, so correct answers cluster at
  // predictable positions. Shuffle each question's options once at load so
  // children judge the content, not the button.
  function _shuffleWithAnswer(options, answer) {
    var answerIndex = options.indexOf(answer);
    var order = options.map(function (_, i) { return i; });
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = order[i]; order[i] = order[j]; order[j] = t;
    }
    return {
      options: order.map(function (i) { return options[i]; }),
      answer: order.indexOf(answerIndex)
    };
  }

  // quantitative keeps its pre-existing behavior untouched — answer is the
  // correct value, not an index, and options are left in authored order.
  // Only the three new option-index types get the load-time shuffle.
  function buildUnits(units) {
    return (units || []).map(function (unit) {
      var out = Object.assign({}, unit);
      out.questions = (unit.questions || []).map(function (q) {
        if (q.type === 'quantitative') return q;
        var shuffled = _shuffleWithAnswer(q.options, q.answer);
        return Object.assign({}, q, { options: shuffled.options, answer: shuffled.answer });
      });
      return out;
    });
  }

  var SPATIAL_EN_OF_ZH = {
    '左边': 'Left', '右边': 'Right', '上面': 'Above', '下面': 'Below',
    '里面': 'Inside', '外面': 'Outside', '旁边': 'Beside', '中间': 'Middle',
    '向左': 'Left', '向右': 'Right', '向上': 'Up', '向下': 'Down'
  };

  function _renderMapping(q, container) {
    var chip = '<span class="mm-chip"><span class="zh">对应模型</span><span class="en">Correspondence</span></span>';
    var symbol = '<div class="mm-symbol">' + q.prompt + '</div>';
    var prompt = '<div class="mm-q"><span class="zh">' + q.promptZh + '</span><span class="en">' + q.promptEn + '</span></div>';
    container.innerHTML = '<div class="mm-wrap">' + chip + symbol + prompt + '</div>';
  }

  function _renderGrouping(q, container) {
    var chip = '<span class="mm-chip"><span class="zh">分类模型</span><span class="en">Grouping</span></span>';
    var prompt = '<div class="mm-q"><span class="zh">' + q.promptZh + '</span><span class="en">' + q.promptEn + '</span></div>';
    container.innerHTML = '<div class="mm-wrap">' + chip + prompt + '</div>';
  }

  function _renderSpatial(q, container) {
    var chip = '<span class="mm-chip"><span class="zh">空间模型</span><span class="en">Spatial</span></span>';
    var prompt = '<div class="mm-q"><span class="zh">' + q.promptZh + '</span><span class="en">' + q.promptEn + '</span></div>';
    container.innerHTML = '<div class="mm-wrap">' + chip + prompt + '</div>';
  }

  function _renderQuantitative(q, container) {
    container.innerHTML = q.display.replace(/□/g, '<span class="mystery">□</span>');
  }

  // ── Grade level selector ───────────────────────────────────────────────────
  // Mirrors pattern's own K/G grade chooser (pattern/game.js GRADE_LEVELS +
  // _showLevelSelector): the child picks a grade card before ever seeing a
  // unit, instead of one flat list spanning K1 through G2.

  var GRADE_LEVELS = [
    { id: 'L1', badge: 'K1', nameZh: '幼儿园小/中班', nameEn: 'Pre-K',        descZh: '4–5岁 · 符号对应',  descEn: 'Age 4–5 · Symbol mapping' },
    { id: 'L2', badge: 'K2', nameZh: '幼儿园大班',    nameEn: 'Kindergarten', descZh: '5–6岁 · 按目的分组', descEn: 'Age 5–6 · Purposeful grouping' },
    { id: 'L3', badge: 'G1', nameZh: '小学一年级',    nameEn: 'Grade 1',      descZh: '6–7岁 · 等式建模',   descEn: 'Age 6–7 · Equation modeling' },
    { id: 'L4', badge: 'G2', nameZh: '小学二年级',    nameEn: 'Grade 2',      descZh: '7–8岁 · 情境建模',   descEn: 'Age 7–8 · Word-problem modeling' }
  ];

  function _unitsForLevel(levelId) {
    return MM_DATA.units.filter(function (u) { return UNIT_LEVEL[String(u.id)] === levelId; });
  }

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
    subtitle: { zh: '对应 · 分组 · 空间 · 数量关系', en: 'Mapping · Grouping · Spatial · Quantitative' },
    passScore: 7,
    units:    buildUnits(_unitsForLevel(levelId)),

    renderSequence: function (q, container) {
      if (q.type === 'mapping') return _renderMapping(q, container);
      if (q.type === 'grouping') return _renderGrouping(q, container);
      if (q.type === 'spatial') return _renderSpatial(q, container);
      return _renderQuantitative(q, container);
    },

    renderOption: function (opt, q) {
      if (q.type === 'quantitative') return String(opt);
      var en = SPATIAL_EN_OF_ZH[opt];
      if (en) {
        return '<div class="mm-opt"><div class="mm-opt-text"><span class="zh">' + opt + '</span><span class="en">' + en + '</span></div></div>';
      }
      // emoji/symbol option (mapping, grouping)
      return '<div class="mm-opt"><div class="mm-opt-symbol">' + opt + '</div></div>';
    },

    checkAnswer: function (selected, q) {
      if (q.type === 'quantitative') return Number(selected) === q.answer;
      return q.options.indexOf(selected) === q.answer;
    },

    getVoiceText: function (q) {
      var zh = shell.lang === 'zh';
      if (q.type === 'quantitative') {
        var text = q.display.replace('⚖️', '').replace(/□/g, zh ? '方块' : 'blank').trim();
        return zh ? text + '，方块是几？' : text + '. What is blank?';
      }
      return zh ? q.promptZh : q.promptEn;
    },

    registerRootGenes: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      return genesFor(unit);
    },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var levelId = _dominantLevel(unit) || 'L1';
      var type = _dominantType(unit) || 'mapping';
      return buildRadarContext(levelId, type, {});
    }
  });

  _injectShellBackButtons();
}

  _showLevelSelector();
}());
