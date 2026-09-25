'use strict';

/**
 * Number Pattern Hunter — content VOCABULARY (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Arithmetic sequences with a constant step. generator.js builds every session
 * from gradeConfig; there is no static bank.
 *
 * The old bank (×2/×3/×5 growth to 1250, growing gaps, Fibonacci) sat above G2
 * and is not carried into K1-G2; it is the natural material for G3+.
 *
 * Each row differs from the one above on at least one axis declared in
 * metadata/mindseeds/number-pattern.json:
 *   K1→K2  step_type (count-on→count-both), number_range, blank_position, option_count
 *   K2→G1  step_type (count-both→skip-count), number_range
 *   G1→G2  step_type (skip-count→any-step)
 */

var NPH_DATA = {

  gradeConfig: {
    K1: { steps: [1],                       dirs: [1],     max: 10,  length: 5, optionCount: 3, blank: 'end' },
    K2: { steps: [1],                       dirs: [1, -1], max: 20,  length: 5, optionCount: 4, blank: 'any' },
    G1: { steps: [2, 5, 10],                dirs: [1, -1], max: 100, length: 5, optionCount: 4, blank: 'any' },
    G2: { steps: [3, 4, 6, 7, 8, 9],        dirs: [1, -1], max: 100, length: 5, optionCount: 4, blank: 'any' }
  },

  units: {
    K1: {
      icon: '1️⃣',
      nameZh: 'K1 · 往后数', nameEn: 'K1 · Count On',
      descZh: '10 以内，一个一个往后数。',
      descEn: 'Within 10, counting on by one.'
    },
    K2: {
      icon: '🔢',
      nameZh: 'K2 · 往前往后数', nameEn: 'K2 · Count Both Ways',
      descZh: '20 以内，可能往后数也可能倒着数。',
      descEn: 'Within 20, counting on or counting back.'
    },
    G1: {
      icon: '🦘',
      nameZh: 'G1 · 跳着数', nameEn: 'G1 · Skip Counting',
      descZh: '2 个、5 个、10 个地跳着数。',
      descEn: 'Skip count by 2s, 5s or 10s.'
    },
    G2: {
      icon: '➕',
      nameZh: 'G2 · 找出步长', nameEn: 'G2 · Find the Step',
      descZh: '每次加或减同一个数，先算出是几。',
      descEn: 'The same number is added or taken away each time — find it first.'
    }
  }
};
