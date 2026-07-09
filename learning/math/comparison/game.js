'use strict';
/**
 * Comparison game logic
 * Depends on: data.js (LEVELS, makeQuestion)
 */

// ── Speech: provided by learning-game.js (LG.speak) ──

// ── i18n prompt strings ──
const PROMPTS = {
  bigger: { zh: '哪个更大？', en: 'Which is BIGGER?' },
  smaller: { zh: '哪个更小？', en: 'Which is SMALLER?' },
};
function tp(key) {
  const lang = document.body.getAttribute('data-lang') || 'zh';
  return PROMPTS[key]?.[lang] ?? key;
}

// ── Session persistence key ──
const HIST_PREFIX = 'me:comparison-math:session:';

// ── Game state ──
const state = {
  level: null,
  roundIndex: 0,
  correctCount: 0,
  question: null,
  busy: false,
  trials: [],          // per-question log
  roundStartTime: 0,   // timestamp when question appeared
};

// ── DOM refs ──
const elScreenSelect = document.getElementById('screen-select');
const elScreenGame   = document.getElementById('screen-game');
const elScreenDone   = document.getElementById('screen-done');

const elHudLevel    = document.getElementById('hud-level');
const elHudProgress = document.getElementById('hud-progress');
const elHudScore    = document.getElementById('hud-score');
const elProgressFill = document.getElementById('progress-fill');

const elPromptText  = document.getElementById('prompt-text');
const elChoiceLeft  = document.getElementById('choice-left');
const elChoiceRight = document.getElementById('choice-right');

const elDoneIcon    = document.getElementById('done-icon');
const elDoneScore   = document.getElementById('done-score');
const elBtnNext     = document.getElementById('btn-next-level');

// ── Screen switch ──
function showScreen(name) {
  elScreenSelect.classList.toggle('hidden', name !== 'select');
  elScreenGame.classList.toggle('hidden',   name !== 'game');
  elScreenDone.classList.toggle('hidden',   name !== 'done');
}

// ── Dot array renderer (L1 mode) ──
function makeDots(n) {
  const grid = document.createElement('div');
  grid.className = 'dots-grid';
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div');
    d.className = 'dot';
    grid.appendChild(d);
  }
  return grid;
}

function fillChoice(btn, value, mode) {
  btn.innerHTML = '';
  if (mode === 'dots') {
    btn.appendChild(makeDots(value));
    const sub = document.createElement('div');
    sub.className = 'choice-sub';
    sub.textContent = value;
    btn.appendChild(sub);
  } else {
    const num = document.createElement('div');
    num.className = 'choice-number';
    num.textContent = value;
    btn.appendChild(num);
  }
}

// ── Level select ──
document.querySelectorAll('.level-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const level = LEVELS.find((l) => l.id === btn.getAttribute('data-level'));
    if (level) startLevel(level);
  });
});

// ── Start / restart level ──
function startLevel(level) {
  state.level = level;
  state.roundIndex = 0;
  state.correctCount = 0;
  state.busy = false;
  state.trials = [];
  state.roundStartTime = 0;
  elProgressFill.style.width = '0%';
  showScreen('game');
  showRound();
}

// ── Show current round ──
function showRound() {
  if (state.roundIndex >= state.level.rounds) {
    showDone();
    return;
  }
  state.question = makeQuestion(state.level);
  state.busy = false;

  // HUD
  elHudLevel.textContent    = state.level.id;
  elHudProgress.textContent = `${state.roundIndex + 1} / ${state.level.rounds}`;
  elHudScore.textContent    = `✓ ${state.correctCount}`;
  elProgressFill.style.width = `${(state.roundIndex / state.level.rounds) * 100}%`;

  // Prompt
  const langNow = document.body.getAttribute('data-lang') || 'zh';
  const promptStr = state.question.askBigger ? tp('bigger') : tp('smaller');
  elPromptText.textContent = promptStr;

  // Speak the question
  const q = state.question;
  const spokenPrompt = q.askBigger
    ? (langNow === 'zh' ? `哪个更大？${q.a}，还是${q.b}？` : `Which is bigger? ${q.a} or ${q.b}?`)
    : (langNow === 'zh' ? `哪个更小？${q.a}，还是${q.b}？` : `Which is smaller? ${q.a} or ${q.b}?`);
  LG.speak(spokenPrompt);

  // Choices
  fillChoice(elChoiceLeft,  state.question.a, state.question.mode);
  fillChoice(elChoiceRight, state.question.b, state.question.mode);
  elChoiceLeft.className  = 'choice-btn';
  elChoiceRight.className = 'choice-btn';
  elChoiceLeft.disabled   = false;
  elChoiceRight.disabled  = false;

  state.roundStartTime = Date.now(); // start timing
}

// ── Handle tap ──
function handleTap(side) {
  if (state.busy) return;
  state.busy = true;

  const isCorrect = (side === state.question.correctSide);
  const tapped  = side === 'left' ? elChoiceLeft : elChoiceRight;
  const correct = state.question.correctSide === 'left' ? elChoiceLeft : elChoiceRight;

  elChoiceLeft.disabled  = true;
  elChoiceRight.disabled = true;

  const timeMs = Date.now() - state.roundStartTime;

  if (isCorrect) {
    state.correctCount++;
    tapped.classList.add('correct');
    const l = document.body.getAttribute('data-lang') || 'zh';
    LG.speak(l === 'zh' ? '对了！' : 'Correct!');
  } else {
    tapped.classList.add('wrong');
    correct.classList.add('correct');
    const correctVal = state.question.correctSide === 'left' ? state.question.a : state.question.b;
    const l = document.body.getAttribute('data-lang') || 'zh';
    LG.speak(l === 'zh' ? `答案是 ${correctVal}` : `It's ${correctVal}`);
  }

  // Record trial
  state.trials.push({
    a: state.question.a,
    b: state.question.b,
    askBigger: state.question.askBigger,
    isCorrect,
    timeMs,
  });

  state.roundIndex++;
  setTimeout(showRound, 900);
}

elChoiceLeft.addEventListener('click',  () => handleTap('left'));
elChoiceRight.addEventListener('click', () => handleTap('right'));

// ── Done screen ──
function showDone() {
  const pct = (state.correctCount / state.level.rounds) * 100;
  elDoneIcon.textContent  = pct >= 87 ? '🌟' : pct >= 62 ? '💪' : '🔄';
  elDoneScore.textContent = `${state.correctCount} / ${state.level.rounds}`;
  elProgressFill.style.width = '100%';

  const idx  = LEVELS.findIndex((l) => l.id === state.level.id);
  const next = LEVELS[idx + 1];
  if (next) {
    elBtnNext.classList.remove('hidden');
    elBtnNext.onclick = () => startLevel(next);
  } else {
    elBtnNext.classList.add('hidden');
  }
  showScreen('done');
  LG.saveSession(HIST_PREFIX, state.level.id, state.correctCount, state.level.rounds, state.trials);
  LG.renderTrialLog(document.getElementById('trial-section'), state.trials,
    (t, zh) => { const [hi, lo] = t.a > t.b ? [t.a, t.b] : [t.b, t.a]; return hi + ' &gt; ' + lo; });
  LG.renderHistorySection(document.getElementById('history-section'), HIST_PREFIX);
}





document.getElementById('btn-retry').addEventListener('click',
  () => startLevel(state.level));
document.getElementById('btn-select').addEventListener('click',
  () => showScreen('select'));

// ── Language toggle ──
function setLang(lang) {
  LG.applyLang(lang);
  // refresh prompt text live if mid-game
  if (state.question && !elScreenGame.classList.contains('hidden')) {
    elPromptText.textContent = state.question.askBigger ? tp('bigger') : tp('smaller');
  }
}
window.setLang = setLang;
LG.initLang(setLang);
