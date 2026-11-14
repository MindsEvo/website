import { parseFen } from '../core.mjs';

function positionKey(fen) {
  const { board, turn } = parseFen(fen);
  return { placement: JSON.stringify(board), turn };
}

export async function findPositionDuplicates(fen, manifest, readFen, excludeId = '') {
  const position = positionKey(fen);
  const allEntries = manifest.categories.flatMap(category => category.items
    .filter(item => item.id !== excludeId)
    .map(item => ({ category, item })));
  const entries = [...new Map(allEntries.map(entry => [entry.item.id, entry])).values()];
  const matches = await Promise.all(entries.map(async entry => {
    const candidate = positionKey(await readFen(entry.item.fen));
    if (candidate.placement !== position.placement) return null;
    return { ...entry, exact: candidate.turn === position.turn };
  }));
  return matches.filter(Boolean);
}
