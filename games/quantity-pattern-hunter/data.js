'use strict';

/**
 * Quantity Pattern Hunter — content VOCABULARY (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Concrete quantities only: counts are shown as objects, never as numerals.
 * generator.js builds every session from gradeConfig; there is no static bank.
 *
 * Each row differs from the one above on at least one axis declared in
 * metadata/mindseeds/quantity-pattern.json:
 *   K1→K2  change_rule (alternate→monotonic), step_size, count_range, option_count
 *   K2→G1  step_size (one→two), count_range, blank_position (end→any)
 *   G1→G2  change_rule (monotonic→cycle)
 */

var QPH_DATA = {

  assets: {
    apple:  { e: '🍎', zh: '苹果', en: 'apples' },
    fish:   { e: '🐟', zh: '小鱼', en: 'fish' },
    star:   { e: '⭐', zh: '星星', en: 'stars' },
    bird:   { e: '🐦', zh: '小鸟', en: 'birds' },
    flower: { e: '🌸', zh: '花朵', en: 'flowers' },
    ball:   { e: '⚽', zh: '皮球', en: 'balls' }
  },

  // `max` is the largest count shown anywhere in the item, options included.
  gradeConfig: {
    K1: { rule: 'alternate', step: 0, max: 3, length: [5, 6], optionCount: 3, blank: 'end' },
    K2: { rule: 'monotonic', step: 1, max: 5, length: [4, 4], optionCount: 4, blank: 'end' },
    G1: { rule: 'monotonic', step: 2, max: 9, length: [4, 5], optionCount: 4, blank: 'any' },
    G2: { rule: 'cycle',     step: 0, max: 6, length: [7, 7], optionCount: 4, blank: 'any' }
  },

  units: {
    K1: {
      icon: '🍎',
      nameZh: 'K1 · 多少交替', nameEn: 'K1 · More and Fewer',
      descZh: '多一点、少一点，轮流出现。',
      descEn: 'More, then fewer, taking turns.'
    },
    K2: {
      icon: '📈',
      nameZh: 'K2 · 一个一个变', nameEn: 'K2 · One at a Time',
      descZh: '每次多一个或少一个。',
      descEn: 'One more or one fewer each time.'
    },
    G1: {
      icon: '🐟',
      nameZh: 'G1 · 两个两个变', nameEn: 'G1 · Two at a Time',
      descZh: '每次多两个或少两个，空格可能在中间。',
      descEn: 'Two more or two fewer each time; the gap may be in the middle.'
    },
    G2: {
      icon: '🔄',
      nameZh: 'G2 · 数量循环', nameEn: 'G2 · Quantity Cycle',
      descZh: '三种数量按顺序循环出现。',
      descEn: 'Three amounts repeat in order.'
    }
  }
};
