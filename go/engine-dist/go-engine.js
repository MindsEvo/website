function y() {
  try {
    const i = globalThis.Worker;
    return typeof i == "function" ? i : null;
  } catch {
    return null;
  }
}
const p = (i) => i.length <= 5 ? i : i.slice(i.length - 5);
class l extends Error {
  constructor(e = "Analysis canceled") {
    super(e), this.canceled = !0, this.name = "KataGoCanceledError";
  }
}
class m {
  constructor() {
    if (this.nextId = 1, this.pendingInit = null, this.pending = /* @__PURE__ */ new Map(), this.pendingEval = /* @__PURE__ */ new Map(), this.pendingEvalBatch = /* @__PURE__ */ new Map(), this.backend = null, this.modelName = null, this.lastLoggedBackendNote = null, this.backendNote = null, this.lastLoggedEngineLabel = null, this.lastHumanPolicyError = null, this.crashed = null, !y())
      throw new Error("Browser Worker API is unavailable; KataGo analysis cannot run in this browser context.");
    try {
      this.worker = new Worker(new URL(
        /* @vite-ignore */
        "" + new URL("assets/worker-C8Wf116G.js", import.meta.url).href,
        import.meta.url
      ), { type: "module" });
    } catch (e) {
      throw d(e, "KataGo worker failed to start");
    }
    this.worker.onmessage = (e) => {
      this.crashed = null;
      const n = e.data;
      if (n.type === "katago:notice") {
        n.message !== this.lastLoggedBackendNote && (this.lastLoggedBackendNote = n.message, this.backendNote = n.message, n.level === "warn" ? console.warn(`[katago] ${n.message}`) : console.info(`[katago] ${n.message}`));
        return;
      }
      if (n.type === "katago:init_result") {
        const t = this.pendingInit;
        if (!t) return;
        this.pendingInit = null, n.ok && this.syncEngineInfo(n), n.ok ? t.resolve() : t.reject(new Error(n.error ?? "Init failed"));
        return;
      }
      if (n.type === "katago:analyze_update") {
        const t = this.pending.get(n.id);
        if (!t || n.canceled || n.error === "canceled" || (this.syncEngineInfo(n), this.reportHumanPolicyError(n.humanPolicyError), !n.ok || !n.analysis)) return;
        t.onProgress?.(n.analysis);
        return;
      }
      if (n.type === "katago:analyze_result") {
        const t = this.pending.get(n.id);
        if (!t) return;
        if (this.pending.delete(n.id), n.canceled || n.error === "canceled") {
          t.reject(new l());
          return;
        }
        this.syncEngineInfo(n), this.reportHumanPolicyError(n.humanPolicyError), !n.ok || !n.analysis ? t.reject(new Error(n.error ?? "Analysis failed")) : t.resolve(n.analysis);
        return;
      }
      if (n.type === "katago:eval_result") {
        const t = this.pendingEval.get(n.id);
        if (!t) return;
        this.pendingEval.delete(n.id), this.syncEngineInfo(n), !n.ok || !n.eval ? t.reject(new Error(n.error ?? "Eval failed")) : t.resolve(n.eval);
        return;
      }
      if (n.type === "katago:eval_batch_result") {
        const t = this.pendingEvalBatch.get(n.id);
        if (!t) return;
        this.pendingEvalBatch.delete(n.id), this.syncEngineInfo(n), !n.ok || !n.evals ? t.reject(new Error(n.error ?? "Eval batch failed")) : t.resolve(n.evals);
      }
    }, this.worker.onerror = (e) => {
      const n = e.error instanceof Error ? e.error : new Error(e.message || "unknown error");
      this.handleWorkerCrash(d(n, "KataGo worker crashed"));
    }, this.worker.onmessageerror = () => {
      this.handleWorkerCrash(new Error("KataGo worker posted an undecodable message"));
    };
  }
  handleWorkerCrash(e) {
    this.crashed = e, this.failAllPending(e);
  }
  failAllPending(e) {
    if (this.pendingInit) {
      const { reject: r } = this.pendingInit;
      this.pendingInit = null, r(e);
    }
    const n = [...this.pending.values()];
    this.pending.clear();
    const t = [...this.pendingEval.values()];
    this.pendingEval.clear();
    const o = [...this.pendingEvalBatch.values()];
    this.pendingEvalBatch.clear();
    for (const r of n) r.reject(e);
    for (const r of t) r.reject(e);
    for (const r of o) r.reject(e);
  }
  rejectIfCrashed() {
    if (this.crashed)
      throw this.crashed;
  }
  dispose() {
    this.failAllPending(new Error("KataGo engine client was disposed")), this.worker.terminate();
  }
  postToWorker(e) {
    try {
      this.worker.postMessage(e);
    } catch (n) {
      throw d(n, "KataGo worker message failed");
    }
  }
  /**
   * The human SL net is optional and never blocks the analysis, so a failure to
   * load it would otherwise be invisible. Report each distinct problem once.
   */
  reportHumanPolicyError(e) {
    !e || e === this.lastHumanPolicyError || (this.lastHumanPolicyError = e, console.warn(`[katago] human policy unavailable: ${e}`));
  }
  syncEngineInfo(e) {
    let n = !1;
    if (typeof e.backend == "string" && e.backend !== this.backend && (this.backend = e.backend, n = !0), typeof e.modelName == "string" && e.modelName !== this.modelName && (this.modelName = e.modelName, n = !0), !n) return;
    const t = [];
    this.backend && t.push(this.backend), this.modelName && t.push(this.modelName);
    const o = t.join(" / ");
    !o || o === this.lastLoggedEngineLabel || (this.lastLoggedEngineLabel = o, console.info(`[katago] engine: ${o}`));
  }
  getEngineInfo() {
    return { backend: this.backend, modelName: this.modelName, backendNote: this.backendNote };
  }
  init(e, n) {
    if (this.pendingInit) return this.pendingInit.promise;
    if (this.crashed) return Promise.reject(this.crashed);
    let t, o;
    const r = new Promise((a, f) => {
      t = a, o = f;
    });
    this.pendingInit = { promise: r, resolve: t, reject: o };
    const s = { type: "katago:init", modelUrl: e, backend: n };
    try {
      this.postToWorker(s);
    } catch (a) {
      this.pendingInit = null, o(a instanceof Error ? a : new Error(String(a)));
    }
    return r;
  }
  async analyze(e) {
    if (this.rejectIfCrashed(), e.signal?.aborted) throw new l();
    const n = this.nextId++, t = {
      type: "katago:analyze",
      id: n,
      analysisGroup: e.analysisGroup,
      positionId: e.positionId,
      parentPositionId: e.parentPositionId,
      positionKey: e.positionKey,
      parentPositionKey: e.parentPositionKey,
      modelUrl: e.modelUrl,
      backend: e.backend,
      board: e.board,
      previousBoard: e.previousBoard,
      previousPreviousBoard: e.previousPreviousBoard,
      currentPlayer: e.currentPlayer,
      // Search uses the true turn number and repeated opponent passes, beyond
      // the five recent moves that the neural input planes consume.
      moveHistory: e.moveHistory,
      repetitionHistory: e.repetitionHistory,
      komi: e.komi,
      rules: e.rules,
      regionOfInterest: e.regionOfInterest,
      topK: e.topK,
      analysisPvLen: e.analysisPvLen,
      includeMovesOwnership: e.includeMovesOwnership,
      wideRootNoise: e.wideRootNoise,
      playoutDoublingAdvantage: e.playoutDoublingAdvantage,
      playoutDoublingAdvantagePla: e.playoutDoublingAdvantagePla,
      nnRandomize: e.nnRandomize,
      conservativePass: e.conservativePass,
      visits: e.visits,
      maxTimeMs: e.maxTimeMs,
      batchSize: e.batchSize,
      maxChildren: e.maxChildren,
      reportDuringSearchEveryMs: e.reportDuringSearchEveryMs,
      ownershipRefreshIntervalMs: e.ownershipRefreshIntervalMs,
      reuseTree: e.reuseTree,
      ownershipMode: e.ownershipMode,
      humanModelUrl: e.humanModelUrl,
      humanSlProfile: e.humanSlProfile,
      humanSlRootExploreProb: e.humanSlRootExploreProb,
      rootPolicyTemperature: e.rootPolicyTemperature,
      fillDameBeforePass: e.fillDameBeforePass,
      avoidMoves: e.avoidMoves,
      allowMoves: e.allowMoves
    }, o = new Promise((s, a) => {
      this.pending.set(n, { resolve: s, reject: a, onProgress: e.onProgress });
    });
    let r;
    try {
      return this.postToWorker(t), r = e.signal?.addAbortListener(() => {
        const s = this.pending.get(n);
        if (s) {
          this.pending.delete(n);
          try {
            this.postToWorker({ type: "katago:cancel", id: n, analysisGroup: e.analysisGroup ?? "background" }), s.reject(new l());
          } catch (a) {
            s.reject(a instanceof Error ? a : new Error(String(a)));
          }
        }
      }), await o;
    } finally {
      r?.(), this.pending.delete(n);
    }
  }
  async evaluate(e) {
    this.rejectIfCrashed();
    const n = this.nextId++, t = {
      type: "katago:eval",
      id: n,
      modelUrl: e.modelUrl,
      backend: e.backend,
      board: e.board,
      previousBoard: e.previousBoard,
      previousPreviousBoard: e.previousPreviousBoard,
      currentPlayer: e.currentPlayer,
      moveHistory: p(e.moveHistory),
      repetitionHistory: e.repetitionHistory,
      komi: e.komi,
      rules: e.rules,
      conservativePass: e.conservativePass
    }, o = new Promise((r, s) => {
      this.pendingEval.set(n, { resolve: r, reject: s });
    });
    try {
      this.postToWorker(t);
    } catch (r) {
      throw this.pendingEval.delete(n), r;
    }
    return o;
  }
  async evaluateBatch(e) {
    this.rejectIfCrashed();
    const n = this.nextId++, t = {
      type: "katago:eval_batch",
      id: n,
      modelUrl: e.modelUrl,
      backend: e.backend,
      positions: e.positions.map((r) => ({
        board: r.board,
        previousBoard: r.previousBoard,
        previousPreviousBoard: r.previousPreviousBoard,
        currentPlayer: r.currentPlayer,
        moveHistory: p(r.moveHistory),
        repetitionHistory: r.repetitionHistory,
        komi: r.komi
      })),
      rules: e.rules,
      conservativePass: e.conservativePass
    }, o = new Promise((r, s) => {
      this.pendingEvalBatch.set(n, { resolve: r, reject: s });
    });
    try {
      this.postToWorker(t);
    } catch (r) {
      throw this.pendingEvalBatch.delete(n), r;
    }
    return o;
  }
}
let c = null;
function d(i, e) {
  const n = i instanceof Error ? i.message : String(i);
  return new Error(n ? `${e}: ${n}` : e);
}
function v() {
  return c || (c = new m()), c;
}
const g = "./models/katago-small.bin.gz", h = new URL(
  /* @vite-ignore */
  g,
  import.meta.url
).href, u = v();
function k() {
  return h;
}
function w() {
  return u.getEngineInfo();
}
function E() {
  return u.init(h, "webgpu");
}
function P(i, e) {
  return u.analyze({
    ...i,
    signal: e,
    modelUrl: h,
    rules: "chinese",
    komi: 7.5,
    visits: 64,
    maxTimeMs: 1800,
    batchSize: 8,
    topK: 5,
    analysisPvLen: 8,
    ownershipMode: "none",
    reuseTree: !1
  });
}
export {
  P as analyzePosition,
  w as getEngineInfo,
  k as getModelUrl,
  E as initializeEngine
};
