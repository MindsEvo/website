'use strict';

/**
 * Difference Scout — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * MindSeeds · Attention & Comparison · 找不同侦探
 *
 * This is the MindSeeds series' first module to carry a radar contract, so it is
 * modelled deliberately closely on learning/math/pattern/game.js — the
 * declarations below (LEVEL_GRADE, GENES, SESSION_SIZE and the `base` table
 * inside difficultyAxisFor()) are cross-checked against
 * metadata/mindseeds/difference-scout.json by metadata/validate.html (suites
 * S2 / S3). Keep them literal `var X = {` declarations: the validator reads this
 * file as text, not as a module.
 *
 * Why this game may claim school grades at all
 * ────────────────────────────────────────────
 * shell.js §"Canonical Level Vocabulary" and games/spatial-pattern-hunter's
 * `gradeCode: null` set the rule: a MindSeeds game must not assert a grade band
 * its content does not earn, because a wrong band pollutes the aggregate worse
 * than a missing one. So the content was rebuilt per grade first (data.js →
 * gradeConfig): every grade differs from the one below it on at least one
 * DECLARED axis — 4→5→6→8 slots, cross-family→same-family→near-pair mismatches,
 * and a second attribute channel at G2. The grade claim is therefore checkable,
 * and metadata/mindseeds/difference-scout.json is where it is checked.
 *
 * Metadata:  /metadata/mindseeds/difference-scout.json
 * RootGene:  RG.ATTENTION.SEARCH.VISUAL (the search) +
 *            RG.LOGIC.COMPARISON.BASIC  (the pairwise judgement it is made of)
 */
(function () {

  var MODULE_ID      = 'difference-scout';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'difference-scout';

  // gradeCode → gradeCode. Identity, and written out anyway for two reasons:
  // shell.grade.normalize() refuses to guess ('L2' is not the same grade in
  // every module), and validate.js S2 looks up metadata levelMap rows BY
  // gradeCode — so a map keyed any other way ({ L1:'K1' }) FAILs there.
  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };

  // Home-screen order, shallowest first. Also the order the unit cards render.
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];

  /**
   * Both genes, every session — unlike pattern's per-structure gene reporting,
   * this module has one task shape and it exercises both abilities at once:
   * sustained search through distractors (ATTENTION) carried out as a run of
   * paired same/different judgements (LOGIC). Reporting only one would be a
   * half-truth in either direction.
   */
  var GENES = ['RG.ATTENTION.SEARCH.VISUAL', 'RG.LOGIC.COMPARISON.BASIC'];

  // Items per run. Short on purpose: MindSeeds trades depth for a fast cycle a
  // child will start again (ROADMAP §2.2), and visual scanning tires quickly.
  // Mirrors difference-scout.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 8;

  /**
   * The five difficulty axes of difference-scout.json, per grade.
   *
   * Unlike pattern's table, no two rows here are identical — that is the whole
   * justification for this module reporting a gradeCode instead of null. Each
   * step down the table moves at least one axis:
   *   K1→K2  scan_load, distractor_similarity, option_span
   *   K2→G1  scan_load, distractor_similarity
   *   G1→G2  scan_load, attribute_count
   *
   * mismatch_channel is a property of the ITEM, not of the grade, so it starts
   * at 'identity' for every row and is refined below — the same idiom pattern
   * uses for inference_direction.
   */
  function difficultyAxisFor(gradeCode, channel) {
    var base = {
      K1: { scan_load: 'short',    distractor_similarity: 'cross-family',
            attribute_count: 'single', option_span: 'all-slots',
            mismatch_channel: 'identity' },
      K2: { scan_load: 'medium',   distractor_similarity: 'same-family',
            attribute_count: 'single', option_span: 'subset',
            mismatch_channel: 'identity' },
      G1: { scan_load: 'long',     distractor_similarity: 'near-pair',
            attribute_count: 'single', option_span: 'subset',
            mismatch_channel: 'identity' },
      G2: { scan_load: 'extended', distractor_similarity: 'near-pair',
            attribute_count: 'dual',   option_span: 'subset',
            mismatch_channel: 'identity' }
    }[gradeCode];
    if (!base) { return null; }

    var axis = Object.assign({}, base);

    // Only the dual grades can draw this, and only some of their items do. The
    // value comes from the data, never from the grade.
    if (channel === 'size') { axis.mismatch_channel = 'size'; }

    return axis;
  }

  /** Most frequent value in an array, or null. Used to label a mixed batch. */
  function _dominant(values) {
    var tally = {}, best = null, bestN = 0;
    (values || []).forEach(function (v) {
      if (!v) { return; }
      tally[v] = (tally[v] || 0) + 1;
      if (tally[v] > bestN) { bestN = tally[v]; best = v; }
    });
    return best;
  }

  function _unique(values) {
    return (values || []).filter(Boolean).filter(function (v, i, a) {
      return a.indexOf(v) === i;
    });
  }

  /** The record's `context`. One shape, one place, so the radar never guesses. */
  function buildRadarContext(gradeCode, channel, extra) {
    var ctx = {
      moduleId:       MODULE_ID,
      moduleType:     MODULE_TYPE,
      levelId:        gradeCode,
      gradeCode:      LEVEL_GRADE[gradeCode] || null,
      mismatchChannel: channel || null,
      difficultyAxis: difficultyAxisFor(gradeCode, channel),
      sourceGameId:   SOURCE_GAME_ID
    };
    return extra ? Object.assign(ctx, extra) : ctx;
  }

  function genesFor() { return GENES.slice(); }

  /** One unit per grade, each with a freshly generated session. */
  function buildUnits() {
    return GRADE_ORDER.map(function (g) {
      var meta = DS_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon || '🔍',
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: DS_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  // Exposed for test.html. Read-only as far as the game is concerned; this is
  // also the explicit-contract export docs/HANDOFF-NEXT-STEPS.md §1.7 asks new
  // modules for, so the validator's text extractors can eventually be dropped.
  window.DS_CONTRACT = {
    MODULE_ID: MODULE_ID,
    MODULE_TYPE: MODULE_TYPE,
    SOURCE_GAME_ID: SOURCE_GAME_ID,
    SESSION_SIZE: SESSION_SIZE,
    GRADE_ORDER: GRADE_ORDER,
    GENES: GENES,
    LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor,
    buildRadarContext: buildRadarContext,
    genesFor: genesFor,
    buildUnits: buildUnits
  };

  // ── Presentation ───────────────────────────────────────────────────────────

  (function injectDifferenceScoutStyles() {
    if (document.getElementById('ds-shell-style')) { return; }
    var s = document.createElement('style');
    s.id = 'ds-shell-style';
    s.textContent = [
      '.ds-wrap{display:grid;gap:10px;justify-items:center;width:100%;min-width:0;}',
      '.ds-q{font-size:22px;font-weight:900;color:#0f172a;line-height:1.3;text-align:center;}',
      '.ds-sub{font-size:13px;font-weight:700;color:#64748b;text-align:center;}',
      // .s1-duo (shell-1.css) decides the column count from the CONTAINER, not
      // from a device breakpoint: two boards side by side while each can keep
      // 210px, stacked otherwise. An 8-slot strip at 360px is unreadable in a
      // half-width column, and per UNIFIED-GUI-FRAMEWORK.md §8 the answer to
      // "it does not fit" is rearranging, never hiding.
      '.ds-boards{width:100%;max-width:520px;min-width:0;--s1-duo-min:210px;--s1-duo-gap:10px;}',
      '.ds-board{background:#fff;border:1px solid #dbeafe;border-radius:12px;padding:8px;display:grid;gap:8px;min-width:0;}',
      '.ds-title{font-size:12px;font-weight:800;color:#475569;text-align:center;}',
      // minmax(0,1fr), not 1fr. A bare `1fr` floors every track at the CELL's
      // min-content (a 30px glyph plus padding), so at 8 slots the pair of
      // boards is ~520px wide no matter the screen — and since #s1-seqin is a
      // flex item with min-width:auto, that floor propagates up and the strips
      // run off the side of a 360px screen instead of .s1-duo collapsing to one
      // column. Measured before this line: side-by-side and past the viewport
      // edge at both 360 and 420.
      '.ds-row{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:6px;}',
      '.ds-cell{border:1px solid #dbeafe;background:#f8fafc;border-radius:10px;padding:6px 2px;display:grid;gap:2px;justify-items:center;min-width:0;}',
      // One shared line-height so a small icon and a large icon in the same row
      // still sit on the same baseline; only font-size carries the size channel.
      '.ds-icon{line-height:1;font-size:21px;}',
      '.ds-icon.ds-s{font-size:14px;}',
      '.ds-icon.ds-m{font-size:21px;}',
      '.ds-icon.ds-l{font-size:30px;}',
      '.ds-idx{font-size:11px;font-weight:800;color:#64748b;}',
      '.ds-opt{font-size:26px;font-weight:900;color:#0f172a;line-height:1;}',
      '.ds-opt-sub{display:block;font-size:12px;font-weight:700;color:#64748b;margin-top:4px;}'
    ].join('');
    document.head.appendChild(s);
  }());

  function renderStrip(cells) {
    var html = '<div class="ds-row">';
    for (var i = 0; i < cells.length; i++) {
      html += '<div class="ds-cell">' +
        '<span class="ds-icon ds-' + cells[i].size + '">' + cells[i].icon + '</span>' +
        '<span class="ds-idx">' + (i + 1) + '</span>' +
        '</div>';
    }
    return html + '</div>';
  }

  /**
   * Hand the finished unit a new draw so replaying it is a new game.
   *
   * Deferred on purpose. shell.js calls onResult BEFORE getReportContext inside
   * the same _finishUnit() pass, so refilling synchronously would make the
   * report describe items the child never saw. setTimeout puts the refill after
   * that whole pass.
   */
  function refillUnit(unitId) {
    setTimeout(function () {
      for (var i = 0; i < UNITS.length; i++) {
        if (UNITS[i].id === unitId) {
          UNITS[i].questions = DS_GEN.generate(unitId, SESSION_SIZE);
          return;
        }
      }
    }, 0);
  }

  shell.createGame({
    id: SOURCE_GAME_ID,
    theme: { primary: '#7c3aed', primary2: '#6d28d9', bg: '#f5f3ff' },
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
        contentZh: '左右两列只有一格不同，按序号选出差异位置。越往后格子越多、差异越细；G2 的不同也可能是大小。',
        contentEn: 'Only one slot differs between the two strips — pick its number. Later grades add slots and finer differences; at G2 the difference may be size.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-difference-scout-intro-001'
      }
    },
    title: { zh: '🕵️ 找不同侦探', en: '🕵️ Difference Scout' },
    subtitle: { zh: '比较左右图列，锁定唯一差异', en: 'Compare both strips and lock the single mismatch' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),   // sessionPolicy.passRatio
    // The four units are four scan difficulties a child should be able to pick
    // between directly, not a ladder to unlock — MindSeeds' whole point is
    // starting a run in one tap, so this replaces the grade-selector screen
    // comparison and pattern put in front of their units.
    parallelUnits: true,
    units: UNITS,

    renderSequence: function (q, container) {
      container.innerHTML = '<div class="ds-wrap">' +
        '<div class="ds-q"><span class="zh">哪一格不一样？</span><span class="en">Which slot is different?</span></div>' +
        '<div class="ds-sub"><span class="zh">观察左右对应位置，找到唯一不同点</span><span class="en">Compare paired positions and find the only mismatch</span></div>' +
        '<div class="ds-boards s1-duo">' +
          '<div class="ds-board"><div class="ds-title"><span class="zh">左边</span><span class="en">Left</span></div>' + renderStrip(q.left) + '</div>' +
          '<div class="ds-board"><div class="ds-title"><span class="zh">右边</span><span class="en">Right</span></div>' + renderStrip(q.right) + '</div>' +
        '</div>' +
      '</div>';
    },

    renderOption: function (opt) {
      return '<div class="ds-opt">' + opt + '<span class="ds-opt-sub"><span class="zh">号位置</span><span class="en">slot</span></span></div>';
    },

    checkAnswer: function (selected, q) {
      return Number(selected) === Number(q.answer);
    },

    getVoiceText: function (q, idx) {
      return shell.lang === 'zh'
        ? '第' + (idx + 1) + '题，哪一格不一样？'
        : 'Question ' + (idx + 1) + ', which slot is different?';
    },

    registerRootGenes: function () { return genesFor(); },

    /**
     * One Attempt per unit run. The batch is labelled with the channel the child
     * actually met most often plus the full de-duplicated list: at G2 a run
     * mixes identity and size mismatches, and claiming a single channel for the
     * whole batch would misdescribe it — the same reason pattern reports a
     * dominant inference_direction alongside `inferenceDirections`.
     */
    getReportContext: function (ctx) {
      var unit      = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      var channels  = questions.map(function (q) { return q.channel; });
      var dominant  = _dominant(channels);
      refillUnit(unit.id);
      return buildRadarContext(unit.id, dominant, {
        mismatchChannels: _unique(channels),
        families:         _unique(questions.map(function (q) { return q.familyId; })),
        similarity:       questions.length ? questions[0].similarity : null,
        geneIds:          genesFor(),
        activityRuntime:  'puzzle'
      });
    }
  });
}());
