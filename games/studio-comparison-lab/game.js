'use strict';

(function () {
  var ACTIVE_KEY = 'me:studio:creator:active';
  var RECAP_KEY = 'me:studio:creator:last-result';

  function loadConfig() {
    var fallback = {
      version: 'v1',
      templateId: 'studio-comparison-template-v1',
      creatorSessionId: 'creator-fallback',
      creatorName: 'Creator',
      titleZh: '我的比较训练',
      titleEn: 'My Comparison Lab',
      difficulty: 'L1',
      rounds: 4,
      mode: 'dots',
      minValue: 1,
      maxValue: 12,
      minGap: 2,
      createdAt: new Date().toISOString()
    };

    var raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return fallback;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return fallback;
      return {
        version: 'v1',
        templateId: parsed.templateId || fallback.templateId,
        creatorSessionId: parsed.creatorSessionId || fallback.creatorSessionId,
        creatorName: parsed.creatorName || fallback.creatorName,
        titleZh: parsed.titleZh || fallback.titleZh,
        titleEn: parsed.titleEn || fallback.titleEn,
        difficulty: parsed.difficulty || fallback.difficulty,
        rounds: Math.max(1, Number(parsed.rounds) || fallback.rounds),
        mode: parsed.mode === 'number' ? 'number' : 'dots',
        minValue: Math.max(1, Number(parsed.minValue) || fallback.minValue),
        maxValue: Math.max(2, Number(parsed.maxValue) || fallback.maxValue),
        minGap: Math.max(1, Number(parsed.minGap) || fallback.minGap),
        createdAt: parsed.createdAt || fallback.createdAt
      };
    } catch (err) {
      return fallback;
    }
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function makeQuestion(cfg) {
    var a = 0;
    var b = 0;
    var attempts = 0;
    do {
      a = randInt(cfg.minValue, cfg.maxValue);
      b = randInt(cfg.minValue, cfg.maxValue);
      attempts += 1;
    } while (Math.abs(a - b) < cfg.minGap && attempts < 120);

    var askBigger = Math.random() < 0.5;
    var aIsCorrect = askBigger ? (a > b) : (a < b);

    return {
      a: a,
      b: b,
      askBigger: askBigger,
      answer: aIsCorrect ? 'left' : 'right',
      options: ['left', 'right'],
      mode: cfg.mode,
      hintZh: '先比较 A 和 B，再看题目是问更大还是更小。',
      hintEn: 'Compare A and B first, then check whether it asks bigger or smaller.'
    };
  }

  function buildQuestions(cfg) {
    var arr = [];
    for (var i = 0; i < cfg.rounds; i++) {
      arr.push(makeQuestion(cfg));
    }
    return arr;
  }

  function dots(n) {
    var html = '<span class="sc-dots">';
    for (var i = 0; i < n; i++) html += '<span class="sc-dot"></span>';
    html += '</span>';
    return html;
  }

  function injectStyle() {
    if (document.getElementById('sc-style')) return;
    var s = document.createElement('style');
    s.id = 'sc-style';
    s.textContent = [
      '.sc-wrap{display:grid;gap:10px;justify-items:center;}',
      '.sc-q{font-size:22px;font-weight:900;color:#1e3a8a;text-align:center;}',
      '.sc-preview{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:420px;}',
      '.sc-cell{background:#fff;border:1px solid #dbeafe;border-radius:12px;padding:10px 8px;display:grid;gap:6px;justify-items:center;}',
      '.sc-num{font-size:31px;font-weight:900;color:#1e293b;line-height:1;}',
      '.sc-ab{font-size:12px;font-weight:800;color:#64748b;}',
      '.sc-dots{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;justify-items:center;}',
      '.sc-dot{width:11px;height:11px;border-radius:50%;background:#60a5fa;box-shadow:0 1px 2px rgba(0,0,0,.16);}',
      '.sc-opt{display:grid;gap:8px;justify-items:center;align-content:center;min-height:72px;}',
      '.sc-opt-label{font-size:12px;font-weight:700;color:#64748b;}'
    ].join('');
    document.head.appendChild(s);
  }

  function difficultyAxis(level) {
    if (level === 'L1') {
      return {
        object_complexity: 'concrete',
        dimension_complexity: 'single',
        relation_complexity: 'direct',
        language_complexity: 'question',
        transfer_complexity: 'within-domain'
      };
    }
    if (level === 'L2') {
      return {
        object_complexity: 'symbolic',
        dimension_complexity: 'single',
        relation_complexity: 'direct',
        language_complexity: 'question',
        transfer_complexity: 'within-domain'
      };
    }
    return {
      object_complexity: 'symbolic',
      dimension_complexity: 'single',
      relation_complexity: 'chain',
      language_complexity: 'question',
      transfer_complexity: 'strategy'
    };
  }

  injectStyle();

  var cfg = loadConfig();
  var passScore = Math.max(1, Math.ceil(cfg.rounds * 0.75));

  shell.createGame({
    id: 'studio-comparison-lab',
    theme: { primary: '#0ea5e9', primary2: '#22c55e', bg: '#ecfeff' },
    gui: {
      header: { show: true, showBack: true },
      language: { enabled: true, default: 'en' },
      audio: {
        music: { enabled: true, defaultOn: false },
        sound: { enabled: true, defaultOn: true }
      },
      history: { enabled: true },
      help: {
        enabled: true,
        contentZh: '这是创作者模板生成的比较训练作品。',
        contentEn: 'This is a creator-generated comparison training game from a template.'
      }
    },
    title: { zh: '🛠️ ' + cfg.titleZh, en: '🛠️ ' + cfg.titleEn },
    subtitle: {
      zh: '创作者：' + cfg.creatorName + ' · ' + cfg.difficulty + ' · ' + cfg.rounds + '题',
      en: 'Creator: ' + cfg.creatorName + ' · ' + cfg.difficulty + ' · ' + cfg.rounds + ' rounds'
    },
    passScore: passScore,
    units: [{
      id: cfg.difficulty + '-GEN',
      levelId: cfg.difficulty,
      icon: '🧪',
      nameZh: '模板试玩',
      nameEn: 'Template Playtest',
      descZh: '由创作器生成',
      descEn: 'Generated by Creator Builder',
      questions: buildQuestions(cfg)
    }],

    renderSequence: function (q, container) {
      var title = q.askBigger
        ? '<span class="zh">哪个更大？</span><span class="en">Which is bigger?</span>'
        : '<span class="zh">哪个更小？</span><span class="en">Which is smaller?</span>';

      var leftBody = q.mode === 'dots' ? dots(q.a) : '<span class="sc-num">' + q.a + '</span>';
      var rightBody = q.mode === 'dots' ? dots(q.b) : '<span class="sc-num">' + q.b + '</span>';

      container.innerHTML = '<div class="sc-wrap">' +
        '<div class="sc-q">' + title + '</div>' +
        '<div class="sc-preview">' +
          '<div class="sc-cell">' + leftBody + '<div class="sc-ab">A</div></div>' +
          '<div class="sc-cell">' + rightBody + '<div class="sc-ab">B</div></div>' +
        '</div>' +
      '</div>';
    },

    renderOption: function (opt) {
      return '<div class="sc-opt"><span class="sc-num">' + (opt === 'left' ? 'A' : 'B') + '</span>' +
        '<span class="sc-opt-label"><span class="zh">选择</span><span class="en">Pick</span></span></div>';
    },

    checkAnswer: function (selected, q) {
      return selected === q.answer;
    },

    getVoiceText: function (q) {
      return q.askBigger
        ? (shell.lang === 'zh' ? '哪个更大？' : 'Which is bigger?')
        : (shell.lang === 'zh' ? '哪个更小？' : 'Which is smaller?');
    },

    registerRootGenes: function () {
      return [
        'RG.LOGIC.COMPARISON.BASIC',
        'RG.STRATEGY.DECISION.PLANNING'
      ];
    },

    getReportContext: function () {
      return {
        moduleId: 'creative-workshop',
        moduleType: 'creative-workshop',
        levelId: cfg.difficulty,
        comparisonType: 'quantity',
        difficultyAxis: difficultyAxis(cfg.difficulty),
        templateId: cfg.templateId,
        creatorSessionId: cfg.creatorSessionId,
        creatorName: cfg.creatorName,
        sourceGameId: 'studio-comparison-lab',
        sourceConfigVersion: cfg.version || 'v1'
      };
    },

    onResult: function (result, msgEl) {
      var recap = {
        templateId: cfg.templateId,
        creatorSessionId: cfg.creatorSessionId,
        creatorName: cfg.creatorName,
        titleZh: cfg.titleZh,
        titleEn: cfg.titleEn,
        levelId: cfg.difficulty,
        mode: cfg.mode,
        rounds: cfg.rounds,
        score: result.score,
        total: result.total,
        passed: result.passed,
        elapsed: result.elapsed,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(RECAP_KEY, JSON.stringify(recap));

      if (msgEl) {
        msgEl.innerHTML += '<br><span class="zh">已保存创作复盘，可返回 Builder 查看。</span><span class="en">Recap saved. Return to Builder to review.</span>';
      }
    }
  });
}());
