'use strict';
/**
 * SciGenerators — variant generators for the Science module.
 * Mirrors comparison/generator.js's `Generators` dispatch pattern
 * (generateQuestion(template) -> Generators[template.generator](template)),
 * but scoped down to the one Context Domain ("matter") covered by this
 * architecture-scaffold MVP.
 */
var SciGenerators = (function () {

  // Small fixed material set — float/sink is a known, stable physical fact
  // for each item, so the puzzle/explore variants never need external data.
  var MATERIALS = [
    { id: 'rock',   emoji: '🪨', nameZh: '石头', nameEn: 'Rock',   floats: false },
    { id: 'leaf',   emoji: '🍃', nameZh: '叶子', nameEn: 'Leaf',   floats: true  },
    { id: 'ice',    emoji: '🧊', nameZh: '冰块', nameEn: 'Ice',    floats: true  },
    { id: 'key',    emoji: '🔑', nameZh: '钥匙', nameEn: 'Key',    floats: false },
    { id: 'wood',   emoji: '🪵', nameZh: '木头', nameEn: 'Wood',   floats: true  },
    { id: 'spoon',  emoji: '🥄', nameZh: '勺子', nameEn: 'Spoon',  floats: false }
  ];

  // Second matter-domain phenomenon (magnetism) — same "known, stable fact
  // per item" shape as MATERIALS, just keyed by `magnetic` instead of `floats`.
  var MAGNET_MATERIALS = [
    { id: 'paperclip', emoji: '🖇️', nameZh: '回形针', nameEn: 'Paperclip', magnetic: true  },
    { id: 'nail',      emoji: '🔩', nameZh: '钉子',   nameEn: 'Nail',      magnetic: true  },
    { id: 'scissors',  emoji: '✂️', nameZh: '剪刀',   nameEn: 'Scissors',  magnetic: true  },
    { id: 'leaf',      emoji: '🍃', nameZh: '叶子',   nameEn: 'Leaf',      magnetic: false },
    { id: 'eraser',    emoji: '🧽', nameZh: '橡皮',   nameEn: 'Eraser',    magnetic: false },
    { id: 'cup',       emoji: '🥤', nameZh: '塑料杯', nameEn: 'Plastic cup', magnetic: false }
  ];

  // Fourth matter-domain phenomenon (texture: hard/soft) — but a different
  // *task shape*, not another predict-and-test pair. Hard/soft is judgeable
  // by looking (no hidden test needed), so this pool backs an Observe-type
  // "which one is different?" puzzle instead of a Predict-type left/right one.
  var OBSERVE_TEXTURE_MATERIALS = [
    { id: 'rock',     emoji: '🪨', nameZh: '石头',   nameEn: 'Rock',       texture: 'hard' },
    { id: 'key',      emoji: '🔑', nameZh: '钥匙',   nameEn: 'Key',        texture: 'hard' },
    { id: 'brick',    emoji: '🧱', nameZh: '砖头',   nameEn: 'Brick',      texture: 'hard' },
    { id: 'scissors', emoji: '✂️', nameZh: '剪刀',   nameEn: 'Scissors',   texture: 'hard' },
    { id: 'bone',     emoji: '🦴', nameZh: '骨头',   nameEn: 'Bone',       texture: 'hard' },
    { id: 'hammer',   emoji: '🔨', nameZh: '锤子',   nameEn: 'Hammer',     texture: 'hard' },
    { id: 'yarn',     emoji: '🧶', nameZh: '毛线球', nameEn: 'Yarn ball',  texture: 'soft' },
    { id: 'teddy',    emoji: '🧸', nameZh: '毛绒玩具', nameEn: 'Teddy bear', texture: 'soft' },
    { id: 'leaf',     emoji: '🍃', nameZh: '叶子',   nameEn: 'Leaf',       texture: 'soft' },
    { id: 'tissue',   emoji: '🧻', nameZh: '纸巾',   nameEn: 'Tissue',     texture: 'soft' },
    { id: 'balloon',  emoji: '🎈', nameZh: '气球',   nameEn: 'Balloon',    texture: 'soft' },
    { id: 'sponge',   emoji: '🧽', nameZh: '海绵',   nameEn: 'Sponge',     texture: 'soft' }
  ];

  // K2 life-domain "describe" pool — grouped by body covering, same shape
  // as OBSERVE_TEXTURE_MATERIALS's texture grouping but for animals.
  var LIFE_COVERING_ANIMALS = [
    { id: 'fish',   emoji: '🐟', nameZh: '鱼',   nameEn: 'Fish',   covering: 'scales' },
    { id: 'snake',  emoji: '🐍', nameZh: '蛇',   nameEn: 'Snake',  covering: 'scales' },
    { id: 'bird',   emoji: '🐦', nameZh: '小鸟', nameEn: 'Bird',   covering: 'feathers' },
    { id: 'duck',   emoji: '🦆', nameZh: '鸭子', nameEn: 'Duck',   covering: 'feathers' },
    { id: 'dog',    emoji: '🐶', nameZh: '小狗', nameEn: 'Dog',    covering: 'fur' },
    { id: 'rabbit', emoji: '🐰', nameZh: '兔子', nameEn: 'Rabbit', covering: 'fur' },
    { id: 'frog',   emoji: '🐸', nameZh: '青蛙', nameEn: 'Frog',   covering: 'smooth' },
    { id: 'snail',  emoji: '🐌', nameZh: '蜗牛', nameEn: 'Snail',  covering: 'smooth' }
  ];

  // Fixed description-phrase options for matterDescribePuzzle — reuses
  // OBSERVE_TEXTURE_MATERIALS's texture field (hard/soft) as the answer key.
  var TEXTURE_DESCRIBE_OPTS = [
    { id: 'hard',     zh: '摸起来很硬', en: 'It feels hard' },
    { id: 'soft',     zh: '摸起来很软', en: 'It feels soft' },
    { id: 'slippery', zh: '摸起来很滑', en: 'It feels slippery' },
    { id: 'heavy',    zh: '摸起来很重', en: 'It feels heavy' }
  ];

  // Fixed description-phrase options for lifeDescribePuzzle — keyed by
  // LIFE_COVERING_ANIMALS's covering field.
  var COVERING_DESCRIBE_OPTS = [
    { id: 'scales',   zh: '身上有鳞片', en: 'Has scales' },
    { id: 'feathers', zh: '身上有羽毛', en: 'Has feathers' },
    { id: 'fur',      zh: '身上有毛发', en: 'Has fur' },
    { id: 'smooth',   zh: '皮肤很光滑', en: 'Has smooth skin' }
  ];

  // G1 motion-domain "predict" pool — same fixed-pair shape as MATERIALS,
  // keyed by whether the object rolls.
  var ROLL_MATERIALS = [
    { id: 'ball',   emoji: '⚽', nameZh: '球',     nameEn: 'Ball',   rolls: true },
    { id: 'orange', emoji: '🍊', nameZh: '橙子',   nameEn: 'Orange', rolls: true },
    { id: 'coin',   emoji: '🪙', nameZh: '硬币',   nameEn: 'Coin',   rolls: true },
    { id: 'marble', emoji: '🔘', nameZh: '玻璃球', nameEn: 'Marble', rolls: true },
    { id: 'box',    emoji: '📦', nameZh: '箱子',   nameEn: 'Box',    rolls: false },
    { id: 'book',   emoji: '📖', nameZh: '书',     nameEn: 'Book',   rolls: false },
    { id: 'brick',  emoji: '🧱', nameZh: '砖头',   nameEn: 'Brick',  rolls: false },
    { id: 'shoe',   emoji: '👟', nameZh: '鞋子',   nameEn: 'Shoe',   rolls: false }
  ];

  // G1 life-domain "predict" pool — same fixed-pair shape, keyed by flight.
  var FLY_ANIMALS = [
    { id: 'bird',      emoji: '🐦', nameZh: '小鸟', nameEn: 'Bird',      flies: true },
    { id: 'bee',       emoji: '🐝', nameZh: '蜜蜂', nameEn: 'Bee',       flies: true },
    { id: 'butterfly', emoji: '🦋', nameZh: '蝴蝶', nameEn: 'Butterfly', flies: true },
    { id: 'bat',       emoji: '🦇', nameZh: '蝙蝠', nameEn: 'Bat',       flies: true },
    { id: 'dog',       emoji: '🐶', nameZh: '小狗', nameEn: 'Dog',       flies: false },
    { id: 'fish',      emoji: '🐟', nameZh: '鱼',   nameEn: 'Fish',      flies: false },
    { id: 'turtle',    emoji: '🐢', nameZh: '乌龟', nameEn: 'Turtle',    flies: false },
    { id: 'cow',       emoji: '🐮', nameZh: '牛',   nameEn: 'Cow',       flies: false },
    { id: 'rabbit',    emoji: '🐰', nameZh: '兔子', nameEn: 'Rabbit',    flies: false },
    { id: 'snake',     emoji: '🐍', nameZh: '蛇',   nameEn: 'Snake',     flies: false }
  ];

  // G2 earth-domain "question" pool — each scenario pairs an observation
  // with one testable question and three untestable/irrelevant distractors.
  var EARTH_QUESTION_SCENARIOS = [
    {
      promptZh: '小明发现今天风很大，风筝飞得很高。他可以研究哪个问题？',
      promptEn: 'Ming notices it is very windy today and his kite is flying very high. Which question could he investigate?',
      options: [
        { zh: '风越大，风筝能飞多高？', en: 'How high can a kite fly as the wind gets stronger?' },
        { zh: '风筝好不好看？', en: 'Is the kite pretty?' },
        { zh: '今天开心吗？', en: 'Is today fun?' },
        { zh: '谁的风筝更贵？', en: 'Whose kite is more expensive?' }
      ],
      answer: 0
    },
    {
      promptZh: '冬天到了，小美发现树叶变黄掉落得很快。她可以研究哪个问题？',
      promptEn: 'Winter has come, and Mei notices the leaves are turning yellow and falling quickly. Which question could she investigate?',
      options: [
        { zh: '温度越低，树叶掉落得越快吗？', en: 'Do leaves fall faster as the temperature drops?' },
        { zh: '树叶是什么颜色好看？', en: 'What color of leaf looks pretty?' },
        { zh: '谁更喜欢冬天？', en: 'Who likes winter more?' },
        { zh: '这棵树有多老？', en: 'How old is this tree?' }
      ],
      answer: 0
    },
    {
      promptZh: '下雨后，小刚发现地上的泥土变得又湿又软。他可以研究哪个问题？',
      promptEn: 'After the rain, Gang notices the soil on the ground has become wet and soft. Which question could he investigate?',
      options: [
        { zh: '泥土里的水分越多，泥土会变得多软？', en: 'How soft does soil get as its water content increases?' },
        { zh: '谁的脚踩在泥土里最深？', en: 'Whose foot sank deepest into the soil?' },
        { zh: '雨水是什么味道？', en: 'What does rainwater taste like?' },
        { zh: '院子有多大？', en: 'How big is the yard?' }
      ],
      answer: 0
    },
    {
      promptZh: '在海边，小丽发现有些石头很光滑，有些很粗糙。她可以研究哪个问题？',
      promptEn: 'At the beach, Li notices some rocks are smooth and others are rough. Which question could she investigate?',
      options: [
        { zh: '石头被水冲得越久，会变得越光滑吗？', en: 'Do rocks get smoother the longer they are worn by water?' },
        { zh: '石头是什么颜色的？', en: 'What color are the rocks?' },
        { zh: '谁捡到的石头更多？', en: 'Who collected more rocks?' },
        { zh: '沙子有多热？', en: 'How hot is the sand?' }
      ],
      answer: 0
    }
  ];

  // G2 energy-domain "question" pool — same shape as EARTH_QUESTION_SCENARIOS.
  var ENERGY_QUESTION_SCENARIOS = [
    {
      promptZh: '小美把手电筒离墙越远，光圈就越大。她可以研究哪个问题？',
      promptEn: 'Mei moves her flashlight farther from the wall, and the circle of light gets bigger. Which question could she investigate?',
      options: [
        { zh: '手电筒离墙越远，光圈会变得多大？', en: 'How big does the light circle get as the flashlight moves farther from the wall?' },
        { zh: '手电筒是什么颜色的？', en: 'What color is the flashlight?' },
        { zh: '手电筒多少钱？', en: 'How much does the flashlight cost?' },
        { zh: '墙是什么颜色的？', en: 'What color is the wall?' }
      ],
      answer: 0
    },
    {
      promptZh: '小华用力推小车，小车跑得更快了。他可以研究哪个问题？',
      promptEn: 'Hua pushes the cart harder, and it goes faster. Which question could he investigate?',
      options: [
        { zh: '用的力气越大，小车能跑多快？', en: 'How fast can the cart go as you push harder?' },
        { zh: '小车是什么颜色的？', en: 'What color is the cart?' },
        { zh: '小车多少钱？', en: 'How much does the cart cost?' },
        { zh: '谁的小车更好看？', en: 'Whose cart looks nicer?' }
      ],
      answer: 0
    },
    {
      promptZh: '小刚把冰块放在太阳下，冰块渐渐化成了水。他可以研究哪个问题？',
      promptEn: 'Gang leaves an ice cube in the sun, and it slowly melts into water. Which question could he investigate?',
      options: [
        { zh: '冰块放在太阳下多久会化完？', en: 'How long does it take for an ice cube to fully melt in the sun?' },
        { zh: '冰块是什么味道？', en: 'What does the ice cube taste like?' },
        { zh: '冰块有多大？', en: 'How big is the ice cube?' },
        { zh: '太阳是什么形状的？', en: 'What shape is the sun?' }
      ],
      answer: 0
    },
    {
      promptZh: '小丽荡的秋千越高，回来的时候就越快。她可以研究哪个问题？',
      promptEn: 'The higher Li swings, the faster the swing comes back. Which question could she investigate?',
      options: [
        { zh: '秋千荡得越高，回来的速度有多快？', en: 'How fast does the swing come back as it goes higher?' },
        { zh: '荡秋千好玩吗？', en: 'Is swinging fun?' },
        { zh: '谁荡得更高？', en: 'Who swings higher?' },
        { zh: '秋千是什么颜色的？', en: 'What color is the swing?' }
      ],
      answer: 0
    }
  ];

  function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // Picks `n` distinct items from arr without replacement (n <= arr.length).
  function _pickN(arr, n) {
    var pool = arr.slice(), out = [];
    for (var i = 0; i < n && pool.length; i++) {
      out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return out;
  }

  function _shuffle(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
    }
    return copy;
  }

  function _pickPair() {
    var floaters = MATERIALS.filter(function (m) { return m.floats; });
    var sinkers  = MATERIALS.filter(function (m) { return !m.floats; });
    var a = _pick(floaters);
    var b = _pick(sinkers);
    return Math.random() < 0.5 ? [a, b] : [b, a];
  }

  function _pickMagnetPair() {
    var magnetic    = MAGNET_MATERIALS.filter(function (m) { return m.magnetic; });
    var nonMagnetic = MAGNET_MATERIALS.filter(function (m) { return !m.magnetic; });
    var a = _pick(magnetic);
    var b = _pick(nonMagnetic);
    return Math.random() < 0.5 ? [a, b] : [b, a];
  }

  function _pickRollPair() {
    var rollers    = ROLL_MATERIALS.filter(function (m) { return m.rolls; });
    var nonRollers = ROLL_MATERIALS.filter(function (m) { return !m.rolls; });
    var a = _pick(rollers);
    var b = _pick(nonRollers);
    return Math.random() < 0.5 ? [a, b] : [b, a];
  }

  function _pickFlyPair() {
    var fliers    = FLY_ANIMALS.filter(function (m) { return m.flies; });
    var nonFliers = FLY_ANIMALS.filter(function (m) { return !m.flies; });
    var a = _pick(fliers);
    var b = _pick(nonFliers);
    return Math.random() < 0.5 ? [a, b] : [b, a];
  }

  // Picks a 4-item "odd one out" set from `pool`, grouped by `keyField`: 3
  // items sharing one category value, 1 item from the other — order shuffled,
  // so the odd item's position is not always last/first.
  function _pickOddSet(pool, keyField) {
    var byKey = {};
    pool.forEach(function (m) {
      var k = m[keyField];
      (byKey[k] = byKey[k] || []).push(m);
    });
    var keys = Object.keys(byKey);
    var majorKey = _pick(keys);
    var minorKey = _pick(keys.filter(function (k) { return k !== majorKey; }));
    var items = _shuffle(_pickN(byKey[majorKey], 3).concat(_pick(byKey[minorKey])));
    var oddIndex = -1;
    for (var i = 0; i < items.length; i++) { if (items[i][keyField] === minorKey) { oddIndex = i; break; } }
    return { items: items, oddIndex: oddIndex };
  }

  // Puzzle: two-choice "which one will float?" — feeds shell.createGame's
  // renderSequence/renderOption/checkAnswer trio via game.js.
  function floatSinkPuzzle(template) {
    var pair = _pickPair();
    var left = pair[0], right = pair[1];
    var answer = left.floats ? 'left' : 'right';
    return {
      type: 'float_puzzle',
      templateId: template.id,
      left: left,
      right: right,
      // Shell-1 standard Unit format requires an `options` array on every
      // question; shell.js iterates it to build the answer buttons and
      // passes each raw element straight to renderOption()/checkAnswer().
      options: ['left', 'right'],
      answer: answer,
      hintZh: '想想哪个更轻，哪个更重。',
      hintEn: 'Think about which one is lighter and which is heavier.'
    };
  }

  // Explore: the raw materials + steps consumed by ExploreRuntime.run().
  // Nothing here is "correct/incorrect" in the puzzle sense — ExploreRuntime
  // records what happens (predictions, actions, observations, ...) rather
  // than grading a single answer.
  function floatSinkExplore(template) {
    return {
      type: 'float_explore',
      templateId: template.id,
      testItems: [
        { id: 'rock', emoji: '🪨', nameZh: '石头', nameEn: 'Rock', floats: false },
        { id: 'leaf', emoji: '🍃', nameZh: '叶子', nameEn: 'Leaf', floats: true }
      ],
      variable: {
        id: 'water',
        nameZh: '水的种类',
        nameEn: 'Water type',
        options: [
          { id: 'fresh', nameZh: '清水', nameEn: 'Fresh water' },
          { id: 'salt',  nameZh: '盐水', nameEn: 'Salt water' }
        ]
      },
      evidenceOptions: [
        { id: 'weight',   nameZh: '重量', nameEn: 'Weight' },
        { id: 'size',     nameZh: '大小', nameEn: 'Size' },
        { id: 'material', nameZh: '材质', nameEn: 'Material' }
      ],
      explanationOptions: [
        { id: 'density',  nameZh: '材质不同，有的比水轻，有的比水重', nameEn: 'Different materials are lighter or heavier than water', correct: true },
        { id: 'color',    nameZh: '因为颜色不同', nameEn: 'Because the colors are different', correct: false },
        { id: 'size',     nameZh: '因为大小不同', nameEn: 'Because the sizes are different', correct: false }
      ]
    };
  }

  // Puzzle: two-choice "which one will the magnet attract?" — second
  // matter-domain phenomenon, same shape as floatSinkPuzzle.
  function magnetPuzzle(template) {
    var pair = _pickMagnetPair();
    var left = pair[0], right = pair[1];
    var answer = left.magnetic ? 'left' : 'right';
    return {
      type: 'magnet_puzzle',
      templateId: template.id,
      left: left,
      right: right,
      options: ['left', 'right'],
      answer: answer,
      hintZh: '想想哪个是金属做的。',
      hintEn: 'Think about which one is made of metal.'
    };
  }

  // Explore: magnetism counterpart to floatSinkExplore — same fixed-pair
  // shape (one clear positive, one clear negative example) so the runtime's
  // predict/test/variable/evidence/explain steps stay unchanged.
  function magnetExplore(template) {
    return {
      type: 'magnet_explore',
      templateId: template.id,
      testItems: [
        { id: 'paperclip', emoji: '🖇️', nameZh: '回形针', nameEn: 'Paperclip', magnetic: true },
        { id: 'leaf',      emoji: '🍃', nameZh: '叶子',   nameEn: 'Leaf',      magnetic: false }
      ],
      variable: {
        id: 'distance',
        nameZh: '磁铁的距离',
        nameEn: 'Magnet distance',
        options: [
          { id: 'near', nameZh: '靠近', nameEn: 'Close' },
          { id: 'far',  nameZh: '远离', nameEn: 'Far away' }
        ]
      },
      evidenceOptions: [
        { id: 'weight',   nameZh: '重量', nameEn: 'Weight' },
        { id: 'size',     nameZh: '大小', nameEn: 'Size' },
        { id: 'material', nameZh: '材质', nameEn: 'Material' }
      ],
      explanationOptions: [
        { id: 'metal', nameZh: '材质不同，金属会被磁铁吸住，非金属不会', nameEn: 'Different materials — metal is attracted by magnets, non-metal is not', correct: true },
        { id: 'color', nameZh: '因为颜色不同', nameEn: 'Because the colors are different', correct: false },
        { id: 'size',  nameZh: '因为大小不同', nameEn: 'Because the sizes are different', correct: false }
      ]
    };
  }

  // Puzzle: Observe-type "which one is different?" — unlike floatSinkPuzzle/
  // magnetPuzzle (Predict-type: guess a hidden property, then test it),
  // texture is visible/knowable by looking, so there's no test step — the
  // child picks the odd item straight out of a 4-item grid.
  function observeOddOnePuzzle(template) {
    var picked = _pickOddSet(OBSERVE_TEXTURE_MATERIALS, 'texture');
    return {
      type: 'observe_odd_puzzle',
      templateId: template.id,
      items: picked.items,
      options: [0, 1, 2, 3],
      answer: picked.oddIndex,
      hintZh: '仔细看一看，哪一个和其他三个摸起来感觉不一样？',
      hintEn: 'Look closely — which one would feel different to touch than the other three?'
    };
  }

  // K2 matter-domain "describe" puzzle — shows one item and asks which
  // phrase describes how it feels; reuses OBSERVE_TEXTURE_MATERIALS as-is.
  function matterDescribePuzzle(template) {
    var item = _pick(OBSERVE_TEXTURE_MATERIALS);
    var answer = -1;
    for (var i = 0; i < TEXTURE_DESCRIBE_OPTS.length; i++) {
      if (TEXTURE_DESCRIBE_OPTS[i].id === item.texture) { answer = i; break; }
    }
    return {
      type: 'matter_describe_puzzle',
      templateId: template.id,
      stimulus: item,
      textOptions: TEXTURE_DESCRIBE_OPTS,
      options: [0, 1, 2, 3],
      answer: answer,
      promptZh: '它摸起来是什么感觉？',
      promptEn: 'What does it feel like?',
      voiceZh: '它摸起来是什么感觉？',
      voiceEn: 'What does it feel like?',
      hintZh: '仔细想一想，摸上去是硬的还是软的？',
      hintEn: 'Think about it — does it feel hard or soft to touch?'
    };
  }

  // K2 life-domain "describe" puzzle — same shape as matterDescribePuzzle,
  // keyed by LIFE_COVERING_ANIMALS's covering field instead of texture.
  function lifeDescribePuzzle(template) {
    var item = _pick(LIFE_COVERING_ANIMALS);
    var answer = -1;
    for (var i = 0; i < COVERING_DESCRIBE_OPTS.length; i++) {
      if (COVERING_DESCRIBE_OPTS[i].id === item.covering) { answer = i; break; }
    }
    return {
      type: 'life_describe_puzzle',
      templateId: template.id,
      stimulus: item,
      textOptions: COVERING_DESCRIBE_OPTS,
      options: [0, 1, 2, 3],
      answer: answer,
      promptZh: '它的身上是什么样的？',
      promptEn: 'What is its body covered with?',
      voiceZh: '它的身上是什么样的？',
      voiceEn: 'What is its body covered with?',
      hintZh: '想一想，它的皮肤上有鳞片、羽毛，还是毛发？',
      hintEn: 'Think about it — does its skin have scales, feathers, or fur?'
    };
  }

  // G1 motion-domain "predict" puzzle — same Predict-pair shape as
  // floatSinkPuzzle/magnetPuzzle, keyed by ROLL_MATERIALS's rolls field.
  function motionRollPuzzle(template) {
    var pair = _pickRollPair();
    var left = pair[0], right = pair[1];
    var answer = left.rolls ? 'left' : 'right';
    return {
      type: 'motion_roll_puzzle',
      templateId: template.id,
      left: left,
      right: right,
      options: ['left', 'right'],
      answer: answer,
      hintZh: '想想哪一个是圆的，圆的更容易滚动。',
      hintEn: 'Think about which one is round — round shapes roll more easily.'
    };
  }

  // G1 life-domain "predict" puzzle — same Predict-pair shape,
  // keyed by FLY_ANIMALS's flies field.
  function lifeFlyPuzzle(template) {
    var pair = _pickFlyPair();
    var left = pair[0], right = pair[1];
    var answer = left.flies ? 'left' : 'right';
    return {
      type: 'life_fly_puzzle',
      templateId: template.id,
      left: left,
      right: right,
      options: ['left', 'right'],
      answer: answer,
      hintZh: '想想哪一个有翅膀。',
      hintEn: 'Think about which one has wings.'
    };
  }

  // G2 earth-domain "question" puzzle — text-choice shape: a scenario
  // (promptZh/En) plus 4 candidate questions, one testable, three not.
  function earthQuestionPuzzle(template) {
    var scenario = _pick(EARTH_QUESTION_SCENARIOS);
    return _buildQuestionPuzzle(template, scenario, 'earth_question_puzzle');
  }

  // G2 energy-domain "question" puzzle — same shape as earthQuestionPuzzle.
  function energyQuestionPuzzle(template) {
    var scenario = _pick(ENERGY_QUESTION_SCENARIOS);
    return _buildQuestionPuzzle(template, scenario, 'energy_question_puzzle');
  }

  // Shared builder for the "question" scenario shape — shuffles the
  // candidate options so the correct one isn't always in the same slot.
  function _buildQuestionPuzzle(template, scenario, typeTag) {
    var order = _shuffle([0, 1, 2, 3]);
    var textOptions = order.map(function (i) {
      return { zh: scenario.options[i].zh, en: scenario.options[i].en };
    });
    var answer = order.indexOf(scenario.answer);
    return {
      type: typeTag,
      templateId: template.id,
      textOptions: textOptions,
      options: [0, 1, 2, 3],
      answer: answer,
      promptZh: scenario.promptZh,
      promptEn: scenario.promptEn,
      voiceZh: scenario.promptZh,
      voiceEn: scenario.promptEn,
      hintZh: '想一想，哪一个问题是可以通过观察或实验来回答的？',
      hintEn: 'Think about it — which question could you answer by observing or testing?'
    };
  }

  var Generators = {
    floatSinkPuzzle:      floatSinkPuzzle,
    floatSinkExplore:     floatSinkExplore,
    magnetPuzzle:         magnetPuzzle,
    magnetExplore:        magnetExplore,
    observeOddOnePuzzle:  observeOddOnePuzzle,
    matterDescribePuzzle: matterDescribePuzzle,
    lifeDescribePuzzle:   lifeDescribePuzzle,
    motionRollPuzzle:     motionRollPuzzle,
    lifeFlyPuzzle:        lifeFlyPuzzle,
    earthQuestionPuzzle:  earthQuestionPuzzle,
    energyQuestionPuzzle: energyQuestionPuzzle
  };

  // Same shape as comparison/generator.js: generateQuestion(template) looks
  // up template.generator in the Generators map and stamps a variantId.
  function generateQuestion(template) {
    var fn = Generators[template.generator];
    if (!fn) throw new Error('[SciGenerators] unknown generator: ' + template.generator);
    var q = fn(template);
    q.variantId = SciEngine.makeVariantId(template.id);
    return q;
  }

  return {
    Generators: Generators,
    generateQuestion: generateQuestion
  };

}());
