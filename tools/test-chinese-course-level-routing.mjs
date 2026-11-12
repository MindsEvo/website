import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectCoursePuzzlesForSection } from '../chinese-chess/academy/course-puzzle-levels.mjs';

const manifest = JSON.parse(await readFile(new URL('../chinese-chess/bank/manifest.json', import.meta.url), 'utf8'));

for (const family of ['endgame', 'attacking', 'tactics']) {
  const categories = manifest.categories.filter(category => category.family === family);
  const allPuzzles = categories.flatMap(category =>
    category.items.map(puzzle => ({ ...puzzle, categoryLevel: category.level })));
  const observation = new Set(selectCoursePuzzlesForSection(allPuzzles, 'observation').map(puzzle => puzzle.id));
  const practice = new Set(selectCoursePuzzlesForSection(allPuzzles, 'practice').map(puzzle => puzzle.id));

  assert.equal(observation.size + practice.size, allPuzzles.length, `${family}: each source puzzle is assigned`);
  assert.equal([...observation].filter(id => practice.has(id)).length, 0, `${family}: levels do not overlap`);
  assert.ok(allPuzzles.every(puzzle => observation.has(puzzle.id) || practice.has(puzzle.id)), `${family}: no puzzle is omitted`);
  assert.ok([...observation].every(id => /_L1-/.test(id) || id === '示例题目'), `${family}: observation only includes L1`);
  assert.ok([...practice].every(id => /_L[23]-/.test(id) || id === '示例题目'), `${family}: practice only includes L2/L3`);
}

console.log('Validated L1 observation and L2/L3 practice routing for endgame, attacking and tactics puzzles.');
