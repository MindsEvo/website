'use strict';

/**
 * Spatial Pattern Hunter — content CONFIG (MindSeeds)
 * No finished questions live here: generator.js builds every session from this config.
 * A trail of numbered footprints follows a movement rule; the child taps the cell
 * that comes next (predict), the cell that went missing (fill), or the footprint
 * that was misplaced (spot).
 *   hop     every step is the same move                       (K1 a line of pads, K2 a grid)
 *   stair   two different moves alternate                     (G1)
 *   bounce  diagonal moves, reflecting off the edges          (G2)
 * Metadata: /metadata/mindseeds/spatial-pattern.json
 */
var SP_DATA = {
  config: {
    K1: { R: 1, C: 7, kind: 'hop', cell: 40, pads: true,
          moves: [[0, 1], [0, -1], [0, 2], [0, -2]],
          shown: [3, 4], need: [1], total: [4, 5],
          forms: { predict: 3, fill: 3 },
          mover: ['🐸', '小青蛙', 'the frog'] },
    K2: { R: 6, C: 6, kind: 'hop', cell: 40,
          moves: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1], [0, 2], [0, -2], [2, 0], [-2, 0]],
          shown: [3, 4], need: [1, 2], total: [4, 5],
          forms: { fill: 3, predict: 3 },
          mover: ['🐰', '小兔', 'the bunny'] },
    G1: { R: 6, C: 6, kind: 'stair', cell: 40,
          shown: [5], need: [1, 2, 2], total: [6, 7],
          forms: { predict: 2, fill: 2, spot: 2 },
          mover: ['🐱', '小猫', 'the kitten'] },
    G2: { R: 4, C: 6, kind: 'bounce', cell: 42,
          shown: [5], need: [1, 2, 2], total: [6, 7],
          forms: { predict: 2, fill: 2, spot: 2 },
          mover: ['⚽', '小球', 'the ball'] }
  },

  units: {
    K1: { icon: '🐸', nameZh: 'K1 · 荷叶跳跳', nameEn: 'K1 · Lily Pad Hops',
      descZh: '小青蛙每次跳一样远，下一步落在哪？', descEn: 'The frog hops the same way each time — where next?' },
    K2: { icon: '🐰', nameZh: 'K2 · 格子里的脚印', nameEn: 'K2 · Footprints on the Grid',
      descZh: '横着、竖着、斜着，一步一步走一样的。', descEn: 'Sideways, up and down, or diagonal — the same step each time.' },
    G1: { icon: '🪜', nameZh: 'G1 · 楼梯步', nameEn: 'G1 · Staircase Steps',
      descZh: '两种走法轮流来，像上楼梯。', descEn: 'Two different moves take turns, like climbing stairs.' },
    G2: { icon: '⚽', nameZh: 'G2 · 碰到边就反弹', nameEn: 'G2 · Bounce Off the Edge',
      descZh: '小球斜着走，碰到边就反弹。', descEn: 'The ball moves diagonally and bounces off the edges.' }
  }
};
