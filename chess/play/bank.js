(function () {
  'use strict';
  var tree = document.getElementById('bankTree');
  var status = document.getElementById('bankStatus');
  var bank = mergeBank();
  var currentQuestion = null;
  var currentSolutionIndex = 0;
  var selectionVersion = 0;
  if (!tree) return;
  if (!bank) {
    status.textContent = '题库目录加载失败';
    return;
  }

  function mergeBank() {
    var merged = JSON.parse(JSON.stringify(window.ChessQuestionBank || { tree: [], questions: {}, records: [] }));
    if (!window.ChessRootGeneStore) return merged;
    var rootIndices = { endgame: 1, tactics: 2, mate: 3, opening: 4, comprehensive: 5 };
    window.ChessRootGeneStore.readQuestions().forEach(function (record) {
      var alreadyInBundle = !!merged.questions[record.id];
      merged.questions[record.id] = record.question;
      if (!alreadyInBundle) {
        var rootNode = merged.tree[rootIndices[record.category]];
        if (!rootNode) return;
        var children = rootNode.children;
        record.treePath.forEach(function (label, index) {
          if (index === record.treePath.length - 1) {
            if (!children.some(function (item) { return item.question === record.id; })) children.push({ label: label, question: record.id });
            return;
          }
          var next = children.find(function (item) { return item.label === label && !item.question; });
          if (!next) { next = { label: label, children: [] }; children.push(next); }
          if (!next.children) next.children = [];
          children = next.children;
        });
        merged.records.push({ id: record.id, category: record.category, subcategory: record.subcategory, difficulty: record.difficulty, label: record.label, question: record.id });
      }
    });
    window.ChessRootGeneStore.applyDeletions(merged);
    window.ChessQuestionBank = merged;
    return merged;
  }

  function findRootGeneRecord(id) {
    return window.ChessRootGeneStore && window.ChessRootGeneStore.readQuestions().find(function (record) { return record.id === id; });
  }

  function showExplanation() {
    if (!currentQuestion) return;
    var solution = currentQuestion.solutions[currentSolutionIndex] || {};
    var explanation = solution.explanation == null ? currentQuestion.explanation || '' : solution.explanation;
    document.getElementById('bankReviewExplanation').textContent = explanation || '暂无解说内容';
    document.getElementById('rootGeneExplanationText').value = explanation;
    document.getElementById('expandPanel').textContent = explanation || '暂无解说内容';
    document.getElementById('expandPanel').style.whiteSpace = 'pre-wrap';
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
    var answerChoices = document.getElementById('bankAnswerChoices');
    answerChoices.replaceChildren();
    {
      question.solutions.forEach(function (solution, index) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'bank-review-solution-button';
        button.dataset.solutionIndex = String(index);
        button.setAttribute('aria-pressed', index === currentSolutionIndex ? 'true' : 'false');
        button.textContent = '答案 ' + solution.number;
        button.addEventListener('click', function () { requestSolution(index); });
        answerChoices.appendChild(button);
      });
    }
    renderReplayMoves(question, request.replayTokens, 0, request.replayError);
  }

  function requestSolution(index) {
    if (!currentQuestion || !currentQuestion.solutions[index]) return;
    var guard = { allowed: true };
    window.dispatchEvent(new CustomEvent('chess-solution-switch-check', { detail: guard }));
    if (!guard.allowed) return;
    var solution = currentQuestion.solutions[index];
    var request = {
      questionId: currentQuestion.id,
      solutionText: solution.text,
      solutionLabel: '答案 ' + solution.number,
      solutionId: solution.id,
      solutionNumber: solution.number,
      explanation: solution.explanation,
      annotation: solution.annotation || null,
      readOnly: !!currentQuestion.readOnly,
      loaded: false
    };
    window.dispatchEvent(new CustomEvent('chess-bank-solution', { detail: request }));
    if (!request.loaded) {
      status.textContent = '解法切换失败：' + (request.error || '棋局未同步');
      return;
    }
    currentSolutionIndex = index;
    closeSolutionMenu();
    showExplanation();
    document.querySelectorAll('#bankReviewSolutionChoices .bank-review-solution-button, #bankAnswerChoices .bank-review-solution-button').forEach(function (button) {
      button.setAttribute('aria-pressed', Number(button.dataset.solutionIndex) === index ? 'true' : 'false');
    });
    renderReplayMoves(currentQuestion, request.replayTokens, 0, request.replayError);
    status.textContent = request.replayAvailable ? currentQuestion.label + ' · ' + request.solutionLabel : currentQuestion.label + ' · 已载入棋局与解说';
  }

  async function selectQuestion(id, button) {
    if (tree.dataset.mode === 'analysis') {
      window.location.href = '../play/index.html?question=' + encodeURIComponent(id);
      return;
    }
    var question = bank.questions[id];
    if (!question) return;
    var guard = { allowed: true };
    window.dispatchEvent(new CustomEvent('chess-solution-switch-check', { detail: guard }));
    if (!guard.allowed) return;
    var version = ++selectionVersion;
    var loaded;
    status.textContent = '正在加载棋局与答案…';
    try {
      loaded = await window.ChessRootGeneStore.loadSolutions(id);
    } catch (error) {
      loaded = { readOnly: true, solutions: question.solutions.map(function (solution, index) {
        var match = String(solution.label || '').match(/-(\d+)\.txt$/);
        return Object.assign({}, solution, { id: solution.id || solution.label || String(index + 1), number: String(match ? Number(match[1]) : index + 1).padStart(3, '0'), explanation: question.explanation || '', annotation: null });
      }) };
    }
    if (version !== selectionVersion || !bank.questions[id]) return;
    question = Object.assign({}, question, { fen: loaded.fen || question.fen, solutions: loaded.solutions, readOnly: !!loaded.readOnly });
    question.solutions.sort(function (left, right) { return Number(left.number) - Number(right.number); });
    bank.questions[id] = question;
    currentQuestion = question;
    currentSolutionIndex = 0;
    var firstSolution = question.solutions[0] || {};
    var request = {
      fen: question.fen,
      questionId: id,
      solutionText: firstSolution.text || '',
      solutionLabel: '答案 ' + (firstSolution.number || '001'),
      solutionId: firstSolution.id || null,
      solutionNumber: firstSolution.number || '001',
      explanation: firstSolution.explanation == null ? question.explanation || '' : firstSolution.explanation,
      annotation: firstSolution.annotation || null,
      readOnly: !!question.readOnly,
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
    document.getElementById('btnSolutionMenu').disabled = !question.solutions.length;
    closeSolutionMenu();
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

  function closeSolutionMenu() {
    document.getElementById('bankAnswerChoices').classList.add('hidden');
    document.getElementById('btnSolutionMenu').setAttribute('aria-expanded', 'false');
  }
  var solutionMenuButton = document.getElementById('btnSolutionMenu');
  if (solutionMenuButton) solutionMenuButton.addEventListener('click', function () {
    var menu = document.getElementById('bankAnswerChoices');
    var open = menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !open);
    document.getElementById('btnSolutionMenu').setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', function (event) { if (solutionMenuButton && !event.target.closest('.solution-menu-wrap')) closeSolutionMenu(); });
  document.addEventListener('keydown', function (event) { if (solutionMenuButton && event.key === 'Escape') closeSolutionMenu(); });
  window.addEventListener('chess-solution-saved', function (event) {
    var result = event.detail;
    if (!currentQuestion || result.questionId !== currentQuestion.id) return;
    currentQuestion.solutions = result.solutions;
    currentSolutionIndex = Math.max(0, result.solutions.findIndex(function (solution) { return solution.id === result.solutionId; }));
    renderBankReview(currentQuestion, { replayTokens: [], replayError: '' });
    if (result.savedFields && result.savedFields.explanation !== undefined) showExplanation();
  });

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
  function selectRequested() {
    if (!requested || tree.dataset.mode === 'analysis' || currentQuestion) return;
    var selectedButton = Array.from(tree.querySelectorAll('.bank-question')).find(function (button) { return button.dataset.question === requested; });
    if (selectedButton) {
      selectQuestion(requested, selectedButton);
      for (var ancestor = selectedButton.parentElement; ancestor && ancestor !== tree; ancestor = ancestor.parentElement) {
        if (ancestor.tagName === 'DETAILS') ancestor.open = true;
      }
    } else status.textContent = '未找到指定题目';
  }
  selectRequested();
  window.addEventListener('chess-bank-explain', showExplanation);
  window.addEventListener('chess-bank-replay-progress', function (event) {
    highlightReplayMove(Number(event.detail && event.detail.cursor) || 0);
  });

  function refreshRootGeneBank() {
    bank = mergeBank();
    if (currentQuestion && !bank.questions[currentQuestion.id]) {
      currentQuestion = null;
      window.dispatchEvent(new Event('chess-bank-deleted'));
      status.textContent = '当前棋局已被删除，请重新选择题目。';
    }
    if (currentQuestion) currentQuestion = Object.assign({}, bank.questions[currentQuestion.id], { solutions: currentQuestion.solutions, readOnly: currentQuestion.readOnly });
    renderTree();
    selectRequested();
  }
  window.addEventListener('chess-root-gene-bank-updated', refreshRootGeneBank);
  window.addEventListener('storage', function (event) {
    if (event.key === 'cognichess:root-gene-bank:v1') refreshRootGeneBank();
  });
  if (window.ChessRootGeneStore && tree.dataset.mode !== 'analysis') {
    window.ChessRootGeneStore.syncFromServer().then(function () { selectRequested(); }).catch(function () {});
  }
}());