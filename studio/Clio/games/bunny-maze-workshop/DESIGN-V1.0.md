# Bunny Direction Maze · DESIGN-V1.0

## Positioning
- Game ID: clio-bunny-maze-workshop
- Theme: Directional control interaction with rabbit pawns
- Audience: Kids (early primary)

## Core Idea
Four rabbit pawns are directional controls, not four starting points.

Mapping:
- rabbit right -> move right
- rabbit left -> move left
- rabbit up -> move up
- rabbit down -> move down

## Learning Objective
- Build control mapping from icon to movement.
- Practice step-wise planning in a constrained maze.
- Encourage correction after invalid moves (wall bumps).

## MVP Scope
- Fixed-width maze corridors using fixed cell size.
- 6 levels with single target per level.
- Progression: easy paths -> turns -> maze-like routing.
- Real-time counters: steps, bumps, elapsed time.
- Session event dump in JSON for diagnostics.

## Event Contract
- game_id
- ts
- lang
- difficulty_dimension
- content_version
- events[]

Event types in v1.0:
- session_start
- move
- bump
- level_clear
- session_clear

## Runtime Safety
- Uses ClioRuntimeBridge controller.
- Session reset clears previous timers.
- Background lifecycle pause stops progression safely.

## Future Extension
- Add multi-target sequence mode.
- Add ghost path replay after level clear.
- Add adaptive hints based on bump frequency.
