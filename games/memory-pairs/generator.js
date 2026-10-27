'use strict';

/**
 * Memory Pairs+ — reproducible session generator
 */
var MP_GEN = (function () {
  function rngFor(seed) {
    if (seed === undefined || seed === null) { return Math.random; }
    var s = (Number(seed) >>> 0) || 1;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function shuffled(list, rnd) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function buildCards(items, rnd) {
    var cards = [];
    items.forEach(function (item) {
      cards.push({ uid: item.id + '-a', pairId: item.id, item: item });
      cards.push({ uid: item.id + '-b', pairId: item.id, item: item });
    });
    return shuffled(cards, rnd);
  }

  function differentPairSwap(cards, rnd) {
    var candidates = [];
    for (var i = 0; i < cards.length; i++) {
      for (var j = i + 1; j < cards.length; j++) {
        if (cards[i].pairId !== cards[j].pairId) {
          candidates.push([i, j]);
        }
      }
    }
    return candidates[Math.floor(rnd() * candidates.length)];
  }

  function buildQuestion(gradeCode, rnd) {
    var cfg = MP_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }

    var chosen = shuffled(MP_DATA.items, rnd).slice(0, cfg.pairCount);
    var originalCards = buildCards(chosen, rnd);
    var answerCards = originalCards.slice();
    var update = null;

    if (cfg.mode === 'swap_update') {
      var swap = differentPairSwap(answerCards, rnd);
      var first = answerCards[swap[0]];
      var second = answerCards[swap[1]];
      answerCards[swap[0]] = second;
      answerCards[swap[1]] = first;
      update = {
        firstIndex: swap[0],
        secondIndex: swap[1]
      };
    }

    return {
      gradeCode: gradeCode,
      mode: cfg.mode,
      pairCount: cfg.pairCount,
      columns: cfg.columns,
      exposureMs: cfg.exposureMs,
      retentionMs: cfg.retentionMs,
      similarity: cfg.similarity,
      originalCards: originalCards,
      cards: answerCards,
      update: update,
      options: ['done'],
      answer: 'done',
      optionTypes: { done: 'pair_completion' },
      key: gradeCode + ':' + originalCards.map(function (card) {
        return card.uid;
      }).join(',') + ':' + (update
        ? update.firstIndex + '-' + update.secondIndex
        : 'none')
    };
  }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var questions = [];
    var seen = {};
    var guard = 0;

    while (questions.length < count && guard++ < count * 60) {
      var question = buildQuestion(gradeCode, rnd);
      if (!question || seen[question.key]) { continue; }
      seen[question.key] = true;
      questions.push(question);
    }
    return questions;
  }

  return {
    generate: generate,
    buildQuestion: buildQuestion,
    rngFor: rngFor
  };
}());
