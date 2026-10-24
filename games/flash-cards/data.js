'use strict';

/**
 * Flash Cards — content VOCABULARY (MindSeeds, Memory Guardian)
 * ─────────────────────────────────────────────────────────────────────────────
 * K1-K2 use visual recognition after cards disappear. G1-G2 mix recognition
 * with structured encoding and "Who's Missing?" recall inside the same family.
 */
var FC_DATA = {

  gradeConfig: {
    K1: {
      itemCount: 2, exposureMs: 3000, optionCount: 3,
      similarity: 'low', missingCount: 0
    },
    K2: {
      itemCount: 3, exposureMs: 2500, optionCount: 3,
      similarity: 'low', missingCount: 0
    },
    G1: {
      itemCount: 4, exposureMs: 2300, optionCount: 4,
      similarity: 'mixed', missingCount: 4,
      missingExposureMs: 2700, organization: 'category_groups'
    },
    G2: {
      itemCount: 6, exposureMs: 1900, optionCount: 4,
      similarity: 'high', missingCount: 4,
      missingExposureMs: 2500, organization: 'category_groups'
    }
  },

  categories: {
    animals:  ['🐶', '🐱', '🐰', '🐻', '🐼', '🦁', '🐸', '🐵', '🐷', '🐮'],
    fruits:   ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🍑', '🍍', '🥝', '🍒'],
    vehicles: ['🚗', '🚕', '🚌', '🚓', '🚑', '🚒', '🚲', '✈️', '🚀', '⛵'],
    shapes:   ['🔺', '🔵', '⬛', '⭐', '❤️', '🔶', '🟣', '🟢', '⬜', '🔷']
  },

  categoryLabels: {
    animals:  { zh: '动物', en: 'Animals' },
    fruits:   { zh: '水果', en: 'Fruit' },
    vehicles: { zh: '交通工具', en: 'Vehicles' },
    shapes:   { zh: '图形', en: 'Shapes' }
  },

  units: {
    K1: {
      icon: '🃏',
      nameZh: 'K1 · 记住一张', nameEn: 'K1 · Remember One',
      descZh: '两张卡片闪现后藏起来，找出刚才看到的卡片。',
      descEn: 'Two cards flash and hide — find one that was shown.'
    },
    K2: {
      icon: '🎴',
      nameZh: 'K2 · 记住三张', nameEn: 'K2 · Remember Three',
      descZh: '记住三张卡片，藏起来后再认出其中一张。',
      descEn: 'Remember three cards and recognize one after they hide.'
    },
    G1: {
      icon: '🧠',
      nameZh: 'G1 · 分类记忆', nameEn: 'G1 · Group and Remember',
      descZh: '有些题按类别分组展示；有些题要找出消失的卡片。',
      descEn: 'Some cards are grouped by category; some ask what disappeared.'
    },
    G2: {
      icon: '🔍',
      nameZh: 'G2 · 谁不见了', nameEn: 'G2 · Who Is Missing?',
      descZh: '同时记住两类卡片，再找出从原卡组中消失的那一张。',
      descEn: 'Remember two groups, then identify the card missing from the set.'
    }
  }
};
