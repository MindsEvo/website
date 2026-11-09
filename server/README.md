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

## Chinese chess desktop puzzle bank

Import all desktop collections without modifying the desktop originals:

```powershell
node web\tools\build-chinese-chess-bank.mjs 'C:\Users\xiaod\chinese_chess'
node web\tools\test-chinese-chess-bank.mjs 'C:\Users\xiaod\chinese_chess'
```

Run these commands from the workspace root. The importer copies the desktop
`question_bank\data` collections and their FEN, metadata, PGN, solution and
explanation files into `web\chinese-chess\bank`, and builds its root manifest.
All three play modes use this manifest through the shared puzzle-bank module,
grouped by collection, level and category. Existing L1 endgame manifests and
web-authored puzzles are retained. Source folders determine levels; metadata
names supply the displayed titles. A legacy metadata trailing comma is reported
and normalized for indexing only; original files are preserved.
Passing the desktop path to the validator also checks that every source file was
copied byte-for-byte and every source FEN is indexed.

The Chinese chess academy endgame basics page restores the desktop layout.
Observation > rook lists all eleven single-rook positions from `endgame/L1/rook`,
grouped by title. Lone-rook mate retains `eg_R-K_L1-001` through `005`; the other
groups cover one/two advisors, one/two elephants, advisor plus elephant, and full
advisors/elephants. Horse-rook and cannon-rook placeholders are removed from
observation only; the double-rook placeholder and practice menus remain.
Observation > horse replaces its old placeholders with all five L1 single-horse
positions (bare general, one/two advisors and one/two elephants), using the same
title submenus, solution playback and in-page mode switching as rook lessons.
Observation > cannon replaces the old menu with six L1 single-cannon positions,
including cannon with advisor/elephant. Practice > cannon contains the two
multi-cannon positions stored under the L1 cannon directory (their IDs retain
the desktop L2/L3 tags). Their source solutions are placeholders and explanations
are absent, so they open in manual practice with explicit missing-material notices
instead of attempting to play the placeholder examples.
Observation > pawn replaces its placeholders with all three L1 pawn positions:
single pawn versus advisor, single pawn versus bare general, and three pawns
versus full advisors/elephants. These use the same solution and mode controls.
The three-pawn source solution has an ambiguous `兵四平三` (two pawns on that
file). Its board and materials load, but notation playback reports the ambiguity
and remains disabled; local manual/engine modes remain available. Source notation
is preserved rather than choosing a pawn arbitrarily.

## Chinese chess basic tactics

`chinese-chess/academy/tactics/index.html` reuses the endgame lesson controller,
standard board, material panels and in-page modes. All three sections use the same
7 group buttons and 24 tactic submenus. Only observation connects the 43 indexed
positions from the original 13 categories. Related old categories are explicitly
labelled as reference positions, not as verified examples of the narrower new
tactics; unmatched tactics show unconnected placeholders.
Practice and question practice show unconnected placeholders; their separate
exercise/question datasets will be connected later.
The existing solution files for these positions contain only desktop placeholders:
the page explicitly disables reference playback until real notation is provided.
Manual/Human-AI/AI-AI practice remains available, with AI-AI paused until play.
The learning center and legacy tactics module URL open this page.

```powershell
node web\tools\test-chinese-tactics.mjs
```

## Chinese chess basic attacking

`chinese-chess/academy/attacking/index.html` uses the same standard board, controls,
material panels and lesson controller as basic tactics. Observation, practice and
question practice share five teaching groups and 24 method submenus. The groups
are a child-oriented learning sequence, not a universal technical classification.
Observation menus include each unit's guiding question and each method's core knowledge.
`attacking-catalog.mjs` keeps each method's independent RootGene ID separate from
its teaching group and the original puzzle ID.

Only observation connects puzzles. Title matching across all attacking levels
currently connects 19 methods to 43 unique positions; combined-method positions
may appear under more than one method. Original titles and files are preserved,
including the source spellings `空头跑`, `高掉马` and `重跑` matched by explicit aliases.
Eight-corner horse, rook-horse surprise, rook-cannon extraction, bold central
penetration and three pawn advances remain unconnected; unrelated positions such
as `大刀剜心` are not silently substituted. The connected positions provide 12
legally validated solution variants; 32 other selected solution files are only
placeholders and cannot be played. Missing explanations are explicitly indicated.

Practice and question practice remain placeholders. The proposed four training
levels (recognition, finding the method, completing mate and variation application)
and 2–4 curated positions per method are future content work, not implemented
exercise or scoring features. The learning center, intro and legacy
`module.html?module=attack` entry points open this page.

```powershell
node web\tools\test-chinese-attacking.mjs
```

## Chinese chess basic opening

`chinese-chess/academy/opening/index.html` reuses the standard lesson board,
controls and material panels. All three sections share three root group buttons,
12 category submenus and 25 type submenus (the complete user-confirmed list).
The shared controller supports the extra category level without changing the
tactics or attacking menu structures. Each opening type has a separate RootGene ID.
Screen-horse and palcorner-horse defences are not labelled as same-direction or
opposite-direction cannons. The requested corner-cannon sequence is retained as
course content with a note that its precise definition still needs verification.

Only observation connects source positions. Explicit mappings based on the
original notation connect `oc_zhongpao_L1-003` to central-cannon versus screen-horse
from either side's perspective (38 legal moves), and `oc_zhongpao_L1-002` to
same-direction cannons with first-side cross rook versus second-side direct rook.
The latter source's `卒7进1` becomes illegal later in the sequence: its board and
original notation remain visible, but playback reports the error and is disabled.
The parser now accepts fullwidth digits in Chinese notation, without modifying
source files. Other types remain unconnected; generic or unidentified middle-cannon
bank positions are not arbitrarily assigned to a specific opening type.
Practice and question practice remain placeholders. The learning center, intro and
legacy `module.html?module=opening` entry points open this page.

```powershell
node web\tools\test-chinese-opening.mjs
```

Each puzzle includes FEN, numbered solution variants and matching explanations. The shared
control panel supports reset, stepping, automatic playback and spoken moves;
notation highlights follow playback. Moves are resolved from notation using the
core legal-move rules rather than hardcoded coordinates. Numbered solutions take
precedence over legacy base files, some of which contain only placeholder text.
Other observation/practice categories and quizzes remain unconnected.

On this lesson page, the three mode controls switch locally instead of navigating
to play pages. They retain the current board, side to move, original solution and
explanation. Human-AI uses the selected side for the human; selecting AI-AI leaves
it paused until the play control is clicked, then continues from the current turn.
Mode changes cancel stale engine requests. Live undo/redo act on
practice moves; clicking an original solution move returns to notation playback.
Engine failures retain the position and expose a retry through the play control.
Other pages retain the shared panel's existing mode navigation.

```powershell
node web\tools\test-chinese-endgame-playback.mjs
```

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
