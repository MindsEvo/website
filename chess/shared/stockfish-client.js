export const ENGINE_URL = new URL('../play/assets/engine/stockfish-19-lite-single.js', import.meta.url);

function integer(value, fallback, minimum, maximum) {
  return Number.isFinite(Number(value)) && value != null
    ? Math.max(minimum, Math.min(maximum, Math.floor(Number(value)))) : fallback;
}

export class StockfishClient {
  constructor({ workerFactory = () => new Worker(ENGINE_URL), readyTimeout = 10000, searchTimeout = null, drainTimeout = 2000 } = {}) {
    this.workerFactory = workerFactory;
    this.readyTimeout = readyTimeout;
    this.searchTimeout = searchTimeout;
    this.drainTimeout = drainTimeout;
    this.worker = null;
    this.ready = false;
    this.queue = Promise.resolve();
  }

  analyze(fen, options = {}) {
    const request = this.queue.then(() => this.search(fen, options));
    this.queue = request.catch(() => {});
    return request;
  }

  resetWorker() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
  }

  exchange(commands, accept, timeout, drain = false) {
    const worker = this.worker;
    return new Promise((resolve, reject) => {
      let timedOut = false;
      let timer;
      const cleanup = () => {
        clearTimeout(timer);
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
      };
      const finish = (error, value) => {
        cleanup();
        if (error) reject(error);
        else resolve(value);
      };
      const onError = event => finish(new Error(event.message || 'Stockfish worker failed'));
      const onMessage = event => {
        for (const line of String(event.data).split(/\r?\n/)) {
          const value = accept(line.trim());
          if (value !== undefined) {
            finish(timedOut ? new Error('Stockfish search timeout') : null, value);
            return;
          }
        }
      };
      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      timer = setTimeout(() => {
        if (!drain) {
          finish(new Error('Stockfish ready timeout'));
          return;
        }
        timedOut = true;
        timer = setTimeout(() => {
          this.resetWorker();
          finish(new Error('Stockfish search timeout; worker reset'));
        }, this.drainTimeout);
        try { worker.postMessage('stop'); } catch (error) { finish(error); }
      }, timeout);
      try {
        for (const command of commands) worker.postMessage(command);
      } catch (error) { finish(error); }
    });
  }

  async search(fen, options) {
    if (typeof fen !== 'string' || /[\r\n]/.test(fen)) throw new Error('Invalid engine FEN');
    const movetime = integer(options.movetime, 1000, 1, 60000);
    const depth = integer(options.depth, null, 1, 128);
    const skillLevel = integer(options.skillLevel, 20, 0, 20);
    try {
      if (!this.worker) this.worker = this.workerFactory();
      if (!this.ready) {
        await this.exchange(['uci'], line => line === 'uciok' ? true : undefined, this.readyTimeout);
        this.ready = true;
      }
      await this.exchange([
        `setoption name Skill Level value ${skillLevel}`,
        'setoption name MultiPV value 1',
        'setoption name UCI_LimitStrength value false',
        'isready'
      ], line => line === 'readyok' ? true : undefined, this.readyTimeout);
      let info = null;
      return await this.exchange([
        `position fen ${fen}`,
        `go movetime ${movetime}${depth === null ? '' : ` depth ${depth}`}`
      ], line => {
        if (line.startsWith('info ')) info = line;
        const match = /^bestmove\s+(\S+)(?:\s+ponder\s+(\S+))?/.exec(line);
        if (!match) return undefined;
        return {
          fen, bestMove: ['(none)', '0000'].includes(match[1]) ? null : match[1],
          ponder: match[2] || null, info
        };
      }, this.searchTimeout ?? movetime + 10000, true);
    } catch (error) {
      this.resetWorker();
      throw error;
    }
  }
}

const client = new StockfishClient();
export const analyze = (fen, options) => client.analyze(fen, options);