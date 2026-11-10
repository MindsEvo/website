import { createGame, getPieceLabel } from '../../core.mjs';
import {
  appendStandardPositionMark,
  createStandardBoardArtwork,
  createStandardPieceElement,
  isCannonStartPosition,
  isPawnStartPosition,
  placeStandardIntersection
} from '../../board-standard.mjs';
import { applyBoardStyle, onBoardStyleChange } from '../../board-style.mjs';
import { mountBoardControlPanel } from '../../shared/board-control-panel.mjs';
import { createBoardAudio } from '../../shared/board-audio.mjs';

const GAMES = [
  { title: '弃马十三着', value: '弃子、诱导、连续进攻', available: true },
  { title: '当头炮对屏风马', value: '主动进攻与稳健防守', available: true },
  { title: '中炮对反宫马', value: '灵活防守、侧翼反击', source: '底马起死回生——赵国荣先胜胡荣华', available: true },
  { title: '双马饮泉', value: '棋子协同、战术组合', source: '古谱《桔中秘》残局谱', available: true },
  { title: '仙人指路', value: '试探、布局创新、灵活转换' },
  { title: '七星聚会', value: '深度推演、残局艺术' }
];

const MOVES = [
  { notation: '炮二平五', note: '红方炮二平五。' },
  { notation: '炮8平5', note: '黑方炮8平5。' },
  { notation: '车一进一', note: '红方车一进一。' },
  { notation: '马8进7', note: '黑方马8进7。' },
  { notation: '车一平六', note: '红方车一平六。' },
  { notation: '车9平8', note: '黑方车9平8。' },
  { notation: '马二进三', note: '红方马二进三。' },
  { notation: '车8进6', note: '黑方车8进6。' },
  { notation: '车六进七', note: '红方车六进七。' },
  { notation: '马2进1', note: '黑方马2进1。' },
  { notation: '车九进一', note: '红方车九进一。' },
  { notation: '炮2进7', note: '黑方炮2进7。' },
  { notation: '炮八进五', note: '红方炮八进五。' },
  { notation: '马7退8', note: '黑方马7退8。' },
  { notation: '炮五进四', note: '红方炮五进四。' },
  { notation: '士6进5', note: '黑方士6进5。' },
  { notation: '车九平六', note: '红方车九平六。' },
  { notation: '将5平6', note: '黑方将5平6。' },
  { notation: '前车六进一', note: '红方前车六进一：同在六路的两辆车中，前车指更靠近黑方的一辆；本着由前车前进一步。' },
  { notation: '士5退4', note: '黑方士5退4。' },
  { notation: '车六平四', note: '红方车六平四：前车被黑方士吃掉后，由后车从六路平至四路。' },
  { notation: '炮5平6', note: '黑方炮5平6。' },
  { notation: '车四进六', note: '红方车四进六，吃掉黑方炮。' },
  { notation: '将6平5', note: '黑方将6平5。' },
  { notation: '炮八平五', note: '红方炮八平五，棋谱主线结束。' }
];

const SCREEN_HORSE_MOVES = [
  { notation: '炮二平五', note: '红方炮二平五，中炮开局。' },
  { notation: '马8进7', note: '黑方马8进7，屏风马应对。' },
  { notation: '马二进三', note: '红方马二进三，发展右马。' },
  { notation: '卒7进1', note: '黑方卒7进1。' },
  { notation: '车一平二', note: '红方车一平二，准备出车。' },
  { notation: '车9平8', note: '黑方车9平8。' },
  { notation: '车二进六', note: '红方车二进六，车出巡河。' },
  { notation: '马2进3', note: '黑方马2进3，另一侧马也出动。' },
  { notation: '兵五进一', note: '红方兵五进一。' },
  { notation: '卒3进1', note: '黑方卒3进1。' },
  { notation: '车二平三', note: '红方车二平三。' },
  { notation: '士4进5', note: '黑方士4进5。' },
  { notation: '马八进七', note: '红方马八进七。' },
  { notation: '炮8退1', note: '黑方炮8退1。' },
  { notation: '兵五进一', note: '红方兵五进一。' },
  { notation: '炮8平7', note: '黑方炮8平7。' },
  { notation: '车三平四', note: '红方车三平四。' },
  { notation: '象3进5', note: '黑方象3进5。' },
  { notation: '马三进五', note: '红方马三进五。' },
  { notation: '炮2进1', note: '黑方炮2进1。' },
  { notation: '车四进二', note: '红方车四进二。' },
  { notation: '炮2退2', note: '黑方炮2退2。' },
  { notation: '车四退二', note: '红方车四退二。' },
  { notation: '卒5进1', note: '黑方卒5进1。' },
  { notation: '车四平七', note: '红方车四平七。' },
  { notation: '马7进5', note: '黑方马7进5。' },
  { notation: '炮五进三', note: '红方炮五进三。' },
  { notation: '炮7进2', note: '黑方炮7进2。' },
  { notation: '车七进一', note: '红方车七进一。' },
  { notation: '马5退3', note: '黑方马5退3。' },
  { notation: '马五进四', note: '红方马五进四。' },
  { notation: '炮7平5', note: '黑方炮7平5。' },
  { notation: '马七进五', note: '红方马七进五。' },
  { notation: '炮2进5', note: '黑方炮2进5。' },
  { notation: '兵七进一', note: '红方兵七进一。' },
  { notation: '车1平4', note: '黑方车1平4。' },
  { notation: '炮八平五', note: '红方炮八平五。' },
  { notation: '车4进6', note: '黑方车4进6。' },
  { notation: '炮五进二', note: '红方炮五进二。' },
  { notation: '象7进5', note: '黑方象7进5。' },
  { notation: '马四进五', note: '红方马四进五。' },
  { notation: '炮2平5', note: '黑方炮2平5。' },
  { notation: '炮五进四', note: '红方炮五进四。' },
  { notation: '炮5退4', note: '黑方炮5退4。' },
  { notation: '炮五平三', note: '红方炮五平三。' },
  { notation: '将5平4', note: '黑方将5平4。' },
  { notation: '帅五进一', note: '红方帅五进一。' },
  { notation: '车8进8', note: '黑方车8进8，棋谱主线结束。' }
];

const REVERSE_PALACE_HORSE_MOVES = [
  '炮二平五',
  '马2进3',
  '马二进三',
  '炮8平6',
  '车一平二',
  '马8进7',
  '兵三进一',
  '卒3进1',
  '马八进九',
  '象7进5',
  '炮八平七',
  '车1平2',
  '车九平八',
  '炮2进4',
  '兵七进一',
  '卒3进1',
  '兵三进一',
  '卒7进1',
  '车二进四',
  '炮2平3',
  '车八进九',
  '炮3进3',
  '仕六进五',
  '马3退2',
  '炮五进四',
  '士6进5',
  '炮五退一',
  '马2进3',
  '车二平四',
  '卒3进1',
  '车四进三',
  '卒3进1',
  '车四平三',
  '卒3平2',
  '马九退八',
  '卒2进1',
  '车三退一',
  '马3进2',
  '车三平八',
  '马2进1',
  '车八退三',
  '卒7进1',
  '兵五进一',
  '卒2进1',
  '车八平九',
  '炮3退5',
  '相三进五',
  '卒9进1',
  '车九平七',
  '炮3平1',
  '马三进五',
  '卒7平6',
  '马五进七',
  '炮1进5',
  '仕五退六',
  '卒6平5',
  '马七进八',
].map((notation, index) => ({
  notation,
  note: `${index % 2 === 0 ? '红方' : '黑方'}${notation}。`
}));

const DOUBLE_HORSE_MOVES = [
  '马八退六',
  '马9进7',
  '兵六进一',
  '将5平4',
  '马六进八',
  '将4平5',
  '马六进七',
  '将5平4',
  '马七退五',
  '将4平5',
  '马五进三',
].map((notation, index) => ({
  notation,
  note: `${index % 2 === 0 ? '红方' : '黑方'}${notation}。${index === 10 ? '双马饮泉，古谱《桔中秘》残局谱。' : ''}`
}));

const DOUBLE_HORSE_STARTING_BOARD = [
  [null, null, null, null, 'k', 'a', 'e', null, null],
  [null, 'H', null, 'P', 'a', null, null, null, null],
  [null, null, null, null, 'e', null, null, null, null],
  [null, null, null, 'H', null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, 'h'],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, 'A', 'p', null, null, null],
  [null, null, null, 'A', 'K', null, null, null, 'c']
];

const GAME_MOVES = [MOVES, SCREEN_HORSE_MOVES, REVERSE_PALACE_HORSE_MOVES, DOUBLE_HORSE_MOVES];
let currentPly = 0;
let currentGameIndex = 0;
let autoplayTimer = 0;
let audio;
let controlPanel = null;

applyBoardStyle();
onBoardStyleChange(() => {});

export function initClassicGamesPage(lesson) {
  const app = document.getElementById('boardDisplayApp');
  app.setAttribute('aria-label', '中国象棋经典棋局演示');
  app.innerHTML = `
    <div class="classic-demo-page">
      <header class="classic-demo-topbar">
        <a class="classic-demo-back" href="./beginner.html">返回初学者介绍</a>
      </header>
      <section class="classic-demo-layout">
        <div class="classic-demo-left">
          <div class="classic-demo-board-card board-panel">
            <div class="board-area classic-demo-board-area">
              <div class="board-frame standard-board-surface">
                <div class="board-engraving" aria-hidden="true">象棋教学系统</div>
                <div class="file-labels file-labels-top" aria-hidden="true"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span></div>
                <div class="river-label xiangqi-river-surface" aria-hidden="true"><span>楚河</span><span id="classicDemoTheme">弃子、诱导、连续进攻</span><span>汉界</span></div>
                <div class="board xiangqi-grid-area" id="classicDemoBoard" role="grid" aria-label="中国象棋棋局演示棋盘"></div>
                <div class="file-labels file-labels-bottom" aria-hidden="true"><span>九</span><span>八</span><span>七</span><span>六</span><span>五</span><span>四</span><span>三</span><span>二</span><span>一</span></div>
                <div class="board-side-label" id="classicDemoSideLabel" aria-hidden="true">红方走棋</div>
              </div>
            </div>
            <nav id="classicDemoControlPanel" aria-label="棋盘通用控制面板"></nav>
            <p class="classic-demo-status" id="classicStatus" role="status" aria-live="polite">点击下一步或开始自动播放，逐着观察弃马局的开局。</p>
          </div>
        </div>
        <div class="classic-demo-right">
          <header class="classic-demo-title"><h1>${lesson.number}. ${lesson.title}</h1></header>
          <section class="classic-demo-panel classic-game-selector" aria-labelledby="classicGamesHeading">
            <h2 id="classicGamesHeading">六大经典 · 动态观察</h2>
            <div class="classic-game-buttons" id="classicGameButtons"></div>
            <p class="classic-game-value" id="classicGameValue"></p>
          </section>
          <section class="classic-demo-panel classic-demo-content">
            <div class="classic-move-panel">
              <h2>棋谱解法</h2>
              <div class="classic-move-list" id="classicMoveList" aria-label="棋谱着法"></div>
            </div>
            <div class="classic-explanation-panel">
              <h2>解说内容 <button type="button" class="classic-explain-button" id="classicExplain">🔊 解说</button></h2>
              <div class="classic-explanation" id="classicExplanation" aria-live="polite"></div>
            </div>
          </section>
        </div>
      </section>
    </div>`;

  renderGameButtons();
  renderMoveList();
  controlPanel = mountBoardControlPanel(document.getElementById('classicDemoControlPanel'), {
    mode: 'manual',
    hrefs: { manual: '../../play/index.html', 'human-ai': '../../play/human-ai.html', 'ai-ai': '../../play/ai-ai.html' },
    onAction: handleControlAction
  });
  audio = createBoardAudio(controlPanel, {
    explanation: document.getElementById('classicExplanation'),
    button: document.getElementById('classicExplain'),
    onPause: stopAutoplay,
    onStatus(message) { document.getElementById('classicStatus').textContent = message; }
  });
  updateDemo();
}

function renderGameButtons() {
  const container = document.getElementById('classicGameButtons');
  container.replaceChildren();
  GAMES.forEach((game, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `classic-game-button${index === currentGameIndex ? ' is-active' : ''}`;
    button.textContent = game.title;
    button.disabled = !game.available;
    button.setAttribute('aria-label', `${game.title}：${game.value}${game.available ? '' : '，棋谱待接入'}`);
    button.setAttribute('aria-pressed', String(index === currentGameIndex));
    button.title = `${game.value}${game.available ? '' : ' · 棋谱待接入'}`;
    if (game.available) button.addEventListener('click', () => {
      currentGameIndex = index;
      currentPly = 0;
      stopAutoplay();
      renderGameButtons();
      renderMoveList();
      document.getElementById('classicGameValue').textContent = `核心思维价值：${game.value}`;
      document.getElementById('classicDemoTheme').textContent = game.value;
      updateDemo();
    });
    button.dataset.gameIndex = String(index);
    container.append(button);
  });
  document.getElementById('classicGameValue').textContent = `核心思维价值：${GAMES[currentGameIndex].value}`;
}

function renderMoveList() {
  const list = document.getElementById('classicMoveList');
  const moves = GAME_MOVES[currentGameIndex];
  list.replaceChildren();
  for (let index = 0; index < moves.length; index += 2) {
    const row = document.createElement('div');
    row.className = 'classic-move-row';
    row.dataset.moveRow = String(index / 2);
    const number = document.createElement('span');
    number.className = 'classic-move-number';
    number.textContent = `${index / 2 + 1}.`;
    row.append(number);
    for (const moveIndex of [index, index + 1]) {
      const move = moves[moveIndex];
      if (!move) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'classic-move';
      button.textContent = move.notation;
      button.dataset.ply = String(moveIndex + 1);
      button.setAttribute('aria-label', `播放到第 ${moveIndex + 1} 手：${move.notation}`);
      button.addEventListener('click', () => {
        stopAutoplay();
        currentPly = moveIndex + 1;
        updateDemo();
        speakCurrentMove();
      });
      row.append(button);
    }
    list.append(row);
  }
}

function getPositionAt(ply) {
  const game = currentGameIndex === 3
    ? createGame({ board: DOUBLE_HORSE_STARTING_BOARD })
    : createGame();
  const moves = GAME_MOVES[currentGameIndex];
  const playedMoves = [];
  for (let index = 0; index < ply; index += 1) {
    const move = moves[index];
    const resolved = resolveNotation(game.board, move.notation, index);
    if (!resolved) {
      return { board: game.board, playedMoves, error: `第 ${index + 1} 手“${move.notation}”无法根据当前局面自动识别。` };
    }
    game.board[resolved.to.row][resolved.to.col] = game.board[resolved.from.row][resolved.from.col];
    game.board[resolved.from.row][resolved.from.col] = null;
    playedMoves.push({ ...move, ...resolved });
  }
  return { board: game.board, playedMoves, error: '' };
}

const XIANGQI_FILES = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
const XIANGQI_PIECES = {
  车: 'R', 車: 'R', 马: 'H', 馬: 'H', 炮: 'C', 兵: 'P', 卒: 'P',
  帅: 'K', 将: 'K', 仕: 'A', 士: 'A', 相: 'E', 象: 'E'
};

function notationNumber(value) {
  return XIANGQI_FILES[value] || (Number(value) >= 1 && Number(value) <= 9 ? Number(value) : 0);
}

function notationFileToColumn(color, file) {
  return color === 'red' ? 9 - file : file - 1;
}

function resolveNotation(board, notation, plyIndex) {
  const match = /^(前|中|后)?([车車马馬炮兵卒帅将仕士相象])([一二三四五六七八九1-9])([进退平])([一二三四五六七八九1-9])$/.exec(notation);
  if (!match) return null;

  const [, selector, pieceName, sourceFileText, action, targetText] = match;
  const color = plyIndex % 2 === 0 ? 'red' : 'black';
  const forward = color === 'red' ? -1 : 1;
  const pieceType = XIANGQI_PIECES[pieceName];
  const piece = color === 'red' ? pieceType : pieceType.toLowerCase();
  const sourceColumn = notationFileToColumn(color, notationNumber(sourceFileText));
  const targetNumber = notationNumber(targetText);
  if (sourceColumn < 0 || targetNumber < 1) return null;
  const targetColumn = notationFileToColumn(color, targetNumber);
  const sources = [];

  for (let row = 0; row < board.length; row += 1) {
    if (board[row][sourceColumn] === piece) sources.push({ row, col: sourceColumn });
  }
  if (selector && sources.length > 1) {
    sources.sort((a, b) => -forward * (a.row - b.row));
    const selected = selector === '前' ? sources[0]
      : selector === '后' ? sources[sources.length - 1]
        : sources[Math.floor(sources.length / 2)];
    sources.splice(0, sources.length, selected);
  }

  const candidates = [];
  for (const from of sources) {
    for (let row = 0; row < board.length; row += 1) {
      for (let col = 0; col < board[row].length; col += 1) {
        const to = { row, col };
        if (action === '平') {
          if (row !== from.row || col !== targetColumn) continue;
        } else if (pieceType === 'H' || pieceType === 'E' || pieceType === 'A') {
          if (col !== targetColumn || Math.sign(row - from.row) !== (action === '进' ? forward : -forward)) continue;
        } else {
          const distance = targetNumber;
          if (col !== from.col || row - from.row !== (action === '进' ? forward : -forward) * distance) continue;
        }
        if (canReplayPieceMove(board, piece, from, to, color)) candidates.push({ from, to });
      }
    }
  }

  return candidates.length === 1 ? candidates[0] : null;
}

function canReplayPieceMove(board, piece, from, to, color) {
  if (from.row === to.row && from.col === to.col) return false;
  const target = board[to.row][to.col];
  if (target && (target === target.toUpperCase()) === (color === 'red')) return false;
  const rowDiff = to.row - from.row;
  const colDiff = to.col - from.col;
  const absRow = Math.abs(rowDiff);
  const absCol = Math.abs(colDiff);
  const type = piece.toUpperCase();
  const inPalace = color === 'red'
    ? to.row >= 7 && to.row <= 9 && to.col >= 3 && to.col <= 5
    : to.row >= 0 && to.row <= 2 && to.col >= 3 && to.col <= 5;

  if (type === 'K') return inPalace && absRow + absCol === 1;
  if (type === 'A') return inPalace && absRow === 1 && absCol === 1;
  if (type === 'E') {
    const staysOnOwnSide = color === 'red' ? to.row >= 5 : to.row <= 4;
    return staysOnOwnSide && absRow === 2 && absCol === 2
      && !board[from.row + rowDiff / 2][from.col + colDiff / 2];
  }
  if (type === 'H') {
    if (!((absRow === 2 && absCol === 1) || (absRow === 1 && absCol === 2))) return false;
    const legRow = absRow === 2 ? from.row + Math.sign(rowDiff) : from.row;
    const legCol = absCol === 2 ? from.col + Math.sign(colDiff) : from.col;
    return !board[legRow][legCol];
  }
  if (type === 'R' || type === 'C') {
    if (rowDiff !== 0 && colDiff !== 0) return false;
    let screens = 0;
    const rowStep = Math.sign(rowDiff);
    const colStep = Math.sign(colDiff);
    for (let row = from.row + rowStep, col = from.col + colStep; row !== to.row || col !== to.col; row += rowStep, col += colStep) {
      if (board[row][col]) screens += 1;
    }
    return type === 'R' ? screens === 0 : target ? screens === 1 : screens === 0;
  }
  if (type === 'P') {
    const forward = color === 'red' ? -1 : 1;
    if (rowDiff === forward && colDiff === 0) return true;
    const crossedRiver = color === 'red' ? from.row <= 4 : from.row >= 5;
    return crossedRiver && rowDiff === 0 && absCol === 1;
  }
  return false;
}

function updateDemo() {
  audio.stop();
  const board = document.getElementById('classicDemoBoard');
  const moves = GAME_MOVES[currentGameIndex];
  const { board: position, playedMoves, error } = getPositionAt(currentPly);
  board.replaceChildren(createStandardBoardArtwork('teaching-lines xiangqi-grid-svg'));
  for (let row = 0; row < position.length; row += 1) {
    for (let col = 0; col < position[row].length; col += 1) {
      const piece = position[row][col];
      const square = document.createElement('button');
      square.type = 'button';
      square.className = 'square xiangqi-intersection';
      placeStandardIntersection(square, row, col);
      square.setAttribute('role', 'gridcell');
      square.setAttribute('aria-label', piece
        ? `${piece === piece.toUpperCase() ? '红方' : '黑方'}${getPieceLabel(piece)}，第 ${row + 1} 行第 ${col + 1} 列`
        : `空位，第 ${row + 1} 行第 ${col + 1} 列`);
      if (isCannonStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'cannon-marker');
      if (isPawnStartPosition(row, col)) appendStandardPositionMark(square, row, col, 'pawn-marker');
      if (piece) square.append(createStandardPieceElement(piece, getPieceLabel(piece), 'piece'));
      board.append(square);
    }
  }

  const squares = board.querySelectorAll('.xiangqi-intersection');
  const previous = currentPly > 0 ? playedMoves[currentPly - 1] : null;
  for (const [position, className] of [[previous?.from, 'is-last-from'], [previous?.to, 'is-last-to']]) {
    if (!position) continue;
    const square = squares[position.row * 9 + position.col];
    if (!square) continue;
    square.classList.add(className);
  }

  let currentMoveButton = null;
  document.querySelectorAll('.classic-move').forEach(button => {
    const active = Number(button.dataset.ply) === currentPly;
    button.classList.toggle('is-current', active);
    button.setAttribute('aria-current', active ? 'step' : 'false');
    button.closest('.classic-move-row')?.classList.toggle('is-current', active);
    if (active) currentMoveButton = button;
  });
  currentMoveButton?.scrollIntoView({ block: 'nearest', inline: 'nearest' });

  const moveExplanation = error
    ? error
    : currentPly
    ? moves[currentPly - 1].note
    : `${GAMES[currentGameIndex].title}：按照棋谱逐着演示，观察${GAMES[currentGameIndex].value}。`;
  const explanation = GAMES[currentGameIndex].source
    ? `${moveExplanation}\n${GAMES[currentGameIndex].source}`
    : moveExplanation;
  document.getElementById('classicExplanation').textContent = explanation;
  document.getElementById('classicStatus').textContent = error
    ? `自动播放已停在第 ${playedMoves.length + 1} 手：${error}`
    : currentPly
    ? `演示进度：${Math.ceil(currentPly / 2)} 回合 · ${moves[currentPly - 1].notation}　（${currentPly}/${moves.length} 手）`
    : `点击下一步或开始自动播放，逐着观察${GAMES[currentGameIndex].title}。`;
  controlPanel.controls.undo.disabled = currentPly === 0;
  controlPanel.controls.redo.disabled = currentPly === moves.length;
  if (error) stopAutoplay();
  if (currentPly === moves.length) stopAutoplay();
}

function handleControlAction(action) {
  if (action === 'reset') {
    stopAutoplay();
    currentPly = 0;
    updateDemo();
  } else if (action === 'play') {
    if (autoplayTimer) stopAutoplay();
    else toggleAutoplay();
  } else if (action === 'undo') {
    step(-1);
  } else if (action === 'redo') {
    step(1);
  } else if (action === 'volume' || action === 'speed') {
    if (autoplayTimer) startAutoplay();
  }
}

function step(delta) {
  stopAutoplay();
  currentPly = Math.max(0, Math.min(GAME_MOVES[currentGameIndex].length, currentPly + delta));
  updateDemo();
  if (delta > 0) {
    playMoveSound();
    speakCurrentMove();
  }
}

function toggleAutoplay() {
  if (autoplayTimer) {
    stopAutoplay();
    return;
  }
  if (currentPly >= GAME_MOVES[currentGameIndex].length) currentPly = 0;
  startAutoplay();
}

function startAutoplay() {
  stopAutoplay();
  const speed = controlPanel.getSpeed();
  controlPanel.setPlaying(true);
  autoplayTimer = window.setInterval(() => {
    if (currentPly >= GAME_MOVES[currentGameIndex].length) {
      stopAutoplay();
      return;
    }
    currentPly += 1;
    updateDemo();
    playMoveSound();
    speakCurrentMove();
  }, 250 + (10 - speed) * 220);
}

function stopAutoplay() {
  if (autoplayTimer) window.clearInterval(autoplayTimer);
  autoplayTimer = 0;
  controlPanel?.setPlaying(false);
}

function speakCurrentMove() {
  if (currentPly <= 0) return;
  const move = GAME_MOVES[currentGameIndex][currentPly - 1];
  if (move) speakText(`${move.notation}。${move.note}`);
}

function speakText(text) {
  audio.speak(text);
}

function playMoveSound() {
  audio.effect();
}
