const { spawn } = require("child_process");
const { getEnginePath } = require("./stockfishService");

function parseInfoLine(line) {
  const parts = String(line || "").trim().split(/\s+/);
  const info = { raw: line };

  for (let i = 0; i < parts.length; i += 1) {
    const token = parts[i];
    if (token === "depth" && parts[i + 1]) {
      info.depth = Number(parts[i + 1]);
      i += 1;
      continue;
    }
    if (token === "nodes" && parts[i + 1]) {
      info.nodes = Number(parts[i + 1]);
      i += 1;
      continue;
    }
    if (token === "time" && parts[i + 1]) {
      info.time = Number(parts[i + 1]);
      i += 1;
      continue;
    }
    if (token === "score" && parts[i + 2]) {
      const scoreType = parts[i + 1];
      const scoreValue = parts[i + 2];
      info.score = {
        type: scoreType,
        value: scoreType === "mate" ? Number(scoreValue) : Number(scoreValue) / 100,
      };
      i += 2;
      continue;
    }
    if (token === "pv") {
      info.pv = parts.slice(i + 1);
      break;
    }
  }

  return info;
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, n));
}

function normalizeSide(side) {
  if (side === "white" || side === "w") return "white";
  if (side === "black" || side === "b") return "black";
  return null;
}

class StockfishSession {
  constructor(side) {
    this.side = side;
    this.process = null;
    this.ready = false;
    this.waiters = [];
    this.currentSearch = null;
    this.starting = null;
    this.config = {
      skillLevel: 10,
      depth: 11,
      movetime: 840,
      multiPv: 2,
    };
  }

  async start() {
    if (this.ready && this.process) {
      return;
    }
    if (this.starting) {
      return this.starting;
    }

    this.starting = new Promise((resolve, reject) => {
      const enginePath = getEnginePath();
      const proc = spawn(enginePath, [], {
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      });
      this.process = proc;

      const failStart = (error) => {
        this.ready = false;
        this.starting = null;
        reject(error);
      };

      proc.on("error", (error) => {
        failStart(error);
      });

      proc.on("exit", () => {
        this.ready = false;
        this.starting = null;
        this.process = null;
      });

      proc.stderr.on("data", () => {
        // keep silent for now
      });

      proc.stdout.on("data", (chunk) => {
        const lines = chunk.toString().split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        lines.forEach((line) => this._handleLine(line));
      });

      this._send("uci");
      this.waitForLine((line) => line === "uciok", 6000)
        .then(() => this.ensureReady())
        .then(() => {
          this.ready = true;
          this.starting = null;
          resolve();
        })
        .catch((error) => {
          failStart(error);
        });
    });

    return this.starting;
  }

  _send(command) {
    if (!this.process || !this.process.stdin) {
      throw new Error(`Engine ${this.side} not started`);
    }
    this.process.stdin.write(command + "\n");
  }

  _handleLine(line) {
    if (this.currentSearch) {
      if (line.startsWith("info ")) {
        this.currentSearch.infoLines.push(parseInfoLine(line));
      } else if (line.startsWith("bestmove")) {
        const bestMove = line.split(/\s+/)[1] || null;
        const result = {
          ok: true,
          side: this.side,
          bestMove: bestMove === "(none)" ? null : bestMove,
          info: this.currentSearch.infoLines.length
            ? this.currentSearch.infoLines[this.currentSearch.infoLines.length - 1]
            : {},
          multipv: this.currentSearch.infoLines.slice(-this.currentSearch.multiPv),
          settings: { ...this.config },
        };
        clearTimeout(this.currentSearch.timer);
        const resolve = this.currentSearch.resolve;
        this.currentSearch = null;
        resolve(result);
      }
    }

    for (let i = 0; i < this.waiters.length; i += 1) {
      const waiter = this.waiters[i];
      if (waiter.predicate(line)) {
        clearTimeout(waiter.timer);
        this.waiters.splice(i, 1);
        waiter.resolve(line);
        return;
      }
    }
  }

  waitForLine(predicate, timeoutMs) {
    return new Promise((resolve, reject) => {
      const waiter = {
        predicate,
        resolve,
        reject,
        timer: null,
      };
      waiter.timer = setTimeout(() => {
        const idx = this.waiters.indexOf(waiter);
        if (idx >= 0) {
          this.waiters.splice(idx, 1);
        }
        reject(new Error(`Engine ${this.side} wait timeout`));
      }, timeoutMs);
      this.waiters.push(waiter);
    });
  }

  async ensureReady() {
    this._send("isready");
    await this.waitForLine((line) => line === "readyok", 5000);
  }

  async configure(settings) {
    await this.start();
    const next = {
      skillLevel: clampNumber(settings?.skillLevel, 0, 20, this.config.skillLevel),
      depth: clampNumber(settings?.depth, 1, 30, this.config.depth),
      movetime: clampNumber(settings?.movetime, 100, 10000, this.config.movetime),
      multiPv: clampNumber(settings?.multiPv, 1, 5, this.config.multiPv),
    };

    if (next.skillLevel !== this.config.skillLevel) {
      this._send(`setoption name Skill Level value ${next.skillLevel}`);
    }
    if (next.multiPv !== this.config.multiPv) {
      this._send(`setoption name MultiPV value ${next.multiPv}`);
    }
    this._send("setoption name UCI_ShowWDL value true");

    this.config = next;
    await this.ensureReady();
    return { ...this.config };
  }

  async analyze(fen, settings) {
    if (this.currentSearch) {
      throw new Error(`Engine ${this.side} is busy`);
    }

    await this.configure(settings);
    await this.start();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (!this.currentSearch) {
          return;
        }
        this.currentSearch = null;
        try {
          this._send("stop");
        } catch {}
        reject(new Error(`Engine ${this.side} analyze timeout`));
      }, Math.max(6000, this.config.movetime + 6000));

      this.currentSearch = {
        resolve,
        reject,
        timer,
        infoLines: [],
        multiPv: this.config.multiPv,
      };

      try {
        this._send(`position fen ${fen}`);
        this._send(`go movetime ${this.config.movetime} depth ${this.config.depth}`);
      } catch (error) {
        clearTimeout(timer);
        this.currentSearch = null;
        reject(error);
      }
    });
  }

  async stop() {
    if (!this.process) {
      return;
    }
    try {
      this._send("quit");
    } catch {}
    try {
      this.process.kill();
    } catch {}
    this.process = null;
    this.ready = false;
    this.starting = null;
    this.waiters = [];
    this.currentSearch = null;
  }

  getStatus() {
    return {
      side: this.side,
      ready: this.ready,
      busy: !!this.currentSearch,
      settings: { ...this.config },
      hasProcess: !!this.process,
    };
  }
}

const whiteSession = new StockfishSession("white");
const blackSession = new StockfishSession("black");

function getSessionBySide(sideInput) {
  const side = normalizeSide(sideInput);
  if (!side) {
    throw new Error("side must be white|black or w|b");
  }
  return side === "white" ? whiteSession : blackSession;
}

async function analyzeForSide({ side, fen, settings }) {
  if (!fen || typeof fen !== "string") {
    throw new Error("fen is required");
  }
  const session = getSessionBySide(side);
  return session.analyze(String(fen).trim(), settings || {});
}

async function configureSide({ side, settings }) {
  const session = getSessionBySide(side);
  return session.configure(settings || {});
}

function getDuelStatus() {
  return {
    white: whiteSession.getStatus(),
    black: blackSession.getStatus(),
  };
}

async function shutdownDuel() {
  await Promise.all([whiteSession.stop(), blackSession.stop()]);
}

module.exports = {
  analyzeForSide,
  configureSide,
  getDuelStatus,
  shutdownDuel,
};
