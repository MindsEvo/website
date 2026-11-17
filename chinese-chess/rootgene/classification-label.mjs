export function formatPuzzleClassification(category, item, inferClassification, familyLabels) {
  const entries = item.classifications?.length
    ? item.classifications
    : [inferClassification(category, item)].filter(Boolean);
  if (!entries.length) return `${familyLabels[category.family] || category.label || '未分类'}：未分类`;
  return entries.map(entry => {
    const family = familyLabels[entry.family] || entry.family;
    return `${family}：${entry.group || '未分类'} → ${entry.category || '未细分'}`;
  }).join('；');
}
