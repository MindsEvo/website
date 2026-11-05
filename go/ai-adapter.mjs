import { BLACK, WHITE, playStone, passTurn } from './core.mjs';

const engineColor = color => color === BLACK ? 'black' : 'white';

export function toEnginePosition(game) {
  const toBoard = board => board.map(row => row.map(stone => (
    stone === BLACK ? 'black' : stone === WHITE ? 'white' : null
  )));

  return {
    board: toBoard(game.board),
    currentPlayer: engineColor(game.turn),
    moveHistory: game.moves.map(move => ({
      x: move.pass ? -1 : move.col,
      y: move.pass ? -1 : move.row,
      player: engineColor(move.color)
    })),
    previousBoard: game.history.length ? toBoard(game.history.at(-1).board) : undefined,
    previousPreviousBoard: game.history.length > 1 ? toBoard(game.history.at(-2).board) : undefined
  };
}

export function applyEngineMove(game, analysis) {
  const candidates = [...(analysis?.moves || [])].sort((first, second) => first.order - second.order);
  for (const candidate of candidates) {
    if (candidate.x < 0 || candidate.y < 0) {
      if (passTurn(game)) return { pass: true, candidate };
      continue;
    }
    if (Number.isInteger(candidate.x) && Number.isInteger(candidate.y) && playStone(game, candidate.y, candidate.x)) {
      return { pass: false, candidate };
    }
  }
  return null;
}