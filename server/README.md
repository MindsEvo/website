# MindsEvo Local Report Server

This is a local-only server used to collect raw game attempts and verify report data on the server side.

## Features

- Local SQLite persistence
- Server-side report recomputation
- Report submit endpoint: `POST /api/v1/reports/submit`
- Report query endpoint: `GET /api/v1/reports/:sessionId`
- History save endpoint: `POST /api/v1/history/save`
- History load endpoint: `GET /api/v1/history/load/:sessionId`
- History statistics endpoint: `GET /api/v1/history/statistics`
- History filter options endpoint: `GET /api/v1/history/catalog/options`
- History overview endpoint: `GET /api/v1/history/statistics/overview`
- History recommendation endpoint: `GET /api/v1/history/recommend`
- Radar record ingest endpoint: `POST /api/v1/radar/records`
- Radar matrix read endpoint: `GET /api/v1/radar/matrix`
- Health endpoint: `GET /health`

## Run locally

1. Install dependencies:

   npm install

2. Start server:

   npm run dev

3. Default server URL:

   http://localhost:8787

## Example payload

```json
{
  "sessionId": "sess-001",
  "gameKey": "number-pattern-hunter",
  "geneIds": ["RG.PATTERN.SEQUENCE.BASIC"],
  "locale": "zh",
  "startedAt": "2026-07-04T10:00:00.000Z",
  "finishedAt": "2026-07-04T10:03:00.000Z",
  "attempts": [
    {
      "questionIndex": 0,
      "questionId": "Q1",
      "selectedOption": "A",
      "isCorrect": true,
      "usedHint": false,
      "responseMs": 4200
    },
    {
      "questionIndex": 1,
      "questionId": "Q2",
      "selectedOption": "C",
      "isCorrect": false,
      "usedHint": true,
      "responseMs": 6900
    }
  ]
}
```

## History API quick usage

1. Save history (same payload as submit):

  `POST /api/v1/history/save`

2. Load one history session:

  `GET /api/v1/history/load/:sessionId`

3. Aggregate statistics:

  `GET /api/v1/history/statistics?gameKey=number-pattern-hunter&geneId=RG.PATTERN.SEQUENCE.BASIC&limit=200`

4. Aggregate overview by game:

  `GET /api/v1/history/statistics/overview?limit=1000`

  Optional filters:

  `GET /api/v1/history/statistics/overview?limit=1000&gameKey=number-pattern-hunter&geneId=RG.PATTERN.SEQUENCE.BASIC`

5. Get recommendations:

  `GET /api/v1/history/recommend?topN=3`

Recommendation output now includes metadata-mapped `targets` for each weak RootGene:

- `targets.games[]`
- `targets.lessons[]`
- `targets.videos[]`

Recommendation output also includes adaptive policy fields:

- `policy.band` (`foundation_rebuild`, `stabilize_and_transition`, `advance_and_challenge`)
- `policy.targetDifficulty` (expected learning level)
- `policy.resolvedDifficulty` (best available level in metadata)

Overview output now includes daily trend:

- `dailyTrend[]` with `day`, `sessions`, `avgAccuracy`, `avgScore`

History Lab page:

- `history/index.html`
- Supports server URL, `gameKey`, and `geneId` filter inputs
- Autocomplete options come from `GET /api/v1/history/catalog/options`

## Radar API quick usage

Records are stored verbatim (no field renaming), keyed by `(profileId, key)` for
idempotent re-posting. `key` is the same history key the client already computes
in `report()` (`{gameId}:history:{ts}` with a `-N` suffix on collision).

1. Post a batch of records:

  `POST /api/v1/radar/records`

  ```json
  {
    "records": [
      {
        "key": "find-it:history:1700000000000",
        "record": {
          "profileId": "p1",
          "gameId": "find-it",
          "ts": 1700000000000,
          "gradeCode": "K1",
          "geneIds": ["RG.ATTENTION.SEARCH.VISUAL"],
          "score": 8,
          "total": 10
        }
      }
    ]
  }
  ```

  Response: `{ "ok": true, "accepted": ["find-it:history:1700000000000"], "rejected": [] }`

2. Read the aggregated (gene × grade) matrix for a profile:

  `GET /api/v1/radar/matrix?profileId=p1`

  Response is the verbatim output of `radar-reader.js`'s `RadarReader.read()`
  (the server does not reimplement aggregation), wrapped in `{ "ok": true, ... }`.
