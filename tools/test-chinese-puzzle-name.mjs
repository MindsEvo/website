import assert from 'node:assert/strict';
import { parsePuzzleName } from '../chinese-chess/rootgene/puzzle-name.mjs';

assert.deepEqual(parsePuzzleName(' 双炮臣压君 ', 'eg', 'L2'), { title: '双炮臣压君', id: '' });
assert.deepEqual(parsePuzzleName('eg_双炮臣压君_L2-001', 'eg', 'L2'), {
  title: '双炮臣压君', id: 'eg_双炮臣压君_L2-001'
});
assert.throws(() => parsePuzzleName('at_双炮臣压君_L2-001', 'eg', 'L2'), /前缀和级别/);
assert.throws(() => parsePuzzleName('eg_双炮臣压君_L1-001', 'eg', 'L2'), /前缀和级别/);
assert.throws(() => parsePuzzleName('eg_双炮臣压君_L2-1', 'eg', 'L2'), /完整编号/);
assert.throws(() => parsePuzzleName('../escape', 'eg', 'L2'), /完整编号/);
assert.deepEqual(parsePuzzleName('已有名称 · 特例', 'eg', 'L2', '已有名称 · 特例'), {
  title: '已有名称 · 特例', id: ''
});
