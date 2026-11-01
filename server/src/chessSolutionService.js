const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { CHESS_ROOT, ACADEMY_ROOT } = require("./rootGeneService");

const COURSES = ["endgame", "tactics", "mate", "opening", "comprehensive"];
function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}
function validateStem(stem) {
  if (typeof stem !== "string" || !/^[A-Za-z0-9_-]+$/.test(stem)) {
    throw invalid("Invalid solution or question stem.");
  }
  return stem;
}
function validateQuestionId(id) {
  if (typeof id !== "string" || !id || id.includes("..") || id.includes("\\")) {
    throw invalid("Invalid questionId.");
  }
  const parts = id.split("/");
  validateStem(parts.pop().replace(/\.fen$/, ""));
  if (parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) throw invalid("Invalid questionId path.");
  return id;
}
async function safePath(file) {
  const absolute = path.resolve(file);
  const root = path.parse(absolute).root;
  let current = root;
  for (const part of absolute.slice(root.length).split(path.sep)) {
    current = path.join(current, part);
    try {
      if ((await fs.lstat(current)).isSymbolicLink()) throw invalid("Symbolic links are not allowed in chess data paths.");
    } catch (error) {
      if (error.code === "ENOENT") break;
      throw error;
    }
  }
  return absolute;
}
function underRoot(root, file) {
  const relative = path.relative(root, file);
  if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) {
    throw invalid("Chess data path escapes academy.");
  }
  return file;
}
async function readOptional(file) {
  await safePath(file);
  try { return (await fs.readFile(file, "utf8")).replace(/^\uFEFF/, ""); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}
async function readBank(options) {
  const file = options.bankPath || process.env.ROOT_GENE_BANK_PATH || path.join(CHESS_ROOT, "play/assets/question-bank.js");
  const text = await readOptional(file);
  if (text === null) return { questions: {} };
  const match = text.trim().match(/^window\.ChessQuestionBank\s*=\s*([\s\S]*?);?$/);
  if (!match) throw invalid("Invalid question bank JSON assignment.");
  return JSON.parse(match[1]);
}
function variantNumber(itemId, solutionId) {
  validateStem(solutionId);
  if (solutionId === itemId) return "001";
  const suffix = solutionId.startsWith(itemId + "-") ? solutionId.slice(itemId.length + 1) : "";
  if (!/^\d+$/.test(suffix) || Number(suffix) < 1 || !Number.isSafeInteger(Number(suffix))) {
    throw invalid("Invalid solution variant suffix.");
  }
  return String(Number(suffix)).padStart(3, "0");
}
function sortSolutions(solutions) {
  return solutions.sort((left, right) => Number(left.number) - Number(right.number) || left.id.localeCompare(right.id));
}
async function academyRecords(root) {
  const records = [];
  async function scan(directory, course) {
    await safePath(directory);
    let entries;
    try { entries = await fs.readdir(directory, { withFileTypes: true }); }
    catch (error) { if (error.code === "ENOENT") return; throw error; }
    for (const entry of entries) {
      const file = underRoot(root, path.join(directory, entry.name));
      if (entry.isSymbolicLink()) throw invalid("Symbolic links are not allowed in academy.");
      if (entry.isDirectory()) await scan(file, course);
      else if (["manifest.json", "practice-manifest.json"].includes(entry.name)) {
        const manifest = JSON.parse(await readOptional(file));
        const groups = Array.isArray(manifest.items) ? [{ items: manifest.items }] : manifest.categories || [];
        for (const group of groups) {
          let itemDirectory = directory;
          if (course === "opening" && group.key) {
            const candidate = underRoot(root, path.join(directory, validateStem(group.key)));
            await safePath(candidate);
            const stat = await fs.lstat(candidate).catch(error => { if (error.code === "ENOENT") return null; throw error; });
            if (stat?.isDirectory()) itemDirectory = candidate;
          }
          for (const item of group.items || []) {
            validateStem(item.id);
            const questionId = "academy/" + path.relative(root, itemDirectory).split(path.sep).join("/") + "/" + item.id;
            records.push({ item, directory: itemDirectory, questionId, course });
          }
        }
      }
    }
  }
  for (const course of COURSES) await scan(path.join(root, course), course);
  return records;
}
async function resolveQuestion(input, options) {
  const questionId = validateQuestionId(input.questionId);
  const root = await safePath(options.dataRoot || ACADEMY_ROOT);
  const records = await academyRecords(root);
  const exact = records.filter(record => record.questionId === questionId);
  if (exact.length > 1) throw invalid("Ambiguous academy questionId.");
  if (exact.length) return { ...exact[0], root, requestedId: questionId };
  const bank = await readBank(options);
  const bundled = Object.hasOwn(bank.questions || {}, questionId) ? bank.questions[questionId] : null;
  if (bundled && !questionId.startsWith("academy/")) {
    const course = questionId.split("/")[0];
    const stem = questionId.split("/").pop().replace(/\.fen$/, "");
    const endgame = course === "endgame" && stem.match(/^eg_([A-Z0-9]+-[A-Z0-9]+)_L[123]-(\d+)$/);
    const aliases = new Set([stem]);
    if (endgame) aliases.add(endgame[1].toLowerCase() + "-" + endgame[2]);
    const matches = records.filter(record => record.course === course && aliases.has(record.item.id));
    if (matches.length > 1) throw invalid("Ambiguous legacy questionId; use the exact academy questionId.");
    if (matches.length) return { ...matches[0], root, requestedId: questionId };
  }
  if (bundled) return { bundled, requestedId: questionId };
  throw invalid("Unresolved questionId: no trusted academy or bundled question record.");
}
function solutionFile(record, stem, suffix) {
  return underRoot(record.root, path.join(record.directory, validateStem(stem) + suffix));
}
async function loadResolved(record) {
  if (record.bundled) {
    const stem = record.requestedId.split("/").pop().replace(/\.fen$/, "");
    const solutions = (record.bundled.solutions || []).map(solution => {
      const id = String(solution.label || solution.id || "").replace(/\.txt$/, "");
      return { id, number: variantNumber(stem, id), text: solution.text || "", explanation: record.bundled.explanation || "", annotation: null, relativePath: null };
    });
    return { ok: true, questionId: record.requestedId, fen: record.bundled.fen, solutions: sortSolutions(solutions), readOnly: true };
  }
  const solutions = [];
  const variants = record.item.solutions?.length ? record.item.solutions : [{ id: record.item.id }];
  for (const variant of variants) {
    const id = validateStem(variant.id);
    const number = variantNumber(record.item.id, id);
    const text = await readOptional(solutionFile(record, id, ".solution.txt"));
    let explanation = await readOptional(solutionFile(record, id, ".exp.txt"));
    if (explanation === null && id !== record.item.id) explanation = await readOptional(solutionFile(record, record.item.id, ".exp.txt"));
    let annotation = await readOptional(solutionFile(record, id, ".anno.json"));
    if (annotation === null && id !== record.item.id) annotation = await readOptional(solutionFile(record, record.item.id, ".anno.json"));
    solutions.push({ id, number, text: text ?? "", explanation: explanation ?? "", annotation: annotation === null ? null : JSON.parse(annotation), relativePath: "academy/" + path.relative(record.root, solutionFile(record, id, ".solution.txt")).split(path.sep).join("/") });
  }
  return { ok: true, questionId: record.requestedId, fen: record.item.fen, solutions: sortSolutions(solutions), readOnly: false };
}
async function writeAtomic(file, contents) {
  await safePath(file);
  const temporary = file + "." + crypto.randomUUID() + ".tmp";
  try {
    await fs.writeFile(temporary, contents, { encoding: "utf8", flag: "wx" });
    await safePath(file);
    await fs.rename(temporary, file);
  } finally { await fs.rm(temporary, { force: true }); }
}
async function loadSolutions(input, options = {}) {
  return loadResolved(await resolveQuestion(input, options));
}
async function saveSolution(input, options = {}) {
  const solutionId = validateStem(input.solutionId);
  for (const field of ["solutionText", "explanation"]) {
    if (input[field] !== undefined && typeof input[field] !== "string") throw invalid(field + " must be a string.");
  }
  const record = await resolveQuestion(input, options);
  if (record.bundled) throw invalid("Unresolved academy questionId: bundled question is read-only; no save path will be invented.");
  const loaded = await loadResolved(record);
  const selected = loaded.solutions.find(solution => solution.id === solutionId);
  if (!selected) throw invalid("Unknown solutionId for this question.");
  if (input.solutionText !== undefined) {
    const text = input.solutionText.trimEnd();
    await writeAtomic(solutionFile(record, solutionId, ".solution.txt"), /^#\s*END\s*$/m.test(text) ? text + "\n" : text + "\n# END\n");
  }
  if (input.explanation !== undefined) {
    const annotation = selected.annotation || { game_id: solutionId, intro: { popup: "", flash_squares: [] }, moves: [], outro: { popup: "" } };
    annotation.description = input.explanation;
    await writeAtomic(solutionFile(record, solutionId, ".exp.txt"), input.explanation);
    await writeAtomic(solutionFile(record, solutionId, ".anno.json"), JSON.stringify(annotation, null, 2) + "\n");
  }
  return { ...await loadResolved(record), solutionId, bundleUpdated: false };
}

module.exports = { loadSolutions, saveSolution };