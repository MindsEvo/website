/**
 * Visual Pattern Hunter — Game Data  v1.0.0
 * Question bank for visual/shape pattern recognition
 */

var VPH_DATA = {
  units: [
    // ═══════════════════════════════════════════════════════════
    // UNIT 1: Shape Alternation (形状交替)
    // ═══════════════════════════════════════════════════════════
    {
      id: '1',
      nameKey: 'vph.unit1.name',
      descKey: 'vph.unit1.desc',
      icon: '🔵',
      patternType: 'shape',
      questions: [
        // L1: AB AB AB pattern
        {
          sequence: ['circle', 'triangle', 'circle', 'triangle', 'circle', '?'],
          correct: 'triangle',
          options: ['triangle', 'circle', 'square', 'star'],
          hintKey: 'vph.hint.shape',
          level: 1
        },
        {
          sequence: ['square', 'circle', 'square', 'circle', 'square', '?'],
          correct: 'circle',
          options: ['circle', 'square', 'triangle', 'star'],
          hintKey: 'vph.hint.shape',
          level: 1
        },
        // L2: ABC ABC pattern
        {
          sequence: ['circle', 'triangle', 'square', 'circle', 'triangle', '?'],
          correct: 'square',
          options: ['square', 'circle', 'triangle', 'star'],
          hintKey: 'vph.hint.shape',
          level: 2
        },
        {
          sequence: ['star', 'circle', 'triangle', 'star', 'circle', '?'],
          correct: 'triangle',
          options: ['triangle', 'star', 'circle', 'square'],
          hintKey: 'vph.hint.shape',
          level: 2
        },
        // L3: AABB AABB pattern
        {
          sequence: ['circle', 'circle', 'triangle', 'triangle', 'circle', '?'],
          correct: 'circle',
          options: ['circle', 'triangle', 'square', 'star'],
          hintKey: 'vph.hint.shape',
          level: 3
        }
      ]
    },

    // ═══════════════════════════════════════════════════════════
    // UNIT 2: Quantity Growth (数量递增)
    // ═══════════════════════════════════════════════════════════
    {
      id: '2',
      nameKey: 'vph.unit2.name',
      descKey: 'vph.unit2.desc',
      icon: '🔢',
      patternType: 'count',
      questions: [
        // L1: +1 increment
        {
          sequence: [1, 2, 3, 4, 5, '?'],
          correct: 6,
          options: [6, 5, 7, 4],
          hintKey: 'vph.hint.count',
          level: 1
        },
        {
          sequence: [2, 3, 4, 5, 6, '?'],
          correct: 7,
          options: [7, 6, 8, 5],
          hintKey: 'vph.hint.count',
          level: 1
        },
        // L2: +2 increment
        {
          sequence: [1, 3, 5, 7, 9, '?'],
          correct: 11,
          options: [11, 10, 12, 9],
          hintKey: 'vph.hint.count',
          level: 2
        },
        {
          sequence: [2, 4, 6, 8, 10, '?'],
          correct: 12,
          options: [12, 11, 10, 14],
          hintKey: 'vph.hint.count',
          level: 2
        },
        // L3: cycling pattern
        {
          sequence: [1, 2, 3, 1, 2, '?'],
          correct: 3,
          options: [3, 1, 2, 4],
          hintKey: 'vph.hint.count',
          level: 3
        }
      ]
    },

    // ═══════════════════════════════════════════════════════════
    // UNIT 3: Rotation Pattern (方向旋转)
    // ═══════════════════════════════════════════════════════════
    {
      id: '3',
      nameKey: 'vph.unit3.name',
      descKey: 'vph.unit3.desc',
      icon: '🔄',
      patternType: 'rotate',
      questions: [
        // L1: 90° clockwise rotation
        {
          sequence: [0, 90, 180, 270, 0, '?'],
          correct: 90,
          options: [90, 180, 270, 0],
          hintKey: 'vph.hint.rotate',
          level: 1,
          rotateShape: 'arrow'
        },
        {
          sequence: [90, 180, 270, 0, 90, '?'],
          correct: 180,
          options: [180, 90, 270, 0],
          hintKey: 'vph.hint.rotate',
          level: 1,
          rotateShape: 'arrow'
        },
        // L2: 45° rotation
        {
          sequence: [0, 45, 90, 135, 180, '?'],
          correct: 225,
          options: [225, 180, 270, 135],
          hintKey: 'vph.hint.rotate',
          level: 2,
          rotateShape: 'arrow'
        },
        // L3: alternating rotation
        {
          sequence: [0, 90, 0, 90, 0, '?'],
          correct: 90,
          options: [90, 0, 180, 270],
          hintKey: 'vph.hint.rotate',
          level: 3,
          rotateShape: 'arrow'
        }
      ]
    }
  ]
};
