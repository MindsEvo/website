'use strict';

/**
 * What Happened? — Game Config + RADAR CONTRACT (Shell-1, MindSeeds)
 *
 * A scene appears, disappears, and returns with one contextual change. The
 * child identifies the change from memory rather than comparing two visible
 * scenes or predicting a pattern.
 *
 * Metadata: /metadata/mindseeds/what-happened.json
 */
(function () {
  var MODULE_ID = 'what-happened';
  var MODULE_TYPE = 'mindseeds';
  var SOURCE_GAME_ID = 'what-happened';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var BASE_GENES = [
    'RG.MEMORY.VISUAL.RECOGNITION',
    'RG.MEMORY.SPATIAL.BASIC'
  ];
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
    var cfg = WH_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }

    return {
      information_load: {
        K1: 'three_objects',
        K2: 'four_objects',
        G1: 'five_objects',
        G2: 'five_objects'
      }[gradeCode],
      exposure_time: {
        K1: 'long',
        K2: 'medium',
        G1: 'short',
        G2: 'shortest'
      }[gradeCode],
      retention_delay: {
        K1: 'short',
        K2: 'medium',
        G1: 'long',
        G2: 'longest'
      }[gradeCode],
      interference: gradeCode === 'K1'
        ? 'single_missing'
        : gradeCode === 'K2'
          ? 'object_presence_change'
          : gradeCode === 'G1'
            ? 'object_or_location_change'
            : 'location_or_identity_update',
      processing_complexity: cfg.processing,
      organization_support: 'fixed_scene_slots',
      retrieval_demand: 'change_identification'
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
      var meta = WH_DATA.units[gradeCode];
      return {
        id: gradeCode,
        gradeCode: LEVEL_GRADE[gradeCode],
        icon: meta.icon,
        nameZh: meta.nameZh,
        nameEn: meta.nameEn,
        descZh: meta.descZh,
        descEn: meta.descEn,
        questions: WH_GEN.generate(gradeCode, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.WH_CONTRACT = {
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
          unit.questions = WH_GEN.generate(unitId, SESSION_SIZE);
        }
      });
    }, 0);
  }

  (function injectStyles() {
    if (document.getElementById('wh-shell-style')) { return; }

    var style = document.createElement('style');
    style.id = 'wh-shell-style';
    style.textContent = [
      '.s1-seq{text-align:center!important;letter-spacing:0!important;}',
      '.wh-scene{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;}',
      '.wh-instruction{max-width:460px;background:#fff;border:2px solid #93c5fd;border-radius:14px;padding:9px 13px;font-size:15px;font-weight:850;color:#1e3a8a;line-height:1.5;}',
      '.wh-phase{font-size:14px;font-weight:900;color:#2563eb;}',
      '.wh-board{display:grid;gap:10px;width:min(94vw,500px);grid-template-columns:repeat(3,minmax(0,1fr));}',
      '.wh-slot{aspect-ratio:1.18/1;min-width:0;border:3px solid #93c5fd;border-radius:16px;background:linear-gradient(145deg,#eff6ff,#dbeafe);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(30,64,175,.10);}',
      '.wh-slot.empty{border-style:dashed;background:#f8fafc;}',
      '.wh-object{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;}',
      '.wh-object b{font-size:clamp(30px,8vw,50px);line-height:1;}',
      '.wh-object span{font-size:12px;font-weight:850;color:#1e3a8a;}',
      '.wh-hidden{min-height:112px;display:flex;align-items:center;justify-content:center;font-size:42px;color:#2563eb;}',
      '.wh-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;width:min(94vw,500px);}',
      '.wh-option{min-height:58px;border:3px solid #60a5fa;border-radius:14px;background:#fff;padding:8px 10px;font-family:inherit;font-size:14px;font-weight:900;color:#1e3a8a;line-height:1.35;cursor:pointer;touch-action:manipulation;}',
      '.wh-option:hover:not(:disabled){background:#eff6ff;}',
      '.wh-option:disabled{cursor:default;opacity:.62;}',
      '.wh-actions{display:flex;justify-content:center;}',
      '.wh-btn{border:none;border-radius:999px;padding:8px 17px;color:#fff;background:#0ea5e9;font-family:inherit;font-size:14px;font-weight:900;cursor:pointer;}',
      '.wh-msg{min-height:44px;max-width:460px;font-size:14px;font-weight:800;color:#1e3a8a;line-height:1.5;}',
      '.wh-opt{font-size:20px;font-weight:900;}',
      '@media(max-width:430px){.wh-options{grid-template-columns:1fr;}.wh-board{gap:7px;}}'
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
    if (question.gradeCode === 'K1') {
      return {
        zh: '玩法：先记住小场景。场景藏起来后会回来，但有一个对象不见了。找出发生的变化。',
        en: 'How to play: remember the scene. It will return after hiding, but one object will be missing. Identify the change.'
      };
    }
    if (question.gradeCode === 'K2') {
      return {
        zh: '玩法：先记住场景。它回来时会少一个对象或多一个对象，判断发生了什么。',
        en: 'How to play: remember the scene. When it returns, one object will be missing or one will have appeared. Identify what happened.'
      };
    }
    if (question.gradeCode === 'G1') {
      return {
        zh: '玩法：记住对象和位置。场景回来时，对象可能消失、出现或移动，找出实际变化。',
        en: 'How to play: remember the objects and their locations. When the scene returns, an object may disappear, appear or move. Identify the actual change.'
      };
    }
    return {
      zh: '玩法：记住完整场景。较长等待后，对象会移动或被替换，更新你对情境的记忆并判断变化。',
      en: 'How to play: remember the complete scene. After a longer delay, an object will move or be replaced. Update your contextual memory and identify the change.'
    };
  }

  function renderObject(item) {
    if (!item) { return ''; }
    return '<div class="wh-object"><b>' + item.icon + '</b>' +
      bi(item.zh, item.en) + '</div>';
  }

  function renderScene(scene) {
    return '<div class="wh-board">' + scene.map(function (item) {
      return '<div class="wh-slot' + (item ? '' : ' empty') + '">' +
        renderObject(item) + '</div>';
    }).join('') + '</div>';
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

    function say(zh, en) {
      var message = host.querySelector('.wh-msg');
      if (message) {
        message.innerHTML = bi(zh, en);
        applyLang(message);
      }
    }

    function drawChoices(message) {
      locked = false;
      host.innerHTML =
        '<div class="wh-phase">' + bi('变化后的场景', 'Changed scene') + '</div>' +
        renderScene(question.after) +
        '<div class="wh-instruction">' + bi(
          '回想刚才的场景，选择真正发生的变化。',
          'Recall the earlier scene and choose the change that actually happened.'
        ) + '</div>' +
        '<div class="wh-options">' + question.options.map(function (option) {
          return '<button class="wh-option" data-answer="' + option.id + '">' +
            bi(option.zh, option.en) + '</button>';
        }).join('') + '</div>' +
        '<div class="wh-actions"><button class="wh-btn" id="wh-hint">' +
          bi('💡 提示', '💡 Hint') + '</button></div>' +
        '<div class="wh-msg">' + (message || '') + '</div>';

      host.querySelectorAll('[data-answer]').forEach(function (button) {
        button.addEventListener('click', function () {
          submit(button.getAttribute('data-answer'));
        });
      });

      host.querySelector('#wh-hint').addEventListener('click', function () {
        if (done || locked) { return; }
        hints++;

        if (hints === 1) {
          if (question.changeType === 'moved') {
            say(
              '先逐个核对对象，再比较它们原来所在的位置。',
              'Check each object first, then compare where each one was located.'
            );
          } else if (question.changeType === 'replaced') {
            say(
              '对象数量没有变化。想一想哪个原来的对象不见了，又出现了什么。',
              'The number of objects stayed the same. Recall which original object is gone and what appeared instead.'
            );
          } else {
            say(
              '先比较场景里的对象种类，再判断是少了一个还是多了一个。',
              'Compare which objects are present, then decide whether one disappeared or appeared.'
            );
          }
          return;
        }

        var changedItem = question.change.oldItem || question.change.newItem;
        say(
          '再看一眼变化涉及的对象：' + changedItem.zh + '（' + changedItem.icon + '）。',
          'The change involves ' + changedItem.en + ' (' + changedItem.icon + ').'
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
        changeType: question.changeType,
        processing: question.processing,
        zh: (tier === 'best' ? '⭐ ' : '') + '正确识别场景变化',
        en: (tier === 'best' ? '⭐ ' : '') + 'Scene change identified'
      };

      host.querySelectorAll('button').forEach(function (button) {
        button.disabled = true;
      });

      say(
        '🎉 正确！你找出了场景里真正发生的变化。',
        '🎉 Correct! You identified what actually changed in the scene.'
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

      drawChoices('');
      say(
        '这个变化没有发生。回想原来的对象和位置，再试一次。',
        'That change did not happen. Recall the original objects and locations, then try again.'
      );
    }

    function showAfter(onReady) {
      host.innerHTML =
        '<div class="wh-phase">' + bi('场景藏起来了…', 'The scene is hidden…') + '</div>' +
        '<div class="wh-hidden">•••</div><div class="wh-msg"></div>';
      applyLang(host);

      schedule(function () {
        drawChoices('');
        if (onReady) { onReady(); }
      }, question.retentionMs);
    }

    function preview(onReady) {
      locked = true;
      clearTimers();
      host.innerHTML =
        '<div class="wh-instruction">' + bi(intro.zh, intro.en) + '</div>' +
        '<div class="wh-phase">' + bi('原来的场景', 'Original scene') + '</div>' +
        renderScene(question.before) +
        '<div class="wh-msg"></div>';
      applyLang(host);

      schedule(function () {
        showAfter(onReady);
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
      primary: '#2563eb',
      primary2: '#1e3a8a',
      bg: '#eff6ff'
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
        contentZh: '先记住原来的场景。场景藏起来后会带着一个变化回来，请凭记忆判断对象消失、出现、移动或替换中的实际变化。',
        contentEn: 'Remember the original scene. It returns after hiding with one change. Use memory to identify an object disappearing, appearing, moving or being replaced.'
      }
    },
    assistance: {
      replay: {
        enabled: true
      }
    },
    title: {
      zh: '🖼️ 发生了什么',
      en: '🖼️ What Happened?'
    },
    subtitle: {
      zh: '记住场景，找出真正的变化',
      en: 'Remember the scene and identify the change'
    },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units: UNITS,

    renderSequence: function (question, container) {
      container.innerHTML = '<div class="wh-scene" id="wh-host"></div>';
      question.result = null;
      playQuestion(question, container.querySelector('#wh-host'));

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
      return '<span class="wh-opt">✔</span>';
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
          return question.changeType;
        })),
        cognitiveChain: [
          'observation',
          'encoding',
          'retention',
          'retrieval',
          'reorganization'
        ],
        carrier: ['visual', 'spatial', 'contextual_scene'],
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
          changeTypes: unique(played.map(function (question) {
            return question.result.changeType;
          })),
          contextUpdates: played.filter(function (question) {
            return question.result.processing === 'context_update';
          }).length
        };
      }

      refillUnit(unit.id);
      return buildRadarContext(unit.id, extra);
    }
  });
}());
