'use strict';

/**
 * Energy Planner — Generator
 * Each question is a small planning problem the child solves by acting:
 * tap tasks into the plan, submit, see the outcome, and try again if wished.
 *   - fit_only (K1-K2): do as many tasks as the energy allows (K2: one task is a must-do).
 *   - maximize_reward (G1-G2): earn the most stars within the energy. In G2 the
 *     best-value-per-energy greedy choice is NOT optimal, so it has to be weighed.
 * `best` is the optimal value (task count or stars); it is computed by brute
 * force over every subset (<= 5 tasks), so it is always exact.
 */
var EP_GEN = (function () {

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

  function int(lo, hi, rnd) { return lo + Math.floor(rnd() * (hi - lo + 1)); }

  // Every subset that fits the budget (and holds the must-do task, if any).
  function feasible(tasks, budget, valueOf) {
    var out = [];
    for (var mask = 1; mask < (1 << tasks.length); mask++) {
      var cost = 0, value = 0, ok = true, count = 0;
      for (var i = 0; i < tasks.length; i++) {
        if (mask & (1 << i)) { cost += tasks[i].cost; value += valueOf(tasks[i]); count++; }
        else if (tasks[i].must) { ok = false; }
      }
      if (ok && cost <= budget) { out.push({ mask: mask, cost: cost, value: value, count: count }); }
    }
    return out;
  }

  function greedyValue(tasks, budget) {          // best stars-per-energy first
    var left = budget, total = 0;
    tasks.slice().sort(function (a, b) { return b.reward / b.cost - a.reward / a.cost; }).forEach(function (t) {
      if (t.cost <= left) { left -= t.cost; total += t.reward; }
    });
    return total;
  }

  function buildQuestion(gradeCode, rnd) {
    var cfg = EP_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }
    var maxi = cfg.goalType === 'maximize_reward';
    var valueOf = maxi ? function (t) { return t.reward; } : function () { return 1; };

    for (var attempt = 0; attempt < 400; attempt++) {
      var tasks = shuffled(EP_DATA.taskPool, rnd).slice(0, cfg.taskCount).map(function (t) {
        return { icon: t.icon, nameZh: t.nameZh, nameEn: t.nameEn,
          cost: int(1, cfg.costMax, rnd), reward: maxi ? int(1, cfg.rewardMax, rnd) : 0, must: false };
      });
      var total = tasks.reduce(function (s, t) { return s + t.cost; }, 0);
      var budget = maxi ? Math.max(3, Math.round(total * cfg.budgetRatio)) : int(cfg.budgetRange[0], cfg.budgetRange[1], rnd);
      if (cfg.mustDo) {
        var big = tasks.filter(function (t) { return t.cost >= 2; });
        if (!big.length) { continue; }
        big[Math.floor(rnd() * big.length)].must = true;
      }
      if (total <= budget) { continue; }
      var plans = feasible(tasks, budget, valueOf);
      if (!plans.length) { continue; }
      var best = Math.max.apply(null, plans.map(function (p) { return p.value; }));
      var tops = plans.filter(function (p) { return p.value === best; });
      var n = tasks.length;
      if (best <= 1 || tops.some(function (p) { return p.count === n || p.count === 1 && maxi; })) { continue; }
      if (maxi) {
        if (tops.length !== 1) { continue; }
        if (gradeCode === 'G2' && greedyValue(tasks, budget) >= best) { continue; }
      } else if (cfg.mustDo) {
        // the must-do task has to matter: ignoring it would allow more tasks
        var free = feasible(tasks.map(function (t) { return Object.assign({}, t, { must: false }); }), budget, valueOf);
        if (Math.max.apply(null, free.map(function (p) { return p.value; })) <= best) { continue; }
      }
      return {
        gradeCode: gradeCode, goalType: cfg.goalType, interactive: true, mode: 'plan',
        tasks: tasks, budget: budget, best: best,
        options: ['done'], answer: 'done', optionTypes: { done: 'plan' },
        hintZh: ['先想一想：我想达到什么？', '再想一想：每件事花多少能量，换来什么？', '试试看，提交后看看剩多少，还能更好吗？'],
        hintEn: ['First: what do I want to achieve?', 'Next: what does each task cost, and what does it give?', 'Try it, submit, and see — can it be better?']
      };
    }
    return null;
  }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed), out = [], seen = {}, guard = 0;
    while (out.length < count && guard++ < count * 30) {
      var q = buildQuestion(gradeCode, rnd);
      if (!q) { break; }
      var key = q.budget + ':' + q.tasks.map(function (t) { return t.icon + t.cost + t.reward + (t.must ? 'M' : ''); }).join();
      if (seen[key]) { continue; }
      seen[key] = 1; out.push(q);
    }
    return out;
  }

  return { generate: generate, buildQuestion: buildQuestion, rngFor: rngFor };
}());
