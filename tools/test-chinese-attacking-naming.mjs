import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { getCoursePuzzleLevel, selectCoursePuzzlesForSection } from '../chinese-chess/academy/course-puzzle-levels.mjs';
import { ATTACKING_ROOTS, selectAttackingPuzzles } from '../chinese-chess/academy/attacking/attacking-catalog.mjs';

const bank = new URL('../chinese-chess/bank/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', bank), 'utf8'));
const puzzles = manifest.categories.filter(category => category.family === 'attacking')
  .flatMap(category => category.items);
assert.equal(puzzles.length, 56);
assert.equal(new Set(puzzles.map(puzzle => puzzle.id)).size, puzzles.length);
assert.equal(new Set(puzzles.map(puzzle => puzzle.originalId)).size, puzzles.length);
const pending = puzzles.filter(puzzle => puzzle.classificationPending);
assert.equal(pending.length, 13);
assert.deepEqual(new Set(selectAttackingPuzzles(manifest, '待定').map(puzzle => puzzle.id)),
  new Set(pending.map(puzzle => puzzle.id)));
assert.equal(selectCoursePuzzlesForSection(pending, 'observation').length, 0);
assert.equal(selectCoursePuzzlesForSection(pending, 'practice').length, 13);
for (const root of ATTACKING_ROOTS.filter(root => !root.sourceOnly)) {
  assert.ok(selectAttackingPuzzles(manifest, root.name).every(puzzle => !puzzle.classificationPending));
}

for (const puzzle of puzzles) {
  assert.match(puzzle.id, /^at_[\u4e00-\u9fffA-Za-z0-9]+_L[123]-\d{3}$/u);
  assert.match(puzzle.originalId, /^at_.+_L[123]-\d{3}$/);
  const level = getCoursePuzzleLevel(puzzle);
  assert.equal(level, puzzle.originalId.match(/_(L[123])-/)[1]);
  const metadata = JSON.parse(await readFile(new URL(puzzle.metadata, bank), 'utf8'));
  assert.equal(metadata.geneId, puzzle.id);
  assert.equal(metadata.originalId, puzzle.originalId);
  assert.equal(metadata.metadata.difficulty, level);
  assert.equal(Boolean(metadata.classificationPending), Boolean(puzzle.classificationPending));
  assert.equal(metadata.displayInfo.chineseName, puzzle.title);
  if (puzzle.originalTitle !== undefined) assert.equal(metadata.displayInfo.originalName, puzzle.originalTitle);
  for (const file of [puzzle.fen, puzzle.metadata, ...puzzle.solutions, ...puzzle.explanations, ...puzzle.pgn]) {
    await access(new URL(file, bank));
    assert.ok(file.includes(puzzle.id), `${puzzle.id}: file uses current identifier`);
  }
}
assert.equal(puzzles.find(puzzle => puzzle.originalId === 'at_OHCAE-2RA_L1-001').id, 'at_马后炮_L1-001');
const mismatch = puzzles.find(puzzle => puzzle.id === 'at_马后炮_L1-001');
assert.equal(JSON.parse(await readFile(new URL(mismatch.metadata, bank), 'utf8')).metadata.originalDifficulty, 'L2');
console.log(`Validated ${puzzles.length} Chinese-named attack puzzles, ${pending.length} pending classifications and linked files.`);
