(function () {
  'use strict';
  var key = 'cognichess:engine-settings:v1';
  var levels = [
    ['业余入门', 0, 5, 500, 1350, 16], ['业余初级', 2, 6, 600, 1450, 32],
    ['业余进阶', 4, 8, 800, 1550, 64], ['俱乐部选手', 6, 10, 1000, 1650, 64],
    ['俱乐部好手', 8, 12, 1500, 1750, 128], ['高级俱乐部', 10, 14, 2000, 1850, 128],
    ['专家级', 12, 16, 2500, 1950, 256], ['候补大师', 15, 18, 2000, 2100, 256],
    ['大师', 17, 20, 2500, 2200, 256], ['国际大师', 19, 22, 3000, 2300, 256],
    ['特级大师', 20, 25, 3000, 2400, 512]
  ];
  var presetLevels = { beginner: 2, intermediate: 4, advanced: 5, expert: 7, master: 10 };
  function defaults() {
    var data = { version: 1 };
    ['human', 'black', 'white'].forEach(function (side) {
      data[side] = { level: 10, profile: '自动', limitStrength: false, multiPv: 1, moveOverhead: 10, minThinkTime: 20, showWdl: false };
    });
    return data;
  }
  function validate(data) {
    if (!data || data.version !== 1) throw new Error('引擎设置格式不正确');
    var result = defaults();
    ['human', 'black', 'white'].forEach(function (side) {
      var item = data[side];
      if (!item || !['低配', '自动', '高性能'].includes(item.profile)) throw new Error('硬件档位不正确');
      [['level', 0, 10], ['multiPv', 1, 10], ['moveOverhead', 0, 5000], ['minThinkTime', 0, 5000]].forEach(function (field) {
        if (!Number.isInteger(item[field[0]]) || item[field[0]] < field[1] || item[field[0]] > field[2]) throw new Error('参数超出范围：' + field[0]);
        result[side][field[0]] = item[field[0]];
      });
      if (typeof item.limitStrength !== 'boolean' || typeof item.showWdl !== 'boolean') throw new Error('开关值不正确');
      result[side].profile = item.profile; result[side].limitStrength = item.limitStrength; result[side].showWdl = item.showWdl;
    });
    return result;
  }
  function read() {
    var raw = localStorage.getItem(key);
    return raw ? validate(JSON.parse(raw)) : defaults();
  }
  function saved() { return localStorage.getItem(key) !== null; }
  function save(data) { var result = validate(data); localStorage.setItem(key, JSON.stringify(result)); return result; }
  function resolve(side, preset) {
    var data = read();
    var item = data[side];
    if (!item) throw new Error('引擎角色不正确');
    var level = preset && preset !== 'settings' ? presetLevels[preset] : item.level;
    if (level == null) level = item.level;
    var config = levels[level];
    var hash = Math.max(16, config[5] * ({ '低配': 0.25, '自动': 1, '高性能': 2 }[item.profile]));
    // Browsers expose limited memory information; cap allocations for the single WASM engine.
    var memory = Number(window.navigator && window.navigator.deviceMemory) || 4;
    hash = Math.min(hash, memory <= 4 ? 128 : 512);
    return {
      level: level, skillLevel: config[1], depth: config[2], movetime: Math.max(config[3], item.minThinkTime),
      multiPv: item.multiPv, hashMb: hash, threads: 1, limitStrength: item.limitStrength, elo: config[4],
      moveOverhead: item.moveOverhead, showWdl: item.showWdl,
      levelText: '等级 ' + level + ' - ' + config[0] + '｜S' + config[1] + ' D' + config[2] + ' T' + Math.max(config[3], item.minThinkTime) + 'ms',
      preset: preset || 'settings'
    };
  }
  function commands(settings) {
    var config = Object.assign({ hashMb: 16, skillLevel: 20, multiPv: 1, limitStrength: false, elo: 2400, moveOverhead: 10, showWdl: false }, settings);
    return [
      'setoption name Hash value ' + config.hashMb,
      'setoption name Skill Level value ' + config.skillLevel,
      'setoption name MultiPV value ' + config.multiPv,
      'setoption name UCI_LimitStrength value ' + config.limitStrength,
      'setoption name UCI_Elo value ' + config.elo,
      'setoption name Move Overhead value ' + config.moveOverhead,
      'setoption name UCI_ShowWDL value ' + config.showWdl
    ];
  }
  window.ChessEngineSettings = { levels: levels, defaults: defaults, read: read, save: save, saved: saved, resolve: resolve, commands: commands };
}());