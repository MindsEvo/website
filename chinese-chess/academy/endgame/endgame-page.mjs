import { getPieceLabel, parseFen } from '../../core.mjs';
import {
  createStandardBoardArtwork,
  createStandardPieceElement,
  placeStandardIntersection
} from '../../board-standard.mjs';
import { applyBoardStyle, onBoardStyleChange } from '../../board-style.mjs';

applyBoardStyle();
onBoardStyleChange(() => {});

const SAMPLE_FEN = '9/5k3/9/9/9/9/4R4/9/4K4/9 r - - 0 1';
const CATEGORIES = [
  { label: '炮类', count: 8, color: '#df3445' },
  { label: '马类', count: 5, color: '#0876f9' },
  { label: '兵类', count: 3, color: '#27a64b' },
  { label: '车类', count: 11, color: '#9856b1' }
];
const SAMPLE_POSITIONS = [
  { category: '炮类', titles: ['双炮困毙马士象全', '单炮平光将'] },
  { category: '马类', titles: ['单马平双士', '单马胜光将'] },
  { category: '兵类', titles: ['单兵平单士', '三兵胜士象全'] },
  { category: '车类', titles: ['单车胜双士', '单车胜光将'] }
];

export function initEndgamePage() {
  document.getElementById('teachingBoard').setAttribute('aria-label', '单车胜光将残局示例');
  document.querySelector('.teaching-board-engraving').textContent = '残局示例：单车胜光将';
  document.getElementById('boardLessonStatus').hidden = true;
  document.getElementById('boardToolbar').hidden = false;

  renderBoard();
  renderCategories();
  renderSamplePositions();
  renderFacts();
}

function renderBoard() {
  const board = document.getElementById('teachingBoard');
  const position = parseFen(SAMPLE_FEN).board;
  board.replaceChildren(createStandardBoardArtwork('teaching-lines xiangqi-grid-svg'));

  for (let row = 0; row < position.length; row += 1) {
    for (let col = 0; col < position[row].length; col += 1) {
      const piece = position[row][col];
      const square = document.createElement('div');
      square.className = 'teaching-square xiangqi-intersection';
      placeStandardIntersection(square, row, col);
      square.setAttribute('role', 'gridcell');
      square.setAttribute('aria-label', piece
        ? `${piece === piece.toUpperCase() ? '红方' : '黑方'}${getPieceLabel(piece)}，第 ${row + 1} 行第 ${col + 1} 路`
        : `空位，第 ${row + 1} 行第 ${col + 1} 路`);
      if (piece) square.append(createStandardPieceElement(piece, getPieceLabel(piece), 'teaching-piece'));
      board.append(square);
    }
  }
}

function renderCategories() {
  const container = document.getElementById('endgameCategoryButtons');
  container.replaceChildren();
  for (const category of CATEGORIES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'endgame-category-button';
    button.textContent = `${category.label} · ${category.count} 局`;
    button.style.setProperty('--button-color', category.color);
    container.append(button);
  }
}

function renderSamplePositions() {
  const container = document.getElementById('endgameExamples');
  container.replaceChildren();
  for (const group of SAMPLE_POSITIONS) {
    const section = document.createElement('div');
    section.className = 'endgame-example-group';
    const heading = document.createElement('strong');
    heading.textContent = group.category;
    const names = document.createElement('div');
    names.className = 'endgame-example-names';
    for (const title of group.titles) {
      const item = document.createElement('span');
      item.textContent = title;
      names.append(item);
    }
    section.append(heading, names);
    container.append(section);
  }
}

function renderFacts() {
  const container = document.getElementById('endgameFacts');
  container.replaceChildren();
  for (const [value, label] of [['27', '局面'], ['4', '残局类别'], ['L1', '入门级']]) {
    const fact = document.createElement('div');
    fact.className = 'endgame-fact';
    const amount = document.createElement('strong');
    amount.textContent = value;
    const caption = document.createElement('span');
    caption.textContent = label;
    fact.append(amount, caption);
    container.append(fact);
  }
}

initEndgamePage();
