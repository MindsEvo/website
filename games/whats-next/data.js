'use strict';

/**
 * What's Next — Data
 * Cause -> effect chains for MindSeeds · Strategy Master.
 * Metadata: /metadata/mindseeds/whats-next.json
 * RootGene: RG.STRATEGY.PREDICT.CONSEQUENCE
 */
var WN_DATA = {
  gradeConfig: {
    K1: { ruleCount: 2, direction: 'forward_predict', chainDepth: 'one_hop' },
    K2: { ruleCount: 3, direction: 'forward_predict', chainDepth: 'one_hop' },
    G1: { ruleCount: 3, direction: 'goal_directed',   chainDepth: 'one_hop' },
    G2: { ruleCount: 3, direction: 'forward_predict', chainDepth: 'two_hop' }
  },

  // Each chain is action -> mid -> final. One-hop questions use action/mid;
  // two-hop questions chain mid into the next rule's trigger to reach final.
  chains: [
    { action: { icon: '🔵', nameZh: '蓝按钮', nameEn: 'Blue button' }, mid: { icon: '🚪', nameZh: '门开了', nameEn: 'Door opens' }, final: { icon: '🔔', nameZh: '铃响了', nameEn: 'Bell rings' } },
    { action: { icon: '🟢', nameZh: '绿拉杆', nameEn: 'Green lever' }, mid: { icon: '🌉', nameZh: '桥移动', nameEn: 'Bridge moves' }, final: { icon: '🚂', nameZh: '火车通过', nameEn: 'Train passes' } },
    { action: { icon: '🔴', nameZh: '红开关', nameEn: 'Red switch' }, mid: { icon: '💡', nameZh: '灯亮了', nameEn: 'Light turns on' }, final: { icon: '📺', nameZh: '电视开了', nameEn: 'TV turns on' } },
    { action: { icon: '🟡', nameZh: '黄旋钮', nameEn: 'Yellow knob' }, mid: { icon: '🚿', nameZh: '水流出来', nameEn: 'Water flows' }, final: { icon: '🌱', nameZh: '植物长大', nameEn: 'Plant grows' } },
    { action: { icon: '🟣', nameZh: '紫转盘', nameEn: 'Purple dial' }, mid: { icon: '🎵', nameZh: '音乐响起', nameEn: 'Music plays' }, final: { icon: '💃', nameZh: '大家跳舞', nameEn: 'Everyone dances' } },
    { action: { icon: '⚫', nameZh: '黑按钮', nameEn: 'Black button' }, mid: { icon: '🌂', nameZh: '雨伞打开', nameEn: 'Umbrella opens' }, final: { icon: '☔', nameZh: '没被淋湿', nameEn: 'Stays dry' } },
    { action: { icon: '🟠', nameZh: '橙拉环', nameEn: 'Orange pull-ring' }, mid: { icon: '🎈', nameZh: '气球升起', nameEn: 'Balloon rises' }, final: { icon: '🎉', nameZh: '派对开始', nameEn: 'Party starts' } },
    { action: { icon: '🟤', nameZh: '棕按钮', nameEn: 'Brown button' }, mid: { icon: '🍞', nameZh: '面包烤好', nameEn: 'Bread toasts' }, final: { icon: '😋', nameZh: '可以吃了', nameEn: 'Ready to eat' } }
  ],

  units: {
    K1: { icon: '🔘', nameZh: 'K1 · 按一按', nameEn: 'K1 · Press and See',
      descZh: '两条规则卡，按下按钮猜会发生什么。', descEn: 'Two rule cards — press a button and guess what happens.' },
    K2: { icon: '🎛️', nameZh: 'K2 · 多条规则', nameEn: 'K2 · More Rules',
      descZh: '三条规则卡，别按错了行。', descEn: 'Three rule cards — pick the right one to predict.' },
    G1: { icon: '🎯', nameZh: 'G1 · 反着想', nameEn: 'G1 · Work Backwards',
      descZh: '想要某件事发生，该按哪一个？', descEn: 'You want something to happen — which one do you press?' },
    G2: { icon: '🔗', nameZh: 'G2 · 连环反应', nameEn: 'G2 · Chain Reaction',
      descZh: '一环接一环，想清楚最终结果。', descEn: 'One effect triggers the next — think through to the final result.' }
  }
};
