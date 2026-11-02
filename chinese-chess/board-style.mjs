const STORAGE_KEY = 'me:chinese-chess:board-style:v1';

export const BOARD_STYLES = Object.freeze([
  {
    id: 'wood-classic',
    label: '经典木纹',
    colors: {
      '--xiangqi-board-edge': '#76502f',
      '--xiangqi-board-base': '#c8a477',
      '--xiangqi-board-light': '#d5b68b',
      '--xiangqi-board-mid': '#c7a477',
      '--xiangqi-board-dark': '#d2b185',
      '--xiangqi-river-base': '#c9a477',
      '--xiangqi-river-light': '#d0ad7e',
      '--xiangqi-river-dark': '#d2b083',
      '--xiangqi-grid-color': 'rgba(77, 50, 29, .88)',
      '--xiangqi-marker-color': '#643f20',
      '--xiangqi-piece-border': '#f7e7c9',
      '--xiangqi-piece-red-light': '#ff8a72',
      '--xiangqi-piece-red-mid': '#ed4e3d',
      '--xiangqi-piece-red-dark': '#c92c28',
      '--xiangqi-piece-red-edge': '#99201f',
      '--xiangqi-piece-black-light': '#5d5c57',
      '--xiangqi-piece-black-mid': '#292a29',
      '--xiangqi-piece-black-dark': '#101112'
    }
  },
  {
    id: 'ivory-board',
    label: '浅色纸纹',
    colors: {
      '--xiangqi-board-edge': '#837151',
      '--xiangqi-board-base': '#e5d8b8',
      '--xiangqi-board-light': '#f0e5c9',
      '--xiangqi-board-mid': '#dfcfaa',
      '--xiangqi-board-dark': '#e9dbba',
      '--xiangqi-river-base': '#e2d2ad',
      '--xiangqi-river-light': '#eee0bf',
      '--xiangqi-river-dark': '#dfcea4',
      '--xiangqi-grid-color': 'rgba(75, 62, 42, .88)',
      '--xiangqi-marker-color': '#665438',
      '--xiangqi-piece-border': '#f0dfc0',
      '--xiangqi-piece-red-light': '#f27b68',
      '--xiangqi-piece-red-mid': '#d94b40',
      '--xiangqi-piece-red-dark': '#b9342d',
      '--xiangqi-piece-red-edge': '#8a2523',
      '--xiangqi-piece-black-light': '#596d79',
      '--xiangqi-piece-black-mid': '#33434d',
      '--xiangqi-piece-black-dark': '#1a252b'
    }
  },
  {
    id: 'dark-wood',
    label: '深色木纹',
    colors: {
      '--xiangqi-board-edge': '#473726',
      '--xiangqi-board-base': '#80664a',
      '--xiangqi-board-light': '#947a5a',
      '--xiangqi-board-mid': '#80664a',
      '--xiangqi-board-dark': '#8a7052',
      '--xiangqi-river-base': '#806449',
      '--xiangqi-river-light': '#967b5a',
      '--xiangqi-river-dark': '#735a40',
      '--xiangqi-grid-color': 'rgba(39, 29, 20, .92)',
      '--xiangqi-marker-color': '#382719',
      '--xiangqi-piece-border': '#dbc8a8',
      '--xiangqi-piece-red-light': '#ffa06e',
      '--xiangqi-piece-red-mid': '#de553b',
      '--xiangqi-piece-red-dark': '#a72d22',
      '--xiangqi-piece-red-edge': '#701d18',
      '--xiangqi-piece-black-light': '#716e67',
      '--xiangqi-piece-black-mid': '#363533',
      '--xiangqi-piece-black-dark': '#171717'
    }
  }
]);

export function getBoardStyleId() {
  try {
    return localStorage.getItem(STORAGE_KEY) || BOARD_STYLES[0].id;
  } catch {
    return BOARD_STYLES[0].id;
  }
}

export function applyBoardStyle(styleId = getBoardStyleId()) {
  const style = BOARD_STYLES.find(item => item.id === styleId) || BOARD_STYLES[0];
  for (const [property, value] of Object.entries(style.colors)) {
    document.documentElement.style.setProperty(property, value);
  }
  document.documentElement.dataset.xiangqiBoardStyle = style.id;
  return style;
}

export function setBoardStyle(styleId) {
  const style = BOARD_STYLES.find(item => item.id === styleId);
  if (!style) throw new Error(`Unknown Xiangqi board style: ${styleId}`);
  try { localStorage.setItem(STORAGE_KEY, style.id); } catch {}
  applyBoardStyle(style.id);
  window.dispatchEvent(new CustomEvent('xiangqi-board-style-changed', { detail: { styleId: style.id } }));
  return style;
}

export function onBoardStyleChange(callback) {
  const handler = event => callback(applyBoardStyle(event.detail?.styleId));
  window.addEventListener('xiangqi-board-style-changed', handler);
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) callback(applyBoardStyle(event.newValue || BOARD_STYLES[0].id));
  });
  return () => window.removeEventListener('xiangqi-board-style-changed', handler);
}

applyBoardStyle();
