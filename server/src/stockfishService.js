const { spawn } = require("child_process");
const path = require("path");

const DEFAULT_ENGINE_PATH = "c:/Users/xiaod/chess/engine/binaries/stockfish/stockfish.exe";
const ENGINE_PATH = process.env.MINDSEVO_STOCKFISH_PATH || DEFAULT_ENGINE_PATH;

function getEnginePath() {
  return ENGINE_PATH;
}

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

function sanitizeFen(fen) {
  return String(fen || "").trim();
}

function analyzePosition({ fen, depth, movetime, skillLevel, multiPv }) {
  const normalizedFen = sanitizeFen(fen);
  if (!normalizedFen) {
    return Promise.reject(new Error("fen is required"));
  }

  const timeMs = Number.isFinite(Number(movetime)) ? Math.max(100, Math.min(10000, Number(movetime))) : 1200;
  const searchDepth = Number.isFinite(Number(depth)) ? Math.max(1, Math.min(30, Number(depth))) : null;
  const skill = Number.isFinite(Number(skillLevel)) ? Math.max(0, Math.min(20, Number(skillLevel))) : 10;
  const pvCount = Number.isFinite(Number(multiPv)) ? Math.max(1, Math.min(5, Number(multiPv))) : 1;

  return new Promise((resolve, reject) => {
    let done = false;
    let infoLines = [];
    let stderrText = "";
    let handshakeState = "uci";

    const engine = spawn(getEnginePath(), [], {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const cleanup = () => {
      engine.stdout.removeAllListeners();
      engine.stderr.removeAllListeners();
      engine.removeAllListeners();
      if (!engine.killed) {
        try {
          engine.stdin.write("quit\n");
        } catch {}
        try {
          engine.kill();
        } catch {}
      }
    };

    const fail = (error) => {
      if (done) {
        return;
      }
      done = true;
      cleanup();
      reject(error);
    };

    const finish = (bestMove) => {
      if (done) {
        return;
      }
      done = true;
      const latestInfo = infoLines.length ? infoLines[infoLines.length - 1] : {};
      cleanup();
      resolve({
        ok: true,
        fen: normalizedFen,
        bestMove,
        info: latestInfo,
        multipv: infoLines.slice(-pvCount),
      });
    };

    const timer = setTimeout(() => {
      fail(new Error(`Stockfish request timed out. stderr=${stderrText || "<empty>"}`));
    }, Math.max(5000, timeMs + 5000));

    const safeFinish = (bestMove) => {
      clearTimeout(timer);
      finish(bestMove);
    };

    engine.on("error", (error) => {
      clearTimeout(timer);
      fail(error);
    });

    engine.stderr.on("data", (chunk) => {
      stderrText += chunk.toString();
    });

    engine.stdout.on("data", (chunk) => {
      const lines = chunk.toString().split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

      for (const line of lines) {
        if (handshakeState === "uci" && line === "uciok") {
          handshakeState = "ready";
          engine.stdin.write(`setoption name Skill Level value ${skill}\n`);
          engine.stdin.write(`setoption name MultiPV value ${pvCount}\n`);
          engine.stdin.write("setoption name UCI_ShowWDL value true\n");
          engine.stdin.write("isready\n");
          continue;
        }

        if (handshakeState === "ready" && line === "readyok") {
          handshakeState = "search";
          engine.stdin.write(`position fen ${normalizedFen}\n`);
          engine.stdin.write(searchDepth ? `go movetime ${timeMs} depth ${searchDepth}\n` : `go movetime ${timeMs}\n`);
          continue;
        }

        if (line.startsWith("info ")) {
          infoLines.push(parseInfoLine(line));
          continue;
        }

        if (line.startsWith("bestmove")) {
          const bestMove = line.split(/\s+/)[1] || null;
          safeFinish(bestMove === "(none)" ? null : bestMove);
          return;
        }
      }
    });

    engine.stdin.write("uci\n");
  });
}

module.exports = {
  analyzePosition,
  getEnginePath,
};