'use strict';
/**
 * Number Sense game logic
 * Depends on: data.js (LEVELS, makeQuestion)
 * Three question types: split | proximity | complete
 */

// ── History storage key ───────────────────────────────────────────────────────
const HIST_PREFIX = 'me:number-sense-math:session:';

// ── Speech: provided by learning-game.js (LG.speak) ──

// ── Game state ────────────────────────────────────────────────────────────────
const state = {
  level: null,
  roundIndex: 0,
  correctCount: 0,
  question: null,
  busy: false,
  trials: [],
  roundStartTime: 0,
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const elScreenSelect = document.getElementById('screen-select');
const elScreenGame   = document.getElementById('screen-game');
const elScreenDone   = document.getElementById('screen-done');
const elHudLevel     = document.getElementById('hud-level');
const elHudProgress  = document.getElementById('hud-progress');
const elHudScore     = document.getElementById('hud-score');
const elProgressFill = document.getElementById('progress-fill');
const elPromptLabel  = document.getElementById('prompt-label');
const elPromptMain   = document.getElementById('prompt-main');
const elChoices      = document.getElementById('choices');
const elDoneIcon     = document.getElementById('done-icon');
const elDoneScore    = document.getElementById('done-score');
const elBtnNext      = document.getElementById('btn-next-level');

// ── Screen switch ─────────────────────────────────────────────────────────────
function showScreen(name) {
  elScreenSelect.classList.toggle('hidden', name !== 'select');
  elScreenGame.classList.toggle('hidden',   name !== 'game');
  elScreenDone.classList.toggle('hidden',   name !== 'done');
}

// ── i18n strings ─────────────────────────────────────────────────────────────
const META = {
  split:     { zh: '元思维操作：拆分与重组', en: 'Meta-op: Decompose & Recompose' },
  proximity: { zh: '元思维操作：数感估算',   en: 'Meta-op: Number Proximity' },
  complete:  { zh: '元思维操作：逆向求解',   en: 'Meta-op: Find the Missing Part' },
};

function promptText(q, lang) {
  if (q.type === 'split') {
    return { label: META.split[lang], main: `split:${q.target}` };
  }
  if (q.type === 'proximity') {
    const t = lang === 'zh' ? `离 ${q.target} 更近？` : `Closer to ${q.target}?`;
    return { label: META.proximity[lang], main: `text:${t}` };
  }
  // complete
  const expr = q.flipped ? `? + ${q.known} = ${q.sum}` : `${q.known} + ? = ${q.sum}`;
  return { label: META.complete[lang], main: `expr:${expr}` };
}

function renderPromptMain(encoded) {
  const [kind, val] = encoded.split(/:(.+)/);
  if (kind === 'split') {
    elPromptMain.innerHTML =
      `<span class="split-num">${val}</span><span class="split-eq">= ? + ?</span>`;
  } else if (kind === 'text') {
    elPromptMain.innerHTML = `<span class="prox-text">${val}</span>`;
  } else {
    elPromptMain.innerHTML = `<span class="complete-expr">${val}</span>`;
  }
}

// ── Level select ──────────────────────────────────────────────────────────────
document.querySelectorAll('.level-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const level = LEVELS.find(l => l.id === btn.getAttribute('data-level'));
    if (level) startLevel(level);
  });
});

function startLevel(level) {
  state.level       = level;
  state.roundIndex  = 0;
  state.correctCount= 0;
  state.busy        = false;
  state.trials      = [];
  state.roundStartTime = 0;
  elProgressFill.style.width = '0%';
  showScreen('game');
  showRound();
}

// ── Game round ────────────────────────────────────────────────────────────────
function showRound() {
  if (state.roundIndex >= state.level.rounds) { showDone(); return; }
  state.question = makeQuestion(state.level);
  state.busy     = false;

  const lang = document.body.getAttribute('data-lang') || 'zh';
  const q    = state.question;

  // HUD
  elHudLevel.textContent     = state.level.id;
  elHudProgress.textContent  = `${state.roundIndex + 1} / ${state.level.rounds}`;
  elHudScore.textContent     = `✓ ${state.correctCount}`;
  elProgressFill.style.width = `${(state.roundIndex / state.level.rounds) * 100}%`;

  // Prompt
  const pt = promptText(q, lang);
  elPromptLabel.textContent = pt.label;
  renderPromptMain(pt.main);

  // Choices + voice
  if (q.type === 'split') {
    buildChoices4(q.options, q.correctExpr);
    LG.speak(lang === 'zh'
      ? `${q.target}，等于哪两个数相加？`
      : `${q.target} equals which sum?`);
  } else if (q.type === 'proximity') {
    buildChoices2(String(q.a), String(q.b), q.correctSide);
    LG.speak(lang === 'zh'
      ? `离${q.target}更近，${q.a}还是${q.b}？`
      : `Closer to ${q.target}: ${q.a} or ${q.b}?`);
  } else {
    buildChoices4(q.options.map(String), String(q.missing));
    LG.speak(lang === 'zh'
      ? `${q.known}加多少等于${q.sum}？`
      : `${q.known} plus what equals ${q.sum}?`);
  }

  state.roundStartTime = Date.now();
}

// ── Choice builders ───────────────────────────────────────────────────────────
function buildChoices4(options, correctVal) {
  elChoices.className = 'choices-4';
  elChoices.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className    = 'choice-btn choice-opt';
    btn.type         = 'button';
    btn.dataset.val  = opt;
    const display    = opt.includes('+') ? opt.replace('+', ' + ') : opt;
    btn.innerHTML    = `<div class="opt-expr">${display}</div>`;
    btn.addEventListener('click', () => handleOpt(btn, opt, correctVal));
    elChoices.appendChild(btn);
  });
}

function buildChoices2(labelL, labelR, correctSide) {
  elChoices.className = 'choices-2';
  elChoices.innerHTML = '';
  ['left', 'right'].forEach(side => {
    const btn = document.createElement('button');
    btn.className = `choice-btn choice-big choice-${side}`;
    btn.type      = 'button';
    btn.innerHTML = `<div class="choice-number">${side === 'left' ? labelL : labelR}</div>`;
    btn.addEventListener('click', () => handleSide(side, correctSide));
    elChoices.appendChild(btn);
  });
}

// ── Answer handlers ───────────────────────────────────────────────────────────
function handleOpt(btn, val, correctVal) {
  if (state.busy) return;
  state.busy = true;
  const timeMs    = Date.now() - state.roundStartTime;
  const isCorrect = (val === correctVal);
  const lang      = document.body.getAttribute('data-lang') || 'zh';

  elChoices.querySelectorAll('.choice-btn').forEach(b => { b.disabled = true; });
  btn.classList.add(isCorrect ? 'correct' : 'wrong');

  if (!isCorrect) {
    elChoices.querySelectorAll('.choice-btn').forEach(b => {
      if (b.dataset.val === correctVal) b.classList.add('correct');
    });
    const cv = correctVal.includes('+')
      ? correctVal.replace('+', lang === 'zh' ? '加' : ' plus ')
      : correctVal;
    LG.speak(lang === 'zh' ? `答案是${cv}` : `It's ${correctVal}`);
  } else {
    state.correctCount++;
    LG.speak(lang === 'zh' ? '对了！' : 'Correct!');
  }

  state.trials.push({ type: state.question.type, isCorrect, timeMs });
  state.roundIndex++;
  setTimeout(showRound, 900);
}

function handleSide(side, correctSide) {
  if (state.busy) return;
  state.busy = true;
  const timeMs    = Date.now() - state.roundStartTime;
  const isCorrect = (side === correctSide);
  const lang      = document.body.getAttribute('data-lang') || 'zh';

  const leftBtn  = elChoices.querySelector('.choice-left');
  const rightBtn = elChoices.querySelector('.choice-right');
  if (leftBtn)  leftBtn.disabled  = true;
  if (rightBtn) rightBtn.disabled = true;

  const tapped  = side === 'left' ? leftBtn : rightBtn;
  const correct = correctSide === 'left' ? leftBtn : rightBtn;
  tapped.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect && correct) correct.classList.add('correct');

  if (isCorrect) {
    state.correctCount++;
    LG.speak(lang === 'zh' ? '对了！' : 'Correct!');
  } else {
    const cv = correctSide === 'left' ? state.question.a : state.question.b;
    LG.speak(lang === 'zh' ? `答案是${cv}` : `It's ${cv}`);
  }

  state.trials.push({ type: state.question.type, isCorrect, timeMs });
  state.roundIndex++;
  setTimeout(showRound, 900);
}

// ── Done screen ───────────────────────────────────────────────────────────────
function showDone() {
  const pct = (state.correctCount / state.level.rounds) * 100;
  elDoneIcon.textContent  = pct >= 87 ? '🌟' : pct >= 62 ? '💪' : '🔄';
  elDoneScore.textContent = `${state.correctCount} / ${state.level.rounds}`;
  elProgressFill.style.width = '100%';

  const idx  = LEVELS.findIndex(l => l.id === state.level.id);
  const next = LEVELS[idx + 1];
  if (next) { elBtnNext.classList.remove('hidden'); elBtnNext.onclick = () => startLevel(next); }
  else        elBtnNext.classList.add('hidden');

  showScreen('done');
  LG.saveSession(HIST_PREFIX, state.level.id, state.correctCount, state.level.rounds, state.trials);
  LG.renderTrialLog(document.getElementById('trial-section'), state.trials,
    (t, zh) => TYPE_NAME[t.type]?.[zh ? 'zh' : 'en'] || t.type);
  LG.renderHistorySection(document.getElementById('history-section'), HIST_PREFIX);
}

// ── Trial log ─────────────────────────────────────────────────────────────────
// ── Done buttons ──────────────────────────────────────────────────────────────
document.getElementById('btn-retry').addEventListener('click',
  () => startLevel(state.level));
document.getElementById('btn-select').addEventListener('click',
  () => showScreen('select'));

// ── Language toggle ───────────────────────────────────────────────────────────
function setLang(lang) {
  LG.applyLang(lang);
  // Re-render prompt text only
  if (state.question && !elScreenGame.classList.contains('hidden')) {
    const pt = promptText(state.question, lang);
    elPromptLabel.textContent = pt.label;
    renderPromptMain(pt.main);
  }
}
window.setLang = setLang;
LG.initLang(setLang);
