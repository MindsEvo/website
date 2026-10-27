'use strict';

/**
 * Treasure Grid — Game Config + RADAR CONTRACT (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Location items train delayed spatial localization. Path items show an actual
 * route, hide it, then ask the child to rebuild it by tapping cells in order.
 * They never ask the child to find a shortest or best route.
 *
 * Metadata: /metadata/mindseeds/treasure-grid.json
 */
(function () {

  var MODULE_ID = 'treasure-grid';
  var MODULE_TYPE = 'mindseeds';
  var SOURCE_GAME_ID = 'treasure-grid';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var SPATIAL_GENE = 'RG.MEMORY.SPATIAL.BASIC';
  var WORKING_GENE = 'RG.MEMORY.WORKING.MANIPULATION';
  var SESSION_SIZE = 8;

  var exposeTimer = null;
  var delayTimer = null;
  var activeQuestion = null;

  function genesFor(gradeCode) {
    return gradeCode === 'G2'
      ? [SPATIAL_GENE, WORKING_GENE]
      : [SPATIAL_GENE];
  }

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: {
        grid_size: 'two_by_two', treasure_count: 'one',
        delay_ms: 'short', path_reconstruction: 'none',
        spatial_update: 'none'
      },
      K2: {
        grid_size: 'two_by_two', treasure_count: 'one',
        delay_ms: 'medium', path_reconstruction: 'none',
        spatial_update: 'none'
      },
      G1: {
        grid_size: 'three_by_three', treasure_count: 'one',
        delay_ms: 'long', path_reconstruction: 'three_step',
        spatial_update: 'none'
      },
      G2: {
        grid_size: 'three_by_three', treasure_count: 'two',
        delay_ms: 'longest', path_reconstruction: 'four_step',
        spatial_update: 'one_step'
      }
    }[gradeCode];
    return base ? Object.assign({}, base) : null;
  }

  function _unique(values) {
    return (values || []).filter(function (v, i, a) {
      return v !== undefined && a.indexOf(v) === i;
    });
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
      var meta = TG_DATA.units[g] || {};
      return {
        id: g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon: meta.icon,
        nameZh: meta.nameZh,
        nameEn: meta.nameEn,
        descZh: meta.descZh,
        descEn: meta.descEn,
        questions: TG_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.TG_CONTRACT = {
    MODULE_ID: MODULE_ID,
    SESSION_SIZE: SESSION_SIZE,
    GRADE_ORDER: GRADE_ORDER,
    LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor,
    buildRadarContext: buildRadarContext
  };

  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) {
          u.questions = TG_GEN.generate(unitId, SESSION_SIZE);
        }
      });
    }, 0);
  }

  (function injectTreasureGridStyles() {
    if (document.getElementById('tg-shell-style')) { return; }
    var s = document.createElement('style');
    s.id = 'tg-shell-style';
    s.textContent = [
      '.tg-grid{display:grid;gap:8px;justify-content:center;}',
      '.tg-cell{position:relative;width:64px;height:64px;background:#fff;border:2px solid #bae6fd;border-radius:12px;',
        'display:flex;align-items:center;justify-content:center;font-size:28px;line-height:1;box-shadow:0 2px 6px rgba(0,0,0,.06);}',
      '.tg-cell.tg-path{background:#ccfbf1;border-color:#14b8a6;}',
      '.tg-cell.tg-start{border-color:#f59e0b;}',
      '.tg-cell.tg-end{border-color:#0ea5e9;}',
      '.tg-cell.tg-picked{background:#fef3c7;border-color:#f59e0b;cursor:pointer;}',
      '.tg-cell.tg-tappable{cursor:pointer;}',
      '.tg-step{position:absolute;right:4px;bottom:2px;font-size:11px;font-weight:900;color:#0f766e;}',
      '.tg-num{position:absolute;top:2px;left:5px;font-size:11px;font-weight:800;color:#64748b;}',
      '.tg-update{max-width:360px;margin:10px auto 0;padding:8px 12px;border-radius:10px;',
        'background:#fff7ed;color:#9a3412;font-weight:800;text-align:center;}'
    ].join('');
    document.head.appendChild(s);
  }());

  function clearTimers() {
    if (exposeTimer) { clearTimeout(exposeTimer); exposeTimer = null; }
    if (delayTimer) { clearTimeout(delayTimer); delayTimer = null; }
  }

  function cellContents(q, n, showTreasure, route, index) {
    if (showTreasure && q.treasurePositions.indexOf(n) >= 0) {
      return TG_DATA.treasureIcon;
    }
    if (route && index === 0) { return TG_DATA.travellerIcon; }
    if (route && index === route.length - 1) { return TG_DATA.homeIcon; }
    return '';
  }

  function renderGrid(q, options) {
    options = options || {};
    var route = options.route || null;
    var picked = options.picked || [];
    var tappable = !!options.tappable;
    var html = '<div class="tg-grid" style="grid-template-columns:repeat(' +
      q.gridSize + ',1fr);">';

    for (var n = 1; n <= q.total; n++) {
      var routeIndex = route ? route.indexOf(n) : -1;
      var pickedIndex = picked.indexOf(n);
      var classes = ['tg-cell'];

      if (routeIndex >= 0) { classes.push('tg-path'); }
      if (routeIndex === 0) { classes.push('tg-start'); }
      if (route && routeIndex === route.length - 1) { classes.push('tg-end'); }
      if (pickedIndex >= 0) { classes.push('tg-picked'); }
      if (tappable) { classes.push('tg-tappable'); }

      html += '<button type="button" class="' + classes.join(' ') + '"' +
        (tappable ? ' data-tg-cell="' + n + '"' : ' disabled') + '>' +
        '<span class="tg-num">' + n + '</span>' +
        cellContents(q, n, !!options.showTreasure, route, routeIndex) +
        (routeIndex >= 0 ? '<span class="tg-step">' + (routeIndex + 1) + '</span>' : '') +
        (pickedIndex >= 0 ? '<span class="tg-step">' + (pickedIndex + 1) + '</span>' : '') +
        '</button>';
    }
    return html + '</div>';
  }

  function updateMessage(q) {
    if (!q.update) { return ''; }
    return shell.lang === 'zh'
      ? '<div class="tg-update">路线更新：第 ' + (q.update.index + 1) +
          ' 步改走 ' + q.update.to + ' 号格。</div>'
      : '<div class="tg-update">Route update: step ' + (q.update.index + 1) +
          ' now uses cell ' + q.update.to + '.</div>';
  }

  function bindPathInput(q, container) {
    Array.prototype.forEach.call(
      container.querySelectorAll('[data-tg-cell]'),
      function (button) {
        button.addEventListener('click', function () {
          var cell = Number(button.getAttribute('data-tg-cell'));
          var selected = q.selectedRoute || [];

          if (selected.length && selected[selected.length - 1] === cell) {
            selected.pop();
          } else if (selected.indexOf(cell) < 0 &&
                     (!selected.length ||
                      TG_GEN.neighbours(selected[selected.length - 1], q.gridSize)
                        .indexOf(cell) >= 0)) {
            selected.push(cell);
          }

          q.selectedRoute = selected;
          container.innerHTML = renderGrid(q, {
            picked: selected,
            tappable: true
          }) + updateMessage(q);
          bindPathInput(q, container);
        });
      }
    );
  }

  function showPathInput(q, container) {
    q.selectedRoute = [];
    container.innerHTML = renderGrid(q, {
      picked: q.selectedRoute,
      tappable: true
    }) + updateMessage(q);
    bindPathInput(q, container);
  }

  shell.createGame({
    id: SOURCE_GAME_ID,
    parallelUnits: true,
    theme: { primary: '#2dd4bf', primary2: '#0e7490' },
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
        contentZh: '宝藏题记住位置；路线题先观察真实路线，路线藏起后按原顺序点击格子。这里不需要寻找最短路线。',
        contentEn: 'For treasure items, remember the location. For route items, observe the shown route and tap its cells in order after it hides. You do not need to find a shortest route.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-treasure-grid-intro-001'
      }
    },
    assistance: { replay: { enabled: true } },
    title: { zh: '🗺️ 宝藏格', en: '🗺️ Treasure Grid' },
    subtitle: {
      zh: '记住位置，重建回家路线',
      en: 'Remember locations and rebuild the way home'
    },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units: UNITS,

    renderSequence: function (q, container) {
      clearTimers();
      activeQuestion = q;
      var optsEl = document.getElementById('s1-opts');
      if (optsEl) {
        optsEl.style.visibility = 'hidden';
        optsEl.style.pointerEvents = 'none';
      }

      if (q.mode === 'path') {
        container.innerHTML = renderGrid(q, { route: q.originalRoute });
        exposeTimer = setTimeout(function () {
          container.innerHTML = renderGrid(q);
          exposeTimer = null;
          delayTimer = setTimeout(function () {
            showPathInput(q, container);
            if (optsEl) {
              optsEl.style.visibility = '';
              optsEl.style.pointerEvents = '';
            }
            delayTimer = null;
          }, q.delayMs);
        }, q.exposureMs);
        return;
      }

      container.innerHTML = renderGrid(q, { showTreasure: true });
      exposeTimer = setTimeout(function () {
        container.innerHTML = renderGrid(q);
        exposeTimer = null;
        delayTimer = setTimeout(function () {
          if (optsEl) {
            optsEl.style.visibility = '';
            optsEl.style.pointerEvents = '';
          }
          delayTimer = null;
        }, q.delayMs);
      }, q.exposureMs);
    },

    replaySequence: function (q, container, unit, done) {
      clearTimers();
      if (!q.result) {
        q.result = { tries: 0, replays: 0, tier: null };
      }
      q.result.replays++;
      q.selectedRoute = [];

      if (q.mode === 'path') {
        container.innerHTML = renderGrid(q, { route: q.originalRoute });
        exposeTimer = setTimeout(function () {
          container.innerHTML = renderGrid(q);
          exposeTimer = null;
          delayTimer = setTimeout(function () {
            showPathInput(q, container);
            delayTimer = null;
            done();
          }, q.delayMs);
        }, q.exposureMs);
        return;
      }

      container.innerHTML = renderGrid(q, { showTreasure: true });
      exposeTimer = setTimeout(function () {
        container.innerHTML = renderGrid(q);
        exposeTimer = null;
        delayTimer = setTimeout(function () {
          delayTimer = null;
          done();
        }, q.delayMs);
      }, q.exposureMs);
    },

    renderOption: function (opt, q) {
      return q.mode === 'path'
        ? '<span class="tg-opt">' +
            (shell.lang === 'zh' ? '完成路线' : 'Finish route') + '</span>'
        : '<span class="tg-opt">' + opt + '</span>';
    },

    checkAnswer: function (selected, q) {
      if (q.mode === 'path') {
        return (q.selectedRoute || []).join(',') === q.answerRoute.join(',');
      }
      var answers = q.answers || [q.answer];
      return answers.indexOf(Number(selected)) >= 0;
    },

    onAnswer: function (selected, q, correct) {
      if (!q.result) {
        q.result = { tries: 0, replays: 0, tier: null };
      }
      q.result.tries++;
      if (correct) {
        q.result.tier =
          q.result.tries === 1 && q.result.replays === 0 ? 'best' :
          q.result.tries <= 2 ? 'good' :
          'valid';
      } else if (q.mode === 'path' && activeQuestion === q) {
        q.selectedRoute = [];
      }
    },

    getVoiceText: function (q) {
      if (q.mode === 'path') {
        return shell.lang === 'zh'
          ? '先记住刚才展示的路线。路线藏起来后，从小动物出发，按顺序点击格子走到家。'
          : 'Remember the shown route. After it hides, start with the traveller and tap the cells in order to reach home.';
      }
      return shell.lang === 'zh'
        ? '记住宝藏藏在哪一格，等一等再选出它的编号。'
        : 'Remember which cell hid the treasure, then wait and pick its number.';
    },

    registerRootGenes: function (ctx) {
      var unit = ctx && ctx.unit;
      return genesFor(unit && unit.id);
    },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      refillUnit(unit.id);

      var played = questions.filter(function (q) {
        return q.result && q.result.tier;
      });
      var modes = _unique(questions.map(function (q) { return q.mode; }));
      var extra = {
        gridSizes: _unique(questions.map(function (q) { return q.gridSize; })),
        modes: modes,
        pathLengths: _unique(questions.map(function (q) {
          return q.answerRoute && q.answerRoute.length;
        })),
        cognitiveChain: modes.indexOf('path') >= 0
          ? ['observation', 'retention', 'retrieval', 'reorganization', 'application']
          : ['observation', 'retention', 'retrieval'],
        carrier: ['spatial'],
        taskMechanisms: modes.indexOf('path') >= 0
          ? ['location_recall', 'path_reconstruction', 'memory_guided_action']
          : ['location_recall'],
        workingMemory: unit.id === 'G2',
        geneIds: genesFor(unit.id),
        activityRuntime: 'puzzle'
      };

      if (played.length) {
        var tiers = { best: 0, good: 0, valid: 0 };
        played.forEach(function (q) { tiers[q.result.tier]++; });
        extra.process = {
          tiers: tiers,
          optimalCount: tiers.best,
          retries: played.reduce(function (n, q) {
            return n + Math.max(0, q.result.tries - 1);
          }, 0),
          hints: 0,
          replays: played.reduce(function (n, q) {
            return n + q.result.replays;
          }, 0),
          pathsReconstructed: played.filter(function (q) {
            return q.mode === 'path';
          }).length,
          spatialUpdates: played.filter(function (q) {
            return !!q.update;
          }).length
        };
      }
      return buildRadarContext(unit.id, extra);
    }
  });
}());