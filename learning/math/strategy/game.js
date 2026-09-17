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
 * Depends on: shell.js, data.js (MS_DATA)
 */

// unit.id -> levelId, for the grade selector's pre-filter (mirrors
// logic/game.js's UNIT_LEVEL).
var UNIT_LEVEL = {
  'best-1': 'L1', 'sequence-1': 'L2',
  '1': 'L3', '2': 'L3', '3': 'L3',
  '4': 'L4', '5': 'L4', '6': 'L4'
};

// ── Inject CSS for text-based sequence display ────────────────────────────────
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
    '.lm-premise.ms-big {',
    '  font-size: 40px !important;',
    '  letter-spacing: 6px !important;',
    '  line-height: 1.5 !important;',
    '  text-align: center !important;',
    '}',
    '.lm-question.ms-big {',
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
    '.ms-opt-big {',
    '  font-size: 28px !important;',
    '  line-height: 1.2 !important;',
    '  text-align: center !important;',
    '  display: block !important;',
    '}'
  ].join('\n');
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

function _unitsForLevel(levelId) {
  return MS_DATA.units.filter(function (u) { return UNIT_LEVEL[String(u.id)] === levelId; });
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

  /** Display premise (gray context) + question (bold). Picture units get a bigger font. */
  renderSequence: function (q, container, unit) {
    var zh = shell.lang === 'zh';
    var big = unit && unit.isPicture;
    container.innerHTML =
      '<div class="lm-premise' + (big ? ' ms-big' : '') + '">' + (zh ? q.premiseZh : q.premiseEn) + '</div>' +
      '<div class="lm-question' + (big ? ' ms-big' : '') + '">' + (zh ? q.questionZh : q.questionEn) + '</div>';
  },

  /**
   * Show bilingual option labels.
   * `options` = Chinese keys used for comparison.
   * `optionsEn` = parallel English display labels.
   */
  renderOption: function (opt, q, unit) {
    var label = opt;
    if (shell.lang !== 'zh') {
      var idx = q.options.indexOf(opt);
      label = (q.optionsEn && q.optionsEn[idx] !== undefined) ? q.optionsEn[idx] : opt;
    }
    return (unit && unit.isPicture) ? ('<span class="ms-opt-big">' + label + '</span>') : label;
  },

  /** Correct when selected text matches q.answer exactly. */
  checkAnswer: function (selected, q) {
    return selected === q.answer;
  },

  /** Voice: read premise then question. */
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
      'RG.STRATEGY.DECISION.PLANNING'
    ];
  }
  });

  _injectShellBackButtons();
}

_showLevelSelector();
