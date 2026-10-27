'use strict';

/** What Happened? — reproducible contextual-memory session generator. */
var WH_GEN = (function () {
  function rngFor(seed) {
    if (seed === undefined || seed === null) { return Math.random; }
    var s = (Number(seed) >>> 0) || 1;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function pick(list, rnd) {
    return list[Math.floor(rnd() * list.length)];
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

  function emptyScene(count) {
    return Array.apply(null, Array(count)).map(function () { return null; });
  }

  function answerText(change) {
    if (change.type === 'missing') {
      return {
        zh: change.oldItem.zh + '不见了',
        en: change.oldItem.en + ' disappeared'
      };
    }
    if (change.type === 'added') {
      return {
        zh: change.newItem.zh + '出现了',
        en: change.newItem.en + ' appeared'
      };
    }
    if (change.type === 'moved') {
      return {
        zh: change.oldItem.zh + '换了位置',
        en: change.oldItem.en + ' moved to another place'
      };
    }
    return {
      zh: change.oldItem.zh + '变成了' + change.newItem.zh,
      en: change.oldItem.en + ' was replaced by ' + change.newItem.en
    };
  }

  function optionId(type, oldItem, newItem) {
    return type + ':' +
      (oldItem ? oldItem.id : 'none') + ':' +
      (newItem ? newItem.id : 'none');
  }

  function buildDistractors(change, count, rnd) {
    var excluded = [
      change.oldItem && change.oldItem.id,
      change.newItem && change.newItem.id
    ];
    var candidates = shuffled(WH_DATA.objects.filter(function (item) {
      return excluded.indexOf(item.id) < 0;
    }), rnd).slice(0, count);

    return candidates.map(function (item) {
      if (change.type === 'missing') {
        return {
          id: optionId('missing', item, null),
          zh: item.zh + '不见了',
          en: item.en + ' disappeared'
        };
      }
      if (change.type === 'added') {
        return {
          id: optionId('added', null, item),
          zh: item.zh + '出现了',
          en: item.en + ' appeared'
        };
      }
      if (change.type === 'moved') {
        return {
          id: optionId('moved', item, item),
          zh: item.zh + '换了位置',
          en: item.en + ' moved to another place'
        };
      }
      return {
        id: optionId('replaced', change.oldItem, item),
        zh: change.oldItem.zh + '变成了' + item.zh,
        en: change.oldItem.en + ' was replaced by ' + item.en
      };
    });
  }

  function buildQuestion(gradeCode, rnd) {
    var cfg = WH_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }

    var selected = shuffled(WH_DATA.objects, rnd).slice(0, cfg.objectCount + 1);
    var slots = Array.apply(null, Array(cfg.slotCount)).map(function (_, index) {
      return index;
    });
    var occupied = shuffled(slots, rnd).slice(0, cfg.objectCount);
    var before = emptyScene(cfg.slotCount);

    occupied.forEach(function (slot, index) {
      before[slot] = selected[index];
    });

    var after = before.slice();
    var type = pick(cfg.changeTypes, rnd);
    var change;

    if (type === 'missing') {
      var missingSlot = pick(occupied, rnd);
      change = {
        type: type,
        from: missingSlot,
        to: null,
        oldItem: after[missingSlot],
        newItem: null
      };
      after[missingSlot] = null;
    } else if (type === 'added') {
      var addSlots = slots.filter(function (slot) { return !after[slot]; });
      var addSlot = pick(addSlots, rnd);
      change = {
        type: type,
        from: null,
        to: addSlot,
        oldItem: null,
        newItem: selected[cfg.objectCount]
      };
      after[addSlot] = change.newItem;
    } else if (type === 'moved') {
      var from = pick(occupied, rnd);
      var destinations = slots.filter(function (slot) { return !after[slot]; });
      var to = pick(destinations, rnd);
      change = {
        type: type,
        from: from,
        to: to,
        oldItem: after[from],
        newItem: after[from]
      };
      after[to] = after[from];
      after[from] = null;
    } else {
      var replaceSlot = pick(occupied, rnd);
      change = {
        type: type,
        from: replaceSlot,
        to: replaceSlot,
        oldItem: after[replaceSlot],
        newItem: selected[cfg.objectCount]
      };
      after[replaceSlot] = change.newItem;
    }

    var answer = optionId(type, change.oldItem, change.newItem);
    var text = answerText(change);
    var options = buildDistractors(change, cfg.optionCount - 1, rnd);
    options.push({ id: answer, zh: text.zh, en: text.en });
    options = shuffled(options, rnd);

    var optionTypes = {};
    options.forEach(function (option) {
      optionTypes[option.id] =
        option.id === answer ? 'actual_change' : 'context_distractor';
    });

    return {
      gradeCode: gradeCode,
      changeType: type,
      processing: cfg.processing,
      slotCount: cfg.slotCount,
      before: before,
      after: after,
      change: change,
      exposureMs: cfg.exposureMs,
      retentionMs: cfg.retentionMs,
      options: options,
      answer: answer,
      optionTypes: optionTypes,
      key: gradeCode + ':' +
        before.map(function (item) {
          return item ? item.id : '_';
        }).join(',') + ':' +
        type + ':' +
        (change.from === null ? '_' : change.from) + ':' +
        (change.to === null ? '_' : change.to)
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
