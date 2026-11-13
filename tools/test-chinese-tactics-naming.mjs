import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { getCoursePuzzleLevel, selectCoursePuzzlesForSection } from '../chinese-chess/academy/course-puzzle-levels.mjs';
import { TACTICS_CATEGORIES, selectTacticsPuzzles } from '../chinese-chess/academy/tactics/tactics-catalog.mjs';
import { notationContent } from '../chinese-chess/shared/notation-playback.mjs';

const bank = new URL('../chinese-chess/bank/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', bank), 'utf8'));
const categories = manifest.categories.filter(category => category.family === 'tactics');
const puzzles = categories.flatMap(category => category.items);
const pending = puzzles.filter(puzzle => puzzle.namingPending);
assert.equal(puzzles.length, 54);
assert.equal(new Set(puzzles.map(puzzle => puzzle.id)).size, puzzles.length);
assert.equal(new Set(puzzles.map(puzzle => puzzle.originalId)).size, puzzles.length);
assert.equal(pending.length, 52);
assert.deepEqual(new Set(selectTacticsPuzzles(manifest, '待定').map(puzzle => puzzle.id)),
  new Set(pending.map(puzzle => puzzle.id)));
for (const category of categories) {
  const key = category.key.split('/').at(-1);
  const lessons = Object.entries(TACTICS_CATEGORIES).filter(([, keys]) => keys.includes(key)).map(([name]) => name);
  assert.ok(lessons.length, `${key}: source category has a lesson`);
  const selected = new Set(lessons.flatMap(name => selectTacticsPuzzles(manifest, name).map(puzzle => puzzle.id)));
  assert.ok(category.items.every(puzzle => selected.has(puzzle.id)), `${key}: naming pending retains category`);
}
for (const section of ['observation', 'practice']) {
  const selected = selectCoursePuzzlesForSection(pending, section);
  const expected = pending.filter(puzzle => section === 'observation'
    ? getCoursePuzzleLevel(puzzle) === 'L1' : getCoursePuzzleLevel(puzzle) !== 'L1');
  assert.deepEqual(selected, expected);
}
for (const puzzle of puzzles) {
  assert.match(puzzle.id, /^tac_[\u4e00-\u9fffA-Za-z0-9]+_L[123]-\d{3}$/u);
  assert.match(puzzle.originalId, /^ta_[a-z]+_L[123]-\d{3}$/);
  assert.equal(puzzle.id.match(/_L[123]-\d{3}$/)[0], puzzle.originalId.match(/_L[123]-\d{3}$/)[0]);
  const metadata = JSON.parse(await readFile(new URL(puzzle.metadata, bank), 'utf8'));
  assert.equal(metadata.geneId, puzzle.id);
  assert.equal(metadata.originalId, puzzle.originalId);
  assert.equal(metadata.metadata.difficulty, getCoursePuzzleLevel(puzzle));
  assert.equal(metadata.displayInfo.chineseName, puzzle.title);
  assert.equal(Boolean(metadata.namingPending), Boolean(puzzle.namingPending));
  if (puzzle.namingPending) assert.equal(metadata.displayInfo.originalName, puzzle.originalTitle);
  for (const file of [puzzle.fen, puzzle.metadata, ...puzzle.solutions, ...puzzle.explanations, ...puzzle.pgn]) {
    await access(new URL(file, bank));
    assert.ok(file.includes(puzzle.id), `${puzzle.id}: file uses current identifier`);
  }
  for (const file of puzzle.solutions) {
    assert.equal(notationContent(await readFile(new URL(file, bank), 'utf8')), '', `${puzzle.id}: placeholder is not playable`);
  }
}
const sample = puzzles.find(puzzle => puzzle.originalId === 'ta_duncuo_L2-001');
assert.equal(JSON.parse(await readFile(new URL(sample.metadata, bank), 'utf8')).metadata.originalDifficulty, 'L1');
assert.equal(selectTacticsPuzzles({ categories: [
  { key: 'tactics/qizi', family: 'tactics', items: [{ id: 'test', classificationPending: true }] }
] }, '弃子').length, 0);
assert.equal(selectTacticsPuzzles({ categories: [
  { key: 'tactics/qizi', family: 'tactics', items: [{ id: 'test', classificationPending: true }] }
] }, '待定').length, 1);
console.log(`Validated ${puzzles.length} tactics, ${pending.length} pending names and preserved category routing.`);
