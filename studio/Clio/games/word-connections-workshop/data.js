window.WORD_CONNECTIONS_DATA = {
  content_version: "wc_v1_2026_07",
  reviewer: "pending-content-review",
  reviewed_at: null,
  main_rootgene: "Multi-dimensional Thinking",
  secondary_rootgene: "Classification",
  levels: {
    L1: {
      id: "L1",
      label: "Unique Pairing",
      target_edges: 4,
      nodes: [
        "yes", "no", "more", "less", "share", "keep", "need", "want"
      ],
      edges: [
        { from: "yes", to: "no", relation_type: "antonym" },
        { from: "more", to: "less", relation_type: "antonym" },
        { from: "share", to: "keep", relation_type: "antonym" },
        { from: "need", to: "want", relation_type: "co-occurrence" }
      ]
    },
    L2: {
      id: "L2",
      label: "Network Connections",
      target_edges: 10,
      nodes: [
        "and", "so", "like", "need", "more", "less", "want", "have",
        "yes", "no", "maybe", "dont", "share", "keep"
      ],
      edges: [
        { from: "yes", to: "no", relation_type: "antonym" },
        { from: "more", to: "less", relation_type: "antonym" },
        { from: "share", to: "keep", relation_type: "antonym" },
        { from: "need", to: "want", relation_type: "co-occurrence" },
        { from: "need", to: "have", relation_type: "co-occurrence" },
        { from: "more", to: "need", relation_type: "co-occurrence" },
        { from: "more", to: "want", relation_type: "co-occurrence" },
        { from: "dont", to: "want", relation_type: "co-occurrence" },
        { from: "like", to: "want", relation_type: "co-occurrence" },
        { from: "and", to: "so", relation_type: "co-occurrence" }
      ]
    }
  },
  lexicon: {
    and: { lemma: "and", display: { en: "and", zh: "and" } },
    so: { lemma: "so", display: { en: "so", zh: "so" } },
    like: { lemma: "like", display: { en: "like", zh: "like" } },
    need: { lemma: "need", display: { en: "need", zh: "need" } },
    more: { lemma: "more", display: { en: "more", zh: "more" } },
    less: { lemma: "less", display: { en: "less", zh: "less" } },
    want: { lemma: "want", display: { en: "want", zh: "want" } },
    have: { lemma: "have", display: { en: "have", zh: "have" } },
    yes: { lemma: "yes", display: { en: "yes", zh: "yes" } },
    no: { lemma: "no", display: { en: "no", zh: "no" } },
    maybe: { lemma: "maybe", display: { en: "maybe", zh: "maybe" } },
    dont: { lemma: "dont", display: { en: "dont", zh: "dont" } },
    share: { lemma: "share", display: { en: "share", zh: "share" } },
    keep: { lemma: "keep", display: { en: "keep", zh: "keep" } }
  }
};
