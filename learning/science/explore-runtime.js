'use strict';
/**
 * ExploreRuntime — the non-puzzle activity runtime for Science.
 * Plays the role comparison/sort-runtime.js (etc.) plays there: it owns its
 * own full-screen overlay, never touches checkAnswer, and hands a finished
 * `attempt` object back to game.js via ctx.onComplete().
 *
 * ExploreRuntime.run(template, variant, ctx)
 *   template — the template def (id, level, type, rootGeneIds, ...)
 *   variant  — the generator output (SciGenerators.floatSinkExplore)
 *   ctx      — { onComplete(attempt), onBack(), radar }
 *
 * Every user action is recorded as a named event (observation / prediction /
 * action / variable_changed / evidence_selected / explanation / revision).
 * The FULL untouched event list is preserved on attempt.trace for the
 * server's record/context JSON columns; a flat, <=24-key summary is built
 * separately (attempt.process) for the mastery/analytics engine, matching
 * engine.js's _summarizeProcess() contract (no nested objects, no raw
 * arrays — only scalars and *_count).
 */
var ExploreRuntime = (function () {

  var _styled = false;
  function _injectStyles() {
    if (_styled) return;
    _styled = true;
    var s = document.createElement('style');
    s.textContent = [
      '.exr-overlay{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;background:#ecfdf5;}',
      '.exr-body{flex:1;overflow:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;gap:18px;text-align:center;}',
      '.exr-title{flex:1;font-size:15px;font-weight:800;color:#fff;}',
      '.exr-prompt{font-size:18px;font-weight:700;color:#065f46;max-width:520px;}',
      '.exr-items{display:flex;gap:24px;justify-content:center;flex-wrap:wrap;}',
      '.exr-item{background:#fff;border:2px solid #a7f3d0;border-radius:16px;padding:16px 20px;min-width:110px;box-shadow:0 4px 10px rgba(0,0,0,0.06);}',
      '.exr-emoji{font-size:44px;line-height:1;}',
      '.exr-label{margin-top:6px;font-size:14px;font-weight:700;color:#065f46;}',
      '.exr-choices{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;}',
      '.exr-btn{font-size:15px;font-weight:700;color:#065f46;background:#fff;border:2px solid #34d399;border-radius:999px;padding:10px 20px;cursor:pointer;}',
      '.exr-btn:hover{background:#d1fae5;}',
      '.exr-btn.exr-chosen{background:#34d399;color:#fff;}',
      '.exr-btn.exr-correct{background:#059669;color:#fff;border-color:#059669;}',
      '.exr-btn.exr-wrong{background:#fca5a5;border-color:#ef4444;color:#7f1d1d;}',
      '.exr-feedback{font-size:14px;color:#047857;min-height:20px;}',
      '.exr-progress{font-size:12px;color:#059669;font-weight:700;}',
      '@keyframes exr-sink-kf{0%{transform:translateY(0) rotate(0deg);}100%{transform:translateY(46px) rotate(12deg);opacity:.55;}}',
      '@keyframes exr-float-kf{0%{transform:translateY(0);}30%{transform:translateY(-14px);}60%{transform:translateY(-4px);}100%{transform:translateY(-10px);}}',
      '.exr-emoji.exr-emoji-sink{animation:exr-sink-kf .9s cubic-bezier(.55,0,.85,.35) forwards;}',
      '.exr-emoji.exr-emoji-float{animation:exr-float-kf 1.1s ease-out forwards;}',
      '[data-lang="zh"] .en{display:none;}',
      '[data-lang="en"] .zh{display:none;}'
    ].join('');
    document.head.appendChild(s);
  }

  function run(template, variant, ctx) {
    ctx = ctx || {};
    _injectStyles();
    IH.injectStyles();

    var _st = {
      startTs: Date.now(),
      stepIndex: 0,
      events: [],
      predictions: 0,
      correctPredictions: 0,
      actions: 0,
      observations: 0,
      reflections: 0,
      recognizedReflections: 0,
      variableChanges: 0,
      comparisons: 0,
      evidenceCount: 0,
      relevantEvidence: 0,
      irrelevantEvidence: 0,
      relevantEvidenceTotal: 0,
      evidenceGrounded: false,
      explanationAttempts: 0,
      explanationCorrect: false,
      revisions: 0
    };

    var overlay = document.createElement('div');
    overlay.className = 'exr-overlay';
    overlay.innerHTML =
      '<div class="ih-hdr">' +
        '<button class="ih-back" id="exr-back">←</button>' +
        '<div class="exr-title">' +
          '<span class="zh">科学探索</span><span class="en">Explore</span>' +
        '</div>' +
        IH.controlsHtml('exr') +
      '</div>' +
      '<div class="exr-body" id="exr-body"></div>' +
      '<div class="exr-progress" id="exr-progress"></div>';
    document.body.appendChild(overlay);
    IH.wire('exr');

    var bodyEl = overlay.querySelector('#exr-body');
    var progEl = overlay.querySelector('#exr-progress');

    var backBtn = overlay.querySelector('#exr-back');
    backBtn.addEventListener('click', function () {
      _tearDown();
      if (ctx.onBack) ctx.onBack();
    });

    function _log(type, data) {
      var evt = { type: type, ts: Date.now() - _st.startTs, step: _st.stepIndex };
      if (data) { for (var k in data) { if (data.hasOwnProperty(k)) evt[k] = data[k]; } }
      _st.events.push(evt);
      return evt;
    }

    // Build the fixed step list: predict/test each item, change a variable,
    // pick evidence, then explain.
    var steps = [];
    (variant.testItems || []).forEach(function (item) {
      steps.push({ kind: 'predict_test', item: item });
    });
    if (variant.variable) steps.push({ kind: 'variable', variable: variant.variable });
    if (variant.evidenceOptions) steps.push({ kind: 'evidence', options: variant.evidenceOptions });
    if (variant.explanationOptions) steps.push({ kind: 'explain', options: variant.explanationOptions });

    function _renderProgress() {
      progEl.textContent = (_st.stepIndex + 1) + ' / ' + steps.length;
    }

    function _next() {
      _st.stepIndex += 1;
      if (_st.stepIndex >= steps.length) {
        _finish();
      } else {
        _renderStep();
      }
    }

    function _renderStep() {
      _renderProgress();
      var step = steps[_st.stepIndex];
      if (step.kind === 'predict_test') _renderPredictTest(step);
      else if (step.kind === 'variable') _renderVariable(step);
      else if (step.kind === 'evidence') _renderEvidence(step);
      else if (step.kind === 'explain') _renderExplain(step);
    }

    // Per-type predict/test config — mirrors game.js's PROMPT_TEXT/VOICE_TEXT
    // dispatch pattern. Float and magnet share the same runtime steps, only
    // the wording, guess values, and observed-outcome rule differ.
    var PREDICT_CONFIG = {
      float_explore: {
        prompt: { zh: '你觉得它会浮起来还是沉下去？', en: 'Do you think it will float or sink?' },
        choices: [
          { value: 'float', zh: '浮起来', en: 'Float' },
          { value: 'sink',  zh: '沉下去', en: 'Sink' }
        ],
        testBtn: { zh: '放入水中测试', en: 'Test it in water' },
        actualOf: function (item) { return item.floats ? 'float' : 'sink'; },
        resultText: function (actual) {
          return actual === 'float'
            ? { zh: '它浮起来了！', en: 'it floated!' }
            : { zh: '它沉下去了！', en: 'it sank!' };
        },
        animClass: function (actual) { return actual === 'float' ? 'exr-emoji-float' : 'exr-emoji-sink'; }
      },
      magnet_explore: {
        prompt: { zh: '你觉得磁铁会吸住它吗？', en: 'Do you think the magnet will attract it?' },
        choices: [
          { value: 'attract',    zh: '会被吸住',  en: 'Attracted' },
          { value: 'no_attract', zh: '不会被吸住', en: 'Not attracted' }
        ],
        testBtn: { zh: '用磁铁测试', en: 'Test it with a magnet' },
        actualOf: function (item) { return item.magnetic ? 'attract' : 'no_attract'; },
        resultText: function (actual) {
          return actual === 'attract'
            ? { zh: '它被磁铁吸住了！', en: 'it got attracted!' }
            : { zh: '它没有被吸住。', en: 'it was not attracted.' };
        },
        animClass: function (actual) { return actual === 'attract' ? 'exr-emoji-float' : 'exr-emoji-sink'; }
      },
      ramp_explore: {
        prompt: { zh: '你觉得小球会滚得较近还是较远？', en: 'Do you think the ball will roll a shorter or farther distance?' },
        choices: [
          { value: 'short', zh: '较近', en: 'Shorter' },
          { value: 'far', zh: '较远', en: 'Farther' }
        ],
        testBtn: { zh: '让小球滚下斜坡', en: 'Roll the ball down the ramp' },
        actualOf: function (item) { return item.actual; },
        resultText: function (actual) {
          return actual === 'far'
            ? { zh: '小球滚到了较远的位置！', en: 'the ball rolled to a farther position!' }
            : { zh: '小球停在了较近的位置。', en: 'the ball stopped at a nearer position.' };
        },
        animClass: function (actual) { return actual === 'far' ? 'exr-emoji-float' : 'exr-emoji-sink'; }
      },
      shadow_explore: {
        prompt: { zh: '你觉得影子会较小还是较大？', en: 'Do you think the shadow will be smaller or larger?' },
        choices: [
          { value: 'small', zh: '较小', en: 'Smaller' },
          { value: 'large', zh: '较大', en: 'Larger' }
        ],
        testBtn: { zh: '打开手电筒观察影子', en: 'Turn on the flashlight and observe the shadow' },
        actualOf: function (item) { return item.actual; },
        resultText: function (actual) {
          return actual === 'large'
            ? { zh: '影子变大了！', en: 'the shadow became larger!' }
            : { zh: '影子比较小。', en: 'the shadow was smaller.' };
        },
        animClass: function (actual) { return actual === 'large' ? 'exr-emoji-float' : 'exr-emoji-sink'; }
      }
    };

    function _predictConfig() { return PREDICT_CONFIG[variant.type] || PREDICT_CONFIG.float_explore; }

    function _renderPredictTest(step) {
      var item = step.item;
      var cfg = _predictConfig();
      var choicesHtml = cfg.choices.map(function (c) {
        return '<button class="exr-btn" data-guess="' + c.value + '"><span class="zh">' + c.zh + '</span><span class="en">' + c.en + '</span></button>';
      }).join('');
      bodyEl.innerHTML =
        '<div class="exr-prompt">' +
          '<span class="zh">' + cfg.prompt.zh + '</span>' +
          '<span class="en">' + cfg.prompt.en + '</span>' +
        '</div>' +
        '<div class="exr-items"><div class="exr-item"><div class="exr-emoji">' + item.emoji + '</div>' +
          '<div class="exr-label"><span class="zh">' + item.nameZh + '</span><span class="en">' + item.nameEn + '</span></div>' +
        '</div></div>' +
        '<div class="exr-choices">' + choicesHtml + '</div>' +
        '<div class="exr-feedback" id="exr-feedback"></div>';

      var guessBtns = bodyEl.querySelectorAll('[data-guess]');
      for (var i = 0; i < guessBtns.length; i++) {
        guessBtns[i].addEventListener('click', function (e) {
          var guess = e.currentTarget.getAttribute('data-guess');
          _st.predictions += 1;
          _log('prediction', { itemId: item.id, guess: guess });
          for (var j = 0; j < guessBtns.length; j++) { guessBtns[j].disabled = true; }
          e.currentTarget.classList.add('exr-chosen');
          _showTestButton(item, guess, cfg);
        });
      }
    }

    function _showTestButton(item, guess, cfg) {
      var fb = bodyEl.querySelector('#exr-feedback');
      fb.innerHTML = '<button class="exr-btn" id="exr-test-btn">' +
        '<span class="zh">' + cfg.testBtn.zh + '</span><span class="en">' + cfg.testBtn.en + '</span></button>';

      document.getElementById('exr-test-btn').addEventListener('click', function () {
        _st.actions += 1;
        _log('action', { itemId: item.id, action: 'test' });

        var actual = cfg.actualOf(item);
        var matched = guess === actual;

        _st.observations += 1;
        _log('result', { itemId: item.id, actual: actual });
        _log('observation', {
          itemId: item.id,
          actual: actual,
          prediction: guess,
          predictionMatched: matched
        });

        if (matched) _st.correctPredictions += 1;

        var emojiEl = bodyEl.querySelector('.exr-emoji');
        if (emojiEl) emojiEl.classList.add(cfg.animClass(actual));

        var res = cfg.resultText(actual);
        fb.innerHTML =
          '<span class="zh">结果：' + res.zh + '</span>' +
          '<span class="en">Result: ' + res.en + '</span>' +
          '<div class="exr-prompt" style="margin-top:14px">' +
            '<span class="zh">结果和你的预测一样吗？</span>' +
            '<span class="en">Did the result match your prediction?</span>' +
          '</div>' +
          '<div class="exr-choices">' +
            '<button class="exr-btn" data-reflect="same"><span class="zh">一样</span><span class="en">Yes</span></button>' +
            '<button class="exr-btn" data-reflect="different"><span class="zh">不一样</span><span class="en">No</span></button>' +
          '</div>';

        var reflectionButtons = fb.querySelectorAll('[data-reflect]');
        for (var i = 0; i < reflectionButtons.length; i++) {
          reflectionButtons[i].addEventListener('click', function (event) {
            var response = event.currentTarget.getAttribute('data-reflect');
            var recognizedMatch = response === (matched ? 'same' : 'different');

            _st.reflections += 1;
            if (recognizedMatch) _st.recognizedReflections += 1;
            _log('reflection', {
              itemId: item.id,
              prediction: guess,
              actual: actual,
              response: response,
              recognizedMatch: recognizedMatch
            });

            if (!matched && response === 'different') {
              _st.revisions += 1;
              _log('revision', {
                itemId: item.id,
                from: guess,
                to: actual,
                evidence: 'observed_result'
              });
            }

            for (var j = 0; j < reflectionButtons.length; j++) {
              reflectionButtons[j].disabled = true;
            }
            event.currentTarget.classList.add('exr-chosen');

            fb.insertAdjacentHTML(
              'beforeend',
              '<div><button class="exr-btn" id="exr-next-btn">' +
                '<span class="zh">下一步</span><span class="en">Next</span>' +
              '</button></div>'
            );
            document.getElementById('exr-next-btn').addEventListener('click', _next);
          });
        }
      });
    }

    var VARIABLE_PROMPT = {
      float_explore:  { zh: '试试换一种水，会有什么不同？', en: 'Try a different kind of water — what changes?' },
      magnet_explore: { zh: '试试改变磁铁的距离，会有什么不同？', en: 'Try changing the magnet\'s distance — what changes?' },
      ramp_explore: { zh: '保持小球和地面不变，改变斜坡高度并比较结果。', en: 'Keep the ball and surface the same, change the ramp height, and compare the results.' },
      shadow_explore: { zh: '保持物体和屏幕不变，改变光源距离并比较影子大小。', en: 'Keep the object and screen fixed, change the light distance, and compare shadow size.' }
    };

    function _renderVariable(step) {
    var v = step.variable;
    var prompt = VARIABLE_PROMPT[variant.type] || VARIABLE_PROMPT.float_explore;
    var testItem = v.testItem || {};
    var results = [];

    bodyEl.innerHTML =
      '<div class="exr-prompt"><span class="zh">' + prompt.zh + '</span>' +
        '<span class="en">' + prompt.en + '</span></div>' +
      '<div class="exr-items"><div class="exr-item">' +
        '<div class="exr-emoji">' + (testItem.emoji || '🔬') + '</div>' +
        '<div class="exr-label"><span class="zh">' + (testItem.nameZh || '') + '</span>' +
          '<span class="en">' + (testItem.nameEn || '') + '</span></div>' +
      '</div></div>' +
      '<div class="exr-choices" id="exr-var-choices"></div>' +
      '<div class="exr-feedback" id="exr-feedback"></div>';

    var choiceWrap = bodyEl.querySelector('#exr-var-choices');
    var feedback = bodyEl.querySelector('#exr-feedback');

    (v.options || []).forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className = 'exr-btn';
      btn.innerHTML = '<span class="zh">' + opt.nameZh + '</span><span class="en">' + opt.nameEn + '</span>';

      btn.addEventListener('click', function () {
        if (results.some(function (result) { return result.value === opt.id; })) return;

        _st.variableChanges += 1;
        _st.actions += 1;
        _st.observations += 1;

        _log('variable_changed', {
          variableId: v.id,
          value: opt.id,
          controlledItemId: testItem.id || null
        });
        _log('action', {
          itemId: testItem.id || null,
          action: 'retest',
          variableId: v.id,
          value: opt.id
        });
        _log('result', {
          itemId: testItem.id || null,
          variableId: v.id,
          value: opt.id,
          actual: opt.actual
        });
        _log('observation', {
          itemId: testItem.id || null,
          variableId: v.id,
          value: opt.id,
          actual: opt.actual
        });

        results.push({ value: opt.id, actual: opt.actual });
        btn.disabled = true;
        btn.classList.add('exr-chosen');

        feedback.innerHTML +=
          '<div><span class="zh">' + opt.resultZh + '</span>' +
          '<span class="en">' + opt.resultEn + '</span></div>';

        if (results.length === (v.options || []).length) {
          _st.comparisons += 1;
          _log('comparison', {
            variableId: v.id,
            testItemId: testItem.id || null,
            resultCount: results.length,
            results: results.map(function (result) {
              return result.value + ':' + result.actual;
            }).join(',')
          });

          feedback.insertAdjacentHTML(
            'beforeend',
            '<div><button class="exr-btn" id="exr-next-btn">' +
              '<span class="zh">比较完成，下一步</span>' +
              '<span class="en">Compared, next</span>' +
            '</button></div>'
          );
          document.getElementById('exr-next-btn').addEventListener('click', _next);
        }
      });

      choiceWrap.appendChild(btn);
    });
  }

    function _renderEvidence(step) {
    var selected = {};
    var options = step.options || [];

    bodyEl.innerHTML =
      '<div class="exr-prompt"><span class="zh">哪些刚才看到的结果可以作为证据？（可多选）</span>' +
        '<span class="en">Which results you just observed can be used as evidence? (pick any)</span></div>' +
      '<div class="exr-choices" id="exr-ev-choices"></div>' +
      '<div class="exr-feedback" id="exr-evidence-feedback">' +
        '<button class="exr-btn" id="exr-confirm-btn">' +
          '<span class="zh">确认</span><span class="en">Confirm</span>' +
        '</button>' +
      '</div>';

    var wrap = bodyEl.querySelector('#exr-ev-choices');

    options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className = 'exr-btn';
      btn.innerHTML = '<span class="zh">' + opt.nameZh + '</span><span class="en">' + opt.nameEn + '</span>';
      btn.addEventListener('click', function () {
        selected[opt.id] = !selected[opt.id];
        btn.classList.toggle('exr-chosen', !!selected[opt.id]);
      });
      wrap.appendChild(btn);
    });

    document.getElementById('exr-confirm-btn').addEventListener('click', function () {
      var ids = Object.keys(selected).filter(function (id) { return selected[id]; });
      var selectedOptions = options.filter(function (opt) {
        return ids.indexOf(opt.id) >= 0;
      });
      var relevantSelected = selectedOptions.filter(function (opt) {
        return !!opt.relevant;
      }).length;
      var irrelevantSelected = selectedOptions.length - relevantSelected;
      var relevantTotal = options.filter(function (opt) {
        return !!opt.relevant;
      }).length;

      var groundedInObservedResults = selectedOptions.length > 0 &&
        selectedOptions.every(function (opt) {
          return opt.source === 'observation' || opt.source === 'variable_test';
        });

      _st.evidenceCount = ids.length;
      _st.relevantEvidence = relevantSelected;
      _st.irrelevantEvidence = irrelevantSelected;
      _st.relevantEvidenceTotal = relevantTotal;
      _st.evidenceGrounded = groundedInObservedResults;
      _log('evidence_selected', {
        evidenceIds: ids.join(','),
        relevantSelected: relevantSelected,
        irrelevantSelected: irrelevantSelected,
        relevantTotal: relevantTotal,
        groundedInObservedResults: groundedInObservedResults
      });

      var feedback = document.getElementById('exr-evidence-feedback');
      feedback.innerHTML =
        '<div><span class="zh">' +
          (relevantSelected === relevantTotal && irrelevantSelected === 0
            ? '这些证据都来自刚才的测试结果。'
            : '再看看：证据应该来自刚才实际观察到的结果，而不是外观猜测。') +
        '</span><span class="en">' +
          (relevantSelected === relevantTotal && irrelevantSelected === 0
            ? 'These evidence choices all come from the tests you just observed.'
            : 'Look again: evidence should come from observed test results, not an appearance guess.') +
        '</span></div>' +
        '<div><button class="exr-btn" id="exr-next-btn">' +
          '<span class="zh">下一步</span><span class="en">Next</span>' +
        '</button></div>';

      document.getElementById('exr-next-btn').addEventListener('click', _next);
    });
  }

    var EXPLAIN_PROMPT = {
      float_explore:  { zh: '为什么有的东西会浮，有的会沉？', en: 'Why do some things float and others sink?' },
      magnet_explore: { zh: '为什么有的东西会被磁铁吸住，有的不会？', en: 'Why are some things attracted by magnets and others not?' },
      ramp_explore: { zh: '根据刚才的测试，斜坡高度怎样影响小球滚动的距离？', en: 'Based on the tests, how did ramp height affect the distance the ball rolled?' },
      shadow_explore: { zh: '根据刚才的测试，光源距离怎样影响影子的大小？', en: 'Based on the tests, how did light-source distance affect shadow size?' }
    };

    function _renderExplain(step) {
      var prompt = EXPLAIN_PROMPT[variant.type] || EXPLAIN_PROMPT.float_explore;
      bodyEl.innerHTML =
        '<div class="exr-prompt"><span class="zh">' + prompt.zh + '</span>' +
          '<span class="en">' + prompt.en + '</span></div>' +
        '<div class="exr-choices" id="exr-exp-choices"></div>' +
        '<div class="exr-feedback" id="exr-feedback"></div>';
      var wrap = bodyEl.querySelector('#exr-exp-choices');
      (step.options || []).forEach(function (opt) {
        var btn = document.createElement('button');
        btn.className = 'exr-btn';
        btn.innerHTML = '<span class="zh">' + opt.nameZh + '</span><span class="en">' + opt.nameEn + '</span>';
        btn.addEventListener('click', function () {
          var attemptNumber = _st.explanationAttempts + 1;
          _st.explanationAttempts = attemptNumber;
          if (attemptNumber === 1) {
            _log('explanation', { optionId: opt.id, correct: !!opt.correct, attemptNumber: attemptNumber });
          } else {
            _st.revisions += 1;
            _log('revision', { optionId: opt.id, correct: !!opt.correct, attemptNumber: attemptNumber });
          }
          _st.explanationCorrect = !!opt.correct;
          btn.classList.add(opt.correct ? 'exr-correct' : 'exr-chosen');

          var feedbackText = opt.correct
            ? {
                zh: '这个解释和刚才的测试结果一致。',
                en: 'This explanation matches the test results you observed.'
              }
            : {
                zh: '这个解释还没有得到刚才测试结果的支持。探索仍然完成，下一次可以根据证据修正想法。',
                en: 'This explanation is not yet supported by the test results. The exploration is still complete, and you can revise the idea from evidence next time.'
              };
          var fb = bodyEl.querySelector('#exr-feedback');
          fb.innerHTML =
            '<span class="zh">' + feedbackText.zh + '</span>' +
            '<span class="en">' + feedbackText.en + '</span>' +
            '<div><button class="exr-btn" id="exr-next-btn">' +
              '<span class="zh">完成</span><span class="en">Finish</span>' +
            '</button></div>';
          document.getElementById('exr-next-btn').addEventListener('click', _next);

          var allBtns = wrap.querySelectorAll('.exr-btn');
          for (var i = 0; i < allBtns.length; i++) { allBtns[i].disabled = true; }
        });
        wrap.appendChild(btn);
      });
    }

    // Flat, <=24-key summary for the mastery/analytics engine — no nesting,
    // no raw arrays, matches engine.js's _summarizeProcess() contract.
    function _buildProcessSummary() {
      var processCompleted = _st.stepIndex >= steps.length;
      return {
        stepsTotal: steps.length,
        stepsCompleted: Math.min(_st.stepIndex, steps.length),
        processCompleted: processCompleted,
        predictions: _st.predictions,
        correctPredictions: _st.correctPredictions,
        actions: _st.actions,
        observations: _st.observations,
        reflections: _st.reflections,
        recognizedReflections: _st.recognizedReflections,
        variableChanges: _st.variableChanges,
        comparisons: _st.comparisons,
        evidenceCount: _st.evidenceCount,
        relevantEvidence: _st.relevantEvidence,
        irrelevantEvidence: _st.irrelevantEvidence,
        relevantEvidenceTotal: _st.relevantEvidenceTotal,
        evidenceGrounded: _st.evidenceGrounded,
        evidenceQualityMet: _st.evidenceGrounded &&
          _st.relevantEvidenceTotal > 0 &&
          _st.relevantEvidence === _st.relevantEvidenceTotal &&
          _st.irrelevantEvidence === 0,
        explanationAttempts: _st.explanationAttempts,
        explanationCorrect: _st.explanationCorrect,
        revisions: _st.revisions,
        eventsTotal: _st.events.length
      };
    }

    function _finish() {
      var process = _buildProcessSummary();
      var attempt = {
        templateId: template.id,
        variantId: variant.variantId,
        mode: template.runtime || template.mode || 'explore',
        result: process.processCompleted ? 'passed' : 'incomplete',
        responseMs: Date.now() - _st.startTs,
        process: process,
        trace: _st.events.slice()
      };
      bodyEl.innerHTML =
        '<div class="exr-prompt"><span class="zh">太棒了，探索完成！</span><span class="en">Great job — exploration complete!</span></div>';
      _tearDown();
      if (ctx.onComplete) ctx.onComplete(attempt);
    }

    function _tearDown() {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    _renderStep();
  }

  return { run: run };

}());
