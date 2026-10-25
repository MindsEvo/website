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
      runtime: 'explore',
      difficulty: 1,
      generator: 'floatSinkExplore',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.QUESTIONING.BASIC',
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
      runtime: 'explore',
      difficulty: 1,
      generator: 'magnetExplore',
      rootGeneIds: [
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.QUESTIONING.BASIC',
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
      id: 'sci-g1-activity-ramp-control-001',
      level: 'G1',
      type: 'motion',
      runtime: 'activity',
      difficulty: 2,
      generator: 'rampControlActivity',
      rootGeneIds: [
        'RG.SCIENCE.EXPERIMENTATION.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 1, window: 1 },
      cooldown: { correct: 20, familiar: 20, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g1-explore-ramp-001',
      level: 'G1',
      type: 'motion',
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
      id: 'sci-g2-puzzle-shadow-variable-control-001',
      level: 'G2',
      type: 'energy',
      mode: 'puzzle',
      difficulty: 2,
      generator: 'shadowVariableControlPuzzle',
      rootGeneIds: [
        'RG.SCIENCE.EXPERIMENTATION.BASIC',
        'RG.SCIENCE.OBSERVATION.BASIC',
        'RG.SCIENCE.EVIDENCE.BASIC'
      ],
      mastery: { requiredCorrect: 3, window: 5 },
      cooldown: { correct: 8, familiar: 12, mastered: 20, wrong: 2 },
      params: {}
    },
    {
      id: 'sci-g2-puzzle-ramp-explanation-001',
      level: 'G2',
      type: 'motion',
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
