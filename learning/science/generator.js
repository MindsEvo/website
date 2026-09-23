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

  function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

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

  var Generators = {
    floatSinkPuzzle:  floatSinkPuzzle,
    floatSinkExplore: floatSinkExplore,
    magnetPuzzle:     magnetPuzzle
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
