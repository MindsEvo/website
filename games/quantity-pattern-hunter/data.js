/**
 * Quantity Pattern Hunter — Game Data  v1.0.0  (Shell-1 format)
 * ─────────────────────────────────────────────────────────
 * Concrete quantity relationship only.
 * No Arabic numerals in prompt/hint/voice text.
 * patternType: increase_decrease | alternate | cycle
 */

var QPH_DATA = {
  units: [
    {
      id: '1',
      icon: '🍎',
      nameZh: '数量变化',
      nameEn: 'Quantity Change',
      descZh: '观察数量在变多或变少',
      descEn: 'Observe quantity increasing or decreasing',
      abilityTag: 'quantity_sense',
      patternType: 'increase_decrease',
      questions: [
        {
          patternType: 'increase_decrease',
          level: 1,
          asset: 'apple',
          sequence: [1, 2, 3, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 4, opt2: 5, opt3: 2, opt4: 3 },
          optionTypes: { opt1: 'correct', opt2: 'too_many', opt3: 'too_few', opt4: 'unchanged' },
          hintZh: '每一步都在变多。',
          hintEn: 'Each step adds more objects.'
        },
        {
          patternType: 'increase_decrease',
          level: 1,
          asset: 'fish',
          sequence: [4, 3, 2, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 1, opt2: 3, opt3: 0, opt4: 2 },
          optionTypes: { opt1: 'correct', opt2: 'too_many', opt3: 'too_few', opt4: 'unchanged' },
          hintZh: '每一步都在变少。',
          hintEn: 'Each step removes objects.'
        },
        {
          patternType: 'increase_decrease',
          level: 2,
          asset: 'star',
          sequence: [0, 2, 4, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 6, opt2: 7, opt3: 5, opt4: 4 },
          optionTypes: { opt1: 'correct', opt2: 'too_many', opt3: 'too_few', opt4: 'unchanged' },
          hintZh: '每一步都增加同样多。',
          hintEn: 'Each step adds the same amount.'
        },
        {
          patternType: 'increase_decrease',
          level: 2,
          asset: 'bird',
          sequence: [7, 5, 3, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 1, opt2: 2, opt3: 0, opt4: 3 },
          optionTypes: { opt1: 'correct', opt2: 'too_many', opt3: 'too_few', opt4: 'unchanged' },
          hintZh: '每一步都减少同样多。',
          hintEn: 'Each step removes the same amount.'
        },
        {
          patternType: 'increase_decrease',
          level: 2,
          asset: 'flower',
          sequence: [6, 4, 2, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 0, opt2: 1, opt3: 2, opt4: 3 },
          optionTypes: { opt1: 'correct', opt2: 'too_many', opt3: 'unchanged', opt4: 'too_many' },
          hintZh: '继续按变少的节奏往下看。',
          hintEn: 'Continue the same shrinking rhythm.'
        },
        {
          patternType: 'increase_decrease',
          level: 1,
          asset: 'dot',
          sequence: [2, 3, 4, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 5, opt2: 6, opt3: 3, opt4: 4 },
          optionTypes: { opt1: 'correct', opt2: 'too_many', opt3: 'too_few', opt4: 'unchanged' },
          hintZh: '数量在稳定增加。',
          hintEn: 'Quantity increases steadily.'
        }
      ]
    },
    {
      id: '2',
      icon: '🔁',
      nameZh: '数量交替',
      nameEn: 'Quantity Alternation',
      descZh: '两个数量在轮流出现',
      descEn: 'Two quantity states alternate',
      abilityTag: 'quantity_sense',
      patternType: 'alternate',
      questions: [
        {
          patternType: 'alternate',
          level: 1,
          asset: 'star',
          sequence: [1, 2, 1, 2, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 1, opt2: 2, opt3: 3, opt4: 4 },
          optionTypes: { opt1: 'correct', opt2: 'pattern_misread', opt3: 'adjacent_item', opt4: 'pattern_misread' },
          hintZh: '两个数量在来回切换。',
          hintEn: 'Two quantities switch back and forth.'
        },
        {
          patternType: 'alternate',
          level: 1,
          asset: 'apple',
          sequence: [2, 4, 2, 4, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 2, opt2: 4, opt3: 3, opt4: 5 },
          optionTypes: { opt1: 'correct', opt2: 'pattern_misread', opt3: 'adjacent_item', opt4: 'pattern_misread' },
          hintZh: '看清轮换节奏。',
          hintEn: 'Follow the alternation rhythm.'
        },
        {
          patternType: 'alternate',
          level: 2,
          asset: 'fish',
          sequence: [3, 1, 3, 1, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 3, opt2: 1, opt3: 2, opt4: 4 },
          optionTypes: { opt1: 'correct', opt2: 'pattern_misread', opt3: 'adjacent_item', opt4: 'pattern_misread' },
          hintZh: '前后两种数量交替重复。',
          hintEn: 'The two quantity states repeat alternately.'
        },
        {
          patternType: 'alternate',
          level: 2,
          asset: 'dot',
          sequence: [1, 3, 1, 3, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 1, opt2: 3, opt3: 2, opt4: 4 },
          optionTypes: { opt1: 'correct', opt2: 'pattern_misread', opt3: 'adjacent_item', opt4: 'pattern_misread' },
          hintZh: '只在两档数量之间切换。',
          hintEn: 'Only two quantity levels are used.'
        },
        {
          patternType: 'alternate',
          level: 2,
          asset: 'bird',
          sequence: [4, 2, 4, 2, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 4, opt2: 2, opt3: 3, opt4: 1 },
          optionTypes: { opt1: 'correct', opt2: 'pattern_misread', opt3: 'adjacent_item', opt4: 'pattern_misread' },
          hintZh: '继续同样的交替关系。',
          hintEn: 'Continue the same alternation relation.'
        },
        {
          patternType: 'alternate',
          level: 1,
          asset: 'flower',
          sequence: [2, 1, 2, 1, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 2, opt2: 1, opt3: 3, opt4: 4 },
          optionTypes: { opt1: 'correct', opt2: 'pattern_misread', opt3: 'adjacent_item', opt4: 'pattern_misread' },
          hintZh: '前后项轮流出现。',
          hintEn: 'The previous two states alternate.'
        }
      ]
    },
    {
      id: '3',
      icon: '🔄',
      nameZh: '数量循环',
      nameEn: 'Quantity Cycle',
      descZh: '数量按循环规律重复',
      descEn: 'Quantity repeats in a cycle',
      abilityTag: 'quantity_sense',
      patternType: 'cycle',
      questions: [
        {
          patternType: 'cycle',
          level: 1,
          asset: 'apple',
          sequence: [1, 2, 3, 1, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 2, opt2: 3, opt3: 1, opt4: 4 },
          optionTypes: { opt1: 'correct', opt2: 'cycle_misalign', opt3: 'adjacent_item', opt4: 'pattern_misread' },
          hintZh: '三个数量按顺序循环。',
          hintEn: 'Three quantity levels form a cycle.'
        },
        {
          patternType: 'cycle',
          level: 1,
          asset: 'fish',
          sequence: [2, 3, 1, 2, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 3, opt2: 1, opt3: 2, opt4: 4 },
          optionTypes: { opt1: 'correct', opt2: 'cycle_misalign', opt3: 'adjacent_item', opt4: 'pattern_misread' },
          hintZh: '找出循环位置再补下一个。',
          hintEn: 'Find the cycle position, then fill the next.'
        },
        {
          patternType: 'cycle',
          level: 2,
          asset: 'star',
          sequence: [3, 1, 2, 3, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 1, opt2: 2, opt3: 3, opt4: 4 },
          optionTypes: { opt1: 'correct', opt2: 'cycle_misalign', opt3: 'adjacent_item', opt4: 'pattern_misread' },
          hintZh: '循环顺序不变，只是起点不同。',
          hintEn: 'Cycle order stays the same with a different start.'
        },
        {
          patternType: 'cycle',
          level: 2,
          asset: 'bird',
          sequence: [1, 2, 3, 1, 2, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 3, opt2: 1, opt3: 2, opt4: 4 },
          optionTypes: { opt1: 'correct', opt2: 'cycle_misalign', opt3: 'adjacent_item', opt4: 'pattern_misread' },
          hintZh: '观察完整循环再预测下一步。',
          hintEn: 'Observe one full cycle before predicting.'
        },
        {
          patternType: 'cycle',
          level: 2,
          asset: 'flower',
          sequence: [2, 1, 3, 2, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 1, opt2: 3, opt3: 2, opt4: 4 },
          optionTypes: { opt1: 'correct', opt2: 'cycle_misalign', opt3: 'adjacent_item', opt4: 'pattern_misread' },
          hintZh: '注意循环内的相对位置。',
          hintEn: 'Focus on relative positions in the cycle.'
        },
        {
          patternType: 'cycle',
          level: 1,
          asset: 'dot',
          sequence: [3, 2, 1, 3, '?'],
          answer: 'opt1',
          options: ['opt1', 'opt2', 'opt3', 'opt4'],
          optionDefs: { opt1: 2, opt2: 1, opt3: 3, opt4: 4 },
          optionTypes: { opt1: 'correct', opt2: 'cycle_misalign', opt3: 'adjacent_item', opt4: 'pattern_misread' },
          hintZh: '循环会回到同样的序列节拍。',
          hintEn: 'The cycle returns to the same rhythm.'
        }
      ]
    }
  ]
};
