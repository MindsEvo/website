/**
 * Temporal Pattern Hunter — Game Logic  v1.0.0  (Shell-1)
 * ─────────────────────────────────────────────────────────
 * No new shell.js or shell-1.css changes needed.
 * Reuses s1-motion-card style from motion-pattern-hunter.
 * Depends on: shell.js, data.js
 *
 * Ability tags (must NOT be merged in analytics):
 *   temporal_pattern_rule  ← cycle + interval (pure symbol reasoning)
 *   temporal_sequence      ← sequence (life schema / causal experience)
 * ─────────────────────────────────────────────────────────
 */

// ── Cycle icon + label lookup ──────────────────────────────────
// Week-day icons use the Chinese five-element system:
//   月(moon) 火(fire) 水(water) 木(wood) 金(star) 土(earth) 日(sun)
var TPH_CYCLE = {
  // Day periods
  morning:   { e: '🌅', zh: '早上',  en: 'Morning'   },
  noon:      { e: '☀️', zh: '中午',  en: 'Noon'      },
  afternoon: { e: '🌤️', zh: '下午',  en: 'Afternoon' },
  evening:   { e: '🌆', zh: '傍晚',  en: 'Evening'   },
  night:     { e: '🌙', zh: '夜晚',  en: 'Night'     },
  // Seasons
  spring:    { e: '🌸', zh: '春天',  en: 'Spring'    },
  summer:    { e: '🌞', zh: '夏天',  en: 'Summer'    },
  autumn:    { e: '🍂', zh: '秋天',  en: 'Autumn'    },
  winter:    { e: '❄️', zh: '冬天',  en: 'Winter'    },
  // Week (five-element icons make each day visually distinct)
  mon:       { e: '🌙', zh: '周一',  en: 'Mon'       },
  tue:       { e: '🔥', zh: '周二',  en: 'Tue'       },
  wed:       { e: '💧', zh: '周三',  en: 'Wed'       },
  thu:       { e: '🌲', zh: '周四',  en: 'Thu'       },
  fri:       { e: '⭐', zh: '周五',  en: 'Fri'       },
  sat:       { e: '🌍', zh: '周六',  en: 'Sat'       },
  sun:       { e: '☀️', zh: '周日',  en: 'Sun'       },
  // Cross-category / granularity traps (distractors only)
  rain:      { e: '🌧️', zh: '下雨',  en: 'Rain'      },
  moon:      { e: '🌕', zh: '月亮',  en: 'Moon'      },
  yesterday: { e: '📆', zh: '昨天',  en: 'Yesterday' },
  birthday:  { e: '🎂', zh: '生日',  en: 'Birthday'  },
  rule_error:{ e: '📅', zh: '?',     en: '?'         }
};

// ── Sequence event lookup ──────────────────────────────────────
var TPH_EVENTS = {
  wakeup:    { e: '🛏️', zh: '起床',   en: 'Wake Up'       },
  brush:     { e: '🪥', zh: '刷牙',   en: 'Brush Teeth'   },
  breakfast: { e: '🥣', zh: '吃早餐', en: 'Breakfast'     },
  school:    { e: '🎒', zh: '上学',   en: 'Go to School'  },
  study:     { e: '📚', zh: '上课',   en: 'In Class'      },
  bell:      { e: '🔔', zh: '下课',   en: 'Class Over'    },
  home:      { e: '🏠', zh: '回家',   en: 'Go Home'       },
  homework:  { e: '✏️', zh: '写作业', en: 'Homework'      },
  dinner:    { e: '🍽️', zh: '吃晚餐', en: 'Dinner'        },
  sleep:     { e: '😴', zh: '睡觉',   en: 'Sleep'         },
  bath:      { e: '🚿', zh: '洗澡',   en: 'Bath'          },
  plant:     { e: '🌱', zh: '播种',   en: 'Plant Seeds'   },
  sprout:    { e: '🌿', zh: '发芽',   en: 'Sprout'        },
  bloom:     { e: '🌸', zh: '开花',   en: 'Bloom'         },
  harvest:   { e: '🍎', zh: '结果',   en: 'Bear Fruit'    },
  washveg:   { e: '🥦', zh: '洗菜',   en: 'Wash Veggies'  },
  chopveg:   { e: '🔪', zh: '切菜',   en: 'Chop Veggies'  },
  cook:      { e: '🍳', zh: '炒菜',   en: 'Cook'          },
  eat:       { e: '🍜', zh: '吃饭',   en: 'Eat'           },
  rain:      { e: '🌧️', zh: '下雨',   en: 'Raining'       },
  nap:       { e: '💤', zh: '午睡',   en: 'Nap'           },
  play:      { e: '🎮', zh: '玩游戏', en: 'Play Games'    },
  stargazing:{ e: '⭐', zh: '看星星', en: 'Stargaze'      }
};

// ── Render helpers ─────────────────────────────────────────────
function cycleCard(item) {
  var c = TPH_CYCLE[item] || { e: item, zh: item, en: item };
  return '<span class="s1-motion-card">' + c.e +
    '<small><span class="zh">' + c.zh + '</span><span class="en">' + c.en + '</span></small>' +
    '</span>';
}

function timeCard(hour) {
  return '<span class="s1-motion-card" style="font-size:22px;font-weight:900">' +
    '<span class="zh">' + hour + '点</span>' +
    '<span class="en">' + hour + ':00</span>' +
    '</span>';
}

function eventCard(item) {
  var ev = TPH_EVENTS[item] || { e: '▪', zh: item, en: item };
  return '<span class="s1-motion-card">' + ev.e +
    '<small><span class="zh">' + ev.zh + '</span><span class="en">' + ev.en + '</span></small>' +
    '</span>';
}

function renderCard(cell, layout) {
  if (cell === '?') return '<span class="mystery">?</span>';
  if (layout === 'cycle')    return cycleCard(cell);
  if (layout === 'interval') return timeCard(cell);
  return eventCard(cell);
}

// ── Error type tracking ────────────────────────────────────────
var _errorLog = {};

// ── Shell-1 game config ───────────────────────────────────────
shell.createGame({
  id:            'temporal-pattern-hunter',
  parallelUnits: true,   // 3 units test different abilities — all unlocked
  theme:         { primary: '#8b5cf6', primary2: '#ec4899', bg: '#fdf4ff' },
  title:         { zh: '⏰ 时间规律',              en: '⏰ Temporal Pattern'     },
  subtitle:      { zh: '看懂时间的顺序，预测下一刻', en: 'Read time patterns, predict what comes next' },
  passScore:     5,
  units:         TPH_DATA.units,

  // ── Render question sequence (linear for all 3 types) ────────
  renderSequence: function (q, container, unit) {
    container.parentElement.classList.remove('s1-seq--track');
    container.innerHTML = q.cells.map(function (cell) {
      return renderCard(cell, q.layout);
    }).join(' ');
  },

  // ── Render each option button ─────────────────────────────────
  renderOption: function (opt, q, unit) {
    return renderCard(opt, q.layout);
  },

  // ── Answer checking ───────────────────────────────────────────
  checkAnswer: function (selected, q) {
    if (q.layout === 'interval') return Number(selected) === Number(q.answer);
    return selected === q.answer;
  },

  // ── Error analytics — feeds ability tags separately ───────────
  onAnswer: function (selected, q, isCorrect) {
    var key  = String(selected);
    var type = (q.optionTypes && q.optionTypes[key]) || (isCorrect ? 'correct' : 'unknown');
    TPH_DATA.units.forEach(function (unit) {
      if (unit.questions.indexOf(q) !== -1) {
        var tag = unit.abilityTag;           // 'temporal_pattern_rule' OR 'temporal_sequence'
        if (!_errorLog[tag]) _errorLog[tag] = {};
        _errorLog[tag][type] = (_errorLog[tag][type] || 0) + 1;
      }
    });
  },

  // ── Voice prompt ──────────────────────────────────────────────
  getVoiceText: function (q, idx) {
    if (q.layout === 'interval') {
      return shell.lang === 'zh'
        ? '第' + (idx + 1) + '题，下一个时刻是几点？'
        : 'Question ' + (idx + 1) + ', what time comes next?';
    }
    return shell.lang === 'zh'
      ? '第' + (idx + 1) + '题，下一个是什么？'
      : 'Question ' + (idx + 1) + ', what comes next?';
  }
});
