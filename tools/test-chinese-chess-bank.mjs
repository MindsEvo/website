import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseFen } from '../chinese-chess/core.mjs';

const root = path.resolve('web/chinese-chess/bank');
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
let puzzleCount = 0;
const ids = new Set();

for (const category of manifest.categories) {
  for (const puzzle of category.items) {
    puzzleCount += 1;
    assert.ok(!ids.has(puzzle.id), `${puzzle.id} is unique`);
    ids.add(puzzle.id);
    const fen = await readFile(path.join(root, puzzle.fen), 'utf8');
    assert.equal(parseFen(fen).board.length, 10, `${puzzle.id} FEN has 10 ranks`);
    if (puzzle.metadata) await access(path.join(root, puzzle.metadata));
    for (const file of [...puzzle.solutions, ...puzzle.explanations, ...(puzzle.pgn || [])]) await access(path.join(root, file));
  }
}

assert.ok(puzzleCount > 0, 'manifest contains puzzles');
for (const family of ['attacking', 'endgame', 'opening', 'tactics']) {
  assert.ok(manifest.categories.some(category => category.family === family), `${family} collection imported`);
}
console.log(`Validated ${manifest.categories.length} categories and ${puzzleCount} Xiangqi positions.`);

if (process.argv[2]) {
  const source = path.resolve(process.argv[2], 'question_bank', 'data');
  const indexed = new Set(manifest.categories.flatMap(category => category.items.map(item => item.fen)));
  const puzzles = manifest.categories.flatMap(category => category.items);
  for (const puzzle of puzzles) {
    const fenDir = path.dirname(puzzle.fen);
    const categoryDir = path.basename(fenDir) === 'fen' ? path.dirname(fenDir) : fenDir;
    const stem = path.basename(puzzle.fen, '.fen');
    const solutionDir = path.join(categoryDir, 'solutions');
    let names;
    try {
      names = await readdir(path.join(source, solutionDir));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      names = [];
    }
    const expected = names.filter(name => name === `${stem}.txt`
      || (name.startsWith(`${stem}-`) && name.endsWith('.txt')))
      .map(name => path.join(solutionDir, name).split(path.sep).join('/')).sort();
    assert.deepEqual([...puzzle.solutions].sort(), expected, `${puzzle.id} includes base and variant solutions`);
  }
  let sourceCount = 0;
  for (const relative of await walk(source)) {
    const original = await readFile(path.join(source, relative));
    const copied = await readFile(path.join(root, relative));
    assert.deepEqual(copied, original, `${relative} preserved exactly`);
    if (relative.endsWith('.fen')) {
      sourceCount += 1;
      assert.ok(indexed.has(relative.split(path.sep).join('/')), `${relative} indexed`);
    }
  }
  assert.equal(puzzleCount, sourceCount, 'all source FEN positions imported');
  console.log(`Verified every source file was copied unchanged and all ${sourceCount} puzzles indexed.`);
}

async function walk(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path.join(directory, entry.name), relative));
    else if (entry.isFile()) result.push(relative);
  }
  return result;
}