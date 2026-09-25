'use strict';

/**
 * Motion Pattern Hunter — content VOCABULARY (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * generator.js builds every session from gradeConfig; there is no static bank.
 *
 * Each row differs from the one above on at least one axis declared in
 * metadata/mindseeds/motion-pattern.json:
 *   K1→K2  motion_channel (direction→action), change_rule (alternate→three-beat), option_count
 *   K2→G1  motion_channel (action→position), change_rule (three-beat→fixed-step)
 *   G1→G2  change_rule (fixed-step→growing-step)
 */

var MPH_DATA = {

  dirs: {
    left:  '⬅️',
    right: '➡️',
    up:    '⬆️',
    down:  '⬇️'
  },

  acts: {
    jump:  { zh: '跳', en: 'Jump',  e: '🦘' },
    squat: { zh: '蹲', en: 'Squat', e: '🐸' },
    turn:  { zh: '转', en: 'Turn',  e: '🌀' },
    run:   { zh: '跑', en: 'Run',   e: '🏃' }
  },

  gradeConfig: {
    K1: { channel: 'direction', rule: 'alternate',    shapes: ['AB'],               length: [5, 6], optionCount: 3 },
    K2: { channel: 'action',    rule: 'three-beat',   shapes: ['AAB', 'ABB', 'ABC'], length: [7, 7], optionCount: 4 },
    G1: { channel: 'position',  rule: 'fixed-step',   steps: [2, 3], trackSize: 10, visible: [3, 3], optionCount: 4 },
    G2: { channel: 'position',  rule: 'growing-step', steps: [1],    trackSize: 12, visible: [4, 4], optionCount: 4 }
  },

  units: {
    K1: {
      icon: '⬅️',
      nameZh: 'K1 · 方向交替', nameEn: 'K1 · Two Directions',
      descZh: '两个方向轮流出现，下一步朝哪？',
      descEn: 'Two directions take turns — which way next?'
    },
    K2: {
      icon: '🤸',
      nameZh: 'K2 · 动作组合', nameEn: 'K2 · Action Combo',
      descZh: '三个动作一组重复，下一个动作是什么？',
      descEn: 'Three actions repeat as a set — what comes next?'
    },
    G1: {
      icon: '🦘',
      nameZh: 'G1 · 跳格子', nameEn: 'G1 · Hop Along',
      descZh: '每次跳同样多格，下一步落在哪？',
      descEn: 'Same number of cells each hop — where does it land next?'
    },
    G2: {
      icon: '🚀',
      nameZh: 'G2 · 越跳越远', nameEn: 'G2 · Longer Hops',
      descZh: '每一跳都比上一跳多一格。',
      descEn: 'Each hop is one cell longer than the last.'
    }
  }
};
