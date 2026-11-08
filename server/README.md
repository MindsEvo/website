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
- Fixed chess root-gene save endpoint: `POST /api/v1/chess/root-gene/save`
- Fixed chess root-gene finalization endpoint: `POST /api/v1/chess/root-gene/formalize`
- Root-gene service health endpoint: `GET /api/v1/chess/root-gene/health`
- Health endpoint: `GET /health`

## Run locally

1. Install dependencies:

   npm install

2. Start server:

   npm run dev

3. Default server URL:

   http://localhost:8787

The root-gene writer resolves `web/chess` relative to this server (`../../chess`
from `src/`). It writes academy-native manifests and `.anno.json`, `.solution.txt`,
and `.exp.txt` files under the matching course directory. The browser never
chooses a folder or sends an arbitrary filesystem path. Start this server before
using “存储到题库”.

## Chinese chess engine API

The Chinese chess AI uses Pikafish, not the international-chess Stockfish
service. Set `MINDSEVO_PIKAFISH_PATH` to the Pikafish executable when it is not
available at the local development default path. `MINDSEVO_PIKAFISH_NNUE_PATH`
can override the adjacent `pikafish.nnue` file.

- `GET /api/v1/chinese-chess/engine/health` reports engine and NNUE availability.
- `POST /api/v1/chinese-chess/engine/ai-ai/config` accepts independent `red` and
  `black` settings (`threads`, `hash`, `depth`, `movetime`, `multiPv`).
- `POST /api/v1/chinese-chess/engine/ai-ai/move` accepts `{ fen, side, settings }`
  and returns Pikafish's best move, parsed analysis, and board coordinates. UCI
  move ranks are converted to the web board's zero-based row indices.

The AI-AI page requires this local server on port 8787. The engine is serialized
between sides through one Pikafish process; it applies each side's configuration
before searching.

Human-AI play also requires this service. The static website on port 5500 does
not start the engine API. In VS Code, run the workspace task
`Start MindsEvo local engine server` (Tasks: Run Task). The task also runs on
folder open when automatic tasks are allowed for this workspace. Leave its
terminal running while playing; after starting it, click Play to retry a failed
engine connection. Do not start a second copy if port 8787 is already in use.

Switching back to Human-AI through the shared control panel preserves the
position and human side, and resumes play automatically after the engine health
check succeeds. If it is the AI's turn, it moves before the human can play.

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
