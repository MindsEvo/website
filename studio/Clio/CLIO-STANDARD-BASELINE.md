# Clio Standard Baseline (Examples -> Reusable Templates)

## Goal

Turn current Clio examples into stable reference templates for future design-to-game implementation.

Current examples:
- Sorting Workshop
- Prediction Workshop
- Word Connections Workshop

## 1) Template Families

Define three template families from current examples:

1. Sorting Template
- Core loop: falling objects -> drag/select target -> immediate correctness feedback
- Typical data: category set, speed level, event stream

2. Prediction Template
- Core loop: observe -> predict -> verify
- Typical data: phase split, reaction time, correctness, lane/phase events

3. Connections Template
- Core loop: build relation edges -> validate against closed graph
- Typical data: edge key, relation type, duplicate attempt, first-edge behavior

## 2) Required Folder Shape (for every new Clio game)

```text
studio/Clio/games/<game-id>/
  index.html
  style.css
  game.js
  data.js            # if gameplay uses content graph/question bank
  DESIGN-Vx.y.md     # design + scope + boundaries
```

## 3) Runtime Compatibility Baseline (Mandatory)

All Clio games must align with global shell runtime strategy:

- Session isolation: no stale callback can affect new game session.
- Timer governance: reset/start must clear old timers deterministically.
- Lifecycle safety: background/foreground transitions must not corrupt state.
- Input normalization: touch/click behavior must be logically equivalent.
- Animation stability: repeated rounds must not lose animation after first round.
- Diagnostics: timing/input state should be traceable when needed.

## 4) Data/Event Minimum Contract

Each game should persist:

- game_id
- ts
- lang
- difficulty_dimension
- events[]

Each event should include:

- phase or mode
- is_correct (when applicable)
- reaction_time_ms (when applicable)
- payload fields specific to game mechanics

## 5) Naming and Versioning

- Game ID format: clio-<topic>-workshop
- localStorage key prefix: me:clio:<topic>:...
- Content version field in data: <topic>_v<major>_<date>

## 6) UX Consistency Rules

- Top controls order: lang -> music -> sfx (if audio exists)
- Feedback area always visible and language-aware
- Reset always returns to deterministic clean state
- Dump Session JSON should remain available in MVP and testing stages

## 7) Scope Discipline

MVP should only include deterministic evaluation logic.
Open-ended AI scoring is roadmap-only unless platform-level capability is approved.

## 8) Acceptance Checklist

- [ ] 20-round stress run without visual freeze on Desktop Chrome
- [ ] 20-round stress run without visual freeze on iPad Safari
- [ ] 20-round stress run without visual freeze on Android Pad Chrome/WebView
- [ ] reset/start cannot be affected by old timers
- [ ] language switching keeps labels and feedback consistent
- [ ] event payload can be dumped and parsed without errors
- [ ] no cross-game storage key collision
