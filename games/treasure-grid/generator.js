'use strict';

/**
 * Treasure Grid — session GENERATOR (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * One item: a gridSize x gridSize grid, its cells numbered 1..N in row-major
 * order (the numbers stay visible the whole time — only the treasure marker on
 * top of 1-2 cells flashes and hides). The child is asked which numbered cell
 * held a treasure. When multiple treasures are shown, every treasure cell is
 * accepted as correct and the option set includes each valid treasure cell.
 *
 * Pass a `seed` for a reproducible draw; the game does not pass one.
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

  function buildQuestion(gradeCode, rnd) {
    var cfg = TG_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }
    var total = cfg.gridSize * cfg.gridSize;
    var cellNums = [];
    for (var i = 1; i <= total; i++) { cellNums.push(i); }

    var treasurePositions = shuffled(cellNums, rnd).slice(0, cfg.treasureCount);
    var nonTreasure = cellNums.filter(function (n) { return treasurePositions.indexOf(n) < 0; });
    var distractors = shuffled(nonTreasure, rnd).slice(0, cfg.optionCount - treasurePositions.length);

    var types = {};
    treasurePositions.forEach(function (n) { types[n] = 'treasure'; });
    distractors.forEach(function (n) { types[n] = 'empty_cell'; });
    var options = shuffled(treasurePositions.concat(distractors), rnd);

    return {
      gradeCode:         gradeCode,
      gridSize:          cfg.gridSize,
      total:             total,
      treasurePositions: treasurePositions,
      target:            treasurePositions[0],
      exposureMs:        cfg.exposureMs,
      delayMs:           cfg.delayMs,
      options:           options,
      answer:            treasurePositions[0],
      answers:           treasurePositions.slice(),
      optionTypes:       types,
      hintZh:            '记住宝藏出现的格子编号',
      hintEn:            'Remember the number of the cell that held the treasure'
    };
  }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var out = [], last = null;
    for (var i = 0; i < count; i++) {
      var q = buildQuestion(gradeCode, rnd);
      if (q && last && q.treasurePositions.join() === last.treasurePositions.join()) {
        q = buildQuestion(gradeCode, rnd);
      }
      if (!q) { return out; }
      out.push(q);
      last = q;
    }
    return out;
  }

  return { generate: generate, buildQuestion: buildQuestion, rngFor: rngFor };
}());
