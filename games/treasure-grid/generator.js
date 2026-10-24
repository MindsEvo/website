'use strict';

/**
 * Treasure Grid — session GENERATOR (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Location items flash treasure positions. Path items show one connected route
 * and require the exact shown route to be rebuilt after it disappears. G2 path
 * items replace one interior step with another cell adjacent to its neighbours.
 */
var TG_GEN = (function () {

  function rngFor(seed) {
    if (seed === undefined || seed === null) { return Math.random; }
    var s = (Number(seed) >>> 0) || 1;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function shuffled(list, rnd) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function cellsFor(size) {
    var cells = [];
    for (var i = 1; i <= size * size; i++) { cells.push(i); }
    return cells;
  }

  function neighbours(cell, size) {
    var index = cell - 1;
    var row = Math.floor(index / size);
    var col = index % size;
    var out = [];
    if (row > 0) { out.push(cell - size); }
    if (row < size - 1) { out.push(cell + size); }
    if (col > 0) { out.push(cell - 1); }
    if (col < size - 1) { out.push(cell + 1); }
    return out;
  }

  function buildRoute(size, length, rnd) {
    var starts = shuffled(cellsFor(size), rnd);
    for (var s = 0; s < starts.length; s++) {
      var route = [starts[s]];
      while (route.length < length) {
        var choices = shuffled(neighbours(route[route.length - 1], size), rnd)
          .filter(function (cell) { return route.indexOf(cell) < 0; });
        if (!choices.length) { break; }
        route.push(choices[0]);
      }
      if (route.length === length) { return route; }
    }
    return null;
  }

  function findUpdate(route, size, rnd) {
    var candidates = [];
    for (var i = 1; i < route.length - 1; i++) {
      var before = neighbours(route[i - 1], size);
      var after = neighbours(route[i + 1], size);
      var alternatives = before.filter(function (cell) {
        return after.indexOf(cell) >= 0 && route.indexOf(cell) < 0;
      });
      shuffled(alternatives, rnd).forEach(function (cell) {
        candidates.push({ index: i, from: route[i], to: cell });
      });
    }
    return candidates.length ? shuffled(candidates, rnd)[0] : null;
  }

  function buildLocationQuestion(gradeCode, cfg, rnd) {
    var cellNums = cellsFor(cfg.gridSize);
    var treasurePositions = shuffled(cellNums, rnd).slice(0, cfg.treasureCount);
    var nonTreasure = cellNums.filter(function (n) {
      return treasurePositions.indexOf(n) < 0;
    });
    var distractors = shuffled(nonTreasure, rnd)
      .slice(0, cfg.optionCount - treasurePositions.length);
    var types = {};

    treasurePositions.forEach(function (n) { types[n] = 'treasure'; });
    distractors.forEach(function (n) { types[n] = 'empty_cell'; });

    return {
      gradeCode: gradeCode,
      mode: 'location',
      gridSize: cfg.gridSize,
      total: cfg.gridSize * cfg.gridSize,
      treasurePositions: treasurePositions,
      target: treasurePositions[0],
      exposureMs: cfg.exposureMs,
      delayMs: cfg.delayMs,
      options: shuffled(treasurePositions.concat(distractors), rnd),
      answer: treasurePositions[0],
      answers: treasurePositions.slice(),
      optionTypes: types,
      hintZh: '记住宝藏出现的格子编号',
      hintEn: 'Remember the number of the cell that held the treasure'
    };
  }

  function buildPathQuestion(gradeCode, cfg, rnd) {
    var originalRoute = null;
    var update = null;
    var attempts = 0;

    while (attempts < 30 && !originalRoute) {
      attempts++;
      var candidate = buildRoute(cfg.gridSize, cfg.pathLength, rnd);
      if (!candidate) { continue; }
      if (cfg.pathMode === 'update') {
        update = findUpdate(candidate, cfg.gridSize, rnd);
        if (!update) { continue; }
      }
      originalRoute = candidate;
    }

    if (!originalRoute) { return buildLocationQuestion(gradeCode, cfg, rnd); }

    var answerRoute = originalRoute.slice();
    if (update) { answerRoute[update.index] = update.to; }

    return {
      gradeCode: gradeCode,
      mode: 'path',
      pathMode: cfg.pathMode,
      gridSize: cfg.gridSize,
      total: cfg.gridSize * cfg.gridSize,
      treasurePositions: [],
      originalRoute: originalRoute,
      answerRoute: answerRoute,
      update: update,
      exposureMs: cfg.pathExposureMs,
      delayMs: cfg.pathDelayMs,
      options: ['done'],
      answer: 'done',
      optionTypes: { done: 'path_completion' },
      hintZh: '从小动物出发，按刚才看到的顺序走到家',
      hintEn: 'Start with the traveller and tap the shown route in order'
    };
  }

  function buildQuestion(gradeCode, rnd, mode) {
    var cfg = TG_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }
    return mode === 'path'
      ? buildPathQuestion(gradeCode, cfg, rnd)
      : buildLocationQuestion(gradeCode, cfg, rnd);
  }

  function generate(gradeCode, count, seed) {
    var cfg = TG_DATA.gradeConfig[gradeCode];
    if (!cfg) { return []; }

    var rnd = rngFor(seed);
    var pathCount = Math.min(cfg.pathCount || 0, count);
    var modes = [];
    var out = [];

    for (var p = 0; p < pathCount; p++) { modes.push('path'); }
    while (modes.length < count) { modes.push('location'); }
    modes = shuffled(modes, rnd);

    for (var i = 0; i < modes.length; i++) {
      var q = buildQuestion(gradeCode, rnd, modes[i]);
      if (q) { out.push(q); }
    }
    return out;
  }

  return {
    generate: generate,
    buildQuestion: buildQuestion,
    rngFor: rngFor,
    neighbours: neighbours
  };
}());