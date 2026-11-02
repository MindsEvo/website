import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFen } from '../chinese-chess/core.mjs';

const root = path.resolve('web/chinese-chess/bank/endgame/L1');
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
let puzzleCount = 0;

for (const category of manifest.categories) {
  for (const puzzle of category.items) {
    puzzleCount += 1;
    const fen = await readFile(path.join(root, puzzle.fen), 'utf8');
    assert.equal(parseFen(fen).board.length, 10, `${puzzle.id} FEN has 10 ranks`);
    if (puzzle.metadata) await access(path.join(root, puzzle.metadata));
    for (const file of [...puzzle.solutions, ...puzzle.explanations]) await access(path.join(root, file));
  }
}

assert.ok(puzzleCount > 0, 'manifest contains puzzles');
console.log(`Validated ${manifest.categories.length} categories and ${puzzleCount} Xiangqi positions.`);