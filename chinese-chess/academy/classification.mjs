import { ATTACKING_GROUPS } from './attacking/attacking-catalog.mjs';
import { TACTICS_GROUPS } from './tactics/tactics-catalog.mjs';
import { OPENING_GROUPS, OPENING_SUBGROUPS } from './opening/opening-catalog.mjs';

export const ENDGAME_GROUPS = {
  车: ['单车杀王', '车马杀王', '车炮杀王'],
  马: ['双马杀王', '马兵杀王', '马炮杀王'],
  炮: ['单炮杀王', '双炮杀王', '炮兵杀王'],
  兵卒: ['单兵杀王', '多兵杀王', '兵马杀王'],
  组合: ['车马炮杀王', '多子杀王', '复杂残局'],
  待定: ['待定']
};

export const CLASSIFICATION_GROUPS = {
  endgame: ENDGAME_GROUPS,
  attacking: ATTACKING_GROUPS,
  tactics: { ...TACTICS_GROUPS, 待定: ['待定'] },
  opening: Object.fromEntries(Object.entries(OPENING_GROUPS).map(([group, subgroups]) =>
    [group, group === '待定' ? ['待定'] : subgroups.flatMap(subgroup => OPENING_SUBGROUPS[subgroup] || [subgroup])]))
};

export function validClassification(value) {
  return Boolean(value && typeof value === 'object'
    && CLASSIFICATION_GROUPS[value.family]?.[value.group]?.includes(value.category));
}
