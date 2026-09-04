/**
 * Math Pattern — Game Config  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * Learning Foundation · Math Thinking · Pattern 规律
 *
 * This file carries the module's RADAR CONTRACT as well as its game config.
 * The contract is the four declarations below — LEVEL_GRADE, UNIT_LEVEL,
 * PATTERN_TYPE_OF and the `base` table inside difficultyAxisFor() — and it is
 * cross-checked against metadata/metathinking/pattern.json by
 * metadata/validate.html (suites S2 / S3 / S4). Keep them literal `var X = {`
 * declarations: the validator reads this file as text.
 *
 * Metadata:  /metadata/metathinking/pattern.json
 * RootGene:  RG.PATTERN.SEQUENCE.BASIC
 * Engine shared with MindSeeds Pattern Hunter; stats recorded independently.
 */
(function () {
  'use strict';

  var MODULE_ID      = 'pattern';
  var MODULE_TYPE    = 'metathinking';
  var SOURCE_GAME_ID = 'learning-math-pattern';

  // levelId → gradeCode. Identity, but written out rather than assumed, because
  // shell.grade.normalize() refuses to guess: 'L2' does not mean the same grade
  // in every module. This module's own levelId IS the grade code, exactly like
  // comparison's, so validate.js S2 can match it against pattern.json's
  // levelMap gradeCodes (L3→G1, L4→G2).
  var LEVEL_GRADE = { G1: 'G1', G2: 'G2' };

  // Unit id → levelId. Follows data.js's own header:
  //   units 1-3 = counting / skip-counting / fives-and-tens  → G1
  //   units 4-6 = decreasing / multiplying / story transfer   → G2
  var UNIT_LEVEL = { '1': 'G1', '2': 'G1', '3': 'G1',
                     '4': 'G2', '5': 'G2', '6': 'G2' };

  // Unit id → the rule the unit trains. Finer grained than the typeTree on
  // purpose: the radar needs the typeTree id, a teacher reading the record
  // wants to know it was ×2 rather than +5.
  var UNIT_RULE = { '1': 'count_up',   '2': 'skip_count', '3': 'fives_tens',
                    '4': 'count_down', '5': 'doubling',   '6': 'story' };

  // Rule type → pattern.json typeTree id. Every rule shipped today lands in
  // `progression`, which is the honest answer: the whole existing bank is
  // numeric progression. `repetition` / `alternating` / `rule_induction` /
  // `structure` get entries here when content for them actually ships.
  var PATTERN_TYPE_OF = {
    count_up:   'progression',
    skip_count: 'progression',
    fives_tens: 'progression',
    count_down: 'progression',
    doubling:   'progression',
    story:      'progression'
  };

  /**
   * Where the blank sits decides which direction the child must reason in —
   * this module's strongest difficulty lever, and its boundary with the
   * MindSeeds pattern hunters, which are always `forward`.
   *
   *   last index  → forward   extend the run
   *   index 0     → backward  invert the rule to reach the start
   *   otherwise   → interior  cues on both sides
   */
  function inferenceDirectionOf(seq) {
    if (!seq || !seq.length) return null;
    var i = seq.indexOf('?');
    if (i < 0) return null;
    if (i === 0) return 'backward';
    if (i === seq.length - 1) return 'forward';
    return 'interior';
  }

  /**
   * The five difficulty axes of pattern.json, per grade.
   *
   * The two rows are deliberately identical. Everything shipped today is a
   * single-rule numeric progression read left to right, at both grades; G1 and
   * G2 differ only in the arithmetic of the rule (+1..+10 vs −n and ×n), and
   * none of these five axes encodes that. Inventing a difference here would
   * put a number on the radar that no content backs. What does move is set
   * per ITEM below, from the item itself.
   */
  function difficultyAxisFor(levelId, ruleType, direction) {
    var base = {
      G1: { object_complexity: 'symbolic', rule_complexity: 'single',
            inference_direction: 'forward', language_complexity: 'question',
            transfer_complexity: 'within-domain' },
      G2: { object_complexity: 'symbolic', rule_complexity: 'single',
            inference_direction: 'forward', language_complexity: 'question',
            transfer_complexity: 'within-domain' }
    }[levelId];
    if (!base) return null;

    var axis = Object.assign({}, base);

    // A story item wraps the same rule in a life situation: that is a carrier
    // change (cross-domain) stated in a full sentence (compound).
    if (ruleType === 'story') {
      axis.transfer_complexity = 'cross-domain';
      axis.language_complexity = 'compound';
    }

    // Direction comes from the data, not from the grade. Written as explicit
    // branches so the value is visible to validate.js as a literal.
    if (direction === 'backward')      { axis.inference_direction = 'backward'; }
    else if (direction === 'interior') { axis.inference_direction = 'interior'; }

    return axis;
  }

  /** Most frequent value in an array, or null. Used to label a mixed batch. */
  function _dominant(values) {
    var tally = {}, best = null, bestN = 0;
    (values || []).forEach(function (v) {
      if (!v) return;
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
  function buildRadarContext(unitId, direction, extra) {
    var levelId  = UNIT_LEVEL[unitId] || null;
    var ruleType = UNIT_RULE[unitId]  || null;
    var ctx = {
      moduleId:    MODULE_ID,
      moduleType:  MODULE_TYPE,
      levelId:     levelId,
      gradeCode:   LEVEL_GRADE[levelId] || null,
      patternType: ruleType ? (PATTERN_TYPE_OF[ruleType] || null) : null,
      ruleType:    ruleType,
      difficultyAxis: difficultyAxisFor(levelId, ruleType, direction),
      sourceGameId: SOURCE_GAME_ID
    };
    return extra ? Object.assign(ctx, extra) : ctx;
  }

  /**
   * Options render in declared order (shell.js does not shuffle), and in the
   * static bank the correct answer sits third in 42 of 60 items. A child who
   * notices that stops reading the sequence. So shuffle a COPY per session —
   * MP_DATA itself stays pristine, which is what test.html audits.
   */
  function _shuffled(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function buildUnits(source) {
    return (source || []).map(function (unit) {
      var copy = Object.assign({}, unit);
      copy.questions = unit.questions.map(function (q) {
        var qc = Object.assign({}, q);
        qc.options = _shuffled(q.options);
        return qc;
      });
      return copy;
    });
  }

  // Exposed for test.html (and for the future window.*_CONTRACT migration in
  // docs/HANDOFF-NEXT-STEPS.md §1.7). Read-only as far as the game is concerned.
  window.PATTERN_CONTRACT = {
    MODULE_ID: MODULE_ID,
    MODULE_TYPE: MODULE_TYPE,
    SOURCE_GAME_ID: SOURCE_GAME_ID,
    LEVEL_GRADE: LEVEL_GRADE,
    UNIT_LEVEL: UNIT_LEVEL,
    UNIT_RULE: UNIT_RULE,
    PATTERN_TYPE_OF: PATTERN_TYPE_OF,
    inferenceDirectionOf: inferenceDirectionOf,
    difficultyAxisFor: difficultyAxisFor,
    buildRadarContext: buildRadarContext,
    buildUnits: buildUnits
  };

  shell.createGame({
    id:       SOURCE_GAME_ID,
    theme:    { primary: '#d97706', primary2: '#92400e' },   // amber
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
        contentZh: '先识别重复节奏，再判断数字是递增、递减还是交替。',
        contentEn: 'Find the repeating rhythm first, then decide whether the numbers increase, decrease, or alternate.'
      },
      video: { enabled: true, videoId: 'learning-math-pattern-intro-001' }
    },
    title:    { zh: '🔢 数学规律', en: '🔢 Math Patterns' },
    subtitle: { zh: '在数字中发现规律，训练预测与归纳能力',
                en: 'Discover patterns in numbers — build prediction & generalization' },
    passScore: 7,
    debug: false,
    units: buildUnits(MP_DATA.units),

    renderSequence: function (q, container) {
      container.innerHTML = q.seq.map(function (n) {
        return n === '?' ? '<span class="mystery">?</span>' : '<span>' + n + '</span>';
      }).join(' ');
    },
    renderOption: function (opt) { return String(opt); },
    checkAnswer: function (selected, q) { return Number(selected) === q.answer; },

    getVoiceText: function (q) {
      var items = q.seq.map(function (n) {
        return n === '?' ? (shell.lang === 'zh' ? '问号' : 'blank') : String(n);
      });
      return shell.lang === 'zh' ? items.join('，') + '。问号是几？'
                                 : items.join(', ') + '. What is the missing number?';
    },

    registerRootGenes: function () { return ['RG.PATTERN.SEQUENCE.BASIC']; },

    /**
     * One Attempt per unit run. The batch is labelled with the direction the
     * child actually met most often, plus the full de-duplicated list, because
     * pattern.json's `direction-not-poolable` rule forbids merging forward and
     * backward accuracy — "can extend a run but cannot invert it" is the
     * profile this module exists to surface.
     */
    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var dirs = (unit.questions || []).map(function (q) {
        return inferenceDirectionOf(q.seq);
      });
      var dominant = _dominant(dirs);
      return buildRadarContext(unit.id, dominant, {
        inferenceDirection:  dominant,
        inferenceDirections: _unique(dirs),
        activityRuntime:     'puzzle'
      });
    }
  });
})();
