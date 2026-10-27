(function (root) {
  'use strict';

  const symbols = new Set('KQRBNPkqrbnp');

  function emptyBoard() {
    return Array.from({ length: 8 }, () => Array(8).fill(''));
  }

  function boardToFen(board, turn, castling = '-', enPassant = '-') {
    const rows = board.map(row => {
      let text = '';
      let empty = 0;
      for (const piece of row) {
        if (!piece) empty += 1;
        else {
          if (empty) text += empty;
          text += piece;
          empty = 0;
        }
      }
      if (empty) text += empty;
      return text;
    });
    return `${rows.join('/')} ${turn} ${castling || '-'} ${enPassant || '-'} 0 1`;
  }

  function parseFen(fen) {
    const fields = String(fen || '').trim().split(/\s+/);
    if (fields.length !== 6 || !/^[wb]$/.test(fields[1])) throw new Error('FEN需包含完整六个字段和正确的行棋方。');
    if (!/^(?:-|K?Q?k?q?)$/.test(fields[2]) || !/^(?:-|[a-h][36])$/.test(fields[3])) throw new Error('FEN易位权或吃过路兵格无效。');
    const rows = fields[0].split('/');
    if (rows.length !== 8) throw new Error('FEN棋盘必须恰好包含8行。');
    const board = rows.map((text, rowIndex) => {
      const row = [];
      let previousWasDigit = false;
      for (const token of text) {
        if (/^[1-8]$/.test(token)) {
          if (previousWasDigit) throw new Error('FEN同一行不能连续出现多个空格数字。');
          row.push(...Array(Number(token)).fill(''));
          previousWasDigit = true;
        }
        else if (symbols.has(token)) { row.push(token); previousWasDigit = false; }
        else throw new Error(`FEN中包含无效棋子符号：${token}`);
      }
      if (row.length !== 8) throw new Error(`FEN第${8 - rowIndex}行没有恰好8格。`);
      return row;
    });
    const flat = board.flat();
    if (flat.filter(Boolean).length > 32) throw new Error('棋盘上的棋子总数不能超过32枚。');
    if (flat.filter(piece => piece === 'K').length !== 1 || flat.filter(piece => piece === 'k').length !== 1) {
      throw new Error('局面必须恰好包含白王和黑王各一枚。');
    }
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const piece = board[row][col];
        if ((piece === 'P' && row === 0) || (piece === 'p' && row === 7)) throw new Error('兵不能放在升变后的底线。');
        if (piece === 'K' || piece === 'k') {
          const opponent = piece === 'K' ? 'k' : 'K';
          const opponentSquare = board.flatMap((line, r) => line.map((value, c) => value === opponent ? [r, c] : null)).find(Boolean);
          if (Math.max(Math.abs(row - opponentSquare[0]), Math.abs(col - opponentSquare[1])) <= 1) throw new Error('双方王不能相邻。');
        }
      }
    }
    return { board, turn: fields[1], castling: fields[2], enPassant: fields[3], halfmove: fields[4], fullmove: fields[5] };
  }

  root.ChessRootGeneCore = { emptyBoard, boardToFen, parseFen };
})(window);
