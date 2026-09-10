'use strict';

/**
 * Difference Scout — content VOCABULARY (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * This file used to hold 8 finished questions across 2 units. It no longer holds
 * questions at all: `generator.js` builds every session from the vocabulary
 * below, because MindSeeds' premise is repeatable practice
 * (MINDSEVO-ARCHITECTURE-ROADMAP.md §2.2) and a fixed bank of 8 is memorised in
 * two sittings.
 *
 * Three things live here, and the split matters:
 *
 *   FAMILIES     six disjoint icon sets. Disjoint is load-bearing: a
 *                `cross-family` mismatch is defined as "the replacement comes
 *                from another family", so overlapping sets would silently make
 *                K1's easiest difficulty unreachable.
 *
 *   nearPairs    per family, the pairs that genuinely look alike. DECLARED, not
 *                inferred — this is what makes the `distractor_similarity:
 *                'near-pair'` axis value a fact the audit page can check, rather
 *                than a random draw that happens to look subtle. Anything not
 *                listed is treated as clearly distinguishable even when it is
 *                arguably close (🍓/🍒, 🐳/🐬): the contract is the list.
 *
 *   GRADE_CONFIG one row per gradeCode. Every row differs from the one above it
 *                on at least one axis declared in
 *                metadata/mindseeds/difference-scout.json, which is what earns
 *                this game a position on the radar's depth axis at all. See
 *                shell.js §"Canonical Level Vocabulary" and
 *                games/spatial-pattern-hunter/game.js — a MindSeeds game must
 *                not assert a gradeCode its content does not support.
 *
 * Each family needs at least GRADE_CONFIG.G2.length + 1 icons: the generator
 * reserves a near-pair partner OUT of the strip so the answer is not given away
 * by the same icon appearing twice.
 */

var DS_DATA = {

  families: [
    {
      id: 'fruit',
      nameZh: '水果', nameEn: 'Fruit',
      icons: ['🍎', '🍏', '🍊', '🍋', '🍐', '🍑', '🍓', '🍇', '🍒', '🍌'],
      nearPairs: [['🍎', '🍏'], ['🍊', '🍋'], ['🍐', '🍑']],
      hintZh: '先看颜色，再看形状。',
      hintEn: 'Check color first, then shape.'
    },
    {
      id: 'animals',
      nameZh: '动物', nameEn: 'Animals',
      icons: ['🐶', '🦊', '🐱', '🐯', '🐻', '🐼', '🐰', '🐨', '🐮', '🐷'],
      nearPairs: [['🐶', '🦊'], ['🐱', '🐯'], ['🐻', '🐼']],
      hintZh: '先看耳朵和脸型。',
      hintEn: 'Check ear shapes and face outlines first.'
    },
    {
      id: 'vehicles',
      nameZh: '车辆', nameEn: 'Vehicles',
      icons: ['🚗', '🚕', '🚙', '🚐', '🚌', '🚓', '🚑', '🚒', '🚚', '🚛'],
      nearPairs: [['🚗', '🚕'], ['🚙', '🚐'], ['🚚', '🚛']],
      hintZh: '先看车身轮廓和车顶。',
      hintEn: 'Check the body outline and the roof first.'
    },
    {
      id: 'sea',
      nameZh: '海洋', nameEn: 'Sea life',
      icons: ['🐟', '🐠', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐳', '🐬'],
      nearPairs: [['🐟', '🐠'], ['🐙', '🦑'], ['🦐', '🦞']],
      hintZh: '先看触手和鳍的形状。',
      hintEn: 'Check tentacle and fin shapes first.'
    },
    {
      id: 'books',
      nameZh: '本子', nameEn: 'Books',
      icons: ['📕', '📙', '📗', '📘', '📒', '📔', '📓', '📖', '📚', '📜'],
      nearPairs: [['📕', '📙'], ['📗', '📘'], ['📒', '📔']],
      hintZh: '先看封面颜色，再看本子形状。',
      hintEn: 'Check cover color first, then the notebook shape.'
    },
    {
      id: 'geometry',
      nameZh: '图形', nameEn: 'Shapes',
      icons: ['🔺', '🔻', '🔷', '🔶', '🟦', '🟪', '🟥', '🟧', '🟩', '🟨'],
      nearPairs: [['🔺', '🔻'], ['🔷', '🔶'], ['🟦', '🟪']],
      hintZh: '先看颜色，再看朝向。',
      hintEn: 'Check color first, then which way it points.'
    }
  ],

  /**
   * One row per gradeCode. `scanLoad` / `similarity` / `attributes` /
   * `optionSpan` are the four axis values the row claims; `length` and
   * `optionCount` are the mechanics that produce them, and the audit page
   * checks the two sides agree (e.g. optionSpan 'all-slots' ⇒ optionCount ===
   * length). `channels` is which mismatch channels may be drawn: a single-
   * attribute grade can only differ in identity, because there is no second
   * channel to differ in.
   */
  gradeConfig: {
    K1: {
      length: 4, optionCount: 4,
      scanLoad: 'short',    similarity: 'cross-family',
      attributes: 'single', optionSpan: 'all-slots',
      channels: ['identity']
    },
    K2: {
      length: 5, optionCount: 4,
      scanLoad: 'medium',   similarity: 'same-family',
      attributes: 'single', optionSpan: 'subset',
      channels: ['identity']
    },
    G1: {
      length: 6, optionCount: 4,
      scanLoad: 'long',     similarity: 'near-pair',
      attributes: 'single', optionSpan: 'subset',
      channels: ['identity']
    },
    G2: {
      length: 8, optionCount: 4,
      scanLoad: 'extended', similarity: 'near-pair',
      attributes: 'dual',   optionSpan: 'subset',
      channels: ['identity', 'size']
    }
  },

  /**
   * Cell sizes for the `dual` grades. Ordered, and a size mismatch always moves
   * exactly ONE step along this list — 's' next to 'l' would be a difference in
   * the identity channel's league, which would quietly make G2 easier than G1.
   */
  sizes: ['s', 'm', 'l'],

  /** Unit-card copy. One card per gradeCode; the shell adds the grade badge. */
  units: {
    K1: {
      icon: '🔍',
      nameZh: 'K1 · 一眼看出',   nameEn: 'K1 · Spot It',
      descZh: '4 格，多出来的那个明显不是同一类。',
      descEn: '4 slots — the odd one out clearly belongs to something else.'
    },
    K2: {
      icon: '🔎',
      nameZh: 'K2 · 同类对比',   nameEn: 'K2 · Same Family',
      descZh: '5 格，全是同一类，要一格一格比。',
      descEn: '5 slots, all from one family — compare them one by one.'
    },
    G1: {
      icon: '🕵️',
      nameZh: 'G1 · 找出相似',   nameEn: 'G1 · Near Twins',
      descZh: '6 格，有一对特别像，看细节。',
      descEn: '6 slots — two of them look almost the same. Watch the details.'
    },
    G2: {
      icon: '🧐',
      nameZh: 'G2 · 双重线索',   nameEn: 'G2 · Two Channels',
      descZh: '8 格，不同可能是图案，也可能是大小。',
      descEn: '8 slots — the difference may be the picture or the size.'
    }
  },

  /** Similarity → the leading half of the hint. The family supplies the rest. */
  similarityHints: {
    'cross-family': {
      zh: '有一格明显不是同一类，先扫一眼。',
      en: 'One slot clearly does not belong — one quick scan finds it.'
    },
    'same-family': {
      zh: '都是同一类，要一格一格对比。',
      en: 'They all come from one family, so compare slot by slot.'
    },
    'near-pair': {
      zh: '有一对特别像，注意细节。',
      en: 'Two of them look almost the same — watch the details.'
    }
  },

  /** Appended for `dual` grades only, where size is a live channel. */
  dualHint: {
    zh: '不同可能是大小，不只是图案。',
    en: 'The difference may be the size, not just the picture.'
  }
};
