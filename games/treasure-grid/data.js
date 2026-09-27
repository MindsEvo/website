'use strict';

/**
 * Treasure Grid — content VOCABULARY (MindSeeds, Memory Guardian)
 * ─────────────────────────────────────────────────────────────────────────────
 * A grid of numbered cells appears; 1-2 cells briefly show a treasure marker,
 * then it hides. The child picks the number of the cell that held a treasure.
 * generator.js builds the grid and the option set per grade.
 */

var TG_DATA = {

  gradeConfig: {
    K1: { gridSize: 2, treasureCount: 1, exposureMs: 3000, delayMs: 400,  optionCount: 4 },
    K2: { gridSize: 2, treasureCount: 1, exposureMs: 2500, delayMs: 800,  optionCount: 4 },
    G1: { gridSize: 3, treasureCount: 1, exposureMs: 2200, delayMs: 1200, optionCount: 4 },
    G2: { gridSize: 3, treasureCount: 2, exposureMs: 1800, delayMs: 1500, optionCount: 4 }
  },

  treasureIcon: '💎',
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
      nameZh: 'G1 · 更大的格子', nameEn: 'G1 · A Bigger Grid',
      descZh: '3×3 的格子，选项更多，也要等一等。',
      descEn: 'A 3x3 grid with more options and a longer pause.'
    },
    G2: {
      icon: '💰',
      nameZh: 'G2 · 两处宝藏', nameEn: 'G2 · Two Treasures',
      descZh: '这次藏了两处宝藏，记住其中一处就能选对。',
      descEn: 'Two treasures this time — remembering either one wins.'
    }
  }
};
