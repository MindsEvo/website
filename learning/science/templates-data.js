/**
 * SCI_TEMPLATES_DATA — global-variable template bank for the Science module.
 * Loaded as a plain <script> (not fetch()) because file:// fetch of JSON is
 * blocked by browsers with no local server running — same reason
 * comparison/templates-data.js uses this pattern instead of templates.json.
 *
 * Architecture-native K1-G2 template bank. It includes Puzzle, guided
 * Activity, and Exploration templates across Matter, Life, Motion, Energy,
 * and Earth contexts. Templates exercise observation, questioning,
 * evidence-based prediction, experimentation, evidence, and explanation.
 */
window.SCI_TEMPLATES_DATA = {
  version: 'v0.2.0',
  module: 'science',
  templates: [
    {
      id: 'sci-k1-puzzle-float-001',
      level: 'K1',
      type: 'matter',
      thinkingUnit: 'observation',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'floatSinkPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-k1-puzzle-magnet-001',
      level: 'K1',
      type: 'matter',
      thinkingUnit: 'observation',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'magnetPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-k1-puzzle-observe-texture-001',
      level: 'K1',
      type: 'matter',
      thinkingUnit: 'observation',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'observeOddOnePuzzle',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-k1-explore-float-001',
      level: 'K1',
      type: 'matter',
      thinkingUnit: 'prediction',
      runtime: 'explore',
      difficulty: 1,
      generator: 'floatSinkExplore',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.PREDICTION.BASIC',
        'RG.SCIENCE.EXPERIMENTATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC',
        'RG.SCIENCE.EXPLANATION.BASIC'
      ],
      mastery: { requiredCorrect: 1, window: 1 },
      cooldown: { correct: 20, familiar: 20, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-k1-explore-magnet-001',
      level: 'K1',
      type: 'matter',
      thinkingUnit: 'prediction',
      runtime: 'explore',
      difficulty: 1,
      generator: 'magnetExplore',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.PREDICTION.BASIC',
        'RG.SCIENCE.EXPERIMENTATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC',
        'RG.SCIENCE.EXPLANATION.BASIC'
      ],
      mastery: { requiredCorrect: 1, window: 1 },
      cooldown: { correct: 20, familiar: 20, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-k2-puzzle-matter-describe-001',
      level: 'K2',
      type: 'matter',
      thinkingUnit: 'observation',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'matterDescribePuzzle',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-k2-puzzle-life-describe-001',
      level: 'K2',
      type: 'life',
      thinkingUnit: 'observation',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'lifeDescribePuzzle',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-k1-puzzle-try-question-001',
      level: 'K1',
      type: 'motion',
      thinkingUnit: 'questioning',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'k1TryToFindOutQuestionPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.QUESTIONING.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-k2-puzzle-observable-question-001',
      level: 'K2',
      type: 'energy',
      thinkingUnit: 'questioning',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'k2ObservableChangeQuestionPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.QUESTIONING.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g1-puzzle-fair-question-001',
      level: 'G1',
      type: 'life',
      thinkingUnit: 'questioning',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'g1FairComparisonQuestionPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.QUESTIONING.BASIC',
        'RG.SCIENCE.EXPERIMENTATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-k1-puzzle-observed-evidence-001',
      level: 'K1',
      type: 'motion',
      thinkingUnit: 'evidence',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'k1ObservedEvidencePuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EVIDENCE.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-k2-puzzle-supporting-evidence-001',
      level: 'K2',
      type: 'motion',
      thinkingUnit: 'evidence',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'k2SupportingEvidencePuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EVIDENCE.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-k1-puzzle-result-explanation-001',
      level: 'K1',
      type: 'matter',
      thinkingUnit: 'explanation',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'k1ResultExplanationPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EXPLANATION.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-k2-puzzle-evidence-explanation-001',
      level: 'K2',
      type: 'energy',
      thinkingUnit: 'explanation',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'k2EvidenceExplanationPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EXPLANATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC',
        'RG.SCIENCE.EXPERIMENTATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g1-puzzle-repeated-evidence-001',
      level: 'G1',
      type: 'motion',
      thinkingUnit: 'evidence',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'g1RepeatedEvidencePuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EVIDENCE.BASIC',
        'RG.SCIENCE.EXPERIMENTATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g1-puzzle-pattern-explanation-001',
      level: 'G1',
      type: 'life',
      thinkingUnit: 'explanation',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'g1PatternExplanationPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EXPLANATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC',
        'RG.SCIENCE.EXPERIMENTATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g1-puzzle-measurement-pattern-001',
      level: 'G1',
      type: 'matter',
      thinkingUnit: 'observation',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'g1MeasurementPatternPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g2-puzzle-data-relationship-001',
      level: 'G2',
      type: 'energy',
      thinkingUnit: 'observation',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'g2DataRelationshipPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 8, familiar: 12, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-k2-puzzle-repeat-prediction-001',
      level: 'K2',
      type: 'energy',
      thinkingUnit: 'prediction',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'k2RepeatObservationPredictionPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.PREDICTION.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g2-puzzle-data-trend-prediction-001',
      level: 'G2',
      type: 'energy',
      thinkingUnit: 'prediction',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'g2DataTrendPredictionPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.PREDICTION.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 8, familiar: 12, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-k1-puzzle-choose-test-action-001',
      level: 'K1',
      type: 'motion',
      thinkingUnit: 'experimentation',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'k1ChooseTestActionPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EXPERIMENTATION.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-k2-puzzle-same-object-comparison-001',
      level: 'K2',
      type: 'energy',
      thinkingUnit: 'experimentation',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'k2SameObjectComparisonPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EXPERIMENTATION.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g1-puzzle-observe-evaporation-002',
      level: 'G1',
      type: 'earth',
      thinkingUnit: 'observation',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'earth_measurement_observation_puzzle',
          promptZh: '同一个浅盘中的水连续三天记录为8格、6格、4格。哪一句只描述了记录中看到的变化？',
          promptEn: 'Water in the same shallow tray measured 8, 6, and 4 spaces across three days. Which sentence only describes the recorded change?',
          options: [
            { zh: '盘中的水每天都变少', en: 'The amount of water in the tray decreased each day', role: 'observed_pattern' },
            { zh: '盘中的水每天都变多', en: 'The amount of water increased each day', role: 'reversed' },
            { zh: '三天的水量完全相同', en: 'The water amount was exactly the same each day', role: 'contradicted' },
            { zh: '水变少是因为浅盘不喜欢水', en: 'The water decreased because the tray did not like water', role: 'unsupported_cause' }
          ],
          hintZh: '只比较三天的测量记录，不添加没有测试的原因。',
          hintEn: 'Compare the three measurements without adding an untested cause.'
        }]
      }
    },
    {
      id: 'sci-g2-puzzle-observe-two-series-002',
      level: 'G2',
      type: 'life',
      thinkingUnit: 'observation',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 8, familiar: 12, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'two_series_observation_puzzle',
          promptZh: '两组同种幼苗每天得到相同水量。A组高度为2、4、6格，B组为2、3、4格。哪一句准确概括记录？',
          promptEn: 'Two groups of the same seedlings received equal water. Group A measured 2, 4, and 6 spaces; group B measured 2, 3, and 4. Which statement accurately summarizes the records?',
          options: [
            { zh: '两组都长高了，A组每天增加得更多', en: 'Both groups grew, and group A increased more each day', role: 'data_comparison' },
            { zh: 'A组每天变矮，B组每天长高', en: 'Group A became shorter while group B grew taller', role: 'reversed' },
            { zh: '两组每天高度完全相同', en: 'Both groups had exactly the same height each day', role: 'contradicted' },
            { zh: 'A组长得更多是因为花盆更漂亮', en: 'Group A grew more because its pot was prettier', role: 'unsupported_cause' }
          ],
          hintZh: '分别比较两组每天的高度变化。',
          hintEn: 'Compare the daily height changes in both groups.'
        }]
      }
    },
    {
      id: 'sci-k1-puzzle-question-melting-002',
      level: 'K1',
      type: 'matter',
      thinkingUnit: 'questioning',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.QUESTIONING.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'simple_testable_question_puzzle',
          promptZh: '桌上有两块同样大小的冰块，一块放在阳光下，一块放在阴凉处。哪个问题可以通过观察来回答？',
          promptEn: 'Two equal ice cubes are placed in sunlight and shade. Which question can be answered by observing them?',
          options: [
            { zh: '哪一块冰先融化？', en: 'Which ice cube melts first?', role: 'testable' },
            { zh: '哪一块冰更漂亮？', en: 'Which ice cube is prettier?', role: 'opinion' },
            { zh: '冰块喜欢阳光吗？', en: 'Does the ice cube like sunlight?', role: 'unsupported' },
            { zh: '谁最喜欢冰块？', en: 'Who likes ice cubes most?', role: 'preference' }
          ],
          hintZh: '选择能通过看见实际变化得到答案的问题。',
          hintEn: 'Choose a question answered by observing an actual change.'
        }]
      }
    },
    {
      id: 'sci-k2-puzzle-question-magnet-distance-002',
      level: 'K2',
      type: 'energy',
      thinkingUnit: 'questioning',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.QUESTIONING.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'changed_condition_question_puzzle',
          promptZh: '小明发现磁铁靠近时回形针会移动。哪一个问题说明了要改变什么和观察什么？',
          promptEn: 'Ming notices that a paperclip moves when a magnet comes close. Which question states what to change and what to observe?',
          options: [
            { zh: '改变磁铁距离时，回形针是否会移动？', en: 'When magnet distance changes, does the paperclip move?', role: 'testable_variable_result' },
            { zh: '磁铁的颜色好看吗？', en: 'Does the magnet have a nice color?', role: 'opinion' },
            { zh: '回形针最喜欢谁？', en: 'Who does the paperclip like most?', role: 'unsupported' },
            { zh: '哪个玩具最有趣？', en: 'Which toy is most fun?', role: 'irrelevant' }
          ],
          hintZh: '可研究的问题应说明改变的条件和要观察的结果。',
          hintEn: 'An investigable question identifies the changed condition and observed result.'
        }]
      }
    },
    {
      id: 'sci-g1-puzzle-question-soil-water-002',
      level: 'G1',
      type: 'earth',
      thinkingUnit: 'questioning',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.QUESTIONING.BASIC',
        'RG.SCIENCE.EXPERIMENTATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'measurement_question_puzzle',
          promptZh: '小丽想研究加水量是否影响土壤软硬。哪一个问题最适合进行公平测量？',
          promptEn: 'Li wants to investigate whether water amount affects soil softness. Which question is best for a fair measurement?',
          options: [
            { zh: '使用相同土壤时，加水量不同会使土壤下陷深度改变吗？', en: 'With the same soil, does changing water amount change how deeply it is pressed?', role: 'measurable_fair_question' },
            { zh: '湿土壤是不是更好看？', en: 'Does wet soil look nicer?', role: 'opinion' },
            { zh: '同时更换土壤、容器和水量会怎样？', en: 'What happens if soil, container, and water amount all change?', role: 'uncontrolled' },
            { zh: '土壤喜欢下雨吗？', en: 'Does soil like rain?', role: 'unsupported' }
          ],
          hintZh: '一次只研究一个改变，并说明要测量的结果。',
          hintEn: 'Study one changed condition and identify the result to measure.'
        }]
      }
    },
    {
      id: 'sci-k1-puzzle-test-magnet-002',
      level: 'K1',
      type: 'matter',
      thinkingUnit: 'experimentation',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EXPERIMENTATION.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'direct_test_choice_puzzle',
          promptZh: '要知道磁铁能不能吸住木块，应该怎么做？',
          promptEn: 'How can we find out whether a magnet attracts a wooden block?',
          options: [
            { zh: '把磁铁靠近木块并观察', en: 'Move the magnet close to the block and observe', role: 'direct_test' },
            { zh: '给木块涂上颜色', en: 'Paint the wooden block', role: 'irrelevant_action' },
            { zh: '问大家喜不喜欢木块', en: 'Ask whether people like the block', role: 'preference' },
            { zh: '只看磁铁，不靠近木块', en: 'Look at the magnet without bringing it near the block', role: 'no_test' }
          ],
          hintZh: '选择能让磁铁和木块真正接受测试的动作。',
          hintEn: 'Choose an action that actually tests the magnet and block.'
        }]
      }
    },
    {
      id: 'sci-k2-puzzle-test-seedling-water-002',
      level: 'K2',
      type: 'life',
      thinkingUnit: 'experimentation',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EXPERIMENTATION.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'single_condition_test_puzzle',
          promptZh: '要比较水量是否影响幼苗生长，哪一种测试最合适？',
          promptEn: 'Which test is best for comparing whether water amount affects seedling growth?',
          options: [
            { zh: '使用同种、同高幼苗和相同光照，只改变每天水量', en: 'Use the same kind and height of seedlings with equal light, changing only daily water amount', role: 'fair_test' },
            { zh: '一株用大苗和少水，另一株用小苗和多水', en: 'Use a large seedling with less water and a small seedling with more water', role: 'multiple_changes' },
            { zh: '同时改变花盆、土壤、水量和光照', en: 'Change pot, soil, water, and light together', role: 'uncontrolled' },
            { zh: '只观察一株幼苗，不进行比较', en: 'Observe only one seedling without a comparison', role: 'no_comparison' }
          ],
          hintZh: '保持幼苗和光照相同，只改变水量。',
          hintEn: 'Keep the seedlings and light the same, changing only water amount.'
        }]
      }
    },
    {
      id: 'sci-k1-puzzle-evidence-shadow-002',
      level: 'K1',
      type: 'energy',
      thinkingUnit: 'evidence',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EVIDENCE.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'observed_shadow_evidence_puzzle',
          promptZh: '观察记录：手电筒靠近物体后，墙上的影子变大了。哪一句是刚才看到的证据？',
          promptEn: 'Observation record: after the flashlight moved closer, the shadow on the wall became larger. Which sentence is evidence from the observation?',
          options: [
            { zh: '手电筒靠近后影子变大', en: 'The shadow became larger after the flashlight moved closer', role: 'observed' },
            { zh: '影子飞出了房间', en: 'The shadow flew out of the room', role: 'unsupported' },
            { zh: '另一个没有测试的物体影子更大', en: 'An untested object had a larger shadow', role: 'not_tested' },
            { zh: '这个影子最好看', en: 'This shadow looked the nicest', role: 'opinion' }
          ],
          hintZh: '证据要来自刚才真正观察到的变化。',
          hintEn: 'Evidence comes from the change that was actually observed.'
        }]
      }
    },
    {
      id: 'sci-k2-puzzle-evidence-growth-002',
      level: 'K2',
      type: 'life',
      thinkingUnit: 'evidence',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EVIDENCE.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'growth_supporting_evidence_puzzle',
          promptZh: '想法是“这株幼苗正在长高”。哪一条记录最能支持这个想法？',
          promptEn: 'The claim is, “This seedling is growing taller.” Which record best supports it?',
          options: [
            { zh: '同一株幼苗三天高度为2格、3格、4格', en: 'The same seedling measured 2, 3, and 4 spaces across three days', role: 'supporting' },
            { zh: '花盆是红色的', en: 'The pot was red', role: 'irrelevant' },
            { zh: '幼苗旁边有一把铲子', en: 'There was a shovel beside the seedling', role: 'irrelevant' },
            { zh: '我最喜欢这株幼苗', en: 'I like this seedling best', role: 'opinion' }
          ],
          hintZh: '选择直接记录同一株幼苗高度变化的证据。',
          hintEn: 'Choose the record that directly measures the same seedling changing height.'
        }]
      }
    },
    {
      id: 'sci-g1-puzzle-evidence-conflicting-002',
      level: 'G1',
      type: 'motion',
      thinkingUnit: 'evidence',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EVIDENCE.BASIC',
        'RG.SCIENCE.EXPERIMENTATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'conflicting_evidence_puzzle',
          promptZh: '四次公平测试中，高斜坡的小球有三次滚得更远，一次与低斜坡一样远。哪一句最准确使用了全部证据？',
          promptEn: 'In four fair tests, the ball from the higher ramp rolled farther three times and the same distance once. Which statement uses all the evidence accurately?',
          options: [
            { zh: '多数测试支持高斜坡滚得更远，但有一次结果不同，还应继续测试', en: 'Most tests support the higher ramp rolling farther, but one result differed, so more testing is useful', role: 'balanced_evidence' },
            { zh: '四次测试都证明高斜坡一定滚得更远', en: 'All four tests prove the higher ramp always rolls farther', role: 'overclaim' },
            { zh: '一次相同结果说明其他三次都没有用', en: 'The one equal result makes the other three useless', role: 'dismisses_evidence' },
            { zh: '小球颜色决定哪次结果正确', en: 'The ball color decides which result is correct', role: 'irrelevant' }
          ],
          hintZh: '既不要忽略多数结果，也不要隐藏不同结果。',
          hintEn: 'Use both the repeated pattern and the result that differed.'
        }]
      }
    },
    {
      id: 'sci-k1-puzzle-explain-shadow-002',
      level: 'K1',
      type: 'energy',
      thinkingUnit: 'explanation',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EXPLANATION.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'simple_result_explanation_puzzle',
          promptZh: '观察记录：手电筒靠近物体后，影子变大。哪一句最符合刚才的结果？',
          promptEn: 'Observation record: the shadow became larger after the flashlight moved closer. Which sentence best matches the result?',
          options: [
            { zh: '光源距离改变时，影子大小也发生了变化', en: 'When light distance changed, shadow size changed too', role: 'supported' },
            { zh: '影子变大是因为它很开心', en: 'The shadow grew because it was happy', role: 'unsupported_reason' },
            { zh: '所有影子都会一直变大', en: 'Every shadow will always grow larger', role: 'overgeneralized' },
            { zh: '手电筒变成了影子', en: 'The flashlight turned into a shadow', role: 'unsupported' }
          ],
          hintZh: '选择与刚才观察到的改变相符合的说明。',
          hintEn: 'Choose the statement that matches the observed change.'
        }]
      }
    },
    {
      id: 'sci-k2-puzzle-explain-growth-002',
      level: 'K2',
      type: 'life',
      thinkingUnit: 'explanation',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EXPLANATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'growth_evidence_explanation_puzzle',
          promptZh: '同一株幼苗三天高度为2格、3格、4格。哪一个解释同时使用了记录和结论？',
          promptEn: 'The same seedling measured 2, 3, and 4 spaces across three days. Which explanation uses both the record and a conclusion?',
          options: [
            { zh: '幼苗每天都更高，三天记录支持它正在生长', en: 'The seedling was taller each day, so the three records support that it was growing', role: 'claim_evidence' },
            { zh: '幼苗生长是因为花盆最好看', en: 'The seedling grew because its pot looked nicest', role: 'unsupported_reason' },
            { zh: '三天高度完全相同', en: 'Its height was exactly the same on all three days', role: 'contradicted' },
            { zh: '旁边的铲子让幼苗长高', en: 'The nearby shovel made the seedling grow', role: 'irrelevant' }
          ],
          hintZh: '完整说明要引用三天的高度记录，并说出记录支持什么。',
          hintEn: 'Use the three height records and state what they support.'
        }]
      }
    },
    {
      id: 'sci-k2-puzzle-predict-warmth-002',
      level: 'K2',
      type: 'energy',
      thinkingUnit: 'prediction',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.PREDICTION.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'repeated_pattern_prediction_puzzle',
          promptZh: '记录显示：同样的冰块放在温暖处三次都比放在凉处更早开始融化。第四次使用同样的冰块和位置，哪个预测最有依据？',
          promptEn: 'Records show that equal ice cubes in the warmer place began melting earlier than those in the cooler place in three tests. With the same setup, which prediction is best supported for a fourth test?',
          options: [
            { zh: '温暖处的冰块更可能先开始融化', en: 'The ice cube in the warmer place is more likely to begin melting first', role: 'pattern_based_prediction' },
            { zh: '凉处的冰块一定会突然消失', en: 'The ice cube in the cooler place will suddenly disappear', role: 'unsupported' },
            { zh: '两块冰一定永远不会变化', en: 'Neither ice cube will ever change', role: 'contradicted' },
            { zh: '冰块的名字会决定结果', en: 'The name of the ice cube will determine the result', role: 'irrelevant' }
          ],
          hintZh: '用前三次重复观察到的模式来预测下一次结果。',
          hintEn: 'Use the repeated pattern from the first three observations to predict the next result.'
        }]
      }
    },
    {
      id: 'sci-g2-puzzle-predict-ramp-trend-002',
      level: 'G2',
      type: 'motion',
      thinkingUnit: 'prediction',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.PREDICTION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 8, familiar: 12, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'data_trend_prediction_puzzle',
          promptZh: '同一个小球从越来越高的斜坡释放，记录的滚动距离为4格、6格、8格。若只把斜坡再升高一级，哪个预测最符合已有数据趋势？',
          promptEn: 'The same ball released from increasingly higher ramps rolled 4, 6, and 8 spaces. If only the ramp is raised one more level, which prediction best follows the recorded trend?',
          options: [
            { zh: '滚动距离可能继续增加', en: 'The rolling distance will likely continue to increase', role: 'trend_prediction' },
            { zh: '小球一定会变成另一个物体', en: 'The ball will certainly turn into another object', role: 'unsupported' },
            { zh: '滚动距离一定变成0格', en: 'The rolling distance will certainly become 0 spaces', role: 'contradicted' },
            { zh: '无法使用前三次记录作任何预测', en: 'The first three records cannot be used for any prediction', role: 'ignores_pattern' }
          ],
          hintZh: '比较4、6、8格的变化方向，再预测下一个结果；预测仍需要实验检验。',
          hintEn: 'Follow the direction of the 4, 6, and 8-space pattern, remembering that the prediction still needs testing.'
        }]
      }
    },
    {
      id: 'sci-g2-puzzle-evidence-sufficient-002',
      level: 'G2',
      type: 'life',
      thinkingUnit: 'evidence',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EVIDENCE.BASIC',
        'RG.SCIENCE.EXPERIMENTATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 8, familiar: 12, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'evidence_sufficiency_puzzle',
          promptZh: '学生想判断“更多光照会使同种幼苗长得更高”。第一次测试中，多光组长得更高；第二次两组一样高。怎样评价目前的证据最合理？',
          promptEn: 'A student is testing the claim that more light makes the same kind of seedling grow taller. In the first fair test the higher-light group grew taller; in the second test both groups were the same height. What is the best evaluation of the evidence so far?',
          options: [
            { zh: '结果还不完全一致，需要更多公平测试再判断', en: 'The results are not fully consistent, so more fair tests are needed before deciding', role: 'insufficient_mixed_evidence' },
            { zh: '第一次结果已经证明这个想法永远正确', en: 'The first result proves the claim is always correct', role: 'overclaim' },
            { zh: '第二次结果说明第一次记录应该删除', en: 'The second result means the first record should be deleted', role: 'dismisses_evidence' },
            { zh: '应该选择自己更喜欢的那次结果', en: 'The preferred result should be selected', role: 'preference' }
          ],
          hintZh: '两次公平测试结果并不完全一致，因此不能只挑选支持想法的结果。',
          hintEn: 'The two fair-test results do not fully agree, so do not select only the result that supports the claim.'
        }]
      }
    },
    {
      id: 'sci-g1-puzzle-explain-ramp-evidence-002',
      level: 'G1',
      type: 'motion',
      thinkingUnit: 'explanation',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EXPLANATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'claim_evidence_explanation_puzzle',
          promptZh: '公平测试中，同一个小球从低斜坡滚了5格，从高斜坡滚了9格。哪一个解释同时包含结论和支持它的证据？',
          promptEn: 'In a fair test, the same ball rolled 5 spaces from the lower ramp and 9 spaces from the higher ramp. Which explanation includes both a conclusion and supporting evidence?',
          options: [
            { zh: '这次测试中高斜坡使小球滚得更远，因为同一个小球从高斜坡滚了9格，而低斜坡只有5格', en: 'In this test the higher ramp made the ball roll farther because the same ball rolled 9 spaces from it versus 5 from the lower ramp', role: 'claim_evidence' },
            { zh: '高斜坡更好，因为我喜欢它', en: 'The higher ramp is better because I like it', role: 'preference' },
            { zh: '所有小球在任何高斜坡上都会滚9格', en: 'Every ball on every high ramp will roll exactly 9 spaces', role: 'overgeneralized' },
            { zh: '小球滚得远是因为它想去远处', en: 'The ball rolled farther because it wanted to go far away', role: 'unsupported_reason' }
          ],
          hintZh: '解释应说出测试中的结论，并引用5格和9格的实际记录。',
          hintEn: 'State the conclusion from this test and use the actual 5-space and 9-space records as evidence.'
        }]
      }
    },
    {
      id: 'sci-g2-puzzle-explain-revise-002',
      level: 'G2',
      type: 'matter',
      thinkingUnit: 'explanation',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EXPLANATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 8, familiar: 12, mastered: 20, wrong: 2 },
      params: {
        scenarios: [{
          type: 'explanation_revision_puzzle',
          promptZh: '原来的解释是“所有金属物体都会被磁铁吸住”。测试后发现铁钉被吸住，但铝箔没有被吸住。哪一种修正最符合证据？',
          promptEn: 'The original explanation was, “All metal objects are attracted to a magnet.” Testing showed that an iron nail was attracted but aluminum foil was not. Which revision best fits the evidence?',
          options: [
            { zh: '不能再说所有金属都会被吸住；目前证据只支持某些被测试的金属会被吸住', en: 'We should no longer say all metals are attracted; the evidence supports attraction for only some of the metals tested', role: 'evidence_based_revision' },
            { zh: '仍坚持所有金属都会被吸住，并忽略铝箔结果', en: 'Keep saying all metals are attracted and ignore the aluminum result', role: 'ignores_counterevidence' },
            { zh: '因为铁钉被吸住，所以所有物体都会被磁铁吸住', en: 'Because the nail was attracted, every object must be attracted to magnets', role: 'overgeneralized' },
            { zh: '铝箔没有被吸住是因为它不喜欢磁铁', en: 'The aluminum was not attracted because it does not like magnets', role: 'unsupported_reason' }
          ],
          hintZh: '新的解释必须保留支持它的结果，也要回应与原解释冲突的结果。',
          hintEn: 'A revised explanation must use the supporting result and also account for the result that conflicts with the original explanation.'
        }]
      }
    },
    {
      id: 'sci-k2-puzzle-observe-change-rate-003',
      level: 'K2', type: 'matter', thinkingUnit: 'observation', mode: 'puzzle', difficulty: 1,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: ['RG.SCIENCE.OBSERVATION.BASIC', 'RG.SCIENCE.EVIDENCE.BASIC'],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: { scenarios: [{
        type: 'change_rate_observation_puzzle',
        promptZh: '两个相同冰块开始一样大。5分钟后，A还剩6格，B还剩3格。哪一句只描述观察记录？',
        promptEn: 'Two equal ice cubes started the same size. After 5 minutes, A had 6 spaces left and B had 3. Which statement only describes the observation?',
        options: [
          { zh: 'B在这5分钟里减少得更多', en: 'B decreased more during the 5 minutes', role: 'observed_comparison' },
          { zh: 'B一定放在太阳上', en: 'B must have been placed in sunlight', role: 'unsupported_cause' },
          { zh: 'A和B完全没有变化', en: 'A and B did not change at all', role: 'contradicted' },
          { zh: 'A比较喜欢保持原样', en: 'A preferred to stay the same', role: 'unsupported' }
        ],
        hintZh: '只比较开始和5分钟后的记录，不猜测没有给出的原因。',
        hintEn: 'Compare the recorded amounts without guessing an untested cause.'
      }] }
    },
    {
      id: 'sci-k1-puzzle-question-roll-003',
      level: 'K1', type: 'motion', thinkingUnit: 'questioning', mode: 'puzzle', difficulty: 1,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: ['RG.SCIENCE.QUESTIONING.BASIC', 'RG.SCIENCE.OBSERVATION.BASIC'],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: { scenarios: [{
        type: 'observable_roll_question_puzzle',
        promptZh: '桌上有一个小球和一块可以垫高的斜板。哪个问题可以通过动手试一试来回答？',
        promptEn: 'There is a ball and a ramp that can be raised. Which question can be answered by trying a test?',
        options: [
          { zh: '斜板垫高后，小球会滚得更远吗？', en: 'When the ramp is raised, will the ball roll farther?', role: 'testable' },
          { zh: '小球最喜欢哪种颜色？', en: 'Which color does the ball like best?', role: 'unsupported' },
          { zh: '哪个斜板名字最好听？', en: 'Which ramp has the nicest name?', role: 'preference' },
          { zh: '小球是不是很开心？', en: 'Is the ball happy?', role: 'unsupported' }
        ],
        hintZh: '选择可以改变一个条件并观察结果的问题。',
        hintEn: 'Choose a question where a condition can be changed and the result observed.'
      }] }
    },
    {
      id: 'sci-k1-puzzle-predict-shadow-003',
      level: 'K1', type: 'energy', thinkingUnit: 'prediction', mode: 'puzzle', difficulty: 1,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: ['RG.SCIENCE.PREDICTION.BASIC', 'RG.SCIENCE.OBSERVATION.BASIC'],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: { scenarios: [{
        type: 'observed_pattern_prediction_puzzle',
        promptZh: '前两次把手电筒移近同一个玩偶时，墙上的影子都变大了。第三次再把手电筒移近，哪个预测最有依据？',
        promptEn: 'In two tests, moving the flashlight closer to the same toy made its shadow larger. When it is moved closer a third time, which prediction is best supported?',
        options: [
          { zh: '影子可能再次变大', en: 'The shadow may become larger again', role: 'pattern_prediction' },
          { zh: '玩偶一定会消失', en: 'The toy will certainly disappear', role: 'unsupported' },
          { zh: '影子一定变成另一种颜色', en: 'The shadow will certainly change color', role: 'unsupported' },
          { zh: '前两次观察不能帮助做任何预测', en: 'The first two observations cannot help make any prediction', role: 'ignores_evidence' }
        ],
        hintZh: '预测可以依据重复观察，但还需要第三次测试。',
        hintEn: 'A prediction can use the repeated observations, but the third test is still needed.'
      }] }
    },
    {
      id: 'sci-g1-puzzle-test-leaf-light-003',
      level: 'G1', type: 'life', thinkingUnit: 'experimentation', mode: 'puzzle', difficulty: 2,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: ['RG.SCIENCE.EXPERIMENTATION.BASIC', 'RG.SCIENCE.OBSERVATION.BASIC'],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: { scenarios: [{
        type: 'fair_comparison_design_puzzle',
        promptZh: '要研究光照时间是否影响同种幼苗的生长，哪种设计最能公平比较？',
        promptEn: 'To investigate whether light duration affects growth of the same kind of seedling, which design gives the fairest comparison?',
        options: [
          { zh: '两组使用同种、相近高度的幼苗，相同水量和土壤，只改变每天光照时间', en: 'Use the same kind and similar-height seedlings with equal water and soil, changing only daily light duration', role: 'fair_test' },
          { zh: '同时改变光照、水量和幼苗种类', en: 'Change light, water, and seedling type together', role: 'multiple_variables' },
          { zh: '一组测高度，另一组只看叶子颜色', en: 'Measure height in one group but only leaf color in the other', role: 'inconsistent_measure' },
          { zh: '只观察一株幼苗', en: 'Observe only one seedling', role: 'no_comparison' }
        ],
        hintZh: '公平测试要让主要条件相同，只改变正在研究的条件。',
        hintEn: 'A fair test keeps the main conditions equal and changes only the condition being studied.'
      }] }
    },
    {
      id: 'sci-k1-puzzle-evidence-melting-003',
      level: 'K1', type: 'matter', thinkingUnit: 'evidence', mode: 'puzzle', difficulty: 1,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: ['RG.SCIENCE.EVIDENCE.BASIC', 'RG.SCIENCE.OBSERVATION.BASIC'],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: { scenarios: [{
        type: 'direct_record_evidence_puzzle',
        promptZh: '问题是“哪块相同大小的冰先开始融化？”记录显示：A在3分钟时开始融化，B在7分钟时开始融化。哪条证据直接回答问题？',
        promptEn: 'The question is, “Which equal ice cube begins melting first?” The record says A began melting at 3 minutes and B at 7 minutes. Which evidence directly answers the question?',
        options: [
          { zh: 'A是3分钟，B是7分钟', en: 'A was 3 minutes and B was 7 minutes', role: 'direct_evidence' },
          { zh: '两个盘子都是圆的', en: 'Both trays were round', role: 'irrelevant' },
          { zh: '我更喜欢A', en: 'I like A better', role: 'preference' },
          { zh: '冰块开始时都是白色的', en: 'Both ice cubes were white at the start', role: 'irrelevant' }
        ],
        hintZh: '找直接记录“什么时候开始融化”的信息。',
        hintEn: 'Find the record that directly states when melting began.'
      }] }
    },
    {
      id: 'sci-k1-puzzle-explain-roll-003',
      level: 'K1', type: 'motion', thinkingUnit: 'explanation', mode: 'puzzle', difficulty: 1,
      generator: 'scenarioReasoningPuzzle',
      rootGeneIds: ['RG.SCIENCE.EXPLANATION.BASIC', 'RG.SCIENCE.EVIDENCE.BASIC'],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: { scenarios: [{
        type: 'result_link_explanation_puzzle',
        promptZh: '同一个小球从低斜板滚了4格，从高斜板滚了7格。哪一句说明最符合这次测试？',
        promptEn: 'The same ball rolled 4 spaces from a low ramp and 7 from a high ramp. Which explanation best fits this test?',
        options: [
          { zh: '这次测试中，斜板更高时同一个小球滚得更远', en: 'In this test, the same ball rolled farther when the ramp was higher', role: 'supported_explanation' },
          { zh: '小球滚得远是因为它想跑出去', en: 'The ball rolled farther because it wanted to escape', role: 'unsupported_reason' },
          { zh: '两个斜板的结果完全相同', en: 'Both ramps produced exactly the same result', role: 'contradicted' },
          { zh: '所有小球永远都会滚7格', en: 'Every ball will always roll 7 spaces', role: 'overgeneralized' }
        ],
        hintZh: '说明要和4格、7格的实际测试结果一致。',
        hintEn: 'The explanation should match the actual 4-space and 7-space results.'
      }] }
    },
    {
      "id": "sci-g1-puzzle-observe-temperature-series-003",
      "level": "G1",
      "type": "energy",
      "thinkingUnit": "observation",
      "mode": "puzzle",
      "difficulty": 2,
      "generator": "scenarioReasoningPuzzle",
      "rootGeneIds": [
        "RG.SCIENCE.OBSERVATION.BASIC",
        "RG.SCIENCE.EVIDENCE.BASIC"
      ],
      "mastery": {
        "requiredCorrect": 3,
        "window": 5
      },
      "cooldown": {
        "correct": 5,
        "familiar": 8,
        "mastered": 20,
        "wrong": 2
      },
      "params": {
        "scenarios": [
          {
            "type": "measurement_interval_observation_puzzle",
            "promptZh": "同一杯温水每隔5分钟测量一次，记录为40、36、33、31格。哪一句准确描述了记录？",
            "promptEn": "The same cup of warm water was measured every 5 minutes, giving 40, 36, 33, and 31 units. Which statement accurately describes the record?",
            "options": [
              {
                "zh": "温度一直下降，但每次下降的量并不相同",
                "en": "The temperature kept decreasing, but not by the same amount each time",
                "role": "accurate_pattern"
              },
              {
                "zh": "温度每次都上升4格",
                "en": "The temperature increased by 4 units each time",
                "role": "reversed"
              },
              {
                "zh": "四次测量完全相同",
                "en": "All four measurements were identical",
                "role": "contradicted"
              },
              {
                "zh": "水降温是因为杯子不高兴",
                "en": "The water cooled because the cup was unhappy",
                "role": "unsupported_cause"
              }
            ],
            "hintZh": "依次比较相邻两次测量，描述记录本身。",
            "hintEn": "Compare each neighboring pair of measurements and describe only the record."
          }
        ]
      }
    },
    {
      "id": "sci-g2-puzzle-observe-intersection-003",
      "level": "G2",
      "type": "life",
      "thinkingUnit": "observation",
      "mode": "puzzle",
      "difficulty": 2,
      "generator": "scenarioReasoningPuzzle",
      "rootGeneIds": [
        "RG.SCIENCE.OBSERVATION.BASIC",
        "RG.SCIENCE.EVIDENCE.BASIC"
      ],
      "mastery": {
        "requiredCorrect": 3,
        "window": 5
      },
      "cooldown": {
        "correct": 5,
        "familiar": 8,
        "mastered": 20,
        "wrong": 2
      },
      "params": {
        "scenarios": [
          {
            "type": "two_group_data_relationship_puzzle",
            "promptZh": "两组同种幼苗的高度记录为：A组2、5、8、11格，B组2、4、6、8格。哪一句完整描述了两组关系？",
            "promptEn": "Height records for two groups of the same seedlings were: A 2, 5, 8, 11 units and B 2, 4, 6, 8 units. Which statement fully describes their relationship?",
            "options": [
              {
                "zh": "两组起点相同且都长高了，之后A组增加得更多",
                "en": "Both groups started equal and grew, while group A increased more afterward",
                "role": "complete_comparison"
              },
              {
                "zh": "B组始终比A组高",
                "en": "Group B was always taller than group A",
                "role": "reversed"
              },
              {
                "zh": "两组每次高度都完全相同",
                "en": "The two groups had identical heights every time",
                "role": "contradicted"
              },
              {
                "zh": "A组长得快是因为标签颜色不同",
                "en": "Group A grew faster because its label had a different color",
                "role": "unsupported_cause"
              }
            ],
            "hintZh": "同时检查起点、变化方向和两组增加的幅度。",
            "hintEn": "Check the starting point, direction of change, and size of increase for both groups."
          }
        ]
      }
    },
    {
      "id": "sci-k2-puzzle-question-dissolving-003",
      "level": "K2",
      "type": "matter",
      "thinkingUnit": "questioning",
      "mode": "puzzle",
      "difficulty": 1,
      "generator": "scenarioReasoningPuzzle",
      "rootGeneIds": [
        "RG.SCIENCE.QUESTIONING.BASIC",
        "RG.SCIENCE.EXPERIMENTATION.BASIC"
      ],
      "mastery": {
        "requiredCorrect": 3,
        "window": 5
      },
      "cooldown": {
        "correct": 5,
        "familiar": 8,
        "mastered": 20,
        "wrong": 2
      },
      "params": {
        "scenarios": [
          {
            "type": "observable_measure_question_puzzle",
            "promptZh": "桌上有两杯相同水量的水和两勺相同的糖。哪个问题能通过改变一个条件并计时来研究？",
            "promptEn": "There are two equal cups of water and two equal spoonfuls of sugar. Which question can be investigated by changing one condition and measuring time?",
            "options": [
              {
                "zh": "只改变水温时，糖完全看不见需要的时间会不同吗？",
                "en": "If only water temperature changes, will the time until the sugar is no longer visible differ?",
                "role": "testable_measurable_question"
              },
              {
                "zh": "哪杯水更漂亮？",
                "en": "Which cup of water is prettier?",
                "role": "opinion"
              },
              {
                "zh": "糖喜欢哪个杯子？",
                "en": "Which cup does the sugar like?",
                "role": "unsupported"
              },
              {
                "zh": "同时改变水温、水量和糖量会怎样？",
                "en": "What happens if water temperature, water amount, and sugar amount all change?",
                "role": "uncontrolled"
              }
            ],
            "hintZh": "选择只改变一个条件，并说明要测量什么的问题。",
            "hintEn": "Choose a question that changes one condition and identifies what to measure."
          }
        ]
      }
    },
    {
      "id": "sci-g1-puzzle-question-material-insulation-003",
      "level": "G1",
      "type": "energy",
      "thinkingUnit": "questioning",
      "mode": "puzzle",
      "difficulty": 2,
      "generator": "scenarioReasoningPuzzle",
      "rootGeneIds": [
        "RG.SCIENCE.QUESTIONING.BASIC",
        "RG.SCIENCE.EXPERIMENTATION.BASIC"
      ],
      "mastery": {
        "requiredCorrect": 3,
        "window": 5
      },
      "cooldown": {
        "correct": 5,
        "familiar": 8,
        "mastered": 20,
        "wrong": 2
      },
      "params": {
        "scenarios": [
          {
            "type": "controlled_material_question_puzzle",
            "promptZh": "学生想比较不同包裹材料是否影响温水冷却。哪个研究问题最清楚？",
            "promptEn": "A student wants to compare whether wrapping material affects how warm water cools. Which research question is clearest?",
            "options": [
              {
                "zh": "相同杯子装相同水量时，不同包裹材料会改变10分钟后的水温吗？",
                "en": "With identical cups and equal water amounts, does wrapping material change the water temperature after 10 minutes?",
                "role": "controlled_measurable_question"
              },
              {
                "zh": "哪个包裹材料看起来最好？",
                "en": "Which wrapping material looks best?",
                "role": "opinion"
              },
              {
                "zh": "同时更换杯子、水量、起始温度和材料会怎样？",
                "en": "What happens if cup, water amount, starting temperature, and material all change?",
                "role": "multiple_variables"
              },
              {
                "zh": "温水喜欢被包起来吗？",
                "en": "Does warm water like being wrapped?",
                "role": "unsupported"
              }
            ],
            "hintZh": "问题应明确改变的材料、保持相同的条件和测量时间。",
            "hintEn": "Identify the changed material, controlled conditions, and measurement time."
          }
        ]
      }
    },
    {
      "id": "sci-k2-puzzle-predict-dissolving-003",
      "level": "K2",
      "type": "matter",
      "thinkingUnit": "prediction",
      "mode": "puzzle",
      "difficulty": 1,
      "generator": "scenarioReasoningPuzzle",
      "rootGeneIds": [
        "RG.SCIENCE.PREDICTION.BASIC",
        "RG.SCIENCE.EVIDENCE.BASIC"
      ],
      "mastery": {
        "requiredCorrect": 3,
        "window": 5
      },
      "cooldown": {
        "correct": 5,
        "familiar": 8,
        "mastered": 20,
        "wrong": 2
      },
      "params": {
        "scenarios": [
          {
            "type": "condition_pattern_prediction_puzzle",
            "promptZh": "三次测试中，同样的糖在温水里都比在凉水里更早看不见。使用相同设置再测试一次，哪个预测最有依据？",
            "promptEn": "In three tests, equal sugar became invisible sooner in warm water than in cool water. With the same setup, which prediction is best supported?",
            "options": [
              {
                "zh": "糖在温水里可能再次更早看不见",
                "en": "The sugar may again become invisible sooner in warm water",
                "role": "evidence_based_prediction"
              },
              {
                "zh": "凉水一定会变成固体",
                "en": "The cool water will certainly become solid",
                "role": "unsupported"
              },
              {
                "zh": "糖一定会从杯子里飞走",
                "en": "The sugar will certainly fly out of the cup",
                "role": "unsupported"
              },
              {
                "zh": "前三次结果与下一次预测没有关系",
                "en": "The first three results have no relation to the next prediction",
                "role": "ignores_evidence"
              }
            ],
            "hintZh": "根据重复出现的结果作预测，同时保留“需要再测试”的可能性。",
            "hintEn": "Predict from the repeated result while recognizing that another test is still needed."
          }
        ]
      }
    },
    {
      "id": "sci-g1-puzzle-predict-seedling-003",
      "level": "G1",
      "type": "life",
      "thinkingUnit": "prediction",
      "mode": "puzzle",
      "difficulty": 2,
      "generator": "scenarioReasoningPuzzle",
      "rootGeneIds": [
        "RG.SCIENCE.PREDICTION.BASIC",
        "RG.SCIENCE.EVIDENCE.BASIC"
      ],
      "mastery": {
        "requiredCorrect": 3,
        "window": 5
      },
      "cooldown": {
        "correct": 5,
        "familiar": 8,
        "mastered": 20,
        "wrong": 2
      },
      "params": {
        "scenarios": [
          {
            "type": "rate_pattern_prediction_puzzle",
            "promptZh": "同一株幼苗每隔两天测量一次，高度是3、5、7、9格。如果条件保持相同，下次测量哪个预测最符合记录？",
            "promptEn": "The same seedling was measured every two days at 3, 5, 7, and 9 units. If conditions stay the same, which next measurement is best supported?",
            "options": [
              {
                "zh": "高度可能接近11格",
                "en": "Its height may be near 11 units",
                "role": "rate_prediction"
              },
              {
                "zh": "高度一定变成0格",
                "en": "Its height will certainly become 0 units",
                "role": "contradicted"
              },
              {
                "zh": "幼苗一定变成石头",
                "en": "The seedling will certainly turn into a rock",
                "role": "unsupported"
              },
              {
                "zh": "这些测量不能帮助预测下一次高度",
                "en": "The measurements cannot help predict the next height",
                "role": "ignores_pattern"
              }
            ],
            "hintZh": "观察每两天增加多少，再作可以被下次测量检验的预测。",
            "hintEn": "Look at the increase every two days and make a prediction the next measurement can test."
          }
        ]
      }
    },
    {
      "id": "sci-k1-puzzle-test-shadow-distance-003",
      "level": "K1",
      "type": "energy",
      "thinkingUnit": "experimentation",
      "mode": "puzzle",
      "difficulty": 1,
      "generator": "scenarioReasoningPuzzle",
      "rootGeneIds": [
        "RG.SCIENCE.EXPERIMENTATION.BASIC",
        "RG.SCIENCE.OBSERVATION.BASIC"
      ],
      "mastery": {
        "requiredCorrect": 3,
        "window": 5
      },
      "cooldown": {
        "correct": 5,
        "familiar": 8,
        "mastered": 20,
        "wrong": 2
      },
      "params": {
        "scenarios": [
          {
            "type": "simple_comparison_setup_puzzle",
            "promptZh": "要研究手电筒距离是否会改变影子大小，应该怎样测试？",
            "promptEn": "How should we test whether flashlight distance changes shadow size?",
            "options": [
              {
                "zh": "使用同一个物体和墙，只改变手电筒距离并比较影子",
                "en": "Use the same object and wall, changing only flashlight distance and comparing the shadows",
                "role": "fair_test"
              },
              {
                "zh": "每次同时更换物体、墙和手电筒",
                "en": "Change the object, wall, and flashlight each time",
                "role": "multiple_changes"
              },
              {
                "zh": "只看手电筒，不观察影子",
                "en": "Look only at the flashlight and not the shadow",
                "role": "no_result_observation"
              },
              {
                "zh": "选择自己最喜欢的影子",
                "en": "Choose the shadow you like best",
                "role": "preference"
              }
            ],
            "hintZh": "保持物体和墙相同，只改变正在研究的距离。",
            "hintEn": "Keep the object and wall the same, changing only the distance being studied."
          }
        ]
      }
    },
    {
      "id": "sci-k2-puzzle-test-absorption-003",
      "level": "K2",
      "type": "matter",
      "thinkingUnit": "experimentation",
      "mode": "puzzle",
      "difficulty": 1,
      "generator": "scenarioReasoningPuzzle",
      "rootGeneIds": [
        "RG.SCIENCE.EXPERIMENTATION.BASIC",
        "RG.SCIENCE.OBSERVATION.BASIC"
      ],
      "mastery": {
        "requiredCorrect": 3,
        "window": 5
      },
      "cooldown": {
        "correct": 5,
        "familiar": 8,
        "mastered": 20,
        "wrong": 2
      },
      "params": {
        "scenarios": [
          {
            "type": "equal_amount_material_test_puzzle",
            "promptZh": "要比较纸巾和布吸水量，哪种方法最公平？",
            "promptEn": "Which method is fairest for comparing how much water a paper towel and a cloth absorb?",
            "options": [
              {
                "zh": "使用相同大小的纸巾和布，加入相同水量，再测量剩余的水",
                "en": "Use equal-sized pieces, add equal water amounts, and measure the water left",
                "role": "fair_measured_test"
              },
              {
                "zh": "使用大纸巾和小布，并加入不同水量",
                "en": "Use a large paper towel and small cloth with different water amounts",
                "role": "multiple_changes"
              },
              {
                "zh": "只摸一摸材料，不加入水",
                "en": "Touch the materials without adding water",
                "role": "no_test"
              },
              {
                "zh": "选择颜色更好看的材料",
                "en": "Choose the material with the nicer color",
                "role": "preference"
              }
            ],
            "hintZh": "让材料大小和加入的水量相同，并测量可以比较的结果。",
            "hintEn": "Keep material size and water amount equal, then measure a comparable result."
          }
        ]
      }
    },
    {
      "id": "sci-g2-puzzle-question-force-distance-003",
      "level": "G2",
      "type": "motion",
      "thinkingUnit": "questioning",
      "mode": "puzzle",
      "difficulty": 2,
      "generator": "scenarioReasoningPuzzle",
      "rootGeneIds": [
        "RG.SCIENCE.QUESTIONING.BASIC",
        "RG.SCIENCE.EXPERIMENTATION.BASIC"
      ],
      "mastery": {
        "requiredCorrect": 3,
        "window": 5
      },
      "cooldown": {
        "correct": 5,
        "familiar": 8,
        "mastered": 20,
        "wrong": 2
      },
      "params": {
        "scenarios": [
          {
            "type": "quantitative_force_question_puzzle",
            "promptZh": "学生发现橡皮筋拉得越长，小车可能移动得越远。哪个问题最适合通过控制变量和测量来研究？",
            "promptEn": "A student notices that stretching a rubber band farther may move a cart farther. Which question is best investigated with controlled variables and measurement?",
            "options": [
              {
                "zh": "使用同一辆小车和路面时，橡皮筋拉伸长度会怎样影响小车移动距离？",
                "en": "With the same cart and surface, how does rubber-band stretch length affect cart travel distance?",
                "role": "controlled_quantitative_question"
              },
              {
                "zh": "哪辆小车颜色最好看？",
                "en": "Which cart color looks best?",
                "role": "opinion"
              },
              {
                "zh": "同时改变小车、路面和橡皮筋会怎样？",
                "en": "What happens if the cart, surface, and rubber band all change?",
                "role": "multiple_variables"
              },
              {
                "zh": "橡皮筋喜欢哪辆小车？",
                "en": "Which cart does the rubber band like?",
                "role": "unsupported"
              }
            ],
            "hintZh": "研究问题应明确改变的条件、保持相同的条件和要测量的结果。",
            "hintEn": "Identify the changed condition, controlled conditions, and measured result."
          }
        ]
      }
    },
    {
      "id": "sci-g2-puzzle-predict-cooling-003",
      "level": "G2",
      "type": "energy",
      "thinkingUnit": "prediction",
      "mode": "puzzle",
      "difficulty": 2,
      "generator": "scenarioReasoningPuzzle",
      "rootGeneIds": [
        "RG.SCIENCE.PREDICTION.BASIC",
        "RG.SCIENCE.EVIDENCE.BASIC"
      ],
      "mastery": {
        "requiredCorrect": 3,
        "window": 5
      },
      "cooldown": {
        "correct": 5,
        "familiar": 8,
        "mastered": 20,
        "wrong": 2
      },
      "params": {
        "scenarios": [
          {
            "type": "nonlinear_trend_prediction_puzzle",
            "promptZh": "同一杯温水每5分钟记录为50、43、38、35格，下降量依次为7、5、3格。条件保持相同时，哪个预测最谨慎且最符合数据？",
            "promptEn": "The same cup of warm water measured 50, 43, 38, and 35 units every 5 minutes, decreasing by 7, 5, and 3 units. If conditions stay the same, which prediction is cautious and best supported?",
            "options": [
              {
                "zh": "下次温度可能继续下降，但下降量可能比前面更小",
                "en": "The temperature may keep decreasing, but by less than in earlier intervals",
                "role": "cautious_trend_prediction"
              },
              {
                "zh": "下次一定下降7格",
                "en": "It will certainly decrease by 7 units next time",
                "role": "ignores_changing_rate"
              },
              {
                "zh": "下次一定升到100格",
                "en": "It will certainly rise to 100 units",
                "role": "contradicted"
              },
              {
                "zh": "这些记录不能支持任何预测",
                "en": "These records cannot support any prediction",
                "role": "ignores_evidence"
              }
            ],
            "hintZh": "既看温度变化方向，也比较每次下降量是否相同。",
            "hintEn": "Use both the direction of change and the changing size of each decrease."
          }
        ]
      }
    },
    {
      "id": "sci-k2-puzzle-evidence-absorption-003",
      "level": "K2",
      "type": "matter",
      "thinkingUnit": "evidence",
      "mode": "puzzle",
      "difficulty": 1,
      "generator": "scenarioReasoningPuzzle",
      "rootGeneIds": [
        "RG.SCIENCE.EVIDENCE.BASIC",
        "RG.SCIENCE.OBSERVATION.BASIC"
      ],
      "mastery": {
        "requiredCorrect": 3,
        "window": 5
      },
      "cooldown": {
        "correct": 5,
        "familiar": 8,
        "mastered": 20,
        "wrong": 2
      },
      "params": {
        "scenarios": [
          {
            "type": "relevant_measurement_evidence_puzzle",
            "promptZh": "问题是“纸巾和布哪一种吸水更多？”相同大小材料各接触10格水后，纸巾剩2格水，布剩5格水。哪条证据最直接？",
            "promptEn": "The question is, 'Which absorbs more water, paper towel or cloth?' Equal pieces each contacted 10 units of water; 2 units remained with paper towel and 5 with cloth. Which evidence is most direct?",
            "options": [
              {
                "zh": "纸巾后剩2格水，布后剩5格水",
                "en": "2 units remained after the paper towel and 5 after the cloth",
                "role": "direct_comparative_evidence"
              },
              {
                "zh": "两种材料颜色不同",
                "en": "The materials had different colors",
                "role": "irrelevant"
              },
              {
                "zh": "我更喜欢纸巾",
                "en": "I prefer the paper towel",
                "role": "preference"
              },
              {
                "zh": "桌子是方形的",
                "en": "The table was square",
                "role": "irrelevant"
              }
            ],
            "hintZh": "选择直接比较测试后剩余水量的记录。",
            "hintEn": "Choose the record directly comparing the water remaining after each test."
          }
        ]
      }
    },
    {
      "id": "sci-g1-puzzle-evidence-repeated-shadow-003",
      "level": "G1",
      "type": "energy",
      "thinkingUnit": "evidence",
      "mode": "puzzle",
      "difficulty": 2,
      "generator": "scenarioReasoningPuzzle",
      "rootGeneIds": [
        "RG.SCIENCE.EVIDENCE.BASIC",
        "RG.SCIENCE.EXPERIMENTATION.BASIC"
      ],
      "mastery": {
        "requiredCorrect": 3,
        "window": 5
      },
      "cooldown": {
        "correct": 5,
        "familiar": 8,
        "mastered": 20,
        "wrong": 2
      },
      "params": {
        "scenarios": [
          {
            "type": "repeated_result_evidence_puzzle",
            "promptZh": "三次公平测试中，手电筒靠近同一个物体后，影子分别从4变7格、5变8格、4变7格。哪一句最恰当地使用证据？",
            "promptEn": "In three fair tests, moving a flashlight closer to the same object changed shadow size from 4 to 7, 5 to 8, and 4 to 7 units. Which statement uses the evidence appropriately?",
            "options": [
              {
                "zh": "三次记录都支持手电筒靠近时影子变大",
                "en": "All three records support that the shadow became larger when the flashlight moved closer",
                "role": "repeated_supporting_evidence"
              },
              {
                "zh": "只有第一次记录有用",
                "en": "Only the first record is useful",
                "role": "dismisses_repetition"
              },
              {
                "zh": "三次记录说明影子变小",
                "en": "The three records show the shadow became smaller",
                "role": "contradicted"
              },
              {
                "zh": "影子大小由玩具名字决定",
                "en": "Shadow size was determined by the toy's name",
                "role": "irrelevant"
              }
            ],
            "hintZh": "检查三次变化方向是否一致，并使用全部记录。",
            "hintEn": "Check whether all three changes have the same direction and use every record."
          }
        ]
      }
    },
    {
      "id": "sci-g2-puzzle-evidence-quality-003",
      "level": "G2",
      "type": "life",
      "thinkingUnit": "evidence",
      "mode": "puzzle",
      "difficulty": 2,
      "generator": "scenarioReasoningPuzzle",
      "rootGeneIds": [
        "RG.SCIENCE.EVIDENCE.BASIC",
        "RG.SCIENCE.EXPERIMENTATION.BASIC"
      ],
      "mastery": {
        "requiredCorrect": 3,
        "window": 5
      },
      "cooldown": {
        "correct": 5,
        "familiar": 8,
        "mastered": 20,
        "wrong": 2
      },
      "params": {
        "scenarios": [
          {
            "type": "evidence_quality_comparison_puzzle",
            "promptZh": "要判断水量是否影响同种幼苗高度，哪组证据质量最高？",
            "promptEn": "Which evidence is strongest for deciding whether water amount affects the height of the same kind of seedling?",
            "options": [
              {
                "zh": "多次公平测试：同种、相近初始高度的幼苗保持土壤和光照相同，只改变水量并按相同时间测量高度",
                "en": "Repeated fair tests using the same kind and similar starting heights, equal soil and light, changing only water and measuring height at equal times",
                "role": "high_quality_evidence"
              },
              {
                "zh": "只看一株幼苗一次，并猜测它需要更多水",
                "en": "Look at one seedling once and guess that it needs more water",
                "role": "insufficient"
              },
              {
                "zh": "同时改变水量、幼苗种类、土壤和光照",
                "en": "Change water, seedling type, soil, and light together",
                "role": "confounded"
              },
              {
                "zh": "询问大家更喜欢哪株幼苗",
                "en": "Ask which seedling people prefer",
                "role": "preference"
              }
            ],
            "hintZh": "高质量证据来自重复、公平且测量一致的测试。",
            "hintEn": "High-quality evidence comes from repeated fair tests with consistent measurement."
          }
        ]
      }
    },
    {
      "id": "sci-k2-puzzle-explain-absorption-003",
      "level": "K2",
      "type": "matter",
      "thinkingUnit": "explanation",
      "mode": "puzzle",
      "difficulty": 1,
      "generator": "scenarioReasoningPuzzle",
      "rootGeneIds": [
        "RG.SCIENCE.EXPLANATION.BASIC",
        "RG.SCIENCE.EVIDENCE.BASIC"
      ],
      "mastery": {
        "requiredCorrect": 3,
        "window": 5
      },
      "cooldown": {
        "correct": 5,
        "familiar": 8,
        "mastered": 20,
        "wrong": 2
      },
      "params": {
        "scenarios": [
          {
            "type": "comparison_evidence_explanation_puzzle",
            "promptZh": "相同大小的纸巾和布各接触10格水，测试后纸巾旁剩2格，布旁剩5格。哪个说明最符合结果？",
            "promptEn": "Equal-sized paper towel and cloth each contacted 10 units of water. Afterward, 2 units remained by the paper towel and 5 by the cloth. Which explanation best fits the result?",
            "options": [
              {
                "zh": "这次测试中纸巾吸水更多，因为它留下的水更少",
                "en": "In this test the paper towel absorbed more because it left less water remaining",
                "role": "claim_evidence_explanation"
              },
              {
                "zh": "纸巾吸水更多是因为颜色更漂亮",
                "en": "The paper towel absorbed more because its color was nicer",
                "role": "unsupported_reason"
              },
              {
                "zh": "两种材料吸水量完全相同",
                "en": "Both materials absorbed exactly the same amount",
                "role": "contradicted"
              },
              {
                "zh": "所有纸巾在任何测试中都一定留下2格水",
                "en": "Every paper towel in every test will always leave 2 units",
                "role": "overgeneralized"
              }
            ],
            "hintZh": "使用剩余2格和5格的记录来支持本次测试的结论。",
            "hintEn": "Use the 2-unit and 5-unit records to support a conclusion limited to this test."
          }
        ]
      }
    },
    {
      "id": "sci-g1-puzzle-explain-cooling-003",
      "level": "G1",
      "type": "energy",
      "thinkingUnit": "explanation",
      "mode": "puzzle",
      "difficulty": 2,
      "generator": "scenarioReasoningPuzzle",
      "rootGeneIds": [
        "RG.SCIENCE.EXPLANATION.BASIC",
        "RG.SCIENCE.EVIDENCE.BASIC"
      ],
      "mastery": {
        "requiredCorrect": 3,
        "window": 5
      },
      "cooldown": {
        "correct": 5,
        "familiar": 8,
        "mastered": 20,
        "wrong": 2
      },
      "params": {
        "scenarios": [
          {
            "type": "controlled_comparison_explanation_puzzle",
            "promptZh": "两个相同杯子装相同温度和水量的温水。10分钟后，有布包裹的水是38格，无包裹的是32格。哪个解释最完整？",
            "promptEn": "Two identical cups held equal amounts of water at the same starting temperature. After 10 minutes, the cloth-wrapped cup measured 38 units and the unwrapped cup 32. Which explanation is most complete?",
            "options": [
              {
                "zh": "这次公平比较支持布包裹减慢降温，因为包裹杯10分钟后温度更高",
                "en": "This fair comparison supports that cloth wrapping slowed cooling because the wrapped cup remained warmer after 10 minutes",
                "role": "claim_evidence_reasoning"
              },
              {
                "zh": "包裹杯更好，因为布很好看",
                "en": "The wrapped cup was better because the cloth looked nice",
                "role": "preference"
              },
              {
                "zh": "两个杯子的结果完全相同",
                "en": "The two cups had exactly the same result",
                "role": "contradicted"
              },
              {
                "zh": "任何布都能让水永远保持温暖",
                "en": "Any cloth will keep water warm forever",
                "role": "overgeneralized"
              }
            ],
            "hintZh": "说明本次比较支持什么，并引用38格和32格的证据。",
            "hintEn": "State what this comparison supports and cite the 38-unit and 32-unit evidence."
          }
        ]
      }
    },
    {
      "id": "sci-g2-puzzle-explain-anomaly-003",
      "level": "G2",
      "type": "motion",
      "thinkingUnit": "explanation",
      "mode": "puzzle",
      "difficulty": 2,
      "generator": "scenarioReasoningPuzzle",
      "rootGeneIds": [
        "RG.SCIENCE.EXPLANATION.BASIC",
        "RG.SCIENCE.EVIDENCE.BASIC"
      ],
      "mastery": {
        "requiredCorrect": 3,
        "window": 5
      },
      "cooldown": {
        "correct": 5,
        "familiar": 8,
        "mastered": 20,
        "wrong": 2
      },
      "params": {
        "scenarios": [
          {
            "type": "anomalous_result_explanation_puzzle",
            "promptZh": "高斜坡测试四次，小球距离为9、10、9、5格；检查发现第四次路面有一块布，前三次路面相同。哪个解释最合理？",
            "promptEn": "A high-ramp test produced distances of 9, 10, 9, and 5 units. The fourth surface had a cloth on it, while the first three surfaces were the same. Which explanation is most reasonable?",
            "options": [
              {
                "zh": "前三次支持约9到10格的重复模式；第四次改变了路面，可能解释较短距离，应在相同路面下重新测试",
                "en": "The first three support a repeated 9-to-10-unit pattern; the changed fourth surface may explain the shorter distance, so it should be retested on the same surface",
                "role": "evidence_based_anomaly_explanation"
              },
              {
                "zh": "应删除前三次记录，只保留5格",
                "en": "Delete the first three records and keep only 5 units",
                "role": "cherry_picking"
              },
              {
                "zh": "四次完全相同，所以无需检查条件",
                "en": "All four results were identical, so conditions need not be checked",
                "role": "contradicted"
              },
              {
                "zh": "小球第四次不想滚远",
                "en": "The ball did not want to roll far on the fourth test",
                "role": "unsupported_reason"
              }
            ],
            "hintZh": "解释不同结果时，既保留全部记录，也检查测试条件是否一致。",
            "hintEn": "Keep every record and check whether test conditions stayed consistent when explaining a different result."
          }
        ]
      }
    },
    {
      id: 'sci-g1-activity-ramp-control-001',
      level: 'G1',
      type: 'motion',
      thinkingUnit: 'experimentation',
      runtime: 'activity',
      difficulty: 2,
      generator: 'rampControlActivity',
      rootGeneIds: [
        'RG.SCIENCE.EXPERIMENTATION.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 1, window: 1 },
      cooldown: { correct: 20, familiar: 20, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g1-explore-ramp-001',
      level: 'G1',
      type: 'motion',
      thinkingUnit: 'experimentation',
      runtime: 'explore',
      difficulty: 2,
      generator: 'rampLabExplore',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.PREDICTION.BASIC',
        'RG.SCIENCE.EXPERIMENTATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC',
        'RG.SCIENCE.EXPLANATION.BASIC'
      ],
      mastery: { requiredCorrect: 1, window: 1 },
      cooldown: { correct: 20, familiar: 20, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g1-puzzle-motion-roll-001',
      level: 'G1',
      type: 'motion',
      thinkingUnit: 'prediction',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'motionRollPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.PREDICTION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g1-puzzle-life-fly-001',
      level: 'G1',
      type: 'life',
      thinkingUnit: 'prediction',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'lifeFlyPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.PREDICTION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g2-activity-shadow-control-001',
      level: 'G2',
      type: 'energy',
      thinkingUnit: 'experimentation',
      runtime: 'activity',
      difficulty: 2,
      generator: 'shadowControlActivity',
      rootGeneIds: [
        'RG.SCIENCE.EXPERIMENTATION.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 1, window: 1 },
      cooldown: { correct: 20, familiar: 20, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g2-puzzle-shadow-variable-control-001',
      level: 'G2',
      type: 'energy',
      thinkingUnit: 'experimentation',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'shadowVariableControlPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EXPERIMENTATION.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 8, familiar: 12, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g2-puzzle-ramp-explanation-001',
      level: 'G2',
      type: 'motion',
      thinkingUnit: 'explanation',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'rampExplanationPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EXPLANATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC',
        'RG.SCIENCE.EXPERIMENTATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 8, familiar: 12, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g2-puzzle-ramp-evidence-001',
      level: 'G2',
      type: 'motion',
      thinkingUnit: 'evidence',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'rampEvidencePuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EVIDENCE.BASIC',
        'RG.SCIENCE.EXPERIMENTATION.BASIC',
        'RG.SCIENCE.EXPLANATION.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 8, familiar: 12, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g2-puzzle-earth-question-001',
      level: 'G2',
      type: 'earth',
      thinkingUnit: 'questioning',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'earthQuestionPuzzle',
      rootGeneIds: ['RG.SCIENCE.QUESTIONING.BASIC'],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g2-explore-shadow-001',
      level: 'G2',
      type: 'energy',
      thinkingUnit: 'experimentation',
      runtime: 'explore',
      difficulty: 2,
      generator: 'shadowChangesExplore',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.PREDICTION.BASIC',
        'RG.SCIENCE.EXPERIMENTATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC',
        'RG.SCIENCE.EXPLANATION.BASIC'
      ],
      mastery: { requiredCorrect: 1, window: 1 },
      cooldown: { correct: 20, familiar: 20, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g2-puzzle-energy-question-001',
      level: 'G2',
      type: 'energy',
      thinkingUnit: 'questioning',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'energyQuestionPuzzle',
      rootGeneIds: ['RG.SCIENCE.QUESTIONING.BASIC'],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 5, familiar: 8, mastered: 20, wrong: 2 },
      params: {}
    }
  ]
};
