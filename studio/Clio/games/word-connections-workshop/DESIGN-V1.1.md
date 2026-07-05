# Word Match V1.1 Implementation Notes

## 1) Scope
- Included in MVP: one-to-one pair matching with random word sampling
- Included in L2/L3: repeated-word position distractors on the right side
- Not included in MVP: semantic network / one-to-many relation gameplay

## 2) Matching Rules
- The correct action is to connect the exact same word across the two sides
- Words are randomly sampled from a predefined word pool each round
- Both sides are shuffled independently every round
- Repeated words may appear on the left or the right as position distractors

## 3) Data Schema
```json
{
  "content_version": "wm_v1_2026_07",
  "reviewer": "pending-content-review",
  "reviewed_at": null,
  "layout_shape": "columns",
  "levels": {
    "L1": { "pair_count": 4, "duplicate_right_count": 0 },
    "L2": { "pair_count": 5, "duplicate_right_count": 1 }
  },
  "word_pool": ["yes", "no", "keep", "more"]
}
```

## 4) Event Schema
```json
{
  "attempt_id": "attempt_12",
  "word_a": "share",
  "word_b": "keep",
  "is_correct_pair": true,
  "is_distractor_involved": true,
  "reaction_time_ms": 954,
  "difficulty_level": "L2",
  "layout_shape": "columns",
  "timestamp": "2026-07-05T03:15:00.000Z"
}
```

## 5) QA Gate
- Pair pool must be reviewed by content team before production release
- Repeated-word distractors must be randomly positioned each round
- Matching logic must stay independent from future layout shapes
- Session data remains isolated from Sorting Workshop and Prediction Workshop

## 6) Interaction Constraints
- Pick left first, then pick a right word
- Correct match locks that pair and its repeated-word copies
- Existing line can be clicked to undo the last confirmed match
- Undo last match remains available in MVP/testing builds
