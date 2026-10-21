import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const storage = new Map();
const context = { window: { navigator: { deviceMemory: 4 } }, localStorage: {
  getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value)
} };
vm.runInNewContext(fs.readFileSync(new URL('../chess/settings/engine-settings.js', import.meta.url), 'utf8'), context);
const settings = context.window.ChessEngineSettings;
assert.equal(settings.saved(), false);
assert.equal(settings.resolve('human').skillLevel, 20);
assert.equal(settings.resolve('white').depth, 25);
assert.equal(settings.resolve('black').threads, 1);
assert.equal(settings.resolve('black').hashMb, 128);
const draft = settings.defaults();
draft.human.level = 2; draft.human.multiPv = 4; draft.human.showWdl = true;
draft.black.level = 7; draft.black.profile = '低配'; draft.black.limitStrength = true;
draft.white.level = 9; draft.white.minThinkTime = 4500;
settings.save(draft);
assert.equal(settings.saved(), true);
assert.equal(settings.resolve('human', 'settings').skillLevel, 4);
assert.equal(settings.resolve('human', 'settings').multiPv, 4);
assert.equal(settings.resolve('black').skillLevel, 15);
assert.equal(settings.resolve('black').hashMb, 64);
assert.equal(settings.resolve('white').movetime, 4500);
assert.equal(settings.resolve('human', 'master').skillLevel, 20);
assert.equal(settings.resolve('human', 'master').multiPv, 4);
context.window.navigator.deviceMemory = 16;
const high = settings.defaults(); high.white.profile = '高性能'; settings.save(high);
assert.equal(settings.resolve('white').hashMb, 512);
for (let level = 0; level <= 10; level++) {
  high.human.level = level; settings.save(high);
  assert.equal(settings.resolve('human').skillLevel, settings.levels[level][1]);
  assert.equal(settings.resolve('human').depth, settings.levels[level][2]);
  assert.equal(settings.resolve('human').elo, settings.levels[level][4]);
}
const commands = settings.commands(settings.resolve('black'));
assert.equal(commands.length, 7);
assert(commands.some(command => command.startsWith('setoption name UCI_Elo value ')));
assert(!commands.some(command => /Threads|Ponder|Contempt|EvalFile|Syzygy|Slow Mover|Chess960/.test(command)));
const prior = JSON.stringify(settings.read());
const invalid = settings.defaults(); invalid.human.multiPv = 11;
assert.throws(() => settings.save(invalid), /范围/);
assert.equal(JSON.stringify(settings.read()), prior);
invalid.human.multiPv = 1; invalid.black.profile = 'bad';
assert.throws(() => settings.save(invalid), /档位/);
invalid.black.profile = '自动'; invalid.white.level = 2.5;
assert.throws(() => settings.save(invalid), /范围/);
context.localStorage.setItem = () => { throw new Error('quota'); };
assert.throws(() => settings.save(settings.defaults()), /quota/);
assert.equal(JSON.stringify(settings.read()), prior);
console.log('PASS: eleven source levels, three independent roles, safe hash scaling, quick presets, seven supported UCI options, invalid values and storage failures.');