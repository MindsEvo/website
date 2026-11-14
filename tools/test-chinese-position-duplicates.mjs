import assert from 'node:assert/strict';
import { findPositionDuplicates } from '../chinese-chess/shared/position-duplicates.mjs';
import { readFile } from 'node:fs/promises';

const fen = '3aka3/9/9/8C/2h6/9/9/4C4/9/4K4 r - - 0 1';
const files = {
  a: '3aka3/9/9/8C/2n6/9/9/4C4/9/4K4 w - - 5 20',
  b: '3aka3/9/9/8C/2h6/9/9/4C4/9/4K4 b - - 0 1'
};
const manifest = { categories: [{ family: 'tactics', items: [{ id: 'a', fen: 'a' }, { id: 'b', fen: 'b' }] }] };
const matches = await findPositionDuplicates(fen, manifest, async file => files[file]);
assert.deepEqual(matches.map(match => [match.item.id, match.exact]), [['a', true], ['b', false]]);
assert.deepEqual((await findPositionDuplicates(fen, manifest, async file => files[file], 'a')).map(m => m.item.id), ['b']);
await assert.rejects(findPositionDuplicates(fen, manifest, async () => { throw new Error('文件缺失'); }), /文件缺失/);
await assert.rejects(findPositionDuplicates('坏 w', manifest, async file => files[file]), /棋盘布局/);
await assert.rejects(findPositionDuplicates(fen, manifest, async () => '坏 w'), /棋盘布局/);
const repeatedManifest = { categories: [...manifest.categories, { items: [{ id: 'a', fen: 'a' }] }] };
assert.equal((await findPositionDuplicates(fen, repeatedManifest, async file => files[file])).length, 2);

const bank = new URL('../chinese-chess/bank/', import.meta.url);
const realManifest = JSON.parse(await readFile(new URL('manifest.json', bank), 'utf8'));
const realFen = '2e2k3/5c3/c8/9/9/9/9/3C5/9/1C2K4 w - - 0 1';
const readBankFen = file => readFile(new URL(file, bank), 'utf8');
const realMatches = await findPositionDuplicates(realFen, realManifest, readBankFen);
assert.ok(realMatches.some(match => match.item.id === 'eg_待定双炮对双炮_L2-001' && match.exact));
const otherTurn = await findPositionDuplicates(realFen.replace(' w ', ' b '), realManifest, readBankFen);
assert.ok(otherTurn.some(match => match.item.id === 'eg_待定双炮对双炮_L2-001' && !match.exact));
const differentBoard = await findPositionDuplicates(realFen.replace('3C5', '4C4'), realManifest, readBankFen);
assert.ok(!differentBoard.some(match => match.item.id === 'eg_待定双炮对双炮_L2-001'));
