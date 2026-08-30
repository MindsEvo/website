'use strict';
/**
 * RadarReader — the read side of the thinking radar (阶段 1.3).
 *
 * shell.report() writes one record per attempt to
 *   localStorage['me:{gameId}:history:{ts}']
 * This module reads every one of those records back — ACROSS ALL GAMES, not
 * just one module — and folds them onto the two axes the radar is defined on:
 *
 *   axis 1   geneIds     WHICH thinking ability was exercised
 *   axis 2   gradeCode   AT WHAT DEPTH          (K1 K2 G1 G2 G3 G4 G5 G6)
 *
 * Four rules this file exists to enforce:
 *
 *   1. NEVER SUM `total` ACROSS RUNTIMES. A puzzle or interaction record's
 *      `total` counts questions; a mini-game record's counts ROUNDS. Adding
 *      them yields a number with no unit, and it would silently move the
 *      accuracy a parent is reading. What IS comparable is each record's
 *      `score / total` RATIO — that is dimensionless — so every accuracy
 *      here is the MEAN OF PER-RECORD RATIOS, one vote per session. The raw
 *      sums are still kept, but separately per runtime, so a caller that
 *      wants to say "12 of 15 questions" can.
 *
 *   2. Gene ↔ module is M:N by design. A record naming two genes counts once
 *      under EACH of them, so gene session counts do NOT sum to the record
 *      count. That is not double counting: the child really did exercise both.
 *
 *   3. Nothing is invented. A record with no `gradeCode` cannot be placed on
 *      axis 2 at all, so it counts toward the gene's session total and is
 *      reported in `noGrade` — it is never guessed onto a grade. Likewise a
 *      gene with no label in the registry gets a label DERIVED from its id,
 *      never a made-up name.
 *
 *   4. Everything dropped is counted. `skipped` is part of the result, so a
 *      page can say "read 40 of 44 records" instead of quietly under-reporting.
 *
 * No I/O and no shell dependency: it reads a Storage-like object (localStorage
 * by default) and takes gene labels as an argument. So it works on file://,
 * survives a failed fetch of the label registry, and is directly testable by
 * handing it a plain array of records.
 */
var RadarReader = (function (global) {

  // Axis 2, verbatim from shell.js (`GRADE_CODES`). Duplicated rather than
  // imported so this file has no load-order dependency on the shell; the
  // sanity check below fails loudly if the two ever drift apart.
  var GRADE_CODES = ['K1', 'K2', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6'];

  var KEY_PREFIX   = 'me:';
  var HISTORY_MARK = ':history:';

  // "Mastered" is a claim about a child, so it needs real evidence: a good
  // ratio AND more than one sitting. One lucky round is not depth.
  var DEFAULT_MASTERY_ACCURACY = 0.7;
  var DEFAULT_MASTERY_SESSIONS = 2;
  // Below this a first-half/second-half split is noise, not a trend.
  var DEFAULT_TREND_MIN = 4;

  // ── small helpers ───────────────────────────────────────────

  function num(value, fallback) {
    var n = Number(value);
    return isFinite(n) ? n : fallback;
  }

  function clamp01(value) {
    var n = Number(value);
    if (!isFinite(n)) return 0;
    return n < 0 ? 0 : (n > 1 ? 1 : n);
  }

  function gradeIndex(code) {
    return GRADE_CODES.indexOf(String(code || '').toUpperCase());
  }

  /** Same contract as shell.js normalizeGeneIds: trim, drop junk, dedupe. */
  function normalizeGeneIds(list) {
    if (!Array.isArray(list)) return [];
    var out = [], seen = Object.create(null);
    list.forEach(function (id) {
      if (typeof id !== 'string') return;
      var key = id.trim();
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push(key);
    });
    return out;
  }

  /**
   * Same default as shell.js `_histRuntime()`: a record that predates the
   * runtime stamp is question-shaped, because that is all that existed.
   */
  function runtimeOf(rec) {
    return rec.activityRuntime ||
      (rec.context && rec.context.activityRuntime) ||
      'puzzle';
  }

  // ── gene labels ─────────────────────────────────────────────

  /**
   * Derive a readable label from the id alone: RG.LOGIC.COMPARISON.BASIC →
   * "Logic · Comparison · Basic". Used when the registry has no entry, so a
   * brand-new gene shows up on the chart the day it is first reported instead
   * of waiting for someone to write metadata. Deliberately language-neutral:
   * inventing a Chinese name for an unknown gene would be worse than showing
   * the id it actually came from.
   */
  function deriveLabel(geneId) {
    var parts = String(geneId || '').split('.');
    if (parts[0] === 'RG') parts.shift();
    parts = parts.filter(function (p) { return p !== ''; });   // 'RG.A.B.' → A, B
    if (!parts.length) return String(geneId || '?');
    return parts.map(function (p) {
      return p.replace(/_/g, ' ').toLowerCase()
        .replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); });
    }).join(' · ');
  }

  /**
   * labels: { 'RG.X.Y.Z': { zh: '…', en: '…', short: {…}, category: '…' } }
   * `short` is what the radar draws (axis labels must stay short); the long
   * form is for tables and tooltips. Missing pieces fall back, never throw.
   */
  function geneLabel(geneId, lang, labels, wantShort) {
    var entry = labels && labels[geneId];
    var derived = deriveLabel(geneId);
    if (!entry) return derived;
    if (wantShort && entry.short) {
      return entry.short[lang] || entry.short.zh || entry.short.en || derived;
    }
    return entry[lang] || entry.zh || entry.en || derived;
  }

  // ── scan ────────────────────────────────────────────────────

  function storeKeys(store) {
    // localStorage exposes length/key(i); a plain object injected by a test
    // does not, so support both.
    if (store && typeof store.key === 'function' && typeof store.length === 'number') {
      var out = [];
      for (var i = 0; i < store.length; i++) out.push(store.key(i));
      return out;
    }
    return store ? Object.keys(store) : [];
  }

  /**
   * Every `me:{gameId}:history:{ts}` key in the store, parsed. The gameId is
   * taken from the key rather than trusted from the record, so a record
   * written with a mismatched gameId is still attributed to where it lives.
   */
  function scan(store, skipped) {
    var records = [];
    storeKeys(store).forEach(function (key) {
      if (!key || key.indexOf(KEY_PREFIX) !== 0) return;
      var mark = key.indexOf(HISTORY_MARK);
      if (mark <= KEY_PREFIX.length - 1) return;
      var gameId = key.slice(KEY_PREFIX.length, mark);
      if (!gameId) return;
      var rec;
      try {
        rec = JSON.parse(store.getItem ? store.getItem(key) : store[key]);
      } catch (e) {
        skipped.unreadable++;
        return;
      }
      if (!rec || typeof rec !== 'object') { skipped.unreadable++; return; }
      rec.gameId = rec.gameId || gameId;
      rec._key = key;
      records.push(rec);
    });
    records.sort(function (a, b) { return num(a.ts, 0) - num(b.ts, 0); });
    return records;
  }

  function readProfileId(store) {
    try {
      var raw = store.getItem ? store.getItem(KEY_PREFIX + 'sys:profile')
                              : store[KEY_PREFIX + 'sys:profile'];
      var p = raw ? JSON.parse(raw) : null;
      return (p && p.id) || null;
    } catch (e) {
      return null;
    }
  }

  // ── accumulators ────────────────────────────────────────────

  function newRuntimeBucket() {
    // score/total are summed ONLY inside one runtime, where the unit is
    // constant (questions, or rounds). ratioSum is the cross-runtime-safe one.
    return { sessions: 0, score: 0, total: 0, ratioSum: 0 };
  }

  function newCell(geneId, gradeCode) {
    return {
      geneId: geneId, gradeCode: gradeCode,
      sessions: 0, ratioSum: 0, accuracy: null,
      byRuntime: Object.create(null), lastTs: 0
    };
  }

  function addSample(bucket, rec, ratio, runtime) {
    bucket.sessions++;
    bucket.ratioSum += ratio;
    if (num(rec.ts, 0) > bucket.lastTs) bucket.lastTs = num(rec.ts, 0);
    var rb = bucket.byRuntime[runtime] || (bucket.byRuntime[runtime] = newRuntimeBucket());
    rb.sessions++;
    rb.score += num(rec.score, 0);
    rb.total += num(rec.total, 0);
    rb.ratioSum += ratio;
  }

  function finishRuntimes(byRuntime) {
    Object.keys(byRuntime).forEach(function (rt) {
      var rb = byRuntime[rt];
      // Two accuracies on purpose. `accuracy` is the ratio mean, comparable
      // with every other runtime. `rawAccuracy` is score/total in this
      // runtime's own unit — only meaningful inside this bucket.
      rb.accuracy = rb.sessions ? rb.ratioSum / rb.sessions : null;
      rb.rawAccuracy = rb.total ? rb.score / rb.total : null;
    });
  }

  /**
   * Progress = did the second half of the play go better than the first?
   * Split by record order, not by wall-clock date: a child who plays twice a
   * month would otherwise never accumulate a comparable window.
   */
  function trendOf(samples, minRecords) {
    if (!samples || samples.length < minRecords) return null;
    var sorted = samples.slice().sort(function (a, b) { return a.ts - b.ts; });
    var cut = Math.floor(sorted.length / 2);
    var mean = function (arr) {
      if (!arr.length) return null;
      var s = 0;
      arr.forEach(function (x) { s += x.ratio; });
      return s / arr.length;
    };
    var older = mean(sorted.slice(0, cut));
    var newer = mean(sorted.slice(cut));
    if (older === null || newer === null) return null;
    return {
      older: older, newer: newer, delta: newer - older,
      olderCount: cut, newerCount: sorted.length - cut
    };
  }

  // ── read ────────────────────────────────────────────────────

  /**
   * opts:
   *   store            Storage-like (default: localStorage)
   *   records          pre-loaded record array (skips the scan; for tests)
   *   profileId        which profile to read (default: me:sys:profile)
   *   geneLabels       id → { zh, en, short, category } from the registry
   *   masteryAccuracy  ratio bar for "mastered"  (default 0.7)
   *   masterySessions  session bar for the same  (default 2)
   *   trendMinRecords  records needed for a trend (default 4)
   */
  function read(opts) {
    opts = opts || {};
    var store = opts.store || (global.localStorage || null);
    var labels = opts.geneLabels || null;
    var lang = opts.lang || 'zh';
    var cfg = {
      masteryAccuracy: num(opts.masteryAccuracy, DEFAULT_MASTERY_ACCURACY),
      masterySessions: num(opts.masterySessions, DEFAULT_MASTERY_SESSIONS),
      trendMinRecords: num(opts.trendMinRecords, DEFAULT_TREND_MIN)
    };

    var skipped = {
      unreadable: 0,     // key existed, JSON did not parse
      notARecord: 0,     // parsed to something that is not an object
      noTotal: 0,        // no usable denominator → no ratio can be formed
      noGene: 0,         // nothing to put on axis 1
      otherProfile: 0    // belongs to a different profile on this device
    };

    var records = Array.isArray(opts.records)
      ? opts.records
      : (store ? scan(store, skipped) : []);
    var profileId = opts.profileId !== undefined
      ? opts.profileId
      : (store ? readProfileId(store) : null);

    var geneMap = Object.create(null);
    var cells = Object.create(null);
    var byRuntimeAll = Object.create(null);
    var byGradeAll = Object.create(null);
    var allSamples = [];
    var games = Object.create(null);
    var used = 0, legacyNoProfile = 0, noGradeTotal = 0, lastTs = 0;

    records.forEach(function (rec) {
      if (!rec || typeof rec !== 'object') { skipped.notARecord++; return; }
      if (profileId && rec.profileId && rec.profileId !== profileId) {
        skipped.otherProfile++;
        return;
      }
      // Records written before profileId existed have none. On a device-local
      // store they can only belong to whoever is using the device, so they are
      // kept — but counted, so the page can say so.
      if (!rec.profileId) legacyNoProfile++;

      var total = num(rec.total, 0);
      if (total <= 0) { skipped.noTotal++; return; }
      var ids = normalizeGeneIds(rec.geneIds);
      if (!ids.length) { skipped.noGene++; return; }

      // A missing score counts as 0, not as "unknown": report() always writes
      // one, so absence means the activity scored nothing.
      var ratio = clamp01(num(rec.score, 0) / total);
      var runtime = runtimeOf(rec);
      var code = gradeIndex(rec.gradeCode) >= 0
        ? String(rec.gradeCode).toUpperCase()
        : null;

      used++;
      if (num(rec.ts, 0) > lastTs) lastTs = num(rec.ts, 0);
      if (rec.gameId) games[rec.gameId] = (games[rec.gameId] || 0) + 1;
      allSamples.push({ ts: num(rec.ts, 0), ratio: ratio });

      var rtAll = byRuntimeAll[runtime] || (byRuntimeAll[runtime] = newRuntimeBucket());
      rtAll.sessions++;
      rtAll.score += num(rec.score, 0);
      rtAll.total += total;
      rtAll.ratioSum += ratio;

      if (code) byGradeAll[code] = (byGradeAll[code] || 0) + 1;
      else noGradeTotal++;

      ids.forEach(function (geneId) {
        var gene = geneMap[geneId];
        if (!gene) {
          gene = geneMap[geneId] = {
            geneId: geneId,
            sessions: 0, ratioSum: 0, accuracy: null,
            byRuntime: Object.create(null),
            byGrade: Object.create(null),
            noGrade: 0, lastTs: 0,
            modules: Object.create(null),
            games: Object.create(null),
            samples: []
          };
        }
        addSample(gene, rec, ratio, runtime);
        gene.samples.push({ ts: num(rec.ts, 0), ratio: ratio });
        if (rec.moduleId) gene.modules[rec.moduleId] = true;
        if (rec.gameId) gene.games[rec.gameId] = true;

        if (!code) { gene.noGrade++; return; }
        var cellKey = geneId + '|' + code;
        var cell = cells[cellKey] || (cells[cellKey] = newCell(geneId, code));
        addSample(cell, rec, ratio, runtime);
        gene.byGrade[code] = cell;
      });
    });

    var genes = Object.keys(geneMap).map(function (geneId) {
      var gene = geneMap[geneId];
      gene.accuracy = gene.sessions ? gene.ratioSum / gene.sessions : null;
      finishRuntimes(gene.byRuntime);

      var reachedIndex = -1, masteredIndex = -1, softIndex = -1;
      GRADE_CODES.forEach(function (code, i) {
        var cell = gene.byGrade[code];
        if (!cell || !cell.sessions) return;
        cell.accuracy = cell.ratioSum / cell.sessions;
        finishRuntimes(cell.byRuntime);
        reachedIndex = i;
        // Per cell, so mastery does not have to be monotonic: a child can be
        // solid at K1 and G1 while K2 is still shaky, and that K2 is exactly
        // what a recommendation must not paper over.
        cell.mastered = cell.sessions >= cfg.masterySessions &&
                        cell.accuracy >= cfg.masteryAccuracy;
        if (cell.mastered) masteredIndex = i;
        else if (softIndex < 0) softIndex = i;      // shallowest played-but-soft
      });

      gene.reachedIndex   = reachedIndex;
      gene.reachedCode    = reachedIndex >= 0 ? GRADE_CODES[reachedIndex] : null;
      gene.masteredIndex  = masteredIndex;
      gene.masteredCode   = masteredIndex >= 0 ? GRADE_CODES[masteredIndex] : null;
      // 0..1 fractions so a chart can use them directly. reachedIndex 0 (K1)
      // is 1/8, not 0: having played K1 at all is progress worth drawing.
      gene.coverage = (reachedIndex + 1) / GRADE_CODES.length;
      gene.mastery  = (masteredIndex + 1) / GRADE_CODES.length;
      // Where the next session pays off best: the SHALLOWEST grade already
      // played but not yet solid. Only if every played grade is solid does the
      // frontier move outward, to the next grade after the deepest reached.
      // Deliberately never a grade below one already played — a child who
      // scored 100% at G2 must not be sent back to a K1 they never touched,
      // which is what "first grade in the reached↔mastered gap" would do.
      // null means there is nothing to recommend: either the gene is solid all
      // the way to G6, or no record of it carried a grade at all.
      gene.frontierCode = softIndex >= 0
        ? GRADE_CODES[softIndex]
        : (reachedIndex >= 0 && reachedIndex + 1 < GRADE_CODES.length
            ? GRADE_CODES[reachedIndex + 1]
            : null);
      gene.trend    = trendOf(gene.samples, cfg.trendMinRecords);
      gene.moduleIds = Object.keys(gene.modules);
      gene.gameIds   = Object.keys(gene.games);
      gene.label      = geneLabel(geneId, lang, labels, false);
      gene.labelShort = geneLabel(geneId, lang, labels, true);
      gene.known      = !!(labels && labels[geneId]);
      delete gene.modules;
      delete gene.games;
      return gene;
    }).sort(function (a, b) {
      // Stable across reads (so axes do not swap places between visits) and
      // independent of how much has been played.
      return a.geneId < b.geneId ? -1 : (a.geneId > b.geneId ? 1 : 0);
    });

    finishRuntimes(byRuntimeAll);

    return {
      profileId: profileId,
      grades: GRADE_CODES.slice(),
      genes: genes,
      cells: cells,
      trend: trendOf(allSamples, cfg.trendMinRecords),
      config: cfg,
      totals: {
        records: records.length,
        used: used,
        genes: genes.length,
        games: games,
        gameCount: Object.keys(games).length,
        byRuntime: byRuntimeAll,
        byGrade: byGradeAll,
        noGrade: noGradeTotal,
        legacyNoProfile: legacyNoProfile,
        lastTs: lastTs
      },
      skipped: skipped
    };
  }

  // Fail loudly if axis 2 drifts from the shell's definition.
  if (global.shell && global.shell.grade && global.shell.grade.CODES &&
      global.shell.grade.CODES.join(',') !== GRADE_CODES.join(',')) {
    console.warn('[radar-reader] GRADE_CODES drifted from shell.grade.CODES');
  }

  return {
    version: '1.0.0',
    GRADE_CODES: GRADE_CODES.slice(),
    read: read,
    scan: scan,
    geneLabel: geneLabel,
    deriveLabel: deriveLabel,
    normalizeGeneIds: normalizeGeneIds,
    runtimeOf: runtimeOf,
    gradeIndex: gradeIndex
  };
})(typeof window !== 'undefined' ? window : this);
