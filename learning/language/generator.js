'use strict';

/**
 * Language & Literacy — session GENERATOR (Learning series, G1–G2)
 * One session = one passage's full question ladder, in authored order
 * (the ladder L1→L4 is the pedagogy, so items are never shuffled across).
 * Only option order / card order is randomized per item.
 */

var LANG_GEN = (function () {

  var UNIT_GENE = {
    observe:    'RG.LANGUAGE.OBSERVATION.DESCRIBE',
    comprehend: 'RG.LANGUAGE.COMPREHENSION.INFO',
    infer:      'RG.LANGUAGE.INFERENCE.EVIDENCE',
    structure:  'RG.LANGUAGE.STRUCTURE.SEQUENCE',
    choose:     'RG.LANGUAGE.CHOICE.CONTEXT',
    express:    'RG.LANGUAGE.EXPRESSION.GUIDED'
  };

  function rngFor(seed) {
    if (seed === undefined || seed === null) { return Math.random; }
    var s = (Number(seed) >>> 0) || 1;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function shuffledIndices(n, rnd) {
    var a = []; for (var i = 0; i < n; i++) { a.push(i); }
    for (var k = a.length - 1; k > 0; k--) {
      var j = Math.floor(rnd() * (k + 1));
      var t = a[k]; a[k] = a[j]; a[j] = t;
    }
    return a;
  }

  function isIdentity(order) {
    return order.every(function (v, i) { return v === i; });
  }

  function poolFor(lang, grade) {
    return LANG_DATA.PASSAGES.filter(function (p) { return p.lang === lang && p.grade === grade; });
  }

  var ORDER_PROMPT = {
    zh: '这三张图讲的是什么顺序？把它们排好。',
    en: 'What order do these three pictures happen in? Put them in order.'
  };

  var SCENE_TITLE = {
    K1: { zh: '看图', en: 'Picture' },
    K2: { zh: '看图讲故事', en: 'Picture Story' }
  };

  function scenePoolFor(lang, grade) {
    return LANG_DATA.SCENES.filter(function (s) { return s.lang === lang && s.grade === grade; });
  }

  function objectById(scene, id) {
    var o = scene.objects.filter(function (o) { return o.id === id; })[0];
    if (!o) { throw new Error('[LANG_GEN] unknown scene object: ' + id + ' in ' + scene.id); }
    return o;
  }

  function base(p, item, kind) {
    return {
      kind: kind,
      lang: p.lang,
      passageId: p.id,
      title: p.title,
      sentences: p.sentences,
      itemId: item.id,
      unit: item.unit,
      geneId: UNIT_GENE[item.unit],
      template: item.template,
      level: item.level,
      anchors: p.anchors.curriculum,
      prompt: item.prompt,
      // Hints follow the passage language, not the UI language.
      hintZh: item.hint, hintEn: item.hint,
      scored: true
    };
  }

  function buildItem(p, item, rnd) {
    var q, order;
    if (item.interaction === 'select') {
      q = base(p, item, 'select');
      order = shuffledIndices(item.options.length, rnd);
      q.choices = order.map(function (i) { return item.options[i]; });
      q.options = q.choices.map(function (_, i) { return i; });
      q.answer = order.indexOf(item.answer);
      return q;
    }
    if (item.interaction === 'evidence' && item.target === 'sentence') {
      q = base(p, item, 'evidence_sentence');
      q.options = p.sentences.map(function (s) { return s.id; });
      q.answer = item.answer.slice();
      return q;
    }
    if (item.interaction === 'evidence') {
      q = base(p, item, 'evidence_phrase');
      order = shuffledIndices(item.phrases.length, rnd);
      q.choices = order.map(function (i) { return { text: item.phrases[i] }; });
      q.options = q.choices.map(function (_, i) { return i; });
      q.answer = order.indexOf(item.answer);
      return q;
    }
    if (item.interaction === 'order') {
      q = base(p, item, 'order');
      do { order = shuffledIndices(item.cards.length, rnd); } while (isIdentity(order) && item.cards.length > 1);
      q.cards = item.cards.slice();      // correct order
      q.deal = order;                    // display order: indices into q.cards
      q.options = ['check'];
      q.answer = 'check';
      return q;
    }
    throw new Error('[LANG_GEN] unknown interaction: ' + item.interaction + ' in ' + p.id + '/' + item.id);
  }

  function buildCcr(p) {
    var c = p.ccr;
    var common = {
      lang: p.lang, passageId: p.id, title: p.title, sentences: p.sentences,
      unit: 'express', geneId: UNIT_GENE.express, template: 'ending-ccr', level: null,
      anchors: p.anchors.curriculum, scored: false, ccr: c, hintZh: '', hintEn: ''
    };
    var qs = c.slots.map(function (slot, i) {
      return Object.assign({}, common, {
        kind: 'ccr_slot', itemId: 'ccr-' + slot.key, slotKey: slot.key, slotIndex: i,
        slotName: slot.name, prompt: c.prompt,
        choices: slot.options.map(function (t) { return { text: t }; }),
        options: slot.options.map(function (_, j) { return j; }),
        answer: null
      });
    });
    qs.push(Object.assign({}, common, {
      kind: 'ccr_reflect', itemId: 'ccr-reflect', prompt: c.reflectPrompt,
      choices: c.otherIdeas.map(function (o) { return { text: o.viewpoint }; }),
      options: c.otherIdeas.map(function (_, j) { return j; }),
      answer: null
    }));
    return qs;
  }

  function sceneBase(scene, item, kind, prompt) {
    return {
      kind: kind,
      lang: scene.lang,
      passageId: scene.id,
      title: SCENE_TITLE[scene.grade][scene.lang],
      itemId: item.id,
      unit: item.unit,
      geneId: UNIT_GENE[item.unit],
      template: item.interaction,
      level: null,
      prompt: prompt,
      hintZh: item.hintZh || '', hintEn: item.hintEn || '',
      scored: true
    };
  }

  function buildHotspotItem(scene, item, rnd) {
    var q = sceneBase(scene, item, 'hotspot', scene.lang === 'zh' ? item.promptZh : item.promptEn);
    q.objects = scene.objects;
    q.bg = scene.bg;
    var ids = [item.target].concat(item.distractors);
    var order = shuffledIndices(ids.length, rnd);
    q.choices = order.map(function (i) { return objectById(scene, ids[i]); });
    q.options = q.choices.map(function (_, i) { return i; });
    q.answer = order.indexOf(0);
    return q;
  }

  function buildFrameOrderItem(scene, item, rnd) {
    var q = sceneBase(scene, item, 'scene_order', scene.lang === 'zh' ? ORDER_PROMPT.zh : ORDER_PROMPT.en);
    var order;
    do { order = shuffledIndices(scene.frames.length, rnd); } while (isIdentity(order) && scene.frames.length > 1);
    q.cards = scene.frames.map(function (f) { return f.emoji + '  ' + (scene.lang === 'zh' ? f.textZh : f.textEn); });
    q.deal = order;
    q.options = ['check'];
    q.answer = 'check';
    return q;
  }

  function buildSceneItem(scene, item, rnd) {
    if (item.interaction === 'hotspot') { return buildHotspotItem(scene, item, rnd); }
    if (item.interaction === 'order') { return buildFrameOrderItem(scene, item, rnd); }
    throw new Error('[LANG_GEN] unknown scene interaction: ' + item.interaction + ' in ' + scene.id + '/' + item.id);
  }

  function generateScene(lang, grade, seed) {
    var rnd = rngFor(seed);
    var pool = scenePoolFor(lang, grade);
    if (!pool.length) { return []; }
    var scene = pool[Math.floor(rnd() * pool.length)];
    var qs = scene.items.map(function (item) { return buildSceneItem(scene, item, rnd); });
    qs.forEach(function (q, i) { q.seq = i; });
    return qs;
  }

  function generate(lang, grade, seed) {
    var rnd = rngFor(seed);
    var pool = poolFor(lang, grade);
    if (!pool.length) { return []; }
    var p = pool[Math.floor(rnd() * pool.length)];
    var qs = p.items.map(function (item) { return buildItem(p, item, rnd); });
    if (p.ccr) { qs = qs.concat(buildCcr(p)); }
    qs.forEach(function (q, i) { q.seq = i; });
    return qs;
  }

  return {
    generate: generate, rngFor: rngFor, poolFor: poolFor, UNIT_GENE: UNIT_GENE,
    generateScene: generateScene, scenePoolFor: scenePoolFor
  };
}());
