import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL('../chess/settings/root-gene-core.js', import.meta.url), 'utf8'), context);
const core = context.window.ChessRootGeneCore;
const fen = 'r3k2r/pp3ppp/8/3pP3/8/8/PP3PPP/R3K2R w KQkq d6 0 1';
const parsed = core.parseFen(fen);
assert.equal(parsed.turn, 'w');
assert.equal(parsed.castling, 'KQkq');
assert.equal(parsed.enPassant, 'd6');
assert.equal(parsed.board.flat().filter(piece => piece === 'K').length, 1);
assert.equal(parsed.board.flat().filter(piece => piece === 'k').length, 1);
assert.equal(core.boardToFen(parsed.board, parsed.turn, parsed.castling, parsed.enPassant), fen.replace(' 0 1', ' 0 1'));
assert.throws(() => core.parseFen('8/8/8/8/8/8/8/8 w - - 0 1'), /白王和黑王/);
assert.throws(() => core.parseFen('8/8/8/8/8/8/8/4Kk2 w - - 0 1'), /不能相邻/);
assert.throws(() => core.parseFen('P7/8/8/8/8/8/8/4K2k w - - 0 1'), /底线/);
assert.throws(() => core.parseFen('8/8/8/8/8/8/8/4K2k w KX - 0 1'), /易位权或吃过路兵格无效/);
assert.throws(() => core.parseFen('44/8/8/8/8/8/8/4K2k w - - 0 1'), /连续出现多个空格数字/);

const localValues = new Map();
const storeContext = {
	window: { ChessQuestionBank: { questions: {} }, dispatchEvent() {} },
	localStorage: {
		getItem(key) { return localValues.get(key) || null; },
		setItem(key, value) { localValues.set(key, String(value)); }
	},
	indexedDB: {},
	Event
};
vm.runInNewContext(fs.readFileSync(new URL('../chess/settings/root-gene-store.js', import.meta.url), 'utf8'), storeContext);
const store = storeContext.window.ChessRootGeneStore;
assert.equal(store.parseName('endgame', 'L1', 'eg_K2B-K_L1-001').id, 'academy/endgame/data/bishop/eg_K2B-K_L1-001');
assert.deepEqual(Array.from(store.parseName('endgame', 'L1', 'eg_KBN-KN_L1-020').directoryParts), ['academy', 'endgame', 'data', 'knight']);
assert.equal(store.parseName('endgame', 'L1', 'eg_KBN-KN_L1-020').relativePath, 'web/chess/academy/endgame/data/knight');
assert.deepEqual(Array.from(store.parseName('endgame', 'L1', 'eg_K2B-K_L1-001').treePath), ['L1 基础', '象', 'K2B vs K · L1', 'eg_K2B-K_L1-001']);
assert.equal(store.parseName('tactics', 'L2', 'tac_fork_L2-005').id, 'academy/tactics/data/groupA/tac_fork_L2-005');
assert.deepEqual(Array.from(store.parseName('tactics', 'L2', 'tac_fork_L2-005').treePath), ['战术A组', '捉双', 'tac_fork_L2-005']);
assert.equal(store.parseName('tactics', 'L1', 'tac_discoveredAttack_L1-004').categoryLabel, '闪击');
assert.equal(store.parseName('mate', 'L1', 'mate_backRankMate_L1-003').subcategory, 'backRankMate');
assert.throws(() => store.parseName('mate', 'L1', 'mate_doubleBishopMate_L1-002'), /尚未出现在 JS 攻杀课程/);
assert.equal(store.parseName('opening', 'L3', 'eco_C50_L3-002').relativePath, 'web/chess/academy/opening/data/ECO_Opening/C50_L3');
assert.deepEqual(Array.from(store.parseName('opening', 'L3', 'eco_C50_L3-002').treePath), ['ECO 开局', 'C50', 'L3 进阶', 'eco_C50_L3-002']);
assert.throws(() => store.parseName('endgame', 'L1', 'eg_K2B-K_L2-001'), /级别/);
assert.throws(() => store.parseName('tactics', 'L1', 'tac_notARealTag_L1-001'), /A-D 组/);
assert.throws(() => store.parseName('mate', 'L1', 'mate_notARealMate_L1-001'), /JS 攻杀课程/);
console.log('PASS: FEN round-trip, root-gene naming/paths, accepted tags, and invalid-position guards.');
