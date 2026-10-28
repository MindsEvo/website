(function () {
  'use strict';
  var settings = window.ChessEngineSettings;
  var status = document.getElementById('saveStatus');
  var draft;
  try { draft = settings.read(); }
  catch (error) { draft = settings.defaults(); status.textContent = '保存的设置无法读取：' + error.message + '；当前显示默认值，尚未覆盖原数据。'; }
  var root = document.getElementById('engineColumns');
  function node(tag, text) { var item = document.createElement(tag); if (text != null) item.textContent = text; return item; }
  function section(parent, title, color) {
    var group = node('fieldset'); group.className = 'settings-section'; group.style.setProperty('--section-color', color);
    group.appendChild(node('legend', title)); parent.appendChild(group); return group;
  }
  function field(parent, side, key, title, type, options) {
    var label = node('label'); label.className = type === 'checkbox' ? 'check' : 'field';
    var input = node(type === 'select' ? 'select' : 'input'); input.dataset.field = key; input.dataset.side = side;
    if (type !== 'select') input.type = type;
    if (options && options.choices) options.choices.forEach(function (choice) { var option = node('option', choice.label ?? choice); option.value = choice.value ?? choice; input.appendChild(option); });
    ['min', 'max', 'step'].forEach(function (attribute) { if (options && options[attribute] != null) input[attribute] = options[attribute]; });
    if (options && options.readonly) input.readOnly = true;
    if (options && options.disabled) { input.disabled = true; label.classList.add('disabled'); input.title = options.reason || '当前浏览器引擎不支持'; }
    if (type === 'checkbox') label.append(input, node('span', title)); else label.append(node('span', title), input);
    parent.appendChild(label); return input;
  }
  function refresh(side) {
    var panel = root.querySelector('[data-engine="' + side + '"]');
    var config = settings.levels[draft[side].level];
    var memory = Number(navigator.deviceMemory) || 4;
    var hash = Math.min(memory <= 4 ? 128 : 512, Math.max(16, config[5] * ({ '低配': 0.25, '自动': 1, '高性能': 2 }[draft[side].profile])));
    panel.querySelectorAll('[data-field]').forEach(function (input) {
      var key = input.dataset.field;
      if (Object.prototype.hasOwnProperty.call(draft[side], key)) {
        if (input.type === 'checkbox') input.checked = draft[side][key]; else input.value = draft[side][key];
      }
      if (key === 'threads') input.value = 1;
      if (key === 'hash') input.value = hash;
      if (key === 'skill') input.value = config[1];
      if (key === 'elo') input.value = config[4];
      if (key === 'depth') input.value = config[2];
      if (key === 'movetime') input.value = Math.max(config[3], draft[side].minThinkTime);
    });
  }
  [['human', '人机对弈模式', '人机模式设置', '#1a73e8'], ['black', 'AI/AI 对弈模式', '黑方引擎', '#424242'], ['white', 'AI/AI 对弈模式', '白方引擎', '#77818d']].forEach(function (entry) {
    var side = entry[0]; var column = node('section'); column.className = 'engine-column'; column.dataset.engine = side; column.style.setProperty('--accent', entry[3]);
    var title = node('p', entry[1]); title.className = 'mode-title'; column.append(title, node('h2', entry[2])); root.appendChild(column);
    var basic = section(column, '基础设置', '#1a73e8');
    field(basic, side, 'profile', '硬件档位', 'select', { choices: ['低配', '自动', '高性能'] });
    field(basic, side, 'threads', '线程数', 'number', { readonly: true });
    field(basic, side, 'hash', '哈希表 MB', 'number', { readonly: true });
    var nnue = field(basic, side, 'nnue', '启用 NNUE（内置）', 'checkbox', { disabled: true, reason: 'Stockfish 19 Lite 内置 NNUE，不支持关闭' }); nnue.checked = true;
    field(basic, side, 'evalFile', 'NNUE 文件', 'text', { disabled: true, reason: '浏览器版使用内置网络，不支持外部文件路径' }).value = '内置 nn-61e7af4bb97d';
    var strength = section(column, '棋力控制', '#aa5c09');
    field(strength, side, 'level', 'AI等级', 'select', { choices: settings.levels.map(function (config, index) { return { value: index, label: '等级 ' + index + ' - ' + config[0] + ' (' + config[4] + ' ELO)' }; }) });
    field(strength, side, 'skill', '技能等级', 'number', { readonly: true });
    field(strength, side, 'limitStrength', '限制棋力', 'checkbox');
    field(strength, side, 'elo', 'Elo等级', 'number', { readonly: true });
    field(strength, side, 'depth', '搜索深度', 'number', { readonly: true });
    field(strength, side, 'movetime', '思考时间 ms', 'number', { readonly: true });
    var advanced = section(column, '高级选项', '#2e7d32');
    field(advanced, side, 'ponder', '后台思考', 'checkbox', { disabled: true, reason: '当前对弈流程未实现 ponder / ponderhit' });
    field(advanced, side, 'multiPv', '变化数', 'number', { min: 1, max: 10, step: 1 });
    field(advanced, side, 'moveOverhead', '着法开销 ms', 'number', { min: 0, max: 5000, step: 1 });
    field(advanced, side, 'minThinkTime', '最小思考 ms', 'number', { min: 0, max: 5000, step: 1 });
    field(advanced, side, 'slowMover', '时间分配', 'number', { disabled: true }).value = 100;
    field(advanced, side, 'chess960', 'Chess960', 'checkbox', { disabled: true, reason: '网页棋盘规则暂不支持 Chess960' });
    var debug = section(column, '输出与调试', '#755199');
    field(debug, side, 'contempt', '轻视分数', 'number', { disabled: true }).value = 0;
    field(debug, side, 'syzygy', '残局库', 'text', { disabled: true, reason: '当前 WASM 不支持本地 Syzygy 文件路径' }).value = '未设置';
    field(debug, side, 'syzygyDepth', '残局深度', 'number', { disabled: true }).value = 1;
    field(debug, side, 'splitDepth', '分裂深度', 'number', { disabled: true }).value = 0;
    field(debug, side, 'analyseMode', '分析模式', 'checkbox', { disabled: true });
    field(debug, side, 'showWdl', '显示 WDL', 'checkbox');
    refresh(side);
  });
  function updateLocalizedValues() {
    var english = window.ChessI18n && window.ChessI18n.getLanguage() === 'en';
    root.querySelectorAll('[data-field="evalFile"]').forEach(function (input) {
      input.value = english ? 'Built-in nn-61e7af4bb97d' : '内置 nn-61e7af4bb97d';
    });
    root.querySelectorAll('[data-field="syzygy"]').forEach(function (input) {
      input.value = english ? 'Not Set' : '未设置';
    });
  }
  updateLocalizedValues();
  window.addEventListener('chesslanguagechange', updateLocalizedValues);
  root.addEventListener('change', function (event) {
    var input = event.target;
    if (!input.dataset.field || input.disabled || input.readOnly) return;
    var side = input.dataset.side; var key = input.dataset.field;
    draft[side][key] = input.type === 'checkbox' ? input.checked : ['level', 'multiPv', 'moveOverhead', 'minThinkTime'].includes(key) ? Number(input.value) : input.value;
    refresh(side); status.textContent = '设置已修改，尚未保存';
  });
  document.getElementById('engineForm').addEventListener('submit', function (event) {
    event.preventDefault();
    try { draft = settings.save(draft); status.textContent = '三组设置已保存，下次引擎分析生效'; }
    catch (error) { status.textContent = '保存失败：' + error.message; }
  });
  document.getElementById('resetButton').addEventListener('click', function () {
    if (!window.confirm('恢复三组默认参数？点击保存后生效。')) return;
    draft = settings.defaults(); ['human', 'black', 'white'].forEach(refresh); status.textContent = '已恢复默认参数，尚未保存';
  });
  var dialog = document.getElementById('helpDialog');
  document.getElementById('helpButton').addEventListener('click', function () { dialog.showModal(); });
  document.getElementById('closeHelp').addEventListener('click', function () { dialog.close(); });
  document.getElementById('confirmHelp').addEventListener('click', function () { dialog.close(); });
}());