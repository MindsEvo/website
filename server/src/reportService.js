function normalizeAttempt(raw, idx) {
  return {
    questionIndex: Number.isInteger(raw.questionIndex) ? raw.questionIndex : idx,
    questionId: String(raw.questionId || ""),
    selectedOption: String(raw.selectedOption || ""),
    isCorrect: Boolean(raw.isCorrect),
    usedHint: Boolean(raw.usedHint),
    responseMs: Number.isFinite(raw.responseMs) ? Math.max(0, Number(raw.responseMs)) : null,
  };
}

function computeReport(attempts) {
  const totalQuestions = attempts.length;
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const hintsUsed = attempts.filter((a) => a.usedHint).length;

  const responseTimes = attempts
    .map((a) => a.responseMs)
    .filter((v) => Number.isFinite(v));

  const avgResponseMs = responseTimes.length
    ? responseTimes.reduce((sum, n) => sum + n, 0) / responseTimes.length
    : null;

  const accuracy = totalQuestions > 0 ? correctCount / totalQuestions : 0;

  const hintPenalty = Math.min(hintsUsed, totalQuestions) * 2;
  const rawScore = Math.round(accuracy * 100) - hintPenalty;
  const score = Math.max(0, rawScore);

  return {
    totalQuestions,
    correctCount,
    accuracy,
    hintsUsed,
    avgResponseMs,
    score,
  };
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "Body must be a JSON object.";
  }

  if (!payload.sessionId || typeof payload.sessionId !== "string") {
    return "sessionId is required and must be a string.";
  }

  if (!payload.gameKey || typeof payload.gameKey !== "string") {
    return "gameKey is required and must be a string.";
  }

  if (!Array.isArray(payload.attempts)) {
    return "attempts must be an array.";
  }

  if (payload.attempts.length === 0) {
    return "attempts cannot be empty.";
  }

  return null;
}

module.exports = {
  normalizeAttempt,
  computeReport,
  validatePayload,
};
