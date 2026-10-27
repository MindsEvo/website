'use strict';

/**
 * Treasure Grid — content VOCABULARY (MindSeeds, Memory Guardian)
 * ─────────────────────────────────────────────────────────────────────────────
 * K1-K2 train location recall. G1-G2 also include path reconstruction: a
 * connected route is shown, hidden, then rebuilt by tapping cells in order.
 * G2 may update one hidden step after the original route disappears.
 */
var TG_DATA = {

  gradeConfig: {
    K1: {
      gridSize: 2, treasureCount: 1, exposureMs: 3000, delayMs: 400,
      optionCount: 4, pathCount: 0
    },
    K2: {
      gridSize: 2, treasureCount: 1, exposureMs: 2500, delayMs: 800,
      optionCount: 4, pathCount: 0
    },
    G1: {
      gridSize: 3, treasureCount: 1, exposureMs: 2200, delayMs: 900,
      optionCount: 4, pathCount: 4, pathLength: 3, pathExposureMs: 2600,
      pathDelayMs: 700, pathMode: 'rebuild'
    },
    G2: {
      gridSize: 3, treasureCount: 2, exposureMs: 1800, delayMs: 1200,
      optionCount: 4, pathCount: 4, pathLength: 4, pathExposureMs: 2400,
      pathDelayMs: 900, pathMode: 'update'
    }
  },

  treasureIcon: '💎',
  homeIcon: '🏠',
  travellerIcon: '🐿️',
  cellIcon: '⬜',

  units: {
    K1: {
      icon: '🗺️',
      nameZh: 'K1 · 找到宝藏', nameEn: 'K1 · Find the Treasure',
      descZh: '2×2 的格子，记住宝藏藏在哪一格。',
      descEn: 'A 2x2 grid — remember which cell hid the treasure.'
    },
    K2: {
      icon: '🧭',
      nameZh: 'K2 · 等一等再找', nameEn: 'K2 · Wait, Then Find',
      descZh: '藏好后要等一下才能选，记牢那一格。',
      descEn: 'A short pause before you can answer — hold the spot in mind.'
    },
    G1: {
      icon: '🏝️',
      nameZh: 'G1 · 宝藏与回家路线', nameEn: 'G1 · Treasure and the Way Home',
      descZh: '记住宝藏位置，也要按顺序重建刚才展示的回家路线。',
      descEn: 'Recall treasure locations and rebuild a shown route in order.'
    },
    G2: {
      icon: '💰',
      nameZh: 'G2 · 路线更新', nameEn: 'G2 · Route Update',
      descZh: '记住位置和路线；路线藏起后，还可能有一步需要更新。',
      descEn: 'Remember locations and routes, including a hidden step update.'
    }
  }
};