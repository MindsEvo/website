import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPuzzleBank, pairedExplanation } from '../chinese-chess/shared/puzzle-bank.mjs';

test('manual explanation versions match solution versions, not array offsets', () => {
  const puzzle = { rootGene: 'manual', solutions: ['custom/id/id-001.txt', 'custom/id/id-003.txt'], explanations: ['custom/id/id_exp-003.txt'] };
  assert.equal(pairedExplanation(puzzle, 0), undefined);
  assert.equal(pairedExplanation(puzzle, 1), 'custom/id/id_exp-003.txt');
  assert.equal(pairedExplanation({ solutions: ['source.txt'], explanations: ['source_exp.txt'] }, 0), 'source_exp.txt');
});

test('merges legacy custom storage into the correct family and level with resolvable paths', async () => {
  const originalFetch = globalThis.fetch;
  const categories = [{ key: 'endgame/L1/rook', family: 'endgame', level: 'L1', items: [{ id: 'source' }] }];
  const items = ['eg_CUSTOM_L1-001', 'at_CUSTOM_L2-001', 'tac_CUSTOM_L3-001'].map(id => ({
    id, rootGene: 'manual', fen: `custom/${id}/${id}.fen`, metadata: `custom/${id}/${id}.json`,
    solutions: [`custom/${id}/${id}-001.txt`], explanations: [`custom/${id}/${id}_exp-001.txt`]
  }));
  try {
    globalThis.fetch = async url => ({
      ok: true,
      json: async () => String(url).endsWith('endgame/L1/manifest.json')
        ? { categories: [{ key: 'custom', items }] }
        : { categories: structuredClone(categories) }
    });
    const bank = await loadPuzzleBank();
    assert.equal(bank.categories[0].items[0].id, 'source');
    for (const [index, family, level] of [[0, 'endgame', 'L1'], [1, 'attacking', 'L2'], [2, 'tactics', 'L3']]) {
      const category = bank.categories.find(category => category.key === `${family}/${level}/custom`);
      assert.equal(category.family, family);
      assert.equal(category.level, level);
      for (const key of ['fen', 'metadata']) assert.equal(category.items[0][key], `endgame/L1/${items[index][key]}`);
      for (const key of ['solutions', 'explanations']) assert.deepEqual(category.items[0][key], items[index][key].map(file => `endgame/L1/${file}`));
      assert.equal(category.items[0].rootGene, 'manual');
    }
    globalThis.fetch = async () => ({ ok: false, status: 503 });
    await assert.rejects(loadPuzzleBank, /题库清单载入失败/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
