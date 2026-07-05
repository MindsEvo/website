# Clio Template Pack (Runtime-Compatible)

## Purpose

This pack is a starter for new Creating Studio games that should keep custom visuals but share global shell runtime safety.

## Included

- Shared bridge: `games/_shared/clio-runtime-bridge.js`
- Shared shell-like style base: `games/_shared/clio-shell-bridge.css`
- Copy-ready template game: `games/_template-runtime/`

## How to use

1. Copy folder `games/_template-runtime` to a new game id folder.
2. Rename and update `data.js` fields (`id`, title, subtitle).
3. Implement your own gameplay loop in `game.js`.
4. Keep runtime calls from bridge:
   - `resetSession()` on start/reset
   - `setTimer()` for all gameplay timers
   - `bindTap()` for touch/click controls
   - `onLifecyclePause()` for background safety

## What this standard guarantees

- Session isolation against stale callbacks.
- Timer cleanup on reset/new session.
- Touch/click unified behavior.
- Background transition safety.
- Animation start-frame commit helpers.

## Notes

- This does not force Shell-1 visual layout.
- It only standardizes runtime compatibility and baseline UI semantics.
