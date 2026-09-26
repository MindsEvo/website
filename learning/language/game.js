'use strict';

/**
 * Language & Literacy — Game Config + RADAR CONTRACT (Learning series, G1–G2)
 * Spec: docs/language/LANGUAGE-MODULE-ARCHITECTURE.md
 *
 * Units are language-specific (zh / en pools are authored separately), so
 * in-question text always follows the passage language; only shell chrome
 * follows the UI language.
 *
 * Interactions, all built on shell's option buttons (shell.js untouched):
 *   select            one button per choice
 *   evidence_sentence one button per passage sentence ("tap the evidence")
 *   evidence_phrase   one button per candidate word/phrase
 *   order             cards laid out by this module; the single option is "check"
 *   ccr_slot/reflect  Create→Compare→Reflect: always accepted, never scored
 *
 * shell.report() fires once per unit, so per-item first attempts are logged
 * here and folded into getReportContext().
 */
(function () {

  var MODULE_ID      = 'language';
  var MODULE_TYPE    = 'metathinking';
  var SOURCE_GAME_ID = 'learning-language';

  var UNIT_DEFS = [
    { id: 'G1-zh', grade: 'G1', lang: 'zh', icon: '🌂',
      nameZh: 'G1 · 中文阅读', nameEn: 'G1 · Chinese Reading',
      descZh: '读短小的故事，找线索、找证据、排顺序。', descEn: 'Short Chinese stories: find clues, evidence and order.' },
    { id: 'G2-zh', grade: 'G2', lang: 'zh', icon: '🐾',
      nameZh: 'G2 · 中文阅读', nameEn: 'G2 · Chinese Reading',
      descZh: '更长的故事：整合线索，分清“写的顺序”和“发生的顺序”。', descEn: 'Longer Chinese stories: combine clues, story order vs. real order.' },
    { id: 'G1-en', grade: 'G1', lang: 'en', icon: '🪁',
      nameZh: 'G1 · 英文阅读', nameEn: 'G1 · English Reading',
      descZh: '英文短故事：关键细节、线索推断、故事顺序。', descEn: 'Short stories: key details, clues, and story order.' },
    { id: 'G2-en', grade: 'G2', lang: 'en', icon: '🥬',
      nameZh: 'G2 · 英文阅读', nameEn: 'G2 · English Reading',
      descZh: '英文故事：检验观点、开头-经过-结尾、词语的力量。', descEn: 'Stories: check a claim, beginning-middle-end, word power.' },
    { id: 'K1-zh', grade: 'K1', lang: 'zh', icon: '🐰', scene: true,
      nameZh: 'K1 · 看图说话', nameEn: 'K1 · Picture Talk',
      descZh: '看一看图里的小场景，点一点、猜一猜。', descEn: 'Look at the little scene and tap what you find.' },
    { id: 'K1-en', grade: 'K1', lang: 'en', icon: '🐶', scene: true,
      nameZh: 'K1 · 英文看图', nameEn: 'K1 · Picture Talk (EN)',
      descZh: '英文版：看一看图里的小场景，点一点、猜一猜。', descEn: 'Look at the little scene and tap what you find.' },
    { id: 'K2-zh', grade: 'K2', lang: 'zh', icon: '🐱', scene: true,
      nameZh: 'K2 · 看图讲故事', nameEn: 'K2 · Picture Story',
      descZh: '看图找线索、猜心情，还要把故事排对顺序。', descEn: 'Find clues, guess feelings, and put the story in order.' },
    { id: 'K2-en', grade: 'K2', lang: 'en', icon: '🪁', scene: true,
      nameZh: 'K2 · 英文看图讲故事', nameEn: 'K2 · Picture Story (EN)',
      descZh: '英文版：看图找线索、猜心情，还要把故事排对顺序。', descEn: 'Find clues, guess feelings, and put the story in order.' }
  ];

  var DIFFICULTY = {
    G1: { text_length: 'short', explicitness: 'one-step', evidence_span: 'single', response_type: 'select+evidence+order' },
    G2: { text_length: 'medium', explicitness: 'multi-source', evidence_span: 'single', response_type: 'select+evidence+order' },
    K1: { text_length: 'none', explicitness: 'one-step', evidence_span: 'single', response_type: 'hotspot' },
    K2: { text_length: 'none', explicitness: 'one-step', evidence_span: 'single', response_type: 'hotspot+order' }
  };

  var CHROME = {
    zh: {
      read: '🔊 朗读', check: '✅ 排好了，检查一下', slotsHint: '按顺序点下面的卡片；点上面的卡片可以放回去。',
      yourIdea: '你的想法', others: '看看别人怎么想', ccrNote: '这一题没有标准答案，选你自己的想法。',
      nice: '👍 好想法！', noted: '🌱 记下了！',
      revealTitle: '🌱 原来，同一件事还可以这样想',
      revealBody: '没有分数，也没有唯一的答案。现在，你有没有新的想法？',
      units: { observe: '观察', comprehend: '理解', infer: '推理', structure: '结构', choose: '语言选择', express: '表达与创造' }
    },
    en: {
      read: '🔊 Read aloud', check: '✅ Check my order', slotsHint: 'Tap the cards in order. Tap a placed card to send it back.',
      yourIdea: 'Your idea', others: 'What others thought', ccrNote: 'There is no single right answer here. Pick your own idea.',
      nice: '👍 Nice idea!', noted: '🌱 Got it!',
      revealTitle: '🌱 The same story can be seen in many ways',
      revealBody: 'No score and no single answer. Do you have a new idea now?',
      units: { observe: 'Observe', comprehend: 'Understand', infer: 'Infer', structure: 'Structure', choose: 'Word Choice', express: 'Express & Create' }
    }
  };

  function _unique(values) {
    return (values || []).filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  function defFor(unitId) {
    for (var i = 0; i < UNIT_DEFS.length; i++) { if (UNIT_DEFS[i].id === unitId) { return UNIT_DEFS[i]; } }
    return null;
  }

  function buildUnits() {
    return UNIT_DEFS.map(function (d) {
      return {
        id: d.id, gradeCode: d.grade, icon: d.icon,
        nameZh: d.nameZh, nameEn: d.nameEn, descZh: d.descZh, descEn: d.descEn,
        questions: d.scene ? LANG_GEN.generateScene(d.lang, d.grade) : LANG_GEN.generate(d.lang, d.grade)
      };
    });
  }

  var UNITS = buildUnits();

  // Deferred: the shell reads unit.questions in the same pass after getReportContext.
  function refillUnit(unitId) {
    setTimeout(function () {
      var d = defFor(unitId);
      UNITS.forEach(function (u) {
        if (d && u.id === unitId) { u.questions = d.scene ? LANG_GEN.generateScene(d.lang, d.grade) : LANG_GEN.generate(d.lang, d.grade); }
      });
    }, 0);
  }

  // ── Presentation ───────────────────────────────────────────────────────────

  (function ensureLangStyles() {
    if (document.getElementById('lang-style')) { return; }
    var css = '' +
      '.s1-replay{display:none!important;}' +
      '.s1-seq.lang-seq{display:block;text-align:left;font-size:16px;font-weight:500;letter-spacing:0;padding:14px 16px;min-height:0;background:#fefce8;}' +
      '.lang-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;}' +
      '.lang-title{font-size:17px;font-weight:900;color:#3f6212;}' +
      '.lang-badge{font-size:12px;font-weight:800;color:#fff;background:#65a30d;border-radius:999px;padding:2px 10px;}' +
      '.lang-read{margin-left:auto;font-size:13px;font-weight:700;border:1.5px solid #bef264;background:#fff;color:#3f6212;border-radius:999px;padding:3px 10px;cursor:pointer;}' +
      '.lang-passage{background:#fff;border:1.5px solid #fde68a;border-radius:12px;padding:10px 14px;line-height:1.85;font-size:17px;color:#1e293b;max-height:40vh;overflow:auto;margin-bottom:10px;}' +
      '.lang-prompt{font-size:18px;font-weight:900;color:#1e293b;line-height:1.45;}' +
      '.lang-note{font-size:13px;color:#65a30d;font-weight:700;margin-top:4px;}' +
      '.lang-snum{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;border-radius:50%;background:#ecfccb;color:#3f6212;font-size:12px;font-weight:900;margin-right:8px;flex:none;}' +
      '#s1-opts[data-lang-mode]{grid-template-columns:1fr;}' +
      '#s1-opts[data-lang-mode="evidence_phrase"]{grid-template-columns:1fr 1fr;}' +
      '#s1-opts[data-lang-mode] .s1-opt{font-size:17px;font-weight:700;min-height:48px;padding:10px 14px;line-height:1.45;}' +
      '#s1-opts[data-lang-mode="evidence_sentence"] .s1-opt{justify-content:flex-start;text-align:left;font-weight:600;}' +
      '.lang-slots{display:flex;flex-direction:column;gap:6px;margin:10px 0 8px;}' +
      '.lang-slot{display:flex;align-items:center;min-height:40px;border:2px dashed #bef264;border-radius:10px;padding:4px 8px;background:#fff;}' +
      '.lang-slot.filled{border-style:solid;border-color:#65a30d;cursor:pointer;}' +
      '.lang-slot.locked{background:#dcfce7;border-color:#16a34a;cursor:default;}' +
      '.lang-pool{display:flex;flex-wrap:wrap;gap:8px;}' +
      '.lang-card{font-size:16px;font-weight:700;border:2px solid #a3e635;background:#f7fee7;color:#1e293b;border-radius:10px;padding:8px 12px;cursor:pointer;}' +
      '.lang-story{background:#fff;border:1.5px solid #fde68a;border-radius:12px;padding:10px 14px;margin:6px 0 10px;font-size:17px;font-weight:700;color:#78350f;line-height:1.6;}' +
      '.lang-blank{display:inline-block;min-width:3em;border-bottom:2px solid #65a30d;color:#65a30d;text-align:center;}' +
      '.lang-blank.cur{background:#ecfccb;}' +
      '.lang-ideas{display:flex;flex-direction:column;gap:6px;margin-bottom:10px;}' +
      '.lang-idea{background:#fff;border-left:4px solid #84cc16;border-radius:8px;padding:6px 10px;font-size:15px;line-height:1.5;}' +
      '.lang-idea b{display:block;font-size:12px;color:#4d7c0f;}' +
      '.lang-reveal{background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:10px 14px;margin-bottom:8px;width:100%;box-sizing:border-box;text-align:left;}' +
      '.lang-reveal-title{font-size:13px;font-weight:900;color:#15803d;margin-bottom:4px;}' +
      '.lang-scene{position:relative;width:100%;height:38vh;min-height:200px;max-height:280px;border-radius:14px;border:1.5px solid #fde68a;overflow:hidden;margin-bottom:10px;box-sizing:border-box;}' +
      '.lang-scene[data-bg="rain"]{background:linear-gradient(#94a3b8,#cbd5e1);}' +
      '.lang-scene[data-bg="sunny"]{background:linear-gradient(#7dd3fc,#e0f2fe);}' +
      '.lang-scene[data-bg="grass"]{background:linear-gradient(#86efac,#bbf7d0);}' +
      '.lang-scene-obj{position:absolute;transform:translate(-50%,-50%);font-size:38px;line-height:1;pointer-events:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.25));}' +
      '#s1-opts[data-lang-mode="hotspot"]{display:block;position:relative;background:transparent;box-shadow:none;padding:0;margin:0 0 18px;pointer-events:none;grid-template-columns:none;}' +
      '#s1-opts[data-lang-mode="hotspot"] .s1-opt{position:absolute;transform:translate(-50%,-50%);width:52px;height:52px;min-height:0;border-radius:50%;border:3px dashed rgba(21,128,61,.55);background:rgba(255,255,255,.01);padding:0;pointer-events:auto;font-size:0;}' +
      '#s1-opts[data-lang-mode="hotspot"] .s1-opt.s1-correct,' +
      '#s1-opts[data-lang-mode="hotspot"] .s1-opt.s1-wrong{background:rgba(255,255,255,.85);border-style:solid;}';
    var el = document.createElement('style');
    el.id = 'lang-style';
    el.textContent = css;
    document.head.appendChild(el);
  }());

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;';
    });
  }

  function passageText(q) {
    return q.sentences.map(function (s) { return s.text; }).join(q.lang === 'zh' ? '' : ' ');
  }

  // ── Session state (reset when a new session's first question renders) ─────

  var _log = {}, _ccr = {}, _order = null, _sessionHead = null, _langRerender = false;

  document.addEventListener('shell:langchange', function () { _langRerender = true; });

  function maybeResetSession(q) {
    var rerender = _langRerender;
    _langRerender = false;
    if (q.seq === 0 && !rerender) { _log = {}; _ccr = {}; _sessionHead = q; }
  }

  function composeCcr(q, markCurrent) {
    var c = q.ccr;
    return c.template.replace(/\{(\w+)\}/g, function (_, key) {
      if (_ccr[key]) { return esc(_ccr[key]); }
      var cur = markCurrent && q.slotKey === key;
      return '<span class="lang-blank' + (cur ? ' cur' : '') + '">？</span>';
    });
  }

  function headHtml(q) {
    var T = CHROME[q.lang];
    var readBtn = (q.kind === 'hotspot' || q.kind === 'scene_order') ? '' :
      '<button type="button" class="lang-read" data-lang-read="1">' + T.read + '</button>';
    return '<div class="lang-head">' +
      '<span class="lang-title">' + esc(q.title) + '</span>' +
      '<span class="lang-badge">' + esc(T.units[q.unit] || '') + '</span>' +
      readBtn +
      '</div>';
  }

  function passageHtml(q) {
    return '<div class="lang-passage">' + esc(passageText(q)) + '</div>';
  }

  function sceneHtml(q) {
    var objs = q.objects.map(function (o) {
      return '<span class="lang-scene-obj" style="left:' + o.x + '%;top:' + o.y + '%;">' + o.emoji + '</span>';
    }).join('');
    return '<div class="lang-scene" id="lang-scene" data-bg="' + esc(q.bg) + '">' + objs + '</div>';
  }

  function positionHotspot(q) {
    var scene = document.getElementById('lang-scene');
    var opts = document.getElementById('s1-opts');
    if (!scene || !opts) { return; }
    // #s1-opts is a sibling (not a descendant) of the scene, so instead of
    // computing cross-element viewport offsets, just pull it up on top of
    // the scene by its own rendered height — width/left stay default (same
    // parent, same flow width), so no horizontal math is needed either.
    opts.style.marginTop = (-scene.offsetHeight) + 'px';
    opts.style.height = scene.offsetHeight + 'px';
    opts.querySelectorAll('.s1-opt').forEach(function (b, i) {
      var o = q.choices[i];
      if (!o) { return; }
      b.style.left = o.x + '%';
      b.style.top = o.y + '%';
    });
  }

  function bindRead(container, q) {
    var btn = container.querySelector('[data-lang-read]');
    if (!btn) { return; }
    btn.addEventListener('click', function () {
      var text = (q.kind === 'ccr_slot' || q.kind === 'ccr_reflect') ? q.prompt : passageText(q) + ' ' + q.prompt;
      shell.speak(text, q.lang);
    });
  }

  function checkButton() { return document.querySelector('#s1-opts .s1-opt'); }

  function renderCards(q) {
    var box = document.getElementById('lang-order');
    if (!box || !_order) { return; }
    var n = q.cards.length;
    var slots = '';
    for (var i = 0; i < n; i++) {
      var ci = _order.placed[i];
      var filled = ci !== undefined;
      slots += '<div class="lang-slot' + (filled ? ' filled' : '') + (_order.locked ? ' locked' : '') + '" data-slot="' + i + '">' +
        '<span class="lang-snum">' + (i + 1) + '</span>' + (filled ? esc(q.cards[ci]) : '') + '</div>';
    }
    var pool = q.deal.filter(function (ci) { return _order.placed.indexOf(ci) < 0; }).map(function (ci) {
      return '<button type="button" class="lang-card" data-card="' + ci + '">' + esc(q.cards[ci]) + '</button>';
    }).join('');
    box.innerHTML = '<div class="lang-slots">' + slots + '</div><div class="lang-pool">' + pool + '</div>';

    if (!_order.locked) {
      box.querySelectorAll('[data-card]').forEach(function (b) {
        b.addEventListener('click', function () {
          _order.placed.push(Number(b.getAttribute('data-card')));
          renderCards(q);
        });
      });
      box.querySelectorAll('.lang-slot.filled').forEach(function (s) {
        s.addEventListener('click', function () {
          _order.placed.splice(Number(s.getAttribute('data-slot')), 1);
          renderCards(q);
        });
      });
    }
    var cb = checkButton();
    if (cb && !_order.locked) { cb.disabled = _order.placed.length < n; }
  }

  function renderSequence(q, container) {
    maybeResetSession(q);
    var T = CHROME[q.lang];
    container.parentNode.classList.add('lang-seq');
    var optsEl = document.getElementById('s1-opts');
    optsEl.setAttribute('data-lang-mode', q.kind);
    optsEl.style.left = optsEl.style.top = optsEl.style.width = optsEl.style.height = optsEl.style.marginTop = '';

    var html = headHtml(q);
    if (q.kind === 'evidence_sentence') {
      html += '<div class="lang-prompt">' + esc(q.prompt) + '</div>';
    } else if (q.kind === 'hotspot') {
      html += sceneHtml(q) + '<div class="lang-prompt">' + esc(q.prompt) + '</div>';
    } else if (q.kind === 'order') {
      html += passageHtml(q) +
        '<div class="lang-prompt">' + esc(q.prompt) + '</div>' +
        '<div class="lang-note">' + T.slotsHint + '</div>' +
        '<div id="lang-order"></div>';
    } else if (q.kind === 'scene_order') {
      html += '<div class="lang-prompt">' + esc(q.prompt) + '</div>' +
        '<div class="lang-note">' + T.slotsHint + '</div>' +
        '<div id="lang-order"></div>';
    } else if (q.kind === 'ccr_slot') {
      html += '<div class="lang-prompt">' + esc(q.prompt) + '</div>' +
        '<div class="lang-story">' + composeCcr(q, true) + '</div>' +
        '<div class="lang-prompt">' + esc(q.slotName) + '</div>' +
        '<div class="lang-note">' + T.ccrNote + '</div>';
    } else if (q.kind === 'ccr_reflect') {
      html += '<div class="lang-note">' + T.yourIdea + '</div>' +
        '<div class="lang-story">' + composeCcr(q, false) + '</div>' +
        '<div class="lang-note">' + T.others + '</div>' +
        '<div class="lang-ideas">' + q.ccr.otherIdeas.map(function (o) {
          return '<div class="lang-idea"><b>' + esc(o.viewpoint) + '</b>' + esc(o.text) + '</div>';
        }).join('') + '</div>' +
        '<div class="lang-prompt">' + esc(q.prompt) + '</div>';
    } else {
      html += passageHtml(q) + '<div class="lang-prompt">' + esc(q.prompt) + '</div>';
    }
    container.innerHTML = html;
    bindRead(container, q);

    if (q.kind === 'order' || q.kind === 'scene_order') {
      _order = { placed: [], locked: false };
      setTimeout(function () { renderCards(q); }, 0);
    } else {
      _order = null;
    }
    if (q.kind === 'hotspot') {
      setTimeout(function () { positionHotspot(q); }, 0);
    }
    shell.speak(q.prompt, q.lang);
  }

  function renderOption(opt, q) {
    if (q.kind === 'evidence_sentence') {
      var idx = q.options.indexOf(opt);
      return '<span class="lang-snum">' + (idx + 1) + '</span><span>' + esc(q.sentences[idx].text) + '</span>';
    }
    if (q.kind === 'hotspot') { return ''; }
    if (q.kind === 'order' || q.kind === 'scene_order') { return CHROME[q.lang].check; }
    return esc(q.choices[opt].text);
  }

  function orderIsCorrect(q) {
    if (!_order || _order.placed.length !== q.cards.length) { return false; }
    return _order.placed.every(function (ci, i) { return ci === i; });
  }

  function checkAnswer(selected, q) {
    if (!q.scored) { return true; }
    if (q.kind === 'evidence_sentence') { return q.answer.indexOf(selected) >= 0; }
    if (q.kind === 'order' || q.kind === 'scene_order') { return orderIsCorrect(q); }
    return selected === q.answer;
  }

  function errorTypeFor(selected, q) {
    if (q.kind === 'order' || q.kind === 'scene_order') { return 'sequence_confusion'; }
    if (q.kind === 'evidence_sentence' || q.kind === 'evidence_phrase') { return 'evidence_mismatch'; }
    if (q.kind === 'hotspot') { return 'wrong_object'; }
    var c = q.choices && q.choices[selected];
    return (c && c.errorType) || null;
  }

  function onAnswer(selected, q, correct) {
    if (q.kind === 'ccr_slot') { _ccr[q.slotKey] = q.choices[selected].text; return; }
    if (q.kind === 'ccr_reflect') { _ccr._reflect = q.ccr.otherIdeas[selected].viewpoint; return; }

    if (!_log[q.itemId]) {
      _log[q.itemId] = {
        itemId: q.itemId, unit: q.unit, level: q.level, template: q.template,
        firstTryCorrect: !!correct, errorType: correct ? null : errorTypeFor(selected, q)
      };
    }
    if ((q.kind === 'order' || q.kind === 'scene_order') && !correct) {
      // Shell disables a wrong button; the single "check" button must stay usable.
      setTimeout(function () {
        _order.placed = [];
        var cb = checkButton();
        if (cb) { cb.classList.remove('s1-wrong'); }
        renderCards(q);
      }, 700);
    }
  }

  function onCorrect(q, actsEl) {
    if ((q.kind === 'order' || q.kind === 'scene_order') && _order) { _order.locked = true; renderCards(q); }
    if (q.scored) { return; }

    // Unscored steps must not say "correct" (invariant 7).
    var T = CHROME[q.lang];
    var fb = document.getElementById('s1-fb');
    var msg = q.kind === 'ccr_reflect' ? T.noted : T.nice;
    fb.innerHTML = msg;
    setTimeout(function () { shell.speak(msg, q.lang); }, 80);

    if (q.kind === 'ccr_reflect') {
      var reveal = document.createElement('div');
      reveal.className = 'lang-reveal';
      reveal.innerHTML = '<div class="lang-reveal-title">' + T.revealTitle + '</div><div>' + T.revealBody + '</div>';
      actsEl.appendChild(reveal);
    }
  }

  // ── Report ─────────────────────────────────────────────────────────────────

  function summarize(questions) {
    var items = questions.filter(function (q) { return q.scored; }).map(function (q) {
      return _log[q.itemId] || { itemId: q.itemId, unit: q.unit, level: q.level, template: q.template, firstTryCorrect: null, errorType: null };
    });
    var byUnit = {}, errorTypes = {}, firstTry = 0;
    items.forEach(function (it) {
      var u = byUnit[it.unit] || (byUnit[it.unit] = { total: 0, firstTry: 0 });
      u.total++;
      if (it.firstTryCorrect) { u.firstTry++; firstTry++; }
      if (it.errorType) { errorTypes[it.errorType] = (errorTypes[it.errorType] || 0) + 1; }
    });
    return { items: items, byUnit: byUnit, errorTypes: errorTypes, scoredTotal: items.length, scoredFirstTry: firstTry };
  }

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:         { primary: '#4d7c0f', primary2: '#3f6212', bg: '#f7fee7' },
    gui: {
      header: { show: true, showBack: true },
      language: { enabled: true, default: 'zh' },
      audio: {
        music: { enabled: true, defaultOn: false },
        sound: { enabled: true, defaultOn: true }
      },
      history: { enabled: true },
      help: {
        enabled: true,
        contentZh: '先读故事（可以点“朗读”听一听），再回答问题。有些题要你回到故事里找证据；最后一部分没有标准答案，说出你自己的想法，再看看别人怎么想。',
        contentEn: 'Read the story first (tap "Read aloud" to listen), then answer. Some questions ask you to find evidence in the story. The last part has no single right answer: share your idea, then see what others thought.'
      }
    },
    title:    { zh: '📚 语文素养', en: '📚 Language & Literacy' },
    subtitle: { zh: '观察 · 理解 · 推理 · 结构 · 表达', en: 'Observe · Understand · Infer · Structure · Express' },
    // G1/G2 sessions always total >6 items, so this resolves to the old constant 8 unchanged;
    // K1/K2 scene sessions (2-3 items, no CCR) get a relative bar instead.
    passScore: function (unit, total) { return total <= 6 ? Math.max(1, total - 1) : 8; },
    units:     UNITS,

    renderSequence: renderSequence,
    renderOption:   renderOption,
    checkAnswer:    checkAnswer,
    onAnswer:       onAnswer,
    onCorrect:      onCorrect,

    registerRootGenes: function (ctx) {
      var qs = (ctx && ctx.unit && ctx.unit.questions) || [];
      return _unique(qs.map(function (q) { return q.geneId; }));
    },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var qs = unit.questions || [];
      var d = defFor(unit.id) || {};
      var sum = summarize(qs);
      var extra = {
        moduleId:        MODULE_ID,
        moduleType:      MODULE_TYPE,
        levelId:         d.grade || null,
        gradeCode:       d.grade || null,
        difficultyAxis:  DIFFICULTY[d.grade] ? Object.assign({}, DIFFICULTY[d.grade]) : null,
        sourceGameId:    SOURCE_GAME_ID,
        contentLang:     d.lang || null,
        passageId:       qs.length ? qs[0].passageId : null,
        types:           _unique(qs.map(function (q) { return q.kind; })),
        geneIds:         _unique(qs.map(function (q) { return q.geneId; })),
        activityRuntime: 'puzzle',
        scoredTotal:     sum.scoredTotal,
        scoredFirstTry:  sum.scoredFirstTry,
        byUnit:          sum.byUnit,
        errorTypes:      sum.errorTypes,
        items:           sum.items
      };
      var ccrQ = qs.filter(function (q) { return q.kind === 'ccr_reflect'; })[0];
      if (ccrQ) {
        var picks = {};
        Object.keys(_ccr).forEach(function (k) { if (k !== '_reflect') { picks[k] = _ccr[k]; } });
        extra.guidedCreate = {
          picks: picks,
          sentence: ccrQ.ccr.template.replace(/\{(\w+)\}/g, function (_, k) { return _ccr[k] || ''; }),
          notThoughtOf: _ccr._reflect || null
        };
      }
      refillUnit(unit.id);
      return extra;
    }
  });
}());
