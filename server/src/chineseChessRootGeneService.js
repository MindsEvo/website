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

function classificationCatalogPaths(root) {
  const bankRoot = path.resolve(root, "../..");
  return {
    bankRoot,
    catalogFile: path.join(bankRoot, "classifications.json"),
    manifestFiles: [
      path.join(bankRoot, "manifest.json"),
      path.join(root, "manifest.json")
    ]
  };
}

function validateClassificationGroups(groups) {
  if (!groups || typeof groups !== "object" || Array.isArray(groups)) {
    throw httpError(400, "分类目录格式无效。");
  }
  for (const [family, familyGroups] of Object.entries(groups)) {
    if (!/^(endgame|attacking|tactics|opening)$/.test(family)
      || !familyGroups || typeof familyGroups !== "object" || Array.isArray(familyGroups)) {
      throw httpError(400, "分类目录包含无效的棋种或组分类。");
    }
    for (const [group, categories] of Object.entries(familyGroups)) {
      if (!group.trim() || group === "待定" || !Array.isArray(categories)) {
        throw httpError(400, "组分类无效，且不能使用历史状态“待定”。");
      }
      if (new Set(categories).size !== categories.length
        || categories.some(category => typeof category !== "string" || !category.trim() || category === "待定")) {
        throw httpError(400, "子分类名称无效或重复，且不能使用历史状态“待定”。");
      }
    }
  }
  return groups;
}

async function loadClassificationGroups(root = DEFAULT_BANK_ROOT) {
  const { catalogFile } = classificationCatalogPaths(root);
  const { CLASSIFICATION_GROUPS } = await import("../../chinese-chess/academy/classification.mjs");
  try {
    const saved = JSON.parse(await fs.readFile(catalogFile, "utf8"));
    return validateClassificationGroups(saved.groups);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return Object.fromEntries(Object.entries(CLASSIFICATION_GROUPS).map(([family, groups]) => [
      family, Object.fromEntries(Object.entries(groups).map(([group, categories]) => [group, [...categories]]))
    ]));
  }
}

async function saveClassificationGroups(file, groups) {
  validateClassificationGroups(groups);
  await writeAtomic(file, `${JSON.stringify({ version: 1, groups }, null, 2)}\n`);
}

async function updateStoredClassifications(root, transform) {
  const { manifestFiles } = classificationCatalogPaths(root);
  const updates = [];
  for (const file of manifestFiles) {
    const text = await fs.readFile(file, "utf8");
    const manifest = JSON.parse(text);
    let changed = false;
    for (const category of manifest.categories || []) {
      for (const item of category.items || []) {
        if (!Array.isArray(item.classifications)) continue;
        const next = item.classifications.map(transform);
        if (next.some((entry, index) => entry !== item.classifications[index])) {
          item.classifications = next;
          changed = true;
        }
      }
    }
    if (changed) updates.push({ file, previous: text, next: `${JSON.stringify(manifest, null, 2)}\n` });
  }
  const written = [];
  try {
    for (const update of updates) {
      await writeAtomic(update.file, update.next);
      written.push(update);
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const update of written.reverse()) {
      try { await writeAtomic(update.file, update.previous); }
      catch (rollbackError) { rollbackErrors.push(rollbackError.message); }
    }
    if (rollbackErrors.length) throw httpError(500, `${error.message}；分类回滚失败：${rollbackErrors.join("；")}`);
    throw error;
  }
  return async () => {
    const rollbackErrors = [];
    for (const update of [...updates].reverse()) {
      try { await writeAtomic(update.file, update.previous); }
      catch (rollbackError) { rollbackErrors.push(rollbackError.message); }
    }
    if (rollbackErrors.length) throw httpError(500, rollbackErrors.join("；"));
  };
}

async function getClassificationCatalog(options = {}) {
  const root = options.bankRoot || DEFAULT_BANK_ROOT;
  return { groups: await loadClassificationGroups(root) };
}

async function updateClassificationCatalog(input, options = {}) {
  const root = options.bankRoot || DEFAULT_BANK_ROOT;
  const { bankRoot, catalogFile, manifestFiles } = classificationCatalogPaths(root);
  const groups = await loadClassificationGroups(root);
  const { action, family, group, category, name } = input;
  if (!groups[family]) throw httpError(400, "请选择有效的棋局类型。");
  let rollbackStoredClassifications = null;
  const validName = value => typeof value === "string" && value.trim().length <= 40
    && /^[\p{L}\p{N}][\p{L}\p{N} _（）()·-]*$/u.test(value.trim())
    && value.trim() !== "待定";
  const assertName = value => {
    if (!validName(value)) throw httpError(400, "分类名称需为 1–40 个中英文、数字或常用连接符。");
    return value.trim();
  };
  const usedByPuzzles = async predicate => {
    let count = 0;
    for (const file of manifestFiles) {
      const manifest = JSON.parse(await fs.readFile(file, "utf8"));
      for (const item of (manifest.categories || []).flatMap(entry => entry.items || [])) {
        if (item.classifications?.some(predicate)) count += 1;
      }
    }
    return count;
  };

  if (action === "add-group") {
    const newGroup = assertName(group);
    const firstCategory = assertName(category);
    if (groups[family][newGroup]) throw httpError(409, "组分类已存在。");
    groups[family][newGroup] = [firstCategory];
  } else if (action === "add-category") {
    const targetGroup = groups[family][group];
    if (!targetGroup) throw httpError(404, "组分类不存在。");
    const newCategory = assertName(category);
    if (targetGroup.includes(newCategory)) throw httpError(409, "子分类已存在。");
    targetGroup.push(newCategory);
  } else if (action === "rename-group") {
    if (!groups[family][group]) throw httpError(404, "组分类不存在。");
    const newGroup = assertName(name);
    if (groups[family][newGroup]) throw httpError(409, "目标组分类已存在。");
    const count = await usedByPuzzles(entry => entry.family === family && entry.group === group);
    const next = {};
    for (const [key, values] of Object.entries(groups[family])) next[key === group ? newGroup : key] = values;
    groups[family] = next;
    if (count) rollbackStoredClassifications = await updateStoredClassifications(root, entry =>
      entry.family === family && entry.group === group ? { ...entry, group: newGroup } : entry);
  } else if (action === "rename-category") {
    if (!groups[family][group]?.includes(category)) throw httpError(404, "子分类不存在。");
    const newCategory = assertName(name);
    if (groups[family][group].includes(newCategory)) throw httpError(409, "目标子分类已存在。");
    const count = await usedByPuzzles(entry =>
      entry.family === family && entry.group === group && entry.category === category);
    groups[family][group] = groups[family][group].map(value => value === category ? newCategory : value);
    if (count) rollbackStoredClassifications = await updateStoredClassifications(root, entry =>
      entry.family === family && entry.group === group && entry.category === category
        ? { ...entry, category: newCategory } : entry);
  } else if (action === "delete-group") {
    if (!groups[family][group]) throw httpError(404, "组分类不存在。");
    const count = await usedByPuzzles(entry => entry.family === family && entry.group === group);
    if (count) throw httpError(409, `该组分类仍关联 ${count} 个棋局，请先迁移棋局分类。`);
    delete groups[family][group];
  } else if (action === "delete-category") {
    if (!groups[family][group]?.includes(category)) throw httpError(404, "子分类不存在。");
    const count = await usedByPuzzles(entry =>
      entry.family === family && entry.group === group && entry.category === category);
    if (count) throw httpError(409, `该子分类仍关联 ${count} 个棋局，请先迁移棋局分类。`);
    groups[family][group] = groups[family][group].filter(value => value !== category);
  } else {
    throw httpError(400, "不支持的分类操作。");
  }

  try {
    await fs.mkdir(bankRoot, { recursive: true });
    await saveClassificationGroups(catalogFile, groups);
  } catch (error) {
    if (rollbackStoredClassifications) {
      try { await rollbackStoredClassifications(); }
      catch (rollbackError) {
        throw httpError(500, `${error.message}；题目分类回滚失败：${rollbackError.message}`);
      }
    }
    throw error;
  }
  return { groups };
}

async function clearMetadataClassificationPending(item, base) {
  if (!item.metadata) return;
  const root = path.resolve(base);
  const file = path.resolve(root, item.metadata);
  if (!file.startsWith(root + path.sep)) throw httpError(500, `棋局 ${item.id} 的元数据路径无效。`);
  const metadata = JSON.parse(await fs.readFile(file, "utf8"));
  if (!Object.hasOwn(metadata, "classificationPending")) return;
  delete metadata.classificationPending;
  await writeAtomic(file, `${JSON.stringify(metadata, null, 2)}\n`);
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

async function validateClassificationInput(input, root = DEFAULT_BANK_ROOT) {
  const groups = await loadClassificationGroups(root);
  const { validClassification } = await import("../../chinese-chess/academy/classification.mjs");
  if (!Array.isArray(input.classifications) || !input.classifications.length
    || input.classifications.some(entry => !validClassification(entry, groups))) {
    throw httpError(400, "请选择有效的主分类和子分类。");
  }
  const isPending = entry => entry.group === "待定" || entry.category === "待定";
  const classifications = input.classifications.some(entry => !isPending(entry))
    ? input.classifications.filter(entry => !isPending(entry))
    : input.classifications;
  const unique = new Set(classifications.map(entry => JSON.stringify([entry.family, entry.group, entry.category])));
  if (unique.size !== classifications.length) throw httpError(400, "分类不能重复。");
  if (!Array.isArray(input.lessonSections) || !input.lessonSections.length
    || input.lessonSections.some(section => !["observation", "practice"].includes(section))
    || new Set(input.lessonSections).size !== input.lessonSections.length) {
    throw httpError(400, "请至少选择一个有效的课程展示入口。");
  }
  return {
    classifications: classifications.map(({ family, group, category }) => ({ family, group, category })),
    lessonSections: [...input.lessonSections]
  };
}

async function savePuzzleClassification(input, options = {}) {
  const root = options.bankRoot || DEFAULT_BANK_ROOT;
  const id = String(input.id || "");
  const classification = await validateClassificationInput(input, root);
  const { file: customFile, data: custom } = await readManifest(root);
  const customItem = custom.categories.find(category => category.key === "custom")?.items.find(item => item.id === id);
  const hasClassifiedClassification = classification.classifications.some(entry => entry.group !== "待定" && entry.category !== "待定");
  if (customItem) {
    Object.assign(customItem, classification);
    if (hasClassifiedClassification) {
      delete customItem.classificationPending;
      await clearMetadataClassificationPending(customItem, root);
    }
    await writeAtomic(customFile, `${JSON.stringify(custom, null, 2)}\n`);
    return { id };
  }
  const bankRoot = path.resolve(root, "../..");
  const file = path.join(bankRoot, "manifest.json");
  const manifest = JSON.parse(await fs.readFile(file, "utf8"));
  const items = manifest.categories.flatMap(category => category.items).filter(item => item.id === id);
  if (items.length !== 1) throw httpError(items.length ? 409 : 404, "棋局不存在或编号不唯一。");
  Object.assign(items[0], classification);
  if (hasClassifiedClassification) {
    delete items[0].classificationPending;
    await clearMetadataClassificationPending(items[0], bankRoot);
  }
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
  const classification = await validateClassificationInput(input, root);
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

async function updateSourcePuzzle(input, root) {
  const bankRoot = path.resolve(root, "../..");
  const mainFile = path.join(bankRoot, "manifest.json");
  const mainText = await fs.readFile(mainFile, "utf8");
  const main = JSON.parse(mainText);
  const matches = main.categories.flatMap(category => category.items).filter(item => item.id === input.updateSourceId);
  if (matches.length !== 1) throw httpError(matches.length ? 409 : 404, "原题不存在或编号不唯一，请重新载入。");
  const previous = matches[0];
  if (previous.title !== input.expectedTitle) throw httpError(409, "原题名称已变化，请重新载入后修改。");
  const id = validateId(input.id);
  const [, prefix, , level, sequence] = id.match(CUSTOM_ID_RE);
  const title = String(input.title || "").trim();
  if (!title || title.length > 80) throw httpError(400, "棋局名称不能为空，且不能超过 80 个字符。");
  const { fen } = parseFen(input.fen);
  const classification = await validateClassificationInput(input, root);
  if (classification.classifications[0].family !== CUSTOM_TYPES[prefix]) {
    throw httpError(400, "主分类类型必须与棋局编号一致。");
  }
  const { file: localFile, data: local } = await readManifest(root);
  const entries = [...main.categories, ...local.categories].flatMap(category => category.items);
  if (id !== previous.id && entries.some(item => reservedPuzzleIds(item).includes(id))) {
    throw httpError(409, "新编号已被使用或保留用于追溯，请重新保存以生成可用序号。");
  }
  const resolveFile = relative => {
    if (typeof relative !== "string" || !relative) throw httpError(500, "原题文件路径缺失。");
    const file = path.resolve(bankRoot, relative);
    if (!file.startsWith(bankRoot + path.sep)) throw httpError(500, "原题文件路径无效。");
    return file;
  };
  const fenFile = resolveFile(previous.fen);
  const oldFen = await fs.readFile(fenFile, "utf8");
  const { parseFen: parseBoard } = await import("../../chinese-chess/core.mjs");
  const boardKey = value => {
    const position = parseBoard(value);
    return JSON.stringify([position.board, position.turn]);
  };
  if (boardKey(oldFen) !== boardKey(input.expectedFen)) throw httpError(409, "原题局面已变化，请重新载入后修改。");
  const duplicates = (await findExactDuplicates(fen, root, local)).filter(match => match !== previous.id);
  const confirmed = Array.isArray(input.confirmedDuplicateIds) ? input.confirmedDuplicateIds : [];
  if (duplicates.some(match => !confirmed.includes(match))) throw httpError(409, "发现未确认的相同局面，请重新检查后保存。");
  const previousIds = [...new Set([...(previous.previousIds || []), ...(id !== previous.id ? [previous.id] : [])])];
  const changes = { ...classification, id, title, label: title, type: CUSTOM_TYPES[prefix], difficulty: level, previousIds };
  const item = { ...previous, ...changes };
  delete item.namingPending;
  delete item.classificationPending;
  const updates = [{ file: fenFile, previous: oldFen, next: `${fen}\n` }];
  if (previous.metadata) {
    const file = resolveFile(previous.metadata);
    const text = await fs.readFile(file, "utf8");
    const metadata = JSON.parse(text);
    if ("geneId" in metadata) metadata.geneId = id;
    Object.assign(metadata, changes, { fen, firstMover: fen.split(/\s+/)[1] });
    if (metadata.displayInfo) metadata.displayInfo.chineseName = title;
    if (metadata.metadata) Object.assign(metadata.metadata, { difficulty: level, sequence: Number(sequence) });
    delete metadata.namingPending;
    delete metadata.classificationPending;
    updates.push({ file, previous: text, next: `${JSON.stringify(metadata, null, 2)}\n` });
  }
  for (const category of main.categories) {
    category.items = category.items.map(entry => entry === previous ? item : entry);
  }
  let localChanged = false;
  const localText = await fs.readFile(localFile, "utf8");
  for (const category of local.categories) {
    for (const entry of category.items) {
      if (entry.id !== previous.id) continue;
      Object.assign(entry, changes);
      delete entry.namingPending;
      delete entry.classificationPending;
      localChanged = true;
    }
  }
  if (localChanged) updates.push({ file: localFile, previous: localText, next: `${JSON.stringify(local, null, 2)}\n` });
  updates.push({ file: mainFile, previous: mainText, next: `${JSON.stringify(main, null, 2)}\n` });
  const written = [];
  try {
    for (const update of updates) {
      await writeAtomic(update.file, update.next);
      written.push(update);
    }
  } catch (error) {
    for (const update of written.reverse()) {
      try { await writeAtomic(update.file, update.previous); }
      catch (rollbackError) { throw httpError(500, `${error.message}；恢复原题失败：${rollbackError.message}`); }
    }
    throw error;
  }
  return { id, title, fen, item, source: true };
}

async function persistCustomPuzzle(input, options = {}) {
  const root = options.bankRoot || DEFAULT_BANK_ROOT;
  if (input.updateSourceId) return updateSourcePuzzle(input, root);
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
  const classification = input.classifications === undefined ? {} : await validateClassificationInput(input, root);
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

  let { file: manifestFile, data: manifest } = await readManifest(root);
  let item = manifest.categories.find(entry => entry.key === "custom")?.items.find(entry => entry.id === id);
  let materialRoot = root;
  if (!item) {
    materialRoot = path.resolve(root, "../..");
    manifestFile = path.join(materialRoot, "manifest.json");
    manifest = JSON.parse(await fs.readFile(manifestFile, "utf8"));
    item = manifest.categories.flatMap(entry => entry.items || []).find(entry => entry.id === id);
  }
  if (!item) throw httpError(404, "找不到对应棋局，请先保存局面。");

  const paths = relativePuzzleFiles(id, version);
  const listName = kind === "solution" ? "solutions" : "explanations";
  const files = item[listName] || (item[listName] = []);
  const filename = input.filename;
  if (filename !== undefined && (typeof filename !== "string"
    || !/^[\p{L}\p{N}][\p{L}\p{N} _()-]*\.txt$/u.test(filename)
    || filename.length > 180)) throw httpError(400, "文件名需为文字、数字、下划线或连接符，并以 .txt 结尾。");
  const existing = filename && files.find(file => path.posix.basename(file) === filename);
  const directory = path.posix.dirname(files[0] || (materialRoot === root ? paths[kind] : item.fen));
  const relativePath = filename ? existing || `${directory}/${filename}` : paths[kind];
  const fullPath = path.resolve(materialRoot, relativePath);
  if (!fullPath.startsWith(path.resolve(materialRoot) + path.sep)) throw httpError(400, "无效的题库保存路径。");
  if (!files.includes(relativePath)) {
    try {
      await fs.access(fullPath);
      throw httpError(409, "同名文件已存在且不属于当前材料列表，请更换文件名。");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  if (!files.includes(relativePath)) files.push(relativePath);
  files.sort((left, right) => left.localeCompare(right));

  const contents = kind === "solution" && !/^#\s*END\s*$/m.test(text) ? `${text}\n# END\n` : `${text}\n`;
  await writeAtomic(fullPath, contents);
  await writeAtomic(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  return { id, kind, version, relativePath,
    bankRelativePath: materialRoot === root ? `endgame/L1/${relativePath}` : relativePath };
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

module.exports = {
  persistCustomPuzzle, replacePuzzle, suggestPuzzleId, savePuzzleClassification,
  savePuzzleMaterial, deleteCustomPuzzle, getClassificationCatalog,
  updateClassificationCatalog, parseFen, validateId
};
