const express = require("express");
const cors = require("cors");

const { getDb, DB_PATH } = require("./db");
const { normalizeAttempt, computeReport, validatePayload } = require("./reportService");

const app = express();
const db = getDb();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "mindsevo-report-server", dbPath: DB_PATH });
});

app.post("/api/v1/reports/submit", (req, res) => {
  const error = validatePayload(req.body);
  if (error) {
    return res.status(400).json({ ok: false, error });
  }

  const payload = req.body;
  const attempts = payload.attempts.map((a, i) => normalizeAttempt(a, i));
  const report = computeReport(attempts);
  const nowIso = new Date().toISOString();

  const insertSession = db.prepare(`
    INSERT INTO sessions(session_id, game_key, locale, started_at, finished_at, created_at)
    VALUES(?, ?, ?, ?, ?, ?)
    ON CONFLICT(session_id) DO UPDATE SET
      game_key=excluded.game_key,
      locale=excluded.locale,
      started_at=excluded.started_at,
      finished_at=excluded.finished_at
  `);

  const deleteAttempts = db.prepare("DELETE FROM attempts WHERE session_id = ?");

  const insertAttempt = db.prepare(`
    INSERT INTO attempts(session_id, question_index, question_id, selected_option, is_correct, used_hint, response_ms, created_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const upsertReport = db.prepare(`
    INSERT INTO reports(session_id, total_questions, correct_count, accuracy, hints_used, avg_response_ms, score, report_json, created_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(session_id) DO UPDATE SET
      total_questions=excluded.total_questions,
      correct_count=excluded.correct_count,
      accuracy=excluded.accuracy,
      hints_used=excluded.hints_used,
      avg_response_ms=excluded.avg_response_ms,
      score=excluded.score,
      report_json=excluded.report_json
  `);

  try {
    db.exec("BEGIN");

    insertSession.run(
      payload.sessionId,
      payload.gameKey,
      payload.locale || null,
      payload.startedAt || null,
      payload.finishedAt || null,
      nowIso
    );

    deleteAttempts.run(payload.sessionId);

    for (const a of attempts) {
      insertAttempt.run(
        payload.sessionId,
        a.questionIndex,
        a.questionId || null,
        a.selectedOption || null,
        a.isCorrect ? 1 : 0,
        a.usedHint ? 1 : 0,
        a.responseMs,
        nowIso
      );
    }

    upsertReport.run(
      payload.sessionId,
      report.totalQuestions,
      report.correctCount,
      report.accuracy,
      report.hintsUsed,
      report.avgResponseMs,
      report.score,
      JSON.stringify({ report, attempts }),
      nowIso
    );

    db.exec("COMMIT");
  } catch (e) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // Ignore rollback error to preserve original failure detail.
    }
    return res.status(500).json({ ok: false, error: "Failed to persist report.", detail: String(e.message || e) });
  }

  return res.json({
    ok: true,
    verified: true,
    report,
  });
});

app.get("/api/v1/reports/:sessionId", (req, res) => {
  const sessionId = req.params.sessionId;

  const session = db.prepare("SELECT * FROM sessions WHERE session_id = ?").get(sessionId);
  if (!session) {
    return res.status(404).json({ ok: false, error: "Session not found." });
  }

  const reportRow = db.prepare("SELECT * FROM reports WHERE session_id = ?").get(sessionId);
  const attempts = db
    .prepare("SELECT question_index, question_id, selected_option, is_correct, used_hint, response_ms FROM attempts WHERE session_id = ? ORDER BY question_index ASC")
    .all(sessionId);

  return res.json({
    ok: true,
    session,
    report: reportRow
      ? {
          totalQuestions: reportRow.total_questions,
          correctCount: reportRow.correct_count,
          accuracy: reportRow.accuracy,
          hintsUsed: reportRow.hints_used,
          avgResponseMs: reportRow.avg_response_ms,
          score: reportRow.score,
        }
      : null,
    attempts: attempts.map((a) => ({
      questionIndex: a.question_index,
      questionId: a.question_id,
      selectedOption: a.selected_option,
      isCorrect: Boolean(a.is_correct),
      usedHint: Boolean(a.used_hint),
      responseMs: a.response_ms,
    })),
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: "Unexpected server error." });
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`[report-server] listening on http://localhost:${port}`);
});
