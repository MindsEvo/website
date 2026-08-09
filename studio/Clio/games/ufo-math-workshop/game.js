(function () {
  "use strict";

  var DATA   = window.CLIO_UFO_MATH_DATA;
  var bridge = window.ClioRuntimeBridge
    ? window.ClioRuntimeBridge.createController(DATA.id)
    : null;

  // ── state ──────────────────────────────────────────────────────────────────

  var state = {
    lang:       (window.shell && window.shell.lang) || "zh",
    phase:      "idle",   // idle | revealing | math | moon | fail
    char:       "bunny",
    questions:  [],
    qIdx:       0,
    correct:    0,
    answered:   false,
    results:    [],
    attempts:   0,
    bestScore:  -1
  };

  // ── element refs ───────────────────────────────────────────────────────────

  var els = {
    titleText:    document.getElementById("titleText"),
    subtitleText: document.getElementById("subtitleText"),
    langBtn:      document.getElementById("langBtn"),
    musicBtn:     document.getElementById("musicBtn"),
    sfxBtn:       document.getElementById("sfxBtn"),
    voiceBtn:     document.getElementById("voiceBtn"),
    resetBtn:     document.getElementById("resetBtn"),
    attemptLabel: document.getElementById("attemptLabel"),
    attemptCount: document.getElementById("attemptCount"),
    bestLabel:    document.getElementById("bestLabel"),
    bestScore:    document.getElementById("bestScore"),

    sceneSky:  document.getElementById("sceneSky"),
    sceneMath: document.getElementById("sceneMath"),
    sceneMoon: document.getElementById("sceneMoon"),
    sceneFail: document.getElementById("sceneFail"),

    starsLayer:   document.getElementById("starsLayer"),
    ufoArea:      document.getElementById("ufoArea"),
    ufoDisc:      document.getElementById("ufoDisc"),
    charBubble:   document.getElementById("charBubble"),
    skyHint:      document.getElementById("skyHint"),

    mathCharBadge: document.getElementById("mathCharBadge"),
    progStrip:     document.getElementById("progStrip"),
    qCounter:      document.getElementById("qCounter"),
    qEquation:     document.getElementById("qEquation"),
    optsGrid:      document.getElementById("optsGrid"),
    mathMsg:       document.getElementById("mathMsg"),

    moonStars:    document.getElementById("moonStars"),
    moonChar:     document.getElementById("moonChar"),
    moonItems:    document.getElementById("moonItems"),
    moonTitle:    document.getElementById("moonTitle"),
    moonSub:      document.getElementById("moonSub"),
    playAgainBtn: document.getElementById("playAgainBtn"),

    failChar:  document.getElementById("failChar"),
    failScore: document.getElementById("failScore"),
    failSub:   document.getElementById("failSub"),
    retryBtn:  document.getElementById("retryBtn")
  };

  // ── i18n ───────────────────────────────────────────────────────────────────

  var TEXT = {
    zh: {
      spinHint:    "✨ 点击飞盘，开启登月之旅！",
      revealHint:  "是 {0}！准备数学测试！",
      qCounter:    "{0} / 5",
      msgOk:       "✓ 正确！",
      msgWrong:    "✗ 正确答案是 {0}",
      moonTitle:   "🎉 太棒了！{0} 成功登月！",
      moonSub:     "答对 {0}/5 题，真厉害！",
      failScore:   "答对 {0} / 5 题",
      failSub:     "需要答对 {0} 题才能登月，再试试！",
      playAgain:   "再玩一次 🚀",
      retry:       "重新来过 🛸",
      attempts:    "次数",
      bestLabel:   "最高分",
      reset:       "重置",
      lang:        "中文 / EN"
    },
    en: {
      spinHint:    "✨ Tap the UFO to start your moon journey!",
      revealHint:  "It's {0}! Time for the math test!",
      qCounter:    "{0} / 5",
      msgOk:       "✓ Correct!",
      msgWrong:    "✗ Answer was {0}",
      moonTitle:   "🎉 Amazing! {0} landed on the moon!",
      moonSub:     "You got {0}/5 correct — great work!",
      failScore:   "Got {0} / 5 correct",
      failSub:     "Need {0} correct to land — try again!",
      playAgain:   "Play Again 🚀",
      retry:       "Try Again 🛸",
      attempts:    "Attempts",
      bestLabel:   "Best",
      reset:       "Reset",
      lang:        "EN / 中文"
    }
  };

  function t(k) { return TEXT[state.lang][k] || k; }

  function tf(k) {
    var s = t(k), a = Array.prototype.slice.call(arguments, 1);
    return s.replace(/\{(\d+)\}/g, function (_, i) { return a[i] != null ? a[i] : ""; });
  }

  function charLabel(charKey) {
    return DATA.CHARS[charKey].label[state.lang];
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  function showScene(id) {
    ["sceneSky","sceneMath","sceneMoon","sceneFail"].forEach(function (s) {
      document.getElementById(s).hidden = (s !== id);
    });
  }

  function makeStars(container, n) {
    container.innerHTML = "";
    for (var i = 0; i < n; i++) {
      var s = document.createElement("div");
      s.className = "star";
      s.style.cssText =
        "left:" + (Math.random() * 100) + "%;" +
        "top:"  + (Math.random() * 100) + "%;" +
        "width:" + (Math.random() * 2.5 + 0.8) + "px;" +
        "height:" + (Math.random() * 2.5 + 0.8) + "px;" +
        "animation-delay:" + (Math.random() * 3) + "s;" +
        "animation-duration:" + (Math.random() * 2 + 1.5) + "s;";
      container.appendChild(s);
    }
  }

  function timer(key, ms, fn) {
    if (bridge) { bridge.setTimer(key, ms, fn); }
    else { setTimeout(fn, ms); }
  }

  // ── Phase: Spin ────────────────────────────────────────────────────────────

  function startSpin() {
    state.phase    = "idle";
    state.char     = Math.random() < 0.5 ? "bunny" : "cat";
    state.qIdx     = 0;
    state.correct  = 0;
    state.results  = [];
    state.answered = false;
    state.questions = DATA.makeQuestions(DATA.TOTAL_QUESTIONS);

    if (bridge) bridge.resetSession();

    els.ufoDisc.classList.remove("stopped");
    els.charBubble.hidden = true;
    els.charBubble.textContent = "";
    els.skyHint.textContent = t("spinHint");

    makeStars(els.starsLayer, 60);

    showScene("sceneSky");
  }

  // ── Phase: Reveal character ────────────────────────────────────────────────

  function revealChar() {
    if (state.phase !== "idle") return;
    state.phase = "revealing";

    els.ufoDisc.classList.add("stopped");

    var charData = DATA.CHARS[state.char];
    els.charBubble.textContent = charData.emoji;
    els.charBubble.hidden = false;
    els.skyHint.textContent = tf("revealHint", charLabel(state.char));

    var isB = state.char === "bunny";
    ClioAudio.speak(
      "是" + (isB ? "小兔" : "小猫") + "！准备好数学测试了吗？",
      "It's " + (isB ? "Bunny" : "Cat") + "! Get ready for the math test!"
    );
    timer("reveal", 2200, startMath);
  }

  // ── Phase: Math ────────────────────────────────────────────────────────────

  function startMath() {
    state.phase    = "math";
    state.qIdx     = 0;
    state.correct  = 0;
    state.results  = [];
    state.answered = false;
    state.attempts++;
    updateHUD();

    els.mathCharBadge.textContent = DATA.CHARS[state.char].emoji;

    showScene("sceneMath");
    ClioAudio.startBgm();
    renderQuestion();
  }

  function renderQuestion() {
    state.answered = false;
    var q   = state.questions[state.qIdx];
    var num = state.qIdx + 1;

    // header
    els.qCounter.textContent = tf("qCounter", num);
    renderDots();

    // equation
    els.qEquation.textContent = q.a + " " + q.op + " " + q.b + " = ?";
    els.qEquation.style.animation = "none";
    void els.qEquation.offsetWidth;
    els.qEquation.style.animation = "";

    // read the question aloud after a short pause
    var opZh = q.op === "+" ? "加" : "减";
    var opEn = q.op === "+" ? "plus" : "minus";
    timer("speak-q", 400, function () {
      ClioAudio.speak(
        "第" + (state.qIdx + 1) + "题，" + q.a + opZh + q.b + "等于几？",
        "Question " + (state.qIdx + 1) + ". What is " + q.a + " " + opEn + " " + q.b + "?"
      );
    });

    // reset feedback
    els.mathMsg.textContent = "";
    els.mathMsg.className = "math-msg";

    // options
    els.optsGrid.innerHTML = "";
    q.opts.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "opt-btn";
      btn.textContent = String(opt);
      if (bridge) { bridge.bindTap(btn, function () { pickAnswer(opt, q.ans, btn); }); }
      else { btn.addEventListener("click", function () { pickAnswer(opt, q.ans, btn); }); }
      els.optsGrid.appendChild(btn);
    });
  }

  function renderDots() {
    els.progStrip.innerHTML = "";
    for (var i = 0; i < DATA.TOTAL_QUESTIONS; i++) {
      var d = document.createElement("span");
      var cls = "prog-dot";
      if (i < state.qIdx) cls += state.results[i] ? " ok" : " fail";
      if (i === state.qIdx) cls += " current";
      d.className = cls;
      els.progStrip.appendChild(d);
    }
  }

  function pickAnswer(selected, correct, btn) {
    if (state.answered) return;
    state.answered = true;

    var ok = selected === correct;
    if (ok) {
      state.correct++;
      btn.classList.add("correct");
      els.mathMsg.textContent = t("msgOk");
      els.mathMsg.className = "math-msg ok";
      ClioAudio.sfx("correct");
      ClioAudio.speak("答对了！", "Correct!");
    } else {
      btn.classList.add("wrong");
      // highlight the right answer
      var btns = els.optsGrid.querySelectorAll(".opt-btn");
      for (var i = 0; i < btns.length; i++) {
        if (parseInt(btns[i].textContent, 10) === correct) btns[i].classList.add("correct");
        else if (btns[i] !== btn) btns[i].classList.add("locked");
      }
      els.mathMsg.textContent = tf("msgWrong", correct);
      els.mathMsg.className = "math-msg bad";
      ClioAudio.sfx("wrong");
      ClioAudio.speak("不对！正确答案是" + correct + "。", "Wrong! The answer is " + correct + ".");
    }

    state.results.push(ok);
    renderDots();

    timer("next-q", 950, function () {
      state.qIdx++;
      if (state.qIdx >= DATA.TOTAL_QUESTIONS) { finishMath(); }
      else { renderQuestion(); }
    });
  }

  function finishMath() {
    if (state.correct > state.bestScore) {
      state.bestScore = state.correct;
    }
    updateHUD();

    if (state.correct >= DATA.PASS_THRESHOLD) { showMoon(); }
    else { showFail(); }
  }

  // ── Phase: Moon ────────────────────────────────────────────────────────────

  function showMoon() {
    state.phase = "moon";
    ClioAudio.stopBgm();
    ClioAudio.sfx("win");
    var charData = DATA.CHARS[state.char];

    els.moonChar.textContent = charData.emoji;
    els.moonTitle.textContent = tf("moonTitle", charLabel(state.char));
    els.moonSub.textContent   = tf("moonSub", state.correct);
    els.playAgainBtn.textContent = t("playAgain");

    // Scatter items on moon
    els.moonItems.innerHTML = "";
    charData.moonItems.forEach(function (item, i) {
      var span = document.createElement("span");
      span.className = "moon-item";
      span.textContent = item;
      span.style.animationDelay = (i * 0.1) + "s";
      els.moonItems.appendChild(span);
    });

    makeStars(els.moonStars, 50);
    showScene("sceneMoon");
    ClioAudio.speak(
      "太棒了！" + charLabel(state.char) + "成功登月了！答对了" + state.correct + "道题！",
      "Amazing! " + charLabel(state.char) + " landed on the moon! You got " + state.correct + " correct!"
    );
  }

  // ── Phase: Fail ────────────────────────────────────────────────────────────

  function showFail() {
    state.phase = "fail";
    ClioAudio.stopBgm();
    ClioAudio.sfx("fail");
    var charData = DATA.CHARS[state.char];

    els.failChar.textContent  = charData.emoji;
    els.failScore.textContent = tf("failScore", state.correct);
    els.failSub.textContent   = tf("failSub", DATA.PASS_THRESHOLD);
    els.retryBtn.textContent  = t("retry");

    showScene("sceneFail");
    ClioAudio.speak(
      "答对了" + state.correct + "题，需要" + DATA.PASS_THRESHOLD + "题才能登月，加油！再试一次！",
      "You got " + state.correct + " out of 5. Need " + DATA.PASS_THRESHOLD + " to land. Keep going!"
    );
  }

  // ── HUD ────────────────────────────────────────────────────────────────────

  function updateHUD() {
    els.attemptLabel.textContent = t("attempts");
    els.bestLabel.textContent    = t("bestLabel");
    els.attemptCount.textContent = String(state.attempts);
    els.bestScore.textContent    = state.bestScore < 0 ? "—" : state.bestScore + "/5";
  }

  // ── Locale ─────────────────────────────────────────────────────────────────

  function applyLocale() {
    var lang = state.lang;
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    document.title = DATA.title[lang];
    els.titleText.textContent    = DATA.title[lang];
    els.subtitleText.textContent = DATA.subtitle[lang];
    els.langBtn.textContent  = t("lang");
    els.resetBtn.textContent = t("reset");
    updateHUD();
    if (state.phase === "idle") els.skyHint.textContent = t("spinHint");
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    // UFO tap
    var tapUfo = function () { revealChar(); };
    if (bridge) { bridge.bindTap(els.ufoArea, tapUfo); }
    else { els.ufoArea.addEventListener("click", tapUfo); }

    // Keyboard for accessibility
    els.ufoArea.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); revealChar(); }
    });

    // Win / fail buttons — use bridge.bindTap for proper mobile touch (touchend + click dedup)
    if (bridge) {
      bridge.bindTap(els.playAgainBtn, startSpin);
      bridge.bindTap(els.retryBtn, startSpin);
      bridge.bindTap(els.resetBtn, function () {
        state.attempts  = 0;
        state.bestScore = -1;
        bridge.resetSession();
        startSpin();
      });
      bridge.bindTap(els.langBtn, function () {
        state.lang = state.lang === "zh" ? "en" : "zh";
        if (window.shell) window.shell.setLang(state.lang);
        ClioAudio.setLang(state.lang);
        applyLocale();
      });
    } else {
      els.playAgainBtn.addEventListener("click", startSpin);
      els.retryBtn.addEventListener("click", startSpin);
      els.resetBtn.addEventListener("click", function () {
        state.attempts  = 0;
        state.bestScore = -1;
        startSpin();
      });
      els.langBtn.addEventListener("click", function () {
        state.lang = state.lang === "zh" ? "en" : "zh";
        if (window.shell) window.shell.setLang(state.lang);
        ClioAudio.setLang(state.lang);
        applyLocale();
      });
    }

    applyLocale();
    ClioAudio.init(state.lang);
    ClioAudio.bindMusicBtn(els.musicBtn);
    ClioAudio.bindSfxBtn(els.sfxBtn);
    ClioAudio.bindVoiceBtn(els.voiceBtn);
    startSpin();
  }

  init();
})();
