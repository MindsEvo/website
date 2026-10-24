'use strict';

/**
 * Memory Pairs+ — Game Config + RADAR CONTRACT (Shell-1, MindSeeds)
 *
 * Cards are previewed face up and then hidden. The child completes every pair
 * from memory. G2 announces one hidden position swap before matching.
 *
 * Metadata: /metadata/mindseeds/memory-pairs.json
 */
(function () {
  var MODULE_ID = 'memory-pairs';
  var MODULE_TYPE = 'mindseeds';
  var SOURCE_GAME_ID = 'memory-pairs';

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
    var cfg = MP_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }

    return {
      information_load: cfg.pairCount === 2
        ? 'two_pairs'
        : cfg.pairCount === 3
          ? 'three_pairs'
          : 'four_pairs',
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
      similarity: cfg.similarity,
      interference: cfg.mode === 'swap_update' ? 'position_swap' : 'none',
      processing_complexity: cfg.mode === 'swap_update'
        ? 'hidden_position_update'
        : 'pair_retrieval',
      retrieval_demand: 'complete_pair_matching'
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
      var meta = MP_DATA.units[gradeCode];
      return {
        id: gradeCode,
        gradeCode: LEVEL_GRADE[gradeCode],
        icon: meta.icon,
        nameZh: meta.nameZh,
        nameEn: meta.nameEn,
        descZh: meta.descZh,
        descEn: meta.descEn,
        questions: MP_GEN.generate(gradeCode, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.MP_CONTRACT = {
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
          unit.questions = MP_GEN.generate(unitId, SESSION_SIZE);
        }
      });
    }, 0);
  }

  (function injectStyles() {
    if (document.getElementById('mp-shell-style')) { return; }

    var style = document.createElement('style');
    style.id = 'mp-shell-style';
    style.textContent = [
      '.s1-seq{text-align:center!important;letter-spacing:0!important;}',
      '.mp-scene{display:flex;flex-direction:column;align-items:center;gap:12px;}',
      '.mp-instruction{max-width:440px;background:#fff;border:2px solid #c4b5fd;border-radius:14px;padding:9px 13px;font-size:15px;font-weight:850;color:#4c1d95;line-height:1.5;}',
      '.mp-update{max-width:440px;background:#fef3c7;border:3px solid #f59e0b;border-radius:14px;padding:9px 13px;font-size:15px;font-weight:900;color:#92400e;line-height:1.5;}',
      '.mp-board{display:grid;gap:9px;width:min(94vw,460px);}',
      '.mp-card{aspect-ratio:1/1;min-width:0;border:3px solid #8b5cf6;border-radius:15px;background:linear-gradient(145deg,#ede9fe,#ddd6fe);display:flex;align-items:center;justify-content:center;font-family:inherit;cursor:pointer;touch-action:manipulation;box-shadow:0 4px 10px rgba(76,29,149,.12);}',
      '.mp-card-face{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;}',
      '.mp-card-face b{font-size:clamp(28px,7vw,46px);line-height:1;}',
      '.mp-card-face span{font-size:11px;font-weight:850;color:#4c1d95;}',
      '.mp-card-back{font-size:clamp(25px,6vw,40px);color:#6d28d9;font-weight:950;}',
      '.mp-card.open{background:#fff;}',
      '.mp-card.matched{border-color:#22c55e;background:#dcfce7;cursor:default;}',
      '.mp-card:disabled{cursor:default;}',
      '.mp-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;}',
      '.mp-btn{border:none;border-radius:999px;padding:8px 17px;color:#fff;background:#0ea5e9;font-family:inherit;font-size:14px;font-weight:900;cursor:pointer;}',
      '.mp-msg{min-height:44px;max-width:440px;font-size:14px;font-weight:800;color:#4c1d95;line-height:1.5;}',
      '.mp-progress{font-size:14px;font-weight:900;color:#6d28d9;}',
      '.mp-opt{font-size:20px;font-weight:900;}'
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
    if (question.mode === 'swap_update') {
      return {
        zh: '玩法：先记住每张卡的位置。卡片藏起来后，两张指定位置的卡会交换；更新记忆，再找出全部配对。',
        en: 'How to play: remember every card location. After the cards hide, two announced positions swap; update your memory, then complete every pair.'
      };
    }

    return {
      zh: '玩法：先记住每张卡的位置。卡片藏起来后，每次翻开两张，找出全部相同配对。',
      en: 'How to play: remember every card location. After they hide, turn over two at a time and complete every matching pair.'
    };
  }

  function playBoard(question, host) {
    var openIndexes = [];
    var matched = {};
    var attempts = 0;
    var mismatches = 0;
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

    function matchedCount() {
      return Object.keys(matched).length / 2;
    }

    function cardFace(card) {
      return '<span class="mp-card-face"><b>' + card.item.icon + '</b>' +
        bi(card.item.zh, card.item.en) + '</span>';
    }

    function updateText() {
      if (!question.update) { return ''; }

      return '<div class="mp-update">' + bi(
        '位置变化：第 ' + (question.update.firstIndex + 1) + ' 张卡和第 ' +
          (question.update.secondIndex + 1) + ' 张卡交换位置。',
        'Position update: card ' + (question.update.firstIndex + 1) +
          ' and card ' + (question.update.secondIndex + 1) + ' swap places.'
      ) + '</div>';
    }

    function say(zh, en) {
      var message = host.querySelector('.mp-msg');
      if (message) {
        message.innerHTML = bi(zh, en);
        applyLang(message);
      }
    }

    function finish() {
      done = true;
      locked = true;
      clearTimers();

      var tier = attempts === question.pairCount &&
        hints === 0 && replays === 0
        ? 'best'
        : mismatches === 0
          ? 'better'
          : mismatches <= 2
            ? 'good'
            : 'valid';

      question.result = {
        tier: tier,
        attempts: attempts,
        mismatches: mismatches,
        hints: hints,
        replays: replays,
        pairs: question.pairCount,
        positionUpdate: question.mode === 'swap_update',
        zh: (tier === 'best' ? '⭐ ' : '') + '全部配对完成',
        en: (tier === 'best' ? '⭐ ' : '') + 'All pairs completed'
      };

      drawBoard('');
      say(
        '🎉 完成！你找到了全部 ' + question.pairCount + ' 对卡片。',
        '🎉 Complete! You found all ' + question.pairCount + ' pairs.'
      );

      schedule(function () {
        var button = document.querySelector('.s1-opt');
        if (button) { button.click(); }
      }, 900);
    }

    function drawBoard(message) {
      host.innerHTML = updateText() +
        '<div class="mp-instruction">' + bi(
          locked
            ? '请观察并记住每张卡的位置。'
            : '每次翻开两张卡，找出全部相同配对。',
          locked
            ? 'Observe and remember every card location.'
            : 'Turn over two cards at a time and complete every match.'
        ) + '</div>' +
        '<div class="mp-progress">' + bi(
          '已完成 ' + matchedCount() + ' / ' + question.pairCount + ' 对',
          'Matched ' + matchedCount() + ' / ' + question.pairCount + ' pairs'
        ) + '</div>' +
        '<div class="mp-board" style="grid-template-columns:repeat(' +
          question.columns + ',minmax(0,1fr))">' +
        question.cards.map(function (card, index) {
          var isMatched = !!matched[index];
          var isOpen = locked || isMatched || openIndexes.indexOf(index) >= 0;

          return '<button class="mp-card' +
            (isOpen ? ' open' : '') +
            (isMatched ? ' matched' : '') +
            '" data-index="' + index + '"' +
            (locked || isMatched || done ? ' disabled' : '') + '>' +
            (isOpen ? cardFace(card) : '<span class="mp-card-back">?</span>') +
            '</button>';
        }).join('') + '</div>' +
        '<div class="mp-actions"><button class="mp-btn" id="mp-hint"' +
          (locked || done ? ' disabled' : '') + '>' +
          bi('💡 提示', '💡 Hint') + '</button></div>' +
        '<div class="mp-msg">' + (message || '') + '</div>';

      host.querySelectorAll('[data-index]').forEach(function (button) {
        button.addEventListener('click', function () {
          reveal(Number(button.getAttribute('data-index')));
        });
      });

      var hintButton = host.querySelector('#mp-hint');
      if (hintButton) {
        hintButton.addEventListener('click', function () {
          if (locked || done) { return; }
          hints++;

          if (hints === 1) {
            say(
              '先想一想刚才翻过但没有配成对的卡，它可能在哪里。',
              'Recall a card you already turned over without matching. Where was it?'
            );
            return;
          }

          var available = question.cards.map(function (card, index) {
            return matched[index] ? null : {
              card: card,
              index: index
            };
          }).filter(Boolean);

          if (available.length) {
            var target = available[0];
            say(
              '提示：第 ' + (target.index + 1) + ' 个位置是' +
                target.card.item.zh + '（' + target.card.item.icon + '）。',
              'Hint: position ' + (target.index + 1) + ' contains ' +
                target.card.item.en + ' (' + target.card.item.icon + ').'
            );
          }
        });
      }

      applyLang(host);
    }

    function reveal(index) {
      if (locked || done || matched[index] ||
          openIndexes.indexOf(index) >= 0 || openIndexes.length >= 2) {
        return;
      }

      openIndexes.push(index);
      drawBoard('');

      if (openIndexes.length < 2) { return; }

      locked = true;
      attempts++;

      var firstIndex = openIndexes[0];
      var secondIndex = openIndexes[1];
      var first = question.cards[firstIndex];
      var second = question.cards[secondIndex];

      if (first.pairId === second.pairId) {
        matched[firstIndex] = true;
        matched[secondIndex] = true;
        openIndexes = [];

        schedule(function () {
          if (matchedCount() === question.pairCount) {
            finish();
            return;
          }

          locked = false;
          drawBoard('');
          say(
            '配对成功！继续找剩下的卡片。',
            'Match found! Continue with the remaining cards.'
          );
        }, 550);
        return;
      }

      mismatches++;
      schedule(function () {
        openIndexes = [];
        locked = false;
        drawBoard('');
        say(
          '这两张不一样。记住它们的位置，再试一次。',
          'Those cards do not match. Remember their locations and try again.'
        );
      }, 850);
    }

    function beginMatching(onReady) {
      locked = true;
      openIndexes = [];
      drawBoard('');

      schedule(function () {
        locked = false;
        drawBoard('');
        if (onReady) { onReady(); }
      }, question.retentionMs);
    }

    function preview(onReady) {
      locked = true;
      openIndexes = [];
      matched = {};
      host.innerHTML =
        '<div class="mp-instruction">' + bi(intro.zh, intro.en) + '</div>' +
        '<div class="mp-board" style="grid-template-columns:repeat(' +
          question.columns + ',minmax(0,1fr))">' +
        question.originalCards.map(function (card) {
          return '<button class="mp-card open" disabled>' +
            cardFace(card) + '</button>';
        }).join('') + '</div><div class="mp-msg"></div>';
      applyLang(host);

      schedule(function () {
        beginMatching(onReady);
      }, question.exposureMs);
    }

    question.replayOriginal = function (onReady) {
      if (done) {
        onReady();
        return;
      }

      clearTimers();
      openIndexes = [];
      matched = {};
      replays++;
      preview(onReady);
    };

    preview(null);
  }

  shell.createGame({
    id: SOURCE_GAME_ID,
    parallelUnits: true,
    theme: {
      primary: '#8b5cf6',
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
        contentZh: '卡片会先全部展示再藏起来。凭记忆每次翻开两张，完成所有相同配对。G2 还要根据提示更新两张卡的位置。',
        contentEn: 'All cards appear before hiding. Turn over two at a time from memory and complete every match. G2 also updates two card positions after an announced swap.'
      }
    },
    assistance: {
      replay: {
        enabled: true
      }
    },
    title: {
      zh: '🧩 记忆配对',
      en: '🧩 Memory Pairs+'
    },
    subtitle: {
      zh: '记住位置，找出全部配对',
      en: 'Remember locations and complete every pair'
    },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units: UNITS,

    renderSequence: function (question, container) {
      container.innerHTML = '<div class="mp-scene" id="mp-host"></div>';
      question.result = null;
      playBoard(question, container.querySelector('#mp-host'));

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
      return '<span class="mp-opt">✔</span>';
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
          'reorganization'
        ],
        carrier: ['visual', 'spatial', 'paired_objects'],
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
          attempts: played.reduce(function (total, question) {
            return total + question.result.attempts;
          }, 0),
          mismatches: played.reduce(function (total, question) {
            return total + question.result.mismatches;
          }, 0),
          hints: played.reduce(function (total, question) {
            return total + question.result.hints;
          }, 0),
          replays: played.reduce(function (total, question) {
            return total + question.result.replays;
          }, 0),
          pairsCompleted: played.reduce(function (total, question) {
            return total + question.result.pairs;
          }, 0),
          positionUpdates: played.filter(function (question) {
            return question.result.positionUpdate;
          }).length
        };
      }

      refillUnit(unit.id);
      return buildRadarContext(unit.id, extra);
    }
  });
}());
