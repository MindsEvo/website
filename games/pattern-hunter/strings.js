/**
 * Pattern Hunter — Game Strings  v1.0.0
 * Game-specific translations, extends global i18n/strings.js
 */
shell.registerStrings({

  'ph.title':        { zh: '🎯 找规律',              en: '🎯 Pattern Hunter' },
  'ph.subtitle':     { zh: '循序渐进，掌握数字规律', en: 'Master number patterns step by step' },

  // Unit names & descriptions
  'ph.unit1.name':   { zh: '加法规律', en: 'Addition Pattern' },
  'ph.unit1.desc':   { zh: '每次加同样的数', en: 'Add the same number each time' },
  'ph.unit2.name':   { zh: '减法规律', en: 'Subtraction Pattern' },
  'ph.unit2.desc':   { zh: '每次减同样的数', en: 'Subtract the same number each time' },
  'ph.unit3.name':   { zh: '乘法规律', en: 'Multiplication Pattern' },
  'ph.unit3.desc':   { zh: '每次乘同样的数', en: 'Multiply by the same number each time' },
  'ph.unit4.name':   { zh: '差值规律', en: 'Growing Gaps' },
  'ph.unit4.desc':   { zh: '差本身也在变化', en: 'The gap itself changes each time' },
  'ph.unit5.name':   { zh: '综合规律', en: 'Mixed Patterns' },
  'ph.unit5.desc':   { zh: '先判断是哪种规律', en: 'Identify the pattern type first' },

  // Voice prompts
  'ph.voice.q':      { zh: '{0}，问号是几？', en: '{0}. What is the blank?' },
  'ph.voice.blank':  { zh: '问号',            en: 'blank' },

  // Gene labels (shown in result screen, friendly names)
  'gene.rule-induction': { zh: '规律归纳', en: 'Rule Induction' },
  'gene.pattern-recog':  { zh: '模式识别', en: 'Pattern Recognition' }

});
