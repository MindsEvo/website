import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const service = require('../server/src/chessSolutionService.js');
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'chess-solutions-'));
const dataRoot = path.join(temporary, 'academy');
const bankPath = path.join(temporary, 'question-bank.js');
const options = { dataRoot, bankPath };
const fen = '8/8/8/8/8/8/8/4K2k w - - 0 1';
const directory = path.join(dataRoot, 'endgame/data/queen');
const questionId = 'academy/endgame/data/queen/kq-k-001';
const legacyId = 'endgame/L1/KQ_vs_K/fen/eg_KQ-K_L1-001.fen';
const moves = [{ ply: 1, san: 'Qh2', popup: 'keep', flash_squares: ['h2'] }];
async function write(file, text) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, text, 'utf8');
}
async function json(file, data, bom = false) {
  await write(file, (bom ? '\uFEFF' : '') + JSON.stringify(data));
}
async function snapshot(folder) {
  return Object.fromEntries(await Promise.all((await fs.readdir(folder)).sort().map(async name => [name, await fs.readFile(path.join(folder, name), 'utf8')])));
}

try {
  for (const filename of ['../server/src/chessSolutionService.js', '../server/src/server.js']) {
    const checked = spawnSync(process.execPath, ['--check', fileURLToPath(new URL(filename, import.meta.url))], { encoding: 'utf8' });
    assert.equal(checked.status, 0, checked.stderr);
  }
  const item = { id: 'kq-k-001', fen, solutions: [{ id: 'kq-k-001-2' }, { id: 'kq-k-001-1' }, { id: 'kq-k-001-3' }] };
  await json(path.join(directory, 'manifest.json'), { categories: [{ key: 'kq-k', items: [item, { id: 'eg_KQ-K_L2-007', fen }] }] }, true);
  await write(path.join(directory, 'kq-k-001-1.solution.txt'), 'first');
  await write(path.join(directory, 'kq-k-001-2.solution.txt'), 'second');
  await write(path.join(directory, 'kq-k-001-3.solution.txt'), 'third');
  await write(path.join(directory, 'kq-k-001-1.exp.txt'), 'first explanation');
  await write(path.join(directory, 'kq-k-001-2.exp.txt'), 'second explanation');
  await json(path.join(directory, 'kq-k-001-1.anno.json'), { description: 'first explanation', moves, extra: { keep: true } }, true);
  await json(path.join(directory, 'kq-k-001-2.anno.json'), { description: 'second explanation', moves: [{ san: 'Qh3' }] });
  await write(path.join(directory, 'kq-k-001.exp.txt'), 'shared explanation');
  await json(path.join(directory, 'kq-k-001.anno.json'), { description: 'shared explanation', moves: [{ san: 'Qh4' }] });
  const fallbackId = 'tactics/fork/L1/fen/tac_unmapped_L1-001.fen';
  const bank = { questions: {
    [questionId]: { fen: 'must not override academy', solutions: [] },
    'tactics/fen/kq-k-001.fen': { fen, solutions: [{ label: 'kq-k-001-1.txt', text: 'different course' }], explanation: 'tactics only' },
    [legacyId]: { fen: 'bundled fen', solutions: [{ label: 'eg_KQ-K_L1-001-2.txt', text: 'old second' }, { label: 'eg_KQ-K_L1-001-001.txt', text: 'old first' }], explanation: 'bundled exp' },
    [fallbackId]: { fen, solutions: [{ label: 'tac_unmapped_L1-001-2.txt', text: 'two' }, { label: 'tac_unmapped_L1-001-001.txt', text: 'one' }], explanation: 'shared bundle' }
  } };
  await write(bankPath, '\uFEFFwindow.ChessQuestionBank = ' + JSON.stringify(bank) + ';\n');
  const loaded = await service.loadSolutions({ questionId }, options);
  assert.equal(loaded.ok, true);
  assert.equal(loaded.fen, fen);
  assert.equal(loaded.readOnly, false);
  assert.deepEqual(loaded.solutions.map(solution => solution.number), ['001', '002', '003']);
  assert.deepEqual(loaded.solutions.map(solution => solution.explanation), ['first explanation', 'second explanation', 'shared explanation']);
  assert.deepEqual(loaded.solutions.map(solution => solution.annotation.moves[0].san), ['Qh2', 'Qh3', 'Qh4']);
  assert.equal(loaded.solutions[0].relativePath, 'academy/endgame/data/queen/kq-k-001-1.solution.txt');
  assert.deepEqual((await service.loadSolutions({ questionId: legacyId }, options)).solutions, loaded.solutions);
  const otherCourse = await service.loadSolutions({ questionId: 'tactics/fen/kq-k-001.fen' }, options);
  assert.equal(otherCourse.readOnly, true);
  assert.equal(otherCourse.solutions[0].text, 'different course');
  await fs.rm(path.join(directory, 'kq-k-001-2.exp.txt'));
  const missingExp = await service.loadSolutions({ questionId }, options);
  assert.equal(missingExp.solutions[1].explanation, 'shared explanation');
  assert.equal(missingExp.solutions[1].annotation.moves[0].san, 'Qh3');
  await write(path.join(directory, 'kq-k-001-2.exp.txt'), 'second explanation');
  await fs.rm(path.join(directory, 'kq-k-001-2.anno.json'));
  const missingAnno = await service.loadSolutions({ questionId }, options);
  assert.equal(missingAnno.solutions[1].explanation, 'second explanation');
  assert.equal(missingAnno.solutions[1].annotation.moves[0].san, 'Qh4');
  await json(path.join(directory, 'kq-k-001-2.anno.json'), { description: 'second explanation', moves: [{ san: 'Qh3' }] });

  const before = await snapshot(directory);
  const saved = await service.saveSolution({ questionId: legacyId, solutionId: 'kq-k-001-1', solutionText: '1. Qh2', explanation: 'updated' }, options);
  assert.equal(saved.bundleUpdated, false);
  assert.match(saved.solutions[0].text, /1\. Qh2\n# END\n$/);
  assert.equal(saved.solutions[0].annotation.description, 'updated');
  assert.deepEqual(saved.solutions[0].annotation.moves, moves);
  assert.deepEqual(saved.solutions[0].annotation.extra, { keep: true });
  const after = await snapshot(directory);
  for (const [name, contents] of Object.entries(before)) {
    if (!name.startsWith('kq-k-001-1.')) assert.equal(after[name], contents, name + ' must remain unchanged');
  }
  assert.equal(await fs.readFile(bankPath, 'utf8'), '\uFEFFwindow.ChessQuestionBank = ' + JSON.stringify(bank) + ';\n');
  await service.saveSolution({ questionId, solutionId: 'kq-k-001-1', explanation: '' }, options);
  const cleared = await service.loadSolutions({ questionId }, options);
  assert.equal(cleared.solutions[0].explanation, '');
  assert.equal(cleared.solutions[0].annotation.description, '');
  assert.deepEqual(cleared.solutions[0].annotation.moves, moves);
  assert.equal(cleared.solutions[0].text, saved.solutions[0].text);
  const noOp = await snapshot(directory);
  await service.saveSolution({ questionId, solutionId: 'kq-k-001-1' }, options);
  assert.deepEqual(await snapshot(directory), noOp);
  await service.saveSolution({ questionId, solutionId: 'kq-k-001-3', explanation: 'variant three' }, options);
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(directory, 'kq-k-001-3.anno.json'), 'utf8')).moves, [{ san: 'Qh4' }]);
  assert.equal(await fs.readFile(path.join(directory, 'kq-k-001.exp.txt'), 'utf8'), 'shared explanation');

  const singletonId = 'academy/endgame/data/queen/eg_KQ-K_L2-007';
  await write(path.join(directory, 'eg_KQ-K_L2-007.solution.txt'), 'singleton existing');
  await write(path.join(directory, 'eg_KQ-K_L2-007.exp.txt'), 'singleton exp');
  await json(path.join(directory, 'eg_KQ-K_L2-007.anno.json'), { description: 'singleton exp', moves });
  assert.equal((await service.loadSolutions({ questionId: singletonId }, options)).solutions[0].number, '001');
  await service.saveSolution({ questionId: singletonId, solutionId: 'eg_KQ-K_L2-007', explanation: '' }, options);
  assert.equal(await fs.readFile(path.join(directory, 'eg_KQ-K_L2-007.solution.txt'), 'utf8'), 'singleton existing');
  await service.saveSolution({ questionId: singletonId, solutionId: 'eg_KQ-K_L2-007', solutionText: '' }, options);
  assert.match(await fs.readFile(path.join(directory, 'eg_KQ-K_L2-007.solution.txt'), 'utf8'), /# END/);

  for (const course of ['tactics', 'mate', 'opening']) {
    const stem = course === 'opening' ? 'eco_C50_L2-001' : course === 'mate' ? 'mate_hookMate_L2-001' : 'tac_fork_L2-001';
    const folder = path.join(dataRoot, course, 'data', 'group');
    const target = course === 'opening' ? path.join(folder, 'C50_L2') : folder;
    await fs.mkdir(target, { recursive: true });
    const entry = { id: stem, fen, solutions: [{ id: stem }] };
    await json(path.join(folder, 'practice-manifest.json'), course === 'mate' ? { items: [entry] } : { categories: [{ key: 'C50_L2', items: [entry] }] });
    await write(path.join(target, stem + '.solution.txt'), course + ' exact');
    const id = course + '/legacy/fen/' + stem + '.fen';
    bank.questions[id] = { fen, solutions: [] };
    await write(bankPath, 'window.ChessQuestionBank = ' + JSON.stringify(bank) + ';');
    const result = await service.loadSolutions({ questionId: id }, options);
    assert.equal(result.solutions[0].text, course + ' exact');
    await service.saveSolution({ questionId: id, solutionId: stem, solutionText: 'saved' }, options);
    assert.match(await fs.readFile(path.join(target, stem + '.solution.txt'), 'utf8'), /saved\n# END/);
  }
  const fallback = await service.loadSolutions({ questionId: fallbackId }, options);
  assert.equal(fallback.readOnly, true);
  assert.deepEqual(fallback.solutions.map(solution => solution.number), ['001', '002']);
  assert.deepEqual(fallback.solutions.map(solution => solution.explanation), ['shared bundle', 'shared bundle']);
  assert.equal(fallback.solutions[0].annotation, null);
  await assert.rejects(service.saveSolution({ questionId: fallbackId, solutionId: fallback.solutions[0].id, solutionText: 'no' }, options), /read-only.*no save path/);
  const previousBankEnv = process.env.ROOT_GENE_BANK_PATH;
  try {
    process.env.ROOT_GENE_BANK_PATH = bankPath;
    assert.equal((await service.loadSolutions({ questionId: fallbackId }, { dataRoot })).readOnly, true);
  } finally {
    if (previousBankEnv === undefined) delete process.env.ROOT_GENE_BANK_PATH;
    else process.env.ROOT_GENE_BANK_PATH = previousBankEnv;
  }
  for (const id of ['../bad', '/endgame/test', 'academy/endgame/../bad', 'academy\\endgame\\bad', 'academy/endgame/data/queen/not-listed', 'endgame/fen/unknown.fen']) {
    await assert.rejects(service.loadSolutions({ questionId: id }, options), error => error.status === 400);
    await assert.rejects(service.saveSolution({ questionId: id, solutionId: 'safe' }, options), error => error.status === 400);
  }
  for (const solutionId of ['../bad', 'bad/name', 'bad\\name', 'kq-k-001-999']) {
    await assert.rejects(service.saveSolution({ questionId, solutionId, solutionText: 'no' }, options), error => error.status === 400);
  }
  await assert.rejects(service.saveSolution({ questionId, solutionId: 'kq-k-001-1', explanation: null }, options), /must be a string/);
  const linked = path.join(dataRoot, 'tactics', 'data', 'linked');
  await fs.symlink(directory, linked, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(service.loadSolutions({ questionId }, options), /Symbolic links/);
  await fs.rm(linked);
  const solutionFile = path.join(directory, 'kq-k-001-1.solution.txt');
  await fs.rm(solutionFile);
  try {
    await fs.symlink(path.join(directory, 'kq-k-001-2.solution.txt'), solutionFile);
    await assert.rejects(service.saveSolution({ questionId, solutionId: 'kq-k-001-1', solutionText: 'unsafe' }, options), /Symbolic links/);
  } catch (error) {
    if (error.code !== 'EPERM') throw error;
    console.log('SKIP: file symlink test needs Windows symlink privileges; directory junction rejection passed.');
  }
  console.log('PASS: solution ordering, isolated metadata fallback/save, preserved moves, legacy course aliases, singleton paths, bundled read-only fallback, BOM/env handling, invalid IDs and symlink rejection.');
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}