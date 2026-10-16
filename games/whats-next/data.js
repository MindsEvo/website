'use strict';

/**
 * What's Next — Data
 * Effect pool and per-grade config for MindSeeds · Strategy Master.
 * The rules themselves are drawn fresh for every question (a numbered button
 * causes an arbitrary effect), so they cannot be guessed from common sense.
 * Metadata: /metadata/mindseeds/whats-next.json
 * RootGene: RG.STRATEGY.PREDICT.CONSEQUENCE
 */
var WN_DATA = {
  gradeConfig: {
    K1: { ruleCount: 2, direction: 'forward_predict', chainDepth: 'one_hop' },
    K2: { ruleCount: 3, direction: 'forward_predict', chainDepth: 'one_hop' },
    G1: { ruleCount: 4, direction: 'goal_directed',   chainDepth: 'one_hop' },
    G2: { ruleCount: 5, direction: 'both',            chainDepth: 'two_hop' }
  },

  // Every effect has a strong, clear icon and is always shown with its name.
  effects: [
    { icon: '🔔', nameZh: '铃响', nameEn: 'Bell rings' },
    { icon: '💡', nameZh: '灯亮', nameEn: 'Light on' },
    { icon: '🎵', nameZh: '音乐响', nameEn: 'Music plays' },
    { icon: '🚪', nameZh: '门开', nameEn: 'Door opens' },
    { icon: '🎈', nameZh: '气球升空', nameEn: 'Balloon rises' },
    { icon: '⛲', nameZh: '喷泉', nameEn: 'Fountain sprays' },
    { icon: '🌈', nameZh: '彩虹出现', nameEn: 'Rainbow appears' },
    { icon: '🚂', nameZh: '火车开动', nameEn: 'Train starts' }
  ],

  units: {
    K1: { icon: '🔘', nameZh: 'K1 · 按一按', nameEn: 'K1 · Press and See',
      descZh: '两张规则卡：按下几号，会发生什么？', descEn: 'Two rule cards: press a number — what happens?' },
    K2: { icon: '🎛️', nameZh: 'K2 · 看清规则', nameEn: 'K2 · Read the Rules',
      descZh: '三张规则卡，别看错了一行。', descEn: 'Three rule cards — do not read the wrong row.' },
    G1: { icon: '🎯', nameZh: 'G1 · 反着想', nameEn: 'G1 · Work Backwards',
      descZh: '想让某件事发生，该按几号？有时要同时让两件事发生。', descEn: 'Which number makes it happen? Sometimes two things at once.' },
    G2: { icon: '🔗', nameZh: 'G2 · 连环反应', nameEn: 'G2 · Chain Reaction',
      descZh: '一件事会引起下一件事，顺着想、倒着想。', descEn: 'One thing triggers the next — think forwards and backwards.' }
  }
};
