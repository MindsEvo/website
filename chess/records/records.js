(function () {
  'use strict';
  var store = window.ChessRecords;
  var bank = window.ChessQuestionBank;
  var bankStore = window.ChessBankStore;
  var mode = 'intelligent';
  var names = { endgame: '残局基因', mate: '攻杀基因', tactics: '战术基因', opening: '开局基因', comprehensive: '综合基因' };
  var avatars = { k: '王', q: '后', r: '车', b: '象', n: '马', p: '兵' };
  var userSelect = document.getElementById('userSelect');
  var pageStatus = document.getElementById('pageStatus');
  function element(tag, text, className) {
    var node = document.createElement(tag); if (text != null) node.textContent = text; if (className) node.className = className; return node;
  }
  function avatarPath(kind) { return '../play/assets/pieces/w' + kind.toUpperCase() + '.svg'; }
  function renderRecommendations() {
    var list = document.getElementById('recommendationList'); list.replaceChildren();
    document.getElementById('intelligentMode').setAttribute('aria-pressed', String(mode === 'intelligent'));
    document.getElementById('manualMode').setAttribute('aria-pressed', String(mode === 'manual'));
    var ids = store.recommendations(mode);
    ids.forEach(function (id) {
      var record = bank.records.find(function (item) { return item.id === id; });
      if (!record) return;
      var item = element('li');
      if (record.question) {
        var link = element('a', bank.questions[record.question].label);
        link.href = '../play/index.html?question=' + encodeURIComponent(record.question);
        item.appendChild(link);
      } else item.appendChild(element('span', record.label + '（缺少 FEN）'));
      item.appendChild(element('small', names[record.category] + ' · ' + record.difficulty));
      list.appendChild(item);
    });
    if (!list.children.length) list.appendChild(element('li', '暂无推荐', 'empty-state'));
  }
  function renderTrend(userId) {
    var period = document.getElementById('trendPeriod').value;
    var points = store.trend(userId, period);
    var chart = document.getElementById('trend'); chart.replaceChildren();
    chart.classList.toggle('month', period === 'month'); chart.style.setProperty('--days', points.length);
    var max = Math.max(1, ...points.map(function (point) { return point.count; }));
    points.forEach(function (point) {
      var day = element('div', null, 'trend-day'); day.title = point.label + '：' + point.count + ' 次';
      var value = element('span', point.count ? point.count : '', 'trend-count');
      var bar = element('div', null, 'trend-bar'); bar.style.height = (point.count / max * 118) + 'px';
      day.append(value, bar, element('span', point.label, 'trend-label')); chart.appendChild(day);
    });
    chart.setAttribute('aria-label', points.map(function (point) { return point.label + '：' + point.count + '次'; }).join('，'));
    document.getElementById('trendStatus').textContent = points.some(function (point) { return point.count; }) ? '' : '暂无学习记录';
  }
  function render() {
    try {
      var data = store.read();
      userSelect.replaceChildren();
      data.users.forEach(function (user) { var option = element('option', user.name); option.value = user.id; userSelect.appendChild(option); });
      userSelect.value = data.activeUser;
      var user = data.users.find(function (item) { return item.id === data.activeUser; });
      document.getElementById('userAvatar').src = avatarPath(user.avatar);
      var summary = store.summary(data.activeUser);
      var periods = document.getElementById('periodStats'); periods.replaceChildren();
      [['本周学习', summary.week], ['本月学习', summary.month], ['累计学习', summary.total]].forEach(function (period) {
        var block = element('div'); block.append(element('dt', period[0]), element('dd', period[1] + ' 次')); periods.appendChild(block);
      });
      var table = document.getElementById('categoryStats'); table.replaceChildren();
      var distribution = document.getElementById('categoryDistribution'); distribution.replaceChildren();
      Object.keys(names).forEach(function (category) {
        var stats = summary.categories[category]; if (!stats || !stats.total) return;
        var row = element('tr');
        [names[category], stats.L1, stats.L2, stats.L3, stats.total].forEach(function (value) { row.appendChild(element('td', value)); }); table.appendChild(row);
        var line = element('div', null, 'distribution-row');
        line.style.setProperty('--bar-color', { endgame: '#2686d9', mate: '#239d48', tactics: '#dc7251', opening: '#8765a6', comprehensive: '#64748b' }[category]);
        var meter = element('meter'); meter.min = 0; meter.max = summary.total; meter.value = stats.total; meter.setAttribute('aria-label', names[category]);
        line.append(element('span', names[category]), meter, element('span', stats.total + ' 次（' + (stats.total / summary.total * 100).toFixed(1) + '%）', 'distribution-value'));
        distribution.appendChild(line);
      });
      if (!table.children.length) { var empty = element('td', '暂无练习记录，开始你的学习之旅吧！'); empty.colSpan = 5; var row = element('tr'); row.appendChild(empty); table.appendChild(row); }
      if (!distribution.children.length) distribution.appendChild(element('p', '暂无分类数据', 'empty-state'));
      renderTrend(data.activeUser); renderRecommendations(); pageStatus.textContent = '';
    } catch (error) { pageStatus.textContent = '记录读取失败：' + error.message; }
  }
  userSelect.addEventListener('change', function () {
    try { store.switchUser(userSelect.value); } catch (error) { pageStatus.textContent = '切换失败：' + error.message; }
  });
  document.getElementById('trendPeriod').addEventListener('change', render);
  document.getElementById('manageUsers').addEventListener('click', function () {
    try {
      var editors = document.getElementById('userEditors'); editors.replaceChildren();
      store.read().users.forEach(function (user) {
        var group = element('fieldset', null, 'user-editor'); group.dataset.user = user.id;
        var label = element('label', '用户名'); var input = element('input'); input.name = 'username'; input.value = user.name; input.required = true; input.maxLength = 40; label.appendChild(input); group.appendChild(label);
        var options = element('div', null, 'avatar-options'); options.setAttribute('role', 'group'); options.setAttribute('aria-label', user.name + '的头像');
        Object.keys(avatars).forEach(function (kind) {
          var choice = element('label'); choice.title = avatars[kind]; var radio = element('input'); radio.type = 'radio'; radio.name = 'avatar-' + user.id; radio.value = kind; radio.checked = user.avatar === kind; radio.setAttribute('aria-label', avatars[kind]);
          var image = element('img'); image.src = avatarPath(kind); image.alt = ''; choice.append(radio, image); options.appendChild(choice);
        });
        group.appendChild(options); editors.appendChild(group);
      });
      document.getElementById('userError').textContent = ''; document.getElementById('usersDialog').showModal();
    } catch (error) { pageStatus.textContent = error.message; }
  });
  document.getElementById('usersForm').addEventListener('submit', function (event) {
    event.preventDefault();
    try {
      var users = Array.from(document.querySelectorAll('.user-editor')).map(function (group) {
        return { id: group.dataset.user, name: group.querySelector('[name="username"]').value, avatar: group.querySelector('input[type="radio"]:checked').value };
      });
      store.updateUsers(users); document.getElementById('usersDialog').close();
    } catch (error) { document.getElementById('userError').textContent = error.message; }
  });
  document.querySelectorAll('.close-dialog').forEach(function (button) { button.addEventListener('click', function () { button.closest('dialog').close(); }); });
  function switchMode(next) {
    mode = next;
    try { renderRecommendations(); document.getElementById('recommendationStatus').textContent = ''; }
    catch (error) { pageStatus.textContent = error.message; }
  }
  document.getElementById('intelligentMode').addEventListener('click', function () { switchMode('intelligent'); });
  document.getElementById('manualMode').addEventListener('click', function () { switchMode('manual'); });
  function updateSubcategories() {
    var category = document.getElementById('recommendCategory').value;
    var select = document.getElementById('recommendSubcategory'); select.replaceChildren();
    var all = element('option', '全部'); all.value = ''; select.appendChild(all);
    Array.from(new Set(bank.records.filter(function (record) { return record.category === category; }).map(function (record) { return record.subcategory; }))).sort().forEach(function (name) {
      var option = element('option', name); option.value = name; select.appendChild(option);
    });
  }
  document.getElementById('recommendCategory').addEventListener('change', updateSubcategories);
  document.getElementById('updateRecommendations').addEventListener('click', function () {
    document.getElementById('manualFilters').hidden = mode !== 'manual';
    document.getElementById('recommendCount').max = mode === 'manual' ? 10 : 30;
    document.getElementById('recommendCount').value = 3;
    document.getElementById('recommendTitle').textContent = mode === 'manual' ? '手动选择' : '智能推荐设置';
    document.getElementById('recommendError').textContent = '';
    updateSubcategories(); document.getElementById('recommendDialog').showModal();
  });
  document.getElementById('recommendForm').addEventListener('submit', function (event) {
    event.preventDefault();
    try {
      var criteria = { category: mode === 'intelligent' ? 'endgame' : document.getElementById('recommendCategory').value,
        difficulty: mode === 'intelligent' ? 'L1' : document.getElementById('recommendDifficulty').value,
        subcategory: mode === 'intelligent' ? '' : document.getElementById('recommendSubcategory').value };
      var pool = bankStore.matching(criteria).slice();
      var count = Math.max(1, Math.min(mode === 'intelligent' ? 30 : 10, Math.floor(Number(document.getElementById('recommendCount').value) || 3)));
      for (var index = pool.length - 1; index > 0; index--) { var next = Math.floor(Math.random() * (index + 1)); var item = pool[index]; pool[index] = pool[next]; pool[next] = item; }
      var ids = pool.slice(0, count).map(function (record) { return record.id; });
      if (!ids.length) { document.getElementById('recommendError').textContent = '根据当前条件未找到合适的题目'; return; }
      store.saveRecommendations(mode, ids);
      bankStore.save(ids);
      document.getElementById('recommendDialog').close();
      document.getElementById('recommendationStatus').textContent = '已生成并保存 ' + ids.length + ' 个推荐题目';
    } catch (error) { document.getElementById('recommendError').textContent = '推荐保存失败：' + error.message; }
  });
  document.getElementById('clearRecommendations').addEventListener('click', function () {
    if (!window.confirm('确定清空当前模式的推荐吗？')) return;
    try {
      var prior = store.recommendations(mode).slice(); store.saveRecommendations(mode, []);
      var published = bankStore.read();
      if (JSON.stringify(prior) === JSON.stringify(published)) bankStore.save([]);
      document.getElementById('recommendationStatus').textContent = '已清空当前模式推荐';
    } catch (error) { document.getElementById('recommendationStatus').textContent = error.message; }
  });
  window.addEventListener('chess-records-change', render);
  window.addEventListener('storage', render);
  window.addEventListener('pageshow', render);
  render();
}());