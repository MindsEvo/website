# MetaThinking Module Metadata Standard (comparison.json)

## Version

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

1. JSON parse success.
2. Required fields completeness.
3. `levelMap` contains L1-L8 without duplicates.
4. Referenced game/video IDs exist in `metadata/game.json` and `metadata/video.json` when marked implemented.
5. `rootGeneIds` follow `RG.SCOPE.CATEGORY.NODE` naming pattern.

Validation tool:

1. `tools/validate-metathinking.mjs`

Run in `web` directory:

```bash
node tools/validate-metathinking.mjs
```
