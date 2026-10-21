'use strict';

/**
 * Backpack — Generator  (MindSeeds · Strategy Master)
 * A trip needs one item from each "must bring" group (food, drink, cover), each
 * option with its own weight; the backpack has a weight limit. Older grades add
 * optional extras. Everything the child needs is printed on the screen.
 *   K1: pack the musts so the bag is not overweight (exactly one way fits).
 *   K2: musts + extras: fit as many extras as possible (the choice of musts matters).
 *   G1: extras earn stars: the most stars within the limit.
 *   G2: tighter; three musts; the best-value-per-weight extras are NOT optimal.
 * `best` is the exact optimum, found by brute force over every packing.
 */
var BP_GEN = (function () {

  // Strong, unmistakable colours; names are always shown next to the icon.
  var GROUPS = [
    { id: 'food',  zh: '吃的', en: 'Food',  items: [['🍎', '苹果', 'Apple'], ['🥕', '胡萝卜', 'Carrot'], ['🍇', '葡萄', 'Grapes'], ['🍓', '草莓', 'Strawberry'], ['🍉', '西瓜', 'Watermelon']] },
    { id: 'drink', zh: '喝的', en: 'Drink', items: [['💧', '水', 'Water'], ['🍵', '绿茶', 'Green tea'], ['🧃', '果汁', 'Juice']] },
    { id: 'cover', zh: '遮挡', en: 'Cover', items: [['☂️', '雨伞', 'Umbrella'], ['🧢', '帽子', 'Cap'], ['🧥', '外套', 'Coat']] }
  ];
  var EXTRAS = [['📚', '书', 'Book'], ['🎨', '画笔', 'Paints'], ['⚽', '足球', 'Football'], ['🪁', '风筝', 'Kite'], ['📷', '相机', 'Camera'], ['🧸', '玩具熊', 'Teddy'], ['🎵', '音乐盒', 'Music box'], ['🔭', '望远镜', 'Telescope']];
  var TRIPS = [['🌲', '去森林', 'a forest trip'], ['🏖️', '去海边', 'a beach trip'], ['⛰️', '去爬山', 'a hike'], ['🏕️', '去野营', 'a camping trip'], ['🎡', '去公园', 'a park trip']];

  var CFG = {
    K1: { musts: 2, extras: 0, w: [1, 4], goal: 'fit_musts' },
    K2: { musts: 2, extras: 4, w: [1, 4], goal: 'most_extras' },
    G1: { musts: 2, extras: 4, w: [1, 4], goal: 'most_stars', stars: 6 },
    G2: { musts: 3, extras: 5, w: [1, 4], goal: 'most_stars', stars: 8 }
  };

  function rnd(n) { return Math.floor(Math.random() * n); }
  function int(lo, hi) { return lo + rnd(hi - lo + 1); }
  function pick(a) { return a[rnd(a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // All must-combos (one option per group): [{pick:[idx...], w}]
  function mustCombos(groups) {
    var out = [{ pick: [], w: 0 }];
    groups.forEach(function (g) {
      var nxt = [];
      out.forEach(function (c) { g.items.forEach(function (it, i) { nxt.push({ pick: c.pick.concat(i), w: c.w + it.w }); }); });
      out = nxt;
    });
    return out;
  }

  // Best extras value for a remaining capacity (0 if nothing fits).
  function bestExtras(extras, room, valueOf) {
    var best = 0;
    for (var m = 0; m < (1 << extras.length); m++) {
      var w = 0, v = 0;
      for (var i = 0; i < extras.length; i++) if (m & (1 << i)) { w += extras[i].w; v += valueOf(extras[i]); }
      if (w <= room && v > best) best = v;
    }
    return best;
  }

  function greedyStars(extras, room) {
    var left = room, tot = 0;
    extras.slice().sort(function (a, b) { return b.stars / b.w - a.stars / a.w; }).forEach(function (e) { if (e.w <= left) { left -= e.w; tot += e.stars; } });
    return tot;
  }

  function buildQuestion(grade) {
    var cfg = CFG[grade];
    for (var t = 0; t < 800; t++) {
      var gs = shuffle(GROUPS).slice(0, cfg.musts);
      var groups = gs.map(function (g) {
        var its = shuffle(g.items).slice(0, 3).map(function (it) { return { icon: it[0], zh: it[1], en: it[2], w: int(cfg.w[0], cfg.w[1]) }; });
        return { id: g.id, zh: g.zh, en: g.en, items: its };
      });
      // no two options of one group with the same weight (the choice must be readable)
      if (groups.some(function (g) { var ws = g.items.map(function (i) { return i.w; }); return ws.some(function (w, i) { return ws.indexOf(w) !== i; }); })) continue;
      var extras = shuffle(EXTRAS).slice(0, cfg.extras).map(function (e) { return { icon: e[0], zh: e[1], en: e[2], w: int(1, 4), stars: cfg.stars ? int(1, cfg.stars) : 0 }; });
      var combos = mustCombos(groups), minW = Math.min.apply(null, combos.map(function (c) { return c.w; }));
      var cap, best, valueOf = cfg.goal === 'most_stars' ? function (e) { return e.stars; } : function () { return 1; };

      if (cfg.goal === 'fit_musts') {
        var lightest = combos.filter(function (c) { return c.w === minW; });
        if (lightest.length !== 1) continue;
        cap = minW; best = 0;
      } else {
        cap = minW + int(cfg.goal === 'most_stars' && grade === 'G2' ? 3 : 2, cfg.goal === 'most_stars' && grade === 'G2' ? 5 : 4);
        var per = combos.filter(function (c) { return c.w <= cap; }).map(function (c) { return bestExtras(extras, cap - c.w, valueOf); });
        best = Math.max.apply(null, per);
        if (best < 2 || Math.min.apply(null, per) >= best) continue;               // the choice of musts must matter
        var fullAll = extras.reduce(function (n, e) { return n + e.w; }, 0);
        if (fullAll + minW <= cap) continue;                                         // not everything fits
        if (grade === 'G2' && greedyStars(extras, cap - minW) >= best) continue;     // greed must lose
      }
      var trip = pick(TRIPS);
      return { gradeCode: grade, goalType: cfg.goal, interactive: true, mode: 'pack', trip: trip, groups: groups, extras: extras,
        cap: cap, best: best, options: ['done'], answer: 'done', optionTypes: { done: 'pack' },
        key: JSON.stringify([groups, extras, cap]) };
    }
    return null;
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

  return { generate: generate, mustCombos: mustCombos, bestExtras: bestExtras, CFG: CFG };
}());
