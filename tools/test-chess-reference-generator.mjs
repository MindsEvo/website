import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL('../chess/play/assets/question-bank.js', import.meta.url), 'utf8'), context);
vm.runInNewContext(fs.readFileSync(new URL('../chess/settings/reference-generator-core.js', import.meta.url), 'utf8'), context);
const bank = context.window.ChessQuestionBank;
const generator = context.window.ChessReferenceGenerator;

const endgame = generator.collect(bank, 'endgame', 'endgame', 'all', 'all');
const tactics = generator.collect(bank, 'lichess', 'tactics', 'all', 'all');
const mate = generator.collect(bank, 'lichess', 'mate', 'all', 'all');
assert.equal(endgame.length, 256);
assert.equal(tactics.length, 501);
assert.equal(mate.length, 178);
for (const level of ['L1', 'L2', 'L3']) {
  assert.ok(generator.collect(bank, 'endgame', 'endgame', level, 'all').every(item => item.level === level));
  assert.ok(generator.collect(bank, 'lichess', 'tactics', level, 'all').every(item => item.level === level));
  assert.ok(generator.collect(bank, 'lichess', 'mate', level, 'all').every(item => item.level === level));
}
const themes = new Set(tactics.map(item => item.theme));
assert.ok(themes.size > 10);
const filtered = generator.collect(bank, 'lichess', 'tactics', 'L1', '捉双');
assert.ok(filtered.length > 0);
assert.ok(filtered.every(item => item.level === 'L1' && item.theme === '捉双'));
const picked = generator.sample(filtered, 5, () => 0.4);
assert.equal(picked.length, Math.min(5, filtered.length));
assert.equal(new Set(picked.map(item => item.id)).size, picked.length);
assert.equal(generator.sample(filtered, 1000).length, filtered.length);
console.log('PASS: 256 endgame, 501 tactics and 178 mate references; level/theme filters and unique sampling work.');
