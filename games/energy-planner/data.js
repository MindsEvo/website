'use strict';

/**
 * Energy Planner — Data
 * Task names + per-grade config (cost/reward are drawn per question) for MindSeeds · Strategy Master.
 * Metadata: /metadata/mindseeds/energy-planner.json
 * RootGene: RG.STRATEGY.RESOURCE.TRADEOFF
 */
var EP_DATA = {
  // fit_only: do as many tasks as the energy allows (K2 has one must-do task);
  // maximize_reward: pick the tasks that earn the most stars within the energy.
  gradeConfig: {
    K1: { taskCount: 3, goalType: 'fit_only',        costMax: 3, budgetRange: [3, 4] },
    K2: { taskCount: 4, goalType: 'fit_only',        costMax: 4, budgetRange: [5, 7], mustDo: true },
    G1: { taskCount: 4, goalType: 'maximize_reward', costMax: 4, rewardMax: 6, budgetRatio: 0.55 },
    G2: { taskCount: 5, goalType: 'maximize_reward', costMax: 5, rewardMax: 8, budgetRatio: 0.5 }
  },

  taskPool: [
    { icon: '🐶', nameZh: '遛狗',   nameEn: 'Walk the dog' },
    { icon: '🧹', nameZh: '扫地',   nameEn: 'Sweep the floor' },
    { icon: '📚', nameZh: '读书',   nameEn: 'Read a book' },
    { icon: '🛒', nameZh: '买菜',   nameEn: 'Grocery shopping' },
    { icon: '🎨', nameZh: '画画',   nameEn: 'Draw a picture' },
    { icon: '🧺', nameZh: '洗衣服', nameEn: 'Do the laundry' },
    { icon: '🍳', nameZh: '做饭',   nameEn: 'Cook a meal' },
    { icon: '🌱', nameZh: '浇花',   nameEn: 'Water the plants' },
    { icon: '🧸', nameZh: '整理玩具', nameEn: 'Tidy the toys' },
    { icon: '🚲', nameZh: '骑车',   nameEn: 'Go for a bike ride' }
  ],

  energyIcon: '<span class="bolt"></span>',
  rewardIcon: '⭐',

  units: {
    K1: { icon: '🔋', nameZh: 'K1 · 能量够用就好', nameEn: 'K1 · Enough Energy',
      descZh: '三件事，能量有限，试着多做几件。', descEn: 'Three tasks, limited energy — try to do as many as you can.' },
    K2: { icon: '🎯', nameZh: 'K2 · 必做的事', nameEn: 'K2 · The Must-Do',
      descZh: '有一件事必须做，其余的再尽量多做。', descEn: 'One task must be done; then fit in as many others as possible.' },
    G1: { icon: '🏆', nameZh: 'G1 · 划算的选择', nameEn: 'G1 · Best Value',
      descZh: '能量有限，选出得到星星最多的几件事。', descEn: 'Limited energy — choose the tasks that earn the most stars.' },
    G2: { icon: '👑', nameZh: 'G2 · 权衡取舍', nameEn: 'G2 · Trade-offs',
      descZh: '五件事，预算最紧，看起来最划算的不一定最好。', descEn: 'Five tasks, the tightest budget — the best-looking deal is not always the best.' }
  }
};
