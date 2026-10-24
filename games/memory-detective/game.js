'use strict';

/**
 * Memory Detective — Game Config + RADAR CONTRACT (Shell-1, MindSeeds)
 *
 * Clues appear and disappear before the suspects are shown. The child must
 * retain and combine the clues to identify the unique matching suspect.
 * G2 replaces one hidden clue before investigation.
 *
 * Metadata: /metadata/mindseeds/memory-detective.json
 */
(function () {
  var MODULE_ID = 'memory-detective';
  var MODULE_TYPE = 'mindseeds';
  var SOURCE_GAME_ID = 'memory-detective';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var BASE_GENES = ['RG.MEMORY.VISUAL.RECOGNITION'];
  var WORKING_GENE = 'RG.MEMORY.WORKING.MANIPULATION';
  var SESSION_SIZE = 8;

  function genesFor(gradeCode) {
    var genes = BASE_GENES.slice();
    if (gradeCode === 'G2') {
      genes.push(WORKING_GENE);
    }
    return genes;
  }

  function difficultyAxisFor(gradeCode) {
    var cfg = MD_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }

    return {
      information_load: {
        K1: 'one_clue',
        K2: 'two_clues',
        G1: 'three_clues',
        G2: 'three_clues'
      }[gradeCode],
      exposure_time: {
        K1: 'long',
        K2: 'medium',
        G1: 'short',
        G2: 'short'
      }[gradeCode],
      retention_delay: {
        K1: 'short',
        K2: 'medium',
        G1: 'long',
        G2: 'longest'
      }[gradeCode],
      interference: cfg.mode === 'clue_update'
        ? 'clue_replacement'
        : 'suspect_competition',
      processing_complexity: cfg.mode,
      organization_support: 'attribute_grouping',
      retrieval_demand: 'clue_integration'
    };
  }

  function unique(values) {
    return (values || []).filter(function (value, index, all) {
      return value !== undefined && all.indexOf(value) === index;
    });
  }

  function buildRadarContext(gradeCode, extra) {
    var context = {
      moduleId: MODULE_ID,
      moduleType: MODULE_TYPE,
      levelId: gradeCode,
      gradeCode: LEVEL_GRADE[gradeCode] || null,
      difficultyAxis: difficultyAxisFor(gradeCode),
      sourceGameId: SOURCE_GAME_ID
    };
    return extra ? Object.assign(context, extra) : context;
  }

  function buildUnits() {
    return GRADE_ORDER.map(function (gradeCode) {
      var meta = MD_DATA.units[gradeCode];
      return {
        id: gradeCode,
        gradeCode: LEVEL_GRADE[gradeCode],
        icon: meta.icon,
        nameZh: meta.nameZh,
        nameEn: meta.nameEn,
        descZh: meta.descZh,
        descEn: meta.descEn,
        questions: MD_GEN.generate(gradeCode, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.MD_CONTRACT = {
    MODULE_ID: MODULE_ID,
    SESSION_SIZE: SESSION_SIZE,
    GRADE_ORDER: GRADE_ORDER,
    LEVEL_GRADE: LEVEL_GRADE,
    genesFor: genesFor,
    difficultyAxisFor: difficultyAxisFor,
    buildRadarContext: buildRadarContext
  };

  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (unit) {
        if (unit.id === unitId) {
          unit.questions = MD_GEN.generate(unitId, SESSION_SIZE);
        }
      });
    }, 0);
  }

  (function injectStyles() {
    if (document.getElementById('md-shell-style')) { return; }

    var style = document.createElement('style');
    style.id = 'md-shell-style';
    style.textContent = [
      '.s1-seq{text-align:center!important;letter-spacing:0!important;}',
      '.md-scene{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;}',
      '.md-instruction{max-width:470px;background:#fff;border:2px solid #c4b5fd;border-radius:14px;padding:9px 13px;font-size:15px;font-weight:850;color:#4c1d95;line-height:1.5;}',
      '.md-phase{font-size:14px;font-weight:900;color:#7c3aed;}',
      '.md-clues{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;width:min(94vw,470px);}',
      '.md-clue{min-width:105px;min-height:94px;background:linear-gradient(145deg,#faf5ff,#ede9fe);border:3px solid #a78bfa;border-radius:16px;padding:9px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;}',
      '.md-clue b{font-size:34px;line-height:1;}',
      '.md-clue span{font-size:13px;font-weight:900;color:#4c1d95;}',
      '.md-hidden{min-height:105px;display:flex;align-items:center;justify-content:center;font-size:42px;color:#7c3aed;}',
      '.md-update{max-width:470px;background:#fef3c7;border:3px solid #f59e0b;border-radius:14px;padding:10px 14px;font-size:15px;font-weight:900;color:#92400e;line-height:1.5;}',
      '.md-suspects{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;width:min(94vw,500px);}',
      '.md-suspect{min-height:105px;border:3px solid #a78bfa;border-radius:16px;background:#fff;padding:9px;font-family:inherit;cursor:pointer;touch-action:manipulation;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;}',
      '.md-suspect:hover:not(:disabled){background:#faf5ff;transform:translateY(-1px);}',
      '.md-suspect:disabled{cursor:default;opacity:.62;}',
      '.md-animal{font-size:42px;line-height:1;}',
      '.md-name{font-size:13px;font-weight:900;color:#4c1d95;}',
      '.md-traits{font-size:18px;letter-spacing:4px;}',
      '.md-actions{display:flex;justify-content:center;}',
      '.md-btn{border:none;border-radius:999px;padding:8px 17px;color:#fff;background:#0ea5e9;font-family:inherit;font-size:14px;font-weight:900;cursor:pointer;}',
      '.md-msg{min-height:44px;max-width:470px;font-size:14px;font-weight:800;color:#4c1d95;line-height:1.5;}',
      '.md-opt{font-size:20px;font-weight:900;}',
      '@media(max-width:430px){.md-suspects{grid-template-columns:1fr 1fr;gap:7px;}.md-suspect{min-height:94px;padding:6px;}}'
    ].join('');
    document.head.appendChild(style);
  }());

  function bi(zh, en) {
    return '<span class="zh">' + zh + '</span><span class="en">' + en + '</span>';
  }

  function applyLang(root) {
    var zh = shell.lang === 'zh';
    root.querySelectorAll('.zh').forEach(function (node) {
      node.style.display = zh ? '' : 'none';
    });
    root.querySelectorAll('.en').forEach(function (node) {
      node.style.display = zh ? 'none' : '';
    });
  }

  function instructionText(question) {
    if (question.mode === 'single_clue') {
      return {
        zh: '玩法：记住一个线索。线索藏起来后，从角色中找出符合线索的小动物。',
        en: 'How to play: remember one clue. After it hides, find the animal that matches it.'
      };
    }
    if (question.mode === 'combined_clues') {
      return {
        zh: '玩法：同时记住动物和颜色两个线索，线索藏起来后找出唯一符合者。',
        en: 'How to play: remember both the animal and color clues, then find the unique match after they hide.'
      };
    }
    if (question.mode === 'multi_clue') {
      return {
        zh: '玩法：记住动物、颜色和随身物品三条线索，找出全部条件都符合的角色。',
        en: 'How to play: remember the animal, color and accessory clues, then find the suspect matching all three.'
      };
    }
    return {
      zh: '玩法：记住三条线索。线索藏起来后其中一条会更新，请按更新后的全部线索寻找。',
      en: 'How to play: remember three clues. After they hide, one clue changes; investigate using the complete updated clue set.'
    };
  }

  function traitIcons(suspect) {
    return MD_DATA.labels.color[suspect.color].icon +
      MD_DATA.labels.accessory[suspect.accessory].icon;
  }

  function clueHtml(clue) {
    return '<div class="md-clue"><b>' + clue.icon + '</b>' +
      bi(clue.zh, clue.en) + '</div>';
  }

  function updateHtml(question) {
    if (!question.update) { return ''; }

    return '<div class="md-update">' + bi(
      '线索更新：原来的“' + question.update.oldClue.zh +
        '”改成“' + question.update.newClue.zh + '”。其他线索保持不变。',
      'Clue update: "' + question.update.oldClue.en +
        '" changes to "' + question.update.newClue.en +
        '". Keep the other clues unchanged.'
    ) + '</div>';
  }

  function playQuestion(question, host) {
    var tries = 0;
    var hints = 0;
    var replays = 0;
    var done = false;
    var locked = true;
    var timers = [];
    var intro = instructionText(question);

    function schedule(callback, delay) {
      var timer = setTimeout(callback, delay);
      timers.push(timer);
      return timer;
    }

    function clearTimers() {
      timers.forEach(function (timer) {
        clearTimeout(timer);
      });
      timers = [];
    }

    function suspectById(id) {
      return question.suspects.filter(function (suspect) {
        return suspect.id === id;
      })[0];
    }

    function say(zh, en) {
      var message = host.querySelector('.md-msg');
      if (message) {
        message.innerHTML = bi(zh, en);
        applyLang(message);
      }
    }

    function drawInvestigation(message) {
      locked = false;
      host.innerHTML =
        updateHtml(question) +
        '<div class="md-instruction">' + bi(
          question.update
            ? '按更新后的全部线索，找出唯一符合的角色。'
            : '回想全部隐藏线索，找出唯一符合的角色。',
          question.update
            ? 'Use the complete updated clue set to find the unique suspect.'
            : 'Recall every hidden clue and find the unique suspect.'
        ) + '</div>' +
        '<div class="md-suspects">' +
        question.suspects.map(function (suspect) {
          return '<button class="md-suspect" data-id="' + suspect.id + '">' +
            '<span class="md-animal">' + suspect.icon + '</span>' +
            '<span class="md-traits">' + traitIcons(suspect) + '</span>' +
            '<span class="md-name">' + bi(suspect.zh, suspect.en) + '</span>' +
            '</button>';
        }).join('') +
        '</div>' +
        '<div class="md-actions"><button class="md-btn" id="md-hint">' +
          bi('💡 提示', '💡 Hint') + '</button></div>' +
        '<div class="md-msg">' + (message || '') + '</div>';

      host.querySelectorAll('[data-id]').forEach(function (button) {
        button.addEventListener('click', function () {
          submit(button.getAttribute('data-id'));
        });
      });

      host.querySelector('#md-hint').addEventListener('click', function () {
        if (done || locked) { return; }
        hints++;

        if (hints === 1) {
          say(
            '先逐条回想：是什么动物、什么颜色、带着什么物品。只有全部符合才可以。',
            'Recall the clues one by one: animal, color and accessory. The suspect must match every clue.'
          );
          return;
        }

        var clueIndex = Math.min(hints - 2, question.expectedClues.length - 1);
        var clue = question.expectedClues[clueIndex];
        say(
          '其中一条有效线索是：“' + clue.zh + '”（' + clue.icon + '）。',
          'One active clue is "' + clue.en + '" (' + clue.icon + ').'
        );
      });

      applyLang(host);
    }

    function finish() {
      done = true;
      locked = true;
      clearTimers();

      var tier = tries === 1 && hints === 0 && replays === 0
        ? 'best'
        : tries === 1
          ? 'better'
          : tries <= 2
            ? 'good'
            : 'valid';

      question.result = {
        tier: tier,
        tries: tries,
        hints: hints,
        replays: replays,
        clueCount: question.expectedClues.length,
        clueUpdate: question.mode === 'clue_update',
        zh: (tier === 'best' ? '⭐ ' : '') + '成功锁定角色',
        en: (tier === 'best' ? '⭐ ' : '') + 'Suspect identified'
      };

      host.querySelectorAll('button').forEach(function (button) {
        button.disabled = true;
      });

      var target = suspectById(question.answer);
      say(
        '🎉 正确！全部线索都指向' + target.zh + '。',
        '🎉 Correct! Every clue points to ' + target.en + '.'
      );

      schedule(function () {
        var button = document.querySelector('.s1-opt');
        if (button) { button.click(); }
      }, 900);
    }

    function submit(selected) {
      if (done || locked) { return; }
      tries++;

      if (selected === question.answer) {
        finish();
        return;
      }

      drawInvestigation('');
      say(
        '这个角色没有同时符合全部线索。逐条核对后再试一次。',
        'This suspect does not match every clue. Check each clue and try again.'
      );
    }

    function beginInvestigation(onReady) {
      host.innerHTML =
        '<div class="md-phase">' +
          bi('线索藏起来了…', 'The clues are hidden…') +
        '</div><div class="md-hidden">•••</div><div class="md-msg"></div>';
      applyLang(host);

      schedule(function () {
        drawInvestigation('');
        if (onReady) { onReady(); }
      }, question.retentionMs);
    }

    function preview(onReady) {
      locked = true;
      clearTimers();
      host.innerHTML =
        '<div class="md-instruction">' + bi(intro.zh, intro.en) + '</div>' +
        '<div class="md-phase">' +
          bi('请记住这些原始线索', 'Remember these original clues') +
        '</div>' +
        '<div class="md-clues">' +
          question.shownClues.map(clueHtml).join('') +
        '</div><div class="md-msg"></div>';
      applyLang(host);

      schedule(function () {
        beginInvestigation(onReady);
      }, question.exposureMs);
    }

    question.replayOriginal = function (onReady) {
      if (done) {
        onReady();
        return;
      }

      replays++;
      preview(onReady);
    };

    preview(null);
  }

  shell.createGame({
    id: SOURCE_GAME_ID,
    parallelUnits: true,
    theme: {
      primary: '#7c3aed',
      primary2: '#4c1d95',
      bg: '#faf5ff'
    },
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
        contentZh: '线索会短暂出现再藏起来。请记住并合并所有线索，从角色中找出唯一符合者。G2 还会更新一条隐藏线索。',
        contentEn: 'Clues appear briefly and then hide. Remember and combine every clue to identify the unique matching suspect. G2 also updates one hidden clue.'
      }
    },
    assistance: {
      replay: {
        enabled: true
      }
    },
    title: {
      zh: '🔎 记忆侦探',
      en: '🔎 Memory Detective'
    },
    subtitle: {
      zh: '保持线索，锁定唯一角色',
      en: 'Retain the clues and identify the suspect'
    },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units: UNITS,

    renderSequence: function (question, container) {
      container.innerHTML = '<div class="md-scene" id="md-host"></div>';
      question.result = null;
      playQuestion(question, container.querySelector('#md-host'));

      setTimeout(function () {
        var button = document.querySelector('.s1-opt');
        if (button) { button.style.display = 'none'; }
      }, 0);
    },

    replaySequence: function (question, container, unit, done) {
      if (typeof question.replayOriginal === 'function') {
        question.replayOriginal(done);
      } else {
        done();
      }
    },

    renderOption: function () {
      return '<span class="md-opt">✔</span>';
    },

    checkAnswer: function (selected, question) {
      return !!question.result;
    },

    onAnswer: function (selected, question, correct) {
      if (!correct || !question.result) { return; }

      setTimeout(function () {
        var feedback = document.getElementById('s1-fb');
        if (!feedback) { return; }
        feedback.innerHTML += '<div>' +
          bi(question.result.zh, question.result.en) + '</div>';
        applyLang(feedback);
      }, 0);
    },

    getVoiceText: function (question) {
      var text = instructionText(question);
      return shell.lang === 'zh' ? text.zh : text.en;
    },

    registerRootGenes: function (context) {
      var unit = context && context.unit;
      return genesFor(unit && unit.id);
    },

    getReportContext: function (context) {
      var unit = (context && context.unit) || {};
      var questions = unit.questions || [];
      var played = questions.filter(function (question) {
        return question.result;
      });
      var extra = {
        taskMechanisms: unique(questions.map(function (question) {
          return question.mode;
        })),
        cognitiveChain: [
          'observation',
          'encoding',
          'retention',
          'retrieval',
          'reorganization',
          'application'
        ],
        carrier: ['visual', 'attribute_clues'],
        workingMemory: unit.id === 'G2',
        geneIds: genesFor(unit.id),
        activityRuntime: 'puzzle'
      };

      if (played.length) {
        var tiers = { best: 0, better: 0, good: 0, valid: 0 };

        played.forEach(function (question) {
          tiers[question.result.tier]++;
        });

        extra.process = {
          tiers: tiers,
          optimalCount: tiers.best,
          retries: played.reduce(function (total, question) {
            return total + Math.max(0, question.result.tries - 1);
          }, 0),
          hints: played.reduce(function (total, question) {
            return total + question.result.hints;
          }, 0),
          replays: played.reduce(function (total, question) {
            return total + question.result.replays;
          }, 0),
          cluesRetained: played.reduce(function (total, question) {
            return total + question.result.clueCount;
          }, 0),
          clueUpdates: played.filter(function (question) {
            return question.result.clueUpdate;
          }).length
        };
      }

      refillUnit(unit.id);
      return buildRadarContext(unit.id, extra);
    }
  });
}());
