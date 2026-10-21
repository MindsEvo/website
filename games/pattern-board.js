'use strict';

/**
 * PatternBoard — the shared hands-on board of the Pattern Hunter games (MindSeeds).
 * See docs/mindseeds/PATTERN-HUNTER-ARCHITECTURE.md.
 *
 * A game keeps its own generator (which still makes the fill-in strip) and writes a small
 * ADAPTER; this file turns each generated strip into one of three task forms:
 *   fill     the gap is filled by the child                      (pattern extraction)
 *   predict  the strip is complete, the child lays down the next m (prediction)
 *   spot     one element was swapped, the child finds it            (change detection)
 * The child acts on the board; a wrong try is not marked red - the strip that follows from the
 * choice is shown with the mismatch outlined, and the child tries again. Finishing passes;
 * right first with no hint earns a star; retries/hints go into the report `process`.
 * The hidden confirm button is clicked by the board (same hook as the Strategy Master games).
 *
 * adapter = {
 *   kind: 'sym' | 'num',  mod: number?,              // num: arithmetic (optionally modulo mod)
 *   full(q), blank(q), answer(q), options(q),        // the complete strip, gap index, answer, distractors
 *   render(tok, size, q) -> html,  key(tok)?, valid(tok, q)?,
 *   num(tok)?, tok(n)?,                              // num kinds whose tokens are not numbers
 *   cycle(q)?,                                       // a known cycle (days, seasons) to continue
 *   noun(q) -> {zh, en},  canPredict(q)?, canSpot(q)?
 * }
 */
var PatternBoard = (function () {

  var FORMS = { K1: ['fill'], K2: ['fill', 'predict'], G1: ['fill', 'predict', 'spot'], G2: ['fill', 'predict', 'spot'] };

  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[rnd(a.length)]; }
  function key(ad, t) { return ad.key ? ad.key(t) : (t !== null && typeof t === 'object' ? JSON.stringify(t) : String(t)); }
  function uniq(ad, arr) { var seen = {}; return arr.filter(function (t) { var k = key(ad, t); if (seen[k]) return false; seen[k] = 1; return true; }); }
  function resolve(ad, q) { return ad.resolve ? Object.assign({}, ad, ad.resolve(q)) : ad; }

  // A numeric view of a strip: numbers (or positions in a known cycle), a modulus (0 = none), and the way back to tokens.
  function view(ad, full, q) {
    if (ad.cycle) {
      var cyc = ad.cycle(q), idx = full.map(function (t) { return cyc.map(function (c) { return key(ad, c); }).indexOf(key(ad, t)); });
      if (idx.some(function (x) { return x < 0; })) { return null; }
      return { nums: idx, mod: cyc.length, tok: function (n) { return cyc[n]; }, unit: 1 };
    }
    if (ad.kind === 'num') {
      return { nums: full.map(function (t) { return ad.num ? ad.num(t) : Number(t); }), mod: ad.mod || 0, tok: function (n) { return ad.tok ? ad.tok(n) : n; }, unit: ad.stepUnit ? ad.stepUnit() : 1 };
    }
    return null;
  }
  function wrapv(v, mod) { return mod ? ((v % mod) + mod) % mod : v; }

  // ── Rule detection on a complete strip ────────────────────────────────────
  function detect(ad, full, q) {
    var n = full.length, i, p, vw = view(ad, full, q);
    if (vw && n >= 3) {
      var nums = vw.nums, d = [];
      for (i = 0; i + 1 < n; i++) { d.push(wrapv(nums[i + 1] - nums[i], vw.mod)); }
      if (d.every(function (x) { return x === d[0]; })) {
        return { type: 'arith', d: d[0], vw: vw, ext: function (m) { var o = [], v = nums[n - 1]; for (var k = 0; k < m; k++) { v = wrapv(v + d[0], vw.mod); o.push(vw.tok(v)); } return o; } };
      }
      if (!vw.mod && n >= 4) {
        var d2 = []; for (i = 0; i + 1 < d.length; i++) { d2.push(d[i + 1] - d[i]); }
        if (d2.every(function (x) { return x === d2[0]; })) {
          return { type: 'arith2', d: d[d.length - 1], vw: vw, ext: function (m) { var o = [], v = nums[n - 1], step = d[d.length - 1]; for (var k = 0; k < m; k++) { step += d2[0]; v += step; o.push(vw.tok(v)); } return o; } };
        }
      }
    }
    for (p = 1; p <= Math.floor(n / 2); p++) {
      var ok = true;
      for (i = 0; i + p < n; i++) { if (key(ad, full[i]) !== key(ad, full[i + p])) { ok = false; break; } }
      if (ok) { return { type: 'period', p: p, ext: function (m) { var o = []; for (var k = 0; k < m; k++) { o.push(full[(n + k) % p]); } return o; } }; }
    }
    return null;
  }

  // How many positions j could be "the wrong one" (the rest fitting the rule)? A good spot question has exactly one.
  function explainers(ad, cells, rule) {
    var n = cells.length, count = 0, j, i;
    for (j = 0; j < n; j++) {
      var pts = []; for (i = 0; i < n; i++) { if (i !== j) { pts.push(i); } }
      var good = false;
      if (rule.type === 'arith') {
        var vw = rule.vw, nums = cells.map(function (t) { return t === null ? 0 : numberOf(ad, t, rule); });
        var rng = vw.mod ? vw.mod : 401, off = vw.mod ? 0 : -200;
        for (var dd = 0; dd < rng && !good; dd++) {
          var dv = dd + off, ok = true;
          for (i = 1; i < pts.length; i++) { if (wrapv(nums[pts[0]] + dv * (pts[i] - pts[0]), vw.mod) !== wrapv(nums[pts[i]], vw.mod)) { ok = false; break; } }
          if (ok) { good = true; }
        }
      } else if (rule.type === 'period') {
        var seen = {}; good = true;
        pts.forEach(function (x) { var r = x % rule.p, k = key(ad, cells[x]); if (seen[r] !== undefined && seen[r] !== k) { good = false; } seen[r] = k; });
      }
      if (good) { count++; }
    }
    return count;
  }
  function baseOf(ad, q, t) {
    if (ad.cycle) { return ad.cycle(q).map(function (c) { return key(ad, c); }).indexOf(key(ad, t)); }
    return ad.num ? ad.num(t) : Number(t);
  }
  function numberOf(ad, t, rule) { return baseOf(ad, rule.q, t); }


  // ── Multi-dimension strips (a card carries several attributes, each with its own rule) ──
  function subAd(ad, d) {
    var vals = ad.values(d);
    if (!ad.ordered(d)) { return { kind: 'sym' }; }
    return { kind: 'num', mod: ad.cyclic && ad.cyclic(d) ? vals.length : 0, num: function (t) { return vals.indexOf(t); }, tok: function (n) { return vals[n]; } };
  }
  function multiBoard(ad, q, form, full, options, opts) {
    var dims = ad.dims(q), parts = dims.map(function (d) {
      var sa = subAd(ad, d), seq = full.map(function (c) { return c[d]; }), rule = detect(sa, seq, q);
      if (rule) { rule.q = q; }
      return { d: d, sa: sa, seq: seq, rule: rule, vals: ad.values(d) };
    });
    if (parts.some(function (p) { return !p.rule; })) { return null; }
    function card(vals) { var c = {}; dims.forEach(function (d, i) { c[d] = vals[i]; }); return c; }
    function okVal(p, v) { return v !== undefined && p.vals.indexOf(v) >= 0; }
    var n = full.length;

    if (form === 'predict') {
      var want = opts.need || (q.gradeCode === 'G2' ? 3 : 2), m, ext = null;
      for (m = want; m >= 1 && !ext; m--) {
        var cand = parts.map(function (p) { return p.rule.ext(m); });
        if (cand.every(function (e, i) { return e.every(function (v) { return okVal(parts[i], v); }); })) { ext = cand; }
      }
      if (!ext || parts.some(function (p) { return p.rule.type === 'period' && n < 2 * p.rule.p; })) { return null; }
      var k, target = [];
      for (k = 0; k < ext[0].length; k++) { target.push(card(ext.map(function (e) { return e[k]; }))); }
      var pool = target.slice();
      target.forEach(function (t) {
        dims.forEach(function (d, di) {
          var others = parts[di].vals.filter(function (v) { return v !== t[d]; });
          var c = Object.assign({}, t); c[d] = pick(others); pool.push(c);
        });
      });
      pool = uniq(ad, pool);
      var must = uniq(ad, target), rest = shuffle(pool.filter(function (t) { return !must.some(function (x) { return key(ad, x) === key(ad, t); }); }));
      return { form: 'predict', cells: full.slice(), need: target.length, target: target, choices: shuffle(must.concat(rest.slice(0, Math.max(0, 6 - must.length)))), rule: null };
    }
    for (var attempt = 0; attempt < 16; attempt++) {                                  // spot
      var bad = rnd(n), pi = rnd(dims.length), p = parts[pi];
      if (p.rule.type === 'period' ? n < 3 * p.rule.p : n < 5) { continue; }
      var others2 = p.vals.filter(function (v) { return v !== full[bad][p.d]; });
      var nv = pick(others2), seq2 = p.seq.slice(); seq2[bad] = nv;
      if (explainers(p.sa, seq2, p.rule) !== 1) { continue; }
      var cells = full.map(function (c) { return Object.assign({}, c); });
      cells[bad][p.d] = nv;
      return { form: 'spot', cells: cells, full: full, badIndex: bad, rule: null, badDim: p.d };
    }
    return null;
  }

  // ── Turn a generated question into a board question ───────────────────────
  function decorate(questions, adIn, opts) {
    opts = opts || {};
    return questions.map(function (q, qi) {
      var ad = resolve(adIn, q);
      var forms = (opts.forms && opts.forms[q.gradeCode]) || FORMS[q.gradeCode] || ['fill'];
      var form = forms[qi % forms.length];
      var full = ad.full(q), bi = ad.blank(q), ans = ad.answer(q), options = ad.options(q);
      var valid = function (t) { return ad.valid ? ad.valid(t, q) : true; };
      var rule = null, pb = null, u = ad.stepUnit ? ad.stepUnit() : 1;
      if (form !== 'fill' && !ad.dims) { rule = detect(ad, full, q); if (rule) { rule.q = q; } }
      if (form !== 'fill' && ad.dims) { pb = multiBoard(ad, q, form, full, options, opts); }

      if (!pb && form === 'predict' && rule && (ad.canPredict ? ad.canPredict(q) : true)) {
        var want = opts.need || (q.gradeCode === 'G2' ? 3 : 2), m, target = [];
        for (m = want; m >= 1; m--) { target = rule.ext(m); if (target.every(valid)) { break; } target = []; }
        if (target.length && (rule.type !== 'period' || full.length >= 2 * rule.p)) {
          var pool = target.concat(options);
          if (rule.vw) {
            target.forEach(function (t) {
              [u, -u, 2 * u, -2 * u].forEach(function (dx) { pool.push(rule.vw.tok(wrapv(baseOf(ad, q, t) + dx, rule.vw.mod))); });
            });
          } else { pool = pool.concat(full.slice(0, 4)); }
          pool = uniq(ad, pool.filter(valid));
          var must = uniq(ad, target), rest = shuffle(pool.filter(function (t) { return !must.some(function (x) { return key(ad, x) === key(ad, t); }); }));
          pb = { form: 'predict', cells: full.slice(), need: target.length, target: target, choices: shuffle(must.concat(rest.slice(0, Math.max(0, 6 - must.length)))), rule: rule };
        }
      }
      if (!pb && form === 'spot' && rule && rule.type !== 'arith2' && (ad.canSpot ? ad.canSpot(q) : true)) {
        var n = full.length;
        if (rule.type === 'period' ? n >= 3 * rule.p : n >= 5) {
          for (var attempt = 0; attempt < 12 && !pb; attempt++) {
            var bad = rnd(n), orig = full[bad], cand = [];
            if (rule.vw) {
              var base = baseOf(ad, q, orig);
              [u, -u, 2 * u, -2 * u, rule.d, -rule.d].forEach(function (dx) { cand.push(rule.vw.tok(wrapv(base + dx, rule.vw.mod))); });
            }
            cand = cand.concat(options).concat(rule.type === 'period' ? full : []);
            cand = uniq(ad, cand.filter(function (t) { return valid(t) && key(ad, t) !== key(ad, orig); }));
            if (!cand.length) { continue; }
            var cells = full.slice(); cells[bad] = pick(cand);
            if (explainers(ad, cells, rule) === 1) { pb = { form: 'spot', cells: cells, full: full, badIndex: bad, rule: rule }; }
          }
        }
      }
      if (!pb) {
        var cellsF = full.slice(); cellsF[bi] = null;
        pb = { form: 'fill', cells: cellsF, blankIndex: bi, target: [ans], choices: shuffle(uniq(ad, options.concat([ans]))), rule: rule, full: full };
      }
      q.ad = ad; q.pb = pb; q.form = pb.form;
      q.interactive = true; q.options = ['done']; q.answer = 'done'; q.optionTypes = { done: 'pattern_board' };
      return q;
    });
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  function bi(zh, en) { return '<span class="zh">' + zh + '</span><span class="en">' + en + '</span>'; }
  function applyLang(root) {
    var zh = shell.lang === 'zh';
    root.querySelectorAll('.zh').forEach(function (n) { n.style.display = zh ? '' : 'none'; });
    root.querySelectorAll('.en').forEach(function (n) { n.style.display = zh ? 'none' : ''; });
  }

  (function injectStyles() {
    if (document.getElementById('pb-style')) { return; }
    var s = document.createElement('style');
    s.id = 'pb-style';
    s.textContent = [
      '.s1-seq{text-align:center !important;letter-spacing:0 !important;}',
      '.pb-scene{display:flex;flex-direction:column;align-items:center;gap:10px;}',
      '.pb-ask{font-size:16px;font-weight:900;color:#334155;background:#fff;border-radius:12px;padding:7px 12px;max-width:340px;line-height:1.45;}',
      '.pb-strip{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;background:#fff;border:2px solid #cbd5e1;border-radius:14px;padding:8px 10px;max-width:100%;}',
      '.pb-cell{display:inline-flex;align-items:center;justify-content:center;min-width:34px;min-height:34px;border-radius:10px;font-size:26px;font-weight:900;color:#0f172a;}',
      '.pb-slot{border:3px dashed var(--s1-primary,#0ea5e9);background:#f8fafc;font-size:20px;font-weight:900;color:var(--s1-primary,#0ea5e9);cursor:pointer;font-family:inherit;padding:2px 4px;min-width:46px;min-height:46px;touch-action:manipulation;}',
      '.pb-slot.on{border-style:solid;background:#fff;}',
      '.pb-slot.act{box-shadow:0 0 0 3px var(--s1-primary,#0ea5e9);}',
      '.pb-pick{cursor:pointer;font-family:inherit;background:#fff;border:3px solid #cbd5e1;border-radius:12px;padding:4px 8px;touch-action:manipulation;font-size:26px;font-weight:900;color:#0f172a;}',
      '.pb-spot{cursor:pointer;font-family:inherit;background:#fff;border:3px solid transparent;border-radius:12px;padding:2px 4px;touch-action:manipulation;font-size:26px;font-weight:900;color:#0f172a;}',
      '.pb-spot.sel{border-color:var(--s1-primary,#0ea5e9);background:#e0f2fe;}',
      '.pb-bad{background:#fee2e2 !important;outline:3px solid #ef4444;}',
      '.pb-tray{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}',
      '.pb-diffs{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-top:6px;}',
      '.pb-diff{font-size:14px;font-weight:900;color:#475569;background:#f1f5f9;border-radius:8px;padding:2px 8px;}',
      '.pb-diff.x{color:#b91c1c;background:#fee2e2;}',
      '.pb-acts{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}',
      '.pb-btn{border:none;background:var(--s1-primary,#0ea5e9);color:#fff;font-size:15px;font-weight:900;padding:8px 20px;border-radius:999px;cursor:pointer;font-family:inherit;}',
      '.pb-btn.hint{background:#64748b;}',
      '.pb-msg{min-height:40px;max-width:340px;font-size:14px;font-weight:800;color:#334155;line-height:1.5;background:#fff;border-radius:12px;padding:6px 10px;}',
      '.pb-msg:empty{display:none;}',
      '.pb-opt{font-size:20px;font-weight:900;}'
    ].join('');
    document.head.appendChild(s);
  }());

  function askText(q) {
    var ad = q.ad, nn = ad.noun ? ad.noun(q) : { zh: '图案', en: 'items' }, pb = q.pb;
    if (pb.form === 'predict') {
      return { zh: '这串' + nn.zh + '按规律一直排下去。接下来的 ' + pb.need + ' 个依次是什么？先点上面的空位，再点下面的。', en: 'This row of ' + nn.en + ' keeps going by a rule. What are the next ' + pb.need + ', in order? Tap a gap above, then one below.' };
    }
    if (pb.form === 'spot') {
      return { zh: '这串' + nn.zh + '按规律排，但有一个放错了。找出来，点它。', en: 'This row of ' + nn.en + ' follows a rule, but one is wrong. Find it and tap it.' };
    }
    return { zh: '这串' + nn.zh + '按规律排，问号处该是哪个？先点问号，再点下面的。', en: 'This row of ' + nn.en + ' follows a rule. Which one goes in the gap? Tap the gap, then one below.' };
  }

  function mount(q, container) {
    container.classList.add('pb-seq');
    container.innerHTML = '<div class="pb-scene" id="pb-host"></div>';
    q.result = null;
    play(q, container.querySelector('#pb-host'));
    setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) { b.style.display = 'none'; } }, 0);
  }

  function play(q, host) {
    var ad = q.ad, pb = q.pb, size = pb.cells.length + (pb.need || 0) > 9 ? 30 : pb.cells.length + (pb.need || 0) > 7 ? 36 : 44;
    var tries = 0, hints = 0, done = false, spotSel = null, active = 0, filled = [];
    var slots = pb.form === 'predict' ? pb.need : pb.form === 'fill' ? 1 : 0;
    var r = pb.rule, numeric = !!(r && r.vw);
    var HINTS = numeric
      ? [['先看：相邻的两个之间，变化是多少？', 'First: how much do neighbours differ by?'], ['再看：每一步的变化一样吗？', 'Next: is every step the same change?'], null]
      : [['先找：从头开始，哪一小段在重复出现？', 'First: from the start, which short run keeps coming back?'], ['再数一数：这一小段有几个？每次重复从哪个开始？', 'Next: how many are in the run, and which starts each repeat?'], null];

    function say(zh, en) { var m = host.querySelector('.pb-msg'); if (m) { m.innerHTML = bi(zh, en); applyLang(m); } }
    function el(t, s) { return ad.render(t, s || size, q); }
    function finish(first) {
      var f = first && hints === 0;
      done = true;
      q.result = { tier: f ? 'best' : first ? 'better' : tries <= 2 ? 'good' : 'valid', tries: tries, hints: hints,
        zh: (f ? '⭐ ' : '') + (first ? '一次发现规律了' : '试了 ' + tries + ' 次'), en: (f ? '⭐ ' : '') + (first ? 'Found the pattern in one go' : 'Took ' + tries + ' tries') };
      setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) { b.click(); } }, 1000);
    }
    function slotHtml(k) {
      var v = filled[k];
      return '<button class="pb-cell pb-slot' + (v !== undefined ? ' on' : '') + (active === k ? ' act' : '') + '" data-k="' + k + '">' + (v !== undefined ? el(v) : '?') + '</button>';
    }
    function strip() {
      var h = '';
      pb.cells.forEach(function (c, i) {
        if (c === null) { h += slotHtml(0); }
        else if (pb.form === 'spot') { h += '<button class="pb-spot' + (spotSel === i ? ' sel' : '') + '" data-s="' + i + '">' + el(c) + '</button>'; }
        else { h += '<span class="pb-cell">' + el(c) + '</span>'; }
      });
      if (pb.form === 'predict') { for (var k = 0; k < pb.need; k++) { h += slotHtml(k); } }
      return h;
    }

    function draw(msg) {
      var t = askText(q), tray = '';
      if (pb.form !== 'spot') {
        tray = '<div class="pb-tray">' + pb.choices.map(function (c, i) { return '<button class="pb-pick" data-c="' + i + '">' + el(c, 44) + '</button>'; }).join('') + '</div>';
      }
      host.innerHTML = '<div class="pb-ask">' + bi(t.zh, t.en) + '</div><div class="pb-strip">' + strip() + '</div>' + tray +
        '<div class="pb-acts"><button class="pb-btn" id="pb-go">' + bi('✔ 就是它', '✔ This is it') + '</button><button class="pb-btn hint" id="pb-hint">' + bi('💡 提示', '💡 Hint') + '</button></div>' +
        '<div class="pb-msg">' + (msg || '') + '</div>';
      host.querySelectorAll('.pb-slot').forEach(function (b) { b.addEventListener('click', function () { if (!done) { active = +b.getAttribute('data-k'); draw(); } }); });
      host.querySelectorAll('.pb-pick').forEach(function (b) {
        b.addEventListener('click', function () {
          if (done) { return; }
          filled[active] = pb.choices[+b.getAttribute('data-c')];
          if (pb.form === 'predict' && active < pb.need - 1) { active++; }
          draw();
        });
      });
      host.querySelectorAll('.pb-spot').forEach(function (b) { b.addEventListener('click', function () { if (!done) { spotSel = +b.getAttribute('data-s'); draw(); } }); });
      host.querySelector('#pb-go').addEventListener('click', submit);
      host.querySelector('#pb-hint').addEventListener('click', function () {
        if (done) { return; }
        hints++;
        if (hints <= 2) { return say(HINTS[hints - 1][0], HINTS[hints - 1][1]); }
        say(q.hintZh || '把已经看出的规律，一格一格往后接。', q.hintEn || 'Carry the rule on, one cell at a time.');
      });
      applyLang(host);
    }

    // The strip that follows from the child's choice, mismatch outlined, with how it reads.
    function consequence(arr, badAt) {
      var h = '<div class="pb-strip" style="margin-top:6px">' + arr.map(function (c, i) {
        return '<span class="pb-cell' + (i === badAt ? ' pb-bad' : '') + '">' + el(c, 30) + '</span>';
      }).join('') + '</div>';
      if (numeric && r.type === 'arith' && !ad.cycle) {
        var ds = [];
        for (var i = 0; i + 1 < arr.length; i++) {
          var dv = wrapv((ad.num ? ad.num(arr[i + 1]) : Number(arr[i + 1])) - (ad.num ? ad.num(arr[i]) : Number(arr[i])), ad.mod || 0); if (ad.mod && dv > ad.mod / 2) { dv -= ad.mod; }
          ds.push('<span class="pb-diff' + (dv !== (ad.mod && r.d > ad.mod / 2 ? r.d - ad.mod : r.d) ? ' x' : '') + '">' + ((ad.mod ? (dv > 0 ? '+' : '') + dv + '°' : (dv >= 0 ? '+' + dv : dv))) + '</span>');
        }
        h += '<div class="pb-diffs">' + ds.join('') + '</div>';
      } else if (r && r.type === 'period') {
        h = '';
        for (var s = 0; s < arr.length; s += r.p) {
          h += '<div class="pb-strip" style="margin-top:4px">' + arr.slice(s, s + r.p).map(function (c, k) {
            return '<span class="pb-cell' + (s + k === badAt ? ' pb-bad' : '') + '">' + el(c, 28) + '</span>';
          }).join('') + '</div>';
        }
      }
      return h;
    }
    function explain(zh, en, html) { var m = host.querySelector('.pb-msg'); m.innerHTML = bi(zh, en) + html; applyLang(m); }

    function submit() {
      if (done) { return; }
      var i;
      if (pb.form === 'spot') {
        if (spotSel === null) { return say('先点一个你觉得放错的。', 'Tap the one you think is wrong first.'); }
        tries++;
        if (spotSel === pb.badIndex) {
          draw(''); say('✅ 找到了！换回正确的，整串就合上规律了。' + (ad.reveal ? ad.reveal(q).zh : ''), '✅ Found it! Put the right one back and the whole row follows the rule. ' + (ad.reveal ? ad.reveal(q).en : ''));
          return finish(tries === 1);
        }
        spotSel = null; draw('');
        return explain('这一个其实合规律。看看整串是怎么排的，对不上的地方在别处：', 'That one fits. Look at how the row is laid out - the mismatch is elsewhere:', consequence(pb.cells, -1));
      }
      var got = [];
      for (i = 0; i < slots; i++) { if (filled[i] === undefined) { return say('每个空位都要放一个。', 'Fill every gap.'); } got.push(filled[i]); }
      tries++;
      var wrongAt = -1;
      for (i = 0; i < slots; i++) { if (key(ad, got[i]) !== key(ad, pb.target[i])) { wrongAt = i; break; } }
      if (wrongAt < 0) {
        draw(''); say('✅ 对！整串都合上了规律。' + (ad.reveal ? ad.reveal(q).zh : ''), '✅ Yes! The whole row follows the rule. ' + (ad.reveal ? ad.reveal(q).en : ''));
        return finish(tries === 1);
      }
      var arr = pb.form === 'predict' ? pb.cells.concat(got) : pb.cells.map(function (c, k) { return k === pb.blankIndex ? got[0] : c; });
      var at = pb.form === 'predict' ? pb.cells.length + wrongAt : pb.blankIndex;
      active = wrongAt; filled[wrongAt] = undefined; draw('');
      explain('按你的选择，这串会变成下面这样。红框的地方，和前面的规律对不上。再想想：', 'With your choice the row becomes this. The red box breaks the rule. Think again:', consequence(arr, at));
    }
    draw('');
  }

  // ── Shell hooks and report ────────────────────────────────────────────────
  function hooks() {
    return {
      renderSequence: function (q, container) { mount(q, container); },
      renderOption: function () { return '<span class="pb-opt">✔</span>'; },
      checkAnswer: function (selected, q) { return !!q.result; },
      onAnswer: function (selected, q, correct) {
        if (!correct || !q.result) { return; }
        setTimeout(function () {
          var fb = document.getElementById('s1-fb'); if (!fb) { return; }
          fb.innerHTML += '<div>' + bi(q.result.zh, q.result.en) + '</div>'; applyLang(fb);
        }, 0);
      },
      getVoiceText: function (q) { var t = askText(q); return shell.lang === 'zh' ? t.zh : t.en; }
    };
  }

  function addProcess(questions, ctx) {
    var played = (questions || []).filter(function (q) { return q.result; });
    ctx.forms = (questions || []).map(function (q) { return q.form; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
    if (played.length) {
      var tiers = { best: 0, better: 0, good: 0, valid: 0 };
      played.forEach(function (q) { tiers[q.result.tier]++; });
      ctx.process = {
        tiers: tiers, optimalCount: tiers.best,
        retries: played.reduce(function (n, q) { return n + Math.max(0, q.result.tries - 1); }, 0),
        hints: played.reduce(function (n, q) { return n + q.result.hints; }, 0)
      };
    }
    return ctx;
  }

  return { decorate: decorate, hooks: hooks, addProcess: addProcess, detect: detect };
}());
