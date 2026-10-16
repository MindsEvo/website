'use strict';

/**
 * Rule Change — Generator  (MindSeeds · Strategy Master)
 * The walker already has a plan (a branch from the junction M to the goal).
 * On reaching M a change is announced; the child decides whether the plan
 * still works. About half of the questions are "the change does not matter, keep
 * the plan", the rest "the plan is broken, change it" - so neither "always keep"
 * nor "always change" is a strategy.
 *   branch: { c: energy cost, s: stars }.  events: block / up / down / cut.
 *   K1: 2 branches, block.      K2: 3 branches, block | up | down (least energy).
 *   G1: 3 branches + energy, cut | block (most stars within energy).
 *   G2: 4 branches + energy, two changes at once (most stars within energy).
 * `after(q)` is shared by the generator and the game.
 */
var RC2_GEN = (function () {

  var THEMES = [
    ['🐰', '小兔', 'the bunny', '🥕', '胡萝卜', 'the carrot'],
    ['🐶', '小狗', 'the puppy', '🏠', '小房子', 'the doghouse'],
    ['🐻', '小熊', 'the bear', '🍓', '草莓', 'the strawberry'],
    ['🐱', '小猫', 'the kitten', '🐟', '小鱼', 'the fish'],
    ['🐵', '小猴', 'the monkey', '🍎', '苹果', 'the apple']
  ];

  var CFG = {
    K1: { n: 2, goal: 'least_energy', events: [['block'], ['up']], cost: [1, 8] },
    K2: { n: 3, goal: 'least_energy', events: [['block'], ['up'], ['down']], cost: [1, 7] },
    G1: { n: 3, goal: 'most_stars',   events: [['cut'], ['block'], ['cut']], cost: [2, 6], stars: [1, 8], energy: [5, 9] },
    G2: { n: 4, goal: 'most_stars',   events: [['block', 'cut'], ['up', 'cut'], ['block', 'up'], ['down', 'cut']], cost: [2, 6], stars: [1, 9], energy: [6, 10] }
  };

  function rnd(n) { return Math.floor(Math.random() * n); }
  function int(r) { return r[0] + rnd(r[1] - r[0] + 1); }
  function pick(a) { return a[rnd(a.length)]; }

  // Branches and energy after all events; every branch gets ok (usable) and its new cost.
  function after(q, withEvents) {
    var bs = q.branches.map(function (b) { return { c: b.c, s: b.s, blocked: false, was: b.c }; }), energy = q.energy;
    (withEvents === false ? [] : q.events).forEach(function (e) {
      if (e.t === 'block') bs[e.i].blocked = true;
      else if (e.t === 'up') bs[e.i].c += e.k;
      else if (e.t === 'down') bs[e.i].c = Math.max(1, bs[e.i].c - e.k);
      else if (e.t === 'cut') energy = energy - e.k;
    });
    bs.forEach(function (b) { b.ok = !b.blocked && (energy === null || b.c <= energy); });
    return { branches: bs, energy: energy };
  }

  function bestOf(q, st) {                       // unique best usable branch index, or -1
    var score = q.goal === 'most_stars' ? function (b) { return b.s * 100 - b.c; } : function (b) { return -b.c; };
    var top = -Infinity, idx = -1, tie = false;
    st.branches.forEach(function (b, i) {
      if (!b.ok) return;
      var v = score(b);
      if (v > top) { top = v; idx = i; tie = false; } else if (v === top) tie = true;
    });
    return tie ? -1 : idx;
  }

  function build(grade, wantKeep) {
    var cfg = CFG[grade];
    for (var t = 0; t < 1500; t++) {
      var branches = [], used = {};
      for (var i = 0; i < cfg.n; i++) {
        var c = int(cfg.cost), s = cfg.stars ? int(cfg.stars) : 0;
        branches.push({ c: c, s: s });
      }
      if (!cfg.stars) { var cs = branches.map(function (b) { return b.c; }); if (cs.some(function (c, i) { return cs.indexOf(c) !== i; })) continue; }
      var energy = cfg.energy ? int(cfg.energy) : null;
      var q = { goal: cfg.goal, branches: branches, energy: energy, events: [] };
      var before = bestOf(q, after(q, false));
      if (before < 0) continue;                                                // the plan was the sensible one
      var kinds = pick(cfg.events), taken = {};
      for (var k = 0; k < kinds.length; k++) {
        var ev = { t: kinds[k], i: rnd(cfg.n), k: 1 + rnd(4) };
        if (ev.t === 'cut') ev.i = -1;
        if (ev.i >= 0) { if (taken[ev.i]) { ev = null; break; } taken[ev.i] = 1; }
        q.events.push(ev);
      }
      if (q.events.length < kinds.length) continue;
      var st = after(q), best = bestOf(q, st);
      if (best < 0) continue;
      if ((best === before) !== wantKeep) continue;
      // an event that changes nothing at all is pointless
      if (q.events.every(function (e) { return e.t === 'cut' && e.k < 1; })) continue;
      // keep-the-plan questions must still have a tempting change: some other branch is usable
      if (wantKeep && cfg.n > 2 && st.branches.filter(function (b, i) { return b.ok && i !== before; }).length < 1) continue;
      return { branches: branches, energy: energy, events: q.events, plan: before, best: best, keep: wantKeep };
    }
    return null;
  }

  function buildQuestion(grade) {
    var cfg = CFG[grade], b = build(grade, Math.random() < 0.45); if (!b) return null;
    var types = {};
    return { gradeCode: grade, goalType: cfg.goal, interactive: true, mode: 'adapt', theme: pick(THEMES), a: 1 + rnd(2),
      goal: cfg.goal, branches: b.branches, energy: b.energy, events: b.events, plan: b.plan, best: b.best, keep: b.keep,
      options: ['done'], answer: 'done', optionTypes: { done: 'adapt' },
      key: JSON.stringify([b.branches, b.energy, b.events]) };
  }

  function generate(grade, count) {
    var out = [], seen = {}, guard = 0;
    while (out.length < count && guard++ < count * 30) {
      var q = buildQuestion(grade); if (!q) break;
      if (seen[q.key]) continue;
      seen[q.key] = 1; out.push(q);
    }
    return out;
  }

  return { generate: generate, after: after, bestOf: bestOf, CFG: CFG };
}());
