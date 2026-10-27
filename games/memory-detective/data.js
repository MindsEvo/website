'use strict';

/**
 * Memory Detective — clue-memory vocabulary and grade configuration.
 *
 * The child observes clue cards that later disappear, then identifies the one
 * suspect whose visible attributes match the remembered clues. The solution
 * comes entirely from the presented clues, never from real-world knowledge.
 */
var MD_DATA = {
  suspects: [
    { id: 'red-cat', icon: '🐱', color: 'red', accessory: 'hat', zh: '红帽小猫', en: 'Red-hat Cat' },
    { id: 'blue-cat', icon: '🐱', color: 'blue', accessory: 'bag', zh: '蓝包小猫', en: 'Blue-bag Cat' },
    { id: 'red-dog', icon: '🐶', color: 'red', accessory: 'bag', zh: '红包小狗', en: 'Red-bag Dog' },
    { id: 'blue-dog', icon: '🐶', color: 'blue', accessory: 'hat', zh: '蓝帽小狗', en: 'Blue-hat Dog' },
    { id: 'yellow-rabbit', icon: '🐰', color: 'yellow', accessory: 'scarf', zh: '黄围巾兔子', en: 'Yellow-scarf Rabbit' },
    { id: 'green-rabbit', icon: '🐰', color: 'green', accessory: 'glasses', zh: '绿眼镜兔子', en: 'Green-glasses Rabbit' },
    { id: 'yellow-panda', icon: '🐼', color: 'yellow', accessory: 'glasses', zh: '黄眼镜熊猫', en: 'Yellow-glasses Panda' },
    { id: 'green-panda', icon: '🐼', color: 'green', accessory: 'scarf', zh: '绿围巾熊猫', en: 'Green-scarf Panda' }
  ],

  labels: {
    color: {
      red: { icon: '🔴', zh: '红色', en: 'red' },
      blue: { icon: '🔵', zh: '蓝色', en: 'blue' },
      yellow: { icon: '🟡', zh: '黄色', en: 'yellow' },
      green: { icon: '🟢', zh: '绿色', en: 'green' }
    },
    accessory: {
      hat: { icon: '🎩', zh: '戴帽子', en: 'wears a hat' },
      bag: { icon: '🎒', zh: '背书包', en: 'carries a bag' },
      scarf: { icon: '🧣', zh: '戴围巾', en: 'wears a scarf' },
      glasses: { icon: '👓', zh: '戴眼镜', en: 'wears glasses' }
    }
  },

  gradeConfig: {
    K1: {
      suspectCount: 3,
      clueAttributes: ['animal'],
      exposureMs: 2800,
      retentionMs: 250,
      mode: 'single_clue'
    },
    K2: {
      suspectCount: 4,
      clueAttributes: ['animal', 'color'],
      exposureMs: 3100,
      retentionMs: 450,
      mode: 'combined_clues'
    },
    G1: {
      suspectCount: 5,
      clueAttributes: ['animal', 'color', 'accessory'],
      exposureMs: 3300,
      retentionMs: 750,
      mode: 'multi_clue'
    },
    G2: {
      suspectCount: 5,
      clueAttributes: ['animal', 'color', 'accessory'],
      exposureMs: 3200,
      retentionMs: 950,
      mode: 'clue_update'
    }
  },

  units: {
    K1: {
      icon: '🔎',
      nameZh: 'K1 · 记住一个线索',
      nameEn: 'K1 · Remember One Clue',
      descZh: '线索藏起来后，从三个角色中找出对应的小动物。',
      descEn: 'After one clue hides, find the matching animal among three suspects.'
    },
    K2: {
      icon: '🕵️',
      nameZh: 'K2 · 合并两个线索',
      nameEn: 'K2 · Combine Two Clues',
      descZh: '同时记住动物和颜色，找出唯一符合者。',
      descEn: 'Remember the animal and color together, then find the unique match.'
    },
    G1: {
      icon: '🧠',
      nameZh: 'G1 · 多条记忆线索',
      nameEn: 'G1 · Multiple Memory Clues',
      descZh: '保持动物、颜色和随身物品三条线索。',
      descEn: 'Retain three clues about the animal, color and accessory.'
    },
    G2: {
      icon: '🔄',
      nameZh: 'G2 · 线索更新',
      nameEn: 'G2 · Clue Update',
      descZh: '原线索藏起来后会更新一条，按更新后的全部线索寻找。',
      descEn: 'One hidden clue changes; use the complete updated clue set to investigate.'
    }
  }
};
