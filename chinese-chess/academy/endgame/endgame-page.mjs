import { createInitialBoard, createGame, createGameFromFen, getGameStatus, getLegalMoves, getPieceLabel, makeMove, parseFen, undoMove, redoMove, toFen, RED } from '../../core.mjs';
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
import { buildNotationPlayback, notationContent } from '../../shared/notation-playback.mjs';
import { getLessonMoveFeedback } from '../../shared/lesson-move-feedback.mjs';
import { createBoardAudio } from '../../shared/board-audio.mjs';

const ENDGAME_TYPES = {
  车: ['单车杀王', '车马杀王', '车炮杀王'],
  马: ['双马杀王', '马兵杀王', '马炮杀王'],
  炮: ['单炮杀王', '双炮杀王', '炮兵杀王'],
  兵卒: ['单兵杀王', '多兵杀王', '兵马杀王'],
  组合: ['车马炮杀王', '多子杀王', '复杂残局']
};
const SECTION_LABELS = { observation: '动态观察', practice: '操作练习', quiz: '问答练习' };
const status = document.getElementById('boardLessonStatus');
const menus = [];
const BANK_URL = new URL('../../bank/', import.meta.url);
let panel;
let audio;
let selectedPuzzle;
let selectedFen;
let playback;
let step = 0;
let timer;
let loadToken = 0;
let displayedBoard = createInitialBoard();
let game = createGame();
let mode = 'manual';
let live = false;
let humanSide = RED;
let selectedSquare;
let legalTargets = [];
let engineAbort;
let engineToken = 0;
let engineThinking = false;
let duelRunning = false;
let engineTimer;
const variantSelect = document.getElementById('endgameSolutionVariant');
let course;

applyBoardStyle();
onBoardStyleChange(() => {});

export function initEndgamePage(config) {
  course = config;
  renderBoard();
  for (const row of document.querySelectorAll('.endgame-menus')) renderMenus(row);
  panel = mountBoardControlPanel(document.getElementById('boardToolbar'), {
    mode: 'manual',
    onModeChange: switchMode,
    hrefs: {
      manual: '../../play/index.html',
      'human-ai': '../../play/human-ai.html',
      'ai-ai': '../../play/ai-ai.html'
    },
    onAction(action) {
      if (action === 'reset') {
        cancelEngine();
        if (live) {
          game = selectedFen ? createGameFromFen(selectedFen) : createGame();
          displayedBoard = game.board;
          step = 0;
          selectedSquare = null;
          legalTargets = [];
          renderLive();
          continueEngine();
          return;
        }
        if (selectedPuzzle) {
          stopPlayback();
          showStep(0);
          return;
        }
        document.querySelectorAll('.endgame-menu input').forEach(input => { input.checked = false; });
        closeMenus();
        document.getElementById('endgameQuestionList').textContent = course ? '问答题目将在后续单独接入' : '请选择残局类别查看问答题';
        document.getElementById('endgameAnswerArea').textContent = '请选择问题开始答题';
        status.textContent = course ? `请选择${course.label || '战术'}类别和棋局。` : '请选择残局类别；本页暂未连接题库题目。';
        panel.setSide('red');
        renderBoard();
      }
      if (action === 'play') {
        if (live) {
          duelRunning = !duelRunning;
          panel.setPlaying(duelRunning);
          if (duelRunning) continueEngine();
          else cancelEngine();
          return;
        }
        if (timer) stopPlayback();
        else startPlayback();
      }
      if (action === 'undo' || action === 'redo') {
        if (live) {
          cancelEngine();
          let replayed = false;
          if (action === 'undo') undoMove(game);
          else replayed = redoMove(game);
          selectedSquare = null;
          legalTargets = [];
          renderLive();
          if (replayed) announceMove();
          return;
        }
        stopPlayback();
        showStep(step + (action === 'redo' ? 1 : -1), true);
      }
      if (action === 'speed' && timer) {
        stopPlayback();
        startPlayback();
      }
      if (action === 'side' && live) {
        humanSide = panel.getSide() === 'red' ? RED : 'black';
        cancelEngine();
        duelRunning = mode === 'human-ai';
        renderLive();
        continueEngine();
      }
    }
  });
  audio = createBoardAudio(panel, {
    explanation: document.getElementById('endgameExplanation'),
    onPause() { stopPlayback(); cancelEngine(); },
    onStatus(message) { status.textContent = message; }
  });
  panel.controls.play.disabled = true;
  panel.controls.play.title = '暂未连接题库棋谱，无法播放';
  panel.controls.play.setAttribute('aria-label', panel.controls.play.title);
  document.addEventListener('click', event => {
    if (!event.target.closest('.endgame-menu')) closeMenus();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const open = menus.find(menu => menu.open);
    if (open) {
      event.preventDefault();
      open.open = false;
      open.querySelector('summary').focus();
    }
  });
  for (const audience of ['student', 'parent']) {
    document.querySelector(`.audience-${audience}`).addEventListener('click', () => {
      document.getElementById('endgameAudienceTitle').textContent = audience === 'student' ? '致学生' : '致家长';
      document.getElementById('endgameAudienceText').textContent = course?.audience?.[audience] || (course
        ? (audience === 'student' ? '选择战术棋局，观察子力配合，尝试走法并与题库解法比较。' : '鼓励孩子先说明战术目标，再尝试走棋并复盘。题库缺失的材料会明确提示。')
        : audience === 'student'
        ? '通过动态观察、操作练习和问答练习认识残局。动态观察已接入 L1 车、马、炮、兵类棋局，操作练习的炮菜单可选择两个实战局面。'
        : '鼓励孩子观察棋子配合、尝试不同思路并说明理由。可从动态观察的车、马、炮、兵卒按钮播放解法，或选择操作练习的炮类局面。');
      document.getElementById('endgameAudienceDialog').showModal();
    });
  }
  variantSelect.addEventListener('change', () => loadVariant(Number(variantSelect.value)));
}

function renderMenus(row) {
  row.replaceChildren();
  const section = row.dataset.section;
  for (const [piece, types] of Object.entries(course?.groups || course?.categories || ENDGAME_TYPES)) {
    const menu = document.createElement('details');
    menu.className = 'endgame-menu';
    const summary = document.createElement('summary');
    summary.textContent = piece;
    summary.setAttribute('aria-label', `${SECTION_LABELS[section]}：${piece}`);
    const options = document.createElement('div');
    options.className = 'endgame-menu-options';
    if (course?.groups) {
      if (section === 'observation' && course.groupDescriptions?.[piece]) {
        const description = document.createElement('p');
        description.textContent = course.groupDescriptions[piece];
        options.append(description);
      }
      renderCourseOptions(options, types, section);
    } else if (course && section !== 'observation') {
      const note = document.createElement('p');
      note.textContent = section === 'quiz' ? `${piece}问答题目将在后续单独接入。` : `${piece}操作练习题目暂未接入。`;
      options.append(note);
    } else if ((section === 'observation' && (course || ['车', '马', '炮', '兵卒'].includes(piece)))
      || (section === 'practice' && piece === '炮')) {
      options.textContent = '载入棋局中…';
      menu.addEventListener('toggle', () => {
        if (menu.open && !options.dataset.loaded) loadObservationPuzzles(options, piece, section);
      });
    } else if (section === 'quiz') {
      const option = document.createElement('button');
      option.type = 'button';
      option.textContent = `${piece}类残局问答`;
      option.addEventListener('click', () => {
        document.getElementById('endgameQuestionList').textContent = `${piece}类残局问答暂未连接题库。`;
        document.getElementById('endgameAnswerArea').textContent = '题目接入后，可在此选择问题并开始答题。';
        status.textContent = `问答练习：${piece}类残局问答，暂未连接题库题目。`;
        menu.open = false;
        summary.focus();
      });
      options.append(option);
    } else {
      for (const type of types) {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.addEventListener('change', () => {
          status.textContent = `${SECTION_LABELS[section]}：${input.checked ? '已选择' : '已取消'}${type}；暂未连接题库题目。`;
        });
        label.append(input, document.createTextNode(type));
        options.append(label);
      }
    }
    menu.append(summary, options);
    menu.addEventListener('toggle', () => {
      if (menu.open) closeMenus(menu);
    });
    menus.push(menu);
    row.append(menu);
  }
}

function renderCourseOptions(options, types, section) {
  for (const type of types) {
    const children = course.subgroups?.[type];
    const submenu = document.createElement('details');
    submenu.className = `endgame-puzzle-submenu ${children ? 'course-category-submenu' : 'tactics-submenu'}`;
    if (course.roots?.[type]) submenu.dataset.rootGeneId = course.roots[type];
    const heading = document.createElement('summary');
    heading.textContent = type;
    const content = document.createElement('div');
    content.className = 'endgame-puzzle-list';
    if (children) {
      renderCourseOptions(content, children, section);
    } else if (section === 'observation' && course.categories[type]?.length) {
      content.textContent = '载入棋局中…';
      submenu.addEventListener('toggle', () => {
        if (submenu.open && !content.dataset.loaded) loadObservationPuzzles(content, type, section);
      });
    } else {
      const note = document.createElement('p');
      note.textContent = section === 'quiz' ? `${type}问答题目将在后续单独接入。`
        : `${type}${section === 'practice' ? '操作练习题目' : '棋局'}暂未接入。`;
      content.append(note);
    }
    submenu.append(heading);
    if (section === 'observation' && course.methodDescriptions?.[type]) {
      const description = document.createElement('p');
      description.textContent = `核心知识：${course.methodDescriptions[type]}`;
      submenu.append(description);
    }
    submenu.append(content);
    submenu.addEventListener('toggle', () => {
      if (submenu.open) {
        for (const sibling of options.querySelectorAll(':scope > details')) {
          if (sibling !== submenu) sibling.open = false;
        }
      }
    });
    options.append(submenu);
  }
}

function closeMenus(except) {
  for (const menu of menus) {
    if (menu === except) continue;
    menu.open = false;
    menu.querySelectorAll('details').forEach(submenu => { submenu.open = false; });
  }
}

function renderBoard() {
  const board = document.getElementById('teachingBoard');
  const position = displayedBoard;
  const feedback = getLessonMoveFeedback(game);
  const finished = live && ['checkmate', 'stalemate', 'invalid'].includes(feedback.state.type);
  board.replaceChildren(createStandardBoardArtwork());
  for (let row = 0; row < position.length; row += 1) {
    for (let col = 0; col < position[row].length; col += 1) {
      const piece = position[row][col];
      const square = document.createElement('button');
      square.type = 'button';
      square.className = 'teaching-square';
      placeStandardIntersection(square, row, col);
      const move = playback?.moves[step - 1];
      const lastMove = live ? game.history.at(-1) : move;
      if (lastMove && [lastMove.from, lastMove.to].some(point => point.row === row && point.col === col)) {
        square.classList.add('endgame-last-move');
      }
      if (feedback.capture?.row === row && feedback.capture?.col === col) square.classList.add('endgame-capture');
      if (piece && piece === feedback.checkedKing) square.classList.add('endgame-check');
      if (piece && piece === feedback.losingKing) square.classList.add('endgame-defeated');
      if (feedback.state.winner && piece === (feedback.state.winner === RED ? 'K' : 'k')) square.classList.add('endgame-winner');
      square.setAttribute('role', 'gridcell');
      square.setAttribute('aria-label', piece
        ? `${piece === piece.toUpperCase() ? '红方' : '黑方'}${getPieceLabel(piece)}，第 ${row + 1} 行第 ${col + 1} 路`
        : `空位，第 ${row + 1} 行第 ${col + 1} 路`);
      if (square.classList.contains('endgame-check')) square.setAttribute('aria-label', `${square.getAttribute('aria-label')}，被将军`);
      if (square.classList.contains('endgame-defeated')) square.setAttribute('aria-label', `${square.getAttribute('aria-label')}，负方`);
      if (square.classList.contains('endgame-winner')) square.setAttribute('aria-label', `${square.getAttribute('aria-label')}，胜方`);
      if (isCannonStartPosition(row, col) || isPawnStartPosition(row, col)) {
        appendStandardPositionMark(square, row, col);
      }
      if (piece) square.append(createStandardPieceElement(piece, getPieceLabel(piece)));
      if (selectedSquare?.row === row && selectedSquare?.col === col) square.classList.add('endgame-selected');
      if (legalTargets.some(target => target.row === row && target.col === col)) square.classList.add('endgame-target');
      square.disabled = !live || finished || engineThinking || mode === 'ai-ai' || (mode === 'human-ai' && game.turn !== humanSide);
      square.addEventListener('click', () => handleSquare({ row, col }));
      board.append(square);
    }
  }
}

async function fetchText(file) {
  const response = await fetch(new URL(file, BANK_URL));
  if (!response.ok) throw new Error(`文件载入失败 (${response.status})：${file}`);
  return response.text();
}

async function loadObservationPuzzles(list, piece, section) {
  list.dataset.loaded = 'loading';
  try {
    const manifest = JSON.parse(await fetchText('manifest.json'));
    const family = { 车: 'rook', 马: 'horse', 炮: 'cannon', 兵卒: 'pawn' }[piece];
    const keys = course?.selectPuzzles ? [] : course ? course.categories[piece].map(name => `tactics/${name}`) : [`endgame/L1/${family}`];
    const categories = keys.map(key => {
      const category = manifest.categories.find(category => category.key === key);
      if (!category) throw new Error(`题库缺少目录：${key}`);
      return category;
    });
    const items = course?.selectPuzzles ? course.selectPuzzles(manifest, piece)
      : course ? categories.flatMap(category => category.items) : categories[0].items.filter(item => piece === '炮'
      ? (section === 'practice' ? /^eg_2C/.test(item.id) : /^eg_C(?:A|E)?-.*_L1-/.test(item.id))
      : piece === '兵卒' ? /^eg_P+.*_L1-/.test(item.id)
        : item.id.startsWith(piece === '车' ? 'eg_R-' : 'eg_H-'));
    if (!items.length && course?.selectPuzzles) {
      const note = document.createElement('p');
      note.textContent = `${piece}棋局暂未接入。`;
      list.replaceChildren(note);
      list.dataset.loaded = 'true';
      return;
    }
    if (!items.length) throw new Error(`L1 ${piece}类目录中没有匹配棋局`);
    const groups = new Map();
    for (const puzzle of items) {
      const title = puzzle.id.startsWith('eg_R-K_') ? '单车杀王' : puzzle.title;
      if (!groups.has(title)) groups.set(title, []);
      groups.get(title).push(puzzle);
    }
    list.replaceChildren();
    const ordered = [...groups].sort(([first], [second]) => (
      first === '单车杀王' ? -1 : second === '单车杀王' ? 1 : 0
    ));
    if (course?.sourceLabels) {
      const sources = course.categories[piece].map(name => course.sourceLabels[name]);
      if (sources.length !== 1 || sources[0] !== piece) {
        const note = document.createElement('p');
        note.textContent = `原题库「${sources.join('、')}」参考棋局，尚未按新战术细分。`;
        list.append(note);
      }
    }
    for (const [title, puzzles] of ordered) {
      const submenu = document.createElement('details');
      submenu.className = 'endgame-puzzle-submenu';
      const heading = document.createElement('summary');
      heading.textContent = title;
      const buttons = document.createElement('div');
      buttons.className = 'endgame-puzzle-list';
      for (const puzzle of puzzles) {
        const button = document.createElement('button');
        button.type = 'button';
        const sequence = puzzle.id.slice(-3);
        button.textContent = `${title === '单车杀王' ? '车杀光将' : puzzle.title} ${sequence}`;
        button.dataset.puzzleId = puzzle.id;
        button.classList.toggle('selected', selectedPuzzle?.id === puzzle.id);
        button.addEventListener('click', () => loadPuzzle(puzzle, section === 'practice'));
        buttons.append(button);
      }
      submenu.append(heading, buttons);
      submenu.addEventListener('toggle', () => {
        if (submenu.open) {
          for (const sibling of list.querySelectorAll('.endgame-puzzle-submenu')) {
            if (sibling !== submenu) sibling.open = false;
          }
        }
      });
      list.append(submenu);
    }
    list.dataset.loaded = 'true';
  } catch (error) {
    delete list.dataset.loaded;
    list.textContent = error.message;
    status.textContent = `棋局目录载入失败：${error.message}`;
  }
}

async function loadPuzzle(puzzle, practice = false) {
  audio.stop();
  stopPlayback();
  cancelEngine();
  const token = ++loadToken;
  panel.controls.play.disabled = true;
  panel.controls.undo.disabled = true;
  panel.controls.redo.disabled = true;
  status.textContent = `正在载入：${puzzle.title}`;
  try {
    const fen = await fetchText(puzzle.fen);
    if (token !== loadToken) return;
    displayedBoard = parseFen(fen).board;
    game = createGameFromFen(fen);
    live = false;
    selectedSquare = null;
    legalTargets = [];
    const numbered = puzzle.solutions.filter(file => file.includes(`${puzzle.id}-`));
    selectedPuzzle = { ...puzzle, solutions: numbered.length ? numbered : puzzle.solutions };
    selectedFen = fen;
    playback = null;
    step = 0;
    renderBoard();
    variantSelect.replaceChildren();
    selectedPuzzle.solutions.forEach((file, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `解法 ${index + 1}`;
      variantSelect.append(option);
    });
    variantSelect.hidden = selectedPuzzle.solutions.length < 2;
    document.querySelectorAll('[data-puzzle-id]').forEach(button => {
      button.classList.toggle('selected', button.dataset.puzzleId === puzzle.id);
    });
    closeMenus();
    if (practice && !course) {
      variantSelect.hidden = true;
      document.getElementById('endgameNotation').textContent = '该题库答案尚未录入，当前可在棋盘上操作练习。';
      document.getElementById('endgameExplanation').textContent = '该题库尚无配套解说。';
      switchMode('manual');
      status.textContent = `操作练习：${puzzle.title} · ${game.turn === RED ? '红方' : '黑方'}走棋；可切换人机或 AI-AI 模式。`;
      return;
    }
    await loadVariant(0);
  } catch (error) {
    if (token === loadToken) status.textContent = `棋局载入失败：${error.message}`;
  }
}

async function loadVariant(index) {
  audio.stop();
  stopPlayback();
  cancelEngine();
  live = false;
  mode = 'manual';
  selectedSquare = null;
  legalTargets = [];
  panel.setMode(mode);
  const token = ++loadToken;
  const puzzle = selectedPuzzle;
  playback = null;
  game = createGameFromFen(selectedFen);
  displayedBoard = game.board;
  step = 0;
  renderBoard();
  panel.controls.play.disabled = true;
  panel.controls.undo.disabled = true;
  panel.controls.redo.disabled = true;
  document.getElementById('endgameNotation').textContent = '载入棋谱中…';
  document.getElementById('endgameExplanation').textContent = '载入解说中…';
  try {
    const [solution, explanation] = await Promise.all([
      puzzle.solutions[index] ? fetchText(puzzle.solutions[index]) : Promise.resolve(''),
      puzzle.explanations[index] ? fetchText(puzzle.explanations[index]) : Promise.resolve('该解法暂无配套解说。')
    ]);
    if (token !== loadToken) return;
    document.getElementById('endgameExplanation').textContent = explanation.split(/\r?\n/)
      .filter(line => !line.trim().startsWith('#')).join('\n').trim();
    document.getElementById('endgameNotation').textContent = solution;
    if (!notationContent(solution)) {
      document.getElementById('endgameNotation').textContent = '原题库尚未录入正式棋谱（仅有占位文本），无法自动播放。可切换模式操作练习。';
      status.textContent = `已载入：${puzzle.title} · ${puzzle.id}；暂无正式解法棋谱。`;
      return;
    }
    playback = buildNotationPlayback(selectedFen, solution);
    const notation = document.getElementById('endgameNotation');
    notation.replaceChildren();
    const startsRed = parseFen(selectedFen).turn === RED;
    let round;
    playback.moves.forEach((move, index) => {
      const ply = index + (startsRed ? 0 : 1);
      if (index === 0 || ply % 2 === 0) {
        round = document.createElement('div');
        round.className = 'endgame-notation-round';
        const number = document.createElement('span');
        number.className = 'endgame-notation-number';
        number.textContent = `${Math.floor(ply / 2) + 1}.`;
        round.append(number);
        notation.append(round);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = move.notation;
      button.dataset.side = ply % 2 === 0 ? 'red' : 'black';
      button.setAttribute('aria-label', `第${Math.floor(ply / 2) + 1}回合${ply % 2 === 0 ? '红方' : '黑方'}：${move.notation}`);
      button.addEventListener('click', () => {
        stopPlayback();
        cancelEngine();
        live = false;
        mode = 'manual';
        panel.setMode(mode);
        selectedSquare = null;
        legalTargets = [];
        panel.controls.play.disabled = false;
        showStep(index + 1, true);
      });
      round.append(button);
    });
    panel.controls.play.disabled = false;
    showStep(0);
  } catch (error) {
    if (token === loadToken) status.textContent = `棋谱载入失败：${error.message}`;
  }
}

function showStep(value, speak = false) {
  if (!playback) return;
  audio.stop();
  const previousStep = step;
  step = Math.max(0, Math.min(value, playback.moves.length));
  game = createGameFromFen(selectedFen);
  for (const move of playback.moves.slice(0, step)) {
    if (!makeMove(game, move.from, move.to)) throw new Error(`棋谱着法无法应用：${move.notation}`);
  }
  displayedBoard = game.board;
  renderBoard();
  const buttons = document.querySelectorAll('#endgameNotation button');
  buttons.forEach((button, index) => {
    button.classList.toggle('current', index === step - 1);
    button.setAttribute('aria-current', index === step - 1 ? 'step' : 'false');
  });
  buttons[step - 1]?.scrollIntoView({ block: 'nearest' });
  panel.controls.undo.disabled = step === 0;
  panel.controls.redo.disabled = step === playback.moves.length;
  status.textContent = `${selectedPuzzle.title} · ${selectedPuzzle.id.slice(-3)} · ${step}/${playback.moves.length} 着${step ? `：${playback.moves[step - 1].notation}` : '，可单步或自动播放'}`;
  const feedback = getLessonMoveFeedback(game);
  if (feedback.text) status.textContent += ` · ${feedback.text}`;
  if (speak && step > previousStep) announceMove(playback.moves[step - 1].notation);
}

function announceMove(notation = '') {
  audio.move(game, notation);
}

function stopPlayback() {
  clearInterval(timer);
  timer = null;
  panel?.setPlaying(false);
}

function startPlayback() {
  if (!playback) return;
  if (step === playback.moves.length) showStep(0);
  panel.setPlaying(true);
  timer = setInterval(() => {
    showStep(step + 1, true);
    if (step === playback.moves.length) stopPlayback();
  }, 2600 - panel.getSpeed() * 200);
}

function cancelEngine() {
  engineToken += 1;
  engineAbort?.abort();
  engineAbort = null;
  clearTimeout(engineTimer);
  engineThinking = false;
  duelRunning = false;
  panel?.setPlaying(false);
}

function switchMode(value) {
  stopPlayback();
  cancelEngine();
  mode = value;
  live = true;
  selectedSquare = null;
  legalTargets = [];
  panel.setMode(mode);
  humanSide = panel.getSide() === 'red' ? RED : 'black';
  duelRunning = mode === 'human-ai';
  renderLive();
  continueEngine();
}

function renderLive() {
  displayedBoard = game.board;
  renderBoard();
  panel.controls.play.disabled = mode === 'manual';
  panel.controls.undo.disabled = !game.history.length || engineThinking;
  panel.controls.redo.disabled = !game.redoStack.length || engineThinking;
  panel.setPlaying(duelRunning);
  const state = getGameStatus(game);
  const finished = ['checkmate', 'stalemate', 'invalid'].includes(state.type);
  if (finished) {
    duelRunning = false;
    panel.setPlaying(false);
    panel.controls.play.disabled = true;
  }
  const label = { manual: '双人手动', 'human-ai': '人机对弈', 'ai-ai': 'AI-AI' }[mode];
  status.textContent = `${label} · ${finished ? '对局结束' : `${game.turn === RED ? '红方' : '黑方'}走棋`} · ${getLessonMoveFeedback(game).text || (engineThinking ? '引擎思考中…' : '保留当前局面及解法棋谱')}`;
}

function handleSquare(point) {
  if (!live || engineThinking || mode === 'ai-ai' || (mode === 'human-ai' && game.turn !== humanSide)) return;
  if (selectedSquare && legalTargets.some(target => target.row === point.row && target.col === point.col)) {
    if (!makeMove(game, selectedSquare, point)) {
      status.textContent = '当前着法不合法。';
      return;
    }
    selectedSquare = null;
    legalTargets = [];
    renderLive();
    announceMove();
    duelRunning = mode === 'human-ai';
    continueEngine();
    return;
  }
  const piece = game.board[point.row][point.col];
  selectedSquare = piece && (piece === piece.toUpperCase() ? RED : 'black') === game.turn ? point : null;
  legalTargets = selectedSquare ? getLegalMoves(game, point) : [];
  renderLive();
}

function continueEngine() {
  if (!live || mode === 'manual' || !duelRunning || engineThinking || (mode === 'human-ai' && game.turn === humanSide)) return;
  const state = getGameStatus(game);
  if (['checkmate', 'stalemate', 'invalid'].includes(state.type)) {
    duelRunning = false;
    renderLive();
    return;
  }
  requestEngineMove();
}

async function requestEngineMove() {
  const token = ++engineToken;
  engineThinking = true;
  engineAbort = new AbortController();
  renderLive();
  try {
    const response = await fetch('http://localhost:8787/api/v1/chinese-chess/engine/ai-ai/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: engineAbort.signal,
      body: JSON.stringify({ fen: toFen(game), side: game.turn, settings: { threads: 1, hash: 128, depth: 12, movetime: 1000, multiPv: 1 } })
    });
    const result = await response.json();
    if (token !== engineToken) return;
    if (!response.ok) throw new Error(result.error || `引擎请求失败 (${response.status})`);
    if (!result.move || !makeMove(game, result.move.from, result.move.to)) throw new Error('引擎返回了无法应用的着法。');
    engineThinking = false;
    renderLive();
    announceMove();
    engineTimer = setTimeout(continueEngine, 2600 - panel.getSpeed() * 200);
  } catch (error) {
    if (token !== engineToken) return;
    engineThinking = false;
    duelRunning = false;
    renderLive();
    status.textContent = `引擎不可用：${error.message}。请启动本地引擎服务（8787），点击播放重试；当前局面已保留。`;
  } finally {
    if (token === engineToken) engineAbort = null;
  }
}

window.addEventListener('pagehide', () => {
  stopPlayback();
  cancelEngine();
});
