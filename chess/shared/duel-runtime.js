import { Chess, DEFAULT_POSITION, validateFen } from './vendor/chess.mjs';
import { analyze as stockfishAnalyze } from './stockfish-client.js';

function position(fen) {
  const validation = validateFen(fen);
  if (!validation.ok) throw new Error(validation.error);
  const chess = new Chess(fen);
  const waitingColor = chess.turn() === 'w' ? 'b' : 'w';
  const king = chess.board().flat().find(piece => piece?.type === 'k' && piece.color === waitingColor);
  if (chess.isAttacked(king.square, chess.turn())) {
    throw new Error('Invalid FEN: non-moving king is in check');
  }
  return chess;
}

export class ChessDuel {
  constructor({ fen = DEFAULT_POSITION, onChange = () => {}, onStatus = () => {}, analyze = stockfishAnalyze } = {}) {
    this._chess = position(fen);
    this._initialFen = fen;
    this._onChange = onChange;
    this._onStatus = onStatus;
    this._analyze = analyze;
    this._mode = 'manual';
    this._playerColor = 'w';
    this._playing = false;
    this._paused = false;
    this._thinking = false;
    this._generation = 0;
    this._timer = null;
    this._queue = Promise.resolve();
    this._emit();
  }

  _result() {
    if (this._chess.isCheckmate()) return { type: 'checkmate', winner: this._chess.turn() === 'w' ? 'b' : 'w' };
    if (this._chess.isStalemate()) return { type: 'stalemate', winner: null };
    if (this._chess.isInsufficientMaterial()) return { type: 'insufficient_material', winner: null };
    if (this._chess.isThreefoldRepetition()) return { type: 'threefold_repetition', winner: null };
    if (this._chess.isDrawByFiftyMoves()) return { type: 'fifty_move', winner: null };
    if (this._chess.isDraw()) return { type: 'draw', winner: null };
    return null;
  }

  snapshot() {
    const legalMoves = this._chess.moves({ verbose: true }).map(({ from, to, promotion, san }) => ({ from, to, promotion, san }));
    const legalSquares = {};
    for (const { from, to } of legalMoves) {
      legalSquares[from] ??= [];
      if (!legalSquares[from].includes(to)) legalSquares[from].push(to);
    }
    return {
      fen: this._chess.fen(),
      board: this._chess.board().map(rank => rank.map(piece => piece ? piece.color + piece.type : null)),
      history: this._chess.history(), mode: this._mode, playerColor: this._playerColor,
      playing: this._playing, thinking: this._thinking, paused: this._paused,
      turn: this._chess.turn(), check: this._chess.isCheck(), result: this._result(),
      legalSquares, legalMoves
    };
  }

  _emit(error = null) {
    if (this._result()) this._playing = false;
    const snapshot = this.snapshot();
    this._onChange(snapshot);
    this._onStatus({ thinking: snapshot.thinking, playing: snapshot.playing, paused: snapshot.paused, result: snapshot.result, error });
    return snapshot;
  }

  _invalidate() {
    this._generation += 1;
    clearTimeout(this._timer);
    this._timer = null;
    this._thinking = false;
  }

  _automatic() {
    return !this._paused && !this._result() && (this._mode === 'ai_ai' && this._playing ||
      this._mode === 'human_ai' && this._chess.turn() !== this._playerColor);
  }

  _schedule() {
    if (!this._automatic() || this._thinking || this._timer !== null) return;
    this._timer = setTimeout(() => {
      this._timer = null;
      this._request(true).catch(() => {});
    }, 0);
  }

  load(fen) {
    const chess = position(fen);
    this._invalidate();
    this._chess = chess;
    this._initialFen = fen;
    this._playing = false;
    this._paused = false;
    const snapshot = this._emit();
    this._schedule();
    return snapshot;
  }

  setMode(mode) {
    if (!['manual', 'human_ai', 'ai_ai'].includes(mode)) throw new Error('Invalid duel mode');
    this._invalidate();
    this._mode = mode;
    this._playing = false;
    this._paused = false;
    const snapshot = this._emit();
    this._schedule();
    return snapshot;
  }

  setPlayerColor(color) {
    if (!['w', 'b'].includes(color)) throw new Error('Invalid player color');
    this._invalidate();
    this._playerColor = color;
    const snapshot = this._emit();
    this._schedule();
    return snapshot;
  }

  pause() {
    this._invalidate();
    this._paused = true;
    this._playing = false;
    return this._emit();
  }

  resume() {
    this._invalidate();
    this._paused = false;
    if (this._mode === 'ai_ai' && !this._result()) this._playing = true;
    const snapshot = this._emit();
    this._schedule();
    return snapshot;
  }

  togglePlay() {
    if (this._mode !== 'ai_ai') throw new Error('togglePlay requires ai_ai mode');
    return this._playing ? this.pause() : this.resume();
  }

  move(from, to, promotion = 'q') {
    if (this._result()) throw new Error('Game is over');
    if (this._thinking || this._playing) throw new Error('AI controls the current move');
    if (this._mode === 'human_ai' && this._chess.turn() !== this._playerColor) throw new Error('Not the human turn');
    this._chess.move({ from, to, promotion });
    this._invalidate();
    const snapshot = this._emit();
    this._schedule();
    return snapshot;
  }

  undo() {
    this._invalidate();
    this._playing = false;
    this._paused = true;
    this._chess.undo();
    return this._emit();
  }

  reset() { return this.load(this._initialFen); }

  step() {
    this.pause();
    return this._request(false);
  }

  _request(automatic) {
    if (this._result()) return Promise.resolve(this.snapshot());
    const generation = this._generation;
    const fen = this._chess.fen();
    this._thinking = true;
    this._emit();
    const request = this._queue.then(async () => {
      if (generation !== this._generation) return this.snapshot();
      try {
        const response = await this._analyze(fen, { movetime: 1000, skillLevel: 20 });
        if (generation !== this._generation) return this.snapshot();
        const uci = typeof response === 'string' ? response : response?.bestMove;
        if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci || '')) throw new Error('Invalid AI bestmove');
        this._chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' });
        this._thinking = false;
        const snapshot = this._emit();
        if (automatic) this._schedule();
        return snapshot;
      } catch (error) {
        if (generation !== this._generation) return this.snapshot();
        this._thinking = false;
        this._playing = false;
        this._paused = true;
        this._emit(error);
        throw error;
      }
    });
    this._queue = request.catch(() => {});
    return request;
  }
}

export const createDuel = options => new ChessDuel(options);