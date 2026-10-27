'use strict';

/** Memory Detective — reproducible clue-memory session generator. */
var MD_GEN = (function () {
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

  function animalId(suspect) {
    return suspect.id.split('-')[1];
  }

  function animalLabel(suspect) {
    var labels = {
      cat: { icon: '🐱', zh: '是小猫', en: 'is a cat' },
      dog: { icon: '🐶', zh: '是小狗', en: 'is a dog' },
      rabbit: { icon: '🐰', zh: '是兔子', en: 'is a rabbit' },
      panda: { icon: '🐼', zh: '是熊猫', en: 'is a panda' }
    };
    return labels[animalId(suspect)];
  }

  function clueFor(attribute, suspect) {
    var label;
    if (attribute === 'animal') {
      label = animalLabel(suspect);
    } else {
      label = MD_DATA.labels[attribute][suspect[attribute]];
    }

    return {
      attribute: attribute,
      value: attribute === 'animal' ? animalId(suspect) : suspect[attribute],
      icon: label.icon,
      zh: label.zh,
      en: label.en
    };
  }

  function matchesClues(suspect, clues) {
    return clues.every(function (clue) {
      if (clue.attribute === 'animal') {
        return animalId(suspect) === clue.value;
      }
      return suspect[clue.attribute] === clue.value;
    });
  }

  function buildSuspects(target, clues, count, rnd) {
    var pool = shuffled(MD_DATA.suspects.filter(function (suspect) {
      return suspect.id !== target.id && !matchesClues(suspect, clues);
    }), rnd);

    var suspects = [target];
    pool.forEach(function (suspect) {
      if (suspects.length < count) {
        suspects.push(suspect);
      }
    });
    return shuffled(suspects, rnd);
  }

  function buildQuestion(gradeCode, rnd) {
    var cfg = MD_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }

    var target = pick(MD_DATA.suspects, rnd);
    var shownClues = cfg.clueAttributes.map(function (attribute) {
      return clueFor(attribute, target);
    });
    var expectedClues = shownClues.slice();
    var update = null;

    if (cfg.mode === 'clue_update') {
      var updateIndex = 1 + Math.floor(rnd() * (shownClues.length - 1));
      var attribute = shownClues[updateIndex].attribute;
      var alternatives = Object.keys(MD_DATA.labels[attribute]).filter(function (value) {
        return value !== shownClues[updateIndex].value;
      });
      var newValue = pick(alternatives, rnd);
      var candidates = MD_DATA.suspects.filter(function (suspect) {
        if (animalId(suspect) !== shownClues[0].value) { return false; }
        return suspect[attribute] === newValue;
      });

      if (!candidates.length) { return buildQuestion(gradeCode, rnd); }

      target = pick(candidates, rnd);
      var replacement = clueFor(attribute, target);
      update = {
        index: updateIndex,
        attribute: attribute,
        oldClue: shownClues[updateIndex],
        newClue: replacement
      };
      expectedClues[updateIndex] = replacement;

      expectedClues.forEach(function (clue, index) {
        if (index !== updateIndex) {
          expectedClues[index] = clueFor(clue.attribute, target);
          shownClues[index] = expectedClues[index];
        }
      });
    }

    var suspects = buildSuspects(
      target,
      expectedClues,
      cfg.suspectCount,
      rnd
    );

    if (suspects.length !== cfg.suspectCount) {
      return buildQuestion(gradeCode, rnd);
    }

    var optionTypes = {};
    suspects.forEach(function (suspect) {
      optionTypes[suspect.id] = suspect.id === target.id
        ? 'matches_all_clues'
        : 'clue_mismatch';
    });

    return {
      gradeCode: gradeCode,
      mode: cfg.mode,
      shownClues: shownClues,
      expectedClues: expectedClues,
      update: update,
      suspects: suspects,
      exposureMs: cfg.exposureMs,
      retentionMs: cfg.retentionMs,
      options: suspects.map(function (suspect) { return suspect.id; }),
      optionTypes: optionTypes,
      answer: target.id,
      key: gradeCode + ':' +
        shownClues.map(function (clue) {
          return clue.attribute + '=' + clue.value;
        }).join(',') + ':' +
        (update ? update.attribute + '=' + update.newClue.value : 'none') + ':' +
        suspects.map(function (suspect) { return suspect.id; }).join(',')
    };
  }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var questions = [];
    var seen = {};
    var guard = 0;

    while (questions.length < count && guard++ < count * 80) {
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
    rngFor: rngFor,
    matchesClues: matchesClues
  };
}());
