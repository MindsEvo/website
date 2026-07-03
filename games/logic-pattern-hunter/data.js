/**
 * Logic Pattern Hunter — Game Data  v1.0.0  (Shell-2 format)
 * ─────────────────────────────────────────────────────────
 * Shell-2: reasoning game (premises → conclusion).
 * pattern_type: comparison_chain
 *
 * Question fields:
 *   premises[]:    { zh, en }  — numbered premises
 *   questionZh/En              — the deduction question
 *   answer:        correct option id
 *   options[]:     option ids
 *   optionDefs:    { id: { zh, en } }
 *   optionTypes:   { id: error_type }
 *   hintZh/En
 *
 * error_type: correct | wrong_end | middle_item | irrelevant
 */

var LP_DATA = {
  units: [
    // ══════════════════════════════════════════════════════════
    // UNIT 1 — 比较推理基础  L1: 2 premises, 3 entities
    // ══════════════════════════════════════════════════════════
    {
      id: '1',
      icon: '🔍',
      nameZh: '比较推理',
      nameEn: 'Comparison Reasoning',
      descZh: '读懂条件，找出最高、最重、最快…',
      descEn: 'Read the clues and find the tallest, heaviest, fastest…',
      abilityTag: 'deductive_reasoning',
      questions: [
        {
          premises: [
            { zh: 'Tom 比 Jack 高', en: 'Tom is taller than Jack' },
            { zh: 'Jack 比 Amy 高', en: 'Jack is taller than Amy' }
          ],
          questionZh: '谁最高？',
          questionEn: 'Who is the tallest?',
          answer: 'opt_a',
          options: ['opt_a', 'opt_b', 'opt_c', 'opt_d'],
          optionDefs: {
            opt_a: { zh: 'Tom',    en: 'Tom' },
            opt_b: { zh: 'Jack',   en: 'Jack' },
            opt_c: { zh: 'Amy',    en: 'Amy' },
            opt_d: { zh: '无法确定', en: 'Cannot tell' }
          },
          optionTypes: { opt_a: 'correct', opt_b: 'middle_item', opt_c: 'wrong_end', opt_d: 'irrelevant' },
          hintZh: 'Tom 比 Jack 高，Jack 比 Amy 高，所以从高到低是 Tom → Jack → Amy。',
          hintEn: 'Tom > Jack > Amy, so Tom is the tallest.',
          pattern_type: 'comparison_chain', level: 1
        },
        {
          premises: [
            { zh: '苹果比橙子重', en: 'The apple is heavier than the orange' },
            { zh: '橙子比葡萄重', en: 'The orange is heavier than the grape' }
          ],
          questionZh: '哪个最轻？',
          questionEn: 'Which is the lightest?',
          answer: 'opt_c',
          options: ['opt_a', 'opt_b', 'opt_c', 'opt_d'],
          optionDefs: {
            opt_a: { zh: '苹果',   en: 'Apple' },
            opt_b: { zh: '橙子',   en: 'Orange' },
            opt_c: { zh: '葡萄',   en: 'Grape' },
            opt_d: { zh: '无法确定', en: 'Cannot tell' }
          },
          optionTypes: { opt_c: 'correct', opt_a: 'wrong_end', opt_b: 'middle_item', opt_d: 'irrelevant' },
          hintZh: '苹果 > 橙子 > 葡萄，所以葡萄最轻。',
          hintEn: 'Apple > Orange > Grape, so the grape is lightest.',
          pattern_type: 'comparison_chain', level: 1
        },
        {
          premises: [
            { zh: '猎豹比马跑得快', en: 'A cheetah runs faster than a horse' },
            { zh: '马比兔子跑得快', en: 'A horse runs faster than a rabbit' }
          ],
          questionZh: '哪个最快？',
          questionEn: 'Which is the fastest?',
          answer: 'opt_a',
          options: ['opt_a', 'opt_b', 'opt_c', 'opt_d'],
          optionDefs: {
            opt_a: { zh: '猎豹',   en: 'Cheetah' },
            opt_b: { zh: '马',     en: 'Horse' },
            opt_c: { zh: '兔子',   en: 'Rabbit' },
            opt_d: { zh: '无法确定', en: 'Cannot tell' }
          },
          optionTypes: { opt_a: 'correct', opt_b: 'middle_item', opt_c: 'wrong_end', opt_d: 'irrelevant' },
          hintZh: '猎豹 > 马 > 兔子，所以猎豹最快。',
          hintEn: 'Cheetah > Horse > Rabbit, so the cheetah is fastest.',
          pattern_type: 'comparison_chain', level: 1
        },
        {
          premises: [
            { zh: '大象比熊大', en: 'An elephant is bigger than a bear' },
            { zh: '熊比猫大',   en: 'A bear is bigger than a cat' }
          ],
          questionZh: '哪个最小？',
          questionEn: 'Which is the smallest?',
          answer: 'opt_c',
          options: ['opt_a', 'opt_b', 'opt_c', 'opt_d'],
          optionDefs: {
            opt_a: { zh: '大象',   en: 'Elephant' },
            opt_b: { zh: '熊',     en: 'Bear' },
            opt_c: { zh: '猫',     en: 'Cat' },
            opt_d: { zh: '无法确定', en: 'Cannot tell' }
          },
          optionTypes: { opt_c: 'correct', opt_a: 'wrong_end', opt_b: 'middle_item', opt_d: 'irrelevant' },
          hintZh: '大象 > 熊 > 猫，所以猫最小。',
          hintEn: 'Elephant > Bear > Cat, so the cat is smallest.',
          pattern_type: 'comparison_chain', level: 1
        },
        {
          premises: [
            { zh: '小红比小明高', en: 'Xiaohong is taller than Xiaoming' },
            { zh: '小明比小刚高', en: 'Xiaoming is taller than Xiaogang' }
          ],
          questionZh: '谁最矮？',
          questionEn: 'Who is the shortest?',
          answer: 'opt_c',
          options: ['opt_a', 'opt_b', 'opt_c', 'opt_d'],
          optionDefs: {
            opt_a: { zh: '小红',   en: 'Xiaohong' },
            opt_b: { zh: '小明',   en: 'Xiaoming' },
            opt_c: { zh: '小刚',   en: 'Xiaogang' },
            opt_d: { zh: '无法确定', en: 'Cannot tell' }
          },
          optionTypes: { opt_c: 'correct', opt_a: 'wrong_end', opt_b: 'middle_item', opt_d: 'irrelevant' },
          hintZh: '小红 > 小明 > 小刚，所以小刚最矮。',
          hintEn: 'Xiaohong > Xiaoming > Xiaogang, so Xiaogang is shortest.',
          pattern_type: 'comparison_chain', level: 1
        },
        {
          premises: [
            { zh: '铁比木头重', en: 'Iron is heavier than wood' },
            { zh: '木头比棉花重', en: 'Wood is heavier than cotton' }
          ],
          questionZh: '哪个最重？',
          questionEn: 'Which is the heaviest?',
          answer: 'opt_a',
          options: ['opt_a', 'opt_b', 'opt_c', 'opt_d'],
          optionDefs: {
            opt_a: { zh: '铁',     en: 'Iron' },
            opt_b: { zh: '木头',   en: 'Wood' },
            opt_c: { zh: '棉花',   en: 'Cotton' },
            opt_d: { zh: '无法确定', en: 'Cannot tell' }
          },
          optionTypes: { opt_a: 'correct', opt_b: 'middle_item', opt_c: 'wrong_end', opt_d: 'irrelevant' },
          hintZh: '铁 > 木头 > 棉花，所以铁最重。',
          hintEn: 'Iron > Wood > Cotton, so iron is heaviest.',
          pattern_type: 'comparison_chain', level: 1
        }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // UNIT 2 — 比较推理进阶  L2: 3 premises, 4 entities
    // ══════════════════════════════════════════════════════════
    {
      id: '2',
      icon: '🧠',
      nameZh: '比较推理进阶',
      nameEn: 'Comparison Reasoning II',
      descZh: '三条线索，推出排名中的任意位置',
      descEn: 'Three clues — deduce any position in the ranking',
      abilityTag: 'deductive_reasoning',
      questions: [
        {
          premises: [
            { zh: 'Tom 比 Jack 高',  en: 'Tom is taller than Jack' },
            { zh: 'Jack 比 Amy 高',  en: 'Jack is taller than Amy' },
            { zh: 'Amy 比 Bob 高',   en: 'Amy is taller than Bob' }
          ],
          questionZh: '谁第三高？',
          questionEn: 'Who is the third tallest?',
          answer: 'opt_c',
          options: ['opt_a', 'opt_b', 'opt_c', 'opt_d'],
          optionDefs: {
            opt_a: { zh: 'Tom', en: 'Tom' },
            opt_b: { zh: 'Jack', en: 'Jack' },
            opt_c: { zh: 'Amy',  en: 'Amy' },
            opt_d: { zh: 'Bob',  en: 'Bob' }
          },
          optionTypes: { opt_c: 'correct', opt_a: 'wrong_end', opt_b: 'middle_item', opt_d: 'wrong_end' },
          hintZh: '顺序是 Tom → Jack → Amy → Bob，第三高是 Amy。',
          hintEn: 'Order: Tom → Jack → Amy → Bob. Third is Amy.',
          pattern_type: 'comparison_chain', level: 2
        },
        {
          premises: [
            { zh: '苹果比橙子重', en: 'Apple is heavier than orange' },
            { zh: '橙子比葡萄重', en: 'Orange is heavier than grape' },
            { zh: '葡萄比草莓重', en: 'Grape is heavier than strawberry' }
          ],
          questionZh: '哪个最轻？',
          questionEn: 'Which is the lightest?',
          answer: 'opt_d',
          options: ['opt_a', 'opt_b', 'opt_c', 'opt_d'],
          optionDefs: {
            opt_a: { zh: '苹果', en: 'Apple' },
            opt_b: { zh: '橙子', en: 'Orange' },
            opt_c: { zh: '葡萄', en: 'Grape' },
            opt_d: { zh: '草莓', en: 'Strawberry' }
          },
          optionTypes: { opt_d: 'correct', opt_a: 'wrong_end', opt_b: 'middle_item', opt_c: 'middle_item' },
          hintZh: '苹果 > 橙子 > 葡萄 > 草莓，最轻是草莓。',
          hintEn: 'Apple > Orange > Grape > Strawberry. Lightest is strawberry.',
          pattern_type: 'comparison_chain', level: 2
        },
        {
          premises: [
            { zh: '猎豹比马快', en: 'Cheetah is faster than horse' },
            { zh: '马比狗快',   en: 'Horse is faster than dog' },
            { zh: '狗比兔子快', en: 'Dog is faster than rabbit' }
          ],
          questionZh: '哪个第三快？',
          questionEn: 'Which is the third fastest?',
          answer: 'opt_c',
          options: ['opt_a', 'opt_b', 'opt_c', 'opt_d'],
          optionDefs: {
            opt_a: { zh: '猎豹', en: 'Cheetah' },
            opt_b: { zh: '马',   en: 'Horse' },
            opt_c: { zh: '狗',   en: 'Dog' },
            opt_d: { zh: '兔子', en: 'Rabbit' }
          },
          optionTypes: { opt_c: 'correct', opt_a: 'wrong_end', opt_b: 'middle_item', opt_d: 'wrong_end' },
          hintZh: '猎豹 > 马 > 狗 > 兔子，第三快是狗。',
          hintEn: 'Cheetah > Horse > Dog > Rabbit. Third fastest is dog.',
          pattern_type: 'comparison_chain', level: 2
        },
        {
          premises: [
            { zh: '大象比熊大', en: 'Elephant is bigger than bear' },
            { zh: '熊比猫大',   en: 'Bear is bigger than cat' },
            { zh: '猫比老鼠大', en: 'Cat is bigger than mouse' }
          ],
          questionZh: '哪个最小？',
          questionEn: 'Which is the smallest?',
          answer: 'opt_d',
          options: ['opt_a', 'opt_b', 'opt_c', 'opt_d'],
          optionDefs: {
            opt_a: { zh: '大象', en: 'Elephant' },
            opt_b: { zh: '熊',   en: 'Bear' },
            opt_c: { zh: '猫',   en: 'Cat' },
            opt_d: { zh: '老鼠', en: 'Mouse' }
          },
          optionTypes: { opt_d: 'correct', opt_a: 'wrong_end', opt_b: 'middle_item', opt_c: 'middle_item' },
          hintZh: '大象 > 熊 > 猫 > 老鼠，最小是老鼠。',
          hintEn: 'Elephant > Bear > Cat > Mouse. Smallest is mouse.',
          pattern_type: 'comparison_chain', level: 2
        },
        {
          premises: [
            { zh: '小明比小红高', en: 'Xiaoming is taller than Xiaohong' },
            { zh: '小红比小刚高', en: 'Xiaohong is taller than Xiaogang' },
            { zh: '小刚比小美高', en: 'Xiaogang is taller than Xiaomei' }
          ],
          questionZh: '谁最矮？',
          questionEn: 'Who is the shortest?',
          answer: 'opt_d',
          options: ['opt_a', 'opt_b', 'opt_c', 'opt_d'],
          optionDefs: {
            opt_a: { zh: '小明', en: 'Xiaoming' },
            opt_b: { zh: '小红', en: 'Xiaohong' },
            opt_c: { zh: '小刚', en: 'Xiaogang' },
            opt_d: { zh: '小美', en: 'Xiaomei' }
          },
          optionTypes: { opt_d: 'correct', opt_a: 'wrong_end', opt_b: 'middle_item', opt_c: 'middle_item' },
          hintZh: '小明 > 小红 > 小刚 > 小美，最矮是小美。',
          hintEn: 'Xiaoming > Xiaohong > Xiaogang > Xiaomei. Shortest is Xiaomei.',
          pattern_type: 'comparison_chain', level: 2
        },
        {
          premises: [
            { zh: '红球比蓝球大', en: 'Red ball is bigger than blue ball' },
            { zh: '蓝球比绿球大', en: 'Blue ball is bigger than green ball' },
            { zh: '绿球比黄球大', en: 'Green ball is bigger than yellow ball' }
          ],
          questionZh: '哪个第二大？',
          questionEn: 'Which is the second biggest?',
          answer: 'opt_b',
          options: ['opt_a', 'opt_b', 'opt_c', 'opt_d'],
          optionDefs: {
            opt_a: { zh: '红球', en: 'Red' },
            opt_b: { zh: '蓝球', en: 'Blue' },
            opt_c: { zh: '绿球', en: 'Green' },
            opt_d: { zh: '黄球', en: 'Yellow' }
          },
          optionTypes: { opt_b: 'correct', opt_a: 'wrong_end', opt_c: 'middle_item', opt_d: 'wrong_end' },
          hintZh: '红 > 蓝 > 绿 > 黄，第二大是蓝球。',
          hintEn: 'Red > Blue > Green > Yellow. Second biggest is blue.',
          pattern_type: 'comparison_chain', level: 2
        }
      ]
    }
  ]
};
