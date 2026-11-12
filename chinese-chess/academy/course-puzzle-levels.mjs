const SECTION_LEVELS = {
  observation: new Set(['L1']),
  practice: new Set(['L2', 'L3'])
};

export function getCoursePuzzleLevel(puzzle, categoryLevel = '') {
  const idLevel = puzzle.id?.match(/_L([1-3])-/)?.[1];
  if (idLevel) return `L${idLevel}`;
  const pathLevel = `${puzzle.fen || ''} ${puzzle.solutions?.[0] || ''}`.match(/\/L([1-3])\//)?.[1];
  return pathLevel ? `L${pathLevel}` : categoryLevel;
}

export function selectCoursePuzzlesForSection(puzzles, section, categoryLevel = '') {
  const levels = SECTION_LEVELS[section];
  if (!levels) return [];
  return puzzles.filter(puzzle =>
    levels.has(getCoursePuzzleLevel(puzzle, categoryLevel)));
}
