(function () {
  'use strict';

  var body = document.body;
  var nodes = document.querySelectorAll('[data-i18n]');

  function renderLanguage(lang) {
    var normalized = lang === 'en' ? 'en' : 'zh';
    body.setAttribute('data-lang', normalized);
    document.documentElement.lang = normalized === 'en' ? 'en' : 'zh-CN';
    document.title = 'Clio Design | MindsEvo';

    nodes.forEach(function (node) {
      var text = node.getAttribute(normalized === 'en' ? 'data-en' : 'data-zh');
      if (text != null) {
        node.textContent = text;
      }
    });
  }

  function onLanguageChanged(event) {
    var lang = event && event.detail ? event.detail.lang : null;
    renderLanguage(lang || (window.shell && window.shell.lang) || 'zh');
  }

  if (window.shell && window.shell.gui && typeof window.shell.gui.mountControls === 'function') {
    window.shell.gui.mountControls(document, { language: true, music: false });
  }

  document.addEventListener('shell:langchange', onLanguageChanged);
  renderLanguage((window.shell && window.shell.lang) || 'zh');
}());
