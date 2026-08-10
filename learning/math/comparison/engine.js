'use strict';
/**
 * Comparison Adaptive Engine  v1.0
 *
 * Responsibilities:
 *   - MasteryTracker  : per-template state machine (NEW→LEARNING→FAMILIAR→MASTERED→REVIEW)
 *   - CooldownTracker : attempt-count-based cooldown per template
 *   - CoverageTracker : rolling window of last 20 attempts for type balance
 *   - Scheduler       : priority scoring + top-N weighted random selection
 *   - AttemptLogger   : records each attempt and queues server upload event
 *
 * Storage keys (all under me: prefix via shell.storage):
 *   me:cmp:tpl:{id}          → per-template state (mastery, cooldown, history)
 *   me:cmp:coverage          → coverage window (last 20 attempt type strings)
 *   me:cmp:global_attempts   → total attempt counter across all templates
 *   me:cmp:upload_queue      → pending server events
 */

var CmpEngine = (function () {

  // ── Constants ─────────────────────────────────────────────────────────────

  var MASTERY = {
    NEW:      'NEW',
    LEARNING: 'LEARNING',
    FAMILIAR: 'FAMILIAR',
    MASTERED: 'MASTERED',
    REVIEW:   'REVIEW'
  };

  var MASTERY_WEIGHT = {
    NEW:      4,
    LEARNING: 5,
    FAMILIAR: 3,
    MASTERED: 0,
    REVIEW:   2
  };

  var COVERAGE_WINDOW    = 20;
  var SESSION_QUESTIONS  = 8;
  var SCHEDULER_TOP_N    = 5;
  var MASTERED_COOLDOWN_DAYS = 7;

  // ── Storage helpers ────────────────────────────────────────────────────────

  function _storageKey(suffix) {
    return 'cmp:' + suffix;
  }

  function _get(key, def) {
    return shell.storage.get(_storageKey(key), def);
  }

  function _set(key, val) {
    shell.storage.set(_storageKey(key), val);
  }

  // ── MasteryTracker ─────────────────────────────────────────────────────────

  function _defaultTemplateState() {
    return {
      mastery:        MASTERY.NEW,
      attempt_count:  0,
      correct_count:  0,
      recent_results: [],   // last 5 booleans (most recent last)
      streak:         0,
      last_seen_ts:   0,
      mastered_at_ts: null,
      cooldown_remaining: 0  // other-attempt countdown
    };
  }

  function _loadState(templateId) {
    var s = _get('tpl:' + templateId, null);
    if (!s) return _defaultTemplateState();
    return s;
  }

  function _saveState(templateId, state) {
    _set('tpl:' + templateId, state);
  }

  /**
   * Update mastery state after a correct/incorrect result.
   * Returns the new mastery string.
   */
  function _updateMastery(state, correct) {
    var m = state.mastery;
    var r = state.recent_results;

    // ── update streak ──────────────────────────────────────────────────────
    state.streak = correct ? state.streak + 1 : 0;

    // ── count correct in last 5 ────────────────────────────────────────────
    var window5 = r.slice(-5);
    var correctIn5 = window5.filter(function (v) { return v; }).length;

    // ── transitions ────────────────────────────────────────────────────────
    if (m === MASTERY.NEW) {
      state.mastery = MASTERY.LEARNING;

    } else if (m === MASTERY.LEARNING) {
      if (state.attempt_count >= 3 && correctIn5 >= 3) {
        state.mastery = MASTERY.FAMILIAR;
      }

    } else if (m === MASTERY.FAMILIAR) {
      if (correctIn5 >= 4 && state.streak >= 2) {
        state.mastery = MASTERY.MASTERED;
        state.mastered_at_ts = Date.now();
      } else if (correctIn5 <= 2) {
        state.mastery = MASTERY.LEARNING;
      }

    } else if (m === MASTERY.MASTERED) {
      // Only enter REVIEW via cooldown/time check; no direct demotion from MASTERED here.
      // Wrong answers in MASTERED state don't demote immediately.

    } else if (m === MASTERY.REVIEW) {
      if (state.streak >= 2) {
        state.mastery = MASTERY.MASTERED;
        state.mastered_at_ts = Date.now();
      } else if (correctIn5 <= 2) {
        state.mastery = MASTERY.FAMILIAR;
      }
    }

    return state.mastery;
  }

  // ── CooldownTracker ────────────────────────────────────────────────────────

  /**
   * Compute the cooldown to apply after this attempt.
   */
  function _cooldownFor(masteryAfter, correct, templateCooldownDef) {
    var cd = templateCooldownDef || { correct: 5, familiar: 8, mastered: 20, wrong: 2 };
    if (!correct) return cd.wrong || 2;
    if (masteryAfter === MASTERY.MASTERED) return cd.mastered || 20;
    if (masteryAfter === MASTERY.FAMILIAR) return cd.familiar || 8;
    return cd.correct || 5;
  }

  /**
   * Decrement all cooldowns by 1 (called when any attempt is recorded globally).
   * Templates expire into REVIEW when MASTERED + time condition met.
   */
  function _tickCooldowns(allTemplateIds) {
    var now = Date.now();
    allTemplateIds.forEach(function (id) {
      var s = _loadState(id);
      if (s.cooldown_remaining > 0) {
        s.cooldown_remaining -= 1;
      }
      // Promote MASTERED → REVIEW if cooldown exhausted and time condition met
      if (s.mastery === MASTERY.MASTERED && s.cooldown_remaining <= 0) {
        var daysSinceMastered = s.mastered_at_ts
          ? (now - s.mastered_at_ts) / 86400000
          : 999;
        var globalCount = _get('global_attempts', 0);
        var attemptsSinceMastered = globalCount - (s._mastered_at_global || 0);
        if (attemptsSinceMastered >= 20 || daysSinceMastered >= MASTERED_COOLDOWN_DAYS) {
          s.mastery = MASTERY.REVIEW;
        }
      }
      _saveState(id, s);
    });
  }

  // ── CoverageTracker ────────────────────────────────────────────────────────

  function _getCoverageWindow() {
    return _get('coverage', []);  // array of type strings, max COVERAGE_WINDOW
  }

  function _addCoverageEntry(type) {
    var w = _getCoverageWindow();
    w.push(type);
    if (w.length > COVERAGE_WINDOW) w.shift();
    _set('coverage', w);
  }

  /**
   * Coverage bonus: how many times has this type appeared in the last 20 attempts.
   * Returns +0 to +3 priority bonus.
   */
  function _coverageBonus(type) {
    var w = _getCoverageWindow();
    var count = w.filter(function (t) { return t === type; }).length;
    if (count === 0) return 3;
    if (count === 1) return 2;
    if (count === 2) return 1;
    return 0;
  }

  // ── Scheduler ──────────────────────────────────────────────────────────────

  /**
   * Score a single template for selection.
   * Higher = more likely to be selected.
   */
  function _scoreTemplate(template, state, sessionTemplateIds) {
    var m = state.mastery;

    // Hard exclude: still in cooldown OR already used this session
    if (state.cooldown_remaining > 0) return -1;
    if (sessionTemplateIds.indexOf(template.id) !== -1) return -1;

    var score = MASTERY_WEIGHT[m] || 0;

    // Time since last seen (0 to +3)
    if (state.last_seen_ts > 0) {
      var hoursAgo = (Date.now() - state.last_seen_ts) / 3600000;
      score += Math.min(3, hoursAgo / 8);
    } else {
      score += 3;  // never seen = max time bonus
    }

    // Coverage bonus (0 to +3)
    score += _coverageBonus(template.type);

    // Jitter: breaks ties so equal-scored templates are truly random (not array-order biased)
    score += Math.random() * 2;

    return score;
  }

  /**
   * Weighted random pick from an array of {template, score} objects.
   */
  function _weightedRandom(candidates) {
    var total = candidates.reduce(function (sum, c) { return sum + c.score; }, 0);
    if (total <= 0) return candidates[0].template;
    var r = Math.random() * total;
    var acc = 0;
    for (var i = 0; i < candidates.length; i++) {
      acc += candidates[i].score;
      if (r <= acc) return candidates[i].template;
    }
    return candidates[candidates.length - 1].template;
  }

  /**
   * Select SESSION_QUESTIONS templates for a session.
   *
   * @param {string}   level      'K1' | 'K2' | 'G1' | 'G2'
   * @param {Object[]} templates  full template pool (from templates.json)
   * @returns {Object[]}          selected templates in play order
   */
  function selectSessionTemplates(level, templates) {
    var pool = templates.filter(function (t) { return t.level === level; });
    var selected = [];

    for (var q = 0; q < SESSION_QUESTIONS; q++) {
      var sessionIds = selected.map(function (t) { return t.id; });

      // Score all eligible templates
      var scored = [];
      pool.forEach(function (t) {
        var state = _loadState(t.id);
        var s = _scoreTemplate(t, state, sessionIds);
        if (s >= 0) {
          scored.push({ template: t, score: s });
        }
      });

      if (scored.length === 0) {
        // All in cooldown: pick any from pool not yet in session
        var fallback = pool.filter(function (t) {
          return sessionIds.indexOf(t.id) === -1;
        });
        if (fallback.length === 0) break;
        selected.push(fallback[Math.floor(Math.random() * fallback.length)]);
        continue;
      }

      // Sort descending, take top N, weighted random
      scored.sort(function (a, b) { return b.score - a.score; });
      var topN = scored.slice(0, SCHEDULER_TOP_N);
      selected.push(_weightedRandom(topN));
    }

    return selected;
  }

  // ── AttemptLogger ─────────────────────────────────────────────────────────

  /**
   * Record one attempt. Call this after the player answers.
   *
   * @param {string}  templateId
   * @param {string}  variantId      unique ID for this rendered variant
   * @param {boolean} correct
   * @param {number}  responseMs
   * @param {boolean} hintUsed
   * @param {Object}  templateDef    the full template object (for cooldown def + rootGeneIds)
   */
  function recordAttempt(templateId, variantId, correct, responseMs, hintUsed, templateDef) {
    var now = Date.now();
    var state = _loadState(templateId);
    var masteryBefore = state.mastery;

    // Update history
    state.attempt_count += 1;
    if (correct) state.correct_count += 1;
    state.recent_results.push(correct);
    if (state.recent_results.length > 10) state.recent_results.shift();
    state.last_seen_ts = now;

    // Mastery transition
    var masteryAfter = _updateMastery(state, correct);

    // Snapshot global attempt counter before saving mastered marker
    var globalCount = _get('global_attempts', 0) + 1;
    _set('global_attempts', globalCount);

    // Record when mastered (for the 20-attempt REVIEW trigger)
    if (masteryAfter === MASTERY.MASTERED && masteryBefore !== MASTERY.MASTERED) {
      state._mastered_at_global = globalCount;
    }

    // Apply cooldown
    state.cooldown_remaining = _cooldownFor(
      masteryAfter, correct,
      templateDef && templateDef.cooldown
    );

    _saveState(templateId, state);

    // Coverage tracking
    if (templateDef && templateDef.type) {
      _addCoverageEntry(templateDef.type);
    }

    // Tick cooldowns on all known templates
    var allIds = _getAllKnownTemplateIds();
    if (allIds.indexOf(templateId) === -1) allIds.push(templateId);
    _set('known_ids', allIds);
    _tickCooldowns(allIds);

    // Build and queue server event
    var event = {
      event:          'attempt',
      schema_ver:     '1.0',
      ts:             now,
      template_id:    templateId,
      variant_id:     variantId,
      level:          templateDef ? templateDef.level : '',
      type:           templateDef ? templateDef.type  : '',
      game_mode:      'puzzle',
      difficulty:     templateDef ? (templateDef.difficulty || 1) : 1,
      result:         correct ? 'correct' : 'incorrect',
      response_ms:    responseMs || 0,
      hint_used:      !!hintUsed,
      mastery_before: masteryBefore,
      mastery_after:  masteryAfter,
      root_gene_ids:  templateDef ? (templateDef.rootGeneIds || []) : []
    };
    _queueServerEvent(event);

    return { masteryBefore: masteryBefore, masteryAfter: masteryAfter };
  }

  // ── Server upload queue ────────────────────────────────────────────────────

  function _queueServerEvent(event) {
    var q = _get('upload_queue', []);
    q.push(event);
    if (q.length > 200) q.shift();  // cap queue size
    _set('upload_queue', q);
    _tryFlushQueue();
  }

  function _tryFlushQueue() {
    if (!navigator.onLine) return;
    var q = _get('upload_queue', []);
    if (!q.length) return;
    var payload = q.slice();

    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: payload })
    }).then(function (res) {
      if (res.ok) {
        _set('upload_queue', []);
      }
    }).catch(function () {
      // Silently retry next time
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function _getAllKnownTemplateIds() {
    return _get('known_ids', []);
  }

  /**
   * Get mastery summary for a set of templates (for UI display).
   */
  function getMasterySummary(templates) {
    return templates.map(function (t) {
      var s = _loadState(t.id);
      return {
        id:            t.id,
        level:         t.level,
        type:          t.type,
        mastery:       s.mastery,
        attempt_count: s.attempt_count,
        correct_count: s.correct_count,
        last_seen_ts:  s.last_seen_ts
      };
    });
  }

  /**
   * Generate a lightweight variant ID for a rendered question.
   * Encodes template + random suffix so variant history can detect repeats.
   */
  function makeVariantId(templateId) {
    var rand = Math.random().toString(36).slice(2, 7);
    return templateId + '-v' + rand;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    MASTERY:                MASTERY,
    selectSessionTemplates: selectSessionTemplates,
    recordAttempt:          recordAttempt,
    getMasterySummary:      getMasterySummary,
    makeVariantId:          makeVariantId,
    flushUploadQueue:       _tryFlushQueue
  };

}());
