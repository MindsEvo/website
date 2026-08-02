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

- `web/history/index.html`
- Supports server URL, `gameKey`, and `geneId` filter inputs
- Autocomplete options come from `GET /api/v1/history/catalog/options`
