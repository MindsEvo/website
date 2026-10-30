(function () {
  'use strict';
  var tree = document.getElementById('bankTree');
  var status = document.getElementById('bankStatus');
  var bank = window.ChessQuestionBank;
  var currentQuestion = null;
  var currentSolutionIndex = 0;
  if (!tree) return;
  if (!bank) {
    status.textContent = '题库目录加载失败';
    return;
  }

  function showExplanation() {
    if (!currentQuestion) return;
    document.getElementById('bankReviewExplanation').textContent = currentQuestion.explanation || '暂无解说内容';
  }

  function renderReplayMoves(question, replayTokens, cursor, replayError) {
    var list = document.getElementById('bankReviewMoves');
    list.replaceChildren();
    var tokens = Array.isArray(replayTokens) ? replayTokens : [];
    var side = String(question.fen || '').trim().split(/\s+/)[1] === 'b' ? 'b' : 'w';
    for (var index = 0; index < tokens.length;) {
      var start = index;
      var label;
      var parts = [];
      var moveNumber = Math.floor(index / 2) + 1;
      if (side === 'b') {
        label = moveNumber + '...';
        parts.push(label + ' ' + tokens[index]);
        index += 1;
        side = 'w';
      } else {
        label = moveNumber + '.';
        parts.push(label + ' ' + tokens[index]);
        index += 1;
        side = 'b';
        if (index < tokens.length) {
          parts.push(tokens[index]);
          index += 1;
          side = 'w';
        }
      }
      var item = document.createElement('li');
      item.dataset.startPly = String(start);
      item.dataset.endPly = String(index);
      item.textContent = parts.join(' ');
      list.appendChild(item);
    }
    highlightReplayMove(cursor || 0);
    document.getElementById('bankReviewStatus').textContent = replayError
      ? '棋局与解说已加载；此答案没有可播放的完整棋谱：' + replayError
      : (tokens.length ? '使用左侧播放、单步和悔棋控制查看答案。' : '此题暂没有棋谱答案。');
  }

  function highlightReplayMove(cursor) {
    var items = document.querySelectorAll('#bankReviewMoves li');
    items.forEach(function (item) {
      var start = Number(item.dataset.startPly);
      var end = Number(item.dataset.endPly);
      item.classList.toggle('is-current', cursor >= start && cursor < end);
    });
  }

  function renderBankReview(question, request) {
    document.getElementById('bankReviewLabel').textContent = question.label;
    var choices = document.getElementById('bankReviewSolutionChoices');
    choices.replaceChildren();
    question.solutions.forEach(function (solution, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'bank-review-solution-button';
      button.dataset.solutionIndex = String(index);
      button.setAttribute('aria-pressed', index === currentSolutionIndex ? 'true' : 'false');
      button.textContent = question.solutions.length > 1 ? '解法 ' + (index + 1) : '标准答案';
      button.addEventListener('click', function () { requestSolution(index); });
      choices.appendChild(button);
    });
    renderReplayMoves(question, request.replayTokens, 0, request.replayError);
  }

  function requestSolution(index) {
    if (!currentQuestion || !currentQuestion.solutions[index]) return;
    var solution = currentQuestion.solutions[index];
    var request = {
      questionId: currentQuestion.id,
      solutionText: solution.text,
      solutionLabel: currentQuestion.solutions.length > 1 ? '解法 ' + (index + 1) : (solution.label || '题目答案'),
      loaded: false
    };
    window.dispatchEvent(new CustomEvent('chess-bank-solution', { detail: request }));
    if (!request.loaded) {
      status.textContent = '解法切换失败：' + (request.error || '棋局未同步');
      return;
    }
    currentSolutionIndex = index;
    document.querySelectorAll('#bankReviewSolutionChoices .bank-review-solution-button').forEach(function (button) {
      button.setAttribute('aria-pressed', Number(button.dataset.solutionIndex) === index ? 'true' : 'false');
    });
    renderReplayMoves(currentQuestion, request.replayTokens, 0, request.replayError);
    status.textContent = request.replayAvailable ? currentQuestion.label + ' · ' + request.solutionLabel : currentQuestion.label + ' · 已载入棋局与解说';
  }

  function selectQuestion(id, button) {
    if (tree.dataset.mode === 'analysis') {
      window.location.href = '../play/index.html?question=' + encodeURIComponent(id);
      return;
    }
    var question = bank.questions[id];
    if (!question) return;
    currentQuestion = question;
    currentSolutionIndex = 0;
    var firstSolution = question.solutions[0] || {};
    var request = {
      fen: question.fen,
      questionId: id,
      solutionText: firstSolution.text || '',
      solutionLabel: question.solutions.length > 1 ? '解法 1' : (firstSolution.label || '题目答案'),
      explanation: question.explanation || '',
      loaded: false
    };
    window.dispatchEvent(new CustomEvent('chess-bank-select', { detail: request }));
    if (!request.loaded) {
      status.textContent = '题目加载失败：' + (request.error || '未能加载棋盘');
      return;
    }
    tree.querySelectorAll('[aria-current]').forEach(function (item) { item.removeAttribute('aria-current'); });
    button.setAttribute('aria-current', 'true');
    document.getElementById('bankSelection').textContent = question.label;
    renderBankReview(question, request);
    showExplanation();
    status.textContent = request.replayAvailable
      ? question.label + ' · ' + request.solutionLabel
      : question.label + ' · ' + (request.replayError ? '答案无法逐步回放：' + request.replayError : '已加载');
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
  window.addEventListener('chess-bank-replay-progress', function (event) {
    highlightReplayMove(Number(event.detail && event.detail.cursor) || 0);
  });
}());