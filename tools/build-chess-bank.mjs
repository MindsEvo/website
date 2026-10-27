import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (!process.argv[2]) throw new Error('Usage: node tools/build-chess-bank.mjs <PyQt project root>');
const source = path.resolve(process.argv[2]);
const base = path.join(source, 'question_bank/data');
const output = fileURLToPath(new URL('../chess/play/assets/question-bank.js', import.meta.url));
const names = {
  backRankMate: '底线杀', smotheredMate: '闷杀', anastasia: '安娜斯塔西亚杀',
  arabianMate: '阿拉伯杀', hookMate: '钩杀', bodenMate: '博登杀', dovetailMate: '燕尾杀',
  hangingPiece: '挂子', fork: '捉双', pin: '牵制', skewer: '串击', discoveredAttack: '闪击',
  removalOfTheDefender: '消除保护', doubleCheck: '双将', xRayAttack: '透视攻击',
  deflection: '引离', intermezzo: '中间招', attraction: '引入', interference: '拦截',
  overloading: '过载', decoy: '诱导', clearance: '腾挪', desperado: '绝望子',
  perpetualCheck: '长将', trappedPiece: '困子', blockade: '阻塞', sacrifice: '弃子', zugzwang: '逼着',
  KQ_vs_K: 'KQ-K (后对王)', KR_vs_K: 'KR-K (车对王)', KB_vs_K: 'KB-K (象对王)',
  KN_vs_K: 'KN-K (马对王)', KP_vs_K: 'KP-K (兵对王)', K2B_vs_K: 'K2B-K (双象对王)',
  K2R_vs_K: 'K2R-K (双车对王)', KBN_vs_K: 'KBN-K (象马对王)',
  rook: 'Rook (车)', knight: 'Knight (马)', bishop: 'Bishop (象)', queen: 'Queen (后)',
  pawn: 'Pawn (兵)', king: 'King (王)', others: '其他'
};
const text = filename => fs.existsSync(filename) ? fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, '') : '';
const json = filename => text(filename) ? JSON.parse(text(filename)) : {};
const entries = folder => fs.existsSync(folder) ? fs.readdirSync(folder, { withFileTypes: true }) : [];
const dirs = folder => entries(folder).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
const files = (folder, suffix) => entries(folder).filter(entry => entry.isFile() && entry.name.endsWith(suffix)).map(entry => entry.name).sort();
const natural = (left, right) => left.localeCompare(right, 'en', { numeric: true });
const questions = {};
const node = (label, children = []) => ({ label, children });
function questionLabel(data, filename, opening) {
  if (opening) {
    const prefix = data.sequence == null ? '' : String(data.sequence).padStart(3, '0') + ' - ';
    if (data.name_cn) {
      const eco = filename.match(/_([A-E]\d{2}|eco_\w+)_/);
      const parts = data.name_cn.split(' - ');
      return prefix + (eco && parts.length >= 2 ? eco[1] + ' - ' + parts[Math.min(2, parts.length - 1)] : data.name_cn);
    }
    return prefix + (data.displayInfo?.chineseName || filename.replace(/\.fen$/, ''));
  }
  const classification = data.classification || {};
  if (classification.opening_name_cn) return classification.opening_name_cn + (filename.match(/_(\d+)\.fen$/)?.[1] ? ' ' + filename.match(/_(\d+)\.fen$/)[1] : '');
  const name = classification.name_cn || data.name || data.displayInfo?.chineseName;
  const suffix = filename.match(/-(\d+)\.fen$/)?.[1];
  return name ? name + (suffix && !data.name ? ' ' + suffix : '') : filename.replace(/\.fen$/, '');
}
function leaf(folder, filename, opening = false) {
  const stem = filename.slice(0, -4);
  const data = json(path.join(folder, 'json', stem + '.json'));
  const id = path.relative(base, path.join(folder, 'fen', filename)).replace(/\\/g, '/');
  const solutions = files(path.join(folder, 'solutions'), '.txt').filter(name => name === stem + '.txt' || (name.startsWith(stem + '-') && /^\d+\.txt$/.test(name.slice(stem.length + 1)))).sort(natural);
  const explanationFile = [stem + '-1_exp.txt', stem + '_exp.txt', stem + '.txt'].find(name => fs.existsSync(path.join(folder, 'explanation', name)));
  questions[id] = {
    id, label: questionLabel(data, filename, opening), fen: text(path.join(folder, 'fen', filename)).trim(),
    solutions: solutions.map(name => ({ label: name, text: text(path.join(folder, 'solutions', name)) })),
    explanation: explanationFile ? text(path.join(folder, 'explanation', explanationFile)) : ''
  };
  return { label: questions[id].label, question: id, sequence: opening ? (data.sequence ?? data.metadata?.sequence ?? 999) : (data.metadata?.sequence ?? 999) };
}
function leaves(folder, opening = false) {
  return files(path.join(folder, 'fen'), '.fen').map(filename => leaf(folder, filename, opening)).sort((left, right) => left.sequence - right.sequence || left.question.localeCompare(right.question, 'en'));
}
const tree = [node('🤖 专家推荐')];
for (const [category, title] of [['endgame', '残局基因 (endgame)'], ['tactics', '战术基因 (tactics)'], ['mate', '攻杀基因 (mate)'], ['opening', '开局基因 (opening)'], ['comprehensive', '综合基因 (comprehensive)']]) {
  const root = node(title);
  const folder = path.join(base, category);
  tree.push(root);
  if (['endgame', 'comprehensive'].includes(category)) {
    for (const [level, label] of [['L1', 'L1 基础'], ['L2', 'L2 组合'], ['L3', 'L3 复杂']]) {
      const levelNode = node(label);
      root.children.push(levelNode);
      for (const theme of dirs(path.join(folder, level))) {
        const themeFolder = path.join(folder, level, theme);
        if (!fs.existsSync(path.join(themeFolder, 'fen'))) continue;
        const first = files(path.join(themeFolder, 'json'), '.json')[0];
        const gene = first && json(path.join(themeFolder, 'json', first)).gene_theme;
        levelNode.children.push(node(gene ? gene.replace(/2([象马车后兵])/g, '双$1') : names[theme] || theme, leaves(themeFolder)));
      }
    }
  } else if (category !== 'opening') {
    for (const theme of dirs(folder)) {
      const themeNode = node(names[theme] || theme);
      root.children.push(themeNode);
      for (const [level, label] of [['L1', 'L1 入门'], ['L2', 'L2 基础'], ['L3', 'L3 进阶']]) {
        const items = leaves(path.join(folder, theme, level));
        if (items.length) themeNode.children.push(node(label, items));
      }
    }
  } else {
    const classic = node('演示棋局');
    if (fs.existsSync(path.join(folder, 'classic_games'))) root.children.push(classic);
    for (const game of dirs(path.join(folder, 'classic_games')).filter(name => name.startsWith('G'))) {
      const gameFolder = path.join(folder, 'classic_games', game);
      const fenFile = files(path.join(gameFolder, 'fen'), '.fen')[0];
      const jsonFile = files(path.join(gameFolder, 'json'), '.json')[0];
      if (!fenFile || !jsonFile) continue;
      const data = json(path.join(gameFolder, 'json', jsonFile));
      const item = leaf(gameFolder, fenFile, true);
      item.label = (data.sequence ?? 99) + '. ' + (data.name_cn || game).split(' - ').slice(-1)[0].trim();
      questions[item.question].label = item.label;
      classic.children.push(item);
    }
    const metaFolder = path.join(folder, 'meta_gene');
    if (!fs.existsSync(metaFolder)) continue;
    const metaNode = node('根基因库');
    root.children.push(metaNode);
    const config = json(path.join(source, 'puzzle_generator/config/opening_genes_ui.json')).meta_genes || {};
    for (const categoryId of dirs(metaFolder).sort(natural)) {
      const settings = config[categoryId] || {};
      const categoryNode = node((settings.icon || '📌') + ' ' + (settings.name_cn || categoryId));
      metaNode.children.push(categoryNode);
      for (const sub of dirs(path.join(metaFolder, categoryId)).sort(natural)) {
        categoryNode.children.push(node(settings.sub_categories?.[sub]?.name_cn || sub, leaves(path.join(metaFolder, categoryId, sub), true)));
      }
    }
  }
}
const records = [];
function scanRecords(folder, category, subcategory, difficulty) {
  for (const filename of files(path.join(folder, 'json'), '.json')) {
    const stem = filename.slice(0, -5);
    const data = json(path.join(folder, 'json', filename));
    const id = path.relative(base, path.join(folder, 'fen', stem + '.fen')).replace(/\\/g, '/');
    records.push({
      id, category, subcategory, difficulty: difficulty || stem.match(/(L[123])/)?.[1] || 'L1',
      label: data.displayInfo?.chineseName || stem, question: questions[id] ? id : null
    });
  }
}
for (const category of ['endgame', 'mate', 'tactics', 'opening', 'comprehensive']) {
  const folder = path.join(base, category);
  if (['endgame', 'mate', 'comprehensive'].includes(category)) {
    for (const level of ['L1', 'L2', 'L3']) {
      if (category === 'comprehensive') scanRecords(path.join(folder, level), category, 'general', level);
      else for (const sub of dirs(path.join(folder, level))) scanRecords(path.join(folder, level, sub), category, sub, level);
    }
  }
  if (['tactics', 'mate'].includes(category)) {
    for (const sub of dirs(folder)) {
      const subFolder = path.join(folder, sub);
      if (fs.existsSync(path.join(subFolder, 'json'))) scanRecords(subFolder, category, sub);
      else for (const level of ['L1', 'L2', 'L3']) scanRecords(path.join(subFolder, level), category, sub, level);
    }
  }
  if (category === 'opening') {
    for (const group of ['classic', 'modern', 'classic_games']) {
      for (const sub of dirs(path.join(folder, group))) scanRecords(path.join(folder, group, sub), category, group + '_' + sub);
    }
    for (const group of dirs(path.join(folder, 'meta_gene'))) {
      for (const sub of dirs(path.join(folder, 'meta_gene', group))) scanRecords(path.join(folder, 'meta_gene', group, sub), category, group + '.' + sub);
    }
  }
}
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, 'window.ChessQuestionBank = ' + JSON.stringify({ tree, questions, records }, null, 2) + ';\n', 'utf8');
console.log('Generated ' + Object.keys(questions).length + ' positions in ' + tree.length + ' root categories.');
console.log('Analysis JSON records: ' + records.length + '; ' + JSON.stringify(Object.fromEntries(['endgame', 'mate', 'tactics', 'opening', 'comprehensive'].map(category => [category, records.filter(record => record.category === category).length]))));