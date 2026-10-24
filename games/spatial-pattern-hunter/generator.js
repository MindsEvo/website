'use strict';

/**
 * Spatial Pattern Hunter — session GENERATOR (MindSeeds)
 * A trail of cells [row, col] follows one movement rule. Every question is checked by brute
 * force over the whole grid so it has exactly one answer:
 *   predict  the next 1-2 cells: exactly one continuation keeps the rule
 *   fill     one middle cell is hidden: exactly one cell keeps the rule
 *   spot     one cell was moved: exactly one position can be repaired
 * Rules: hop (same move every step) · stair (two moves alternate) · bounce (diagonal, reflecting).
 * Pass no seed; the game calls generate(grade, count).
 */
var SP_GEN = (function () {

  function rnd(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rnd(a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function same(a, b) { return a[0] === b[0] && a[1] === b[1]; }
  function diff(a, b) { return [b[0] - a[0], b[1] - a[1]]; }
  function inGrid(p, R, C) { return p[0] >= 0 && p[1] >= 0 && p[0] < R && p[1] < C; }

  // The cell sequence a bounce rule makes: reflect a component before moving out of range.
  function bounceSeq(start, v, n, R, C) {
    var out = [start.slice()], r = start[0], c = start[1], vr = v[0], vc = v[1];
    for (var i = 1; i < n; i++) {
      if (r + vr < 0 || r + vr >= R) { vr = -vr; }
      if (c + vc < 0 || c + vc >= C) { vc = -vc; }
      r += vr; c += vc;
      if (!inGrid([r, c], R, C)) { return null; }
      out.push([r, c]);
    }
    return out;
  }

  // Does `seq` (all cells, no gaps) follow a rule of this kind?
  function fits(kind, seq, R, C) {
    var n = seq.length, i, d = [];
    for (i = 0; i < n; i++) { if (!seq[i] || !inGrid(seq[i], R, C)) { return false; } }
    for (i = 0; i + 1 < n; i++) { d.push(diff(seq[i], seq[i + 1])); }
    if (kind === 'hop') {
      if (n < 3 || (d[0][0] === 0 && d[0][1] === 0)) { return false; }
      return d.every(function (x) { return same(x, d[0]); });
    }
    if (kind === 'stair') {
      if (n < 5) { return false; }
      if (same(d[0], d[1]) || (d[0][0] === 0 && d[0][1] === 0) || (d[1][0] === 0 && d[1][1] === 0)) { return false; }
      return d.every(function (x, k) { return same(x, d[k % 2]); });
    }
    if (n < 4) { return false; }                                   // bounce
    if (Math.abs(d[0][0]) !== 1 || Math.abs(d[0][1]) !== 1) { return false; }
    var sim = bounceSeq(seq[0], d[0], n, R, C);
    return !!sim && sim.every(function (p, k) { return same(p, seq[k]); });
  }

  function allCells(R, C) { var o = []; for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) o.push([r, c]); return o; }
  function distinct(seq) { return seq.every(function (p, i) { return seq.every(function (q, j) { return i === j || !same(p, q); }); }); }

  // A sequence of n cells for this grade, or null.
  function makeSeq(cfg, n) {
    var R = cfg.R, C = cfg.C, i, seq = [], start = [rnd(R), rnd(C)], rule;
    if (cfg.kind === 'hop') {
      var d = pick(cfg.moves);
      for (i = 0; i < n; i++) { seq.push([start[0] + d[0] * i, start[1] + d[1] * i]); }
      rule = { kind: 'hop', d: d };
    } else if (cfg.kind === 'stair') {
      var h = (rnd(2) ? 1 : -1) * (rnd(4) === 0 ? 2 : 1), v = (rnd(2) ? 1 : -1), pair = rnd(2) ? [[0, h], [v, 0]] : [[v, 0], [0, h]];
      seq.push(start);
      for (i = 1; i < n; i++) { var s = pair[(i - 1) % 2]; seq.push([seq[i - 1][0] + s[0], seq[i - 1][1] + s[1]]); }
      rule = { kind: 'stair', d1: pair[0], d2: pair[1] };
    } else {
      var vel = [rnd(2) ? 1 : -1, rnd(2) ? 1 : -1];
      seq = bounceSeq(start, vel, n, R, C);
      rule = { kind: 'bounce' };
    }
    if (!seq || !seq.every(function (p) { return inGrid(p, R, C); }) || !distinct(seq)) { return null; }
    if (!fits(cfg.kind, seq, R, C)) { return null; }
    return { seq: seq, rule: rule };
  }

  function bounces(seq) {                     // step indices where the move changes
    var o = [];
    for (var i = 1; i + 1 < seq.length; i++) { if (!same(diff(seq[i - 1], seq[i]), diff(seq[i], seq[i + 1]))) { o.push(i); } }
    return o;
  }

  function build(grade, form) {
    var cfg = SP_DATA.config[grade], R = cfg.R, C = cfg.C, cells = allCells(R, C);
    for (var t = 0; t < 800; t++) {
      var need = form === 'predict' ? pick(cfg.need) : 0;
      var shown = pick(cfg.shown), n = form === 'predict' ? shown + need : pick(cfg.total);
      if (form === 'predict' && cfg.kind === 'stair') { n = shown + need; }
      if (form !== 'predict' && n < 4) { continue; }
      var m = makeSeq(cfg, n); if (!m) { continue; }
      var seq = m.seq, q = { gradeCode: grade, family: 'movement', kind: cfg.kind, form: form, taskForm: form,
      explanationUsed: false, R: R, C: C, rule: m.rule, seq: seq, mover: cfg.mover, cellPx: cfg.cell, pads: !!cfg.pads };

      if (cfg.kind === 'bounce') {
        var b = bounces(seq);
        if (!b.length) { continue; }
        if (form === 'predict' && !b.some(function (i) { return i >= shown - 1; })) { continue; }
      }
      if (form === 'predict') {
        var prefix = seq.slice(0, shown), count = 0, a, b2;
        if (need === 1) { cells.forEach(function (c) { if (fits(cfg.kind, prefix.concat([c]), R, C)) { count++; } }); }
        else { cells.forEach(function (c1) { cells.forEach(function (c2) { if (fits(cfg.kind, prefix.concat([c1, c2]), R, C)) { count++; } }); }); }
        if (count !== 1) { continue; }
        q.shown = shown; q.need = need; q.target = seq.slice(shown);
      } else if (form === 'fill') {
        var hide = 1 + rnd(n - 2), cnt = 0;
        cells.forEach(function (c) { var s2 = seq.slice(); s2[hide] = c; if (fits(cfg.kind, s2, R, C)) { cnt++; } });
        if (cnt !== 1) { continue; }
        q.hide = hide; q.target = [seq[hide]];
      } else {
        if (n < 5) { continue; }
        var bad = rnd(n), free = cells.filter(function (c) { return !seq.some(function (p) { return same(p, c); }); });
        if (!free.length) { continue; }
        var s3 = seq.map(function (p) { return p.slice(); }); s3[bad] = pick(free);
        var fixable = 0;
        for (var j = 0; j < n; j++) {
          var ok = false;
          for (var k = 0; k < cells.length && !ok; k++) { var s4 = s3.slice(); s4[j] = cells[k]; if (fits(cfg.kind, s4, R, C)) { ok = true; } }
          if (ok) { fixable++; }
        }
        if (fixable !== 1 || !distinct(s3)) { continue; }
        q.cells = s3; q.badIndex = bad;
      }
      q.key = form + JSON.stringify(q.seq) + (q.badIndex !== undefined ? JSON.stringify(q.cells) : '');
      q.interactive = true; q.options = ['done']; q.answer = 'done'; q.optionTypes = { done: 'spatial_board' };
      return q;
    }
    return null;
  }


  function transformGlyph(base, turn, reflect) {
    return { base: base, turn: ((turn % 4) + 4) % 4, reflect: !!reflect };
  }
  function glyphKey(g) { return g.base.id + ':' + g.turn + ':' + (g.reflect ? 1 : 0); }
  function transformed(base, op, i) {
    if (op === 'rotate90') { return transformGlyph(base, i, false); }
    if (op === 'reflectX') { return transformGlyph(base, 0, i % 2 === 1); }
    if (op === 'alternate-rotate-reflect') { return transformGlyph(base, Math.ceil(i / 2), i % 2 === 1); }
    return transformGlyph(base, i, i > 0 && i % 2 === 0);
  }
  function uniqueOptionAnswer(options, answer) {
    return options.filter(function (x) { return glyphKey(x) === glyphKey(answer); }).length === 1;
  }
  function buildTransform(grade) {
    var cfg = SP_DATA.config[grade], base = pick(SP_DATA.symbols), op = pick(cfg.transforms), len = grade === 'K1' ? 4 : grade === 'K2' ? 5 : 6;
    var seq = []; for (var i = 0; i < len; i++) { seq.push(transformed(base, op, i)); }
    var answer = seq[len - 1], options = [answer];
    for (var t = 0; options.length < 4 && t < 30; t++) {
      var x = transformGlyph(base, rnd(4), rnd(2));
      if (!options.some(function (o) { return glyphKey(o) === glyphKey(x); })) { options.push(x); }
    }
    if (options.length !== 4 || !uniqueOptionAnswer(options, answer)) { return null; }
    return { gradeCode: grade, family: grade === 'G1' ? 'alternating-transform' : grade === 'G2' ? 'combined-transform' : op === 'reflectX' ? 'reflection' : 'rotation',
      kind: 'transform', form: 'transform', taskForm: 'complete-sequence', sequence: seq.slice(0, -1), targetGlyph: answer,
      glyphOptions: shuffle(options), transformRule: op, explanationUsed: !!cfg.explain, mover: cfg.mover,
      key: 'transform:' + grade + ':' + base.id + ':' + op + ':' + seq.map(glyphKey).join('|'), interactive: true,
      options: ['done'], answer: 'done', optionTypes: { done: 'spatial_board' } };
  }
  function buildGrid(grade) {
    var base = pick(SP_DATA.symbols), combined = grade === 'G2', cells = [], r, c;
    for (r = 0; r < 3; r++) { cells[r] = []; for (c = 0; c < 3; c++) { cells[r][c] = transformGlyph(base, c + (combined ? r : 0), combined && r % 2 === 1); } }
    var target = cells[2][2], options = [target];
    for (var t = 0; options.length < 4 && t < 30; t++) {
      var x = transformGlyph(base, rnd(4), rnd(2));
      if (!options.some(function (o) { return glyphKey(o) === glyphKey(x); })) { options.push(x); }
    }
    if (options.length !== 4 || !uniqueOptionAnswer(options, target)) { return null; }
    cells[2][2] = null;
    return { gradeCode: grade, family: 'row-column-grid', kind: 'grid', form: 'grid', taskForm: 'complete-grid',
      grid: cells, targetGlyph: target, glyphOptions: shuffle(options), gridRule: combined ? 'row-rotate-column-reflect' : 'column-rotate',
      explanationUsed: true, mover: SP_DATA.config[grade].mover,
      key: 'grid:' + grade + ':' + base.id + ':' + (combined ? 'combined' : 'intro'), interactive: true,
      options: ['done'], answer: 'done', optionTypes: { done: 'spatial_board' } };
  }

  function generate(grade, count) {
    var cfg = SP_DATA.config[grade]; if (!cfg) { return []; }
    var forms = [];
    Object.keys(cfg.forms).forEach(function (f) { for (var i = 0; i < cfg.forms[f]; i++) { forms.push(f); } });
    forms = shuffle(forms).slice(0, count);
    var out = [], seen = {};
    forms.forEach(function (f) {
      for (var t = 0; t < 12; t++) {
        var q = f === 'transform' ? buildTransform(grade) : f === 'grid' ? buildGrid(grade) : build(grade, f);
        q = q || build(grade, 'fill');
        if (q && !seen[q.key]) { seen[q.key] = 1; out.push(q); return; }
      }
    });
    return out;
  }

  return { generate: generate, fits: fits, diff: diff, bounceSeq: bounceSeq, glyphKey: glyphKey };
}());
