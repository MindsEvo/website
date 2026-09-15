'use strict';

// Static question bank. Every meta-type (quantity / part_whole / composition)
// trains felt intuition, not calculation fluency — see
// metadata/metathinking/number-sense.json for the ability boundaries.
var NS_DATA = {
  units: [
    {
      id: 'L1',
      icon: '🔢',
      nameZh: 'K1 · 一眼看出多少',
      nameEn: 'K1 · Sensing Quantity at a Glance',
      descZh: '5 以内的一眼数量感知，初识整体与部分。',
      descEn: 'Subitizing within 5, first look at whole-and-parts.',
      questions: [
        { type: 'quantity', mode: 'estimate', dots: 3, options: [2, 3, 4], answer: 1, flashMs: 1800,
          hintZh: '不用数，先感觉大概几个。', hintEn: 'Do not count — sense roughly how many.' },
        { type: 'quantity', mode: 'estimate', dots: 4, options: [3, 4, 5], answer: 1, flashMs: 1800,
          hintZh: '不用数，先感觉大概几个。', hintEn: 'Do not count — sense roughly how many.' },
        { type: 'quantity', mode: 'compare', leftDots: 2, rightDots: 4, options: ['left', 'right'], answer: 1, flashMs: 1800,
          hintZh: '哪边看起来更多？', hintEn: 'Which side looks like more?' },
        { type: 'quantity', mode: 'compare', leftDots: 5, rightDots: 3, options: ['left', 'right'], answer: 0, flashMs: 1800,
          hintZh: '哪边看起来更多？', hintEn: 'Which side looks like more?' },
        { type: 'part_whole', mode: 'find_pair', whole: 4, options: [[1, 3], [2, 1], [3, 3]], answer: 0,
          hintZh: '哪一对加起来正好是整体？', hintEn: 'Which pair adds up to the whole?' },
        { type: 'part_whole', mode: 'find_pair', whole: 5, options: [[2, 2], [2, 3], [4, 2]], answer: 1,
          hintZh: '哪一对加起来正好是整体？', hintEn: 'Which pair adds up to the whole?' },
        { type: 'part_whole', mode: 'find_missing_part', whole: 3, partA: 1, options: [1, 2, 3], answer: 1,
          hintZh: '整体减去已知的一份，剩下的就是另一份。', hintEn: 'The whole minus the known part leaves the other part.' }
      ]
    },
    {
      id: 'L2',
      icon: '🔢',
      nameZh: 'K2 · 估一估、拆一拆',
      nameEn: 'K2 · Estimating and Splitting',
      descZh: '10 以内的数量估计、整体与部分判断，接触拆分。',
      descEn: 'Estimating within 10, whole-part judgment, first splits.',
      questions: [
        { type: 'quantity', mode: 'estimate', dots: 6, options: [5, 6, 7], answer: 1, flashMs: 1600,
          hintZh: '不用数，先感觉大概几个。', hintEn: 'Do not count — sense roughly how many.' },
        { type: 'quantity', mode: 'estimate', dots: 8, options: [7, 8, 9], answer: 1, flashMs: 1600,
          hintZh: '不用数，先感觉大概几个。', hintEn: 'Do not count — sense roughly how many.' },
        { type: 'quantity', mode: 'compare', leftDots: 7, rightDots: 9, options: ['left', 'right'], answer: 1, flashMs: 1600,
          hintZh: '哪边看起来更多？', hintEn: 'Which side looks like more?' },
        { type: 'part_whole', mode: 'find_pair', whole: 7, options: [[3, 4], [2, 4], [5, 1]], answer: 0,
          hintZh: '哪一对加起来正好是整体？', hintEn: 'Which pair adds up to the whole?' },
        { type: 'part_whole', mode: 'find_missing_part', whole: 9, partA: 4, options: [4, 5, 6], answer: 1,
          hintZh: '整体减去已知的一份，剩下的就是另一份。', hintEn: 'The whole minus the known part leaves the other part.' },
        { type: 'part_whole', mode: 'find_missing_part', whole: 10, partA: 6, options: [3, 4, 5], answer: 1,
          hintZh: '整体减去已知的一份，剩下的就是另一份。', hintEn: 'The whole minus the known part leaves the other part.' },
        { type: 'composition', mode: 'count_ways', number: 6, options: [2, 3, 4], answer: 1,
          hintZh: '把 6 拆成两份，能有几种不同的拆法？', hintEn: 'Split 6 into two parts — how many different ways are there?' },
        { type: 'composition', mode: 'valid_check', number: 8, options: [[3, 5], [2, 6], [4, 5]], answer: 2,
          hintZh: '哪一对加起来不等于 8？', hintEn: 'Which pair does not add up to 8?' }
      ]
    },
    {
      id: 'L3',
      icon: '🔢',
      nameZh: 'G1 · 系统列举拆法',
      nameEn: 'G1 · Enumerating Splits Systematically',
      descZh: '20 以内的数量估计，系统列举一个数的多种拆法。',
      descEn: 'Estimating within 20, systematically enumerating a number’s splits.',
      questions: [
        { type: 'quantity', mode: 'estimate', dots: 12, options: [10, 12, 14], answer: 1, flashMs: 1400,
          hintZh: '不用数，先感觉大概几个。', hintEn: 'Do not count — sense roughly how many.' },
        { type: 'quantity', mode: 'compare', leftDots: 13, rightDots: 15, options: ['left', 'right'], answer: 1, flashMs: 1400,
          hintZh: '哪边看起来更多？', hintEn: 'Which side looks like more?' },
        { type: 'part_whole', mode: 'find_pair', whole: 14, options: [[6, 8], [7, 8], [5, 10]], answer: 0,
          hintZh: '哪一对加起来正好是整体？', hintEn: 'Which pair adds up to the whole?' },
        { type: 'part_whole', mode: 'find_missing_part', whole: 16, partA: 9, options: [6, 7, 8], answer: 1,
          hintZh: '整体减去已知的一份，剩下的就是另一份。', hintEn: 'The whole minus the known part leaves the other part.' },
        { type: 'part_whole', mode: 'find_missing_part', whole: 18, partA: 11, options: [6, 7, 8], answer: 1,
          hintZh: '整体减去已知的一份，剩下的就是另一份。', hintEn: 'The whole minus the known part leaves the other part.' },
        { type: 'composition', mode: 'count_ways', number: 10, options: [4, 5, 6], answer: 1,
          hintZh: '把 10 拆成两份，能有几种不同的拆法？', hintEn: 'Split 10 into two parts — how many different ways are there?' },
        { type: 'composition', mode: 'count_ways', number: 12, options: [5, 6, 7], answer: 1,
          hintZh: '把 12 拆成两份，能有几种不同的拆法？', hintEn: 'Split 12 into two parts — how many different ways are there?' },
        { type: 'composition', mode: 'valid_check', number: 15, options: [[7, 8], [6, 9], [5, 11]], answer: 2,
          hintZh: '哪一对加起来不等于 15？', hintEn: 'Which pair does not add up to 15?' }
      ]
    },
    {
      id: 'L4',
      icon: '🔢',
      nameZh: 'G2 · 验证多种拆法',
      nameEn: 'G2 · Verifying Multiple Splits',
      descZh: '以数的组合与拆分为主，验证拆法是否成立，数量感知退化为粗略估算。',
      descEn: 'Focused on composition, verifying whether splits are valid, quantity sense reduced to rough estimation.',
      questions: [
        { type: 'quantity', mode: 'estimate', dots: 18, options: [16, 18, 20], answer: 1, flashMs: 1200,
          hintZh: '不用数，先感觉大概几个。', hintEn: 'Do not count — sense roughly how many.' },
        { type: 'part_whole', mode: 'find_missing_part', whole: 17, partA: 9, options: [7, 8, 9], answer: 1,
          hintZh: '整体减去已知的一份，剩下的就是另一份。', hintEn: 'The whole minus the known part leaves the other part.' },
        { type: 'part_whole', mode: 'find_missing_part', whole: 19, partA: 12, options: [6, 7, 8], answer: 1,
          hintZh: '整体减去已知的一份，剩下的就是另一份。', hintEn: 'The whole minus the known part leaves the other part.' },
        { type: 'composition', mode: 'count_ways', number: 14, options: [6, 7, 8], answer: 1,
          hintZh: '把 14 拆成两份，能有几种不同的拆法？', hintEn: 'Split 14 into two parts — how many different ways are there?' },
        { type: 'composition', mode: 'count_ways', number: 16, options: [7, 8, 9], answer: 1,
          hintZh: '把 16 拆成两份，能有几种不同的拆法？', hintEn: 'Split 16 into two parts — how many different ways are there?' },
        { type: 'composition', mode: 'valid_check', number: 20, options: [[9, 11], [8, 12], [7, 14]], answer: 2,
          hintZh: '哪一对加起来不等于 20？', hintEn: 'Which pair does not add up to 20?' },
        { type: 'composition', mode: 'valid_check', number: 18, options: [[7, 11], [8, 10], [5, 14]], answer: 2,
          hintZh: '哪一对加起来不等于 18？', hintEn: 'Which pair does not add up to 18?' }
      ]
    }
  ]
};
