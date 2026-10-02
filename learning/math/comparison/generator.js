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

  // Real-world size rank (1–10), used only by Z3 (size_real, the interference
  // exception in §1.1). Z1/Z2 pick icons from these same pools but ignore
  // `.size` entirely — they invent their own on-screen size independent of the
  // real object, which is exactly what makes them identity-neutral.
  animals: [
    { emoji: '🐘', nameZh: '大象', nameEn: 'Elephant', size: 10 },
    { emoji: '🦒', nameZh: '长颈鹿', nameEn: 'Giraffe', size: 9 },
    { emoji: '🦛', nameZh: '河马', nameEn: 'Hippo', size: 8 },
    { emoji: '🐄', nameZh: '奶牛', nameEn: 'Cow', size: 7 },
    { emoji: '🐻', nameZh: '熊', nameEn: 'Bear', size: 6 },
    { emoji: '🐑', nameZh: '绵羊', nameEn: 'Sheep', size: 5 },
    { emoji: '🐕', nameZh: '狗', nameEn: 'Dog', size: 4 },
    { emoji: '🐇', nameZh: '兔子', nameEn: 'Rabbit', size: 3 },
    { emoji: '🦆', nameZh: '鸭子', nameEn: 'Duck', size: 2 },
    { emoji: '🐿', nameZh: '松鼠', nameEn: 'Squirrel', size: 2 },
    { emoji: '🐹', nameZh: '小仓鼠', nameEn: 'Hamster', size: 1 },
    { emoji: '🐭', nameZh: '小老鼠', nameEn: 'Mouse', size: 1 }
  ],

  objects: [
    { emoji: '🚚', nameZh: '卡车', nameEn: 'Truck', size: 9 },
    { emoji: '🚗', nameZh: '汽车', nameEn: 'Car', size: 8 },
    { emoji: '🛋', nameZh: '沙发', nameEn: 'Sofa', size: 7 },
    { emoji: '🎸', nameZh: '吉他', nameEn: 'Guitar', size: 6 },
    { emoji: '🚲', nameZh: '自行车', nameEn: 'Bicycle', size: 5 },
    { emoji: '🎒', nameZh: '书包', nameEn: 'Backpack', size: 4 },
    { emoji: '☂️', nameZh: '雨伞', nameEn: 'Umbrella', size: 4 },
    { emoji: '⚽', nameZh: '足球', nameEn: 'Ball', size: 3 },
    { emoji: '👟', nameZh: '鞋子', nameEn: 'Shoe', size: 3 },
    { emoji: '🍎', nameZh: '苹果', nameEn: 'Apple', size: 2 },
    { emoji: '🔑', nameZh: '钥匙', nameEn: 'Key', size: 1 },
    { emoji: '🍓', nameZh: '草莓', nameEn: 'Strawberry', size: 1 }
  ],

  // W1–W4: one mystery-object icon per question, identical on both trays —
  // only the slot letter tells the boxes apart (§1.2).
  mysteryBoxes: [
    { emoji: '📦', nameZh: '箱子', nameEn: 'Box' },
    { emoji: '🎁', nameZh: '礼物', nameEn: 'Gift' },
    { emoji: '🧺', nameZh: '篮子', nameEn: 'Basket' },
    { emoji: '🪣', nameZh: '桶', nameEn: 'Bucket' },
    { emoji: '🥫', nameZh: '罐头', nameEn: 'Can' },
    { emoji: '🫙', nameZh: '罐子', nameEn: 'Jar' },
    { emoji: '🧳', nameZh: '手提箱', nameEn: 'Suitcase' },
    { emoji: '🗃️', nameZh: '文件盒', nameEn: 'File Box' }
  ],

  // S1–S3: one racer icon per question, identical in every lane.
  racers: [
    { emoji: '🐢', nameZh: '乌龟', nameEn: 'Turtle' },
    { emoji: '🐇', nameZh: '兔子', nameEn: 'Rabbit' },
    { emoji: '🐌', nameZh: '蜗牛', nameEn: 'Snail' },
    { emoji: '🦔', nameZh: '刺猬', nameEn: 'Hedgehog' },
    { emoji: '🐿️', nameZh: '松鼠', nameEn: 'Squirrel' },
    { emoji: '🐤', nameZh: '小鸡', nameEn: 'Chick' },
    { emoji: '🐶', nameZh: '小狗', nameEn: 'Dog' },
    { emoji: '🐱', nameZh: '小猫', nameEn: 'Cat' }
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

/**
 * Shared by the `difference` structure's judge generators (quantityDiff,
 * areaDiff, raceDiff, weightDiff): given the true gap d (>=1), builds three
 * distinct non-negative numeric options — d itself, an off-by-one miscount,
 * and a third value spaced further out — plus the matching optionTypes.
 */
function _diffOptionSet(d) {
  var near = d > 1 ? d - 1 : d + 1;
  var far = d + 2;
  var options = _shuffle([d, near, far].map(String));
  var optionTypes = {};
  options.forEach(function (v) {
    var n = Number(v);
    optionTypes[v] = n === d ? 'none' : 'perception';
  });
  return { options: options, answer: String(d), optionTypes: optionTypes };
}

// ── Generator functions ───────────────────────────────────────────────────────

var Generators = {};

/**
 * sizeCompare (Z1): the SAME icon drawn twice at different sizes. The only
 * variable is size — no second species, no real-world knowledge involved
 * (§1.1/§1.2). `leftSizeRank`/`rightSizeRank` are absolute px (36–88), kept
 * under that name because minigame-quick-compare.js reads it directly and
 * only cares about the ratio between the two, never its scale (see its own
 * comment on `_sideHtml`).
 */
Generators.sizeCompare = function (params) {
  var set = GEN_DATA[params.set] || GEN_DATA.animals;
  var item = _pick(set);

  var bigPx = _ri(62, 88);
  var ratio = 0.45 + Math.random() * 0.20;   // 0.45–0.65, safely under the 0.70 cap
  var smallPx = Math.max(36, Math.round(bigPx * ratio));

  var askBigger = _askMode(params.askMode);
  var bigOnLeft = Math.random() < 0.5;
  var leftPx = bigOnLeft ? bigPx : smallPx;
  var rightPx = bigOnLeft ? smallPx : bigPx;
  var biggerSide = bigOnLeft ? 'left' : 'right';
  var answer = askBigger ? biggerSide : (biggerSide === 'left' ? 'right' : 'left');
  var otherSide = answer === 'left' ? 'right' : 'left';

  var optionTypes = {};
  optionTypes[answer] = 'none';
  optionTypes[otherSide] = 'polarity_confusion';

  return {
    type: 'size',
    options: ['left', 'right'],
    answer: answer,
    optionTypes: optionTypes,
    askBigger: askBigger,
    leftEmoji: item.emoji,
    rightEmoji: item.emoji,
    leftSizeRank: leftPx,
    rightSizeRank: rightPx,
    leftNameZh: item.nameZh,
    rightNameZh: item.nameZh,
    leftNameEn: item.nameEn,
    rightNameEn: item.nameEn,
    hintZh: '仔细看哪个更' + (askBigger ? '大' : '小') + '。',
    hintEn: 'Look carefully at which is ' + (askBigger ? 'bigger' : 'smaller') + '.'
  };
};

/**
 * sizePick3 (Z2): the same icon drawn three times at fixed ratios
 * 1 : 0.78 : 0.6 (adjacent ratio ≤ 0.8), slots A/B/C shuffled so the biggest
 * is not pinned to any position. Select task — no "same" option (§1.3).
 */
Generators.sizePick3 = function (params) {
  var set = GEN_DATA[params.set] || GEN_DATA.animals;
  var item = _pick(set);

  var basePx = _ri(76, 88);
  var sizes = [basePx, Math.round(basePx * 0.78), Math.round(basePx * 0.6)];

  var slots = _shuffle(['A', 'B', 'C']);
  var sizeBySlot = {};
  sizeBySlot[slots[0]] = sizes[0];
  sizeBySlot[slots[1]] = sizes[1];
  sizeBySlot[slots[2]] = sizes[2];

  var askBigger = _askMode(params.askMode);
  var answer = askBigger ? slots[0] : slots[2];
  var middleSlot = slots[1];
  var otherExtreme = askBigger ? slots[2] : slots[0];

  var optionTypes = {};
  optionTypes[answer] = 'none';
  optionTypes[otherExtreme] = 'polarity_confusion';
  optionTypes[middleSlot] = 'middle_item';

  return {
    type: 'size_pick',
    options: ['A', 'B', 'C'],
    answer: answer,
    optionTypes: optionTypes,
    askBigger: askBigger,
    emoji: item.emoji,
    nameZh: item.nameZh,
    nameEn: item.nameEn,
    sizeBySlot: sizeBySlot,
    hintZh: '比一比三个' + item.nameZh + '，找出' + (askBigger ? '最大' : '最小') + '的。',
    hintEn: 'Compare all three and find the ' + (askBigger ? 'biggest' : 'smallest') + ' one.'
  };
};

/**
 * sizeReal (Z3): the §1.1 exception. Two DIFFERENT real objects (rank gap
 * ≥ 4 out of 10) drawn at a visual ratio ≥ 1.8, 60% of the time with the
 * on-screen size contradicting the real-world size. Two question framings —
 * "which is really bigger" (70%) vs "which is drawn bigger" (30%) — share the
 * same scene.
 */
Generators.sizeReal = function (params) {
  var pool = GEN_DATA.animals.concat(GEN_DATA.objects);
  var a, b, attempts = 0;
  do {
    var pair = _pick2(pool);
    a = pair[0]; b = pair[1];
    attempts++;
  } while (Math.abs(a.size - b.size) < 4 && attempts < 50);

  var aOnLeft = Math.random() < 0.5;
  var leftItem = aOnLeft ? a : b;
  var rightItem = aOnLeft ? b : a;
  var realBiggerSide = leftItem.size > rightItem.size ? 'left' : 'right';
  var realSmallerSide = realBiggerSide === 'left' ? 'right' : 'left';

  // Conflict (60%): the really-bigger one is drawn smaller. Consistent (40%):
  // drawn size matches real size — without these, the child would learn to
  // always pick "drawn smaller" and never have to check.
  var conflict = Math.random() < 0.6;
  var drawnBiggerSide = conflict ? realSmallerSide : realBiggerSide;
  var drawnSmallerSide = conflict ? realBiggerSide : realSmallerSide;

  var smallPx = _ri(36, 48);
  var drawRatio = 1.85 + Math.random() * 0.35;   // ceil below keeps the realised ratio >= 1.8 even after rounding
  var bigPx = Math.ceil(smallPx * drawRatio);
  var leftPx = drawnBiggerSide === 'left' ? bigPx : smallPx;
  var rightPx = drawnBiggerSide === 'right' ? bigPx : smallPx;

  var askReal = Math.random() < 0.7;
  var askBigger = _askMode(params.askMode);
  var targetSide = askReal
    ? (askBigger ? realBiggerSide : realSmallerSide)
    : (askBigger ? drawnBiggerSide : drawnSmallerSide);
  var otherSide = targetSide === 'left' ? 'right' : 'left';

  var optionTypes = {};
  optionTypes[targetSide] = 'none';
  optionTypes[otherSide] = conflict ? 'perception' : 'polarity_confusion';

  return {
    type: 'size_real',
    options: ['left', 'right'],
    answer: targetSide,
    optionTypes: optionTypes,
    askReal: askReal,
    askBigger: askBigger,
    conflict: conflict,
    leftEmoji: leftItem.emoji,
    rightEmoji: rightItem.emoji,
    leftNameZh: leftItem.nameZh,
    rightNameZh: rightItem.nameZh,
    leftNameEn: leftItem.nameEn,
    rightNameEn: rightItem.nameEn,
    leftSizeRank: leftPx,
    rightSizeRank: rightPx,
    hintZh: askReal ? '想一想哪个真的更' + (askBigger ? '大' : '小') + '，别被画面骗了。' : '看图上画得更' + (askBigger ? '大' : '小') + '的是哪个。',
    hintEn: askReal ? 'Think about which is really ' + (askBigger ? 'bigger' : 'smaller') + ' — do not be fooled by the picture.' : 'Look at which is drawn ' + (askBigger ? 'bigger' : 'smaller') + '.'
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
 * balanceJudge (W1): one balance, same mystery-object icon on both trays.
 * rel ∈ {left,right,same} — same 25%, left/right 37.5% each. Tilt is fixed at
 * ±14° (0° when equal) so the angle itself never becomes a magnitude cue.
 * `tiltDeg` is a CSS rotate() degree: positive tips the RIGHT tray down
 * (clockwise), negative tips the LEFT tray down.
 */
Generators.balanceJudge = function (params) {
  var item = _pick(GEN_DATA.mysteryBoxes);
  var r = Math.random();
  var rel = r < 0.25 ? 'same' : (r < 0.625 ? 'left' : 'right');
  var askHeavier = _askMode(params.askMode);

  var answer, tiltDeg;
  if (rel === 'same') {
    answer = 'same';
    tiltDeg = 0;
  } else {
    var lightSide = rel === 'left' ? 'right' : 'left';
    answer = askHeavier ? rel : lightSide;
    tiltDeg = rel === 'left' ? -14 : 14;
  }

  var optionTypes = {};
  if (rel === 'same') {
    optionTypes.same = 'none';
    optionTypes.left = 'missed_equal';
    optionTypes.right = 'missed_equal';
  } else {
    optionTypes[answer] = 'none';
    optionTypes[answer === 'left' ? 'right' : 'left'] = 'polarity_confusion';
    optionTypes.same = 'false_equal';
  }

  return {
    type: 'balance_judge',
    options: ['left', 'right', 'same'],
    answer: answer,
    optionTypes: optionTypes,
    askHeavier: askHeavier,
    rel: rel,
    tiltDeg: tiltDeg,
    emoji: item.emoji,
    hintZh: '看天平倾向哪边，判断哪个' + (askHeavier ? '更重' : '更轻') + '。',
    hintEn: 'Look at which side the scale tips to, then find which is ' + (askHeavier ? 'heavier' : 'lighter') + '.'
  };
};

/**
 * balanceSelect3 (W2): three balances (A–B, A–C, B–C) giving every pairwise
 * result directly — no transitive reasoning required, unlike W3. Each box
 * appears on exactly two balances by construction, so appearance count can
 * never leak the answer.
 */
Generators.balanceSelect3 = function (params) {
  var weights = _shuffle([1, 2, 3]);
  var letters = ['A', 'B', 'C'];
  var wOf = {};
  letters.forEach(function (l, i) { wOf[l] = weights[i]; });

  var pairsOrder = _shuffle([['A', 'B'], ['A', 'C'], ['B', 'C']]);
  var balances = pairsOrder.map(function (pair) {
    var swap = Math.random() < 0.5;
    var left = swap ? pair[1] : pair[0], right = swap ? pair[0] : pair[1];
    return { left: left, right: right, tiltDeg: wOf[left] > wOf[right] ? -14 : 14 };
  });

  var askHeaviest = params.askMode === 'lightest' ? false : (params.askMode === 'heaviest' ? true : Math.random() < 0.5);
  var order = letters.slice().sort(function (x, y) { return wOf[y] - wOf[x]; });
  var answer = askHeaviest ? order[0] : order[2];
  var middle = order[1];
  var otherExtreme = askHeaviest ? order[2] : order[0];

  var optionTypes = {};
  optionTypes[answer] = 'none';
  optionTypes[otherExtreme] = 'polarity_confusion';
  optionTypes[middle] = 'middle_item';

  return {
    type: 'balance_select',
    options: ['A', 'B', 'C'],
    answer: answer,
    optionTypes: optionTypes,
    askHeaviest: askHeaviest,
    balances: balances,
    emoji: _pick(GEN_DATA.mysteryBoxes).emoji,
    hintZh: '看三架天平的结果，找出' + (askHeaviest ? '最重' : '最轻') + '的盒子。',
    hintEn: 'Use all three scales to find the ' + (askHeaviest ? 'heaviest' : 'lightest') + ' box.'
  };
};

/**
 * balanceChain (W3): only two balances, X–M and M–Y, so the heaviest and
 * lightest never share a balance — the answer can only come from the chain.
 * M is forced to the MEDIAN weight of the three, which guarantees the chain
 * condition (heavy on one balance, light on the other) on every draw, no
 * rejection sampling needed.
 */
Generators.balanceChain = function (params) {
  var letters = _shuffle(['A', 'B', 'C']);
  var M = letters[0], X = letters[1], Y = letters[2];

  var xHeavier = Math.random() < 0.5;
  var wOf = {};
  wOf[M] = 2;
  wOf[X] = xHeavier ? 3 : 1;
  wOf[Y] = xHeavier ? 1 : 3;

  function makeBalance(a, b) {
    var swap = Math.random() < 0.5;
    var left = swap ? b : a, right = swap ? a : b;
    return { left: left, right: right, tiltDeg: wOf[left] > wOf[right] ? -14 : 14 };
  }
  var balances = Math.random() < 0.5
    ? [makeBalance(X, M), makeBalance(M, Y)]
    : [makeBalance(M, Y), makeBalance(X, M)];

  var heaviest = wOf[X] === 3 ? X : Y;
  var lightest = wOf[X] === 1 ? X : Y;
  var askHeaviest = Math.random() < 0.5;
  var answer = askHeaviest ? heaviest : lightest;
  var otherExtreme = askHeaviest ? lightest : heaviest;

  var optionTypes = {};
  optionTypes[answer] = 'none';
  optionTypes[otherExtreme] = 'polarity_confusion';
  optionTypes[M] = 'middle_item';

  return {
    type: 'balance_chain',
    options: ['A', 'B', 'C'],
    answer: answer,
    optionTypes: optionTypes,
    askHeaviest: askHeaviest,
    balances: balances,
    emoji: _pick(GEN_DATA.mysteryBoxes).emoji,
    hintZh: '两架天平里都出现的那个是关键，顺着它推出' + (askHeaviest ? '最重' : '最轻') + '的是谁。',
    hintEn: 'The box on both scales is the key — use it to find the ' + (askHeaviest ? 'heaviest' : 'lightest') + ' one.'
  };
};

/**
 * balanceSwap (W4): a top balance establishes "k balls = 1 block" with SVG
 * shapes (no real objects, so common sense cannot help), then the child must
 * convert m blocks / n balls before comparing — no beam is drawn on the
 * bottom pair on purpose (§ W4 画面 note).
 */
Generators.balanceSwap = function (params) {
  var k = Math.random() < 0.5 ? 2 : 3;
  var m = Math.random() < 0.5 ? 1 : 2;
  var blockValue = m * k;
  var equal = Math.random() < 0.25;
  var n, conflict = false;

  if (equal) {
    n = blockValue;
  } else {
    var wantConflict = Math.random() < 0.5;
    if (wantConflict && m + 1 <= blockValue - 1) {
      n = _ri(m + 1, blockValue - 1);
      conflict = true;
    } else {
      do { n = _ri(1, 7); } while (n === m || n === blockValue);
      conflict = n > m && n < blockValue;
    }
  }

  var blockSide = Math.random() < 0.5 ? 'left' : 'right';
  var ballSide = blockSide === 'left' ? 'right' : 'left';
  var answer = blockValue === n ? 'same' : (blockValue > n ? blockSide : ballSide);

  var optionTypes = {};
  if (answer === 'same') {
    optionTypes.same = 'none';
    optionTypes.left = 'missed_equal';
    optionTypes.right = 'missed_equal';
  } else {
    optionTypes[answer] = 'none';
    optionTypes[answer === 'left' ? 'right' : 'left'] = 'perception';
    optionTypes.same = 'false_equal';
  }

  return {
    type: 'balance_swap',
    options: ['left', 'right', 'same'],
    answer: answer,
    optionTypes: optionTypes,
    k: k, m: m, n: n, blockValue: blockValue,
    blockSide: blockSide,
    conflict: conflict,
    hintZh: '记住 ' + k + ' 个小球等于 1 个方块，再比一比两边。',
    hintEn: k + ' balls equal 1 block — work out both sides before you compare.'
  };
};

// ── Speed (S1–S3): 2–3 lanes, one racer icon per question ──────────────────

function _minGapOk(arr, minGapPct) {
  var sorted = arr.slice().sort(function (a, b) { return a - b; });
  for (var i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] < minGapPct) return false;
  }
  return true;
}

/**
 * raceJudge (S1): two lanes, identical stopwatch seconds — the racer that
 * went farther in the same time is faster.
 */
Generators.raceJudge = function (params) {
  var item = _pick(GEN_DATA.racers);
  var seconds = _ri(3, 9);
  var same = Math.random() < 0.20;

  var leftPos, rightPos;
  if (same) {
    leftPos = rightPos = _ri(30, 70);
  } else {
    do {
      leftPos = _ri(15, 90);
      rightPos = _ri(15, 90);
    } while (Math.abs(leftPos - rightPos) < 25);
  }

  var askFaster = _askMode(params.askMode);
  var answer;
  if (same) {
    answer = 'same';
  } else {
    var fartherSide = leftPos > rightPos ? 'left' : 'right';
    answer = askFaster ? fartherSide : (fartherSide === 'left' ? 'right' : 'left');
  }

  var optionTypes = {};
  if (same) {
    optionTypes.same = 'none';
    optionTypes.left = 'missed_equal';
    optionTypes.right = 'missed_equal';
  } else {
    optionTypes[answer] = 'none';
    optionTypes[answer === 'left' ? 'right' : 'left'] = 'polarity_confusion';
    optionTypes.same = 'false_equal';
  }

  return {
    type: 'race_judge',
    options: ['left', 'right', 'same'],
    answer: answer,
    optionTypes: optionTypes,
    askFaster: askFaster,
    emoji: item.emoji,
    leftSeconds: seconds, rightSeconds: seconds,
    leftPct: leftPos, rightPct: rightPos,
    hintZh: '两个都跑了 ' + seconds + ' 秒，看谁跑得更远，那个就' + (askFaster ? '更快' : '更慢') + '。',
    hintEn: 'Both ran for ' + seconds + ' seconds — the one that went farther is ' + (askFaster ? 'faster' : 'slower') + '.'
  };
};

/**
 * raceSelect3 (S2): three lanes, identical stopwatch seconds, adjacent
 * position gap ≥ 18% so "farthest / nearest" is never a close call.
 */
Generators.raceSelect3 = function (params) {
  var item = _pick(GEN_DATA.racers);
  var seconds = _ri(3, 9);

  var positions, attempts = 0;
  do {
    positions = [_ri(12, 92), _ri(12, 92), _ri(12, 92)];
    attempts++;
  } while (!_minGapOk(positions, 18) && attempts < 100);

  var letters = _shuffle(['A', 'B', 'C']);
  var posBySlot = {};
  letters.forEach(function (l, i) { posBySlot[l] = positions[i]; });

  var order = letters.slice().sort(function (a, b) { return posBySlot[b] - posBySlot[a]; });
  var askFastest = Math.random() < 0.5;
  var answer = askFastest ? order[0] : order[2];
  var middle = order[1];
  var otherExtreme = askFastest ? order[2] : order[0];

  var optionTypes = {};
  optionTypes[answer] = 'none';
  optionTypes[otherExtreme] = 'polarity_confusion';
  optionTypes[middle] = 'middle_item';

  return {
    type: 'race_select',
    options: ['A', 'B', 'C'],
    answer: answer,
    optionTypes: optionTypes,
    askFastest: askFastest,
    emoji: item.emoji,
    seconds: seconds,
    posBySlot: posBySlot,
    hintZh: '三个都跑了同样的时间，比一比谁跑得' + (askFastest ? '最远' : '最近') + '。',
    hintEn: 'All three ran the same time — find who went the ' + (askFastest ? 'farthest' : 'least far') + '.'
  };
};

/**
 * raceVariant (S3): two variants sharing one question ("谁跑得更快/慢？").
 * Variant A: same time, different distance — farther is faster. Variant B:
 * both racers already at the finish line, different stopwatch seconds — less
 * time is faster. The child must notice WHICH quantity is shared before
 * picking a rule; that is the entire training point.
 */
Generators.raceVariant = function (params) {
  var item = _pick(GEN_DATA.racers);
  var variant = Math.random() < 0.5 ? 'A' : 'B';
  var same = Math.random() < 0.15;
  var askFaster = _askMode(params.askMode);

  var q = {
    type: 'race_variant',
    options: ['left', 'right', 'same'],
    variant: variant,
    askFaster: askFaster,
    emoji: item.emoji
  };

  if (variant === 'A') {
    var seconds = _ri(3, 9);
    var leftPos, rightPos;
    if (same) {
      leftPos = rightPos = _ri(30, 70);
    } else {
      do {
        leftPos = _ri(15, 90);
        rightPos = _ri(15, 90);
      } while (Math.abs(leftPos - rightPos) < 25);
    }
    q.leftSeconds = seconds; q.rightSeconds = seconds;
    q.leftPct = leftPos; q.rightPct = rightPos;
    q.answer = same ? 'same' : (askFaster
      ? (leftPos > rightPos ? 'left' : 'right')
      : (leftPos > rightPos ? 'right' : 'left'));
  } else {
    var lo = 5, hi = 60, leftSec, rightSec;
    if (same) {
      leftSec = rightSec = _ri(lo, hi);
    } else {
      do {
        leftSec = _ri(lo, hi);
        rightSec = _ri(lo, hi);
      } while (Math.max(leftSec, rightSec) / Math.min(leftSec, rightSec) < 1.25);
    }
    q.leftSeconds = leftSec; q.rightSeconds = rightSec;
    q.leftPct = 92; q.rightPct = 92;   // both already at the finish line
    q.answer = same ? 'same' : (askFaster
      ? (leftSec < rightSec ? 'left' : 'right')
      : (leftSec < rightSec ? 'right' : 'left'));
  }

  var optionTypes = {};
  if (q.answer === 'same') {
    optionTypes.same = 'none';
    optionTypes.left = 'missed_equal';
    optionTypes.right = 'missed_equal';
  } else {
    optionTypes[q.answer] = 'none';
    optionTypes[q.answer === 'left' ? 'right' : 'left'] = variant === 'B' ? 'inverse_relation' : 'polarity_confusion';
    optionTypes.same = 'false_equal';
  }
  q.optionTypes = optionTypes;

  q.hintZh = variant === 'A' ? '时间一样长，跑得远的更快。' : '路程一样，用时少的更快。';
  q.hintEn = variant === 'A' ? 'Same time — the one who went farther is faster.' : 'Same distance — less time means faster.';

  return q;
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

// ── Area (Z4/Z5): polyomino cell-counting and grid rectangles ──────────────

// Compact growth: pick a random existing cell, step to a random free neighbour.
// Used for the "more cells" shape in an anti-cue draw (small bounding box).
function _growBlob(n, boxW, boxH) {
  var cx = Math.floor(boxW / 2), cy = Math.floor(boxH / 2);
  var cells = [{ x: cx, y: cy }];
  var used = {}; used[cx + ',' + cy] = true;
  var attempts = 0;
  while (cells.length < n && attempts < n * 60) {
    attempts++;
    var base = cells[_ri(0, cells.length - 1)];
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    var d = dirs[_ri(0, 3)];
    var nx = base.x + d[0], ny = base.y + d[1];
    if (nx < 0 || nx >= boxW || ny < 0 || ny >= boxH) continue;
    var key = nx + ',' + ny;
    if (used[key]) continue;
    used[key] = true;
    cells.push({ x: nx, y: ny });
  }
  return cells;
}

function _normalizeCells(cells) {
  var minX = Math.min.apply(null, cells.map(function (c) { return c.x; }));
  var minY = Math.min.apply(null, cells.map(function (c) { return c.y; }));
  return cells.map(function (c) { return { x: c.x - minX, y: c.y - minY }; });
}

function _polyBBox(cells) {
  var xs = cells.map(function (c) { return c.x; }), ys = cells.map(function (c) { return c.y; });
  var w = Math.max.apply(null, xs) + 1, h = Math.max.apply(null, ys) + 1;
  return { w: w, h: h, area: w * h };
}

function _cellKey(cells) {
  return cells.map(function (c) { return c.x + ',' + c.y; }).sort().join('|');
}

// Deterministic compact fill (boustrophedon: right along a row, left along the
// next), used for the "more cells" shape on an anti-cue draw — its bbox is
// exactly boxW × ceil(n/boxW), never left to growth-algorithm luck.
function _compactFill(n, boxW) {
  var cells = [{ x: 0, y: 0 }];
  var x = 0, y = 0, dir = 1;
  for (var i = 1; i < n; i++) {
    if (dir === 1) {
      if (x + 1 < boxW) x++; else { y++; dir = -1; }
    } else {
      if (x - 1 >= 0) x--; else { y++; dir = 1; }
    }
    cells.push({ x: x, y: y });
  }
  return cells;
}

// Deterministic maximal-spread staircase (alternating right/down), used for
// the "fewer cells" shape on an anti-cue draw so its bbox is the largest a
// connected shape of n cells can reach inside boxW × boxH, not left to chance.
function _staircase(n, boxW, boxH) {
  var cells = [{ x: 0, y: 0 }];
  var x = 0, y = 0, horiz = true;
  while (cells.length < n) {
    var moved = false;
    if (horiz && x + 1 < boxW) { x++; moved = true; }
    else if (!horiz && y + 1 < boxH) { y++; moved = true; }
    else if (x + 1 < boxW) { x++; moved = true; }
    else if (y + 1 < boxH) { y++; moved = true; }
    if (moved) { cells.push({ x: x, y: y }); horiz = !horiz; continue; }
    break;   // box fully spanned; pad below
  }
  if (cells.length < n) {
    var used = {}; cells.forEach(function (c) { used[c.x + ',' + c.y] = true; });
    var attempts = 0;
    while (cells.length < n && attempts < n * 40) {
      attempts++;
      var base = cells[_ri(0, cells.length - 1)];
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      var d = dirs[_ri(0, 3)];
      var nx = base.x + d[0], ny = base.y + d[1];
      if (nx < 0 || nx >= boxW || ny < 0 || ny >= boxH) continue;
      var key = nx + ',' + ny;
      if (used[key]) continue;
      used[key] = true;
      cells.push({ x: nx, y: ny });
    }
  }
  return cells;
}

/**
 * areaGrid (Z4): two polyominoes, bounding box ≤ 5×4, 4–12 cells each. On at
 * least half of the unequal draws the shape with MORE cells gets the
 * SMALLER-or-equal bounding box (§ Z4 反线索条件), so "looks bigger" can
 * never be a shortcut for "has more squares".
 */
Generators.areaGrid = function (params) {
  var n1, n2, cellsA, cellsB, antiCue = false;
  var equal = Math.random() < 0.20;

  if (equal) {
    n1 = n2 = _ri(4, 12);
    var side = Math.max(2, Math.ceil(Math.sqrt(n1)));
    var keyA, tries = 0;
    do {
      cellsA = _normalizeCells(_growBlob(n1, Math.min(5, side + 1), Math.min(4, side + 1)));
      keyA = _cellKey(cellsA);
      cellsB = _normalizeCells(_growBlob(n2, Math.min(5, side + 1), Math.min(4, side + 1)));
      tries++;
    } while (_cellKey(cellsB) === keyA && tries < 10);
  } else {
    n1 = _ri(4, 12);
    var diff = _ri(1, 3);
    n2 = Math.random() < 0.5 ? n1 + diff : n1 - diff;
    if (n2 < 4) n2 = n1 + diff;
    if (n2 > 12) n2 = n1 - diff;

    antiCue = false;
    var moreIsA = n1 > n2;
    var moreN = moreIsA ? n1 : n2;
    var fewN = moreIsA ? n2 : n1;
    var moreCells, fewCells;

    var cside = Math.max(2, Math.ceil(Math.sqrt(moreN)));
    var compactArea = cside * Math.ceil(moreN / cside);
    var staircaseArea = _polyBBox(_staircase(fewN, 5, 4)).area;
    var feasible = staircaseArea >= compactArea;

    if (feasible && Math.random() < 0.75) {
      antiCue = true;
      moreCells = _normalizeCells(_compactFill(moreN, cside));
      fewCells = _normalizeCells(_staircase(fewN, 5, 4));
    } else {
      var sideA = Math.max(2, Math.ceil(Math.sqrt(moreN)));
      var sideB = Math.max(2, Math.ceil(Math.sqrt(fewN)));
      moreCells = _normalizeCells(_growBlob(moreN, Math.min(5, sideA + 1), Math.min(4, sideA + 1)));
      fewCells = _normalizeCells(_growBlob(fewN, Math.min(5, sideB + 1), Math.min(4, sideB + 1)));
      antiCue = _polyBBox(moreCells).area <= _polyBBox(fewCells).area;
    }
    cellsA = moreIsA ? moreCells : fewCells;
    cellsB = moreIsA ? fewCells : moreCells;
  }

  var bboxA = _polyBBox(cellsA), bboxB = _polyBBox(cellsB);
  var askBigger = _askMode(params.askMode);
  var answer;
  if (n1 === n2) {
    answer = 'same';
  } else {
    var moreSide = n1 > n2 ? 'left' : 'right';
    answer = askBigger ? moreSide : (moreSide === 'left' ? 'right' : 'left');
  }

  var optionTypes = {};
  if (answer === 'same') {
    optionTypes.same = 'none';
    optionTypes.left = 'missed_equal';
    optionTypes.right = 'missed_equal';
  } else {
    optionTypes[answer] = 'none';
    optionTypes[answer === 'left' ? 'right' : 'left'] = antiCue ? 'perception' : 'polarity_confusion';
    optionTypes.same = 'false_equal';
  }

  return {
    type: 'area_grid',
    options: ['left', 'right', 'same'],
    answer: answer,
    optionTypes: optionTypes,
    askBigger: askBigger,
    leftCells: cellsA, rightCells: cellsB,
    leftCount: n1, rightCount: n2,
    leftBBox: bboxA, rightBBox: bboxB,
    hintZh: '数一数方格，哪个图形' + (askBigger ? '更大' : '更小') + '？',
    hintEn: 'Count the squares. Which shape is ' + (askBigger ? 'bigger' : 'smaller') + '?'
  };
};

var AREA_RECT_EQUAL_PAIRS = [
  [[2, 6], [3, 4]], [[1, 9], [3, 3]], [[2, 8], [4, 4]], [[3, 8], [4, 6]], [[4, 9], [6, 6]]
];

function _rectMaxSide(a, b) { return Math.max(a, b); }
function _isRotation(a, b, c, d) { return (a === c && b === d) || (a === d && b === c); }

/**
 * areaRect (Z5): a×b vs c×d rectangles, area ≤ 36. On ≥60% of unequal draws
 * the rectangle with the LONGER max side has the SMALLER area (e.g. 1×9=9 vs
 * 3×4=12), so "longer edge ⇒ bigger" cannot be used as a shortcut.
 */
Generators.areaRect = function (params) {
  var maxSide = params.maxSide || 9;
  var maxArea = params.maxArea || 36;
  var equal = Math.random() < 0.25;
  var rectA, rectB;

  if (equal) {
    var pair = _pick(AREA_RECT_EQUAL_PAIRS);
    var order = Math.random() < 0.5 ? [pair[0], pair[1]] : [pair[1], pair[0]];
    rectA = order[0]; rectB = order[1];
  } else {
    var conflict = Math.random() < 0.6;
    var attempts = 0;
    do {
      attempts++;
      var a = _ri(1, maxSide), b = _ri(1, maxSide);
      var c = _ri(1, maxSide), d = _ri(1, maxSide);
      var areaA = a * b, areaB = c * d;
      if (areaA === areaB) continue;
      if (areaA > maxArea || areaB > maxArea) continue;
      if (_isRotation(a, b, c, d)) continue;
      var biggerIsA = areaA > areaB;
      var longerIsA = _rectMaxSide(a, b) > _rectMaxSide(c, d);
      var longerIsB = _rectMaxSide(c, d) > _rectMaxSide(a, b);
      var thisIsConflict = biggerIsA ? longerIsB : longerIsA;
      if (conflict && !thisIsConflict) continue;
      if (!conflict && thisIsConflict) continue;
      rectA = [a, b]; rectB = [c, d];
      break;
    } while (attempts < 200);
    if (!rectA) { rectA = [3, 4]; rectB = [2, 6]; }   // exhausted retries: fall back to a known-valid pair
  }

  var aOnLeft = Math.random() < 0.5;
  var leftRect = aOnLeft ? rectA : rectB;
  var rightRect = aOnLeft ? rectB : rectA;
  var leftArea = leftRect[0] * leftRect[1], rightArea = rightRect[0] * rightRect[1];

  var askBigger = _askMode(params.askMode);
  var answer;
  if (leftArea === rightArea) {
    answer = 'same';
  } else {
    var biggerSide = leftArea > rightArea ? 'left' : 'right';
    answer = askBigger ? biggerSide : (biggerSide === 'left' ? 'right' : 'left');
  }

  var thisConflict = leftArea !== rightArea && (leftArea > rightArea
    ? _rectMaxSide(leftRect[0], leftRect[1]) < _rectMaxSide(rightRect[0], rightRect[1])
    : _rectMaxSide(rightRect[0], rightRect[1]) < _rectMaxSide(leftRect[0], leftRect[1]));

  var optionTypes = {};
  if (answer === 'same') {
    optionTypes.same = 'none';
    optionTypes.left = 'missed_equal';
    optionTypes.right = 'missed_equal';
  } else {
    optionTypes[answer] = 'none';
    optionTypes[answer === 'left' ? 'right' : 'left'] = thisConflict ? 'perception' : 'polarity_confusion';
    optionTypes.same = 'false_equal';
  }

  return {
    type: 'area_rect',
    options: ['left', 'right', 'same'],
    answer: answer,
    optionTypes: optionTypes,
    askBigger: askBigger,
    leftA: leftRect[0], leftB: leftRect[1],
    rightA: rightRect[0], rightB: rightRect[1],
    hintZh: '数一数格子，或者用乘法算面积，看看哪个' + (askBigger ? '更大' : '更小') + '。',
    hintEn: 'Count the squares or multiply the sides to see which is ' + (askBigger ? 'bigger' : 'smaller') + '.'
  };
};

// ── Difference (judge): "not just which is more, but by how much" ─────────────
// All four reuse Phase 2's evidence carriers (quantity dots, area grid shapes,
// race stopwatch, balance-box readout) but ask for the numeric gap itself, so
// the three options are candidate numbers, not left/right/same pointers.

/**
 * quantityDiff: two counted dot groups, same icon — "how many more" as a
 * number, not "which side has more".
 */
Generators.quantityDiff = function (params) {
  var min = params.minCount || 3;
  var max = params.maxCount || 12;
  var minGap = params.minGap || 1;
  var maxGap = params.maxGap || 5;
  var obj = _pick(GEN_DATA.quantityObjects);

  var a, b, d, attempts = 0;
  do {
    a = _ri(min, max);
    b = _ri(min, max);
    d = Math.abs(a - b);
    attempts++;
  } while ((d < minGap || d > maxGap) && attempts < 100);

  var opts = _diffOptionSet(d);

  return {
    type: 'quantity_diff',
    options: opts.options,
    answer: opts.answer,
    optionTypes: opts.optionTypes,
    leftCount: a, rightCount: b,
    showNumbers: true,
    objEmoji: obj.emoji, objNameZh: obj.nameZh, objNameEn: obj.nameEn,
    hintZh: '数一数两边各有几个' + obj.nameZh + '，再算一算相差几个。',
    hintEn: 'Count both sides, then work out how many ' + obj.nameEn.toLowerCase() + ' they differ by.'
  };
};

/**
 * areaDiff: two polyomino shapes (same construction as areaGrid's unequal
 * branch), asking for the cell-count gap instead of which is bigger.
 */
Generators.areaDiff = function (params) {
  var n1 = _ri(4, 12);
  var diff = _ri(1, 3);
  var n2 = Math.random() < 0.5 ? n1 + diff : n1 - diff;
  if (n2 < 4) n2 = n1 + diff;
  if (n2 > 12) n2 = n1 - diff;

  var moreIsA = n1 > n2;
  var moreN = moreIsA ? n1 : n2;
  var fewN = moreIsA ? n2 : n1;
  var moreCells, fewCells;

  var cside = Math.max(2, Math.ceil(Math.sqrt(moreN)));
  var compactArea = cside * Math.ceil(moreN / cside);
  var staircaseArea = _polyBBox(_staircase(fewN, 5, 4)).area;
  var feasible = staircaseArea >= compactArea;

  if (feasible && Math.random() < 0.75) {
    moreCells = _normalizeCells(_compactFill(moreN, cside));
    fewCells = _normalizeCells(_staircase(fewN, 5, 4));
  } else {
    var sideA = Math.max(2, Math.ceil(Math.sqrt(moreN)));
    var sideB = Math.max(2, Math.ceil(Math.sqrt(fewN)));
    moreCells = _normalizeCells(_growBlob(moreN, Math.min(5, sideA + 1), Math.min(4, sideA + 1)));
    fewCells = _normalizeCells(_growBlob(fewN, Math.min(5, sideB + 1), Math.min(4, sideB + 1)));
  }
  var cellsA = moreIsA ? moreCells : fewCells;
  var cellsB = moreIsA ? fewCells : moreCells;
  var bboxA = _polyBBox(cellsA), bboxB = _polyBBox(cellsB);

  var d = Math.abs(n1 - n2);
  var opts = _diffOptionSet(d);

  return {
    type: 'area_diff',
    options: opts.options,
    answer: opts.answer,
    optionTypes: opts.optionTypes,
    leftCells: cellsA, rightCells: cellsB,
    leftCount: n1, rightCount: n2,
    leftBBox: bboxA, rightBBox: bboxB,
    hintZh: '数一数两个图形各占几个方格，再算一算相差几格。',
    hintEn: 'Count the squares in each shape, then work out the difference.'
  };
};

/**
 * raceDiff: both racers already finished — only the stopwatch seconds
 * differ, so the question is purely "by how many seconds".
 */
Generators.raceDiff = function (params) {
  var item = _pick(GEN_DATA.racers);
  var a = _ri(params.minSec || 3, params.maxSec || 12);
  var gap = _ri(params.minGap || 1, params.maxGap || 4);
  var b = Math.random() < 0.5 ? a + gap : a - gap;
  if (b < 2) b = a + gap;

  var d = Math.abs(a - b);
  var opts = _diffOptionSet(d);

  return {
    type: 'race_diff',
    options: opts.options,
    answer: opts.answer,
    optionTypes: opts.optionTypes,
    emoji: item.emoji,
    leftSeconds: a, rightSeconds: b,
    hintZh: '两位选手都到了终点，比一比用的时间相差几秒。',
    hintEn: 'Both racers finished — work out how many seconds their times differ by.'
  };
};

/**
 * weightDiff: same identical-looking mystery box both sides (§1.2); the
 * evidence is a scale readout (a number), same device as the race stopwatch,
 * not an eyeballed size cue.
 */
Generators.weightDiff = function (params) {
  var item = _pick(GEN_DATA.mysteryBoxes);
  var a = _ri(params.min || 3, params.max || 15);
  var gap = _ri(params.minGap || 1, params.maxGap || 5);
  var b = Math.random() < 0.5 ? a + gap : a - gap;
  if (b < 1) b = a + gap;

  var d = Math.abs(a - b);
  var opts = _diffOptionSet(d);

  return {
    type: 'weight_diff',
    options: opts.options,
    answer: opts.answer,
    optionTypes: opts.optionTypes,
    emoji: item.emoji,
    leftWeight: a, rightWeight: b,
    hintZh: '看电子秤读数，算一算两个盒子相差几个重量单位。',
    hintEn: 'Read the scale numbers and work out how many units the two boxes differ by.'
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
