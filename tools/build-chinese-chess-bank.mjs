import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(scriptDir, '..');
const sourceRoot = path.resolve(process.argv[2] || 'C:/Users/xiaod/chinese_chess');
const sourceLevel = path.join(sourceRoot, 'question_bank', 'data', 'endgame', 'L1');
const outputRoot = path.join(webDir, 'chinese-chess', 'bank', 'endgame', 'L1');
const categoryLabels = {
  cannon: '炮类', horse: '马类', pawn: '兵类', rook: '车类', others: '其他'
};

const categories = [];
let puzzleCount = 0;
for (const categoryDir of await directories(sourceLevel)) {
  const fenDir = path.join(categoryDir, 'fen');
  const categoryKey = path.basename(categoryDir);
  const fenFiles = (await files(fenDir)).filter(file => file.endsWith('.fen')).sort(numericNameCompare);
  if (fenFiles.length === 0) continue;

  const items = [];
  for (const fenFile of fenFiles) {
    const stem = path.basename(fenFile, '.fen');
    const metaPath = path.join(categoryDir, 'json', `${stem}.json`);
    const metadata = await readJson(metaPath);
    const solutionFiles = (await files(path.join(categoryDir, 'solutions')))
      .filter(file => path.basename(file).startsWith(`${stem}-`) && file.endsWith('.txt'))
      .sort(numericNameCompare);
    const explanationFiles = (await files(path.join(categoryDir, 'explanation')))
      .filter(file => path.basename(file).includes(stem) && file.endsWith('.txt'))
      .sort(numericNameCompare);

    const relativeDir = path.join(categoryKey, stem);
    const outputDir = path.join(outputRoot, relativeDir);
    await mkdir(outputDir, { recursive: true });
    const sourceFiles = [fenFile, ...(await exists(metaPath) ? [metaPath] : []), ...solutionFiles, ...explanationFiles];
    for (const sourceFile of sourceFiles) await cp(sourceFile, path.join(outputDir, path.basename(sourceFile)));

    const title = metadata?.displayInfo?.chineseName
      || metadata?.displayInfo?.name
      || metadata?.gene_info?.name
      || metadata?.name
      || stem;
    items.push({
      id: stem,
      title,
      fen: `${relativeDir}/${path.basename(fenFile)}`.replaceAll(path.sep, '/'),
      metadata: metadata ? `${relativeDir}/${stem}.json`.replaceAll(path.sep, '/') : null,
      solutions: solutionFiles.map(file => `${relativeDir}/${path.basename(file)}`.replaceAll(path.sep, '/')),
      explanations: explanationFiles.map(file => `${relativeDir}/${path.basename(file)}`.replaceAll(path.sep, '/'))
    });
    puzzleCount += 1;
  }
  categories.push({ key: categoryKey, label: categoryLabels[categoryKey] || categoryKey, items });
}

const manifest = { version: 1, source: 'chinese_chess/question_bank/data/endgame/L1', categories };
await mkdir(outputRoot, { recursive: true });
await writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Built ${puzzleCount} Xiangqi endgame puzzles in ${outputRoot}`);

async function directories(directory) {
  try {
    return (await readdir(directory, { withFileTypes: true }))
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(directory, entry.name))
      .sort((first, second) => first.localeCompare(second));
  } catch {
    return [];
  }
}

async function files(directory) {
  try {
    return (await readdir(directory, { withFileTypes: true }))
      .filter(entry => entry.isFile())
      .map(entry => path.join(directory, entry.name));
  } catch {
    return [];
  }
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

async function exists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

function numericNameCompare(first, second) {
  return path.basename(first).localeCompare(path.basename(second), 'zh-CN', { numeric: true });
}