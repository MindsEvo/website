'use strict';
/**
 * Number Sense game logic
 * Depends on: data.js (LEVELS, makeQuestion)
 * Three question types: split | proximity | complete
 */

// ── History storage key ───────────────────────────────────────────────────────
const HIST_PREFIX = 'me:number-sense-math:session:';

// ── Speech ────────────────────────────────────────────────────────────────────
(function unlockSpeech() {
  const h = () => {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0; speechSynthesis.speak(u); speechSynthesis.cancel();
  };
  document.addEventListener('touchstart', h, { once: true, passive: true });
  document.addEventListener('click', h, { once: true });
}());
if (window.speechSynthesis) {
  speechSynthesis.addEventListener('voiceschanged', () => speechSynthesis.getVoices());
}
function speak(text) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const lang = document.body.getAttribute('data-lang') || 'zh';
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
  u.rate = 0.88; u.pitch = 1.1;
  const voices = speechSynthesis.getVoices();
  if (voices.length) {
    const prefix = u.lang.split('-')[0];
    const match = voices.find(v => v.lang === u.lang || v.lang.startsWith(prefix));
    if (match) u.voice = match;
  }
  setTimeout(() => { try { speechSynthesis.speak(u); } catch (e) {} }, 50);
}

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
    speak(lang === 'zh'
      ? `${q.target}，等于哪两个数相加？`
      : `${q.target} equals which sum?`);
  } else if (q.type === 'proximity') {
    buildChoices2(String(q.a), String(q.b), q.correctSide);
    speak(lang === 'zh'
      ? `离${q.target}更近，${q.a}还是${q.b}？`
      : `Closer to ${q.target}: ${q.a} or ${q.b}?`);
  } else {
    buildChoices4(q.options.map(String), String(q.missing));
    speak(lang === 'zh'
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
    speak(lang === 'zh' ? `答案是${cv}` : `It's ${correctVal}`);
  } else {
    state.correctCount++;
    speak(lang === 'zh' ? '对了！' : 'Correct!');
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
    speak(lang === 'zh' ? '对了！' : 'Correct!');
  } else {
    const cv = correctSide === 'left' ? state.question.a : state.question.b;
    speak(lang === 'zh' ? `答案是${cv}` : `It's ${cv}`);
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
  saveSession();
  renderTrialLog(document.getElementById('trial-section'));
  renderHistorySection(document.getElementById('history-section'));
}

// ── Session persistence ───────────────────────────────────────────────────────
function saveSession() {
  try {
    localStorage.setItem(HIST_PREFIX + Date.now(), JSON.stringify({
      levelId: state.level.id,
      score:   state.correctCount,
      total:   state.level.rounds,
      trials:  state.trials,
      ts:      Date.now(),
    }));
  } catch (e) {}
}

// ── Trial log ─────────────────────────────────────────────────────────────────
const TYPE_NAME = {
  split:     { zh: '拆分', en: 'Split' },
  proximity: { zh: '接近', en: 'Proximity' },
  complete:  { zh: '凑数', en: 'Complete' },
};

function renderTrialLog(el) {
  if (!el) return;
  const zh      = (document.body.getAttribute('data-lang') || 'zh') === 'zh';
  const header  = zh ? '本次答题详情' : 'Session Details';
  const totalMs = state.trials.reduce((s, t) => s + t.timeMs, 0);
  const avgMs   = state.trials.length ? totalMs / state.trials.length : 0;

  const rows = state.trials.map((t, i) => {
    const name = TYPE_NAME[t.type]?.[zh ? 'zh' : 'en'] || t.type;
    return `<div class="tlog-row ${t.isCorrect ? 'tlog-ok' : 'tlog-err'}">
      <span class="tlog-n">${i + 1}</span>
      <span class="tlog-type">${name}</span>
      <span class="tlog-icon">${t.isCorrect ? '✅' : '❌'}</span>
      <span class="tlog-time">${(t.timeMs / 1000).toFixed(1)}s</span>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="tlog-header">${header}</div>
    <div class="tlog-rows">${rows}</div>
    <div class="tlog-footer">${
      zh ? `总用时 ${(totalMs/1000).toFixed(1)}s · 平均 ${(avgMs/1000).toFixed(1)}s/题`
         : `Total ${(totalMs/1000).toFixed(1)}s · Avg ${(avgMs/1000).toFixed(1)}s/q`
    }</div>`;
}

// ── History accordion ─────────────────────────────────────────────────────────
function renderHistorySection(el) {
  if (!el) return;
  const zh       = (document.body.getAttribute('data-lang') || 'zh') === 'zh';
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
  if (sessions.length < 2) { el.innerHTML = ''; return; }

  const total   = sessions.reduce((s, r) => s + r.total, 0);
  const correct = sessions.reduce((s, r) => s + r.score, 0);
  const totalMs = sessions.reduce((s, r) =>
    s + (r.trials || []).reduce((t, tr) => t + (tr.timeMs || 0), 0), 0);
  const pct   = total ? Math.round(correct / total * 100) : 0;
  const avgMs = total ? totalMs / total : 0;

  const vals = [sessions.length, `${correct}/${total}`, `${pct}%`, `${(avgMs/1000).toFixed(1)}s`];
  const lbls = zh
    ? ['完成局数', '答对/总题', '正确率', '平均用时/题']
    : ['Sessions',  'Correct',  'Accuracy', 'Avg/q'];

  el.innerHTML = `
    <div class="hist-toggle" id="hist-toggle">
      <span>${zh ? '📊 历史总览' : '📊 All History'} (${sessions.length})</span>
      <span class="hist-arrow">▼</span>
    </div>
    <div class="hist-body hidden" id="hist-body">
      <div class="hist-stats">
        ${vals.map((v, i) =>
          `<div class="hist-stat"><div class="hstat-val">${v}</div><div class="hstat-lbl">${lbls[i]}</div></div>`
        ).join('')}
      </div>
    </div>`;

  document.getElementById('hist-toggle').addEventListener('click', () => {
    const body  = el.querySelector('#hist-body');
    const arrow = el.querySelector('.hist-arrow');
    body.classList.toggle('hidden');
    arrow.textContent = body.classList.contains('hidden') ? '▼' : '▲';
  });
}

// ── Done buttons ──────────────────────────────────────────────────────────────
document.getElementById('btn-retry').addEventListener('click',
  () => startLevel(state.level));
document.getElementById('btn-select').addEventListener('click',
  () => showScreen('select'));

// ── Language toggle ───────────────────────────────────────────────────────────
function setLang(lang) {
  document.body.setAttribute('data-lang', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.getElementById('btn-lang-zh').classList.toggle('active', lang === 'zh');
  document.getElementById('btn-lang-en').classList.toggle('active', lang === 'en');
  localStorage.setItem('mindsevo-lang', lang);
  // Re-render prompt text only (don't rebuild choices or generate new question)
  if (state.question && !elScreenGame.classList.contains('hidden')) {
    const pt = promptText(state.question, lang);
    elPromptLabel.textContent = pt.label;
    renderPromptMain(pt.main);
  }
}
window.setLang = setLang;

const savedLang = localStorage.getItem('mindsevo-lang');
setLang(savedLang === 'en' ? 'en' : 'zh');
