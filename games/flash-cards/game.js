'use strict';

/**
 * Flash Cards — Game Config + RADAR CONTRACT (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Recognition items hide all cards before answer options become available.
 * Missing-card items present explicit category groups, hide the original set,
 * then show the same groups with one card removed.
 */
(function () {

  var MODULE_ID = 'flash-cards';
  var MODULE_TYPE = 'mindseeds';
  var SOURCE_GAME_ID = 'flash-cards';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.MEMORY.VISUAL.RECOGNITION'];
  var SESSION_SIZE = 8;
  var flashTimer = null;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: {
        item_count: 'two',
        exposure_ms: 'long',
        option_similarity: 'low',
        organization_support: 'natural_category',
        missing_recall: 'none'
      },
      K2: {
        item_count: 'three',
        exposure_ms: 'medium',
        option_similarity: 'low',
        organization_support: 'natural_category',
        missing_recall: 'none'
      },
      G1: {
        item_count: 'four',
        exposure_ms: 'short',
        option_similarity: 'mixed',
        organization_support: 'category_groups',
        missing_recall: 'mixed'
      },
      G2: {
        item_count: 'six',
        exposure_ms: 'shortest',
        option_similarity: 'high',
        organization_support: 'category_groups',
        missing_recall: 'mixed'
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
    return GRADE_ORDER.map(function (gradeCode) {
      var metadata = FC_DATA.units[gradeCode] || {};
      return {
        id: gradeCode,
        gradeCode: LEVEL_GRADE[gradeCode] || null,
        icon: metadata.icon,
        nameZh: metadata.nameZh,
        nameEn: metadata.nameEn,
        descZh: metadata.descZh,
        descEn: metadata.descEn,
        questions: FC_GEN.generate(gradeCode, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.FC_CONTRACT = {
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
          unit.questions = FC_GEN.generate(unitId, SESSION_SIZE);
        }
      });
    }, 0);
  }

  (function injectStyles() {
    if (document.getElementById('fc-shell-style')) { return; }

    var style = document.createElement('style');
    style.id = 'fc-shell-style';
    style.textContent = [
      '.fc-scene{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center;}',
      '.fc-groups{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;align-items:flex-start;}',
      '.fc-group{min-width:130px;padding:10px;border:2px solid #fde68a;border-radius:14px;background:#fffbeb;}',
      '.fc-group-label{margin-bottom:8px;color:#92400e;font-size:13px;font-weight:900;text-align:center;}',
      '.fc-group-cards{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;}',
      '.fc-card{font-size:44px;line-height:1;width:72px;height:72px;display:flex;align-items:center;justify-content:center;',
        'background:#fff;border:2px solid #fde68a;border-radius:14px;box-shadow:0 2px 6px rgba(0,0,0,.08);}',
      '.fc-card.fc-back{font-size:30px;color:#94a3b8;background:#f8fafc;border-color:#e2e8f0;}',
      '.fc-opt{font-size:30px;line-height:1;}',
      '.fc-question{margin-top:10px;color:#9a3412;font-weight:900;text-align:center;}'
    ].join('');
    document.head.appendChild(style);
  }());

  function clearTimer() {
    if (flashTimer) {
      clearTimeout(flashTimer);
      flashTimer = null;
    }
  }

  function categoryLabel(category) {
    var label = FC_DATA.categoryLabels[category] || {};
    return shell.lang === 'zh'
      ? (label.zh || category)
      : (label.en || category);
  }

  function renderCards(cards, hidden) {
    return '<div class="fc-scene">' +
      cards.map(function (card) {
        return hidden
          ? '<div class="fc-card fc-back">❓</div>'
          : '<div class="fc-card">' + card + '</div>';
      }).join('') +
      '</div>';
  }

  function renderGroups(groups) {
    return '<div class="fc-groups">' +
      groups.map(function (group) {
        return '<div class="fc-group">' +
          '<div class="fc-group-label">' + categoryLabel(group.category) + '</div>' +
          '<div class="fc-group-cards">' +
            group.cards.map(function (card) {
              return '<div class="fc-card">' + card + '</div>';
            }).join('') +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  function missingPrompt() {
    return '<div class="fc-question">' +
      (shell.lang === 'zh'
        ? '哪一张卡片不见了？'
        : 'Which card is missing?') +
      '</div>';
  }

  function hideOptions() {
    var options = document.getElementById('s1-opts');
    if (options) {
      options.style.visibility = 'hidden';
      options.style.pointerEvents = 'none';
    }
  }

  function showOptions() {
    var options = document.getElementById('s1-opts');
    if (options) {
      options.style.visibility = '';
      options.style.pointerEvents = '';
    }
  }

  function renderAnswerState(question, container) {
    if (question.mode === 'missing') {
      container.innerHTML = renderGroups(question.remainingGroups) + missingPrompt();
    } else {
      container.innerHTML = renderCards(question.shown, true);
    }
  }

  shell.createGame({
    id: SOURCE_GAME_ID,
    parallelUnits: true,
    theme: { primary: '#f6a04d', primary2: '#e8552b' },
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
        contentZh: '普通题要记住看过的卡片。分类题先按类别观察两组卡片，原卡组藏起后，再找出少了哪一张。',
        contentEn: 'For recognition items, remember the shown cards. For grouped items, observe both category groups, then identify the card removed after the original set hides.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-flash-cards-intro-001'
      }
    },
    assistance: { replay: { enabled: true } },
    title: { zh: '🃏 闪现卡片', en: '🃏 Flash Cards' },
    subtitle: {
      zh: '分类观察，记住谁不见了',
      en: 'Group, remember, and find what disappeared'
    },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units: UNITS,

    renderSequence: function (question, container) {
      clearTimer();
      hideOptions();

      container.innerHTML = question.mode === 'missing'
        ? renderGroups(question.groups)
        : renderCards(question.shown, false);

      flashTimer = setTimeout(function () {
        renderAnswerState(question, container);
        showOptions();
        flashTimer = null;
      }, question.exposureMs);
    },

    replaySequence: function (question, container, unit, done) {
      clearTimer();

      if (!question.result) {
        question.result = { tries: 0, replays: 0, tier: null };
      }
      question.result.replays++;

      container.innerHTML = question.mode === 'missing'
        ? renderGroups(question.groups)
        : renderCards(question.shown, false);

      flashTimer = setTimeout(function () {
        renderAnswerState(question, container);
        flashTimer = null;
        done();
      }, question.exposureMs);
    },

    renderOption: function (option) {
      return '<span class="fc-opt">' + option + '</span>';
    },

    checkAnswer: function (selected, question) {
      return String(selected) === String(question.answer);
    },

    onAnswer: function (selected, question, correct) {
      if (!question.result) {
        question.result = { tries: 0, replays: 0, tier: null };
      }

      question.result.tries++;

      if (correct) {
        question.result.tier =
          question.result.tries === 1 && question.result.replays === 0 ? 'best' :
          question.result.tries <= 2 ? 'good' :
          'valid';
      }
    },

    getVoiceText: function (question) {
      if (question.mode === 'missing') {
        return shell.lang === 'zh'
          ? '按类别记住两组卡片。原来的卡组藏起来后，找出哪一张不见了。'
          : 'Remember both groups by category. After the original set hides, find the card that disappeared.';
      }

      return shell.lang === 'zh'
        ? '记住刚才看到的卡片，等它们藏起来后，找出你看到的那一张。'
        : 'Remember the cards you just saw, then find one that appeared after they hide.';
    },

    registerRootGenes: function () {
      return GENES.slice();
    },

    getReportContext: function (context) {
      var unit = (context && context.unit) || {};
      var questions = unit.questions || [];
      var played = questions.filter(function (question) {
        return question.result && question.result.tier;
      });
      var modes = unique(questions.map(function (question) {
        return question.mode;
      }));

      refillUnit(unit.id);

      var extra = {
        categories: unique([].concat.apply([], questions.map(function (question) {
          return question.categories || [];
        }))),
        modes: modes,
        organizationSupport: unique(questions.map(function (question) {
          return question.organizationSupport;
        })),
        cognitiveChain: modes.indexOf('missing') >= 0
          ? ['observation', 'encoding', 'retention', 'retrieval', 'reorganization']
          : ['observation', 'retention', 'retrieval'],
        carrier: ['visual'],
        taskMechanisms: modes.indexOf('missing') >= 0
          ? ['recognition', 'grouped_encoding', 'missing_item_recall']
          : ['recognition'],
        workingMemory: false,
        geneIds: GENES.slice(),
        activityRuntime: 'puzzle'
      };

      if (played.length) {
        var tiers = { best: 0, good: 0, valid: 0 };

        played.forEach(function (question) {
          tiers[question.result.tier]++;
        });

        extra.process = {
          tiers: tiers,
          optimalCount: tiers.best,
          retries: played.reduce(function (count, question) {
            return count + Math.max(0, question.result.tries - 1);
          }, 0),
          hints: 0,
          replays: played.reduce(function (count, question) {
            return count + question.result.replays;
          }, 0),
          groupedItems: played.filter(function (question) {
            return question.organizationSupport === 'category_groups';
          }).length,
          missingItemsRecovered: played.filter(function (question) {
            return question.mode === 'missing';
          }).length
        };
      }

      return buildRadarContext(unit.id, extra);
    }
  });
}());
