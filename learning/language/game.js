'use strict';

/**
 * Language & Literacy — Game Config + RADAR CONTRACT (Learning series, K1–G2)
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

  var ABILITIES = [
  { id: 'observe', icon: '🔎', nameZh: '观察与描述', nameEn: 'Observe & Describe',
    descZh: '从当前素材中发现细节并准确描述。', descEn: 'Notice and describe details in the current material.' },
  { id: 'comprehend', icon: '📖', nameZh: '信息理解', nameEn: 'Understand',
    descZh: '理解素材明确表达的信息。', descEn: 'Understand information stated in the material.' },
  { id: 'infer', icon: '🧩', nameZh: '关联与推理', nameEn: 'Connect & Infer',
    descZh: '结合线索作出有证据的推断。', descEn: 'Connect clues and make evidence-based inferences.' },
  { id: 'structure', icon: '🧱', nameZh: '顺序与结构', nameEn: 'Sequence & Structure',
    descZh: '识别事件顺序和语言结构。', descEn: 'Recognize sequence and language structure.' },
  { id: 'choose', icon: '🎯', nameZh: '语言选择', nameEn: 'Language Choice',
    descZh: '比较词语和表达在语境中的作用。', descEn: 'Compare how language choices work in context.' },
  { id: 'express', icon: '💬', nameZh: '表达', nameEn: 'Express',
    descZh: '基于素材组织并表达自己的想法。', descEn: 'Organize and express an idea from the material.' },
  { id: 'create', icon: '🌱', nameZh: '想象与创造', nameEn: 'Imagine & Create',
    descZh: '续编、改编或换视角，再比较和反思。', descEn: 'Continue, adapt, or change viewpoint, then compare and reflect.' }
];

var GRADE_LEVELS = [
  { id: 'K1', nameZh: 'K1 · 幼儿', nameEn: 'K1 · Early Years' },
  { id: 'K2', nameZh: 'K2 · 幼儿园', nameEn: 'K2 · Kindergarten' },
  { id: 'G1', nameZh: 'G1 · 一年级', nameEn: 'G1 · Grade 1' },
  { id: 'G2', nameZh: 'G2 · 二年级', nameEn: 'G2 · Grade 2' }
];

var _scope = null;

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
      units: { observe: '观察', comprehend: '理解', infer: '推理', structure: '结构', choose: '语言选择', express: '表达', create: '创造' }
    },
    en: {
      read: '🔊 Read aloud', check: '✅ Check my order', slotsHint: 'Tap the cards in order. Tap a placed card to send it back.',
      yourIdea: 'Your idea', others: 'What others thought', ccrNote: 'There is no single right answer here. Pick your own idea.',
      nice: '👍 Nice idea!', noted: '🌱 Got it!',
      revealTitle: '🌱 The same story can be seen in many ways',
      revealBody: 'No score and no single answer. Do you have a new idea now?',
      units: { observe: 'Observe', comprehend: 'Understand', infer: 'Infer', structure: 'Structure', choose: 'Word Choice', express: 'Express', create: 'Create' }
    }
  };

  function _unique(values) {
    return (values || []).filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  function abilityFor(id) {
  return ABILITIES.filter(function (a) { return a.id === id; })[0] || ABILITIES[0];
}

function questionsFor(lang, ability, grade) {
  return (grade === 'K1' || grade === 'K2')
    ? LANG_GEN.generateScene(lang, grade, ability)
    : LANG_GEN.generate(lang, grade, ability);
}

function hasContent(lang, ability, grade) {
  return LANG_GEN.hasContent(lang, grade, ability);
}

  // ── Presentation ───────────────────────────────────────────────────────────

  (function ensureLangStyles() {
    if (document.getElementById('lang-style')) { return; }
    var css = '' +
      '.s1-replay{display:none!important;}' +
      '#lang-selector[data-content-lang="zh"] .en{display:none!important;}' +
      '#lang-selector[data-content-lang="zh"] .zh{display:initial!important;}' +
      '#lang-selector[data-content-lang="en"] .zh{display:none!important;}' +
      '#lang-selector[data-content-lang="en"] .en{display:initial!important;}' +
      '.lang-nav-wrap{display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px 16px;}' +
    '.lang-nav-head{display:flex;align-items:center;gap:8px;width:100%;max-width:560px;}' +
    '.lang-nav-title{flex:1;text-align:center;font-size:20px;font-weight:900;color:#3f6212;}' +
    '.lang-nav-back,#lang-home-back{border:0;background:none;color:#4d7c0f;font-weight:800;cursor:pointer;padding:6px;}' +
    '.lang-nav-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;width:100%;max-width:560px;}' +
    '.lang-nav-card{border:2px solid #d9f99d;background:#fff;border-radius:16px;padding:18px 14px;text-align:center;cursor:pointer;transition:transform .15s,border-color .15s;}' +
    '.lang-nav-card:hover{border-color:#84cc16;transform:translateY(-2px);}' +
    '.lang-nav-card.locked{opacity:.42;pointer-events:none;}' +
    '.lang-nav-icon{font-size:34px;line-height:1;margin-bottom:8px;}' +
    '.lang-nav-name{font-size:17px;font-weight:900;color:#3f6212;}' +
    '.lang-nav-desc{font-size:12px;color:#64748b;line-height:1.45;margin-top:5px;}' +
    '.lang-nav-levels{font-size:11px;font-weight:800;color:#65a30d;margin-top:8px;}' +
    '@media(max-width:560px){.lang-nav-grid{grid-template-columns:1fr;}}' +
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
        pairId: q.pairId || null, claimItemId: q.claimItemId || null,
        evidenceFor: q.evidenceFor || null,
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
      return _log[q.itemId] || {
        itemId: q.itemId, unit: q.unit, level: q.level, template: q.template,
        pairId: q.pairId || null, claimItemId: q.claimItemId || null,
        evidenceFor: q.evidenceFor || null,
        firstTryCorrect: null, errorType: null
      };
    });
    var byUnit = {}, errorTypes = {}, firstTry = 0;
    items.forEach(function (it) {
      var u = byUnit[it.unit] || (byUnit[it.unit] = { total: 0, firstTry: 0 });
      u.total++;
      if (it.firstTryCorrect) { u.firstTry++; firstTry++; }
      if (it.errorType) { errorTypes[it.errorType] = (errorTypes[it.errorType] || 0) + 1; }
    });
    var claimEvidence = [];
    items.forEach(function (claim) {
      if (!claim.pairId || claim.evidenceFor) { return; }
      var evidence = items.filter(function (item) {
        return item.pairId === claim.pairId && item.evidenceFor === claim.itemId;
      })[0];
      if (!evidence) { return; }
      claimEvidence.push({
        pairId: claim.pairId,
        claimItemId: claim.itemId,
        evidenceItemId: evidence.itemId,
        claimCorrect: claim.firstTryCorrect,
        evidenceCorrect: evidence.firstTryCorrect,
        fullyGrounded: claim.firstTryCorrect === true && evidence.firstTryCorrect === true
      });
    });
    return {
      items: items, byUnit: byUnit, errorTypes: errorTypes,
      scoredTotal: items.length, scoredFirstTry: firstTry,
      claimEvidence: claimEvidence
    };
  }

  function tearDownShell() {
  ['.s1-wrap', '#s1-transcript', '#s1-overlay'].forEach(function (selector) {
    var el = document.querySelector(selector);
    if (el) { el.remove(); }
  });
}

function selectorCard(meta, attrs, disabled, extra) {
  return '<div class="lang-nav-card' + (disabled ? ' locked' : '') + '" ' + attrs + '>' +
    '<div class="lang-nav-icon">' + meta.icon + '</div>' +
    '<div class="lang-nav-name"><span class="zh">' + meta.nameZh + '</span><span class="en">' + meta.nameEn + '</span></div>' +
    (extra || '') +
  '</div>';
}

function selectorWrap(titleZh, titleEn, backId, backZh, backEn, body) {
  var wrap = document.createElement('div');
  wrap.id = 'lang-selector';
  wrap.innerHTML = '<div class="lang-nav-wrap"><div class="lang-nav-head">' +
    '<button class="lang-nav-back" id="' + backId + '">⬅️ <span class="zh">' + backZh + '</span><span class="en">' + backEn + '</span></button>' +
    '<div class="lang-nav-title"><span class="zh">' + titleZh + '</span><span class="en">' + titleEn + '</span></div>' +
    '</div><div class="lang-nav-grid">' + body + '</div></div>';
  document.body.appendChild(wrap);
  return wrap;
}

function showLanguageSelector() {
  var old = document.getElementById('lang-selector');
  if (old) { old.remove(); }
  var languages = [
    { id: 'zh', icon: '📜', nameZh: '中文', nameEn: '中文' },
    { id: 'en', icon: '📚', nameZh: 'English', nameEn: 'English' }
  ];
  var wrap = selectorWrap(
    '语文素养 · 选择语言', 'Language & Literacy · Choose Language',
    'lang-learning-back', '学习中心', 'Learning',
    languages.map(function (lang) {
      return selectorCard(lang, 'data-content-lang="' + lang.id + '"', false, '');
    }).join('')
  );
  document.getElementById('lang-learning-back').addEventListener('click', function () {
    window.location.href = '../index.html';
  });
  wrap.addEventListener('click', function (event) {
    var card = event.target.closest('[data-content-lang]');
    if (!card) { return; }
    wrap.remove();
    showAbilitySelector(card.getAttribute('data-content-lang'));
  });
}

function showAbilitySelector(lang) {
  var wrap = selectorWrap(
    lang === 'zh' ? '中文 · 选择能力' : 'English · 选择能力',
    (lang === 'zh' ? 'Chinese' : 'English') + ' · Choose Ability',
    'lang-ability-back', '语言', 'Language',
    ABILITIES.map(function (ability) {
      var levels = GRADE_LEVELS.filter(function (grade) {
        return hasContent(lang, ability.id, grade.id);
      }).map(function (grade) { return grade.id; });
      return selectorCard(
        ability,
        'data-ability="' + ability.id + '"',
        !levels.length,
        '<div class="lang-nav-desc"><span class="zh">' + ability.descZh + '</span><span class="en">' + ability.descEn + '</span></div>' +
        '<div class="lang-nav-levels">' + levels.join(' · ') + '</div>'
      );
    }).join('')
  );
  wrap.setAttribute('data-content-lang', lang);
  document.getElementById('lang-ability-back').addEventListener('click', function () {
    wrap.remove();
    showLanguageSelector();
  });
  wrap.addEventListener('click', function (event) {
    var card = event.target.closest('[data-ability]:not(.locked)');
    if (!card) { return; }
    wrap.remove();
    showLevelSelector(lang, card.getAttribute('data-ability'));
  });
}

function showLevelSelector(lang, ability) {
  var meta = abilityFor(ability);
  var body = GRADE_LEVELS.map(function (grade) {
    var available = hasContent(lang, ability, grade.id);
    return selectorCard(
      { icon: grade.id, nameZh: grade.nameZh, nameEn: grade.nameEn },
      'data-grade="' + grade.id + '"',
      !available,
      '<div class="lang-nav-levels"><span class="zh">' +
        (available ? '进入训练' : '内容待补充') +
        '</span><span class="en">' +
        (available ? 'Start' : 'Content pending') +
        '</span></div>'
    );
  }).join('');
  var wrap = selectorWrap(
    meta.nameZh + ' · 选择年级', meta.nameEn + ' · Grade',
    'lang-level-back', '能力', 'Abilities', body
  );
  wrap.setAttribute('data-content-lang', lang);
  document.getElementById('lang-level-back').addEventListener('click', function () {
    wrap.remove();
    showAbilitySelector(lang);
  });
  wrap.addEventListener('click', function (event) {
    var card = event.target.closest('[data-grade]:not(.locked)');
    if (!card) { return; }
    wrap.remove();
    launchGame(lang, ability, card.getAttribute('data-grade'));
  });
}

function launchGame(lang, ability, grade) {
  // Language & Literacy is different from the rest of MindsEvo: Chinese and
  // English are independent content domains, not two translations of one UI.
  // Lock Shell's presentation language to the selected content domain before
  // createGame renders any bilingual Shell title/unit/chrome fields. The
  // language toggle is disabled below, so it cannot drift during the session.
  shell.setLang(lang);
  var questions = questionsFor(lang, ability, grade);
  _scope = { lang: lang, ability: ability, grade: grade };
    shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:         { primary: '#4d7c0f', primary2: '#3f6212', bg: '#f7fee7' },
    gui: {
      header: { show: true, showBack: true },
      // Language & Literacy content domains are independent. Once a child
      // enters Chinese or English, the session is locked to that content
      // language instead of using Shell's global translation toggle.
      language: { enabled: false, default: lang },
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
    title:    { zh: abilityFor(ability).icon + ' ' + abilityFor(ability).nameZh + ' · ' + grade, en: abilityFor(ability).icon + ' ' + abilityFor(ability).nameEn + ' · ' + grade },
    subtitle: { zh: lang === 'zh' ? '中文 · 语文素养' : 'English · 语文素养', en: lang === 'zh' ? 'Chinese · Language & Literacy' : 'English · Language & Literacy' },
    // Ability-scoped sessions may contain one objective item or an unscored
    // Create-Compare-Reflect sequence. Require all objective items; an
    // unscored sequence only needs completion.
    passScore: function (unit) {
      var scored = unit.questions.filter(function (q) { return q.scored; }).length;
      return scored || unit.questions.length;
    },
    units:     [{ id: lang + '-' + ability + '-' + grade, gradeCode: grade, icon: abilityFor(ability).icon, nameZh: grade + ' · ' + abilityFor(ability).nameZh, nameEn: grade + ' · ' + abilityFor(ability).nameEn, questions: questions }],

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
      var d = _scope || {};
      var sum = summarize(qs);
      var extra = {
        moduleId:        MODULE_ID,
        moduleType:      MODULE_TYPE,
        levelId:         d.grade || null,
        gradeCode:       d.grade || null,
        difficultyAxis:  DIFFICULTY[d.grade] ? Object.assign({}, DIFFICULTY[d.grade]) : null,
        sourceGameId:    SOURCE_GAME_ID,
        contentLang:     d.lang || null,
        primaryAbility: d.ability || null,
        passageId:       qs.length ? qs[0].passageId : null,
        types:           _unique(qs.map(function (q) { return q.kind; })),
        geneIds:         _unique(qs.map(function (q) { return q.geneId; })),
        activityRuntime: sum.scoredTotal ? 'puzzle' : 'interaction',
        scoredTotal:     sum.scoredTotal,
        scoredFirstTry:  sum.scoredFirstTry,
        byUnit:          sum.byUnit,
        errorTypes:      sum.errorTypes,
        claimEvidence:   sum.claimEvidence,
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
      return extra;
    }
  });
  var homeHdr = document.querySelector('#s1-home .s1-hdr');
  if (homeHdr) {
    var back = document.createElement('button');
    back.id = 'lang-home-back';
    back.textContent = '⬅️';
    back.title = '返回选级 / Back to levels';
    back.addEventListener('click', function () {
      tearDownShell();
      showLevelSelector(lang, ability);
    });
    homeHdr.insertBefore(back, homeHdr.firstChild);
  }
}

showLanguageSelector();

}());
