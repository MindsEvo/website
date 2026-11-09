const MODES = [
  { id: 'manual', label: '双人手动', icon: '👥', href: '../play/index.html' },
  { id: 'human-ai', label: '人机对弈', icon: '👤', href: '../play/human-ai.html' },
  { id: 'ai-ai', label: 'AI 对弈', icon: '🤖', href: '../play/ai-ai.html' }
];

export function mountBoardControlPanel(container, { mode = 'manual', side = 'red', hrefs = {}, onAction = () => {}, onModeChange } = {}) {
  container.replaceChildren();
  container.classList.add('xiangqi-control-panel');
  container.setAttribute('aria-label', '棋盘通用控制面板');

  const controls = {};
  const addButton = (action, icon, label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'xiangqi-control-button';
    button.dataset.control = action;
    button.textContent = icon;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.addEventListener('click', () => {
      if (action === 'play') setPlaying(!playing);
      if (action === 'sound') setSound(!soundEnabled);
      if (action === 'side') setSide(currentSide === 'red' ? 'black' : 'red');
      onAction(action, button);
    });
    container.append(button);
    controls[action] = button;
    return button;
  };

  addButton('reset', '↻', '重置棋局');
  addButton('play', '▶', '播放');
  addButton('undo', '↶', '上一步');
  addButton('redo', '→', '下一步');
  controls.undo.disabled = true;
  controls.redo.disabled = true;
  addButton('sound', '◖))', '关闭音效');
  addButton('voice', '▧', '朗读状态');

  const divider = document.createElement('span');
  divider.className = 'xiangqi-control-divider';
  divider.setAttribute('aria-hidden', 'true');
  container.append(divider);

  for (const item of MODES) {
    const link = document.createElement('a');
    link.className = `xiangqi-control-button xiangqi-mode-button${item.id === mode ? ' is-active' : ''}`;
    link.href = hrefs[item.id] || item.href;
    link.dataset.mode = item.id;
    link.textContent = item.icon;
    link.title = item.label;
    link.setAttribute('aria-label', item.label);
    if (item.id === mode) link.setAttribute('aria-current', 'page');
    if (onModeChange) {
      link.addEventListener('click', event => {
        event.preventDefault();
        onModeChange(item.id);
      });
    }
    container.append(link);
  }

  addButton('side', '⇄', '切换执棋方，当前红方');

  const volume = addRange(container, 'volume', '音量', 0, 100, 80);
  const speed = addRange(container, 'speed', '速度', 1, 10, 5);
  controls.volume = volume;
  controls.speed = speed;

  let playing = false;
  let soundEnabled = true;
  let currentSide = side;
  const setPlaying = value => {
    playing = Boolean(value);
    const button = controls.play;
    button.textContent = playing ? 'Ⅱ' : '▶';
    button.title = playing ? '停止播放' : '播放';
    button.setAttribute('aria-label', button.title);
    button.setAttribute('aria-pressed', String(playing));
  };
  const setSide = value => {
    currentSide = value === 'black' ? 'black' : 'red';
    const button = controls.side;
    const sideName = currentSide === 'red' ? '红方' : '黑方';
    button.title = `切换执棋方，当前${sideName}`;
    button.setAttribute('aria-label', button.title);
    const boardSurface = container.parentElement?.querySelector('.standard-board-surface');
    boardSurface?.classList.toggle('xiangqi-board-flipped', currentSide === 'black');
    const sideLabel = container.parentElement?.querySelector('.board-side-label, .human-ai-side-label, .teaching-side-label, .gene-side-label');
    if (sideLabel) sideLabel.textContent = `${sideName}走棋`;
  };
  const setSound = value => {
    soundEnabled = Boolean(value);
    controls.sound.title = soundEnabled ? '关闭音效' : '开启音效';
    controls.sound.setAttribute('aria-label', controls.sound.title);
    controls.sound.setAttribute('aria-pressed', String(soundEnabled));
  };
  volume.addEventListener('input', () => onAction('volume', volume.value));
  speed.addEventListener('input', () => onAction('speed', speed.value));
  setSide(side);

  return {
    controls,
    setPlaying,
    setSide,
    setSound,
    setMode(value) {
      for (const link of container.querySelectorAll('a[data-mode]')) {
        const active = link.dataset.mode === value;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
    },
    getSide: () => currentSide,
    getSoundEnabled: () => soundEnabled,
    getVolume: () => Number(volume.value),
    getSpeed: () => Number(speed.value)
  };
}

function addRange(container, action, label, min, max, value) {
  const wrapper = document.createElement('label');
  wrapper.className = 'xiangqi-control-range';
  const text = document.createElement('span');
  text.textContent = label;
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);
  input.dataset.control = action;
  input.setAttribute('aria-label', label);
  wrapper.append(text, input);
  container.append(wrapper);
  return input;
}
