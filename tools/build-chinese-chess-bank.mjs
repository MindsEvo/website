import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.resolve(process.argv[2] || 'C:\\Users\\xiaod\\chinese_chess');
const dataRoot = path.join(sourceRoot, 'question_bank', 'data');
const outputRoot = path.join(webDir, 'chinese-chess', 'bank');
const categoryLabels = {
  cannon: '炮类', horse: '马类', pawn: '兵类', rook: '车类', others: '其他',
  zhongpao: '中炮', duizi: '兑子', duncuo: '顿挫', fengsuo: '封锁',
  jiesha: '解杀', kunzi: '困子', lanjie: '拦截', qianzhi: '牵制',
  qizi: '弃子', shanji: '闪击', shanjiang: '闪将', shuangchongweixie: '双重威胁',
  tengnuo: '腾挪', xiyin: '吸引', yinli: '引离', yuhui: '迂回', zhuoshuang: '捉双'
};
const familyLabels = {
  attacking: '杀法基因', endgame: '残局基因', opening: '布局基因',
  tactics: '战术基因', comprehensive: '综合棋局'
};
const categories = [];
const ids = new Set();
const allFiles = await walk(dataRoot);

for (const fenFile of allFiles.filter(file => file.endsWith('.fen'))) {
  const stem = path.basename(fenFile, '.fen');
  const fenParent = path.dirname(fenFile);
  const categoryDir = path.basename(fenParent) === 'fen' ? path.dirname(fenParent) : fenParent;
  const relativeCategory = path.relative(dataRoot, categoryDir).split(path.sep);
  const family = relativeCategory[0];
  const level = relativeCategory.find(part => /^L\d+$/.test(part))
    || (family === 'opening' ? 'classic' : 'ungraded');
  const categoryKey = relativeCategory.at(-1);
  const jsonFiles = await files(path.join(categoryDir, 'json'));
  let metadataFile = jsonFiles.find(file => path.basename(file) === `${stem}.json`);
  if (!metadataFile && categoryDir === fenParent) {
    const adjacent = (await files(categoryDir)).filter(file => file.endsWith('.json'));
    metadataFile = adjacent.find(file => path.basename(file) === `${stem}.json`)
      || (adjacent.length === 1 ? adjacent[0] : undefined);
  }
  const metadata = metadataFile ? await readMetadata(metadataFile) : null;
  const solutionFiles = (await files(path.join(categoryDir, 'solutions')))
    .filter(file => path.basename(file) === `${stem}.txt`
      || (path.basename(file).startsWith(`${stem}-`) && file.endsWith('.txt')));
  const explanationFiles = (await files(path.join(categoryDir, 'explanation')))
    .filter(file => path.basename(file).includes(stem) && file.endsWith('.txt'));
  const pgnFiles = (await files(path.join(categoryDir, 'pgn')))
    .filter(file => path.basename(file) === `${stem}.pgn`);
  const id = metadata?.geneId || stem;
  if (ids.has(id)) throw new Error(`Duplicate puzzle ID: ${id}`);
  ids.add(id);

  const relative = file => path.relative(dataRoot, file).split(path.sep).join('/');
  const key = relativeCategory.join('/');
  let category = categories.find(group => group.key === key);
  if (!category) {
    category = {
      key, family, familyLabel: familyLabels[family] || family, level,
      label: categoryLabels[categoryKey] || (/^L\d+$/.test(categoryKey) ? '其他' : categoryKey),
      items: []
    };
    categories.push(category);
  }
  category.items.push({
    id,
    title: metadata?.displayInfo?.chineseName || metadata?.displayInfo?.name
      || metadata?.gene_info?.name || metadata?.name || stem,
    fen: relative(fenFile),
    metadata: metadataFile ? relative(metadataFile) : null,
    solutions: solutionFiles.sort(numericNameCompare).map(relative),
    explanations: explanationFiles.sort(numericNameCompare).map(relative),
    pgn: pgnFiles.map(relative)
  });
}

// Keep the original source layout and materials; existing L1 manifests remain compatible.
await mkdir(outputRoot, { recursive: true });
await cp(dataRoot, outputRoot, { recursive: true });
await writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify({
  version: 2, source: 'chinese_chess/question_bank/data', categories
}, null, 2)}\n`, 'utf8');
console.log(`Imported ${ids.size} Xiangqi puzzles in ${categories.length} categories to ${outputRoot}`);

async function files(directory) {
  try {
    return (await readdir(directory, { withFileTypes: true }))
      .filter(entry => entry.isFile()).map(entry => path.join(directory, entry.name));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(file));
    else if (entry.isFile()) result.push(file);
  }
  return result.sort(numericNameCompare);
}

function numericNameCompare(first, second) {
  return first.localeCompare(second, 'zh-CN', { numeric: true });
}

async function readMetadata(file) {
  const text = (await readFile(file, 'utf8')).replace(/^\uFEFF/, '');
  try {
    return JSON.parse(text);
  } catch (error) {
    // Some desktop metadata contains a trailing comma after a property.
    const normalized = text.replace(/,\s*([}\]])/g, '$1');
    if (normalized === text) throw new Error(`Invalid metadata ${file}: ${error.message}`);
    const metadata = JSON.parse(normalized);
    console.warn(`Normalized trailing comma for import: ${file}`);
    return metadata;
  }
}
