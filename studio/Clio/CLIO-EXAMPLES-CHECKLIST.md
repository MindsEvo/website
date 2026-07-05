# Clio Examples Checklist (Current 3 Games)

Execution reference:
- See CLIO-RUNTIME-MIGRATION-PLAN.md for Phase A migration order and acceptance matrix.

## A. Sorting Workshop (reference: sorting template)

- [ ] Core action is stable on touch and pointer
- [ ] Basket mapping fallback works near lane boundaries
- [ ] correct/wrong/miss counters stay in sync with events
- [ ] reset clears active objects and timers

## B. Prediction Workshop (reference: prediction template)

- [ ] Demo lane and Practice lane run independently
- [ ] Choice interaction works repeatedly on Android/iPad/PC
- [ ] pause/resume preserves lane timers and visual positions
- [ ] old callbacks cannot update a new session

## C. Word Connections Workshop (reference: graph template)

- [ ] One word can connect to multiple edges
- [ ] Duplicate edge attempts are logged but not double-scored
- [ ] relation_type is validated (antonym/co-occurrence)
- [ ] line removal and undo remain deterministic

## D. Global Consistency

- [ ] Bilingual labels are complete and semantically aligned
- [ ] localStorage keys are namespaced by game
- [ ] Dump Session JSON works and output shape is stable
- [ ] UI remains usable on desktop and tablet resolutions
