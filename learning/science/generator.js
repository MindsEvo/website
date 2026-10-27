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
        { zh: '这棵树看起来漂亮吗？', en: 'Does this tree look pretty?' }
      ],
      answer: 0
    },
    {
      promptZh: '下雨后，小刚发现地上的泥土变得又湿又软。他可以研究哪个问题？',
      promptEn: 'After the rain, Gang notices the soil on the ground has become wet and soft. Which question could he investigate?',
      options: [
        { zh: '泥土里的水分越多，泥土会变得多软？', en: 'How soft does soil get as its water content increases?' },
        { zh: '谁最喜欢踩泥土？', en: 'Who likes stepping in mud the most?' },
        { zh: '湿泥土好看吗？', en: 'Does wet soil look nice?' },
        { zh: '谁的鞋子最漂亮？', en: 'Whose shoes look the nicest?' }
      ],
      answer: 0
    },
    {
      promptZh: '在海边，小丽发现有些石头很光滑，有些很粗糙。她可以研究哪个问题？',
      promptEn: 'At the beach, Li notices some rocks are smooth and others are rough. Which question could she investigate?',
      options: [
        { zh: '石头被水冲得越久，会变得越光滑吗？', en: 'Do rocks get smoother the longer they are worn by water?' },
        { zh: '哪块石头最好看？', en: 'Which rock looks the nicest?' },
        { zh: '谁最喜欢这些石头？', en: 'Who likes these rocks the most?' },
        { zh: '海边好玩吗？', en: 'Is the beach fun?' }
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
        { zh: '这个手电筒好看吗？', en: 'Does this flashlight look nice?' },
        { zh: '谁最喜欢这个手电筒？', en: 'Who likes this flashlight the most?' },
        { zh: '这面墙漂亮吗？', en: 'Does this wall look pretty?' }
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
        { zh: '冰块好吃吗？', en: 'Does the ice cube taste good?' },
        { zh: '谁最喜欢冰块？', en: 'Who likes ice cubes the most?' },
        { zh: '晴天好玩吗？', en: 'Is a sunny day fun?' }
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

  // K1 observation benchmark: the test outcomes are supplied explicitly,
  // and the child identifies the statement that accurately records the evidence.
  // This avoids grading prior knowledge about which everyday objects float.
  function floatSinkPuzzle(template) {
    var sourceOptions = [
      {
        zh: '石头沉下去了，叶子浮起来了',
        en: 'The rock sank and the leaf floated',
        role: 'observed'
      },
      {
        zh: '石头浮起来了，叶子沉下去了',
        en: 'The rock floated and the leaf sank',
        role: 'reversed'
      },
      {
        zh: '石头和叶子都沉下去了',
        en: 'Both the rock and the leaf sank',
        role: 'unsupported'
      },
      {
        zh: '因为叶子是绿色的，所以它浮起来了',
        en: 'The leaf floated because it was green',
        role: 'appearance_guess'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    var textOptions = order.map(function (index) {
      var option = sourceOptions[index];
      return { zh: option.zh, en: option.en, observationRole: option.role };
    });
    return {
      type: 'float_observation_puzzle',
      templateId: template.id,
      promptZh: '水中测试的结果是：石头到了水底，叶子留在水面。哪一句准确记录了观察结果？',
      promptEn: 'In the water test, the rock reached the bottom and the leaf stayed on the surface. Which sentence accurately records the observation?',
      voiceZh: '哪一句准确记录了刚才的观察结果？',
      voiceEn: 'Which sentence accurately records the observed result?',
      textOptions: textOptions,
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '只选择题目告诉你的实际结果，不要根据颜色猜原因。',
      hintEn: 'Choose only the result stated in the test, not a reason guessed from appearance.'
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
      testItem: { id: 'egg', emoji: '🥚', nameZh: '鸡蛋', nameEn: 'Egg' },
      options: [
        {
          id: 'fresh',
          nameZh: '清水',
          nameEn: 'Fresh water',
          actual: 'sink',
          resultZh: '鸡蛋沉到了清水底部。',
          resultEn: 'The egg sank to the bottom in fresh water.'
        },
        {
          id: 'salt',
          nameZh: '盐水',
          nameEn: 'Salt water',
          actual: 'float',
          resultZh: '鸡蛋浮在盐水中。',
          resultEn: 'The egg floated in salt water.'
        }
      ]
    },
    evidenceOptions: [
      {
        id: 'observed-rock-sank',
        nameZh: '刚才石头沉下去了',
        nameEn: 'The rock sank in the test',
        source: 'observation',
        relevant: true
      },
      {
        id: 'observed-leaf-floated',
        nameZh: '刚才叶子浮起来了',
        nameEn: 'The leaf floated in the test',
        source: 'observation',
        relevant: true
      },
      {
        id: 'observed-water-changed-result',
        nameZh: '同一个鸡蛋在清水和盐水中的结果不同',
        nameEn: 'The same egg behaved differently in fresh and salt water',
        source: 'variable_test',
        relevant: true
      },
      {
        id: 'object-color',
        nameZh: '物体的颜色不同',
        nameEn: 'The objects have different colors',
        source: 'appearance',
        relevant: false
      }
    ],
    explanationOptions: [
      {
        id: 'material-and-water',
        nameZh: '物体的材料和水的条件都会影响浮沉',
        nameEn: 'The object material and the water condition can both affect floating and sinking',
        correct: true
      },
      { id: 'color', nameZh: '因为颜色不同', nameEn: 'Because the colors are different', correct: false },
      { id: 'size', nameZh: '只要物体大就一定会沉', nameEn: 'A larger object will always sink', correct: false }
    ]
  };
}

  // K1 observation benchmark for magnetism. The activity supplies the
  // outcomes, and the child distinguishes an observation from reversed or
  // appearance-based statements.
  function magnetPuzzle(template) {
    var sourceOptions = [
      {
        zh: '回形针被吸住了，叶子没有被吸住',
        en: 'The paperclip was attracted and the leaf was not',
        role: 'observed'
      },
      {
        zh: '叶子被吸住了，回形针没有被吸住',
        en: 'The leaf was attracted and the paperclip was not',
        role: 'reversed'
      },
      {
        zh: '回形针和叶子都被吸住了',
        en: 'Both the paperclip and the leaf were attracted',
        role: 'unsupported'
      },
      {
        zh: '因为回形针比较小，所以它被吸住了',
        en: 'The paperclip was attracted because it was smaller',
        role: 'appearance_guess'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    var textOptions = order.map(function (index) {
      var option = sourceOptions[index];
      return { zh: option.zh, en: option.en, observationRole: option.role };
    });
    return {
      type: 'magnet_observation_puzzle',
      templateId: template.id,
      promptZh: '磁铁测试的结果是：回形针被吸住了，叶子没有被吸住。哪一句准确记录了观察结果？',
      promptEn: 'In the magnet test, the paperclip was attracted and the leaf was not. Which sentence accurately records the observation?',
      voiceZh: '哪一句准确记录了磁铁测试的结果？',
      voiceEn: 'Which sentence accurately records the magnet-test result?',
      textOptions: textOptions,
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '观察记录只说明发生了什么，不需要猜测原因。',
      hintEn: 'An observation states what happened without guessing why.'
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
      { id: 'leaf', emoji: '🍃', nameZh: '叶子', nameEn: 'Leaf', magnetic: false }
    ],
    variable: {
      id: 'distance',
      nameZh: '磁铁的距离',
      nameEn: 'Magnet distance',
      testItem: { id: 'nail', emoji: '🔩', nameZh: '钉子', nameEn: 'Nail' },
      options: [
        {
          id: 'near',
          nameZh: '靠近',
          nameEn: 'Close',
          actual: 'attract',
          resultZh: '磁铁靠近时，钉子被吸住了。',
          resultEn: 'The nail was attracted when the magnet was close.'
        },
        {
          id: 'far',
          nameZh: '远离',
          nameEn: 'Far away',
          actual: 'no_attract',
          resultZh: '磁铁较远时，钉子没有被吸住。',
          resultEn: 'The nail was not attracted when the magnet was far away.'
        }
      ]
    },
    evidenceOptions: [
      {
        id: 'observed-paperclip-attracted',
        nameZh: '刚才回形针被磁铁吸住了',
        nameEn: 'The paperclip was attracted in the test',
        source: 'observation',
        relevant: true
      },
      {
        id: 'observed-leaf-not-attracted',
        nameZh: '刚才叶子没有被磁铁吸住',
        nameEn: 'The leaf was not attracted in the test',
        source: 'observation',
        relevant: true
      },
      {
        id: 'observed-distance-changed-result',
        nameZh: '同一根钉子在不同距离下结果不同',
        nameEn: 'The same nail behaved differently at different distances',
        source: 'variable_test',
        relevant: true
      },
      {
        id: 'object-color',
        nameZh: '物体的颜色不同',
        nameEn: 'The objects have different colors',
        source: 'appearance',
        relevant: false
      }
    ],
    explanationOptions: [
      {
        id: 'material-and-distance',
        nameZh: '物体的材料和磁铁距离都会影响吸引结果',
        nameEn: 'The material and the magnet distance can both affect attraction',
        correct: true
      },
      { id: 'color', nameZh: '因为颜色不同', nameEn: 'Because the colors are different', correct: false },
      { id: 'size', nameZh: '只要物体小就一定会被吸住', nameEn: 'A smaller object will always be attracted', correct: false }
    ]
  };
}

  // Explore: controlled ramp-height investigation. The same ball and surface
  // are retained while ramp height changes, so the observed distance can be
  // attributed to the tested variable rather than to a different object.
  function rampLabExplore(template) {
    return {
      type: 'ramp_explore',
      templateId: template.id,
      testItems: [
        {
          id: 'low-ramp-preview',
          emoji: '🔵',
          nameZh: '低斜坡上的小球',
          nameEn: 'Ball on a low ramp',
          actual: 'short'
        }
      ],
      variable: {
        id: 'ramp-height',
        nameZh: '斜坡高度',
        nameEn: 'Ramp height',
        testItem: {
          id: 'same-ball',
          emoji: '🔵',
          nameZh: '同一个小球',
          nameEn: 'The same ball'
        },
        options: [
          {
            id: 'low',
            nameZh: '低斜坡',
            nameEn: 'Low ramp',
            actual: 'short',
            resultZh: '小球从低斜坡滚下，停在较近的位置。',
            resultEn: 'From the low ramp, the ball stopped at a nearer position.'
          },
          {
            id: 'high',
            nameZh: '高斜坡',
            nameEn: 'High ramp',
            actual: 'far',
            resultZh: '小球从高斜坡滚下，滚到了更远的位置。',
            resultEn: 'From the high ramp, the ball rolled to a farther position.'
          }
        ]
      },
      evidenceOptions: [
        {
          id: 'observed-low-short',
          nameZh: '低斜坡测试中，小球停得较近',
          nameEn: 'In the low-ramp test, the ball stopped nearer',
          source: 'observation',
          relevant: true
        },
        {
          id: 'observed-height-changed-distance',
          nameZh: '同一个小球在高斜坡上滚得更远',
          nameEn: 'The same ball rolled farther from the higher ramp',
          source: 'variable_test',
          relevant: true
        },
        {
          id: 'same-ball-and-surface',
          nameZh: '两次测试使用同一个小球和相同地面',
          nameEn: 'Both tests used the same ball and the same surface',
          source: 'variable_test',
          relevant: true
        },
        {
          id: 'ball-color',
          nameZh: '小球是蓝色的',
          nameEn: 'The ball is blue',
          source: 'appearance',
          relevant: false
        }
      ],
      explanationOptions: [
        {
          id: 'height-affects-distance',
          nameZh: '保持小球和地面相同时，斜坡高度会影响滚动距离',
          nameEn: 'When the ball and surface stay the same, ramp height affects rolling distance',
          correct: true
        },
        {
          id: 'color-causes-distance',
          nameZh: '因为蓝色小球总是滚得更远',
          nameEn: 'Because blue balls always roll farther',
          correct: false
        },
        {
          id: 'different-ball',
          nameZh: '因为第二次换了另一个小球',
          nameEn: 'Because a different ball was used in the second test',
          correct: false
        }
      ]
    };
  }

  // Explore: controlled light-position investigation. The object and screen
  // stay fixed while the light source moves, letting the child connect the
  // changed variable to the observed shadow size.
  function shadowChangesExplore(template) {
    return {
      type: 'shadow_explore',
      templateId: template.id,
      testItems: [
        {
          id: 'far-light-preview',
          emoji: '🔦',
          nameZh: '离物体较远的手电筒',
          nameEn: 'Flashlight farther from the object',
          actual: 'small'
        }
      ],
      variable: {
        id: 'light-distance',
        nameZh: '光源距离',
        nameEn: 'Light-source distance',
        testItem: {
          id: 'same-object-screen',
          emoji: '🧸',
          nameZh: '同一个物体和屏幕',
          nameEn: 'The same object and screen'
        },
        options: [
          {
            id: 'far',
            nameZh: '光源较远',
            nameEn: 'Light farther away',
            actual: 'small',
            resultZh: '光源较远时，屏幕上的影子较小。',
            resultEn: 'With the light farther away, the shadow on the screen was smaller.'
          },
          {
            id: 'near',
            nameZh: '光源靠近',
            nameEn: 'Light closer',
            actual: 'large',
            resultZh: '光源靠近物体时，屏幕上的影子变大了。',
            resultEn: 'When the light moved closer to the object, the shadow became larger.'
          }
        ]
      },
      evidenceOptions: [
        {
          id: 'observed-far-small',
          nameZh: '光源较远时，影子较小',
          nameEn: 'The shadow was smaller when the light was farther away',
          source: 'observation',
          relevant: true
        },
        {
          id: 'observed-near-large',
          nameZh: '光源靠近后，影子变大',
          nameEn: 'The shadow became larger after the light moved closer',
          source: 'variable_test',
          relevant: true
        },
        {
          id: 'same-object-screen',
          nameZh: '两次测试使用同一个物体和同一个屏幕',
          nameEn: 'Both tests used the same object and the same screen',
          source: 'variable_test',
          relevant: true
        },
        {
          id: 'flashlight-color',
          nameZh: '手电筒是黄色的',
          nameEn: 'The flashlight is yellow',
          source: 'appearance',
          relevant: false
        }
      ],
      explanationOptions: [
        {
          id: 'distance-affects-shadow-size',
          nameZh: '保持物体和屏幕不变时，光源距离会影响影子大小',
          nameEn: 'When the object and screen stay fixed, light-source distance affects shadow size',
          correct: true
        },
        {
          id: 'color-affects-shadow',
          nameZh: '因为黄色手电筒会产生更大的影子',
          nameEn: 'Because a yellow flashlight makes a larger shadow',
          correct: false
        },
        {
          id: 'object-changed',
          nameZh: '因为第二次换了一个更大的物体',
          nameEn: 'Because a larger object was used in the second test',
          correct: false
        }
      ]
    };
  }

  // K1 Experimentation: choose an action that directly tests the question.
  function k1ChooseTestActionPuzzle(template) {
    var sourceOptions = [
      {
        zh: '把同一个小球分别放到高斜坡和低斜坡上，看看滚到哪里',
        en: 'Put the same ball on the high and low ramps and observe where it stops',
        role: 'direct_test'
      },
      {
        zh: '给两个斜坡涂上不同颜色',
        en: 'Paint the two ramps different colors',
        role: 'irrelevant_action'
      },
      {
        zh: '问一问大家最喜欢哪个斜坡',
        en: 'Ask everyone which ramp they like best',
        role: 'preference'
      },
      {
        zh: '只看着小球，不把它放到斜坡上',
        en: 'Look at the ball without putting it on either ramp',
        role: 'no_test'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    return {
      type: 'choose_test_action_puzzle',
      templateId: template.id,
      promptZh: '小明想知道高斜坡和低斜坡中，哪一个会让小球滚得更远。他应该怎样试一试？',
      promptEn: 'Ming wants to find out whether the high or low ramp makes a ball roll farther. What should he try?',
      voiceZh: '哪一个动作可以真正测试小球在哪个斜坡上滚得更远？',
      voiceEn: 'Which action would really test which ramp makes the ball roll farther?',
      textOptions: order.map(function (index) {
        return {
          zh: sourceOptions[index].zh,
          en: sourceOptions[index].en,
          experimentRole: sourceOptions[index].role
        };
      }),
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '选择一个真正使用两个斜坡，并能看到滚动结果的动作。',
      hintEn: 'Choose an action that uses both ramps and lets you observe the rolling results.'
    };
  }

  // K2 Experimentation: keep the comparison object the same while changing
  // only the condition named in the question.
  function k2SameObjectComparisonPuzzle(template) {
    var sourceOptions = [
      {
        zh: '用同一个冰块，先放在阳光下观察，再用相同大小的冰块放在阴凉处观察',
        en: 'Observe equal ice cubes, placing one in sunlight and one in shade',
        role: 'fair_comparison'
      },
      {
        zh: '把大冰块放在阴凉处，小冰块放在阳光下',
        en: 'Put a large ice cube in shade and a small ice cube in sunlight',
        role: 'object_changed'
      },
      {
        zh: '把冰块放在阳光下，再换成一块巧克力放在阴凉处',
        en: 'Put an ice cube in sunlight and then put chocolate in shade',
        role: 'material_changed'
      },
      {
        zh: '只观察阳光下的一块冰块',
        en: 'Observe only one ice cube in sunlight',
        role: 'no_comparison'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    return {
      type: 'same_object_comparison_puzzle',
      templateId: template.id,
      promptZh: '要研究阳光和阴凉是否会影响冰块融化速度，哪一种测试方法最合适？',
      promptEn: 'To investigate whether sunlight and shade affect how quickly ice melts, which test is most suitable?',
      voiceZh: '哪一种测试只改变阳光和阴凉，并保持冰块条件相同？',
      voiceEn: 'Which test changes sunlight and shade while keeping the ice-cube conditions the same?',
      textOptions: order.map(function (index) {
        return {
          zh: sourceOptions[index].zh,
          en: sourceOptions[index].en,
          experimentRole: sourceOptions[index].role
        };
      }),
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '公平比较要使用相同条件的冰块，只改变要研究的环境。',
      hintEn: 'A fair comparison uses equal ice cubes and changes only the environment being studied.'
    };
  }

  // Activity: identify the changed variable and controlled conditions
  // before running a two-condition ramp comparison.
  function rampControlActivity(template) {
    return {
      type: 'ramp_control_activity',
      templateId: template.id,
      emoji: '🔵',
      changePromptZh: '要研究斜坡高度是否影响滚动距离，哪一个条件应该改变？',
      changePromptEn: 'To study whether ramp height affects rolling distance, which condition should change?',
      changeOptions: [
        { id: 'ramp-height', nameZh: '斜坡高度', nameEn: 'Ramp height' },
        { id: 'ball', nameZh: '小球', nameEn: 'Ball' },
        { id: 'surface', nameZh: '地面', nameEn: 'Surface' }
      ],
      correctChangeId: 'ramp-height',
      controlPromptZh: '哪些条件应该在两次测试中保持相同？（可多选）',
      controlPromptEn: 'Which conditions should stay the same in both tests? (select all)',
      controlOptions: [
        { id: 'ball', nameZh: '同一个小球', nameEn: 'The same ball' },
        { id: 'surface', nameZh: '相同的地面', nameEn: 'The same surface' },
        { id: 'ramp-height', nameZh: '相同的斜坡高度', nameEn: 'The same ramp height' }
      ],
      correctControlIds: ['ball', 'surface'],
      results: [
        {
          id: 'low',
          actual: 'short',
          resultZh: '低斜坡：小球停得较近',
          resultEn: 'Low ramp: the ball stopped nearer'
        },
        {
          id: 'high',
          actual: 'far',
          resultZh: '高斜坡：小球滚得更远',
          resultEn: 'High ramp: the ball rolled farther'
        }
      ],
      conclusionZh: '只改变斜坡高度并保持小球和地面相同，结果才可以公平比较。',
      conclusionEn: 'Changing only ramp height while keeping the ball and surface the same makes the comparison fair.'
    };
  }

  // Activity: design a fair shadow-size comparison by changing only
  // light distance while keeping the object, screen, and flashlight fixed.
  function shadowControlActivity(template) {
    return {
      type: 'shadow_control_activity',
      templateId: template.id,
      emoji: '🔦',
      changePromptZh: '要研究光源距离是否影响影子大小，哪一个条件应该改变？',
      changePromptEn: 'To study whether light distance affects shadow size, which condition should change?',
      changeOptions: [
        { id: 'light-distance', nameZh: '光源距离', nameEn: 'Light distance' },
        { id: 'object', nameZh: '物体', nameEn: 'Object' },
        { id: 'screen', nameZh: '屏幕', nameEn: 'Screen' },
        { id: 'flashlight', nameZh: '手电筒', nameEn: 'Flashlight' }
      ],
      correctChangeId: 'light-distance',
      controlPromptZh: '哪些条件应该在两次测试中保持相同？（可多选）',
      controlPromptEn: 'Which conditions should stay the same in both tests? (select all)',
      controlOptions: [
        { id: 'object', nameZh: '同一个物体', nameEn: 'The same object' },
        { id: 'screen', nameZh: '同一个屏幕位置', nameEn: 'The same screen position' },
        { id: 'flashlight', nameZh: '同一个手电筒', nameEn: 'The same flashlight' },
        { id: 'light-distance', nameZh: '相同的光源距离', nameEn: 'The same light distance' }
      ],
      correctControlIds: ['object', 'screen', 'flashlight'],
      results: [
        {
          id: 'far',
          actual: 'small',
          resultZh: '光源较远：屏幕上的影子较小',
          resultEn: 'Light farther away: the shadow on the screen was smaller'
        },
        {
          id: 'near',
          actual: 'large',
          resultZh: '光源靠近：屏幕上的影子变大',
          resultEn: 'Light closer: the shadow on the screen became larger'
        }
      ],
      conclusionZh: '只改变光源距离并保持物体、屏幕和手电筒相同，才能公平比较影子大小。',
      conclusionEn: 'Changing only light distance while keeping the object, screen, and flashlight the same makes the shadow-size comparison fair.'
    };
  }

  // K1 Evidence: identify the result that was actually observed.
  // The task uses a supplied test record rather than prior science knowledge.
  function k1ObservedEvidencePuzzle(template) {
    var sourceOptions = [
      {
        zh: '蓝色小球滚到了远线',
        en: 'The blue ball reached the far line',
        role: 'observed'
      },
      {
        zh: '蓝色小球飞到了空中',
        en: 'The blue ball flew into the air',
        role: 'unsupported'
      },
      {
        zh: '红色小球滚得更远',
        en: 'The red ball rolled farther',
        role: 'not_tested'
      },
      {
        zh: '蓝色小球看起来最好看',
        en: 'The blue ball looked the nicest',
        role: 'opinion'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    return {
      type: 'observed_result_evidence_puzzle',
      templateId: template.id,
      promptZh: '测试记录：把蓝色小球从斜坡上放下，它滚到了远线。哪一句是刚才看到的证据？',
      promptEn: 'Test record: the blue ball rolled down the ramp and reached the far line. Which sentence is evidence from the test?',
      voiceZh: '哪一句是刚才实际看到的证据？',
      voiceEn: 'Which sentence is evidence actually observed in the test?',
      textOptions: order.map(function (index) {
        return {
          zh: sourceOptions[index].zh,
          en: sourceOptions[index].en,
          evidenceRole: sourceOptions[index].role
        };
      }),
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '证据要说出测试中真正发生的事情。',
      hintEn: 'Evidence states what actually happened in the test.'
    };
  }

  // K2 Evidence: select the result that directly supports a simple claim.
  function k2SupportingEvidencePuzzle(template) {
    var sourceOptions = [
      {
        zh: '两次测试中，高斜坡的小球都滚得更远',
        en: 'In both tests, the ball on the higher ramp rolled farther',
        role: 'supporting'
      },
      {
        zh: '小球是蓝色的',
        en: 'The ball was blue',
        role: 'irrelevant'
      },
      {
        zh: '斜坡放在桌子旁边',
        en: 'The ramp was beside the table',
        role: 'irrelevant'
      },
      {
        zh: '我喜欢高斜坡',
        en: 'I like the higher ramp',
        role: 'opinion'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    return {
      type: 'supporting_evidence_puzzle',
      templateId: template.id,
      promptZh: '小明的想法是“斜坡较高时，小球滚得更远”。哪一条测试结果最能支持这个想法？',
      promptEn: 'Ming claims, “The ball rolls farther from a higher ramp.” Which test result best supports the claim?',
      voiceZh: '哪一条测试结果最能支持这个想法？',
      voiceEn: 'Which test result best supports the claim?',
      textOptions: order.map(function (index) {
        return {
          zh: sourceOptions[index].zh,
          en: sourceOptions[index].en,
          evidenceRole: sourceOptions[index].role
        };
      }),
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '选择直接比较两种斜坡测试结果的记录。',
      hintEn: 'Choose the record that directly compares the two ramp-test results.'
    };
  }

  // K1 Explanation: distinguish a description supported by the shown result
  // from guesses, opinions, and statements about events that were not tested.
  function k1ResultExplanationPuzzle(template) {
    var sourceOptions = [
      {
        zh: '磁铁靠近后，回形针移动并贴到了磁铁上',
        en: 'When the magnet came closer, the paperclip moved and stuck to it',
        role: 'supported'
      },
      {
        zh: '回形针最喜欢磁铁',
        en: 'The paperclip likes the magnet best',
        role: 'opinion'
      },
      {
        zh: '所有东西都会被磁铁吸住',
        en: 'Everything will be attracted by a magnet',
        role: 'overgeneralized'
      },
      {
        zh: '回形针变成了磁铁',
        en: 'The paperclip turned into a magnet',
        role: 'unsupported'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    return {
      type: 'result_explanation_puzzle',
      templateId: template.id,
      promptZh: '观察记录：磁铁靠近回形针后，回形针移动并贴到了磁铁上。哪一句最符合刚才的结果？',
      promptEn: 'Observation record: when the magnet moved closer, the paperclip moved and stuck to it. Which sentence best matches the result?',
      voiceZh: '哪一句最符合刚才观察到的结果？',
      voiceEn: 'Which sentence best matches the observed result?',
      textOptions: order.map(function (index) {
        return {
          zh: sourceOptions[index].zh,
          en: sourceOptions[index].en,
          explanationRole: sourceOptions[index].role
        };
      }),
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '解释要符合刚才的观察，不要加入没有测试过的想法。',
      hintEn: 'An explanation should match the observation without adding untested ideas.'
    };
  }

  // K2 Explanation: connect a simple claim to the supplied comparison result.
  function k2EvidenceExplanationPuzzle(template) {
    var sourceOptions = [
      {
        zh: '同一个冰块在阳光下融化得更快，说明较暖的条件会让它更快融化',
        en: 'The same ice cube melted faster in sunlight, showing that the warmer condition made it melt faster',
        role: 'claim_evidence'
      },
      {
        zh: '阳光下的盘子颜色更好看',
        en: 'The plate in sunlight had a nicer color',
        role: 'opinion'
      },
      {
        zh: '因为冰块想变成水',
        en: 'Because the ice cube wanted to become water',
        role: 'unsupported_reason'
      },
      {
        zh: '两个冰块融化得一样快',
        en: 'The two ice cubes melted at the same speed',
        role: 'contradicted'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    return {
      type: 'evidence_explanation_puzzle',
      templateId: template.id,
      promptZh: '公平测试记录：两个同样大小的冰块，一个放在阳光下，一个放在阴凉处。阳光下的冰块先融化。哪一个解释同时使用了结果和理由？',
      promptEn: 'Fair-test record: two equal ice cubes were placed in sunlight and shade. The ice cube in sunlight melted first. Which explanation uses both the result and a reason?',
      voiceZh: '哪一个解释同时使用了测试结果和理由？',
      voiceEn: 'Which explanation uses both the test result and a reason?',
      textOptions: order.map(function (index) {
        return {
          zh: sourceOptions[index].zh,
          en: sourceOptions[index].en,
          explanationRole: sourceOptions[index].role
        };
      }),
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '完整解释要引用测试结果，并说明结果怎样支持想法。',
      hintEn: 'A complete explanation cites the test result and says how it supports the idea.'
    };
  }

  // G1 Evidence: distinguish a repeatable comparison pattern from a
  // single result, an irrelevant detail, and a personal preference.
  function g1RepeatedEvidencePuzzle(template) {
    var sourceOptions = [
      {
        zh: '三次公平测试中，高斜坡上的同一个小球每次都滚得更远',
        en: 'In three fair tests, the same ball rolled farther from the higher ramp every time',
        role: 'repeated_support'
      },
      {
        zh: '第一次低斜坡测试中，小球停在近线',
        en: 'In the first low-ramp test, the ball stopped at the near line',
        role: 'single_result'
      },
      {
        zh: '测试使用的是蓝色小球',
        en: 'The test used a blue ball',
        role: 'irrelevant'
      },
      {
        zh: '我觉得高斜坡更有趣',
        en: 'I think the higher ramp is more fun',
        role: 'opinion'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    return {
      type: 'repeated_evidence_puzzle',
      templateId: template.id,
      promptZh: '小明想判断“斜坡较高时，小球通常滚得更远”。哪一条记录是最有力的证据？',
      promptEn: 'Ming wants to decide whether a ball usually rolls farther from a higher ramp. Which record is the strongest evidence?',
      voiceZh: '哪一条重复测试记录是最有力的证据？',
      voiceEn: 'Which repeated-test record is the strongest evidence?',
      textOptions: order.map(function (index) {
        return {
          zh: sourceOptions[index].zh,
          en: sourceOptions[index].en,
          evidenceRole: sourceOptions[index].role
        };
      }),
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '优先选择来自多次公平比较、并且结果一致的记录。',
      hintEn: 'Prefer a record from repeated fair comparisons with consistent results.'
    };
  }

  // G1 Explanation: select a claim that connects the changed condition to
  // the repeated result without adding an unsupported cause.
  function g1PatternExplanationPuzzle(template) {
    var sourceOptions = [
      {
        zh: '两组幼苗的种类和水量相同，照光较久的一组连续三天长得更多，所以照光时间可能影响生长',
        en: 'The seedlings and water were the same, and the group with more light grew more on all three days, so light time may affect growth',
        role: 'supported_pattern'
      },
      {
        zh: '照光较久的幼苗长得更多，因为它们更喜欢阳光',
        en: 'The seedlings with more light grew more because they liked sunlight better',
        role: 'unsupported_reason'
      },
      {
        zh: '红色花盆让幼苗长得更多',
        en: 'The red pot made the seedlings grow more',
        role: 'irrelevant'
      },
      {
        zh: '两组幼苗的生长结果完全相同',
        en: 'Both groups of seedlings had exactly the same growth result',
        role: 'contradicted'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    return {
      type: 'pattern_explanation_puzzle',
      templateId: template.id,
      promptZh: '公平测试记录：同种幼苗得到相同水量，一组每天照光6小时，另一组每天照光2小时。连续三天，照光6小时的一组每天都长得更多。哪一个解释最符合证据？',
      promptEn: 'Fair-test record: the same kind of seedlings received equal water. One group had 6 hours of light each day and the other had 2 hours. For three days, the 6-hour group grew more each day. Which explanation best matches the evidence?',
      voiceZh: '哪一个解释把改变的条件和重复出现的结果联系起来？',
      voiceEn: 'Which explanation connects the changed condition with the repeated result?',
      textOptions: order.map(function (index) {
        return {
          zh: sourceOptions[index].zh,
          en: sourceOptions[index].en,
          explanationRole: sourceOptions[index].role
        };
      }),
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '选择同时说明公平比较、重复结果和谨慎结论的解释。',
      hintEn: 'Choose the explanation that includes the fair comparison, repeated result, and a careful conclusion.'
    };
  }

  // K1 comparison-observation benchmark: texture-test results are given
  // explicitly, so the child compares recorded evidence instead of relying on
  // prior knowledge about how familiar objects feel.
  function observeOddOnePuzzle(template) {
    var sourceOptions = [
      {
        zh: '海绵的测试结果和其他三个不同',
        en: 'The sponge test result was different from the other three',
        role: 'observed'
      },
      {
        zh: '石头的测试结果和其他三个不同',
        en: 'The rock test result was different from the other three',
        role: 'reversed'
      },
      {
        zh: '四个物体的测试结果完全相同',
        en: 'All four objects had exactly the same test result',
        role: 'unsupported'
      },
      {
        zh: '因为海绵是黄色的，所以它最软',
        en: 'The sponge was softest because it was yellow',
        role: 'appearance_guess'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    var textOptions = order.map(function (index) {
      var option = sourceOptions[index];
      return { zh: option.zh, en: option.en, observationRole: option.role };
    });
    return {
      type: 'texture_result_observation_puzzle',
      templateId: template.id,
      promptZh: '按压测试记录：石头、钥匙和砖头都没有明显变形，海绵被压扁了。哪一句准确比较了测试结果？',
      promptEn: 'Press-test record: the rock, key, and brick did not visibly change shape, while the sponge was compressed. Which sentence accurately compares the results?',
      voiceZh: '哪一句准确比较了按压测试的结果？',
      voiceEn: 'Which sentence accurately compares the press-test results?',
      textOptions: textOptions,
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '比较题目给出的按压结果，不要根据颜色猜测。',
      hintEn: 'Compare the stated press-test results, not the objects colors.'
    };
  }

  // K2 observation benchmark: compare explicitly supplied before/after
  // results and choose a precise description of the observed material change.
  function matterDescribePuzzle(template) {
    var sourceOptions = [
      {
        zh: '冰块变小了，盘子里的水变多了',
        en: 'The ice cube became smaller and there was more water on the plate',
        role: 'observed'
      },
      {
        zh: '冰块变大了，盘子里的水变少了',
        en: 'The ice cube became larger and there was less water on the plate',
        role: 'reversed'
      },
      {
        zh: '冰块和盘子都没有变化',
        en: 'Neither the ice cube nor the plate changed',
        role: 'unsupported'
      },
      {
        zh: '因为盘子是蓝色的，所以冰块变小了',
        en: 'The ice cube became smaller because the plate was blue',
        role: 'appearance_guess'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    var textOptions = order.map(function (index) {
      var option = sourceOptions[index];
      return { zh: option.zh, en: option.en, observationRole: option.role };
    });
    return {
      type: 'matter_change_observation_puzzle',
      templateId: template.id,
      promptZh: '观察记录：开始时盘子里有一块大冰块；十分钟后冰块变小，盘子里的水变多。哪一句准确描述了变化？',
      promptEn: 'Observation record: at first there was a large ice cube on a plate. Ten minutes later the cube was smaller and there was more water. Which sentence accurately describes the change?',
      voiceZh: '哪一句准确描述了观察到的变化？',
      voiceEn: 'Which sentence accurately describes the observed change?',
      textOptions: textOptions,
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '比较开始和十分钟后的记录，只描述实际发生的变化。',
      hintEn: 'Compare the records from the start and ten minutes later, and describe only the observed change.'
    };
  }

  // K2 life observation benchmark: compare repeated measurements and
  // distinguish a recorded growth pattern from unsupported explanations.
  function lifeDescribePuzzle(template) {
    var sourceOptions = [
      {
        zh: '幼苗每天都比前一天高一些',
        en: 'The seedling was a little taller each day',
        role: 'observed'
      },
      {
        zh: '幼苗每天都比前一天矮一些',
        en: 'The seedling was shorter each day',
        role: 'reversed'
      },
      {
        zh: '幼苗三天的高度完全相同',
        en: 'The seedling had exactly the same height on all three days',
        role: 'unsupported'
      },
      {
        zh: '因为花盆是红色的，所以幼苗长高了',
        en: 'The seedling grew taller because the pot was red',
        role: 'appearance_guess'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    var textOptions = order.map(function (index) {
      var option = sourceOptions[index];
      return { zh: option.zh, en: option.en, observationRole: option.role };
    });
    return {
      type: 'life_growth_observation_puzzle',
      templateId: template.id,
      promptZh: '同一株幼苗的记录是：第一天2格高，第二天3格高，第三天4格高。哪一句准确描述了观察结果？',
      promptEn: 'The same seedling was recorded as 2 spaces tall on day one, 3 spaces on day two, and 4 spaces on day three. Which sentence accurately describes the observation?',
      voiceZh: '哪一句准确描述了幼苗三天的变化？',
      voiceEn: 'Which sentence accurately describes the seedling change across the three days?',
      textOptions: textOptions,
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '按照每天记录的高度比较变化，不要根据花盆颜色猜原因。',
      hintEn: 'Compare the recorded height each day, and do not guess a cause from the pot color.'
    };
  }

  // G1 Observation: identify a pattern across repeated measurements without
  // adding a causal claim that the records do not establish.
  function g1MeasurementPatternPuzzle(template) {
    var sourceOptions = [
      {
        zh: '水温从20度升到30度再升到40度时，糖完全溶解所需时间从8分钟降到5分钟再降到3分钟',
        en: 'As water temperature rose from 20 to 30 to 40 degrees, the time for the sugar to dissolve fell from 8 to 5 to 3 minutes',
        role: 'measured_pattern'
      },
      {
        zh: '水温越高，糖溶解所需时间越长',
        en: 'As water temperature increased, the sugar took longer to dissolve',
        role: 'reversed'
      },
      {
        zh: '三次测试中糖溶解所需时间完全相同',
        en: 'The sugar took exactly the same time to dissolve in all three tests',
        role: 'contradicted'
      },
      {
        zh: '糖溶解得更快是因为杯子最好看',
        en: 'The sugar dissolved faster because the cup looked nicest',
        role: 'unsupported_cause'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    return {
      type: 'measurement_pattern_observation_puzzle',
      templateId: template.id,
      promptZh: '测量记录：20度水中糖用8分钟溶解，30度水中用5分钟，40度水中用3分钟。哪一句准确描述了记录中的变化？',
      promptEn: 'Measurement record: sugar dissolved in 8 minutes at 20 degrees, 5 minutes at 30 degrees, and 3 minutes at 40 degrees. Which sentence accurately describes the recorded change?',
      voiceZh: '哪一句准确描述了三次测量中的变化？',
      voiceEn: 'Which sentence accurately describes the change across the three measurements?',
      textOptions: order.map(function (index) {
        return {
          zh: sourceOptions[index].zh,
          en: sourceOptions[index].en,
          observationRole: sourceOptions[index].role
        };
      }),
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '按照温度和时间记录描述变化，不要添加记录中没有验证的原因。',
      hintEn: 'Describe the temperature and time pattern without adding an untested cause.'
    };
  }

  // G2 Observation: compare two data series and distinguish the observed
  // relationship from a reversed statement or an unsupported explanation.
  function g2DataRelationshipPuzzle(template) {
    var sourceOptions = [
      {
        zh: '在三次测试中，光源距离依次变近时，影子宽度依次增大',
        en: 'Across the three tests, the shadow width increased as the light was moved closer',
        role: 'data_relationship'
      },
      {
        zh: '光源越靠近，影子宽度越小',
        en: 'The closer the light moved, the smaller the shadow became',
        role: 'reversed'
      },
      {
        zh: '三次测试的影子宽度没有变化',
        en: 'The shadow width did not change across the three tests',
        role: 'contradicted'
      },
      {
        zh: '影子变大是因为手电筒是黄色的',
        en: 'The shadow became larger because the flashlight was yellow',
        role: 'unsupported_cause'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    return {
      type: 'data_relationship_observation_puzzle',
      templateId: template.id,
      promptZh: '记录表：光源距离物体60厘米时影子宽4格，40厘米时宽6格，20厘米时宽9格。哪一句最准确地概括了数据关系？',
      promptEn: 'Data table: the shadow was 4 spaces wide at 60 cm, 6 spaces at 40 cm, and 9 spaces at 20 cm. Which sentence most accurately summarizes the data relationship?',
      voiceZh: '哪一句最准确地概括了光源距离和影子宽度的关系？',
      voiceEn: 'Which sentence most accurately summarizes the relationship between light distance and shadow width?',
      textOptions: order.map(function (index) {
        return {
          zh: sourceOptions[index].zh,
          en: sourceOptions[index].en,
          observationRole: sourceOptions[index].role
        };
      }),
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '比较每次记录的光源距离和影子宽度，只概括数据实际显示的关系。',
      hintEn: 'Compare the recorded light distance and shadow width, and summarize only the relationship shown by the data.'
    };
  }

  // K2 Prediction: use one supplied observation to predict the result of
  // repeating the same test, without treating an incorrect prediction as a
  // failure of the wider scientific process.
  function k2RepeatObservationPredictionPuzzle(template) {
    var sourceOptions = [
      {
        zh: '新的相同冰块在阳光下可能也会比阴凉处的先融化',
        en: 'A new equal ice cube in sunlight may also melt before one in the shade',
        role: 'supported'
      },
      {
        zh: '阴凉处的冰块一定先融化',
        en: 'The ice cube in the shade will definitely melt first',
        role: 'opposite'
      },
      {
        zh: '蓝色盘子里的冰块一定先融化',
        en: 'The ice cube on the blue plate will definitely melt first',
        role: 'irrelevant'
      },
      {
        zh: '两个冰块会飞起来',
        en: 'Both ice cubes will fly into the air',
        role: 'unsupported'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    return {
      type: 'repeat_observation_prediction_puzzle',
      templateId: template.id,
      promptZh: '第一次测试中，两个同样大小的冰块分别放在阳光下和阴凉处，阳光下的先融化。用两个新的相同冰块重复测试，你预测会怎样？',
      promptEn: 'In the first test, two equal ice cubes were placed in sunlight and shade, and the one in sunlight melted first. What do you predict when the test is repeated with two new equal ice cubes?',
      voiceZh: '根据第一次观察，你预测重复测试会出现什么结果？',
      voiceEn: 'Based on the first observation, what do you predict will happen in the repeated test?',
      textOptions: order.map(function (index) {
        return {
          zh: sourceOptions[index].zh,
          en: sourceOptions[index].en,
          predictionRole: sourceOptions[index].role
        };
      }),
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '使用第一次测试真正观察到的结果，并用“可能”表达预测。',
      hintEn: 'Use the observed result from the first test and express the prediction as a possibility.'
    };
  }

  // G2 Prediction: extrapolate a measured relationship to a new condition
  // while keeping the conclusion appropriately cautious.
  function g2DataTrendPredictionPuzzle(template) {
    var sourceOptions = [
      {
        zh: '在更近的10厘米处，影子可能比20厘米时更宽',
        en: 'At the closer distance of 10 cm, the shadow may be wider than it was at 20 cm',
        role: 'trend_supported'
      },
      {
        zh: '在10厘米处，影子一定比20厘米时更窄',
        en: 'At 10 cm, the shadow will definitely be narrower than it was at 20 cm',
        role: 'reversed'
      },
      {
        zh: '因为手电筒是黄色的，影子会消失',
        en: 'The shadow will disappear because the flashlight is yellow',
        role: 'irrelevant'
      },
      {
        zh: '这些测量结果不能用于作出任何预测',
        en: 'These measurements cannot be used to make any prediction',
        role: 'ignores_evidence'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    return {
      type: 'data_trend_prediction_puzzle',
      templateId: template.id,
      promptZh: '测量记录：光源距离物体60厘米时影子宽4格，40厘米时宽6格，20厘米时宽9格。如果把同一个光源移到10厘米处，你预测影子会怎样？',
      promptEn: 'Measurement record: the shadow was 4 spaces wide at 60 cm, 6 spaces at 40 cm, and 9 spaces at 20 cm. What do you predict if the same light is moved to 10 cm?',
      voiceZh: '根据三次测量的数据趋势，你预测10厘米处的影子会怎样？',
      voiceEn: 'Based on the trend across the three measurements, what do you predict for the shadow at 10 cm?',
      textOptions: order.map(function (index) {
        return {
          zh: sourceOptions[index].zh,
          en: sourceOptions[index].en,
          predictionRole: sourceOptions[index].role
        };
      }),
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '先比较距离和影子宽度的变化方向，再把这个关系用于新条件。',
      hintEn: 'Compare how distance and shadow width changed, then apply that relationship to the new condition.'
    };
  }

  // G1 motion prediction benchmark: use results from two controlled tests
  // to predict a new rolling outcome. This tests evidence-based transfer rather
  // than the common-sense fact that round objects can roll.
  function motionRollPuzzle(template) {
    var sourceOptions = [
      {
        zh: '在更光滑的地面上会滚得更远',
        en: 'It will roll farther on the smoother surface',
        role: 'supported'
      },
      {
        zh: '在更光滑的地面上会滚得更近',
        en: 'It will roll a shorter distance on the smoother surface',
        role: 'opposite'
      },
      {
        zh: '因为小球是蓝色的，所以两次一样远',
        en: 'It will travel the same distance because the ball is blue',
        role: 'irrelevant'
      },
      {
        zh: '只看这些结果还不能判断',
        en: 'These results cannot support any prediction',
        role: 'ignores_evidence'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    var textOptions = order.map(function (index) {
      var option = sourceOptions[index];
      return { zh: option.zh, en: option.en, predictionRole: option.role };
    });
    return {
      type: 'motion_evidence_prediction_puzzle',
      templateId: template.id,
      promptZh: '同一个小球从相同高度滚下：在粗糙地面滚了2格，在光滑地面滚了5格。换一块更光滑的地面，你预测会怎样？',
      promptEn: 'The same ball rolled from the same height: 2 spaces on a rough surface and 5 spaces on a smooth surface. What do you predict on an even smoother surface?',
      voiceZh: '根据两次测试结果，你预测小球在更光滑的地面上会怎样？',
      voiceEn: 'Based on the two test results, what do you predict on an even smoother surface?',
      textOptions: textOptions,
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '比较地面条件和两次滚动距离，再用这个关系预测新情况。',
      hintEn: 'Compare the surface conditions and rolling distances, then use that relationship to predict the new case.'
    };
  }

  // G1 life prediction benchmark: transfer an observed light-growth
  // relationship to a new plant while keeping water and plant type controlled.
  function lifeFlyPuzzle(template) {
    var sourceOptions = [
      {
        zh: '每天照光6小时的幼苗可能长得更高',
        en: 'The seedling with 6 hours of light may grow taller',
        role: 'supported'
      },
      {
        zh: '每天照光1小时的幼苗一定长得更高',
        en: 'The seedling with 1 hour of light will definitely grow taller',
        role: 'opposite'
      },
      {
        zh: '绿色花盆里的幼苗一定长得更高',
        en: 'The seedling in the green pot will definitely grow taller',
        role: 'irrelevant'
      },
      {
        zh: '两株幼苗一定长得完全一样',
        en: 'The two seedlings will definitely grow exactly the same',
        role: 'unsupported'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    var textOptions = order.map(function (index) {
      var option = sourceOptions[index];
      return { zh: option.zh, en: option.en, predictionRole: option.role };
    });
    return {
      type: 'life_evidence_prediction_puzzle',
      templateId: template.id,
      promptZh: '以前的测试中，同种幼苗和相同水量下，每天照光6小时的幼苗比照光1小时的长得高。用两株新幼苗重复测试，你预测会怎样？',
      promptEn: 'In an earlier test with the same kind of seedlings and equal water, the seedling with 6 hours of light grew taller than the one with 1 hour. What do you predict when the test is repeated with two new seedlings?',
      voiceZh: '根据以前的测试结果，你预测新的幼苗会怎样生长？',
      voiceEn: 'Based on the earlier test results, how do you predict the new seedlings will grow?',
      textOptions: textOptions,
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '使用以前观察到的光照和生长关系，不要根据花盆颜色猜测。',
      hintEn: 'Use the observed relationship between light and growth, not the pot color.'
    };
  }

  // K1 Questioning: choose a question that can be answered by trying
  // the shown action and observing what happens.
  function k1TryToFindOutQuestionPuzzle(template) {
    var sourceOptions = [
      {
        zh: '把小球分别放到两个斜坡上，哪一个会滚得更远？',
        en: 'If we put the ball on each ramp, which one will make it roll farther?',
        role: 'testable'
      },
      {
        zh: '哪一个斜坡最好看？',
        en: 'Which ramp looks the nicest?',
        role: 'opinion'
      },
      {
        zh: '小球喜欢哪个斜坡？',
        en: 'Which ramp does the ball like?',
        role: 'unsupported'
      },
      {
        zh: '谁最喜欢玩小球？',
        en: 'Who likes playing with the ball the most?',
        role: 'preference'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    return {
      type: 'try_to_find_out_question_puzzle',
      templateId: template.id,
      promptZh: '桌上有一个高斜坡、一个低斜坡和同一个小球。哪一个问题可以动手试一试来回答？',
      promptEn: 'There is a high ramp, a low ramp, and the same ball. Which question could you answer by trying it?',
      voiceZh: '哪一个问题可以动手试一试来回答？',
      voiceEn: 'Which question could you answer by trying it?',
      textOptions: order.map(function (index) {
        return {
          zh: sourceOptions[index].zh,
          en: sourceOptions[index].en,
          questionRole: sourceOptions[index].role
        };
      }),
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '选择一个可以通过实际操作和观察找到答案的问题。',
      hintEn: 'Choose a question that can be answered by doing a test and observing the result.'
    };
  }

  // K2 Questioning: select a measurable question about one changed condition.
  function k2ObservableChangeQuestionPuzzle(template) {
    var sourceOptions = [
      {
        zh: '手电筒靠近物体后，影子会变大还是变小？',
        en: 'When the flashlight moves closer to the object, does the shadow get larger or smaller?',
        role: 'testable'
      },
      {
        zh: '影子漂不漂亮？',
        en: 'Is the shadow pretty?',
        role: 'opinion'
      },
      {
        zh: '手电筒最喜欢照什么？',
        en: 'What does the flashlight like to shine on?',
        role: 'unsupported'
      },
      {
        zh: '谁画的影子最好看？',
        en: 'Who draws the nicest shadow?',
        role: 'preference'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    return {
      type: 'observable_change_question_puzzle',
      templateId: template.id,
      promptZh: '小美发现移动手电筒时，墙上的影子好像变了。哪一个问题可以通过移动手电筒并观察影子来回答？',
      promptEn: 'Mei notices that the shadow seems to change when she moves the flashlight. Which question could she answer by moving the flashlight and observing the shadow?',
      voiceZh: '哪一个问题可以通过观察影子的变化来回答？',
      voiceEn: 'Which question could be answered by observing how the shadow changes?',
      textOptions: order.map(function (index) {
        return {
          zh: sourceOptions[index].zh,
          en: sourceOptions[index].en,
          questionRole: sourceOptions[index].role
        };
      }),
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '可研究的问题要说明改变什么，以及观察什么结果。',
      hintEn: 'An investigable question identifies what changes and what result to observe.'
    };
  }

  // G1 Questioning: turn an observation into a fair comparison question.
  function g1FairComparisonQuestionPuzzle(template) {
    var sourceOptions = [
      {
        zh: '在水量和幼苗种类相同时，每天照光时间不同会影响幼苗高度吗？',
        en: 'With equal water and the same kind of seedling, does changing daily light time affect seedling height?',
        role: 'fair_test'
      },
      {
        zh: '红色花盆里的幼苗是不是更漂亮？',
        en: 'Is the seedling in the red pot prettier?',
        role: 'opinion'
      },
      {
        zh: '如果同时改变水量、花盆和光照，哪株长得高？',
        en: 'If water, pot, and light all change, which seedling grows taller?',
        role: 'uncontrolled'
      },
      {
        zh: '幼苗喜欢白天还是夜晚？',
        en: 'Do seedlings like daytime or nighttime?',
        role: 'unsupported'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    return {
      type: 'fair_comparison_question_puzzle',
      templateId: template.id,
      promptZh: '两株同种幼苗高度相同。小明想研究每天照光时间是否影响生长。哪一个研究问题最适合做公平比较？',
      promptEn: 'Two seedlings of the same kind start at the same height. Ming wants to investigate whether daily light time affects growth. Which research question supports a fair comparison?',
      voiceZh: '哪一个问题最适合用公平比较来研究？',
      voiceEn: 'Which question is best suited to a fair comparison?',
      textOptions: order.map(function (index) {
        return {
          zh: sourceOptions[index].zh,
          en: sourceOptions[index].en,
          questionRole: sourceOptions[index].role
        };
      }),
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '公平比较只改变要研究的条件，并说明要观察或测量的结果。',
      hintEn: 'A fair-comparison question changes only the condition being studied and identifies the result to observe or measure.'
    };
  }

  // Reusable content-expansion generator. Each template supplies one or more
  // scenario variants, while the generator preserves shuffled answer positions and
  // the template's stable scientific-thinking action.
  function scenarioReasoningPuzzle(template) {
    var scenarios = (template.params && template.params.scenarios) || [];
    if (!scenarios.length) {
      throw new Error('[SciGenerators] scenarioReasoningPuzzle requires scenarios: ' + template.id);
    }
    var scenario = _pick(scenarios);
    var order = _shuffle([0, 1, 2, 3]);
    return {
      type: scenario.type,
      templateId: template.id,
      promptZh: scenario.promptZh,
      promptEn: scenario.promptEn,
      voiceZh: scenario.voiceZh || scenario.promptZh,
      voiceEn: scenario.voiceEn || scenario.promptEn,
      textOptions: order.map(function (index) {
        var option = scenario.options[index];
        return {
          zh: option.zh,
          en: option.en,
          reasoningRole: option.role
        };
      }),
      options: [0, 1, 2, 3],
      answer: order.indexOf(scenario.answer || 0),
      hintZh: scenario.hintZh,
      hintEn: scenario.hintEn
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

  // G2 variable-control benchmark: identify both the variable to change
  // and the conditions that must remain fixed for a fair shadow comparison.
  function shadowVariableControlPuzzle(template) {
    var sourceOptions = [
      {
        id: 'distance-only',
        zh: '只改变手电筒与物体的距离，保持物体、屏幕和手电筒相同',
        en: 'Change only the flashlight distance while keeping the object, screen, and flashlight the same',
        role: 'controlled'
      },
      {
        id: 'distance-and-object',
        zh: '同时改变手电筒距离和物体大小',
        en: 'Change both the flashlight distance and the object size',
        role: 'multiple_variables'
      },
      {
        id: 'object-only',
        zh: '保持手电筒距离相同，只换一个更大的物体',
        en: 'Keep the flashlight distance the same and use a larger object',
        role: 'wrong_variable'
      },
      {
        id: 'everything-changes',
        zh: '每次都换手电筒、物体和屏幕',
        en: 'Use a different flashlight, object, and screen each time',
        role: 'uncontrolled'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    var textOptions = order.map(function (index) {
      var option = sourceOptions[index];
      return {
        zh: option.zh,
        en: option.en,
        controlRole: option.role
      };
    });
    return {
      type: 'shadow_variable_control_puzzle',
      templateId: template.id,
      promptZh: '要研究“光源距离是否影响影子大小”，哪一种测试方法最公平？',
      promptEn: 'To investigate whether light-source distance affects shadow size, which test is the fairest?',
      voiceZh: '哪一种方法只改变光源距离，并保持其他重要条件相同？',
      voiceEn: 'Which method changes only the light distance and keeps the other important conditions the same?',
      textOptions: textOptions,
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '公平比较一次只改变一个要研究的条件。',
      hintEn: 'A fair comparison changes only the condition being investigated.'
    };
  }

  // G2 Evidence benchmark: choose the observation that directly supports
  // the claim. Options include relevant, irrelevant, and insufficient details,
  // so this tests evidence use rather than recall of a science fact.
  function rampEvidencePuzzle(template) {
    var sourceOptions = [
      {
        id: 'high-far',
        zh: '使用同一个小球和相同地面时，高斜坡上的小球滚得更远。',
        en: 'Using the same ball and surface, the ball rolled farther from the higher ramp.',
        role: 'relevant'
      },
      {
        id: 'ball-blue',
        zh: '实验中的小球是蓝色的。',
        en: 'The ball used in the experiment was blue.',
        role: 'irrelevant'
      },
      {
        id: 'one-low-test',
        zh: '小球从低斜坡滚下后停在较近的位置。',
        en: 'The ball stopped nearer after rolling from the low ramp.',
        role: 'insufficient'
      },
      {
        id: 'ramp-wood',
        zh: '斜坡是木头做的。',
        en: 'The ramp was made of wood.',
        role: 'irrelevant'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    var textOptions = order.map(function (index) {
      var option = sourceOptions[index];
      return { zh: option.zh, en: option.en, evidenceRole: option.role };
    });
    return {
      type: 'ramp_evidence_puzzle',
      templateId: template.id,
      promptZh: '哪一条实验结果最能支持“斜坡越高，小球滚得越远”这个判断？',
      promptEn: 'Which experimental result best supports the claim that a higher ramp makes the ball roll farther?',
      voiceZh: '哪一条实验结果最能支持这个判断？',
      voiceEn: 'Which experimental result best supports this claim?',
      textOptions: textOptions,
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '选择来自公平比较、并且直接说明斜坡高度和滚动距离关系的结果。',
      hintEn: 'Choose a result from a fair comparison that directly connects ramp height with rolling distance.'
    };
  }

  // G2 Explanation benchmark: connect a claim to the evidence from a
  // controlled comparison and select the reason that explains the relationship.
  // This is a compact Claim + Evidence + Reason task, not a science-fact recall item.
  function rampExplanationPuzzle(template) {
    var sourceOptions = [
      {
        id: 'height-reason',
        zh: '因为两次测试只改变了斜坡高度，高斜坡时小球滚得更远，所以斜坡高度会影响滚动距离。',
        en: 'Because only ramp height changed and the ball rolled farther from the higher ramp, ramp height affects rolling distance.',
        role: 'supported'
      },
      {
        id: 'color-reason',
        zh: '因为小球是蓝色的，所以它从高斜坡滚得更远。',
        en: 'Because the ball was blue, it rolled farther from the higher ramp.',
        role: 'irrelevant'
      },
      {
        id: 'different-ball-reason',
        zh: '因为高斜坡测试使用了另一个更快的小球。',
        en: 'Because the high-ramp test used a different, faster ball.',
        role: 'contradicted'
      },
      {
        id: 'result-only',
        zh: '高斜坡上的小球滚得更远。',
        en: 'The ball rolled farther from the higher ramp.',
        role: 'insufficient'
      }
    ];
    var order = _shuffle([0, 1, 2, 3]);
    var textOptions = order.map(function (index) {
      var option = sourceOptions[index];
      return { zh: option.zh, en: option.en, explanationRole: option.role };
    });
    return {
      type: 'ramp_explanation_puzzle',
      templateId: template.id,
      promptZh: '实验结论是“斜坡高度会影响小球滚动的距离”。哪一个解释同时使用了实验结果和公平比较？',
      promptEn: 'The claim is that ramp height affects how far the ball rolls. Which explanation uses both the result and the fair comparison?',
      voiceZh: '哪一个解释同时使用了实验结果和公平比较？',
      voiceEn: 'Which explanation uses both the result and the fair comparison?',
      textOptions: textOptions,
      options: [0, 1, 2, 3],
      answer: order.indexOf(0),
      hintZh: '完整解释需要说明改变了什么、观察到什么，以及结果怎样支持结论。',
      hintEn: 'A complete explanation states what changed, what was observed, and how the result supports the claim.'
    };
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
    rampLabExplore:       rampLabExplore,
    shadowChangesExplore: shadowChangesExplore,
    k1ChooseTestActionPuzzle: k1ChooseTestActionPuzzle,
    k2SameObjectComparisonPuzzle: k2SameObjectComparisonPuzzle,
    rampControlActivity:  rampControlActivity,
    shadowControlActivity: shadowControlActivity,
    shadowVariableControlPuzzle: shadowVariableControlPuzzle,
    rampEvidencePuzzle:    rampEvidencePuzzle,
    rampExplanationPuzzle: rampExplanationPuzzle,
    k1ObservedEvidencePuzzle: k1ObservedEvidencePuzzle,
    k2SupportingEvidencePuzzle: k2SupportingEvidencePuzzle,
    k1ResultExplanationPuzzle: k1ResultExplanationPuzzle,
    k2EvidenceExplanationPuzzle: k2EvidenceExplanationPuzzle,
    g1RepeatedEvidencePuzzle: g1RepeatedEvidencePuzzle,
    g1PatternExplanationPuzzle: g1PatternExplanationPuzzle,
    observeOddOnePuzzle:  observeOddOnePuzzle,
    matterDescribePuzzle: matterDescribePuzzle,
    lifeDescribePuzzle:   lifeDescribePuzzle,
    g1MeasurementPatternPuzzle: g1MeasurementPatternPuzzle,
    g2DataRelationshipPuzzle: g2DataRelationshipPuzzle,
    k2RepeatObservationPredictionPuzzle: k2RepeatObservationPredictionPuzzle,
    g2DataTrendPredictionPuzzle: g2DataTrendPredictionPuzzle,
    motionRollPuzzle:     motionRollPuzzle,
    lifeFlyPuzzle:        lifeFlyPuzzle,
    k1TryToFindOutQuestionPuzzle: k1TryToFindOutQuestionPuzzle,
    k2ObservableChangeQuestionPuzzle: k2ObservableChangeQuestionPuzzle,
    g1FairComparisonQuestionPuzzle: g1FairComparisonQuestionPuzzle,
    earthQuestionPuzzle:  earthQuestionPuzzle,
    energyQuestionPuzzle: energyQuestionPuzzle,
    scenarioReasoningPuzzle: scenarioReasoningPuzzle
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
