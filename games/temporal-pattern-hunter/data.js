/**
 * Temporal Pattern Hunter — Game Data  v1.0.0  (Shell-1 format)
 * ─────────────────────────────────────────────────────────
 * Three units test two distinct cognitive abilities:
 *
 *   cycle    → temporal_pattern_rule  (pure symbol-pattern reasoning)
 *   interval → temporal_pattern_rule  (same: symbol-pattern reasoning)
 *   sequence → temporal_sequence      (life schema / causal experience)
 *
 * IMPORTANT: cycle+interval share one ability tag; sequence has its own.
 * Stats must NOT be merged across these two tags.
 *
 * Complexity per unit:
 *   cycle:    L1=3-step day/night, L2=4-step seasons, L3=7-step week
 *   interval: L1=fixed +1h,        L2=fixed +2h,      L3=growing step
 *   sequence: L1=3-step chain,     L2=4-5-step chain  (L3 ordering deferred)
 *
 * optionTypes — cycle:    'correct'|'cycle_misalign'|'category_confusion'|
 *                          'granularity_confusion'|'adjacent_error'|'random'
 *             — interval: 'correct'|'overshoot'|'undershoot'|'adjacent_error'|'random'
 *             — sequence: 'correct'|'wrong_order'|'logic_conflict'|'irrelevant_event'
 */

var TPH_DATA = {
  units: [

    // ══════════════════════════════════════════════════════════
    // UNIT 1 — 周期循环 Cycle Pattern
    // Ability tag: temporal_pattern_rule
    // L1=昼夜(3), L2=季节(4), L3=星期(7)
    // ══════════════════════════════════════════════════════════
    {
      id: 'cycle',
      icon: '🌸',
      nameZh: '周期循环', nameEn: 'Cycle Pattern',
      descZh: '找出时间周期的规律', descEn: 'Find the repeating time cycle',
      abilityTag: 'temporal_pattern_rule',
      questions: [
        // L1: 昼夜 3-step
        {
          layout: 'cycle',
          cells: ['morning','noon','evening','?'],
          answer: 'night',
          options: ['night','morning','rain','yesterday'],
          optionTypes: { 'night':'correct','morning':'cycle_misalign','rain':'category_confusion','yesterday':'granularity_confusion' },
          hintZh: '早上→中午→傍晚→？', hintEn: 'Morning→Noon→Evening→?'
        },
        {
          layout: 'cycle',
          cells: ['evening','night','morning','?'],
          answer: 'noon',
          options: ['noon','evening','spring','moon'],
          optionTypes: { 'noon':'correct','evening':'cycle_misalign','spring':'category_confusion','moon':'random' },
          hintZh: '一天的时段是循环的', hintEn: 'The day periods form a cycle'
        },
        {
          layout: 'cycle',
          cells: ['night','morning','?','evening'],
          answer: 'noon',
          options: ['noon','afternoon','night','birthday'],
          optionTypes: { 'noon':'correct','afternoon':'cycle_misalign','night':'adjacent_error','birthday':'random' },
          hintZh: '早上和傍晚中间是什么时候？', hintEn: 'What comes between morning and evening?'
        },
        // L2: 季节 4-step
        {
          layout: 'cycle',
          cells: ['spring','summer','autumn','?'],
          answer: 'winter',
          options: ['winter','spring','rain','moon'],
          optionTypes: { 'winter':'correct','spring':'cycle_misalign','rain':'category_confusion','moon':'random' },
          hintZh: '春夏秋之后是什么季节？', hintEn: 'After spring-summer-autumn comes?'
        },
        {
          layout: 'cycle',
          cells: ['summer','autumn','winter','?'],
          answer: 'spring',
          options: ['spring','summer','noon','rain'],
          optionTypes: { 'spring':'correct','summer':'cycle_misalign','noon':'granularity_confusion','rain':'category_confusion' },
          hintZh: '四季循环，冬天之后重新开始', hintEn: 'Four seasons cycle — winter leads back to the start'
        },
        {
          layout: 'cycle',
          cells: ['autumn','winter','?','summer'],
          answer: 'spring',
          options: ['spring','autumn','rain','yesterday'],
          optionTypes: { 'spring':'correct','autumn':'adjacent_error','rain':'category_confusion','yesterday':'granularity_confusion' },
          hintZh: '冬天和夏天中间是什么季节？', hintEn: 'What season falls between winter and summer?'
        },
        // L3: 星期 7-step (partial sequence shown)
        {
          layout: 'cycle',
          cells: ['mon','tue','wed','thu','?'],
          answer: 'fri',
          options: ['fri','mon','sat','wed'],
          optionTypes: { 'fri':'correct','mon':'cycle_misalign','sat':'rule_error','wed':'adjacent_error' },
          hintZh: '七天一循环：一二三四五六日', hintEn: 'Seven-day cycle: Mon through Sun'
        },
        {
          layout: 'cycle',
          cells: ['fri','sat','sun','mon','?'],
          answer: 'tue',
          options: ['tue','fri','wed','sun'],
          optionTypes: { 'tue':'correct','fri':'cycle_misalign','wed':'rule_error','sun':'adjacent_error' },
          hintZh: '周日之后是周一，周一之后是？', hintEn: 'Sun→Mon, Mon→?'
        }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // UNIT 2 — 时间间隔 Time Interval
    // Ability tag: temporal_pattern_rule
    // L1=+1h, L2=+2h, L3=growing step
    // Range: 1-12 (no wraparound, no negative steps)
    // cells: numbers representing hours
    // ══════════════════════════════════════════════════════════
    {
      id: 'interval',
      icon: '⏰',
      nameZh: '时间间隔', nameEn: 'Time Interval',
      descZh: '下一个时刻是几点？', descEn: 'What time comes next?',
      abilityTag: 'temporal_pattern_rule',
      questions: [
        // L1: +1 hour
        {
          layout: 'interval',
          cells: [1,2,3,'?'],
          answer: 4,
          options: [4,5,3,7],
          optionTypes: { '4':'correct','5':'overshoot','3':'undershoot','7':'random' },
          hintZh: '每次加1小时', hintEn: 'Add 1 hour each time'
        },
        {
          layout: 'interval',
          cells: [4,5,6,'?'],
          answer: 7,
          options: [7,8,6,2],
          optionTypes: { '7':'correct','8':'overshoot','6':'undershoot','2':'random' },
          hintZh: '每次加1小时', hintEn: 'Add 1 hour each time'
        },
        {
          layout: 'interval',
          cells: [7,8,'?',10],
          answer: 9,
          options: [9,10,8,5],
          optionTypes: { '9':'correct','10':'rule_error','8':'undershoot','5':'random' },
          hintZh: '8点和10点中间是几点？', hintEn: 'What time is between 8:00 and 10:00?'
        },
        // L2: +2 hours
        {
          layout: 'interval',
          cells: [1,3,5,'?'],
          answer: 7,
          options: [7,9,5,2],
          optionTypes: { '7':'correct','9':'overshoot','5':'undershoot','2':'random' },
          hintZh: '每次加2小时', hintEn: 'Add 2 hours each time'
        },
        {
          layout: 'interval',
          cells: [2,4,6,'?'],
          answer: 8,
          options: [8,10,6,3],
          optionTypes: { '8':'correct','10':'overshoot','6':'undershoot','3':'random' },
          hintZh: '每次加2小时', hintEn: 'Add 2 hours each time'
        },
        {
          layout: 'interval',
          cells: [3,5,'?',9],
          answer: 7,
          options: [7,8,5,1],
          optionTypes: { '7':'correct','8':'rule_error','5':'adjacent_error','1':'random' },
          hintZh: '5点和9点中间是几点？', hintEn: 'What time is between 5:00 and 9:00?'
        },
        // L3: growing step (+1,+2,+3…)
        {
          layout: 'interval',
          cells: [1,2,4,'?'],
          answer: 7,
          options: [7,8,5,4],
          optionTypes: { '7':'correct','8':'overshoot','5':'undershoot','4':'adjacent_error' },
          hintZh: '间隔在增加：+1, +2, +3…', hintEn: 'Gaps grow: +1, +2, +3…'
        },
        {
          layout: 'interval',
          cells: [2,4,7,'?'],
          answer: 11,
          options: [11,12,9,6],
          optionTypes: { '11':'correct','12':'overshoot','9':'undershoot','6':'random' },
          hintZh: '间隔在增加：+2, +3, +4…', hintEn: 'Gaps grow: +2, +3, +4…'
        }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // UNIT 3 — 先后顺序 Sequence Order
    // Ability tag: temporal_sequence (DIFFERENT from cycle+interval!)
    // MANUALLY CURATED — no auto-generation; all questions reviewed for
    // uniqueness and cultural consensus (no family-specific routines).
    // L1=3-step predict 4th, L2=4-5-step predict next
    // L3 (ordering task / drag-drop) deferred to future version
    // ══════════════════════════════════════════════════════════
    {
      id: 'sequence',
      icon: '📅',
      nameZh: '先后顺序', nameEn: 'What Comes Next?',
      descZh: '生活中事情的顺序是什么？', descEn: 'What happens next in daily life?',
      abilityTag: 'temporal_sequence',
      questions: [
        // L1: 3-step morning routine
        {
          layout: 'sequence',
          cells: ['wakeup','brush','breakfast','?'],
          answer: 'school',
          options: ['school','sleep','bath','stargazing'],
          optionTypes: { 'school':'correct','sleep':'logic_conflict','bath':'wrong_order','stargazing':'irrelevant_event' },
          hintZh: '早上准备好了，接下来要去哪里？', hintEn: 'Ready in the morning — where do you go next?'
        },
        // L1: 3-step cooking
        {
          layout: 'sequence',
          cells: ['washveg','chopveg','cook','?'],
          answer: 'eat',
          options: ['eat','washveg','chopveg','play'],
          optionTypes: { 'eat':'correct','washveg':'wrong_order','chopveg':'adjacent_error','play':'irrelevant_event' },
          hintZh: '洗菜切菜炒菜之后是什么？', hintEn: 'After washing, chopping, and cooking…?'
        },
        // L1: 3-step plant growth
        {
          layout: 'sequence',
          cells: ['plant','sprout','bloom','?'],
          answer: 'harvest',
          options: ['harvest','plant','rain','nap'],
          optionTypes: { 'harvest':'correct','plant':'cycle_misalign','rain':'irrelevant_event','nap':'irrelevant_event' },
          hintZh: '植物生长：播种→发芽→开花→？', hintEn: 'Plant growth: seed→sprout→bloom→?'
        },
        // L1: 3-step after-school
        {
          layout: 'sequence',
          cells: ['bell','home','homework','?'],
          answer: 'dinner',
          options: ['dinner','bell','study','breakfast'],
          optionTypes: { 'dinner':'correct','bell':'logic_conflict','study':'wrong_order','breakfast':'logic_conflict' },
          hintZh: '做完作业，接下来是什么？', hintEn: 'After finishing homework, what comes next?'
        },
        // L2: 4-step school day
        {
          layout: 'sequence',
          cells: ['wakeup','brush','breakfast','school','?'],
          answer: 'study',
          options: ['study','sleep','homework','stargazing'],
          optionTypes: { 'study':'correct','sleep':'logic_conflict','homework':'wrong_order','stargazing':'irrelevant_event' },
          hintZh: '到了学校要做什么？', hintEn: 'What do you do when you arrive at school?'
        },
        // L2: 4-step bedtime routine
        {
          layout: 'sequence',
          cells: ['dinner','bath','brush','?'],
          answer: 'sleep',
          options: ['sleep','wakeup','cook','breakfast'],
          optionTypes: { 'sleep':'correct','wakeup':'logic_conflict','cook':'wrong_order','breakfast':'logic_conflict' },
          hintZh: '吃完饭洗完澡刷完牙，接下来是？', hintEn: 'After dinner, bath, and brushing teeth…?'
        },
        // L2: 4-step after-school full chain
        {
          layout: 'sequence',
          cells: ['school','study','bell','home','?'],
          answer: 'homework',
          options: ['homework','school','nap','breakfast'],
          optionTypes: { 'homework':'correct','school':'wrong_order','nap':'wrong_order','breakfast':'logic_conflict' },
          hintZh: '放学回家后，通常先做什么？', hintEn: 'Back home after school — what comes first?'
        }
      ]
    }

  ]
};
