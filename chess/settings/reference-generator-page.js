(function () {
  'use strict';

  const bank = window.ChessQuestionBank;
  const generator = window.ChessReferenceGenerator;
  const source = new URLSearchParams(window.location.search).get('source') === 'lichess' ? 'lichess' : 'endgame';
  const $ = id => document.getElementById(id);
  const state = { results: [] };

  function option(select, value, label) {
    const node = document.createElement('option'); node.value = value; node.textContent = label; select.append(node);
  }

  function currentPool() {
    const type = source === 'endgame' ? 'endgame' : $('puzzleType').value;
    return generator.collect(bank, source, type, $('difficulty').value, $('theme').value);
  }

  function fillThemes() {
    const theme = $('theme'); theme.replaceChildren(); option(theme, 'all', '全部主题');
    const type = source === 'endgame' ? 'endgame' : $('puzzleType').value;
    const pool = generator.collect(bank, source, type, 'all', 'all');
    Array.from(new Set(pool.map(item => item.theme))).sort((left, right) => left.localeCompare(right, 'zh-CN')).forEach(value => option(theme, value, value));
    $('sourceCount').textContent = pool.length + ' 道可用参考题';
    $('sampleButton').disabled = !pool.length;
  }

  function renderResults(items) {
    const host = $('results'); host.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = '当前筛选条件没有可用题目，请调整难度或主题。'; host.append(empty);
      $('resultSummary').textContent = '无匹配题目'; return;
    }
    items.forEach((item, index) => {
      const card = document.createElement('article'); card.className = 'reference-card';
      const main = document.createElement('div'); main.className = 'reference-main';
      const title = document.createElement('div'); title.className = 'reference-title'; title.textContent = String(index + 1).padStart(2, '0') + ' · ' + item.label;
      const path = document.createElement('div'); path.className = 'reference-path'; path.textContent = item.path.join(' / ') + ' · ' + item.level;
      const fen = document.createElement('div'); fen.className = 'reference-fen'; fen.textContent = 'FEN  ' + item.question.fen;
      main.append(title, path, fen);
      const solutionText = (item.question.solutions || []).map(solution => solution.text).filter(Boolean).join('\n');
      if (solutionText) { const solution = document.createElement('div'); solution.className = 'reference-solution'; solution.textContent = solutionText; main.append(solution); }
      const link = document.createElement('a'); link.className = 'edit-link'; link.href = './root-gene.html?question=' + encodeURIComponent(item.id); link.textContent = '载入手工编辑';
      card.append(main, link); host.append(card);
    });
    $('resultSummary').textContent = '本次抽取 ' + items.length + ' 道 · 从 ' + currentPool().length + ' 道符合条件的题目中抽样';
  }

  function sampleReferences() {
    const pool = currentPool();
    const requested = Math.max(1, Math.min(100, Number($('sampleCount').value) || 1));
    $('sampleCount').value = requested;
    state.results = generator.sample(pool, requested);
    renderResults(state.results);
  }

  function initialize() {
    if (!bank || !generator) { $('sourceCount').textContent = '题库数据无法载入'; $('sampleButton').disabled = true; return; }
    if (source === 'endgame') {
      $('pageTitle').textContent = '残局参考生成器'; $('pageSubtitle').textContent = '从现有残局题库筛选参考局面，载入后手工修改。';
      $('themeLabel').textContent = '残局主题';
      $('sourceNote').textContent = '筛选沿用原生成器的难度级别与题目数量概念。当前题库包未保留 Syzygy 的 WDL/DTZ 分析字段，不能按 DTZ 筛选或生成新的表库局面。';
    } else {
      $('pageTitle').textContent = 'Lichess 参考生成器'; $('pageSubtitle').textContent = '从现有战术与攻杀题库抽样，作为手工设计参考。';
      $('typeField').hidden = false; $('themeLabel').textContent = 'Lichess 主题';
      $('sourceNote').textContent = '当前可按题型、L1–L3 和主题抽样。打包数据未保留 Lichess rating、popularity、plays 等字段，不能按原桌面端的评分/受欢迎度参数筛选；此页抽样不会访问 Lichess 或写入题库。';
      $('puzzleType').addEventListener('change', fillThemes);
    }
    fillThemes();
    $('sampleButton').addEventListener('click', sampleReferences);
    $('difficulty').addEventListener('change', () => { $('sourceCount').textContent = currentPool().length + ' 道符合条件'; });
    $('theme').addEventListener('change', () => { $('sourceCount').textContent = currentPool().length + ' 道符合条件'; });
    $('sampleCount').addEventListener('change', () => { const value = Number($('sampleCount').value); $('sampleCount').value = Math.max(1, Math.min(100, Number.isFinite(value) ? value : 6)); });
  }

  initialize();
})();
