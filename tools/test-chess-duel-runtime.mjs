import assert from 'node:assert/strict';
import { Chess, DEFAULT_POSITION } from '../chess/shared/vendor/chess.mjs';
import { ChessDuel } from '../chess/shared/duel-runtime.js';
import { StockfishClient, ENGINE_URL } from '../chess/shared/stockfish-client.js';

function deferred() {
	let resolve;
	let reject;
	const promise = new Promise((success, failure) => { resolve = success; reject = failure; });
	return { promise, resolve, reject };
}

function controlled() {
	const requests = [];
	const waiters = [];
	let active = 0;
	let maximumActive = 0;
	const runtime = new ChessDuel({
		analyze: fen => {
			const pending = deferred();
			active += 1;
			maximumActive = Math.max(maximumActive, active);
			requests.push({ fen, ...pending });
			for (const waiter of waiters.splice(0)) waiter();
			return pending.promise.finally(() => { active -= 1; });
		}
	});
	const request = async index => {
		while (requests.length <= index) await new Promise(resolve => waiters.push(resolve));
		return requests[index];
	};
	return { runtime, requests, request, maximumActive: () => maximumActive };
}

const settle = () => new Promise(resolve => setImmediate(resolve));
const passed = [];
async function test(name, check) {
	await check();
	passed.push(name);
	console.log(`PASS: ${name}`);
}

const duel = new ChessDuel({ analyze: async () => ({ bestMove: 'e7e5' }) });
assert.equal(duel.snapshot().board[6][4], 'wp');
assert.deepEqual(duel.snapshot().legalSquares.e2, ['e3', 'e4']);
duel.move('e2', 'e4');
const before = duel.snapshot();
duel.setMode('ai_ai');
assert.equal(duel.snapshot().fen, before.fen);
assert.deepEqual(duel.snapshot().history, ['e4']);
assert.equal(duel.snapshot().playing, false);
await duel.step();
assert.deepEqual(duel.snapshot().history, ['e4', 'e5']);
assert.equal(duel.snapshot().playing, false);
duel.undo();
assert.equal(duel.snapshot().fen, before.fen);
assert.throws(() => duel.load('4k3/8/8/8/8/8/4R3/4K3 w - - 0 1'), /non-moving king/);
assert.equal(duel.snapshot().fen, before.fen);
duel.load(DEFAULT_POSITION);
assert.throws(() => duel.move('e2', 'e5'));
const reference = new Chess();
reference.move('e4');
duel.move('e2', 'e4');
assert.equal(duel.snapshot().fen, reference.fen());
console.log('Duel runtime core legality, continuity, one-step AI and invalid FEN: PASS');

await test('AI-AI alternates, mode selection stays idle, pause drops replies, resume continues', async () => {
	const { runtime, requests, request, maximumActive } = controlled();
	runtime.setMode('ai_ai');
	await settle();
	assert.equal(requests.length, 0);
	runtime.togglePlay();
	const first = await request(0);
	assert.equal(first.fen.split(' ')[1], 'w');
	first.resolve({ bestMove: 'e2e4' });
	const second = await request(1);
	assert.equal(second.fen.split(' ')[1], 'b');
	second.resolve('e7e5');
	const third = await request(2);
	const pausedFen = runtime.snapshot().fen;
	runtime.togglePlay();
	assert.equal(runtime.snapshot().thinking, false);
	third.resolve('g1f3');
	await settle();
	assert.equal(runtime.snapshot().fen, pausedFen);
	runtime.togglePlay();
	const resumed = await request(3);
	assert.equal(resumed.fen, pausedFen);
	resumed.resolve('g1f3');
	const last = await request(4);
	runtime.pause();
	last.resolve('b8c6');
	await settle();
	assert.deepEqual(runtime.snapshot().history, ['e4', 'e5', 'Nf3']);
	assert.equal(maximumActive(), 1);
});

await test('human-AI supports white and black, pauses and one-step control', async () => {
	for (const color of ['w', 'b']) {
		const { runtime, request } = controlled();
		runtime.setPlayerColor(color);
		runtime.setMode('human_ai');
		if (color === 'w') runtime.move('e2', 'e4');
		const reply = await request(0);
		assert.notEqual(reply.fen.split(' ')[1], color);
		reply.resolve(color === 'w' ? 'e7e5' : 'e2e4');
		await settle();
		assert.equal(runtime.snapshot().turn, color);
		assert.throws(() => runtime.togglePlay(), /ai_ai/);
		runtime.pause();
		runtime.move(color === 'w' ? 'g1' : 'e7', color === 'w' ? 'f3' : 'e5');
		assert.equal(runtime.snapshot().thinking, false);
		runtime.resume();
		const next = await request(1);
		runtime.pause();
		next.resolve(color === 'w' ? 'b8c6' : 'g1f3');
		await settle();
		const history = runtime.snapshot().history.length;
		const stepping = runtime.step();
		const stepRequest = await request(2);
		stepRequest.resolve(color === 'w' ? 'b8c6' : 'g1f3');
		await stepping;
		assert.equal(runtime.snapshot().history.length, history + 1);
		assert.equal(runtime.snapshot().paused, true);
		assert.equal(runtime.snapshot().playing, false);
	}
});

await test('mode, color, load, reset and undo invalidate in-flight responses', async () => {
	for (const action of ['mode', 'color', 'load', 'reset', 'undo']) {
		const { runtime, request } = controlled();
		runtime.move('e2', 'e4');
		const pending = runtime.step();
		const stale = await request(0);
		if (action === 'mode') runtime.setMode('ai_ai');
		if (action === 'color') runtime.setPlayerColor('b');
		if (action === 'load') runtime.load('4k3/8/8/8/8/8/P7/4K3 w - - 0 1');
		if (action === 'reset') runtime.reset();
		if (action === 'undo') runtime.undo();
		const expected = runtime.snapshot();
		stale.resolve('e7e5');
		await pending;
		assert.equal(runtime.snapshot().fen, expected.fen, action);
		assert.deepEqual(runtime.snapshot().history, expected.history, action);
		assert.equal(runtime.snapshot().thinking, false, action);
	}
});

await test('rapid steps serialize injected analysis and discard older completion', async () => {
	const { runtime, request, maximumActive } = controlled();
	const firstStep = runtime.step();
	const first = await request(0);
	const secondStep = runtime.step();
	first.resolve('e2e4');
	await firstStep;
	const second = await request(1);
	assert.equal(second.fen, DEFAULT_POSITION);
	second.resolve('d2d4');
	await secondStep;
	assert.deepEqual(runtime.snapshot().history, ['d4']);
	assert.equal(maximumActive(), 1);
});

await test('castling and en-passant undo restore exact FEN, reset uses latest load', async () => {
	const runtime = new ChessDuel();
	for (const [fen, from, to, san] of [
		['r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 7 12', 'e1', 'g1', 'O-O'],
		['4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 10', 'e5', 'd6', 'exd6']
	]) {
		runtime.load(fen);
		assert.equal(runtime.snapshot().fen, fen);
		runtime.move(from, to);
		assert.deepEqual(runtime.snapshot().history, [san]);
		if (san === 'O-O') {
			assert.equal(runtime.snapshot().board[7][5], 'wr');
			assert.equal(runtime.snapshot().board[7][7], null);
		} else assert.equal(runtime.snapshot().board[3][3], null);
		runtime.undo();
		assert.equal(runtime.snapshot().fen, fen);
		runtime.move(from, to);
		runtime.reset();
		assert.equal(runtime.snapshot().fen, fen);
		assert.deepEqual(runtime.snapshot().history, []);
	}
});

await test('promotion, illegal king safety, checkmate, stalemate and standard draws', async () => {
	const runtime = new ChessDuel();
	runtime.load('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
	runtime.move('a7', 'a8');
	assert.equal(runtime.snapshot().board[0][0], 'wq');
	runtime.reset();
	runtime.move('a7', 'a8', 'n');
	assert.equal(runtime.snapshot().board[0][0], 'wn');
	runtime.load('4k3/8/8/8/8/8/4r3/4K3 w - - 0 1');
	assert.equal(runtime.snapshot().check, true);
	assert.throws(() => runtime.move('e1', 'd2'));
	assert.throws(() => runtime.load('8/8/8/8/8/8/4k3/4K3 w - - 0 1'), /non-moving king/);
	runtime.load(DEFAULT_POSITION);
	for (const [from, to] of [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']]) runtime.move(from, to);
	assert.deepEqual(runtime.snapshot().result, { type: 'checkmate', winner: 'b' });
	assert.throws(() => runtime.move('e1', 'f2'), /over/);
	const mateFen = runtime.snapshot().fen;
	await runtime.step();
	assert.equal(runtime.snapshot().fen, mateFen);
	runtime.load('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
	assert.equal(runtime.snapshot().result.type, 'stalemate');
	runtime.load('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
	assert.equal(runtime.snapshot().result.type, 'insufficient_material');
	runtime.load('4k3/8/8/8/8/8/R7/4K3 w - - 100 1');
	assert.equal(runtime.snapshot().result.type, 'fifty_move');
	runtime.load(DEFAULT_POSITION);
	for (let cycle = 0; cycle < 2; cycle += 1) {
		for (const [from, to] of [['g1', 'f3'], ['g8', 'f6'], ['f3', 'g1'], ['f6', 'g8']]) runtime.move(from, to);
	}
	assert.equal(runtime.snapshot().result.type, 'threefold_repetition');
	runtime.undo();
	assert.equal(runtime.snapshot().result, null);
});

await test('bad AI replies report errors without mutation and remain retryable', async () => {
	const errors = [];
	let bestMove = 'e2e5';
	const runtime = new ChessDuel({ analyze: async () => ({ bestMove }), onStatus: status => {
		if (status.error) errors.push(status.error);
	} });
	await assert.rejects(runtime.step(), /Invalid move/);
	assert.equal(runtime.snapshot().fen, DEFAULT_POSITION);
	assert.equal(runtime.snapshot().thinking, false);
	bestMove = null;
	await assert.rejects(runtime.step(), /bestmove/);
	bestMove = 'e2e4';
	await runtime.step();
	assert.deepEqual(runtime.snapshot().history, ['e4']);
	assert.equal(errors.length, 2);
	const snapshot = runtime.snapshot();
	snapshot.board[0][0] = 'wp';
	snapshot.history.push('bogus');
	snapshot.legalSquares.e7.push('e1');
	assert.equal(runtime.snapshot().board[0][0], 'br');
	assert.deepEqual(runtime.snapshot().history, ['e4']);
	assert.equal(runtime.snapshot().legalSquares.e7.includes('e1'), false);
});

class FakeWorker {
	constructor(search, stop = worker => worker.emit('bestmove a2a3')) {
		this.listeners = new Map();
		this.commands = [];
		this.search = search;
		this.stop = stop;
		this.terminated = false;
	}
	addEventListener(type, listener) {
		if (!this.listeners.has(type)) this.listeners.set(type, new Set());
		this.listeners.get(type).add(listener);
	}
	removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
	emit(data, type = 'message') {
		for (const listener of [...(this.listeners.get(type) || [])]) listener({ data, message: data });
	}
	postMessage(command) {
		this.commands.push(command);
		if (command === 'uci') this.emit('uciok');
		if (command === 'isready') this.emit('readyok');
		if (command.startsWith('go ')) this.search(this);
		if (command === 'stop') this.stop(this);
	}
	terminate() { this.terminated = true; }
}

await test('Stockfish singleton URL, synchronous handshake listeners, queue and settings', async () => {
	assert.equal(ENGINE_URL.pathname.endsWith('/chess/play/assets/engine/stockfish-19-lite-single.js'), true);
	const started = deferred();
	let searches = 0;
	let factories = 0;
	const worker = new FakeWorker(() => { searches += 1; started.resolve(); });
	const client = new StockfishClient({ workerFactory: () => { factories += 1; return worker; } });
	const first = client.analyze(DEFAULT_POSITION, { movetime: 15, depth: 8, skillLevel: 12 });
	const second = client.analyze(DEFAULT_POSITION);
	await started.promise;
	assert.equal(searches, 1);
	assert.equal(worker.commands.includes('go movetime 15 depth 8'), true);
	assert.equal(worker.commands.includes('setoption name Skill Level value 12'), true);
	worker.emit('info depth 8 score cp 23 pv e2e4\nbestmove e2e4 ponder e7e5');
	assert.equal((await first).ponder, 'e7e5');
	await settle();
	assert.equal(searches, 2);
	worker.emit('bestmove (none)');
	assert.equal((await second).bestMove, null);
	assert.equal(factories, 1);
	assert.equal(worker.commands.filter(command => command === 'uci').length, 1);
	assert.equal(worker.listeners.get('message').size, 0);
	client.resetWorker();
});

await test('Stockfish timeout sends stop, drains or terminates, and prevents contamination', async () => {
	for (const drains of [true, false]) {
		const workers = [];
		const client = new StockfishClient({
			searchTimeout: 5, drainTimeout: 5,
			workerFactory: () => {
				const worker = workers.length === 0
					? new FakeWorker(() => {}, drains ? worker => worker.emit('bestmove a2a3') : () => {})
					: new FakeWorker(worker => worker.emit('bestmove e2e4'));
				workers.push(worker);
				return worker;
			}
		});
		const failed = client.analyze(DEFAULT_POSITION);
		const next = client.analyze(DEFAULT_POSITION);
		await assert.rejects(failed, /timeout/);
		assert.equal((await next).bestMove, 'e2e4');
		assert.equal(workers[0].commands.includes('stop'), true);
		assert.equal(workers[0].terminated, true);
		workers[0].emit('bestmove h2h4');
		assert.equal(workers.length, 2);
		client.resetWorker();
	}
});

await test('Stockfish worker errors reject pending requests and allow fresh workers', async () => {
	let factories = 0;
	const client = new StockfishClient({ workerFactory: () => {
		factories += 1;
		return new FakeWorker(worker => worker.emit(factories === 1 ? 'broken worker' : 'bestmove 0000', factories === 1 ? 'error' : 'message'));
	} });
	await assert.rejects(client.analyze(DEFAULT_POSITION), /broken worker/);
	assert.equal((await client.analyze(DEFAULT_POSITION)).bestMove, null);
	assert.equal(factories, 2);
	client.resetWorker();
});

console.log(`PASS: ${passed.length} focused duel runtime and Stockfish client groups`);