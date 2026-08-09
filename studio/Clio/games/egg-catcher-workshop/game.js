(function () {
  'use strict';

  // ── Runtime bridge (guarded timers + session isolation) ────────────────────
  var bridge = window.ClioRuntimeBridge
    ? window.ClioRuntimeBridge.createController('egg-catcher-workshop')
    : null;

  function timer(key, ms, fn) {
    if (bridge) { bridge.setTimer(key, ms, fn); }
    else { setTimeout(fn, ms); }
  }

  // ── State ──────────────────────────────────────────────────────────────────
  var state = {
    lang:     (localStorage.getItem('mindsevo-lang') === 'en') ? 'en' : 'zh',
    phase:    'idle',   // idle | catch | cracking | math | celebrate | fail
    egg:      { px: 0, py: 0, speed: 0 },
    boy:      { xFrac: 0.5 },
    score:    0,
    best:     parseInt(localStorage.getItem('ec-best') || '0', 10),
    question: null,
    answered: false,
    raf:      null,
    lastTs:   0
  };

  // ── Element refs ───────────────────────────────────────────────────────────
  var els = {
    titleText:    document.getElementById('titleText'),
    subtitleText: document.getElementById('subtitleText'),
    langBtn:      document.getElementById('langBtn'),
    musicBtn:     document.getElementById('musicBtn'),
    sfxBtn:       document.getElementById('sfxBtn'),
    voiceBtn:     document.getElementById('voiceBtn'),
    resetBtn:     document.getElementById('resetBtn'),
    scoreLabel:   document.getElementById('scoreLabel'),
    scoreCount:   document.getElementById('scoreCount'),
    bestLabel:    document.getElementById('bestLabel'),
    bestScore:    document.getElementById('bestScore'),

    sceneCatch:     document.getElementById('sceneCatch'),
    sceneMath:      document.getElementById('sceneMath'),
    sceneCelebrate: document.getElementById('sceneCelebrate'),
    sceneFail:      document.getElementById('sceneFail'),

    catchArea:  document.getElementById('catchArea'),
    eggEl:      document.getElementById('eggEl'),
    boyEl:      document.getElementById('boyEl'),
    basketEl:   document.getElementById('basketEl'),
    catchHint:  document.getElementById('catchHint'),

    qEquation:  document.getElementById('qEquation'),
    optsGrid:   document.getElementById('optsGrid'),
    mathMsg:    document.getElementById('mathMsg'),

    celeEmoji:  document.getElementById('celeEmoji'),
    celeTitle:  document.getElementById('celeTitle'),
    celeSub:    document.getElementById('celeSub'),

    failEmoji:  document.getElementById('failEmoji'),
    failTitle:  document.getElementById('failTitle'),
    failSub:    document.getElementById('failSub'),
    failScore:  document.getElementById('failScore'),
    retryBtn:   document.getElementById('retryBtn')
  };

  // ── i18n ───────────────────────────────────────────────────────────────────
  var TEXT = {
    zh: {
      title:      '接蛋数学',
      subtitle:   '移动鼠标控制小男孩，用头顶的竹筐接住蛋！',
      catchHint:  '🖱️ 移动鼠标接住蛋！',
      catchMiss:  '哎，漏掉了！再来一个！🥚',
      score:      '得分',
      best:       '最高',
      reset:      '重置',
      lang:       '中文 / EN',
      msgOk:      '✓ 答对了！',
      msgWrong:   '✗ 正确答案是 {0}',
      celeTitle:  '太棒了！',
      celeSub:    '继续接下一个蛋！',
      failTitle:  '答错了！',
      failSub:    '游戏结束，再来一次！',
      failScore:  '得分：{0}',
      retry:      '重新来过 🥚'
    },
    en: {
      title:      'Egg Catcher Math',
      subtitle:   'Move your mouse — catch falling eggs with the basket on the boy\'s head!',
      catchHint:  '🖱️ Move mouse to catch the egg!',
      catchMiss:  'Missed! Here comes another! 🥚',
      score:      'Score',
      best:       'Best',
      reset:      'Reset',
      lang:       'EN / 中文',
      msgOk:      '✓ Correct!',
      msgWrong:   '✗ Answer was {0}',
      celeTitle:  'Amazing!',
      celeSub:    'Catch the next egg!',
      failTitle:  'Wrong Answer!',
      failSub:    'Game over — try again!',
      failScore:  'Score: {0}',
      retry:      'Try Again 🥚'
    }
  };

  function t(k) { return TEXT[state.lang][k] || k; }

  function tf(k) {
    var s = t(k), a = Array.prototype.slice.call(arguments, 1);
    return s.replace(/\{(\d+)\}/g, function (_, i) { return a[i] != null ? a[i] : ''; });
  }

  // ── Utilities ──────────────────────────────────────────────────────────────
  function showScene(id) {
    ['sceneCatch','sceneMath','sceneCelebrate','sceneFail'].forEach(function (s) {
      document.getElementById(s).hidden = (s !== id);
    });
  }

  function updateHUD() {
    els.scoreCount.textContent  = state.score;
    els.bestScore.textContent   = state.best > 0 ? state.best : '—';
    els.scoreLabel.textContent  = t('score');
    els.bestLabel.textContent   = t('best');
  }

  function speakEquation(q) {
    var opZh = q.op === '+' ? '加' : '减';
    var opEn = q.op === '+' ? 'plus' : 'minus';
    ClioAudio.speak(
      q.a + opZh + q.b + '等于多少？',
      'What is ' + q.a + ' ' + opEn + ' ' + q.b + '?'
    );
  }

  // ── Mouse / touch control ──────────────────────────────────────────────────
  function updateBoyX(clientX) {
    var rect = els.catchArea.getBoundingClientRect();
    var frac = (clientX - rect.left) / rect.width;
    state.boy.xFrac = Math.max(0.05, Math.min(0.95, frac));
  }

  document.addEventListener('mousemove', function (e) {
    if (state.phase === 'catch') updateBoyX(e.clientX);
  });

  // Touchmove on document so dragging outside catchArea still works
  document.addEventListener('touchmove', function (e) {
    if (state.phase !== 'catch' || !e.touches.length) return;
    updateBoyX(e.touches[0].clientX);
  }, { passive: true });

  // ══════════════════════════════════════════════════════════════════════════
  // Phase: CATCH
  // ══════════════════════════════════════════════════════════════════════════
  var SPEED_BASE = 0.18;   // px per ms
  var SPEED_INC  = 0.010;  // extra px/ms per score point (gentle ramp)

  function spawnEgg() {
    var areaW = els.catchArea.offsetWidth;
    state.egg.px    = areaW * (0.12 + Math.random() * 0.76);
    state.egg.py    = -50;
    state.egg.speed = SPEED_BASE + state.score * SPEED_INC;
    els.eggEl.textContent = '🥚';
    els.eggEl.classList.remove('cracked');
  }

  function startCatch() {
    state.phase    = 'catch';
    state.answered = false;
    els.catchHint.textContent = t('catchHint');
    showScene('sceneCatch');
    spawnEgg();
    ClioAudio.startBgm();
    state.lastTs = 0;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = requestAnimationFrame(loop);
  }

  function loop(ts) {
    if (state.phase !== 'catch') return;

    var dt = state.lastTs > 0 ? Math.min(ts - state.lastTs, 80) : 16;
    state.lastTs = ts;

    // Advance egg
    state.egg.py += state.egg.speed * dt;

    // Apply positions (egg centered on px,py; boy centered on xFrac * width)
    els.eggEl.style.left = state.egg.px + 'px';
    els.eggEl.style.top  = state.egg.py + 'px';
    els.boyEl.style.left = (state.boy.xFrac * els.catchArea.offsetWidth) + 'px';

    // Collision via bounding rects
    var eR = els.eggEl.getBoundingClientRect();
    var bR = els.basketEl.getBoundingClientRect();

    var caught = !(
      eR.right  < bR.left  ||
      eR.left   > bR.right ||
      eR.bottom < bR.top   ||
      eR.top    > bR.bottom
    );

    if (caught) {
      state.phase = 'cracking';
      onEggCaught();
      return;
    }

    // Missed – respawn egg at top with a hint
    if (state.egg.py > els.catchArea.offsetHeight + 60) {
      ClioAudio.sfx('bump');
      els.catchHint.textContent = t('catchMiss');
      spawnEgg();
    }

    state.raf = requestAnimationFrame(loop);
  }

  function onEggCaught() {
    cancelAnimationFrame(state.raf);
    state.raf = null;
    ClioAudio.stopBgm();
    ClioAudio.sfx('hop');
    ClioAudio.speak('接住了！', 'Caught it!');

    els.boyEl.classList.add('caught');
    els.eggEl.classList.add('cracked');
    els.eggEl.textContent = '💥';

    timer('crack', 500, function () { els.boyEl.classList.remove('caught'); });
    timer('to-math', 750, startMath);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Phase: MATH
  // ══════════════════════════════════════════════════════════════════════════
  function startMath() {
    state.phase    = 'math';
    state.question = EGG_MATH_DATA.makeQuestion();
    state.answered = false;

    var q = state.question;
    els.qEquation.textContent = q.a + ' ' + q.op + ' ' + q.b + ' = ?';
    els.mathMsg.textContent   = '';

    els.optsGrid.innerHTML = '';
    q.options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className   = 'opt-btn';
      btn.textContent = String(opt);
      btn.type        = 'button';
      btn.addEventListener('click', function () { onAnswer(opt, btn); });
      els.optsGrid.appendChild(btn);
    });

    showScene('sceneMath');
    timer('speak-q', 400, function () { speakEquation(state.question); });
  }

  function onAnswer(opt, btn) {
    if (state.answered) return;
    state.answered = true;

    var q       = state.question;
    var correct = (opt === q.answer);

    btn.classList.add(correct ? 'opt-correct' : 'opt-wrong');

    if (!correct) {
      els.optsGrid.querySelectorAll('.opt-btn').forEach(function (b) {
        if (Number(b.textContent) === q.answer) b.classList.add('opt-correct');
      });
      els.mathMsg.textContent = tf('msgWrong', q.answer);
      ClioAudio.sfx('wrong');
      ClioAudio.speak('答错了！正确答案是' + q.answer + '。', 'Wrong! The answer is ' + q.answer + '.');
    } else {
      els.mathMsg.textContent = t('msgOk');
      ClioAudio.sfx('correct');
      ClioAudio.speak('答对了！', 'Correct!');
    }

    timer('after-answer', 950, function () {
      if (correct) {
        state.score++;
        if (state.score > state.best) {
          state.best = state.score;
          localStorage.setItem('ec-best', String(state.best));
        }
        updateHUD();
        celebrate();
      } else {
        fail();
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Phase: CELEBRATE
  // ══════════════════════════════════════════════════════════════════════════
  var CELE_EMOJIS = ['🎉','⭐','🌟','✨','🎊','🏆','🎈'];

  function celebrate() {
    state.phase = 'celebrate';
    ClioAudio.sfx('win');
    ClioAudio.speak('太棒了！继续接下一个蛋！', 'Amazing! Catch the next egg!');

    var emoji = CELE_EMOJIS[Math.floor(Math.random() * CELE_EMOJIS.length)];
    els.celeEmoji.textContent = emoji;
    els.celeTitle.textContent = t('celeTitle');
    els.celeSub.textContent   = t('celeSub');

    els.celeEmoji.style.animation = 'none';
    void els.celeEmoji.offsetWidth;
    els.celeEmoji.style.animation = '';

    showScene('sceneCelebrate');
    timer('next-catch', 2300, startCatch);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Phase: FAIL
  // ══════════════════════════════════════════════════════════════════════════
  function fail() {
    state.phase = 'fail';
    ClioAudio.sfx('fail');
    ClioAudio.speak('答错了！游戏结束，再来一次！', 'Wrong answer! Game over — try again!');

    els.failTitle.textContent = t('failTitle');
    els.failSub.textContent   = t('failSub');
    els.failScore.textContent = tf('failScore', state.score);

    els.failEmoji.style.animation = 'none';
    void els.failEmoji.offsetWidth;
    els.failEmoji.style.animation = '';

    showScene('sceneFail');
  }

  // ── Language ───────────────────────────────────────────────────────────────
  function applyLang(lang) {
    state.lang = (lang === 'en') ? 'en' : 'zh';
    els.titleText.textContent    = t('title');
    els.subtitleText.textContent = t('subtitle');
    els.langBtn.textContent      = t('lang');
    els.resetBtn.textContent     = t('reset');
    els.retryBtn.textContent     = t('retry');
    ClioAudio.setLang(state.lang);
    updateHUD();
    localStorage.setItem('mindsevo-lang', state.lang);
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  function init() {
    els.langBtn.addEventListener('click', function () {
      applyLang(state.lang === 'zh' ? 'en' : 'zh');
    });

    els.resetBtn.addEventListener('click', function () {
      if (bridge) bridge.resetSession();
      state.score = 0;
      updateHUD();
      startCatch();
    });

    els.retryBtn.addEventListener('click', function () {
      if (bridge) bridge.resetSession();
      state.score = 0;
      updateHUD();
      startCatch();
    });

    applyLang(state.lang);
    ClioAudio.init(state.lang);
    ClioAudio.bindMusicBtn(els.musicBtn);
    ClioAudio.bindSfxBtn(els.sfxBtn);
    ClioAudio.bindVoiceBtn(els.voiceBtn);
    startCatch();
  }

  init();

}());
