(function () {
  'use strict';

  const core = window.ChessRootGeneCore;
  const bank = window.ChessQuestionBank;
  const STORAGE_KEY = 'cognichess:root-gene-designs:v1';
  const pieceNames = { k: '王', q: '后', r: '车', b: '象', n: '马', p: '兵' };
  const filenames = { K: 'wK.svg', Q: 'wQ.svg', R: 'wR.svg', B: 'wB.svg', N: 'wN.svg', P: 'wP.svg', k: 'bK.svg', q: 'bQ.svg', r: 'bR.svg', b: 'bB.svg', n: 'bN.svg', p: 'bP.svg' };
  const roots = {
    endgame: ['王兵残局', '车后残局', '轻子残局'],
    tactics: ['捉双', '牵制', '串击', '闪击', '引离', '腾挪'],
    mate: ['底线杀', '闷杀', '阿拉伯杀', '钩杀'],
    opening: ['开局元基因'],
    comprehensive: ['综合局面设计']
  };
  const categoryType = ['endgame', 'tactics', 'mate', 'opening', 'comprehensive'];
  const state = { board: core.emptyBoard(), turn: 'w', castling: '-', enPassant: '-', color: 'white', tool: null, selectedSquare: null, groups: [], worker: null, analysisBusy: false, loadedQuestion: null };
  const $ = id => document.getElementById(id);

  function option(select, value, label) {
    const item = document.createElement('option');
    item.value = value;
    item.textContent = label;
    select.append(item);
  }

  function setMessage(text, type) {
    const message = $('validationMessage');
    message.textContent = text;
    message.className = 'validation-message' + (type ? ' ' + type : '');
  }

  function currentFen() { return core.boardToFen(state.board, state.turn, state.castling, state.enPassant); }

  function initializeFenControls() {
    ['-', 'K', 'Q', 'KQ', 'k', 'Kk', 'Qk', 'KQk', 'q', 'Kq', 'Qq', 'KQq', 'kq', 'Kkq', 'Qkq', 'KQkq'].forEach(value => option($('castlingRights'), value, value === '-' ? '无' : value));
    option($('enPassantTarget'), '-', '无');
    for (const rank of ['3', '6']) for (const file of 'abcdefgh') option($('enPassantTarget'), file + rank, file + rank);
  }

  function setDirty() {
    $('pageStatus').textContent = '有未保存修改';
    $('analysisResult').textContent = '局面已更改，请重新分析。';
    syncFen();
    renderBoard();
  }

  function syncFen() {
    $('fenText').value = currentFen();
    updateMaterial();
  }

  function pieceAsset(piece) { return '../play/assets/pieces/' + filenames[piece]; }

  function renderBoard() {
    const host = $('chessboard');
    host.replaceChildren();
    state.board.forEach((row, rowIndex) => row.forEach((piece, colIndex) => {
      const square = document.createElement('button');
      square.type = 'button';
      square.className = 'chess-square ' + ((rowIndex + colIndex) % 2 ? 'dark' : 'light');
      square.setAttribute('role', 'gridcell');
      square.setAttribute('aria-label', String.fromCharCode(97 + colIndex) + (8 - rowIndex) + (piece ? ' ' + (piece === piece.toUpperCase() ? '白方' : '黑方') + pieceNames[piece.toLowerCase()] : ' 空格'));
      if (state.selectedSquare?.[0] === rowIndex && state.selectedSquare?.[1] === colIndex) square.classList.add('target-square');
      if (piece) { const image = document.createElement('img'); image.src = pieceAsset(piece); image.alt = ''; square.append(image); }
      square.addEventListener('click', () => clickSquare(rowIndex, colIndex));
      host.append(square);
    }));
  }

  function updateMaterial() {
    let white = 0; let black = 0;
    state.board.flat().forEach(piece => { if (piece) piece === piece.toUpperCase() ? white++ : black++; });
    $('pieceCount').textContent = (white + black) + ' / 32';
    $('materialCount').textContent = '白 ' + white + ' · 黑 ' + black;
  }

  function renderPalette() {
    const palette = $('piecePalette');
    palette.replaceChildren();
    Object.entries(pieceNames).forEach(([lower, name]) => {
      const piece = state.color === 'white' ? lower.toUpperCase() : lower;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'piece-tool' + (state.tool === piece ? ' selected' : '');
      button.title = (state.color === 'white' ? '白方' : '黑方') + name;
      const image = document.createElement('img'); image.src = pieceAsset(piece); image.alt = '';
      const label = document.createElement('span'); label.textContent = name;
      button.append(image, label);
      button.addEventListener('click', () => {
        state.tool = state.tool === piece ? null : piece;
        state.selectedSquare = null;
        $('boardMessage').textContent = state.tool ? '已选择' + button.title + '，点击棋盘摆放。' : '选择棋子，再点击棋盘格进行摆放。';
        $('eraseTool').classList.remove('selected'); renderPalette(); renderBoard();
      });
      palette.append(button);
    });
  }

  function clickSquare(row, col) {
    if (state.tool === 'erase') state.board[row][col] = '';
    else if (state.tool) state.board[row][col] = state.tool;
    else if (state.selectedSquare) {
      const [fromRow, fromCol] = state.selectedSquare;
      if (fromRow === row && fromCol === col) state.selectedSquare = null;
      else if (!state.board[row][col]) { state.board[row][col] = state.board[fromRow][fromCol]; state.board[fromRow][fromCol] = ''; state.selectedSquare = null; }
      else state.selectedSquare = [row, col];
    } else if (state.board[row][col]) state.selectedSquare = [row, col];
    $('boardMessage').textContent = state.tool === 'erase' ? '点击棋子即可移除。' : state.tool ? '点击棋盘摆放所选棋子。' : state.selectedSquare ? '选择目标空格移动该棋子。' : '选择棋子，再点击棋盘格进行摆放。';
    setDirty();
  }

  function setGeneOptions(type, selected) {
    const select = $('rootGene'); select.replaceChildren();
    (roots[type] || []).forEach(value => option(select, value, value));
    if (selected && !Array.from(select.options).some(item => item.value === selected)) option(select, selected, selected);
    if (selected) select.value = selected;
    $('geneDescription').textContent = selected ? '从现有题库载入的分类路径，可在此基础上调整与补充。' : '选择现有根基因主题，或载入已有题目进行修改。';
  }

  function populateBank() {
    if (!bank?.tree) return;
    const categorySelect = $('bankCategory');
    bank.tree.forEach((root, index) => {
      if (index === 0) return;
      option(categorySelect, String(index), root.label);
    });
    $('bankQuestionCount').textContent = Object.keys(bank.questions || {}).length + ' 个局面';
    updateBankGroups();
  }

  function collectGroups(node, path, rootIndex, groups) {
    const nextPath = path.concat(node.label);
    const leaves = (node.children || []).filter(child => child.question && bank.questions[child.question]);
    if (leaves.length) {
      const items = leaves.map(child => ({ id: child.question, label: child.label, path: nextPath.concat(child.label), question: bank.questions[child.question] }));
      groups.push({ id: rootIndex + ':' + nextPath.join(' / '), label: nextPath.slice(1).join(' / ') || node.label, path: nextPath, items });
      return items;
    }
    return (node.children || []).flatMap(child => collectGroups(child, nextPath, rootIndex, groups));
  }

  function updateBankGroups() {
    const rootIndex = Number($('bankCategory').value);
    const root = bank.tree[rootIndex];
    const groups = [];
    if (root) (root.children || []).forEach(child => collectGroups(child, [root.label], rootIndex, groups));
    const unique = new Map();
    groups.forEach(group => { if (group.items.length) unique.set(group.id, group); });
    state.groups = Array.from(unique.values());
    const select = $('bankGroup'); select.replaceChildren();
    state.groups.forEach(group => option(select, group.id, group.label + ' · ' + group.items.length));
    updateBankQuestions();
  }

  function updateBankQuestions() {
    const group = state.groups.find(item => item.id === $('bankGroup').value) || state.groups[0];
    const select = $('bankQuestion'); select.replaceChildren();
    if (group) group.items.forEach((item, index) => option(select, String(index), item.label));
    $('loadBankQuestion').disabled = !group || !group.items.length;
  }

  function loadBankQuestion() {
    const group = state.groups.find(item => item.id === $('bankGroup').value) || state.groups[0];
    const item = group?.items[Number($('bankQuestion').value)];
    if (!item) return;
    try {
      const parsed = core.parseFen(item.question.fen);
      state.board = parsed.board; state.turn = parsed.turn; state.castling = parsed.castling; state.enPassant = parsed.enPassant; state.loadedQuestion = item.id;
      $('sideToMove').value = parsed.turn; $('castlingRights').value = parsed.castling; $('enPassantTarget').value = parsed.enPassant; $('puzzleTitle').value = item.label;
      $('puzzleSolution').value = (item.question.solutions || []).map(solution => solution.text).filter(Boolean).join('\n\n');
      $('puzzleDescription').value = item.question.explanation || '';
      const categoryIndex = Number($('bankCategory').value) - 1;
      const category = categoryType[categoryIndex] || 'comprehensive';
      $('geneType').value = category; $('geneLevel').value = inferLevel(item.path); $('difficulty').value = $('geneLevel').value;
      setGeneOptions(category, item.path.slice(2).join(' / ') || item.path.at(-1));
      state.tool = null; state.selectedSquare = null; $('eraseTool').classList.remove('selected'); renderPalette(); syncFen(); renderBoard();
      $('pageStatus').textContent = '已载入题库题目';
      $('boardMessage').textContent = '已载入「' + item.label + '」，修改后请另存为草案。';
      setMessage('源题目：' + item.path.join(' / ') + '。原题库文件未被修改。', 'success');
    } catch (error) { setMessage('载入失败：' + error.message, 'error'); }
  }

  function inferLevel(path) { const match = path.join(' ').match(/\bL([123])\b/); return match ? 'L' + match[1] : 'L1'; }

  function applyFen(fen) {
    const parsed = core.parseFen(fen);
    state.board = parsed.board; state.turn = parsed.turn; state.castling = parsed.castling; state.enPassant = parsed.enPassant; state.selectedSquare = null; state.tool = null;
    $('sideToMove').value = state.turn; $('castlingRights').value = state.castling; $('enPassantTarget').value = state.enPassant; $('eraseTool').classList.remove('selected');
    renderPalette(); setDirty(); setMessage('FEN结构与双方王位置检查通过。', 'success'); $('pageStatus').textContent = '局面已载入';
  }

  function validateCurrent() {
    try { core.parseFen(currentFen()); setMessage('局面检查通过：FEN结构、棋子数量限制及双方王位置有效。', 'success'); return true; }
    catch (error) { setMessage(error.message, 'error'); return false; }
  }

  function makeDesign() {
    return { schemaVersion: 1, id: 'manual-' + Date.now().toString(36), sourceQuestionId: state.loadedQuestion, name: $('puzzleTitle').value.trim() || '未命名局面', category: $('geneType').value, gene: $('rootGene').value, difficulty: $('difficulty').value, content: { fen: currentFen() }, solution: { text: $('puzzleSolution').value.trim() }, description: $('puzzleDescription').value.trim(), metadata: { status: 'draft', verified: false, generator: 'manual-position-designer', updatedAt: new Date().toISOString() } };
  }

  function readSaved() {
    try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); if (!Array.isArray(value)) throw new Error('invalid drafts'); return value; }
    catch (_) { setMessage('本机设计数据格式损坏，未覆盖原数据。', 'error'); return null; }
  }

  function loadDesign(item) {
    try {
      applyFen(item.content?.fen || item.fen); $('puzzleTitle').value = item.name || '';
      $('puzzleSolution').value = item.solution?.text || item.solution || ''; $('puzzleDescription').value = item.description || '';
      $('geneType').value = item.category || 'comprehensive'; $('geneLevel').value = item.difficulty || 'L1'; $('difficulty').value = item.difficulty || 'L1';
      setGeneOptions($('geneType').value, item.gene || '综合局面设计'); $('pageStatus').textContent = '设计已载入';
    } catch (error) { setMessage(error.message, 'error'); }
  }

  function renderSaved() {
    const host = $('savedDesigns'); host.replaceChildren(); const items = readSaved();
    if (!items || !items.length) { const empty = document.createElement('p'); empty.className = 'empty-list'; empty.textContent = items ? '还没有保存的设计' : '本机设计数据无法读取'; host.append(empty); return; }
    items.forEach((item, index) => {
      const row = document.createElement('div'); row.className = 'saved-item'; const info = document.createElement('div');
      const name = document.createElement('div'); name.className = 'saved-name'; name.textContent = item.name || '未命名局面';
      const meta = document.createElement('div'); meta.className = 'saved-meta'; meta.textContent = (item.difficulty || 'L1') + (item.sourceQuestionId ? ' · 修改题' : ' · 新题草案'); info.append(name, meta);
      const actions = document.createElement('div'); const load = document.createElement('button'); load.type = 'button'; load.textContent = '载入'; load.addEventListener('click', () => loadDesign(item));
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '删除'; remove.addEventListener('click', () => { const next = readSaved(); if (!next) return; next.splice(index, 1); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); renderSaved(); });
      actions.append(load, remove); row.append(info, actions); host.append(row);
    });
  }

  function download(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type: type + ';charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function analyzePosition() {
    if (state.analysisBusy) return;
    state.analysisBusy = true; const button = $('analyzePosition'); button.disabled = true; button.textContent = '正在分析…'; $('analysisResult').textContent = '正在启动 Stockfish…';
    try {
      const worker = state.worker || (state.worker = new Worker('../play/assets/engine/stockfish-19-lite-single.js'));
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { worker.removeEventListener('message', onMessage); reject(new Error('引擎启动超时')); }, 12000);
        function onMessage(event) { if (event.data === 'uciok') { clearTimeout(timer); worker.removeEventListener('message', onMessage); resolve(); } }
        worker.addEventListener('message', onMessage); worker.postMessage('uci');
      });
      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { worker.removeEventListener('message', onMessage); reject(new Error('局面分析超时')); }, 15000);
        let info = '';
        function onMessage(event) { const line = String(event.data || ''); if (line.startsWith('info depth ') && line.includes(' score ')) info = line; if (line.startsWith('bestmove ')) { clearTimeout(timer); worker.removeEventListener('message', onMessage); resolve({ best: line.split(/\s+/)[1], info }); } }
        const ready = event => { if (event.data === 'readyok') { worker.removeEventListener('message', ready); worker.postMessage('position fen ' + currentFen()); worker.postMessage('go depth 14 movetime 1800'); } };
        worker.addEventListener('message', onMessage); worker.addEventListener('message', ready); worker.postMessage('setoption name Threads value 1'); worker.postMessage('setoption name Skill Level value 20'); worker.postMessage('isready');
      });
      const score = result.info.match(/score (cp|mate) (-?\d+)/); const evaluation = score ? (score[1] === 'mate' ? '将杀 ' + score[2] : (Number(score[2]) / 100).toFixed(2) + ' 兵') : '评估不可用';
      $('analysisResult').textContent = '建议着法 ' + result.best + ' · 当前行棋方视角 ' + evaluation + '。仅供人工复核。';
    } catch (error) { $('analysisResult').textContent = error.message + '。通过本地 HTTP 地址打开页面可使用引擎。'; }
    finally { state.analysisBusy = false; button.disabled = false; button.textContent = '分析局面'; }
  }

  function bindEvents() {
    $('geneType').addEventListener('change', event => setGeneOptions(event.target.value));
    $('geneLevel').addEventListener('change', event => { $('difficulty').value = event.target.value; });
    $('bankCategory').addEventListener('change', updateBankGroups); $('bankGroup').addEventListener('change', updateBankQuestions); $('loadBankQuestion').addEventListener('click', loadBankQuestion);
    document.querySelectorAll('.color-choice').forEach(button => button.addEventListener('click', () => { state.color = button.dataset.color; document.querySelectorAll('.color-choice').forEach(item => item.classList.toggle('active', item === button)); state.tool = null; renderPalette(); }));
    $('eraseTool').addEventListener('click', () => { state.tool = state.tool === 'erase' ? null : 'erase'; state.selectedSquare = null; $('eraseTool').classList.toggle('selected', state.tool === 'erase'); renderPalette(); renderBoard(); });
    $('clearBoard').addEventListener('click', () => { state.board = core.emptyBoard(); state.castling = '-'; state.enPassant = '-'; state.selectedSquare = null; setDirty(); });
    $('sideToMove').addEventListener('change', event => { state.turn = event.target.value; state.enPassant = '-'; $('enPassantTarget').value = '-'; setDirty(); });
    $('castlingRights').addEventListener('change', event => { state.castling = event.target.value; setDirty(); });
    $('enPassantTarget').addEventListener('change', event => { state.enPassant = event.target.value; setDirty(); });
    $('loadFen').addEventListener('click', () => { try { applyFen($('fenText').value); } catch (error) { setMessage(error.message, 'error'); } });
    $('validateFen').addEventListener('click', () => { try { core.parseFen($('fenText').value); setMessage('FEN结构与双方王位置检查通过。', 'success'); } catch (error) { setMessage(error.message, 'error'); } });
    $('saveDesign').addEventListener('click', () => { if (!validateCurrent()) return; try { const items = readSaved(); if (!items) return; items.unshift(makeDesign()); localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50))); renderSaved(); $('pageStatus').textContent = '设计已保存'; setMessage('草案已保存到本机浏览器，原题库未被修改。', 'success'); } catch (_) { setMessage('本机存储不可用或空间不足，未能保存。', 'error'); } });
    $('exportJson').addEventListener('click', () => { if (validateCurrent()) download('root-gene-draft.json', JSON.stringify(makeDesign(), null, 2), 'application/json'); });
    $('exportFen').addEventListener('click', () => { if (validateCurrent()) download('position.fen', currentFen(), 'text/plain'); });
    $('clearSaved').addEventListener('click', () => { const items = readSaved(); if (!items || !items.length || !window.confirm('清空本机保存的全部根基因设计？')) return; localStorage.removeItem(STORAGE_KEY); renderSaved(); });
    $('analyzePosition').addEventListener('click', analyzePosition);
    $('importFile').addEventListener('change', async event => { const file = event.target.files[0]; if (!file) return; try { const text = await file.text(); const data = file.name.toLowerCase().endsWith('.json') ? JSON.parse(text) : null; const fen = data?.content?.fen || data?.fen || text.match(/(?:[1-8pnbrqkPNBRQK]+\/){7}[1-8pnbrqkPNBRQK]+\s+[wb]\s+[^\s]+\s+[^\s]+\s+\d+\s+\d+/)?.[0]; if (!fen) throw new Error('文件中没有找到FEN。'); if (data) loadDesign(data); else applyFen(fen); } catch (error) { setMessage(error.message || '无法读取文件。', 'error'); } event.target.value = ''; });
  }

  function init() {
    $('rankLabels').replaceChildren(...'87654321'.split('').map(value => { const span = document.createElement('span'); span.textContent = value; return span; }));
    $('fileLabels').replaceChildren(...'abcdefgh'.split('').map(value => { const span = document.createElement('span'); span.textContent = value; return span; }));
    initializeFenControls(); setGeneOptions('endgame');
    if (bank?.tree) populateBank(); else { $('bankQuestionCount').textContent = '题库未加载'; $('loadBankQuestion').disabled = true; }
    try {
      const initial = core.parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      state.board = initial.board; state.turn = initial.turn; state.castling = initial.castling; state.enPassant = initial.enPassant;
      $('sideToMove').value = state.turn; $('castlingRights').value = state.castling; $('enPassantTarget').value = state.enPassant;
    } catch (_) {}
    bindEvents(); syncFen(); renderBoard(); renderPalette(); renderSaved();
  }

  init();
})();