'use strict';

/**
 * Logic Pattern Hunter — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * Children build the complete comparison chain on an ordering board. Finishing
 * passes through the Shell's hidden option; retries, hints, and result tiers are
 * retained in report context.
 *
 * Metadata:  /metadata/mindseeds/logic-pattern.json
 * RootGene:  RG.LOGIC.REASONING.BASIC
 */
(function () {

  var MODULE_ID      = 'logic-pattern';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'logic-pattern-hunter';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.LOGIC.REASONING.BASIC'];

  // Mirrors logic-pattern.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 5;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { premise_count: 'one',   question_form: 'same-word',
            premise_order: 'chained',  option_count: 'two' },
      K2: { premise_count: 'one',   question_form: 'opposite-word',
            premise_order: 'chained',  option_count: 'two' },
      G1: { premise_count: 'two',   question_form: 'extreme',
            premise_order: 'chained',  option_count: 'three' },
      G2: { premise_count: 'three', question_form: 'rank',
            premise_order: 'shuffled', option_count: 'four' }
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
      var meta = LP_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon,
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: LP_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.LP_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred so the report describes the questions that were actually played.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) { u.questions = LP_GEN.generate(unitId, SESSION_SIZE); }
      });
    }, 0);
  }

  (function injectLogicStyles() {
    if (document.getElementById('lph-style')) { return; }
    var s = document.createElement('style');
    s.id = 'lph-style';
    s.textContent = [
      '.s1-seq{text-align:center !important;letter-spacing:0 !important;}',
      '.lph-wrap{display:grid;gap:10px;text-align:left;width:100%;}',
      '.lph-premises{display:grid;gap:7px;}',
      '.lph-premise{display:flex;gap:8px;align-items:flex-start;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;}',
      '.lph-num{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:#ede9fe;color:#6d28d9;font-size:12px;font-weight:900;flex-shrink:0;margin-top:1px;}',
      '.lph-text{color:#334155;font-size:15px;line-height:1.55;font-weight:700;}',
      '.lph-direction{text-align:center;background:#faf5ff;border:1px solid #ddd6fe;border-radius:10px;padding:8px 10px;color:#3b0764;font-size:15px;font-weight:900;}',
      '.lph-board{display:flex;align-items:stretch;justify-content:center;gap:6px;flex-wrap:wrap;touch-action:none;}',
      '.lph-card{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:5px;min-width:112px;min-height:68px;padding:7px;background:#fff;border:3px solid #8b5cf6;border-radius:14px;font-family:inherit;color:#3b0764;cursor:grab;user-select:none;touch-action:none;}',
      '.lph-card:focus{outline:3px solid #f59e0b;outline-offset:2px;}',
      '.lph-card.dragging{opacity:.45;cursor:grabbing;}',
      '.lph-card.bad-left{border-color:#dc2626;background:#fef2f2;}',
      '.lph-rank{display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#7c3aed;color:#fff;font-size:12px;font-weight:900;}',
      '.lph-person{display:grid;justify-items:center;gap:2px;}',
      '.lph-person-e{font-size:27px;line-height:1;}',
      '.lph-person-n{font-size:14px;font-weight:900;}',
      '.lph-move{display:grid;gap:2px;}',
      '.lph-move button{width:25px;height:24px;border:0;border-radius:7px;background:#ede9fe;color:#5b21b6;font-weight:900;cursor:pointer;}',
      '.lph-actions{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;}',
      '.lph-submit,.lph-hint{border:0;border-radius:999px;padding:8px 18px;color:#fff;font-family:inherit;font-size:15px;font-weight:900;cursor:pointer;}',
      '.lph-submit{background:#7c3aed;}.lph-hint{background:#0ea5e9;}',
      '.lph-msg{min-height:44px;background:#fff;border-radius:10px;padding:7px 10px;text-align:center;color:#4c1d95;font-size:14px;font-weight:800;line-height:1.5;}',
      '.lph-msg:empty{display:none;}',
      '.lph-opt{font-size:20px;font-weight:900;}'
    ].join('');
    document.head.appendChild(s);
  }());

  function bi(zh, en) {
    return '<span class="zh">' + zh + '</span><span class="en">' + en + '</span>';
  }

  function applyLang(root) {
    var zh = shell.lang === 'zh';
    root.querySelectorAll('.zh').forEach(function (n) { n.style.display = zh ? '' : 'none'; });
    root.querySelectorAll('.en').forEach(function (n) { n.style.display = zh ? 'none' : ''; });
  }

  function orderLabel(q) {
    return LP_DATA.relations[q.relation];
  }

  function playBoard(q, host) {
    var order = q.options.slice();
    var tries = 0;
    var hints = 0;
    var done = false;
    var badIndex = -1;
    var draggedId = null;

    function sameOrder(a, b) {
      return a.length === b.length && a.every(function (id, i) { return id === b[i]; });
    }

    function personHtml(id) {
      var d = q.optionDefs[id];
      return '<span class="lph-person"><span class="lph-person-e">' + d.e + '</span>' +
        '<span class="lph-person-n">' + bi(d.zh, d.en) + '</span></span>';
    }

    function say(zh, en) {
      var el = host.querySelector('.lph-msg');
      if (el) {
        el.innerHTML = bi(zh, en);
        applyLang(el);
      }
    }

    function firstFailingPair() {
      for (var i = 0; i < order.length - 1; i++) {
        if (q.expectedOrder.indexOf(order[i]) > q.expectedOrder.indexOf(order[i + 1])) {
          return i;
        }
      }
      return -1;
    }

    function move(id, delta) {
      if (done) { return; }
      var from = order.indexOf(id);
      var to = Math.max(0, Math.min(order.length - 1, from + delta));
      if (from === to) { return; }
      order.splice(from, 1);
      order.splice(to, 0, id);
      badIndex = -1;
      draw();
      var card = host.querySelector('[data-id="' + id + '"]');
      if (card) { card.focus(); }
    }

    function finish() {
      done = true;
      var first = tries === 1;
      q.result = {
        tier: first && hints === 0 ? 'best' : first ? 'better' : tries <= 2 ? 'good' : 'valid',
        tries: tries,
        hints: hints,
        zh: (first && hints === 0 ? '⭐ ' : '') + (first ? '一次就排对了' : '试了 ' + tries + ' 次排对'),
        en: (first && hints === 0 ? '⭐ ' : '') + (first ? 'Ordered correctly on the first try' : 'Ordered correctly in ' + tries + ' tries')
      };
      say('排对了！整条关系链都成立。', 'Correct! Every relation in the chain works.');
      setTimeout(function () {
        var option = document.querySelector('.s1-opt');
        if (option) { option.click(); }
      }, 700);
    }

    function submit() {
      if (done) { return; }
      tries++;
      if (sameOrder(order, q.expectedOrder)) {
        finish();
        return;
      }
      badIndex = firstFailingPair();
      draw();
      if (badIndex >= 0) {
        var left = q.optionDefs[order[badIndex]];
        var right = q.optionDefs[order[badIndex + 1]];
        say(
          left.zh + ' 和 ' + right.zh + ' 这一对的前后关系不符合线索。调整后再试。',
          'The adjacent pair ' + left.en + ' and ' + right.en + ' does not match the clues. Move them and try again.'
        );
      } else {
        say('顺序还不完整正确。再逐对检查一次。', 'The full order is not correct yet. Check each adjacent pair again.');
      }
    }

    function showHint() {
      if (done) { return; }
      hints++;
      var i = Math.min(hints, q.hintZh.length) - 1;
      say(q.hintZh[i], q.hintEn[i]);
    }

    function bindCard(card) {
      var id = card.getAttribute('data-id');

      card.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          move(id, -1);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          move(id, 1);
        }
      });

      card.addEventListener('pointerdown', function (e) {
        if (done || e.target.tagName === 'BUTTON') { return; }
        draggedId = id;
        card.classList.add('dragging');
        card.setPointerCapture(e.pointerId);
      });

      card.addEventListener('pointermove', function (e) {
        if (!draggedId || done) { return; }
        var target = document.elementFromPoint(e.clientX, e.clientY);
        var over = target && target.closest ? target.closest('.lph-card') : null;
        if (!over) { return; }
        var overId = over.getAttribute('data-id');
        if (overId === draggedId) { return; }
        var from = order.indexOf(draggedId);
        var to = order.indexOf(overId);
        order.splice(from, 1);
        order.splice(to, 0, draggedId);
        badIndex = -1;
        draw();
      });

      function endDrag() {
        draggedId = null;
        var active = host.querySelector('.dragging');
        if (active) { active.classList.remove('dragging'); }
      }
      card.addEventListener('pointerup', endDrag);
      card.addEventListener('pointercancel', endDrag);
    }

    function draw() {
      var rel = orderLabel(q);
      var premiseHtml = q.premises.map(function (p, i) {
        return '<div class="lph-premise"><span class="lph-num">' + (i + 1) + '</span>' +
          '<span class="lph-text">' + bi(p.zh, p.en) + '</span></div>';
      }).join('');

      var boardHtml = order.map(function (id, i) {
        return '<div class="lph-card' + (i === badIndex ? ' bad-left' : '') +
          '" data-id="' + id + '" tabindex="0" role="listitem" aria-label="' +
          q.optionDefs[id].en + ', position ' + (i + 1) + '">' +
          '<span class="lph-rank">' + (i + 1) + '</span>' + personHtml(id) +
          '<span class="lph-move"><button type="button" data-move="-1" aria-label="Move left">◀</button>' +
          '<button type="button" data-move="1" aria-label="Move right">▶</button></span></div>';
      }).join('');

      host.innerHTML = '<div class="lph-wrap"><div class="lph-premises">' + premiseHtml + '</div>' +
        '<div class="lph-direction">' + bi(rel.orderZh + '，排出完整顺序', rel.orderEn + ', build the complete order') + '</div>' +
        '<div class="lph-board" role="list">' + boardHtml + '</div>' +
        '<div class="lph-actions"><button class="lph-submit" type="button">' +
        bi('检查顺序', 'Check order') + '</button><button class="lph-hint" type="button">' +
        bi('提示', 'Hint') + '</button></div><div class="lph-msg" aria-live="polite"></div></div>';

      host.querySelectorAll('.lph-card').forEach(function (card) {
        bindCard(card);
        card.querySelectorAll('[data-move]').forEach(function (button) {
          button.addEventListener('click', function () {
            move(card.getAttribute('data-id'), Number(button.getAttribute('data-move')));
          });
        });
      });
      host.querySelector('.lph-submit').addEventListener('click', submit);
      host.querySelector('.lph-hint').addEventListener('click', showHint);
      applyLang(host);
    }

    draw();
  }

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:     { primary: '#7c3aed', primary2: '#6d28d9', bg: '#f5f3ff' },
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
        contentZh: '读清每条线索，把所有小朋友从高到矮、从快到慢或从大到小排成完整顺序。可以拖动卡片，也可以点左右按钮或用方向键移动。检查失败时，先修正标出的相邻关系；需要时可逐步打开提示。',
        contentEn: 'Read every clue and put all children into a complete order from tallest to shortest, fastest to slowest, or oldest to youngest. Drag the cards, use the move buttons, or press arrow keys. After a wrong check, fix the highlighted adjacent relation; open staged hints if needed.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-logic-pattern-intro-001'
      }
    },
    title:     { zh: '🧠 逻辑推理', en: '🧠 Logic Pattern' },
    subtitle:  { zh: '连接线索，排出完整顺序', en: 'Link the clues and build the full order' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      container.innerHTML = '<div id="lph-host"></div>';
      q.result = null;
      playBoard(q, container.querySelector('#lph-host'));
      setTimeout(function () {
        var option = document.querySelector('.s1-opt');
        if (option) { option.style.display = 'none'; }
      }, 0);
    },

    renderOption: function () { return '<span class="lph-opt">✔</span>'; },

    checkAnswer: function (selected, q) { return !!q.result; },

    onAnswer: function (selected, q, correct) {
      if (!correct || !q.result) { return; }
      setTimeout(function () {
        var feedback = document.getElementById('s1-fb');
        if (!feedback) { return; }
        feedback.innerHTML += '<div>' + bi(q.result.zh, q.result.en) + '</div>';
        applyLang(feedback);
      }, 0);
    },

    // Speak names and relation words, not emoji.
    getVoiceText: function (q) {
      var zh = shell.lang === 'zh';
      var strip = function (t) { return t.replace(/[\u{1F300}-\u{1FAFF}]/gu, ''); };
      var parts = q.premises.map(function (p) { return strip(zh ? p.zh : p.en); });
      var rel = orderLabel(q);
      return parts.join(zh ? '，' : '. ') + (zh ? '。' + rel.orderZh + '，排出完整顺序。' : '. ' + rel.orderEn + ', build the complete order.');
    },

    registerRootGenes: function () { return GENES.slice(); },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      var played = questions.filter(function (q) { return q.result; });
      var extra = {
        relations:       _unique(questions.map(function (q) { return q.relation; })),
        geneIds:         GENES.slice(),
        activityRuntime: 'puzzle'
      };
      if (played.length) {
        var tiers = { best: 0, better: 0, good: 0, valid: 0 };
        played.forEach(function (q) { tiers[q.result.tier]++; });
        extra.process = {
          tiers: tiers,
          optimalCount: tiers.best,
          retries: played.reduce(function (n, q) {
            return n + Math.max(0, q.result.tries - 1);
          }, 0),
          hints: played.reduce(function (n, q) {
            return n + q.result.hints;
          }, 0)
        };
      }
      refillUnit(unit.id);
      return buildRadarContext(unit.id, extra);
    }
  });
}());
