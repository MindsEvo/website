/**
 * Math Pattern — Game Config  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * Learning Foundation · Math Thinking · Pattern 规律
 *
 * This file carries the module's RADAR CONTRACT as well as its game config.
 * The contract is the declarations below — LEVEL_GRADE, UNIT_LEVEL,
 * PATTERN_TYPE_OF, TASK_OF, SESSION_SIZE and the `base` table inside
 * difficultyAxisFor() — and it is cross-checked against
 * metadata/metathinking/pattern.json by metadata/validate.html (suites S2 / S3 /
 * S4 / S7). Keep them literal `var X = {` declarations: the validator reads this
 * file as text.
 *
 * Three-dimension model (pattern.json → designModel):
 *   structure × carrier × task. Everything shipped here is
 *   structure=numerical · carrier=numeral · task=continue|complete.
 *
 * Metadata:  /metadata/metathinking/pattern.json
 * RootGene:  RG.PATTERN.SEQUENCE.BASIC (structure) + RG.PATTERN.QUANTITY.RELATION (carrier)
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
  var LEVEL_GRADE = { K1: 'K1', G1: 'G1', G2: 'G2' };

  // Unit id → levelId. Follows data.js's own header:
  //   units 1-3 = counting / skip-counting / fives-and-tens  → G1
  //   units 4-6 = decreasing / multiplying / story transfer   → G2
  //   unit 7    = AB color repetition (no numerals)           → K1
  //   unit 8    = up/down direction oscillation (alternating) → G1
  //   unit 9    = repetition × discover (candidate groups)    → K1
  //   unit 10   = alternating × discover (candidate groups)   → G1
  var UNIT_LEVEL = { '1': 'G1', '2': 'G1', '3': 'G1',
                     '4': 'G2', '5': 'G2', '6': 'G2',
                     '7': 'K1', '8': 'G1',
                     '9': 'K1', '10': 'G1' };

  // Unit id → the rule the unit trains. Finer grained than the typeTree on
  // purpose: the radar needs the typeTree id, a teacher reading the record
  // wants to know it was ×2 rather than +5.
  var UNIT_RULE = { '1': 'count_up',   '2': 'skip_count', '3': 'fives_tens',
                    '4': 'count_down', '5': 'doubling',   '6': 'story',
                    '7': 'ab_repeat',  '8': 'updown_alternate',
                    '9': 'ab_repeat_discover', '10': 'updown_alternate_discover' };

  // Rule type → pattern.json typeTree id (the STRUCTURE dimension). Every rule
  // shipped today lands in `numerical`, `repetition` or `alternating` —
  // spatial, transformation, relational and growth get entries here when
  // content for them actually ships.
  //
  // v0.2.0 renamed `progression` → `numerical` and folded the old `structure`
  // (number tables) into it; both were "the change lives in the numeral".
  var PATTERN_TYPE_OF = {
    count_up:   'numerical',
    skip_count: 'numerical',
    fives_tens: 'numerical',
    count_down: 'numerical',
    doubling:   'numerical',
    story:      'numerical',
    ab_repeat:  'repetition',
    updown_alternate: 'alternating',
    ab_repeat_discover:        'repetition',
    updown_alternate_discover: 'alternating'
  };

  // Structure id → the rootGenes an item of that structure reports.
  // Per pattern.json → geneReporting: the structure gene, plus the carrier gene
  // of the attribute the rule actually varies. Everything numerical varies a
  // quantity, so it reports both. repetition varies color; alternating (the
  // match sample) varies color AND shape, since match compares each carrier's
  // own structural signature.
  var STRUCTURE_GENES = {
    numerical:   ['RG.PATTERN.SEQUENCE.BASIC', 'RG.PATTERN.QUANTITY.RELATION'],
    repetition:  ['RG.PATTERN.SEQUENCE.BASIC', 'RG.PATTERN.VISUAL.COLOR'],
    alternating: ['RG.PATTERN.SEQUENCE.BASIC', 'RG.PATTERN.VISUAL.COLOR', 'RG.PATTERN.VISUAL.SEQUENCE']
  };

  // Structure id → the carrier every item of that structure uses
  // (pattern.json → carriers). `alternating`'s match activity spans two
  // carriers at once and reports them explicitly via `carriers` in its own
  // context builder instead of this single-carrier map; its puzzle content
  // (Unit 8, SPEC-alternating-continue-g1 / -complete-g1) is single-carrier
  // (direction arrows / day-night state) and goes through this map normally.
  var CARRIER_OF = { numerical: 'numeral', repetition: 'color', alternating: 'direction' };

  // Items shown in one run. The bank is bigger than a session on purpose: 8
  // keeps a sitting short for a 6-8 year old and keeps testing fast. Mirrors
  // pattern.json → sessionPolicy.maxItemsPerSession, which S7 collides.
  var SESSION_SIZE = 8;

  // Where the blank sits decides WHERE the child reasons (inference_direction);
  // this table decides WHAT the job is (task_complexity). They are two axes:
  // a gap at the end is "carry the run on" (continue); a gap anywhere else is
  // "fill the hole" (complete), whether the cues sit on both sides or only
  // after it.
  var TASK_OF = { forward: 'continue', interior: 'complete', backward: 'complete' };

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
   * The six difficulty axes of pattern.json, per grade.
   *
   * The two rows are deliberately identical. Everything shipped today is a
   * single-rule numeric run read left to right, at both grades; G1 and G2 differ
   * only in the arithmetic of the rule (+1..+10 vs −n and ×n), and none of these
   * six axes encodes that. Inventing a difference here would put a number on the
   * radar that no content backs. What does move is set per ITEM below, from the
   * item itself.
   */
  function difficultyAxisFor(levelId, ruleType, direction) {
    var base = {
      K1: { object_complexity: 'concrete', rule_complexity: 'single',
            inference_direction: 'forward', task_complexity: 'continue',
            language_complexity: 'action', transfer_complexity: 'within-domain' },
      G1: { object_complexity: 'symbolic', rule_complexity: 'single',
            inference_direction: 'forward', task_complexity: 'continue',
            language_complexity: 'question', transfer_complexity: 'within-domain' },
      G2: { object_complexity: 'symbolic', rule_complexity: 'single',
            inference_direction: 'forward', task_complexity: 'continue',
            language_complexity: 'question', transfer_complexity: 'within-domain' }
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
    // discover has no blank to place, so it has no inference_direction at all
    // — it answers "which group is a pattern", not "where is the gap" (same
    // reasoning that moved `repair` off this axis in pattern.json).
    else if (direction === 'discover') { axis.inference_direction = null; }

    // …and the task follows from the direction, never independently, so the two
    // axes can never contradict each other in a record.
    if (direction === 'backward')      { axis.task_complexity = 'complete'; }
    else if (direction === 'interior') { axis.task_complexity = 'complete'; }
    else if (direction === 'discover') { axis.task_complexity = 'discover'; }

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

  /**
   * Structure-signature normalization — PATTERN-MODULE-ARCHITECTURE.md §6.1,
   * the technical fulcrum for match/create/repair: "红蓝红蓝 → ABAB". Labels
   * distinct tokens A, B, C… in first-occurrence order, so two sequences with
   * the same repeating shape but different literal carriers land on the same
   * string. `'?'` passes through unlabeled — repair/discover items carry no
   * blank, but this keeps the function usable on continue/complete's seqs too.
   */
  function structureSignature(seq) {
    var labels = {}, next = 65; // 'A'
    return (seq || []).map(function (tok) {
      if (tok === '?' || tok == null) return '?';
      var key = String(tok);
      if (!(labels.hasOwnProperty(key))) { labels[key] = String.fromCharCode(next++); }
      return labels[key];
    }).join('');
  }

  /**
   * True when `sig` tiles exactly with some period shorter than itself
   * (e.g. "ABAB" tiles at 2, "AABAAB" at 3; "ABAC" tiles at nothing < 4).
   * This is what makes `discover` gradable: a genuine pattern is one whose
   * signature is periodic; a decoy group's signature is not.
   */
  function isPeriodicSignature(sig) {
    var n = (sig || '').length;
    for (var p = 1; p <= Math.floor(n / 2); p++) {
      if (n % p !== 0) continue;
      var unit = sig.slice(0, p), ok = true;
      for (var i = p; i < n; i += p) {
        if (sig.slice(i, i + p) !== unit) { ok = false; break; }
      }
      if (ok) return true;
    }
    return false;
  }

  /** The record's `context`. One shape, one place, so the radar never guesses. */
  function buildRadarContext(unitId, direction, extra) {
    var levelId  = UNIT_LEVEL[unitId] || null;
    var ruleType = UNIT_RULE[unitId]  || null;
    var structure = ruleType ? (PATTERN_TYPE_OF[ruleType] || null) : null;
    var ctx = {
      moduleId:    MODULE_ID,
      moduleType:  MODULE_TYPE,
      levelId:     levelId,
      gradeCode:   LEVEL_GRADE[levelId] || null,
      patternType: structure,
      structure:   structure,
      carrier:     CARRIER_OF[structure] || null,
      taskType:    direction === 'discover' ? 'discover' : (direction ? (TASK_OF[direction] || null) : null),
      ruleType:    ruleType,
      difficultyAxis: difficultyAxisFor(levelId, ruleType, direction),
      sourceGameId: SOURCE_GAME_ID
    };
    return extra ? Object.assign(ctx, extra) : ctx;
  }

  /** The genes an item of this structure trains (pattern.json → geneReporting). */
  function genesFor(structure) {
    return (STRUCTURE_GENES[structure] || []).slice();
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

  /**
   * Take SESSION_SIZE questions out of a unit, keeping the authored order.
   *
   * The bank authors each unit in rising difficulty, so the run is NOT shuffled;
   * instead the surplus items are dropped at random. A unit of 10 therefore
   * shows a different 8 each sitting while still reading easy → hard, and a unit
   * at or under the limit is returned whole.
   */
  function _pickSession(questions) {
    if (questions.length <= SESSION_SIZE) return questions.slice();
    var keep = questions.map(function (_, i) { return i; });
    while (keep.length > SESSION_SIZE) {
      keep.splice(Math.floor(Math.random() * keep.length), 1);
    }
    return keep.map(function (i) { return questions[i]; });
  }

  function buildUnits(source) {
    return (source || []).map(function (unit) {
      var copy = Object.assign({}, unit);
      copy.questions = _pickSession(unit.questions).map(function (q) {
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
    SESSION_SIZE: SESSION_SIZE,
    CARRIER_OF: CARRIER_OF,
    LEVEL_GRADE: LEVEL_GRADE,
    UNIT_LEVEL: UNIT_LEVEL,
    UNIT_RULE: UNIT_RULE,
    PATTERN_TYPE_OF: PATTERN_TYPE_OF,
    TASK_OF: TASK_OF,
    STRUCTURE_GENES: STRUCTURE_GENES,
    inferenceDirectionOf: inferenceDirectionOf,
    difficultyAxisFor: difficultyAxisFor,
    structureSignature: structureSignature,
    isPeriodicSignature: isPeriodicSignature,
    buildRadarContext: buildRadarContext,
    genesFor: genesFor,
    buildUnits: buildUnits,
    // Exposed so test.html can audit the match sample's structural legitimacy
    // (§8.1) without driving ActivityRunner/MatchRuntime through a real DOM.
    matchTemplate: function () { return _matchTemplate(); },
    matchVariant: function () { return _matchVariant(); }
  };

  /**
   * alternating × match (G2) — the one non-puzzle sample in this module.
   * shell.createGame() has no hook for launching a non-puzzle activity, so
   * this bypasses it: comparison's ActivityRunner + MatchRuntime are reused
   * as-is (see match-runtime.js's compareKey/seqMode generalization), driven
   * from a button injected into the shell-rendered home header. Hand-authored
   * here rather than pooled in data.js/templates.json — it is a single fixed
   * activity, not a session drawn from a bank.
   */
  function _matchTemplate() {
    return {
      id:         'pat-g2-match-altsig-001',
      level:      'G2',
      type:       'alternating',
      mode:       'match',
      runtime:    'match',
      compareKey: 'signature',
      instrZh:    '把颜色规律拖到结构相同的图形规律上 →',
      instrEn:    'Drag each color pattern onto the shape pattern with the same structure →'
    };
  }

  // 3 left (color) × 3 right (shape) items, each pair sharing a structural
  // signature (ABAB / AABAAB / ABBABB) and no emoji vocabulary in common —
  // per SPEC-alternating-match-g2.md, the child must compare structure, not
  // literal glyphs.
  function _matchVariant() {
    var leftItems = [
      { id: 'L0', emoji: '🔴🔵🔴🔵',     signature: 'ABAB',    nameZh: '颜色规律', nameEn: 'Color pattern' },
      { id: 'L1', emoji: '🔴🔴🔵🔴🔴🔵', signature: 'AABAAB', nameZh: '颜色规律', nameEn: 'Color pattern' },
      { id: 'L2', emoji: '🔴🔵🔵🔴🔵🔵', signature: 'ABBABB', nameZh: '颜色规律', nameEn: 'Color pattern' }
    ];
    var rightSlots = [
      { id: 'R0', emoji: '⚪🔷⚪🔷',     signature: 'ABAB',    nameZh: '形状规律', nameEn: 'Shape pattern' },
      { id: 'R1', emoji: '⚪⚪🔷⚪⚪🔷', signature: 'AABAAB', nameZh: '形状规律', nameEn: 'Shape pattern' },
      { id: 'R2', emoji: '⚪🔷🔷⚪🔷🔷', signature: 'ABBABB', nameZh: '形状规律', nameEn: 'Shape pattern' }
    ];
    return {
      seqMode:    true,
      compareKey: 'signature',
      leftItems:  _shuffled(leftItems),
      rightSlots: _shuffled(rightSlots),
      variantId:  'pat-g2-match-altsig-001-v1'
    };
  }

  function _launchMatchActivity() {
    ActivityRunner.launch(_matchTemplate(), _matchVariant(), {
      levelId:    'G2',
      onComplete: _reportMatchActivity,
      onBack:     function () {}
    });
  }

  /**
   * One Attempt, reported the same way comparison's _reportInteraction
   * flattens an interaction result — this activity never passes through
   * shell.createGame()/getReportContext(), so the radar coordinates have to
   * be attached here or the attempt is invisible to it.
   */
  function _reportMatchActivity(attempt) {
    if (!shell || typeof shell.report !== 'function') return;
    var context = {
      moduleId:       MODULE_ID,
      moduleType:     MODULE_TYPE,
      levelId:        'G2',
      gradeCode:      'G2',
      patternType:    'alternating',
      structure:      'alternating',
      carrier:        null,
      carriers:       ['color', 'shape'],
      taskType:       'match',
      ruleType:       null,
      difficultyAxis: difficultyAxisFor('G2', null, 'forward'),
      sourceGameId:   SOURCE_GAME_ID
    };
    shell.report({
      gameId:     SOURCE_GAME_ID,
      unitId:     'alt-match',
      templateId: attempt.templateId,
      variantId:  attempt.variantId || null,
      score:      attempt.result === 'correct' ? 1 : 0,
      total:      1,
      timeMs:     attempt.responseMs || 0,
      hintsUsed:  0,
      geneIds:    genesFor('alternating'),
      shell:      'shell-1',
      activityRuntime: 'interaction',
      activityMode:    'match',
      result:     attempt.result || null,
      levelId:    'G2',
      gradeCode:  'G2',
      context:    context
    });
  }

  // Add the match-activity trigger to the shell home header. #s1-home .s1-hdr
  // is synchronously present once shell.createGame() returns (no
  // MutationObserver needed — same idiom as comparison's
  // _injectShellHomeBackButton).
  function _injectMatchTrigger() {
    var hdr = document.querySelector('#s1-home .s1-hdr');
    if (!hdr || document.getElementById('mp-match-trigger')) return;
    var btn = document.createElement('button');
    btn.id = 'mp-match-trigger';
    btn.innerHTML = '🧩';
    btn.title = '交替规律配对 / Alternating pattern match';
    btn.addEventListener('click', _launchMatchActivity);
    hdr.insertBefore(btn, hdr.firstChild);
  }

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
    passScore: Math.ceil(SESSION_SIZE * 0.75),   // sessionPolicy.passRatio
    debug: false,
    units: buildUnits(MP_DATA.units),

    renderSequence: function (q, container) {
      if (q.task === 'discover') {
        container.classList.add('mp-discover');
        container.innerHTML = q.groups.map(function (g, i) {
          var body = g.seq.map(function (tok) { return '<span>' + tok + '</span>'; }).join(' ');
          return '<div class="mp-discover-group"><span class="mp-discover-num">' + (i + 1) + '</span>' + body + '</div>';
        }).join('');
        return;
      }
      container.classList.remove('mp-discover');
      container.innerHTML = q.seq.map(function (n) {
        return n === '?' ? '<span class="mystery">?</span>' : '<span>' + n + '</span>';
      }).join(' ');
    },
    renderOption: function (opt, q) {
      if (q && q.task === 'discover') {
        return shell.lang === 'zh' ? '第 ' + opt + ' 组' : 'Group ' + opt;
      }
      return String(opt);
    },
    // Relaxed from Number(selected) === q.answer: the K1 repetition unit's
    // answers are emoji strings, not numerals.
    checkAnswer: function (selected, q) { return String(selected) === String(q.answer); },

    getVoiceText: function (q) {
      if (q.task === 'discover') {
        return shell.lang === 'zh' ? '看看这几组，哪一组是真的规律？'
                                   : 'Look at each group — which one is a real pattern?';
      }
      var numeric = q.seq.every(function (n) { return n === '?' || !isNaN(n); });
      if (!numeric) {
        return shell.lang === 'zh' ? '看规律，问号是什么？'
                                   : 'Look at the pattern — what comes next?';
      }
      var items = q.seq.map(function (n) {
        return n === '?' ? (shell.lang === 'zh' ? '问号' : 'blank') : String(n);
      });
      return shell.lang === 'zh' ? items.join('，') + '。问号是几？'
                                 : items.join(', ') + '. What is the missing number?';
    },

    /**
     * Structure gene + the carrier gene of the attribute the rule varies.
     * Reports the deduped union across every structure this module ships,
     * not just the unit in play — registerRootGenes fires once per game,
     * before any unit is picked (see pattern.json → geneReporting).
     */
    registerRootGenes: function () {
      return _unique(genesFor('numerical').concat(genesFor('repetition'), genesFor('alternating')));
    },

    /**
     * One Attempt per unit run. The batch is labelled with the direction the
     * child actually met most often, plus the full de-duplicated list, because
     * pattern.json's `direction-not-poolable` rule forbids merging forward and
     * backward accuracy — "can extend a run but cannot invert it" is the
     * profile this module exists to surface.
     */
    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      if (questions.length && questions[0].task === 'discover') {
        return buildRadarContext(unit.id, 'discover', {
          taskTypes:       ['discover'],
          activityRuntime: 'puzzle'
        });
      }
      var dirs = questions.map(function (q) {
        return inferenceDirectionOf(q.seq);
      });
      var dominant = _dominant(dirs);
      return buildRadarContext(unit.id, dominant, {
        inferenceDirection:  dominant,
        inferenceDirections: _unique(dirs),
        taskTypes:           _unique(dirs.map(function (d) { return TASK_OF[d] || null; })),
        activityRuntime:     'puzzle'
      });
    }
  });

  /**
   * discover's candidate-group layout (several stacked groups, no blank) does
   * not fit .s1-seq's single-row flex layout, so it gets a small stylesheet of
   * its own — same idiom as MatchRuntime._injectStyles, kept out of the
   * cross-module shell-1.css because only this module's discover items use it.
   */
  function _injectDiscoverStyles() {
    if (document.getElementById('mp-discover-style')) return;
    var s = document.createElement('style');
    s.id = 'mp-discover-style';
    s.textContent = [
      '.s1-seq.mp-discover{flex-direction:column;align-items:stretch;gap:10px;padding:16px 18px;font-size:28px;letter-spacing:2px;}',
      '.mp-discover-group{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.55);border-radius:10px;padding:8px 12px;}',
      '.mp-discover-num{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:var(--s1-primary);color:#fff;font-size:15px;font-weight:900;flex-shrink:0;}'
    ].join('');
    document.head.appendChild(s);
  }
  _injectDiscoverStyles();

  _injectMatchTrigger();
})();
