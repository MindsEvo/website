(function () {
  'use strict';

  var ACTIVE_KEY = 'me:studio:creator:active';
  var RECAP_KEY = 'me:studio:creator:last-result';

  var body = document.body;
  var langBtn = document.getElementById('langBtn');
  var form = document.getElementById('builderForm');
  var recapEmpty = document.getElementById('recapEmpty');
  var recapBody = document.getElementById('recapBody');
  var nodes = document.querySelectorAll('[data-i18n]');

  function textByLang(node, lang) {
    return node.getAttribute(lang === 'en' ? 'data-en' : 'data-zh');
  }

  function applyLang(lang) {
    var normalized = lang === 'en' ? 'en' : 'zh';
    body.setAttribute('data-lang', normalized);
    document.documentElement.lang = normalized === 'en' ? 'en' : 'zh-CN';
    document.title = normalized === 'en' ? 'Creator Builder v1 | MindsEvo' : '创作器 v1 | MindsEvo';

    nodes.forEach(function (node) {
      var text = textByLang(node, normalized);
      if (text != null) node.textContent = text;
    });

    if (langBtn) {
      langBtn.textContent = normalized === 'en' ? 'EN / CN' : 'CN / EN';
    }
    if (window.shell && typeof window.shell.setLang === 'function') {
      window.shell.setLang(normalized);
    }
    localStorage.setItem('mindsevo-lang', normalized);
  }

  function num(id, fallback) {
    var el = document.getElementById(id);
    var value = Number(el && el.value);
    return Number.isFinite(value) ? value : fallback;
  }

  function buildConfig() {
    var minValue = Math.max(1, num('minValue', 1));
    var maxValue = Math.max(minValue + 1, num('maxValue', 12));
    var minGap = Math.max(1, num('minGap', 2));

    var cfg = {
      version: 'v1',
      templateId: 'studio-comparison-template-v1',
      creatorSessionId: 'creator-' + Date.now(),
      creatorName: (document.getElementById('creatorName').value || 'Creator').trim(),
      titleZh: (document.getElementById('titleZh').value || '我的比较训练').trim(),
      titleEn: (document.getElementById('titleEn').value || 'My Comparison Lab').trim(),
      difficulty: document.getElementById('difficulty').value || 'L1',
      rounds: Math.max(1, num('rounds', 4)),
      mode: document.getElementById('mode').value || 'dots',
      minValue: minValue,
      maxValue: maxValue,
      minGap: minGap,
      createdAt: new Date().toISOString()
    };

    if (cfg.mode === 'dots') {
      cfg.maxValue = Math.min(cfg.maxValue, 12);
    }

    return cfg;
  }

  function renderRecap() {
    var raw = localStorage.getItem(RECAP_KEY);
    if (!raw) {
      recapEmpty.classList.remove('hidden');
      recapBody.classList.add('hidden');
      recapBody.innerHTML = '';
      return;
    }

    var recap;
    try {
      recap = JSON.parse(raw);
    } catch (err) {
      recapEmpty.classList.remove('hidden');
      recapBody.classList.add('hidden');
      recapBody.innerHTML = '';
      return;
    }

    recapEmpty.classList.add('hidden');
    recapBody.classList.remove('hidden');

    var scoreText = String(recap.score || 0) + '/' + String(recap.total || 0);
    var acc = recap.total > 0 ? Math.round((recap.score / recap.total) * 100) : 0;

    recapBody.innerHTML = [
      '<div class="recap-line"><b>Title:</b> ' + (recap.titleZh || '-') + ' / ' + (recap.titleEn || '-') + '</div>',
      '<div class="recap-line"><b>Creator:</b> ' + (recap.creatorName || '-') + '</div>',
      '<div class="recap-line"><b>Difficulty:</b> ' + (recap.levelId || '-') + ' · <b>Mode:</b> ' + (recap.mode || '-') + '</div>',
      '<div class="recap-line"><b>Score:</b> ' + scoreText + ' · <b>Accuracy:</b> ' + acc + '%</div>',
      '<div class="recap-line"><b>Elapsed:</b> ' + Math.round((recap.elapsed || 0) / 1000) + 's</div>',
      '<div class="recap-line"><b>Saved:</b> ' + (recap.savedAt || '-') + '</div>'
    ].join('');
  }

  function launchPlaytest(ev) {
    ev.preventDefault();
    var config = buildConfig();
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(config));
    window.location.href = '../../games/studio-comparison-lab/index.html';
  }

  var saved = localStorage.getItem('mindsevo-lang');
  applyLang(saved === 'en' ? 'en' : 'zh');
  renderRecap();

  if (langBtn) {
    langBtn.addEventListener('click', function () {
      applyLang(body.getAttribute('data-lang') === 'zh' ? 'en' : 'zh');
    });
  }

  if (form) {
    form.addEventListener('submit', launchPlaytest);
  }
}());
