import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const storage = new Map();
let changes = 0;
const context = {
  window: { dispatchEvent() { changes++; } }, Event: class {},
  localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) }
};
for (const relative of ['../chess/play/assets/question-bank.js', '../chess/play/bank-store.js']) {
  vm.runInNewContext(fs.readFileSync(new URL(relative, import.meta.url), 'utf8'), context);
}
const bank = context.window.ChessQuestionBank;
const store = context.window.ChessBankStore;
const stats = store.statistics();
assert.equal(stats.total, bank.records.length);
assert.equal(Object.values(stats.counts).reduce((sum, count) => sum + count, 0), stats.total);
assert.equal(stats.groups.reduce((sum, group) => sum + group.count, 0), stats.total);
assert.equal(new Set(bank.records.map(record => record.id)).size, stats.total);
for (const group of stats.groups) {
  const criteria = { category: group.category, difficulty: group.difficulty, subcategory: group.subcategory, count: 10 };
  const result = store.sample(criteria);
  assert.equal(result.length, Math.min(10, group.count));
  assert.equal(new Set(result.map(record => record.id)).size, result.length);
  assert(result.every(record => record.category === group.category && record.subcategory === group.subcategory && record.difficulty === group.difficulty));
}
assert.equal(store.sample({ category: 'missing', difficulty: 'L1', count: 3 }).length, 0);
const selected = store.sample({ category: 'endgame', difficulty: 'L1', count: 3 });
store.save(selected.map(record => record.id));
assert.equal(JSON.stringify(store.read()), JSON.stringify(selected.map(record => record.id)));
store.save([]);
assert.equal(store.read().length, 0);
assert.equal(changes, 2);
context.localStorage.getItem = () => '{invalid';
assert.equal(store.read().length, 0);
context.localStorage.setItem = () => { throw new Error('Storage unavailable'); };
assert.throws(() => store.save(selected.map(record => record.id)), /Storage unavailable/);
console.log('PASS: ' + stats.total + ' JSON records; all ' + stats.groups.length + ' category/difficulty filters; unique random picks; persistence, clear, corrupt and unavailable storage.');