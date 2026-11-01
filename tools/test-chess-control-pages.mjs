import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const academy = new URL('../chess/academy/', import.meta.url);
const commonIds = {
  reset: 'btnReset', previous: 'btnPrev', play: 'btnPlay', next: 'btnNext',
  sound: 'btnSound', narration: 'btnVoice', manual: 'btnModeManual',
  humanAi: 'btnModeHumanAi', aiAi: 'btnModeAiAi', color: 'btnColor'
};
const pages = {
  'endgame/endgame-basics.html': commonIds,
  'tactics/tactics-basics.html': commonIds,
  'mate/mate-basics.html': commonIds,
  'opening/opening-basics.html': commonIds,
  'intro/piece-moves.html': {
    reset: 'btnReset', play: 'btnPlay', previous: 'btnPrev', next: 'btnNext',
    sound: 'btnSound', narration: 'btnVoice', manual: 'btnModeManual',
    humanAi: 'btnModeHumanAi', aiAi: 'btnModeAiAi', color: 'btnColor'
  }
};
const component = readFileSync(new URL('../chess/shared/control-panel.js', import.meta.url), 'utf8');
const academyAdapter = readFileSync(new URL('../chess/shared/academy-duel.js', import.meta.url), 'utf8');
new vm.Script(academyAdapter, { filename: 'academy-duel.js' });
assert.match(academyAdapter, /import\(new URL\('\.\/duel-runtime\.js', base\)\)/);
assert.match(academyAdapter, /import\(new URL\('\.\/vendor\/chess\.mjs', base\)\)/);
assert.match(academyAdapter, /root\.ChessAcademyDuel = \{\s*attach: async function/);
assert.match(academyAdapter, /host\.chessAcademyDuel = api/);
assert.doesNotMatch(academyAdapter, /btnLessonReplay|duelPromotionSelect|strength\.value/);
assert.match(academyAdapter, /skillLevel: 20/);
assert.match(academyAdapter, /chess\.history\(\)\.forEach/);
assert.match(academyAdapter, /duel\.setMode\(mode\)/);
assert.match(academyAdapter, /function resumeLesson\(\) \{\s*lessonChanged\(\);\s*options\.stopLesson\(\);\s*root\.speechSynthesis\?\.cancel\(\);\s*options\.resumeLesson\(\);/);
const playHtml = readFileSync(new URL('../chess/play/index.html', import.meta.url), 'utf8');
assert.match(playHtml, /data-chess-controls='/);
assert.match(playHtml, /src="\.\.\/shared\/control-panel\.js"/);
assert.match(playHtml, /href="\.\.\/shared\/control-panel\.css"/);
assert.doesNotMatch(playHtml, /<button[^>]+id="btnAuto"/);

function element() {
  const classes = new Set();
  const listeners = new Map();
  return {
    children: [], dataset: {}, attributes: {},
    classList: {
      add(...names) { names.forEach(name => classes.add(name)); },
      contains(name) { return classes.has(name); },
      toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }
    },
    setAttribute(name, value) { this.attributes[name] = value; },
    append(...nodes) { this.children.push(...nodes); },
    appendChild(node) { this.append(node); },
    replaceChildren() { this.children = []; },
    addEventListener(event, handler) {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(handler);
    },
    removeEventListener(event, handler) {
      listeners.set(event, (listeners.get(event) || []).filter(candidate => candidate !== handler));
    },
    dispatch(event) { (listeners.get(event) || []).forEach(handler => handler()); }
  };
}

for (const [path, expectedIds] of Object.entries(pages)) {
  if (process.argv[2] && path !== process.argv[2]) continue;
  const html = readFileSync(new URL(path, academy), 'utf8');
  const mounts = [...html.matchAll(/<div\s+data-chess-controls='([^']+)'\s*><\/div>/g)];
  assert.equal(mounts.length, 1, `${path}: one empty mount`);
  const config = JSON.parse(mounts[0][1]);
  assert.deepEqual(config, { ids: expectedIds }, `${path}: exact original controls`);
  assert.doesNotMatch(html, /class="[^"]*\bcontrol-strip\b/, `${path}: no legacy strip markup`);
  const css = [...html.matchAll(/<link[^>]+href="([^" ]*control-panel\.css)"[^>]*>/g)];
  assert.equal(css.length, 1);
  assert.equal(css[0][1], '../../shared/control-panel.css');
  assert.ok(css[0].index > html.lastIndexOf('</style>'), `${path}: shared CSS wins`);
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  const shared = scripts.filter(script => /src="[^" ]*control-panel\.js"/.test(script[1]));
  assert.equal(shared.length, 1);
  assert.match(shared[0][1], /src="\.\.\/\.\.\/shared\/control-panel\.js"/);
  assert.doesNotMatch(shared[0][1], /\b(async|defer)\b/);
  assert.ok(shared[0].index > mounts[0].index, `${path}: mount precedes synchronous scan`);
  const main = scripts.find(script => script[2].includes('function bindControl('));
  assert.ok(main && main.index > shared[0].index, `${path}: mount precedes main init`);
  assert.match(html, /<script src="\.\.\/audio-settings\.js"><\/script>/);
  for (const script of scripts.filter(script => !/\bsrc=/.test(script[1]))) {
    new vm.Script(script[2], { filename: fileURLToPath(new URL(path, academy)) });
  }

  const host = element();
  host.dataset.chessControls = JSON.stringify(config);
  let saved = JSON.stringify({ volume: 0, speed: 9 });
  const context = vm.createContext({
    window: {}, document: {
      querySelectorAll() { return [host]; }, querySelector() { return host; }, createElement: element
    },
    localStorage: { getItem() { return saved; }, setItem(key, value) { saved = value; } }
  });
  vm.runInContext(component, context);
  const api = host.chessControlPanel;
  assert.ok(api, `${path}: synchronous mounting`);
  for (const [action, id] of Object.entries(expectedIds)) assert.equal(api.controls[action].id, id);
  assert.equal(api.controls.volume.id, 'volumeRange');
  assert.equal(api.controls.speed.id, 'speedRange');
  assert.equal(api.controls.volume.value, '0');
  assert.equal(api.controls.speed.value, '9');
  for (const action of ['sound', 'narration']) {
    assert.ok(api.controls[action].classList.contains('active'));
    assert.equal(api.controls[action].attributes['aria-pressed'], 'true');
  }
  const adapter = main[2].match(/var controlPanel = [\s\S]*?controlPanel\.bind\(\{ \[action\]: handler \}\);\s*\}/);
  assert.ok(adapter, `${path}: component binding adapter`);
  vm.runInContext(adapter[0], context);
  const bindings = [...main[2].matchAll(/bindControl\('([^']+)', '(click|input)',/g)];
  const expectedBindings = path.startsWith('intro/')
    ? ['btnModeManual', 'btnModeHumanAi', 'btnModeAiAi', 'btnReset', 'btnPlay', 'btnNext', 'btnSound', 'btnVoice']
    : ['btnReset', 'btnPrev', 'btnPlay', 'btnNext', 'btnSound', 'btnVoice', 'volumeRange', 'speedRange'];
  assert.deepEqual(bindings.map(binding => binding[1]).sort(), expectedBindings.sort());
  for (const [, id, event] of bindings) {
    let calls = 0;
    context.bindControl(id, event, () => { calls++; });
    const control = Object.values(api.controls).find(control => control.id === id);
    control.dispatch(event);
    assert.equal(calls, 1, `${path}: ${id} bound exactly once`);
    assert.doesNotMatch(main[2], new RegExp(`\\b${id}\\.addEventListener\\(`));
  }
  api.controls.volume.value = '35';
  api.controls.volume.dispatch('input');
  assert.equal(JSON.parse(saved).volume, 35);
  const sliders = host.children[0].children.at(-1);
  assert.equal(sliders.className, 'chess-control-sliders');
  assert.equal(sliders.children.length, 2);
  assert.equal(sliders.children[0].children[1].id, 'volumeValue');
  assert.equal(sliders.children[0].children[1].textContent, '35');
  assert.equal(sliders.children[1].children[1].id, 'speedValue');
  if (path.startsWith('intro/')) {
    assert.equal((html.match(/id="aiPresetSelect"/g) || []).length, 0);
    assert.match(main[2], /var config = getAiPresetConfig\('master'\)/);
    assert.match(main[2], /setGameMode\('manual'\)/);
    assert.match(main[2], /setGameMode\('human_ai'\)/);
    assert.match(main[2], /setGameMode\('ai_ai'\)/);
    assert.match(main[2], /scenario\.indexOf\('-game-'\) === -1/);
  } else {
    assert.match(html, /src="\.\.\/\.\.\/shared\/academy-duel\.js"/);
    assert.match(main[2], /window\.ChessAcademyDuel\.attach\(/);
    assert.match(main[2], /initialFen = fen;/);
    assert.match(main[2], /if \(duelAdapter\) duelAdapter\.lessonChanged\(\);/);
    assert.match(main[2], /fen: initialFen, moves: state\.moveMetas\.slice/);
    assert.match(html, /<div class="right">/);
    assert.doesNotMatch(html, /<div class="right"[^>]*(?:hidden|aria-hidden)/);
    assert.match(html, /--board-size: min\(calc\(100cqw - 56px\), 560px\)/);
    assert.match(main[2], /resumeLesson: function \(\) \{ renderSolutionLines\(\); if \(state\.anno\) \{ goToPly\(-1\); startAutoplay\(\); \}/);
    assert.match(main[2], /resetLesson: function \(\) \{ renderSolutionLines\(\);/);
    assert.match(main[2], /renderPosition: function \(board, snapshot\) \{\s*renderBoardMatrix\(board\);\s*clearOverlays\(\);\s*showPopup\(null\);\s*renderDuelSolution\(snapshot\);\s*\}/);
    const scoreRenderer = main[2].match(/function renderDuelSolution\(snapshot\) \{[\s\S]*?\n      \}/);
    assert.ok(scoreRenderer, `${path}: live score renderer`);
    context.solutionLines = { innerHTML: 'stale lesson score' };
    context.initialFen = '8/8/8/8/8/8/8/8 w - - 0 12';
    vm.runInContext(scoreRenderer[0], context);
    context.renderDuelSolution({ history: ['e4', 'e5', 'Nf3'] });
    assert.equal(context.solutionLines.innerHTML, '<div class="solution-line">12. e4 e5</div><div class="solution-line current">13. Nf3</div>');
    context.initialFen = '8/8/8/8/8/8/8/8 b - - 0 12';
    context.renderDuelSolution({ history: ['e5', 'Nf3', 'Nc6'] });
    assert.equal(context.solutionLines.innerHTML, '<div class="solution-line">12... e5</div><div class="solution-line current">13. Nf3 Nc6</div>');
    context.renderDuelSolution({ history: ['e5'] });
    assert.equal(context.solutionLines.innerHTML, '<div class="solution-line current">12... e5</div>');
    context.renderDuelSolution({ history: [] });
    assert.equal(context.solutionLines.innerHTML, '', `${path}: clear stale score on reset`);
    const narrationText = main[2].match(/var text = explanationText\.textContent\.split\([^;]+;/);
    assert.ok(narrationText, `${path}: explanation narration stops at END`);
    context.explanationText = { textContent: 'Read this.\n# END\nDo not read this.' };
    vm.runInContext(narrationText[0], context);
    assert.equal(context.text, 'Read this.');
    context.explanationText.textContent = 'Read everything without a marker.';
    vm.runInContext(narrationText[0], context);
    assert.equal(context.text, context.explanationText.textContent);
    assert.match(main[2], /function renderBoardMatrix\(board\) \{\s*currentTeachingBoard = cloneBoard\(board\);/);
    for (const loader of ['loadPracticeItem', path.startsWith('endgame/') ? 'loadEndgameItem' : 'loadTacticItem']) {
      assert.match(main[2], new RegExp(`function ${loader}\\([^)]*\\) \\{\\s*initialFen = null;\\s*if \\(duelAdapter\\) duelAdapter\\.lessonChanged\\(\\);\\s*stopAutoplay\\(\\);`));
    }
    if (path.startsWith('endgame/') || path.startsWith('tactics/')) {
      assert.match(main[2], /initialFen = qdata\.fen;\s*state\.ply = -1;/);
    }
  }
  console.log(`PASS ${path}`);
}