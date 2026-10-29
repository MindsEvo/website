(function (global) {
  "use strict";

  var API_URL = "https://tablebase.lichess.ovh/standard?fen=";
  var MAX_PIECES = 7;
  var TIMEOUT_MS = 2500;
  var cache = new Map();
  var pending = new Map();

  function isEligible(fen) {
    var fields = String(fen || "").trim().split(/\s+/);
    if (fields.length < 4 || fields[2] !== "-" || fields[3] !== "-") return false;
    var pieces = (fields[0].match(/[pnbrqk]/gi) || []).length;
    return pieces >= 2 && pieces <= MAX_PIECES;
  }

  function probe(fen) {
    var position = String(fen || "").trim();
    if (!isEligible(position) || typeof global.fetch !== "function") return Promise.resolve(null);
    if (cache.has(position)) return Promise.resolve(cache.get(position));
    if (pending.has(position)) return pending.get(position);

    var controller = typeof global.AbortController === "function" ? new global.AbortController() : null;
    var timer;
    var request = global.fetch(API_URL + encodeURIComponent(position), controller ? { signal: controller.signal } : {})
      .then(function (response) {
        if (!response || !response.ok) return null;
        return response.json();
      })
      .then(function (data) {
        var move = data && Array.isArray(data.moves) ? data.moves[0] : null;
        if (!move || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move.uci || "")) return null;
        var candidates = data.moves.filter(function (candidate) {
          return candidate && /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(candidate.uci || "");
        }).slice(0, 3).map(function (candidate) {
          return {
            san: candidate.san || null,
            pv: [candidate.uci],
            tablebase: {
              category: candidate.category || null,
              dtz: Number.isFinite(candidate.dtz) ? candidate.dtz : null
            }
          };
        });
        return {
          ok: true,
          fen: position,
          bestMove: move.uci,
          info: {},
          multipv: candidates,
          source: "tablebase",
          tablebase: {
            category: data.category || move.category || null,
            dtz: Number.isFinite(data.dtz) ? data.dtz : null,
            dtm: Number.isFinite(data.dtm) ? data.dtm : null
          }
        };
      })
      .catch(function () { return null; });
    var timeout = new Promise(function (resolve) {
      timer = global.setTimeout(function () {
        if (controller) controller.abort();
        resolve(null);
      }, TIMEOUT_MS);
    });

    var result = Promise.race([request, timeout]).then(function (payload) {
      if (payload) {
        if (cache.size >= 128) cache.delete(cache.keys().next().value);
        cache.set(position, payload);
      }
      return payload;
    }).finally(function () {
      global.clearTimeout(timer);
      pending.delete(position);
    });
    pending.set(position, result);
    return result;
  }

  global.ChessTablebase = { probe: probe, isEligible: isEligible };
})(typeof window !== "undefined" ? window : globalThis);