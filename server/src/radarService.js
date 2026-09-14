function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function normalizeGeneIds(rawGeneIds) {
  if (!Array.isArray(rawGeneIds)) {
    return [];
  }

  const seen = new Set();
  const out = [];
  for (const geneId of rawGeneIds) {
    if (typeof geneId !== "string") {
      continue;
    }
    const trimmed = geneId.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function validateRadarRecordEnvelope(item, index) {
  if (!isPlainObject(item)) {
    return `records[${index}] must be an object.`;
  }

  if (!item.key || typeof item.key !== "string") {
    return `records[${index}].key is required and must be a string.`;
  }

  if (!isPlainObject(item.record)) {
    return `records[${index}].record is required and must be an object.`;
  }

  const record = item.record;

  if (!record.profileId || typeof record.profileId !== "string") {
    return `records[${index}].record.profileId is required and must be a string.`;
  }

  if (!record.gameId || typeof record.gameId !== "string") {
    return `records[${index}].record.gameId is required and must be a string.`;
  }

  if (!Number.isFinite(record.ts)) {
    return `records[${index}].record.ts is required and must be a number.`;
  }

  return null;
}

function validateRadarBatch(payload) {
  if (!isPlainObject(payload)) {
    return "Body must be a JSON object.";
  }

  if (!Array.isArray(payload.records) || payload.records.length === 0) {
    return "records must be a non-empty array.";
  }

  for (let i = 0; i < payload.records.length; i++) {
    const error = validateRadarRecordEnvelope(payload.records[i], i);
    if (error) {
      return error;
    }
  }

  return null;
}

// gradeCode is never guessed: anything that is not a non-empty string is
// stored as NULL, exactly the way radar-reader.js treats a missing grade.
function normalizeRecord(record) {
  const geneIds = normalizeGeneIds(record.geneIds);
  const gradeCode = typeof record.gradeCode === "string" && record.gradeCode.trim()
    ? record.gradeCode.trim()
    : null;
  return { geneIds, gradeCode };
}

function recordToRow(key, record, receivedAtIso) {
  const { geneIds, gradeCode } = normalizeRecord(record);
  const context = record.context !== undefined ? record.context : null;

  return {
    profile_id: String(record.profileId),
    client_key: String(key),
    game_id: String(record.gameId),
    ts: Number(record.ts),
    grade_code: gradeCode,
    gene_ids: JSON.stringify(geneIds),
    activity_runtime: typeof record.activityRuntime === "string" ? record.activityRuntime : null,
    activity_mode: typeof record.activityMode === "string" ? record.activityMode : null,
    score: Number.isFinite(record.score) ? record.score : null,
    total: Number.isFinite(record.total) ? record.total : null,
    result: record.result !== undefined && record.result !== null ? String(record.result) : null,
    lang: typeof record.lang === "string" ? record.lang : null,
    ver: typeof record.ver === "string" ? record.ver : null,
    context_json: context !== null ? JSON.stringify(context) : null,
    record_json: JSON.stringify(record),
    received_at: receivedAtIso,
  };
}

module.exports = {
  normalizeGeneIds,
  validateRadarBatch,
  normalizeRecord,
  recordToRow,
};
