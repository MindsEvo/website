import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createGame, isLegalMove, makeMove, parseFen, toFen } from '../chinese-chess/core.mjs';

const require = createRequire(import.meta.url);
const engine = require('../server/src/pikafishService.js');

const startFen = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';

try {
  const status = engine.getPikafishStatus();
  if (!status.available) {
    console.log('SKIP: Pikafish executable is not installed at the configured path.');
    process.exitCode = 0;
  } else {
    const result = await engine.getPikafishMove({
      fen: startFen,
      side: 'red',
      settings: { threads: 1, hash: 64, depth: 6, movetime: 500, multiPv: 2 }
    });
    assert.ok(result.bestMove, 'Pikafish returns a best move');
    assert.ok(result.move, 'Pikafish move is converted to board coordinates');
    const game = createGame(parseFen(startFen));
    assert.equal(isLegalMove(game, result.move.from, result.move.to), true, `Pikafish move ${result.bestMove} is legal`);
    assert.equal(result.side, 'red');
    assert.equal(makeMove(game, result.move.from, result.move.to), true, 'red move applies to shared rules core');

    const blackResult = await engine.getPikafishMove({
      fen: toFen(game),
      side: 'black',
      settings: { threads: 1, hash: 64, depth: 6, movetime: 500, multiPv: 1 }
    });
    assert.ok(blackResult.bestMove, 'Pikafish returns a reply for black');
    assert.equal(isLegalMove(game, blackResult.move.from, blackResult.move.to), true, `Pikafish move ${blackResult.bestMove} is legal for black`);
    console.log(`PASS: red ${result.bestMove}; black ${blackResult.bestMove}; both legal.`);
  }
} finally {
  engine.stopPikafish();
}
