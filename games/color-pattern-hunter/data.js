/**
 * Color Pattern Hunter — Game Data  v1.0.0  (Shell-1 format)
 * ─────────────────────────────────────────────────────────
 * Three units test distinct cognitive abilities:
 *   color-repeat  → discrete sequence memory (AAB/ABB patterns)
 *   color-cycle   → row-based cycle recognition (3-color grid)
 *   color-pair    → working memory with compound units
 *
 * question fields:
 *   layout:     'linear' | 'grid' | 'pair'
 *   cells:      array of color names, '?' marks blank (linear/grid)
 *               array of [color,color] pairs, null marks blank (pair)
 *   cols:       grid columns (layout=grid only)
 *   answer:     string (linear/grid) or [c1,c2] array (pair)
 *   options:    4 choices (includes answer)
 *   optionTypes:map of option-key → error type for analytics
 *   hintZh/En:  hint text
 *
 * Color names: red | blue | yellow | green | purple | orange
 * optionTypes:  correct | adjacent_error | rule_error | random |
 *               order_reversed | half_wrong
 */

var CPH_DATA = {
  units: [

    // ══════════════════════════════════════════════════════════
    // UNIT 1 — 颜色重复 Color Repeat  (L1)
    // Ability tag: discrete-color-sequence
    // Patterns: AB / AAB / ABB
    // ══════════════════════════════════════════════════════════
    {
      id: 'color-repeat',
      icon: '🔴',
      nameZh: '颜色重复', nameEn: 'Color Repeat',
      descZh: '找出颜色重复的规律', descEn: 'Find the repeating color pattern',
      abilityTag: 'discrete-color-sequence',
      questions: [
        // AB pattern (easy, limited count)
        {
          layout: 'linear',
          cells: ['red','blue','red','blue','red','?'],
          answer: 'blue',
          options: ['blue','red','yellow','green'],
          optionTypes: { 'blue':'correct', 'red':'adjacent_error', 'yellow':'rule_error', 'green':'random' },
          hintZh: '红蓝交替出现', hintEn: 'Red and blue alternate'
        },
        {
          layout: 'linear',
          cells: ['yellow','green','yellow','green','yellow','?'],
          answer: 'green',
          options: ['green','yellow','blue','purple'],
          optionTypes: { 'green':'correct', 'yellow':'adjacent_error', 'blue':'rule_error', 'purple':'random' },
          hintZh: '黄绿交替出现', hintEn: 'Yellow and green alternate'
        },
        // AAB pattern (main L1 type)
        {
          layout: 'linear',
          cells: ['red','red','blue','red','red','?'],
          answer: 'blue',
          options: ['blue','red','yellow','green'],
          optionTypes: { 'blue':'correct', 'red':'adjacent_error', 'yellow':'rule_error', 'green':'random' },
          hintZh: '重复单元是：红红蓝', hintEn: 'Repeating unit: red-red-blue'
        },
        {
          layout: 'linear',
          cells: ['purple','purple','orange','purple','purple','?'],
          answer: 'orange',
          options: ['orange','purple','blue','red'],
          optionTypes: { 'orange':'correct', 'purple':'adjacent_error', 'blue':'rule_error', 'red':'random' },
          hintZh: '重复单元是：紫紫橙', hintEn: 'Repeating unit: purple-purple-orange'
        },
        {
          layout: 'linear',
          cells: ['green','green','yellow','green','green','?'],
          answer: 'yellow',
          options: ['yellow','green','red','blue'],
          optionTypes: { 'yellow':'correct', 'green':'adjacent_error', 'red':'rule_error', 'blue':'random' },
          hintZh: '重复单元是：绿绿黄', hintEn: 'Repeating unit: green-green-yellow'
        },
        // ABB pattern
        {
          layout: 'linear',
          cells: ['red','blue','blue','red','blue','?'],
          answer: 'blue',
          options: ['blue','red','yellow','orange'],
          optionTypes: { 'blue':'correct', 'red':'adjacent_error', 'yellow':'rule_error', 'orange':'random' },
          hintZh: '重复单元是：红蓝蓝', hintEn: 'Repeating unit: red-blue-blue'
        },
        {
          layout: 'linear',
          cells: ['yellow','purple','purple','yellow','purple','?'],
          answer: 'purple',
          options: ['purple','yellow','green','red'],
          optionTypes: { 'purple':'correct', 'yellow':'adjacent_error', 'green':'rule_error', 'red':'random' },
          hintZh: '重复单元是：黄紫紫', hintEn: 'Repeating unit: yellow-purple-purple'
        },
        // AAB with different position blank
        {
          layout: 'linear',
          cells: ['blue','blue','green','?','blue','green'],
          answer: 'blue',
          options: ['blue','green','red','yellow'],
          optionTypes: { 'blue':'correct', 'green':'rule_error', 'red':'random', 'yellow':'random' },
          hintZh: '重复单元是：蓝蓝绿', hintEn: 'Repeating unit: blue-blue-green'
        }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // UNIT 2 — 颜色循环 Color Cycle  (L2)
    // Ability tag: discrete-color-sequence
    // 3 colors in a fixed 3×3 grid; blank at varying positions
    // ══════════════════════════════════════════════════════════
    {
      id: 'color-cycle',
      icon: '🔄',
      nameZh: '颜色循环', nameEn: 'Color Cycle',
      descZh: '每行颜色顺序相同，找出缺少的那个', descEn: 'Each row repeats the same order',
      abilityTag: 'discrete-color-sequence',
      questions: [
        // Blank at position 0 (start of third row)
        {
          layout: 'grid', cols: 3,
          cells: ['red','yellow','blue', 'red','yellow','blue', '?','yellow','blue'],
          answer: 'red',
          options: ['red','yellow','blue','green'],
          optionTypes: { 'red':'correct', 'yellow':'order_error', 'blue':'order_error', 'green':'random' },
          hintZh: '看第一行，第一个是什么颜色？', hintEn: 'Look at row 1, what is the first color?'
        },
        // Blank at position 1 (middle of third row)
        {
          layout: 'grid', cols: 3,
          cells: ['red','yellow','blue', 'red','yellow','blue', 'red','?','blue'],
          answer: 'yellow',
          options: ['yellow','red','blue','purple'],
          optionTypes: { 'yellow':'correct', 'red':'order_error', 'blue':'order_error', 'purple':'random' },
          hintZh: '看第一行，第二个是什么颜色？', hintEn: 'Look at row 1, what is the second color?'
        },
        // Blank at position 2 (end of third row)
        {
          layout: 'grid', cols: 3,
          cells: ['green','purple','orange', 'green','purple','orange', 'green','purple','?'],
          answer: 'orange',
          options: ['orange','green','purple','red'],
          optionTypes: { 'orange':'correct', 'green':'order_error', 'purple':'order_error', 'red':'random' },
          hintZh: '看第一行，第三个是什么颜色？', hintEn: 'Look at row 1, what is the third color?'
        },
        // Different colors, blank in middle
        {
          layout: 'grid', cols: 3,
          cells: ['blue','red','green', 'blue','red','green', 'blue','?','green'],
          answer: 'red',
          options: ['red','blue','green','yellow'],
          optionTypes: { 'red':'correct', 'blue':'order_error', 'green':'order_error', 'yellow':'random' },
          hintZh: '每行顺序：蓝红绿', hintEn: 'Row order: blue-red-green'
        },
        // Blank in row 2 (not always row 3)
        {
          layout: 'grid', cols: 3,
          cells: ['yellow','blue','purple', 'yellow','?','purple', 'yellow','blue','purple'],
          answer: 'blue',
          options: ['blue','yellow','purple','orange'],
          optionTypes: { 'blue':'correct', 'yellow':'order_error', 'purple':'order_error', 'orange':'random' },
          hintZh: '看其他两行，第二个都是什么？', hintEn: 'Look at other rows, what is the second element?'
        },
        // Blank at start of row 2
        {
          layout: 'grid', cols: 3,
          cells: ['orange','green','red', '?','green','red', 'orange','green','red'],
          answer: 'orange',
          options: ['orange','green','red','blue'],
          optionTypes: { 'orange':'correct', 'green':'order_error', 'red':'order_error', 'blue':'random' },
          hintZh: '看其他两行，第一个都是什么？', hintEn: 'Look at other rows, what is the first element?'
        }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // UNIT 3 — 颜色对 Color Pair  (L4)
    // Ability tag: working-memory-compound
    // Color pairs as atomic units; AB or AAB alternation
    // Constraint: adjacent pairs must NOT share boundary colors
    // ══════════════════════════════════════════════════════════
    {
      id: 'color-pair',
      icon: '💛',
      nameZh: '颜色对', nameEn: 'Color Pair',
      descZh: '把两个颜色看成一个整体，找规律', descEn: 'Treat each color pair as one unit',
      abilityTag: 'working-memory-compound',
      questions: [
        // AB pair alternation: [red,blue] [yellow,green] [red,blue] [yellow,green] ?
        {
          layout: 'pair',
          cells: [['red','blue'],['yellow','green'],['red','blue'],['yellow','green'],null],
          answer: ['red','blue'],
          options: [['red','blue'],['blue','red'],['yellow','green'],['red','green']],
          optionTypes: {
            'red,blue':    'correct',
            'blue,red':    'order_reversed',
            'yellow,green':'rule_error',
            'red,green':   'half_wrong'
          },
          hintZh: '两种颜色对交替出现', hintEn: 'Two color pairs alternate'
        },
        {
          layout: 'pair',
          cells: [['purple','orange'],['blue','yellow'],['purple','orange'],['blue','yellow'],null],
          answer: ['purple','orange'],
          options: [['purple','orange'],['orange','purple'],['blue','yellow'],['purple','yellow']],
          optionTypes: {
            'purple,orange':'correct',
            'orange,purple':'order_reversed',
            'blue,yellow':  'rule_error',
            'purple,yellow':'half_wrong'
          },
          hintZh: '两种颜色对交替出现', hintEn: 'Two color pairs alternate'
        },
        // Blank not at end
        {
          layout: 'pair',
          cells: [['red','blue'],['green','yellow'],null,['green','yellow'],['red','blue']],
          answer: ['red','blue'],
          options: [['red','blue'],['blue','red'],['green','yellow'],['green','blue']],
          optionTypes: {
            'red,blue':   'correct',
            'blue,red':   'order_reversed',
            'green,yellow':'rule_error',
            'green,blue': 'half_wrong'
          },
          hintZh: '注意颜色对的顺序不能颠倒', hintEn: 'Pair order matters — do not reverse'
        },
        // AAB pair pattern: [A][A][B][A][A]?
        {
          layout: 'pair',
          cells: [['red','yellow'],['red','yellow'],['blue','green'],['red','yellow'],['red','yellow'],null],
          answer: ['blue','green'],
          options: [['blue','green'],['red','yellow'],['green','blue'],['blue','yellow']],
          optionTypes: {
            'blue,green': 'correct',
            'red,yellow': 'adjacent_error',
            'green,blue': 'order_reversed',
            'blue,yellow':'half_wrong'
          },
          hintZh: '重复单元是：同同不同', hintEn: 'Repeating unit: same-same-different'
        },
        {
          layout: 'pair',
          cells: [['purple','red'],['purple','red'],['orange','blue'],['purple','red'],['purple','red'],null],
          answer: ['orange','blue'],
          options: [['orange','blue'],['purple','red'],['blue','orange'],['orange','red']],
          optionTypes: {
            'orange,blue': 'correct',
            'purple,red':  'adjacent_error',
            'blue,orange': 'order_reversed',
            'orange,red':  'half_wrong'
          },
          hintZh: '重复单元是：同同不同', hintEn: 'Repeating unit: same-same-different'
        }
      ]
    }

  ]
};
