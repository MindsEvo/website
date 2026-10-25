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
    rampControlActivity:  rampControlActivity,
    shadowVariableControlPuzzle: shadowVariableControlPuzzle,
    rampEvidencePuzzle:    rampEvidencePuzzle,
    rampExplanationPuzzle: rampExplanationPuzzle,
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
