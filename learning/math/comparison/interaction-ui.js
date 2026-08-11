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
      '<button class="s1-btn" id="ih-' + prefix + '-mute">🔊</button>' +
      '<button class="s1-btn" id="ih-' + prefix + '-music">🎵</button>' +
      '<button class="s1-btn" id="ih-' + prefix + '-lang">EN</button>' +
      '<input type="range" class="s1-vol" id="ih-' + prefix + '-vol" min="0" max="100">' +
    '</div>';
  }

  // opts.onReset: optional reset callback; shows the reset button when provided
  function wire(prefix, opts) {
    opts = opts || {};
    var mute  = document.getElementById('ih-' + prefix + '-mute');
    var music = document.getElementById('ih-' + prefix + '-music');
    var lang  = document.getElementById('ih-' + prefix + '-lang');
    var vol   = document.getElementById('ih-' + prefix + '-vol');

    function _updMute()  { if (mute)  mute.textContent  = shell.storage.get('user:settings:sound', true)  ? '🔊' : '🔇'; }
    function _updMusic() { if (music) music.textContent = shell.storage.get('user:settings:music', false) ? '🎵' : '🎶'; }
    function _updLang()  { if (lang)  lang.textContent  = shell.lang === 'zh' ? 'EN' : 'CN'; }
    function _updVol()   { if (vol && shell.getVolume)  vol.value = shell.getVolume(); }

    if (mute)  mute.addEventListener('click', function () {
      shell.gui.setSound(!shell.storage.get('user:settings:sound', true)); _updMute();
    });
    if (music) music.addEventListener('click', function () {
      shell.gui.setMusic(!shell.storage.get('user:settings:music', false)); _updMusic();
    });
    if (lang)  lang.addEventListener('click', function () {
      shell.gui.setLanguage(shell.lang === 'zh' ? 'en' : 'zh'); _updLang();
    });
    if (vol) {
      vol.addEventListener('input', function () { if (shell.setVolume) shell.setVolume(Number(vol.value)); });
      document.addEventListener('shell:gui:volumeChanged', _updVol);
    }
    document.addEventListener('shell:langchange', _updLang);

    var resetBtn = document.getElementById('ih-' + prefix + '-reset');
    if (resetBtn && opts.onReset) {
      resetBtn.style.display = '';
      resetBtn.addEventListener('click', opts.onReset);
    }

    _updMute(); _updMusic(); _updLang(); _updVol();
  }

  return { injectStyles: injectStyles, controlsHtml: controlsHtml, wire: wire };

}());
