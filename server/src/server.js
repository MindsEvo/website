const express = require("express");
const cors = require("cors");

const { getDb, DB_PATH } = require("./db");
const { normalizeAttempt, normalizeGeneIds, computeReport, validatePayload } = require("./reportService");
const { buildMetadataIndex, getAdaptiveTargets } = require("./metadataService");

const app = express();
const db = getDb();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "mindsevo-report-server", dbPath: DB_PATH });
});

function parseGeneIds(sessionRow) {
  if (!sessionRow || !sessionRow.gene_ids) {
    return [];
  }
  try {
    const parsed = JSON.parse(sessionRow.gene_ids);
    return Array.isArray(parsed) ? parsed.filter((g) => typeof g === "string") : [];
  } catch {
    return [];
  }
}

function parseDifficultyAxisText(text) {
  if (!text || typeof text !== "string") {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function normalizeContextPayload(payload) {
  const ctx = payload && typeof payload.context === "object" && payload.context !== null ? payload.context : {};

  const levelId = typeof payload.levelId === "string"
    ? payload.levelId
    : (typeof ctx.levelId === "string" ? ctx.levelId : null);

  const comparisonType = typeof payload.comparisonType === "string"
    ? payload.comparisonType
    : (typeof ctx.comparisonType === "string" ? ctx.comparisonType : null);

  const moduleId = typeof payload.moduleId === "string"
    ? payload.moduleId
    : (typeof ctx.moduleId === "string" ? ctx.moduleId : null);

  const moduleType = typeof payload.moduleType === "string"
    ? payload.moduleType
    : (typeof ctx.moduleType === "string" ? ctx.moduleType : null);

  const axisRaw = payload.difficultyAxis !== undefined ? payload.difficultyAxis : ctx.difficultyAxis;
  let difficultyAxis = null;
  if (typeof axisRaw === "string") {
    difficultyAxis = axisRaw;
  } else if (axisRaw && typeof axisRaw === "object") {
    try {
      difficultyAxis = JSON.stringify(axisRaw);
    } catch {
      difficultyAxis = null;
    }
  }

  return {
    levelId,
    comparisonType,
    moduleId,
    moduleType,
    difficultyAxis,
  };
}

function avg(values) {
  if (!values.length) {
    return null;
  }
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function getHistoryRowsByGame(gameKey, limit) {
  return gameKey
    ? db
        .prepare(
          `SELECT s.session_id, s.game_key, s.locale, s.module_id, s.module_type, s.level_id, s.comparison_type, s.difficulty_axis, s.gene_ids, s.created_at, r.accuracy, r.score, r.avg_response_ms, r.total_questions
           FROM sessions s
           JOIN reports r ON r.session_id = s.session_id
           WHERE s.game_key = ?
           ORDER BY s.created_at DESC
           LIMIT ?`
        )
        .all(gameKey, limit)
    : db
        .prepare(
          `SELECT s.session_id, s.game_key, s.locale, s.module_id, s.module_type, s.level_id, s.comparison_type, s.difficulty_axis, s.gene_ids, s.created_at, r.accuracy, r.score, r.avg_response_ms, r.total_questions
           FROM sessions s
           JOIN reports r ON r.session_id = s.session_id
           ORDER BY s.created_at DESC
           LIMIT ?`
        )
        .all(limit);
}

function toDayKey(isoText) {
  if (typeof isoText !== "string" || isoText.length < 10) {
    return "unknown";
  }
  return isoText.slice(0, 10);
}

function getRecommendationBand(avgAccuracy) {
  if (!Number.isFinite(avgAccuracy)) {
    return {
      band: "insufficient_data",
      targetDifficulty: "L1",
      message: "Not enough accuracy data, start from foundation level.",
    };
  }

  if (avgAccuracy < 0.55) {
    return {
      band: "foundation_rebuild",
      targetDifficulty: "L1",
      message: "Rebuild core understanding with guided repetition.",
    };
  }

  if (avgAccuracy < 0.8) {
    return {
      band: "stabilize_and_transition",
      targetDifficulty: "L2",
      message: "Stabilize current skill, then transition to next difficulty.",
    };
  }

  return {
    band: "advance_and_challenge",
    targetDifficulty: "L3",
    message: "Current performance is strong, advance with higher challenge.",
  };
}

function saveHistory(req, res) {
  const error = validatePayload(req.body);
  if (error) {
    return res.status(400).json({ ok: false, error });
  }

  const payload = req.body;
  const attempts = payload.attempts.map((a, i) => normalizeAttempt(a, i));
  const geneIds = normalizeGeneIds(payload.geneIds);
  const context = normalizeContextPayload(payload);
  const report = computeReport(attempts);
  const nowIso = new Date().toISOString();

  const insertSession = db.prepare(`
    INSERT INTO sessions(session_id, game_key, locale, module_id, module_type, level_id, comparison_type, difficulty_axis, started_at, finished_at, created_at, gene_ids)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(session_id) DO UPDATE SET
      game_key=excluded.game_key,
      locale=excluded.locale,
      module_id=excluded.module_id,
      module_type=excluded.module_type,
      level_id=excluded.level_id,
      comparison_type=excluded.comparison_type,
      difficulty_axis=excluded.difficulty_axis,
      started_at=excluded.started_at,
      finished_at=excluded.finished_at,
      gene_ids=excluded.gene_ids
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
      context.moduleId,
      context.moduleType,
      context.levelId,
      context.comparisonType,
      context.difficultyAxis,
      payload.startedAt || null,
      payload.finishedAt || null,
      nowIso,
      JSON.stringify(geneIds)
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
    geneIds,
    context,
  });
}

app.post("/api/v1/reports/submit", saveHistory);
app.post("/api/v1/history/save", saveHistory);

app.get("/api/v1/history/load/:sessionId", (req, res) => {
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
    session: {
      sessionId: session.session_id,
      gameKey: session.game_key,
      locale: session.locale,
      moduleId: session.module_id || null,
      moduleType: session.module_type || null,
      levelId: session.level_id || null,
      comparisonType: session.comparison_type || null,
      difficultyAxis: parseDifficultyAxisText(session.difficulty_axis),
      startedAt: session.started_at,
      finishedAt: session.finished_at,
      geneIds: parseGeneIds(session),
      createdAt: session.created_at,
    },
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
    session: {
      ...session,
      geneIds: parseGeneIds(session),
      difficulty_axis: parseDifficultyAxisText(session.difficulty_axis),
    },
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

app.get("/api/v1/history/statistics", (req, res) => {
  const gameKey = typeof req.query.gameKey === "string" ? req.query.gameKey.trim() : "";
  const geneIdFilter = typeof req.query.geneId === "string" ? req.query.geneId.trim() : "";
  const levelIdFilter = typeof req.query.levelId === "string" ? req.query.levelId.trim() : "";
  const comparisonTypeFilter = typeof req.query.comparisonType === "string" ? req.query.comparisonType.trim() : "";
  const limitRaw = Number(req.query.limit);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 5000) : 500;

  const rows = getHistoryRowsByGame(gameKey, limit);

  const sessions = rows
    .map((row) => ({
      ...row,
      geneIds: parseGeneIds(row),
      levelId: row.level_id || null,
      comparisonType: row.comparison_type || null,
    }))
    .filter((row) => (geneIdFilter ? row.geneIds.includes(geneIdFilter) : true))
    .filter((row) => (levelIdFilter ? row.levelId === levelIdFilter : true))
    .filter((row) => (comparisonTypeFilter ? row.comparisonType === comparisonTypeFilter : true));

  const totalSessions = sessions.length;
  const accuracyValues = sessions.map((s) => s.accuracy).filter((v) => Number.isFinite(v));
  const scoreValues = sessions.map((s) => s.score).filter((v) => Number.isFinite(v));
  const responseValues = sessions.map((s) => s.avg_response_ms).filter((v) => Number.isFinite(v));
  const totalQuestions = sessions
    .map((s) => s.total_questions)
    .filter((v) => Number.isFinite(v))
    .reduce((sum, n) => sum + n, 0);

  const geneMap = new Map();
  for (const s of sessions) {
    for (const geneId of s.geneIds) {
      if (!geneMap.has(geneId)) {
        geneMap.set(geneId, { geneId, sessions: 0, accuracyList: [] });
      }
      const slot = geneMap.get(geneId);
      slot.sessions += 1;
      if (Number.isFinite(s.accuracy)) {
        slot.accuracyList.push(s.accuracy);
      }
    }
  }

  const geneStats = Array.from(geneMap.values())
    .map((g) => ({
      geneId: g.geneId,
      sessions: g.sessions,
      avgAccuracy: avg(g.accuracyList),
    }))
    .sort((a, b) => b.sessions - a.sessions || String(a.geneId).localeCompare(String(b.geneId)));

  const byLevelMap = new Map();
  const byTypeMap = new Map();
  for (const s of sessions) {
    const levelKey = s.levelId || "unknown";
    const typeKey = s.comparisonType || "unknown";

    if (!byLevelMap.has(levelKey)) byLevelMap.set(levelKey, { key: levelKey, sessions: 0, acc: [] });
    if (!byTypeMap.has(typeKey)) byTypeMap.set(typeKey, { key: typeKey, sessions: 0, acc: [] });

    byLevelMap.get(levelKey).sessions += 1;
    byTypeMap.get(typeKey).sessions += 1;
    if (Number.isFinite(s.accuracy)) {
      byLevelMap.get(levelKey).acc.push(s.accuracy);
      byTypeMap.get(typeKey).acc.push(s.accuracy);
    }
  }

  return res.json({
    ok: true,
    scope: {
      gameKey: gameKey || null,
      geneId: geneIdFilter || null,
      levelId: levelIdFilter || null,
      comparisonType: comparisonTypeFilter || null,
      sampledSessions: totalSessions,
      sampleLimit: limit,
    },
    statistics: {
      totalSessions,
      totalQuestions,
      avgAccuracy: avg(accuracyValues),
      avgScore: avg(scoreValues),
      avgResponseMs: avg(responseValues),
      geneStats,
      byLevel: Array.from(byLevelMap.values()).map((x) => ({ levelId: x.key, sessions: x.sessions, avgAccuracy: avg(x.acc) })),
      byComparisonType: Array.from(byTypeMap.values()).map((x) => ({ comparisonType: x.key, sessions: x.sessions, avgAccuracy: avg(x.acc) })),
    },
  });
});

app.get("/api/v1/history/catalog/options", (req, res) => {
  const metadata = buildMetadataIndex();
  const games = metadata.games
    .map((game) => ({
      id: game.id,
      titleZh: game.titleZh || null,
      titleEn: game.titleEn || null,
      module: game.module || null,
    }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  const genes = Array.from(metadata.geneMap.keys())
    .sort((a, b) => String(a).localeCompare(String(b)))
    .map((geneId) => {
      const targets = metadata.geneMap.get(geneId);
      return {
        id: geneId,
        gameCount: targets ? targets.games.size : 0,
        lessonCount: targets ? targets.lessons.size : 0,
      };
    });

  return res.json({
    ok: true,
    games,
    genes,
  });
});

app.get("/api/v1/history/statistics/overview", (req, res) => {
  const gameKeyFilter = typeof req.query.gameKey === "string" ? req.query.gameKey.trim() : "";
  const geneIdFilter = typeof req.query.geneId === "string" ? req.query.geneId.trim() : "";
  const limitRaw = Number(req.query.limit);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 5000) : 1000;

  const metadata = buildMetadataIndex();
  const rows = getHistoryRowsByGame(gameKeyFilter, limit)
    .map((row) => ({
      ...row,
      geneIds: parseGeneIds(row),
    }))
    .filter((row) => (geneIdFilter ? row.geneIds.includes(geneIdFilter) : true));

  const dayTrendMap = new Map();
  for (const row of rows) {
    const dayKey = toDayKey(row.created_at);
    if (!dayTrendMap.has(dayKey)) {
      dayTrendMap.set(dayKey, { day: dayKey, sessions: 0, accuracyValues: [], scoreValues: [] });
    }
    const slot = dayTrendMap.get(dayKey);
    slot.sessions += 1;
    if (Number.isFinite(row.accuracy)) {
      slot.accuracyValues.push(row.accuracy);
    }
    if (Number.isFinite(row.score)) {
      slot.scoreValues.push(row.score);
    }
  }

  const byGame = new Map();
  for (const row of rows) {
    if (!byGame.has(row.game_key)) {
      byGame.set(row.game_key, {
        gameKey: row.game_key,
        sessions: 0,
        totalQuestions: 0,
        accuracyValues: [],
        scoreValues: [],
        responseValues: [],
        geneUse: new Map(),
      });
    }

    const slot = byGame.get(row.game_key);
    slot.sessions += 1;
    if (Number.isFinite(row.total_questions)) {
      slot.totalQuestions += row.total_questions;
    }
    if (Number.isFinite(row.accuracy)) {
      slot.accuracyValues.push(row.accuracy);
    }
    if (Number.isFinite(row.score)) {
      slot.scoreValues.push(row.score);
    }
    if (Number.isFinite(row.avg_response_ms)) {
      slot.responseValues.push(row.avg_response_ms);
    }

    for (const geneId of row.geneIds) {
      slot.geneUse.set(geneId, (slot.geneUse.get(geneId) || 0) + 1);
    }
  }

  const overview = Array.from(byGame.values())
    .map((g) => {
      const meta = metadata.gameMap.get(g.gameKey);
      const topGenes = Array.from(g.geneUse.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([geneId, sessions]) => ({ geneId, sessions }));

      return {
        gameKey: g.gameKey,
        titleZh: meta ? meta.titleZh : null,
        titleEn: meta ? meta.titleEn : null,
        module: meta ? meta.module : null,
        shell: meta ? meta.shell : null,
        sessions: g.sessions,
        totalQuestions: g.totalQuestions,
        avgAccuracy: avg(g.accuracyValues),
        avgScore: avg(g.scoreValues),
        avgResponseMs: avg(g.responseValues),
        topGenes,
      };
    })
    .sort((a, b) => b.sessions - a.sessions || String(a.gameKey).localeCompare(String(b.gameKey)));

  const dailyTrend = Array.from(dayTrendMap.values())
    .map((d) => ({
      day: d.day,
      sessions: d.sessions,
      avgAccuracy: avg(d.accuracyValues),
      avgScore: avg(d.scoreValues),
    }))
    .sort((a, b) => String(a.day).localeCompare(String(b.day)));

  return res.json({
    ok: true,
    sampledSessions: rows.length,
    sampleLimit: limit,
    scope: {
      gameKey: gameKeyFilter || null,
      geneId: geneIdFilter || null,
    },
    byGame: overview,
    dailyTrend,
  });
});

app.get("/api/v1/history/recommend", (req, res) => {
  const gameKeyFilter = typeof req.query.gameKey === "string" ? req.query.gameKey.trim() : "";
  const topNRaw = Number(req.query.topN);
  const topN = Number.isFinite(topNRaw) ? Math.min(Math.max(Math.trunc(topNRaw), 1), 10) : 3;

  const metadata = buildMetadataIndex();
  const rows = getHistoryRowsByGame(gameKeyFilter, 500);

  const sessions = rows.map((row) => ({ ...row, geneIds: parseGeneIds(row) }));

  if (!sessions.length) {
    return res.json({
      ok: true,
      recommendations: [],
      message: "Not enough history yet. Submit game reports first.",
    });
  }

  const geneAgg = new Map();
  for (const s of sessions) {
    for (const geneId of s.geneIds) {
      if (!geneAgg.has(geneId)) {
        geneAgg.set(geneId, { geneId, count: 0, accuracyValues: [], gameUse: new Map() });
      }
      const item = geneAgg.get(geneId);
      item.count += 1;
      if (Number.isFinite(s.accuracy)) {
        item.accuracyValues.push(s.accuracy);
      }
      item.gameUse.set(s.game_key, (item.gameUse.get(s.game_key) || 0) + 1);
    }
  }

  const weakness = Array.from(geneAgg.values())
    .map((g) => {
      const avgAccuracy = avg(g.accuracyValues);
      const band = getRecommendationBand(avgAccuracy);

      const observedGameKeys = Array.from(g.gameUse.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => k);

      const adaptiveTargets = getAdaptiveTargets(metadata, g.geneId, band.targetDifficulty);
      const targetGames = adaptiveTargets.games.length
        ? adaptiveTargets.games
        : observedGameKeys.slice(0, 2).map((id) => ({ id }));

      const resolvedTargets = {
        games: targetGames,
        lessons: adaptiveTargets.lessons,
        videos: adaptiveTargets.videos,
      };

      return {
        geneId: g.geneId,
        observedSessions: g.count,
        avgAccuracy,
        policy: {
          band: band.band,
          targetDifficulty: band.targetDifficulty,
          resolvedDifficulty: adaptiveTargets.resolvedDifficulty,
          message: band.message,
        },
        targets: resolvedTargets,
      };
    })
    .sort((a, b) => {
      const aa = Number.isFinite(a.avgAccuracy) ? a.avgAccuracy : 1;
      const bb = Number.isFinite(b.avgAccuracy) ? b.avgAccuracy : 1;
      return aa - bb || b.observedSessions - a.observedSessions;
    })
    .slice(0, topN)
    .map((w) => ({
      ...w,
      reason:
        Number.isFinite(w.avgAccuracy) && w.avgAccuracy < 0.75
          ? "Low recent accuracy for this RootGene; recommend focused practice."
          : "Maintain proficiency with spaced review for this RootGene.",
    }));

  return res.json({
    ok: true,
    recommendations: weakness,
    sampledSessions: sessions.length,
    strategy: "rank_by_low_accuracy_then_frequency",
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
