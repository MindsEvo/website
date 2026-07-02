/**
 * Visual Pattern Hunter — Game Logic  v1.0.0
 * ─────────────────────────────────────────────────────────
 * Depends on: shell.js, i18n/strings.js, strings.js, data.js
 * Features: SVG shape rendering, pattern recognition
 * ─────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  var GAME_ID    = 'visual-pattern-hunter';
  var PASS_SCORE = 4;   // out of 5 to unlock next unit
  var DEBUG_MODE = true; // Unlocks all units

  // ── SVG Shape Generator ──────────────────────────────────────
  function generateShape(type, size, color, rotation) {
    size = size || 40;
    color = color || '#667eea';
    rotation = rotation || 0;

    var s = size;
    var h = s / 2;
    var svg = '<svg width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + ' ' + s + '" style="display:inline-block;vertical-align:middle;transform:rotate(' + rotation + 'deg)">';

    switch (type) {
      case 'circle':
        svg += '<circle cx="' + h + '" cy="' + h + '" r="' + (h - 2) + '" fill="' + color + '" stroke="#334155" stroke-width="2"/>';
        break;
      case 'square':
        svg += '<rect x="2" y="2" width="' + (s - 4) + '" height="' + (s - 4) + '" fill="' + color + '" stroke="#334155" stroke-width="2"/>';
        break;
      case 'triangle':
        var pts = h + ',4 ' + (s - 4) + ',' + (s - 4) + ' 4,' + (s - 4);
        svg += '<polygon points="' + pts + '" fill="' + color + '" stroke="#334155" stroke-width="2"/>';
        break;
      case 'star':
        svg += '<polygon points="20,2 26,14 39,16 29,26 32,39 20,32 8,39 11,26 1,16 14,14" fill="' + color + '" stroke="#334155" stroke-width="2"/>';
        break;
      case 'arrow':
        svg += '<polygon points="20,4 28,16 24,16 24,36 16,36 16,16 12,16" fill="' + color + '" stroke="#334155" stroke-width="2"/>';
        break;
      case 'diamond':
        svg += '<polygon points="20,2 38,20 20,38 2,20" fill="' + color + '" stroke="#334155" stroke-width="2"/>';
        break;
      default:
        svg += '<circle cx="' + h + '" cy="' + h + '" r="' + (h - 2) + '" fill="' + color + '"/>';
    }
    
    svg += '</svg>';
    return svg;
  }

  // Generate dots for count questions
  function generateDots(count, size) {
    size = size || 50;
    var color = '#667eea';
    var cols = Math.ceil(Math.sqrt(count));
    var dotSize = 8;
    var gap = (size - dotSize * cols) / (cols + 1);
    
    var svg = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" style="display:inline-block;vertical-align:middle">';
    
    for (var i = 0; i < count; i++) {
      var row = Math.floor(i / cols);
      var col = i % cols;
      var x = gap + col * (dotSize + gap) + dotSize / 2;
      var y = gap + row * (dotSize + gap) + dotSize / 2;
      svg += '<circle cx="' + x + '" cy="' + y + '" r="' + (dotSize / 2) + '" fill="' + color + '"/>';
    }
    
    svg += '</svg>';
    return svg;
  }

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

  var sessionStats = {};

  // ── DOM refs ─────────────────────────────────────────────────
  var $homeScreen, $gameScreen, $resultScreen;

  // ── Bootstrap ────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    $homeScreen   = document.getElementById('homeScreen');
    $gameScreen   = document.getElementById('gameScreen');
    $resultScreen = document.getElementById('resultScreen');

    if (DEBUG_MODE) {
      VPH_DATA.units.forEach(function (unit) {
        var saved = getUnitSave(unit.id);
        if (!saved.unlocked) {
          saved.unlocked = true;
          saveUnitSave(unit.id, saved);
        }
      });
    }

    renderHome();
    updateVoiceBtn();

    document.addEventListener('shell:langchange', function () {
      if (!$homeScreen.classList.contains('hidden'))   renderHome();
      if (!$gameScreen.classList.contains('hidden'))   renderQuestion();
      if (!$resultScreen.classList.contains('hidden')) renderResult();
    });
  });

  // ────────────────────────────────────────────────────────────
  // HOME SCREEN
  // ────────────────────────────────────────────────────────────
  function renderHome() {
    document.getElementById('appTitle').textContent    = shell.t('vph.title');
    document.getElementById('appSubtitle').textContent = shell.t('vph.subtitle');
    updateLangBtn();

    var list = document.getElementById('unitsList');
    list.innerHTML = '';

    VPH_DATA.units.forEach(function (unit, i) {
      var saved   = getUnitSave(unit.id);
      var locked  = !saved.unlocked;
      var best    = saved.bestScore;

      var card = document.createElement('div');
      card.className = 'unit-card' + (locked ? ' locked' : '');
      card.setAttribute('data-unit', unit.id);

      var statusText = locked
        ? shell.t('unit.locked')
        : (best !== null ? shell.t('stats.best') + ' ' + best + '/5' : shell.t('unit.new'));

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

    document.getElementById('currentQ').textContent = state.qIndex + 1;
    document.getElementById('totalQ').textContent   = total;
    document.getElementById('liveScore').textContent = state.score;

    // Progress dots
    renderProgressDots();

    // Render sequence based on pattern type
    var seqHTML = '';
    for (var i = 0; i < q.sequence.length; i++) {
      var item = q.sequence[i];
      
      if (item === '?') {
        seqHTML += '<span class="mystery">?</span>';
      } else if (unit.patternType === 'shape') {
        seqHTML += generateShape(item, 50, '#667eea', 0) + ' ';
      } else if (unit.patternType === 'count') {
        seqHTML += generateDots(item, 50) + ' ';
      } else if (unit.patternType === 'rotate') {
        seqHTML += generateShape(q.rotateShape || 'arrow', 50, '#667eea', item) + ' ';
      }
    }
    
    document.getElementById('sequenceInner').innerHTML = seqHTML;

    // Render options
    var optsContainer = document.getElementById('optionsContainer');
    optsContainer.innerHTML = '';
    
    q.options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className = 'option-btn';
      
      if (unit.patternType === 'shape') {
        btn.innerHTML = generateShape(opt, 50, '#667eea', 0);
      } else if (unit.patternType === 'count') {
        btn.innerHTML = generateDots(opt, 50);
      } else if (unit.patternType === 'rotate') {
        btn.innerHTML = generateShape(q.rotateShape || 'arrow', 50, '#667eea', opt);
      }
      
      btn.setAttribute('data-value', opt);
      btn.addEventListener('click', function () { checkAnswer(opt); });
      optsContainer.appendChild(btn);
    });

    // Reset feedback
    var fb = document.getElementById('feedback');
    fb.textContent = '';
    fb.className = 'feedback';
    
    hide(document.getElementById('hintBox'));
    state.wrongOnFirst = false;
    state.hintShown = false;

    document.getElementById('actionButtons').innerHTML = '';

    // Voice prompt
    var promptText = shell.t('vph.voice.q', [state.qIndex + 1]);
    shell.speak(promptText);
  }

  function renderProgressDots() {
    var container = document.getElementById('progressDots');
    container.innerHTML = '';
    var total = currentUnit().questions.length;
    
    for (var i = 0; i < total; i++) {
      var dot = document.createElement('div');
      dot.className = 'progress-dot';
      if (i < state.qIndex) dot.classList.add('completed');
      if (i === state.qIndex) dot.classList.add('active');
      container.appendChild(dot);
    }
  }

  function checkAnswer(selected) {
    var q = currentQuestion();
    var isCorrect = String(selected) === String(q.correct);

    state.attempts++;

    // Disable all option buttons
    var btns = document.querySelectorAll('.option-btn');
    btns.forEach(function (b) {
      b.disabled = true;
      if (String(b.getAttribute('data-value')) === String(selected)) {
        b.classList.add(isCorrect ? 'correct' : 'wrong');
      }
    });

    var fb = document.getElementById('feedback');
    
    if (isCorrect) {
      fb.textContent = shell.t('vph.correct');
      fb.className = 'feedback correct';
      shell.speak(shell.t('vph.correct'));
      
      if (!state.wrongOnFirst && !state.hintShown) {
        state.score++;
        document.getElementById('liveScore').textContent = state.score;
      }

      // Next button
      var btnHTML = '<button class="btn btn-primary" onclick="vphNext()">' +
        (state.qIndex < currentUnit().questions.length - 1 
          ? shell.t('btn.next')
          : shell.t('btn.finish')
        ) + '</button>';
      document.getElementById('actionButtons').innerHTML = btnHTML;

    } else {
      fb.textContent = shell.t('vph.wrong');
      fb.className = 'feedback wrong';
      shell.speak(shell.t('vph.wrong'));
      
      if (state.attempts === 1) {
        state.wrongOnFirst = true;
      }

      // Show hint button
      var btnHTML = '<button class="btn btn-secondary" onclick="vphShowHint()">' +
        shell.t('btn.hint') + '</button>';
      document.getElementById('actionButtons').innerHTML = btnHTML;
    }
  }

  // ────────────────────────────────────────────────────────────
  // NAVIGATION
  // ────────────────────────────────────────────────────────────
  window.vphNext = function () {
    state.qIndex++;
    if (state.qIndex < currentUnit().questions.length) {
      renderQuestion();
    } else {
      finishUnit();
    }
  };

  window.vphShowHint = function () {
    var q = currentQuestion();
    var hintText = shell.t(q.hintKey);
    
    var hintBox = document.getElementById('hintBox');
    hintBox.textContent = shell.t('vph.hint', [hintText]);
    show(hintBox);
    
    state.hintShown = true;
    state.hintsUsed++;
    
    shell.speak(hintText);

    // Re-enable option buttons for retry
    var btns = document.querySelectorAll('.option-btn');
    btns.forEach(function (b) {
      b.disabled = false;
      b.classList.remove('wrong');
    });

    document.getElementById('actionButtons').innerHTML = '';
  };

  window.vphBack = function () {
    show($homeScreen);
    hide($gameScreen);
    hide($resultScreen);
    renderHome();
  };

  window.vphReplayQuestion = function () {
    var promptText = shell.t('vph.voice.q', [state.qIndex + 1]);
    shell.speak(promptText);
  };

  // ────────────────────────────────────────────────────────────
  // RESULT SCREEN
  // ────────────────────────────────────────────────────────────
  function finishUnit() {
    var unit = currentUnit();
    var total = unit.questions.length;
    var timeMs = Date.now() - state.startTime;
    
    // Save session stats
    sessionStats[unit.id] = {
      score: state.score,
      wrong: state.attempts - state.score,
      hints: state.hintsUsed,
      timeMs: timeMs
    };

    // Update persistent save
    var saved = getUnitSave(unit.id);
    if (saved.bestScore === null || state.score > saved.bestScore) {
      saved.bestScore = state.score;
    }
    saved.playCount++;
    
    // Unlock next unit if passed
    if (state.score >= PASS_SCORE) {
      var nextUnit = VPH_DATA.units[state.unitIndex + 1];
      if (nextUnit) {
        var nextSave = getUnitSave(nextUnit.id);
        nextSave.unlocked = true;
        saveUnitSave(nextUnit.id, nextSave);
      }
    }
    
    saveUnitSave(unit.id, saved);

    // Report to shell analytics
    shell.report({
      event: 'unit-complete',
      gameId: GAME_ID,
      unitId: unit.id,
      score: state.score,
      total: total,
      timeMs: timeMs,
      hintsUsed: state.hintsUsed
    });

    show($resultScreen);
    hide($gameScreen);
    renderResult();
  }

  function renderResult() {
    var unit = currentUnit();
    var total = unit.questions.length;
    var passed = state.score >= PASS_SCORE;

    var emoji = passed ? '🏆' : '💪';
    var title = passed ? shell.t('result.pass') : shell.t('result.retry');
    
    document.getElementById('resultEmoji').textContent = emoji;
    document.getElementById('resultTitle').textContent = title;
    document.getElementById('resultScore').textContent = state.score + '/' + total;

    var timeSec = Math.round((Date.now() - state.startTime) / 1000);
    var details = shell.t('result.time') + ': ' + timeSec + shell.t('unit.sec');
    if (state.hintsUsed > 0) {
      details += ' | ' + shell.t('result.hints') + ': ' + state.hintsUsed;
    }
    document.getElementById('resultDetails').textContent = details;

    var message = passed 
      ? shell.t('result.msg-pass')
      : shell.t('result.msg-retry');
    document.getElementById('resultMessage').textContent = message;

    // Buttons
    var btns = '<button class="btn btn-outline" onclick="vphBack()">' +
      shell.t('btn.home') + '</button>';
    
    if (passed && state.unitIndex < VPH_DATA.units.length - 1) {
      btns += '<button class="btn btn-primary" onclick="vphNextUnit()">' +
        shell.t('btn.next-unit') + '</button>';
    } else {
      btns += '<button class="btn btn-primary" onclick="vphRetry()">' +
        shell.t('btn.retry') + '</button>';
    }
    
    document.getElementById('resultButtons').innerHTML = btns;

    var resultText = passed ? shell.t('result.pass') : shell.t('result.retry');
    shell.speak(resultText + ', ' + shell.t('result.score') + ': ' + state.score);
  }

  window.vphRetry = function () {
    startUnit(state.unitIndex);
  };

  window.vphNextUnit = function () {
    startUnit(state.unitIndex + 1);
  };

  window.vphToggleVoice = function () {
    shell.toggleVoice();
    updateVoiceBtn();
  };

  window.vphToggleLang = function () {
    shell.toggleLang();
  };

  // ────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────
  function currentUnit() { return VPH_DATA.units[state.unitIndex]; }
  function currentQuestion() { return currentUnit().questions[state.qIndex]; }
  
  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }

  function getUnitSave(unitId) {
    var key = GAME_ID + ':unit:' + unitId;
    var data = shell.storage.get(key);
    if (!data) {
      data = { unlocked: unitId === '1', bestScore: null, playCount: 0 };
    }
    return data;
  }

  function saveUnitSave(unitId, data) {
    var key = GAME_ID + ':unit:' + unitId;
    shell.storage.set(key, data);
  }

  function updateVoiceBtn() {
    var btns = document.querySelectorAll('.voiceToggle');
    var icon = shell.voiceEnabled ? '🔊' : '🔇';
    btns.forEach(function (b) { b.textContent = icon; });
  }

  function updateLangBtn() {
    var btn = document.getElementById('langToggle');
    if (btn) btn.textContent = shell.lang === 'zh' ? 'EN' : '中';
  }

  function updateLangBtnGame() {
    var btn = document.getElementById('langToggleGame');
    if (btn) btn.textContent = shell.lang === 'zh' ? 'EN' : '中';
  }

})();
