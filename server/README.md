# MindsEvo Local Report Server

This is a local-only server used to collect raw game attempts and verify report data on the server side.

## Features

- Local SQLite persistence
- Server-side report recomputation
- Submit endpoint: `POST /api/v1/reports/submit`
- Query endpoint: `GET /api/v1/reports/:sessionId`
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
