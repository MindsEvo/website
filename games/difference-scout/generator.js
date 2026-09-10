'use strict';

/**
 * Difference Scout — session GENERATOR (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Builds every question the game shows, from the vocabulary in data.js. There is
 * no static bank: MindSeeds is meant to be replayed, so a fixed set of items is
 * a bug, not content.
 *
 * One item is a pair of strips that are identical except at exactly one slot.
 * What varies by grade is HOW hard that one slot is to find, and the generator
 * only ever produces the combination its grade row declares — so the axis values
 * reported to the radar describe what the child actually met.
 *
 * Two mismatch channels, and the difference between them is the point of G2:
 *
 *   identity  the right strip swaps the icon at that slot. Which icon it swaps
 *             in is what `distractor_similarity` controls: another family's icon
 *             (obvious), another member of the same family (moderate), or the
 *             icon's DECLARED near-pair partner (subtle).
 *
 *   size      the right strip keeps the icon and changes its size by one step.
 *             Only `dual` grades draw this. The strip is then built to contain a
 *             declared near-pair on the identity channel as well — so the child
 *             is pulled towards the look-alike pair while the real difference is
 *             a size step somewhere else. Without that the item would not earn
 *             its `near-pair` similarity value.
 *
 * Determinism: pass a `seed` and the same draw comes back. test.html relies on
 * it; the game does not pass one.
 */

var DS_GEN = (function () {

  /**
   * Seeded LCG (Numerical Recipes constants), or Math.random when no seed is
   * given. Deliberately tiny — the audit page needs reproducibility, not
   * statistical pedigree, and it separately checks the output distribution.
   */
  function rngFor(seed) {
    if (seed === undefined || seed === null) { return Math.random; }
    var s = (Number(seed) >>> 0) || 1;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function pick(list, rnd) { return list[Math.floor(rnd() * list.length)]; }

  /** Fisher-Yates on a copy. */
  function shuffled(list, rnd) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /** `n` distinct members of `pool`, order randomised. */
  function sample(pool, n, rnd) { return shuffled(pool, rnd).slice(0, n); }

  function without(pool, excluded) {
    return pool.filter(function (x) { return excluded.indexOf(x) < 0; });
  }

  function familyById(id) {
    return DS_DATA.families.filter(function (f) { return f.id === id; })[0] || null;
  }

  /** True when `a` and `b` are a DECLARED near-pair of `family`, either order. */
  function isNearPair(family, a, b) {
    return (family.nearPairs || []).some(function (p) {
      return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a);
    });
  }

  /** Every icon that `icon` is declared near to, inside its own family. */
  function nearPartnersOf(family, icon) {
    var out = [];
    (family.nearPairs || []).forEach(function (p) {
      if (p[0] === icon) { out.push(p[1]); }
      if (p[1] === icon) { out.push(p[0]); }
    });
    return out;
  }

  /** One step along DS_DATA.sizes, in a randomly chosen legal direction. */
  function stepSize(size, rnd) {
    var order = DS_DATA.sizes;
    var i = order.indexOf(size);
    var moves = [];
    if (i > 0) { moves.push(i - 1); }
    if (i < order.length - 1) { moves.push(i + 1); }
    return order[pick(moves, rnd)];
  }

  function cell(icon, size) { return { icon: icon, size: size }; }

  function cloneStrip(strip) {
    return strip.map(function (c) { return cell(c.icon, c.size); });
  }

  function sameCell(a, b) { return a.icon === b.icon && a.size === b.size; }

  /**
   * The slots offered as options. The answer is always included, the rest are
   * drawn evenly from the remaining slots, and the result is sorted ASCENDING —
   * these are position numbers, so presenting them out of order would test
   * reading order rather than observation. Because the answer slot itself is
   * drawn uniformly, sorting does not create a positional shortcut; test.html
   * checks both distributions.
   */
  function buildOptions(answer, length, optionCount, rnd) {
    if (optionCount >= length) {
      var all = [];
      for (var i = 1; i <= length; i++) { all.push(i); }
      return all;
    }
    var others = [];
    for (var j = 1; j <= length; j++) { if (j !== answer) { others.push(j); } }
    var decoys = sample(others, optionCount - 1, rnd);
    return decoys.concat([answer]).sort(function (a, b) { return a - b; });
  }

  function hintFor(family, cfg) {
    var lead = DS_DATA.similarityHints[cfg.similarity] || { zh: '', en: '' };
    var zh = lead.zh + family.hintZh;
    var en = lead.en + ' ' + family.hintEn;
    if (cfg.attributes === 'dual') {
      zh += DS_DATA.dualHint.zh;
      en += ' ' + DS_DATA.dualHint.en;
    }
    return { zh: zh, en: en };
  }

  /**
   * Build one item for `gradeCode`.
   *
   * `avoidFamilyId` keeps two consecutive items off the same icon set, so a run
   * of 8 does not feel like one long fruit salad. It is a preference, not a
   * constraint: with 6 families there is always an alternative.
   */
  function buildQuestion(gradeCode, rnd, avoidFamilyId) {
    var cfg = DS_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }

    var choices = DS_DATA.families.filter(function (f) { return f.id !== avoidFamilyId; });
    var family  = pick(choices.length ? choices : DS_DATA.families, rnd);
    var channel = pick(cfg.channels, rnd);
    var len     = cfg.length;

    var icons, answerIdx, replacement = null, pairUsed = null;

    if (cfg.similarity === 'near-pair' && channel === 'identity') {
      // The mismatch IS the partner, so the partner must stay out of the left
      // strip: seeing it twice in the right strip would give the slot away.
      pairUsed = shuffled(pick(family.nearPairs, rnd), rnd);
      var anchor = pairUsed[0];
      replacement = pairUsed[1];
      var rest = sample(without(family.icons, [anchor, replacement]), len - 1, rnd);
      answerIdx = Math.floor(rnd() * len);
      icons = rest.slice(0, answerIdx).concat([anchor], rest.slice(answerIdx));

    } else if (cfg.similarity === 'near-pair' && channel === 'size') {
      // Both members of the pair are IN the strip: they are the identity-channel
      // decoy. The real difference is a size step on one of them.
      pairUsed = shuffled(pick(family.nearPairs, rnd), rnd);
      var filler = sample(without(family.icons, pairUsed), len - 2, rnd);
      icons = shuffled(filler.concat(pairUsed), rnd);
      answerIdx = icons.indexOf(pick(pairUsed, rnd));

    } else if (cfg.similarity === 'same-family') {
      icons = sample(family.icons, len, rnd);
      answerIdx = Math.floor(rnd() * len);
      var target = icons[answerIdx];
      // Same family, but explicitly NOT a declared look-alike — that is G1's
      // job, and letting it leak into K2 would erase the difference between the
      // two grades.
      var candidates = without(family.icons, icons.concat(nearPartnersOf(family, target)));
      replacement = pick(candidates, rnd);

    } else { // 'cross-family'
      icons = sample(family.icons, len, rnd);
      answerIdx = Math.floor(rnd() * len);
      var otherFam = pick(DS_DATA.families.filter(function (f) { return f.id !== family.id; }), rnd);
      replacement = pick(otherFam.icons, rnd);
    }

    var dual = cfg.attributes === 'dual';
    var left = icons.map(function (ic) {
      return cell(ic, dual ? pick(DS_DATA.sizes, rnd) : 'm');
    });
    var right = cloneStrip(left);
    if (channel === 'size') {
      right[answerIdx].size = stepSize(left[answerIdx].size, rnd);
    } else {
      right[answerIdx].icon = replacement;
    }

    var hint = hintFor(family, cfg);
    return {
      gradeCode:  gradeCode,
      familyId:   family.id,
      similarity: cfg.similarity,
      channel:    channel,
      left:       left,
      right:      right,
      answer:     answerIdx + 1,               // 1-based: it is a slot label
      options:    buildOptions(answerIdx + 1, len, cfg.optionCount, rnd),
      nearPair:   pairUsed,                    // null unless a pair was involved
      hintZh:     hint.zh,
      hintEn:     hint.en
    };
  }

  /** `count` items for one grade. Pass `seed` to reproduce the draw exactly. */
  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var out = [], last = null;
    for (var i = 0; i < count; i++) {
      var q = buildQuestion(gradeCode, rnd, last);
      if (!q) { return out; }
      out.push(q);
      last = q.familyId;
    }
    return out;
  }

  return {
    generate:       generate,
    buildQuestion:  buildQuestion,
    // Exposed for test.html: the audit has to re-derive "is this pair declared
    // near?" from the same source the generator used, not from a second copy.
    rngFor:         rngFor,
    isNearPair:     isNearPair,
    nearPartnersOf: nearPartnersOf,
    familyById:     familyById,
    sameCell:       sameCell
  };
}());
