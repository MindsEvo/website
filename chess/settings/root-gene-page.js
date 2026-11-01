(function () {
  'use strict';

  const core = window.ChessRootGeneCore;
  const store = window.ChessRootGeneStore;
  const sourceBank = window.ChessQuestionBank;
  const PIECES = [
    { code: 'k', name: '王', white: 'wK.svg', black: 'bK.svg' },
    { code: 'q', name: '后', white: 'wQ.svg', black: 'bQ.svg' },
    { code: 'r', name: '车', white: 'wR.svg', black: 'bR.svg' },
    { code: 'b', name: '象', white: 'wB.svg', black: 'bB.svg' },
    { code: 'n', name: '马', white: 'wN.svg', black: 'bN.svg' },
    { code: 'p', name: '兵', white: 'wP.svg', black: 'bP.svg' }
  ];
  const ROOT_INDEX = { endgame: 1, tactics: 2, mate: 3, opening: 4, comprehensive: 5 };
  const LIST_KEY = 'cognichess:root-gene-series:v1';
  const DISPLAY_SETTINGS_KEY = 'cognichess:display-settings';
  const BOARD_THEMES = {
    classic: { light: '#f1f1cf', dark: '#769656' },
    ocean: { light: '#d9ecff', dark: '#4f7fb3' },
    wood: { light: '#f6e5c9', dark: '#b9855a' }
  };
  const PIECE_UNICODE = { wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙', bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟' };
  const state = { board: core.emptyBoard(), turn: 'w', castling: 'KQkq', enPassant: '-', pieceColor: 'white', palettePiece: null, erase: false, selectedSquare: null, flipped: false, currentGene: '', currentQuestion: null, geneNames: [], bank: null };
  state.display = { boardTheme: 'classic', pieceStyle: 'svg' };
  const $ = id => document.getElementById(id);

  function loadDisplaySettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(DISPLAY_SETTINGS_KEY) || 'null');
      if (saved && saved.boardTheme && saved.pieceStyle) state.display = saved;
    } catch (_) {}
    const theme = BOARD_THEMES[state.display.boardTheme] || BOARD_THEMES.classic;
    document.documentElement.style.setProperty('--board-light', theme.light);
    document.documentElement.style.setProperty('--board-dark', theme.dark);
  }

  function pieceView(piece) {
    if (state.display.pieceStyle === 'svg') {
      const image = document.createElement('img');
      image.className = 'piece-svg';
      image.src = '../play/assets/pieces/' + (piece === piece.toUpperCase() ? 'w' : 'b') + piece.toUpperCase() + '.svg';
      image.alt = piece;
      return image;
    }
    const glyph = document.createElement('span');
    const colorKey = (piece === piece.toUpperCase() ? 'w' : 'b') + piece.toLowerCase();
    glyph.className = 'piece-text' + (state.display.pieceStyle === 'unicode-min' ? ' piece-text-min' : '');
    glyph.textContent = PIECE_UNICODE[colorKey];
    return glyph;
  }

  function setMessage(text, type) {
    const node = $('validationMessage');
    node.textContent = text;
    node.className = 'validation-message' + (type ? ' ' + type : '');
  }

  function seriesKey() { return $('geneType').value + '/' + $('geneLevel').value; }
  function readGeneNames() {
    try { const data = JSON.parse(localStorage.getItem(LIST_KEY) || '{}'); return Array.isArray(data[seriesKey()]) ? data[seriesKey()] : []; }
    catch (_) { return []; }
  }
  function writeGeneNames() {
    try { const data = JSON.parse(localStorage.getItem(LIST_KEY) || '{}'); data[seriesKey()] = state.geneNames; localStorage.setItem(LIST_KEY, JSON.stringify(data)); }
    catch (_) {}
  }
  function renderGeneNames() {
    const list = $('geneList');
    list.replaceChildren();
    state.geneNames.forEach(name => {
      const item = document.createElement('li');
      item.textContent = name;
      item.classList.toggle('selected', name === state.currentGene);
      item.addEventListener('click', () => { state.currentGene = name; renderGeneNames(); updateTargetDirectory(); });
      list.appendChild(item);
    });
  }
  function updateNameFormat() {
    const level = $('geneLevel').value;
    const examples = {
      endgame: `eg_[棋子]-[对手]_${level}-001，例如 eg_R-E_${level}-001`,
      tactics: `tac_[lichess标签]_${level}-001，例如 tac_fork_${level}-001`,
      mate: `mate_[杀法标签]_${level}-001，例如 mate_backRankMate_${level}-001`,
      opening: `eco_[ECO编码]_${level}-001，例如 eco_C50_${level}-001`,
      comprehensive: `co_[棋子]-[对手]_${level}-001，例如 co_R-E_${level}-001`
    };
    $('nameFormat').textContent = '命名规范：' + examples[$('geneType').value];
    state.geneNames = readGeneNames();
    state.currentGene = '';
    renderGeneNames();
    updateTargetDirectory();
  }
  function updateTargetDirectory() {
    const geneName = state.currentGene || $('geneName').value.trim();
    if (!geneName) {
      $('targetDirectory').textContent = '保存位置：选择系列名称后自动确定';
      return;
    }
    try {
      const parsed = store.parseName($('geneType').value, $('geneLevel').value, geneName);
      $('targetDirectory').textContent = '保存位置：mindsevo/' + parsed.relativePath;
    } catch (_) {
      $('targetDirectory').textContent = '保存位置：名称符合规范后自动确定';
    }
  }
  function addGene() {
    const name = $('geneName').value.trim();
    if (!name) return setMessage('请输入系列名称。', 'error');
    try { store.parseName($('geneType').value, $('geneLevel').value, name); }
    catch (error) { return setMessage(error.message, 'error'); }
    if (state.geneNames.includes(name)) return setMessage('该系列名称已存在。', 'error');
    if (sourceBank && Object.keys(sourceBank.questions).some(id => id.endsWith('/' + name + '.fen'))) return setMessage('题库中已存在该编号，请增加序号。', 'error');
    if (store.readQuestions().some(item => item.geneName === name)) return setMessage('根基因库中已存在该编号，请增加序号。', 'error');
    state.geneNames.unshift(name);
    state.currentGene = name;
    $('geneName').value = '';
    writeGeneNames();
    renderGeneNames();
    updateTargetDirectory();
    setMessage('已添加系列名称：' + name, 'success');
  }
  function deleteGene() {
    if (!state.currentGene) return setMessage('请先选择要删除的系列名称。', 'error');
    state.geneNames = state.geneNames.filter(name => name !== state.currentGene);
    state.currentGene = '';
    writeGeneNames();
    renderGeneNames();
    setMessage('已从当前系列列表删除名称。', 'success');
  }

  function currentFen() { return core.boardToFen(state.board, state.turn, state.castling, state.enPassant); }
  function updateBoardSummary() {
    const pieces = state.board.flat().filter(Boolean);
    $('pieceCount').textContent = pieces.length + ' / 32';
    $('fenPreview').textContent = currentFen();
  }
  function renderBoard() {
    const host = $('chessboard');
    host.replaceChildren();
    for (let viewRow = 0; viewRow < 8; viewRow += 1) {
      for (let viewCol = 0; viewCol < 8; viewCol += 1) {
        const row = state.flipped ? 7 - viewRow : viewRow;
        const col = state.flipped ? 7 - viewCol : viewCol;
        const piece = state.board[row][col];
        const square = document.createElement('button');
        square.type = 'button';
        square.className = 'square ' + ((row + col) % 2 ? 'dark' : 'light');
        square.setAttribute('role', 'gridcell');
        square.setAttribute('aria-label', String.fromCharCode(97 + col) + (8 - row) + (piece ? ' ' + (piece === piece.toUpperCase() ? '白方' : '黑方') + PIECES.find(item => item.code === piece.toLowerCase()).name : ' 空格'));
        if (state.selectedSquare && state.selectedSquare[0] === row && state.selectedSquare[1] === col) square.classList.add('target-square');
        if (piece) {
          square.appendChild(pieceView(piece));
        }
        square.addEventListener('click', () => clickSquare(row, col));
        square.addEventListener('contextmenu', event => { event.preventDefault(); state.board[row][col] = ''; state.selectedSquare = null; markChanged('已移除棋子。'); });
        host.appendChild(square);
      }
    }
    $('rankLabels').replaceChildren(...(state.flipped ? '12345678' : '87654321').split('').map(value => { const span = document.createElement('span'); span.textContent = value; return span; }));
    $('fileLabels').replaceChildren(...(state.flipped ? 'hgfedcba' : 'abcdefgh').split('').map(value => { const span = document.createElement('span'); span.textContent = value; return span; }));
    updateBoardSummary();
  }
  function renderPalette() {
    const host = $('piecePalette');
    host.replaceChildren();
    PIECES.forEach(item => {
      const color = state.pieceColor;
      const piece = color === 'white' ? item.code.toUpperCase() : item.code;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'piece-tool' + (state.palettePiece === piece ? ' selected' : '');
      button.title = (color === 'white' ? '白方' : '黑方') + item.name;
      button.setAttribute('aria-label', button.title);
      const image = document.createElement('img');
      if (state.display.pieceStyle === 'svg') image.src = '../play/assets/pieces/' + (color === 'white' ? item.white : item.black);
      else {
        const glyph = document.createElement('span');
        const colorKey = (color === 'white' ? 'w' : 'b') + item.code;
        glyph.className = 'piece-palette-glyph' + (state.display.pieceStyle === 'unicode-min' ? ' piece-text-min' : '');
        glyph.textContent = PIECE_UNICODE[colorKey];
        button.appendChild(glyph);
      }
      image.alt = '';
      if (state.display.pieceStyle === 'svg') button.appendChild(image);
      button.addEventListener('click', () => {
        state.palettePiece = state.palettePiece === piece ? null : piece;
        state.erase = false;
        state.selectedSquare = null;
        $('eraseTool').classList.remove('selected');
        $('boardMessage').textContent = state.palettePiece ? '已选择' + button.title + '，点击棋盘放置。' : '选择棋子，再点击棋盘格进行摆放。';
        renderPalettes();
        renderBoard();
      });
      host.appendChild(button);
    });
    document.querySelectorAll('.piece-color-button').forEach(button => {
      const active = button.dataset.pieceColor === state.pieceColor;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  function renderPalettes() { renderPalette(); }
  function markChanged(message) {
    state.currentQuestion = null;
    $('pageStatus').textContent = '局面已修改';
    $('boardMessage').textContent = message || '棋局已修改。';
    renderBoard();
  }
  function clickSquare(row, col) {
    if (state.erase) { state.board[row][col] = ''; state.selectedSquare = null; return markChanged('已移除棋子。'); }
    if (state.palettePiece) { state.board[row][col] = state.palettePiece; state.selectedSquare = null; return markChanged('已放置棋子。'); }
    if (state.selectedSquare) {
      const [fromRow, fromCol] = state.selectedSquare;
      if (fromRow === row && fromCol === col) state.selectedSquare = null;
      else { state.board[row][col] = state.board[fromRow][fromCol]; state.board[fromRow][fromCol] = ''; state.selectedSquare = null; }
      return markChanged('已移动棋子。');
    }
    if (state.board[row][col]) { state.selectedSquare = [row, col]; $('boardMessage').textContent = '已选中棋子，点击目标格移动。'; renderBoard(); }
  }

  function categoryRootLabel(category) {
    return { endgame: '残局基因 (endgame)', tactics: '战术基因 (tactics)', mate: '攻杀基因 (mate)', opening: '开局基因 (opening)', comprehensive: '综合基因 (comprehensive)' }[category];
  }
  function addLocalQuestions(bank) {
    store.readQuestions().forEach(record => {
      bank.questions[record.id] = record.question;
      const root = bank.tree[ROOT_INDEX[record.category]];
      if (!root) return;
      let children = root.children;
      record.treePath.forEach((label, index) => {
        if (index === record.treePath.length - 1) {
          if (!children.some(item => item.question === record.id)) children.push({ label, question: record.id });
        } else {
          let node = children.find(item => item.label === label && !item.question);
          if (!node) { node = { label, children: [] }; children.push(node); }
          if (!node.children) node.children = [];
          children = node.children;
        }
      });
    });
  }
  function renderNode(item, parent) {
    if (item.question) {
      if (!state.bank.questions[item.question]) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bank-question';
      button.dataset.question = item.question;
      button.textContent = item.label;
      button.title = item.question;
      if (state.currentQuestion === item.question) button.setAttribute('aria-current', 'true');
      button.addEventListener('click', () => loadQuestion(item.question));
      parent.appendChild(button);
      return;
    }
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = item.label;
    details.appendChild(summary);
    const children = document.createElement('div');
    (item.children || []).forEach(child => renderNode(child, children));
    details.appendChild(children);
    parent.appendChild(details);
  }
  function renderBankTree() {
    const host = $('bankTree');
    const expanded = new Set(Array.from(host.querySelectorAll('details[open] > summary')).map(summary => summary.textContent));
    state.bank = JSON.parse(JSON.stringify(sourceBank));
    addLocalQuestions(state.bank);
    store.applyDeletions(state.bank);
    if (state.currentQuestion && !state.bank.questions[state.currentQuestion]) {
      state.currentQuestion = null;
      state.board = core.emptyBoard();
      state.selectedSquare = null;
      renderBoard();
    }
    $('deleteQuestion').disabled = !state.currentQuestion;
    host.replaceChildren();
    state.bank.tree.forEach(item => renderNode(item, host));
    host.querySelectorAll('details').forEach(details => { if (expanded.has(details.querySelector('summary').textContent)) details.open = true; });
    if (!expanded.size) {
      const topLevel = host.querySelectorAll(':scope > details');
      if (topLevel.length > 1) {
        topLevel[1].open = true;
        const firstLevel = topLevel[1].querySelector(':scope > div > details');
        if (firstLevel) {
          firstLevel.open = true;
          const firstTheme = firstLevel.querySelector(':scope > div > details');
          if (firstTheme) firstTheme.open = true;
        }
      }
    }
    $('libraryStatus').textContent = Object.keys(state.bank.questions).length + ' 个棋局';
  }
  function loadQuestion(id) {
    const question = state.bank.questions[id];
    if (!question) return setMessage('未找到该棋局。', 'error');
    state.currentQuestion = id;
    $('deleteQuestion').disabled = false;
    try {
      const parsed = core.parseFen(question.fen);
      state.board = parsed.board;
      state.turn = parsed.turn;
      state.castling = parsed.castling;
      state.enPassant = parsed.enPassant;
      state.palettePiece = null;
      state.erase = false;
      state.selectedSquare = null;
      state.currentQuestion = id;
      state.currentGene = '';
      const local = store.readQuestions().find(item => item.id === id);
      $('geneType').value = local ? local.category : id.split('/')[0];
      $('geneLevel').value = local ? local.difficulty : ((id.match(/L[123]/) || ['L1'])[0]);
      updateNameFormat();
      $('firstMover').textContent = state.turn === 'w' ? '⚪ 先' : '⚫ 先';
      $('firstMover').setAttribute('aria-pressed', state.turn === 'b' ? 'true' : 'false');
      $('pageStatus').textContent = '已载入题库棋局';
      $('boardMessage').textContent = '已载入「' + question.label + '」的棋局位置，可手动改编。';
      $('eraseTool').classList.remove('selected');
      renderPalettes();
      renderBoard();
      renderBankTree();
      setMessage('仅载入 FEN 局面；棋谱与解说留在对弈页面。', 'success');
    } catch (error) {
      renderBankTree();
      setMessage('FEN 载入失败：' + error.message + '；该题仍可使用“删除棋局”清理。', 'error');
    }
  }

  async function saveQuestion() {
    if (!state.currentGene) return setMessage('请先添加并选择符合规范的系列名称。', 'error');
    let record;
    try {
      core.parseFen(currentFen());
      record = store.makeQuestion({ category: $('geneType').value, level: $('geneLevel').value, geneName: state.currentGene, fen: currentFen(), status: 'draft' });
    } catch (error) { return setMessage(error.message, 'error'); }
    if (state.bank.questions[record.id] || store.readQuestions().some(item => item.id === record.id)) return setMessage('该题目编号已存在于系统题库，请调整三位序号。', 'error');
    $('saveToBank').disabled = true;
    try {
      $('pageStatus').textContent = '正在写入题库';
      await store.saveQuestion(record);
      state.currentQuestion = record.id;
      $('pageStatus').textContent = '已存储到题库';
      $('boardMessage').textContent = '已保存 ' + record.geneName + '，可到对弈页面使用 AI-AI 求解。';
      renderBankTree();
      setMessage('题目已写入 ' + record.relativePath + '。', 'success');
      const link = document.createElement('a');
      link.href = '../play/index.html?question=' + encodeURIComponent(record.id);
      link.textContent = ' 打开对弈页面';
      link.className = 'open-play-link';
      $('libraryStatus').appendChild(link);
    } catch (error) {
      $('pageStatus').textContent = '保存失败';
      setMessage(error.message || '题库写入失败。', 'error');
    } finally { $('saveToBank').disabled = false; }
  }

  async function deleteSelectedQuestion() {
    const id = state.currentQuestion;
    const question = id && state.bank.questions[id];
    if (!question) return setMessage('请先从右侧目录选择要删除的棋局。', 'error');
    const name = id.split('/').pop().replace(/\.fen$/, '');
    $('deleteQuestion').disabled = true;
    try {
      const preview = await store.previewDeletion(id);
      const location = preview.locations.length ? preview.locations.join('\n') : '此题仅存在于预编译题库，无对应 academy 文件。';
      if (!window.confirm('删除棋局：' + question.label + '\n编号：' + name + '\n位置：' + location + '\n索引：' + preview.indexes.join('\n') + '\n\n将删除棋局文件、关联答案与解说、目录索引及缓存。共享解法和学习历史保留。\n此操作不可撤销，确认删除？')) {
        $('deleteQuestion').disabled = !state.currentQuestion;
        return;
      }
      const result = await store.deleteQuestion(id);
      const removedNames = new Set(result.deletedIds.map(questionId => questionId.split('/').pop().replace(/\.fen$/, '')));
      const series = JSON.parse(localStorage.getItem(LIST_KEY) || '{}');
      Object.keys(series).forEach(key => { series[key] = series[key].filter(value => !removedNames.has(value)); });
      localStorage.setItem(LIST_KEY, JSON.stringify(series));
      state.geneNames = readGeneNames();
      state.currentGene = '';
      state.currentQuestion = null;
      state.board = core.emptyBoard();
      state.selectedSquare = null;
      renderGeneNames();
      renderBoard();
      renderBankTree();
      updateTargetDirectory();
      $('pageStatus').textContent = '棋局已删除';
      setMessage('已删除 ' + name + '，清理 ' + result.deletedFiles + ' 个文件及关联索引。', 'success');
    } catch (error) {
      setMessage('删除失败：' + error.message, 'error');
      $('deleteQuestion').disabled = !state.currentQuestion;
    }
  }
  function clearResult() {
    state.board = core.emptyBoard();
    state.castling = 'KQkq';
    state.enPassant = '-';
    state.palettePiece = null;
    state.erase = false;
    state.selectedSquare = null;
    $('eraseTool').classList.remove('selected');
    $('pageStatus').textContent = '系统就绪';
    $('boardMessage').textContent = '棋盘已清空。选择棋子，再点击棋盘格进行摆放。';
    renderPalettes();
    renderBoard();
    setMessage('棋盘结果已清空；系列名称列表保留。', 'success');
  }
  function bindEvents() {
    $('openUsageHelp').addEventListener('click', () => $('usageHelp').showModal());
    $('usageHelp').addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); $('usageHelp').close(); }
    });
    $('usageHelp').addEventListener('click', event => {
      if (event.target !== $('usageHelp')) return;
      const bounds = $('usageHelp').getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) $('usageHelp').close();
    });
    $('geneType').addEventListener('change', updateNameFormat);
    $('geneLevel').addEventListener('change', updateNameFormat);
    $('geneName').addEventListener('input', updateTargetDirectory);
    $('addGene').addEventListener('click', addGene);
    $('geneName').addEventListener('keydown', event => { if (event.key === 'Enter') addGene(); });
    $('deleteGene').addEventListener('click', deleteGene);
    $('deleteQuestion').addEventListener('click', deleteSelectedQuestion);
    $('saveToBank').addEventListener('click', saveQuestion);
    $('clearResult').addEventListener('click', clearResult);
    $('firstMover').addEventListener('click', () => {
      state.turn = state.turn === 'w' ? 'b' : 'w';
      $('firstMover').textContent = state.turn === 'w' ? '⚪ 先' : '⚫ 先';
      $('firstMover').setAttribute('aria-pressed', state.turn === 'b' ? 'true' : 'false');
      renderBoard();
    });
    $('flipBoard').addEventListener('click', () => { state.flipped = !state.flipped; renderBoard(); });
    $('eraseTool').addEventListener('click', () => {
      state.erase = !state.erase;
      state.palettePiece = null;
      state.selectedSquare = null;
      $('eraseTool').classList.toggle('selected', state.erase);
      $('boardMessage').textContent = state.erase ? '点击棋盘上的棋子移除。' : '选择棋子，再点击棋盘格进行摆放。';
      renderPalettes();
      renderBoard();
    });
    document.querySelectorAll('.piece-color-button').forEach(button => button.addEventListener('click', () => {
      state.pieceColor = button.dataset.pieceColor;
      state.palettePiece = null;
      state.erase = false;
      state.selectedSquare = null;
      $('eraseTool').classList.remove('selected');
      $('boardMessage').textContent = '已切换为' + (state.pieceColor === 'white' ? '白方' : '黑方') + '棋子，请选择棋种。';
      renderPalettes();
      renderBoard();
    }));
    window.addEventListener('chess-root-gene-bank-updated', renderBankTree);
    window.addEventListener('storage', event => { if (event.key === 'cognichess:root-gene-bank:v1') renderBankTree(); });
  }
  function init() {
    if (!sourceBank || !store) return setMessage('题库或根基因存储模块未加载。', 'error');
    loadDisplaySettings();
    state.geneNames = readGeneNames();
    bindEvents();
    updateNameFormat();
    store.getRootStatus().then(result => {
      $('bankFolderStatus').textContent = result.dataExists
        ? '固定 JS academy 根目录：mindsevo/web/chess/academy'
        : 'JS academy 目录不存在：mindsevo/web/chess/academy';
      $('bankFolderStatus').classList.toggle('error', !result.dataExists);
    }).catch(error => {
      $('bankFolderStatus').textContent = error.message || '固定题库服务未连接';
      $('bankFolderStatus').classList.add('error');
    });
    renderGeneNames();
    renderPalettes();
    renderBoard();
    renderBankTree();
    store.syncFromServer().then(() => { renderBankTree(); if (requested && !state.currentQuestion) loadQuestion(requested); }).catch(() => {});
    const requested = new URLSearchParams(location.search).get('question');
    if (requested) loadQuestion(requested);
  }
  init();
})();
