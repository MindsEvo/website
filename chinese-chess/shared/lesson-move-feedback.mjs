import { getGameStatus, getPieceLabel, RED } from '../core.mjs';

export function getLessonMoveFeedback(game) {
  const state = getGameStatus(game);
  const last = game.history.at(-1);
  const side = game.turn === RED ? '红方' : '黑方';
  const messages = [];
  if (last?.captured) messages.push(`吃${getPieceLabel(last.captured)}`);
  if (state.winner) {
    messages.push(`${state.type === 'checkmate' ? '将死' : '困毙'}，${state.winner === RED ? '红方' : '黑方'}获胜，${side}负`);
  } else if (state.type === 'invalid') {
    messages.push('局面无效，无法判断胜负');
  } else if (state.inCheck) {
    messages.push(`将军，${side}应将`);
  }
  return {
    state,
    text: messages.join('；'),
    capture: last?.captured ? last.to : null,
    checkedKing: state.inCheck && state.type !== 'invalid' ? (game.turn === RED ? 'K' : 'k') : null,
    losingKing: state.winner ? (game.turn === RED ? 'K' : 'k') : null
  };
}
