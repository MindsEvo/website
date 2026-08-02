'use strict';

(function injectNumberSenseStyles() {
  if (document.getElementById('ns-shell-style')) return;
  var s = document.createElement('style');
  s.id = 'ns-shell-style';
  s.textContent = [
    '.ns-wrap{display:grid;gap:10px;justify-items:center;}',
    '.ns-q{font-size:22px;font-weight:900;color:#92400e;line-height:1.35;text-align:center;}',
    '.ns-sub{font-size:13px;font-weight:700;color:#64748b;text-align:center;}',
    '.ns-expr{font-size:26px;font-weight:900;color:#1e293b;letter-spacing:1px;}',
    '.ns-opt{display:grid;gap:8px;justify-items:center;align-content:center;min-height:68px;}',
    '.ns-chip{font-size:12px;font-weight:800;padding:4px 8px;border-radius:999px;background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;}',
    '.ns-opt-val{font-size:28px;font-weight:900;color:#0f172a;line-height:1;}',
    '.ns-pair{font-size:24px;font-weight:900;color:#1e293b;}',
    '.s1-opt{min-height:90px !important;}'
  ].join('');
  document.head.appendChild(s);
}());

function normalizeNsQuestion(raw) {
  var options = raw.options.map(function (_, idx) { return idx; });
  return {
    type: raw.type,
    target: raw.target,
    left: raw.left,
    sum: raw.sum,
    options: options,
    answer: raw.answerIndex,
    source: raw,
    hintZh: '先识别题型，再计算或比较后作答。',
    hintEn: 'Identify the question type first, then compute or compare before answering.'
  };
}

var nsUnits = LEVELS.map(function (level) {
  var questions = [];
  for (var i = 0; i < level.rounds; i++) {
    questions.push(normalizeNsQuestion(makeQuestion(level)));
  }
  return {
    id: level.id,
    icon: '🔢',
    nameZh: level.nameZh,
    nameEn: level.nameEn,
    descZh: level.refZh,
    descEn: level.refEn,
    questions: questions
  };
});

shell.createGame({
  id: 'learning-math-number-sense',
  theme: { primary: '#d97706', primary2: '#f59e0b', bg: '#fffbeb' },
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
      contentZh: '先看清题型：拆分、接近还是补全，再用最快方式估算或计算。',
      contentEn: 'Identify whether it is split, proximity, or completion, then estimate or calculate quickly.'
    }
  },
  title: { zh: '🔢 数感', en: '🔢 Number Sense' },
  subtitle: { zh: '拆分、接近与补全练习', en: 'Split, proximity, and completion practice' },
  passScore: 6,
  units: nsUnits,

  renderSequence: function (q, container) {
    var qTypeChip = q.type === 'split'
      ? '<span class="ns-chip">split</span>'
      : q.type === 'proximity'
        ? '<span class="ns-chip">proximity</span>'
        : '<span class="ns-chip">complete</span>';

    var body = '';
    if (q.type === 'split') {
      body = '<div class="ns-q"><span class="zh">' + q.target + ' 可以拆成哪一组？</span><span class="en">Which pair makes ' + q.target + '?</span></div>';
    } else if (q.type === 'proximity') {
      body = '<div class="ns-q"><span class="zh">哪个更接近 ' + q.target + '？</span><span class="en">Which is closer to ' + q.target + '?</span></div>';
    } else {
      body = '<div class="ns-expr">' + q.left + ' + __ = ' + q.sum + '</div>' +
        '<div class="ns-sub"><span class="zh">选择正确的补数</span><span class="en">Choose the missing addend</span></div>';
    }

    container.innerHTML = '<div class="ns-wrap">' + qTypeChip + body + '</div>';
  },

  renderOption: function (opt, q) {
    var original = q.source.options[opt];
    if (q.type === 'split' && Array.isArray(original)) {
      return '<div class="ns-opt"><div class="ns-pair">' + original[0] + ' + ' + original[1] + '</div></div>';
    }
    return '<div class="ns-opt"><div class="ns-opt-val">' + String(original) + '</div></div>';
  },

  checkAnswer: function (selected, q) {
    return selected === q.answer;
  },

  getVoiceText: function (q) {
    if (q.type === 'split') {
      return shell.lang === 'zh'
        ? (q.target + '可以拆成哪一组？')
        : ('Which pair makes ' + q.target + '?');
    }
    if (q.type === 'proximity') {
      return shell.lang === 'zh'
        ? ('哪个更接近' + q.target + '？')
        : ('Which is closer to ' + q.target + '?');
    }
    return shell.lang === 'zh'
      ? (q.left + '加几等于' + q.sum + '？')
      : (q.left + ' plus what equals ' + q.sum + '?');
  },

  registerRootGenes: function (ctx) {
    var unit = (ctx && ctx.unit) || {};
    var unitId = String(unit.id || 'u0');
    return [
      'RG.MATH.NUMBER_SENSE.BASIC',
      'RG.LEARNING.MATH.NUMBER_SENSE.' + unitId
    ];
  }
});
