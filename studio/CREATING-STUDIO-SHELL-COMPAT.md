# Creating Studio x Global Shell Compatibility Draft

## Scope

This note defines how Creating Studio (including Clio games) aligns with global Shell architecture while preserving existing playable pages.

## Decision

- Global shell remains platform-level and shared.
- Studio games can keep custom UI layouts.
- Runtime compatibility must be shared through `shell.runtime` (session, timers, lifecycle, input, animation, diagnostics).

## Compatibility Contract

1. UI layer
- Studio pages may use custom HTML/CSS and do not need to adopt Shell-1 card layout.
- Shared components (lang, audio, top controls) should use consistent labels and behavior.

2. Runtime layer (mandatory)
- Use `shell.runtime.beginSession()` per game start/reset.
- Use `shell.runtime.setGuardedTimer()` for all loop timers.
- Use `shell.runtime.bindUnifiedTap()` for touch-first interactive controls.
- Subscribe `shell.runtime.onLifecycle()` and pause on background.

3. Data/report layer
- Keep per-game storage keys isolated.
- Include `shell` and `runtimeVersion` fields in report payloads for traceability.

## Mapping Existing Studio Games

- Sorting Workshop: custom UI, migrate timer/input handling to `shell.runtime` in phase 1.
- Prediction Workshop: custom UI, partially hardened; align to `shell.runtime` API in phase 1.
- Word Connections: custom UI, adopt guarded timers for future timed modes.

## Rollout Plan

Phase A (safe, no UI rewrite)
- Import `shell.js` into studio games.
- Replace local timer wrappers with guarded timers.
- Replace touch/click custom handlers with unified tap helper.

Phase B (consistency)
- Normalize lifecycle behavior (background -> pause, foreground -> resumable state).
- Add runtime diagnostics toggle for device-specific issues.

Phase C (optional)
- Extract reusable studio header controls into a tiny shared component.
- Keep game-specific playfields independent.

## Gate for Studio Integration

All items must pass before full migration:

- No stale callback updates after reset/start new session.
- 20-round stress test passes on Desktop Chrome, iPad Safari, Android Pad Chrome.
- touch and click produce identical logical outcomes.
- background/foreground does not corrupt counters or lane state.

## Non-Goals

- No forced conversion of studio games into Shell-1/Shell-2 visual templates.
- No immediate backend reporting changes in this step.
