# Web Docs Index

This folder is the documentation entry point for the current `web` workspace.

## Quick Start (For AI and Developers)

1. Read `shell/GAME-SHELL-CONVENTION.md` first.
2. Read `shell/SHELL-FEATURE-GATE.md` before changing shared shell behavior.
3. Read `patterns/PATTERN-QUALITY-GATE.md` before adding or editing pattern modules.
4. Read module-specific docs in `patterns/` when touching a corresponding module.

## Shell Docs

- shell/GAME-SHELL-CONVENTION.md
- shell/SHELL-FEATURE-GATE.md

## Pattern Docs

- patterns/PATTERN-QUALITY-GATE.md
- patterns/SPATIAL-PATTERN-MODULE.md
- patterns/QUANTITY-PATTERN-MODULE.md

## Documentation Rules

- Put platform/runtime behavior docs in `docs/shell`.
- Put pattern quality or module specs in `docs/patterns`.
- New module docs should follow `PATTERN-NAME-MODULE.md` naming style.
- If a change affects both shell and pattern rules, update both folders.
