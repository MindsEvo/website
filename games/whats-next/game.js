'use strict';

/**
 * What's Next — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * A magic machine has numbered buttons; rule cards say which button causes which
 * effect (drawn fresh every question). The child chooses, and a wrong choice is not
 * marked red: the machine shows what that choice really does, and the child
 * chooses again. Finishing passes; right first (no hints) earns a star; retries
 * and hints go into the report. The hidden confirm button is clicked by the board
 * once the answer is found (same hook as energy-planner / route-choice).
 *
 * Metadata:  /metadata/mindseeds/whats-next.json
 * RootGene:  RG.STRATEGY.PREDICT.CONSEQUENCE
 */
(function () {

  var MODULE_ID      = 'whats-next';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'whats-next';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.STRATEGY.PREDICT.CONSEQUENCE'];

  // Mirrors whats-next.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 8;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { rule_count: 'two',   direction: 'forward_predict', chain_depth: 'one_hop' },
      K2: { rule_count: 'three', direction: 'forward_predict', chain_depth: 'one_hop' },
      G1: { rule_count: 'four',  direction: 'goal_directed',   chain_depth: 'one_hop' },
      G2: { rule_count: 'five',  direction: 'both',            chain_depth: 'two_hop' }
    }[gradeCode];
    return base ? Object.assign({}, base) : null;
  }

  function _unique(values) {
    return (values || []).filter(function (v, i, a) { return v !== undefined && a.indexOf(v) === i; });
  }

  function buildRadarContext(gradeCode, extra) {
    var ctx = {
      moduleId:       MODULE_ID,
      moduleType:     MODULE_TYPE,
      levelId:        gradeCode,
      gradeCode:      LEVEL_GRADE[gradeCode] || null,
      difficultyAxis: difficultyAxisFor(gradeCode),
      sourceGameId:   SOURCE_GAME_ID
    };
    return extra ? Object.assign(ctx, extra) : ctx;
  }

  function buildUnits() {
    return GRADE_ORDER.map(function (g) {
      var meta = WN_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon,
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: WN_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.WN_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: the report must describe the questions just seen.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) { u.questions = WN_GEN.generate(unitId, SESSION_SIZE); }
      });
    }, 0);
  }

  (function injectStyles() {
    if (document.getElementById('wn-shell-style')) { return; }
    var s = document.createElement('style');
    s.id = 'wn-shell-style';
    s.textContent = [
      '.s1-seq{text-align:center !important;letter-spacing:0 !important;}',
      '.wn-scene{display:flex;flex-direction:column;align-items:center;gap:10px;}',
      '.wn-intro{font-size:14px;font-weight:800;color:#075985;background:#fff;border-radius:12px;padding:6px 12px;max-width:340px;line-height:1.45;}',
      '.wn-rules{display:flex;flex-direction:column;gap:6px;width:min(340px,100%);}',
      '.wn-rule{display:flex;align-items:center;justify-content:center;gap:8px;background:#fff;border:2px solid #7dd3fc;border-radius:12px;padding:6px 10px;transition:background .2s;}',
      '.wn-rule.chain{border:2px dashed #7c3aed;background:#faf5ff;}',
      '.wn-rule.lit{background:#fef9c3;border-color:#ca8a04;}',
      '.wn-then{font-size:12px;font-weight:900;color:#6d28d9;}',
      '.wn-arrow{font-size:18px;color:#64748b;font-weight:900;}',
      '.wn-eff{display:inline-flex;align-items:center;gap:4px;font-size:14px;font-weight:800;color:#334155;}',
      '.wn-eff b{font-size:26px;line-height:1.1;font-weight:400;}',
      '.wn-num{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#0369a1;color:#fff;font-size:20px;font-weight:900;border:3px solid #fff;box-shadow:0 0 0 2px #0369a1;}',
      '.wn-ask{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;font-size:17px;font-weight:900;color:#075985;background:#fff;border-radius:12px;padding:8px 12px;max-width:340px;line-height:1.5;}',
      '.wn-choices{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}',
      '.wn-choice{display:flex;align-items:center;justify-content:center;gap:6px;min-width:84px;min-height:58px;font-family:inherit;cursor:pointer;touch-action:manipulation;background:#fff;border:3px solid #0ea5e9;border-radius:14px;padding:6px 10px;}',
      '.wn-choice:disabled{opacity:.4;cursor:default;border-color:#cbd5e1;}',
      '.wn-btn-hint{border:none;background:#0ea5e9;color:#fff;font-size:15px;font-weight:900;padding:7px 18px;border-radius:999px;cursor:pointer;font-family:inherit;}',
      '.wn-msg{min-height:48px;max-width:340px;font-size:14px;font-weight:800;color:#0c4a6e;line-height:1.55;background:#fff;border-radius:12px;padding:6px 10px;}',
      '.wn-msg:empty{display:none;}',
      '.wn-opt{font-size:20px;font-weight:900;}'
    ].join('');
    document.head.appendChild(s);
  }());

  function bi(zh, en) { return '<span class="zh">' + zh + '</span><span class="en">' + en + '</span>'; }
  function applyLang(root) {
    var zh = shell.lang === 'zh';
    root.querySelectorAll('.zh').forEach(function (n) { n.style.display = zh ? '' : 'none'; });
    root.querySelectorAll('.en').forEach(function (n) { n.style.display = zh ? 'none' : ''; });
  }

  function eff(i) { var e = WN_DATA.effects[i]; return '<span class="wn-eff"><b>' + e.icon + '</b>' + bi(e.nameZh, e.nameEn) + '</span>'; }
  function effText(i, zh) { var e = WN_DATA.effects[i]; return zh ? e.nameZh + '（' + e.icon + '）' : e.nameEn + ' (' + e.icon + ')'; }
  function num(b) { return '<span class="wn-num">' + b + '</span>'; }
  function listText(list, zh) { return list.map(function (i) { return effText(i, zh); }).join(zh ? '、' : ', '); }

  function askText(q) {
    var a = q.ask;
    if (q.kind === 'forward') return { zh: '按 ' + a.b + ' 号，会发生什么？', en: 'Press ' + a.b + ' — what happens?' };
    if (q.kind === 'forward2') return { zh: '按 ' + a.b + ' 号，最后会发生什么？', en: 'Press ' + a.b + ' — what happens in the end?' };
    if (q.kind === 'backward2') return { zh: '想让 ' + listText(a.want, true) + ' 都发生，该按哪两个？', en: 'To make ' + listText(a.want, false) + ' both happen, which two do you press?' };
    return { zh: '想让 ' + listText(a.want, true) + (q.kind === 'backward3' ? ' 最后发生' : ' 发生') + '，该按几号？', en: 'To make ' + listText(a.want, false) + (q.kind === 'backward3' ? ' happen in the end' : ' happen') + ', which number do you press?' };
  }

  function choiceHtml(c) {
    if (c.charAt(0) === 'e') { return eff(+c.slice(2)); }
    return c.slice(2).split(',').map(num).join('<span class="wn-arrow">+</span>');
  }

  function playBoard(q, host) {
    var tries = 0, hints = 0, done = false, wrong = {};
    var intro = bi('魔法机器的规则卡（每一题都不一样，先读一读）', 'The machine\'s rule cards (different every question — read them first)');

    function rulesHtml(lit) {
      var h = q.rules.map(function (r) {
        return '<div class="wn-rule' + (lit && lit.indexOf(r.b) >= 0 ? ' lit' : '') + '">' + num(r.b) + '<span class="wn-arrow">→</span>' + eff(r.e) + '</div>';
      }).join('');
      h += q.chains.map(function (c) {
        return '<div class="wn-rule chain">' + eff(c.from) + '<span class="wn-arrow">→</span><span class="wn-then">' + bi('接着', 'then') + '</span>' + eff(c.to) + '</div>';
      }).join('');
      return h;
    }
    function say(zh, en) { var m = host.querySelector('.wn-msg'); if (m) { m.innerHTML = bi(zh, en); applyLang(m); } }
    function finish(tier, zh, en) {
      done = true;
      q.result = { tier: tier, tries: tries, hints: hints, zh: zh, en: en };
      setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) { b.click(); } }, 900);
    }

    function draw(msg) {
      var t = askText(q);
      host.innerHTML = '<div class="wn-intro">' + intro + '</div><div class="wn-rules">' + rulesHtml() + '</div>' +
        '<div class="wn-ask">' + bi(t.zh, t.en) + '</div>' +
        '<div class="wn-choices">' + q.choices.map(function (c) {
          return '<button class="wn-choice" data-c="' + c + '"' + (wrong[c] ? ' disabled' : '') + '>' + choiceHtml(c) + '</button>';
        }).join('') + '</div>' +
        '<div><button class="wn-btn-hint" id="wn-hint">' + bi('💡 提示', '💡 Hint') + '</button></div><div class="wn-msg">' + (msg || '') + '</div>';
      host.querySelectorAll('.wn-choice').forEach(function (b) { b.addEventListener('click', function () { choose(b.getAttribute('data-c')); }); });
      host.querySelector('#wn-hint').addEventListener('click', function () {
        if (done) { return; }
        hints++; var i = Math.min(hints, 3) - 1; say(q.hintZh[i], q.hintEn[i]);
      });
      applyLang(host);
    }

    // What the machine really does for a wrong choice (shown instead of a red cross).
    function consequence(c) {
      if (c.charAt(0) === 'e') {
        return { zh: '不是这个哦。按 ' + q.ask.b + ' 号发生的不是 ' + effText(+c.slice(2), true) + '。再看看规则卡。', en: 'Not that one. Pressing ' + q.ask.b + ' does not cause ' + effText(+c.slice(2), false) + '. Read the cards again.' };
      }
      var bs = c.slice(2).split(',').map(Number), got = [];
      bs.forEach(function (b) { WN_GEN.outcome(q, b).forEach(function (e) { if (got.indexOf(e) < 0) { got.push(e); } }); });
      var names = bs.join(' + ');
      return { zh: '你按了 ' + names + ' 号，实际发生的是：' + listText(got, true) + '。你想要的是：' + listText(q.ask.want, true) + '。换一个试试。',
               en: 'You pressed ' + names + '. What really happens: ' + listText(got, false) + '. You wanted: ' + listText(q.ask.want, false) + '. Try another.' };
    }

    function choose(c) {
      if (done || wrong[c]) { return; }
      tries++;
      if (c === q.correct) {
        draw('');
        var good = c.charAt(0) === 'e'
          ? { zh: '✅ 对！按 ' + q.ask.b + ' 号' + (q.kind === 'forward2' ? '，一件接一件，最后发生' : '，会发生') + ' ' + effText(+c.slice(2), true) + '。', en: '✅ Yes! Pressing ' + q.ask.b + (q.kind === 'forward2' ? ' sets off a chain, and in the end' : '') + ' causes ' + effText(+c.slice(2), false) + '.' }
          : { zh: '✅ 对！机器真的做到了：' + listText(q.ask.want, true) + '。', en: '✅ Yes! The machine really does it: ' + listText(q.ask.want, false) + '.' };
        say(good.zh, good.en);
        var first = tries === 1;
        return finish(first && hints === 0 ? 'best' : first ? 'better' : tries <= 2 ? 'good' : 'valid',
          (first && hints === 0 ? '⭐ ' : '') + (first ? '一次就想对了' : '试了 ' + tries + ' 次'),
          (first && hints === 0 ? '⭐ ' : '') + (first ? 'Right on the first try' : 'Took ' + tries + ' tries'));
      }
      wrong[c] = true;
      var cs = consequence(c);
      draw('');
      say(cs.zh, cs.en);
      if (tries >= 2) {                                           // after two misses, light up the cards that matter
        var lit = c.charAt(0) === 'e' ? [q.ask.b] : q.correct.slice(2).split(',').map(Number);
        host.querySelector('.wn-rules').innerHTML = rulesHtml(q.kind === 'backward3' ? [] : lit); applyLang(host);
      }
    }
    draw('');
  }

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:    { primary: '#0ea5e9', primary2: '#0369a1' },
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
        contentZh: '每张规则卡写着「按几号 → 发生什么」，每一题的规则都不一样。先读规则卡，再回答。选错了不要紧，机器会告诉你实际发生了什么，再换一个试试。',
        contentEn: 'Each rule card says "press this number → this happens", and the rules change every question. Read the cards first, then answer. A wrong choice is fine: the machine shows what really happens, then you try another.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-whats-next-intro-001'
      }
    },
    title:     { zh: '🔗 下一步会怎样',         en: '🔗 What\'s Next' },
    subtitle:  { zh: '读懂规则，想清楚再按', en: 'Read the rules, think, then press' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      container.innerHTML = '<div class="wn-scene" id="wn-host"></div>';
      q.result = null;
      playBoard(q, container.querySelector('#wn-host'));
      setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) { b.style.display = 'none'; } }, 0);
    },

    renderOption: function () { return '<span class="wn-opt">✔</span>'; },

    checkAnswer: function (selected, q) { return !!q.result; },

    onAnswer: function (selected, q, correct) {
      if (!correct || !q.result) { return; }
      setTimeout(function () {
        var fb = document.getElementById('s1-fb'); if (!fb) { return; }
        fb.innerHTML += '<div>' + bi(q.result.zh, q.result.en) + '</div>';
        applyLang(fb);
      }, 0);
    },

    getVoiceText: function (q) {
      var t = askText(q), clean = function (s) { return s.replace(/（[^）]*）/g, '').replace(/ \([^)]*\)/g, ''); };
      return clean(shell.lang === 'zh' ? t.zh : t.en);
    },

    registerRootGenes: function () { return GENES.slice(); },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      var played = questions.filter(function (q) { return q.result; });
      var extra = {
        directions:      _unique(questions.map(function (q) { return q.kind.indexOf('forward') === 0 ? 'forward_predict' : 'goal_directed'; })),
        geneIds:         GENES.slice(),
        activityRuntime: 'puzzle'
      };
      if (played.length) {
        var tiers = { best: 0, better: 0, good: 0, valid: 0 };
        played.forEach(function (q) { tiers[q.result.tier]++; });
        extra.process = {
          tiers: tiers, optimalCount: tiers.best,
          retries: played.reduce(function (n, q) { return n + Math.max(0, q.result.tries - 1); }, 0),
          hints: played.reduce(function (n, q) { return n + q.result.hints; }, 0)
        };
      }
      refillUnit(unit.id);
      return buildRadarContext(unit.id, extra);
    }
  });
}());
