const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const DEFAULT_BANK_ROOT = path.resolve(__dirname, "../../chinese-chess/bank/endgame/L1");
const CUSTOM_ID_RE = /^(eg|at|tac|oc)_([\p{L}\p{N}]+)_(L[1-3])-(\d{3})$/u;
const CUSTOM_TYPES = { eg: "endgame", at: "attacking", tac: "tactics", oc: "opening" };
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
      const piece = { N: "H", n: "h", B: "E", b: "e" }[token] || token;
      if (/^[1-9]$/.test(token)) {
        width += Number(token);
      } else if (PIECE_LABELS[piece]) {
        width += 1;
        counts[piece] += 1;
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
  if (!CUSTOM_ID_RE.test(id)) throw httpError(400, "编号必须符合 eg/at/tac/oc_棋局名_L1/L2/L3-001 格式，并使用三位序号。");
  return id;
}

function reservedPuzzleIds(item) {
  return [item.id, item.previousId, item.originalId, ...(Array.isArray(item.previousIds) ? item.previousIds : [])].filter(Boolean);
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

async function findExactDuplicates(fen, root, customManifest) {
  const bankRoot = path.resolve(root, "../..");
  const mainManifest = JSON.parse(await fs.readFile(path.join(bankRoot, "manifest.json"), "utf8"));
  if (!Array.isArray(mainManifest.categories)) throw httpError(500, "象棋题库 manifest 格式不正确。");
  const { parseFen: parseBoard } = await import("../../chinese-chess/core.mjs");
  const key = value => {
    const position = parseBoard(value);
    return JSON.stringify([position.board, position.turn]);
  };
  const positionKey = key(fen);
  const entries = [
    ...mainManifest.categories.flatMap(category => category.items.map(item => ({ item, base: bankRoot }))),
    ...(customManifest.categories.find(category => category.key === "custom")?.items || [])
      .map(item => ({ item, base: root }))
  ];
  const matches = [];
  for (const { item, base } of entries) {
    const file = path.resolve(base, item.fen);
    if (!file.startsWith(path.resolve(base) + path.sep)) throw httpError(500, `棋局 ${item.id} 的局面路径无效。`);
    try {
      if (key(await fs.readFile(file, "utf8")) === positionKey) matches.push(item.id);
    } catch (error) {
      throw httpError(500, `读取或解析棋局 ${item.id} 失败：${error.message}`);
    }
  }
  return [...new Set(matches)];
}

async function validateClassificationInput(input) {
  const { validClassification } = await import("../../chinese-chess/academy/classification.mjs");
  if (!Array.isArray(input.classifications) || !input.classifications.length
    || input.classifications.some(entry => !validClassification(entry))) {
    throw httpError(400, "请选择有效的主分类和子分类。");
  }
  const unique = new Set(input.classifications.map(entry => JSON.stringify([entry.family, entry.group, entry.category])));
  if (unique.size !== input.classifications.length) throw httpError(400, "分类不能重复。");
  if (!Array.isArray(input.lessonSections) || !input.lessonSections.length
    || input.lessonSections.some(section => !["observation", "practice"].includes(section))
    || new Set(input.lessonSections).size !== input.lessonSections.length) {
    throw httpError(400, "请至少选择一个有效的课程展示入口。");
  }
  return {
    classifications: input.classifications.map(({ family, group, category }) => ({ family, group, category })),
    lessonSections: [...input.lessonSections]
  };
}

async function savePuzzleClassification(input, options = {}) {
  const root = options.bankRoot || DEFAULT_BANK_ROOT;
  const id = String(input.id || "");
  const classification = await validateClassificationInput(input);
  const { file: customFile, data: custom } = await readManifest(root);
  const customItem = custom.categories.find(category => category.key === "custom")?.items.find(item => item.id === id);
  if (customItem) {
    Object.assign(customItem, classification);
    await writeAtomic(customFile, `${JSON.stringify(custom, null, 2)}\n`);
    return { id };
  }
  const bankRoot = path.resolve(root, "../..");
  const file = path.join(bankRoot, "manifest.json");
  const manifest = JSON.parse(await fs.readFile(file, "utf8"));
  const items = manifest.categories.flatMap(category => category.items).filter(item => item.id === id);
  if (items.length !== 1) throw httpError(items.length ? 409 : 404, "棋局不存在或编号不唯一。");
  Object.assign(items[0], classification);
  await writeAtomic(file, `${JSON.stringify(manifest, null, 2)}\n`);
  return { id };
}

async function replacePuzzle(input, options = {}) {
  const root = options.bankRoot || DEFAULT_BANK_ROOT;
  const bankRoot = path.resolve(root, "../..");
  const id = validateId(input.id);
  const [, prefix, , level, sequence] = id.match(CUSTOM_ID_RE);
  const title = String(input.title || "").trim();
  if (!title || title.length > 80) throw httpError(400, "棋局名称不能为空，且不能超过 80 个字符。");
  const { fen } = parseFen(input.fen);
  const classification = await validateClassificationInput(input);
  if (classification.classifications[0].family !== CUSTOM_TYPES[prefix]) {
    throw httpError(400, "主分类类型必须与棋局编号一致。");
  }
  const { file: customFile, data: custom } = await readManifest(root);
  const mainFile = path.join(bankRoot, "manifest.json");
  const main = JSON.parse(await fs.readFile(mainFile, "utf8"));
  const entries = [
    ...main.categories.flatMap(category => category.items.map((item, index) => ({ item, category, index, base: bankRoot, file: mainFile, manifest: main, custom: false }))),
    ...(custom.categories.find(category => category.key === "custom")?.items || [])
      .map((item, index) => ({ item, category: custom.categories.find(category => category.key === "custom"), index, base: root, file: customFile, manifest: custom, custom: true }))
  ];
  const targets = entries.filter(entry => entry.item.id === input.replaceId);
  if (targets.length !== 1) throw httpError(targets.length ? 409 : 404, "替换目标不存在或编号不唯一，请重新检查。");
  const target = targets[0];
  if (target.item.title !== input.expectedTitle) throw httpError(409, "替换目标已发生变化，请重新检查。");
  if (target.custom) validateId(target.item.id);
  if (id === target.item.id) throw httpError(409, "替换时请使用新的编号。");
  if (entries.some(entry => reservedPuzzleIds(entry.item).includes(id))) throw httpError(409, "新编号已被使用或保留用于追溯，请重新保存以生成可用序号。");
  if (!(await findExactDuplicates(fen, root, custom)).includes(target.item.id)) {
    throw httpError(409, "替换目标的局面或行棋方已变化，请重新检查。");
  }
  const previous = target.item;
  for (const relative of [previous.fen, previous.metadata, ...(previous.solutions || []), ...(previous.explanations || []), ...(previous.pgn || [])].filter(Boolean)) {
    const file = path.resolve(target.base, relative);
    if (!file.startsWith(path.resolve(target.base) + path.sep)) throw httpError(500, "原棋局材料路径无效。");
    try { await fs.access(file); }
    catch (error) { throw httpError(500, `原棋局材料无法读取：${relative}（${error.message}）`); }
  }
  const previousIds = [...new Set([...(previous.previousIds || []), previous.id])].filter(oldId => oldId !== id);
  const item = { ...previous, ...classification, id, title, label: title, previousIds };
  delete item.namingPending;
  delete item.classificationPending;
  let directory;
  if (id !== previous.id) {
    directory = path.join(target.custom ? root : bankRoot, target.custom ? "custom" : "rootgene-replacements", id);
    try {
      await fs.mkdir(directory, { recursive: false });
    } catch (error) {
      if (error.code === "ENOENT") {
        await fs.mkdir(path.dirname(directory), { recursive: true });
        await fs.mkdir(directory);
      } else if (error.code === "EEXIST") {
        throw httpError(409, "新编号的材料目录已存在，未覆盖；请使用其他序号。");
      } else throw error;
    }
  }
  try {
    if (target.custom && directory) {
      const source = path.join(root, "custom", previous.id);
      const entriesInDirectory = await fs.readdir(source, { withFileTypes: true });
      for (const entry of entriesInDirectory) {
        const newName = entry.name.startsWith(previous.id) ? id + entry.name.slice(previous.id.length) : entry.name;
        await fs.cp(path.join(source, entry.name), path.join(directory, newName), { recursive: true, errorOnExist: true, force: false });
      }
      const mapFile = file => {
        const oldPrefix = `custom/${previous.id}/`;
        if (!file.startsWith(oldPrefix)) throw httpError(409, "手工棋局材料路径异常，未进行替换。");
        const name = file.slice(oldPrefix.length);
        return `custom/${id}/${name.startsWith(previous.id) ? id + name.slice(previous.id.length) : name}`;
      };
      item.fen = mapFile(previous.fen);
      item.metadata = mapFile(previous.metadata);
      item.solutions = (previous.solutions || []).map(mapFile);
      item.explanations = (previous.explanations || []).map(mapFile);
      const metadataPath = path.join(directory, `${id}.json`);
      const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
      Object.assign(metadata, { id, title, type: CUSTOM_TYPES[prefix], difficulty: level, sequence: Number(sequence), previousIds });
      await writeAtomic(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
      item.type = CUSTOM_TYPES[prefix];
      item.difficulty = level;
    } else if (!target.custom && directory && previous.metadata) {
      const oldMetadataPath = path.resolve(bankRoot, previous.metadata);
      if (!oldMetadataPath.startsWith(bankRoot + path.sep)) throw httpError(500, "原棋局元数据路径无效。");
      const metadata = JSON.parse(await fs.readFile(oldMetadataPath, "utf8"));
      if ("geneId" in metadata) metadata.geneId = id;
      if ("id" in metadata) metadata.id = id;
      if (metadata.displayInfo) metadata.displayInfo.chineseName = title;
      if ("title" in metadata) metadata.title = title;
      if (metadata.metadata) Object.assign(metadata.metadata, { difficulty: level, sequence: Number(sequence) });
      metadata.previousIds = previousIds;
      const relative = `rootgene-replacements/${id}/${id}.json`;
      await writeAtomic(path.join(bankRoot, relative), `${JSON.stringify(metadata, null, 2)}\n`);
      item.metadata = relative;
    }
    target.category.items[target.index] = item;
    await writeAtomic(target.file, `${JSON.stringify(target.manifest, null, 2)}\n`);
  } catch (error) {
    if (directory) {
      try { await fs.rm(directory, { recursive: true, force: true }); }
      catch (cleanupError) { throw httpError(500, `${error.message}；清理未完成的目录失败：${cleanupError.message}`); }
    }
    throw error;
  }
  return { id, replacedId: previous.id };
}

async function suggestPuzzleId(input, options = {}) {
  const root = options.bankRoot || DEFAULT_BANK_ROOT;
  const bankRoot = path.resolve(root, "../..");
  const stem = String(input.stem || "");
  if (!/^(eg|at|tac|oc)_[\p{L}\p{N}]+_L[1-3]-$/u.test(stem)) throw httpError(400, "棋局名称或类型无效。");
  const { data: custom } = await readManifest(root);
  const main = JSON.parse(await fs.readFile(path.join(bankRoot, "manifest.json"), "utf8"));
  const ids = new Set([...main.categories, ...custom.categories].flatMap(category => category.items.flatMap(reservedPuzzleIds)));
  const exists = async file => {
    try { await fs.access(file); return true; }
    catch (error) { if (error.code === "ENOENT") return false; throw error; }
  };
  for (let n = 1; n <= 999; n += 1) {
    const id = `${stem}${String(n).padStart(3, "0")}`;
    if (!ids.has(id) && !await exists(path.join(root, "custom", id))
      && !await exists(path.join(bankRoot, "rootgene-replacements", id))) return { id };
  }
  throw httpError(409, "该名称和级别的序号已用完。");
}

async function persistCustomPuzzle(input, options = {}) {
  const root = options.bankRoot || DEFAULT_BANK_ROOT;
  const id = validateId(input.id);
  const [, prefix, , level] = id.match(CUSTOM_ID_RE);
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
  const mainManifest = JSON.parse(await fs.readFile(path.join(path.resolve(root, "../.."), "manifest.json"), "utf8"));
  if (mainManifest.categories.some(entry => entry.items.some(item => item.id === id))) {
    throw httpError(409, "该编号已存在于原题库，请使用其他名称或序号。");
  }
  if ([...mainManifest.categories.flatMap(entry => entry.items), ...category.items]
    .some(item => item.id !== id && reservedPuzzleIds(item).includes(id))) {
    throw httpError(409, "该编号已保留用于追溯，请使用其他序号。");
  }
  const confirmed = Array.isArray(input.confirmedDuplicateIds) ? input.confirmedDuplicateIds : [];
  const duplicates = (await findExactDuplicates(fen, root, manifest))
    .filter(match => !(input.updateExisting && match === id));
  if (duplicates.some(match => !confirmed.includes(match))) {
    throw httpError(409, `发现未确认的相同局面：${duplicates.join("、")}。请重新检查后保存。`);
  }

  const directory = path.join(root, "custom", id);
  const folder = path.relative(root, directory);
  if (folder.startsWith("..") || path.isAbsolute(folder)) throw httpError(400, "无效的题库保存路径。");
  if (existingIndex < 0) {
    try {
      await fs.access(directory);
      throw httpError(409, "该编号的材料目录已存在，未覆盖；请使用其他序号。");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const fenFile = path.posix.join("custom", id, `${id}.fen`);
  const metadataFile = path.posix.join("custom", id, `${id}.json`);
  const fenPath = path.join(directory, `${id}.fen`);
  const oldFen = await fs.readFile(fenPath, "utf8").catch(error => error.code === "ENOENT" ? "" : Promise.reject(error));
  const { parseFen: parseBoard } = await import("../../chinese-chess/core.mjs");
  const boardKey = value => {
    const position = parseBoard(value);
    return JSON.stringify([position.board, position.turn]);
  };
  const fenChanged = !oldFen || boardKey(oldFen) !== boardKey(fen);
  const metadata = {
    id,
    title,
    type: CUSTOM_TYPES[prefix],
    difficulty: level,
    sequence: Number(id.match(/(\d{3})$/)[1]),
    verified: false,
    firstMover: fen.split(/\s+/)[1],
    pieces: counts,
    fen
  };
  const previous = existingIndex >= 0 ? category.items[existingIndex] : null;
  const classification = input.classifications === undefined ? {} : await validateClassificationInput(input);
  if (classification.classifications && classification.classifications[0].family !== CUSTOM_TYPES[prefix]) {
    throw httpError(400, "主分类类型必须与手工棋局编号一致。");
  }
  const item = { ...(previous || {}), ...classification, id, title, label: title, fen: fenFile, metadata: metadataFile, solutions: fenChanged ? [] : previous?.solutions || [], explanations: fenChanged ? [] : previous?.explanations || [], type: CUSTOM_TYPES[prefix], difficulty: level, rootGene: "manual" };
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

module.exports = { persistCustomPuzzle, replacePuzzle, suggestPuzzleId, savePuzzleClassification, savePuzzleMaterial, deleteCustomPuzzle, parseFen, validateId };
