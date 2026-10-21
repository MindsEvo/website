'use strict';

/**
 * Flash Cards — content VOCABULARY (MindSeeds, Memory Guardian)
 * ─────────────────────────────────────────────────────────────────────────────
 * A handful of emoji cards flash briefly, then hide. The child picks which one
 * they saw. generator.js draws itemCount cards from one category per question;
 * distractors come from either a different category (easy, similarity: low)
 * or the same category (hard, similarity: high).
 */

var FC_DATA = {

  gradeConfig: {
    K1: { itemCount: 2, exposureMs: 3000, optionCount: 3, similarity: 'low' },
    K2: { itemCount: 3, exposureMs: 2500, optionCount: 3, similarity: 'low' },
    G1: { itemCount: 4, exposureMs: 2000, optionCount: 4, similarity: 'mixed' },
    G2: { itemCount: 5, exposureMs: 1600, optionCount: 4, similarity: 'high' }
  },

  categories: {
    animals:  ['🐶', '🐱', '🐰', '🐻', '🐼', '🦁', '🐸', '🐵', '🐷', '🐮'],
    fruits:   ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🍑', '🍍', '🥝', '🍒'],
    vehicles: ['🚗', '🚕', '🚌', '🚓', '🚑', '🚒', '🚲', '✈️', '🚀', '⛵'],
    shapes:   ['🔺', '🔵', '⬛', '⭐', '❤️', '🔶', '🟣', '🟢', '⬜', '🔷']
  },

  units: {
    K1: {
      icon: '🃏',
      nameZh: 'K1 · 记住一张', nameEn: 'K1 · Remember One',
      descZh: '两张卡片，闪一下，说出你看到的那张。',
      descEn: 'Two cards flash — name the one you saw.'
    },
    K2: {
      icon: '🎴',
      nameZh: 'K2 · 记住三张', nameEn: 'K2 · Remember Three',
      descZh: '三张卡片，闪一下，找出看到的那张。',
      descEn: 'Three cards flash — find the one you saw.'
    },
    G1: {
      icon: '🧠',
      nameZh: 'G1 · 更快闪现', nameEn: 'G1 · Faster Flash',
      descZh: '四张卡片，展示时间更短了。',
      descEn: 'Four cards, shown for less time.'
    },
    G2: {
      icon: '⚡',
      nameZh: 'G2 · 相似干扰', nameEn: 'G2 · Similar Lookalikes',
      descZh: '五张卡片，选项都来自同一类，更容易混淆。',
      descEn: 'Five cards, with lookalike options from the same category.'
    }
  }
};
