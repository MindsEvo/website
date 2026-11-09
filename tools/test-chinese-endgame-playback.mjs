import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildNotationPlayback } from '../chinese-chess/shared/notation-playback.mjs';
import { createGameFromFen, getGameStatus } from '../chinese-chess/core.mjs';

const bank = new URL('../chinese-chess/bank/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', bank), 'utf8'));
let count = 0;
const rook = manifest.categories.find(category => category.key === 'endgame/L1/rook').items
  .filter(item => item.id.startsWith('eg_R-'));
const horse = manifest.categories.find(category => category.key === 'endgame/L1/horse').items
  .filter(item => item.id.startsWith('eg_H-'));
assert.equal(rook.length, 11, 'all L1 single-rook positions are available');
assert.equal(horse.length, 5, 'all L1 single-horse positions are available');
const cannon = manifest.categories.find(category => category.key === 'endgame/L1/cannon').items;
const singleCannon = cannon.filter(item => /^eg_C(?:A|E)?-.*_L1-/.test(item.id));
assert.equal(singleCannon.length, 6);
const practice = cannon.filter(item => /^eg_2C/.test(item.id));
assert.equal(practice.length, 2);
for (const puzzle of practice) {
  const fen = await readFile(new URL(puzzle.fen, bank), 'utf8');
  assert.notEqual(getGameStatus(createGameFromFen(fen)).type, 'invalid', puzzle.id);
}
const pawn = manifest.categories.find(category => category.key === 'endgame/L1/pawn').items;
assert.equal(pawn.length, 3, 'all L1 pawn positions are available');
const puzzles = [...rook, ...horse, ...singleCannon, ...pawn];
for (const puzzle of puzzles) {
  const id = puzzle.id;
  const fen = await readFile(new URL(puzzle.fen, bank), 'utf8');
  const numbered = puzzle.solutions.filter(file => file.includes(`${id}-`));
  for (const file of numbered.length ? numbered : puzzle.solutions) {
    const text = await readFile(new URL(file, bank), 'utf8');
    if (id === 'eg_PPP-2A2E_L1-001') {
      assert.throws(() => buildNotationPlayback(fen, text), /兵四平三 无法确定唯一合法走法/);
      assert.notEqual(getGameStatus(createGameFromFen(fen)).type, 'invalid');
      continue;
    }
    const playback = buildNotationPlayback(fen, text);
    assert.ok(playback.moves.length > 0, file);
    assert.equal(playback.positions.length, playback.moves.length + 1);
    count += 1;
  }
}
assert.throws(() => buildNotationPlayback('9/5k3/9/9/9/9/4R4/9/4K4/9 r - - 0 1', '车五平九 无效'));
console.log(`Validated ${count} playable solution variants, the explicit three-pawn notation ambiguity, and two practice positions.`);
