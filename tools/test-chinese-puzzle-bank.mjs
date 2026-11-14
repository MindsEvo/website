import test from 'node:test';
import assert from 'node:assert/strict';
import { groupEndgameEntries, loadPuzzleBank, pairedExplanation, renderPuzzleBank } from '../chinese-chess/shared/puzzle-bank.mjs';

test('classified endgames join existing level and piece groups without duplicating leaves', () => {
  const cannon = { key: 'endgame/L2/cannon', family: 'endgame', level: 'L2', label: '炮类', items: [{ id: 'eg_旧题_L2-001' }] };
  const custom = { key: 'endgame/L2/custom', family: 'endgame', level: 'L2', items: [] };
  const item = { id: 'eg_双炮臣压君_L2-001' };
  const entries = [
    { category: custom, item, entry: { family: 'endgame', group: '炮', category: '双炮杀王' } },
    { category: custom, item, entry: { family: 'endgame', group: '炮', category: '炮兵杀王' } },
    { category: custom, item, entry: { family: 'endgame', group: '马', category: '马炮杀王' } }
  ];
  const groups = groupEndgameEntries([cannon], entries, 'L2');
  assert.deepEqual(groups.map(group => [group.label, group.records.map(record => record.item.id)]), [
    ['马类', [item.id]], ['炮类', ['eg_旧题_L2-001', item.id]]
  ]);
  assert.equal(groups[1].records[1].category, custom);
  assert.deepEqual(groupEndgameEntries([cannon], entries, 'L1'), []);
  const withoutExisting = groupEndgameEntries([], entries.slice(0, 1), 'L2');
  assert.equal(withoutExisting[0].label, '炮类');
  assert.equal(withoutExisting[0].records[0].item, item);
});

test('attack classifications render in teaching group and method alongside existing puzzles', () => {
  class Element {
    constructor(tag) { this.tagName = tag; this.children = []; this.dataset = {}; this.textContent = ''; }
    append(...children) { this.children.push(...children); }
    setAttribute() {}
    addEventListener(type, handler) { if (type === 'click') this.click = handler; }
    querySelector(selector) { return selector === 'summary' ? this.children.find(child => child.tagName === 'summary') : null; }
  }
  const originalDocument = globalThis.document;
  globalThis.document = { createElement: tag => new Element(tag) };
  try {
    const original = { id: 'at_重炮_L1-001', title: '重炮' };
    const item = { id: 'eg_新棋_L2-001', title: '新棋', classifications: [
      { family: 'attacking', group: '双子协同', category: '重炮' },
      { family: 'attacking', group: '双子协同', category: '马后炮' }
    ] };
    const source = { key: 'attacking/L1/cannon', family: 'attacking', level: 'L1', items: [original] };
    const custom = { key: 'endgame/L2/custom', family: 'endgame', level: 'L2', items: [item] };
    const container = new Element('div');
    let selected;
    renderPuzzleBank(container, { categories: [source, custom] }, '', '', (category, puzzle) => { selected = [category, puzzle]; });
    const find = (element, text) => element.children.find(child => child.querySelector?.('summary')?.textContent.startsWith(text));
    const family = find(container, '攻杀基因');
    const group = find(family, '双子协同');
    const cannon = find(group, '重炮');
    const horse = find(group, '马后炮');
    assert.ok(cannon && horse);
    assert.deepEqual(cannon.children.filter(child => child.dataset.puzzleId).map(child => child.dataset.puzzleId), [original.id, item.id]);
    assert.equal(horse.children.find(child => child.dataset.puzzleId).dataset.puzzleId, item.id);
    cannon.children.find(child => child.dataset.puzzleId === item.id).click();
    assert.equal(selected[1], item);
    assert.equal(selected[0].key, custom.key);
    assert.equal(family.children.some(child => child.querySelector?.('summary')?.textContent.includes('→')), false);
  } finally { globalThis.document = originalDocument; }
});

test('classified endgame, tactics and opening use their teaching categories', () => {
  class Element {
    constructor(tag) { this.tagName = tag; this.children = []; this.dataset = {}; this.textContent = ''; }
    append(...children) { this.children.push(...children); }
    setAttribute() {}
    addEventListener() {}
    querySelector(selector) { return selector === 'summary' ? this.children.find(child => child.tagName === 'summary') : null; }
  }
  const originalDocument = globalThis.document;
  globalThis.document = { createElement: tag => new Element(tag) };
  try {
    const item = { id: 'eg_新棋_L2-001', title: '新棋', classifications: [
      { family: 'endgame', group: '炮', category: '双炮杀王' },
      { family: 'tactics', group: '空间控制战术', category: '困毙' },
      { family: 'opening', group: '先手主流开局', category: '中炮对屏风马' }
    ] };
    const manifest = { categories: [
      { key: 'endgame/L2/custom', family: 'endgame', level: 'L2', items: [item] },
      { key: 'opening/L1/other', family: 'opening', level: 'L1', items: [
        { id: 'oc_待定中炮对屏风马棋局_L1-003', title: '原题' },
        { id: 'oc_弃车十三招_L1-002', title: '弃车十三招' }
      ] }
    ] };
    const container = new Element('div');
    renderPuzzleBank(container, manifest, '', '', () => {});
    const find = (element, text) => element.children.find(child => child.querySelector?.('summary')?.textContent.startsWith(text));
    const paths = [
      ['残局基因', 'L2 组合', '炮类', '双炮杀王'],
      ['战术基因', '空间控制战术', '困毙'],
      ['开局基因', '先手主流开局', '中炮类', '中炮对屏风马']
    ];
    for (const path of paths) {
      const branch = path.reduce((parent, name) => find(parent, name), container);
      assert.ok(branch?.children.some(child => child.dataset.puzzleId === item.id), path.join(' → '));
    }
  } finally { globalThis.document = originalDocument; }
});

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
