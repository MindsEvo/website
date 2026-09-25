'use strict';

/**
 * Visual Pattern Hunter — content VOCABULARY (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * generator.js builds every session from gradeConfig; there is no static bank.
 *
 * Each row differs from the one above on at least one axis declared in
 * metadata/mindseeds/visual-pattern.json:
 *   K1→K2  unit_length (two→three), option_count (three→four)
 *   K2→G1  change_type (shape→rotation), unit_length (three→four)
 *   G1→G2  unit_length (four→eight, 45° steps), blank_position (end→any)
 */

var VPH_DATA = {

  shapes: ['circle', 'square', 'triangle', 'star', 'diamond'],

  gradeConfig: {
    K1: { change: 'shape',    shapes: ['AB'],               length: 6, optionCount: 3, blank: 'end' },
    K2: { change: 'shape',    shapes: ['AAB', 'ABB', 'ABC'], length: 7, optionCount: 4, blank: 'end' },
    G1: { change: 'rotation', step: 90,                     length: 6, optionCount: 4, blank: 'end' },
    G2: { change: 'rotation', step: 45,                     length: 7, optionCount: 4, blank: 'any' }
  },

  units: {
    K1: {
      icon: '🔵',
      nameZh: 'K1 · 形状交替', nameEn: 'K1 · Shape Turns',
      descZh: '两种形状轮流出现。',
      descEn: 'Two shapes take turns.'
    },
    K2: {
      icon: '🔺',
      nameZh: 'K2 · 三拍形状', nameEn: 'K2 · Three-Beat Shapes',
      descZh: '每 3 个形状重复一次。',
      descEn: 'Every 3 shapes repeat.'
    },
    G1: {
      icon: '🔄',
      nameZh: 'G1 · 箭头转一格', nameEn: 'G1 · Quarter Turns',
      descZh: '箭头每次转 90 度，下一个朝哪？',
      descEn: 'The arrow turns 90° each time — where does it point next?'
    },
    G2: {
      icon: '🧭',
      nameZh: 'G2 · 箭头转半格', nameEn: 'G2 · Eighth Turns',
      descZh: '每次只转 45 度，空格可能在中间。',
      descEn: 'Only 45° each time, and the gap may be in the middle.'
    }
  }
};
