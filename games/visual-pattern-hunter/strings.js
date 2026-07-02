/**
 * Visual Pattern Hunter — Game Strings  v1.0.0
 * Game-specific translations for visual/shape patterns
 */
shell.registerStrings({

  'vph.title':        { zh: '🎨 视觉规律',            en: '🎨 Visual Pattern Hunter' },
  'vph.subtitle':     { zh: '观察图形，发现规律',      en: 'Observe shapes and find patterns' },

  // Unit names & descriptions
  'vph.unit1.name':   { zh: '形状交替', en: 'Shape Alternation' },
  'vph.unit1.desc':   { zh: '观察图形交替出现的规律', en: 'Shapes take turns appearing' },
  'vph.unit2.name':   { zh: '数量递增', en: 'Quantity Growth' },
  'vph.unit2.desc':   { zh: '数量按规律增长', en: 'Count grows by pattern' },
  'vph.unit3.name':   { zh: '方向旋转', en: 'Rotation Pattern' },
  'vph.unit3.desc':   { zh: '观察方向的变化规律', en: 'Observe direction changes' },

  // Voice prompts
  'vph.voice.q':      { zh: '第{0}题，下一个是什么？', en: 'Question {0}, what comes next?' },
  'vph.voice.blank':  { zh: '问号',                    en: 'blank' },

  // Feedback
  'vph.correct':      { zh: '✓ 正确！',  en: '✓ Correct!' },
  'vph.wrong':        { zh: '✗ 不对哦',  en: '✗ Try again' },
  'vph.hint':         { zh: '💡 提示：{0}', en: '💡 Hint: {0}' },

  // Hints for each pattern type
  'vph.hint.shape':   { zh: '观察图形是怎样交替的', en: 'Look at how shapes alternate' },
  'vph.hint.count':   { zh: '数量在怎样变化？',     en: 'How is the count changing?' },
  'vph.hint.rotate':  { zh: '注意方向的旋转',       en: 'Notice the rotation direction' },

  // Gene labels (ability tags)
  'gene.shape-recog':    { zh: '形状识别', en: 'Shape Recognition' },
  'gene.spatial-rot':    { zh: '空间旋转', en: 'Spatial Rotation' },
  'gene.subitizing':     { zh: '快速计数', en: 'Subitizing' },
  'gene.pattern-vision': { zh: '视觉规律', en: 'Visual Pattern' }

});
