const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const DEFAULT_BANK_ROOT = path.resolve(__dirname, "../../chinese-chess/bank/endgame/L1");
const CUSTOM_ID_RE = /^eg_CUSTOM_L1-(\d{3})$/;
const PIECE_LIMITS = { K: 1, A: 2, E: 2, H: 2, R: 2, C: 2, P: 5 };
const PIECE_LABELS = { K: "帅", A: "仕", E: "相", H: "马", R: "车", C: "炮", P: "兵", k: "将", a: "士", e: "象", h: "马", r: "车", c: "炮", p: "卒" };

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parseFen(fen) {
  const fields = String(fen || "").trim().split(/\s+/);
  if (fields.length !== 6 || !/^[rbw]$/i.test(fields[1])) throw httpError(400, "FEN 需要包含棋盘、行棋方及完整六个字段。");
  const ranks = fields[0].split("/");
  if (ranks.length !== 10) throw httpError(400, "象棋 FEN 必须包含 10 行棋盘。");
  const counts = Object.fromEntries(Object.keys(PIECE_LIMITS).flatMap(code => [[code, 0], [code.toLowerCase(), 0]]));
  for (const [rankIndex, rank] of ranks.entries()) {
    let width = 0;
    for (const token of rank) {
      if (/^[1-9]$/.test(token)) {
        width += Number(token);
      } else if (PIECE_LABELS[token]) {
        width += 1;
        counts[token] += 1;
      } else {
        throw httpError(400, `FEN 第 ${rankIndex + 1} 行含无效棋子符号。`);
      }
    }
    if (width !== 9) throw httpError(400, `FEN 第 ${rankIndex + 1} 行必须正好有 9 路。`);
  }
  for (const color of ["red", "black"]) {
    const king = color === "red" ? "K" : "k";
    if (counts[king] !== 1) throw httpError(400, "局面必须恰好包含红帅和黑将各一枚。");
  }
  for (const [type, maximum] of Object.entries(PIECE_LIMITS)) {
    if (counts[type] > maximum || counts[type.toLowerCase()] > maximum) {
      throw httpError(400, `每方${PIECE_LABELS[type]}的数量不能超过 ${maximum} 枚。`);
    }
  }
  return { fen: fields.join(" "), counts };
}

function validateId(value) {
  const id = String(value || "").trim();
  if (!CUSTOM_ID_RE.test(id)) throw httpError(400, "编号必须符合 eg_CUSTOM_L1-001 格式，并使用三位序号。");
  return id;
}

function relativePuzzleFiles(id, version) {
  const suffix = String(version).padStart(3, "0");
  return {
    solution: `custom/${id}/${id}-${suffix}.txt`,
    explanation: `custom/${id}/${id}_exp-${suffix}.txt`
  };
}

async function readManifest(root) {
  const file = path.join(root, "manifest.json");
  const parsed = JSON.parse(await fs.readFile(file, "utf8"));
  if (!Array.isArray(parsed.categories)) throw httpError(500, "象棋残局题库 manifest 格式不正确。");
  return { file, data: parsed };
}

async function writeAtomic(file, contents) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, contents, "utf8");
    await fs.rename(temporary, file);
  } catch (error) {
    await fs.rm(temporary, { force: true }).catch(() => {});
    throw error;
  }
}

async function persistCustomPuzzle(input, options = {}) {
  const root = options.bankRoot || DEFAULT_BANK_ROOT;
  const id = validateId(input.id);
  const title = String(input.title || "").trim();
  if (!title || title.length > 80) throw httpError(400, "棋局名称不能为空，且不能超过 80 个字符。");
  const { fen, counts } = parseFen(input.fen);
  const { file: manifestFile, data: manifest } = await readManifest(root);
  let category = manifest.categories.find(item => item.key === "custom");
  if (!category) {
    category = { key: "custom", label: "手工编辑", items: [] };
    manifest.categories.push(category);
  }
  const existingIndex = category.items.findIndex(item => item.id === id);
  if (existingIndex >= 0 && !input.updateExisting) throw httpError(409, "该编号已存在，请使用下一个三位序号。");

  const directory = path.join(root, "custom", id);
  const folder = path.relative(root, directory);
  if (folder.startsWith("..") || path.isAbsolute(folder)) throw httpError(400, "无效的题库保存路径。");
  const fenFile = path.posix.join("custom", id, `${id}.fen`);
  const metadataFile = path.posix.join("custom", id, `${id}.json`);
  const fenPath = path.join(directory, `${id}.fen`);
  const oldFen = await fs.readFile(fenPath, "utf8").catch(error => error.code === "ENOENT" ? "" : Promise.reject(error));
  const fenChanged = oldFen.trim() !== fen;
  const metadata = {
    id,
    title,
    type: "endgame",
    difficulty: "L1",
    sequence: Number(id.match(/(\d{3})$/)[1]),
    verified: false,
    firstMover: fen.split(/\s+/)[1],
    pieces: counts,
    fen
  };
  const previous = existingIndex >= 0 ? category.items[existingIndex] : null;
  const item = { ...(previous || {}), id, title, label: title, fen: fenFile, metadata: metadataFile, solutions: fenChanged ? [] : previous?.solutions || [], explanations: fenChanged ? [] : previous?.explanations || [], difficulty: "L1", rootGene: "manual" };
  if (existingIndex >= 0) category.items[existingIndex] = item;
  else category.items.push(item);

  await fs.mkdir(directory, { recursive: true });
  await Promise.all([
    writeAtomic(fenPath, `${fen}\n`),
    writeAtomic(path.join(directory, `${id}.json`), `${JSON.stringify(metadata, null, 2)}\n`)
  ]);
  if (fenChanged && previous) {
    const oldFiles = [...(previous.solutions || []), ...(previous.explanations || [])];
    await Promise.all(oldFiles.map(relative => {
      if (!relative.startsWith(`custom/${id}/`)) return Promise.resolve();
      const oldPath = path.resolve(root, relative);
      return oldPath.startsWith(directory + path.sep) ? fs.rm(oldPath, { force: true }) : Promise.resolve();
    }));
  }
  await writeAtomic(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  return { id, title, fen, item, relativePath: `web/chinese-chess/bank/endgame/L1/custom/${id}` };
}

async function savePuzzleMaterial(input, options = {}) {
  const root = options.bankRoot || DEFAULT_BANK_ROOT;
  const id = validateId(input.id);
  const kind = input.kind;
  if (kind !== "solution" && kind !== "explanation") throw httpError(400, "kind 必须是 solution 或 explanation。");
  const text = String(input.text || "").trim();
  if (!text) throw httpError(400, "保存内容不能为空。");
  const version = Number(input.version);
  if (!Number.isInteger(version) || version < 1 || version > 999) throw httpError(400, "版本号必须在 001 到 999 之间。");

  const { file: manifestFile, data: manifest } = await readManifest(root);
  const category = manifest.categories.find(item => item.key === "custom");
  const item = category?.items.find(entry => entry.id === id);
  if (!item) throw httpError(404, "找不到对应的手工棋局，请先保存局面。");

  const paths = relativePuzzleFiles(id, version);
  const relativePath = paths[kind];
  const fullPath = path.resolve(root, relativePath);
  if (!fullPath.startsWith(path.resolve(root) + path.sep)) throw httpError(400, "无效的题库保存路径。");
  const listName = kind === "solution" ? "solutions" : "explanations";
  const files = item[listName] || (item[listName] = []);
  if (!files.includes(relativePath)) files.push(relativePath);
  files.sort((left, right) => left.localeCompare(right));

  const contents = kind === "solution" && !/^#\s*END\s*$/m.test(text) ? `${text}\n# END\n` : `${text}\n`;
  await writeAtomic(fullPath, contents);
  await writeAtomic(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  return { id, kind, version, relativePath };
}

async function deleteCustomPuzzle(input, options = {}) {
  const root = options.bankRoot || DEFAULT_BANK_ROOT;
  const id = validateId(input.id);
  const { file: manifestFile, data: manifest } = await readManifest(root);
  const category = manifest.categories.find(item => item.key === "custom");
  const itemIndex = category?.items.findIndex(item => item.id === id) ?? -1;
  if (!category || itemIndex < 0) throw httpError(404, "找不到该手工棋局。");

  const directory = path.resolve(root, "custom", id);
  if (!directory.startsWith(path.resolve(root, "custom") + path.sep)) throw httpError(400, "无效的题库删除路径。");
  category.items.splice(itemIndex, 1);
  await writeAtomic(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  await fs.rm(directory, { recursive: true, force: true });
  return { id, deleted: true };
}

module.exports = { persistCustomPuzzle, savePuzzleMaterial, deleteCustomPuzzle, parseFen, validateId };
