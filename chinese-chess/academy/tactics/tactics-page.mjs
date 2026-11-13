import { initEndgamePage } from '../endgame/endgame-page.mjs';
import { TACTICS_GROUPS, TACTICS_CATEGORIES, selectTacticsPuzzles } from './tactics-catalog.mjs';

initEndgamePage({
  groups: TACTICS_GROUPS,
  categories: TACTICS_CATEGORIES,
  selectPuzzles: selectTacticsPuzzles,
  pendingGroup: '待定'
});
