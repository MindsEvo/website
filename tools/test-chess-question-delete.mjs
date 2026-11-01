import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const service = require('../server/src/rootGeneService.js');
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'chess-delete-'));
const dataRoot = path.join(temporary, 'academy');
const bankPath = path.join(temporary, 'question-bank.js');
const options = { dataRoot, bankPath };
const directory = path.join(dataRoot, 'endgame', 'data', 'knight');
const id = 'endgame/L1/KBN_vs_K/fen/eg_KBN-K_L1-001.fen';
try {
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'manifest.json'), '\uFEFF' + JSON.stringify({ categories: [{ key: 'KBN_vs_K', items: [
    { id: 'kbn-k-001', solutions: [{ id: 'shared' }, { id: 'first-only' }] },
    { id: 'kbn-k-002', solutions: [{ id: 'shared' }] }
  ] }] }));
  for (const name of ['kbn-k-001', 'first-only', 'shared', 'kbn-k-002']) {
    await fs.writeFile(path.join(directory, name + '.solution.txt'), '1. Ke2 Ke7\n# END\n');
  }
  const bank = { tree: [{ children: [{ question: id }, { question: 'keep' }] }], questions: { [id]: { id }, keep: { id: 'keep' } }, records: [{ id }, { id: 'keep' }] };
  await fs.writeFile(bankPath, 'window.ChessQuestionBank = ' + JSON.stringify(bank) + ';\n');
  const before = await fs.readFile(bankPath, 'utf8');
  const preview = await service.deleteQuestion({ id }, { ...options, preview: true });
  assert.deepEqual(preview.locations, ['web/chess/academy/endgame/data/knight']);
  assert.equal(await fs.readFile(bankPath, 'utf8'), before);
  await fs.access(path.join(directory, 'first-only.solution.txt'));
  const result = await service.deleteQuestion({ id }, options);
  assert.equal(result.deletedFiles, 2);
  await assert.rejects(fs.access(path.join(directory, 'kbn-k-001.solution.txt')));
  await assert.rejects(fs.access(path.join(directory, 'first-only.solution.txt')));
  await fs.access(path.join(directory, 'shared.solution.txt'));
  await fs.access(path.join(directory, 'kbn-k-002.solution.txt'));
  const manifest = JSON.parse(await fs.readFile(path.join(directory, 'manifest.json'), 'utf8'));
  assert.deepEqual(manifest.categories[0].items.map(item => item.id), ['kbn-k-002']);
  const updated = JSON.parse((await fs.readFile(bankPath, 'utf8')).slice('window.ChessQuestionBank = '.length).trim().replace(/;$/, ''));
  assert.deepEqual(Object.keys(updated.questions), ['keep']);
  assert.deepEqual(updated.records.map(record => record.id), ['keep']);
  assert.ok((await service.getDeletedIds(options)).includes(id));
  const fen = '8/8/8/8/8/8/4K3/7k w - - 0 1';
  await service.persistQuestion({ category: 'endgame', level: 'L1', geneName: 'eg_KBN-KN_L1-030', fen }, options);
  for (const suffix of ['.anno.json', '.solution.txt', '.exp.txt']) await fs.rm(path.join(directory, 'eg_KBN-KN_L1-030' + suffix));
  await service.deleteQuestion({ id: 'academy/endgame/data/knight/eg_KBN-KN_L1-030' }, options);
  assert.equal((await service.listQuestions(options)).length, 0);
  await service.persistQuestion({ category: 'endgame', level: 'L1', geneName: 'eg_KBN-KN_L1-030', fen }, options);
  assert.ok(!(await service.getDeletedIds(options)).includes('academy/endgame/data/knight/eg_KBN-KN_L1-030'));
  await assert.rejects(service.deleteQuestion({ id: '../outside' }, options), /无效/);
  await assert.rejects(service.deleteQuestion({ id: 'missing' }, options), /找不到/);
  const openingRoot = path.join(dataRoot, 'opening', 'data', 'A_Control');
  const openingDirectory = path.join(openingRoot, 'A1_pawn_center');
  await fs.mkdir(openingDirectory, { recursive: true });
  await fs.writeFile(path.join(openingRoot, 'manifest.json'), JSON.stringify({ categories: [{ key: 'A1_pawn_center', items: [{ id: 'opening_A1_Demo_001' }] }] }));
  await fs.writeFile(path.join(openingDirectory, 'opening_A1_Demo_001.exp.txt'), 'Opening lesson');
  await service.deleteQuestion({ id: 'academy/opening/data/A_Control/A1_pawn_center/opening_A1_Demo_001' }, options);
  await assert.rejects(fs.access(path.join(openingDirectory, 'opening_A1_Demo_001.exp.txt')));
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(openingRoot, 'manifest.json'), 'utf8')).categories, []);
  console.log('PASS: built-in deletion, shared-file protection, bundle cleanup, orphan cleanup, and invalid ID guards.');
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}