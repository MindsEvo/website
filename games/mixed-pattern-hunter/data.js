'use strict';

/**
 * Mixed Pattern Hunter — content VOCABULARY (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Every item combines two of four dimensions (color, size, quantity, direction).
 * Each dimension follows its OWN rule; there are no cross-dimension rules.
 * generator.js builds every session; there is no static bank.
 *
 * Options are always a 2×2 diagnostic matrix: both right, only dim1 wrong,
 * only dim2 wrong, both wrong — so a wrong pick says WHICH dimension slipped.
 *
 * Each grade differs from the one above on at least one axis declared in
 * metadata/mindseeds/mixed-pattern.json:
 *   K1→K2  changing_dimensions (one→two), rule_relation (single→synced)
 *   K2→G1  rule_relation (synced→independent)
 *   G1→G2  rule_relation (independent→offset-period), blank_position (end→any)
 */

var MXP_DATA = {

  values: {
    color:     ['red', 'blue', 'yellow', 'green', 'purple', 'orange'],
    size:      ['s1', 's2', 's3', 's4', 's5'],
    quantity:  [1, 2, 3, 4, 5],
    // Clockwise order: a "progressive" direction rule is a quarter turn each step.
    direction: ['up', 'right', 'down', 'left']
  },

  // Dimensions that have a natural "keeps changing the same way" rule.
  progressive: ['size', 'quantity', 'direction'],

  names: {
    color:     { zh: '颜色', en: 'Color' },
    size:      { zh: '大小', en: 'Size' },
    quantity:  { zh: '数量', en: 'Quantity' },
    direction: { zh: '方向', en: 'Direction' },
    red: { zh: '红', en: 'red' }, blue: { zh: '蓝', en: 'blue' }, yellow: { zh: '黄', en: 'yellow' },
    green: { zh: '绿', en: 'green' }, purple: { zh: '紫', en: 'purple' }, orange: { zh: '橙', en: 'orange' },
    s1: { zh: '最小', en: 'tiny' }, s2: { zh: '小', en: 'small' }, s3: { zh: '中', en: 'medium' },
    s4: { zh: '大', en: 'big' }, s5: { zh: '最大', en: 'huge' },
    up: { zh: '上', en: 'up' }, right: { zh: '右', en: 'right' },
    down: { zh: '下', en: 'down' }, left: { zh: '左', en: 'left' }
  },

  gradeConfig: {
    K1: { rules: ['alternate', 'constant'],    length: 5, blank: 'end' },
    K2: { rules: ['alternate', 'alternate'],   length: 5, blank: 'end' },
    G1: { rules: ['alternate', 'progressive'], length: 5, blank: 'end' },
    G2: { rules: ['cycle3', 'alternate'],      length: 6, blank: 'any' }
  },

  units: {
    K1: {
      icon: '🔵',
      nameZh: 'K1 · 一个变一个不变', nameEn: 'K1 · One Changes',
      descZh: '一样东西在变，另一样一直不变。',
      descEn: 'One thing changes while the other stays the same.'
    },
    K2: {
      icon: '🔵🔺',
      nameZh: 'K2 · 两个一起变', nameEn: 'K2 · Both Take Turns',
      descZh: '两样东西都在轮流交替。',
      descEn: 'Both things take turns.'
    },
    G1: {
      icon: '🧩',
      nameZh: 'G1 · 各变各的', nameEn: 'G1 · Two Different Rules',
      descZh: '一样在交替，另一样一直变大、变多或转动。',
      descEn: 'One takes turns while the other keeps growing or turning.'
    },
    G2: {
      icon: '🎯',
      nameZh: 'G2 · 节奏不同', nameEn: 'G2 · Different Rhythms',
      descZh: '一样三个一轮，另一样两个一轮，空格可能在中间。',
      descEn: 'One repeats every 3, the other every 2; the gap may be in the middle.'
    }
  }
};
