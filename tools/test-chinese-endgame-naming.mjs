import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { getCoursePuzzleLevel } from '../chinese-chess/academy/course-puzzle-levels.mjs';

const bank = new URL('../chinese-chess/bank/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', bank), 'utf8'));
const endgames = manifest.categories.filter(category => category.family === 'endgame')
  .flatMap(category => category.items);
assert.equal(endgames.length, 44);
assert.equal(new Set(endgames.map(puzzle => puzzle.id)).size, 44);
assert.equal(endgames.filter(puzzle => puzzle.classificationPending).length, 4);

for (const puzzle of endgames) {
  assert.match(puzzle.id, /^eg_[\u4e00-\u9fffA-Za-z0-9]+_L[123]-\d{3}$/u);
  assert.ok(puzzle.originalId, `${puzzle.id}: original ID preserved`);
  assert.equal(getCoursePuzzleLevel(puzzle), `L${puzzle.id.match(/_L([123])-/)[1]}`);
  const metadata = JSON.parse(await readFile(new URL(puzzle.metadata, bank), 'utf8'));
  assert.equal(metadata.geneId, puzzle.id);
  assert.equal(metadata.originalId, puzzle.originalId);
  assert.equal(metadata.metadata.difficulty, getCoursePuzzleLevel(puzzle));
  if (puzzle.classificationPending) assert.equal(metadata.classificationPending, true);
  for (const file of [puzzle.fen, puzzle.metadata, ...puzzle.solutions, ...puzzle.explanations, ...puzzle.pgn]) {
    await access(new URL(file, bank));
  }
}

const legacy = JSON.parse(await readFile(new URL('endgame/L1/manifest.json', bank), 'utf8'));
for (const puzzle of legacy.categories.flatMap(category => category.items)) {
  assert.ok(endgames.some(item => item.id === puzzle.id), `${puzzle.id}: legacy manifest matches`);
  for (const file of [puzzle.fen, puzzle.metadata, ...puzzle.solutions, ...puzzle.explanations]) {
    await access(new URL(`endgame/L1/${file}`, bank));
  }
}
console.log(`Validated ${endgames.length} Chinese-named endgames, four pending records and legacy file associations.`);
