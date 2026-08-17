'use strict';
/**
 * MiniGameRuntime — the third Activity Runtime.
 *
 *   Puzzle      one question, one answer          (think → choose)
 *   Interaction one manipulation task             (think → manipulate)
 *   Mini-game   a short continuous scene          (observe → judge → act, many times)
 *
 * This file owns the LIFECYCLE ONLY. It never knows what the game looks like:
 *   ready screen → countdown → rounds → pause/resume → finish → one Attempt
 * Gameplay lives in Adapters (see minigame-quick-compare.js), registered with
 * MiniGameRuntime.register(). A new game therefore never re-implements the
 * header, language switching, volume, timer, pause, exit, scoring, the Attempt
 * shape or the Cycle hand-back.
 *
 * Hard rules encoded here (see docs/patterns/PATTERN-QUALITY-GATE.md §9):
 *   1. No per-round time limit — a slow child is never judged wrong.
 *      Running out of time ends the game; the unanswered round is discarded.
 *   2. Always pausable, and auto-paused when the tab/app loses visibility.
 *      Resume is always an explicit tap, never automatic.
 *   3. Below the pass threshold is 'completed', not a failure: the template
 *      still counts as done so a cycle can never stall on a hard game.
 *   4. Leaving mid-game records nothing at all (result 'aborted'), so quitting
 *      is never a scored loss.
 *   5. No numeric score in the UI. K1/K2 collect stars, G1+ see a streak.
 *      The raw score lives in process.score for analytics only.
 */
var MiniGameRuntime = (function () {

  // ── Adapter registry ───────────────────────────────────────────────────────

  var _adapters = {};

  /**
   * Register a gameplay Adapter. Contract (all optional except the first four):
   *   id           string, matches template.engine
   *   mount        (stageEl, ctx) → void   ctx: {params, template, variant, lang,
   *                                             speak, submit, requestFinish, setMessage}
   *   nextRound    (roundIndex) → round | null   null ends the game
   *   renderRound  (round, roundIndex) → void
   *   judge        (input, round) → {correct:boolean, errorType?:string}
   *   showJudgement(correct, round, input) → void  optional per-game feedback
   *   applyLang    () → void                       optional re-render on language switch
   *   onTick       (dtMs, elapsedMs) → void        optional; only moving games need it
   *   unmount      () → void
   * An Adapter may ASK to finish early via ctx.requestFinish(reason); it can
   * never end the game, score it, or touch the Cycle itself.
   */
  function register(adapter) {
    if (!adapter || !adapter.id) {
      console.warn('[minigame] register() needs an adapter with an id');
      return;
    }
    _adapters[adapter.id] = adapter;
  }

  // ── Config ─────────────────────────────────────────────────────────────────

  var DEFAULT_DURATION_SEC   = 30;
  var DEFAULT_ROUND_TARGET   = 12;
  var DEFAULT_PASS_THRESHOLD = 0.7;
  var FEEDBACK_MS_OK         = 420;
  var FEEDBACK_MS_ERR        = 780;
  var END_FLASH_MS           = 1200;
  var STAR_ROW_MAX           = 12;   // visual cap only; correctRounds is unbounded

  // Stars for the pre-readers, a streak for the ones who can read a number and
  // not be discouraged by it.
  var HUD_STYLE_BY_LEVEL = { K1: 'stars', K2: 'stars', G1: 'streak', G2: 'streak' };

  function _clamp(n, lo, hi, dflt) {
    n = typeof n === 'number' && isFinite(n) ? n : dflt;
    return Math.min(hi, Math.max(lo, n));
  }

  function _readParams(template, variant) {
    var p = (template && template.params) || {};
    var v = variant || {};
    // The variant wins when it carries a value: the generator has already
    // clamped and normalized what the template asked for.
    var durationSec = _clamp(v.durationSec  || p.durationSec,  10, 120, DEFAULT_DURATION_SEC);
    var roundTarget = _clamp(v.roundTarget  || p.roundTarget,   3,  40, DEFAULT_ROUND_TARGET);
    var threshold   = _clamp(v.passThreshold || p.passThreshold, 0.3, 1, DEFAULT_PASS_THRESHOLD);
    return {
      durationSec:   Math.round(durationSec),
      roundTarget:   Math.round(roundTarget),
      passThreshold: threshold,
      // A game cut short by the clock must not be judged on two lucky rounds.
      minRounds:     Math.round(_clamp(v.minRounds || p.minRounds, 1, roundTarget,
                                       Math.max(3, Math.ceil(roundTarget * 0.5)))),
      timerStyle:    (v.timerStyle || p.timerStyle) === 'countdown' ? 'countdown' : 'collect',
      hudStyle:      HUD_STYLE_BY_LEVEL[template && template.level] || 'stars'
    };
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  var _styled = false;
  function _injectStyles() {
    if (_styled) return;
    _styled = true;
    IH.injectStyles();
    var s = document.createElement('style');
    s.textContent = [
      '.mg{position:fixed;inset:0;background:var(--s1-bg,#eff6ff);z-index:500;display:flex;flex-direction:column;font-family:inherit;}',
      '.mg-meter{flex-shrink:0;padding:8px 18px 2px;display:flex;flex-direction:column;gap:5px;}',
      '.mg-meter-row{display:flex;align-items:center;gap:10px;}',
      '.mg-bar{flex:1;height:14px;border-radius:999px;background:#dbeafe;overflow:hidden;}',
      '.mg-bar-fill{height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,#38bdf8,#2563eb);transition:width .18s linear;}',
      '.mg-bar-fill.mg-warn{background:linear-gradient(90deg,#fbbf24,#f59e0b);}',
      '.mg-bar-fill.mg-low{background:linear-gradient(90deg,#fb7185,#e11d48);}',
      '.mg-meter-lbl{font-size:12px;font-weight:800;color:#475569;min-width:44px;text-align:right;}',
      '.mg-hud{min-height:26px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:20px;letter-spacing:2px;}',
      '.mg-streak{font-size:14px;font-weight:900;color:#1e3a8a;letter-spacing:0;}',
      '.mg-stage{flex:1;display:flex;align-items:center;justify-content:center;padding:10px 18px;position:relative;min-height:0;}',
      '.mg-msg{flex-shrink:0;text-align:center;font-size:14px;font-weight:700;min-height:24px;padding:2px 16px 10px;color:#475569;}',
      '.mg-msg.ok{color:#16a34a;}',
      '.mg-msg.err{color:#dc2626;}',
      // Full-scene overlays: ready / paused / finished
      '.mg-veil{position:absolute;inset:0;background:rgba(239,246,255,0.96);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center;z-index:3;}',
      '.mg-veil-icon{font-size:52px;line-height:1;}',
      '.mg-veil-title{font-size:20px;font-weight:900;color:#1e3a8a;}',
      '.mg-veil-sub{font-size:14px;font-weight:700;color:#475569;max-width:320px;}',
      '.mg-btn{border:0;border-radius:999px;padding:12px 30px;font-size:17px;font-weight:900;color:#fff;cursor:pointer;background:linear-gradient(135deg,#3b82f6,#2563eb);box-shadow:0 4px 12px rgba(37,99,235,.3);}',
      '.mg-btn:active{transform:translateY(1px);}',
      '.mg-pausebtn{border:0;background:transparent;font-size:20px;cursor:pointer;padding:2px 6px;line-height:1;}',
      // Countdown before the clock starts, so reading time is never scored
      '.mg-count{font-size:80px;font-weight:900;color:#2563eb;line-height:1;}',
      // Generic judgement flash. Adapters may add their own on top.
      '.mg-flash{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:88px;line-height:1;opacity:0;pointer-events:none;z-index:2;}',
      '@keyframes mg-pop{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}35%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.25)}}',
      '.mg-flash.mg-on{animation:mg-pop .5s ease forwards;}',
      '@keyframes mg-star-pop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}',
      '.mg-star{display:inline-block;animation:mg-star-pop .28s ease;}'
    ].join('');
    document.head.appendChild(s);
  }

  // ── State ──────────────────────────────────────────────────────────────────

  var _st = null;

  // Local-only telemetry. Mid-game exits are deliberately never recorded as
  // attempts; this counter exists so the behaviour is still observable in a
  // debug session without inventing a server event for it.
  var _abortCount = 0;

  function run(template, variant, ctx) {
    var adapter = _adapters[(template && template.engine) || (variant && variant.engine)];
    if (!adapter) {
      // A template naming an engine nobody registered must not dead-end the
      // cycle. Hand back an aborted attempt: game.js drops it and the child
      // returns to the level picker with the template still pending.
      console.warn('[minigame] no adapter registered for engine:', template && template.engine);
      if (ctx && ctx.onComplete) {
        ctx.onComplete({
          templateId: template && template.id, variantId: (variant && variant.variantId) || '',
          mode: 'mini', result: 'aborted', responseMs: 0,
          process: { engine: (template && template.engine) || '', endReason: 'no_adapter' }
        });
      }
      return;
    }

    _injectStyles();
    if (typeof PointerDrag !== 'undefined') PointerDrag.unregisterAll();

    var params = _readParams(template, variant);
    _st = {
      template: template, variant: variant, ctx: ctx,
      adapter: adapter, params: params,
      phase: 'ready',          // ready | counting | playing | paused | ended
      roundIndex: 0,           // rounds started
      rounds: 0,               // rounds answered
      correct: 0,
      streak: 0, bestStreak: 0,
      roundMs: [],             // per-round response times
      errorTypes: {},
      round: null,
      locked: false,
      pendingNext: false,      // a round advance owed after a pause
      startedAt: 0,            // wall clock when the clock started
      roundStartedAt: 0,
      pausedTotal: 0, pausedAt: 0,
      lastTickAt: 0,
      raf: 0,
      timers: [],
      endReason: ''
    };
    _buildUI();
    _showReady();
  }

  // ── UI shell ───────────────────────────────────────────────────────────────

  function _buildUI() {
    var s = _st;
    var title = (s.variant && s.variant.titleZh) || '快速比较';
    var titleEn = (s.variant && s.variant.titleEn) || 'Quick Compare';

    var root = document.createElement('div');
    root.className = 'mg';
    root.id = 'mg-root';
    root.innerHTML =
      '<div class="ih-hdr">' +
        '<button class="ih-back" id="mg-back">⬅️</button>' +
        '<div class="ih-title">' +
          '<span class="zh">' + s.ctx.levelId + ' · ' + title + '</span>' +
          '<span class="en">' + s.ctx.levelId + ' · ' + titleEn + '</span>' +
        '</div>' +
        IH.controlsHtml('mg') +
      '</div>' +
      '<div class="mg-meter">' +
        '<div class="mg-meter-row">' +
          '<button class="mg-pausebtn" id="mg-pause" aria-label="pause">⏸️</button>' +
          '<div class="mg-bar"><div class="mg-bar-fill" id="mg-bar-fill"></div></div>' +
          '<div class="mg-meter-lbl" id="mg-meter-lbl"></div>' +
        '</div>' +
        '<div class="mg-hud" id="mg-hud"></div>' +
      '</div>' +
      '<div class="mg-stage" id="mg-stage">' +
        '<div class="mg-flash" id="mg-flash"></div>' +
      '</div>' +
      '<div class="mg-msg" id="mg-msg"></div>';

    document.body.appendChild(root);
    // No onReset: a timed run is not resettable. Restarting means leaving and
    // entering again, which keeps process data honest about what was played.
    IH.wire('mg', {});
    _applyLang();

    document.getElementById('mg-back').addEventListener('click', _exit);
    document.getElementById('mg-pause').addEventListener('click', function () {
      if (_st && _st.phase === 'playing') _pause('button');
      else if (_st && _st.phase === 'paused') _resume();
    });

    document.addEventListener('shell:langchange', _onLangChange);
    document.addEventListener('visibilitychange', _onVisibility);
    window.addEventListener('blur', _onWindowBlur);
  }

  function _stageEl() { return document.getElementById('mg-stage'); }

  function _showReady() {
    var s = _st;
    var p = s.params;
    _renderMeter();
    _renderHud();
    var veil = document.createElement('div');
    veil.className = 'mg-veil';
    veil.id = 'mg-ready';
    veil.innerHTML =
      '<div class="mg-veil-icon">⚡</div>' +
      '<div class="mg-veil-title">' +
        '<span class="zh">准备好了吗？</span>' +
        '<span class="en">Ready?</span>' +
      '</div>' +
      '<div class="mg-veil-sub">' +
        '<span class="zh">连续回答 ' + p.roundTarget + ' 小题，没有单题限时，想好再点。</span>' +
        '<span class="en">' + p.roundTarget + ' quick rounds. No clock on any single round — think, then tap.</span>' +
      '</div>' +
      '<button class="mg-btn" id="mg-start">' +
        '<span class="zh">开始</span><span class="en">Start</span>' +
      '</button>';
    _stageEl().appendChild(veil);
    _applyLang();
    document.getElementById('mg-start').addEventListener('click', _startCountdown);
  }

  // 3-2-1 before the clock runs, so the first round is never answered under a
  // timer the child has not seen yet.
  function _startCountdown() {
    var s = _st;
    var ready = document.getElementById('mg-ready');
    if (ready) ready.remove();
    s.phase = 'counting';

    var veil = document.createElement('div');
    veil.className = 'mg-veil';
    veil.id = 'mg-count';
    veil.innerHTML = '<div class="mg-count" id="mg-count-n">3</div>';
    _stageEl().appendChild(veil);

    var n = 3;
    var step = function () {
      if (!_st || _st.phase !== 'counting') return;
      n -= 1;
      var el = document.getElementById('mg-count-n');
      if (n > 0) {
        if (el) el.textContent = String(n);
        _later(step, 620);
      } else {
        var v = document.getElementById('mg-count');
        if (v) v.remove();
        _beginPlay();
      }
    };
    _later(step, 620);
  }

  function _beginPlay() {
    var s = _st;
    s.phase = 'playing';
    s.startedAt = Date.now();
    s.lastTickAt = s.startedAt;

    s.adapter.mount(_stageEl(), {
      params:        s.params,
      template:      s.template,
      variant:       s.variant,
      lang:          function () { return shell.lang || 'zh'; },
      speak:         function (zh, en) { shell.speak((shell.lang || 'zh') === 'zh' ? zh : en); },
      submit:        _submit,
      requestFinish: function (reason) { _finish(reason || 'adapter'); },
      setMessage:    _setMsg
    });

    _nextRound();
    _loop();
  }

  // ── Clock ──────────────────────────────────────────────────────────────────

  function _elapsed() {
    var s = _st;
    if (!s || !s.startedAt) return 0;
    var extra = s.phase === 'paused' ? (Date.now() - s.pausedAt) : 0;
    return Date.now() - s.startedAt - s.pausedTotal - extra;
  }

  function _loop() {
    var s = _st;
    if (!s || s.phase === 'ended') return;
    s.raf = requestAnimationFrame(function () {
      if (!_st || _st.phase === 'ended') return;
      if (_st.phase === 'playing') {
        var now = Date.now();
        var dt = now - _st.lastTickAt;
        _st.lastTickAt = now;
        var elapsed = _elapsed();

        if (_st.adapter.onTick) _st.adapter.onTick(dt, elapsed);
        _renderMeter();

        if (elapsed >= _st.params.durationSec * 1000) {
          // Time is up. Any round on screen is simply discarded — never wrong.
          _finish('timeout');
          return;
        }
      }
      _loop();
    });
  }

  // ── Rounds ─────────────────────────────────────────────────────────────────

  function _nextRound() {
    var s = _st;
    if (!s || s.phase !== 'playing') return;

    if (s.rounds >= s.params.roundTarget) { _finish('roundTarget'); return; }

    var round = s.adapter.nextRound(s.roundIndex);
    if (!round) { _finish('exhausted'); return; }

    s.round = round;
    s.roundIndex += 1;
    s.locked = false;
    s.roundStartedAt = Date.now();
    _setMsg('', '', '');
    s.adapter.renderRound(round, s.roundIndex - 1);
  }

  // Called by the Adapter when the child acts. The Adapter judges; the Runtime
  // scores, paces and decides when the game is over.
  function _submit(input) {
    var s = _st;
    if (!s || s.phase !== 'playing' || s.locked || !s.round) return;
    s.locked = true;

    var verdict = s.adapter.judge(input, s.round) || { correct: false };
    var ms = Date.now() - s.roundStartedAt;

    s.rounds += 1;
    s.roundMs.push(ms);
    if (verdict.correct) {
      s.correct += 1;
      s.streak += 1;
      if (s.streak > s.bestStreak) s.bestStreak = s.streak;
    } else {
      s.streak = 0;
      var et = verdict.errorType || 'wrong';
      s.errorTypes[et] = (s.errorTypes[et] || 0) + 1;
    }

    _flash(verdict.correct);
    _renderHud();
    _renderMeter();
    if (s.adapter.showJudgement) s.adapter.showJudgement(!!verdict.correct, s.round, input);

    _later(function () {
      if (!_st) return;
      // Pausing during the feedback flash must not swallow the next round:
      // remember that an advance is owed and do it on resume.
      if (_st.phase === 'paused') { _st.pendingNext = true; return; }
      if (_st.phase !== 'playing') return;
      _nextRound();
    }, verdict.correct ? FEEDBACK_MS_OK : FEEDBACK_MS_ERR);
  }

  // ── Pause / resume ─────────────────────────────────────────────────────────

  function _pause(source) {
    var s = _st;
    if (!s || s.phase !== 'playing') return;
    s.phase = 'paused';
    s.pausedAt = Date.now();

    var veil = document.createElement('div');
    veil.className = 'mg-veil';
    veil.id = 'mg-paused';
    veil.innerHTML =
      '<div class="mg-veil-icon">⏸️</div>' +
      '<div class="mg-veil-title">' +
        '<span class="zh">暂停了</span><span class="en">Paused</span>' +
      '</div>' +
      '<div class="mg-veil-sub">' +
        '<span class="zh">计时已停，准备好了再继续。</span>' +
        '<span class="en">The clock is stopped. Continue when you are ready.</span>' +
      '</div>' +
      '<button class="mg-btn" id="mg-resume">' +
        '<span class="zh">继续</span><span class="en">Continue</span>' +
      '</button>';
    _stageEl().appendChild(veil);
    _applyLang();
    document.getElementById('mg-resume').addEventListener('click', _resume);
    if (shell.audio) shell.audio.pauseMusic();
    if (source === 'hidden') _setMsg('', '', '');
  }

  function _resume() {
    var s = _st;
    if (!s || s.phase !== 'paused') return;
    s.pausedTotal += Date.now() - s.pausedAt;
    s.pausedAt = 0;
    s.lastTickAt = Date.now();
    s.phase = 'playing';
    var veil = document.getElementById('mg-paused');
    if (veil) veil.remove();
    if (shell.audio) shell.audio.resumeMusic();
    if (s.pendingNext) { s.pendingNext = false; _nextRound(); }
  }

  function _onVisibility() {
    if (!_st) return;
    if (document.hidden && _st.phase === 'playing') _pause('hidden');
  }

  function _onWindowBlur() {
    if (!_st) return;
    if (_st.phase === 'playing') _pause('blur');
  }

  // ── Finish ─────────────────────────────────────────────────────────────────

  function _finish(reason) {
    var s = _st;
    if (!s || s.phase === 'ended') return;
    s.phase = 'ended';
    s.endReason = reason;
    if (s.raf) cancelAnimationFrame(s.raf);

    var attempt = _buildAttempt();
    var passed  = attempt.result === 'passed';

    // Brief in-scene flash only. The readable summary lives in the result
    // overlay game.js already shows, so the child never taps through two.
    var veil = document.createElement('div');
    veil.className = 'mg-veil';
    veil.id = 'mg-end';
    veil.innerHTML =
      '<div class="mg-veil-icon">' + (passed ? '🌟' : '💪') + '</div>' +
      '<div class="mg-veil-title">' +
        '<span class="zh">' + (reason === 'timeout' ? '时间到！' : '完成！') + '</span>' +
        '<span class="en">' + (reason === 'timeout' ? "Time's up!" : 'Finished!') + '</span>' +
      '</div>';
    if (_stageEl()) _stageEl().appendChild(veil);
    _applyLang();
    if (shell.audio) shell.audio.sfx(passed ? 'win' : 'fail');
    shell.speak((shell.lang || 'zh') === 'zh'
      ? (reason === 'timeout' ? '时间到！' : '完成啦！')
      : (reason === 'timeout' ? "Time's up!" : 'All done!'));

    var onComplete = s.ctx.onComplete;
    _later(function () {
      _tearDown();
      if (onComplete) onComplete(attempt);
    }, END_FLASH_MS);
  }

  function _buildAttempt() {
    var s = _st;
    var p = s.params;
    var rounds = s.rounds;
    var accuracy = rounds ? s.correct / rounds : 0;
    // A continuous game cannot answer "was it correct?", so it answers
    // "did the run clear the bar?" — and a short run never clears it by luck.
    var minRoundsMet = rounds >= p.minRounds;
    var pass = minRoundsMet && accuracy >= p.passThreshold;

    var sum = 0, fastest = 0, slowest = 0;
    s.roundMs.forEach(function (ms, i) {
      sum += ms;
      if (i === 0 || ms < fastest) fastest = ms;
      if (ms > slowest) slowest = ms;
    });

    var errorTop = '';
    var errorMax = 0;
    for (var k in s.errorTypes) {
      if (!Object.prototype.hasOwnProperty.call(s.errorTypes, k)) continue;
      if (s.errorTypes[k] > errorMax) { errorMax = s.errorTypes[k]; errorTop = k; }
    }

    return {
      templateId: s.template.id,
      variantId:  (s.variant && s.variant.variantId) || '',
      mode:       'mini',
      result:     pass ? 'passed' : 'completed',
      responseMs: Math.max(0, Math.round(_elapsed())),
      process: {
        engine:        s.adapter.id,
        rounds:        rounds,
        correctRounds: s.correct,
        wrongRounds:   rounds - s.correct,
        accuracyPct:   Math.round(accuracy * 100),
        bestStreak:    s.bestStreak,
        avgRoundMs:    rounds ? Math.round(sum / rounds) : 0,
        fastestRoundMs: fastest,
        slowestRoundMs: slowest,
        roundTarget:   p.roundTarget,
        durationSec:   p.durationSec,
        passThreshold: p.passThreshold,
        minRounds:     p.minRounds,
        minRoundsMet:  minRoundsMet,
        endReason:     s.endReason,
        timedOut:      s.endReason === 'timeout',
        // Kept out of the UI on purpose (§9): a leaderboard number is the wrong
        // motivation at this age. Analytics may still rank runs by it.
        score:         s.correct * 10 + s.bestStreak * 5,
        topErrorType:  errorTop
      }
    };
  }

  // Leaving mid-game is not a failure and not an attempt: nothing is recorded,
  // the template stays in the cycle, and game.js sends the child back.
  function _exit() {
    var s = _st;
    if (!s) return;
    var played = s.phase === 'playing' || s.phase === 'paused';
    var onBack = s.ctx.onBack;
    var onComplete = s.ctx.onComplete;
    if (played) _abortCount += 1;
    console.debug('[minigame] exit', { engine: s.adapter.id, phase: s.phase,
      rounds: s.rounds, aborts: _abortCount });
    _tearDown();
    if (onBack) onBack();
    else if (onComplete) {
      onComplete({ templateId: '', variantId: '', mode: 'mini', result: 'aborted',
        responseMs: 0, process: { endReason: 'exit' } });
    }
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  function _renderMeter() {
    var s = _st;
    if (!s) return;
    var fill = document.getElementById('mg-bar-fill');
    var lbl  = document.getElementById('mg-meter-lbl');
    if (!fill || !lbl) return;

    if (s.params.timerStyle === 'countdown') {
      var total = s.params.durationSec * 1000;
      var left  = Math.max(0, total - _elapsed());
      var pct   = total ? (left / total) * 100 : 0;
      fill.style.width = pct.toFixed(1) + '%';
      fill.className = 'mg-bar-fill' + (pct < 12 ? ' mg-low' : (pct < 34 ? ' mg-warn' : ''));
      lbl.textContent = Math.ceil(left / 1000) + 's';
    } else {
      // Collection bar: it FILLS as work is collected. A draining clock in front
      // of a 4-year-old buys anxiety, not attention — the time limit still
      // applies, it is just not the thing on screen.
      var done = Math.min(s.rounds, s.params.roundTarget);
      fill.style.width = ((done / s.params.roundTarget) * 100).toFixed(1) + '%';
      fill.className = 'mg-bar-fill';
      lbl.textContent = done + '/' + s.params.roundTarget;
    }
  }

  function _renderHud() {
    var s = _st;
    if (!s) return;
    var hud = document.getElementById('mg-hud');
    if (!hud) return;

    if (s.params.hudStyle === 'streak') {
      var zh = s.streak >= 2 ? ('连对 ' + s.streak + ' 题！') : '';
      var en = s.streak >= 2 ? (s.streak + ' in a row!') : '';
      hud.innerHTML = '<span class="mg-streak">' +
        '<span class="zh">' + zh + '</span><span class="en">' + en + '</span></span>';
      _applyLang(hud);
      return;
    }
    // Stars: one per correct round, capped so the row never wraps the layout.
    var shown = Math.min(s.correct, STAR_ROW_MAX);
    var html = '';
    for (var i = 0; i < shown; i++) html += '<span class="mg-star">⭐</span>';
    if (s.correct > STAR_ROW_MAX) html += '<span class="mg-streak">+' + (s.correct - STAR_ROW_MAX) + '</span>';
    hud.innerHTML = html;
  }

  function _flash(correct) {
    if (shell.audio) shell.audio.sfx(correct ? 'correct' : 'wrong');
    var el = document.getElementById('mg-flash');
    if (!el) return;
    el.textContent = correct ? '✅' : '💡';
    el.classList.remove('mg-on');
    // Force a reflow so the animation restarts on consecutive rounds.
    void el.offsetWidth;
    el.classList.add('mg-on');
  }

  function _setMsg(zh, en, cls) {
    var el = document.getElementById('mg-msg');
    if (!el) return;
    el.className = 'mg-msg' + (cls ? ' ' + cls : '');
    el.innerHTML = '<span class="zh">' + (zh || '') + '</span><span class="en">' + (en || '') + '</span>';
    _applyLang(el);
  }

  function _applyLang(el) {
    if (!el || el.type) el = null;
    var root = el || document.getElementById('mg-root');
    if (!root || !root.querySelectorAll) return;
    var l = shell.lang || 'zh';
    root.querySelectorAll('.zh').forEach(function (n) { n.style.display = l === 'zh' ? '' : 'none'; });
    root.querySelectorAll('.en').forEach(function (n) { n.style.display = l === 'en' ? '' : 'none'; });
  }

  function _onLangChange() {
    _applyLang();
    if (_st && _st.adapter.applyLang) _st.adapter.applyLang();
  }

  // ── Timers ─────────────────────────────────────────────────────────────────

  // Every delayed callback goes through here so _tearDown can cancel all of
  // them: a pending "next round" firing after the scene is gone would rebuild
  // half a game on top of the next activity.
  function _later(fn, ms) {
    if (!_st) return;
    var id = setTimeout(function () {
      if (!_st) return;
      var i = _st.timers.indexOf(id);
      if (i !== -1) _st.timers.splice(i, 1);
      fn();
    }, ms);
    _st.timers.push(id);
  }

  function _tearDown() {
    var s = _st;
    if (!s) return;
    if (s.raf) cancelAnimationFrame(s.raf);
    s.timers.forEach(function (id) { clearTimeout(id); });
    if (s.adapter && s.adapter.unmount) {
      try { s.adapter.unmount(); } catch (e) { console.warn('[minigame] unmount failed', e); }
    }
    document.removeEventListener('shell:langchange', _onLangChange);
    document.removeEventListener('visibilitychange', _onVisibility);
    window.removeEventListener('blur', _onWindowBlur);
    if (typeof PointerDrag !== 'undefined') PointerDrag.unregisterAll();
    var root = document.getElementById('mg-root');
    if (root) root.remove();
    _st = null;
  }

  return {
    run: run,
    register: register,
    // Exposed for tests and debugging only.
    _readParams: _readParams,
    _abortCount: function () { return _abortCount; }
  };
}());
