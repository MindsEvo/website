/**
 * Spatial Pattern Hunter — Game Data  v1.0.0  (Shell-1 format)
 * ─────────────────────────────────────────────────────────
 * Scope in v1:
 * 1) position_swap  (horizontal/vertical slot exchange)
          symbols: { A: '■', B: '●', C: '★' },
 *
 * Out of scope:
 * - single-point movement trajectories (belongs to Motion)
 * - single-symbol direction rotation (belongs to Visual)
 */

var SPATIAL_DATA = {
  units: [
    {
      id: 'position-swap',
      icon: '↔️',
      nameZh: '位置交换',
      nameEn: 'Position Swap',
      descZh: '看懂左右或上下关系的交换',
      descEn: 'Read left-right / up-down relationship swaps',
      abilityTag: 'spatial_relationship',
      patternType: 'position_swap',
      questions: [
        {
          layout: 'swap',
          patternType: 'position_swap',
          level: 1,
          orientation: 'horizontal',
          symbols: { A: '▲', B: '○', C: '★' },
          sequence: ['AB', 'BA', 'AB', '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: {
            opt1: { state: 'BA' },
            opt2: { state: 'AB' },
            opt3: { state: 'AA' },
            opt4: { state: 'AC' }
          },
          optionTypes: {
            opt1: 'correct',
            opt2: 'order_unchanged',
            opt3: 'position_wrong',
            opt4: 'irrelevant_object'
          },
          hintZh: '两个物体在左右槽位中交替交换。',
          hintEn: 'The two objects alternate by swapping left-right slots.'
        },
        {
          layout: 'swap',
          patternType: 'position_swap',
          level: 1,
          orientation: 'vertical',
          symbols: { A: '★', B: '●', C: '◆' },
          sequence: ['AB', 'BA', 'AB', '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: {
            opt1: { state: 'BA' },
            opt2: { state: 'AB' },
            opt3: { state: 'BB' },
            opt4: { state: 'AC' }
          },
          optionTypes: {
            opt1: 'correct',
            opt2: 'order_unchanged',
            opt3: 'position_wrong',
            opt4: 'irrelevant_object'
          },
          hintZh: '上下关系在交替交换。',
          hintEn: 'The up-down relationship swaps alternately.'
        },
        {
          layout: 'swap',
          patternType: 'position_swap',
          level: 1,
          orientation: 'horizontal',
          symbols: { A: '■', B: '●', C: '★' },
          sequence: ['BA', 'AB', 'BA', '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: {
            opt1: { state: 'AB' },
            opt2: { state: 'BA' },
            opt3: { state: 'BB' },
            opt4: { state: 'CB' }
          },
          optionTypes: {
            opt1: 'correct',
            opt2: 'order_unchanged',
            opt3: 'position_wrong',
            opt4: 'irrelevant_object'
          },
          hintZh: '先看上一步，再判断是否继续交换。',
          hintEn: 'Look at the previous step and continue the swap rule.'
        },
        {
          layout: 'swap',
          patternType: 'position_swap',
          level: 2,
          orientation: 'horizontal',
          symbols: { A: '▲', B: '●', C: '★' },
          sequence: ['AB', 'BA', 'AB', 'BA', '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: {
            opt1: { state: 'AB' },
            opt2: { state: 'BA' },
            opt3: { state: 'AA' },
            opt4: { state: 'BC' }
          },
          optionTypes: {
            opt1: 'correct',
            opt2: 'order_unchanged',
            opt3: 'position_wrong',
            opt4: 'irrelevant_object'
          },
          hintZh: '观察更多步数后，规律仍是交换。',
          hintEn: 'Even with more steps, the rule remains swapping.'
        },
        {
          layout: 'swap',
          patternType: 'position_swap',
          level: 2,
          orientation: 'vertical',
          symbols: { A: '▲', B: '●', C: '■' },
          sequence: ['BA', 'AB', 'BA', 'AB', '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: {
            opt1: { state: 'BA' },
            opt2: { state: 'AB' },
            opt3: { state: 'AA' },
            opt4: { state: 'CA' }
          },
          optionTypes: {
            opt1: 'correct',
            opt2: 'order_unchanged',
            opt3: 'position_wrong',
            opt4: 'irrelevant_object'
          },
          hintZh: '不要看图标朝向，只看上下顺序关系。',
          hintEn: 'Ignore icon orientation; focus on up-down order relation.'
        },
        {
          layout: 'swap',
          patternType: 'position_swap',
          level: 2,
          orientation: 'horizontal',
          symbols: { A: '★', B: '■', C: '○' },
          sequence: ['BA', 'AB', 'BA', 'AB', '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: {
            opt1: { state: 'BA' },
            opt2: { state: 'AB' },
            opt3: { state: 'BB' },
            opt4: { state: 'AC' }
          },
          optionTypes: {
            opt1: 'correct',
            opt2: 'order_unchanged',
            opt3: 'position_wrong',
            opt4: 'irrelevant_object'
          },
          hintZh: '每一步都在左右互换。',
          hintEn: 'Each step swaps left and right.'
        },
        {
          layout: 'swap',
          patternType: 'position_swap',
          level: 3,
          orientation: 'horizontal',
          symbols: { A: '▲', B: '●', C: '★' },
          sequence: ['AB', 'BA', '?', 'BA', 'AB'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: {
            opt1: { state: 'AB' },
            opt2: { state: 'BA' },
            opt3: { state: 'AA' },
            opt4: { state: 'AC' }
          },
          optionTypes: {
            opt1: 'correct',
            opt2: 'order_unchanged',
            opt3: 'position_wrong',
            opt4: 'irrelevant_object'
          },
          hintZh: '问号在中间，也要保持交换规律。',
          hintEn: 'Even with a middle blank, keep the swapping rule.'
        },
        {
          layout: 'swap',
          patternType: 'position_swap',
          level: 3,
          orientation: 'vertical',
          symbols: { A: '■', B: '●', C: '★' },
          sequence: ['BA', 'AB', 'BA', '?', 'BA', 'AB'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: {
            opt1: { state: 'AB' },
            opt2: { state: 'BA' },
            opt3: { state: 'BB' },
            opt4: { state: 'CB' }
          },
          optionTypes: {
            opt1: 'correct',
            opt2: 'order_unchanged',
            opt3: 'position_wrong',
            opt4: 'irrelevant_object'
          },
          hintZh: '步数更长时，先找交换节拍再补空位。',
          hintEn: 'With longer sequences, find the swap rhythm first.'
        }
      ]
    },
    {
      id: 'shape-rotation',
      icon: '🔄',
      nameZh: '整体旋转',
      nameEn: 'Shape Rotation',
      descZh: '看懂多格构型的整体旋转',
      descEn: 'Read whole-shape rotation in a 3x3 grid',
      abilityTag: 'spatial_relationship',
      patternType: 'shape_rotation',
      questions: [
        {
          layout: 'rotation',
          patternType: 'shape_rotation',
          level: 1,
          shapeKind: 'line2',
          sequence: [0, 90, 180, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: {
            opt1: { angle: 270, shapeKind: 'line2' },
            opt2: { angle: 90, shapeKind: 'line2' },
            opt3: { angle: 180, shapeKind: 'line2' },
            opt4: { angle: 270, shapeKind: 'L3' }
          },
          optionTypes: {
            opt1: 'correct',
            opt2: 'wrong_direction',
            opt3: 'wrong_angle',
            opt4: 'wrong_shape'
          },
          hintZh: '构型每次整体转 90°。',
          hintEn: 'The whole shape rotates 90° each step.'
        },
        {
          layout: 'rotation',
          patternType: 'shape_rotation',
          level: 1,
          shapeKind: 'line2',
          sequence: [90, 180, 270, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: {
            opt1: { angle: 0, shapeKind: 'line2' },
            opt2: { angle: 180, shapeKind: 'line2' },
            opt3: { angle: 270, shapeKind: 'line2' },
            opt4: { angle: 0, shapeKind: 'L3' }
          },
          optionTypes: {
            opt1: 'correct',
            opt2: 'wrong_direction',
            opt3: 'wrong_angle',
            opt4: 'wrong_shape'
          },
          hintZh: '继续沿同方向旋转。',
          hintEn: 'Continue rotating in the same direction.'
        },
        {
          layout: 'rotation',
          patternType: 'shape_rotation',
          level: 2,
          shapeKind: 'line2',
          sequence: [0, 270, 180, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: {
            opt1: { angle: 90, shapeKind: 'line2' },
            opt2: { angle: 270, shapeKind: 'line2' },
            opt3: { angle: 0, shapeKind: 'line2' },
            opt4: { angle: 90, shapeKind: 'L3' }
          },
          optionTypes: {
            opt1: 'correct',
            opt2: 'wrong_direction',
            opt3: 'wrong_angle',
            opt4: 'wrong_shape'
          },
          hintZh: '这是反方向旋转序列。',
          hintEn: 'This sequence rotates in the opposite direction.'
        },
        {
          layout: 'rotation',
          patternType: 'shape_rotation',
          level: 2,
          shapeKind: 'line2',
          sequence: [180, 90, 0, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: {
            opt1: { angle: 270, shapeKind: 'line2' },
            opt2: { angle: 90, shapeKind: 'line2' },
            opt3: { angle: 180, shapeKind: 'line2' },
            opt4: { angle: 270, shapeKind: 'L3' }
          },
          optionTypes: {
            opt1: 'correct',
            opt2: 'wrong_direction',
            opt3: 'wrong_angle',
            opt4: 'wrong_shape'
          },
          hintZh: '观察角度在如何递减。',
          hintEn: 'Observe how the angles decrease each step.'
        },
        {
          layout: 'rotation',
          patternType: 'shape_rotation',
          level: 3,
          shapeKind: 'L3',
          sequence: [0, 90, 180, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: {
            opt1: { angle: 270, shapeKind: 'L3' },
            opt2: { angle: 90, shapeKind: 'L3' },
            opt3: { angle: 0, shapeKind: 'L3' },
            opt4: { angle: 270, shapeKind: 'line2' }
          },
          optionTypes: {
            opt1: 'correct',
            opt2: 'wrong_direction',
            opt3: 'wrong_angle',
            opt4: 'wrong_shape'
          },
          hintZh: 'L 形不对称，更要看清旋转方向。',
          hintEn: 'L-shape is asymmetric, so direction matters more.'
        },
        {
          layout: 'rotation',
          patternType: 'shape_rotation',
          level: 3,
          shapeKind: 'L3',
          sequence: [90, 0, 270, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: {
            opt1: { angle: 180, shapeKind: 'L3' },
            opt2: { angle: 0, shapeKind: 'L3' },
            opt3: { angle: 270, shapeKind: 'L3' },
            opt4: { angle: 180, shapeKind: 'line2' }
          },
          optionTypes: {
            opt1: 'correct',
            opt2: 'wrong_direction',
            opt3: 'wrong_angle',
            opt4: 'wrong_shape'
          },
          hintZh: '这是固定 90° 的逆向旋转。',
          hintEn: 'This is fixed 90° rotation in the reverse direction.'
        }
      ]
    }
  ]
};
