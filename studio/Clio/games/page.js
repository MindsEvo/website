(function () {
  'use strict';

  var body = document.body;
  var langBtn = document.getElementById('langBtn');
  var nodes = document.querySelectorAll('[data-i18n]');

  function applyLang(lang) {
    var normalized = lang === 'en' ? 'en' : 'zh';
    body.setAttribute('data-lang', normalized);
    document.documentElement.lang = normalized === 'en' ? 'en' : 'zh-CN';
    document.title = normalized === 'en' ? 'Clio Game List | MindsEvo' : 'Clio 游戏列表 | MindsEvo';

    nodes.forEach(function (node) {
      var text = node.getAttribute(normalized === 'en' ? 'data-en' : 'data-zh');
      if (text != null) {
        node.textContent = text;
      }
    });

    if (langBtn) {
      langBtn.textContent = normalized === 'en' ? 'EN / CN' : 'CN / EN';
    }

    if (window.shell && typeof window.shell.setLang === 'function') {
      window.shell.setLang(normalized);
    }
    localStorage.setItem('clio-games-lang', normalized);
  }

  var saved = localStorage.getItem('clio-games-lang');
  applyLang(saved === 'en' ? 'en' : 'zh');

  if (langBtn) {
    langBtn.addEventListener('click', function () {
      applyLang(body.getAttribute('data-lang') === 'zh' ? 'en' : 'zh');
    });
  }
}());
