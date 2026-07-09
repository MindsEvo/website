'use strict';
/**
 * Comparison game logic
 * Depends on: data.js (LEVELS, makeQuestion)
 */

// ── i18n prompt strings ──
const PROMPTS = {
  bigger: { zh: '哪个更大？', en: 'Which is BIGGER?' },
  smaller: { zh: '哪个更小？', en: 'Which is SMALLER?' },
};
function tp(key) {
  const lang = document.body.getAttribute('data-lang') || 'zh';
  return PROMPTS[key]?.[lang] ?? key;
}

// ── Game state ──
const state = {
  level: null,
  roundIndex: 0,
  correctCount: 0,
  question: null,
  busy: false,
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
  elPromptText.textContent = state.question.askBigger ? tp('bigger') : tp('smaller');

  // Choices
  fillChoice(elChoiceLeft,  state.question.a, state.question.mode);
  fillChoice(elChoiceRight, state.question.b, state.question.mode);
  elChoiceLeft.className  = 'choice-btn';
  elChoiceRight.className = 'choice-btn';
  elChoiceLeft.disabled   = false;
  elChoiceRight.disabled  = false;
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

  if (isCorrect) {
    state.correctCount++;
    tapped.classList.add('correct');
  } else {
    tapped.classList.add('wrong');
    correct.classList.add('correct');
  }

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
}

document.getElementById('btn-retry').addEventListener('click',
  () => startLevel(state.level));
document.getElementById('btn-select').addEventListener('click',
  () => showScreen('select'));

// ── Language toggle ──
function setLang(lang) {
  document.body.setAttribute('data-lang', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.getElementById('btn-lang-zh').classList.toggle('active', lang === 'zh');
  document.getElementById('btn-lang-en').classList.toggle('active', lang === 'en');
  localStorage.setItem('mindsevo-lang', lang);
  // refresh prompt text live if mid-game
  if (state.question && !elScreenGame.classList.contains('hidden')) {
    elPromptText.textContent = state.question.askBigger ? tp('bigger') : tp('smaller');
  }
}
window.setLang = setLang;

// Init lang
const savedLang = localStorage.getItem('mindsevo-lang');
setLang(savedLang === 'en' ? 'en' : 'zh');
