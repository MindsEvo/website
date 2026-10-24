'use strict';

/**
 * Flash Cards — session GENERATOR (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Recognition items ask which card was shown after all cards disappear.
 * Missing-card items show two explicit category groups, hide the original set,
 * then reveal the same grouped set with one card removed. The answer must come
 * from memory of the original display, not from common-sense category knowledge.
 */
var FC_GEN = (function () {

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
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function otherCategory(catNames, exclude, rnd) {
    var choices = catNames.filter(function (c) {
      return c !== exclude;
    });
    return pick(choices, rnd);
  }

  function buildOptions(shown, target, category, cfg, rnd) {
    var catNames = Object.keys(FC_DATA.categories);
    var types = {};
    var opts = [target];
    types[target] = 'seen';

    function addFrom(cat, tag) {
      var pool = FC_DATA.categories[cat].filter(function (item) {
        return opts.indexOf(item) < 0 && shown.indexOf(item) < 0;
      });
      var candidate = pick(pool, rnd);
      if (candidate && opts.indexOf(candidate) < 0) {
        opts.push(candidate);
        types[candidate] = tag;
      }
    }

    while (opts.length < cfg.optionCount) {
      var useSame = cfg.similarity === 'high' ? true :
        cfg.similarity === 'low' ? false :
        rnd() < 0.5;
      var before = opts.length;

      if (useSame) {
        addFrom(category, 'same_category');
      } else {
        addFrom(otherCategory(catNames, category, rnd), 'other_category');
      }

      if (opts.length === before) { break; }
    }

    return {
      options: shuffled(opts, rnd),
      optionTypes: types
    };
  }

  function buildRecognitionQuestion(gradeCode, cfg, rnd) {
    var catNames = Object.keys(FC_DATA.categories);
    var category = pick(catNames, rnd);
    var shown = shuffled(FC_DATA.categories[category], rnd)
      .slice(0, cfg.itemCount);
    var target = pick(shown, rnd);
    var optionData = buildOptions(shown, target, category, cfg, rnd);

    return {
      gradeCode: gradeCode,
      mode: 'recognition',
      category: category,
      categories: [category],
      shown: shown,
      groups: [{
        category: category,
        cards: shown.slice()
      }],
      target: target,
      exposureMs: cfg.exposureMs,
      options: optionData.options,
      answer: target,
      optionTypes: optionData.optionTypes,
      organizationSupport: 'natural_category',
      hintZh: '回想刚才整组卡片里出现过什么',
      hintEn: 'Recall what appeared in the whole group'
    };
  }

  function buildMissingOptions(missing, category, shown, cfg, rnd) {
    var opts = [missing];
    var types = {};
    types[missing] = 'missing_card';

    var sameCategoryPool = FC_DATA.categories[category].filter(function (item) {
      return item !== missing && shown.indexOf(item) < 0;
    });

    shuffled(sameCategoryPool, rnd).forEach(function (item) {
      if (opts.length < cfg.optionCount) {
        opts.push(item);
        types[item] = 'same_category_unseen';
      }
    });

    var allCards = [];
    Object.keys(FC_DATA.categories).forEach(function (name) {
      allCards = allCards.concat(FC_DATA.categories[name]);
    });

    shuffled(allCards, rnd).forEach(function (item) {
      if (opts.length < cfg.optionCount &&
          opts.indexOf(item) < 0 &&
          shown.indexOf(item) < 0) {
        opts.push(item);
        types[item] = 'other_unseen';
      }
    });

    return {
      options: shuffled(opts, rnd),
      optionTypes: types
    };
  }

  function buildMissingQuestion(gradeCode, cfg, rnd) {
    var catNames = shuffled(Object.keys(FC_DATA.categories), rnd);
    var selectedCategories = catNames.slice(0, 2);
    var perGroup = Math.floor(cfg.itemCount / 2);
    var groups = selectedCategories.map(function (category) {
      return {
        category: category,
        cards: shuffled(FC_DATA.categories[category], rnd)
          .slice(0, perGroup)
      };
    });

    var shown = [];
    groups.forEach(function (group) {
      shown = shown.concat(group.cards);
    });

    var missingGroupIndex = Math.floor(rnd() * groups.length);
    var missingGroup = groups[missingGroupIndex];
    var missing = pick(missingGroup.cards, rnd);
    var remainingGroups = groups.map(function (group) {
      return {
        category: group.category,
        cards: group.cards.filter(function (card) {
          return card !== missing;
        })
      };
    });
    var optionData = buildMissingOptions(
      missing,
      missingGroup.category,
      shown,
      cfg,
      rnd
    );

    return {
      gradeCode: gradeCode,
      mode: 'missing',
      category: missingGroup.category,
      categories: selectedCategories,
      shown: shown,
      groups: groups,
      remainingGroups: remainingGroups,
      target: missing,
      exposureMs: cfg.missingExposureMs,
      options: optionData.options,
      answer: missing,
      optionTypes: optionData.optionTypes,
      organizationSupport: cfg.organization,
      hintZh: '按类别回想：每一组原来分别有哪些卡片？',
      hintEn: 'Recall by category: which cards were in each group?'
    };
  }

  function buildQuestion(gradeCode, rnd, mode) {
    var cfg = FC_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }

    return mode === 'missing'
      ? buildMissingQuestion(gradeCode, cfg, rnd)
      : buildRecognitionQuestion(gradeCode, cfg, rnd);
  }

  function generate(gradeCode, count, seed) {
    var cfg = FC_DATA.gradeConfig[gradeCode];
    if (!cfg) { return []; }

    var rnd = rngFor(seed);
    var missingCount = Math.min(cfg.missingCount || 0, count);
    var modes = [];
    var out = [];

    for (var i = 0; i < missingCount; i++) {
      modes.push('missing');
    }
    while (modes.length < count) {
      modes.push('recognition');
    }

    shuffled(modes, rnd).forEach(function (mode) {
      var question = buildQuestion(gradeCode, rnd, mode);
      if (question) { out.push(question); }
    });

    return out;
  }

  return {
    generate: generate,
    buildQuestion: buildQuestion,
    rngFor: rngFor
  };
}());
