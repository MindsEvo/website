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

function normalizeQuestion(raw) {
  return {
    mode: raw.mode,
    a: raw.a,
    b: raw.b,
    askBigger: !!raw.askBigger,
    options: ['left', 'right'],
    answer: raw.correctSide,
    hintZh: '先比较两个数值，再判断题目要求是更大还是更小。',
    hintEn: 'Compare both values first, then check whether the prompt asks for bigger or smaller.'
  };
}

var cmpUnits = LEVELS.map(function (level) {
  var questions = [];
  for (var i = 0; i < level.rounds; i++) {
    questions.push(normalizeQuestion(makeQuestion(level)));
  }
  return {
    id: level.id,
    icon: '⚖️',
    nameZh: level.nameZh,
    nameEn: level.nameEn,
    descZh: level.refZh,
    descEn: level.refEn,
    questions: questions
  };
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
      contentZh: '先看题目要求是更大还是更小，再比较两个数值。',
      contentEn: 'Check whether the question asks for bigger or smaller, then compare the two values.'
    }
  },
  title: { zh: '⚖️ 比较', en: '⚖️ Comparison' },
  subtitle: { zh: '判断哪个更大或更小', en: 'Decide which number is bigger or smaller' },
  passScore: 6,
  units: cmpUnits,

  renderSequence: function (q, container) {
    var qText = q.askBigger
      ? '<span class="zh">哪个更大？</span><span class="en">Which is bigger?</span>'
      : '<span class="zh">哪个更小？</span><span class="en">Which is smaller?</span>';

    var leftPreview = q.mode === 'dots'
      ? renderDots(q.a, 'cmp-dot', 'cmp-dots')
      : '<span class="cmp-opt-num">' + q.a + '</span>';
    var rightPreview = q.mode === 'dots'
      ? renderDots(q.b, 'cmp-dot', 'cmp-dots')
      : '<span class="cmp-opt-num">' + q.b + '</span>';

    container.innerHTML = '<div class="cmp-wrap">' +
      '<div class="cmp-q">' + qText + '</div>' +
      '<div class="cmp-sub"><span class="zh">先观察两个数，再选择答案</span><span class="en">Observe both values before choosing</span></div>' +
      '<div class="cmp-preview">' +
        '<div class="cmp-pcell">' + leftPreview + '<div class="cmp-pnum">A</div></div>' +
        '<div class="cmp-pcell">' + rightPreview + '<div class="cmp-pnum">B</div></div>' +
      '</div>' +
    '</div>';
  },

  renderOption: function (opt, q) {
    var value = opt === 'left' ? q.a : q.b;
    var body = q.mode === 'dots'
      ? renderDots(value, 'cmp-opt-dot', 'cmp-opt-dots') + '<span class="cmp-opt-num">' + value + '</span>'
      : '<span class="cmp-opt-num">' + value + '</span>';
    var label = opt === 'left'
      ? '<span class="zh">选 A</span><span class="en">Pick A</span>'
      : '<span class="zh">选 B</span><span class="en">Pick B</span>';
    return '<div class="cmp-opt">' + body + '<small>' + label + '</small></div>';
  },

  checkAnswer: function (selected, q) {
    return selected === q.answer;
  },

  getVoiceText: function (q) {
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
  }
});
