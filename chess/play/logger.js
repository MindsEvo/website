(function (global) {
  "use strict";

  var levels = { debug: 10, info: 20, warn: 30, error: 40 };

  function createLogger(config) {
    var state = {
      level: (config && config.level) || "debug",
      records: [],
      maxRecords: (config && config.maxRecords) || 3000,
      sink: null,
      sessionId: "chess-" + Date.now(),
      seq: 1
    };

    function shouldLog(level) {
      return levels[level] >= levels[state.level];
    }

    function write(level, module, event, payload) {
      if (!shouldLog(level)) return;

      var record = {
        id: state.seq++,
        ts: new Date().toISOString(),
        level: level,
        module: module || "app",
        event: event || "event",
        payload: payload || null,
        sessionId: state.sessionId
      };

      state.records.push(record);
      if (state.records.length > state.maxRecords) {
        state.records.shift();
      }

      var text = "[" + record.ts + "] [" + record.level.toUpperCase() + "] [" + record.module + "] " + record.event;

      if (record.level === "error") {
        console.error(text, record.payload);
      } else if (record.level === "warn") {
        console.warn(text, record.payload);
      } else {
        console.log(text, record.payload);
      }

      if (typeof state.sink === "function") {
        state.sink(record);
      }
    }

    return {
      debug: function (module, event, payload) { write("debug", module, event, payload); },
      info: function (module, event, payload) { write("info", module, event, payload); },
      warn: function (module, event, payload) { write("warn", module, event, payload); },
      error: function (module, event, payload) { write("error", module, event, payload); },
      setLevel: function (level) {
        if (levels[level]) {
          state.level = level;
          write("info", "logger", "log.level.changed", { level: level });
        }
      },
      setSink: function (sinkFn) { state.sink = sinkFn; },
      getRecords: function () { return state.records.slice(); },
      exportJson: function () {
        var content = JSON.stringify({ sessionId: state.sessionId, records: state.records }, null, 2);
        var blob = new Blob([content], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = state.sessionId + "-logs.json";
        a.click();
        URL.revokeObjectURL(url);
      }
    };
  }

  global.ChessLogger = { createLogger: createLogger };
})(window);
