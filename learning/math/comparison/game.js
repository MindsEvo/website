'use strict';

(function injectComparisonStyles() {
  if (document.getElementById('cmp-shell-style')) return;
  var s = document.createElement('style');
  s.id = 'cmp-shell-style';
  s.textContent = [
    '.cmp-wrap{display:grid;gap:10px;justify-items:center;}',
    '.cmp-q{font-size:22px;font-weight:900;color:#1e3a8a;line-height:1.3;text-align:center;}',
    '.cmp-sub{font-size:13px;font-weight:700;color:#64748b;text-align:center;}',
    '.cmp-preview{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:420px;}',
    '.cmp-pcell{background:#fff;border:1px solid #dbeafe;border-radius:12px;padding:10px 8px;display:grid;gap:6px;justify-items:center;}',
    '.cmp-pnum{font-size:13px;font-weight:800;color:#475569;}',
    '.cmp-dots{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;justify-items:center;}',
    '.cmp-dot{width:10px;height:10px;border-radius:50%;background:#60a5fa;box-shadow:0 1px 2px rgba(0,0,0,0.15);}',
    '.cmp-opt{display:grid;gap:8px;justify-items:center;align-content:center;min-height:66px;}',
    '.cmp-opt-num{font-size:32px;font-weight:900;color:#1e293b;line-height:1;}',
    '.cmp-opt-dots{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;justify-items:center;}',
    '.cmp-opt-dot{width:12px;height:12px;border-radius:50%;background:#3b82f6;box-shadow:0 1px 2px rgba(0,0,0,0.2);}',
    '.cmp-bar-wrap{display:block;width:100%;max-width:180px;height:14px;background:#e2e8f0;border-radius:999px;overflow:hidden;}',
    '.cmp-bar{display:block;height:100%;background:linear-gradient(90deg,#38bdf8,#0ea5e9);border-radius:999px;}',
    '.cmp-opt-bar{display:block;width:100%;max-width:170px;height:14px;background:#dbeafe;border-radius:999px;overflow:hidden;}',
    '.cmp-opt-barfill{display:block;height:100%;background:linear-gradient(90deg,#60a5fa,#2563eb);border-radius:999px;}',
    '.s1-opt{min-height:88px !important;}'
  ].join('');
  document.head.appendChild(s);
}());

function renderDots(count, dotClass, wrapClass) {
  var html = '<span class="' + wrapClass + '">';
  for (var i = 0; i < count; i++) {
    html += '<span class="' + dotClass + '"></span>';
  }
  html += '</span>';
  return html;
}

function getLengthPercent(q, value) {
  var minLen = typeof q.lenMin === 'number' ? q.lenMin : 3;
  var maxLen = typeof q.lenMax === 'number' ? q.lenMax : 12;
  var safeValue = typeof value === 'number' ? value : minLen;
  if (maxLen <= minLen) return 50;

  var clamped = Math.max(minLen, Math.min(maxLen, safeValue));
  var ratio = (clamped - minLen) / (maxLen - minLen);
  // Keep visible head/tail space while preserving proportional differences.
  return 28 + Math.round(ratio * 68);
}

function normalizeQuestion(raw, level, comparisonType) {
  var levelId = level && level.id ? String(level.id) : 'L0';
  var type = comparisonType || 'quantity';
  var objectComplexity = raw.mode === 'dots' || raw.mode === 'length' ? 'concrete' : 'symbolic';
  return {
    mode: raw.mode,
    a: raw.a,
    b: raw.b,
    askBigger: !!raw.askBigger,
    options: ['left', 'right'],
    answer: raw.correctSide,
    levelId: levelId,
    comparisonType: type,
    lengthStageZh: raw.lengthStageZh || '',
    lengthStageEn: raw.lengthStageEn || '',
    difficultyAxis: {
      object_complexity: objectComplexity,
      dimension_complexity: 'single',
      relation_complexity: 'direct',
      language_complexity: 'question',
      transfer_complexity: 'within-domain'
    },
    hintZh: type === 'spatial_visual'
      ? '先观察哪一项更长（或更短），再按题目要求选择。'
      : '先比较两个数值，再判断题目要求是更大还是更小。',
    hintEn: type === 'spatial_visual'
      ? 'Observe which item is longer (or shorter), then choose based on the prompt.'
      : 'Compare both values first, then check whether the prompt asks for bigger or smaller.'
  };
}

function buildUnitQuestions(level, comparisonType) {
  var questions = [];
  var maker = comparisonType === 'spatial_visual' ? makeLengthQuestion : makeQuestion;
  for (var i = 0; i < level.rounds; i++) {
    questions.push(normalizeQuestion(maker(level), level, comparisonType));
  }
  return questions;
}

var cmpUnits = [];
LEVELS.forEach(function (level) {
  var levelId = String(level.id || 'L0');

  // Quantity track (existing implementation)
  cmpUnits.push({
    id: levelId + '-Q',
    levelId: levelId,
    comparisonType: 'quantity',
    icon: '🔢',
    nameZh: level.nameZh + ' · 数量比较',
    nameEn: level.nameEn + ' · Quantity',
    descZh: level.refZh + ' · 判断数量大小',
    descEn: level.refEn + ' · Compare quantities',
    questions: buildUnitQuestions(level, 'quantity')
  });

  // Spatial-visual track (first non-numeric comparison example), L1-L2 only
  if (levelId === 'L1' || levelId === 'L2') {
    var lengthNameZh = levelId === 'L1' ? 'L1 · 基础长短比较' : 'L2 · 进阶长短比较';
    var lengthNameEn = levelId === 'L1' ? 'L1 · Basic Length' : 'L2 · Advanced Length';
    var lengthDescZh = levelId === 'L1' ? '参考背景：一年级上学期 · 差异明显的长短判断' : '参考背景：一年级下学期 · 更大范围的长短判断';
    var lengthDescEn = levelId === 'L1' ? 'Ref: Grade 1 Sem 1 · Length with clear differences' : 'Ref: Grade 1 Sem 2 · Length over a wider range';
    cmpUnits.push({
      id: levelId + '-SV',
      levelId: levelId,
      comparisonType: 'spatial_visual',
      icon: '📏',
      nameZh: lengthNameZh,
      nameEn: lengthNameEn,
      descZh: lengthDescZh,
      descEn: lengthDescEn,
      questions: buildUnitQuestions(level, 'spatial_visual')
    });
  }
});

shell.createGame({
  id: 'learning-math-comparison',
  theme: { primary: '#2563eb', primary2: '#1d4ed8', bg: '#eff6ff' },
  gui: {
    header: { show: true, showBack: true },
    language: { enabled: true, default: 'zh' },
    audio: {
      music: { enabled: true, defaultOn: false },
      sound: { enabled: true, defaultOn: true }
    },
    history: { enabled: true },
    help: {
      enabled: true,
      contentZh: '先看题目要求是更大/更小，或更长/更短，再比较 A 与 B。',
      contentEn: 'Check whether the prompt asks for bigger/smaller or longer/shorter, then compare A and B.'
    }
  },
  title: { zh: '⚖️ 比较', en: '⚖️ Comparison' },
  subtitle: { zh: '判断哪个更大、更小、更长或更短', en: 'Decide which is bigger, smaller, longer, or shorter' },
  passScore: 6,
  units: cmpUnits,

  renderSequence: function (q, container) {
    var qText = '';
    if (q.mode === 'length') {
      qText = q.askBigger
        ? '<span class="zh">哪个更长？</span><span class="en">Which is longer?</span>'
        : '<span class="zh">哪个更短？</span><span class="en">Which is shorter?</span>';
    } else {
      qText = q.askBigger
        ? '<span class="zh">哪个更大？</span><span class="en">Which is bigger?</span>'
        : '<span class="zh">哪个更小？</span><span class="en">Which is smaller?</span>';
    }

    var leftPreview = '';
    var rightPreview = '';
    if (q.mode === 'dots') {
      leftPreview = renderDots(q.a, 'cmp-dot', 'cmp-dots');
      rightPreview = renderDots(q.b, 'cmp-dot', 'cmp-dots');
    } else if (q.mode === 'length') {
      leftPreview = '<span class="cmp-bar-wrap"><span class="cmp-bar" style="width:' + getLengthPercent(q, q.a) + '%"></span></span>';
      rightPreview = '<span class="cmp-bar-wrap"><span class="cmp-bar" style="width:' + getLengthPercent(q, q.b) + '%"></span></span>';
    } else {
      leftPreview = '<span class="cmp-opt-num">' + q.a + '</span>';
      rightPreview = '<span class="cmp-opt-num">' + q.b + '</span>';
    }

    var hintLine = q.mode === 'length'
      ? '<span class="zh">先观察哪根线段更长（或更短）</span><span class="en">Observe which bar is longer (or shorter)</span>'
      : '<span class="zh">先观察两个数，再选择答案</span><span class="en">Observe both values before choosing</span>';

    if (q.mode === 'length' && q.lengthStageZh) {
      hintLine += '<br><span class="zh">' + q.lengthStageZh + '</span><span class="en">' + (q.lengthStageEn || '') + '</span>';
    }

    container.innerHTML = '<div class="cmp-wrap">' +
      '<div class="cmp-q">' + qText + '</div>' +
      '<div class="cmp-sub">' + hintLine + '</div>' +
      '<div class="cmp-preview">' +
        '<div class="cmp-pcell">' + leftPreview + '<div class="cmp-pnum">A</div></div>' +
        '<div class="cmp-pcell">' + rightPreview + '<div class="cmp-pnum">B</div></div>' +
      '</div>' +
    '</div>';
  },

  renderOption: function (opt, q) {
    var value = opt === 'left' ? q.a : q.b;
    var body = '';
    if (q.mode === 'dots') {
      body = renderDots(value, 'cmp-opt-dot', 'cmp-opt-dots') + '<span class="cmp-opt-num">' + value + '</span>';
    } else if (q.mode === 'length') {
      body = '<span class="cmp-opt-bar"><span class="cmp-opt-barfill" style="width:' + getLengthPercent(q, value) + '%"></span></span>';
    } else {
      body = '<span class="cmp-opt-num">' + value + '</span>';
    }
    var label = opt === 'left'
      ? '<span class="zh">选 A</span><span class="en">Pick A</span>'
      : '<span class="zh">选 B</span><span class="en">Pick B</span>';
    return '<div class="cmp-opt">' + body + '<small>' + label + '</small></div>';
  },

  checkAnswer: function (selected, q) {
    return selected === q.answer;
  },

  getVoiceText: function (q) {
    if (q.mode === 'length') {
      return q.askBigger
        ? (shell.lang === 'zh' ? '哪一根更长？' : 'Which bar is longer?')
        : (shell.lang === 'zh' ? '哪一根更短？' : 'Which bar is shorter?');
    }
    return q.askBigger
      ? (shell.lang === 'zh' ? ('哪个更大，' + q.a + '还是' + q.b + '？') : ('Which is bigger, ' + q.a + ' or ' + q.b + '?'))
      : (shell.lang === 'zh' ? ('哪个更小，' + q.a + '还是' + q.b + '？') : ('Which is smaller, ' + q.a + ' or ' + q.b + '?'));
  },

  registerRootGenes: function (ctx) {
    var unit = (ctx && ctx.unit) || {};
    var unitId = String(unit.id || 'u0');
    return [
      'RG.LOGIC.COMPARISON.BASIC',
      'RG.LEARNING.MATH.COMPARISON.' + unitId
    ];
  },

  getReportContext: function (ctx) {
    var unit = (ctx && ctx.unit) || {};
    var levelId = String(unit.levelId || unit.id || 'L0').split('-')[0];
    var comparisonType = unit.comparisonType || 'quantity';
    var objectComplexity = comparisonType === 'spatial_visual' ? 'concrete' : (levelId === 'L1' ? 'concrete' : 'symbolic');
    return {
      moduleId: 'comparison',
      moduleType: 'metathinking',
      levelId: levelId,
      comparisonType: comparisonType,
      difficultyAxis: {
        object_complexity: objectComplexity,
        dimension_complexity: 'single',
        relation_complexity: 'direct',
        language_complexity: 'question',
        transfer_complexity: 'within-domain'
      },
      sourceGameId: 'learning-math-comparison'
    };
  }
});
