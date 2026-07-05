# Word Connections V1.1 Implementation Notes

## 1) Scope
- Included in MVP: L1 unique pairing + L2 closed many-to-many graph
- Not included in MVP: open AI scoring (L3)

## 2) Graph Rules
- Edges are treated as undirected
- Canonical edge key: sort two node ids and join with `|`
- Duplicate edge attempts are logged but not scored again

## 3) Data Schema
```json
{
  "content_version": "wc_v1_2026_07",
  "reviewer": "pending-content-review",
  "reviewed_at": null,
  "levels": {
    "L1": {
      "nodes": ["yes", "no"],
      "edges": [
        { "from": "yes", "to": "no", "relation_type": "antonym" }
      ]
    },
    "L2": {
      "nodes": ["more", "less", "need", "want"],
      "edges": [
        { "from": "more", "to": "less", "relation_type": "antonym" },
        { "from": "more", "to": "want", "relation_type": "co-occurrence" }
      ]
    }
  },
  "lexicon": {
    "more": {
      "lemma": "more",
      "display": { "en": "more", "zh": "more" }
    }
  }
}
```

## 4) Event Schema
```json
{
  "attempt_id": "attempt_12",
  "edge_key": "more|want",
  "word_a": "more",
  "word_b": "want",
  "relation_type": "co-occurrence",
  "is_correct": true,
  "is_duplicate": false,
  "is_first_edge_for_word_a": false,
  "is_first_edge_for_word_b": true,
  "reaction_time_ms": 954,
  "difficulty_level": "L2",
  "timestamp": "2026-07-04T03:15:00.000Z"
}
```

## 5) QA Gate
- relation_type enum is limited to antonym and co-occurrence
- L2 graph must be reviewed by content team before production release
- RootGene tags are carried in payload metadata, not hardcoded as scoring logic
- Session data is isolated from Sorting Workshop and Prediction Workshop
- UI supports one word connected to multiple edges (no remove-on-match behavior)

## 6) Interaction Constraints
- Tap/tap connection is supported (not drag-only)
- Existing line can be removed by clicking it
- Undo last edge is available
