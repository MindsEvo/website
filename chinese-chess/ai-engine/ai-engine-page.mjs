import {
  DEFAULT_ENGINE_SETTINGS,
  loadEngineSettings,
  saveEngineSettings
} from '../shared/engine-settings.mjs';

const form = document.getElementById('engineSettingsForm');
const settingsStatus = document.getElementById('settingsStatus');
const engineHealth = document.getElementById('engineHealth');
const testStatus = document.getElementById('testStatus');
const testResult = document.getElementById('testResult');
const testButton = document.getElementById('testEngine');
const checkButton = document.getElementById('checkEngine');
const helpDialog = document.getElementById('engineHelpDialog');
const fields = Object.fromEntries(
  [...form.elements].filter(element => element.name).map(element => [element.name, element])
);

document.getElementById('engineHelpButton').addEventListener('click', () => helpDialog.showModal());

try {
  renderSettings(loadEngineSettings());
} catch (error) {
  showStatus(settingsStatus, `读取设置失败：${error.message}`, 'error');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    const saved = saveEngineSettings(Object.fromEntries(
      Object.entries(fields).map(([name, field]) => [name, Number(field.value)])
    ));
    renderSettings(saved);
    showStatus(settingsStatus, '已保存；后续新搜索将使用此最高设置。', 'success');
  } catch (error) {
    showStatus(settingsStatus, `保存失败：${error.message}`, 'error');
  }
});

document.getElementById('resetEngineSettings').addEventListener('click', () => {
  try {
    const saved = saveEngineSettings(DEFAULT_ENGINE_SETTINGS);
    renderSettings(saved);
    showStatus(settingsStatus, '已恢复推荐默认值。', 'success');
  } catch (error) {
    showStatus(settingsStatus, `恢复失败：${error.message}`, 'error');
  }
});

checkButton.addEventListener('click', checkEngine);
testButton.addEventListener('click', testEngine);
checkEngine();

function renderSettings(settings) {
  for (const [name, value] of Object.entries(settings)) fields[name].value = String(value);
}

function showStatus(element, message, state) {
  element.textContent = message;
  element.dataset.state = state;
}

async function checkEngine() {
  checkButton.disabled = true;
  renderHealth({ engine: '正在检测…', nnue: '正在检测…', options: '正在检测…' });
  try {
    const response = await fetch('http://localhost:8787/api/v1/chinese-chess/engine/health');
    const status = await response.json();
    if (!response.ok) throw new Error(status.error || `引擎检测失败 (${response.status})`);
    renderHealth({
      engine: status.available ? `可用${status.ready ? ' · 已启动' : ' · 将在搜索时启动'}` : '未找到引擎程序',
      nnue: status.nnueAvailable ? '已找到 Pikafish NNUE' : '未找到 NNUE 文件',
      options: status.supportedOptions?.length ? status.supportedOptions.join('、') : '尚未握手（搜索后刷新可查看）',
      engineState: status.available ? 'success' : 'error',
      nnueState: status.nnueAvailable ? 'success' : 'error'
    });
  } catch (error) {
    renderHealth({
      engine: `无法连接：${error.message}`,
      nnue: '服务不可用',
      options: '请启动本地引擎服务（端口 8787）',
      engineState: 'error',
      nnueState: 'error'
    });
  } finally {
    checkButton.disabled = false;
  }
}

function renderHealth({ engine, nnue, options, engineState = '', nnueState = '' }) {
  engineHealth.replaceChildren(
    healthRow('Pikafish', engine, engineState),
    healthRow('NNUE 网络', nnue, nnueState),
    healthRow('支持的引擎选项', options)
  );
}

function healthRow(label, value, state) {
  const row = document.createElement('div');
  const term = document.createElement('dt');
  const detail = document.createElement('dd');
  term.textContent = label;
  detail.textContent = value;
  if (state) detail.dataset.state = state;
  row.append(term, detail);
  return row;
}

async function testEngine() {
  testButton.disabled = true;
  showStatus(testStatus, '正在用当前最高设置分析…', '');
  testResult.textContent = '正在连接本地 Pikafish 服务…';
  try {
    const settings = loadEngineSettings();
    const fen = document.getElementById('testFen').value.trim();
    const turn = fen.split(/\s+/)[1];
    if (turn !== 'w' && turn !== 'b') throw new Error('FEN 必须指定行棋方 w 或 b。');
    const response = await fetch('http://localhost:8787/api/v1/chinese-chess/engine/ai-ai/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fen,
        side: turn === 'w' ? 'red' : 'black',
        settings
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `搜索失败 (${response.status})`);
    const info = result.info || {};
    testResult.textContent = [
      `最佳着法：${result.bestMove || '无'}`,
      `请求设置：${formatSettings(result.settings || settings)}`,
      `实际搜索：深度 ${info.depth ?? '未知'} · ${info.time ?? '未知'} ms · ${info.nodes ?? '未知'} 节点`,
      `主变化：${info.pv?.join(' ') || result.bestMove || '无'}`
    ].join('\n');
    showStatus(testStatus, '测试完成', 'success');
    await checkEngine();
  } catch (error) {
    testResult.textContent = error.message || 'Pikafish 搜索测试失败。';
    showStatus(testStatus, `测试失败：${error.message}`, 'error');
  } finally {
    testButton.disabled = false;
  }
}

function formatSettings(settings) {
  return `${settings.threads} 线程 · ${settings.hash} MB Hash · 深度 ${settings.depth} · ${settings.movetime} ms · MultiPV ${settings.multiPv}`;
}
