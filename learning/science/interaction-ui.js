'use strict';
/**
 * IH — shared header controls for all Interaction runtimes.
 * Provides the same ?, music, sound, language, volume controls as the Puzzle shell.
 */
var IH = (function () {

  var _styled = false;
  function injectStyles() {
    if (_styled) return;
    _styled = true;
    var s = document.createElement('style');
    s.textContent = [
      // Shared dark header bar used by all interaction runtimes
      '.ih-hdr{display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(7,18,37,0.92);backdrop-filter:blur(10px);flex-shrink:0;}',
      '.ih-back{background:none;border:none;color:#fff;font-size:22px;cursor:pointer;padding:4px 8px;border-radius:8px;line-height:1;}',
      '.ih-back:hover{background:rgba(255,255,255,0.12);}',
      '.ih-title{flex:1;font-size:15px;font-weight:800;color:#fff;}',
      '.ih-controls{display:flex;align-items:center;gap:6px;}'
    ].join('');
    document.head.appendChild(s);
  }

  // Returns the HTML string for the control buttons + volume slider
  // Reset button starts hidden; wire() shows it if onReset is provided
  function controlsHtml(prefix) {
    return '<div class="ih-controls">' +
      '<button class="s1-btn" id="ih-' + prefix + '-reset" title="Reset" style="display:none">\ud83d\udd04</button>' +
      '<button class="s1-btn s1-mute"  id="ih-' + prefix + '-mute">🔊</button>' +
      '<button class="s1-btn s1-music" id="ih-' + prefix + '-music">🎵</button>' +
      '<button class="s1-btn s1-lang"  id="ih-' + prefix + '-lang">EN</button>' +
      '<div class="s1-volwrap" id="ih-' + prefix + '-volwrap">' +
        '<span class="s1-volicon">🔈</span>' +
        '<input type="range" class="s1-vol" id="ih-' + prefix + '-vol" min="0" max="100" title="音量 / Volume" aria-label="音量 / Volume">' +
      '</div>' +
    '</div>';
  }

  // opts.onReset: optional reset callback; shows the reset button when provided
  function wire(prefix, opts) {
    opts = opts || {};

    // Toggling, label/icon sync and the muted styling all come from the shell
    // (shell.gui.mountControls), so an interaction header can never drift from
    // the puzzle header — the s1-* classes in controlsHtml() are the contract.
    var mute = document.getElementById('ih-' + prefix + '-mute');
    var root = mute && mute.parentNode ? mute.parentNode : document;
    if (shell.gui && shell.gui.mountControls) shell.gui.mountControls(root);

    var resetBtn = document.getElementById('ih-' + prefix + '-reset');
    if (resetBtn && opts.onReset) {
      resetBtn.style.display = '';
      resetBtn.addEventListener('click', opts.onReset);
    }
  }

  return { injectStyles: injectStyles, controlsHtml: controlsHtml, wire: wire };

}());
