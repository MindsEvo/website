/**
 * Math Logic — Game Logic  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * Learning Foundation · Math Thinking · Logic 逻辑
 *
 * renderSequence: displays a text premise + question instead of
 *   a number sequence. Injects extra CSS to make the text readable
 *   inside the s1-seq yellow card.
 * renderOption: shows bilingual option labels.
 * checkAnswer: string comparison (options are text labels).
 *
 * Stats stored under 'learning-math-logic' — independent from
 * all other modules.
 *
 * Depends on: shell.js, data.js (ML_DATA)
 */

// unit.id -> levelId, for the grade selector's pre-filter (mirrors
// pattern/game.js's UNIT_LEVEL and modeling/game.js's UNIT_LEVEL).
var UNIT_LEVEL = {
  'classify-1': 'L1', 'order-1': 'L2',
  '1': 'L3', '2': 'L3', '3': 'L3',
  '4': 'L4', '5': 'L4', '6': 'L4'
};

// ── Inject CSS so text fits inside the s1-seq card ───────────────────────────
(function () {
  var s = document.createElement('style');
  s.textContent = [
    '.s1-seq {',
    '  font-size: 15px !important;',
    '  line-height: 1.75 !important;',
    '  padding: 18px 20px !important;',
    '  text-align: left !important;',
    '  letter-spacing: 0 !important;',
    '  min-height: 90px !important;',
    '}',
    '.lm-premise {',
    '  color: #334155;',
    '  margin-bottom: 10px;',
    '}',
    '.lm-question {',
    '  font-size: 16px !important;',
    '  font-weight: 900 !important;',
    '  color: #0f172a !important;',
    '  padding-top: 8px;',
    '  border-top: 1px solid rgba(0,0,0,0.10);',
    '}',
    '.lm-premise.lm-big {',
    '  font-size: 40px !important;',
    '  letter-spacing: 6px !important;',
    '  line-height: 1.5 !important;',
    '  text-align: center !important;',
    '}',
    '.lm-question.lm-big {',
    '  font-size: 19px !important;',
    '  text-align: center !important;',
    '}',
    '.s1-opt {',
    '  font-size: 14px !important;',
    '  min-height: 48px !important;',
    '  text-align: left !important;',
    '  padding: 10px 14px !important;',
    '  line-height: 1.5 !important;',
    '}',
    '.lm-opt-big {',
    '  font-size: 28px !important;',
    '  line-height: 1.2 !important;',
    '  text-align: center !important;',
    '  display: block !important;',
    '}'
  ].join('\n');
  document.head.appendChild(s);
}());

// ── Grade level selector ───────────────────────────────────────────────────
// Mirrors pattern's and modeling's own K/G grade chooser: the child picks a
// grade card before ever seeing a unit, instead of one flat list.

var GRADE_LEVELS = [
  { id: 'L1', badge: 'K1', nameZh: '幼儿园小/中班', nameEn: 'Pre-K',        descZh: '4–5岁 · 找不同类',   descEn: 'Age 4–5 · Spot the outlier' },
  { id: 'L2', badge: 'K2', nameZh: '幼儿园大班',    nameEn: 'Kindergarten', descZh: '5–6岁 · 图形排序',   descEn: 'Age 5–6 · Picture ordering' },
  { id: 'L3', badge: 'G1', nameZh: '小学一年级',    nameEn: 'Grade 1',      descZh: '6–7岁 · 单步推理',   descEn: 'Age 6–7 · Single-step reasoning' },
  { id: 'L4', badge: 'G2', nameZh: '小学二年级',    nameEn: 'Grade 2',      descZh: '7–8岁 · 条件与综合', descEn: 'Age 7–8 · Conditions & multi-step' }
];

function _unitsForLevel(levelId) {
  return ML_DATA.units.filter(function (u) { return UNIT_LEVEL[String(u.id)] === levelId; });
}

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
    units:    _unitsForLevel(levelId),

    /**
     * Render the premise (gray) and question (bold) inside the sequence area.
     * Uses premiseZh/premiseEn and questionZh/questionEn from the question object.
     * Picture units (unit.isPicture) get a much larger font so K1/K2 kids can
     * actually see the emoji clues.
     */
    renderSequence: function (q, container, unit) {
      var zh = shell.lang === 'zh';
      var big = unit && unit.isPicture;
      container.innerHTML =
        '<div class="lm-premise' + (big ? ' lm-big' : '') + '">' + (zh ? q.premiseZh : q.premiseEn) + '</div>' +
        '<div class="lm-question' + (big ? ' lm-big' : '') + '">' + (zh ? q.questionZh : q.questionEn) + '</div>';
    },

    /**
     * Display option labels bilingually.
     * `options` holds Chinese values used for comparison;
     * `optionsEn` holds the parallel English display labels.
     * Wrapped in a bigger-font span for picture units (same reasoning as
     * renderSequence above).
     */
    renderOption: function (opt, q, unit) {
      var label = opt;
      if (shell.lang !== 'zh') {
        var idx = q.options.indexOf(opt);
        label = (q.optionsEn && q.optionsEn[idx] !== undefined) ? q.optionsEn[idx] : opt;
      }
      return (unit && unit.isPicture) ? ('<span class="lm-opt-big">' + label + '</span>') : label;
    },

    /** Correct when the selected option text matches q.answer exactly. */
    checkAnswer: function (selected, q) {
      return selected === q.answer;
    },

    /** Read the premise and question aloud. */
    getVoiceText: function (q) {
      return shell.lang === 'zh'
        ? q.premiseZh + '。' + q.questionZh
        : q.premiseEn + '. ' + q.questionEn;
    },

    registerRootGenes: function () {
      // Ability genes only. The unit location used to be appended here as a
      // third gene; it now travels as unitId in the report, so the same ability
      // trained in different units lands on one radar axis instead of many.
      // See docs/rootgene/ROOTGENE-FRAMEWORK.md §5.
      return [
        'RG.LOGIC.REASONING.BASIC'
      ];
    }
  });

  _injectShellBackButtons();
}

_showLevelSelector();
