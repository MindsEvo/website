"use strict";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const RadarReader = require("../src/radarReaderHost");
const { getDb } = require("../src/db");

const PORT = 8799;
const BASE_URL = `http://localhost:${PORT}`;
const DB_PATH = path.join(__dirname, "..", ".db", "reports.db");

let serverProcess;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(retriesLeft) {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.ok) {
      return true;
    }
    throw new Error("health check not ok");
  } catch (err) {
    if (retriesLeft <= 0) {
      throw err;
    }
    await wait(150);
    return waitForHealth(retriesLeft - 1);
  }
}

before(async () => {
  for (const suffix of ["", "-wal", "-shm"]) {
    fs.rmSync(DB_PATH + suffix, { force: true });
  }

  serverProcess = spawn(process.execPath, [path.join(__dirname, "..", "src", "server.js")], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: "ignore",
  });

  await waitForHealth(40);
});

after(async () => {
  await new Promise((resolve) => {
    serverProcess.once("exit", resolve);
    serverProcess.kill("SIGTERM");
  });
});

function makeRecord(overrides) {
  return Object.assign(
    {
      profileId: "p-default",
      gameId: "clio-find-it-workshop",
      unitId: "find-it-run",
      templateId: "K1",
      variantId: null,
      score: 8,
      total: 10,
      timeMs: 12345,
      hintsUsed: 0,
      geneIds: ["RG.ATTENTION.SEARCH.VISUAL", "RG.LOGIC.COMPARISON.BASIC"],
      shell: "shell-1",
      activityRuntime: "puzzle",
      activityMode: "search",
      result: "pass",
      levelId: "K1",
      gradeCode: "K1",
      context: { locale: "zh" },
      ts: Date.now(),
      lang: "zh",
      ver: "1.0.0",
    },
    overrides
  );
}

async function postRecords(items) {
  const res = await fetch(`${BASE_URL}/api/v1/radar/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records: items }),
  });
  return { status: res.status, body: await res.json() };
}

async function getMatrix(profileId) {
  const res = await fetch(`${BASE_URL}/api/v1/radar/matrix?profileId=${encodeURIComponent(profileId)}`);
  return { status: res.status, body: await res.json() };
}

test("lossless round trip: record_json matches the posted record exactly", async () => {
  const profileId = "p-lossless";
  const record = makeRecord({
    profileId,
    ts: 111,
    // an unexpected extra field must survive verbatim (open schema, no whitelist)
    surpriseField: { nested: true, n: 42 },
  });
  const key = `${record.gameId}:history:${record.ts}`;

  const { status, body } = await postRecords([{ key, record }]);
  assert.equal(status, 200);
  assert.deepEqual(body.accepted, [key]);
  assert.deepEqual(body.rejected, []);

  const db = getDb();
  const row = db.prepare("SELECT record_json FROM radar_records WHERE profile_id = ? AND client_key = ?").get(profileId, key);
  assert.ok(row, "row must exist");
  assert.deepStrictEqual(JSON.parse(row.record_json), record);
});

test("matrix cell-for-cell equality with local RadarReader.read()", async () => {
  const profileId = "p-matrix";
  const records = [
    makeRecord({ profileId, ts: 200, gradeCode: "K1", score: 8, total: 10 }),
    makeRecord({ profileId, ts: 201, gradeCode: "K1", score: 6, total: 10 }),
    makeRecord({ profileId, ts: 202, gradeCode: "K2", score: 9, total: 12, geneIds: ["RG.ATTENTION.SEARCH.VISUAL"] }),
  ];
  const items = records.map((record) => ({ key: `${record.gameId}:history:${record.ts}`, record }));

  const { status } = await postRecords(items);
  assert.equal(status, 200);

  const { body: matrixBody } = await getMatrix(profileId);
  assert.equal(matrixBody.ok, true);

  const expected = JSON.parse(JSON.stringify(RadarReader.read({ records, profileId })));
  const { ok, ...actual } = matrixBody;
  assert.deepStrictEqual(actual, expected);
});

test("idempotent upsert: posting the same batch twice does not duplicate rows", async () => {
  const profileId = "p-idempotent";
  const record = makeRecord({ profileId, ts: 300 });
  const key = `${record.gameId}:history:${record.ts}`;

  const first = await postRecords([{ key, record }]);
  const second = await postRecords([{ key, record }]);

  assert.deepEqual(first.body.accepted, [key]);
  assert.deepEqual(second.body.accepted, [key]);

  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) AS n FROM radar_records WHERE profile_id = ? AND client_key = ?").get(profileId, key);
  assert.equal(row.n, 1);
});

test("never guess a missing gradeCode: it lands in totals.noGrade, not on a grade cell", async () => {
  const profileId = "p-nograde";
  const record = makeRecord({ profileId, ts: 400, gradeCode: null, levelId: null, templateId: null });
  const key = `${record.gameId}:history:${record.ts}`;

  await postRecords([{ key, record }]);

  const db = getDb();
  const row = db.prepare("SELECT grade_code FROM radar_records WHERE profile_id = ? AND client_key = ?").get(profileId, key);
  assert.equal(row.grade_code, null);

  const { body } = await getMatrix(profileId);
  assert.equal(body.totals.noGrade, 1);
  for (const grade of body.grades) {
    assert.equal(body.totals.byGrade[grade] || 0, 0);
  }
});

test("never sum total across activityRuntime buckets", async () => {
  const profileId = "p-runtime";
  const puzzleRecord = makeRecord({
    profileId,
    ts: 500,
    gradeCode: "K1",
    geneIds: ["RG.ATTENTION.SEARCH.VISUAL"],
    activityRuntime: "puzzle",
    score: 8,
    total: 10,
  });
  const miniRecord = makeRecord({
    profileId,
    ts: 501,
    gradeCode: "K1",
    geneIds: ["RG.ATTENTION.SEARCH.VISUAL"],
    activityRuntime: "mini",
    score: 3,
    total: 5,
  });

  await postRecords([
    { key: `${puzzleRecord.gameId}:history:${puzzleRecord.ts}`, record: puzzleRecord },
    { key: `${miniRecord.gameId}:history:${miniRecord.ts}`, record: miniRecord },
  ]);

  const { body } = await getMatrix(profileId);
  const cell = body.cells["RG.ATTENTION.SEARCH.VISUAL|K1"];
  assert.ok(cell, "cell must exist");

  assert.deepEqual(cell.byRuntime.puzzle, { sessions: 1, score: 8, total: 10, ratioSum: 0.8, accuracy: 0.8, rawAccuracy: 0.8 });
  assert.deepEqual(cell.byRuntime.mini, { sessions: 1, score: 3, total: 5, ratioSum: 0.6, accuracy: 0.6, rawAccuracy: 0.6 });
});

test("regression: health checks and existing tables are unaffected by radar traffic", async () => {
  const health = await fetch(`${BASE_URL}/health`);
  assert.equal(health.status, 200);

  const chessHealth = await fetch(`${BASE_URL}/api/v1/chess/engine/health`);
  assert.equal(chessHealth.status, 200);

  const db = getDb();
  const beforeCounts = {
    sessions: db.prepare("SELECT COUNT(*) AS n FROM sessions").get().n,
    attempts: db.prepare("SELECT COUNT(*) AS n FROM attempts").get().n,
    reports: db.prepare("SELECT COUNT(*) AS n FROM reports").get().n,
  };

  const submitRes = await fetch(`${BASE_URL}/api/v1/reports/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "sess-radar-regression",
      gameKey: "number-pattern-hunter",
      geneIds: ["RG.PATTERN.SEQUENCE.BASIC"],
      attempts: [
        { questionIndex: 0, questionId: "Q1", selectedOption: "A", isCorrect: true, usedHint: false, responseMs: 1000 },
      ],
    }),
  });
  assert.equal(submitRes.status, 200);

  await postRecords([{ key: "unrelated:history:999", record: makeRecord({ profileId: "p-regression", ts: 999 }) }]);

  const afterCounts = {
    sessions: db.prepare("SELECT COUNT(*) AS n FROM sessions").get().n,
    attempts: db.prepare("SELECT COUNT(*) AS n FROM attempts").get().n,
    reports: db.prepare("SELECT COUNT(*) AS n FROM reports").get().n,
  };

  assert.equal(afterCounts.sessions, beforeCounts.sessions + 1);
  assert.equal(afterCounts.attempts, beforeCounts.attempts + 1);
  assert.equal(afterCounts.reports, beforeCounts.reports + 1);
});
