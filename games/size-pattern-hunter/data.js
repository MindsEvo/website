'use strict';

/**
 * Size Pattern Hunter — content VOCABULARY (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure geometric size perception: five discrete size bands s1 < … < s5, no
 * numbers or labels. generator.js builds every session from gradeConfig; there
 * is no static bank.
 *
 * Each row differs from the one above on at least one axis declared in
 * metadata/mindseeds/size-pattern.json:
 *   K1→K2  change_rule (alternate→monotonic), size_contrast (coarse→fine), option_count
 *   K2→G1  blank_position (end→any)
 *   G1→G2  change_rule (monotonic→cycle)
 */

var SPH_DATA = {

  sizes: ['s1', 's2', 's3', 's4', 's5'],

  gradeConfig: {
    K1: { rule: 'alternate', length: [5, 6], optionCount: 3, blank: 'end' },
    K2: { rule: 'monotonic', length: [4, 4], optionCount: 4, blank: 'end' },
    G1: { rule: 'monotonic', length: [5, 5], optionCount: 4, blank: 'any' },
    G2: { rule: 'cycle',     length: [8, 8], optionCount: 4, blank: 'any' }
  },

  units: {
    K1: {
      icon: '⚪',
      nameZh: 'K1 · 一大一小', nameEn: 'K1 · Big and Small',
      descZh: '大的和小的轮流出现。',
      descEn: 'Big and small take turns.'
    },
    K2: {
      icon: '📈',
      nameZh: 'K2 · 越来越大/小', nameEn: 'K2 · Growing or Shrinking',
      descZh: '每次变大一点或变小一点，下一个是多大？',
      descEn: 'A little bigger or smaller each time — what size is next?'
    },
    G1: {
      icon: '🔍',
      nameZh: 'G1 · 中间缺一个', nameEn: 'G1 · Missing in the Middle',
      descZh: '空格可能在中间，看前后两边。',
      descEn: 'The gap may be in the middle — check both sides.'
    },
    G2: {
      icon: '🌊',
      nameZh: 'G2 · 大小波浪', nameEn: 'G2 · Size Waves',
      descZh: '小→中→大→中，像波浪一样循环。',
      descEn: 'Small, medium, big, medium — repeating like a wave.'
    }
  }
};
