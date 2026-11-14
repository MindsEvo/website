export async function readServiceResponse(response, failureMessage) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    if (response.status === 404) {
      throw new Error('本地题库服务不支持此接口，请重启端口 8787 的服务后刷新页面。');
    }
    throw new Error(`${failureMessage}：本地服务返回了非 JSON 响应（HTTP ${response.status}）；操作结果可能未知，请刷新题库检查。`);
  }
  let result;
  try {
    result = await response.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new Error(`${failureMessage}：本地服务返回的 JSON 无效（HTTP ${response.status}）；操作结果可能未知，请刷新题库检查。`);
  }
  if (!response.ok) throw new Error(result?.error || `${failureMessage}（HTTP ${response.status}）。`);
  return result;
}
