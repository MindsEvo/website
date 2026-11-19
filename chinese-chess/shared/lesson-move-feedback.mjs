import { getGameStatus, getPieceLabel, RED } from '../core.mjs';

export function getLessonMoveFeedback(game) {
  const state = getGameStatus(game);
  const last = game.history.at(-1);
  const side = game.turn === RED ? '红方' : '黑方';
  const messages = [];
  if (last?.captured) messages.push(`吃${getPieceLabel(last.captured)}`);
  if (state.type === 'checkmate' || state.type === 'stalemate') {
    messages.push(`${state.type === 'checkmate' ? '将死' : '困毙'}，${state.winner === RED ? '红方' : '黑方'}获胜，${side}负`);
  } else if (state.type === 'forfeit') {
    const loser = state.loser === RED ? '红方' : '黑方';
    const winner = state.winner === RED ? '红方' : '黑方';
    messages.push(`${loser}因${drawReason(state.reason)}判负，${winner}获胜`);
  } else if (state.type === 'draw') {
    messages.push(`和棋 · ${drawReason(state.reason)}`);
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
    losingKing: state.loser ? (state.loser === RED ? 'K' : 'k') : state.winner ? (game.turn === RED ? 'K' : 'k') : null
  };
}

function drawReason(reason) {
  return ({
    agreement: '双方同意',
    repetition: '三次循环双方着法均允许',
    'mutual-repetition': '三次循环双方均未变着',
    'perpetual-attack': '长将或长捉',
    'natural-limit': '连续60回合无吃子',
    'no-material': '双方均无可取胜棋子'
  })[reason] || '依规则裁定';
}
