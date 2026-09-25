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
      variableChanges: 0,
      evidenceCount: 0,
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
        _st.observations += 1;
        _log('observation', { itemId: item.id, actual: actual });
        if (guess === actual) _st.correctPredictions += 1;
        var emojiEl = bodyEl.querySelector('.exr-emoji');
        if (emojiEl) emojiEl.classList.add(cfg.animClass(actual));
        var res = cfg.resultText(actual);
        fb.innerHTML =
          '<span class="zh">结果：' + res.zh + '</span>' +
          '<span class="en">Result: ' + res.en + '</span>' +
          '<div><button class="exr-btn" id="exr-next-btn"><span class="zh">下一步</span><span class="en">Next</span></button></div>';
        document.getElementById('exr-next-btn').addEventListener('click', _next);
      });
    }

    var VARIABLE_PROMPT = {
      float_explore:  { zh: '试试换一种水，会有什么不同？', en: 'Try a different kind of water — what changes?' },
      magnet_explore: { zh: '试试改变磁铁的距离，会有什么不同？', en: 'Try changing the magnet\'s distance — what changes?' }
    };

    function _renderVariable(step) {
      var v = step.variable;
      var prompt = VARIABLE_PROMPT[variant.type] || VARIABLE_PROMPT.float_explore;
      bodyEl.innerHTML =
        '<div class="exr-prompt"><span class="zh">' + prompt.zh + '</span>' +
          '<span class="en">' + prompt.en + '</span></div>' +
        '<div class="exr-choices" id="exr-var-choices"></div>' +
        '<div class="exr-feedback" id="exr-feedback"></div>';
      var choiceWrap = bodyEl.querySelector('#exr-var-choices');
      (v.options || []).forEach(function (opt) {
        var btn = document.createElement('button');
        btn.className = 'exr-btn';
        btn.innerHTML = '<span class="zh">' + opt.nameZh + '</span><span class="en">' + opt.nameEn + '</span>';
        btn.addEventListener('click', function () {
          _st.variableChanges += 1;
          _log('variable_changed', { variableId: v.id, value: opt.id });
          var fb = bodyEl.querySelector('#exr-feedback');
          fb.innerHTML = '<div><button class="exr-btn" id="exr-next-btn"><span class="zh">下一步</span><span class="en">Next</span></button></div>';
          document.getElementById('exr-next-btn').addEventListener('click', _next);
        });
        choiceWrap.appendChild(btn);
      });
    }

    function _renderEvidence(step) {
      var selected = {};
      bodyEl.innerHTML =
        '<div class="exr-prompt"><span class="zh">哪些线索可以帮助我们解释结果？（可多选）</span>' +
          '<span class="en">Which clues help explain the result? (pick any)</span></div>' +
        '<div class="exr-choices" id="exr-ev-choices"></div>' +
        '<div class="exr-feedback"><button class="exr-btn" id="exr-confirm-btn"><span class="zh">确认</span><span class="en">Confirm</span></button></div>';
      var wrap = bodyEl.querySelector('#exr-ev-choices');
      (step.options || []).forEach(function (opt) {
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
        var ids = Object.keys(selected).filter(function (k) { return selected[k]; });
        _st.evidenceCount = ids.length;
        _log('evidence_selected', { evidenceIds: ids.join(',') });
        _next();
      });
    }

    var EXPLAIN_PROMPT = {
      float_explore:  { zh: '为什么有的东西会浮，有的会沉？', en: 'Why do some things float and others sink?' },
      magnet_explore: { zh: '为什么有的东西会被磁铁吸住，有的不会？', en: 'Why are some things attracted by magnets and others not?' }
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
          if (opt.correct) {
            _st.explanationCorrect = true;
            btn.classList.add('exr-correct');
            var fb = bodyEl.querySelector('#exr-feedback');
            fb.innerHTML = '<div><button class="exr-btn" id="exr-next-btn"><span class="zh">完成</span><span class="en">Finish</span></button></div>';
            document.getElementById('exr-next-btn').addEventListener('click', _next);
            var allBtns = wrap.querySelectorAll('.exr-btn');
            for (var i = 0; i < allBtns.length; i++) { allBtns[i].disabled = true; }
          } else {
            btn.classList.add('exr-wrong');
            var fb2 = bodyEl.querySelector('#exr-feedback');
            fb2.innerHTML = '<span class="zh">再想想看？</span><span class="en">Not quite — try again?</span>';
          }
        });
        wrap.appendChild(btn);
      });
    }

    // Flat, <=24-key summary for the mastery/analytics engine — no nesting,
    // no raw arrays, matches engine.js's _summarizeProcess() contract.
    function _buildProcessSummary() {
      return {
        stepsTotal: steps.length,
        stepsCompleted: Math.min(_st.stepIndex, steps.length),
        predictions: _st.predictions,
        correctPredictions: _st.correctPredictions,
        actions: _st.actions,
        observations: _st.observations,
        variableChanges: _st.variableChanges,
        evidenceCount: _st.evidenceCount,
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
        result: _st.explanationCorrect ? 'correct' : 'incomplete',
        responseMs: Date.now() - _st.startTs,
        process: process,
        // Full raw untouched event trace — kept separate from `process` and
        // consumed by shell.report()'s record/context columns, never by the
        // mastery engine (which only ever sees the flat summary above).
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
