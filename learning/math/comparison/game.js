'use strict';
/**
 * Comparison game logic
 * Depends on: data.js (LEVELS, makeQuestion)
 */

// ── Speech (Web Speech API, mirrors shell.speak pattern) ──
(function unlockSpeech() {
  const handler = () => {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    speechSynthesis.speak(u);
    speechSynthesis.cancel();
  };
  document.addEventListener('touchstart', handler, { once: true, passive: true });
  document.addEventListener('click',      handler, { once: true });
}());

if (window.speechSynthesis) {
  speechSynthesis.addEventListener('voiceschanged', () => speechSynthesis.getVoices());
}

function speak(text) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const lang = document.body.getAttribute('data-lang') || 'zh';
  const u = new SpeechSynthesisUtterance(text);
  u.lang  = lang === 'zh' ? 'zh-CN' : 'en-US';
  u.rate  = 0.88;
  u.pitch = 1.1;
  const voices = speechSynthesis.getVoices();
  if (voices.length) {
    const prefix = u.lang.split('-')[0];
    const match = voices.find(v => v.lang === u.lang || v.lang.startsWith(prefix));
    if (match) u.voice = match;
  }
  setTimeout(() => { try { speechSynthesis.speak(u); } catch (e) {} }, 50);
}

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
  speak(spokenPrompt);

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
    speak(l === 'zh' ? '对了！' : 'Correct!');
  } else {
    tapped.classList.add('wrong');
    correct.classList.add('correct');
    const correctVal = state.question.correctSide === 'left' ? state.question.a : state.question.b;
    const l = document.body.getAttribute('data-lang') || 'zh';
    speak(l === 'zh' ? `答案是 ${correctVal}` : `It's ${correctVal}`);
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
  saveSession();
  renderTrialLog(document.getElementById('trial-section'));
  renderHistorySection(document.getElementById('history-section'));
}

// ── Save session to localStorage ──
function saveSession() {
  try {
    const rec = {
      levelId: state.level.id,
      score:   state.correctCount,
      total:   state.level.rounds,
      trials:  state.trials,
      ts:      Date.now(),
    };
    localStorage.setItem(HIST_PREFIX + rec.ts, JSON.stringify(rec));
  } catch (e) {}
}

// ── Render per-trial log ──
function renderTrialLog(el) {
  if (!el) return;
  const zh = (document.body.getAttribute('data-lang') || 'zh') === 'zh';
  const header = zh ? '本次答题详情' : 'Session Details';
  const totalMs = state.trials.reduce((s, t) => s + t.timeMs, 0);
  const avgMs   = state.trials.length ? totalMs / state.trials.length : 0;

  let rows = '';
  state.trials.forEach((t, i) => {
    const [hi, lo] = t.a > t.b ? [t.a, t.b] : [t.b, t.a];
    const secs = (t.timeMs / 1000).toFixed(1);
    rows += `<div class="tlog-row ${t.isCorrect ? 'tlog-ok' : 'tlog-err'}">
      <span class="tlog-n">${i + 1}</span>
      <span class="tlog-expr">${hi} &gt; ${lo}</span>
      <span class="tlog-ask">${t.askBigger ? (zh ? '大' : '>') : (zh ? '小' : '<')}</span>
      <span class="tlog-icon">${t.isCorrect ? '✅' : '❌'}</span>
      <span class="tlog-time">${secs}s</span>
    </div>`;
  });

  const footer = zh
    ? `总用时 ${(totalMs/1000).toFixed(1)}s · 平均 ${(avgMs/1000).toFixed(1)}s/题`
    : `Total ${(totalMs/1000).toFixed(1)}s · Avg ${(avgMs/1000).toFixed(1)}s/q`;

  el.innerHTML = `
    <div class="tlog-header">${header}</div>
    <div class="tlog-rows">${rows}</div>
    <div class="tlog-footer">${footer}</div>`;
}

// ── Render history accordion ──
function renderHistorySection(el) {
  if (!el) return;
  const zh = (document.body.getAttribute('data-lang') || 'zh') === 'zh';
  const sessions = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(HIST_PREFIX)) {
        const r = JSON.parse(localStorage.getItem(key));
        if (r && r.total) sessions.push(r);
      }
    }
  } catch (e) {}

  if (sessions.length < 2) { el.innerHTML = ''; return; } // only show after >1 session

  const total    = sessions.reduce((s, r) => s + r.total, 0);
  const correct  = sessions.reduce((s, r) => s + r.score, 0);
  const totalMs  = sessions.reduce((s, r) => {
    return s + (r.trials || []).reduce((t, tr) => t + (tr.timeMs || 0), 0);
  }, 0);
  const pct = total ? Math.round(correct / total * 100) : 0;
  const avgMs = total ? totalMs / total : 0;

  const vals = [sessions.length, `${correct}/${total}`, `${pct}%`, `${(avgMs/1000).toFixed(1)}s`];
  const lbls = zh
    ? ['完成局数', '答对/总题', '正确率', '平均用时/题']
    : ['Sessions', 'Correct', 'Accuracy', 'Avg/q'];

  const statsHtml = vals.map((v, i) =>
    `<div class="hist-stat"><div class="hstat-val">${v}</div><div class="hstat-lbl">${lbls[i]}</div></div>`
  ).join('');

  el.innerHTML = `
    <div class="hist-toggle" id="hist-toggle">
      <span>${zh ? '📊 历史总览' : '📊 All History'} (${sessions.length})</span>
      <span class="hist-arrow">▼</span>
    </div>
    <div class="hist-body hidden" id="hist-body">
      <div class="hist-stats">${statsHtml}</div>
    </div>`;

  document.getElementById('hist-toggle').addEventListener('click', () => {
    const body  = el.querySelector('#hist-body');
    const arrow = el.querySelector('.hist-arrow');
    const open  = body.classList.toggle('hidden');
    arrow.textContent = body.classList.contains('hidden') ? '▼' : '▲';
  });
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
