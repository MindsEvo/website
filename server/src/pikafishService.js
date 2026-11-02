const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

const DEFAULT_ENGINE_PATH = path.resolve(__dirname, '../../../../chinese_chess/engine/binaries/pikafish/pikafish.exe');
const ENGINE_PATH = path.resolve(process.env.MINDSEVO_PIKAFISH_PATH || DEFAULT_ENGINE_PATH);
const DEFAULT_NNUE_PATH = path.join(path.dirname(ENGINE_PATH), 'pikafish.nnue');
const NNUE_PATH = process.env.MINDSEVO_PIKAFISH_NNUE_PATH || DEFAULT_NNUE_PATH;

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.trunc(number))) : fallback;
}

function validateFen(fen) {
  const value = String(fen || '').trim();
  if (!value || value.length > 200 || /[^1-9rnbakcpRNBKACP/ wb\d-]/.test(value)) {
    throw new Error('Invalid Xiangqi FEN.');
  }
  const fields = value.split(/\s+/);
  if (fields.length < 2 || !/^[wb]$/.test(fields[1])) throw new Error('FEN must include side to move (w or b).');
  const ranks = fields[0].split('/');
  if (ranks.length !== 10) throw new Error('Xiangqi FEN must contain 10 ranks.');
  for (const rank of ranks) {
    let files = 0;
    for (const char of rank) files += /^[1-9]$/.test(char) ? Number(char) : 1;
    if (files !== 9) throw new Error('Each Xiangqi FEN rank must contain 9 files.');
  }
  return value;
}

function parseInfoLine(line) {
  const parts = line.trim().split(/\s+/);
  const info = { raw: line };
  for (let index = 1; index < parts.length; index += 1) {
    const token = parts[index];
    if (['depth', 'seldepth', 'nodes', 'time', 'multipv'].includes(token) && parts[index + 1]) {
      info[token] = Number(parts[++index]);
    } else if (token === 'score' && parts[index + 2]) {
      const type = parts[index + 1];
      const value = Number(parts[index + 2]);
      info.score = { type, value: type === 'cp' ? value / 100 : value };
      index += 2;
    } else if (token === 'pv') {
      info.pv = parts.slice(index + 1);
      break;
    }
  }
  return info;
}

function parseXiangqiMove(move) {
  const match = /^([a-i])([0-9])([a-i])([0-9])([a-z])?$/.exec(String(move || ''));
  if (!match) return null;
  return {
    from: { row: 9 - Number(match[2]), col: match[1].charCodeAt(0) - 97 },
    to: { row: 9 - Number(match[4]), col: match[3].charCodeAt(0) - 97 },
    promotion: match[5] || null
  };
}

class PikafishService {
  constructor() {
    this.process = null;
    this.ready = false;
    this.starting = null;
    this.options = new Set();
    this.waiters = [];
    this.search = null;
    this.stderr = '';
    this.queue = Promise.resolve();
    this.configBySide = {
      red: { threads: 1, hash: 128, depth: 12, movetime: 1000, multiPv: 3 },
      black: { threads: 1, hash: 128, depth: 12, movetime: 1000, multiPv: 3 }
    };
  }

  getStatus() {
    return {
      ok: true,
      engine: 'pikafish',
      available: fs.existsSync(ENGINE_PATH),
      ready: this.ready,
      enginePath: ENGINE_PATH,
      nnueAvailable: fs.existsSync(NNUE_PATH),
      supportedOptions: [...this.options]
    };
  }

  async start() {
    if (this.ready && this.process) return;
    if (this.starting) return this.starting;
    if (!fs.existsSync(ENGINE_PATH)) throw new Error(`Pikafish executable not found: ${ENGINE_PATH}`);

    this.starting = (async () => {
      const child = spawn(ENGINE_PATH, [], { cwd: path.dirname(ENGINE_PATH), windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
      this.process = child;
      const lines = readline.createInterface({ input: child.stdout });
      lines.on('line', line => this._handleLine(line.trim()));
      child.stderr.on('data', chunk => { this.stderr = (this.stderr + chunk.toString()).slice(-4000); });
      child.on('error', error => this._failWaiters(error));
      child.on('exit', (code, signal) => {
        this.ready = false;
        this.process = null;
        this.lines = null;
        this._failWaiters(new Error(`Pikafish exited (${code ?? signal ?? 'unknown'}). ${this.stderr}`));
      });
      this.lines = lines;

      this._send('uci');
      await this._waitFor(line => line === 'uciok', 10000);
      this._send('isready');
      await this._waitFor(line => line === 'readyok', 10000);
      this.ready = true;
    })().finally(() => { this.starting = null; });

    return this.starting;
  }

  _send(command) {
    if (!this.process || !this.process.stdin || this.process.killed) throw new Error('Pikafish is not running.');
    this.process.stdin.write(`${command}\n`);
  }

  _waitFor(predicate, timeoutMs) {
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve, reject, timer: null };
      waiter.timer = setTimeout(() => {
        this.waiters = this.waiters.filter(item => item !== waiter);
        reject(new Error(`Pikafish response timed out. ${this.stderr}`));
      }, timeoutMs);
      this.waiters.push(waiter);
    });
  }

  _failWaiters(error) {
    for (const waiter of this.waiters.splice(0)) {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    }
    if (this.search) {
      clearTimeout(this.search.timer);
      this.search.reject(error);
      this.search = null;
    }
  }

  _handleLine(line) {
    if (line.startsWith('option name ')) {
      const name = line.slice('option name '.length).split(/\s+type\s+/)[0];
      this.options.add(name);
    }

    if (this.search) {
      if (line.startsWith('info ')) {
        const info = parseInfoLine(line);
        const key = info.multipv || 1;
        this.search.lines.set(key, info);
      } else if (line.startsWith('bestmove')) {
        const parts = line.split(/\s+/);
        const bestMove = parts[1] && parts[1] !== '(none)' ? parts[1] : null;
        const result = {
          ok: true,
          engine: 'pikafish',
          side: this.search.side,
          fen: this.search.fen,
          bestMove,
          move: parseXiangqiMove(bestMove),
          info: [...this.search.lines.values()].at(-1) || {},
          multipv: [...this.search.lines.values()].sort((first, second) => first.multipv - second.multipv),
          settings: { ...this.search.settings },
          ponder: parts[3] || null
        };
        clearTimeout(this.search.timer);
        const resolve = this.search.resolve;
        this.search = null;
        resolve(result);
      }
    }

    for (let index = 0; index < this.waiters.length; index += 1) {
      const waiter = this.waiters[index];
      if (waiter.predicate(line)) {
        clearTimeout(waiter.timer);
        this.waiters.splice(index, 1);
        waiter.resolve(line);
        return;
      }
    }
  }

  _enqueue(task) {
    const pending = this.queue.then(task, task);
    this.queue = pending.catch(() => {});
    return pending;
  }

  async _configure(settings) {
    const config = {
      threads: clamp(settings.threads, 1, 64, 1),
      hash: clamp(settings.hash, 16, 4096, 128),
      depth: clamp(settings.depth, 1, 30, 12),
      movetime: clamp(settings.movetime, 100, 30000, 1000),
      multiPv: clamp(settings.multiPv, 1, 5, 1),
      moveOverhead: clamp(settings.moveOverhead, 0, 5000, 100)
    };
    const options = [
      ['Threads', config.threads], ['Hash', config.hash], ['MultiPV', config.multiPv],
      ['Move Overhead', config.moveOverhead], ['UCI_ShowWDL', 'true']
    ];
    for (const [name, value] of options) {
      if (this.options.has(name)) this._send(`setoption name ${name} value ${value}`);
    }
    if (this.options.has('EvalFile') && fs.existsSync(NNUE_PATH)) {
      this._send(`setoption name EvalFile value ${NNUE_PATH.replace(/\\/g, '/')}`);
    }
    this._send('isready');
    await this._waitFor(line => line === 'readyok', 10000);
    return config;
  }

  getBestMove({ fen, side = 'red', settings = {} }) {
    return this._enqueue(async () => {
      const normalizedFen = validateFen(fen);
      if (side !== 'red' && side !== 'black') throw new Error('side must be red or black.');
      const fenTurn = normalizedFen.split(/\s+/)[1];
      if ((side === 'red' && fenTurn !== 'w') || (side === 'black' && fenTurn !== 'b')) {
        throw new Error(`FEN turn does not match ${side} engine.`);
      }
      await this.start();
      const config = await this._configure({ ...this.configBySide[side], ...settings });
      this.configBySide[side] = { ...config };

      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          if (!this.search) return;
          this.search = null;
          try { this._send('stop'); } catch {}
          reject(new Error('Pikafish search timed out.'));
        }, Math.max(10000, config.movetime + 8000));
        this.search = { resolve, reject, timer, lines: new Map(), side, fen: normalizedFen, settings: config };
        try {
          this._send(`position fen ${normalizedFen}`);
          this._send(`go movetime ${config.movetime} depth ${config.depth}`);
        } catch (error) {
          clearTimeout(timer);
          this.search = null;
          reject(error);
        }
      });
    });
  }

  configureSides({ red = {}, black = {} } = {}) {
    for (const side of ['red', 'black']) {
      const current = this.configBySide[side];
      const requested = side === 'red' ? red : black;
      this.configBySide[side] = {
        threads: clamp(requested.threads, 1, 64, current.threads),
        hash: clamp(requested.hash, 16, 4096, current.hash),
        depth: clamp(requested.depth, 1, 30, current.depth),
        movetime: clamp(requested.movetime, 100, 30000, current.movetime),
        multiPv: clamp(requested.multiPv, 1, 5, current.multiPv),
        moveOverhead: clamp(requested.moveOverhead, 0, 5000, current.moveOverhead)
      };
    }
    return { red: { ...this.configBySide.red }, black: { ...this.configBySide.black } };
  }

  stop() {
    this._failWaiters(new Error('Pikafish service stopped.'));
    if (this.process) {
      try { this._send('quit'); } catch {}
      try { this.process.kill(); } catch {}
    }
    this.process = null;
    this.ready = false;
    this.starting = null;
    this.lines?.close();
    this.lines = null;
  }
}

const service = new PikafishService();

module.exports = {
  getPikafishStatus: () => service.getStatus(),
  getPikafishMove: request => service.getBestMove(request),
  configurePikafishSides: settings => service.configureSides(settings),
  stopPikafish: () => service.stop(),
  validateXiangqiFen: validateFen,
  parseXiangqiMove
};
