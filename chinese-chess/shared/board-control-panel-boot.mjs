import { mountBoardControlPanel } from './board-control-panel.mjs';

const playHrefs = {
  manual: '../../play/index.html',
  'human-ai': '../../play/human-ai.html',
  'ai-ai': '../../play/ai-ai.html'
};
const rootgeneHrefs = {
  manual: '../play/index.html',
  'human-ai': '../play/human-ai.html',
  'ai-ai': '../play/ai-ai.html'
};

const existingPanel = document.getElementById('boardToolbar');
if (existingPanel) {
  mountBoardControlPanel(existingPanel, {
    mode: 'manual',
    hrefs: playHrefs,
    onAction(action) {
      existingPanel.dispatchEvent(new CustomEvent('xiangqi:board-control', { bubbles: true, detail: { action } }));
      if (action === 'reset') location.reload();
      if (action === 'voice') speakBoardStatus();
    }
  });
}

const lessonFrame = document.querySelector('.lesson-board-frame');
if (lessonFrame) {
  const panel = document.createElement('nav');
  panel.className = 'xiangqi-control-panel';
  panel.setAttribute('aria-label', '棋盘通用控制面板');
  lessonFrame.after(panel);
  mountBoardControlPanel(panel, { mode: 'manual', hrefs: playHrefs, onAction: dispatchControl(panel) });
}

const geneBoardWrap = document.querySelector('.gene-board-wrap');
if (geneBoardWrap) {
  const panel = document.createElement('nav');
  panel.className = 'xiangqi-control-panel';
  panel.setAttribute('aria-label', '棋盘通用控制面板');
  geneBoardWrap.after(panel);
  mountBoardControlPanel(panel, { mode: 'manual', hrefs: rootgeneHrefs, onAction: dispatchControl(panel) });
}

function dispatchControl(panel) {
  return action => panel.dispatchEvent(new CustomEvent('xiangqi:board-control', { bubbles: true, detail: { action } }));
}

function speakBoardStatus() {
  if (!('speechSynthesis' in window)) return;
  const text = document.getElementById('boardLessonStatus')?.textContent || document.getElementById('demoInstruction')?.textContent || '中国象棋棋盘';
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  window.speechSynthesis.speak(utterance);
}
