'use strict';

/**
 * Remember & Act — Game Config + RADAR CONTRACT (Shell-1, MindSeeds)
 *
 * The instruction disappears before interaction begins. The child must retain
 * it and perform a transformation: preserve, reverse or update the sequence.
 *
 * Metadata: /metadata/mindseeds/remember-and-act.json
 * RootGene: RG.MEMORY.WORKING.MANIPULATION
 */
(function () {
  var MODULE_ID = 'remember-and-act';
  var MODULE_TYPE = 'mindseeds';
  var SOURCE_GAME_ID = 'remember-and-act';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.MEMORY.WORKING.MANIPULATION'];
  var SESSION_SIZE = 8;

  var UNIT_META = {
    K1: {
      icon: '☝️',
      nameZh: 'K1 · 记住一个动作',
      nameEn: 'K1 · Remember One Action',
      descZh: '看清一个动作，藏起来后做出来。',
      descEn: 'See one action, then do it after it hides.'
    },
    K2: {
      icon: '✌️',
      nameZh: 'K2 · 按顺序做',
      nameEn: 'K2 · Do Them in Order',
      descZh: '记住两个动作，按原来的顺序完成。',
      descEn: 'Remember two actions and perform them in order.'
    },
    G1: {
      icon: '↩️',
      nameZh: 'G1 · 反过来做',
      nameEn: 'G1 · Do Them Backwards',
      descZh: '记住三个动作，再从最后一个开始。',
      descEn: 'Remember three actions, then start with the last.'
    },
    G2: {
      icon: '🔁',
      nameZh: 'G2 · 记住后更新',
      nameEn: 'G2 · Remember, Then Update',
      descZh: '原动作藏起来后会有一个变化，更新后再完成。',
      descEn: 'After the actions hide, one changes. Update and perform.'
    }
  };

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { information_load: 'one', processing_complexity: 'execute', retrieval_demand: 'single_action', interference: 'none' },
      K2: { information_load: 'two', processing_complexity: 'ordered_execution', retrieval_demand: 'sequence_reconstruction', interference: 'none' },
      G1: { information_load: 'three', processing_complexity: 'reverse', retrieval_demand: 'sequence_reorganization', interference: 'rule' },
      G2: { information_load: 'three', processing_complexity: 'update', retrieval_demand: 'updated_sequence', interference: 'replacement' }
    }[gradeCode];
    return base ? Object.assign({}, base) : null;
  }

  function buildRadarContext(gradeCode, extra) {
    var ctx = {
      moduleId: MODULE_ID,
      moduleType: MODULE_TYPE,
      levelId: gradeCode,
      gradeCode: LEVEL_GRADE[gradeCode] || null,
      difficultyAxis: difficultyAxisFor(gradeCode),
      sourceGameId: SOURCE_GAME_ID
    };
    return extra ? Object.assign(ctx, extra) : ctx;
  }

  function buildUnits() {
    return GRADE_ORDER.map(function (g) {
      var m = UNIT_META[g];
      return {
        id: g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon: m.icon,
        nameZh: m.nameZh,
        nameEn: m.nameEn,
        descZh: m.descZh,
        descEn: m.descEn,
        questions: RA_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.RA_CONTRACT = {
    MODULE_ID: MODULE_ID,
    SESSION_SIZE: SESSION_SIZE,
    GRADE_ORDER: GRADE_ORDER,
    GENES: GENES,
    LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor,
    buildRadarContext: buildRadarContext
  };

  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) {
          u.questions = RA_GEN.generate(unitId, SESSION_SIZE);
        }
      });
    }, 0);
  }

  (function injectStyles() {
    if (document.getElementById('ra-shell-style')) { return; }
    var s = document.createElement('style');
    s.id = 'ra-shell-style';
    s.textContent = [
      '.s1-seq{text-align:center !important;letter-spacing:0 !important;}',
      '.ra-scene{display:flex;flex-direction:column;align-items:center;gap:12px;}',
      '.ra-instruction{max-width:360px;background:#fff;border:2px solid #c4b5fd;border-radius:14px;padding:9px 13px;font-size:15px;font-weight:850;color:#4c1d95;line-height:1.5;}',
      '.ra-cards,.ra-choices,.ra-built{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;}',
      '.ra-card,.ra-choice{min-width:74px;min-height:76px;background:#fff;border:3px solid #a78bfa;border-radius:14px;padding:7px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-family:inherit;}',
      '.ra-card b,.ra-choice b{font-size:32px;line-height:1;}',
      '.ra-card span,.ra-choice span{font-size:12px;font-weight:850;color:#4c1d95;}',
      '.ra-choice{cursor:pointer;touch-action:manipulation;}',
      '.ra-choice:disabled{opacity:.38;cursor:default;}',
      '.ra-slot{min-width:64px;min-height:68px;border:3px dashed #94a3b8;border-radius:14px;background:#f8fafc;display:flex;align-items:center;justify-content:center;font-size:29px;}',
      '.ra-update{max-width:360px;background:#fef3c7;border:3px solid #f59e0b;border-radius:14px;padding:9px 13px;font-size:15px;font-weight:900;color:#92400e;}',
      '.ra-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}',
      '.ra-btn{border:none;border-radius:999px;padding:8px 17px;color:#fff;background:#7c3aed;font-family:inherit;font-size:14px;font-weight:900;cursor:pointer;}',
      '.ra-btn.alt{background:#64748b;}',
      '.ra-btn.hint{background:#0ea5e9;}',
      '.ra-msg{min-height:44px;max-width:360px;font-size:14px;font-weight:800;color:#4c1d95;line-height:1.5;}',
      '.ra-opt{font-size:20px;font-weight:900;}'
    ].join('');
    document.head.appendChild(s);
  }());

  function bi(zh, en) {
    return '<span class="zh">' + zh + '</span><span class="en">' + en + '</span>';
  }

  function applyLang(root) {
    var zh = shell.lang === 'zh';
    root.querySelectorAll('.zh').forEach(function (n) { n.style.display = zh ? '' : 'none'; });
    root.querySelectorAll('.en').forEach(function (n) { n.style.display = zh ? 'none' : ''; });
  }

  function actionOf(q, id) {
    return q.actions.filter(function (a) { return a.id === id; })[0];
  }

  function actionCard(a, cls) {
    return '<div class="' + cls + '"><b>' + a.icon + '</b>' +
      bi(a.zh, a.en) + '</div>';
  }

  function instructionText(q) {
    if (q.mode === 'copy') {
      return q.expected.length === 1
        ? { zh: '玩法：记住这个动作。动作藏起来后，点击相同的动作。', en: 'How to play: remember this action. After it hides, tap the same action.' }
        : { zh: '玩法：从左到右记住动作。藏起来后，按照完全相同的顺序依次点击。', en: 'How to play: remember the actions from left to right. After they hide, tap them in exactly the same order.' };
    }
    if (q.mode === 'reverse') {
      return { zh: '玩法：从左到右记住三个动作。藏起来后，从最后一个开始，按照相反顺序依次点击。例如：A-B-C 要点击 C-B-A。', en: 'How to play: remember the three actions from left to right. After they hide, tap them in reverse order. For example, A-B-C becomes C-B-A.' };
    }
    return { zh: '玩法：从左到右记住三个动作。藏起来后，按照随后显示的“变化”替换指定动作，再从左到右点击更新后的完整顺序。', en: 'How to play: remember the three actions from left to right. After they hide, apply the update shown next, then tap the complete updated sequence from left to right.' };
  }

  function playBoard(q, host) {
    var selected = [], tries = 0, hints = 0, replays = 0, done = false;
    var intro = instructionText(q);
    var exposureTimer = null;

    function say(zh, en) {
      var m = host.querySelector('.ra-msg');
      if (m) {
        m.innerHTML = bi(zh, en);
        applyLang(m);
      }
    }

    function finish(tier, zh, en) {
      done = true;
      q.result = { tier: tier, tries: tries, hints: hints, replays: replays, zh: zh, en: en };
      setTimeout(function () {
        var b = document.querySelector('.s1-opt');
        if (b) { b.click(); }
      }, 900);
    }

    function expectedIcons() {
      return q.expected.map(function (id) { return actionOf(q, id).icon; }).join(' ');
    }

    function drawExposure(onReady) {
      host.innerHTML = '<div class="ra-instruction">' + bi(intro.zh, intro.en) + '</div>' +
        '<div class="ra-cards">' + q.shown.map(function (a) {
          return actionCard(a, 'ra-card');
        }).join('') + '</div><div class="ra-msg"></div>';
      applyLang(host);
      exposureTimer = setTimeout(function () {
        exposureTimer = null;
        drawAction('');
        if (onReady) { onReady(); }
      }, q.exposureMs);
    }

    q.replayOriginal = function (onReady) {
      if (done) { onReady(); return; }
      if (exposureTimer) { clearTimeout(exposureTimer); exposureTimer = null; }
      selected = [];
      replays++;
      drawExposure(onReady);
    };

    function updateText() {
      if (!q.update) { return ''; }
      return '<div class="ra-update">' + bi(
        '变化：第 ' + (q.update.index + 1) + ' 个动作，' + q.update.oldAction.zh + '（' +
          q.update.oldAction.icon + '）换成 ' + q.update.newAction.zh + '（' + q.update.newAction.icon + '）。',
        'Update: action ' + (q.update.index + 1) + ' changes from ' +
          q.update.oldAction.en + ' (' + q.update.oldAction.icon + ') to ' +
          q.update.newAction.en + ' (' + q.update.newAction.icon + ').'
      ) + '</div>';
    }

    function drawAction(message) {
      if (exposureTimer) {
        clearTimeout(exposureTimer);
        exposureTimer = null;
      }
      host.innerHTML = updateText() +
        '<div class="ra-instruction">' + bi(
          q.mode === 'reverse'
            ? '请点击 ' + q.expected.length + ' 个动作：按照刚才展示顺序的反向，依次点击。'
            : q.mode === 'update'
              ? '请点击 ' + q.expected.length + ' 个动作：先完成上面的替换，再从左到右点击更新后的完整顺序。'
              : '请点击 ' + q.expected.length + ' 个动作：按照刚才展示的原顺序，从左到右依次点击。',
          q.mode === 'reverse'
            ? 'Tap ' + q.expected.length + ' actions in the reverse of the order just shown.'
            : q.mode === 'update'
              ? 'Tap ' + q.expected.length + ' actions: apply the replacement above, then tap the complete updated sequence from left to right.'
              : 'Tap ' + q.expected.length + ' actions from left to right in the same order just shown.'
        ) + '</div>' +
        '<div class="ra-built">' + q.expected.map(function (_, i) {
          var a = selected[i] ? actionOf(q, selected[i]) : null;
          return '<div class="ra-slot">' + (a ? a.icon : (i + 1)) + '</div>';
        }).join('') + '</div>' +
        '<div class="ra-choices">' + q.choices.map(function (id) {
          var a = actionOf(q, id);
          return '<button class="ra-choice" data-id="' + id + '"' +
            (selected.indexOf(id) >= 0 ? ' disabled' : '') + '><b>' + a.icon + '</b>' +
            bi(a.zh, a.en) + '</button>';
        }).join('') + '</div>' +
        '<div class="ra-actions"><button class="ra-btn alt" id="ra-reset">' +
          bi('重新选择', 'Reset') + '</button><button class="ra-btn hint" id="ra-hint">' +
          bi('💡 提示', '💡 Hint') + '</button></div><div class="ra-msg">' + (message || '') + '</div>';

      host.querySelectorAll('[data-id]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (done) { return; }
          selected.push(b.getAttribute('data-id'));
          if (selected.length === q.expected.length) {
            check();
          } else {
            drawAction('');
          }
        });
      });

      host.querySelector('#ra-reset').addEventListener('click', function () {
        if (!done) {
          selected = [];
          drawAction('');
        }
      });

      host.querySelector('#ra-hint').addEventListener('click', function () {
        if (done) { return; }
        hints++;
        if (hints === 1) {
          say('先想一想：一共有几个动作？要保持原顺序、反过来，还是替换一个？',
            'First think: how many actions were there? Keep the order, reverse it, or replace one?');
        } else {
          say('正确顺序里的下一个动作是 ' + actionOf(q, q.expected[selected.length] || q.expected[0]).zh + '（' +
            actionOf(q, q.expected[selected.length] || q.expected[0]).icon + '）。',
            'The next action is ' + actionOf(q, q.expected[selected.length] || q.expected[0]).en + ' (' +
            actionOf(q, q.expected[selected.length] || q.expected[0]).icon + ').');
        }
      });

      applyLang(host);
    }

    function check() {
      tries++;
      var correct = selected.every(function (id, i) { return id === q.expected[i]; });
      if (correct) {
        var first = tries === 1;
        say('🎉 完成！正确顺序是 ' + expectedIcons() + '。', '🎉 Complete! The order is ' + expectedIcons() + '.');
        return finish(first && hints === 0 && replays === 0 ? 'best' : first ? 'better' : tries <= 2 ? 'good' : 'valid',
          (first && hints === 0 && replays === 0 ? '⭐ ' : '') + (first ? '一次完成' : '调整后完成'),
          (first && hints === 0 && replays === 0 ? '⭐ ' : '') + (first ? 'Completed first try' : 'Completed after adjusting'));
      }
      var chosen = selected.map(function (id) { return actionOf(q, id).icon; }).join(' ');
      selected = [];
      drawAction('');
      say('你刚才做的是 ' + chosen + '，顺序还不对。想一想规则，再试一次。',
        'You chose ' + chosen + '. The order is not right yet. Think about the rule and try again.');
    }

    drawExposure();
  }

  shell.createGame({
    id: SOURCE_GAME_ID,
    parallelUnits: true,
    theme: { primary: '#8b5cf6', primary2: '#5b21b6' },
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
        contentZh: '先看清动作。动作藏起来后，按照要求完成：保持顺序、反过来，或者根据变化更新一个动作。',
        contentEn: 'Study the actions first. After they hide, follow the instruction: keep the order, reverse it, or update one action.'
      },
      video: { enabled: false }
    },
    assistance: { replay: { enabled: true } },
    title: { zh: '🎬 记住再行动', en: '🎬 Remember & Act' },
    subtitle: { zh: '记在脑中，再动手完成', en: 'Hold it in mind, then act' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units: UNITS,

    renderSequence: function (q, container) {
      container.innerHTML = '<div class="ra-scene" id="ra-host"></div>';
      q.result = null;
      playBoard(q, container.querySelector('#ra-host'));
      setTimeout(function () {
        var b = document.querySelector('.s1-opt');
        if (b) { b.style.display = 'none'; }
      }, 0);
    },

    replaySequence: function (q, container, unit, done) {
      if (typeof q.replayOriginal === 'function') {
        q.replayOriginal(done);
      } else {
        done();
      }
    },

    renderOption: function () { return '<span class="ra-opt">✔</span>'; },

    checkAnswer: function (selected, q) { return !!q.result; },

    onAnswer: function (selected, q, correct) {
      if (!correct || !q.result) { return; }
      setTimeout(function () {
        var fb = document.getElementById('s1-fb');
        if (!fb) { return; }
        fb.innerHTML += '<div>' + bi(q.result.zh, q.result.en) + '</div>';
        applyLang(fb);
      }, 0);
    },

    getVoiceText: function (q) {
      var text = instructionText(q);
      return shell.lang === 'zh' ? text.zh : text.en;
    },

    registerRootGenes: function () { return GENES.slice(); },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      var played = questions.filter(function (q) { return q.result; });
      var extra = {
        taskMechanisms: questions.map(function (q) { return q.mode; }).filter(function (v, i, a) { return a.indexOf(v) === i; }),
        cognitiveChain: ['retention', 'reorganization', 'application'],
        carrier: ['sequential', 'visual_action'],
        workingMemory: true,
        geneIds: GENES.slice(),
        activityRuntime: 'puzzle'
      };

      if (played.length) {
        var tiers = { best: 0, better: 0, good: 0, valid: 0 };
        played.forEach(function (q) { tiers[q.result.tier]++; });
        extra.process = {
          tiers: tiers,
          optimalCount: tiers.best,
          retries: played.reduce(function (n, q) { return n + Math.max(0, q.result.tries - 1); }, 0),
          hints: played.reduce(function (n, q) { return n + q.result.hints; }, 0),
          replays: played.reduce(function (n, q) { return n + (q.result.replays || 0); }, 0)
        };
      }

      refillUnit(unit.id);
      return buildRadarContext(unit.id, extra);
    }
  });
}());
