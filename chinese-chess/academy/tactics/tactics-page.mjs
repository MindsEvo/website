import { initEndgamePage } from '../endgame/endgame-page.mjs';
import { TACTICS_GROUPS, TACTICS_CATEGORIES, TACTICS_SOURCE_LABELS } from './tactics-catalog.mjs';

initEndgamePage({
  groups: TACTICS_GROUPS,
  categories: TACTICS_CATEGORIES,
  sourceLabels: TACTICS_SOURCE_LABELS
});
