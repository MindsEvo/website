import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createGame, toFen } from '../chinese-chess/core.mjs';

const require = createRequire(import.meta.url);
const { persistCustomPuzzle, replacePuzzle, suggestPuzzleId, savePuzzleClassification, savePuzzleMaterial, deleteCustomPuzzle } = require('../server/src/chineseChessRootGeneService.js');
const INITIAL_FEN = 'rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR r - - 0 1';
const UPDATED_FEN = 'rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR b - - 0 1';

async function withBank(run) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xiangqi-root-gene-'));
  try {
    const bank = path.join(root, 'bank');
    const bankRoot = path.join(bank, 'endgame', 'L1');
    await fs.mkdir(bankRoot, { recursive: true });
    await fs.writeFile(path.join(bank, 'manifest.json'), JSON.stringify({ categories: [] }));
    await fs.writeFile(path.join(bankRoot, 'manifest.json'), JSON.stringify({ version: 1, categories: [{ key: 'rook', label: '车类', items: [] }] }));
    await run(bankRoot);
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

test('equivalent FEN encoding preserves existing materials', async () => {
    await withBank(async bankRoot => {
      const id = 'eg_CUSTOM_L1-001';
      await persistCustomPuzzle({ id, title: '旧局面', fen: INITIAL_FEN }, { bankRoot });
      await savePuzzleMaterial({ id, kind: 'solution', version: 1, text: '1. 炮二平五' }, { bankRoot });
      const equivalent = INITIAL_FEN.replace(/h/g, 'n').replace(/e/g, 'b').replace(/H/g, 'N').replace(/E/g, 'B').replace(' r ', ' w ');
      const result = await persistCustomPuzzle({ id, title: '旧局面', fen: equivalent, updateExisting: true }, { bankRoot });
      assert.equal(result.item.solutions.length, 1);
      assert.match(await fs.readFile(path.join(bankRoot, 'custom', id, `${id}-001.txt`), 'utf8'), /炮二平五/);
  });
});

test('accepts the editor core FEN with standard knight and elephant codes', async () => {
    await withBank(async bankRoot => {
      const fen = toFen(createGame());
      const saved = await persistCustomPuzzle({ id: 'at_CUSTOM_L2-001', title: '标准棋子', fen }, { bankRoot });
      assert.equal(saved.fen, fen);
      const metadata = JSON.parse(await fs.readFile(path.join(bankRoot, 'custom', saved.id, `${saved.id}.json`), 'utf8'));
      assert.equal(metadata.pieces.H, 2);
      assert.equal(metadata.pieces.E, 2);
      assert.equal(metadata.pieces.h, 2);
      assert.equal(metadata.pieces.e, 2);
      await assert.rejects(() => persistCustomPuzzle({
        id: 'at_CUSTOM_L2-002', title: '超量', fen: fen.replace('1c5c1', '1c2n2c1')
      }, { bankRoot }), /数量不能超过/);
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

test('all three root types and levels persist, update materials and delete independently', async () => {
    await withBank(async bankRoot => {
      const savedIds = [];
      for (const [prefix, type] of [['eg', 'endgame'], ['at', 'attacking'], ['tac', 'tactics']]) {
        for (const level of ['L1', 'L2', 'L3']) {
          const id = `${prefix}_CUSTOM_${level}-001`;
          const saved = await persistCustomPuzzle({ id, title: `${type} ${level}`, fen: INITIAL_FEN, confirmedDuplicateIds: savedIds }, { bankRoot });
          savedIds.push(id);
          const metadata = JSON.parse(await fs.readFile(path.join(bankRoot, 'custom', id, `${id}.json`), 'utf8'));
          assert.equal(metadata.type, type);
          assert.equal(metadata.difficulty, level);
          assert.equal(saved.item.type, type);
          assert.equal(saved.item.difficulty, level);
          await savePuzzleMaterial({ id, kind: 'solution', version: 1, text: '1. 炮二平五' }, { bankRoot });
          await savePuzzleMaterial({ id, kind: 'explanation', version: 1, text: '解说。' }, { bankRoot });
        }
      }
      let manifest = JSON.parse(await fs.readFile(path.join(bankRoot, 'manifest.json'), 'utf8'));
      assert.equal(manifest.categories.find(category => category.key === 'custom').items.length, 9);
      for (const id of ['at_CUSTOM_L2-001', 'tac_CUSTOM_L3-001']) {
        await persistCustomPuzzle({ id, title: '更新', fen: UPDATED_FEN, updateExisting: true }, { bankRoot });
        await deleteCustomPuzzle({ id }, { bankRoot });
      }
      manifest = JSON.parse(await fs.readFile(path.join(bankRoot, 'manifest.json'), 'utf8'));
      assert.equal(manifest.categories.find(category => category.key === 'custom').items.length, 7);
      for (const id of ['eg_CUSTOM_L4-001', 'at_CUSTOM_L1-1', 'tac_CUSTOM_L0-001', 'other_CUSTOM_L1-001']) {
        await assert.rejects(() => persistCustomPuzzle({ id, title: '无效', fen: INITIAL_FEN }, { bankRoot }), /编号必须符合/);
      }
    });
});

test('requires confirmation of every exact duplicate and fails closed on missing FEN', async () => {
    await withBank(async bankRoot => {
      const bank = path.resolve(bankRoot, '../..');
      await fs.writeFile(path.join(bank, 'original.fen'), INITIAL_FEN);
      await fs.writeFile(path.join(bank, 'manifest.json'), JSON.stringify({
        categories: [{ items: [{ id: 'original', fen: 'original.fen' }] }]
      }));
      const input = { id: 'eg_CUSTOM_L1-001', title: '重复局面', fen: INITIAL_FEN };
      await assert.rejects(() => persistCustomPuzzle(input, { bankRoot }), /未确认的相同局面.*original/);
      const aliases = INITIAL_FEN.replace(/h/g, 'n').replace(/e/g, 'b').replace(/H/g, 'N').replace(/E/g, 'B').replace(' r ', ' w ');
      await assert.rejects(() => persistCustomPuzzle({ ...input, fen: aliases }, { bankRoot }), /未确认的相同局面.*original/);
      await persistCustomPuzzle({ id: 'at_CUSTOM_L1-001', title: '另一方走棋', fen: UPDATED_FEN }, { bankRoot });
      await persistCustomPuzzle({ ...input, confirmedDuplicateIds: ['original'] }, { bankRoot });
      await assert.rejects(() => persistCustomPuzzle({ id: 'tac_CUSTOM_L1-001', title: '新局面', fen: INITIAL_FEN, confirmedDuplicateIds: ['original'] }, { bankRoot }), /未确认的相同局面.*eg_CUSTOM_L1-001/);
      await persistCustomPuzzle({ ...input, updateExisting: true, confirmedDuplicateIds: ['original'] }, { bankRoot });
      await fs.rm(path.join(bank, 'original.fen'));
      await assert.rejects(() => persistCustomPuzzle({ ...input, updateExisting: true, confirmedDuplicateIds: ['original'] }, { bankRoot }), /读取或解析棋局 original 失败/);
    });
});

test('persists classifications on custom and original puzzles without changing materials', async () => {
    await withBank(async bankRoot => {
      const bank = path.resolve(bankRoot, '../..');
      const original = { id: 'original', fen: 'original.fen', solutions: ['answer.txt'], title: '原题' };
      const mainFile = path.join(bank, 'manifest.json');
      await fs.writeFile(mainFile, JSON.stringify({ categories: [{ family: 'tactics', items: [original] }] }));
      await fs.writeFile(path.join(bank, 'original.fen'), UPDATED_FEN);
      const input = {
        classifications: [
          { family: 'tactics', group: '空间控制战术', category: '困毙' },
          { family: 'attacking', group: '双子协同', category: '重炮' }
        ],
        lessonSections: ['observation']
      };
      const custom = await persistCustomPuzzle({
        id: 'tac_CUSTOM_L2-001', title: '测试', fen: INITIAL_FEN, ...input
      }, { bankRoot });
      assert.deepEqual(custom.item.classifications, input.classifications);
      await savePuzzleClassification({ id: 'original', ...input }, { bankRoot });
      const saved = JSON.parse(await fs.readFile(mainFile, 'utf8')).categories[0].items[0];
      assert.deepEqual(saved, { ...original, ...input });
      await savePuzzleClassification({ id: custom.id, ...input, lessonSections: ['practice'] }, { bankRoot });
      const stored = JSON.parse(await fs.readFile(path.join(bankRoot, 'manifest.json'), 'utf8'));
      assert.deepEqual(stored.categories.find(category => category.key === 'custom').items[0].lessonSections, ['practice']);
      await assert.rejects(() => savePuzzleClassification({ id: 'original', ...input, classifications: [{ family: 'tactics', group: '错误', category: '困毙' }] }, { bankRoot }), /有效/);
      await assert.rejects(() => savePuzzleClassification({ id: 'original', ...input, lessonSections: [] }, { bankRoot }), /展示入口/);
      await assert.rejects(() => savePuzzleClassification({ id: 'missing', ...input }, { bankRoot }), /不存在/);
    });
});

test('persists Chinese-named positions and rejects IDs already in the main bank', async () => {
    await withBank(async bankRoot => {
      const bank = path.resolve(bankRoot, '../..');
      await fs.writeFile(path.join(bank, 'manifest.json'), JSON.stringify({ categories: [
        { items: [{ id: 'eg_双炮臣压君_L2-001', fen: 'original.fen' }] }
      ] }));
      await fs.writeFile(path.join(bank, 'original.fen'), UPDATED_FEN);
      const input = {
        id: 'eg_双炮臣压君_L2-001', title: '双炮臣压君', fen: INITIAL_FEN,
        classifications: [{ family: 'endgame', group: '炮', category: '双炮杀王' }],
        lessonSections: ['practice']
      };
      await assert.rejects(() => persistCustomPuzzle(input, { bankRoot }), /原题库/);
      const saved = await persistCustomPuzzle({ ...input, id: 'eg_双炮臣压君_L2-002' }, { bankRoot });
      assert.equal(saved.item.title, '双炮臣压君');
      assert.deepEqual(saved.item.classifications, input.classifications);
      await savePuzzleMaterial({ id: saved.id, kind: 'solution', version: 1, text: '1. 炮二平五' }, { bankRoot });
      assert.match(await fs.readFile(path.join(bankRoot, 'custom', saved.id, `${saved.id}-001.txt`), 'utf8'), /炮二平五/);
  });
});

  test('replaces one custom duplicate and preserves all material and the original files', async () => {
    await withBank(async bankRoot => {
      const old = 'eg_CUSTOM_L2-001';
      const other = 'at_CUSTOM_L2-001';
      const id = 'eg_双炮臣压君_L2-001';
      await persistCustomPuzzle({ id: old, title: '旧棋局', fen: INITIAL_FEN }, { bankRoot });
      await savePuzzleMaterial({ id: old, kind: 'solution', version: 2, text: '1. 炮二平五' }, { bankRoot });
      await savePuzzleMaterial({ id: old, kind: 'explanation', version: 2, text: '解说。' }, { bankRoot });
      await persistCustomPuzzle({ id: other, title: '另一局', fen: INITIAL_FEN, confirmedDuplicateIds: [old] }, { bankRoot });
      const input = {
        id, title: '双炮臣压君', fen: INITIAL_FEN, replaceId: old, expectedTitle: '旧棋局',
        classifications: [{ family: 'endgame', group: '炮', category: '双炮杀王' }],
        lessonSections: ['practice']
      };
      await assert.rejects(() => replacePuzzle({ ...input, expectedTitle: '已过期' }, { bankRoot }), /变化/);
      await assert.rejects(() => replacePuzzle({ ...input, fen: UPDATED_FEN }, { bankRoot }), /局面或行棋方已变化/);
      await assert.rejects(() => replacePuzzle({ ...input, id: other }, { bankRoot }), /主分类类型|已存在/);
      await replacePuzzle(input, { bankRoot });
      const manifest = JSON.parse(await fs.readFile(path.join(bankRoot, 'manifest.json'), 'utf8'));
      const items = manifest.categories.find(category => category.key === 'custom').items;
      assert.deepEqual(items.map(item => item.id), [id, other]);
      assert.deepEqual(items[0].previousIds, [old]);
      assert.match(await fs.readFile(path.join(bankRoot, items[0].solutions[0]), 'utf8'), /炮二平五/);
      assert.match(await fs.readFile(path.join(bankRoot, items[0].explanations[0]), 'utf8'), /解说/);
      await fs.access(path.join(bankRoot, 'custom', old, `${old}-002.txt`));
      const metadata = JSON.parse(await fs.readFile(path.join(bankRoot, items[0].metadata), 'utf8'));
      assert.equal(metadata.id, id);
      await savePuzzleMaterial({ id, kind: 'solution', version: 3, text: '新答案' }, { bankRoot });
    });
  });

  test('replaces an original entry without altering its source and retains other records', async () => {
    await withBank(async bankRoot => {
      const bank = path.resolve(bankRoot, '../..');
      const mainFile = path.join(bank, 'manifest.json');
      const old = 'oc_待定中炮对屏风马棋局_L1-003';
      const id = 'tac_新棋局_L2-001';
      await fs.writeFile(path.join(bank, 'old.fen'), INITIAL_FEN);
      await fs.writeFile(path.join(bank, 'old.txt'), '棋谱');
      await fs.writeFile(path.join(bank, 'old.json'), JSON.stringify({ geneId: old, displayInfo: { chineseName: '旧原题' }, metadata: {} }));
      await fs.writeFile(mainFile, JSON.stringify({ categories: [{ family: 'opening', items: [
        { id: old, title: '旧原题', fen: 'old.fen', metadata: 'old.json', solutions: ['old.txt'], explanations: [], pgn: [] }
      ] }] }));
      const input = {
        id, title: '新棋局', fen: INITIAL_FEN, replaceId: old, expectedTitle: '旧原题',
        classifications: [{ family: 'tactics', group: '空间控制战术', category: '困毙' }], lessonSections: ['practice']
      };
      await replacePuzzle(input, { bankRoot });
      const item = JSON.parse(await fs.readFile(mainFile, 'utf8')).categories[0].items[0];
      assert.equal(item.id, id);
      assert.deepEqual(item.previousIds, [old]);
      assert.equal(item.solutions[0], 'old.txt');
      assert.equal(await fs.readFile(path.join(bank, item.solutions[0]), 'utf8'), '棋谱');
      assert.equal(JSON.parse(await fs.readFile(path.join(bank, item.metadata), 'utf8')).geneId, id);
      assert.equal(JSON.parse(await fs.readFile(path.join(bank, 'old.json'), 'utf8')).geneId, old);
      const { selectOpeningPuzzles } = await import('../chinese-chess/academy/opening/opening-catalog.mjs');
      const manifest = JSON.parse(await fs.readFile(mainFile, 'utf8'));
      assert.deepEqual(selectOpeningPuzzles(manifest, '中炮对屏风马'), []);
    });
  });

  test('does not change the manifest when material migration fails or the destination exists', async () => {
    await withBank(async bankRoot => {
      const old = 'eg_CUSTOM_L2-001';
      const id = 'eg_双炮臣压君_L2-001';
      await persistCustomPuzzle({ id: old, title: '旧棋局', fen: INITIAL_FEN }, { bankRoot });
      const input = {
        id, title: '双炮臣压君', fen: INITIAL_FEN, replaceId: old, expectedTitle: '旧棋局',
        classifications: [{ family: 'endgame', group: '炮', category: '双炮杀王' }], lessonSections: ['practice']
      };
      const manifestFile = path.join(bankRoot, 'manifest.json');
      const before = await fs.readFile(manifestFile, 'utf8');
      const metadataPath = path.join(bankRoot, 'custom', old, `${old}.json`);
      const metadata = await fs.readFile(metadataPath);
      await fs.rm(metadataPath);
      await assert.rejects(() => replacePuzzle(input, { bankRoot }), /材料无法读取/);
      assert.equal(await fs.readFile(manifestFile, 'utf8'), before);
      await assert.rejects(() => fs.access(path.join(bankRoot, 'custom', id)));
      await fs.writeFile(metadataPath, '{invalid');
      await assert.rejects(() => replacePuzzle(input, { bankRoot }), /JSON|property name|Unexpected/);
      assert.equal(await fs.readFile(manifestFile, 'utf8'), before);
      await assert.rejects(() => fs.access(path.join(bankRoot, 'custom', id)));
      await fs.writeFile(metadataPath, metadata);
      await fs.mkdir(path.join(bankRoot, 'custom', id));
      await assert.rejects(() => replacePuzzle(input, { bankRoot }), /目录已存在/);
      assert.equal(await fs.readFile(manifestFile, 'utf8'), before);
    });
  });

test('generates the next free ID including retained backup directories', async () => {
    await withBank(async bankRoot => {
      const stem = 'eg_双炮臣压君_L2-';
      await persistCustomPuzzle({ id: `${stem}001`, title: '双炮臣压君', fen: INITIAL_FEN }, { bankRoot });
      await fs.mkdir(path.join(bankRoot, 'custom', `${stem}002`));
      await assert.rejects(() => persistCustomPuzzle({ id: `${stem}002`, title: '双炮臣压君', fen: INITIAL_FEN, confirmedDuplicateIds: [`${stem}001`] }, { bankRoot }), /目录已存在/);
      const bank = path.resolve(bankRoot, '../..');
      await fs.mkdir(path.join(bank, 'rootgene-replacements', `${stem}003`), { recursive: true });
      await fs.writeFile(path.join(bank, 'manifest.json'), JSON.stringify({ categories: [
        { items: [{ id: 'at_原题_L1-001', previousIds: [`${stem}004`] }] }
      ] }));
      assert.equal((await suggestPuzzleId({ stem }, { bankRoot })).id, `${stem}005`);
      await assert.rejects(() => persistCustomPuzzle({ id: `${stem}004`, title: '双炮臣压君', fen: INITIAL_FEN }, { bankRoot }), /追溯/);
      await assert.rejects(() => suggestPuzzleId({ stem: '../bad-' }, { bankRoot }), /无效/);
    });
});
