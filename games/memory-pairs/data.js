'use strict';

/**
 * Memory Pairs+ — content and grade configuration
 *
 * Cards are previewed face up, then hidden. The child completes every pair
 * from memory. G2 announces one position swap after the preview, requiring
 * the hidden layout to be updated before matching.
 */
var MP_DATA = {
  items: [
    { id: 'dog', icon: '🐶', zh: '小狗', en: 'Dog' },
    { id: 'cat', icon: '🐱', zh: '小猫', en: 'Cat' },
    { id: 'rabbit', icon: '🐰', zh: '兔子', en: 'Rabbit' },
    { id: 'panda', icon: '🐼', zh: '熊猫', en: 'Panda' },
    { id: 'apple', icon: '🍎', zh: '苹果', en: 'Apple' },
    { id: 'banana', icon: '🍌', zh: '香蕉', en: 'Banana' },
    { id: 'grape', icon: '🍇', zh: '葡萄', en: 'Grape' },
    { id: 'strawberry', icon: '🍓', zh: '草莓', en: 'Strawberry' },
    { id: 'car', icon: '🚗', zh: '汽车', en: 'Car' },
    { id: 'bus', icon: '🚌', zh: '公交车', en: 'Bus' },
    { id: 'bike', icon: '🚲', zh: '自行车', en: 'Bicycle' },
    { id: 'rocket', icon: '🚀', zh: '火箭', en: 'Rocket' }
  ],

  gradeConfig: {
    K1: {
      pairCount: 2,
      columns: 2,
      exposureMs: 3600,
      retentionMs: 250,
      mode: 'match',
      similarity: 'low'
    },
    K2: {
      pairCount: 3,
      columns: 3,
      exposureMs: 3200,
      retentionMs: 450,
      mode: 'match',
      similarity: 'low'
    },
    G1: {
      pairCount: 4,
      columns: 4,
      exposureMs: 2700,
      retentionMs: 750,
      mode: 'match',
      similarity: 'high'
    },
    G2: {
      pairCount: 4,
      columns: 4,
      exposureMs: 2500,
      retentionMs: 900,
      mode: 'swap_update',
      similarity: 'high'
    }
  },

  units: {
    K1: {
      icon: '🧩',
      nameZh: 'K1 · 两对卡片',
      nameEn: 'K1 · Two Pairs',
      descZh: '先看清两对卡片，藏起来后找出全部配对。',
      descEn: 'Preview two pairs, then find every match after they hide.'
    },
    K2: {
      icon: '🎴',
      nameZh: 'K2 · 三对卡片',
      nameEn: 'K2 · Three Pairs',
      descZh: '记住三对卡片的位置，完成全部配对。',
      descEn: 'Remember the locations of three pairs and match them all.'
    },
    G1: {
      icon: '🧠',
      nameZh: 'G1 · 更多相似卡片',
      nameEn: 'G1 · More Similar Cards',
      descZh: '四对卡片展示更短，记住每张卡的位置。',
      descEn: 'Four pairs appear for less time; retain every card location.'
    },
    G2: {
      icon: '🔄',
      nameZh: 'G2 · 位置变化',
      nameEn: 'G2 · Position Update',
      descZh: '预览后两张卡交换位置，更新记忆再完成配对。',
      descEn: 'Two cards swap after the preview; update the hidden layout and match.'
    }
  }
};
