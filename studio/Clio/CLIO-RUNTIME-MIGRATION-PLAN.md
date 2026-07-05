# Clio Runtime Migration Plan (Phase A, No UI Rewrite)

## Objective

Standardize the three existing Clio games on shared runtime safety while preserving current custom visuals and gameplay layouts.

Scope in this phase:
- Integrate shared runtime bridge usage patterns
- Keep existing game mechanics unchanged
- Avoid Shell-1/Shell-2 visual migration

Out of scope in this phase:
- New gameplay features
- Visual redesign
- Backend schema redesign

## Priority Order

1. Prediction Workshop (highest risk observed on Android timing/touch)
2. Sorting Workshop
3. Word Connections Workshop

## Shared Phase A Requirements (all 3 games)

- Use session reset on start/reset paths
- Ensure all loop timers are session-guarded and owner-cleanable
- Ensure touch/click interaction is normalized for key controls
- Pause safely on background lifecycle event
- Keep dump-session output stable and parseable

## Game-by-Game Task List

## A) Prediction Workshop

Current status:
- Phase A bridge integration completed (runtime timer/input/lifecycle alignment)
- Keep validating on Android/iPad/Desktop matrix for regression watch

Tasks:
- Replace local timer scheduling wrappers with bridge-owned timer calls
- Move lane timer ownership under explicit owner keys (demo-lane, practice-lane)
- Route choice button interaction through bridge tap binding helper
- Route background pause through bridge lifecycle subscription
- Keep existing scoring/event payload unchanged

Acceptance:
- 20 rounds continuous on Android Pad without lane freeze
- 20 rounds on iPad and Desktop with identical counters behavior
- Reset during running state never leaks stale callbacks

## B) Sorting Workshop

Current status:
- Phase A bridge integration completed (session/timer/input/lifecycle alignment)
- Continue stress testing for rapid reset/start drag scenarios

Tasks:
- Adopt bridge session reset for start/reset
- Convert spawn/fall loop timers to bridge timer ownership
- Keep drag logic, but ensure tap-based controls use unified tap binding
- Add lifecycle background pause and deterministic resume/reset policy

Acceptance:
- Continuous run does not duplicate spawns after reset
- No stale object updates after immediate start-reset-start sequence
- Counters and event stream remain deterministic

## C) Word Connections Workshop

Current status:
- Phase A bridge integration completed (session reset + unified tap + lifecycle pause alignment)
- Keep graph validation and scoring policy unchanged

Tasks:
- Use bridge session reset for level switch and reset
- Move any deferred callbacks to bridge timer calls
- Ensure node/line interactions use unified tap where appropriate
- Keep relation_type validation and duplicate scoring policy unchanged

Acceptance:
- Repeated level switches never preserve stale edge state
- Undo/remove operations remain deterministic under touch and click
- Event payload shape remains stable

## Test Matrix (Mandatory)

Devices:
- Desktop Chrome
- iPad Safari
- Android Pad Chrome/WebView

Scenarios:
- Start -> play 20 rounds
- Rapid reset/start stress
- Background -> foreground during active round
- Language switch during active and idle states

## Deliverables for Phase A Completion

- Updated runtime integration in three game.js files
- Short migration notes per game (what changed, what intentionally did not change)
- Passed matrix checklist attached to Clio examples checklist

Current progress note:
- Prediction Workshop: completed
- Sorting Workshop: completed
- Word Connections Workshop: completed
