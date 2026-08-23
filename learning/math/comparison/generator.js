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
    { heavy: { emoji: '🛒', nameZh: '购物车', nameEn: 'Cart' }, light: { emoji: '🎈', nameZh: '气球', nameEn: 'Balloon' } },
    { heavy: { emoji: '🦛', nameZh: '河马', nameEn: 'Hippo' }, light: { emoji: '🐦', nameZh: '小鸟', nameEn: 'Bird' } },
    { heavy: { emoji: '🚗', nameZh: '汽车', nameEn: 'Car' }, light: { emoji: '🍂', nameZh: '落叶', nameEn: 'Leaf' } },
    { heavy: { emoji: '🏋️', nameZh: '哑铃', nameEn: 'Dumbbell' }, light: { emoji: '🍬', nameZh: '糖果', nameEn: 'Candy' } },
    { heavy: { emoji: '🪵', nameZh: '木头', nameEn: 'Log' }, light: { emoji: '🧸', nameZh: '玩具熊', nameEn: 'Teddy Bear' } }
  ],

  speedPairs: [
    { fast: { emoji: '🐆', nameZh: '猎豹', nameEn: 'Cheetah' }, slow: { emoji: '🐢', nameZh: '乌龟', nameEn: 'Turtle' } },
    { fast: { emoji: '✈️', nameZh: '飞机', nameEn: 'Plane' }, slow: { emoji: '🐌', nameZh: '蜗牛', nameEn: 'Snail' } },
    { fast: { emoji: '🚀', nameZh: '火箭', nameEn: 'Rocket' }, slow: { emoji: '🚶', nameZh: '走路', nameEn: 'Walking' } },
    { fast: { emoji: '🐇', nameZh: '兔子', nameEn: 'Rabbit' }, slow: { emoji: '🐢', nameZh: '乌龟', nameEn: 'Turtle' } },
    { fast: { emoji: '🏎️', nameZh: '赛车', nameEn: 'Race Car' }, slow: { emoji: '🐛', nameZh: '毛毛虫', nameEn: 'Caterpillar' } },
    { fast: { emoji: '🦅', nameZh: '老鹰', nameEn: 'Eagle' }, slow: { emoji: '🐜', nameZh: '蚂蚁', nameEn: 'Ant' } },
    { fast: { emoji: '🐎', nameZh: '马', nameEn: 'Horse' }, slow: { emoji: '🦥', nameZh: '树懒', nameEn: 'Sloth' } },
    { fast: { emoji: '🚄', nameZh: '高铁', nameEn: 'Train' }, slow: { emoji: '🚲', nameZh: '自行车', nameEn: 'Bicycle' } }
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

  // Match: animals → homes by size
  matchSizeGroups: [
    {
      size: 'big',
      animals: [
        { emoji: '🐘', nameZh: '大象', nameEn: 'Elephant' },
        { emoji: '🦁', nameZh: '狮子', nameEn: 'Lion' },
        { emoji: '🦛', nameZh: '河马', nameEn: 'Hippo' }
      ],
      homes: [
        { emoji: '🏠', nameZh: '大房子', nameEn: 'Big House' },
        { emoji: '🏢', nameZh: '大楼', nameEn: 'Tower' },
        { emoji: '🏰', nameZh: '城堡', nameEn: 'Castle' }
      ]
    },
    {
      size: 'medium',
      animals: [
        { emoji: '🐑', nameZh: '绵羊', nameEn: 'Sheep' },
        { emoji: '🐩', nameZh: '小狗', nameEn: 'Dog' },
        { emoji: '🐈', nameZh: '猫咪', nameEn: 'Cat' }
      ],
      homes: [
        { emoji: '🏡', nameZh: '小屋', nameEn: 'Cottage' },
        { emoji: '⛺', nameZh: '帐篷', nameEn: 'Tent' },
        { emoji: '🚐', nameZh: '小车', nameEn: 'Van' }
      ]
    },
    {
      size: 'small',
      animals: [
        { emoji: '🐭', nameZh: '小鼠', nameEn: 'Mouse' },
        { emoji: '🐿', nameZh: '松鼠', nameEn: 'Squirrel' },
        { emoji: '🐝', nameZh: '小蜜蜂', nameEn: 'Bee' }
      ],
      homes: [
        { emoji: '🛖', nameZh: '小棚子', nameEn: 'Hut' },
        { emoji: '🪺', nameZh: '小巢', nameEn: 'Nest' },
        { emoji: '🎪', nameZh: '小帐篷', nameEn: 'Mini Tent' }
      ]
    }
  ],

  // Group: items to sort into big / small bins
  groupSizeItems: {
    big:   [
      { emoji: '🐘', nameZh: '大象', nameEn: 'Elephant' },
      { emoji: '🚗', nameZh: '汽车', nameEn: 'Car' },
      { emoji: '🏠', nameZh: '房子', nameEn: 'House' },
      { emoji: '🌳', nameZh: '大树', nameEn: 'Tree' }
    ],
    small: [
      { emoji: '🐭', nameZh: '小鼠', nameEn: 'Mouse' },
      { emoji: '🍓', nameZh: '草莓', nameEn: 'Strawberry' },
      { emoji: '🔑', nameZh: '钥匙', nameEn: 'Key' },
      { emoji: '🐝', nameZh: '蜜蜂', nameEn: 'Bee' }
    ]
  },

  // Fit: bridge scenes
  fitBridgeScenes: [
    { gapPct: 56, leftEmoji: '🐰', rightEmoji: '🥕', riverColor: '#60a5fa', goalZh: '胡萝卜', goalEn: 'Carrot' },
    { gapPct: 60, leftEmoji: '🐱', rightEmoji: '🐟', riverColor: '#93c5fd', goalZh: '小鱼', goalEn: 'Fish' },
    { gapPct: 52, leftEmoji: '🐶', rightEmoji: '🦴', riverColor: '#bfdbfe', goalZh: '骨头', goalEn: 'Bone' }
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
  // Both sides are the SAME object on purpose: two different species invite the
  // child to compare the wrong attribute. Height alone must be the difference.
  var leftObj = _pick(set);
  var rightObj = leftObj;

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

  // leftDist / rightDist: % of the scene track, measured from the reference
  // (lower = closer). The renderer draws these as two dotted paths from one
  // shared edge, so the two numbers are compared as lengths on screen — keep the
  // ranges far enough apart that the shorter path is obvious at a glance
  // (worst case 35 vs 60, i.e. the near path is 0.58x the far one).
  var leftDist = _ri(10, 35);
  var rightDist = _ri(60, 90);
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
  // Ten durations, not four: with four entries there are only 6 pairs (12 once
  // you count which side the longer one lands on), so a 20-run sample repeated
  // itself and the suite reported LOW VAR. `order` is minutes throughout, which
  // is what makes cross-unit pairs ("30分钟 vs 2小时") comparable at all.
  var pool = params.set === 'durations'
    ? [
        { zh: '1分钟',  en: '1 minute',   order: 1 },
        { zh: '10分钟', en: '10 minutes', order: 10 },
        { zh: '30分钟', en: '30 minutes', order: 30 },
        { zh: '1小时',  en: '1 hour',     order: 60 },
        { zh: '2小时',  en: '2 hours',    order: 120 },
        { zh: '半天',   en: 'half a day', order: 720 },
        { zh: '1天',    en: '1 day',      order: 1440 },
        { zh: '3天',    en: '3 days',     order: 4320 },
        { zh: '1周',    en: '1 week',     order: 10080 },
        { zh: '1个月',  en: '1 month',    order: 43200 }
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
 * multiAttribute: pick the bigger object while irrelevant attributes change.
 *
 * Size is always the compared attribute and it is drawn in the scene on a shared
 * baseline, so the gap has to survive being looked at: the smaller object is at
 * most 0.70x the bigger one (>=3 ranks out of 10). A 2-rank gap on a 9-rank
 * scale is ~10% of the drawn size, which no 6-year-old can call reliably.
 *
 * `attributes` lists what varies; `ignoreAttribute` names the distractor the
 * prompt tells the child to ignore — it VARIES (that is what makes it a
 * distractor), it is not held equal.
 */
Generators.multiAttribute = function (params) {
  var attrs = params.attributes || ['size', 'color'];
  var ignoreAttr = params.ignoreAttribute || null;

  var shapes = _shuffle(GEN_DATA.shapes);
  var colors = _shuffle(GEN_DATA.colors);

  // How many distractors there are follows from what varies, so `distractors`
  // in the template is descriptive only.
  var varyColor = attrs.indexOf('color') !== -1 || ignoreAttr === 'color';
  var varyShape = attrs.indexOf('shape') !== -1 || ignoreAttr === 'shape';

  var bigSize   = _ri(8, 10);
  var smallSize = bigSize - _ri(3, 5);

  var targetColor = colors[0];
  var foilColor   = varyColor ? colors[1] : colors[0];
  var targetShape = shapes[0];
  var foilShape   = varyShape ? shapes[1] : shapes[0];

  var targetOnLeft = Math.random() < 0.5;

  var left  = { size: targetOnLeft ? bigSize : smallSize, color: targetOnLeft ? targetColor : foilColor, shape: targetOnLeft ? targetShape : foilShape };
  var right = { size: targetOnLeft ? smallSize : bigSize, color: targetOnLeft ? foilColor : targetColor, shape: targetOnLeft ? foilShape : targetShape };

  var ignoreZh = varyColor && varyShape ? '颜色和形状' : varyColor ? '颜色' : varyShape ? '形状' : '';
  var ignoreEn = varyColor && varyShape ? 'colour and shape' : varyColor ? 'colour' : varyShape ? 'shape' : '';

  return {
    type: 'multi_attribute',
    options: ['left', 'right'],
    answer: (left.size > right.size) ? 'left' : 'right',
    left: left,
    right: right,
    attributes: attrs,
    ignoreAttribute: ignoreAttr,
    sizeGap: bigSize - smallSize,
    ignoreZh: ignoreZh,
    ignoreEn: ignoreEn,
    hintZh: '只比大小' + (ignoreZh ? '，' + ignoreZh + '不一样也没关系。' : '。'),
    hintEn: 'Compare size only' + (ignoreEn ? ' — the ' + ignoreEn + ' does not matter.' : '.')
  };
};

/**
 * sortLength4: 4 bars with clearly distinct lengths for the sort activity.
 * Returns items in random display order; targetOrder gives the correct
 * ascending sequence.
 */
Generators.sortLength4 = function (params) {
  var n = params.items || 4;
  var minGapPct = params.minGapPct || 18;
  var minStart = 14, maxEnd = 88;

  // Generate n lengths with guaranteed minimum gap between each adjacent pair
  var sorted = [minStart + Math.random() * 8];
  for (var i = 1; i < n; i++) {
    var prev = sorted[i - 1];
    var room = maxEnd - prev - minGapPct * (n - i);
    sorted.push(prev + minGapPct + Math.random() * Math.max(0, room / (n - i)));
  }
  sorted = sorted.map(function (v) { return Math.round(v); });

  // Assign distinct colors, shuffle them
  var palette = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899'];
  var colors = _shuffle(palette.slice(0, n));

  // Items are labeled A–D; sorted ascending by length → A=shortest, D=longest
  var items = sorted.map(function (len, idx) {
    return { id: String.fromCharCode(65 + idx), lengthPct: len, color: colors[idx] };
  });
  var targetOrder = items.map(function (item) { return item.id; });

  // Shuffle display order
  var displayItems = _shuffle(items);

  return {
    type: 'sort',
    subtype: 'length',
    theme: params.theme || 'ribbon',
    items: displayItems,
    targetOrder: targetOrder,
    options: [],              // not used for sort (no click options)
    answer: targetOrder.join(','),
    hintZh: '把彩带从最短到最长，依次放入 1 到 ' + n + ' 号槽位。',
    hintEn: 'Place the ribbons from shortest to longest into slots 1 to ' + n + '.'
  };
};

/**
 * matchSize3: 3 animal–home pairs to drag-match by size (big/medium/small).
 */
Generators.matchSize3 = function (params) {
  var groups = GEN_DATA.matchSizeGroups;
  // Pick one animal and one home from each size tier
  var tiers = groups.map(function (g) {
    return {
      size:   g.size,
      animal: _pick(g.animals),
      home:   _pick(g.homes)
    };
  });

  // Left items = animals (shuffled)
  var leftItems = _shuffle(tiers.map(function (t, i) {
    return { id: 'L' + i, emoji: t.animal.emoji, nameZh: t.animal.nameZh, nameEn: t.animal.nameEn, size: t.size };
  }));

  // Right slots = homes (shuffled)
  var rightSlots = _shuffle(tiers.map(function (t, i) {
    return { id: 'R' + i, emoji: t.home.emoji, nameZh: t.home.nameZh, nameEn: t.home.nameEn, size: t.size };
  }));

  // Correct map: leftId → rightId (same size)
  var correctMap = {};
  leftItems.forEach(function (left) {
    var right = rightSlots.filter(function (r) { return r.size === left.size; })[0];
    if (right) correctMap[left.id] = right.id;
  });

  return {
    type: 'match', subtype: 'size',
    leftItems: leftItems, rightSlots: rightSlots,
    correctMap: correctMap,
    options: [], answer: 'all-matched',
    hintZh: '把每只小动物拖到合适大小的家里。',
    hintEn: 'Drag each animal to the home that fits its size.'
  };
};

/**
 * groupSize: 6 items (3 big + 3 small) to classify into two bins.
 */
Generators.groupSize = function (params) {
  var n = params.itemsPerBin || 3;
  var bigPool   = _shuffle(GEN_DATA.groupSizeItems.big.slice());
  var smallPool = _shuffle(GEN_DATA.groupSizeItems.small.slice());

  var bigItems   = bigPool.slice(0, n).map(function (o, i) {
    return { id: 'G' + i,       emoji: o.emoji, nameZh: o.nameZh, nameEn: o.nameEn, bin: 'big' };
  });
  var smallItems = smallPool.slice(0, n).map(function (o, i) {
    return { id: 'G' + (n + i), emoji: o.emoji, nameZh: o.nameZh, nameEn: o.nameEn, bin: 'small' };
  });

  var allItems = _shuffle(bigItems.concat(smallItems));

  return {
    type: 'group', subtype: 'size',
    items: allItems,
    bins: [
      { id: 'big',   labelZh: '大',  labelEn: 'Big',   emoji: '🐘' },
      { id: 'small', labelZh: '小',  labelEn: 'Small', emoji: '🐭' }
    ],
    options: [], answer: 'all-grouped',
    hintZh: '把大的放进大筐，把小的放进小筐。',
    hintEn: 'Put big things in the big basket and small things in the small basket.'
  };
};

/**
 * fitBridge: pick the board that is long enough to bridge a river gap.
 */
Generators.fitBridge = function (params) {
  var scene   = _pick(GEN_DATA.fitBridgeScenes);
  var gap     = scene.gapPct;
  var margin  = params.margin || 10;  // how much longer the "too long" board is

  // Three boards: clearly too short, just fits, clearly too long.
  // Every length is a percentage of the ONE ruler the gap is also drawn on
  // (FitRuntime._layout), so these numbers are what the child sees:
  //   - the fitting board must overhang by at least 4% of the ruler, or "just
  //     long enough" is a difference too small to see,
  //   - the long board is defined relative to fitLen, never to the gap, so the
  //     order short < gap < fit < long can never collapse for a small margin.
  var shortLen  = gap - 12 - Math.round(Math.random() * 8);      // clearly too short
  var fitLen    = gap + 4 + Math.round(Math.random() * 4);       // just long enough
  var longLen   = fitLen + margin + Math.round(Math.random() * 6); // clearly longer than needed

  var palette   = ['#ef4444', '#22c55e', '#3b82f6'];
  var colors    = _shuffle(palette);

  var boards = _shuffle([
    { id: 'B1', lengthPct: Math.max(10, shortLen), color: colors[0] },
    { id: 'B2', lengthPct: fitLen,                 color: colors[1] },
    { id: 'B3', lengthPct: Math.min(98, longLen),  color: colors[2] }
  ]);

  var correctId = boards.filter(function (b) {
    return b.lengthPct === fitLen;
  })[0].id;

  return {
    type: 'fit', subtype: 'length',
    scene: {
      gapPct: gap, riverColor: scene.riverColor,
      leftEmoji: scene.leftEmoji, rightEmoji: scene.rightEmoji,
      goalZh: scene.goalZh, goalEn: scene.goalEn
    },
    boards: boards, correctBoardId: correctId,
    options: [], answer: correctId,
    hintZh: '找一块能搭上对岸的木板，帮' + scene.leftEmoji + '过河吧！',
    hintEn: 'Find a plank long enough to reach the other side!'
  };
};

// ── Mini-game round pools ─────────────────────────────────────────────────────

// A mini-game template is generated ONCE, like every other template, but what
// it produces is a whole short game: the config plus the full list of rounds the
// child will play. Pre-generating the rounds (instead of letting the Adapter
// call generators mid-play) keeps two properties that matter:
//   1. the Adapter stays pure presentation — it walks a list,
//   2. every round a child can be served is reachable from test.html without
//      a browser, so round quality is validated headlessly like puzzles are.
var MINI_DIMENSIONS = {
  size:     { generator: 'sizeCompare',    type: 'size',     positive: 'bigger' },
  quantity: { generator: 'quantityVisual', type: 'quantity', positive: 'more'   },
  number:   { generator: 'numberCompare',  type: 'number',   positive: 'bigger' },
  length:   { generator: 'lengthCompare',  type: 'length',   positive: 'longer' }
};

// Swap the two sides of a round. Used to force a balanced answer distribution:
// a child who notices the answer is usually on the right stops comparing and
// starts pattern-matching, which is exactly the thinking we are not training.
function _mirrorRound(round) {
  var out = {};
  for (var k in round) {
    if (!Object.prototype.hasOwnProperty.call(round, k)) continue;
    if (k.indexOf('left') === 0)       { out['right' + k.slice(4)] = round[k]; continue; }
    else if (k.indexOf('right') === 0) { out['left'  + k.slice(5)] = round[k]; continue; }
    out[k] = round[k];
  }
  out.answer = round.answer === 'left' ? 'right' : 'left';
  return out;
}

function _miniClamp(n, lo, hi, dflt) {
  n = typeof n === 'number' && isFinite(n) ? n : dflt;
  return Math.min(hi, Math.max(lo, n));
}

/**
 * miniRound: build one Quick-Compare-style mini-game.
 * params: dimension, durationSec, roundTarget, passThreshold, timerStyle,
 *         askMode ('bigger'|'smaller'|…|'random'), roundParams (passed through
 *         to the underlying single-question generator).
 */
Generators.miniRound = function (params) {
  var dimKey = params.dimension || 'size';
  var dim = MINI_DIMENSIONS[dimKey];
  if (!dim) {
    console.warn('[generator] miniRound: unknown dimension:', dimKey);
    return null;
  }
  var makeRound = Generators[dim.generator];
  if (!makeRound) return null;

  var roundTarget = Math.round(_miniClamp(params.roundTarget, 3, 40, 12));
  var askMode = params.askMode || dim.positive;

  // Half the rounds answer left, half right, then shuffled.
  var sides = [];
  for (var i = 0; i < roundTarget; i++) sides.push(i % 2 === 0 ? 'left' : 'right');
  sides = _shuffle(sides);

  var roundParams = {};
  for (var k in (params.roundParams || {})) {
    if (Object.prototype.hasOwnProperty.call(params.roundParams, k)) roundParams[k] = params.roundParams[k];
  }
  roundParams.askMode = askMode;

  var rounds = [];
  for (var r = 0; r < roundTarget; r++) {
    var q = makeRound(roundParams);
    if (!q) return null;
    if (q.answer !== sides[r]) q = _mirrorRound(q);
    // One flag the Adapter can read for every dimension, instead of four
    // differently-named ones (askBigger / askMore / askLonger / askTaller).
    q.askPositive = !!(q.askBigger || q.askMore || q.askLonger || q.askTaller);
    q.roundIndex = r;
    rounds.push(q);
  }

  return {
    type: dim.type,
    engine: 'quick_compare',
    mode: 'mini',
    dimension: dimKey,
    durationSec:   Math.round(_miniClamp(params.durationSec, 10, 120, 30)),
    roundTarget:   roundTarget,
    passThreshold: _miniClamp(params.passThreshold, 0.3, 1, 0.7),
    timerStyle:    params.timerStyle === 'countdown' ? 'countdown' : 'collect',
    rounds: rounds,
    // Kept so the shared Attempt/answer plumbing has the fields it expects even
    // though a mini-game has no single answer of its own.
    options: [], answer: '',
    titleZh: '快速比较', titleEn: 'Quick Compare',
    hintZh: '看清楚问的是"更大"还是"更小"，再点。',
    hintEn: 'Check whether it asks for more or fewer, then tap.'
  };
};

/**
 * miniBuild: build one Build-Under-Time mini-game.
 *
 * A tower is built by repeatedly taking the biggest block still in the pile
 * (or the smallest, when askMode is negative), so every single move is a
 * comparison across a shrinking set — a different skill from Quick Compare's
 * pairwise choice, and the reason this game exists.
 *
 * The whole run is pre-generated: each round carries the pile it faces and the
 * id of the block that belongs next, so `test.html` can re-derive every answer
 * from the widths offline. A tower of N blocks yields N-1 scored rounds — the
 * last block is never a comparison (nothing left to compare it with), so the
 * adapter drops it in as a reward instead of scoring it.
 *
 * params: dimension ('size'|'length'), durationSec, roundTarget, passThreshold,
 *         timerStyle, askMode, blocksPerTower, minGapPct
 */
Generators.miniBuild = function (params) {
  var dimKey = params.dimension === 'length' ? 'length' : 'size';
  var perTower = Math.round(_miniClamp(params.blocksPerTower, 3, 6, 4));
  var minGapPct = _miniClamp(params.minGapPct, 8, 30, 16);
  var roundTarget = Math.round(_miniClamp(params.roundTarget, 3, 40, 12));
  var askPositive = _askMode(params.askMode || 'bigger');
  var palette = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899'];

  // Blocks live between these two widths (percent of the tower area). The gap
  // asked for has to fit perTower-1 times inside that span, so a tall tower
  // narrows the gap rather than pushing the widest block off the screen —
  // requesting minGapPct:30 with 6 blocks is arithmetically impossible.
  var MIN_W = 24, MAX_W = 96;
  var span = MAX_W - MIN_W;
  var gap = Math.min(Math.round(minGapPct), Math.floor(span / (perTower - 1)));

  var scoredPerTower = perTower - 1;
  var towerCount = Math.ceil(roundTarget / scoredPerTower);
  var rounds = [];

  for (var t = 0; t < towerCount && rounds.length < roundTarget; t++) {
    // The slack left over after every mandatory gap is scattered randomly over
    // the start offset and the gaps, so two towers never look alike while the
    // widest block still lands inside MAX_W: "which is the biggest" is never a
    // judgement call at a glance, and never clipped either. Every share is
    // floored, so widths stay whole percents and the gap can only grow.
    var slack = span - gap * (perTower - 1);
    var share = [], total = 0;
    for (var i = 0; i < perTower; i++) { var r = Math.random(); share.push(r); total += r; }

    var w = MIN_W + Math.floor(slack * share[0] / total);
    var widths = [w];
    for (i = 1; i < perTower; i++) {
      w += gap + Math.floor(slack * share[i] / total);
      widths.push(w);
    }
    var colors = _shuffle(palette).slice(0, perTower);
    var blocks = widths.map(function (wd, idx) {
      return { id: 'T' + t + 'B' + idx, widthPct: wd, color: colors[idx] };
    });

    // Pile order is shuffled; the correct pick order is by width.
    var pile = _shuffle(blocks);
    for (var step = 0; step < scoredPerTower && rounds.length < roundTarget; step++) {
      var best = pile[0];
      for (var p = 1; p < pile.length; p++) {
        if (askPositive ? pile[p].widthPct > best.widthPct : pile[p].widthPct < best.widthPct) best = pile[p];
      }
      rounds.push({
        type: dimKey,
        towerIndex: t,
        step: step,
        blocksPerTower: perTower,
        pile: pile.map(function (b) { return { id: b.id, widthPct: b.widthPct, color: b.color }; }),
        placed: blocks.filter(function (b) {
          return pile.indexOf(b) === -1;
        }).map(function (b) { return b.id; }),
        answer: best.id,
        askPositive: askPositive,
        roundIndex: rounds.length
      });
      pile = pile.filter(function (b) { return b !== best; });
    }
  }

  return {
    type: dimKey,
    engine: 'build_time',
    mode: 'mini',
    dimension: dimKey,
    durationSec:   Math.round(_miniClamp(params.durationSec, 10, 120, 45)),
    roundTarget:   rounds.length,
    passThreshold: _miniClamp(params.passThreshold, 0.3, 1, 0.7),
    timerStyle:    params.timerStyle === 'countdown' ? 'countdown' : 'collect',
    blocksPerTower: perTower,
    minGapPct: gap,               // the gap actually used, after fitting perTower blocks
    askPositive: askPositive,
    rounds: rounds,
    options: [], answer: '',
    titleZh: '限时搭塔', titleEn: 'Build Under Time',
    hintZh: askPositive ? '每次先拿剩下最大的那块，塔才稳。' : '每次先拿剩下最小的那块。',
    hintEn: askPositive ? 'Always take the biggest block left — that keeps the tower steady.'
                        : 'Always take the smallest block left.'
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
