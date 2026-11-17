const CLASSIFICATION_API = 'http://localhost:8787/api/v1/chinese-chess/classifications';

export async function fetchClassificationGroups() {
  const response = await fetch(CLASSIFICATION_API, { cache: 'no-store' });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`分类目录服务返回了无效响应 (${response.status})。`);
  }
  if (!response.ok || !result.ok || !result.groups) {
    throw new Error(result.error || `分类目录载入失败 (${response.status})。`);
  }
  return result.groups;
}

export async function mutateClassificationCatalog(change) {
  const response = await fetch(CLASSIFICATION_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(change)
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`分类目录服务返回了无效响应 (${response.status})。`);
  }
  if (!response.ok || !result.ok || !result.groups) {
    throw new Error(result.error || `分类目录更新失败 (${response.status})。`);
  }
  return result.groups;
}
