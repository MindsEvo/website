'use strict';

/**
 * Magic Sequence — Game Config + RADAR CONTRACT (Shell-1, MindSeeds)
 *
 * Items appear one at a time and disappear. The child reconstructs the hidden
 * sequence. G2 applies one announced replacement before reconstruction.
 *
 * Metadata: /metadata/mindseeds/magic-sequence.json
 * RootGene: RG.MEMORY.SEQUENTIAL.RECALL
 */
(function () {
  var MODULE_ID = 'magic-sequence';
  var MODULE_TYPE = 'mindseeds';
  var SOURCE_GAME_ID = 'magic-sequence';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.MEMORY.SEQUENTIAL.RECALL'];
  var SESSION_SIZE = 8;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: {
        information_load: 'two',
        exposure_time: 'long',
        retention_delay: 'short',
        processing_complexity: 'rebuild'
      },
      K2: {
        information_load: 'three',
        exposure_time: 'medium',
        retention_delay: 'medium',
        processing_complexity: 'rebuild'
      },
      G1: {
        information_load: 'four',
        exposure_time: 'short',
        retention_delay: 'long',
        processing_complexity: 'rebuild'
      },
      G2: {
        information_load: 'four',
        exposure_time: 'shortest',
        retention_delay: 'longest',
        processing_complexity: 'update'
      }
    }[gradeCode];
    return base ? Object.assign({}, base) : null;
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
    var names = {
      K1: {
        icon: '✨',
        nameZh: '两个魔法符号',
        nameEn: 'Two Magic Symbols',
        descZh: '依次看两个符号，藏起来后按原顺序重建。',
        descEn: 'Watch two symbols appear, then rebuild their original order.'
      },
      K2: {
        icon: '🌟',
        nameZh: '三个魔法符号',
        nameEn: 'Three Magic Symbols',
        descZh: '保持三个依次出现的符号并重建顺序。',
        descEn: 'Retain three sequential symbols and rebuild their order.'
      },
      G1: {
        icon: '🔮',
        nameZh: '更长的魔法顺序',
        nameEn: 'Longer Magic Sequence',
        descZh: '记住四个符号，并在较长等待后重建。',
        descEn: 'Remember four symbols and rebuild them after a longer delay.'
      },
      G2: {
        icon: '🪄',
        nameZh: '变化的魔法顺序',
        nameEn: 'Changing Magic Sequence',
        descZh: '记住四个符号，替换指定位置后重建完整顺序。',
        descEn: 'Remember four symbols, replace one position, then rebuild the sequence.'
      }
    };

    return GRADE_ORDER.map(function (gradeCode) {
      var meta = names[gradeCode];
      return {
        id: gradeCode,
        gradeCode: LEVEL_GRADE[gradeCode],
        icon: meta.icon,
        nameZh: meta.nameZh,
        nameEn: meta.nameEn,
        descZh: meta.descZh,
        descEn: meta.descEn,
        questions: MS_GEN.generate(gradeCode, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.MS_CONTRACT = {
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
      UNITS.forEach(function (unit) {
        if (unit.id === unitId) {
          unit.questions = MS_GEN.generate(unitId, SESSION_SIZE);
        }
      });
    }, 0);
  }

  (function injectStyles() {
    if (document.getElementById('ms-shell-style')) { return; }
    var style = document.createElement('style');
    style.id = 'ms-shell-style';
    style.textContent = [
      '.s1-seq{text-align:center!important;letter-spacing:0!important;}',
      '.ms-scene{display:flex;flex-direction:column;align-items:center;gap:12px;}',
      '.ms-instruction{max-width:390px;background:#fff;border:2px solid #c4b5fd;border-radius:14px;padding:9px 13px;font-size:15px;font-weight:850;color:#4c1d95;line-height:1.5;}',
      '.ms-stage{min-width:150px;min-height:112px;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,#ede9fe,#faf5ff);border:3px solid #a78bfa;border-radius:20px;}',
      '.ms-stage-item{font-size:64px;line-height:1;}',
      '.ms-stage-count{font-size:15px;font-weight:900;color:#6d28d9;}',
      '.ms-update{max-width:390px;background:#fef3c7;border:3px solid #f59e0b;border-radius:14px;padding:9px 13px;font-size:15px;font-weight:900;color:#92400e;line-height:1.5;}',
      '.ms-built,.ms-choices,.ms-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;}',
      '.ms-slot{min-width:62px;min-height:66px;border:3px dashed #94a3b8;border-radius:14px;background:#f8fafc;display:flex;align-items:center;justify-content:center;font-size:30px;}',
      '.ms-choice{min-width:70px;min-height:72px;background:#fff;border:3px solid #a78bfa;border-radius:14px;padding:7px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-family:inherit;cursor:pointer;touch-action:manipulation;}',
      '.ms-choice b{font-size:32px;line-height:1;}',
      '.ms-choice span{font-size:12px;font-weight:850;color:#4c1d95;}',
      '.ms-choice:disabled{opacity:.38;cursor:default;}',
      '.ms-btn{border:none;border-radius:999px;padding:8px 17px;color:#fff;background:#7c3aed;font-family:inherit;font-size:14px;font-weight:900;cursor:pointer;}',
      '.ms-btn.alt{background:#64748b;}',
      '.ms-btn.hint{background:#0ea5e9;}',
      '.ms-msg{min-height:44px;max-width:390px;font-size:14px;font-weight:800;color:#4c1d95;line-height:1.5;}',
      '.ms-opt{font-size:20px;font-weight:900;}'
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

  function itemOf(question, id) {
    return question.items.filter(function (item) {
      return item.id === id;
    })[0];
  }

  function instructionText(question) {
    if (question.mode === 'update') {
      return {
        zh: '玩法：符号会从左到右依次出现。记住完整顺序；它们藏起来后，先完成指定替换，再点击更新后的完整顺序。',
        en: 'How to play: symbols appear one at a time from left to right. Remember the full order; after they hide, apply the replacement and tap the complete updated sequence.'
      };
    }
    return {
      zh: '玩法：符号会从左到右依次出现。记住完整顺序；它们藏起来后，按照相同顺序依次点击。',
      en: 'How to play: symbols appear one at a time from left to right. Remember the full order; after they hide, tap them in the same order.'
    };
  }

  function playBoard(question, host) {
    var selected = [];
    var tries = 0;
    var hints = 0;
    var replays = 0;
    var done = false;
    var timers = [];
    var intro = instructionText(question);

    function schedule(callback, delay) {
      var timer = setTimeout(callback, delay);
      timers.push(timer);
      return timer;
    }

    function clearTimers() {
      timers.forEach(function (timer) { clearTimeout(timer); });
      timers = [];
    }

    function say(zh, en) {
      var message = host.querySelector('.ms-msg');
      if (message) {
        message.innerHTML = bi(zh, en);
        applyLang(message);
      }
    }

    function expectedIcons() {
      return question.expected.map(function (id) {
        return itemOf(question, id).icon;
      }).join(' ');
    }

    function finish(tier, zh, en) {
      done = true;
      clearTimers();
      question.result = {
        tier: tier,
        tries: tries,
        hints: hints,
        replays: replays,
        zh: zh,
        en: en
      };
      schedule(function () {
        var button = document.querySelector('.s1-opt');
        if (button) { button.click(); }
      }, 900);
    }

    function updateText() {
      if (!question.update) { return ''; }
      return '<div class="ms-update">' + bi(
        '变化：第 ' + (question.update.index + 1) + ' 个符号，' +
          question.update.oldItem.zh + '（' + question.update.oldItem.icon + '）换成 ' +
          question.update.newItem.zh + '（' + question.update.newItem.icon + '）。',
        'Update: symbol ' + (question.update.index + 1) + ' changes from ' +
          question.update.oldItem.en + ' (' + question.update.oldItem.icon + ') to ' +
          question.update.newItem.en + ' (' + question.update.newItem.icon + ').'
      ) + '</div>';
    }

    function drawAnswer(message) {
      clearTimers();
      host.innerHTML = updateText() +
        '<div class="ms-instruction">' + bi(
          question.mode === 'update'
            ? '请点击 ' + question.expected.length + ' 个符号：先完成上面的替换，再从左到右点击更新后的完整顺序。'
            : '请点击 ' + question.expected.length + ' 个符号：按照刚才出现的顺序，从左到右依次点击。',
          question.mode === 'update'
            ? 'Tap ' + question.expected.length + ' symbols: apply the replacement above, then tap the complete updated sequence from left to right.'
            : 'Tap ' + question.expected.length + ' symbols from left to right in the order they appeared.'
        ) + '</div>' +
        '<div class="ms-built">' + question.expected.map(function (_, index) {
          var item = selected[index] ? itemOf(question, selected[index]) : null;
          return '<div class="ms-slot">' + (item ? item.icon : (index + 1)) + '</div>';
        }).join('') + '</div>' +
        '<div class="ms-choices">' + question.choices.map(function (id) {
          var item = itemOf(question, id);
          return '<button class="ms-choice" data-id="' + id + '"' +
            (selected.indexOf(id) >= 0 ? ' disabled' : '') + '><b>' + item.icon +
            '</b>' + bi(item.zh, item.en) + '</button>';
        }).join('') + '</div>' +
        '<div class="ms-actions"><button class="ms-btn alt" id="ms-reset">' +
          bi('重新选择', 'Reset') + '</button><button class="ms-btn hint" id="ms-hint">' +
          bi('💡 提示', '💡 Hint') + '</button></div>' +
        '<div class="ms-msg">' + (message || '') + '</div>';

      host.querySelectorAll('[data-id]').forEach(function (button) {
        button.addEventListener('click', function () {
          if (done) { return; }
          selected.push(button.getAttribute('data-id'));
          if (selected.length === question.expected.length) {
            check();
          } else {
            drawAnswer('');
          }
        });
      });

      host.querySelector('#ms-reset').addEventListener('click', function () {
        if (!done) {
          selected = [];
          drawAnswer('');
        }
      });

      host.querySelector('#ms-hint').addEventListener('click', function () {
        if (done) { return; }
        hints++;
        var nextId = question.expected[selected.length] || question.expected[0];
        var next = itemOf(question, nextId);
        if (hints === 1) {
          say(
            '先数一数需要还原几个位置，再回想每个符号出现的先后。' +
              (question.mode === 'update' ? '别忘了先完成替换。' : ''),
            'First count the positions, then recall when each symbol appeared.' +
              (question.mode === 'update' ? ' Remember to apply the replacement first.' : '')
          );
        } else {
          say(
            '正确顺序里的下一个符号是 ' + next.zh + '（' + next.icon + '）。',
            'The next symbol is ' + next.en + ' (' + next.icon + ').'
          );
        }
      });

      applyLang(host);
    }

    function check() {
      tries++;
      var correct = selected.length === question.expected.length &&
        selected.every(function (id, index) {
          return id === question.expected[index];
        });

      if (correct) {
        var first = tries === 1;
        say(
          '🎉 完成！正确顺序是 ' + expectedIcons() + '。',
          '🎉 Complete! The order is ' + expectedIcons() + '.'
        );
        finish(
          first && hints === 0 && replays === 0 ? 'best' : first ? 'better' : tries <= 2 ? 'good' : 'valid',
          (first && hints === 0 && replays === 0 ? '⭐ ' : '') + (first ? '一次完成' : '调整后完成'),
          (first && hints === 0 && replays === 0 ? '⭐ ' : '') +
            (first ? 'Completed first try' : 'Completed after adjusting')
        );
        return;
      }

      var chosen = selected.map(function (id) {
        return itemOf(question, id).icon;
      }).join(' ');
      selected = [];
      drawAnswer('');
      say(
        '你刚才选择的是 ' + chosen + '，顺序还不对。回想符号出现的先后，再试一次。',
        'You chose ' + chosen + '. The order is not right yet. Recall when the symbols appeared and try again.'
      );
    }

    function showItem(index, onReady) {
      if (index >= question.shown.length) {
        host.innerHTML =
          '<div class="ms-instruction">' + bi('请继续记住完整顺序。', 'Keep the complete order in mind.') + '</div>' +
          '<div class="ms-stage"><div class="ms-stage-count">' +
            bi('准备作答…', 'Get ready…') + '</div></div><div class="ms-msg"></div>';
        applyLang(host);
        schedule(function () {
          drawAnswer('');
          if (onReady) { onReady(); }
        }, question.retentionMs);
        return;
      }

      var item = question.shown[index];
      host.innerHTML =
        '<div class="ms-instruction">' + bi(intro.zh, intro.en) + '</div>' +
        '<div class="ms-stage"><div><div class="ms-stage-item">' + item.icon + '</div>' +
        '<div class="ms-stage-count">' + (index + 1) + ' / ' + question.shown.length +
        '</div></div></div><div class="ms-msg"></div>';
      applyLang(host);

      schedule(function () {
        host.innerHTML =
          '<div class="ms-instruction">' + bi(intro.zh, intro.en) + '</div>' +
          '<div class="ms-stage"><div class="ms-stage-count">…</div></div><div class="ms-msg"></div>';
        applyLang(host);
        schedule(function () {
          showItem(index + 1, onReady);
        }, question.gapMs);
      }, question.exposureMs);
    }

    question.replayOriginal = function (onReady) {
      if (done) { onReady(); return; }
      clearTimers();
      selected = [];
      replays++;
      showItem(0, onReady);
    };

    showItem(0, null);
  }

  shell.createGame({
    id: SOURCE_GAME_ID,
    parallelUnits: true,
    theme: { primary: '#8b5cf6', primary2: '#4c1d95', bg: '#faf5ff' },
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
        contentZh: '符号会一个接一个出现并消失。记住它们出现的先后，再从左到右重建完整顺序。高等级还要先完成一次替换。',
        contentEn: 'Symbols appear one at a time and disappear. Remember their order, then rebuild the complete sequence from left to right. Higher grades also apply one replacement.'
      }
    },
    assistance: { replay: { enabled: true } },
    title: { zh: '🪄 魔法顺序', en: '🪄 Magic Sequence' },
    subtitle: { zh: '一个接一个出现，藏起来后还原', en: 'Watch one by one, then rebuild' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units: UNITS,

    renderSequence: function (question, container) {
      container.innerHTML = '<div class="ms-scene" id="ms-host"></div>';
      question.result = null;
      playBoard(question, container.querySelector('#ms-host'));
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
      return '<span class="ms-opt">✔</span>';
    },

    checkAnswer: function (selected, question) {
      return !!question.result;
    },

    onAnswer: function (selected, question, correct) {
      if (!correct || !question.result) { return; }
      setTimeout(function () {
        var feedback = document.getElementById('s1-fb');
        if (!feedback) { return; }
        feedback.innerHTML += '<div>' + bi(question.result.zh, question.result.en) + '</div>';
        applyLang(feedback);
      }, 0);
    },

    getVoiceText: function (question) {
      var text = instructionText(question);
      return shell.lang === 'zh' ? text.zh : text.en;
    },

    registerRootGenes: function () {
      return GENES.slice();
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
        cognitiveChain: ['observation', 'encoding', 'retention', 'retrieval', 'reorganization'],
        carrier: ['sequential', 'visual_symbol'],
        workingMemory: unit.id === 'G2',
        geneIds: GENES.slice(),
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
            return total + (question.result.replays || 0);
          }, 0)
        };
      }

      refillUnit(unit.id);
      return buildRadarContext(unit.id, extra);
    }
  });
}());
