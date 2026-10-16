'use strict';

/**
 * What's Next — Generator  (MindSeeds · Strategy Master)
 * A magic machine has numbered buttons; each rule card says "button N -> effect".
 * The rules are drawn fresh per question, so they have to be read.
 *   K1  forward, 2 rules          K2  forward, 3 rules (options are all card effects)
 *   G1  backward, 4 rules; one wanted effect, or two at once (pairs of buttons)
 *   G2  3 button rules + 2 chain cards ("effect -> then effect"); forward or backward over two hops
 * A question is `interactive`: the board lets the child try an option, shows what
 * that choice really does, and lets them choose again. `outcome(q, b)` is shared
 * by the generator (to build distractors) and the game (to show consequences).
 */
var WN_GEN = (function () {

  function rnd(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rnd(a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // Effects (indices into WN_DATA.effects) that really happen when button b is pressed.
  function outcome(q, b) {
    var out = [];
    q.rules.forEach(function (r) { if (r.b === b) out.push(r.e); });
    for (var i = 0; i < out.length; i++) {
      (q.chains || []).forEach(function (c) { if (c.from === out[i] && out.indexOf(c.to) < 0) out.push(c.to); });
    }
    return out;
  }

  function base(grade, kind, rules, chains, ask, options, answer, hints) {
    var types = {};
    options.forEach(function (o) { types[o] = o === answer ? 'correct' : 'wrong'; });
    return { gradeCode: grade, kind: kind, interactive: true, mode: 'predict', rules: rules, chains: chains || [], ask: ask,
      options: options.length ? ['done'] : ['done'], choices: options, answer: 'done', correct: answer, optionTypes: { done: 'predict' },
      hintZh: hints[0], hintEn: hints[1], key: JSON.stringify([rules, chains, ask, answer]) };
  }

  function draw(n, nEff) {                      // n distinct buttons and n distinct effects
    return { btns: shuffle([1, 2, 3, 4, 5]).slice(0, n).sort(function (a, b) { return a - b; }), effs: shuffle(WN_DATA.effects.map(function (e, i) { return i; })).slice(0, nEff || n) };
  }

  function forward(grade, n) {
    var d = draw(n), rules = d.btns.map(function (b, i) { return { b: b, e: d.effs[i] }; });
    var target = rules[rnd(n)], opts;
    if (n === 2) {                               // the other card's effect + one effect that is on no card
      var other = rules.filter(function (r) { return r !== target; })[0];
      var absent = shuffle(WN_DATA.effects.map(function (e, i) { return i; }).filter(function (i) { return d.effs.indexOf(i) < 0; }))[0];
      opts = [target.e, other.e, absent];
    } else opts = rules.map(function (r) { return r.e; });
    return base(grade, 'forward', rules, [], { b: target.b }, shuffle(opts).map(function (e) { return 'e:' + e; }), 'e:' + target.e,
      [['先想一想：我想知道什么？', '再看规则卡：哪一张写着这个数字？', '找到那一行，它指向的就是答案。'],
       ['First: what do I want to know?', 'Now the cards: which one shows this number?', 'Find that row — the effect it points to is the answer.']]);
  }

  function backward(grade) {
    var d = draw(4), rules = d.btns.map(function (b, i) { return { b: b, e: d.effs[i] }; });
    if (rnd(2) === 0) {                          // one wanted effect
      var t = rules[rnd(4)], bs = shuffle(rules.filter(function (r) { return r !== t; })).slice(0, 2).concat(t);
      return base(grade, 'backward', rules, [], { want: [t.e] }, shuffle(bs.map(function (r) { return 'b:' + r.b; })), 'b:' + t.b,
        [['先想一想：我想让什么发生？', '再看规则卡：哪个数字会让它发生？', '试一试，机器会告诉你实际发生了什么。'],
         ['First: what do I want to happen?', 'Now the cards: which number makes it happen?', 'Try it — the machine will show what really happens.']]);
    }
    var ts = shuffle(rules).slice(0, 2), good = ts.map(function (r) { return r.b; }).sort();
    var rest = rules.filter(function (r) { return ts.indexOf(r) < 0; }).map(function (r) { return r.b; });
    var half = [good[rnd(2)], rest[0]].sort(), none = rest.slice(0, 2).sort();
    function tok(p) { return 'p:' + p.join(','); }
    return base(grade, 'backward2', rules, [], { want: ts.map(function (r) { return r.e; }) }, shuffle([tok(good), tok(half), tok(none)]), tok(good),
      [['先想一想：我要让哪两件事一起发生？', '再看规则卡：哪两个数字各负责一件？', '试一试，机器会告诉你实际发生了什么。'],
       ['First: which two things must happen together?', 'Now the cards: which two numbers each do one of them?', 'Try it — the machine will show what really happens.']]);
  }

  function chain(grade) {
    var d = draw(3, 5), rules = d.btns.map(function (b, i) { return { b: b, e: d.effs[i] }; });
    var chains = [{ from: d.effs[0], to: d.effs[3] }, { from: d.effs[1], to: d.effs[4] }];
    var target = rules[0];                       // button -> e0 -> e3
    if (rnd(2) === 0) {
      return base(grade, 'forward2', rules, chains, { b: target.b }, shuffle(['e:' + d.effs[3], 'e:' + d.effs[0], 'e:' + d.effs[4]]), 'e:' + d.effs[3],
        [['先想一想：按下去先发生什么？它还会引起别的事吗？', '先在按钮卡找，再在连锁卡接着找。', '要的是最后发生的那一件，不是中间那一件。'],
         ['First: what happens first? Does it cause anything else?', 'Find it on a button card, then keep going on the chain cards.', 'You want the LAST thing that happens, not the one in the middle.']]);
    }
    return base(grade, 'backward3', rules, chains, { want: [d.effs[3]] }, shuffle(rules.map(function (r) { return 'b:' + r.b; })), 'b:' + target.b,
      [['先想一想：我要让什么最后发生？', '先在连锁卡找：什么会引起它？再在按钮卡找：谁会引起那件事？', '试一试，机器会告诉你一路发生了什么。'],
       ['First: what must happen in the end?', 'On the chain cards find what causes it, then on the button cards find who causes that.', 'Try it — the machine will show everything that happens.']]);
  }

  var MAKERS = {
    K1: function () { return forward('K1', 2); },
    K2: function () { return forward('K2', 3); },
    G1: function () { return backward('G1'); },
    G2: function () { return chain('G2'); }
  };

  function generate(grade, count) {
    var mk = MAKERS[grade]; if (!mk) return [];
    var out = [], seen = {}, guard = 0;
    while (out.length < count && guard++ < count * 40) {
      var q = mk(); if (seen[q.key]) continue;
      seen[q.key] = 1; out.push(q);
    }
    return out;
  }

  return { generate: generate, outcome: outcome };
}());
