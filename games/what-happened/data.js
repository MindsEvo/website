'use strict';

/**
 * What Happened? — contextual-scene memory vocabulary and grade configuration.
 *
 * A scene appears, disappears, then returns with one change. The child identifies
 * the actual change from memory rather than discovering a repeating pattern.
 */
var WH_DATA = {
  objects: [
    { id: 'dog', icon: '🐶', zh: '小狗', en: 'Dog' },
    { id: 'cat', icon: '🐱', zh: '小猫', en: 'Cat' },
    { id: 'rabbit', icon: '🐰', zh: '兔子', en: 'Rabbit' },
    { id: 'bear', icon: '🐻', zh: '小熊', en: 'Bear' },
    { id: 'apple', icon: '🍎', zh: '苹果', en: 'Apple' },
    { id: 'banana', icon: '🍌', zh: '香蕉', en: 'Banana' },
    { id: 'flower', icon: '🌸', zh: '花朵', en: 'Flower' },
    { id: 'tree', icon: '🌳', zh: '小树', en: 'Tree' },
    { id: 'car', icon: '🚗', zh: '汽车', en: 'Car' },
    { id: 'bike', icon: '🚲', zh: '自行车', en: 'Bicycle' },
    { id: 'ball', icon: '⚽', zh: '足球', en: 'Ball' },
    { id: 'book', icon: '📘', zh: '图书', en: 'Book' }
  ],

  gradeConfig: {
    K1: {
      slotCount: 4,
      objectCount: 3,
      exposureMs: 3600,
      retentionMs: 250,
      changeTypes: ['missing'],
      optionCount: 3,
      processing: 'single_change'
    },
    K2: {
      slotCount: 5,
      objectCount: 4,
      exposureMs: 3200,
      retentionMs: 450,
      changeTypes: ['missing', 'added'],
      optionCount: 4,
      processing: 'single_change'
    },
    G1: {
      slotCount: 6,
      objectCount: 5,
      exposureMs: 2800,
      retentionMs: 750,
      changeTypes: ['missing', 'added', 'moved'],
      optionCount: 4,
      processing: 'relation_change'
    },
    G2: {
      slotCount: 6,
      objectCount: 5,
      exposureMs: 2500,
      retentionMs: 1000,
      changeTypes: ['moved', 'replaced'],
      optionCount: 4,
      processing: 'context_update'
    }
  },

  units: {
    K1: {
      icon: '👀',
      nameZh: 'K1 · 谁不见了',
      nameEn: 'K1 · Who Is Missing?',
      descZh: '看清小场景，回来后找出不见的对象。',
      descEn: 'Study the small scene, then identify the missing object.'
    },
    K2: {
      icon: '🖼️',
      nameZh: 'K2 · 场景变了',
      nameEn: 'K2 · Scene Change',
      descZh: '记住四个对象，判断少了什么或多了什么。',
      descEn: 'Remember four objects and decide what disappeared or appeared.'
    },
    G1: {
      icon: '🔎',
      nameZh: 'G1 · 位置变化',
      nameEn: 'G1 · Location Change',
      descZh: '保持更完整的场景，识别对象或位置变化。',
      descEn: 'Retain a fuller scene and identify an object or location change.'
    },
    G2: {
      icon: '🕵️',
      nameZh: 'G2 · 情境更新',
      nameEn: 'G2 · Context Update',
      descZh: '在更长延迟后判断对象移动或替换。',
      descEn: 'After a longer delay, identify an object move or replacement.'
    }
  }
};
