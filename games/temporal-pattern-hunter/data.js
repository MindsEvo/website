'use strict';

/**
 * Temporal Pattern Hunter — content VOCABULARY (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * generator.js builds every session from gradeConfig; there is no static bank.
 *
 * Life-event chains stay HAND-CURATED: each chain below is one reviewed,
 * culture-neutral order with a single sensible next step. The generator only
 * picks a chain; it never invents an order. Distractors for a chain are drawn
 * from earlier steps of the same chain or from chains of a different `domain`,
 * so no distractor can be an equally reasonable next step.
 *
 * Each grade row differs from the one above on at least one axis declared in
 * metadata/mindseeds/temporal-pattern.json:
 *   K1→K2  time_concept (event-order→day-season), cycle_length, option_count
 *   K2→G1  time_concept (day-season→week), cycle_length, blank_position
 *   G1→G2  time_concept (week→clock), cycle_length
 */

var TPH_DATA = {

  cards: {
    morning:   { e: '🌅', zh: '早上', en: 'Morning' },
    noon:      { e: '☀️', zh: '中午', en: 'Noon' },
    evening:   { e: '🌆', zh: '傍晚', en: 'Evening' },
    night:     { e: '🌙', zh: '夜晚', en: 'Night' },
    spring:    { e: '🌸', zh: '春天', en: 'Spring' },
    summer:    { e: '🌞', zh: '夏天', en: 'Summer' },
    autumn:    { e: '🍂', zh: '秋天', en: 'Autumn' },
    winter:    { e: '❄️', zh: '冬天', en: 'Winter' },
    mon:       { e: '1️⃣', zh: '周一', en: 'Mon' },
    tue:       { e: '2️⃣', zh: '周二', en: 'Tue' },
    wed:       { e: '3️⃣', zh: '周三', en: 'Wed' },
    thu:       { e: '4️⃣', zh: '周四', en: 'Thu' },
    fri:       { e: '5️⃣', zh: '周五', en: 'Fri' },
    sat:       { e: '6️⃣', zh: '周六', en: 'Sat' },
    sun:       { e: '7️⃣', zh: '周日', en: 'Sun' },
    wakeup:    { e: '🛏️', zh: '起床',   en: 'Wake up' },
    brush:     { e: '🪥', zh: '刷牙',   en: 'Brush teeth' },
    breakfast: { e: '🥣', zh: '吃早餐', en: 'Breakfast' },
    school:    { e: '🎒', zh: '上学',   en: 'Go to school' },
    bell:      { e: '🔔', zh: '放学',   en: 'School is out' },
    home:      { e: '🏠', zh: '回家',   en: 'Go home' },
    homework:  { e: '✏️', zh: '写作业', en: 'Homework' },
    dinner:    { e: '🍽️', zh: '吃晚饭', en: 'Dinner' },
    plant:     { e: '🌱', zh: '播种',   en: 'Plant seeds' },
    sprout:    { e: '🌿', zh: '发芽',   en: 'Sprout' },
    bloom:     { e: '🌼', zh: '开花',   en: 'Bloom' },
    harvest:   { e: '🍎', zh: '结果',   en: 'Bear fruit' },
    egg:       { e: '🥚', zh: '鸡蛋',   en: 'Egg' },
    hatch:     { e: '🐣', zh: '破壳',   en: 'Hatch' },
    chick:     { e: '🐥', zh: '小鸡',   en: 'Chick' },
    hen:       { e: '🐔', zh: '母鸡',   en: 'Hen' },
    washveg:   { e: '🥦', zh: '洗菜',   en: 'Wash veggies' },
    chopveg:   { e: '🔪', zh: '切菜',   en: 'Chop veggies' },
    cook:      { e: '🍳', zh: '炒菜',   en: 'Cook' },
    eat:       { e: '🍜', zh: '吃饭',   en: 'Eat' }
  },

  chains: [
    { id: 'morning',     domain: 'routine', steps: ['wakeup', 'brush', 'breakfast', 'school'] },
    { id: 'after-school', domain: 'routine', steps: ['bell', 'home', 'homework', 'dinner'] },
    { id: 'plant',       domain: 'nature',  steps: ['plant', 'sprout', 'bloom', 'harvest'] },
    { id: 'chick',       domain: 'nature',  steps: ['egg', 'hatch', 'chick', 'hen'] },
    { id: 'cooking',     domain: 'kitchen', steps: ['washveg', 'chopveg', 'cook', 'eat'] }
  ],

  cycles: {
    day:    ['morning', 'noon', 'evening', 'night'],
    season: ['spring', 'summer', 'autumn', 'winter'],
    week:   ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  },

  gradeConfig: {
    K1: { concept: 'event-order', optionCount: 3, blank: 'end' },
    K2: { concept: 'day-season',  cycles: ['day', 'season'], shown: 5, optionCount: 4, blank: 'end' },
    G1: { concept: 'week',        cycles: ['week'],          shown: 5, optionCount: 4, blank: 'any' },
    G2: { concept: 'clock',       steps: [2, 3, 4],          shown: 5, optionCount: 4, blank: 'any' }
  },

  units: {
    K1: {
      icon: '📅',
      nameZh: 'K1 · 接下来做什么', nameEn: 'K1 · What Happens Next',
      descZh: '生活中的事情有先后，下一步是什么？',
      descEn: 'Everyday things happen in order — what comes next?'
    },
    K2: {
      icon: '🌸',
      nameZh: 'K2 · 一天与四季', nameEn: 'K2 · Day and Seasons',
      descZh: '早中晚夜、春夏秋冬，转完一圈又回来。',
      descEn: 'Times of day and seasons go round and come back.'
    },
    G1: {
      icon: '🗓️',
      nameZh: 'G1 · 一星期', nameEn: 'G1 · The Week',
      descZh: '七天一轮，空格可能在中间。',
      descEn: 'Seven days go round; the gap may be in the middle.'
    },
    G2: {
      icon: '⏰',
      nameZh: 'G2 · 钟面时间', nameEn: 'G2 · Clock Time',
      descZh: '每次过几个小时？过了 12 点要从 1 点接着数。',
      descEn: 'How many hours pass each time? After 12, keep counting from 1.'
    }
  }
};
