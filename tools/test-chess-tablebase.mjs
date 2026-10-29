import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../chess/play/tablebase.js', import.meta.url), 'utf8');
const fen = '8/8/8/8/8/8/4K3/6k1 w - - 0 1';
let calls = 0;
const context = {
  window: {
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: async url => {
      calls++;
      assert(url.startsWith('https://tablebase.lichess.ovh/standard?fen='));
      return { ok: true, json: async () => ({ category: 'draw', dtz: 0, dtm: 0, moves: [
        { uci: 'e2d2', san: 'Kd2', category: 'draw', dtz: 0 },
        { uci: 'e2d1', san: 'Kd1', category: 'draw', dtz: 0 },
        { uci: 'e2e1', san: 'Ke1', category: 'draw', dtz: 0 },
        { uci: 'e2f1', san: 'Kf1', category: 'draw', dtz: 0 }
      ] }) };
    }
  }
};
vm.runInNewContext(source, context);
const tablebase = context.window.ChessTablebase;

assert.equal(tablebase.isEligible(fen), true);
assert.equal(tablebase.isEligible('4k3/8/8/8/8/8/4K3/8 w KQ - 0 1'), false);
assert.equal(tablebase.isEligible('4k3/8/8/8/8/8/4K3/8 w - e3 0 1'), false);
assert.equal(tablebase.isEligible('4k3/8/8/8/8/8/4K3/QQQQQQQ1 w - - 0 1'), false);
const result = await tablebase.probe(fen);
assert.equal(result.bestMove, 'e2d2');
assert.equal(result.source, 'tablebase');
assert.equal(result.multipv.length, 3);
assert.deepEqual(JSON.parse(JSON.stringify(result.multipv.map(line => line.pv[0]))), ['e2d2', 'e2d1', 'e2e1']);
assert.deepEqual(JSON.parse(JSON.stringify(result.multipv.map(line => line.san))), ['Kd2', 'Kd1', 'Ke1']);
assert.equal(result.multipv[0].tablebase.dtz, 0);
assert.deepEqual(JSON.parse(JSON.stringify(result.tablebase)), { category: 'draw', dtz: 0, dtm: 0 });
assert.equal((await tablebase.probe(fen)).bestMove, 'e2d2');
assert.equal(calls, 1, 'successful exact-FEN results should be cached');
assert.equal(await tablebase.probe('4k3/8/8/8/8/8/4K3/8 w KQ - 0 1'), null);
assert.equal(calls, 1, 'ineligible positions should not make a network request');

context.window.fetch = async () => ({ ok: false, json: async () => ({}) });
assert.equal(await tablebase.probe('8/8/8/8/8/8/4K3/6k1 b - - 0 1'), null);
context.window.fetch = async () => { throw new Error('offline'); };
assert.equal(await tablebase.probe('8/8/8/8/8/8/4K3/6k1 w - - 1 1'), null);
console.log('PASS: eligibility filters, API hit shape, successful-result cache, and unavailable API fallback.');