import { getPieceLabel, RED } from '../core.mjs';
import { getLessonMoveFeedback } from './lesson-move-feedback.mjs';

export function explanationContent(text) {
  return String(text).split(/#\s*END\b/i)[0].split(/\r?\n/)
    .filter(line => !line.trim().startsWith('//')).join('\n')
    .replace(/^#+\s*/gm, '').trim();
}

export function createBoardAudio(panel, { explanation, button, onPause = () => {}, onStatus }) {
  let explaining = false;
  let generation = 0;
  let context;
  let currentText = '';
  if (!button && explanation) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'xiangqi-explanation-audio';
    const heading = explanation.previousElementSibling;
    if (heading?.matches('h2, h3, label')) heading.append(button);
    else explanation.before(button);
  }
  const readText = () => explanationContent(explanation?.value ?? explanation?.textContent ?? '');
  const available = text => Boolean(text) && !/^(请选择|正在|载入|该.*暂无|暂无|原题库尚未|棋谱载入失败)/.test(text);
  function updateButton() {
    if (!button) return;
    button.textContent = explaining ? '停止解说' : '播放解说';
    button.title = button.textContent;
    button.setAttribute('aria-label', button.textContent);
    button.setAttribute('aria-pressed', String(explaining));
    button.disabled = !available(readText());
  }
  function stop() {
    generation += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    explaining = false;
    updateButton();
  }
  function refresh() {
    const text = readText();
    if (text !== currentText && explaining) stop();
    currentText = text;
    updateButton();
  }
  function speak(text, explicit = false) {
    if (!text || (!explicit && !panel.getVoiceEnabled())) return;
    if (!('speechSynthesis' in window)) {
      onStatus('当前浏览器不支持语音播放。');
      return;
    }
    stop();
    if (panel.getVolume() === 0) {
      if (explicit) onStatus('音量为零，请调高音量后播放解说。');
      return;
    }
    explaining = explicit;
    updateButton();
    const token = generation;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.volume = panel.getVolume() / 100;
    utterance.rate = 0.85 + (panel.getSpeed() - 5) * 0.03;
    utterance.onend = () => {
      if (token !== generation) return;
      explaining = false;
      updateButton();
    };
    utterance.onerror = event => {
      if (token !== generation || ['canceled', 'interrupted'].includes(event.error)) return;
      explaining = false;
      updateButton();
      onStatus(`语音播放失败：${event.error || '未知错误'}`);
    };
    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      explaining = false;
      updateButton();
      onStatus(`语音播放失败：${error.message}`);
    }
  }
  function effect(kind = 'move') {
    if (!panel.getSoundEnabled() || panel.getVolume() === 0) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) {
      onStatus('当前浏览器不支持音效。');
      return;
    }
    try {
      context ||= new Audio();
      if (context.state === 'suspended') context.resume().catch(error => onStatus(`音效启动失败：${error.message}`));
      const tones = { move: [520], capture: [300, 450], check: [660, 880], win: [523, 659, 784] }[kind];
      tones.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + index * 0.09;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(panel.getVolume() / 100 * 0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(start);
        oscillator.stop(start + 0.08);
      });
    } catch (error) {
      onStatus(`音效播放失败：${error.message}`);
    }
  }
  function move(game, notation = '') {
    stop();
    const feedback = getLessonMoveFeedback(game);
    const last = game.history.at(-1);
    effect(feedback.state.winner ? 'win' : feedback.state.inCheck ? 'check' : feedback.capture ? 'capture' : 'move');
    const moveText = notation || (last ? `${last.turn === RED ? '红方' : '黑方'}${getPieceLabel(last.piece)}走棋` : '');
    speak([moveText, feedback.text].filter(Boolean).join('；'));
  }
  button?.addEventListener('click', () => {
    if (explaining) { stop(); return; }
    refresh();
    if (!available(readText())) return;
    onPause();
    speak(readText(), true);
  });
  panel.controls.voice.addEventListener('click', () => {
    if (!panel.getVoiceEnabled() && !explaining) stop();
  });
  panel.controls.volume.addEventListener('input', () => {
    if (panel.getVolume() === 0) stop();
  });
  for (const action of ['play', 'reset', 'undo', 'redo', 'side']) {
    panel.controls[action].addEventListener('click', stop, { capture: true });
  }
  panel.controls.voice.closest('nav')?.querySelectorAll('[data-mode]').forEach(link => link.addEventListener('click', stop));
  explanation?.addEventListener('input', () => { stop(); refresh(); });
  const observer = new MutationObserver(refresh);
  if (explanation && !('value' in explanation)) observer.observe(explanation, { childList: true, subtree: true, characterData: true });
  window.addEventListener('pagehide', () => {
    stop();
    observer.disconnect();
    if (context) context.close().catch(error => console.warn('关闭音效失败', error));
  });
  refresh();
  return { move, speak, effect, stop, refresh, button };
}
