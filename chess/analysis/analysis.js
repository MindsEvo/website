(function () {
  'use strict';
  var bank = window.ChessQuestionBank;
  var store = window.ChessBankStore;
  var category = document.getElementById('category');
  var difficulty = document.getElementById('difficulty');
  var subcategory = document.getElementById('subcategory');
  var status = document.getElementById('recommendationStatus');
  var names = { endgame: '残局基因', mate: '攻杀基因', tactics: '战术基因', opening: '开局基因', comprehensive: '综合基因' };
  var colors = ['#1685d1', '#239d48', '#dc7251', '#8765a6', '#64748b'];
  if (!bank || !store) {
    status.textContent = '题库数据加载失败';
    return;
  }
  var stats = store.statistics();
  var rows = [];
  function overviewItem(label, count) {
    var item = document.createElement('div');
    var title = document.createElement('dt'); title.textContent = label;
    var value = document.createElement('dd'); value.textContent = count;
    item.append(title, value); document.getElementById('overview').appendChild(item);
  }
  overviewItem('总题目', stats.total);
  Object.keys(names).forEach(function (key, index) {
    overviewItem(names[key], stats.counts[key]);
    var row = document.createElement('div'); row.className = 'distribution-row';
    var title = document.createElement('span'); title.textContent = names[key];
    var bar = document.createElement('meter'); bar.min = 0; bar.max = stats.total || 1; bar.value = stats.counts[key];
    bar.setAttribute('aria-label', names[key]); bar.style.setProperty('--bar-color', colors[index]);
    var value = document.createElement('span'); value.className = 'distribution-value';
    value.textContent = stats.counts[key] + ' 个（' + (stats.total ? stats.counts[key] / stats.total * 100 : 0).toFixed(1) + '%）';
    row.append(title, bar, value); document.getElementById('distribution').appendChild(row);
  });
  stats.groups.filter(function (group) { return ['endgame', 'mate', 'tactics'].includes(group.category); }).sort(function (left, right) {
    return ['endgame', 'mate', 'tactics'].indexOf(left.category) - ['endgame', 'mate', 'tactics'].indexOf(right.category) ||
      left.subcategory.localeCompare(right.subcategory, 'en') || left.difficulty.localeCompare(right.difficulty);
  }).forEach(function (group) {
    var row = document.createElement('tr');
    [names[group.category], group.subcategory, group.difficulty, group.count].forEach(function (value) {
      var cell = document.createElement('td'); cell.textContent = value; row.appendChild(cell);
    });
    rows.push({ element: row, group: group }); document.getElementById('statistics').appendChild(row);
  });
  function updateSubcategories() {
    subcategory.replaceChildren();
    var options = Array.from(new Set(bank.records.filter(function (record) { return record.category === category.value; }).map(function (record) { return record.subcategory; }))).sort();
    if (category.value === 'comprehensive') options = ['general'];
    var all = document.createElement('option'); all.value = ''; all.textContent = options.length ? '全部' : '暂无数据'; subcategory.appendChild(all);
    options.forEach(function (name) { var option = document.createElement('option'); option.value = name; option.textContent = name; subcategory.appendChild(option); });
  }
  function clearHighlights() { rows.forEach(function (row) { row.element.classList.remove('match'); }); }
  document.getElementById('recommendForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var criteria = { category: category.value, difficulty: difficulty.value, subcategory: subcategory.value, count: document.getElementById('count').value };
    var result = store.sample(criteria);
    clearHighlights();
    rows.forEach(function (row) {
      row.element.classList.toggle('match', row.group.category === criteria.category && row.group.difficulty === criteria.difficulty && (!criteria.subcategory || row.group.subcategory === criteria.subcategory));
    });
    if (!result.length) { status.textContent = '根据当前条件未找到合适的题目'; return; }
    try {
      store.save(result.map(function (record) { return record.id; }));
      var missing = result.filter(function (record) { return !record.question; }).length;
      status.textContent = '已生成 ' + result.length + ' 个推荐题目，已保存，可在对弈页面查看。' + (missing ? '其中 ' + missing + ' 题缺少 FEN，暂不能载入棋盘。' : '');
    } catch (error) { status.textContent = '推荐保存失败：' + error.message; }
  });
  document.getElementById('clearRecommendations').addEventListener('click', function () {
    if (!window.confirm('确定清空当前专家推荐吗？')) return;
    try { store.save([]); clearHighlights(); status.textContent = '已清空专家推荐'; }
    catch (error) { status.textContent = '清空失败：' + error.message; }
  });
  category.addEventListener('change', updateSubcategories);
  updateSubcategories();
  var saved = store.read();
  if (saved.length) status.textContent = '当前已保存 ' + saved.length + ' 个推荐题目';
}());