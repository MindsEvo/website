import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const bundle = fileURLToPath(new URL('../chess/play/assets/question-bank.js', import.meta.url));
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(bundle, 'utf8'), context);
const { tree, questions } = context.window.ChessQuestionBank;
assert.equal(tree.length, 6);
const seen = new Set();
function visit(item) {
  assert(!/备份|tactics-bk|mate-bk/.test(item.label));
  if (!item.question) return item.children.forEach(visit);
  assert(!seen.has(item.question), 'Duplicate leaf: ' + item.question);
  seen.add(item.question);
  const question = questions[item.question];
  assert(question, 'Missing question: ' + item.question);
  assert.equal(item.label, question.label);
  const fields = question.fen.split(/\s+/);
  assert.match(fields[1], /^[wb]$/);
  const ranks = fields[0].split('/');
  assert.equal(ranks.length, 8);
  for (const rank of ranks) {
    assert.match(rank, /^[1-8kqrbnpKQRBNP]+$/);
    assert.equal([...rank].reduce((sum, symbol) => sum + (/[1-8]/.test(symbol) ? Number(symbol) : 1), 0), 8);
  }
  if (process.argv[2]) {
    const source = path.join(process.argv[2], 'question_bank/data', question.id);
    assert.equal(question.fen, fs.readFileSync(source, 'utf8').replace(/^\uFEFF/, '').trim());
  }
}
tree.forEach(visit);
assert.equal(seen.size, Object.keys(questions).length);
console.log('PASS: ' + seen.size + ' unique positions, six root categories, no backups, valid FEN and complete tree references.');