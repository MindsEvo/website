'use strict';

/**
 * Language & Literacy — Game Config + RADAR CONTRACT (Learning series, K1–G2)
 * Spec: docs/language/LANGUAGE-MODULE-ARCHITECTURE.md
 *
 * Units are language-specific (zh / en pools are authored separately), so
 * in-question text always follows the passage language; only shell chrome
 * follows the UI language.
 *
 * Interactions, using shell option buttons where appropriate (shell.js untouched):
 *   select            one button per choice
 *   evidence_sentence single evidence uses one Shell option per sentence; multi-sentence evidence
 *                     uses Language-managed selection/deselection plus one Shell "check" option
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
    G1: { text_length: 'short', explicitness: 'one-step', evidence_span: 'cross-sentence', response_type: 'select+evidence+order' },
    G2: { text_length: 'medium', explicitness: 'multi-source', evidence_span: 'single', response_type: 'select+evidence+order' },
    K1: { text_length: 'none', explicitness: 'one-step', evidence_span: 'single', response_type: 'hotspot' },
    K2: { text_length: 'none', explicitness: 'one-step', evidence_span: 'single', response_type: 'hotspot+order' }
  };

  var CHROME = {
    zh: {
      read: '🔊 朗读', check: '✅ 排好了，检查一下', evidenceCheck: '✅ 检查证据', activityCheck: '✅ 检查答案', slotsHint: '按顺序点下面的卡片；点上面的卡片可以放回去。',
      yourIdea: '你的想法', others: '看看别人怎么想', ccrNote: '这一题没有标准答案，选你自己的想法。',
      nice: '👍 好想法！', noted: '🌱 记下了！',
      revealTitle: '🌱 原来，同一件事还可以这样想',
      revealBody: '没有分数，也没有唯一的答案。现在，你有没有新的想法？',
      units: { observe: '观察', comprehend: '理解', infer: '推理', structure: '结构', choose: '语言选择', express: '表达', create: '创造' }
    },
    en: {
      read: '🔊 Read aloud', check: '✅ Check my order', evidenceCheck: '✅ Check evidence', activityCheck: '✅ Check my answer', slotsHint: 'Tap the cards in order. Tap a placed card to send it back.',
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
      '.lang-evidence-list{display:flex;flex-direction:column;gap:8px;margin-top:10px;}' +
      '.lang-evidence-choice{display:flex;align-items:center;width:100%;text-align:left;font:inherit;font-weight:650;line-height:1.45;color:#1e293b;background:#fff;border:2px solid #d9f99d;border-radius:12px;padding:10px 12px;cursor:pointer;}' +
      '.lang-evidence-choice.selected{background:#ecfccb;border-color:#65a30d;box-shadow:0 0 0 2px rgba(101,163,13,.12);}' +
      '.lang-evidence-choice.locked{cursor:default;opacity:.9;}' +
      '.lang-evidence-choice.locked.selected{background:#dcfce7;border-color:#16a34a;}' +
      '.lang-journey-result{margin-top:10px;padding:10px 12px;border:1.5px solid #bbf7d0;border-radius:12px;background:#f0fdf4;text-align:left;color:#166534;font-size:14px;line-height:1.55;}' +
      '.lang-journey-result strong{display:block;color:#14532d;margin-bottom:3px;}' +
      '.lang-slots{display:flex;flex-direction:column;gap:6px;margin:10px 0 8px;}' +
      '.lang-slot{display:flex;align-items:center;min-height:40px;border:2px dashed #bef264;border-radius:10px;padding:4px 8px;background:#fff;}' +
      '.lang-slot.filled{border-style:solid;border-color:#65a30d;cursor:pointer;}' +
      '.lang-slot.locked{background:#dcfce7;border-color:#16a34a;cursor:default;}' +
      '.lang-pool{display:flex;flex-wrap:wrap;gap:8px;}' +
      '.lang-card{font-size:16px;font-weight:700;border:2px solid #a3e635;background:#f7fee7;color:#1e293b;border-radius:10px;padding:8px 12px;cursor:pointer;}' +
      '.lang-activity{display:flex;flex-direction:column;gap:10px;margin-top:10px;}' +
      '.lang-activity-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}' +
      '.lang-activity-column{display:flex;flex-direction:column;gap:8px;}' +
      '.lang-activity-chip{font:inherit;font-size:15px;font-weight:750;line-height:1.4;text-align:left;color:#1e293b;background:#f7fee7;border:2px solid #a3e635;border-radius:10px;padding:9px 11px;cursor:pointer;}' +
      '.lang-activity-chip.selected,.lang-activity-chip.active{background:#ecfccb;border-color:#65a30d;box-shadow:0 0 0 2px rgba(101,163,13,.14);}' +
      '.lang-activity-chip.used{background:#f1f5f9;border-color:#94a3b8;}' +
      '.lang-activity-chip.locked{background:#dcfce7;border-color:#16a34a;cursor:default;}' +
      '.lang-match-row{display:flex;flex-direction:column;gap:4px;}' +
      '.lang-match-answer{min-height:20px;padding:2px 8px;color:#4d7c0f;font-size:12px;font-weight:800;}' +
      '.lang-sort-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}' +
      '.lang-sort-bucket{min-height:82px;background:#fff;border:2px dashed #bef264;border-radius:12px;padding:9px;cursor:pointer;}' +
      '.lang-sort-bucket.active{border-style:solid;border-color:#65a30d;background:#f7fee7;}' +
      '.lang-sort-title{font-size:13px;font-weight:900;color:#3f6212;margin-bottom:7px;}' +
      '.lang-build-label{display:block;min-width:120px;color:#4d7c0f;font-size:12px;font-weight:900;margin-right:8px;}' +
      '@media(max-width:560px){.lang-activity-grid,.lang-sort-grid{grid-template-columns:1fr;}.lang-build-label{min-width:90px;}}' +
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
      '.lang-frame-strip{display:flex;flex-direction:column;gap:8px;margin-bottom:10px;}' +
      '.lang-frame-card{display:flex;align-items:flex-start;gap:8px;background:#fff;border:1.5px solid #fde68a;border-radius:12px;padding:9px 11px;font-size:15px;line-height:1.5;color:#1e293b;}' +
      '.lang-frame-emoji{font-size:23px;line-height:1.2;flex:none;}' +
      '#s1-opts[data-lang-mode="hotspot"]{display:block;position:relative;background:transparent;box-shadow:none;padding:0;margin:0 0 18px;pointer-events:none;grid-template-columns:none;}' +
      '#s1-opts[data-lang-mode="hotspot"] .s1-opt{position:absolute;transform:translate(-50%,-50%);width:52px;height:52px;min-height:0;border-radius:50%;border:3px dashed rgba(21,128,61,.55);background:rgba(255,255,255,.01);padding:0;pointer-events:auto;font-size:0;}' +
      '#s1-opts[data-lang-mode="hotspot"] .s1-opt.s1-correct,' +
      '#s1-opts[data-lang-mode="hotspot"] .s1-opt.s1-wrong{background:rgba(255,255,255,.85);border-style:solid;}' +
      '.lang-encounter{width:100%;max-width:560px;background:#fff;border:2px solid #d9f99d;border-radius:20px;padding:24px;box-sizing:border-box;text-align:center;}' +
      '.lang-work-source{font-size:14px;color:#64748b;margin:6px 0 18px;}' +
      '.lang-work-text{font-size:22px;line-height:2;color:#1e293b;background:#fefce8;border-radius:14px;padding:18px;margin-bottom:18px;}' +
      '.lang-work-text div{white-space:normal;overflow-wrap:anywhere;}' +
      '.lang-work-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;}' +
      '.lang-work-action{border:2px solid #a3e635;background:#fff;color:#3f6212;border-radius:999px;padding:10px 18px;font-weight:900;cursor:pointer;}' +
      '.lang-work-action.primary{background:#65a30d;color:#fff;border-color:#65a30d;}';
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

  function freshCcrState() {
    return { express: {}, create: {} };
  }

  function freshActivityState(kind, itemId) {
    return {
      kind: kind || null,
      currentItemId: itemId || null,
      selected: [],
      assignments: {},
      placed: [],
      activeLeftId: null,
      activeCardId: null,
      locked: false
    };
  }

  function isActivityKind(kind) {
    return ['hunt', 'match', 'sort', 'build'].indexOf(kind) >= 0;
  }

  function ccrBucket(q) {
    var unit = q && q.unit;
    if (!_ccr[unit]) { _ccr[unit] = {}; }
    return _ccr[unit];
  }

  var _log = {}, _ccr = freshCcrState(), _order = null, _evidence = null, _activity = null,
      _sessionHead = null, _langRerender = false;

  document.addEventListener('shell:langchange', function () { _langRerender = true; });

  function maybeResetSession(q) {
    var rerender = _langRerender;
    _langRerender = false;
    if (q.seq === 0 && !rerender) {
      _log = {};
      _ccr = freshCcrState();
      _evidence = null;
      _activity = null;
      _sessionHead = q;
    }
  }

  function composeCcr(q, markCurrent) {
    var c = q.ccr;
    var bucket = ccrBucket(q);
    return c.template.replace(/\{(\w+)\}/g, function (_, key) {
      if (bucket[key]) { return esc(bucket[key]); }
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

  function sceneNarration(q) {
    if (q.narration) { return q.narration; }
    return (q.frames || []).map(function (frame) {
      return (q.lang === 'zh' ? frame.textZh : frame.textEn) || frame.narration || '';
    }).filter(Boolean).join(q.lang === 'zh' ? '' : ' ');
  }

  function sceneMaterialHtml(q) {
    var frames = q.frames || [];
    if (frames.length) {
      return '<div class="lang-frame-strip">' + frames.map(function (frame, index) {
        var text = (q.lang === 'zh' ? frame.textZh : frame.textEn) || frame.narration || '';
        return '<div class="lang-frame-card">' +
          '<span class="lang-snum">' + (index + 1) + '</span>' +
          (frame.emoji ? '<span class="lang-frame-emoji">' + esc(frame.emoji) + '</span>' : '') +
          '<span>' + esc(text) + '</span>' +
        '</div>';
      }).join('') + '</div>';
    }
    var positioned = (q.objects || []).length && q.objects.every(function (object) {
      return typeof object.x === 'number' && typeof object.y === 'number';
    });
    return positioned ? sceneHtml(q) : '';
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
      var text;
      if (q.kind === 'ccr_slot' || q.kind === 'ccr_reflect') {
        text = q.prompt;
      } else if (q.kind === 'scene_select') {
        text = sceneNarration(q) + ' ' + q.prompt;
      } else {
        text = passageText(q) + ' ' + q.prompt;
      }
      shell.speak(text, q.lang);
    });
  }

  function checkButton() { return document.querySelector('#s1-opts .s1-opt'); }

  function isMultiSentenceEvidence(q) {
    return q && q.kind === 'evidence_sentence' && Array.isArray(q.answer) && q.answer.length > 1;
  }

  function sameEvidenceSet(selected, expected) {
    var a = (selected || []).slice().sort();
    var b = (expected || []).slice().sort();
    return a.length === b.length && a.every(function (value, index) { return value === b[index]; });
  }

  function itemById(items, id) {
    return (items || []).filter(function (item) { return item.id === id; })[0] || null;
  }

  function activitySnapshot() {
    if (!_activity) { return null; }
    return {
      kind: _activity.kind,
      selected: _activity.selected.slice(),
      assignments: Object.assign({}, _activity.assignments),
      placed: _activity.placed.slice()
    };
  }

  function activityComplete(q) {
    if (!_activity) { return false; }
    if (q.kind === 'hunt') { return _activity.selected.length > 0; }
    if (q.kind === 'match') {
      return q.pairs.every(function (pair) {
        return Object.prototype.hasOwnProperty.call(_activity.assignments, pair.id);
      });
    }
    if (q.kind === 'sort') {
      return q.cards.every(function (card) {
        return Object.prototype.hasOwnProperty.call(_activity.assignments, card.id);
      });
    }
    if (q.kind === 'build') {
      return q.slots.every(function (slot) {
        return Object.prototype.hasOwnProperty.call(_activity.assignments, slot.id);
      });
    }
    return false;
  }

  function updateActivityCheck(q) {
    var cb = checkButton();
    if (cb) { cb.disabled = !_activity || _activity.locked || !activityComplete(q); }
  }

  function renderHunt(q) {
    var box = document.getElementById('lang-activity');
    if (!box || !_activity) { return; }
    box.innerHTML = '<div class="lang-activity"><div class="lang-pool">' +
      q.deal.map(function (id) {
        var chip = itemById(q.chips, id);
        if (!chip) { return ''; }
        var selected = _activity.selected.indexOf(id) >= 0;
        return '<button type="button" class="lang-activity-chip' +
          (selected ? ' selected' : '') + (_activity.locked ? ' locked' : '') +
          '" data-activity-id="' + esc(id) + '"' + (_activity.locked ? ' disabled' : '') + '>' +
          esc(chip.text) + '</button>';
      }).join('') + '</div></div>';

    if (!_activity.locked) {
      box.querySelectorAll('[data-activity-id]').forEach(function (button) {
        button.addEventListener('click', function () {
          var id = button.getAttribute('data-activity-id');
          var index = _activity.selected.indexOf(id);
          if (index >= 0) { _activity.selected.splice(index, 1); }
          else { _activity.selected.push(id); }
          renderHunt(q);
        });
      });
    }
    updateActivityCheck(q);
  }

  function renderMatch(q) {
    var box = document.getElementById('lang-activity');
    if (!box || !_activity) { return; }
    var used = Object.keys(_activity.assignments).map(function (leftId) {
      return _activity.assignments[leftId];
    });
    var left = q.leftDeal.map(function (id) {
      var pair = itemById(q.pairs, id);
      if (!pair) { return ''; }
      var assigned = itemById(q.pairs, _activity.assignments[id]);
      return '<div class="lang-match-row">' +
        '<button type="button" class="lang-activity-chip' +
        (_activity.activeLeftId === id ? ' active' : '') + (_activity.locked ? ' locked' : '') +
        '" data-match-left="' + esc(id) + '"' + (_activity.locked ? ' disabled' : '') + '>' +
        esc(pair.left) + '</button>' +
        '<div class="lang-match-answer">' + (assigned ? esc(assigned.right) : '…') + '</div></div>';
    }).join('');
    var right = q.rightDeal.map(function (id) {
      var pair = itemById(q.pairs, id);
      if (!pair) { return ''; }
      return '<button type="button" class="lang-activity-chip' +
        (used.indexOf(id) >= 0 ? ' used' : '') + (_activity.locked ? ' locked' : '') +
        '" data-match-right="' + esc(id) + '"' + (_activity.locked ? ' disabled' : '') + '>' +
        esc(pair.right) + '</button>';
    }).join('');

    box.innerHTML = '<div class="lang-activity"><div class="lang-activity-grid">' +
      '<div class="lang-activity-column">' + left + '</div>' +
      '<div class="lang-activity-column">' + right + '</div></div></div>';

    if (!_activity.locked) {
      box.querySelectorAll('[data-match-left]').forEach(function (button) {
        button.addEventListener('click', function () {
          _activity.activeLeftId = button.getAttribute('data-match-left');
          renderMatch(q);
        });
      });
      box.querySelectorAll('[data-match-right]').forEach(function (button) {
        button.addEventListener('click', function () {
          if (!_activity.activeLeftId) { return; }
          _activity.assignments[_activity.activeLeftId] = button.getAttribute('data-match-right');
          _activity.activeLeftId = null;
          renderMatch(q);
        });
      });
    }
    updateActivityCheck(q);
  }

  function renderSort(q) {
    var box = document.getElementById('lang-activity');
    if (!box || !_activity) { return; }
    var pool = q.deal.filter(function (id) {
      return !Object.prototype.hasOwnProperty.call(_activity.assignments, id);
    }).map(function (id) {
      var card = itemById(q.cards, id);
      if (!card) { return ''; }
      return '<button type="button" class="lang-activity-chip' +
        (_activity.activeCardId === id ? ' active' : '') + (_activity.locked ? ' locked' : '') +
        '" data-sort-card="' + esc(id) + '"' + (_activity.locked ? ' disabled' : '') + '>' +
        esc(card.text) + '</button>';
    }).join('');
    var buckets = q.groups.map(function (group) {
      var cards = q.cards.filter(function (card) {
        return _activity.assignments[card.id] === group.id;
      }).map(function (card) {
        return '<button type="button" class="lang-activity-chip' +
          (_activity.locked ? ' locked' : '') + '" data-sort-assigned="' + esc(card.id) + '"' +
          (_activity.locked ? ' disabled' : '') + '>' + esc(card.text) + '</button>';
      }).join('');
      return '<div class="lang-sort-bucket' + (_activity.activeCardId ? ' active' : '') +
        '" data-sort-group="' + esc(group.id) + '">' +
        '<div class="lang-sort-title">' + esc(group.label) + '</div>' +
        '<div class="lang-activity-column">' + cards + '</div></div>';
    }).join('');

    box.innerHTML = '<div class="lang-activity"><div class="lang-pool">' + pool +
      '</div><div class="lang-sort-grid">' + buckets + '</div></div>';

    if (!_activity.locked) {
      box.querySelectorAll('[data-sort-card]').forEach(function (button) {
        button.addEventListener('click', function () {
          _activity.activeCardId = button.getAttribute('data-sort-card');
          renderSort(q);
        });
      });
      box.querySelectorAll('[data-sort-group]').forEach(function (bucket) {
        bucket.addEventListener('click', function (event) {
          var assignedId = event.target.getAttribute &&
            event.target.getAttribute('data-sort-assigned');
          if (assignedId || !_activity.activeCardId) { return; }
          _activity.assignments[_activity.activeCardId] = bucket.getAttribute('data-sort-group');
          _activity.activeCardId = null;
          renderSort(q);
        });
      });
      box.querySelectorAll('[data-sort-assigned]').forEach(function (button) {
        button.addEventListener('click', function (event) {
          event.stopPropagation();
          delete _activity.assignments[button.getAttribute('data-sort-assigned')];
          renderSort(q);
        });
      });
    }
    updateActivityCheck(q);
  }

  function renderBuild(q) {
    var box = document.getElementById('lang-activity');
    if (!box || !_activity) { return; }
    var assignedChipIds = Object.keys(_activity.assignments).map(function (slotId) {
      return _activity.assignments[slotId];
    });
    var slots = q.slots.map(function (slot, index) {
      var chip = itemById(q.chips, _activity.assignments[slot.id]);
      return '<div class="lang-slot' + (chip ? ' filled' : '') +
        (_activity.locked ? ' locked' : '') + '" data-build-slot="' + esc(slot.id) + '">' +
        '<span class="lang-snum">' + (index + 1) + '</span>' +
        '<span class="lang-build-label">' + esc(slot.label) + '</span>' +
        (chip ? esc(chip.text) : '') + '</div>';
    }).join('');
    var pool = q.deal.filter(function (id) {
      return assignedChipIds.indexOf(id) < 0;
    }).map(function (id) {
      var chip = itemById(q.chips, id);
      if (!chip) { return ''; }
      return '<button type="button" class="lang-activity-chip' +
        (_activity.locked ? ' locked' : '') + '" data-build-chip="' + esc(id) + '"' +
        (_activity.locked ? ' disabled' : '') + '>' + esc(chip.text) + '</button>';
    }).join('');

    box.innerHTML = '<div class="lang-activity"><div class="lang-slots">' + slots +
      '</div><div class="lang-pool">' + pool + '</div></div>';

    if (!_activity.locked) {
      box.querySelectorAll('[data-build-chip]').forEach(function (button) {
        button.addEventListener('click', function () {
          var empty = q.slots.filter(function (slot) {
            return !Object.prototype.hasOwnProperty.call(_activity.assignments, slot.id);
          })[0];
          if (!empty) { return; }
          _activity.assignments[empty.id] = button.getAttribute('data-build-chip');
          renderBuild(q);
        });
      });
      box.querySelectorAll('.lang-slot.filled[data-build-slot]').forEach(function (slot) {
        slot.addEventListener('click', function () {
          delete _activity.assignments[slot.getAttribute('data-build-slot')];
          renderBuild(q);
        });
      });
    }
    updateActivityCheck(q);
  }

  function renderActivity(q) {
    if (!_activity || _activity.kind !== q.kind || _activity.currentItemId !== q.itemId) { return; }
    if (q.kind === 'hunt') { renderHunt(q); }
    else if (q.kind === 'match') { renderMatch(q); }
    else if (q.kind === 'sort') { renderSort(q); }
    else if (q.kind === 'build') { renderBuild(q); }
  }

  function renderEvidenceChoices(q) {
    var box = document.getElementById('lang-evidence');
    if (!box || !_evidence) { return; }
    box.innerHTML = '<div class="lang-evidence-list">' + q.sentences.map(function (sentence, index) {
      var selected = _evidence.selected.indexOf(sentence.id) >= 0;
      return '<button type="button" class="lang-evidence-choice' +
        (selected ? ' selected' : '') + (_evidence.locked ? ' locked' : '') +
        '" data-evidence-id="' + esc(sentence.id) + '"' + (_evidence.locked ? ' disabled' : '') + '>' +
        '<span class="lang-snum">' + (index + 1) + '</span><span>' + esc(sentence.text) + '</span></button>';
    }).join('') + '</div>';

    if (!_evidence.locked) {
      box.querySelectorAll('[data-evidence-id]').forEach(function (button) {
        button.addEventListener('click', function () {
          var id = button.getAttribute('data-evidence-id');
          var index = _evidence.selected.indexOf(id);
          if (index >= 0) { _evidence.selected.splice(index, 1); }
          else { _evidence.selected.push(id); }
          renderEvidenceChoices(q);
        });
      });
    }

    var cb = checkButton();
    if (cb && !_evidence.locked) { cb.disabled = _evidence.selected.length < 1; }
  }

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
    if (isMultiSentenceEvidence(q)) {
      html += '<div class="lang-prompt">' + esc(q.prompt) + '</div><div id="lang-evidence"></div>';
    } else if (q.kind === 'evidence_sentence') {
      html += '<div class="lang-prompt">' + esc(q.prompt) + '</div>';
    } else if (q.kind === 'hotspot') {
      html += sceneHtml(q) + '<div class="lang-prompt">' + esc(q.prompt) + '</div>';
    } else if (q.kind === 'scene_select') {
      html += sceneMaterialHtml(q) + '<div class="lang-prompt">' + esc(q.prompt) + '</div>';
    } else if (q.kind === 'order') {
      html += passageHtml(q) +
        '<div class="lang-prompt">' + esc(q.prompt) + '</div>' +
        '<div class="lang-note">' + T.slotsHint + '</div>' +
        '<div id="lang-order"></div>';
    } else if (q.kind === 'scene_order') {
      html += '<div class="lang-prompt">' + esc(q.prompt) + '</div>' +
        '<div class="lang-note">' + T.slotsHint + '</div>' +
        '<div id="lang-order"></div>';
    } else if (isActivityKind(q.kind)) {
      html += passageHtml(q) +
        '<div class="lang-prompt">' + esc(q.prompt) + '</div>' +
        '<div id="lang-activity"></div>';
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
    if (isMultiSentenceEvidence(q)) {
      _evidence = { selected: [], locked: false };
      setTimeout(function () { renderEvidenceChoices(q); }, 0);
    } else {
      _evidence = null;
    }
    if (isActivityKind(q.kind)) {
      if (!_activity || _activity.kind !== q.kind || _activity.currentItemId !== q.itemId) {
        _activity = freshActivityState(q.kind, q.itemId);
      }
      setTimeout(function () { renderActivity(q); }, 0);
    } else {
      _activity = null;
    }
    if (q.kind === 'hotspot') {
      setTimeout(function () { positionHotspot(q); }, 0);
    }
    var spoken = q.kind === 'scene_select'
      ? sceneNarration(q) + ' ' + q.prompt
      : q.prompt;
    shell.speak(spoken, q.lang);
  }

  function renderOption(opt, q) {
    if (isMultiSentenceEvidence(q)) { return CHROME[q.lang].evidenceCheck; }
    if (q.kind === 'evidence_sentence') {
      var idx = q.options.indexOf(opt);
      return '<span class="lang-snum">' + (idx + 1) + '</span><span>' + esc(q.sentences[idx].text) + '</span>';
    }
    if (q.kind === 'hotspot') { return ''; }
    if (q.kind === 'order' || q.kind === 'scene_order') { return CHROME[q.lang].check; }
    if (isActivityKind(q.kind)) { return CHROME[q.lang].activityCheck; }
    return esc(q.choices[opt].text);
  }

  function orderIsCorrect(q) {
    if (!_order || _order.placed.length !== q.cards.length) { return false; }
    return _order.placed.every(function (ci, i) { return ci === i; });
  }

  function activityIsCorrect(q) {
    if (!_activity || _activity.kind !== q.kind ||
        _activity.currentItemId !== q.itemId || !activityComplete(q)) {
      return false;
    }
    if (q.kind === 'hunt') {
      return sameEvidenceSet(_activity.selected, q.activityAnswer);
    }
    if (q.kind === 'match') {
      return q.pairs.every(function (pair) {
        return _activity.assignments[pair.id] === pair.id;
      });
    }
    if (q.kind === 'sort') {
      return q.cards.every(function (card) {
        return _activity.assignments[card.id] === card.groupId;
      });
    }
    if (q.kind === 'build') {
      return q.slots.every(function (slot) {
        var chip = itemById(q.chips, _activity.assignments[slot.id]);
        return !!chip && chip.slotId === slot.id;
      });
    }
    return false;
  }

  function checkAnswer(selected, q) {
    if (!q.scored) { return true; }
    if (isMultiSentenceEvidence(q)) { return sameEvidenceSet(_evidence && _evidence.selected, q.answer); }
    if (q.kind === 'evidence_sentence') { return q.answer.indexOf(selected) >= 0; }
    if (q.kind === 'order' || q.kind === 'scene_order') { return orderIsCorrect(q); }
    if (isActivityKind(q.kind)) { return activityIsCorrect(q); }
    return selected === q.answer;
  }

  function errorTypeFor(selected, q) {
    if (q.kind === 'order' || q.kind === 'scene_order') { return 'sequence_confusion'; }
    if (q.kind === 'evidence_sentence' || q.kind === 'evidence_phrase') { return 'evidence_mismatch'; }
    if (q.kind === 'hotspot') { return 'wrong_object'; }
    if (q.kind === 'hunt') { return 'phrase_hunt_mismatch'; }
    if (q.kind === 'match') { return 'match_mismatch'; }
    if (q.kind === 'sort') { return 'classification_mismatch'; }
    if (q.kind === 'build') { return 'build_mismatch'; }
    var c = q.choices && q.choices[selected];
    return (c && c.errorType) || null;
  }

  function onAnswer(selected, q, correct) {
    if (q.kind === 'ccr_slot') {
      ccrBucket(q)[q.slotKey] = q.choices[selected].text;
      return;
    }
    if (q.kind === 'ccr_reflect') {
      ccrBucket(q)._reflect = q.ccr.otherIdeas[selected].viewpoint;
      return;
    }

    if (!_log[q.itemId]) {
      _log[q.itemId] = {
        itemId: q.itemId, unit: q.unit, level: q.level, template: q.template,
        pairId: q.pairId || null, claimItemId: q.claimItemId || null,
        evidenceFor: q.evidenceFor || null,
        selectedEvidence: isMultiSentenceEvidence(q) && _evidence ? _evidence.selected.slice() : null,
        activitySnapshot: isActivityKind(q.kind) ? activitySnapshot() : null,
        firstTryCorrect: !!correct, errorType: correct ? null : errorTypeFor(selected, q)
      };
    }
    if ((q.kind === 'order' || q.kind === 'scene_order') && !correct) {
      // Shell disables a wrong button; the single "check" button must stay usable.
      setTimeout(function () {
        _order.placed = [];
        var cb = checkButton();
        if (cb) { cb.classList.remove('s1-wrong'); cb.disabled = false; }
        renderCards(q);
      }, 700);
    }
    if (isMultiSentenceEvidence(q) && !correct) {
      setTimeout(function () {
        var cb = checkButton();
        if (cb) { cb.classList.remove('s1-wrong'); cb.disabled = false; }
        renderEvidenceChoices(q);
      }, 700);
    }
    if (isActivityKind(q.kind) && !correct) {
      setTimeout(function () {
        var cb = checkButton();
        if (cb) { cb.classList.remove('s1-wrong'); }
        renderActivity(q);
      }, 700);
    }
  }

  function onCorrect(q, actsEl) {
    if ((q.kind === 'order' || q.kind === 'scene_order') && _order) { _order.locked = true; renderCards(q); }
    if (isMultiSentenceEvidence(q) && _evidence) { _evidence.locked = true; renderEvidenceChoices(q); }
    if (isActivityKind(q.kind) && _activity) {
      _activity.locked = true;
      renderActivity(q);
    }
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

  function guidedCcr(questions, unit) {
    var reflectQ = questions.filter(function (q) {
      return q.kind === 'ccr_reflect' && q.unit === unit;
    })[0];
    if (!reflectQ) { return null; }

    var bucket = _ccr[unit] || {};
    var picks = {};
    Object.keys(bucket).forEach(function (key) {
      if (key !== '_reflect') { picks[key] = bucket[key]; }
    });
    return {
      picks: picks,
      sentence: reflectQ.ccr.template.replace(/\{(\w+)\}/g, function (_, key) {
        return bucket[key] || '';
      }),
      notThoughtOf: bucket._reflect || null
    };
  }

  function appendJourneyResult(questions, messageEl) {
    if (!messageEl) { return; }
    var sum = summarize(questions);
    var claimPair = sum.claimEvidence[0] || null;
    var express = guidedCcr(questions, 'express');
    var create = guidedCcr(questions, 'create');
    var groundedZh = claimPair && claimPair.fullyGrounded ? '观点和证据都找到了' : '观点或证据还可以再想想';
    var groundedEn = claimPair && claimPair.fullyGrounded ? 'Claim and evidence are both grounded' : 'Revisit the claim or its evidence';
    var box = document.createElement('div');
    box.className = 'lang-journey-result';
    box.innerHTML = '<strong><span class="zh">作品之旅小结</span><span class="en">Journey summary</span></strong>' +
      '<div><span class="zh">作品理解：' + sum.scoredFirstTry + '/' + sum.scoredTotal + '</span>' +
      '<span class="en">Understanding: ' + sum.scoredFirstTry + '/' + sum.scoredTotal + '</span></div>' +
      '<div><span class="zh">' + groundedZh + '</span><span class="en">' + groundedEn + '</span></div>' +
      (express ? '<div><span class="zh">我的表达：' + esc(express.sentence) + '</span><span class="en">My expression: ' + esc(express.sentence) + '</span></div>' : '') +
      (create ? '<div><span class="zh">我的创造：' + esc(create.sentence) + '</span><span class="en">My creation: ' + esc(create.sentence) + '</span></div>' : '');
    messageEl.appendChild(box);
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

function clearSelector() {
  var old = document.getElementById('lang-selector');
  if (old) { old.remove(); }
}

function showModeSelector() {
  clearSelector();
  var modes = [
    {
      id: 'ability', icon: '🎯', nameZh: '能力训练', nameEn: 'Ability Training',
      descZh: '选择一项能力，进行定向训练。', descEn: 'Choose one ability for focused practice.'
    },
    {
      id: 'journey', icon: '📜', nameZh: '作品之旅', nameEn: 'Works / Journey',
      descZh: '进入完整作品，跨能力探索语言和思考。', descEn: 'Explore a complete work across several abilities.'
    }
  ];
  var wrap = selectorWrap(
    '语文素养 · 选择体验', 'Language & Literacy · Choose a Mode',
    'lang-learning-back', '学习中心', 'Learning',
    modes.map(function (mode) {
      return selectorCard(
        mode,
        'data-mode="' + mode.id + '"',
        false,
        '<div class="lang-nav-desc"><span class="zh">' + mode.descZh +
          '</span><span class="en">' + mode.descEn + '</span></div>'
      );
    }).join('')
  );
  document.getElementById('lang-learning-back').addEventListener('click', function () {
    window.location.href = '../index.html';
  });
  wrap.addEventListener('click', function (event) {
    var card = event.target.closest('[data-mode]');
    if (!card) { return; }
    wrap.remove();
    if (card.getAttribute('data-mode') === 'journey') {
      showWorksLanguageSelector();
    } else {
      showLanguageSelector();
    }
  });
}

function showLanguageSelector() {
  clearSelector();
  var languages = [
    { id: 'zh', icon: '📜', nameZh: '中文', nameEn: '中文' },
    { id: 'en', icon: '📚', nameZh: 'English', nameEn: 'English' }
  ];
  var wrap = selectorWrap(
    '能力训练 · 选择语言', 'Ability Training · Choose Language',
    'lang-language-back', '模式', 'Modes',
    languages.map(function (lang) {
      return selectorCard(lang, 'data-content-lang="' + lang.id + '"', false, '');
    }).join('')
  );
  document.getElementById('lang-language-back').addEventListener('click', function () {
    wrap.remove();
    showModeSelector();
  });
  wrap.addEventListener('click', function (event) {
    var card = event.target.closest('[data-content-lang]');
    if (!card) { return; }
    wrap.remove();
    showAbilitySelector(card.getAttribute('data-content-lang'));
  });
}

function journeyPassages(lang, grade) {
  return LANG_GEN.JOURNEY_PASSAGE_IDS.map(function (passageId) {
    return LANG_GEN.passageById(passageId);
  }).filter(function (passage) {
    return passage &&
      (!lang || passage.lang === lang) &&
      (!grade || passage.grade === grade);
  });
}

function workPresentation(passage) {
  var byGenre = {
    poem: {
      icon: '📜',
      descZh: '完整古诗 · 遇见、理解、表达与创造',
      descEn: 'A complete poetry journey'
    },
    rhyme: {
      icon: '⭐',
      descZh: '完整童谣 · 聆听、理解、表达与创造',
      descEn: 'A complete rhyme journey'
    },
    fable: {
      icon: '📖',
      descZh: '完整寓言 · 情节、证据、表达与创造',
      descEn: 'A complete fable journey'
    }
  };
  return byGenre[passage.genre] || {
    icon: '📚',
    descZh: '完整作品 · 理解、表达与创造',
    descEn: 'A complete work journey'
  };
}

function workSourceText(passage) {
  var source = passage.source || {};
  if (source.period || source.author) {
    return [source.period, source.author].filter(Boolean).join(' · ');
  }
  if (source.origin || source.adaptation) {
    return [source.origin, source.adaptation].filter(Boolean).join(' · ');
  }
  return source.note || source.author || '';
}

function showWorksLanguageSelector() {
  clearSelector();
  var languages = [
    { id: 'zh', icon: '📜', nameZh: '中文', nameEn: 'Chinese' },
    { id: 'en', icon: '📚', nameZh: 'English', nameEn: 'English' }
  ];
  var wrap = selectorWrap(
    '作品之旅 · 选择语言', 'Works / Journey · Choose Language',
    'lang-works-language-back', '模式', 'Modes',
    languages.map(function (lang) {
      var count = journeyPassages(lang.id).length;
      return selectorCard(
        lang,
        'data-work-lang="' + lang.id + '"',
        !count,
        '<div class="lang-nav-levels"><span class="zh">' +
          (count ? count + ' 个作品' : '尚未开放') +
          '</span><span class="en">' +
          (count ? count + (count === 1 ? ' work' : ' works') : 'Coming later') +
          '</span></div>'
      );
    }).join('')
  );
  document.getElementById('lang-works-language-back').addEventListener('click', function () {
    wrap.remove();
    showModeSelector();
  });
  wrap.addEventListener('click', function (event) {
    var card = event.target.closest('[data-work-lang]:not(.locked)');
    if (!card) { return; }
    wrap.remove();
    showWorksGradeSelector(card.getAttribute('data-work-lang'));
  });
}

function showWorksGradeSelector(lang) {
  var body = GRADE_LEVELS.map(function (grade) {
    var count = journeyPassages(lang, grade.id).length;
    return selectorCard(
      { icon: grade.id, nameZh: grade.nameZh, nameEn: grade.nameEn },
      'data-work-grade="' + grade.id + '"',
      !count,
      '<div class="lang-nav-levels"><span class="zh">' +
        (count ? count + ' 个作品' : '尚未开放') +
        '</span><span class="en">' +
        (count ? count + (count === 1 ? ' work' : ' works') : 'Coming later') +
        '</span></div>'
    );
  }).join('');
  var wrap = selectorWrap(
    '作品之旅 · 选择年级', 'Works / Journey · Choose Grade',
    'lang-works-grade-back', '语言', 'Language', body
  );
  wrap.setAttribute('data-content-lang', lang);
  document.getElementById('lang-works-grade-back').addEventListener('click', function () {
    wrap.remove();
    showWorksLanguageSelector();
  });
  wrap.addEventListener('click', function (event) {
    var card = event.target.closest('[data-work-grade]:not(.locked)');
    if (!card) { return; }
    wrap.remove();
    showWorksSelector(lang, card.getAttribute('data-work-grade'));
  });
}

function showWorksSelector(lang, grade) {
  var body = journeyPassages(lang, grade).map(function (passage) {
    var presentation = workPresentation(passage);
    return selectorCard(
      {
        icon: presentation.icon,
        nameZh: '《' + esc(passage.title) + '》',
        nameEn: passage.title
      },
      'data-work-id="' + passage.id + '"',
      false,
      '<div class="lang-nav-desc"><span class="zh">' + presentation.descZh + '</span>' +
        '<span class="en">' + presentation.descEn + '</span></div>'
    );
  }).join('');
  var wrap = selectorWrap(
    grade + ' · 选择作品', grade + ' · Choose a Work',
    'lang-works-back', '年级', 'Grades', body
  );
  wrap.setAttribute('data-content-lang', lang);
  document.getElementById('lang-works-back').addEventListener('click', function () {
    wrap.remove();
    showWorksGradeSelector(lang);
  });
  wrap.addEventListener('click', function (event) {
    var card = event.target.closest('[data-work-id]');
    if (!card) { return; }
    wrap.remove();
    showWorkEncounter(card.getAttribute('data-work-id'));
  });
}

function showWorkEncounter(passageId) {
  var p = LANG_GEN.passageById(passageId);
  if (!p || LANG_GEN.JOURNEY_PASSAGE_IDS.indexOf(p.id) < 0) {
    showWorksLanguageSelector();
    return;
  }
  var presentation = workPresentation(p);
  var source = workSourceText(p);
  var workText = p.sentences.map(function (sentence) {
    return '<div>' + esc(sentence.text) + '</div>';
  }).join('');
  var listenText = p.lang === 'zh' ? '🔊 听一遍' : '🔊 Listen';
  var startText = p.lang === 'zh' ? '开始探索' : 'Start exploring';
  var body = '<div class="lang-encounter">' +
    '<div class="lang-nav-icon">' + presentation.icon + '</div>' +
    '<div class="lang-nav-name">《' + esc(p.title) + '》</div>' +
    (source ? '<div class="lang-work-source">' + esc(source) + '</div>' : '') +
    '<div class="lang-work-text">' + workText + '</div>' +
    '<div class="lang-work-actions">' +
      '<button type="button" class="lang-work-action" id="lang-work-listen">' + listenText + '</button>' +
      '<button type="button" class="lang-work-action primary" id="lang-work-start">' + startText + '</button>' +
    '</div>' +
  '</div>';
  var wrap = selectorWrap(
    '遇见作品', 'Encounter the Work',
    'lang-encounter-back', '作品', 'Works', body
  );
  wrap.setAttribute('data-content-lang', p.lang);
  wrap.querySelector('.lang-nav-grid').style.gridTemplateColumns = '1fr';
  document.getElementById('lang-encounter-back').addEventListener('click', function () {
    wrap.remove();
    showWorksSelector(p.lang, p.grade);
  });
  document.getElementById('lang-work-listen').addEventListener('click', function () {
    shell.speak(passageText(p), p.lang);
  });
  document.getElementById('lang-work-start').addEventListener('click', function () {
    wrap.remove();
    launchJourney(p.id);
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

function launchSession(config) {
  shell.setLang(config.lang);
  _scope = config.scope;

  var unit = Object.assign({}, config.unit, { questions: config.questions });
  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:         { primary: '#4d7c0f', primary2: '#3f6212', bg: '#f7fee7' },
    gui: {
      header: { show: true, showBack: true },
      language: { enabled: false, default: config.lang },
      audio: {
        music: { enabled: true, defaultOn: false },
        sound: { enabled: true, defaultOn: true }
      },
      history: { enabled: true },
      help: {
        enabled: true,
        contentZh: '先读或听当前素材，再回答问题。有些题要你回到素材里找证据；最后的表达与创造部分没有标准答案，说出自己的想法，再看看别人怎么想。',
        contentEn: 'Read or listen to the current material, then answer. Some questions ask you to return to the material for evidence. The final express and create steps have no single right answer: share your idea, then see what others thought.'
      }
    },
    title: config.title,
    subtitle: config.subtitle,
    passScore: function (currentUnit) {
      var scored = currentUnit.questions.filter(function (q) { return q.scored; }).length;
      return scored || currentUnit.questions.length;
    },
    units: [unit],

    renderSequence: renderSequence,
    renderOption:   renderOption,
    checkAnswer:    checkAnswer,
    onAnswer:       onAnswer,
    onCorrect:      onCorrect,

    registerRootGenes: function (ctx) {
      var qs = (ctx && ctx.unit && ctx.unit.questions) || [];
      return _unique(qs.map(function (q) { return q.geneId; }));
    },

    onResult: config.scope.sessionMode === 'journey' ? function (_, messageEl) {
      appendJourneyResult(config.questions, messageEl);
    } : null,

    getReportContext: function (ctx) {
      var currentUnit = (ctx && ctx.unit) || {};
      var qs = currentUnit.questions || [];
      var d = _scope || {};
      var sum = summarize(qs);
      var extra = {
        moduleId:         MODULE_ID,
        moduleType:       MODULE_TYPE,
        levelId:          d.grade || null,
        gradeCode:        d.grade || null,
        difficultyAxis:   DIFFICULTY[d.grade] ? Object.assign({}, DIFFICULTY[d.grade]) : null,
        sourceGameId:     SOURCE_GAME_ID,
        contentLang:      d.lang || null,
        sessionMode:      d.sessionMode || 'ability',
        primaryAbility:   d.ability || null,
        passageId:        d.passageId || (qs.length ? qs[0].passageId : null),
        genre:            d.genre || null,
        journeyCompleted: d.sessionMode === 'journey',
        types:            _unique(qs.map(function (q) { return q.kind; })),
        geneIds:          _unique(qs.map(function (q) { return q.geneId; })),
        activityRuntime:  sum.scoredTotal ? 'puzzle' : 'interaction',
        scoredTotal:      sum.scoredTotal,
        scoredFirstTry:   sum.scoredFirstTry,
        byUnit:           sum.byUnit,
        errorTypes:       sum.errorTypes,
        claimEvidence:    sum.claimEvidence,
        items:            sum.items
      };
      var guidedExpress = guidedCcr(qs, 'express');
      var guidedCreate = guidedCcr(qs, 'create');
      if (guidedExpress) { extra.guidedExpress = guidedExpress; }
      if (guidedCreate) { extra.guidedCreate = guidedCreate; }
      return extra;
    }
  });

  var homeHdr = document.querySelector('#s1-home .s1-hdr');
  if (homeHdr) {
    var back = document.createElement('button');
    back.id = 'lang-home-back';
    back.textContent = '⬅️';
    back.title = config.backTitle;
    back.addEventListener('click', function () {
      tearDownShell();
      config.onBack();
    });
    homeHdr.insertBefore(back, homeHdr.firstChild);
  }
}

function launchGame(lang, ability, grade) {
  var meta = abilityFor(ability);
  launchSession({
    lang: lang,
    scope: {
      sessionMode: 'ability',
      lang: lang,
      ability: ability,
      grade: grade
    },
    questions: questionsFor(lang, ability, grade),
    title: {
      zh: meta.icon + ' ' + meta.nameZh + ' · ' + grade,
      en: meta.icon + ' ' + meta.nameEn + ' · ' + grade
    },
    subtitle: {
      zh: lang === 'zh' ? '中文 · 语文素养' : 'English · 语文素养',
      en: lang === 'zh' ? 'Chinese · Language & Literacy' : 'English · Language & Literacy'
    },
    unit: {
      id: lang + '-' + ability + '-' + grade,
      gradeCode: grade,
      icon: meta.icon,
      nameZh: grade + ' · ' + meta.nameZh,
      nameEn: grade + ' · ' + meta.nameEn
    },
    backTitle: '返回选级 / Back to levels',
    onBack: function () {
      showLevelSelector(lang, ability);
    }
  });
}

function launchJourney(passageId) {
  var p = LANG_GEN.passageById(passageId);
  var questions = LANG_GEN.generateJourney(passageId);
  if (!p || !questions.length) {
    showWorksLanguageSelector();
    return;
  }

  launchSession({
    lang: p.lang,
    scope: {
      sessionMode: 'journey',
      lang: p.lang,
      ability: null,
      grade: p.grade,
      passageId: p.id,
      genre: p.genre
    },
    questions: questions,
    title: {
      zh: '📜 《' + p.title + '》',
      en: '📜 ' + p.title
    },
    subtitle: {
      zh: '中文 · 作品之旅',
      en: 'Chinese · Works Journey'
    },
    unit: {
      id: 'journey-' + p.id,
      gradeCode: p.grade,
      icon: '📜',
      nameZh: p.grade + ' · 《' + p.title + '》作品之旅',
      nameEn: p.grade + ' · ' + p.title + ' Journey'
    },
    backTitle: '返回作品 / Back to work',
    onBack: function () {
      showWorkEncounter(p.id);
    }
  });
}

showModeSelector();

}());
