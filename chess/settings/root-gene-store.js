(function (root) {
  'use strict';

  const API_BASE = root.CHESS_LOCAL_API || 'http://127.0.0.1:8787';
  const STORAGE_KEY = 'cognichess:root-gene-bank:v1';
  const BANK_LEVEL_NAMES = { L1: 'L1 基础', L2: 'L2 组合', L3: 'L3 复杂' };
  const LEVEL_NAMES = { L1: 'L1 入门', L2: 'L2 基础', L3: 'L3 进阶' };
  const PIECE_LABELS = { queen: '后', rook: '车', bishop: '象', knight: '马', pawn: '兵' };
  const TACTIC_NAMES = { fork: '捉双', pin: '牵制', skewer: '串击', discoveredAttack: '闪击', doubleCheck: '双将', xRayAttack: '透视攻击', deflection: '引离', attraction: '引入', interference: '拦截', intermezzo: '中间招', clearance: '腾挪', sacrifice: '弃子', hangingPiece: '挂子', trappedPiece: '困子', enPassant: '吃过路兵', discoveredCheck: '闪将', doubleThreat: '双重威胁', quietMove: '安静着', desperado: '亡命子', advancedPawn: '进兵', promotion: '升变', underPromotion: '低升变', zugzwang: '逼着', removalOfTheDefender: '消除保护', capturingDefender: '消除保护', blockade: '阻塞' };
  const TACTIC_GROUPS = { fork: 'groupA', pin: 'groupA', skewer: 'groupA', discoveredAttack: 'groupA', doubleCheck: 'groupB', removalOfTheDefender: 'groupB', capturingDefender: 'groupB', deflection: 'groupB', attraction: 'groupB', xRayAttack: 'groupC', interference: 'groupC', intermezzo: 'groupC', clearance: 'groupC', trappedPiece: 'groupD', blockade: 'groupD', zugzwang: 'groupD', sacrifice: 'groupD' };
  const TACTIC_GROUP_LABELS = { groupA: '战术A组', groupB: '战术B组', groupC: '战术C组', groupD: '战术D组' };
  const MATE_NAMES = { backRankMate: '底线杀', smotheredMate: '闷杀', hookMate: '钩杀', arabianMate: '阿拉伯杀', dovetailMate: '燕尾杀', bodenMate: '博登杀', anastasia: '安娜斯塔西亚杀' };
  const MATE_TYPES = ['backRankMate', 'smotheredMate', 'hookMate', 'arabianMate', 'dovetailMate', 'bodenMate', 'anastasia'];

  function readQuestions() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string' && item.question && typeof item.question.fen === 'string') : [];
    } catch (_) { return []; }
  }
  function writeQuestions(questions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
    root.dispatchEvent(new Event('chess-root-gene-bank-updated'));
  }
  function resolveAcademyRoute(category, match, level, geneName) {
    if (category === 'endgame') {
      const left = match[1];
      let piece;
      if (/KBN|KNP|^N|NP/.test(left)) piece = 'knight';
      else if (/K2B|KBP|^B|BP|B2P/.test(left)) piece = 'bishop';
      else if (/K2R|KR|^R|RP|R2P/.test(left)) piece = 'rook';
      else if (/KQR|KQ|^Q|QP/.test(left)) piece = 'queen';
      else if (/2P|3P|KP|^P/.test(left)) piece = 'pawn';
      else throw new Error('此残局棋子组合未映射到 JS 残局课程的兵种分类。');
      const label = match[1] + ' vs ' + match[2] + ' · ' + level;
      return { course: 'endgame', folderParts: [piece], piece, categoryKey: match[1].toLowerCase() + '-' + match[2].toLowerCase() + '-' + level.toLowerCase(), categoryLabel: label, itemLabel: geneName + ' · ' + level, treePath: [BANK_LEVEL_NAMES[level], PIECE_LABELS[piece], label, geneName] };
    }
    if (category === 'tactics') {
      const tag = match[1];
      const group = TACTIC_GROUPS[tag];
      if (!group) throw new Error('该战术标签不属于 JS 战术课程 A-D 组。');
      return { course: 'tactics', folderParts: [group], group, tag, categoryKey: tag, categoryLabel: TACTIC_NAMES[tag], itemLabel: geneName + ' · ' + level, treePath: [TACTIC_GROUP_LABELS[group], TACTIC_NAMES[tag], geneName] };
    }
    if (category === 'mate') {
      const tag = match[1];
      if (!MATE_TYPES.includes(tag)) throw new Error('该杀法类型尚未出现在 JS 攻杀课程中。');
      return { course: 'mate', folderParts: [tag], tag, categoryKey: tag, categoryLabel: MATE_NAMES[tag], itemLabel: geneName + ' · ' + level, treePath: [MATE_NAMES[tag], geneName] };
    }
    if (category === 'opening') {
      const eco = match[1];
      return { course: 'opening', folderParts: ['ECO_Opening', eco + '_' + level], eco, categoryKey: eco + '_' + level, categoryLabel: eco + ' · ' + level, itemLabel: geneName, treePath: ['ECO 开局', eco, LEVEL_NAMES[level], geneName] };
    }
    throw new Error('综合题型目前没有对应的 JS academy 课程目录。');
  }
  function parseName(category, level, geneName) {
    const patterns = {
      endgame: /^eg_([A-Z0-9]+)-([A-Z0-9]+)_L([123])-(\d{3})$/,
      comprehensive: /^co_([A-Z0-9]+)-([A-Z0-9]+)_L([123])-(\d{3})$/,
      tactics: /^tac_([a-zA-Z]+)_L([123])-(\d{3})$/,
      mate: /^mate_([a-zA-Z]+)_L([123])-(\d{3})$/,
      opening: /^eco_([A-E]\d{2})_L([123])-(\d{3})$/
    };
    const match = String(geneName || '').match(patterns[category]);
    if (!match) throw new Error(nameFormat(category));
    const nameLevel = category === 'endgame' || category === 'comprehensive' ? match[3] : match[2];
    if ('L' + nameLevel !== level) throw new Error('基因名称中的级别必须与所选难度一致。');
    if (category === 'comprehensive') throw new Error('综合题型目前没有对应的 JS academy 课程目录。');
    const route = resolveAcademyRoute(category, match, level, geneName);
    const directoryParts = ['academy', route.course, 'data'].concat(route.folderParts);
    const id = directoryParts.concat([geneName]).join('/');
    return { id, category, level, subcategory: route.categoryKey, sequence: Number(match[match.length - 1]), directoryParts, relativePath: 'web/chess/' + directoryParts.join('/'), ...route };
  }
  function nameFormat(category) {
    const examples = { endgame: 'eg_R-E_L1-001', comprehensive: 'co_R-E_L1-001', tactics: 'tac_fork_L1-001', mate: 'mate_backRankMate_L1-001', opening: 'eco_C50_L1-001' };
    return '名称格式不正确，示例：' + (examples[category] || examples.endgame);
  }
  function makeQuestion(input) {
    const parsed = parseName(input.category, input.level, input.geneName);
    const question = { id: parsed.id, label: input.geneName, fen: input.fen, solutions: [{ label: '标准答案', text: input.solutionText || '' }], explanation: input.explanation || '' };
    return { ...parsed, label: input.geneName, geneName: input.geneName, difficulty: parsed.level, question, status: input.status || 'draft', updatedAt: new Date().toISOString() };
  }
  async function request(url, body) {
    let response;
    try { response = await fetch(API_BASE + url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}); }
    catch (_) { throw new Error('JS academy 保存服务未启动。请运行 web/server（http://127.0.0.1:8787），保存根目录为 mindsevo/web/chess。'); }
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || '题库服务请求失败。');
    return result;
  }
  async function getRootStatus() { return request('/api/v1/chess/root-gene/health'); }
  async function saveQuestion(record) {
    if (readQuestions().some(item => item.id === record.id)) throw new Error('此编号已存在于本机题库记录中，请换用新序号。');
    const result = await request('/api/v1/chess/root-gene/save', { category: record.category, level: record.difficulty, geneName: record.geneName, fen: record.question.fen });
    record.relativePath = result.relativePath;
    const questions = readQuestions(); questions.unshift(record); writeQuestions(questions);
    return record;
  }
  async function formalize(id, solutionText, explanation) {
    const record = readQuestions().find(item => item.id === id);
    if (!record) throw new Error('找不到待完善的根基因题目。');
    const result = await request('/api/v1/chess/root-gene/formalize', { category: record.category, level: record.difficulty, geneName: record.geneName, fen: record.question.fen, solutionText, explanation });
    record.question.solutions = [{ label: 'AI-AI 参考解法', text: solutionText }];
    record.question.explanation = explanation;
    record.status = 'formal';
    record.relativePath = result.relativePath;
    record.updatedAt = new Date().toISOString();
    writeQuestions(readQuestions().map(item => item.id === id ? record : item));
    return record;
  }
  root.ChessRootGeneStore = { readQuestions, parseName, makeQuestion, saveQuestion, formalize, getRootStatus, nameFormat };
})(window);
