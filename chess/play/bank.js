(function () {
  'use strict';
  var tree = document.getElementById('bankTree');
  var status = document.getElementById('bankStatus');
  var bank = window.ChessQuestionBank;
  var currentQuestion = null;
  if (!tree) return;
  if (!bank) {
    status.textContent = '题库目录加载失败';
    return;
  }

  function showExplanation() {
    if (!currentQuestion) return;
    var panel = document.getElementById('expandPanel');
    panel.classList.add('bank-content');
    panel.textContent = currentQuestion.explanation || '暂无解说内容';
  }

  function selectQuestion(id, button) {
    if (tree.dataset.mode === 'analysis') {
      window.location.href = '../play/index.html?question=' + encodeURIComponent(id);
      return;
    }
    var question = bank.questions[id];
    if (!question) return;
    var request = { fen: question.fen, questionId: id, loaded: false };
    window.dispatchEvent(new CustomEvent('chess-bank-select', { detail: request }));
    if (!request.loaded) {
      status.textContent = '题目加载失败：' + (request.error || '未能加载棋盘');
      return;
    }
    currentQuestion = question;
    tree.querySelectorAll('[aria-current]').forEach(function (item) { item.removeAttribute('aria-current'); });
    button.setAttribute('aria-current', 'true');
    document.getElementById('bankSelection').textContent = question.label;
    var answers = document.getElementById('bankAnswers');
    answers.replaceChildren();
    if (!question.solutions.length) answers.textContent = '暂无答案内容';
    question.solutions.forEach(function (solution, index) {
      if (question.solutions.length > 1) {
        var heading = document.createElement('div');
        heading.className = 'bank-answer-label';
        heading.textContent = '解法 ' + (index + 1);
        answers.appendChild(heading);
      }
      var content = document.createElement('div');
      content.textContent = solution.text;
      answers.appendChild(content);
    });
    showExplanation();
    status.textContent = question.label;
    if (window.ChessRecords) {
      try {
        var activityId = window.ChessRecords.begin(id);
        window.dispatchEvent(new CustomEvent('chess-records-session', { detail: { id: activityId } }));
      } catch (error) {
        window.dispatchEvent(new CustomEvent('chess-records-session', { detail: { id: null } }));
        status.textContent = question.label + '；记录保存失败：' + error.message;
      }
    }
  }

  function renderNode(item, parent) {
    if (item.question) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'bank-question';
      button.dataset.question = item.question;
      button.textContent = item.label;
      button.title = item.question;
      button.addEventListener('click', function () { selectQuestion(item.question, button); });
      parent.appendChild(button);
      return;
    }
    var details = document.createElement('details');
    var summary = document.createElement('summary');
    summary.textContent = item.label;
    details.appendChild(summary);
    var children = document.createElement('div');
    if (!item.children.length) {
      children.className = 'bank-empty';
      children.textContent = item.label.includes('专家推荐') ? '暂无专家推荐' : '暂无题目';
    }
    item.children.forEach(function (child) { renderNode(child, children); });
    details.appendChild(children);
    parent.appendChild(details);
  }

  function renderTree() {
    var expanded = Array.from(tree.querySelectorAll('details[open] > summary')).map(function (summary) { return summary.textContent; });
    tree.replaceChildren();
    var recommendations = window.ChessBankStore ? window.ChessBankStore.read() : [];
    bank.tree.forEach(function (item, index) {
      if (index === 0) {
        item = { label: item.label, children: recommendations.map(function (id, position) {
          var record = bank.records.find(function (entry) { return entry.id === id; });
          return record.question ? { label: (position + 1) + '. ' + record.label, question: record.question } :
            { label: (position + 1) + '. ' + record.label + '（缺少 FEN）', children: [] };
        }) };
      }
      renderNode(item, tree);
    });
    tree.querySelectorAll('details').forEach(function (details) {
      if (expanded.includes(details.querySelector('summary').textContent)) details.open = true;
    });
    if (currentQuestion) {
      tree.querySelectorAll('.bank-question').forEach(function (button) {
        if (button.dataset.question === currentQuestion.id) button.setAttribute('aria-current', 'true');
      });
    }
  }
  function renderUsers() {
    var select = document.getElementById('bankUser');
    if (!select || !window.ChessRecords) return;
    try {
      var data = window.ChessRecords.read();
      var previousUser = select.value;
      select.replaceChildren();
      data.users.forEach(function (user) {
        var option = document.createElement('option'); option.value = user.id; option.textContent = user.name;
        select.appendChild(option);
      });
      select.value = data.activeUser;
      if (previousUser && previousUser !== data.activeUser) {
        window.dispatchEvent(new CustomEvent('chess-records-session', { detail: { id: null, switchUser: true } }));
      }
    } catch (error) { status.textContent = '用户记录读取失败：' + error.message; }
  }
  renderUsers();
  var userSelect = document.getElementById('bankUser');
  if (userSelect) userSelect.addEventListener('change', function () {
    try {
      window.ChessRecords.switchUser(userSelect.value);
      window.dispatchEvent(new CustomEvent('chess-records-session', { detail: { id: null, switchUser: true } }));
      if (currentQuestion) {
        var button = Array.from(tree.querySelectorAll('.bank-question')).find(function (item) { return item.dataset.question === currentQuestion.id; });
        if (button) selectQuestion(currentQuestion.id, button);
      }
    } catch (error) { status.textContent = '用户切换失败：' + error.message; renderUsers(); }
  });
  renderTree();
  window.addEventListener('chess-bank-recommendations', function () {
    renderTree();
    var expert = tree.querySelector('details');
    if (expert) expert.open = true;
  });
  window.addEventListener('storage', function () { renderTree(); renderUsers(); });
  window.addEventListener('pageshow', function () { renderTree(); renderUsers(); });
  var requested = new URLSearchParams(window.location.search).get('question');
  if (requested && tree.dataset.mode !== 'analysis') {
    var selectedButton = Array.from(tree.querySelectorAll('.bank-question')).find(function (button) { return button.dataset.question === requested; });
    if (selectedButton) {
      selectQuestion(requested, selectedButton);
      for (var ancestor = selectedButton.parentElement; ancestor && ancestor !== tree; ancestor = ancestor.parentElement) {
        if (ancestor.tagName === 'DETAILS') ancestor.open = true;
      }
    } else status.textContent = '未找到指定题目';
  }
  window.addEventListener('chess-bank-explain', showExplanation);
}());