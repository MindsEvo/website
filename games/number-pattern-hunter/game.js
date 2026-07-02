/**
 * Pattern Hunter — Game Logic  v1.0.0
 * ─────────────────────────────────────────────────────────
 * Depends on: shell.js, i18n/strings.js, strings.js, data.js
 *
 * State machine:  home → game → result → home / next-unit
 * All text via shell.t().  All storage via shell.storage.
 * All TTS via shell.speak().  All reporting via shell.report().
 * ─────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  var GAME_ID    = 'pattern-hunter';
  var PASS_SCORE = 8;   // out of 10 to unlock next unit
  var DEBUG_MODE = true; // Set to false in production - unlocks all units

  // ── State ────────────────────────────────────────────────────
  var state = {
    unitIndex:   0,
    qIndex:      0,
    score:       0,
    hintsUsed:   0,
    attempts:    0,
    startTime:   0,
    wrongOnFirst: false,
    hintShown:   false
  };

  // ── Session stats (in-memory, resets on page reload) ─────────
  var sessionStats = {};   // { unitId: { score, wrong, hints, timeMs } }

  // ── DOM refs ─────────────────────────────────────────────────
  var $homeScreen, $gameScreen, $resultScreen;

  // ── Bootstrap ────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    $homeScreen   = document.getElementById('homeScreen');
    $gameScreen   = document.getElementById('gameScreen');
    $resultScreen = document.getElementById('resultScreen');

    // Debug mode: unlock all units
    if (DEBUG_MODE) {
      PH_DATA.units.forEach(function (unit) {
        var saved = getUnitSave(unit.id);
        if (!saved.unlocked) {
          saved.unlocked = true;
          saveUnitSave(unit.id, saved);
        }
      });
    }

    renderHome();
    updateVoiceBtn();

    // Respond to shell language changes
    document.addEventListener('shell:langchange', function () {
      // Re-render the currently visible screen
      if (!$homeScreen.classList.contains('hidden'))   renderHome();
      if (!$gameScreen.classList.contains('hidden'))   renderQuestion();
      if (!$resultScreen.classList.contains('hidden')) renderResult();
    });
  });

  // ────────────────────────────────────────────────────────────
  // HOME SCREEN
  // ────────────────────────────────────────────────────────────
  function renderHome() {
    document.getElementById('appTitle').textContent    = shell.t('ph.title');
    document.getElementById('appSubtitle').textContent = shell.t('ph.subtitle');
    updateLangBtn();

    var list = document.getElementById('unitsList');
    list.innerHTML = '';

    PH_DATA.units.forEach(function (unit, i) {
      var saved   = getUnitSave(unit.id);
      var locked  = !saved.unlocked;
      var best    = saved.bestScore;

      var card = document.createElement('div');
      card.className = 'unit-card' + (locked ? ' locked' : '');
      card.setAttribute('data-unit', unit.id);

      var statusText = locked
        ? shell.t('unit.locked')
        : (best !== null ? shell.t('stats.best') + ' ' + best + '/10' : shell.t('unit.new'));

      card.innerHTML =
        '<div class="unit-icon">' + unit.icon + '</div>' +
        '<div class="unit-info">' +
          '<div class="unit-name">' + shell.t(unit.nameKey) + '</div>' +
          '<div class="unit-desc">' + shell.t(unit.descKey) + '</div>' +
        '</div>' +
        '<div class="unit-status">' + statusText + '</div>';

      if (!locked) {
        card.addEventListener('click', function () { startUnit(i); });
      }
      list.appendChild(card);
    });

    // Update summary titles (handles language switch)
    var isZh = shell.lang === 'zh';
    var tS = document.getElementById('summaryTitleSession');
    var tH = document.getElementById('summaryTitleHistory');
    if (tS) tS.textContent = isZh ? '📝 本次练习' : '📝 Current Session';
    if (tH) tH.textContent = isZh ? '📊 历史总览' : '📊 All History';

    // Re-render if sections already open (e.g. after lang switch)
    var sbS = document.getElementById('summaryBodySession');
    var sbH = document.getElementById('summaryBodyHistory');
    if (sbS && sbS.classList.contains('open')) renderSessionSummary();
    if (sbH && sbH.classList.contains('open')) renderHistorySummary();
  }

  // ────────────────────────────────────────────────────────────
  // START A UNIT
  // ────────────────────────────────────────────────────────────
  function startUnit(unitIndex) {
    state.unitIndex  = unitIndex;
    state.qIndex     = 0;
    state.score      = 0;
    state.hintsUsed  = 0;
    state.attempts   = 0;
    state.startTime  = Date.now();

    show($gameScreen);
    hide($homeScreen);
    hide($resultScreen);
    renderQuestion();
  }

  // ────────────────────────────────────────────────────────────
  // GAME SCREEN
  // ────────────────────────────────────────────────────────────
  function renderQuestion() {
    var unit = currentUnit();
    var q    = currentQuestion();
    var total = unit.questions.length;

    document.getElementById('unitTitle').textContent = shell.t(unit.nameKey);
    updateLangBtnGame();

    // Progress
    document.getElementById('currentQ').textContent = state.qIndex + 1;
    document.getElementById('totalQ').textContent   = total;
    document.getElementById('liveScore').textContent = state.score;

    // Progress dots
    var dots = document.getElementById('progressDots');
    dots.innerHTML = '';
    for (var i = 0; i < total; i++) {
      var dot = document.createElement('div');
      dot.className = 'progress-dot' +
        (i < state.qIndex  ? ' completed' : '') +
        (i === state.qIndex ? ' active'    : '');
      dots.appendChild(dot);
    }

    // Sequence display
    var seqHtml = q.seq.map(function (n) {
      return n === '?'
        ? '<span class="mystery">?</span>'
        : '<span>' + n + '</span>';
    }).join(' ');
    document.getElementById('sequenceInner').innerHTML = seqHtml;

    // Options
    var opts = document.getElementById('optionsContainer');
    opts.innerHTML = '';
    var shuffled = q.options.slice().sort(function () { return Math.random() - 0.5; });
    shuffled.forEach(function (val) {
      var btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = val;
      btn.addEventListener('click', function () { handleAnswer(val, btn, q); });
      opts.appendChild(btn);
    });

    // Clear feedback
    var fb = document.getElementById('feedback');
    fb.className = 'feedback';
    fb.innerHTML = '';

    // Reset hint box
    var hintBox = document.getElementById('hintBox');
    hintBox.classList.add('hidden');
    hintBox.textContent = '';

    // Reset per-question state
    state.wrongOnFirst = false;
    state.hintShown    = false;
    state.attempts     = 0;

    // Action row: clear initially
    renderActionButtons(false);

    // Voice
    speakQuestion(q);
  }

  function speakQuestion(q) {
    var seqText = q.seq.map(function (n) {
      return n === '?' ? shell.t('ph.voice.blank') : String(n);
    }).join('，');
    shell.speak(shell.t('ph.voice.q', seqText));
  }

  function handleAnswer(val, btn, q) {
    // Disable all options
    var allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(function (b) { b.disabled = true; });

    state.attempts++;

    var fb = document.getElementById('feedback');

    if (val === q.answer) {
      btn.classList.add('correct');
      fb.className = 'feedback correct';

      if (!state.wrongOnFirst) {
        state.score++;
        fb.textContent = shell.t('fb.correct');
      } else {
        fb.textContent = shell.t('fb.correct') + ' (' + shell.t('action.hint') + ')';
      }
      shell.speak(shell.t('fb.correct'));

      renderActionButtons(true);

    } else {
      btn.classList.add('wrong');

      if (!state.wrongOnFirst) {
        // First wrong — offer hint
        state.wrongOnFirst = true;
        fb.className = 'feedback wrong';
        fb.textContent = shell.t('fb.wrong');
        // Re-enable remaining options
        allBtns.forEach(function (b) {
          if (!b.classList.contains('wrong')) b.disabled = false;
        });
        renderActionButtons(false, true); // show hint button
        shell.speak(shell.t('fb.wrong'));
      } else {
        // Second wrong — show answer and move on
        fb.className = 'feedback wrong';
        fb.textContent = shell.t('fb.wrong2');
        // Highlight correct answer
        allBtns.forEach(function (b) {
          if (parseInt(b.textContent) === q.answer) b.classList.add('correct');
        });
        renderActionButtons(true);
      }
    }
  }

  function showHint() {
    var q = currentQuestion();
    state.hintsUsed++;
    state.hintShown = true;
    var hintText = shell.lang === 'zh' ? q.hint_zh : q.hint_en;
    var hintBox = document.getElementById('hintBox');
    hintBox.textContent = '💡 ' + hintText;
    hintBox.classList.remove('hidden');
    // Re-render action buttons to hide the hint button
    renderActionButtons(false, false);
    shell.speak(hintText);
  }

  function renderActionButtons(showNext, showHintBtn) {
    var row = document.getElementById('actionButtons');
    row.innerHTML = '';

    if (showHintBtn && !state.hintShown) {
      var hintBtn = document.createElement('button');
      hintBtn.className = 'btn btn-secondary';
      hintBtn.textContent = shell.t('action.hint');
      hintBtn.addEventListener('click', showHint);
      row.appendChild(hintBtn);
    }

    if (showNext) {
      var nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-primary';
      nextBtn.textContent = shell.t('action.next');
      nextBtn.addEventListener('click', nextQuestion);
      row.appendChild(nextBtn);
    }
  }

  function nextQuestion() {
    state.qIndex++;
    if (state.qIndex >= currentUnit().questions.length) {
      finishUnit();
    } else {
      renderQuestion();
    }
  }

  // ────────────────────────────────────────────────────────────
  // RESULT SCREEN
  // ────────────────────────────────────────────────────────────
  function finishUnit() {
    var unit     = currentUnit();
    var elapsed  = Date.now() - state.startTime;
    var total    = unit.questions.length;
    var passed   = state.score >= PASS_SCORE;
    var isLast   = (state.unitIndex === PH_DATA.units.length - 1);

    // Persist progress
    var saved = getUnitSave(unit.id);
    saved.completed = passed;
    if (saved.bestScore === null || state.score > saved.bestScore) {
      saved.bestScore = state.score;
    }
    saveUnitSave(unit.id, saved);

    // Unlock next unit if passed
    if (passed && !isLast) {
      var nextUnit = PH_DATA.units[state.unitIndex + 1];
      var nextSave = getUnitSave(nextUnit.id);
      nextSave.unlocked = true;
      saveUnitSave(nextUnit.id, nextSave);
    }

    // Record this unit's result into session stats
    sessionStats[unit.id] = {
      score:  state.score,
      wrong:  total - state.score,
      hints:  state.hintsUsed,
      timeMs: elapsed
    };

    // Report to shell
    shell.report({
      gameId:    GAME_ID,
      geneIds:   PH_DATA.geneIds,
      levelId:   unit.cogLevel + '-' + unit.id,
      success:   passed,
      solutions: 1,
      score:     state.score,
      total:     total,
      hintsUsed: state.hintsUsed,
      attempts:  state.score + (total - state.score) * 2,
      timeMs:    elapsed
    });

    show($resultScreen);
    hide($gameScreen);
    renderResult(passed, isLast, elapsed, total);
  }

  function renderResult(passed, isLast, elapsed, total) {
    if (passed === undefined) {
      // Re-render after lang change — read from DOM data attributes
      passed  = $resultScreen.dataset.passed  === 'true';
      isLast  = $resultScreen.dataset.isLast  === 'true';
      elapsed = parseInt($resultScreen.dataset.elapsed, 10);
      total   = parseInt($resultScreen.dataset.total,   10);
    } else {
      $resultScreen.dataset.passed  = passed;
      $resultScreen.dataset.isLast  = isLast;
      $resultScreen.dataset.elapsed = elapsed;
      $resultScreen.dataset.total   = total;
    }

    var mins = Math.floor(elapsed / 60000);
    var secs = Math.floor((elapsed % 60000) / 1000);

    document.getElementById('resultEmoji').textContent = passed ? '🏆' : '💪';
    document.getElementById('resultTitle').textContent = passed
      ? (isLast ? shell.t('fb.perfect') : shell.t('fb.good'))
      : shell.t('fb.keepgoing');

    var scoreEl = document.getElementById('resultScore');
    scoreEl.textContent = state.score + '/' + total;

    document.getElementById('resultDetails').innerHTML =
      shell.t('result.score.detail', state.score, total) + '<br>' +
      shell.t('result.hints.detail', state.hintsUsed) + '<br>' +
      shell.t('stats.time') + '：' + shell.t('stats.time.fmt', mins, secs);

    var msg = isLast && passed ? shell.t('result.msg.all')
            : passed           ? shell.t('result.msg.good')
            : state.score >= 5 ? shell.t('result.msg.weak')
            :                    shell.t('result.msg.weak');
    document.getElementById('resultMessage').textContent = msg;

    // Buttons
    var btns = document.getElementById('resultButtons');
    btns.innerHTML = '';
    addBtn(btns, 'btn-outline', shell.t('action.retry'), function () { startUnit(state.unitIndex); });
    if (passed && !isLast) {
      addBtn(btns, 'btn-primary', shell.t('action.continue'), function () { startUnit(state.unitIndex + 1); });
    }
    addBtn(btns, 'btn-outline', shell.t('nav.home'), function () {
      show($homeScreen);
      hide($resultScreen);
      renderHome();
    });

    shell.speak(msg);
  }

  // ────────────────────────────────────────────────────────────
  // PRACTICE SUMMARY
  // ────────────────────────────────────────────────────────────

  // 本次练习：内存数据，显示每个关卡本次结果
  function renderSessionSummary() {
    var body = document.getElementById('summaryBodySession');
    if (!body) return;
    var isZh = shell.lang === 'zh';
    var hasAny = Object.keys(sessionStats).length > 0;

    if (!hasAny) {
      body.innerHTML = '<div class="summary-empty">' +
        (isZh ? '本次尚未完成任何练习，完成一局就能看到统计' : 'No practice completed this session') +
        '</div>';
      return;
    }

    var th = isZh
      ? ['<th>关卡</th>','<th>答对</th>','<th>答错</th>','<th>提示</th>','<th>用时</th>']
      : ['<th>Unit</th>','<th>Correct</th>','<th>Wrong</th>','<th>Hints</th>','<th>Time</th>'];
    var html = '<table class="summary-table"><thead><tr>' + th.join('') + '</tr></thead><tbody>';

    PH_DATA.units.forEach(function (unit) {
      var d = sessionStats[unit.id];
      if (d) {
        html += '<tr>' +
          '<td class="s-name">' + unit.icon + ' ' + shell.t(unit.nameKey) + '</td>' +
          '<td class="s-correct">' + d.score + '</td>' +
          '<td class="s-wrong">'   + d.wrong + '</td>' +
          '<td>'                  + d.hints + '</td>' +
          '<td>'                  + fmtTime(d.timeMs) + '</td>' +
          '</tr>';
      } else {
        html += '<tr class="s-idle">' +
          '<td class="s-name">' + unit.icon + ' ' + shell.t(unit.nameKey) + '</td>' +
          '<td colspan="4" class="s-dash">—</td>' +
          '</tr>';
      }
    });
    html += '</tbody></table>';
    body.innerHTML = html;
  }

  // 历史总览：localStorage 全部记录
  function renderHistorySummary() {
    var body = document.getElementById('summaryBodyHistory');
    if (!body) return;
    var isZh = shell.lang === 'zh';
    var data = calcHistory();

    if (data.sessions === 0) {
      body.innerHTML = '<div class="summary-empty">' +
        (isZh ? '还没有历史记录，完成练习后自动保存' : 'No history yet. Records save automatically after each session.') +
        '</div>';
      return;
    }

    var html = '<div class="summary-stats">' +
      statBox(data.sessions,          isZh ? '完成局数' : 'Sessions') +
      statBox(data.correct,           isZh ? '总答对'   : 'Correct') +
      statBox(data.wrong,             isZh ? '总答错'   : 'Wrong') +
      statBox(data.hints,             isZh ? '用提示'   : 'Hints') +
      statBox(fmtTime(data.totalMs),  isZh ? '总用时'   : 'Total Time') +
    '</div>';


    html += '<div class="summary-clear">' +
      '<button class="btn-clear" onclick="phClearHistory()">' +
      (isZh ? '🗑 清除历史记录' : '🗑 Clear History') +
      '</button></div>';

    body.innerHTML = html;
  }

  function calcHistory() {
    var prefix = 'me:' + GAME_ID + ':history:';
    var sessions = 0, correct = 0, wrong = 0, hints = 0, totalMs = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf(prefix) === 0) {
        try {
          var r = JSON.parse(localStorage.getItem(key));
          if (r && r.total) {          // only count complete records (with score field)
            sessions++;
            correct  += (r.score     || 0);
            wrong    += (r.total - (r.score || 0));
            hints    += (r.hintsUsed || 0);
            totalMs  += (r.timeMs    || 0);
          }
        } catch (e) {}
      }
    }
    return { sessions: sessions, correct: correct, wrong: wrong, hints: hints, totalMs: totalMs };
  }

  function fmtTime(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    var h = Math.floor(m / 60);
    var zh = shell.lang === 'zh';
    if (h > 0) return h + (zh ? '小时' : 'h ') + (m % 60) + (zh ? '分' : 'm');
    if (m > 0) return m + (zh ? '分' : 'm ') + (s % 60) + (zh ? '秒' : 's');
    return s + (zh ? '秒' : 's');
  }

  function statBox(val, label) {
    return '<div class="summary-stat">' +
      '<div class="summary-stat-value">' + val + '</div>' +
      '<div class="summary-stat-label">' + label + '</div>' +
    '</div>';
  }

  window.phToggleSummary = function (which) {
    var bodyId  = which === 'session' ? 'summaryBodySession' : 'summaryBodyHistory';
    var arrowId = which === 'session' ? 'summaryArrowSession' : 'summaryArrowHistory';
    var body  = document.getElementById(bodyId);
    var arrow = document.getElementById(arrowId);
    if (!body) return;
    var open = body.classList.toggle('open');
    if (arrow) arrow.textContent = open ? '▲' : '▼';
    if (open) {
      if (which === 'session') renderSessionSummary();
      else                     renderHistorySummary();
    }
  };

  window.phClearHistory = function () {
    var isZh = shell.lang === 'zh';
    var msg = isZh ? '确认清除所有历史记录？此操作不可恢复。' : 'Clear all history? This cannot be undone.';
    if (!confirm(msg)) return;
    var prefix = 'me:' + GAME_ID + ':history:';
    var toRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf(prefix) === 0) toRemove.push(key);
    }
    toRemove.forEach(function (k) { localStorage.removeItem(k); });
    // Reset unit saves
    PH_DATA.units.forEach(function (unit) {
      shell.storage.remove(GAME_ID + ':unit:' + unit.id);
    });
    renderHome();
    // Re-open history panel to show empty state
    var sbH = document.getElementById('summaryBodyHistory');
    if (sbH && sbH.classList.contains('open')) renderHistorySummary();
  };

  // ────────────────────────────────────────────────────────────
  // STORAGE HELPERS
  // ────────────────────────────────────────────────────────────
  function getUnitSave(unitId) {
    return shell.storage.get(GAME_ID + ':unit:' + unitId, {
      unlocked:  DEBUG_MODE || unitId === 1,  // Debug: unlock all
      completed: false,
      bestScore: null
    });
  }

  function saveUnitSave(unitId, data) {
    shell.storage.set(GAME_ID + ':unit:' + unitId, data);
  }

  // ────────────────────────────────────────────────────────────
  // VOICE / LANG BUTTONS
  // ────────────────────────────────────────────────────────────
  function updateVoiceBtn() {
    var enabled = shell.storage.get('user:settings:voice', true);
    document.querySelectorAll('.voiceToggle').forEach(function (b) {
      b.textContent = enabled ? '🔊' : '🔇';
      b.classList.toggle('active', enabled);
    });
  }

  function updateLangBtn() {
    var btn = document.getElementById('langToggle');
    if (btn) btn.textContent = shell.lang === 'zh' ? 'EN' : '中文';
  }

  function updateLangBtnGame() {
    var btn = document.getElementById('langToggleGame');
    if (btn) btn.textContent = shell.lang === 'zh' ? 'EN' : '中文';
  }

  // ────────────────────────────────────────────────────────────
  // GLOBAL BUTTON HANDLERS (called from HTML onclick)
  // ────────────────────────────────────────────────────────────
  window.phToggleVoice = function () {
    var cur = shell.storage.get('user:settings:voice', true);
    shell.storage.set('user:settings:voice', !cur);
    if (cur) speechSynthesis.cancel();
    updateVoiceBtn();
  };

  window.phToggleLang = function () {
    shell.setLang(shell.lang === 'zh' ? 'en' : 'zh');
    updateLangBtn();
    updateLangBtnGame();
  };

  window.phBack = function () {
    hide($gameScreen);
    show($homeScreen);
    renderHome();
  };

  window.phReplayQuestion = function () {
    speakQuestion(currentQuestion());
  };

  // ────────────────────────────────────────────────────────────
  // UTILITIES
  // ────────────────────────────────────────────────────────────
  function currentUnit()     { return PH_DATA.units[state.unitIndex]; }
  function currentQuestion() { return currentUnit().questions[state.qIndex]; }

  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }

  function addBtn(container, cls, label, fn) {
    var b = document.createElement('button');
    b.className = 'btn ' + cls;
    b.textContent = label;
    b.addEventListener('click', fn);
    container.appendChild(b);
  }

})();
