import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createGame, toFen } from '../chinese-chess/core.mjs';

const require = createRequire(import.meta.url);
const {
  persistCustomPuzzle, replacePuzzle, suggestPuzzleId, savePuzzleClassification,
  savePuzzleMaterial, deleteCustomPuzzle, getClassificationCatalog, updateClassificationCatalog
} = require('../server/src/chineseChessRootGeneService.js');
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

test('source puzzles support position, name and level updates while preserving materials and ID history', async () => {
  await withBank(async bankRoot => {
    const bank = path.resolve(bankRoot, '../..');
    await fs.mkdir(path.join(bank, 'source'));
    const oldId = 'eg_旧名称_L1-001';
    const item = { id: oldId, title: '旧名称', fen: 'source/position.fen', metadata: 'source/metadata.json',
      solutions: ['source/answer.txt'], explanations: ['source/explanation.txt'], classificationPending: true };
    const mainFile = path.join(bank, 'manifest.json');
    await fs.writeFile(mainFile, JSON.stringify({ categories: [{ key: 'source', items: [item] }] }));
    await fs.writeFile(path.join(bankRoot, 'manifest.json'), JSON.stringify({
      categories: [{ key: 'rook', items: [{ ...item, fen: '../../source/position.fen' }] }]
    }));
    await fs.writeFile(path.join(bank, item.fen), INITIAL_FEN);
    await fs.writeFile(path.join(bank, item.metadata), JSON.stringify({
      geneId: oldId, displayInfo: { chineseName: '旧名称' },
      metadata: { difficulty: 'L1', sequence: 1 }, cultural: { context: '保留资料' }
    }));
    await fs.writeFile(path.join(bank, item.solutions[0]), '原棋谱');
    await fs.writeFile(path.join(bank, item.explanations[0]), '原解说');
    const input = {
      updateSourceId: oldId, expectedTitle: '旧名称', expectedFen: INITIAL_FEN,
      id: 'eg_新名称_L2-001', title: '新名称', fen: UPDATED_FEN,
      classifications: [{ family: 'endgame', group: '兵卒', category: '单兵对王' }],
      lessonSections: ['practice']
    };
    const originalManifest = await fs.readFile(mainFile, 'utf8');
    await assert.rejects(() => persistCustomPuzzle({ ...input, expectedTitle: '过期名称' }, { bankRoot }), /名称已变化/);
    await assert.rejects(() => persistCustomPuzzle({ ...input, expectedFen: UPDATED_FEN }, { bankRoot }), /局面已变化/);
    assert.equal(await fs.readFile(mainFile, 'utf8'), originalManifest);
    assert.equal(await fs.readFile(path.join(bank, item.fen), 'utf8'), INITIAL_FEN);
    const metadataBefore = await fs.readFile(path.join(bank, item.metadata), 'utf8');
    const localBefore = await fs.readFile(path.join(bankRoot, 'manifest.json'), 'utf8');
    const rename = fs.rename;
    let injectedFailure = false;
    fs.rename = async (from, to) => {
      if (to === mainFile && !injectedFailure) {
        injectedFailure = true;
        throw new Error('injected manifest write failure');
      }
      return rename(from, to);
    };
    try {
      await assert.rejects(() => persistCustomPuzzle(input, { bankRoot }), /injected manifest write failure/);
    } finally {
      fs.rename = rename;
    }
    assert.equal(injectedFailure, true);
    assert.equal(await fs.readFile(mainFile, 'utf8'), originalManifest);
    assert.equal(await fs.readFile(path.join(bank, item.fen), 'utf8'), INITIAL_FEN);
    assert.equal(await fs.readFile(path.join(bank, item.metadata), 'utf8'), metadataBefore);
    assert.equal(await fs.readFile(path.join(bankRoot, 'manifest.json'), 'utf8'), localBefore);
    const result = await persistCustomPuzzle(input, { bankRoot });
    assert.equal(result.source, true);
    assert.equal(result.item.id, input.id);
    assert.deepEqual(result.item.previousIds, [oldId]);
    assert.deepEqual(result.item.solutions, item.solutions);
    assert.deepEqual(result.item.explanations, item.explanations);
    assert.equal(result.item.classificationPending, undefined);
    assert.equal(await fs.readFile(path.join(bank, item.fen), 'utf8'), `${UPDATED_FEN}\n`);
    assert.equal(await fs.readFile(path.join(bank, item.solutions[0]), 'utf8'), '原棋谱');
    assert.equal(await fs.readFile(path.join(bank, item.explanations[0]), 'utf8'), '原解说');
    const metadata = JSON.parse(await fs.readFile(path.join(bank, item.metadata), 'utf8'));
    assert.equal(metadata.geneId, input.id);
    assert.equal(metadata.displayInfo.chineseName, '新名称');
    assert.equal(metadata.metadata.difficulty, 'L2');
    assert.equal(metadata.cultural.context, '保留资料');
    const main = JSON.parse(await fs.readFile(mainFile, 'utf8'));
    assert.equal(main.categories[0].items.length, 1);
    assert.equal(main.categories[0].items[0].id, input.id);
    const local = JSON.parse(await fs.readFile(path.join(bankRoot, 'manifest.json'), 'utf8'));
    assert.equal(local.categories[0].items[0].id, input.id);
    assert.equal(local.categories[0].items[0].fen, '../../source/position.fen');
    await assert.rejects(() => persistCustomPuzzle({
      ...input, updateSourceId: input.id, expectedTitle: input.title, expectedFen: UPDATED_FEN, id: oldId
    }, { bankRoot }), /保留用于追溯/);
    await persistCustomPuzzle({
      ...input, updateSourceId: input.id, expectedTitle: input.title, expectedFen: UPDATED_FEN, title: '再次改进'
    }, { bankRoot });
    const material = await savePuzzleMaterial({
      id: input.id, kind: 'solution', version: 1, filename: 'answer.txt', text: '改进棋谱'
    }, { bankRoot });
    assert.equal(material.bankRelativePath, 'source/answer.txt');
    assert.match(await fs.readFile(path.join(bank, 'source/answer.txt'), 'utf8'), /改进棋谱/);
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

test('named materials overwrite or save as new on both manual and source puzzles', async () => {
  await withBank(async bankRoot => {
    const bank = path.resolve(bankRoot, '../..');
    const id = 'eg_CUSTOM_L1-001';
    await persistCustomPuzzle({ id, title: '编辑材料', fen: INITIAL_FEN }, { bankRoot });
    for (const kind of ['solution', 'explanation']) {
      const filename = `${kind}_手工编号12.txt`;
      const first = await savePuzzleMaterial({ id, kind, version: 12, filename, text: 'first' }, { bankRoot });
      await savePuzzleMaterial({ id, kind, version: 12, filename, text: 'updated' }, { bankRoot });
      assert.match(await fs.readFile(path.join(bankRoot, first.relativePath), 'utf8'), /updated/);
      await savePuzzleMaterial({ id, kind, version: 13, filename: `${kind}_13.txt`, text: 'new' }, { bankRoot });
    }
    const custom = JSON.parse(await fs.readFile(path.join(bankRoot, 'manifest.json'), 'utf8'))
      .categories.find(category => category.key === 'custom').items[0];
    assert.equal(custom.solutions.length, 2);
    assert.equal(custom.explanations.length, 2);
    await fs.mkdir(path.join(bank, 'source'), { recursive: true });
    await fs.writeFile(path.join(bank, 'source', 'answer-1.txt'), 'old');
    await fs.writeFile(path.join(bank, 'manifest.json'), JSON.stringify({ categories: [{
      key: 'endgame/L1/rook', items: [{ id: 'eg_SOURCE_L1-001', fen: 'source/position.fen',
        solutions: ['source/answer-1.txt'], explanations: [] }]
    }] }));
    const result = await savePuzzleMaterial({ id: 'eg_SOURCE_L1-001', kind: 'solution',
      version: 1, filename: 'answer-1.txt', text: 'corrected' }, { bankRoot });
    assert.equal(result.bankRelativePath, 'source/answer-1.txt');
    assert.match(await fs.readFile(path.join(bank, result.bankRelativePath), 'utf8'), /corrected/);
    await savePuzzleMaterial({ id: 'eg_SOURCE_L1-001', kind: 'explanation',
      version: 1, filename: '说明_1.txt', text: '解说' }, { bankRoot });
    await assert.rejects(() => savePuzzleMaterial({ id, kind: 'solution',
      version: 1, filename: '../escape.txt', text: 'bad' }, { bankRoot }), /文件名/);
    await assert.rejects(() => savePuzzleMaterial({ id: 'eg_SOURCE_L1-001', kind: 'explanation',
      version: 1, filename: 'answer-1.txt', text: 'bad' }, { bankRoot }), /不属于当前材料列表/);
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
      const original = {
        id: 'original', fen: 'original.fen', metadata: 'original.json', solutions: ['answer.txt'], title: '原题',
        classifications: [{ family: 'attacking', group: '待定', category: '待定' }],
        classificationPending: true
      };
      const mainFile = path.join(bank, 'manifest.json');
      await fs.writeFile(mainFile, JSON.stringify({ categories: [{ family: 'tactics', items: [original] }] }));
      await fs.writeFile(path.join(bank, 'original.fen'), UPDATED_FEN);
      await fs.writeFile(path.join(bank, 'original.json'), JSON.stringify({ classificationPending: true }));
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
      assert.deepEqual(custom.item.classifications, input.classifications.slice(0, 2));
      await savePuzzleClassification({ id: 'original', ...input }, { bankRoot });
      const saved = JSON.parse(await fs.readFile(mainFile, 'utf8')).categories[0].items[0];
      const expectedOriginal = {
        ...original,
        classifications: input.classifications.slice(0, 2),
        lessonSections: input.lessonSections
      };
      delete expectedOriginal.classificationPending;
      assert.deepEqual(saved, expectedOriginal);
      assert.equal(saved.classificationPending, undefined);
      assert.equal(JSON.parse(await fs.readFile(path.join(bank, 'original.json'), 'utf8')).classificationPending, undefined);
      const customManifestFile = path.join(bankRoot, 'manifest.json');
      const customManifest = JSON.parse(await fs.readFile(customManifestFile, 'utf8'));
      const customItem = customManifest.categories.find(category => category.key === 'custom').items[0];
      customItem.classificationPending = true;
      await fs.writeFile(customManifestFile, JSON.stringify(customManifest));
      const customMetadataFile = path.join(bankRoot, customItem.metadata);
      const customMetadata = JSON.parse(await fs.readFile(customMetadataFile, 'utf8'));
      customMetadata.classificationPending = true;
      await fs.writeFile(customMetadataFile, JSON.stringify(customMetadata));
      await savePuzzleClassification({ id: custom.id, ...input, lessonSections: ['practice'] }, { bankRoot });
      const stored = JSON.parse(await fs.readFile(customManifestFile, 'utf8'));
      const savedCustom = stored.categories.find(category => category.key === 'custom').items[0];
      assert.deepEqual(savedCustom.lessonSections, ['practice']);
      assert.deepEqual(savedCustom.classifications, input.classifications.slice(0, 2));
      assert.equal(savedCustom.classificationPending, undefined);
      assert.equal(JSON.parse(await fs.readFile(customMetadataFile, 'utf8')).classificationPending, undefined);
      await assert.rejects(() => savePuzzleClassification({ id: 'original', ...input, classifications: [{ family: 'tactics', group: '错误', category: '困毙' }] }, { bankRoot }), /有效/);
      await assert.rejects(() => savePuzzleClassification({ id: 'original', ...input, lessonSections: [] }, { bankRoot }), /展示入口/);
      await assert.rejects(() => savePuzzleClassification({ id: 'missing', ...input }, { bankRoot }), /不存在/);
    });
});

test('manages extensible classifications and protects associated puzzle links', async () => {
  await withBank(async bankRoot => {
    const bank = path.resolve(bankRoot, '../..');
    const { groups } = await getClassificationCatalog({ bankRoot });
    assert.equal(Object.values(groups).some(family => family['待定']), false);
    await updateClassificationCatalog({
      action: 'add-group', family: 'attacking', group: '多子协同', category: '车马炮与帅配合'
    }, { bankRoot });
    const classification = {
      classifications: [{ family: 'attacking', group: '多子协同', category: '车马炮与帅配合' }],
      lessonSections: ['observation']
    };
    const saved = await persistCustomPuzzle({
      id: 'at_TEST_L1-001', title: '多子协同局面', fen: INITIAL_FEN, ...classification
    }, { bankRoot });
    assert.deepEqual(saved.item.classifications, classification.classifications);
    await assert.rejects(() => updateClassificationCatalog({
      action: 'delete-category', family: 'attacking', group: '多子协同', category: '车马炮与帅配合'
    }, { bankRoot }), /仍关联 1 个棋局/);
    await updateClassificationCatalog({
      action: 'rename-category', family: 'attacking', group: '多子协同',
      category: '车马炮与帅配合', name: '车马炮帅多子协同'
    }, { bankRoot });
    const renamedManifest = JSON.parse(await fs.readFile(path.join(bankRoot, 'manifest.json'), 'utf8'));
    const renamedItem = renamedManifest.categories.find(category => category.key === 'custom').items[0];
    assert.equal(renamedItem.classifications[0].category, '车马炮帅多子协同');
    await savePuzzleClassification({
      id: saved.id,
      classifications: [{ family: 'attacking', group: '组合进攻', category: '大刀剜心' }],
      lessonSections: ['observation']
    }, { bankRoot });
    await updateClassificationCatalog({
      action: 'delete-category', family: 'attacking', group: '多子协同', category: '车马炮帅多子协同'
    }, { bankRoot });
    await updateClassificationCatalog({
      action: 'delete-group', family: 'attacking', group: '多子协同'
    }, { bankRoot });
    assert.equal((await getClassificationCatalog({ bankRoot })).groups.attacking['多子协同'], undefined);
    const mainManifest = JSON.parse(await fs.readFile(path.join(bank, 'manifest.json'), 'utf8'));
    assert.equal(mainManifest.categories.length, 0);
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
      assert.equal((await suggestPuzzleId({ stem: 'eg_双炮臣压君_L1-' }, { bankRoot })).id, 'eg_双炮臣压君_L1-001');
      await assert.rejects(() => persistCustomPuzzle({ id: `${stem}004`, title: '双炮臣压君', fen: INITIAL_FEN }, { bankRoot }), /追溯/);
      await assert.rejects(() => suggestPuzzleId({ stem: '../bad-' }, { bankRoot }), /无效/);
    });
});
