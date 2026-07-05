(function (global) {
  "use strict";

  function fallbackRuntime() {
    var sessionToken = 0;
    var timers = Object.create(null);

    function beginSession() {
      sessionToken += 1;
      return sessionToken;
    }

    function setGuardedTimer(owner, key, ms, callback, expectedToken) {
      var timerKey = String(owner) + "::" + String(key);
      if (timers[timerKey]) {
        clearTimeout(timers[timerKey]);
      }
      timers[timerKey] = setTimeout(function () {
        delete timers[timerKey];
        if (expectedToken !== sessionToken) {
          return;
        }
        callback();
      }, ms);
    }

    function clearOwnerTimers(owner) {
      var prefix = String(owner) + "::";
      Object.keys(timers).forEach(function (k) {
        if (k.indexOf(prefix) === 0) {
          clearTimeout(timers[k]);
          delete timers[k];
        }
      });
    }

    function clearTimer(owner, key) {
      var timerKey = String(owner) + "::" + String(key);
      if (timers[timerKey]) {
        clearTimeout(timers[timerKey]);
        delete timers[timerKey];
      }
    }

    function bindUnifiedTap(el, handler) {
      function onClick(ev) {
        handler(ev);
      }
      el.addEventListener("click", onClick);
      return function () {
        el.removeEventListener("click", onClick);
      };
    }

    function commitAnimationStart(elements) {
      (Array.isArray(elements) ? elements : [elements]).forEach(function (el) {
        if (!el) return;
        void el.offsetHeight;
      });
    }

    function nextFrame(callback, frames) {
      var count = Math.max(1, Number(frames || 1));
      function step() {
        if (count <= 1) {
          callback();
          return;
        }
        count -= 1;
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    return {
      beginSession: beginSession,
      setGuardedTimer: setGuardedTimer,
      clearTimer: clearTimer,
      clearOwnerTimers: clearOwnerTimers,
      bindUnifiedTap: bindUnifiedTap,
      commitAnimationStart: commitAnimationStart,
      nextFrame: nextFrame,
      onLifecycle: function () { return function () {}; },
      diagnostics: {
        enable: function () {},
        disable: function () {},
        getLogs: function () { return []; }
      }
    };
  }

  var runtime = global.shell && global.shell.runtime ? global.shell.runtime : fallbackRuntime();

  function createController(gameId) {
    var owner = String(gameId || "clio-game");
    var token = runtime.beginSession(owner);
    var unsubs = [];

    function resetSession() {
      runtime.clearOwnerTimers(owner);
      token = runtime.beginSession(owner);
      return token;
    }

    function onLifecyclePause(pauseFn) {
      var off = runtime.onLifecycle(function (eventName) {
        if (eventName === "background") {
          pauseFn();
        }
      });
      unsubs.push(off);
      return off;
    }

    function dispose() {
      runtime.clearOwnerTimers(owner);
      while (unsubs.length) {
        var off = unsubs.pop();
        try { off(); } catch (e) {}
      }
    }

    return {
      getSessionToken: function () { return token; },
      resetSession: resetSession,
      setTimer: function (key, ms, callback) {
        runtime.setGuardedTimer(owner, key, ms, callback, token);
      },
      clearTimer: function (key) {
        runtime.clearTimer(owner, key);
      },
      clearTimers: function () {
        runtime.clearOwnerTimers(owner);
      },
      bindTap: function (el, handler) {
        var off = runtime.bindUnifiedTap(el, handler);
        unsubs.push(off);
        return off;
      },
      commitAnimationStart: runtime.commitAnimationStart,
      nextFrame: runtime.nextFrame,
      onLifecyclePause: onLifecyclePause,
      diagnostics: runtime.diagnostics,
      dispose: dispose
    };
  }

  global.ClioRuntimeBridge = {
    createController: createController
  };
})(window);
