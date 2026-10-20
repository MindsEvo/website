'use strict';

/**
 * Color Pattern Hunter — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Modelled on games/difference-scout/game.js. LEVEL_GRADE, GENES, SESSION_SIZE
 * and the `base` table in difficultyAxisFor() are cross-checked against
 * metadata/mindseeds/color-pattern.json by metadata/validate.html (S2 / S3) —
 * keep them literal `var X = {` declarations, the validator reads this as text.
 *
 * Metadata:  /metadata/mindseeds/color-pattern.json
 * RootGene:  RG.PATTERN.VISUAL.COLOR
 */
(function () {

  var MODULE_ID      = 'color-pattern';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'color-pattern-hunter';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.PATTERN.VISUAL.COLOR'];

  // Mirrors color-pattern.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 6;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { unit_length: 'two',   blank_position: 'end',
            element_type: 'single', option_count: 'three' },
      K2: { unit_length: 'three', blank_position: 'end',
            element_type: 'single', option_count: 'four' },
      G1: { unit_length: 'four',  blank_position: 'any',
            element_type: 'single', option_count: 'four' },
      G2: { unit_length: 'three', blank_position: 'any',
            element_type: 'pair',   option_count: 'four' }
    }[gradeCode];
    return base ? Object.assign({}, base) : null;
  }

  function _unique(values) {
    return (values || []).filter(Boolean).filter(function (v, i, a) {
      return a.indexOf(v) === i;
    });
  }

  function buildRadarContext(gradeCode, extra) {
    var ctx = {
      moduleId:       MODULE_ID,
      moduleType:     MODULE_TYPE,
      levelId:        gradeCode,
      gradeCode:      LEVEL_GRADE[gradeCode] || null,
      difficultyAxis: difficultyAxisFor(gradeCode),
      sourceGameId:   SOURCE_GAME_ID
    };
    return extra ? Object.assign(ctx, extra) : ctx;
  }

  function buildUnits() {
    return GRADE_ORDER.map(function (g) {
      var meta = CPH_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon,
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: CPH_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.CPH_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: shell calls onResult before getReportContext in the same pass,
  // so a synchronous refill would make the report describe unseen items.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) { u.questions = CPH_GEN.generate(unitId, SESSION_SIZE); }
      });
    }, 0);
  }

  // ── Presentation ────────────────────────────────────────────────

  function bi(zh, en) { return '<span class="zh">' + zh + '</span><span class="en">' + en + '</span>'; }
  function applyLang(root) {
    var zh = shell.lang === 'zh';
    root.querySelectorAll('.zh').forEach(function (n) { n.style.display = zh ? '' : 'none'; });
    root.querySelectorAll('.en').forEach(function (n) { n.style.display = zh ? 'none' : ''; });
  }
  function key(e) { return CPH_GEN.keyOf(e); }

  function cDot(color, size) {
    var hex = (CPH_DATA.palette[color] || {}).hex || '#94a3b8';
    return '<span class="s1-cdot" style="background:' + hex + ';width:' + size + 'px;height:' + size + 'px"></span>';
  }

  function cCapsule(pair) {
    return '<span class="s1-ccapsule">' + cDot(pair[0], 30) + cDot(pair[1], 30) + '</span>';
  }

  function el(e, size) { return Array.isArray(e) ? cCapsule(e) : cDot(e, size); }

  (function injectStyles() {
    if (document.getElementById('cph-shell-style')) { return; }
    var s = document.createElement('style');
    s.id = 'cph-shell-style';
    s.textContent = [
      '.s1-seq{text-align:center !important;letter-spacing:0 !important;}',
      '.cph-scene{display:flex;flex-direction:column;align-items:center;gap:10px;}',
      '.cph-ask{font-size:16px;font-weight:900;color:#9a3412;background:#fff;border-radius:12px;padding:7px 12px;max-width:340px;line-height:1.45;}',
      '.cph-strip{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;background:#fff;border:2px solid #fed7aa;border-radius:14px;padding:8px 10px;max-width:100%;}',
      '.cph-cell{display:inline-flex;align-items:center;justify-content:center;min-width:34px;min-height:34px;border-radius:10px;}',
      '.cph-slot{border:3px dashed #fb923c;background:#fff7ed;font-size:20px;font-weight:900;color:#ea580c;cursor:pointer;font-family:inherit;padding:2px;min-width:46px;min-height:46px;}',
      '.cph-slot.on{border-style:solid;background:#fff;}',
      '.cph-pick{cursor:pointer;font-family:inherit;background:#fff;border:3px solid #cbd5e1;border-radius:12px;padding:4px 6px;touch-action:manipulation;}',
      '.cph-pick.sel{border-color:#ea580c;background:#ffedd5;}',
      '.cph-spot{cursor:pointer;font-family:inherit;background:#fff;border:3px solid transparent;border-radius:12px;padding:2px 3px;touch-action:manipulation;}',
      '.cph-spot.sel{border-color:#ea580c;background:#ffedd5;}',
      '.cph-spot.bad{border-color:#ef4444;background:#fee2e2;}',
      '.cph-tray{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}',
      '.cph-lbl{font-size:12px;font-weight:800;color:#64748b;}',
      '.cph-acts{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}',
      '.cph-btn{border:none;background:#ea580c;color:#fff;font-size:15px;font-weight:900;padding:8px 20px;border-radius:999px;cursor:pointer;font-family:inherit;}',
      '.cph-btn.hint{background:#0ea5e9;}',
      '.cph-btn.alt{background:#64748b;}',
      '.cph-msg{min-height:40px;max-width:340px;font-size:14px;font-weight:800;color:#7c2d12;line-height:1.5;background:#fff;border-radius:12px;padding:6px 10px;}',
      '.cph-msg:empty{display:none;}',
      '.cph-opt{font-size:20px;font-weight:900;}'
    ].join('');
    document.head.appendChild(s);
  }());

  function askText(q) {
    if (q.form === 'predict') return { zh: '这串颜色会一直重复下去。接着往后，接下来的 ' + q.need + ' 个依次是什么颜色？先点上面的空位，再点下面的颜色。', en: 'These colours keep repeating. What are the next ' + q.need + ' colours, in order? Tap a gap above, then a colour below.' };
    if (q.form === 'spot') return { zh: '这串颜色按规律重复，但有一个放错了。找出来，点它。', en: 'These colours repeat in a pattern, but one is wrong. Find it and tap it.' };
    return { zh: '这串颜色按规律重复，问号的位置该是什么颜色？先点问号，再点下面的颜色。', en: 'These colours repeat in a pattern. What colour goes in the gap? Tap the gap, then a colour below.' };
  }

  function unitName(q, lang) {
    return q.unit.map(function (e) {
      var p = CPH_DATA.palette;
      return Array.isArray(e) ? (lang === 'zh' ? '(' + p[e[0]].zh + p[e[1]].zh + ')' : '(' + p[e[0]].en + '+' + p[e[1]].en + ')') : p[e][lang];
    }).join(lang === 'zh' ? '' : '-');
  }

  // ── The board ─────────────────────────────────────────────────────────────
  function playBoard(q, host) {
    var size = q.cells.length > 8 ? 34 : q.cells.length > 6 ? 40 : 46;
    var tries = 0, hints = 0, done = false, sel = null, spotSel = null;
    var slots = q.form === 'predict' ? q.need : (q.form === 'fill' ? 1 : 0);
    var filled = [], active = 0;
    var HINTS = [
      ['先找：从头开始，哪一小段颜色在重复出现？', 'First: from the start, which short run of colours keeps coming back?'],
      ['再数一数：这一小段有几个颜色？每次重复开头是哪个？', 'Next: how many colours are in that run? Which colour starts each repeat?'],
      ['把这一小段一遍一遍往后接，到了空位就是答案。', 'Keep laying that run end to end - what lands on the gap is the answer.']
    ];
    function say(zh, en) { var m = host.querySelector('.cph-msg'); if (m) { m.innerHTML = bi(zh, en); applyLang(m); } }
    function finish(tier, zh, en) {
      done = true;
      q.result = { tier: tier, tries: tries, hints: hints, zh: zh, en: en };
      setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) { b.click(); } }, 1000);
    }
    function ending(first) {
      var f = first && hints === 0;
      return { tier: f ? 'best' : first ? 'better' : tries <= 2 ? 'good' : 'valid',
        zh: (f ? '⭐ ' : '') + (first ? '一次就发现规律了' : '试了 ' + tries + ' 次'), en: (f ? '⭐ ' : '') + (first ? 'Found the pattern in one go' : 'Took ' + tries + ' tries') };
    }

    function strip(arr, mode) {
      var h = '', placed = 0;
      arr.forEach(function (c, i) {
        if (c === null) {                                         // the gap of a fill question
          h += slotHtml(0);
        } else if (mode === 'spot') {
          h += '<button class="cph-spot' + (spotSel === i ? ' sel' : '') + '" data-s="' + i + '">' + el(c, size) + '</button>';
        } else h += '<span class="cph-cell">' + el(c, size) + '</span>';
      });
      if (q.form === 'predict') { for (var k = 0; k < q.need; k++) h += slotHtml(k); }
      return h;
    }
    function slotHtml(k) {
      var v = filled[k];
      return '<button class="cph-cell cph-slot' + (v !== undefined ? ' on' : '') + '" data-k="' + k + '"' + (active === k ? ' style="box-shadow:0 0 0 3px #ea580c"' : '') + '>' + (v !== undefined ? el(v, size) : '?') + '</button>';
    }

    function draw(msg) {
      var t = askText(q), tray = '';
      if (q.form !== 'spot') {
        tray = '<div class="cph-tray">' + q.choices.map(function (c, i) {
          return '<button class="cph-pick" data-c="' + i + '">' + el(c, 46) + '</button>';
        }).join('') + '</div>';
      }
      host.innerHTML = '<div class="cph-ask">' + bi(t.zh, t.en) + '</div><div class="cph-strip">' + strip(q.cells, q.form === 'spot' ? 'spot' : 'view') + '</div>' + tray +
        '<div class="cph-acts"><button class="cph-btn" id="cph-go">' + bi('✔ 就是它', '✔ This is it') + '</button><button class="cph-btn hint" id="cph-hint">' + bi('💡 提示', '💡 Hint') + '</button></div>' +
        '<div class="cph-msg">' + (msg || '') + '</div>';
      host.querySelectorAll('.cph-slot').forEach(function (b) { b.addEventListener('click', function () { if (!done) { active = +b.getAttribute('data-k'); draw(); } }); });
      host.querySelectorAll('.cph-pick').forEach(function (b) {
        b.addEventListener('click', function () {
          if (done) { return; }
          filled[active] = q.choices[+b.getAttribute('data-c')];
          if (q.form === 'predict' && active < q.need - 1) { active++; }
          draw();
        });
      });
      host.querySelectorAll('.cph-spot').forEach(function (b) { b.addEventListener('click', function () { if (!done) { spotSel = +b.getAttribute('data-s'); draw(); } }); });
      host.querySelector('#cph-go').addEventListener('click', submit);
      host.querySelector('#cph-hint').addEventListener('click', function () { if (done) { return; } hints++; var h = HINTS[Math.min(hints, 3) - 1]; say(h[0], h[1]); });
      applyLang(host);
    }

    // What the child's answer leads to: the strip, with the unit laid out under it.
    function show(arr, badAt) {
      return '<div class="cph-strip">' + arr.map(function (c, i) {
        return '<span class="cph-cell" style="' + (badAt === i ? 'background:#fee2e2;outline:3px solid #ef4444;' : '') + '">' + el(c, 30) + '</span>';
      }).join('') + '</div>';
    }
    function repeatRows(arr) {
      var u = q.unit.length, rows = '';
      for (var i = 0; i < arr.length; i += u) { rows += '<div class="cph-strip" style="margin-top:4px">' + arr.slice(i, i + u).map(function (c) { return '<span class="cph-cell">' + el(c, 28) + '</span>'; }).join('') + '</div>'; }
      return rows;
    }

    function submit() {
      if (done) { return; }
      if (q.form === 'spot') {
        if (spotSel === null) { return say('先点一个你觉得放错的颜色。', 'Tap the colour you think is wrong first.'); }
        tries++;
        if (spotSel === q.badIndex) {
          draw(''); var e = ending(tries === 1);
          say('✅ 找到了！这里本来应该是别的颜色，把它换回来，整串就按规律重复了。', '✅ Found it! Put the right colour back and the whole strip repeats.');
          return finish(e.tier, e.zh, e.en);
        }
        var swapped = q.cells.slice(); swapped[q.badIndex] = q.full[q.badIndex];
        spotSel = null; draw('');
        var m = host.querySelector('.cph-msg');
        m.innerHTML = bi('这一个本来就合规律。如果你把它当成放错的，那整串还剩别处对不上。按重复的小段一段一段往下看：', 'That one fits the pattern. Look at the repeating run, section by section:') + repeatRows(q.cells); applyLang(m);
        return;
      }
      var need = slots, got = [], i;
      for (i = 0; i < need; i++) { if (filled[i] === undefined) { return say('每个空位都要放一个颜色。', 'Fill every gap with a colour.'); } got.push(filled[i]); }
      tries++;
      var want = q.form === 'predict' ? q.target : [q.target];
      var wrongAt = -1;
      for (i = 0; i < need; i++) { if (key(got[i]) !== key(want[i])) { wrongAt = i; break; } }
      if (wrongAt < 0) {
        draw(''); var f = ending(tries === 1);
        say('✅ 对！整串颜色' + (q.form === 'predict' ? '一直重复下去' : '都合上了规律') + '：重复的小段是 ' + unitName(q, 'zh') + '。', '✅ Yes! The whole strip keeps the pattern. The repeating run is ' + unitName(q, 'en') + '.');
        return finish(f.tier, f.zh, f.en);
      }
      // wrong: lay the child's strip next to the repeating run and let them see where it breaks
      var pre = q.form === 'predict' ? q.cells.concat(got) : q.cells.map(function (c, k) { return k === q.blankIndex ? got[0] : c; });
      var breakAt = q.form === 'predict' ? q.cells.length + wrongAt : q.blankIndex;
      active = wrongAt; draw('');
      var mm = host.querySelector('.cph-msg');
      mm.innerHTML = bi('按你的选择，这串颜色会变成下面这样。红框的地方，和前面重复的小段对不上。再想想：', 'With your choice the strip becomes this. The red box does not match the repeating run. Think again:') + show(pre, breakAt); applyLang(mm);
      filled[wrongAt] = undefined;
    }
    draw('');
  }

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:         { primary: '#f97316', primary2: '#dc2626', bg: '#fff7ed' },
    gui: {
      header: { show: true, showBack: true },
      language: { enabled: true, default: 'en' },
      audio: {
        music: { enabled: true, defaultOn: false },
        sound: { enabled: true, defaultOn: true }
      },
      history: { enabled: true },
      help: {
        enabled: true,
        contentZh: '先找出重复的那一段颜色，再判断问号位置应该是什么。越往后重复段越长，空格也可能在中间；G2 要把两个颜色看成一组。',
        contentEn: 'Find the repeating run of colors first, then infer the missing one. Later grades use longer runs and the gap may be in the middle; at G2 two colors form one unit.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-color-pattern-intro-001'
      }
    },
    title:     { zh: '🎨 颜色规律',       en: '🎨 Color Pattern' },
    subtitle:  { zh: '发现颜色变化的规律', en: 'Discover the color pattern' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      container.innerHTML = '<div class="cph-scene" id="cph-host"></div>';
      q.result = null;
      playBoard(q, container.querySelector('#cph-host'));
      setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) { b.style.display = 'none'; } }, 0);
    },

    renderOption: function () { return '<span class="cph-opt">✔</span>'; },

    checkAnswer: function (selected, q) { return !!q.result; },

    onAnswer: function (selected, q, correct) {
      if (!correct || !q.result) { return; }
      setTimeout(function () {
        var fb = document.getElementById('s1-fb'); if (!fb) { return; }
        fb.innerHTML += '<div>' + bi(q.result.zh, q.result.en) + '</div>';
        applyLang(fb);
      }, 0);
    },

    getVoiceText: function (q) {
      var t = askText(q);
      return shell.lang === 'zh' ? t.zh : t.en;
    },

    registerRootGenes: function () { return GENES.slice(); },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      var played = questions.filter(function (q) { return q.result; });
      var extra = {
        shapes:          _unique(questions.map(function (q) { return q.shape; })),
        forms:           _unique(questions.map(function (q) { return q.form; })),
        geneIds:         GENES.slice(),
        activityRuntime: 'puzzle'
      };
      if (played.length) {
        var tiers = { best: 0, better: 0, good: 0, valid: 0 };
        played.forEach(function (q) { tiers[q.result.tier]++; });
        extra.process = {
          tiers: tiers, optimalCount: tiers.best,
          retries: played.reduce(function (n, q) { return n + Math.max(0, q.result.tries - 1); }, 0),
          hints: played.reduce(function (n, q) { return n + q.result.hints; }, 0)
        };
      }
      refillUnit(unit.id);
      return buildRadarContext(unit.id, extra);
    }
  });
}());
