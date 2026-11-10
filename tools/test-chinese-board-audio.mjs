import assert from 'node:assert/strict';
import { createBoardAudio, explanationContent } from '../chinese-chess/shared/board-audio.mjs';
import { createGameFromFen, makeMove } from '../chinese-chess/core.mjs';

class Element extends EventTarget {
  constructor(text = '') {
    super();
    this.textContent = text;
    this.attributes = new Map();
  }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name); }
  closest() { return null; }
  before() {}
  click() { if (!this.disabled) this.dispatchEvent(new Event('click')); }
}

const original = { window: globalThis.window, document: globalThis.document,
  MutationObserver: globalThis.MutationObserver, SpeechSynthesisUtterance: globalThis.SpeechSynthesisUtterance };
const spoken = [];
const messages = [];
let cancelled = 0;
let pauses = 0;
let tones = 0;
let voice = true;
let sound = true;
let volume = 80;
class Audio {
  state = 'running';
  currentTime = 0;
  destination = {};
  createOscillator() {
    tones += 1;
    return { frequency: {}, connect() {}, disconnect() {}, start() {}, stop() {} };
  }
  createGain() {
    return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} };
  }
}
try {
  globalThis.window = Object.assign(new EventTarget(), {
    speechSynthesis: { speak(utterance) { spoken.push(utterance); }, cancel() { cancelled += 1; } },
    AudioContext: Audio
  });
  globalThis.document = { createElement: () => new Element() };
  globalThis.MutationObserver = class { observe() {} disconnect() {} };
  globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  const controls = Object.fromEntries(['voice', 'sound', 'play', 'reset', 'undo', 'redo', 'side', 'volume']
    .map(name => [name, new Element()]));
  const panel = { controls, getVoiceEnabled: () => voice, getSoundEnabled: () => sound,
    getVolume: () => volume, getSpeed: () => 5 };
  const explanation = new Element('请选择棋局以显示解说。');
  const audio = createBoardAudio(panel, {
    explanation, onPause() { pauses += 1; }, onStatus(text) { messages.push(text); }
  });
  assert.equal(audio.button.disabled, true);
  explanation.textContent = '# 解说\n将帅不能见面。\n# END\n内部标记';
  audio.refresh();
  assert.equal(explanationContent(explanation.textContent), '解说\n将帅不能见面。');
  voice = false;
  sound = false;
  audio.button.click();
  assert.equal(pauses, 1);
  assert.equal(spoken.at(-1).text, '解说\n将帅不能见面。');
  assert.equal(audio.button.textContent, '停止解说');
  assert.equal(spoken.at(-1).volume, 0.8);
  controls.voice.click();
  assert.equal(audio.button.textContent, '停止解说');
  const finished = spoken.at(-1).onend;
  audio.button.click();
  assert.equal(audio.button.textContent, '播放解说');
  audio.button.click();
  finished();
  assert.equal(audio.button.textContent, '停止解说', 'stale completion cannot reset current playback');
  spoken.at(-1).onend();
  assert.equal(audio.button.textContent, '播放解说');
  audio.button.click();
  explanation.textContent = '新的解说';
  audio.refresh();
  assert.equal(audio.button.textContent, '播放解说');
  audio.button.click();
  controls.play.click();
  assert.equal(audio.button.textContent, '播放解说');
  audio.button.click();
  controls.reset.click();
  assert.equal(audio.button.textContent, '播放解说');
  const game = createGameFromFen('9/5k3/9/9/9/9/4R4/9/4K4/9 r - - 0 1');
  assert.ok(makeMove(game, { row: 6, col: 4 }, { row: 6, col: 5 }));
  const before = spoken.length;
  sound = true;
  audio.move(game, '车五平四');
  assert.equal(spoken.length, before);
  assert.equal(tones, 3, 'winner sound is independent of voice');
  sound = false;
  voice = true;
  audio.move(game, '车五平四');
  assert.equal(tones, 3);
  assert.match(spoken.at(-1).text, /车五平四；将死，红方获胜/);
  voice = false;
  controls.voice.click();
  assert.ok(cancelled > 0);
  audio.button.click();
  volume = 0;
  controls.volume.dispatchEvent(new Event('input'));
  assert.equal(audio.button.textContent, '播放解说');
  audio.button.click();
  assert.match(messages.at(-1), /音量为零/);
  volume = 80;
  audio.button.click();
  spoken.at(-1).onerror({ error: 'synthesis-failed' });
  assert.equal(audio.button.textContent, '播放解说');
  assert.match(messages.at(-1), /语音播放失败/);
  delete window.speechSynthesis;
  audio.button.click();
  assert.match(messages.at(-1), /不支持语音/);
  explanation.textContent = '该解法暂无配套解说。';
  audio.refresh();
  assert.equal(audio.button.disabled, true);
  console.log('Validated independent sound/voice, explicit commentary, stop/end/stale events, source changes, mutual exclusion, volume and unsupported speech.');
} finally {
  for (const [name, value] of Object.entries(original)) {
    if (value === undefined) delete globalThis[name];
    else globalThis[name] = value;
  }
}
