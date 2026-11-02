export const XIANGQI_BOARD_GEOMETRY = Object.freeze({
  columns: 9,
  rows: 10,
  viewBox: '0 0 8 9'
});

export function createStandardBoardArtwork(className = 'xiangqi-grid-svg') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('viewBox', XIANGQI_BOARD_GEOMETRY.viewBox);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');

  const horizontal = [0, 1, 2, 3, 6, 7, 8, 9].map(row => `M0 ${row}H8`).join(' ');
  const vertical = Array.from({ length: 9 }, (_, col) => (
    col === 0 || col === 8 ? `M${col} 0V9` : `M${col} 0V4 M${col} 5V9`
  )).join(' ');
  svg.innerHTML = `
    <path class="line-horizontal" d="${horizontal}" />
    <path class="line-vertical" d="${vertical}" />
    <path class="line-river-boundary" d="M0 4H8M0 5H8" />
    <path class="line-palace" d="M3 0L5 2M5 0L3 2M3 7L5 9M5 7L3 9" />
    <path class="highlight-border" d="M0 0H8V9H0Z" />
    <path class="highlight-river" d="M0 4H8M0 5H8" />`;
  return svg;
}

export function placeStandardIntersection(element, row, col) {
  element.classList.add('xiangqi-intersection');
  element.style.left = `${col / 8 * 100}%`;
  element.style.top = `${row / 9 * 100}%`;
}

export function createStandardPieceElement(piece, label, className = '') {
  const element = document.createElement('span');
  const sideClass = piece === piece.toUpperCase() ? 'xiangqi-piece-red' : 'xiangqi-piece-black';
  element.className = `xiangqi-piece-face ${sideClass}${className ? ` ${className}` : ''}`;
  element.textContent = label;
  return element;
}

export function appendStandardPositionMark(element, row, col, className = '') {
  const marker = document.createElement('span');
  marker.className = `xiangqi-position-mark${className ? ` ${className}` : ''}${col === 0 ? ' edge-left' : ''}${col === 8 ? ' edge-right' : ''}${row === 0 ? ' edge-top' : ''}${row === 9 ? ' edge-bottom' : ''}`;
  marker.setAttribute('aria-hidden', 'true');
  for (const corner of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
    const segment = document.createElement('i');
    segment.className = `xiangqi-marker-corner corner-${corner}`;
    marker.append(segment);
  }
  element.append(marker);
  return marker;
}

export function isCannonStartPosition(row, col) {
  return (row === 2 || row === 7) && (col === 1 || col === 7);
}

export function isPawnStartPosition(row, col) {
  return (row === 3 || row === 6) && col % 2 === 0;
}