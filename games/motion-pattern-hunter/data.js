/**
 * Motion Pattern Hunter — Game Data  v1.0.0  (Shell-1 format)
 * ─────────────────────────────────────────────────────────
 * Three units test distinct cognitive abilities:
 *   direction     → pattern_recognition  (direction sequence AB/ABC)
 *   action-combo  → working_memory       (action sequence AAB/ABB/ABC)
 *   position-jump → spatial_prediction   (step-based position prediction)
 *
 * Complexity levels (same scale across all units):
 *   L1: single repeat or fixed +1 step
 *   L2: AB alternation or fixed +2 step
 *   L3: ABC cycle or growing step (+1,+2,+3…)
 *
 * Direction values:  'left' | 'right' | 'up' | 'down'
 * Action values:     'jump' | 'squat' | 'turn' | 'run'
 * Track positions:   integers 1-trackSize
 *
 * optionTypes: 'correct' | 'adjacent_error' | 'rule_error' | 'mirror' |
 *              'random' | 'overshoot' | 'undershoot'
 */

var MPH_DATA = {
  units: [

    // ══════════════════════════════════════════════════════════
    // UNIT 1 — 方向规律 Direction Pattern
    // Ability tag: pattern_recognition
    // L1=repeat, L2=AB, L3=ABC
    // ══════════════════════════════════════════════════════════
    {
      id: 'direction',
      icon: '⬅️',
      nameZh: '方向规律', nameEn: 'Direction Pattern',
      descZh: '箭头下一步朝哪个方向？', descEn: 'Which way comes next?',
      abilityTag: 'pattern_recognition',
      questions: [
        // L1 single repeat
        {
          layout: 'direction',
          cells: ['left','left','left','?'],
          answer: 'left',
          options: ['left','right','up','down'],
          optionTypes: { 'left':'correct','right':'mirror','up':'rule_error','down':'random' },
          hintZh: '每次都朝同一个方向', hintEn: 'Same direction every time'
        },
        {
          layout: 'direction',
          cells: ['up','up','up','up','?'],
          answer: 'up',
          options: ['up','down','left','right'],
          optionTypes: { 'up':'correct','down':'mirror','left':'rule_error','right':'random' },
          hintZh: '每次都朝同一个方向', hintEn: 'Same direction every time'
        },
        // L2 AB alternation
        {
          layout: 'direction',
          cells: ['left','right','left','right','?'],
          answer: 'left',
          options: ['left','right','up','down'],
          optionTypes: { 'left':'correct','right':'adjacent_error','up':'rule_error','down':'random' },
          hintZh: '两个方向交替出现', hintEn: 'Two directions alternate'
        },
        {
          layout: 'direction',
          cells: ['up','down','up','down','?'],
          answer: 'up',
          options: ['up','down','left','right'],
          optionTypes: { 'up':'correct','down':'adjacent_error','left':'rule_error','right':'random' },
          hintZh: '两个方向交替出现', hintEn: 'Two directions alternate'
        },
        {
          layout: 'direction',
          cells: ['left','right','left','?'],
          answer: 'right',
          options: ['right','left','up','down'],
          optionTypes: { 'right':'correct','left':'adjacent_error','up':'rule_error','down':'random' },
          hintZh: '左右交替', hintEn: 'Left and right alternate'
        },
        // L3 ABC cycle
        {
          layout: 'direction',
          cells: ['left','right','up','left','right','?'],
          answer: 'up',
          options: ['up','left','right','down'],
          optionTypes: { 'up':'correct','left':'rule_error','right':'adjacent_error','down':'random' },
          hintZh: '三个方向循环：左右上', hintEn: 'Three-direction cycle: left-right-up'
        },
        {
          layout: 'direction',
          cells: ['up','down','left','up','down','?'],
          answer: 'left',
          options: ['left','up','down','right'],
          optionTypes: { 'left':'correct','up':'rule_error','down':'adjacent_error','right':'random' },
          hintZh: '三个方向循环：上下左', hintEn: 'Three-direction cycle: up-down-left'
        }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // UNIT 2 — 动作组合 Action Combo
    // Ability tag: working_memory
    // L1=repeat, L2=AB/AAB, L3=ABC
    // ══════════════════════════════════════════════════════════
    {
      id: 'action-combo',
      icon: '🤸',
      nameZh: '动作组合', nameEn: 'Action Combo',
      descZh: '下一个动作是什么？', descEn: 'What action comes next?',
      abilityTag: 'working_memory',
      questions: [
        // L1 single repeat
        {
          layout: 'action',
          cells: ['jump','jump','jump','?'],
          answer: 'jump',
          options: ['jump','squat','turn','run'],
          optionTypes: { 'jump':'correct','squat':'rule_error','turn':'random','run':'random' },
          hintZh: '只有一种动作一直重复', hintEn: 'One action keeps repeating'
        },
        {
          layout: 'action',
          cells: ['squat','squat','squat','?'],
          answer: 'squat',
          options: ['squat','jump','turn','run'],
          optionTypes: { 'squat':'correct','jump':'rule_error','turn':'random','run':'random' },
          hintZh: '只有一种动作一直重复', hintEn: 'One action keeps repeating'
        },
        // L2 AB alternation
        {
          layout: 'action',
          cells: ['jump','squat','jump','squat','?'],
          answer: 'jump',
          options: ['jump','squat','turn','run'],
          optionTypes: { 'jump':'correct','squat':'adjacent_error','turn':'rule_error','run':'random' },
          hintZh: '跳和蹲交替出现', hintEn: 'Jump and squat alternate'
        },
        {
          layout: 'action',
          cells: ['jump','turn','jump','turn','?'],
          answer: 'jump',
          options: ['jump','turn','squat','run'],
          optionTypes: { 'jump':'correct','turn':'adjacent_error','squat':'rule_error','run':'random' },
          hintZh: '跳和转交替出现', hintEn: 'Jump and turn alternate'
        },
        // L2 AAB
        {
          layout: 'action',
          cells: ['jump','jump','squat','jump','jump','?'],
          answer: 'squat',
          options: ['squat','jump','turn','run'],
          optionTypes: { 'squat':'correct','jump':'adjacent_error','turn':'rule_error','run':'random' },
          hintZh: '重复单元：跳跳蹲', hintEn: 'Unit: jump-jump-squat'
        },
        {
          layout: 'action',
          cells: ['squat','squat','jump','squat','squat','?'],
          answer: 'jump',
          options: ['jump','squat','turn','run'],
          optionTypes: { 'jump':'correct','squat':'adjacent_error','turn':'rule_error','run':'random' },
          hintZh: '重复单元：蹲蹲跳', hintEn: 'Unit: squat-squat-jump'
        },
        // L3 ABC cycle
        {
          layout: 'action',
          cells: ['jump','squat','turn','jump','squat','?'],
          answer: 'turn',
          options: ['turn','jump','squat','run'],
          optionTypes: { 'turn':'correct','jump':'rule_error','squat':'adjacent_error','run':'random' },
          hintZh: '三个动作循环：跳蹲转', hintEn: 'Cycle: jump-squat-turn'
        },
        {
          layout: 'action',
          cells: ['run','jump','squat','run','jump','?'],
          answer: 'squat',
          options: ['squat','run','jump','turn'],
          optionTypes: { 'squat':'correct','run':'rule_error','jump':'adjacent_error','turn':'random' },
          hintZh: '三个动作循环：跑跳蹲', hintEn: 'Cycle: run-jump-squat'
        }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // UNIT 3 — 跳跃位置 Position Jump
    // Ability tag: spatial_prediction
    // L1=step+1, L2=step+2, L3=growing step
    // Track: 10 cells (positions 1-10)
    // ══════════════════════════════════════════════════════════
    {
      id: 'position-jump',
      icon: '🏃',
      nameZh: '跳跃位置', nameEn: 'Position Jump',
      descZh: '下一步会跳到哪个格子？', descEn: 'Which cell comes next?',
      abilityTag: 'spatial_prediction',
      questions: [
        // L1: fixed step +1
        {
          layout: 'track',
          trackSize: 10,
          positions: [1, 2, 3, 4],
          answer: 5,
          options: [5, 6, 4, 3],
          optionTypes: { '5':'correct','6':'overshoot','4':'undershoot','3':'random' },
          hintZh: '每次向前走1格', hintEn: 'Move 1 step forward each time'
        },
        {
          layout: 'track',
          trackSize: 10,
          positions: [3, 4, 5, 6],
          answer: 7,
          options: [7, 8, 6, 2],
          optionTypes: { '7':'correct','8':'overshoot','6':'undershoot','2':'random' },
          hintZh: '每次向前走1格', hintEn: 'Move 1 step forward each time'
        },
        {
          layout: 'track',
          trackSize: 10,
          positions: [5, 6, 7],
          answer: 8,
          options: [8, 9, 7, 4],
          optionTypes: { '8':'correct','9':'overshoot','7':'undershoot','4':'random' },
          hintZh: '每次向前走1格', hintEn: 'Move 1 step forward each time'
        },
        // L2: fixed step +2
        {
          layout: 'track',
          trackSize: 10,
          positions: [1, 3, 5, 7],
          answer: 9,
          options: [9, 10, 7, 5],
          optionTypes: { '9':'correct','10':'overshoot','7':'undershoot','5':'random' },
          hintZh: '每次向前走2格', hintEn: 'Move 2 steps forward each time'
        },
        {
          layout: 'track',
          trackSize: 10,
          positions: [2, 4, 6],
          answer: 8,
          options: [8, 10, 6, 3],
          optionTypes: { '8':'correct','10':'overshoot','6':'undershoot','3':'random' },
          hintZh: '每次向前走2格', hintEn: 'Move 2 steps forward each time'
        },
        {
          layout: 'track',
          trackSize: 10,
          positions: [3, 5, 7],
          answer: 9,
          options: [9, 10, 7, 4],
          optionTypes: { '9':'correct','10':'overshoot','7':'undershoot','4':'random' },
          hintZh: '每次向前走2格', hintEn: 'Move 2 steps forward each time'
        },
        // L3: growing step (+1,+2,+3...)
        {
          layout: 'track',
          trackSize: 10,
          positions: [1, 2, 4],
          answer: 7,
          options: [7, 8, 5, 4],
          optionTypes: { '7':'correct','8':'overshoot','5':'undershoot','4':'adjacent_error' },
          hintZh: '步长在增加：+1, +2, +3…', hintEn: 'Steps grow: +1, +2, +3…'
        },
        {
          layout: 'track',
          trackSize: 10,
          positions: [1, 3, 6],
          answer: 10,
          options: [10, 9, 8, 5],
          optionTypes: { '10':'correct','9':'undershoot','8':'undershoot','5':'random' },
          hintZh: '步长在增加：+2, +3, +4…', hintEn: 'Steps grow: +2, +3, +4…'
        }
      ]
    }

  ]
};
