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
  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };

  // One generated unit per grade (unit id === levelId). Content comes from
  // PT_GEN (generator.js): structure x carrier x task per grade slot.
  var UNIT_LEVEL = { 'K1-repeat': 'K1', 'K1-find': 'K1', 'K1-carrier': 'K1',
                     'K2-unit': 'K2', 'K2-grow': 'K2', 'K2-letter': 'K2', 'K2-fix': 'K2',
                     'G1-two': 'G1', 'G1-space': 'G1', 'G1-change': 'G1', 'G1-table': 'G1', 'G1-num': 'G1',
                     'G2-compound': 'G2', 'G2-change': 'G2', 'G2-io': 'G2', 'G2-table': 'G2', 'G2-explain': 'G2', 'G2-num': 'G2' };

  // Rule type (what a generated question declares as ruleType) → pattern.json
  // typeTree id (the STRUCTURE dimension). The older activity samples (match /
  // create) report their structure directly.
  var PATTERN_TYPE_OF = {
    cycle:           'repetition',
    dual_attr:       'repetition',
    state_alternate: 'alternating',
    alt_diff:        'alternating',
    growth_count:    'growth',
    growth_size:     'growth',
    growth_cycle:    'growth',
    spatial_strip:   'spatial',
    table_rc:        'spatial',
    table_add:       'spatial',
    calendar:        'spatial',
    transform_parts:    'transformation',
    transform_compound: 'transformation',
    num_progress:    'numerical',
    io_rule:         'relational'
  };

  // Structure id → the rootGenes an item of that structure reports.
  // Per pattern.json → geneReporting: the structure gene, plus the carrier gene
  // of the attribute the rule actually varies. Everything numerical varies a
  // quantity, so it reports both. repetition's puzzle content varies color
  // only, but its K2 match activity spans color AND shape (like alternating's
  // G2 match sample), since match compares each carrier's own structural
  // signature — so both structures report the shape gene too.
  // alternating also carries RG.PATTERN.SPATIAL.RELATION: its Unit 8 G1 puzzle
  // content (up/down direction) and its G2 create activity both use the
  // `direction` carrier (pattern.json → carriers), whose carrierGeneId is
  // RG.PATTERN.SPATIAL.RELATION — omitted until now, which this fixes.
  var STRUCTURE_GENES = {
    numerical:   ['RG.PATTERN.SEQUENCE.BASIC', 'RG.PATTERN.QUANTITY.RELATION'],
    repetition:  ['RG.PATTERN.SEQUENCE.BASIC', 'RG.PATTERN.VISUAL.COLOR', 'RG.PATTERN.VISUAL.SEQUENCE', 'RG.PATTERN.MOTION.SEQUENCE', 'RG.PATTERN.TEMPORAL.SEQUENCE'],
    alternating: ['RG.PATTERN.SEQUENCE.BASIC', 'RG.PATTERN.VISUAL.COLOR', 'RG.PATTERN.VISUAL.SEQUENCE', 'RG.PATTERN.SPATIAL.RELATION'],
    growth:      ['RG.PATTERN.SEQUENCE.BASIC', 'RG.PATTERN.QUANTITY.RELATION', 'RG.PATTERN.VISUAL.SIZE'],
    spatial:     ['RG.PATTERN.SEQUENCE.BASIC', 'RG.PATTERN.SPATIAL.RELATION', 'RG.PATTERN.QUANTITY.RELATION'],
    transformation: ['RG.PATTERN.SEQUENCE.BASIC', 'RG.PATTERN.TRANSFORMATION.RULE'],
    relational:  ['RG.PATTERN.SEQUENCE.BASIC', 'RG.PATTERN.QUANTITY.RELATION', 'RG.MODELING.EQUATION.RELATION']
  };

  // Structure id → the carrier every item of that structure uses
  // (pattern.json → carriers). `alternating`'s match activity spans two
  // carriers at once and reports them explicitly via `carriers` in its own
  // context builder instead of this single-carrier map; its puzzle content
  // (Unit 8, SPEC-alternating-continue-g1 / -complete-g1) is single-carrier
  // (direction arrows / day-night state) and goes through this map normally.
  var CARRIER_OF = { numerical: 'numeral', repetition: 'color', alternating: 'direction', growth: 'count', spatial: 'position', transformation: 'object', relational: 'numeral' };

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
  function difficultyAxisFor(levelId, ruleType, direction, carrier, explain) {
    var base = {
      K1: { object_complexity: 'concrete', rule_complexity: 'single',
            inference_direction: 'forward', task_complexity: 'continue',
            language_complexity: 'action', transfer_complexity: 'within-domain' },
      K2: { object_complexity: 'concrete', rule_complexity: 'single',
            inference_direction: 'forward', task_complexity: 'continue',
            language_complexity: 'action', transfer_complexity: 'within-domain' },
      G1: { object_complexity: 'concrete', rule_complexity: 'single',
            inference_direction: 'forward', task_complexity: 'continue',
            language_complexity: 'question', transfer_complexity: 'within-domain' },
      G2: { object_complexity: 'concrete', rule_complexity: 'single',
            inference_direction: 'forward', task_complexity: 'continue',
            language_complexity: 'question', transfer_complexity: 'within-domain' }
    }[levelId];
    if (!base) return null;

    var axis = Object.assign({}, base);

    // Rule complexity follows the rule the question declares; numerals are the
    // only symbolic carrier here.
    if (ruleType === 'dual_attr' || ruleType === 'growth_cycle') { axis.rule_complexity = 'compound'; }
    else if (ruleType === 'state_alternate' || ruleType === 'alt_diff') { axis.rule_complexity = 'alternating'; }
    else if (ruleType === 'io_rule' || ruleType === 'transform_compound') { axis.rule_complexity = 'two_step'; }
    if (carrier === 'numeral' || carrier === 'letter' || carrier === 'table') { axis.object_complexity = 'symbolic'; }
    if (ruleType === 'table_rc' || ruleType === 'calendar') { axis.rule_complexity = 'two_step'; }
    else if (ruleType === 'table_add') { axis.rule_complexity = 'compound'; }
    if (explain) { axis.language_complexity = 'explain'; }

    // Direction comes from the data, not from the grade. Written as explicit
    // branches so the value is visible to validate.js as a literal.
    if (direction === 'backward')      { axis.inference_direction = 'backward'; }
    else if (direction === 'interior') { axis.inference_direction = 'interior'; }
    // discover has no blank to place, so it has no inference_direction at all
    // — it answers "which group is a pattern", not "where is the gap" (same
    // reasoning that moved `repair` off this axis in pattern.json).
    else if (direction === 'discover') { axis.inference_direction = null; }
    // repair's sequence is full too — the reasoning is "which item is wrong
    // and what should it be", not "where is the gap" — off the axis exactly
    // like discover, per pattern.json's own `movedOut` note for repair.
    else if (direction === 'repair')   { axis.inference_direction = null; }

    // …and the task follows from the direction, never independently, so the two
    // axes can never contradict each other in a record.
    if (direction === 'backward')      { axis.task_complexity = 'complete'; }
    else if (direction === 'interior') { axis.task_complexity = 'complete'; }
    else if (direction === 'discover') { axis.task_complexity = 'discover'; }
    else if (direction === 'repair')   { axis.task_complexity = 'repair'; }

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
  function buildRadarContext(levelId, rep, direction, extra) {
    var ruleType  = (rep && rep.ruleType) || null;
    var structure = (rep && rep.structure) || (ruleType ? (PATTERN_TYPE_OF[ruleType] || null) : null);
    var carrier   = (rep && rep.carrier) || CARRIER_OF[structure] || null;
    var ctx = {
      moduleId:    MODULE_ID,
      moduleType:  MODULE_TYPE,
      levelId:     levelId,
      gradeCode:   LEVEL_GRADE[levelId] || null,
      patternType: structure,
      structure:   structure,
      carrier:     carrier,
      taskType:    direction === 'discover' ? 'discover' : (direction === 'repair' ? 'repair' : (direction ? (TASK_OF[direction] || null) : null)),
      ruleType:    ruleType,
      difficultyAxis: difficultyAxisFor(levelId, ruleType, direction, carrier, rep && rep.explain),
      sourceGameId: SOURCE_GAME_ID
    };
    return extra ? Object.assign(ctx, extra) : ctx;
  }

  /** The genes an item of this structure trains (pattern.json → geneReporting). */
  function genesFor(structure) {
    return (STRUCTURE_GENES[structure] || []).slice();
  }

  /** Shuffle a copy (used by the match activities). */
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

  var _units = {};

  function buildUnits(levelId) {
    return PT_GEN.GRADE_UNITS[levelId].map(function (d) {
      var id = levelId + '-' + d.key;
      var u = { id: id, icon: d.icon, gradeCode: LEVEL_GRADE[levelId],
        nameZh: d.zh, nameEn: d.en, descZh: d.dzh, descEn: d.den,
        questions: PT_GEN.generate(levelId, SESSION_SIZE, d.key) };
      _units[id] = u;
      return u;
    });
  }
  // getReportContext runs right after the result screen is built, so refill on
  // the next tick — the report must describe the questions just seen.
  function refillUnit(unitId) {
    setTimeout(function () {
      var u = _units[unitId];
      if (u) u.questions = PT_GEN.generate(UNIT_LEVEL[unitId], SESSION_SIZE, unitId.split('-')[1]);
    }, 0);
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
    // Exposed so test.html can drive the grade-selector's shell.createGame
    // call directly (per grade) instead of clicking through #mp-lvl-selector.
    _launchGrade: _launchGrade,
    activities: ACTIVITIES
  };

  // ── Drag activities (match / create) ─────────────────────────────────────
  // shell.createGame() has no hook for non-puzzle activities, so these launch
  // comparison's ActivityRunner (MatchRuntime / SortRuntime) from ONE "🎮"
  // button in the grade page header, which opens a small menu. Every variant
  // is generated fresh at launch (random tokens, shapes, rules).

  function pick1(a) { return a[Math.floor(Math.random() * a.length)]; }
  function _tile(unit, n) { var o = []; for (var i = 0; i < n; i++) o.push(unit[i % unit.length]); return o; }
  function _vid(id) { return id + '-' + Math.floor(Math.random() * 1e6); }

  var AC_COLOR = ['🔴', '🔵', '🟢', '🟣'];
  var AC_OBJ   = ['🍀', '🦋', '🐳', '🍇'];

  // match two vocabularies by structure: left colour runs, right picture runs
  function _sigMatch(shapes) {
    var chosen = [], seen = {};
    _shuffled(shapes).forEach(function (sh) {
      var n = sh.length * 2, sig = structureSignature(sh.split('').concat(sh.split('')));
      if (!seen[sig] && chosen.length < 3) { seen[sig] = 1; chosen.push({ sh: sh, n: n, sig: sig }); }
    });
    function render(c, pool) {
      var letters = [], m = _shuffled(pool);
      c.sh.split('').forEach(function (l) { if (letters.indexOf(l) < 0) letters.push(l); });
      return _tile(c.sh.split('').map(function (l) { return m[letters.indexOf(l)]; }), c.n).join('');
    }
    return {
      seqMode: true, compareKey: 'signature',
      leftItems:  _shuffled(chosen.map(function (c, i) { return { id: 'L' + i, emoji: render(c, AC_COLOR), signature: c.sig, nameZh: '颜色规律', nameEn: 'Colour pattern' }; })),
      rightSlots: _shuffled(chosen.map(function (c, i) { return { id: 'R' + i, emoji: render(c, AC_OBJ), signature: c.sig, nameZh: '图案规律', nameEn: 'Picture pattern' }; }))
    };
  }
  function _growMatch() {
    var g = pick1(['🔵', '🟢', '🟣']), rules = _shuffled([['up1', 1, 1], ['down1', 5, -1], ['up2', 1, 2]]);
    var ct = function (n) { var o = ''; for (var i = 0; i < n; i++) o += g; return o; };
    var runs = rules.map(function (r, i) {
      var v = [0, 1, 2].map(function (k) { return r[1] + r[2] * k; });
      if (r[0] === 'down1') v = [v[0], v[1], v[2]].map(function (x, k) { return 3 - k + (Math.random() < 0.5 ? 0 : 1); });
      return { id: i, sig: r[0], v: v };
    });
    return {
      seqMode: true, compareKey: 'signature',
      leftItems:  _shuffled(runs.map(function (r) { return { id: 'L' + r.id, emoji: r.v.map(ct).join(' '), signature: r.sig, nameZh: '图形规律', nameEn: 'Picture pattern' }; })),
      rightSlots: _shuffled(runs.map(function (r) { return { id: 'R' + r.id, emoji: r.v.join('  '), signature: r.sig, nameZh: '数字规律', nameEn: 'Number pattern' }; }))
    };
  }
  function _transMatch() {
    var c = _shuffled(['🟥', '🟦', '🟩', '🟪']), a = c[0], b = c[1];
    var runs = [
      { sig: 'add',    left: a + ' ' + a + b + ' ' + a + b + b,       right: '➕ ➕ ➕', zh: '每次加一块',   en: 'Add one each time' },
      { sig: 'remove', left: a + a + a + ' ' + a + a + ' ' + a,       right: '➖ ➖ ➖', zh: '每次拿走一块', en: 'Take one each time' },
      { sig: 'alt',    left: a + ' ' + a + b + ' ' + a + b + a,       right: b + ' ' + a + ' ' + b, zh: '加的颜色轮流', en: 'Added colour takes turns' }
    ];
    return {
      seqMode: true, compareKey: 'signature',
      leftItems:  _shuffled(runs.map(function (r, i) { return { id: 'L' + i, emoji: r.left, signature: r.sig, nameZh: '方块变化', nameEn: 'Block change' }; })),
      rightSlots: _shuffled(runs.map(function (r, i) { return { id: 'R' + i, emoji: r.right, signature: r.sig, nameZh: r.zh, nameEn: r.en }; }))
    };
  }
  function _relMatch() {
    var ks = { mul: pick1([2, 3, 5]), add: 2 + Math.floor(Math.random() * 8), sub: 2 + Math.floor(Math.random() * 6) };
    var fn = { mul: function (x) { return x * ks.mul; }, add: function (x) { return x + ks.add; }, sub: function (x) { return x - ks.sub; } };
    var txt = { mul: '× ' + ks.mul, add: '+ ' + ks.add, sub: '− ' + ks.sub };
    var kinds = ['mul', 'add', 'sub'];
    var items = kinds.map(function (k, i) {
      var xs = _shuffled([3, 4, 5, 6, 7, 8, 9, 10, 12]).filter(function (x) { return k !== 'sub' || x > ks.sub; }).slice(0, 3);
      return { id: i, k: k, ex: xs.map(function (x) { return x + '→' + fn[k](x); }).join('  ') };
    });
    return {
      seqMode: true, compareKey: 'signature',
      leftItems:  _shuffled(items.map(function (r) { return { id: 'L' + r.id, emoji: r.ex, signature: r.k, nameZh: '例子', nameEn: 'Examples' }; })),
      rightSlots: _shuffled(items.map(function (r) { return { id: 'R' + r.id, emoji: txt[r.k], signature: r.k, nameZh: '规则', nameEn: 'Rule' }; }))
    };
  }
  function _spatialMatch() {
    var f = pick1(['🐸', '🔵', '🟢', '🟣']), e = '⬜';
    var cell = function (k, n) { var o = ''; for (var i = 0; i < n; i++) o += (i === k ? f : e); return o; };
    var runs = [
      { sig: 'step',  left: [0, 1, 2].map(function (k) { return cell(k, 3); }).join(' '),       right: '➡️ ➡️',     zh: '一直向右', en: 'Keep going right' },
      { sig: 'swing', left: [0, 1, 0, 1].map(function (k) { return cell(k, 2); }).join(' '),    right: '➡️ ⬅️ ➡️', zh: '左右来回', en: 'Back and forth' },
      { sig: 'loop',  left: [0, 1, 2, 0].map(function (k) { return cell(k, 3); }).join(' '),    right: '➡️ ➡️ ⏮️', zh: '走一圈回起点', en: 'Round and back to start' }
    ];
    return {
      seqMode: true, compareKey: 'signature',
      leftItems:  _shuffled(runs.map(function (r, i) { return { id: 'L' + i, emoji: r.left, signature: r.sig, nameZh: '位置规律', nameEn: 'Position pattern' }; })),
      rightSlots: _shuffled(runs.map(function (r, i) { return { id: 'R' + i, emoji: r.right, signature: r.sig, nameZh: r.zh, nameEn: r.en }; }))
    };
  }

  // create: arrange tokens so the RESULT has the target structure (any relabelling counts)
  function _sigCreate(target, tokens, instrZh, instrEn) {
    var counts = {}, items = [], n = 0;
    target.split('').forEach(function (l) { counts[l] = (counts[l] || 0) + 1; });
    Object.keys(counts).forEach(function (l, li) {
      for (var i = 0; i < counts[l]; i++) items.push({ id: 'C' + (n++), token: 't' + li, emoji: tokens[li] });
    });
    return { targetSignature: target, items: _shuffled(items), instrZh: instrZh, instrEn: instrEn };
  }
  function _repCreateK1() {
    var c = _shuffled(AC_COLOR);
    return _sigCreate('ABAB', [c[0], c[1]], '把珠子排成"一个换一个"的规律 (ABAB) →', 'Arrange the beads so the colours take turns (ABAB) →');
  }
  function _repCreateK2() {
    var c = _shuffled(AC_COLOR);
    return Math.random() < 0.5
      ? _sigCreate('AABB', [c[0], c[1]], '把珠子排成"两个一样紧挨着"的规律 (AABB) →', 'Arrange the beads so each colour makes a pair (AABB) →')
      : _sigCreate('AABBCC', [c[0], c[1], c[2]], '把珠子排成"每种颜色两个紧挨着"的规律 (AABBCC) →', 'Arrange the beads so each colour comes as a pair (AABBCC) →');
  }
  function _altCreateG2() {
    var pair = pick1([['⬆️', '⬇️'], ['⬅️', '➡️'], ['☀️', '🌙'], ['🔴', '🔵']]);
    return pick1([0, 1]) === 0
      ? _sigCreate('ABABAB', pair, '把它们排成"一个换一个"的交替规律 (ABABAB) →', 'Arrange them so they alternate (ABABAB) →')
      : _sigCreate('AABAAB', pair, '把它们排成"两个同样、一个不同"的规律 (AABAAB) →', 'Arrange them as two the same, one different, repeating (AABAAB) →');
  }
  function _spatialCreateG2() {
    var set = pick1([['⬆️', '⏺️', '⬇️'], ['⬅️', '⏺️', '➡️']]);
    return _sigCreate('ABCABC', set, '把它们排成"一轮一轮重复"的规律 (ABCABC) →', 'Arrange them as a three-step round that repeats (ABCABC) →');
  }
  function _growCreate() {
    var g = pick1(['🔵', '🟢', '🟣']), down = Math.random() < 0.4, s = 1 + Math.floor(Math.random() * 2);
    var mk = function (n) { var o = ''; for (var i = 0; i < n; i++) o += g; return o; };
    var vals = [s, s + 1, s + 2, s + 3];
    var items = _shuffled(vals.map(function (v) { return { id: 'V' + v, emoji: mk(v) }; }));
    var order = vals.map(function (v) { return 'V' + v; }); if (down) order.reverse();
    return { targetOrder: order, lowZh: down ? '多' : '少', lowEn: down ? 'Many' : 'Few', highZh: down ? '少' : '多', highEn: down ? 'Few' : 'Many',
      items: items,
      instrZh: down ? '把它们排成"一个比一个少"的规律 →' : '把它们排成"一个比一个多"的规律 →',
      instrEn: down ? 'Arrange them so each has one fewer →' : 'Arrange them so each has one more →' };
  }
  function _numCreate() {
    var step = pick1([5, 10, 20]), start = pick1([5, 10, 15]);
    var vals = [0, 1, 2, 3].map(function (i) { return start + step * i; });
    return { targetOrder: vals.map(function (v) { return 'N' + v; }), lowZh: '小', lowEn: 'Small', highZh: '大', highEn: 'Large',
      items: _shuffled(vals.map(function (v) { return { id: 'N' + v, emoji: String(v) }; })),
      instrZh: '把数字排成"每次加得一样多"的数列 →', instrEn: 'Arrange the numbers so each step adds the same amount →' };
  }

  var ACTIVITIES = {
    K1: [{ id: 'k1-create-ab', mode: 'create', structure: 'repetition', carrier: 'color', icon: '📿', zh: '串珠子', en: 'String the beads', make: _repCreateK1 }],
    K2: [{ id: 'k2-match-rep', mode: 'match', structure: 'repetition', carrier: 'color', icon: '🧷', zh: '颜色配图案', en: 'Colour to picture', make: function () { return _sigMatch(['AABB', 'ABC', 'AAB', 'ABB', 'AABC']); } },
         { id: 'k2-create-rep', mode: 'create', structure: 'repetition', carrier: 'color', icon: '🎨', zh: '串珠子 (两个一组)', en: 'Beads in pairs', make: _repCreateK2 }],
    G1: [{ id: 'g1-match-grow', mode: 'match', structure: 'growth', carrier: 'count', icon: '📈', zh: '图形配数字', en: 'Pictures to numbers', make: _growMatch },
         { id: 'g1-create-grow', mode: 'create', structure: 'growth', carrier: 'count', icon: '🧱', zh: '排出增减', en: 'Order the growth', make: _growCreate }],
    G2: [{ id: 'g2-match-alt', mode: 'match', structure: 'alternating', carrier: 'color', icon: '🧩', zh: '颜色配图案 (交替)', en: 'Colour to picture (turns)', make: function () { return _sigMatch(['ABAC', 'AABC', 'ABCB', 'AAB', 'ABB']); } },
         { id: 'g2-create-alt', mode: 'create', structure: 'alternating', carrier: 'direction', icon: '↔️', zh: '排出交替', en: 'Build the turns', make: _altCreateG2 },
         { id: 'g2-match-trans', mode: 'match', structure: 'transformation', carrier: 'object', icon: '🏗️', zh: '方块变化配说明', en: 'Block changes', make: _transMatch },
         { id: 'g2-match-rel', mode: 'match', structure: 'relational', carrier: 'numeral', icon: '🔀', zh: '例子配规则', en: 'Examples to rule', make: _relMatch },
         { id: 'g2-match-spatial', mode: 'match', structure: 'spatial', carrier: 'position', icon: '🗺️', zh: '位置配走法', en: 'Position to moves', make: _spatialMatch },
         { id: 'g2-create-spatial', mode: 'create', structure: 'spatial', carrier: 'position', icon: '🧭', zh: '排出一轮一轮', en: 'Build the round', make: _spatialCreateG2 },
         { id: 'g2-create-num', mode: 'create', structure: 'numerical', carrier: 'numeral', icon: '🔢', zh: '排出数列', en: 'Build the run', make: _numCreate }]
  };

  function _launchActivity(levelId, act) {
    var v = act.make(), isMatch = act.mode === 'match';
    var tpl = { id: 'pat-' + act.id, level: levelId, type: act.structure, mode: act.mode, runtime: isMatch ? 'match' : 'sort',
      compareKey: isMatch ? 'signature' : undefined,
      modeLabelZh: isMatch ? undefined : '创造', modeLabelEn: isMatch ? undefined : 'Create',
      instrZh: v.instrZh || '把左边的拖到结构相同的一项上 →', instrEn: v.instrEn || 'Drag each one onto the item with the same structure →',
      holdingLabelZh: '拖动', holdingLabelEn: 'Drag' };
    if (isMatch && !v.instrZh) {
      tpl.instrZh = '把左边的拖到变化方式相同的一项上 →';
      tpl.instrEn = 'Drag each one onto the item that changes the same way →';
    }
    v.variantId = _vid(tpl.id);
    ActivityRunner.launch(tpl, v, {
      levelId: levelId, onBack: function () {},
      onComplete: function (attempt) {
        if (!shell || typeof shell.report !== 'function') return;
        shell.report({
          gameId: SOURCE_GAME_ID, unitId: act.id, templateId: attempt.templateId, variantId: attempt.variantId || null,
          score: attempt.result === 'correct' ? 1 : 0, total: 1, timeMs: attempt.responseMs || 0, hintsUsed: 0,
          geneIds: genesFor(act.structure), shell: 'shell-1', activityRuntime: 'interaction', activityMode: act.mode,
          result: attempt.result || null, levelId: levelId, gradeCode: levelId,
          context: { moduleId: MODULE_ID, moduleType: MODULE_TYPE, levelId: levelId, gradeCode: levelId,
            patternType: act.structure, structure: act.structure, carrier: act.carrier, taskType: act.mode,
            ruleType: null, difficultyAxis: difficultyAxisFor(levelId, null, 'forward', act.carrier), sourceGameId: SOURCE_GAME_ID }
        });
      }
    });
  }

  // Mini games are listed on the grade home, after the unit cards (shell.homeExtras).
  function _homeExtras(levelId) {
    return function (list) {
      if (!ACTIVITIES[levelId]) return;
      var head = document.createElement('div');
      head.className = 'mp-gm-head';
      head.innerHTML = '<span class="zh">🎮 小游戏</span><span class="en">🎮 Mini games</span>';
      list.appendChild(head);
      ACTIVITIES[levelId].forEach(function (a) {
        var card = document.createElement('div');
        card.className = 's1-card';
        card.innerHTML = '<div class="s1-cicon">' + a.icon + '</div><div class="s1-cinfo"><div class="s1-cname"><span class="zh">' + a.zh + '</span><span class="en">' + a.en +
          '</span></div></div><div class="s1-cstat"><span class="zh">' + (a.mode === 'match' ? '配对' : '创造') + '</span><span class="en">' + (a.mode === 'match' ? 'Match' : 'Create') + '</span></div>';
        card.addEventListener('click', function () { _launchActivity(levelId, a); });
        list.appendChild(card);
      });
    };
  }

  (function () {
    var st = document.createElement('style');
    st.textContent = [
      '.mp-gm-head{font-size:15px;font-weight:900;color:#92400e;margin:14px 2px 2px;}'
    ].join('');
    document.head.appendChild(st);
  })();

  // ── Grade level selector ───────────────────────────────────────────────────
  // Mirrors comparison's own K/G grade chooser (comparison/game.js
  // GRADE_LEVELS + _showLevelSelector): the child picks a grade card before
  // ever seeing a unit, instead of one flat list spanning K1 through G2.

  // ── token rendering (generator.js token grammar) ──────────────────────────
  function tokHtml(tok) {
    if (tok === '?') return '<span class="mystery">?</span>';
    var t = String(tok);
    var m;
    if ((m = /^sz:(.+):(\d)$/.exec(t))) return '<span class="mp-sz" style="font-size:' + (14 + Number(m[2]) * 9) + 'px">' + m[1] + '</span>';
    if ((m = /^ct:(.+):(\d+)$/.exec(t))) {
      var o = ''; for (var i = 0; i < Number(m[2]); i++) o += m[1];
      return '<span class="mp-ct">' + o + '</span>';
    }
    if ((m = /^ps:(\d+):(\d+):(.+)$/.exec(t))) {
      var cells = '';
      for (var c = 0; c < Number(m[2]); c++) cells += '<i' + (c === Number(m[1]) ? ' class="on">' + m[3] : '>') + '</i>';
      return '<span class="mp-ps">' + cells + '</span>';
    }
    if ((m = /^st:([A-Z]+)$/.exec(t))) {
      var b = ''; for (var k = 0; k < m[1].length; k++) b += '<i class="b' + m[1].charAt(k) + '"></i>';
      return '<span class="mp-st">' + b + '</span>';
    }
    if ((m = /^lt:(.+)$/.exec(t))) return '<span class="mp-lt">' + m[1] + '</span>';
    if ((m = /^hd:(.+)$/.exec(t))) return '<span class="mp-hd">' + m[1] + '</span>';
    if ((m = /^wd:(\d)$/.exec(t))) {
      var D = [['日', 'Su'], ['一', 'Mo'], ['二', 'Tu'], ['三', 'We'], ['四', 'Th'], ['五', 'Fr'], ['六', 'Sa']][Number(m[1])];
      return '<span class="mp-hd"><span class="zh">' + D[0] + '</span><span class="en">' + D[1] + '</span></span>';
    }
    return '<span>' + t + '</span>';
  }
  function gridHtml(q, tappable) {
    return '<div class="mp-grid" style="grid-template-columns:repeat(' + q.grid.cols + ',minmax(34px,1fr))">' +
      q.seq.map(function (tok, i) {
        var head = /^(hd|wd):/.test(String(tok));
        return '<div class="mp-gcell' + (head ? ' head' : '') + (tappable && !head ? ' mp-repair-item' : '') + '" data-i="' + i + '">' + tokHtml(tok) + '</div>';
      }).join('') + '</div>';
  }
  (function () {
    var st = document.createElement('style');
    st.textContent = [
      '.s1-seq,.mp-discover-group{background:#fff !important;}',
      '.mp-sz{display:inline-block;line-height:1;vertical-align:middle;}',
      '.mp-ct{display:inline-block;max-width:92px;font-size:18px;line-height:1.1;letter-spacing:0;word-break:break-all;vertical-align:middle;}',
      '.mp-lt{display:inline-block;min-width:34px;padding:4px 8px;border-radius:10px;background:#fff;border:2px solid #3b82f6;color:#1d4ed8;font-weight:900;text-align:center;}',
      '.mp-hd{font-weight:900;color:#7c3aed;}',
      '.mp-grid{display:grid;gap:4px;width:100%;max-width:420px;}',
      '.mp-gcell{display:flex;align-items:center;justify-content:center;min-height:40px;border-radius:8px;background:#f1f5f9;font-size:22px;font-weight:800;letter-spacing:0;}',
      '.mp-gcell.head{background:#ede9fe;font-size:16px;}',
      '.mp-gcell.mp-repair-item{padding:0;}',
      '.mp-ps{display:inline-flex;gap:2px;padding:3px;background:rgba(0,0,0,.08);border-radius:8px;vertical-align:middle;}',
      '.mp-ps i{display:block;width:26px;height:26px;border-radius:5px;background:#fff;font-style:normal;font-size:20px;line-height:26px;text-align:center;}',
      '.mp-ps i.on{background:#fef3c7;}',
      '.mp-st{display:inline-flex;flex-direction:column-reverse;align-items:center;justify-content:flex-start;width:36px;min-height:96px;padding:3px;border-bottom:3px solid #92400e;vertical-align:bottom;}',
      '.mp-st i{display:block;width:30px;height:13px;margin-top:1px;border-radius:3px;}',
      '.mp-st i.bR{background:#ef4444;}.mp-st i.bB{background:#3b82f6;}.mp-st i.bG{background:#22c55e;}.mp-st i.bP{background:#8b5cf6;}',
      '.s1-seq.mp-rows,.s1-seq.mp-explain{flex-direction:column;gap:8px;}',
      '.mp-exrow{display:flex;align-items:flex-end;justify-content:center;gap:8px;flex-wrap:wrap;}',
      '.mp-ask{font-size:15px;font-weight:800;color:#92400e;letter-spacing:0;text-align:center;}',
      '.mp-row{display:flex;align-items:center;justify-content:center;gap:10px;font-size:26px;font-weight:800;}',
      '.mp-arrow{color:#b45309;}'
    ].join('');
    document.head.appendChild(st);
  })();

  var GRADE_LEVELS = [
    { id: 'K1', badge: 'K1', nameZh: '幼儿园小/中班', nameEn: 'Pre-K',        descZh: '3–4岁 · 无需数字',  descEn: 'Age 3–4 · No numbers',  free: true  },
    { id: 'K2', badge: 'K2', nameZh: '幼儿园大班',    nameEn: 'Kindergarten', descZh: '5岁 · 数字入门',    descEn: 'Age 5 · Intro numbers', free: true  },
    { id: 'G1', badge: 'G1', nameZh: '小学一年级',    nameEn: 'Grade 1',      descZh: '6岁 · 20以内',      descEn: 'Age 6 · Within 20',     free: true  },
    { id: 'G2', badge: 'G2', nameZh: '小学二年级',    nameEn: 'Grade 2',      descZh: '7岁 · 100以内',     descEn: 'Age 7 · Within 100',    free: true  },
    { id: 'G3', badge: 'G3', nameZh: '三年级',        nameEn: 'Grade 3',      descZh: '即将推出',          descEn: 'Coming Soon',           free: false },
    { id: 'G4', badge: 'G4', nameZh: '四年级',        nameEn: 'Grade 4',      descZh: '即将推出',          descEn: 'Coming Soon',           free: false },
    { id: 'G5', badge: 'G5', nameZh: '五年级',        nameEn: 'Grade 5',      descZh: '即将推出',          descEn: 'Coming Soon',           free: false },
    { id: 'G6', badge: 'G6', nameZh: '六年级',        nameEn: 'Grade 6',      descZh: '即将推出',          descEn: 'Coming Soon',           free: false }
  ];

  /**
   * Same idiom as _injectDiscoverStyles/_injectRepairStyles below: a small
   * self-scoped stylesheet rather than the shared shell-1.css, because only
   * the grade selector screen uses these classes. Adapted from comparison's
   * own .cq-lvl-* rules — this module's selector is styled to match.
   */
  function _injectLevelSelectorStyles() {
    if (document.getElementById('mp-lvl-style')) return;
    var s = document.createElement('style');
    s.id = 'mp-lvl-style';
    s.textContent = [
      '.mp-lvl-wrap{display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px 16px;}',
      '.mp-lvl-title-bar{display:flex;align-items:center;width:100%;max-width:520px;gap:8px;}',
      '.mp-lvl-title{font-size:20px;font-weight:900;color:#1e3a8a;text-align:center;flex:1;}',
      '.mp-lvl-back{background:none;border:none;cursor:pointer;font-size:14px;font-weight:700;color:#2563eb;padding:4px 6px;border-radius:8px;white-space:nowrap;flex:0 0 auto;}',
      '.mp-lvl-back:hover{background:#eff6ff;}',
      '.mp-lvl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;width:100%;max-width:440px;}',
      '.mp-lvl-card{border:2px solid #bfdbfe;border-radius:16px;padding:18px 14px;cursor:pointer;text-align:center;background:#fff;transition:transform .16s,border-color .16s,box-shadow .16s;}',
      '.mp-lvl-card:hover{transform:translateY(-2px);border-color:#3b82f6;box-shadow:0 8px 20px rgba(37,99,235,0.12);}',
      '.mp-lvl-card.locked{opacity:0.45;cursor:default;pointer-events:none;}',
      '.mp-lvl-badge{font-size:26px;font-weight:900;color:#1e40af;margin-bottom:4px;}',
      '.mp-lvl-name{font-size:13px;font-weight:700;color:#334155;}',
      '.mp-lvl-desc{font-size:11px;color:#94a3b8;margin-top:4px;}',
      '.mp-lvl-tag{display:inline-block;font-size:10px;font-weight:700;border-radius:6px;padding:2px 8px;margin-top:6px;}',
      '.mp-lvl-tag.free{background:#dcfce7;color:#16a34a;}',
      '.mp-lvl-tag.locked-tag{background:#f1f5f9;color:#94a3b8;}'
    ].join('');
    document.head.appendChild(s);
  }

  function _showLevelSelector() {
    _injectLevelSelectorStyles();
    var lang = shell.lang || 'zh';
    var wrap = document.createElement('div');
    wrap.id = 'mp-lvl-selector';
    wrap.innerHTML = '<div class="mp-lvl-wrap">' +
      '<div class="mp-lvl-title-bar">' +
        '<button class="mp-lvl-back" id="mp-sel-back">⬅️ <span class="zh">数学启智</span><span class="en">Math</span></button>' +
        '<div class="mp-lvl-title"><span class="zh">规律 · 选择年级</span><span class="en">Pattern · Grade</span></div>' +
        IH.controlsHtml('lvl') +
      '</div>' +
      '<div class="mp-lvl-grid">' +
      GRADE_LEVELS.map(function (lvl) {
        var lk = !lvl.free;
        return '<div class="mp-lvl-card' + (lk ? ' locked' : '') + '" data-level="' + lvl.id + '">' +
          '<div class="mp-lvl-badge">' + lvl.badge + '</div>' +
          '<div class="mp-lvl-name"><span class="zh">' + lvl.nameZh + '</span><span class="en">' + lvl.nameEn + '</span></div>' +
          '<div class="mp-lvl-desc"><span class="zh">' + lvl.descZh + '</span><span class="en">' + lvl.descEn + '</span></div>' +
          '<div class="mp-lvl-tag ' + (lk ? 'locked-tag' : 'free') + '"><span class="zh">' + (lk ? '即将推出' : '免费') + '</span><span class="en">' + (lk ? 'Soon' : 'Free') + '</span></div>' +
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

    var backBtn = document.getElementById('mp-sel-back');
    if (backBtn) backBtn.addEventListener('click', function () { window.location.href = '../index.html'; });

    wrap.addEventListener('click', function (e) {
      var card = e.target.closest('.mp-lvl-card:not(.locked)');
      if (!card) return;
      wrap.remove();
      _launchGrade(card.getAttribute('data-level'));
    });
  }

  // "⬅️" in the shell home header: tear the grade's shell down and return to
  // the grade chooser (same idiom as comparison's _injectShellHomeBackButton).
  function _injectHomeBackButton() {
    var hdr = document.querySelector('#s1-home .s1-hdr');
    if (!hdr || document.getElementById('mp-home-back')) return;
    var btn = document.createElement('button');
    btn.id = 'mp-home-back';
    btn.innerHTML = '⬅️';
    btn.title = '返回选级 / Back to grades';
    btn.addEventListener('click', function () {
      ['.s1-wrap', '#s1-transcript', '#s1-overlay'].forEach(function (sel) {
        var el = document.querySelector(sel); if (el) el.remove();
      });
      _showLevelSelector();
    });
    hdr.insertBefore(btn, hdr.firstChild);
  }

  function _launchGrade(levelId) {
    var levelIdOfSession = levelId;
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
    // A grade's units are independent structures (e.g. K1 color cycle next to
    // G1 direction oscillation), not an escalating ladder — so every unit in
    // the selected grade is open from the start, same as comparison's own
    // reasoning for this flag.
    parallelUnits: true,
    units: buildUnits(levelId),
    homeExtras: _homeExtras(levelId),

    renderSequence: function (q, container) {
      container.classList.remove('mp-discover', 'mp-repair', 'mp-rows', 'mp-explain');
      if (q.explain) {
        container.classList.add('mp-explain');
        var body = q.rows ? q.rows.map(function (r) { return '<div class="mp-row">' + tokHtml(r[0]) + ' <span class="mp-arrow">→</span> ' + tokHtml(r[1]) + '</div>'; }).join('')
                          : '<div class="mp-exrow">' + q.seq.map(tokHtml).join(' ') + '</div>';
        container.innerHTML = body + '<div class="mp-ask"><span class="zh">以下哪一个符合规律？</span><span class="en">Which one fits the pattern?</span></div>';
        return;
      }
      if (q.task === 'discover') {
        container.classList.add('mp-discover');
        container.innerHTML = q.groups.map(function (g, i) {
          return '<div class="mp-discover-group"><span class="mp-discover-num">' + (i + 1) + '</span>' +
            g.seq.map(tokHtml).join(' ') + '</div>';
        }).join('');
        return;
      }
      if (q.rows) {
        container.classList.add('mp-rows');
        container.innerHTML = q.rows.map(function (r) {
          return '<div class="mp-row">' + tokHtml(r[0]) + ' <span class="mp-arrow">→</span> ' + tokHtml(r[1]) + '</div>';
        }).join('');
        return;
      }
      if (q.task === 'repair') {
        container.classList.add('mp-repair');
        container.innerHTML = q.grid ? gridHtml(q, true) : q.seq.map(function (tok, i) {
          return '<span class="mp-repair-item" data-i="' + i + '">' + tokHtml(tok) + '</span>';
        }).join(' ');
        Array.prototype.forEach.call(container.querySelectorAll('.mp-repair-item'), function (el) {
          if (Number(el.getAttribute('data-i')) === q._repairIndex) el.classList.add('mp-repair-selected');
          el.addEventListener('click', function () {
            q._repairIndex = Number(el.getAttribute('data-i'));
            Array.prototype.forEach.call(container.querySelectorAll('.mp-repair-item'), function (x) {
              x.classList.remove('mp-repair-selected');
            });
            el.classList.add('mp-repair-selected');
          });
        });
        return;
      }
      container.innerHTML = q.grid ? gridHtml(q, false) : q.seq.map(tokHtml).join(' ');
    },
    renderOption: function (opt, q) {
      if (q && q.optText) return '<span class="zh">' + q.optText[opt][0] + '</span><span class="en">' + q.optText[opt][1] + '</span>';
      if (q && q.task === 'discover') {
        return shell.lang === 'zh' ? '第 ' + opt + ' 组' : 'Group ' + opt;
      }
      return tokHtml(opt);
    },
    checkAnswer: function (selected, q) {
      if (q.task === 'repair') {
        return q._repairIndex === q.brokenIndex && String(selected) === String(q.answer);
      }
      return String(selected) === String(q.answer);
    },

    getVoiceText: function (q) {
      var zh = shell.lang === 'zh';
      if (q.explain) return zh ? '看这一排，以下哪一个符合规律？' : 'Look at this row — which one fits the pattern?';
      if (q.task === 'discover') return zh ? '看看这几组，哪一组是真的规律？' : 'Look at each group — which one is a real pattern?';
      if (q.task === 'repair') return zh ? '这排里有一个错了，先点出错的那个，再选出正确的。' : 'One item in this row is wrong — tap it, then pick the right one.';
      if (q.grid) return zh ? (q.task === 'repair' ? '这张表里有一格错了，先点出来，再选出正确的。' : '横着看、竖着看，问号是几？') : (q.task === 'repair' ? 'One cell is wrong — tap it, then pick the right one.' : 'Read across and down — what is the missing number?');
      if (q.rows) return zh ? '看每一行，左边怎样变成右边？问号是几？' : 'Look at each row — how does the left become the right? What is the missing number?';
      if (q.seq.every(function (n) { return n === '?' || !isNaN(n); })) {
        var items = q.seq.map(function (n) { return n === '?' ? (zh ? '问号' : 'blank') : String(n); });
        return zh ? items.join('，') + '。问号是几？' : items.join(', ') + '. What is the missing number?';
      }
      return zh ? '看规律，问号是什么？' : 'Look at the pattern — what goes in the blank?';
    },

    registerRootGenes: function () {
      var all = [];
      Object.keys(STRUCTURE_GENES).forEach(function (k) { all = all.concat(genesFor(k)); });
      return _unique(all);
    },

    /**
     * One Attempt per session. The batch is labelled with the structure,
     * carrier and direction the child met most often; the full lists travel
     * alongside because forward and backward accuracy must not be pooled
     * (pattern.json `direction-not-poolable`).
     */
    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var unitId = String(unit.id);
      var levelId = UNIT_LEVEL[unitId] || levelIdOfSession;
      var qs = unit.questions || [];
      var dirs = qs.map(function (q) {
        return q.task === 'discover' || q.task === 'repair' ? q.task : (q.rows ? 'forward' : (q.grid ? 'interior' : inferenceDirectionOf(q.seq)));
      });
      var dominant = _dominant(dirs);
      var structure = _dominant(qs.map(function (q) { return q.structure; }));
      var rep = qs.filter(function (q) { return q.structure === structure; })[0] || qs[0] || null;
      var out = buildRadarContext(levelId, rep, dominant, {
        unitId:              unitId,
        inferenceDirection:  dominant === 'discover' || dominant === 'repair' ? null : dominant,
        inferenceDirections: _unique(dirs),
        structures:          _unique(qs.map(function (q) { return q.structure; })),
        carriers:            _unique(qs.map(function (q) { return q.carrier; })),
        taskTypes:           _unique(qs.map(function (q) { return q.task; })),
        activityRuntime:     'puzzle'
      });
      refillUnit(unitId);
      return out;
    }
    });

    _injectHomeBackButton();
  }

  /**
   * discover's candidate-group layout (several stacked groups, no blank) does
   * not fit .s1-seq's single-row flex layout, so it gets a small stylesheet of
   * its own — same idiom as MatchRuntime._injectStyles, kept out of the
   * cross-module shell-1.css because only this module's discover items use it.
   */
  function _injectDiscoverStyles() {
    var hb = document.createElement('style');
    hb.textContent = '#mp-home-back{flex:0 0 auto;background:none;border:none;cursor:pointer;font-size:20px;padding:4px 8px;line-height:1;}';
    document.head.appendChild(hb);
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

  /**
   * repair's sequence has no blank, but every item must stay tappable so the
   * child can point at the broken one — a plain hover/selected highlight on
   * top of the existing .s1-seq row, same idiom as discover's own stylesheet.
   */
  function _injectRepairStyles() {
    if (document.getElementById('mp-repair-style')) return;
    var s = document.createElement('style');
    s.id = 'mp-repair-style';
    s.textContent = [
      '.mp-repair-item{cursor:pointer;padding:2px 6px;border-radius:8px;transition:background .15s,transform .15s;}',
      '.mp-repair-item:hover{background:rgba(0,0,0,.08);}',
      '.mp-repair-selected{background:var(--s1-primary);transform:scale(1.1);}'
    ].join('');
    document.head.appendChild(s);
  }
  _injectDiscoverStyles();
  _injectRepairStyles();

  _showLevelSelector();
})();
