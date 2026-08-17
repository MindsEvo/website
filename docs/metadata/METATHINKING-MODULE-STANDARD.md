# MetaThinking Module Metadata Standard (comparison.json)

## Version

- draft v0.3.0 (2026-08-16) — added §5c `statistics` for Mini-game activities, the
  `game_mode` bucketing rule for time KPIs, and the one-template-one-Attempt guarantee
- draft v0.2.0 (2026-08-12) — added `levelMap` implementation cross-reference fields and the `partial` status
- draft v0.1.0 (2026-08-02)
- Scope: Meta-thinking modules for AI-readable publishing

## 1. Goal

Define a machine-readable module object so external AI/search ecosystems can index and reason over MindsEvo content directly from JSON, not only by crawling HTML text.

This standard is for module-level knowledge objects such as `comparison.json`.

## 2. File Layout

1. Module index: `metadata/metathinking/index.json`
2. Module object example: `metadata/metathinking/comparison.json`

## 3. Design Principles

1. Knowledge is a carrier; thinking is the training target.
2. Age coverage is 4-5 years to primary graduation for v1.
3. Reference global K-12 curricula as background, without adding extra knowledge burden.
4. Start with a minimal type tree and a few representative examples, then expand iteratively.

## 4. Required Fields (v1)

Each module JSON must include:

1. `version`
2. `updatedAt`
3. `moduleType`
4. `id`
5. `canonicalUrl`
6. `title` (`zh`, `en`)
7. `description` (`zh`, `en`)
8. `ageRange` (`min`, `max`)
9. `educationReference`
10. `rootGeneIds`
11. `difficultyAxes`
12. `typeTree`
13. `levelMap`
14. `prerequisites`
15. `videos`
16. `exercises`
17. `statistics`
18. `aiQueryHints`
19. `tags`

## 5. Comparison v1 Baseline

For `comparison.json`, the first release baseline is:

1. A scientific concept definition for comparison.
2. A type tree with framework-first strategy:
- quantity
- spatial_visual
- temporal
- logic_strategy
- information
3. An 8-level map from age 4-5 to primary graduation.
4. A small number of representative implemented examples mapped to existing games.

## 5a. levelMap Implementation Cross-Reference (v0.2.0)

`levelMap` uses the curriculum ladder `L1`–`L8` (keyed by age). Games use their own
grade codes (`K1` `K2` `G1` `G2` …). These are two different taxonomies, so a level
entry that claims implementation MUST say which in-game level backs it:

| Field | Required when | Meaning |
|-------|---------------|---------|
| `gradeCode` | `status` is `implemented` or `partial` | In-game level id, e.g. `K1` |
| `implementedModes` | `status` is `implemented` or `partial` | Experience types actually shipped at that level, e.g. `["puzzle","sort","fit"]` |
| `coverageGapZh` / `coverageGapEn` | `status` is `partial` | What is missing, in one sentence, bilingual |

`status` allowed values:

1. `implemented` — the level objective is fully playable.
2. `partial` — playable but an explicitly named part of the objective is missing.
   Requires `coverageGapZh` / `coverageGapEn`.
3. `planned` — nothing shipped; `gradeCode` / `implementedModes` must be omitted.

Rationale: `planned` on a level that children can already play, or `implemented` on a
level that only covers half its objective, both mislead external indexers. `partial`
plus a stated gap keeps the claim honest.

## 5b. statistics for Interaction Activities (v0.2.0)

Drag-and-drop activities do not submit an answer, so answer-oriented event keys are not
enough. Modules that ship Interaction modes should also declare:

1. Event keys: `activity_start`, `activity_move`, `activity_correction`, `activity_finish`.
2. Dimensions: `gradeCode`, `interactionMode`.
3. KPIs: `avgCorrections` (process struggle), `optimalChoiceRate` (chose the best of
   several workable solutions).

See `docs/patterns/COMPARISON-INTERACTION-IMPLEMENTATION.md` §6 for the runtime-side
`process` payload these aggregate over.

## 5c. statistics for Mini-game Activities (v0.3.0)

A mini-game is one timed continuous scene containing many rounds, reported as **one**
Attempt. Modules that ship `mini` runtimes MUST declare:

1. Event keys: `round_start`, `round_answer`, `game_finish`.
   These are declared now but **not uploaded in phase 1** — only the summary Attempt is.
   Declaring them early fixes the vocabulary so per-round telemetry can be switched on
   later without a schema break.
2. Dimensions: `gameEngine` (which adapter, e.g. `quick_compare`), `endReason`
   (`roundTarget` | `timeout` | `poolEnd` | `adapter`).
3. KPIs: `bestStreak` (sustained correctness under time pressure) and `avgRoundMs`
   (the only time metric comparable across modes).

### 5c.1 `avgTimeMs` MUST be bucketed by `game_mode`

`responseMs` carries a different unit of work per mode:

| mode | `responseMs` means | typical |
|------|--------------------|---------|
| `puzzle` | one question's thinking time | 2–15 s |
| `sort` `match` `group` `fit` | one activity's completion time | 10–90 s |
| `mini` | **the whole run, 12–18 rounds** | 30–40 s |

Aggregating `avgTimeMs` across modes therefore overstates a child's per-question
thinking time by an order of magnitude the moment a mini-game is played. Any
time-based KPI MUST be split by the `game_mode` field that `engine.js` writes onto
every event. For mini-games the comparable metric is `process.avgRoundMs`.

### 5c.2 `implementedModes` value

Mini-game levels add `"mini"` to `levelMap[].implementedModes`. The value names the
**runtime**, not the adapter — a level running two different mini-games still lists
`"mini"` once, and the adapter is distinguished by the `gameEngine` dimension.

### 5c.3 One template, one Attempt

Metadata consumers may assume: **a mini-game template contributes exactly one
Attempt to a cycle**, identical in weight to one puzzle question. Round counts appear
only inside `process`, never as attempt volume. Any future per-round event stream is
telemetry and MUST NOT be counted as attempts.

See `docs/patterns/COMPARISON-MINIGAME-IMPLEMENTATION.md` §9 for the runtime-side
`process` payload these aggregate over.

### 5c.4 Inside `mini`, metrics MUST still be bucketed by `gameEngine`

`game_mode: 'mini'` is not a unit of work — each adapter defines its own round:

| `gameEngine` | one round is | `polarity_confusion` there means |
|--------------|--------------|----------------------------------|
| `quick_compare` | a two-way choice between two cards | the ask was "which is less" and the child picked the bigger one |
| `build_time` | one placement, taken from a shrinking pile | the child grabbed the opposite extreme of the pile |

Both engines report the same two `errorType` values (`perception`,
`polarity_confusion`), but a round costs different work and the same error label
describes a different slip, so accuracy, `avgRoundMs`, `bestStreak` and error mix are
comparable **within** an engine and not across engines. The module JSON states this as
the `engine-not-poolable` aggregation rule.

A level that ships two mini-games (comparison G2 does) still lists `"mini"` once in
`implementedModes` per §5c.2 — `gameEngine` is where the split lives, which is exactly
why that dimension is mandatory and not optional detail.

## 6. External AI Discoverability Notes

To improve indexing and retrieval by external systems (Google/OpenAI/YouTube and similar):

1. Keep stable IDs and canonical URLs.
2. Keep bilingual title/description consistent with page content.
3. Keep version and updatedAt accurate for incremental refresh.
4. Keep type/level tags normalized and reusable across modules.
5. Link videos by explicit IDs instead of only free text.

## 7. Relationship to Existing Metadata

1. `game.json`, `lesson.json`, `video.json` remain runtime/course linkage metadata.
2. `metathinking/*.json` is module cognition metadata for AI-readable knowledge organization.
3. Cross-link by IDs (`gameId`, `lessonId`, `videoId`, `rootGeneId`) wherever possible.

## 8. Validation (recommended)

Before publishing a new module JSON, validate:

1. JSON parse success (**no UTF-8 BOM** — a BOM makes the validator abort on the whole
   metadata set, not just the offending file).
2. Required fields completeness.
3. `levelMap` contains L1-L8 without duplicates.
4. Referenced game/video IDs exist in `metadata/game.json` and `metadata/video.json` when marked implemented.
5. `rootGeneIds` follow `RG.SCOPE.CATEGORY.NODE` naming pattern.
6. Every `implemented` / `partial` level carries `gradeCode` and `implementedModes`; every
   `partial` level carries `coverageGapZh` / `coverageGapEn` (see §5a).

Validation tool:

1. `tools/validate-metathinking.mjs`

Run in `web` directory:

```bash
node tools/validate-metathinking.mjs
```
