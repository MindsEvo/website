'use strict';
/**
 * ControlActivityRuntime — guided scientific-task runtime.
 *
 * The child identifies the variable to change and the conditions to keep
 * constant, then runs the prepared comparison. One activity produces one
 * Attempt with the setup choices and observed result in process/trace.
 */
var ControlActivityRuntime = (function () {
  var _styled = false;

  function _injectStyles() {
    if (_styled) return;
    _styled = true;
    var style = document.createElement('style');
    style.textContent = [
      '.car-overlay{position:fixed;inset:0;z-index:500;background:linear-gradient(160deg,#ecfdf5,#eff6ff);display:flex;flex-direction:column;}',
      '.car-title{flex:1;color:#fff;font-size:16px;font-weight:900;}',
      '.car-body{flex:1;overflow:auto;padding:24px 18px;display:flex;flex-direction:column;align-items:center;gap:18px;}',
      '.car-prompt{max-width:620px;font-size:20px;font-weight:900;color:#065f46;text-align:center;line-height:1.35;}',
      '.car-scene{font-size:64px;line-height:1;}',
      '.car-options{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;max-width:680px;}',
      '.car-btn{border:2px solid #a7f3d0;border-radius:14px;background:#fff;color:#166534;padding:12px 16px;font-weight:800;cursor:pointer;}',
      '.car-btn.selected{background:#dcfce7;border-color:#22c55e;}',
      '.car-btn.correct{background:#dcfce7;border-color:#16a34a;}',
      '.car-btn.wrong{background:#fee2e2;border-color:#ef4444;}',
      '.car-feedback{max-width:620px;color:#334155;font-weight:700;text-align:center;line-height:1.5;}'
    ].join('');
    document.head.appendChild(style);
  }

  function run(template, variant, ctx) {
    ctx = ctx || {};
    _injectStyles();
    IH.injectStyles();

    var startTs = Date.now();
    var events = [];
    var stage = 'change';
    var selectedChange = null;
    var selectedControls = {};
    var setupAttempts = 0;
    var observations = 0;
    var revisions = 0;

    var overlay = document.createElement('div');
    overlay.className = 'car-overlay';
    overlay.innerHTML =
      '<div class="ih-hdr">' +
        '<button class="ih-back" id="car-back">←</button>' +
        '<div class="car-title"><span class="zh">科学活动</span><span class="en">Science Activity</span></div>' +
        IH.controlsHtml('car') +
      '</div>' +
      '<div class="car-body" id="car-body"></div>';
    document.body.appendChild(overlay);
    IH.wire('car');

    var body = overlay.querySelector('#car-body');

    function log(type, data) {
      var evt = { type: type, ts: Date.now() - startTs, stage: stage };
      if (data) {
        for (var key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) evt[key] = data[key];
        }
      }
      events.push(evt);
    }

    function tearDown() {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    overlay.querySelector('#car-back').addEventListener('click', function () {
      tearDown();
      if (ctx.onBack) ctx.onBack();
    });

    function optionButton(opt, attribute) {
      return '<button class="car-btn" ' + attribute + '="' + opt.id + '">' +
        '<span class="zh">' + opt.nameZh + '</span>' +
        '<span class="en">' + opt.nameEn + '</span>' +
      '</button>';
    }

    function renderChange() {
      stage = 'change';
      body.innerHTML =
        '<div class="car-scene">' + (variant.emoji || '🔬') + '</div>' +
        '<div class="car-prompt"><span class="zh">' + variant.changePromptZh + '</span>' +
          '<span class="en">' + variant.changePromptEn + '</span></div>' +
        '<div class="car-options">' +
          variant.changeOptions.map(function (opt) {
            return optionButton(opt, 'data-change');
          }).join('') +
        '</div><div class="car-feedback" id="car-feedback"></div>';

      var buttons = body.querySelectorAll('[data-change]');
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function (event) {
          selectedChange = event.currentTarget.getAttribute('data-change');
          for (var j = 0; j < buttons.length; j++) buttons[j].classList.remove('selected');
          event.currentTarget.classList.add('selected');
          body.querySelector('#car-feedback').innerHTML =
            '<button class="car-btn" id="car-change-next"><span class="zh">下一步</span><span class="en">Next</span></button>';
          body.querySelector('#car-change-next').addEventListener('click', function () {
            log('variable_selected', { variableId: selectedChange });
            renderControls();
          });
        });
      }
    }

    function renderControls() {
      stage = 'control';
      selectedControls = {};
      body.innerHTML =
        '<div class="car-scene">' + (variant.emoji || '🔬') + '</div>' +
        '<div class="car-prompt"><span class="zh">' + variant.controlPromptZh + '</span>' +
          '<span class="en">' + variant.controlPromptEn + '</span></div>' +
        '<div class="car-options">' +
          variant.controlOptions.map(function (opt) {
            return optionButton(opt, 'data-control');
          }).join('') +
        '</div>' +
        '<div class="car-feedback"><button class="car-btn" id="car-run">' +
          '<span class="zh">开始测试</span><span class="en">Run test</span>' +
        '</button></div>';

      var buttons = body.querySelectorAll('[data-control]');
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function (event) {
          var id = event.currentTarget.getAttribute('data-control');
          selectedControls[id] = !selectedControls[id];
          event.currentTarget.classList.toggle('selected', !!selectedControls[id]);
        });
      }

      body.querySelector('#car-run').addEventListener('click', evaluateSetup);
    }

    function evaluateSetup() {
      setupAttempts += 1;
      var chosenControls = Object.keys(selectedControls).filter(function (id) {
        return selectedControls[id];
      });
      var changeCorrect = selectedChange === variant.correctChangeId;
      var controlsCorrect =
        chosenControls.length === variant.correctControlIds.length &&
        variant.correctControlIds.every(function (id) {
          return chosenControls.indexOf(id) >= 0;
        });

      log('experiment_setup', {
        changedVariableId: selectedChange,
        controlledVariableIds: chosenControls.join(','),
        changeCorrect: changeCorrect,
        controlsCorrect: controlsCorrect,
        attemptNumber: setupAttempts
      });

      if (!changeCorrect || !controlsCorrect) {
        revisions += 1;
        log('revision', {
          reason: 'experiment_setup',
          attemptNumber: setupAttempts
        });
        var feedback = body.querySelector('.car-feedback');
        feedback.innerHTML =
          '<span class="zh">再检查一下：只改变要研究的条件，其他重要条件保持相同。</span>' +
          '<span class="en">Check again: change only the condition being studied and keep the other important conditions the same.</span>' +
          '<div><button class="car-btn" id="car-retry"><span class="zh">重新设置</span><span class="en">Revise setup</span></button></div>';
        body.querySelector('#car-retry').addEventListener('click', renderChange);
        return;
      }

      log('action', {
        action: 'run_controlled_test',
        variableId: selectedChange
      });
      renderResults();
    }

    function renderResults() {
      stage = 'result';
      observations = variant.results.length;
      variant.results.forEach(function (result) {
        log('result', {
          conditionId: result.id,
          actual: result.actual
        });
        log('observation', {
          conditionId: result.id,
          actual: result.actual
        });
      });
      log('comparison', {
        resultCount: variant.results.length,
        results: variant.results.map(function (result) {
          return result.id + ':' + result.actual;
        }).join(',')
      });

      body.innerHTML =
        '<div class="car-prompt"><span class="zh">测试结果</span><span class="en">Test results</span></div>' +
        '<div class="car-options">' +
          variant.results.map(function (result) {
            return '<div class="car-btn correct"><span class="zh">' + result.resultZh + '</span>' +
              '<span class="en">' + result.resultEn + '</span></div>';
          }).join('') +
        '</div>' +
        '<div class="car-feedback"><span class="zh">' + variant.conclusionZh + '</span>' +
          '<span class="en">' + variant.conclusionEn + '</span>' +
          '<div><button class="car-btn" id="car-finish"><span class="zh">完成</span><span class="en">Finish</span></button></div>' +
        '</div>';

      body.querySelector('#car-finish').addEventListener('click', finish);
    }

    function finish() {
      var process = {
        processCompleted: true,
        experimentQualityMet: true,
        targetVariableIsolated: true,
        controlledConditionsConsistent: true,
        setupAttempts: setupAttempts,
        variableSelections: setupAttempts,
        controlledVariables: variant.correctControlIds.length,
        actions: 1,
        observations: observations,
        comparisons: 1,
        revisions: revisions,
        eventsTotal: events.length
      };
      var attempt = {
        templateId: template.id,
        variantId: variant.variantId,
        mode: template.runtime || 'activity',
        result: 'passed',
        responseMs: Date.now() - startTs,
        process: process,
        trace: events.slice()
      };
      tearDown();
      if (ctx.onComplete) ctx.onComplete(attempt);
    }

    renderChange();
  }

  return { run: run };
}());
