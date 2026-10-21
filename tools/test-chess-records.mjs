import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';

const storage = new Map();
const context = { window: { crypto: { randomUUID }, dispatchEvent() {} }, Event: class {},
  localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) } };
for (const file of ['../chess/play/assets/question-bank.js', '../chess/records/store.js']) {
  vm.runInNewContext(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), context);
}
const store = context.window.ChessRecords;
const bank = context.window.ChessQuestionBank;
assert.equal(store.read().users.length, 3);
assert.equal(store.summary('1').total, 0);
const question = bank.records.find(item => item.question && item.category === 'tactics' && item.difficulty === 'L2');
const activityId = store.begin(question.question);
store.update(activityId, { saved: true, moves: [{ notation: 'test' }], completed: true, timeSpent: 12 });
assert.equal(store.summary('1').total, 1);
assert.equal(store.summary('1').categories.tactics.L2, 1);
assert.equal(store.read().activities[0].moves.length, 1);
store.update(activityId, { moves: [], completed: false });
assert.equal(store.read().activities[0].moves.length, 0);
assert.equal(store.summary('1').total, 1);
store.switchUser('2');
assert.equal(store.summary('2').total, 0);
const battleId = store.begin(null, '8/8/8/8/8/8/8/8 w - - 0 1');
assert.equal(store.read().activities.find(item => item.id === battleId).category, 'comprehensive');
assert.equal(store.summary('2').total, 1);
assert.equal(store.summary('1').total, 1);
const users = store.read().users;
users[1].name = 'Learner'; users[1].avatar = 'b'; store.updateUsers(users);
assert.equal(store.read().users[1].name, 'Learner');
assert.equal(store.read().users[1].avatar, 'b');
assert.throws(() => store.switchUser('missing'), /用户/);
users[0].name = ' '; assert.throws(() => store.updateUsers(users), /用户名/);
assert.equal(store.read().users[0].name, '用户1');
store.saveRecommendations('intelligent', [question.id, question.id]);
store.saveRecommendations('manual', [Object.keys(bank.questions)[0]]);
assert.equal(store.recommendations('intelligent').length, 1);
store.saveRecommendations('intelligent', []);
assert.equal(store.recommendations('intelligent').length, 0);
assert.equal(store.recommendations('manual').length, 1);
assert.throws(() => store.recommendations('missing'), /模式/);

const key = 'cognichess:learning-records:v1';
const data = store.read();
const now = new Date('2026-10-20T12:00:00Z');
data.activities = [0, 7, 8, 30, 31].map((days, index) => ({
  id: String(index), userId: '1', timestamp: new Date(now - days * 86400000).toISOString(), category: 'endgame', difficulty: 'L1'
}));
storage.set(key, JSON.stringify(data));
const summary = store.summary('1', now);
assert.equal(summary.week, 2);
assert.equal(summary.month, 4);
assert.equal(summary.total, 5);
assert.equal(store.trend('1', 'week', now).length, 7);
assert.equal(store.trend('1', 'month', now).length, 30);
assert.equal(store.trend('2', 'month', now).reduce((sum, day) => sum + day.count, 0), 0);
storage.set(key, '{broken');
assert.throws(() => store.read(), /损坏/);
assert.throws(() => store.switchUser('1'), /损坏/);
assert.equal(storage.get(key), '{broken');
storage.delete(key);
context.localStorage.setItem = () => { throw new Error('quota'); };
assert.throws(() => store.begin(question.question), /quota/);
console.log('PASS: user isolation, activity updates without double counting, free-play classification, avatars, rolling time boundaries, trends, separate recommendation modes and storage failure preservation.');