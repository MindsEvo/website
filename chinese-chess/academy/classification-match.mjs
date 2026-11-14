export function explicitClassificationMatches(puzzle, family, category) {
  if (!puzzle.classifications) return null;
  return puzzle.classifications.some(entry => entry.family === family && entry.category === category);
}
