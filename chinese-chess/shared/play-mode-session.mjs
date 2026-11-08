import { createGame } from '../core.mjs';

const STORAGE_KEY = 'xiangqi-play-mode-transfer';

export function restorePlayModeSession(storage = sessionStorage, pathname = location.pathname) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved.pathname !== pathname) return null;
    storage.removeItem(STORAGE_KEY);
    const game = createGame(saved.state.game);
    if (!Array.isArray(saved.state.game.history) || !Array.isArray(saved.state.game.redoStack)) return null;
    game.history = saved.state.game.history;
    game.redoStack = saved.state.game.redoStack;
    const selectedPuzzle = saved.state.selectedPuzzle
      ? { ...saved.state.selectedPuzzle, base: saved.state.selectedPuzzle.base || '../bank/endgame/L1/' }
      : null;
    return { ...saved.state, game, selectedPuzzle };
  } catch {
    return null;
  }
}

export function bindPlayModeSession(container, capture, pause, storage = sessionStorage) {
  for (const link of container.querySelectorAll('a[data-mode]')) {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (link.getAttribute('aria-current') === 'page') {
        event.preventDefault();
        return;
      }
      pause();
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify({ pathname: new URL(link.href).pathname, state: capture() }));
      } catch {
        event.preventDefault();
      }
    });
  }
}