import { initEndgamePage } from '../endgame/endgame-page.mjs';
import { TACTICS_GROUPS, TACTICS_CATEGORIES, selectTacticsPuzzles } from './tactics-catalog.mjs';

initEndgamePage({
  classificationFamily: 'tactics',
  groups: TACTICS_GROUPS,
  categories: TACTICS_CATEGORIES,
  selectPuzzles: selectTacticsPuzzles
});
