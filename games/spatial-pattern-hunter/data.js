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
          forms: { predict: 2, fill: 2, transform: 2 },
          families: ['movement', 'rotation'],
          transforms: ['rotate90'],
          mover: ['🐸', '小青蛙', 'the frog'] },
    K2: { R: 6, C: 6, kind: 'hop', cell: 40,
          moves: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1], [0, 2], [0, -2], [2, 0], [-2, 0]],
          shown: [3, 4], need: [1, 2], total: [4, 5],
          forms: { fill: 2, predict: 2, transform: 2 },
          families: ['movement', 'rotation', 'reflection'],
          transforms: ['rotate90', 'reflectX'],
          mover: ['🐰', '小兔', 'the bunny'] },
    G1: { R: 6, C: 6, kind: 'stair', cell: 40,
          shown: [5], need: [1, 2, 2], total: [6, 7],
          forms: { predict: 1, fill: 1, spot: 1, transform: 2, grid: 1 },
          families: ['movement', 'alternating-transform', 'row-column-grid'],
          transforms: ['alternate-rotate-reflect'],
          explain: true,
          mover: ['🐱', '小猫', 'the kitten'] },
    G2: { R: 4, C: 6, kind: 'bounce', cell: 42,
          shown: [5], need: [1, 2, 2], total: [6, 7],
          forms: { predict: 1, fill: 1, spot: 1, transform: 1, grid: 2 },
          families: ['movement', 'combined-transform', 'row-column-grid'],
          transforms: ['rotate-reflect'],
          explain: true,
          mover: ['⚽', '小球', 'the ball'] }
  },

  symbols: [
    { id: 'arrow-hook', glyph: '↱', speechZh: '弯箭头', speechEn: 'bent arrow' },
    { id: 'flag', glyph: '⚑', speechZh: '小旗', speechEn: 'flag' },
    { id: 'shoe', glyph: '◩', speechZh: '缺角方块', speechEn: 'notched square' }
  ],

  units: {
    K1: { icon: '🐸', nameZh: 'K1 · 荷叶跳跳', nameEn: 'K1 · Lily Pad Hops',
      descZh: '沿荷叶移动，并观察简单旋转。', descEn: 'Move along lily pads and notice a simple rotation.' },
    K2: { icon: '🐰', nameZh: 'K2 · 格子里的脚印', nameEn: 'K2 · Footprints on the Grid',
      descZh: '在格子里移动，并分辨旋转和镜像。', descEn: 'Move on a grid and distinguish rotation from reflection.' },
    G1: { icon: '🪜', nameZh: 'G1 · 楼梯步', nameEn: 'G1 · Staircase Steps',
      descZh: '交替变换，并从行列关系补全格子。', descEn: 'Alternate transformations and complete row-column grids.' },
    G2: { icon: '⚽', nameZh: 'G2 · 碰到边就反弹', nameEn: 'G2 · Bounce Off the Edge',
      descZh: '组合变换、行列关系和有选项的规则说明。', descEn: 'Combine transformations, grid relations, and structured rule explanations.' }
  }
};
