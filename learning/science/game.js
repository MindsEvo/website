'use strict';
/**
 * Science Game  v0.1.0  (Architecture-scaffold MVP)
 *
 * Mirrors learning/math/comparison/game.js's structure exactly: this file is
 * the only piece that knows both "puzzle" (shell.createGame / checkAnswer)
 * and "explore" (ActivityRunner / ExploreRuntime) exist, and it is the only
 * place that builds the shell.report() radar payload for either path.
 *
 * Session flow:
 *   1. Load templates-data.js (window.SCI_TEMPLATES_DATA)
 *   2. User selects grade level (K1 only, in this scaffold)
 *   3. SciEngine.getSessionTemplates() picks templates for the level
 *   4. Puzzle templates run through shell.createGame (checkAnswer path);
 *      Explore templates run through ActivityRunner -> ExploreRuntime
 *   5. Either path ends in SciEngine.recordAttempt() + shell.report()
 */

(function () {

  // ── Styles ─────────────────────────────────────────────────────────────────
  // Mirrors comparison/game.js's injected <style> block: everything the level
  // selector / result overlay needs, under a "sci-" prefix so it never
  // collides with comparison's "cq-" classes if both modules are ever loaded
  // in the same document (they are not, today, but the prefix is free).

  var styleEl = document.createElement('style');
  styleEl.id = 'sci-shell-style';
  styleEl.textContent = [
    '.cq{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;}',
    '.cq-q{font-size:22px;font-weight:900;color:#065f46;line-height:1.3;text-align:center;}',
    '.cq-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:400px;}',
    '.cq-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:340px;}',
    '.cq-cell{display:flex;flex-direction:column;align-items:center;gap:4px;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:14px;padding:14px 10px;}',
    '.cq-emoji{font-size:44px;line-height:1;text-align:center;}',
    '.cq-label{font-size:12px;font-weight:700;color:#166534;}',
    '.cq-opt{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:88px;padding:8px 4px;}',
    '.cq-opt-emoji{font-size:34px;line-height:1;}',
    '.cq-opt-label{font-size:12px;font-weight:800;color:#166534;}',
    '.cq-opt-text{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:64px;padding:10px 12px;text-align:center;}',
    '.cq-opt-text-line{font-size:13px;font-weight:700;color:#166534;line-height:1.35;}',
    '.sci-lvl-wrap{display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px 16px;}',
    '.sci-lvl-title-bar{display:flex;align-items:center;width:100%;max-width:520px;gap:8px;}',
    '.sci-lvl-title{font-size:20px;font-weight:900;color:#065f46;text-align:center;flex:1;}',
    '.sci-lvl-back{background:none;border:none;cursor:pointer;font-size:14px;font-weight:700;color:#059669;padding:4px 6px;border-radius:8px;white-space:nowrap;flex:0 0 auto;}',
    '.sci-lvl-back:hover{background:#ecfdf5;}',
    '.sci-lvl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;width:100%;max-width:440px;}',
    '.sci-lvl-card{border:2px solid #a7f3d0;border-radius:16px;padding:18px 14px;cursor:pointer;text-align:center;background:#fff;transition:transform .16s,border-color .16s,box-shadow .16s;}',
    '.sci-lvl-card:hover{transform:translateY(-2px);border-color:#34d399;box-shadow:0 8px 20px rgba(5,150,105,0.12);}',
    '.sci-lvl-card.locked{opacity:0.45;cursor:default;pointer-events:none;}',
    '.sci-lvl-badge{font-size:26px;font-weight:900;color:#047857;margin-bottom:4px;}',
    '.sci-lvl-name{font-size:13px;font-weight:700;color:#334155;}',
    '.sci-lvl-desc{font-size:11px;color:#94a3b8;margin-top:4px;}',
    '.sci-lvl-tag{display:inline-block;font-size:10px;font-weight:700;border-radius:6px;padding:2px 8px;margin-top:6px;}',
    '.sci-lvl-tag.free{background:#dcfce7;color:#16a34a;}',
    '.sci-lvl-tag.locked-tag{background:#f1f5f9;color:#94a3b8;}',
    '.sci-lvl-cycle{font-size:11px;font-weight:700;color:#059669;margin-top:5px;}',
    '.sci-lvl-cycle.done{color:#16a34a;}',
    '#s1-replay{display:none!important;}',
    '#sci-home-back{margin-right:auto;background:none;border:none;cursor:pointer;font-size:20px;padding:4px 8px;color:#047857;line-height:1;}',
    '.sci-prog{padding:12px 16px;background:#f0fdf4;border-radius:12px;margin-bottom:10px;width:100%;max-width:360px;}',
    '.sci-prog-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}',
    '.sci-prog-label{font-size:13px;font-weight:700;color:#334155;}',
    '.sci-prog-pct{font-size:15px;font-weight:900;}',
    '.sci-prog-track{height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-bottom:6px;}',
    '.sci-prog-fill{height:100%;border-radius:999px;transition:width .5s ease;}',
    '.sci-prog-msg{font-size:12px;color:#64748b;text-align:center;}'
  ].join('');
  document.head.appendChild(styleEl);

  // ── Question renderers (puzzle) ──────────────────────────────────────────────
  // The pair/option layout (cq-pair/cq-cell/cq-opt) is shared across every
  // puzzle phenomenon — only the prompt text is type-specific, so dispatch is
  // just a text lookup by q.type (no per-type scene functions needed, unlike
  // comparison/game.js).

  var PROMPT_TEXT = {
    float_puzzle:       { zh: '哪一个会<b>浮起来</b>？', en: 'Which one will <b>float</b>?' },
    magnet_puzzle:       { zh: '哪一个会被<b>磁铁吸住</b>？', en: 'Which one will the magnet <b>attract</b>?' },
    observe_odd_puzzle:  { zh: '哪一个和其他<b>不一样</b>？', en: 'Which one is <b>different</b> from the others?' },
    motion_roll_puzzle:  { zh: '哪一个<b>滚得更远</b>？', en: 'Which one will <b>roll farther</b>?' },
    life_fly_puzzle:     { zh: '哪一个<b>会飞</b>？', en: 'Which one <b>can fly</b>?' },
    matter_describe_puzzle: { zh: '<b>描述</b>一下它。', en: '<b>Describe</b> it.' },
    life_describe_puzzle:   { zh: '<b>描述</b>一下它。', en: '<b>Describe</b> it.' },
    earth_question_puzzle:  { zh: '哪个<b>问题</b>可以研究？', en: 'Which <b>question</b> could you investigate?' },
    energy_question_puzzle: { zh: '哪个<b>问题</b>可以研究？', en: 'Which <b>question</b> could you investigate?' }
  };

  function renderSequence(q, container) {
    var prompt = q.promptZh && q.promptEn ? q : (PROMPT_TEXT[q.type] || PROMPT_TEXT.float_puzzle);
    var promptZh = q.promptZh || prompt.zh;
    var promptEn = q.promptEn || prompt.en;
    var bodyHtml;
    if (q.items) {
      bodyHtml = '<div class="cq-grid">' + q.items.map(function (item) {
        return '<div class="cq-cell"><div class="cq-emoji">' + item.emoji + '</div>' +
          '<div class="cq-label"><span class="zh">' + item.nameZh + '</span><span class="en">' + item.nameEn + '</span></div></div>';
      }).join('') + '</div>';
    } else if (q.left && q.right) {
      bodyHtml =
        '<div class="cq-pair">' +
          '<div class="cq-cell"><div class="cq-emoji">' + q.left.emoji + '</div>' +
            '<div class="cq-label"><span class="zh">' + q.left.nameZh + '</span><span class="en">' + q.left.nameEn + '</span></div></div>' +
          '<div class="cq-cell"><div class="cq-emoji">' + q.right.emoji + '</div>' +
            '<div class="cq-label"><span class="zh">' + q.right.nameZh + '</span><span class="en">' + q.right.nameEn + '</span></div></div>' +
        '</div>';
    } else if (q.stimulus) {
      bodyHtml = '<div class="cq-grid" style="max-width:180px;"><div class="cq-cell"><div class="cq-emoji">' + q.stimulus.emoji + '</div>' +
        '<div class="cq-label"><span class="zh">' + q.stimulus.nameZh + '</span><span class="en">' + q.stimulus.nameEn + '</span></div></div></div>';
    } else {
      bodyHtml = '';
    }
    container.innerHTML =
      '<div class="cq"><div class="cq-q">' +
        '<span class="zh">' + promptZh + '</span>' +
        '<span class="en">' + promptEn + '</span>' +
      '</div>' + bodyHtml + '</div>';
  }

  function renderOption(opt, q) {
    if (q.textOptions) {
      var textOpt = q.textOptions[opt];
      return '<div class="cq-opt cq-opt-text"><div class="cq-opt-text-line"><span class="zh">' + textOpt.zh + '</span><span class="en">' + textOpt.en + '</span></div></div>';
    }
    if (q.items) {
      var gridItem = q.items[opt];
      return '<div class="cq-opt"><div class="cq-opt-emoji">' + gridItem.emoji + '</div>' +
        '<div class="cq-opt-label"><span class="zh">' + gridItem.nameZh + '</span><span class="en">' + gridItem.nameEn + '</span></div></div>';
    }
    var item = opt === 'left' ? q.left : q.right;
    var lbl = opt === 'left' ? { zh: '选 A', en: 'A' } : { zh: '选 B', en: 'B' };
    return '<div class="cq-opt"><div class="cq-opt-emoji">' + item.emoji + '</div>' +
      '<div class="cq-opt-label"><span class="zh">' + item.nameZh + '</span><span class="en">' + item.nameEn + '</span></div>' +
      '<div class="cq-opt-label"><span class="zh">' + lbl.zh + '</span><span class="en">' + lbl.en + '</span></div></div>';
  }

  function checkAnswer(selected, q) { return selected === q.answer; }

  // Comparison's getVoiceText (game.js:421) returns one plain-language string
  // picked by shell.lang — never raw HTML, never both languages concatenated.
  // Dispatch by q.type mirrors PROMPT_TEXT above, just as plain text instead
  // of HTML (speechSynthesis would read markup literally).
  var VOICE_TEXT = {
    float_puzzle:       { zh: '哪一个会浮起来？', en: 'Which one will float?' },
    magnet_puzzle:       { zh: '哪一个会被磁铁吸住？', en: 'Which one will the magnet attract?' },
    observe_odd_puzzle:  { zh: '哪一个和其他不一样？', en: 'Which one is different from the others?' },
    motion_roll_puzzle:  { zh: '哪一个滚得更远？', en: 'Which one will roll farther?' },
    life_fly_puzzle:     { zh: '哪一个会飞？', en: 'Which one can fly?' },
    matter_describe_puzzle: { zh: '描述一下它。', en: 'Describe it.' },
    life_describe_puzzle:   { zh: '描述一下它。', en: 'Describe it.' },
    earth_question_puzzle:  { zh: '哪个问题可以研究？', en: 'Which question could you investigate?' },
    energy_question_puzzle: { zh: '哪个问题可以研究？', en: 'Which question could you investigate?' }
  };

  function getVoiceText(q) {
    if (q.voiceZh && q.voiceEn) return shell.lang === 'zh' ? q.voiceZh : q.voiceEn;
    var t = VOICE_TEXT[q.type] || VOICE_TEXT.float_puzzle;
    return shell.lang === 'zh' ? t.zh : t.en;
  }

  // ── Radar / RootGene plumbing ────────────────────────────────────────────────

  var MODULE_ID       = 'science';
  var MODULE_TYPE      = 'metathinking';
  var SOURCE_GAME_ID   = 'learning-science';

  /**
   * levelId -> gradeCode. Written out explicitly (not assumed identity) for the
   * same reason comparison/game.js does: shell.grade.normalize() refuses to
   * guess, and every module has to declare its own mapping.
   */
  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };

  /**
   * Template `type` (Context Domain) -> typeTree id in science.json. Kept as
   * an explicit (rather than assumed identity) map so new domains can be
   * added without touching the radar plumbing.
   */
  var CONTEXT_DOMAIN_OF = { matter: 'matter', life: 'life', motion: 'motion', earth: 'earth', energy: 'energy' };

  function difficultyAxisFor(levelId) {
    var base = {
      K1: { object_complexity: 'concrete', variable_complexity: 'single',
            inference_complexity: 'direct', language_complexity: 'action',
            transfer_complexity: 'within-domain' },
      K2: { object_complexity: 'concrete', variable_complexity: 'single',
            inference_complexity: 'direct', language_complexity: 'question',
            transfer_complexity: 'within-domain' },
      G1: { object_complexity: 'concrete', variable_complexity: 'single',
            inference_complexity: 'indirect', language_complexity: 'question',
            transfer_complexity: 'within-domain' },
      G2: { object_complexity: 'symbolic', variable_complexity: 'single',
            inference_complexity: 'chain', language_complexity: 'compound',
            transfer_complexity: 'cross-domain' }
    }[levelId];
    return base ? Object.assign({}, base) : null;
  }

  /**
   * The single place that builds the radar payload. Both the puzzle path
   * (via getReportContext) and the explore path (via _reportExploration) call
   * this, so a change to the contract cannot land on one path and miss the
   * other.
   */
  function buildRadarContext(levelId, domainType, extra) {
    var ctx = {
      moduleId:       MODULE_ID,
      moduleType:     MODULE_TYPE,
      levelId:        levelId || null,
      gradeCode:      LEVEL_GRADE[levelId] || null,
      comparisonType: domainType ? (CONTEXT_DOMAIN_OF[domainType] || 'matter') : null,
      contextDomain:  domainType || null,
      difficultyAxis: difficultyAxisFor(levelId),
      sourceGameId:   SOURCE_GAME_ID
    };
    return extra ? Object.assign(ctx, extra) : ctx;
  }

  /** Most frequent value in an array, or null. Used to label a mixed batch. */
  function _dominant(values) {
    var counts = {}, best = null, bestN = 0;
    values.forEach(function (v) {
      if (!v) return;
      counts[v] = (counts[v] || 0) + 1;
      if (counts[v] > bestN) { bestN = counts[v]; best = v; }
    });
    return best;
  }

  function registerRootGenes(ctx) {
    var unit = (ctx && ctx.unit) || {}, genes = ['RG.SCIENCE.OBSERVATION.BASIC'];
    if (unit.rootGeneIds && Array.isArray(unit.rootGeneIds)) unit.rootGeneIds.forEach(function (g) { genes.push(g); });
    return genes;
  }

  var _sessionTemplateMap = {};

  function onAnswer(selected, q, correct, elapsedMs) {
    var tpl = _sessionTemplateMap[q.templateId];
    if (!tpl) return;
    SciEngine.recordSessionAnswer(tpl.level, tpl.id, correct);
    SciEngine.recordAttempt(q.templateId, q.variantId || SciEngine.makeVariantId(q.templateId), correct, elapsedMs || 0, false, tpl, {
      mode:   'puzzle',
      result: correct ? 'correct' : 'incorrect',
      radar:  buildRadarContext(tpl.level, tpl.type)
    });
  }

  // ── Grade level selector ───────────────────────────────────────────────────

  var GRADE_LEVELS = [
    { id: 'K1', badge: 'K1', nameZh: '幼儿园小/中班', nameEn: 'Pre-K', descZh: '3–4岁 · 浮与沉', descEn: 'Age 3-4 · Float & Sink', free: true },
    { id: 'K2', badge: 'K2', nameZh: '幼儿园大班', nameEn: 'Kindergarten', descZh: '4–5岁 · 描述现象', descEn: 'Age 4-5 · Describe', free: true },
    { id: 'G1', badge: 'G1', nameZh: '小学一年级', nameEn: 'Grade 1', descZh: '5–6岁 · 预测新情境', descEn: 'Age 5-6 · Predict', free: true },
    { id: 'G2', badge: 'G2', nameZh: '小学二年级', nameEn: 'Grade 2', descZh: '6–7岁 · 提出问题', descEn: 'Age 6-7 · Question', free: true }
  ];

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  function _buildUnitsForLevel(levelId, templates) {
    _sessionTemplateMap = {};
    var selected = SciEngine.getSessionTemplates(levelId, templates).filter(function (tpl) {
      return !tpl.runtime || tpl.runtime === 'puzzle';
    });
    var questions = selected.map(function (tpl) {
      var q = SciGenerators.generateQuestion(tpl);
      if (!q) {
        console.warn('[science] generator produced no question for', tpl.id, '— skipping template');
        SciEngine.skipTemplate(levelId, tpl.id);
        return null;
      }
      _sessionTemplateMap[tpl.id] = tpl;
      return q;
    }).filter(Boolean);
    var n = questions.length;
    // Unlike Comparison (one gene for the whole module, so a hardcoded id
    // loses nothing), Science's six meta-thinking genes are meant to differ
    // per template — union the selected templates' own rootGeneIds so a
    // puzzle session reports the gene(s) it actually exercised.
    var geneIds = [];
    selected.forEach(function (tpl) {
      (tpl.rootGeneIds || []).forEach(function (g) {
        if (geneIds.indexOf(g) === -1) geneIds.push(g);
      });
    });
    if (!geneIds.length) geneIds.push('RG.SCIENCE.OBSERVATION.BASIC');
    return [{
      id: levelId + '-session',
      nameZh: levelId + ' · 科学挑战',
      nameEn: levelId + ' · Science Challenge',
      icon: '🔬',
      descZh: n + '题 · 观察与预测',
      descEn: n + ' questions · Observe & Predict',
      rootGeneIds: geneIds,
      questions: questions
    }];
  }

  function _init() {
    // Loaded from templates-data.js (a plain global) rather than
    // fetch('./templates.json') — fetch() of a same-folder file is blocked
    // when this page is opened via file://, same reason comparison/game.js
    // uses this pattern.
    _showLevelSelector((window.SCI_TEMPLATES_DATA && window.SCI_TEMPLATES_DATA.templates) || []);
  }

  function _showLevelSelector(templates) {
    var lang = shell.lang || 'zh';
    var wrap = document.createElement('div');
    wrap.id = 'sci-level-selector';
    wrap.innerHTML = '<div class="sci-lvl-wrap">' +
      '<div class="sci-lvl-title-bar">' +
        '<button class="sci-lvl-back" id="sci-sel-back">⬅️ <span class="zh">学习中心</span><span class="en">Learning</span></button>' +
        '<div class="sci-lvl-title"><span class="zh">科学 · 选择年级</span><span class="en">Science · Grade</span></div>' +
        IH.controlsHtml('lvl') +
      '</div>' +
      '<div class="sci-lvl-grid">' +
      GRADE_LEVELS.map(function (lvl) {
        var lk = !lvl.free;
        return '<div class="sci-lvl-card' + (lk ? ' locked' : '') + '" data-level="' + lvl.id + '">' +
          '<div class="sci-lvl-badge">' + lvl.badge + '</div>' +
          '<div class="sci-lvl-name"><span class="zh">' + lvl.nameZh + '</span><span class="en">' + lvl.nameEn + '</span></div>' +
          '<div class="sci-lvl-desc"><span class="zh">' + lvl.descZh + '</span><span class="en">' + lvl.descEn + '</span></div>' +
          '<div class="sci-lvl-tag ' + (lk ? 'locked-tag' : 'free') + '"><span class="zh">' + (lk ? '即将推出' : '免费') + '</span><span class="en">' + (lk ? 'Soon' : 'Free') + '</span></div>' +
          (function () {
            if (lk) return '';
            var cs = SciEngine.getCycleStatus(lvl.id);
            if (cs.unlocked) return '<div class="sci-lvl-cycle done"><span class="zh">✓ 已解锁</span><span class="en">✓ Unlocked</span></div>';
            if (cs.started)  return '<div class="sci-lvl-cycle"><span class="zh">进度 ' + cs.doneCount + '/' + cs.totalCount + '</span><span class="en">' + cs.doneCount + '/' + cs.totalCount + ' done</span></div>';
            return '';
          })() +
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

    var backBtn = document.getElementById('sci-sel-back');
    if (backBtn) backBtn.addEventListener('click', function () { window.location.href = '../index.html'; });

    wrap.addEventListener('click', function (e) {
      var card = e.target.closest('.sci-lvl-card:not(.locked)');
      if (!card) return;
      wrap.remove();
      _launchGame(card.getAttribute('data-level'), templates);
    });
  }

  function _tearDownShell() {
    var wrap = document.querySelector('.s1-wrap');
    var transcript = document.getElementById('s1-transcript');
    var overlay = document.getElementById('s1-overlay');
    if (wrap) wrap.remove();
    if (transcript) transcript.remove();
    if (overlay) overlay.remove();
  }

  // Gates the "upgrade to next level" branches in _showExplorationResult and
  // _watchForResultAndInjectNextLevel (both index into this array).
  var LEVEL_ORDER = ['K1', 'K2', 'G1', 'G2'];

  function _launchGame(levelId, templates) {
    var selected = SciEngine.getSessionTemplates(levelId, templates);

    // Explore templates run one at a time through ActivityRunner; puzzle
    // templates run as a batch through shell.createGame — same split as
    // comparison/game.js's interaction vs puzzle templates.
    var firstExploration = selected.filter(function (tpl) {
      return tpl.runtime && tpl.runtime !== 'puzzle';
    })[0];

    if (firstExploration) {
      _launchExploration(firstExploration, levelId, templates);
    } else {
      _launchPuzzleSession(levelId, templates);
    }
  }

  /**
   * Put an Explore activity on the thinking radar's depth axis. Mirrors
   * comparison/game.js's _reportInteraction() exactly, except the `context`
   * payload also carries the full raw event trace (attempt.trace) — the
   * ExploreRuntime never sends that to SciEngine.recordAttempt() (which only
   * ever sees the flat `process` summary), so this is the one place it can
   * reach shell.report()'s untouched, persisted `context` column.
   */
  function _reportExploration(tpl, levelId, attempt, correct) {
    if (!shell || typeof shell.report !== 'function') return;
    var radar = buildRadarContext(tpl.level || levelId, tpl.type);

    shell.report({
      gameId:     SOURCE_GAME_ID,
      unitId:     levelId + '-session',
      templateId: tpl.id,
      variantId:  attempt.variantId || null,
      score:      correct ? 1 : 0,
      total:      1,
      timeMs:     attempt.responseMs || 0,
      hintsUsed:  0,
      geneIds:    registerRootGenes({ unit: tpl }),
      shell:      'shell-1',
      activityRuntime: 'interaction',
      activityMode:    attempt.mode || tpl.runtime || tpl.mode || null,
      result:     attempt.result || null,
      levelId:        radar.levelId,
      gradeCode:      radar.gradeCode,
      comparisonType: radar.comparisonType,
      difficultyAxis: radar.difficultyAxis,
      moduleId:       radar.moduleId,
      moduleType:     radar.moduleType,
      // Full raw event trace preserved here — shell.report()/storage.set()
      // persists `context` untouched, so this is what the server's
      // record/context JSON columns end up seeing.
      context: Object.assign({}, radar, { trace: attempt.trace || [] })
    });
  }

  // Run a single Explore template via ActivityRunner -> ExploreRuntime.
  function _launchExploration(tpl, levelId, templates) {
    var variant = SciGenerators.generateQuestion(tpl);
    if (!variant) {
      console.warn('[science] generator produced no variant for', tpl.id, '— skipping template');
      SciEngine.skipTemplate(levelId, tpl.id);
      _launchGame(levelId, templates);
      return;
    }

    ActivityRunner.launch(tpl, variant, {
      levelId: levelId,
      onComplete: function (attempt) {
        if (attempt.result === 'aborted') {
          _showLevelSelector(templates);
          return;
        }
        var correct = attempt.result === 'correct' || attempt.result === 'passed';

        SciEngine.recordSessionAnswer(tpl.level, tpl.id, correct);
        SciEngine.recordAttempt(tpl.id, attempt.variantId, correct,
          attempt.responseMs, false, tpl, {
            mode:    attempt.mode || tpl.runtime || tpl.mode,
            result:  attempt.result,
            // Flat summary only — the raw trace goes to _reportExploration()'s
            // shell.report() context instead, never to the mastery engine.
            process: attempt.process,
            radar:   buildRadarContext(tpl.level || levelId, tpl.type)
          });

        _reportExploration(tpl, levelId, attempt, correct);

        var remaining = SciEngine.getSessionRemaining(levelId);
        if (remaining > 0) {
          _launchGame(levelId, templates);
        } else {
          var sr = SciEngine.completeSession(levelId);
          _showExplorationResult(attempt, sr, levelId, templates);
        }
      },
      onBack: function () {
        _showLevelSelector(templates);
      }
    });
  }

  var EXPLORATION_RESULT_TEXT = { zh: '探索完成！', en: 'Exploration complete!' };
  var EXPLORATION_INCOMPLETE_TEXT = { zh: '继续探索吧！', en: 'Keep exploring!' };

  // Brief result overlay after a solo Explore activity. Mirrors
  // comparison/game.js's _showInteractionResult(), minus the mini-game stats
  // block (Science has no mini-game runtime in this scaffold).
  function _showExplorationResult(attempt, sr, levelId, templates) {
    var nextIdx   = LEVEL_ORDER.indexOf(levelId) + 1;
    var nextLevel = nextIdx < LEVEL_ORDER.length ? LEVEL_ORDER[nextIdx] : null;

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.94);z-index:600;' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:32px;';

    var good = attempt.result === 'correct' || attempt.result === 'passed';
    var icon = sr.cycleComplete && sr.unlocked ? '🏆' : (good ? '⭐' : '💪');
    var text = good ? EXPLORATION_RESULT_TEXT : EXPLORATION_INCOMPLETE_TEXT;
    overlay.innerHTML =
      '<div style="font-size:52px">' + icon + '</div>' +
      '<div style="font-size:20px;font-weight:900;color:#065f46;text-align:center">' +
        '<span class="zh">' + text.zh + '</span>' +
        '<span class="en">' + text.en + '</span>' +
      '</div>' +
      '<div id="sor-acts" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;"></div>';

    document.body.appendChild(overlay);
    _applyLangVisibility(overlay);

    var acts = document.getElementById('sor-acts');

    var nextBtn = document.createElement('button');
    nextBtn.className = 's1-abtn s1-primary';
    nextBtn.innerHTML = '<span class="zh">下一组 →</span><span class="en">Next Group →</span>';
    _applyLangVisibility(nextBtn);
    nextBtn.addEventListener('click', function () {
      overlay.remove();
      _launchGame(levelId, templates);
    });
    acts.appendChild(nextBtn);

    if (sr.cycleComplete && sr.unlocked && nextLevel) {
      var upBtn = document.createElement('button');
      upBtn.className = 's1-abtn s1-primary';
      upBtn.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
      upBtn.innerHTML = '<span class="zh">升级到 ' + nextLevel + ' →</span><span class="en">Next: ' + nextLevel + ' →</span>';
      _applyLangVisibility(upBtn);
      upBtn.addEventListener('click', function () { overlay.remove(); _launchGame(nextLevel, templates); });
      acts.appendChild(upBtn);
    }

    var homeBtn = document.createElement('button');
    homeBtn.className = 's1-abtn s1-outline';
    homeBtn.innerHTML = '<span class="zh">返回主页</span><span class="en">Home</span>';
    _applyLangVisibility(homeBtn);
    homeBtn.addEventListener('click', function () { overlay.remove(); _showLevelSelector(templates); });
    acts.appendChild(homeBtn);
  }

  // Puzzle flow — units run through shell.createGame's own screens.
  function _launchPuzzleSession(levelId, templates) {
    var units = _buildUnitsForLevel(levelId, templates);
    shell.createGame({
      id: 'learning-science',
      theme: { primary: '#059669', primary2: '#047857', bg: '#ecfdf5' },
      gui: {
        header: { show: true, showBack: true },
        language: { enabled: true, default: 'en' },
        audio: { music: { enabled: true, defaultOn: false }, sound: { enabled: true, defaultOn: true } },
        history: { enabled: true },
        help: { enabled: true,
          contentZh: '仔细观察题目，选出你觉得会浮起来的那一个。',
          contentEn: 'Observe the items and pick the one you think will float.' }
      },
      title: { zh: '🔬 科学 · ' + levelId, en: '🔬 Science · ' + levelId },
      subtitle: { zh: '观察、预测、验证', en: 'Observe, Predict, Verify' },
      // debug:false → real progression. Append ?debug=1 to the URL to test.
      passScore: 1, debug: false, units: units,
      renderSequence: renderSequence, renderOption: renderOption,
      checkAnswer: checkAnswer, getVoiceText: getVoiceText,
      registerRootGenes: registerRootGenes, onAnswer: onAnswer,
      getReportContext: function () {
        var types = Object.keys(_sessionTemplateMap).map(function (id) {
          return CONTEXT_DOMAIN_OF[_sessionTemplateMap[id].type] || null;
        });
        return buildRadarContext(levelId, null, {
          comparisonType: _dominant(types),
          contextDomains: types.filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; }),
          activityRuntime: 'puzzle'
        });
      }
    });

    _injectShellHomeBackButton(templates);
    _watchForResultAndInjectNextLevel(levelId, templates);
  }

  // Add "← 返回选级" button to shell home header so user can go back to grade chooser.
  function _injectShellHomeBackButton(templates) {
    var homeHdr = document.querySelector('#s1-home .s1-hdr');
    if (!homeHdr || document.getElementById('sci-home-back')) return;
    var btn = document.createElement('button');
    btn.id = 'sci-home-back';
    btn.innerHTML = '⬅️';
    btn.title = '返回选级 / Back to levels';
    btn.addEventListener('click', function () {
      _tearDownShell();
      _showLevelSelector(templates);
    });
    homeHdr.insertBefore(btn, homeHdr.firstChild);
  }

  // Show progress + conditionally show upgrade button on result screen.
  function _watchForResultAndInjectNextLevel(levelId, templates) {
    var nextIdx   = LEVEL_ORDER.indexOf(levelId) + 1;
    var nextLevel = nextIdx < LEVEL_ORDER.length ? LEVEL_ORDER[nextIdx] : null;

    var resultEl = document.getElementById('s1-result');
    if (!resultEl) return;

    var injected = false;
    var observer = new MutationObserver(function () {
      if (injected || resultEl.classList.contains('s1-hidden')) return;
      injected = true;
      observer.disconnect();

      var sr = SciEngine.completeSession(levelId);

      var acts = document.getElementById('s1-racts');
      if (!acts) return;

      var retryBtn = acts.firstElementChild;
      if (retryBtn) {
        var freshRetry = retryBtn.cloneNode(true);
        retryBtn.parentNode.replaceChild(freshRetry, retryBtn);
        freshRetry.addEventListener('click', function () {
          _tearDownShell();
          _launchGame(levelId, templates);
        });
      }

      _injectCycleProgress(levelId, sr, acts);

      if (sr.cycleComplete) {
        if (sr.unlocked && nextLevel) {
          var upgradeBtn = document.createElement('button');
          upgradeBtn.className = 's1-abtn s1-primary';
          upgradeBtn.innerHTML = '<span class="zh">升级到 ' + nextLevel + ' →</span><span class="en">Next: ' + nextLevel + ' →</span>';
          _applyLangVisibility(upgradeBtn);
          upgradeBtn.addEventListener('click', function () { _tearDownShell(); _launchGame(nextLevel, templates); });
          acts.insertBefore(upgradeBtn, acts.lastElementChild);
        }
      } else {
        var nextBtn = document.createElement('button');
        nextBtn.className = 's1-abtn s1-primary';
        nextBtn.innerHTML = '<span class="zh">下一组 →</span><span class="en">Next Group →</span>';
        _applyLangVisibility(nextBtn);
        nextBtn.addEventListener('click', function () {
          _tearDownShell();
          _launchGame(levelId, templates);
        });
        acts.insertBefore(nextBtn, acts.lastElementChild);
      }
    });

    observer.observe(resultEl, { attributes: true, attributeFilter: ['class'] });
  }

  function _injectCycleProgress(levelId, sr, acts) {
    var cycleComplete = sr.cycleComplete;
    var doneCount  = sr.doneCount || 0;
    var totalCount = sr.totalCount || 1;
    var pct = Math.round(doneCount / totalCount * 100);
    var accuracyPct = sr.accuracyPct || 0;

    var color, labelZh, labelEn, msgZh, msgEn, barPct;
    if (cycleComplete) {
      barPct  = accuracyPct;
      color   = sr.unlocked ? '#22c55e' : '#f59e0b';
      labelZh = levelId + ' 准确率'; labelEn = levelId + ' Accuracy';
      msgZh   = sr.unlocked ? levelId + ' 已掌握！准确率 ' + accuracyPct + '% 🎉' : '准确率 ' + accuracyPct + '%，建议再来一轮（需要 ≥80%）';
      msgEn   = sr.unlocked ? levelId + ' mastered! ' + accuracyPct + '% 🎉' : 'Accuracy ' + accuracyPct + '%, try again (need ≥80%)';
    } else {
      barPct  = pct;
      color   = '#059669';
      labelZh = levelId + ' 本轮进度'; labelEn = levelId + ' Cycle';
      msgZh   = '已完成 ' + doneCount + '/' + totalCount + ' 题，继续加油！';
      msgEn   = doneCount + '/' + totalCount + ' done — keep going!';
    }

    var div = document.createElement('div');
    div.className = 'sci-prog';
    div.innerHTML =
      '<div class="sci-prog-row">' +
        '<span class="sci-prog-label"><span class="zh">' + labelZh + '</span><span class="en">' + labelEn + '</span></span>' +
        '<span class="sci-prog-pct" style="color:' + color + '">' + (cycleComplete ? accuracyPct + '%' : doneCount + '/' + totalCount) + '</span>' +
      '</div>' +
      '<div class="sci-prog-track"><div class="sci-prog-fill" style="width:' + Math.min(100, barPct) + '%;background:' + color + '"></div></div>' +
      '<div class="sci-prog-msg"><span class="zh">' + msgZh + '</span><span class="en">' + msgEn + '</span></div>';
    _applyLangVisibility(div);
    acts.parentNode.insertBefore(div, acts);
  }

  function _applyLangVisibility(el) {
    var lang = shell.lang || 'zh';
    function apply(l) {
      el.querySelectorAll('.zh').forEach(function (n) { n.style.display = l === 'zh' ? '' : 'none'; });
      el.querySelectorAll('.en').forEach(function (n) { n.style.display = l === 'en' ? '' : 'none'; });
    }
    apply(lang);
    document.addEventListener('shell:langchange', function (e) { apply(e.detail && e.detail.lang); });
  }

  _init();

}());
