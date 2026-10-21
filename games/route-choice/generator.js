'use strict';

/**
 * Route Choice — Generator  (MindSeeds · Strategy Master)
 * A walker must reach the goal along one of three routes of stepping stones.
 *   stone  = 1 energy; 'puddle' stone = 3 energy; 'block' stone = cannot be passed;
 *   'fog' stone = shows ❓ and turns out to be a block when walked into (G2).
 * K1-K2: reach the goal using the least energy.  G1-G2: reach it earning the most stars.
 * `best` is the index of the unique best route, found by evaluating every route.
 */
var RC_GEN = (function () {

  // Goals with strong colours of their own (no white, cream or yellow items).
  var THEMES = [
    ['🐰', '小兔', 'the bunny', '🥕', '胡萝卜', 'the carrot'],
    ['🐶', '小狗', 'the puppy', '🏠', '小房子', 'the doghouse'],
    ['🐻', '小熊', 'the bear', '🍓', '草莓', 'the strawberry'],
    ['🐱', '小猫', 'the kitten', '🐟', '小鱼', 'the fish'],
    ['🐵', '小猴', 'the monkey', '🍎', '苹果', 'the apple']
  ];

  // nRange per route slot [short, middle, long]; hazard odds; energy rule.
  var CFG = {
    K1: { routes: 2, goal: 'least_energy', n: [[2, 4], [5, 8]], energy: null, block: 0.6, puddle: 0, fog: 0, stars: false, persist: false },
    K2: { routes: 3, goal: 'least_energy', n: [[3, 3], [4, 5], [6, 7]], energy: [6, 8], block: 0, puddle: 0.7, fog: 0, stars: false, persist: false },
    G1: { routes: 3, goal: 'most_stars', n: [[2, 3], [4, 5], [6, 6]], energy: [5, 7], block: 0.45, puddle: 0, fog: 0, stars: true, persist: false },
    G2: { routes: 3, goal: 'most_stars', n: [[2, 3], [4, 5], [5, 6]], energy: [6, 9], block: 0.25, puddle: 0.5, fog: 0.5, stars: true, persist: true }
  };

  function rnd(n) { return Math.floor(Math.random() * n); }
  function between(r) { return r[0] + rnd(r[1] - r[0] + 1); }
  function pick(a) { return a[rnd(a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // Walk a route with `energy`; used by the generator and the game alike.
  function walk(route, energy) {
    var used = 0;
    for (var i = 0; i < route.n; i++) {
      var h = route.hazards[i] || null;
      if (h === 'block' || h === 'fog') return { ok: false, why: h, at: i, used: used };
      var c = h === 'puddle' ? 3 : 1;
      if (energy !== null && used + c > energy) return { ok: false, why: 'empty', at: i, used: used };
      used += c;
    }
    return { ok: true, used: used, stars: route.stars || 0 };
  }

  function makeRoute(cfg, slot, withStars) {
    var n = between(cfg.n[slot]), hz = {};
    if (Math.random() < cfg.block) hz[rnd(n)] = 'block';
    else if (Math.random() < cfg.puddle) hz[rnd(n)] = 'puddle';
    if (cfg.puddle && n >= 5 && Math.random() < 0.3) hz[rnd(n)] = hz[rnd(n)] || 'puddle';
    return { n: n, hazards: hz, stars: withStars ? 1 + rnd(5) : 0 };
  }

  // K1: a near route (short, may be blocked or have a puddle) against a far, safe route.
  function buildK1() {
    for (var t = 0; t < 200; t++) {
      var near = { n: between([2, 4]), hazards: {}, stars: 0 }, far = { n: between([5, 8]), hazards: {}, stars: 0 }, r = Math.random();
      if (r < 0.5) near.hazards[rnd(near.n)] = 'block';
      else if (r < 0.75) near.hazards[rnd(near.n)] = 'puddle';
      else if (Math.random() < 0.5) far.hazards[rnd(far.n)] = 'puddle';
      var res = [walk(near, null), walk(far, null)];
      if (!res[1].ok) continue;
      var best = !res[0].ok || res[1].used < res[0].used ? 1 : res[0].used < res[1].used ? 0 : -1;
      if (best < 0) continue;
      var flip = rnd(2) === 1;
      return { routes: flip ? [far, near] : [near, far], energy: null, best: flip ? 1 - best : best, hasFog: false };
    }
    return null;
  }

  function build(grade) {
    var cfg = CFG[grade];
    if (grade === 'K1') return buildK1();
    for (var t = 0; t < 600; t++) {
      var routes = [], s;
      for (s = 0; s < cfg.routes; s++) routes.push(makeRoute(cfg, cfg.routes === 2 ? s : s, cfg.stars));
      var energy = cfg.energy ? between(cfg.energy) : null;
      var fogIdx = -1;
      if (cfg.fog && Math.random() < cfg.fog) {                 // the luring route hides a block in fog
        fogIdx = rnd(cfg.routes);
        routes[fogIdx].hazards = {}; routes[fogIdx].hazards[rnd(routes[fogIdx].n)] = 'fog';
        routes[fogIdx].stars = 5;
        routes.forEach(function (r, i) { if (i !== fogIdx && r.stars > 4) r.stars = 4; });
      }
      var res = routes.map(function (r) { return walk(r, energy); });
      var okIdx = [];
      res.forEach(function (r, i) { if (r.ok) okIdx.push(i); });
      if (okIdx.length < 2 || okIdx.length === routes.length && cfg.routes > 2 && grade !== 'K2') continue;
      var scoreOf = cfg.goal === 'least_energy' ? function (i) { return -res[i].used; } : function (i) { return res[i].stars * 100 - res[i].used; };
      var top = Math.max.apply(null, okIdx.map(scoreOf));
      var bests = okIdx.filter(function (i) { return scoreOf(i) === top; });
      if (bests.length !== 1) continue;
      var best = bests[0];
      // the obvious pick (shortest route / most stars) should usually be wrong
      var lure = cfg.goal === 'least_energy'
        ? routes.reduce(function (m, r, i) { return r.n < routes[m].n ? i : m; }, 0)
        : routes.reduce(function (m, r, i) { return r.stars > routes[m].stars ? i : m; }, 0);
      if (best === lure && Math.random() < 0.7) continue;
      if (cfg.goal === 'least_energy' && grade === 'K1' && best !== lure && Math.random() < 0.0) continue;
      var order = shuffle(routes.map(function (r, i) { return i; }));
      var shown = order.map(function (i) { return routes[i]; });
      return { routes: shown, energy: energy, best: order.indexOf(best), hasFog: fogIdx >= 0 };
    }
    return null;
  }

  function buildQuestion(grade) {
    var cfg = CFG[grade], b = build(grade); if (!b) return null;
    return {
      gradeCode: grade, goalType: cfg.goal, interactive: true, mode: 'route', persist: cfg.persist, stars: cfg.stars,
      theme: pick(THEMES), routes: b.routes, energy: b.energy, best: b.best, hasFog: b.hasFog,
      options: ['done'], answer: 'done', optionTypes: { done: 'route' },
      key: JSON.stringify([b.routes, b.energy])
    };
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

  return { generate: generate, walk: walk, CFG: CFG };
}());
