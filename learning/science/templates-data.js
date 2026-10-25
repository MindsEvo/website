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
