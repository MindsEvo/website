'use strict';

/**
 * Energy Planner — Data
 * Task pool + per-grade config for MindSeeds · Strategy Master.
 * Metadata: /metadata/mindseeds/energy-planner.json
 * RootGene: RG.STRATEGY.RESOURCE.TRADEOFF
 */
var EP_DATA = {
  gradeConfig: {
    K1: { taskCount: 2, goalType: 'fit_only' },
    K2: { taskCount: 3, goalType: 'fit_only' },
    G1: { taskCount: 3, budgetRatio: 0.6,  goalType: 'maximize_reward' },
    G2: { taskCount: 4, budgetRatio: 0.55, goalType: 'maximize_reward' }
  },

  taskPool: [
    { icon: '🐶', cost: 2, reward: 3, nameZh: '遛狗',   nameEn: 'Walk the dog' },
    { icon: '🧹', cost: 1, reward: 1, nameZh: '扫地',   nameEn: 'Sweep the floor' },
    { icon: '📚', cost: 3, reward: 4, nameZh: '读书',   nameEn: 'Read a book' },
    { icon: '🛒', cost: 2, reward: 2, nameZh: '买菜',   nameEn: 'Grocery shopping' },
    { icon: '🎨', cost: 2, reward: 3, nameZh: '画画',   nameEn: 'Draw a picture' },
    { icon: '🧺', cost: 1, reward: 1, nameZh: '洗衣服', nameEn: 'Do the laundry' },
    { icon: '🍳', cost: 2, reward: 2, nameZh: '做饭',   nameEn: 'Cook a meal' },
    { icon: '🌱', cost: 1, reward: 2, nameZh: '浇花',   nameEn: 'Water the plants' },
    { icon: '🧸', cost: 3, reward: 3, nameZh: '整理玩具', nameEn: 'Tidy the toys' },
    { icon: '🚲', cost: 2, reward: 3, nameZh: '骑车',   nameEn: 'Go for a bike ride' }
  ],

  energyIcon: '⚡',
  rewardIcon: '⭐',

  units: {
    K1: { icon: '🔋', nameZh: 'K1 · 别超支',   nameEn: 'K1 · Stay in Budget',
      descZh: '两件任务，选出能量不超预算的方案。', descEn: 'Two tasks — pick the plan that stays within budget.' },
    K2: { icon: '🎯', nameZh: 'K2 · 精打细算', nameEn: 'K2 · Tighter Budget',
      descZh: '三件任务，预算更紧，仔细算一算。', descEn: 'Three tasks, a tighter budget — add carefully.' },
    G1: { icon: '🏆', nameZh: 'G1 · 收益最大化', nameEn: 'G1 · Best Value',
      descZh: '在预算内，选出收益最高的方案。', descEn: 'Within budget, pick the plan with the highest reward.' },
    G2: { icon: '👑', nameZh: 'G2 · 权衡取舍', nameEn: 'G2 · Trade-offs',
      descZh: '四件任务，预算最紧，权衡出收益最高的方案。', descEn: 'Four tasks, the tightest budget — weigh trade-offs for the best reward.' }
  }
};
