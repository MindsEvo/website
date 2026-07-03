/**
 * Size Pattern Hunter — Game Data  v1.2.0  (Shell-1 format)
 * ─────────────────────────────────────────────────────────
 * Pure visual size perception only.
 * Levels: s1 < s2 < s3 < s4 (discrete size bands)
 * No numeric values, units, percentages, or ratio calculations.
 *
 * patternType: 'grow' | 'shrink' | 'alternate' | 'cycle'
 * optionTypes: correct | pattern_misread | adjacent_item | cycle_misalign | random
 */

var SPH_DATA = {
  units: [
    {
      id: '1',
      icon: '📈',
      nameZh: '逐渐变大',
      nameEn: 'Grow Bigger',
      descZh: '观察图形如何越来越大',
      descEn: 'Observe how the shape keeps getting bigger',
      abilityTag: 'magnitude_perception',
      patternType: 'grow',
      questions: [
        {
          patternType: 'grow', level: 1,
          sequence: ['s1', 's2', 's3', '?'],
          answer: 's4',
          options: ['s4', 's3', 's2', 's1'],
          optionTypes: { s4: 'correct', s3: 'adjacent_item', s2: 'pattern_misread', s1: 'random' },
          hintZh: '图形正在一步步变大。',
          hintEn: 'The shape is getting bigger step by step.'
        },
        {
          patternType: 'grow', level: 1,
          sequence: ['s1', '?', 's3', 's4'],
          answer: 's2',
          options: ['s2', 's3', 's1', 's4'],
          optionTypes: { s2: 'correct', s3: 'adjacent_item', s1: 'pattern_misread', s4: 'random' },
          hintZh: '问号前后都在变大。',
          hintEn: 'Sizes grow on both sides of the blank.'
        },
        {
          patternType: 'grow', level: 1,
          sequence: ['s1', 's2', '?', 's4'],
          answer: 's3',
          options: ['s3', 's2', 's4', 's1'],
          optionTypes: { s3: 'correct', s2: 'adjacent_item', s4: 'pattern_misread', s1: 'random' },
          hintZh: '保持同样步长继续变大。',
          hintEn: 'Keep the same growth step.'
        },
        {
          patternType: 'grow', level: 2,
          sequence: ['?', 's2', 's3', 's4'],
          answer: 's1',
          options: ['s1', 's2', 's3', 's4'],
          optionTypes: { s1: 'correct', s2: 'adjacent_item', s3: 'pattern_misread', s4: 'random' },
          hintZh: '从后面三项反推第一项。',
          hintEn: 'Infer the first item from the last three.'
        },
        {
          patternType: 'grow', level: 2,
          sequence: ['s2', '?', 's4'],
          answer: 's3',
          options: ['s3', 's2', 's4', 's1'],
          optionTypes: { s3: 'correct', s2: 'adjacent_item', s4: 'pattern_misread', s1: 'random' },
          hintZh: '中间缺失也按变大规律补上。',
          hintEn: 'Fill the blank with the same growing rule.'
        },
        {
          patternType: 'grow', level: 2,
          sequence: ['s1', 's2', '?', 's4'],
          answer: 's3',
          options: ['s3', 's2', 's4', 's1'],
          optionTypes: { s3: 'correct', s2: 'adjacent_item', s4: 'pattern_misread', s1: 'random' },
          hintZh: '看出规律后继续往下。',
          hintEn: 'Continue the same pattern to the next one.'
        }
      ]
    },
    {
      id: '2',
      icon: '📉',
      nameZh: '逐渐变小',
      nameEn: 'Grow Smaller',
      descZh: '观察图形如何越来越小',
      descEn: 'Observe how the shape keeps getting smaller',
      abilityTag: 'magnitude_perception',
      patternType: 'shrink',
      questions: [
        {
          patternType: 'shrink', level: 1,
          sequence: ['s4', 's3', 's2', '?'],
          answer: 's1',
          options: ['s1', 's2', 's3', 's4'],
          optionTypes: { s1: 'correct', s2: 'adjacent_item', s3: 'pattern_misread', s4: 'random' },
          hintZh: '图形正在一步步变小。',
          hintEn: 'The shape is getting smaller step by step.'
        },
        {
          patternType: 'shrink', level: 1,
          sequence: ['s4', '?', 's2', 's1'],
          answer: 's3',
          options: ['s3', 's2', 's4', 's1'],
          optionTypes: { s3: 'correct', s2: 'adjacent_item', s4: 'pattern_misread', s1: 'random' },
          hintZh: '问号前后都在变小。',
          hintEn: 'Sizes shrink on both sides of the blank.'
        },
        {
          patternType: 'shrink', level: 1,
          sequence: ['s4', 's3', '?', 's1'],
          answer: 's2',
          options: ['s2', 's3', 's1', 's4'],
          optionTypes: { s2: 'correct', s3: 'adjacent_item', s1: 'pattern_misread', s4: 'random' },
          hintZh: '保持同样步长继续变小。',
          hintEn: 'Keep the same shrinking step.'
        },
        {
          patternType: 'shrink', level: 2,
          sequence: ['s4', 's3', 's2', '?'],
          answer: 's1',
          options: ['s1', 's2', 's3', 's4'],
          optionTypes: { s1: 'correct', s2: 'adjacent_item', s3: 'pattern_misread', s4: 'random' },
          hintZh: '继续按变小的方向看。',
          hintEn: 'Keep following the shrinking direction.'
        },
        {
          patternType: 'shrink', level: 2,
          sequence: ['s4', 's3', '?', 's1'],
          answer: 's2',
          options: ['s2', 's3', 's1', 's4'],
          optionTypes: { s2: 'correct', s3: 'adjacent_item', s1: 'pattern_misread', s4: 'random' },
          hintZh: '中间缺失也按变小规律补上。',
          hintEn: 'Fill the middle blank with the shrinking rule.'
        },
        {
          patternType: 'shrink', level: 2,
          sequence: ['?', 's3', 's2', 's1'],
          answer: 's4',
          options: ['s4', 's3', 's2', 's1'],
          optionTypes: { s4: 'correct', s3: 'adjacent_item', s2: 'pattern_misread', s1: 'random' },
          hintZh: '从后三项反推第一项。',
          hintEn: 'Infer the first item from the final three.'
        }
      ]
    },
    {
      id: '3',
      icon: '🔁',
      nameZh: '一大一小交替',
      nameEn: 'Big-Small Alternation',
      descZh: '大小一大一小轮流出现',
      descEn: 'Big and small take turns',
      abilityTag: 'magnitude_perception',
      patternType: 'alternate',
      questions: [
        {
          patternType: 'alternate', level: 1,
          sequence: ['s4', 's1', 's4', '?'],
          answer: 's1',
          options: ['s1', 's4', 's3', 's2'],
          optionTypes: { s1: 'correct', s4: 'pattern_misread', s3: 'adjacent_item', s2: 'random' },
          hintZh: '大和小在交替出现。',
          hintEn: 'Big and small alternate in turns.'
        },
        {
          patternType: 'alternate', level: 1,
          sequence: ['s1', 's4', 's1', '?'],
          answer: 's4',
          options: ['s4', 's1', 's3', 's2'],
          optionTypes: { s4: 'correct', s1: 'pattern_misread', s3: 'adjacent_item', s2: 'random' },
          hintZh: '看清楚大小轮流变化。',
          hintEn: 'Follow the alternating size change.'
        },
        {
          patternType: 'alternate', level: 1,
          sequence: ['s4', 's1', '?', 's1'],
          answer: 's4',
          options: ['s4', 's1', 's2', 's3'],
          optionTypes: { s4: 'correct', s1: 'pattern_misread', s2: 'adjacent_item', s3: 'random' },
          hintZh: '问号位置也要保持交替。',
          hintEn: 'The blank should keep the alternation.'
        },
        {
          patternType: 'alternate', level: 2,
          sequence: ['s1', 's4', 's1', 's4', '?'],
          answer: 's1',
          options: ['s1', 's4', 's3', 's2'],
          optionTypes: { s1: 'correct', s4: 'pattern_misread', s3: 'adjacent_item', s2: 'random' },
          hintZh: '交替规律继续延伸。',
          hintEn: 'Extend the same alternating rule.'
        },
        {
          patternType: 'alternate', level: 2,
          sequence: ['s4', 's1', 's4', 's1', '?'],
          answer: 's4',
          options: ['s4', 's1', 's2', 's3'],
          optionTypes: { s4: 'correct', s1: 'pattern_misread', s2: 'adjacent_item', s3: 'random' },
          hintZh: '继续保持一大一小。',
          hintEn: 'Keep the big-small alternation.'
        },
        {
          patternType: 'alternate', level: 2,
          sequence: ['s1', 's4', '?', 's4'],
          answer: 's1',
          options: ['s1', 's4', 's2', 's3'],
          optionTypes: { s1: 'correct', s4: 'pattern_misread', s2: 'adjacent_item', s3: 'random' },
          hintZh: '中间缺失也按交替补上。',
          hintEn: 'Fill the blank while preserving alternation.'
        }
      ]
    },
    {
      id: '4',
      icon: '🔄',
      nameZh: '大小循环',
      nameEn: 'Size Cycle',
      descZh: '小中大中的循环规律',
      descEn: 'Follow the small-medium-large-medium cycle',
      abilityTag: 'magnitude_perception',
      patternType: 'cycle',
      questions: [
        {
          patternType: 'cycle', level: 1,
          sequence: ['s1', 's2', 's3', 's2', '?'],
          answer: 's1',
          options: ['s1', 's3', 's2', 's4'],
          optionTypes: { s1: 'correct', s3: 'cycle_misalign', s2: 'adjacent_item', s4: 'random' },
          hintZh: '循环像波浪：小中大中小。',
          hintEn: 'Wave cycle: small-medium-large-medium-small.'
        },
        {
          patternType: 'cycle', level: 1,
          sequence: ['s2', 's3', 's2', 's1', '?'],
          answer: 's2',
          options: ['s2', 's3', 's1', 's4'],
          optionTypes: { s2: 'correct', s3: 'cycle_misalign', s1: 'adjacent_item', s4: 'random' },
          hintZh: '找到循环单元再继续。',
          hintEn: 'Find the cycle unit and continue it.'
        },
        {
          patternType: 'cycle', level: 1,
          sequence: ['s3', 's2', 's1', 's2', '?'],
          answer: 's3',
          options: ['s3', 's2', 's1', 's4'],
          optionTypes: { s3: 'correct', s2: 'adjacent_item', s1: 'cycle_misalign', s4: 'random' },
          hintZh: '高点之后会回到中，再到低，再回中。',
          hintEn: 'After the peak it returns to medium, then low, then medium.'
        },
        {
          patternType: 'cycle', level: 2,
          sequence: ['s1', 's2', 's3', 's2', 's1', '?'],
          answer: 's2',
          options: ['s2', 's3', 's1', 's4'],
          optionTypes: { s2: 'correct', s3: 'cycle_misalign', s1: 'adjacent_item', s4: 'random' },
          hintZh: '看成一整段循环来判断。',
          hintEn: 'Treat it as one full cycle segment.'
        },
        {
          patternType: 'cycle', level: 2,
          sequence: ['s2', 's3', 's2', 's1', 's2', '?'],
          answer: 's3',
          options: ['s3', 's2', 's1', 's4'],
          optionTypes: { s3: 'correct', s2: 'adjacent_item', s1: 'cycle_misalign', s4: 'random' },
          hintZh: '循环会重复出现峰值。',
          hintEn: 'The cycle repeats its peak again.'
        },
        {
          patternType: 'cycle', level: 2,
          sequence: ['s3', 's2', 's1', 's2', 's3', '?'],
          answer: 's2',
          options: ['s2', 's1', 's3', 's4'],
          optionTypes: { s2: 'correct', s1: 'adjacent_item', s3: 'cycle_misalign', s4: 'random' },
          hintZh: '按镜像循环继续下一个位置。',
          hintEn: 'Continue the mirrored cycle to the next position.'
        }
      ]
    }
  ]
};
