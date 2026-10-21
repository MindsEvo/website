/**
 * Math Logic — Game Logic  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * Learning Foundation · Math Thinking · Logic 逻辑
 *
 * Questions come from LG_GEN (generator.js): a type x grade table of themed
 * units, refilled after every finished session.
 *
 * Stats stored under 'learning-math-logic' — independent from
 * all other modules.
 *
 * Depends on: shell.js, generator.js (LG_GEN)
 */

// Radar contract: LEVEL_GRADE, LOGIC_TYPE_OF and the `base` table inside
// difficultyAxisFor() are read as literal text by metadata/validate.js against
// metadata/metathinking/logic.json. Keep them flat, literal declarations.
var MODULE_ID = 'logic';
var MODULE_TYPE = 'metathinking';
var SOURCE_GAME_ID = 'learning-math-logic';
var SESSION_SIZE = 10;

var LEVEL_GRADE = { L1: 'K1', L2: 'K2', L3: 'G1', L4: 'G2' };
var LEVEL_KEY = { L1: 'K1', L2: 'K2', L3: 'G1', L4: 'G2' };

// unit.id -> levelId. One id per themed unit: '<levelId>-<key>' (generator.js).
var UNIT_LEVEL = {
  'L1-odd': 'L1', 'L1-match': 'L1', 'L1-rule': 'L1', 'L1-truth': 'L1',
  'L2-attr': 'L2', 'L2-elim': 'L2', 'L2-order': 'L2', 'L2-cond': 'L2',
  'L3-ifthen': 'L3', 'L3-logic': 'L3', 'L3-order': 'L3', 'L3-puzzle': 'L3', 'L3-check': 'L3',
  'L4-chain': 'L4', 'L4-grid': 'L4', 'L4-multi': 'L4', 'L4-constraint': 'L4', 'L4-extra': 'L4', 'L4-unknown': 'L4', 'L4-certain': 'L4'
};

// question.type -> logic.json typeTree id.
var LOGIC_TYPE_OF = {
  classification: 'classification',
  condition: 'condition',
  elimination: 'elimination',
  ordering: 'ordering',
  matching: 'matching',
  inference: 'inference',
  truth: 'truth'
};

function difficultyAxisFor(levelId) {
  var base = {
    L1: { language_complexity: 'picture', object_count: 'three', condition_count: 'single',
          inference_depth: 'direct', condition_type: 'positive', information_state: 'complete' },
    L2: { language_complexity: 'picture', object_count: 'three', condition_count: 'double',
          inference_depth: 'one_step', condition_type: 'negation', information_state: 'complete' },
    L3: { language_complexity: 'sentence', object_count: 'three', condition_count: 'double',
          inference_depth: 'two_step', condition_type: 'and_or', information_state: 'complete' },
    L4: { language_complexity: 'sentence', object_count: 'four', condition_count: 'multi',
          inference_depth: 'multi_step', condition_type: 'mixed', information_state: 'missing' }
  };
  return base[levelId] || null;
}

function _dominantOf(qs, pick) {
  var t = {}, best = null, n = 0;
  qs.forEach(function (q) { var v = pick(q); if (!v) return; t[v] = (t[v] || 0) + 1; if (t[v] > n) { n = t[v]; best = v; } });
  return best;
}
function _uniqueOf(qs, pick) {
  return qs.map(pick).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
}

var _units = {};
function buildUnits(levelId) {
  return LG_GEN.GRADE_UNITS[LEVEL_KEY[levelId]].map(function (d) {
    var id = levelId + '-' + d.key;
    var u = { id: id, icon: d.icon, gradeCode: LEVEL_GRADE[levelId], nameZh: d.zh, nameEn: d.en, descZh: d.dzh, descEn: d.den,
      questions: LG_GEN.generate(LEVEL_KEY[levelId], SESSION_SIZE, d.key) };
    _units[id] = u;
    return u;
  });
}
// getReportContext runs right after the result screen is built: refill on the next tick.
function refillUnit(unitId) {
  setTimeout(function () {
    var u = _units[unitId];
    if (u) u.questions = LG_GEN.generate(LEVEL_KEY[UNIT_LEVEL[unitId]], SESSION_SIZE, unitId.split('-')[1]);
  }, 0);
}

// ── Rendering (generator.js scene blocks / option tokens) ────────────────────
function bi(zh, en) { return '<span class="zh">' + zh + '</span><span class="en">' + en + '</span>'; }

(function () {
  var s = document.createElement('style');
  s.textContent = [
    '.lg-wrap{display:grid;gap:10px;justify-items:center;width:100%;}',
    '.lg-chip{font-size:12px;font-weight:800;padding:4px 10px;border-radius:999px;background:#f5f3ff;color:#4c1d95;border:1px solid #ddd6fe;}',
    '.lg-q{font-size:19px;font-weight:900;color:#4c1d95;line-height:1.4;text-align:center;max-width:340px;letter-spacing:0;}',
    '.lg-story{font-size:17px;font-weight:800;color:#0f172a;text-align:center;max-width:340px;line-height:1.5;background:#faf5ff;border-radius:12px;padding:8px 14px;letter-spacing:0;}',
    '.lg-rule{font-size:16px;font-weight:900;color:#7c2d12;background:#ffedd5;border:2px dashed #fb923c;border-radius:12px;padding:8px 14px;text-align:center;max-width:340px;letter-spacing:0;}',
    '.lg-big{font-size:34px;line-height:1.3;text-align:center;background:#fff;border:2px solid #ddd6fe;border-radius:14px;padding:6px 14px;max-width:340px;letter-spacing:2px;}',
    '.lg-cells{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}',
    '.lg-cell{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:64px;padding:6px 8px;background:#fff;border:2px solid #ddd6fe;border-radius:12px;}',
    '.lg-cell-e{font-size:32px;line-height:1.1;}',
    '.lg-cell-c{font-size:12px;font-weight:800;color:#475569;line-height:1.1;margin-top:2px;letter-spacing:0;}',
    '.lg-clues{display:grid;gap:6px;width:100%;max-width:340px;}',
    '.lg-clue{display:flex;gap:8px;align-items:flex-start;background:#fff;border:2px solid #ddd6fe;border-radius:12px;padding:7px 10px;font-size:15px;font-weight:700;color:#1e293b;line-height:1.45;text-align:left;letter-spacing:0;}',
    '.lg-clue b{flex:0 0 auto;width:22px;height:22px;border-radius:50%;background:#7c3aed;color:#fff;font-size:12px;line-height:22px;text-align:center;}',
    '.lg-pairs{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;font-size:30px;}',
    '.lg-pair{background:#fff;border:2px solid #ddd6fe;border-radius:12px;padding:4px 12px;}',
    '.lg-opt{display:grid;gap:4px;justify-items:center;align-content:center;min-height:56px;}',
    '.lg-opt-e{font-size:32px;line-height:1.1;}',
    '.lg-opt-t{font-size:15px;font-weight:800;color:#0f172a;letter-spacing:0;}',
    '.lg-cap{font-size:12px;font-weight:800;color:#475569;line-height:1.1;letter-spacing:0;}'
  ].join('');
  document.head.appendChild(s);
}());

function sceneHtml(blocks) {
  return blocks.map(function (b) {
    switch (b.k) {
      case 'story': return '<div class="lg-story">' + bi(b.zh, b.en) + '</div>';
      case 'rule':  return '<div class="lg-rule">' + bi(b.zh, b.en) + '</div>';
      case 'big':   return '<div class="lg-big">' + b.v + '</div>';
      case 'cells':
        return '<div class="lg-cells">' + b.items.map(function (c) {
          return '<div class="lg-cell"><div class="lg-cell-e">' + c.e + '</div><div class="lg-cell-c">' + bi(c.zh, c.en) + '</div></div>';
        }).join('') + '</div>';
      case 'clues':
        return '<div class="lg-clues">' + b.items.map(function (c, i) {
          return '<div class="lg-clue"><b>' + (i + 1) + '</b><span>' + bi(c[0], c[1]) + '</span></div>';
        }).join('') + '</div>';
      case 'pairs':
        return '<div class="lg-pairs">' + b.items.map(function (p) { return '<span class="lg-pair">' + p[0] + ' ➜ ' + p[1] + '</span>'; }).join('') + '</div>';
    }
    return '';
  }).join('');
}

var CHIP = {
  classification: ['分类逻辑', 'Classification'], condition: ['条件逻辑', 'Condition'], elimination: ['排除逻辑', 'Elimination'],
  ordering: ['顺序逻辑', 'Ordering'], matching: ['对应逻辑', 'Matching'], inference: ['推断逻辑', 'Inference'], truth: ['真伪逻辑', 'True / False']
};

// Sentences carry "小狗（🐶）": speak the word, drop the bracketed picture.
function _speakable(t) {
  return t.replace(/\s*[（(][^）)]*[）)]/g, function (m) { return /\p{Extended_Pictographic}/u.test(m) ? '' : m; })
          .replace(/\p{Extended_Pictographic}️?/gu, '').replace(/<br>/g, ' ').replace(/\s{2,}/g, ' ').trim();
}


// ── Mini games (match / sort / group / grid) ─────────────────────────────────
// Reuses comparison's runtimes through ActivityRunner, plus GridRuntime (tap a
// logic grid). Listed on the grade home after the unit cards (shell.homeExtras).
// Every variant is generated fresh at launch.
var A = LG_GEN.ACT;
function vid(id) { return id + '-' + Math.floor(Math.random() * 1e6); }

var ACTS = {
  L1: [{ id: 'k1-group-colors', rt: 'group', type: 'condition', icon: '📦', zh: '照颜色规则放盒子', en: 'Boxes by colour rule', make: function () { return A.groupColors(4); } },
       { id: 'k1-match-color', rt: 'match', type: 'matching', icon: '🎨', zh: '颜色一样的配一对', en: 'Match the same colour', make: function () { return A.matchColor(3); } },
       { id: 'k1-match-kind', rt: 'match', type: 'classification', icon: '🧩', zh: '同类的配一对', en: 'Match the same kind', make: function () { return A.matchKind(3); } }],
  L2: [{ id: 'k2-group-if', rt: 'group', type: 'condition', icon: '🧺', zh: '如果…就放…', en: 'If… then put it…', make: function () { return A.groupIf(6); } },
       { id: 'k2-order', rt: 'sort', type: 'ordering', icon: '📏', zh: '照线索排大小', en: 'Order by size from clues', make: function () { return A.order(3, true); } },
       { id: 'k2-grid3', rt: 'grid', type: 'matching', icon: '🔲', zh: '逻辑表 (3×3)', en: 'Logic grid (3×3)', make: function () { return A.grid(3); } }],
  L3: [{ id: 'g1-order3', rt: 'sort', type: 'ordering', icon: '📏', zh: '照线索排队', en: 'Line up from clues', make: function () { return A.order(3, false); } },
       { id: 'g1-grid3', rt: 'grid', type: 'matching', icon: '🔲', zh: '逻辑表 (3×3)', en: 'Logic grid (3×3)', make: function () { return A.grid(3); } },
       { id: 'g1-group-if', rt: 'group', type: 'condition', icon: '🧺', zh: '如果…就放…', en: 'If… then put it…', make: function () { return A.groupIf(6); } }],
  L4: [{ id: 'g2-order4', rt: 'sort', type: 'ordering', icon: '📏', zh: '四个排队', en: 'Line up four', make: function () { return A.order(4, false); } },
       { id: 'g2-grid4', rt: 'grid', type: 'matching', icon: '🔲', zh: '逻辑表 (4×4)', en: 'Logic grid (4×4)', make: function () { return A.grid(4); } },
       { id: 'g2-constraint', rt: 'sort', type: 'ordering', icon: '🧩', zh: '格子约束排列', en: 'Squares with constraints', make: A.constraint }]
};
var MODE_OF = { group: 'group', match: 'match', sort: 'create', grid: 'grid' };
var TAG = { group: ['分类', 'Group'], match: ['配对', 'Match'], sort: ['排序', 'Order'], grid: ['逻辑表', 'Grid'] };

function _launchActivity(levelId, act) {
  var v = act.make();
  v.variantId = vid(act.id);
  var tpl = { id: 'logic-' + act.id, level: levelId, type: act.type, mode: MODE_OF[act.rt], runtime: act.rt === 'grid' ? 'grid' : act.rt,
    compareKey: act.rt === 'match' ? 'signature' : undefined, modeLabelZh: act.rt === 'sort' ? '排序' : undefined, modeLabelEn: act.rt === 'sort' ? 'Order' : undefined,
    instrZh: v.instrZh || '', instrEn: v.instrEn || '', holdingLabelZh: '拖动卡片', holdingLabelEn: 'Drag cards' };
  var ctx = {
    levelId: LEVEL_GRADE[levelId], onBack: function () {},
    onComplete: function (attempt) {
      if (!shell || typeof shell.report !== 'function') return;
      shell.report({
        gameId: SOURCE_GAME_ID, unitId: act.id, templateId: attempt.templateId, variantId: attempt.variantId || null,
        score: attempt.result === 'correct' ? 1 : 0, total: 1, timeMs: attempt.responseMs || 0, hintsUsed: 0,
        geneIds: ['RG.LOGIC.REASONING.BASIC'], shell: 'shell-1', activityRuntime: 'interaction', activityMode: tpl.mode,
        result: attempt.result || null, levelId: levelId, gradeCode: LEVEL_GRADE[levelId],
        context: { moduleId: MODULE_ID, moduleType: MODULE_TYPE, levelId: levelId, gradeCode: LEVEL_GRADE[levelId], unitId: act.id,
          logicType: LOGIC_TYPE_OF[act.type], taskType: tpl.mode, difficultyAxis: difficultyAxisFor(levelId), activityRuntime: 'interaction', sourceGameId: SOURCE_GAME_ID }
      });
    }
  };
  if (act.rt === 'grid') GridRuntime.run(tpl, v, ctx); else ActivityRunner.launch(tpl, v, ctx);
}

function _homeExtras(levelId) {
  return function (list) {
    if (!ACTS[levelId]) return;
    var head = document.createElement('div');
    head.className = 'lg-gm-head';
    head.innerHTML = bi('🎮 小游戏', '🎮 Mini games');
    list.appendChild(head);
    ACTS[levelId].forEach(function (a) {
      var card = document.createElement('div');
      card.className = 's1-card';
      card.innerHTML = '<div class="s1-cicon">' + a.icon + '</div><div class="s1-cinfo"><div class="s1-cname">' + bi(a.zh, a.en) + '</div></div>' +
        '<div class="s1-cstat">' + bi(TAG[a.rt][0], TAG[a.rt][1]) + '</div>';
      card.addEventListener('click', function () { _launchActivity(levelId, a); });
      list.appendChild(card);
    });
  };
}
(function () {
  var st = document.createElement('style');
  st.textContent = '.lg-gm-head{font-size:15px;font-weight:900;color:#4c1d95;margin:14px 2px 2px;}';
  document.head.appendChild(st);
}());

// ── Grade level selector ───────────────────────────────────────────────────
// Mirrors pattern's and modeling's own K/G grade chooser: the child picks a
// grade card before ever seeing a unit, instead of one flat list.

var GRADE_LEVELS = [
  { id: 'L1', badge: 'K1', nameZh: '幼儿园小/中班', nameEn: 'Pre-K',        descZh: '4–5岁 · 看得见的规则',   descEn: 'Age 4–5 · Rules you can see' },
  { id: 'L2', badge: 'K2', nameZh: '幼儿园大班',    nameEn: 'Kindergarten', descZh: '5–6岁 · 两个条件·排除',   descEn: 'Age 5–6 · Two conditions, elimination' },
  { id: 'L3', badge: 'G1', nameZh: '小学一年级',    nameEn: 'Grade 1',      descZh: '6–7岁 · 如果…那么…',   descEn: 'Age 6–7 · If… then…' },
  { id: 'L4', badge: 'G2', nameZh: '小学二年级',    nameEn: 'Grade 2',      descZh: '7–8岁 · 逻辑表·约束',   descEn: 'Age 7–8 · Logic grids, constraints' }
];

// Same idiom as the s1-seq style injection above: a small self-scoped
// stylesheet, because only the grade selector screen uses these classes.
function _injectLevelSelectorStyles() {
  if (document.getElementById('ml-lvl-style')) return;
  var s = document.createElement('style');
  s.id = 'ml-lvl-style';
  s.textContent = [
    '.ml-lvl-wrap{display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px 16px;}',
    '.ml-lvl-title-bar{display:flex;align-items:center;width:100%;max-width:520px;gap:8px;}',
    '.ml-lvl-title{font-size:20px;font-weight:900;color:#4c1d95;text-align:center;flex:1;}',
    '.ml-lvl-back{background:none;border:none;cursor:pointer;font-size:14px;font-weight:700;color:#7c3aed;padding:4px 6px;border-radius:8px;white-space:nowrap;flex:0 0 auto;}',
    '.ml-lvl-back:hover{background:#f5f3ff;}',
    '.ml-lvl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;width:100%;max-width:440px;}',
    '.ml-lvl-card{border:2px solid #ddd6fe;border-radius:16px;padding:18px 14px;cursor:pointer;text-align:center;background:#fff;transition:transform .16s,border-color .16s,box-shadow .16s;}',
    '.ml-lvl-card:hover{transform:translateY(-2px);border-color:#7c3aed;box-shadow:0 8px 20px rgba(124,58,237,0.12);}',
    '.ml-lvl-badge{font-size:26px;font-weight:900;color:#4c1d95;margin-bottom:4px;}',
    '.ml-lvl-name{font-size:13px;font-weight:700;color:#334155;}',
    '.ml-lvl-desc{font-size:11px;color:#94a3b8;margin-top:4px;}'
  ].join('');
  document.head.appendChild(s);
}

function _showLevelSelector() {
  _injectLevelSelectorStyles();
  var lang = shell.lang || 'zh';
  var wrap = document.createElement('div');
  wrap.id = 'ml-lvl-selector';
  wrap.innerHTML = '<div class="ml-lvl-wrap">' +
    '<div class="ml-lvl-title-bar">' +
      '<button class="ml-lvl-back" id="ml-sel-back">⬅️ <span class="zh">数学启智</span><span class="en">Math</span></button>' +
      '<div class="ml-lvl-title"><span class="zh">逻辑 · 选择年级</span><span class="en">Logic · Grade</span></div>' +
      IH.controlsHtml('lvl') +
    '</div>' +
    '<div class="ml-lvl-grid">' +
    GRADE_LEVELS.map(function (lvl) {
      return '<div class="ml-lvl-card" data-level="' + lvl.id + '">' +
        '<div class="ml-lvl-badge">' + lvl.badge + '</div>' +
        '<div class="ml-lvl-name"><span class="zh">' + lvl.nameZh + '</span><span class="en">' + lvl.nameEn + '</span></div>' +
        '<div class="ml-lvl-desc"><span class="zh">' + lvl.descZh + '</span><span class="en">' + lvl.descEn + '</span></div>' +
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

  var backBtn = document.getElementById('ml-sel-back');
  if (backBtn) backBtn.addEventListener('click', function () { window.location.href = '../index.html'; });

  wrap.addEventListener('click', function (e) {
    var card = e.target.closest('.ml-lvl-card');
    if (!card) return;
    wrap.remove();
    _launchGrade(card.getAttribute('data-level'));
  });
}

// shell.createGame() has no cfg.onBack hook, and its own #s1-back button
// (in-game header only) only ever reaches shell's internal home screen, never
// anything that existed before createGame() was called. So we tear shell's
// DOM down ourselves and re-show our own grade selector, same idiom as
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
  if (homeHdr && !document.getElementById('ml-home-back')) {
    var btn = document.createElement('button');
    btn.id = 'ml-home-back';
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
    id:       'learning-math-logic',
    theme:    { primary: '#7c3aed', primary2: '#4c1d95' },  // deep purple — logic identity
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
        contentZh: '先提取题干中的条件关系，再排除与条件冲突的选项。',
        contentEn: 'Extract condition relations first, then eliminate options that conflict with them.'
      },
      video: {
        enabled: true,
        videoId: 'learning-math-logic-intro-001'
      }
    },
    title:    { zh: '🧠 逻辑推理',             en: '🧠 Logic Reasoning' },
    subtitle: { zh: '从线索出发，用推理找到唯一正确的答案', en: 'Follow the clues — use reasoning to find the one correct answer' },
    passScore: 7,
    units:    buildUnits(levelId),
    homeExtras: _homeExtras(levelId),

    renderSequence: function (q, container) {
      container.classList.add('lg-seq');
      var c = CHIP[q.type];
      container.innerHTML = '<div class="lg-wrap"><span class="lg-chip">' + bi(c[0], c[1]) + '</span>' + sceneHtml(q.scene) +
        '<div class="lg-q">' + bi(q.promptZh, q.promptEn) + '</div></div>';
    },

    renderOption: function (opt, q) {
      var s = String(opt), m;
      if ((m = /^tx:(.*)\|(.*)$/.exec(s))) return '<div class="lg-opt"><div class="lg-opt-t">' + bi(m[1], m[2]) + '</div></div>';
      if ((m = /^(.+)~(.*)~(.*)$/.exec(s))) return '<div class="lg-opt"><div class="lg-opt-e">' + m[1] + '</div>' + (m[2] ? '<div class="lg-cap">' + bi(m[2], m[3]) + '</div>' : '') + '</div>';
      return '<div class="lg-opt"><div class="lg-opt-e">' + s + '</div></div>';
    },

    /** Correct when the selected option token matches q.answer exactly. */
    checkAnswer: function (selected, q) { return String(selected) === String(q.answer); },

    /** Read the scene sentences, the clues one by one, then the question. */
    getVoiceText: function (q) {
      var zh = shell.lang === 'zh', parts = [];
      q.scene.forEach(function (b) {
        if (b.k === 'story' || b.k === 'rule') parts.push(zh ? b.zh : b.en);
        else if (b.k === 'clues') b.items.forEach(function (c, i) { parts.push((zh ? '线索' : 'Clue ') + (i + 1) + (zh ? '：' : ': ') + (zh ? c[0] : c[1])); });
        else if (b.k === 'cells') parts.push((zh ? '有：' : 'There are: ') + b.items.map(function (c) { return zh ? c.zh : c.en; }).join(zh ? '，' : ', '));
      });
      parts.push(zh ? q.promptZh : q.promptEn);
      return _speakable(parts.join(zh ? '。 ' : '. '));
    },

    registerRootGenes: function () {
      // Ability genes only; where the item sits in the content tree travels in
      // unitId / levelId. One gene for now (see logic.json rootGeneScopeNote).
      return ['RG.LOGIC.REASONING.BASIC'];
    },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {}, qs = unit.questions || [], unitId = String(unit.id);
      var levelId = UNIT_LEVEL[unitId] || 'L1', type = _dominantOf(qs, function (q) { return q.type; });
      var out = {
        moduleId: MODULE_ID, moduleType: MODULE_TYPE, levelId: levelId, gradeCode: LEVEL_GRADE[levelId] || null,
        unitId: unitId, logicType: LOGIC_TYPE_OF[type] || null, logicTypes: _uniqueOf(qs, function (q) { return q.type; }),
        modes: _uniqueOf(qs, function (q) { return q.mode; }),
        difficultyAxis: difficultyAxisFor(levelId),
        axisObserved: {
          condition_count: _dominantOf(qs, function (q) { return q.ax.condition_count; }),
          object_count: _dominantOf(qs, function (q) { return q.ax.object_count; }),
          inference_depth: _dominantOf(qs, function (q) { return q.ax.inference_depth; }),
          condition_type: _dominantOf(qs, function (q) { return q.ax.condition_type; }),
          information_state: _dominantOf(qs, function (q) { return q.ax.information_state; })
        },
        activityRuntime: 'puzzle', sourceGameId: SOURCE_GAME_ID
      };
      refillUnit(unitId);
      return out;
    }
  });

  _injectShellBackButtons();
}

_showLevelSelector();
