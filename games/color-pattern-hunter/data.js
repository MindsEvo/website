'use strict';

/**
 * Color Pattern Hunter — content VOCABULARY (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * No finished questions live here: generator.js builds every session from the
 * palette and gradeConfig below, because a fixed bank of ~20 items is memorised
 * in a few replays (MINDSEVO-ARCHITECTURE-ROADMAP.md §2.2).
 *
 * gradeConfig has one row per gradeCode, and every row differs from the one
 * above it on at least one axis declared in metadata/mindseeds/color-pattern.json:
 *   K1→K2  unit_length (2→3), option_count (three→four)
 *   K2→G1  unit_length (3→4), blank_position (end→any)
 *   G1→G2  element_type (single→pair)
 */

var CPH_DATA = {

  // Discrete, high-contrast hues. Six is the minimum G2 needs: two pairs of
  // four distinct colors plus off-pattern colors for the half-wrong distractor.
  palette: {
    red:    { hex: '#ef4444', zh: '红', en: 'red' },
    blue:   { hex: '#3b82f6', zh: '蓝', en: 'blue' },
    yellow: { hex: '#eab308', zh: '黄', en: 'yellow' },
    green:  { hex: '#22c55e', zh: '绿', en: 'green' },
    purple: { hex: '#a855f7', zh: '紫', en: 'purple' },
    orange: { hex: '#f97316', zh: '橙', en: 'orange' }
  },

  /**
   * `shapes` are the repeating-unit templates a grade may draw; letters are
   * slots filled with distinct colors (or distinct color pairs at G2).
   * `length` is how many elements the strip shows, blank included — always at
   * least two full repeats before the blank, so the unit is inferable.
   */
  gradeConfig: {
    K1: { shapes: ['AB'],                           length: [5, 6], optionCount: 3,
          blank: 'end', element: 'single' },
    K2: { shapes: ['AAB', 'ABB', 'ABC'],            length: [7, 8], optionCount: 4,
          blank: 'end', element: 'single' },
    G1: { shapes: ['AABB', 'ABCC', 'AABC', 'ABCD'], length: [8, 8], optionCount: 4,
          blank: 'any', element: 'single' },
    G2: { shapes: ['AAB', 'ABB'],                   length: [6, 6], optionCount: 4,
          blank: 'any', element: 'pair' }
  },

  units: {
    K1: {
      icon: '🔴',
      nameZh: 'K1 · 两色交替', nameEn: 'K1 · Two Colors',
      descZh: '两种颜色轮流出现，下一个是什么？',
      descEn: 'Two colors take turns — what comes next?'
    },
    K2: {
      icon: '🟡',
      nameZh: 'K2 · 三拍规律', nameEn: 'K2 · Three Beats',
      descZh: '每 3 个颜色重复一次，比如红红蓝。',
      descEn: 'Every 3 colors repeat, like red-red-blue.'
    },
    G1: {
      icon: '🔄',
      nameZh: 'G1 · 四拍与中间空', nameEn: 'G1 · Four Beats',
      descZh: '每 4 个颜色重复，空格可能在中间。',
      descEn: 'Every 4 colors repeat, and the gap may be in the middle.'
    },
    G2: {
      icon: '💛',
      nameZh: 'G2 · 颜色对', nameEn: 'G2 · Color Pairs',
      descZh: '把两个颜色看成一个整体，顺序不能颠倒。',
      descEn: 'Treat two colors as one unit — order matters.'
    }
  }
};
