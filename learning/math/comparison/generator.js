'use strict';
/**
 * Comparison Generator  v1.0
 *
 * Each generator function receives a template `params` object and returns
 * a normalized question object compatible with shell.createGame renderSequence /
 * renderOption / checkAnswer.
 *
 * All question objects share these required fields:
 *   options    : string[]   e.g. ['left','right'] or ['A','B','C']
 *   answer     : string     one of options
 *   hintZh     : string
 *   hintEn     : string
 *   type       : string     mirrors template.type
 *   templateId : string
 *   variantId  : string     set by caller via CmpEngine.makeVariantId()
 *
 * Plus type-specific fields consumed by the renderer.
 */

// ── Shared data ───────────────────────────────────────────────────────────────

var GEN_DATA = {

  animals: [
    { emoji: '🐘', nameZh: '大象', nameEn: 'Elephant', size: 10 },
    { emoji: '🦒', nameZh: '长颈鹿', nameEn: 'Giraffe', size: 9 },
    { emoji: '🦛', nameZh: '河马', nameEn: 'Hippo', size: 8 },
    { emoji: '🐄', nameZh: '奶牛', nameEn: 'Cow', size: 7 },
    { emoji: '🐑', nameZh: '绵羊', nameEn: 'Sheep', size: 5 },
    { emoji: '🐇', nameZh: '兔子', nameEn: 'Rabbit', size: 3 },
    { emoji: '🐿', nameZh: '松鼠', nameEn: 'Squirrel', size: 2 },
    { emoji: '🐭', nameZh: '小老鼠', nameEn: 'Mouse', size: 1 }
  ],

  objects: [
    { emoji: '🚗', nameZh: '汽车', nameEn: 'Car', size: 8 },
    { emoji: '🚲', nameZh: '自行车', nameEn: 'Bicycle', size: 5 },
    { emoji: '🎒', nameZh: '书包', nameEn: 'Backpack', size: 4 },
    { emoji: '⚽', nameZh: '足球', nameEn: 'Ball', size: 3 },
    { emoji: '🍎', nameZh: '苹果', nameEn: 'Apple', size: 2 },
    { emoji: '🍓', nameZh: '草莓', nameEn: 'Strawberry', size: 1 }
  ],

  furniture: [
    { emoji: '🛋', nameZh: '沙发', nameEn: 'Sofa', size: 9 },
    { emoji: '🪑', nameZh: '椅子', nameEn: 'Chair', size: 5 },
    { emoji: '🪣', nameZh: '水桶', nameEn: 'Bucket', size: 3 },
    { emoji: '📦', nameZh: '小箱子', nameEn: 'Box', size: 2 }
  ],

  ribbonSets: {
    ribbons:      { labelZh: '彩带', labelEn: 'Ribbon' },
    sticks:       { labelZh: '小棒', labelEn: 'Stick' },
    paths:        { labelZh: '小路', labelEn: 'Path' },
    ropes:        { labelZh: '绳子', labelEn: 'Rope' },
    rulers:       { labelZh: '尺子', labelEn: 'Ruler' },
    measurements: { labelZh: '长度', labelEn: 'Length' }
  },

  trees: [
    { emoji: '🌲', nameZh: '松树', nameEn: 'Pine' },
    { emoji: '🌴', nameZh: '椰树', nameEn: 'Palm' },
    { emoji: '🌳', nameZh: '大树', nameEn: 'Tree' }
  ],

  buildings: [
    { emoji: '🏢', nameZh: '高楼', nameEn: 'Building' },
    { emoji: '🏠', nameZh: '小房子', nameEn: 'House' },
    { emoji: '⛺', nameZh: '帐篷', nameEn: 'Tent' }
  ],

  weightPairs: [
    { heavy: { emoji: '🐘', nameZh: '大象', nameEn: 'Elephant' }, light: { emoji: '🐇', nameZh: '兔子', nameEn: 'Rabbit' } },
    { heavy: { emoji: '🪨', nameZh: '大石头', nameEn: 'Big Rock' }, light: { emoji: '🍃', nameZh: '树叶', nameEn: 'Leaf' } },
    { heavy: { emoji: '📚', nameZh: '书', nameEn: 'Books' }, light: { emoji: '🪶', nameZh: '羽毛', nameEn: 'Feather' } },
    { heavy: { emoji: '🛒', nameZh: '购物车', nameEn: 'Cart' }, light: { emoji: '🎈', nameZh: '气球', nameEn: 'Balloon' } }
  ],

  speedPairs: [
    { fast: { emoji: '🐆', nameZh: '猎豹', nameEn: 'Cheetah' }, slow: { emoji: '🐢', nameZh: '乌龟', nameEn: 'Turtle' } },
    { fast: { emoji: '✈️', nameZh: '飞机', nameEn: 'Plane' }, slow: { emoji: '🐌', nameZh: '蜗牛', nameEn: 'Snail' } },
    { fast: { emoji: '🚀', nameZh: '火箭', nameEn: 'Rocket' }, slow: { emoji: '🚶', nameZh: '走路', nameEn: 'Walking' } },
    { fast: { emoji: '🐇', nameZh: '兔子', nameEn: 'Rabbit' }, slow: { emoji: '🐢', nameZh: '乌龟', nameEn: 'Turtle' } }
  ],

  nearFarSubjects: [
    { ref: { emoji: '🏠', nameZh: '房子', nameEn: 'House' }, objs: [{ emoji: '🌲', nameZh: '大树', nameEn: 'Tree' }, { emoji: '⛰', nameZh: '山', nameEn: 'Mountain' }] },
    { ref: { emoji: '🐇', nameZh: '小兔', nameEn: 'Bunny' }, objs: [{ emoji: '🥕', nameZh: '胡萝卜', nameEn: 'Carrot' }, { emoji: '🌸', nameZh: '花', nameEn: 'Flower' }] },
    { ref: { emoji: '🏫', nameZh: '学校', nameEn: 'School' }, objs: [{ emoji: '🛝', nameZh: '滑梯', nameEn: 'Slide' }, { emoji: '🌳', nameZh: '大树', nameEn: 'Tree' }] }
  ],

  containerPairs: [
    { emoji: '🪣', nameZh: '水桶', nameEn: 'Bucket' },
    { emoji: '🥛', nameZh: '杯子', nameEn: 'Cup' },
    { emoji: '🏺', nameZh: '花瓶', nameEn: 'Vase' }
  ],

  shapes: ['circle', 'square', 'triangle', 'star', 'heart', 'diamond'],
  colors: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],

  colorMap: {
    red:    { hex: '#ef4444', zh: '红色', en: 'Red' },
    blue:   { hex: '#3b82f6', zh: '蓝色', en: 'Blue' },
    green:  { hex: '#22c55e', zh: '绿色', en: 'Green' },
    yellow: { hex: '#eab308', zh: '黄色', en: 'Yellow' },
    purple: { hex: '#a855f7', zh: '紫色', en: 'Purple' },
    orange: { hex: '#f97316', zh: '橙色', en: 'Orange' }
  },

  shapeNameMap: {
    circle:   { zh: '圆形', en: 'Circle' },
    square:   { zh: '正方形', en: 'Square' },
    triangle: { zh: '三角形', en: 'Triangle' },
    star:     { zh: '星形', en: 'Star' },
    heart:    { zh: '心形', en: 'Heart' },
    diamond:  { zh: '菱形', en: 'Diamond' }
  },

  dailyEvents: [
    { zh: '早饭', en: 'Breakfast', order: 1 },
    { zh: '上学', en: 'Go to School', order: 2 },
    { zh: '午饭', en: 'Lunch', order: 3 },
    { zh: '放学', en: 'Leave School', order: 4 },
    { zh: '晚饭', en: 'Dinner', order: 5 },
    { zh: '睡觉', en: 'Sleep', order: 6 }
  ],

  quantityObjects: [
    { emoji: '🍎', nameZh: '苹果', nameEn: 'Apple' },
    { emoji: '⭐', nameZh: '星星', nameEn: 'Star' },
    { emoji: '🐟', nameZh: '小鱼', nameEn: 'Fish' },
    { emoji: '🌸', nameZh: '花', nameEn: 'Flower' },
    { emoji: '🍪', nameZh: '饼干', nameEn: 'Cookie' },
    { emoji: '🎈', nameZh: '气球', nameEn: 'Balloon' }
  ]
};

// ── Utility ───────────────────────────────────────────────────────────────────

function _ri(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function _pick(arr) {
  return arr[_ri(0, arr.length - 1)];
}

// Pick two distinct items from an array.
function _pick2(arr) {
  if (arr.length < 2) return [arr[0], arr[0]];
  var i = _ri(0, arr.length - 1);
  var j;
  do { j = _ri(0, arr.length - 1); } while (j === i);
  return [arr[i], arr[j]];
}

function _shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function _askMode(paramAskMode) {
  if (paramAskMode === 'random') return Math.random() < 0.5;  // true = ask for "bigger/longer/etc."
  return paramAskMode === 'bigger' || paramAskMode === 'longer' ||
         paramAskMode === 'taller' || paramAskMode === 'more' ||
         paramAskMode === 'heavier' || paramAskMode === 'faster' ||
         paramAskMode === 'fuller' || paramAskMode === 'nearer' ||
         paramAskMode === 'first';
}

// ── Generator functions ───────────────────────────────────────────────────────

var Generators = {};

/**
 * sizeCompare: two emoji objects at different visual sizes.
 * K1: clear size difference (no numbers).
 */
Generators.sizeCompare = function (params) {
  var set = GEN_DATA[params.set] || GEN_DATA.animals;
  // Ensure the two picked items have a meaningful size gap (≥ 3 units)
  var attempts = 0;
  var left, right;
  do {
    var pair = _pick2(set);
    left = pair[0]; right = pair[1];
    attempts++;
  } while (Math.abs(left.size - right.size) < 3 && attempts < 50);

  // askBigger: true = "哪个更大"
  var askBigger = _askMode(params.askMode);
  var biggerSide = left.size > right.size ? 'left' : 'right';
  var answer = askBigger ? biggerSide : (biggerSide === 'left' ? 'right' : 'left');

  return {
    type: 'size',
    options: ['left', 'right'],
    answer: answer,
    askBigger: askBigger,
    leftEmoji: left.emoji,
    rightEmoji: right.emoji,
    leftSizeRank: left.size,
    rightSizeRank: right.size,
    leftNameZh: left.nameZh,
    rightNameZh: right.nameZh,
    leftNameEn: left.nameEn,
    rightNameEn: right.nameEn,
    hintZh: '仔细看哪个更' + (askBigger ? '大' : '小') + '。',
    hintEn: 'Look carefully at which is ' + (askBigger ? 'bigger' : 'smaller') + '.'
  };
};

/**
 * lengthCompare: two horizontal bars of different lengths.
 */
Generators.lengthCompare = function (params) {
  var setDef = GEN_DATA.ribbonSets[params.set] || GEN_DATA.ribbonSets.ribbons;
  var gapPct = params.gapPct || 35;

  // Generate two lengths ensuring at least gapPct% relative gap
  var a, b, attempts = 0;
  do {
    a = _ri(20, 95);
    b = _ri(20, 95);
    attempts++;
  } while ((Math.abs(a - b) / Math.max(a, b)) * 100 < gapPct && attempts < 100);

  var visual = params.visual || 'bar';
  var askLonger = _askMode(params.askMode);
  var longerSide = a > b ? 'left' : 'right';
  var answer = askLonger ? longerSide : (longerSide === 'left' ? 'right' : 'left');

  return {
    type: 'length',
    options: ['left', 'right'],
    answer: answer,
    askLonger: askLonger,
    leftPct: a,
    rightPct: b,
    visual: visual,
    labelZh: setDef.labelZh,
    labelEn: setDef.labelEn,
    leftLabelZh: setDef.labelZh + ' A',
    rightLabelZh: setDef.labelZh + ' B',
    leftLabelEn: setDef.labelEn + ' A',
    rightLabelEn: setDef.labelEn + ' B',
    hintZh: '看哪根' + setDef.labelZh + '更' + (askLonger ? '长' : '短') + '。',
    hintEn: 'Which ' + setDef.labelEn.toLowerCase() + ' is ' + (askLonger ? 'longer' : 'shorter') + '?'
  };
};

/**
 * heightCompare: two vertical bars representing height.
 */
Generators.heightCompare = function (params) {
  var set = params.set === 'buildings' ? GEN_DATA.buildings : GEN_DATA.trees;
  var gapPct = params.gapPct || 35;
  var leftObj = _pick(set);
  var rightObj = _pick(set);

  var a, b, attempts = 0;
  do {
    a = _ri(25, 95);
    b = _ri(25, 95);
    attempts++;
  } while ((Math.abs(a - b) / Math.max(a, b)) * 100 < gapPct && attempts < 100);

  var askTaller = _askMode(params.askMode);
  var tallerSide = a > b ? 'left' : 'right';
  var answer = askTaller ? tallerSide : (tallerSide === 'left' ? 'right' : 'left');

  return {
    type: 'height',
    options: ['left', 'right'],
    answer: answer,
    askTaller: askTaller,
    leftHeightPct: a,
    rightHeightPct: b,
    leftEmoji: leftObj.emoji,
    rightEmoji: rightObj.emoji,
    leftNameZh: leftObj.nameZh,
    rightNameZh: rightObj.nameZh,
    leftNameEn: leftObj.nameEn,
    rightNameEn: rightObj.nameEn,
    hintZh: '看哪个更' + (askTaller ? '高' : '矮') + '。',
    hintEn: 'Which one is ' + (askTaller ? 'taller' : 'shorter') + '?'
  };
};

/**
 * quantityVisual: dot arrays, no numbers by default.
 */
Generators.quantityVisual = function (params) {
  var min = params.minCount || 1;
  var max = params.maxCount || 6;
  var minGap = params.minGap || 2;
  var showNumbers = !!params.showNumbers;
  var obj = _pick(GEN_DATA.quantityObjects);

  var a, b, attempts = 0;
  do {
    a = _ri(min, max);
    b = _ri(min, max);
    attempts++;
  } while (Math.abs(a - b) < minGap && attempts < 100);

  var askMore = _askMode(params.askMode);
  var moreSide = a > b ? 'left' : 'right';
  var answer = askMore ? moreSide : (moreSide === 'left' ? 'right' : 'left');

  return {
    type: 'quantity',
    options: ['left', 'right'],
    answer: answer,
    askMore: askMore,
    leftCount: a,
    rightCount: b,
    showNumbers: showNumbers,
    objEmoji: obj.emoji,
    objNameZh: obj.nameZh,
    objNameEn: obj.nameEn,
    hintZh: '数一数哪边' + obj.nameZh + '更' + (askMore ? '多' : '少') + '。',
    hintEn: 'Count and find which side has ' + (askMore ? 'more' : 'fewer') + ' ' + obj.nameEn.toLowerCase() + '.'
  };
};

/**
 * numberCompare: numeric comparison (K2+).
 */
Generators.numberCompare = function (params) {
  var min = params.min || 1;
  var max = params.max || 10;
  var minGap = params.minGap || 1;
  var showDots = !!params.showDots;

  var a, b, attempts = 0;
  do {
    a = _ri(min, max);
    b = _ri(min, max);
    attempts++;
  } while (Math.abs(a - b) < minGap && attempts < 100);

  var askBigger = _askMode(params.askMode);
  var biggerSide = a > b ? 'left' : 'right';
  var answer = askBigger ? biggerSide : (biggerSide === 'left' ? 'right' : 'left');

  return {
    type: 'number',
    options: ['left', 'right'],
    answer: answer,
    askBigger: askBigger,
    leftNum: a,
    rightNum: b,
    showDots: showDots,
    hintZh: '比较两个数字，哪个更' + (askBigger ? '大' : '小') + '？',
    hintEn: 'Compare both numbers. Which is ' + (askBigger ? 'bigger' : 'smaller') + '?'
  };
};

/**
 * sameDifferent: three items, pick the odd one out.
 * Used for shape and color type exercises.
 */
Generators.sameDifferent = function (params) {
  var attr = params.attribute;  // 'shape' | 'color'
  var count = params.optionCount || 3;
  var distractor = params.distractor || attr;

  var oddPos = _ri(0, count - 1);   // which position holds the odd item
  var options = ['A', 'B', 'C'].slice(0, count);

  var items = [];

  if (attr === 'shape') {
    // Two same shapes, one different shape
    var shapePool = _shuffle(GEN_DATA.shapes);
    var sameShape = shapePool[0];
    var oddShape = shapePool[1];
    var sameColor = _pick(GEN_DATA.colors);

    for (var i = 0; i < count; i++) {
      var isOdd = (i === oddPos);
      // When distractor is 'color', the odd item differs by shape but also changes color
      var itemColor = (distractor === 'color' || distractor === 'color_and_size')
        ? (isOdd ? _pick(GEN_DATA.colors.filter(function (c) { return c !== sameColor; })) : sameColor)
        : sameColor;
      items.push({
        shape: isOdd ? oddShape : sameShape,
        color: itemColor,
        size: (distractor === 'color_and_size' && !isOdd) ? 'normal' : (isOdd ? 'normal' : 'normal')
      });
    }
  } else if (attr === 'color') {
    // Two same colors, one different color
    var colorPool = _shuffle(GEN_DATA.colors);
    var sameColorAttr = colorPool[0];
    var oddColor = colorPool[1];
    var sameShapeAttr = _pick(GEN_DATA.shapes);

    for (var j = 0; j < count; j++) {
      var isOddC = (j === oddPos);
      var itemShape = (distractor === 'shape' || distractor === 'color_and_size')
        ? (isOddC ? _pick(GEN_DATA.shapes.filter(function (s) { return s !== sameShapeAttr; })) : sameShapeAttr)
        : sameShapeAttr;
      items.push({
        shape: itemShape,
        color: isOddC ? oddColor : sameColorAttr
      });
    }
  }

  var answerOption = options[oddPos];

  return {
    type: attr,
    options: options,
    answer: answerOption,
    items: items,
    oddPos: oddPos,
    attribute: attr,
    hintZh: '找出和其他' + (count - 1) + '个不一样的那个。',
    hintEn: 'Find the one that is different from the other ' + (count - 1) + '.'
  };
};

/**
 * nearFar: two objects at different distances from a reference point.
 */
Generators.nearFar = function (params) {
  var subj = _pick(GEN_DATA.nearFarSubjects);
  var ref = subj.ref;
  var objs = _shuffle(subj.objs.slice());

  // leftDist / rightDist: % from reference (lower = closer)
  var leftDist = _ri(10, 40);
  var rightDist = _ri(55, 90);
  // Randomly swap sides
  if (Math.random() < 0.5) { var tmp = leftDist; leftDist = rightDist; rightDist = tmp; }

  var askNearer = params.askMode === 'nearer' || (params.askMode === 'random' && Math.random() < 0.5);
  var nearerSide = leftDist < rightDist ? 'left' : 'right';
  var answer = askNearer ? nearerSide : (nearerSide === 'left' ? 'right' : 'left');

  return {
    type: 'position',
    options: ['left', 'right'],
    answer: answer,
    askNearer: askNearer,
    refEmoji: ref.emoji,
    refNameZh: ref.nameZh,
    refNameEn: ref.nameEn,
    leftEmoji: objs[0].emoji,
    rightEmoji: objs[1].emoji,
    leftNameZh: objs[0].nameZh,
    rightNameZh: objs[1].nameZh,
    leftNameEn: objs[0].nameEn,
    rightNameEn: objs[1].nameEn,
    leftDistPct: leftDist,
    rightDistPct: rightDist,
    hintZh: '看哪个离' + ref.nameZh + '更' + (askNearer ? '近' : '远') + '。',
    hintEn: 'Which is ' + (askNearer ? 'closer to' : 'farther from') + ' the ' + ref.nameEn.toLowerCase() + '?'
  };
};

/**
 * fullEmpty: two containers at different fill levels.
 */
Generators.fullEmpty = function (params) {
  var containers = _pick2(GEN_DATA.containerPairs);
  var leftFill = _ri(15, 90);
  var rightFill;
  do { rightFill = _ri(15, 90); } while (Math.abs(leftFill - rightFill) < 30);

  var askFuller = params.askMode === 'fuller' || (params.askMode === 'random' && Math.random() < 0.5);
  var fullerSide = leftFill > rightFill ? 'left' : 'right';
  var answer = askFuller ? fullerSide : (fullerSide === 'left' ? 'right' : 'left');

  return {
    type: 'fullness',
    options: ['left', 'right'],
    answer: answer,
    askFuller: askFuller,
    leftFillPct: leftFill,
    rightFillPct: rightFill,
    leftEmoji: containers[0].emoji,
    rightEmoji: containers[1].emoji,
    leftNameZh: containers[0].nameZh,
    rightNameZh: containers[1].nameZh,
    leftNameEn: containers[0].nameEn,
    rightNameEn: containers[1].nameEn,
    hintZh: '哪个装得更' + (askFuller ? '满' : '少') + '？',
    hintEn: 'Which one is ' + (askFuller ? 'fuller' : 'more empty') + '?'
  };
};

/**
 * weightCompare: visual intuitive weight comparison.
 */
Generators.weightCompare = function (params) {
  var pair = _pick(GEN_DATA.weightPairs);
  var askHeavier = params.askMode === 'heavier' || (params.askMode === 'random' && Math.random() < 0.5);
  var heavyOnLeft = Math.random() < 0.5;
  var answer = askHeavier
    ? (heavyOnLeft ? 'left' : 'right')
    : (heavyOnLeft ? 'right' : 'left');

  return {
    type: 'weight',
    options: ['left', 'right'],
    answer: answer,
    askHeavier: askHeavier,
    useScale: !!params.useScale,
    leftEmoji: heavyOnLeft ? pair.heavy.emoji : pair.light.emoji,
    rightEmoji: heavyOnLeft ? pair.light.emoji : pair.heavy.emoji,
    leftNameZh: heavyOnLeft ? pair.heavy.nameZh : pair.light.nameZh,
    rightNameZh: heavyOnLeft ? pair.light.nameZh : pair.heavy.nameZh,
    leftNameEn: heavyOnLeft ? pair.heavy.nameEn : pair.light.nameEn,
    rightNameEn: heavyOnLeft ? pair.light.nameEn : pair.heavy.nameEn,
    leftIsHeavy: heavyOnLeft,
    hintZh: '想一想哪个更' + (askHeavier ? '重' : '轻') + '。',
    hintEn: 'Think about which one is ' + (askHeavier ? 'heavier' : 'lighter') + '.'
  };
};

/**
 * speedCompare: intuitive speed comparison.
 */
Generators.speedCompare = function (params) {
  var pair = _pick(GEN_DATA.speedPairs);
  var askFaster = params.askMode === 'faster' || (params.askMode === 'random' && Math.random() < 0.5);
  var fastOnLeft = Math.random() < 0.5;
  var answer = askFaster
    ? (fastOnLeft ? 'left' : 'right')
    : (fastOnLeft ? 'right' : 'left');

  return {
    type: 'speed',
    options: ['left', 'right'],
    answer: answer,
    askFaster: askFaster,
    leftEmoji: fastOnLeft ? pair.fast.emoji : pair.slow.emoji,
    rightEmoji: fastOnLeft ? pair.slow.emoji : pair.fast.emoji,
    leftNameZh: fastOnLeft ? pair.fast.nameZh : pair.slow.nameZh,
    rightNameZh: fastOnLeft ? pair.slow.nameZh : pair.fast.nameZh,
    leftNameEn: fastOnLeft ? pair.fast.nameEn : pair.slow.nameEn,
    rightNameEn: fastOnLeft ? pair.slow.nameEn : pair.fast.nameEn,
    hintZh: '哪个' + (askFaster ? '更快' : '更慢') + '？',
    hintEn: 'Which one is ' + (askFaster ? 'faster' : 'slower') + '?'
  };
};

/**
 * timeOrder: which daily event happens first / earlier.
 */
Generators.timeOrder = function (params) {
  var pool = params.set === 'durations'
    ? [
        { zh: '10分钟', en: '10 minutes', order: 10 },
        { zh: '1小时', en: '1 hour', order: 60 },
        { zh: '1天', en: '1 day', order: 1440 },
        { zh: '1周', en: '1 week', order: 10080 }
      ]
    : GEN_DATA.dailyEvents;

  var pair = _pick2(pool);
  var a = pair[0], b = pair[1];
  var askEarlierOrLonger = params.askMode === 'first' || params.askMode === 'longer_duration';
  var leftFirst = a.order < b.order;

  var answer;
  if (params.askMode === 'longer_duration') {
    // ask which duration is longer (higher order = longer)
    answer = a.order > b.order ? 'left' : 'right';
  } else {
    answer = askEarlierOrLonger ? (leftFirst ? 'left' : 'right') : (leftFirst ? 'right' : 'left');
  }

  return {
    type: 'time',
    options: ['left', 'right'],
    answer: answer,
    askFirst: params.askMode === 'first',
    askLongerDuration: params.askMode === 'longer_duration',
    leftEventZh: a.zh,
    rightEventZh: b.zh,
    leftEventEn: a.en,
    rightEventEn: b.en,
    hintZh: params.askMode === 'longer_duration' ? '哪个时间更长？' : '哪件事先发生？',
    hintEn: params.askMode === 'longer_duration' ? 'Which duration is longer?' : 'Which happens first?'
  };
};

/**
 * multiAttribute: compare objects on multiple attributes; some distractors change irrelevant attrs.
 */
Generators.multiAttribute = function (params) {
  var attrs = params.attributes || ['size', 'color'];
  var distractorCount = params.distractors || 1;
  var ignoreAttr = params.ignoreAttribute || null;

  var shapes = _shuffle(GEN_DATA.shapes);
  var colors = _shuffle(GEN_DATA.colors);

  var targetSize = _ri(2, 9);
  var foilSize   = _ri(2, 9);
  while (Math.abs(targetSize - foilSize) < 2) { foilSize = _ri(2, 9); }

  var targetColor = colors[0];
  var foilColor   = colors[1];
  var targetShape = shapes[0];
  var foilShape   = shapes[1];

  var targetOnLeft = Math.random() < 0.5;

  var left  = { size: targetOnLeft ? targetSize : foilSize, color: targetOnLeft ? targetColor : foilColor, shape: targetOnLeft ? targetShape : foilShape };
  var right = { size: targetOnLeft ? foilSize : targetSize, color: targetOnLeft ? foilColor : targetColor, shape: targetOnLeft ? foilShape : targetShape };

  // The "correct" answer is the one with the bigger size (primary attribute for G1/G2 multi)
  var answer = (left.size > right.size) ? 'left' : 'right';

  // If ignoreAttribute is set, both sides share that attribute value (distractor flips it)
  if (ignoreAttr === 'color') {
    right.color = left.color;  // same color, size is the real dimension
  }

  var primaryAttrZh = attrs[0] === 'size' ? '大小' : attrs[0];
  return {
    type: 'multi_attribute',
    options: ['left', 'right'],
    answer: answer,
    left: left,
    right: right,
    attributes: attrs,
    ignoreAttribute: ignoreAttr,
    hintZh: '重点比较' + primaryAttrZh + '，忽略其他不相关的变化。',
    hintEn: 'Focus on ' + (attrs[0] || 'size') + ' and ignore other differences.'
  };
};

// ── Dispatch ──────────────────────────────────────────────────────────────────

/**
 * Generate a question from a template definition.
 * Returns the question object with type, options, answer, and render fields.
 */
function generateQuestion(template) {
  var fn = Generators[template.generator];
  if (!fn) {
    console.warn('[generator] unknown generator:', template.generator);
    return null;
  }
  var q = fn(template.params || {});
  if (!q) return null;
  q.templateId = template.id;
  q.level = template.level;
  q.rootGeneIds = template.rootGeneIds || [];
  return q;
}
