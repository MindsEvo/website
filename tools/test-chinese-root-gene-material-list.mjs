import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../chinese-chess/rootgene/rootgene-page.mjs', import.meta.url), 'utf8');
const start = source.indexOf('function showMaterialList(');
const end = source.indexOf('async function loadMaterials(', start);

function createEditor(files = {}) {
  const node = () => ({
    textContent: '', value: '', children: [],
    append(child) { this.children.push(child); },
    replaceChildren() { this.children = []; },
    addEventListener(event, callback) { this[event] = callback; }
  });
  const elements = new Map();
  const context = vm.createContext({
    materialPuzzle: { solutions: [], explanations: [], ...files },
    materialToken: 0, draftMaterialFen: 'draft',
    loadedMaterialFiles: { solution: '', explanation: '' },
    PUZZLE_BANK_BASE: '../bank/',
    materialList: node(), solutionVariant: node(),
    solutionText: node(), explanationText: node(), solutionStatus: node(), explanationStatus: node(),
    document: {
      createElement: node,
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, node());
        return elements.get(id);
      }
    },
    materialDialog: {
      open: false,
      showModal() { this.open = true; },
      close() { this.open = false; }
    },
    cancelEngine() {}, stopRecording() {},
    exitNotationPlayback() {}, updateBoardControls() {},
    audio: { stop() {}, refresh() {} },
    fetch: async url => new Response(`contents of ${url}`)
  });
  vm.runInContext(source.slice(start, end), context);
  return context;
}

test('answer and explanation lists load only the clicked material', async () => {
  const context = createEditor({
    solutions: ['custom/answer-001.txt', 'custom/answer-003.txt'],
    explanations: ['custom/answer_exp-002.txt']
  });
  context.explanationText.value = 'keep explanation';
  context.showMaterialList('solution');
  assert.equal(context.materialDialog.open, true);
  assert.equal(context.materialList.children.length, 2);
  const answer = context.materialList.children[1];
  assert.equal(answer.href, '../bank/custom/answer-003.txt');
  assert.match(answer.textContent, /答案 003/);
  await answer.click({ preventDefault() {} });
  assert.equal(context.solutionText.value, 'contents of ../bank/custom/answer-003.txt');
  assert.equal(context.explanationText.value, 'keep explanation');
  assert.equal(context.solutionVariant.value, '1');
  assert.equal(context.materialDialog.open, false);
  context.showMaterialList('explanation');
  assert.equal(context.materialList.children.length, 1);
  await context.materialList.children[0].click({ preventDefault() {} });
  assert.equal(context.explanationText.value, 'contents of ../bank/custom/answer_exp-002.txt');
  assert.equal(context.solutionText.value, 'contents of ../bank/custom/answer-003.txt');
});

test('empty lists distinguish no selected puzzle from missing files', () => {
  const context = createEditor();
  context.showMaterialList('solution');
  assert.match(context.materialList.children[0].textContent, /暂无已保存的答案/);
  context.materialPuzzle = null;
  context.showMaterialList('explanation');
  assert.match(context.materialList.children[0].textContent, /请先从题库目录载入棋局/);
});

test('load failures keep the dialog and existing text, and show a visible error', async () => {
  const context = createEditor({ solutions: ['missing.txt'] });
  context.solutionText.value = 'keep draft';
  context.fetch = async () => new Response('', { status: 404 });
  context.showMaterialList('solution');
  await context.materialList.children[0].click({ preventDefault() {} });
  assert.equal(context.materialDialog.open, true);
  assert.equal(context.solutionText.value, 'keep draft');
  assert.match(context.document.getElementById('materialListStatus').textContent, /404.*编辑内容已保留/);
});

test('a late response cannot overwrite the newly selected puzzle', async () => {
  const context = createEditor({ solutions: ['slow.txt'] });
  let resolve;
  context.fetch = () => new Promise(done => { resolve = done; });
  context.showMaterialList('solution');
  const pending = context.materialList.children[0].click({ preventDefault() {} });
  context.materialToken += 1;
  context.solutionText.value = 'new puzzle';
  resolve(new Response('old puzzle'));
  await pending;
  assert.equal(context.solutionText.value, 'new puzzle');
});
