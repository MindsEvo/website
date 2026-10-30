const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const CHESS_ROOT = path.resolve(__dirname, "../../chess");
const ACADEMY_ROOT = path.join(CHESS_ROOT, "academy");
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
  try { return JSON.parse(await fs.readFile(file, "utf8")); }
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
  if (record.course === "mate") return { id: record.geneName, label: record.itemLabel, fen: record.fen, difficulty: record.level };
  return { id: record.geneName, label: record.itemLabel, label_en: record.itemLabel, fen: record.fen, solutions: [{ id: record.geneName }], difficulty: record.level };
}
function makeAnno(record) {
  return { game_id: record.geneName, description: record.explanation || "", intro: { popup: "", flash_squares: [] }, moves: [], outro: { popup: "" } };
}
function makeSolution(record) { return record.solutionText || "// AI-AI 求解后将答案棋谱写在这里。\n# END\n"; }
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
  const manifestPath = path.join(academyRoot, ...getManifestRoot(record), "manifest.json");
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
  return {
    id: record.geneName,
    relativePath: path.posix.join("web", "chess", "academy", ...getItemDirectory(record)),
    manifest: path.posix.join("web", "chess", "academy", ...getManifestRoot(record), "manifest.json")
  };
}

async function getRootStatus() {
  const dataExists = await fs.access(ACADEMY_ROOT).then(() => true).catch(() => false);
  return { ok: true, rootName: "mindsevo/web/chess", relativeDataPath: "academy/*/data", dataExists };
}

module.exports = { CHESS_ROOT, ACADEMY_ROOT, getRootStatus, parseName, persistQuestion };
