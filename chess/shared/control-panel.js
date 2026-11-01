(function (root) {
  'use strict';
  var settingsKey = 'chessAcademyAudioSettings';
  var definitions = {
    reset: ['\u21ba', '\u91cd\u7f6e'],
    play: ['\u25b6', '\u64ad\u653e / \u6682\u505c'],
    previous: ['\u21b6', '\u4e0a\u4e00\u6b65 / \u6094\u68cb'],
    next: ['\u2192', '\u4e0b\u4e00\u6b65'],
    sound: ['\ud83d\udd0a', '\u97f3\u6548\u5f00\u5173'],
    narration: ['\ud83c\udfa4', '\u8bed\u97f3\u5f00\u5173'],
    manual: ['\ud83d\udc65', '\u624b\u52a8\u6a21\u5f0f'],
    humanAi: ['\ud83d\udc64', '\u4eba\u673a\u6a21\u5f0f'],
    aiAi: ['\ud83e\udd16', 'AI-AI'],
    color: ['\u26aa', '\u6301\u5b50\u989c\u8272'],
    hints: ['\u2726', '\u9ad8\u4eae'],
    logs: ['\ud83e\uddfe', '\u5bfc\u51fa\u65e5\u5fd7']
  };
  function savedSettings() {
    try { return JSON.parse(localStorage.getItem(settingsKey) || '{}'); }
    catch (_) { return {}; }
  }
  function mount(host, options) {
    if (host.chessControlPanel) return host.chessControlPanel;
    options = options || {};
    host.classList.add('chess-control-panel');
    host.setAttribute('role', 'group');
    host.setAttribute('aria-label', '\u56fd\u9645\u8c61\u68cb\u63a7\u5236\u9762\u677f');
    host.replaceChildren();
    var controls = {};
    var row = document.createElement('div');
    row.className = 'chess-controls-row';
    host.appendChild(row);
    Object.keys(definitions).filter(function (action) { return options.ids && options.ids[action]; }).forEach(function (action) {
      var definition = definitions[action];
      if (!definition) return;
      var button = document.createElement('button');
      button.type = 'button';
      button.id = options.ids[action];
      button.className = 'ctrl-btn';
      button.dataset.chessAction = action;
      button.textContent = definition[0];
      button.title = definition[1];
      button.setAttribute('aria-label', definition[1]);
      if (['sound', 'narration'].includes(action)) {
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
      }
      controls[action] = button;
      row.appendChild(button);
    });
    var saved = savedSettings();
    var sliders = document.createElement('div');
    sliders.className = 'chess-control-sliders';
    row.appendChild(sliders);
    ['volume', 'speed'].forEach(function (name) {
      var label = document.createElement('label');
      label.className = 'chess-control-slider';
      var caption = name === 'volume' ? '\u97f3\u91cf:' : '\u901f\u5ea6:';
      label.textContent = caption;
      var input = document.createElement('input');
      input.type = 'range';
      input.id = name + 'Range';
      input.min = name === 'volume' ? '0' : '1';
      input.max = name === 'volume' ? '100' : '10';
      var fallback = name === 'volume' ? 80 : 5;
      input.value = String(Math.max(Number(input.min), Math.min(Number(input.max), Number(saved[name]) || fallback)));
      if (saved[name] === 0 && name === 'volume') input.value = '0';
      var value = document.createElement('span');
      value.id = name + 'Value';
      value.className = 'num';
      value.textContent = input.value;
      input.title = label.textContent + ' ' + input.value;
      label.append(input, value);
      sliders.appendChild(label);
      controls[name] = input;
      input.addEventListener('input', function () {
        value.textContent = input.value;
        input.title = caption + ' ' + input.value;
        var settings = savedSettings();
        settings[name] = Number(input.value);
        try { localStorage.setItem(settingsKey, JSON.stringify(settings)); } catch (_) {}
      });
    });
    var cleanups = [];
    var api = {
      controls: controls,
      bind: function (actions) {
        Object.keys(actions).forEach(function (action) {
          var control = controls[action];
          if (!control || typeof actions[action] !== 'function') return;
          var event = ['volume', 'speed'].includes(action) ? 'input' : 'click';
          control.addEventListener(event, actions[action]);
          cleanups.push(function () { control.removeEventListener(event, actions[action]); });
        });
        return api;
      },
      setState: function (state) {
        Object.keys(state).forEach(function (action) {
          var control = controls[action];
          if (!control) return;
          var value = state[action];
          if (typeof value === 'boolean') {
            control.classList.toggle('active', value);
            control.setAttribute('aria-pressed', String(value));
            if (action === 'play') control.textContent = value ? '\u23f8' : '\u25b6';
          } else if (value && typeof value === 'object') {
            if (value.disabled !== undefined) control.disabled = value.disabled;
            if (value.hidden !== undefined) control.hidden = value.hidden;
          }
        });
      },
      destroy: function () { cleanups.forEach(function (cleanup) { cleanup(); }); host.replaceChildren(); delete host.chessControlPanel; }
    };
    host.chessControlPanel = api;
    return api;
  }
  function initialize() {
    document.querySelectorAll('[data-chess-controls]').forEach(function (host) {
      mount(host, JSON.parse(host.dataset.chessControls));
    });
  }
  root.ChessControlPanel = { mount: mount, initialize: initialize };
  initialize();
})(window);