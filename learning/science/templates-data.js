/**
 * SCI_TEMPLATES_DATA — global-variable template bank for the Science module.
 * Loaded as a plain <script> (not fetch()) because file:// fetch of JSON is
 * blocked by browsers with no local server running — same reason
 * comparison/templates-data.js uses this pattern instead of templates.json.
 *
 * Architecture-scaffold MVP: exactly one Puzzle template and one Explore
 * template, both under the "matter" Context Domain at K1. This proves the
 * two pipelines (Puzzle -> checkAnswer -> recordAttempt, and
 * Explore -> ActivityRunner -> ExploreRuntime -> recordAttempt) without a
 * real question bank.
 */
window.SCI_TEMPLATES_DATA = {
  version: 'v0.1.0-scaffold',
  module: 'science',
  templates: [
    {
      id: 'sci-k1-puzzle-float-001',
      level: 'K1',
      type: 'matter',
      mode: 'puzzle',
      difficulty: 1,
      generator: 'floatSinkPuzzle',
      rootGeneIds: ['RG.SCIENCE.PREDICTION.BASIC'],
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
    }
  ]
};
