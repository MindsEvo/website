import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { persistCustomPuzzle, savePuzzleMaterial, deleteCustomPuzzle } = require('../server/src/chineseChessRootGeneService.js');
const INITIAL_FEN = 'rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR r - - 0 1';
const UPDATED_FEN = 'rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR b - - 0 1';

async function withBank(run) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xiangqi-root-gene-'));
  try {
    await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify({ version: 1, categories: [{ key: 'rook', label: '车类', items: [] }] }));
    await run(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

test('persists a strictly named custom FEN and lists it in the manifest', async () => {
  await withBank(async bankRoot => {
    const saved = await persistCustomPuzzle({ id: 'eg_CUSTOM_L1-001', title: '手工测试局面', fen: INITIAL_FEN }, { bankRoot });
    assert.equal(saved.id, 'eg_CUSTOM_L1-001');
    assert.equal(await fs.readFile(path.join(bankRoot, 'custom/eg_CUSTOM_L1-001/eg_CUSTOM_L1-001.fen'), 'utf8'), `${INITIAL_FEN}\n`);
    const manifest = JSON.parse(await fs.readFile(path.join(bankRoot, 'manifest.json'), 'utf8'));
    assert.equal(manifest.categories[0].key, 'rook');
    assert.equal(manifest.categories.find(category => category.key === 'custom').items[0].title, '手工测试局面');
    await assert.rejects(() => persistCustomPuzzle({ id: 'eg_CUSTOM_L1-001', title: '重复编号', fen: INITIAL_FEN }, { bankRoot }), /已存在/);
    await assert.rejects(() => persistCustomPuzzle({ id: '../escape', title: 'bad', fen: INITIAL_FEN }, { bankRoot }), /编号必须符合/);
    await assert.rejects(() => persistCustomPuzzle({ id: 'eg_CUSTOM_L1-002', title: 'bad fen', fen: 'invalid' }, { bankRoot }), /FEN/);
  });
});

test('updating a saved position invalidates its old solution and explanation files', async () => {
  await withBank(async bankRoot => {
    const id = 'eg_CUSTOM_L1-001';
    await persistCustomPuzzle({ id, title: '局面 A', fen: INITIAL_FEN }, { bankRoot });
    await savePuzzleMaterial({ id, kind: 'solution', version: 1, text: '1. 炮二平五' }, { bankRoot });
    await savePuzzleMaterial({ id, kind: 'explanation', version: 1, text: '局面 A 解说。' }, { bankRoot });
    await persistCustomPuzzle({ id, title: '局面 B', fen: UPDATED_FEN, updateExisting: true }, { bankRoot });
    const manifest = JSON.parse(await fs.readFile(path.join(bankRoot, 'manifest.json'), 'utf8'));
    const item = manifest.categories.find(category => category.key === 'custom').items[0];
    assert.equal(item.title, '局面 B');
    assert.deepEqual(item.solutions, []);
    assert.deepEqual(item.explanations, []);
    await assert.rejects(() => fs.access(path.join(bankRoot, 'custom', id, `${id}-001.txt`)));
    await assert.rejects(() => fs.access(path.join(bankRoot, 'custom', id, `${id}_exp-001.txt`)));
  });
});

test('saves versioned solutions and explanations, and only deletes the custom entry', async () => {
  await withBank(async bankRoot => {
    await persistCustomPuzzle({ id: 'eg_CUSTOM_L1-001', title: '手工测试局面', fen: INITIAL_FEN }, { bankRoot });
    await savePuzzleMaterial({ id: 'eg_CUSTOM_L1-001', kind: 'solution', version: 1, text: '1. 炮二平五' }, { bankRoot });
    await savePuzzleMaterial({ id: 'eg_CUSTOM_L1-001', kind: 'explanation', version: 1, text: '控制中路。' }, { bankRoot });
    assert.match(await fs.readFile(path.join(bankRoot, 'custom/eg_CUSTOM_L1-001/eg_CUSTOM_L1-001-001.txt'), 'utf8'), /# END/);
    assert.match(await fs.readFile(path.join(bankRoot, 'custom/eg_CUSTOM_L1-001/eg_CUSTOM_L1-001_exp-001.txt'), 'utf8'), /控制中路/);
    await deleteCustomPuzzle({ id: 'eg_CUSTOM_L1-001' }, { bankRoot });
    const manifest = JSON.parse(await fs.readFile(path.join(bankRoot, 'manifest.json'), 'utf8'));
    assert.equal(manifest.categories.find(category => category.key === 'custom').items.length, 0);
    assert.equal(manifest.categories.find(category => category.key === 'rook').items.length, 0);
    await assert.rejects(() => fs.access(path.join(bankRoot, 'custom/eg_CUSTOM_L1-001')));
  });
});
