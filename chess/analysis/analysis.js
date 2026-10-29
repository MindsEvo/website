(function () {
  'use strict';
  var bank = window.ChessQuestionBank;
  var store = window.ChessBankStore;
  var category = document.getElementById('category');
  var difficulty = document.getElementById('difficulty');
  var subcategory = document.getElementById('subcategory');
  var generateButton = document.querySelector('.generate-button');
  var status = document.getElementById('recommendationStatus');
  var names = { endgame: '残局基因', mate: '攻杀基因', tactics: '战术基因', opening: '开局基因', comprehensive: '综合基因' };
  var overviewNames = { endgame: '残局', mate: '攻杀', tactics: '战术', opening: '开局' };
  var categoryOrder = ['endgame', 'mate', 'tactics', 'opening'];
  var colors = ['#1685d1', '#239d48', '#dc7251', '#8765a6'];
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
  var total = categoryOrder.reduce(function (sum, key) { return sum + stats.counts[key]; }, 0);
  overviewItem('总题目', total);
  categoryOrder.forEach(function (key, index) {
    overviewItem(overviewNames[key], stats.counts[key]);
    var row = document.createElement('div'); row.className = 'distribution-row';
    var title = document.createElement('span'); title.textContent = names[key];
    var bar = document.createElement('meter'); bar.min = 0; bar.max = total || 1; bar.value = stats.counts[key];
    bar.setAttribute('aria-label', names[key]); bar.style.setProperty('--bar-color', colors[index]);
    var value = document.createElement('span'); value.className = 'distribution-value';
    value.textContent = stats.counts[key] + ' 个（' + (total ? stats.counts[key] / total * 100 : 0).toFixed(1) + '%）';
    row.append(title, bar, value); document.getElementById('distribution').appendChild(row);
  });
  stats.groups.filter(function (group) { return categoryOrder.includes(group.category); }).sort(function (left, right) {
    return categoryOrder.indexOf(left.category) - categoryOrder.indexOf(right.category) ||
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
    var options = Array.from(new Set(bank.records.filter(function (record) {
      return record.category === category.value && record.difficulty === difficulty.value;
    }).map(function (record) { return record.subcategory; }))).sort();
    var all = document.createElement('option');
    all.value = '';
    all.textContent = options.length ? '全部' : '暂无数据';
    all.disabled = !options.length;
    subcategory.appendChild(all);
    subcategory.disabled = !options.length;
    generateButton.disabled = !options.length;
    options.forEach(function (name) { var option = document.createElement('option'); option.value = name; option.textContent = name; subcategory.appendChild(option); });
  }
  Array.from(category.options).forEach(function (option) {
    if (stats.counts[option.value]) return;
    option.disabled = true;
    option.textContent = names[option.value] + '（暂无数据）';
  });
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
  difficulty.addEventListener('change', updateSubcategories);
  updateSubcategories();
  var saved = store.read();
  if (saved.length) status.textContent = '当前已保存 ' + saved.length + ' 个推荐题目';
}());