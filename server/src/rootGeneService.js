const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const CHESS_ROOT = path.resolve(__dirname, "../../chess");
const ACADEMY_ROOT = process.env.ROOT_GENE_ACADEMY_ROOT ? path.resolve(process.env.ROOT_GENE_ACADEMY_ROOT) : path.join(CHESS_ROOT, "academy");
const LEVEL_NAMES = { L1: "L1 基础", L2: "L2 组合", L3: "L3 复杂" };
const TYPE_NAMES = { endgame: "残局基因", tactics: "战术基因", mate: "攻杀基因", opening: "开局基因", comprehensive: "综合基因" };
const TACTIC_NAMES = { fork: "捉双", pin: "牵制", skewer: "串击", discoveredAttack: "闪击", doubleCheck: "双将", xRayAttack: "透视攻击", deflection: "引离", attraction: "引入", interference: "拦截", intermezzo: "中间招", clearance: "腾挪", sacrifice: "弃子", hangingPiece: "挂子", trappedPiece: "困子", enPassant: "吃过路兵", discoveredCheck: "闪将", doubleThreat: "双重威胁", quietMove: "安静着", desperado: "亡命子", advancedPawn: "进兵", promotion: "升变", underPromotion: "低升变", zugzwang: "逼着", removalOfTheDefender: "消除保护", capturingDefender: "消除保护", blockade: "阻塞" };
const TACTIC_GROUPS = { fork: "groupA", pin: "groupA", skewer: "groupA", discoveredAttack: "groupA", doubleCheck: "groupB", removalOfTheDefender: "groupB", capturingDefender: "groupB", deflection: "groupB", attraction: "groupB", xRayAttack: "groupC", interference: "groupC", intermezzo: "groupC", clearance: "groupC", trappedPiece: "groupD", blockade: "groupD", zugzwang: "groupD", sacrifice: "groupD" };
const TACTIC_GROUP_LABELS = { groupA: "战术A组", groupB: "战术B组", groupC: "战术C组", groupD: "战术D组" };
const MATE_NAMES = { backRankMate: "底线杀", smotheredMate: "闷杀", hookMate: "钩杀", arabianMate: "阿拉伯杀", dovetailMate: "燕尾杀", bodenMate: "博登杀", anastasia: "安娜斯塔西亚杀" };
const OPENING_META_GROUPS = {
  A_Control: { label: "控制类", subcategories: ["A1_pawn_center", "A2_piece_pressure", "A3_space_gains", "A4_opening_lines"] },
  B_Development: { label: "发展类", subcategories: ["B5_king_safety", "B6_rapid_development", "B7_piece_coordination", "B8_rook_coordination"] },
  C_Structure: { label: "结构类", subcategories: ["C9_pawn_chains", "C10_weak_squares", "C11_open_files", "C12_space_cramp"] },
  D_Strategic: { label: "战略类", subcategories: ["D13_gambit_sacrifice", "D14_useful_exchanges", "D15_counterattack", "D16_timing_moments"] }
};
const MATE_COURSE_TYPES = new Set(Object.keys(MATE_NAMES));
const PIECE_LABELS = { queen: "后", rook: "车", bishop: "象", knight: "马", pawn: "兵" };

function badRequest(message) { const error = new Error(message); error.status = 400; return error; }
function conflict(message) { const error = new Error(message); error.status = 409; return error; }

function classifyEndgame(left) {
  if (/KBN|KNP|^N|NP/.test(left)) return "knight";
  if (/K2B|KBP|^B|BP|B2P/.test(left)) return "bishop";
  if (/K2R|KR|^R|RP|R2P/.test(left)) return "rook";
  if (/KQR|KQ|^Q|QP/.test(left)) return "queen";
  if (/2P|3P|KP|^P/.test(left)) return "pawn";
  throw badRequest("此残局棋子组合未映射到 JS 残局课程的兵种分类。");
}

function parseName(category, level, geneName) {
  const patterns = {
    endgame: /^eg_([A-Z0-9]+)-([A-Z0-9]+)_L([123])-(\d{3})$/,
    comprehensive: /^co_([A-Z0-9]+)-([A-Z0-9]+)_L([123])-(\d{3})$/,
    tactics: /^tac_([a-zA-Z]+)_L([123])-(\d{3})$/,
    mate: /^mate_([a-zA-Z]+)_L([123])-(\d{3})$/,
    opening: /^eco_([A-E]\d{2})_L([123])-(\d{3})$/
  };
  const match = String(geneName || "").match(patterns[category]);
  if (!match) throw badRequest("基因名称格式不正确，必须符合当前类型的命名规范。");
  const levelNumber = category === "endgame" || category === "comprehensive" ? match[3] : match[2];
  if ("L" + levelNumber !== level) throw badRequest("基因名称中的级别必须与所选难度一致。");

  const common = { category, level, geneName, sequence: Number(match[match.length - 1]) };
  if (category === "endgame") {
    const piece = classifyEndgame(match[1]);
    const materialKey = match[1].toLowerCase() + "-" + match[2].toLowerCase() + "-" + level.toLowerCase();
    return { ...common, course: "endgame", piece, folderParts: [piece], categoryKey: materialKey, categoryLabel: match[1] + " vs " + match[2] + " · " + level, itemLabel: geneName + " · " + level };
  }
  if (category === "tactics") {
    const tag = match[1];
    const group = TACTIC_GROUPS[tag];
    if (!group) throw badRequest("该战术标签不属于 JS 战术课程 A-D 组。");
    return { ...common, course: "tactics", folderParts: [group], group, tag, categoryKey: tag, categoryLabel: TACTIC_NAMES[tag], itemLabel: geneName + " · " + level };
  }
  if (category === "mate") {
    const tag = match[1];
    if (!MATE_COURSE_TYPES.has(tag)) throw badRequest("该杀法类型尚未出现在 JS 攻杀课程中。");
    return { ...common, course: "mate", folderParts: [tag], tag, categoryKey: tag, categoryLabel: MATE_NAMES[tag], itemLabel: geneName + " · " + level };
  }
  if (category === "opening") {
    const eco = match[1];
    return { ...common, course: "opening", folderParts: ["ECO_Opening", eco + "_" + level], eco, categoryKey: eco + "_" + level, categoryLabel: eco + " · " + level, itemLabel: geneName };
  }
  throw badRequest("综合题型目前没有对应的 JS academy 课程目录，不能写入旧 Python 题库。");
}

function validateFen(fen) {
  const fields = String(fen || "").trim().split(/\s+/);
  if (fields.length !== 6 || !/^[wb]$/.test(fields[1])) throw badRequest("FEN 必须包含完整六个字段。");
  const ranks = fields[0].split("/");
  if (ranks.length !== 8 || ranks.some(rank => {
    let width = 0;
    for (const token of rank) {
      if (/^[1-8]$/.test(token)) width += Number(token);
      else if (/^[pnbrqkPNBRQK]$/.test(token)) width += 1;
      else return true;
    }
    return width !== 8;
  })) throw badRequest("FEN 棋盘格式无效。");
  if ((fields[0].match(/K/g) || []).length !== 1 || (fields[0].match(/k/g) || []).length !== 1) throw badRequest("局面必须恰好包含白王和黑王各一枚。");
  if (!/^(?:-|K?Q?k?q?)$/.test(fields[2]) || !/^(?:-|[a-h][36])$/.test(fields[3]) || !/^\d+$/.test(fields[4]) || !/^\d+$/.test(fields[5])) throw badRequest("FEN 行棋权、易位权、过路兵格或计数格式无效。");
  return fields.join(" ");
}

function getManifestRoot(record) {
  if (record.course === "opening") return ["opening", "data", "ECO_Opening"];
  return [record.course, "data", ...record.folderParts];
}
function getManifestFilename(record) {
  return ["tactics", "mate"].includes(record.course) && record.level !== "L1" ? "practice-manifest.json" : "manifest.json";
}
function getItemDirectory(record) {
  return [record.course, "data", ...record.folderParts];
}
function defaultManifest(record) {
  if (record.course === "endgame") return { piece: PIECE_LABELS[record.piece], categories: [] };
  if (record.course === "tactics") return { group: TACTIC_GROUP_LABELS[record.group], categories: [] };
  if (record.course === "mate") return { label: record.categoryLabel, items: [] };
  return { label: "ECO 开局", color: "#286a8b", categories: [] };
}
async function readManifest(file, record) {
  try { return JSON.parse((await fs.readFile(file, "utf8")).trim()); }
  catch (error) { if (error.code === "ENOENT") return defaultManifest(record); throw error; }
}
function findOrCreateItems(record, manifest) {
  if (record.course === "mate") return manifest.items;
  let key = record.categoryKey;
  if (record.course === "endgame") key = record.categoryKey;
  let category = manifest.categories.find(item => item.key === key);
  if (!category) {
    category = { key, label: record.categoryLabel, items: [] };
    if (record.course !== "mate") category.label_en = record.categoryLabel;
    if (record.course === "opening") category.label = record.eco + " · " + record.level;
    manifest.categories.push(category);
  }
  return category.items;
}
function makeManifestItem(record) {
  if (record.course === "mate") return { id: record.geneName, label: record.itemLabel, fen: record.fen, difficulty: record.level, rootGene: record.category };
  return { id: record.geneName, label: record.itemLabel, label_en: record.itemLabel, fen: record.fen, solutions: [{ id: record.geneName }], difficulty: record.level, rootGene: record.category };
}
function makeAnno(record) {
  return { game_id: record.geneName, description: record.explanation || "", intro: { popup: "", flash_squares: [] }, moves: [], outro: { popup: "" } };
}
function makeSolution(record) {
  if (!record.solutionText) return "// AI-AI 求解后将答案棋谱写在这里。\n# END\n";
  return /^#\s*END\s*$/m.test(record.solutionText) ? record.solutionText + "\n" : record.solutionText + "\n# END\n";
}
function makeExplanation(record) {
  return record.explanation || `# 根基因: ${record.geneName}\n类型: ${TYPE_NAMES[record.category]}\n难度: ${record.level}\n\n## FEN字符串\n${record.fen}\n\n## 解法说明\n（待 AI-AI 求解后补充）\n\n# END\n`;
}
async function exists(file) { try { await fs.access(file); return true; } catch (error) { if (error.code === "ENOENT") return false; throw error; } }
async function writeAtomic(file, contents) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = file + "." + crypto.randomUUID() + ".tmp";
  try { await fs.writeFile(temporary, contents, "utf8"); await fs.rename(temporary, file); }
  catch (error) { await fs.rm(temporary, { force: true }).catch(() => {}); throw error; }
}

async function persistQuestion(input, options = {}) {
  const parsed = parseName(input.category, input.level, input.geneName);
  const record = { ...parsed, fen: validateFen(input.fen), solutionText: String(input.solutionText || "").trim(), explanation: String(input.explanation || "").trim() };
  const academyRoot = options.dataRoot || ACADEMY_ROOT;
  const manifestPath = path.join(academyRoot, ...getManifestRoot(record), getManifestFilename(record));
  const itemDirectory = path.join(academyRoot, ...getItemDirectory(record));
  const manifest = await readManifest(manifestPath, record);
  const items = findOrCreateItems(record, manifest);
  const existing = items.find(item => item.id === record.geneName);
  const annoPath = path.join(itemDirectory, record.geneName + ".anno.json");
  if (!options.allowExisting && (existing || await exists(annoPath))) throw conflict("该编号已存在于对应 JS academy 分类中，请更换序号。");
  const item = makeManifestItem(record);
  if (existing) items[items.indexOf(existing)] = item;
  else items.push(item);

  await Promise.all([
    writeAtomic(annoPath, JSON.stringify(makeAnno(record), null, 2) + "\n"),
    writeAtomic(path.join(itemDirectory, record.geneName + ".solution.txt"), makeSolution(record)),
    writeAtomic(path.join(itemDirectory, record.geneName + ".exp.txt"), makeExplanation(record)),
    writeAtomic(manifestPath, JSON.stringify(manifest, null, 2) + "\n")
  ]);
  const questionId = "academy/" + getItemDirectory(record).join("/") + "/" + record.geneName;
  const deleted = await getDeletedIds(options);
  if (deleted.includes(questionId)) await writeAtomic(path.join(academyRoot, ".deleted-questions.json"), JSON.stringify(deleted.filter(id => id !== questionId)) + "\n");
  return {
    id: record.geneName,
    relativePath: path.posix.join("web", "chess", "academy", ...getItemDirectory(record)),
    manifest: path.posix.join("web", "chess", "academy", ...getManifestRoot(record), "manifest.json")
  };
}

async function formalizeQuestion(input, options = {}) {
  const parsed = parseName(input.category, input.level, input.geneName);
  const academyRoot = options.dataRoot || ACADEMY_ROOT;
  const directory = path.join(academyRoot, ...getItemDirectory(parsed));
  const solutionPath = path.join(directory, parsed.geneName + ".solution.txt");
  const explanationPath = path.join(directory, parsed.geneName + ".exp.txt");
  let solutionText = String(input.solutionText || "").trim();
  let explanation = String(input.explanation || "").trim();
  if (!solutionText) solutionText = await fs.readFile(solutionPath, "utf8").catch(() => "");
  if (!explanation) explanation = await fs.readFile(explanationPath, "utf8").catch(() => "");
  const hasSolution = !!solutionText.trim() && !solutionText.trim().startsWith("// AI-AI");
  const hasExplanation = !!explanation.trim() && !explanation.includes("（待 AI-AI 求解后补充）");
  const result = await persistQuestion({ ...input, solutionText, explanation }, { ...options, allowExisting: true });
  if (hasSolution && hasExplanation) {
    const manifestPath = path.join(academyRoot, ...getManifestRoot(parsed), getManifestFilename(parsed));
    const manifest = await readManifest(manifestPath, parsed);
    const item = findOrCreateItems(parsed, manifest).find(entry => entry.id === parsed.geneName);
    if (item) item.verified = true;
    await writeAtomic(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  }
  return { ...result, formalized: hasSolution && hasExplanation };
}

async function listDirectories(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
  return entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
}

async function getDeletedIds(options = {}) {
  const file = path.join(options.dataRoot || ACADEMY_ROOT, ".deleted-questions.json");
  try { return JSON.parse(await fs.readFile(file, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
}

async function deleteQuestion(input, options = {}) {
  const id = String(input.id || "");
  if (!id || id.includes("..") || id.includes("\\") || id.startsWith("/")) throw badRequest("无效的棋局编号。");
  const academyRoot = options.dataRoot || ACADEMY_ROOT;
  const bankPath = options.bankPath || process.env.ROOT_GENE_BANK_PATH || path.join(CHESS_ROOT, "play/assets/question-bank.js");
  const bankText = await fs.readFile(bankPath, "utf8");
  const prefix = "window.ChessQuestionBank = ";
  if (!bankText.startsWith(prefix)) throw badRequest("题库文件格式不正确。");
  const bank = JSON.parse(bankText.slice(prefix.length).trim().replace(/;$/, ""));
  const bundled = bank.questions[id];
  const stem = id.split("/").pop().replace(/\.fen$/, "");
  const aliases = new Set([stem]);
  const endgame = stem.match(/^eg_(.+)_L[123]-(\d+)$/);
  if (endgame) aliases.add(endgame[1].toLowerCase() + "-" + endgame[2]);
  const manifests = [];
  async function scan(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) await scan(path.join(directory, entry.name));
      else if (["manifest.json", "practice-manifest.json"].includes(entry.name)) {
        const file = path.join(directory, entry.name);
        manifests.push({ file, directory, data: JSON.parse((await fs.readFile(file, "utf8")).trim()) });
      }
    }
  }
  await scan(academyRoot);
  async function itemDirectory(manifest, group) {
    const course = path.relative(academyRoot, manifest.directory).split(path.sep)[0];
    if (course !== 'opening' || !group.key) return manifest.directory;
    if (!/^[A-Za-z0-9_-]+$/.test(group.key)) throw badRequest('无效的开局分类目录。');
    const candidate = path.join(manifest.directory, group.key);
    const entry = await fs.lstat(candidate).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (entry && entry.isSymbolicLink()) throw badRequest('题库分类不能使用符号链接。');
    return entry && entry.isDirectory() ? candidate : manifest.directory;
  }
  const matches = [];
  for (const manifest of manifests) {
    const groups = Array.isArray(manifest.data.items) ? [{ items: manifest.data.items }] : manifest.data.categories || [];
    for (const group of groups) {
      for (const item of group.items || []) {
        const directory = await itemDirectory(manifest, group);
        const itemId = "academy/" + path.relative(academyRoot, directory).split(path.sep).join("/") + "/" + item.id;
        if (itemId === id || (bundled && aliases.has(item.id) && path.relative(academyRoot, directory).split(path.sep)[0] === id.split("/")[0])) {
          matches.push({ manifest, group, item, directory, itemId });
        }
      }
    }
  }
  if (!bundled && !matches.length) throw badRequest("找不到该棋局的题库条目，请刷新目录。");
  const deletedIds = new Set([id]);
  const course = id.startsWith('academy/') ? id.split('/')[1] : id.split('/')[0];
  for (const questionId of Object.keys(bank.questions)) {
    if (questionId.split('/')[0] === course && aliases.has(questionId.split('/').pop().replace(/\.fen$/, ''))) deletedIds.add(questionId);
  }
  const candidates = new Set();
  function addFiles(directory, name) {
    if (!/^[A-Za-z0-9_-]+$/.test(name)) throw badRequest("题库中存在无效的文件编号。");
    for (const suffix of [".anno.json", ".solution.txt", ".exp.txt", ".exp_en.txt", ".fen", ".pgn"]) candidates.add(path.join(directory, name + suffix));
  }
  for (const match of matches) {
    deletedIds.add(match.itemId);
    addFiles(match.directory, match.item.id);
    for (const solution of match.item.solutions || []) addFiles(match.directory, solution.id);
    match.group.items.splice(match.group.items.indexOf(match.item), 1);
  }
  for (const manifest of manifests) {
    const groups = Array.isArray(manifest.data.items) ? [{ items: manifest.data.items }] : manifest.data.categories || [];
    for (const group of groups) {
      const directory = await itemDirectory(manifest, group);
      for (const item of group.items || []) {
        for (const name of [item.id, ...(item.solutions || []).map(solution => solution.id)]) {
          for (const file of [...candidates]) if (path.dirname(file) === directory && path.basename(file).startsWith(name + ".")) candidates.delete(file);
        }
      }
    }
  }
  for (const [questionId] of Object.entries(bank.questions)) {
    if (deletedIds.has(questionId)) delete bank.questions[questionId];
  }
  function prune(nodes) {
    return (nodes || []).filter(node => !deletedIds.has(node.question)).map(node => {
      if (node.children) node.children = prune(node.children);
      return node;
    }).filter(node => node.question || (node.children && node.children.length));
  }
  bank.tree.forEach(root => { root.children = prune(root.children); });
  bank.records = (bank.records || []).filter(record => !deletedIds.has(record.id) && !deletedIds.has(record.question));
  const changes = new Map();
  for (const manifest of new Set(matches.map(match => match.manifest))) {
    if (manifest.data.categories) manifest.data.categories = manifest.data.categories.filter(group => group.items.length);
    changes.set(manifest.file, JSON.stringify(manifest.data, null, 2) + "\n");
  }
  changes.set(bankPath, prefix + JSON.stringify(bank, null, 2) + ";\n");
  changes.set(path.join(academyRoot, ".deleted-questions.json"), JSON.stringify([...new Set([...(await getDeletedIds(options)), ...deletedIds])]) + "\n");
  if (options.preview) return {
    id, deletedIds: [...deletedIds],
    locations: [...new Set(matches.map(match => 'web/chess/academy/' + path.relative(academyRoot, match.directory).split(path.sep).join('/')))],
    indexes: [...changes.keys()].filter(file => file !== path.join(academyRoot, '.deleted-questions.json')).map(file => file === bankPath ? 'web/chess/play/assets/question-bank.js' : 'web/chess/academy/' + path.relative(academyRoot, file).split(path.sep).join('/'))
  };
  const backups = new Map();
  for (const file of new Set([...changes.keys(), ...candidates])) {
    try { backups.set(file, await fs.readFile(file)); }
    catch (error) { if (error.code !== "ENOENT") throw error; backups.set(file, null); }
  }
  try {
    for (const [file, contents] of changes) await writeAtomic(file, contents);
    for (const file of candidates) await fs.rm(file, { force: true });
  } catch (error) {
    for (const [file, contents] of backups) {
      if (contents === null) await fs.rm(file, { force: true });
      else await writeAtomic(file, contents);
    }
    throw error;
  }
  return { id, deletedIds: [...deletedIds], deletedFiles: [...candidates].filter(file => backups.get(file) !== null).length };
}

async function listQuestions(options = {}) {
  const academyRoot = options.dataRoot || ACADEMY_ROOT;
  const manifestDirectories = [];
  for (const piece of Object.keys(PIECE_LABELS)) manifestDirectories.push(["endgame", "data", piece]);
  for (const group of Object.keys(TACTIC_GROUP_LABELS)) manifestDirectories.push(["tactics", "data", group]);
  for (const mateType of await listDirectories(path.join(academyRoot, "mate", "data"))) manifestDirectories.push(["mate", "data", mateType]);
  manifestDirectories.push(["opening", "data", "ECO_Opening"]);

  const questions = [];
  for (const parts of manifestDirectories) {
    for (const filename of ["manifest.json", "practice-manifest.json"]) {
      let manifest;
      try { manifest = JSON.parse((await fs.readFile(path.join(academyRoot, ...parts, filename), "utf8")).trim()); }
      catch (error) { if (error.code === "ENOENT" || error instanceof SyntaxError) continue; throw error; }
      const items = Array.isArray(manifest.items) ? manifest.items : (manifest.categories || []).flatMap(category => category.items || []);
      for (const item of items) {
        if (!item.rootGene) continue;
        let parsed;
        try { parsed = parseName(item.rootGene, item.difficulty, item.id); } catch (_) { continue; }
        const directory = path.join(academyRoot, ...getItemDirectory(parsed));
        const solution = await fs.readFile(path.join(directory, parsed.geneName + ".solution.txt"), "utf8").catch(() => "");
        const explanation = await fs.readFile(path.join(directory, parsed.geneName + ".exp.txt"), "utf8").catch(() => "");
        questions.push({
          category: parsed.category, level: parsed.level, geneName: parsed.geneName, fen: item.fen,
          solutionText: solution.trim().startsWith("// AI-AI") ? "" : solution,
          explanation, formal: !!item.verified
        });
      }
    }
  }
  return questions;
}

async function getRootStatus() {
  const dataExists = await fs.access(ACADEMY_ROOT).then(() => true).catch(() => false);
  return { ok: true, rootName: "mindsevo/web/chess", relativeDataPath: "academy/*/data", dataExists };
}

module.exports = { CHESS_ROOT, ACADEMY_ROOT, getRootStatus, parseName, persistQuestion, formalizeQuestion, listQuestions, deleteQuestion, getDeletedIds };
