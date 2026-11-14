import test from 'node:test';
import assert from 'node:assert/strict';
import { readServiceResponse } from '../chinese-chess/rootgene/service-response.mjs';

test('reports outdated services instead of exposing an HTML JSON parsing error', async () => {
  const response = new Response('<!DOCTYPE html>', { status: 404, headers: { 'content-type': 'text/html' } });
  await assert.rejects(() => readServiceResponse(response, '无法生成编号'), /不支持此接口.*重启/);
});

test('preserves service errors and signals uncertain outcomes for invalid responses', async () => {
  const error = Response.json({ error: '编号已存在' }, { status: 409 });
  await assert.rejects(() => readServiceResponse(error, '保存失败'), /编号已存在/);
  const html = new Response('<html>', { status: 500, headers: { 'content-type': 'text/html' } });
  await assert.rejects(() => readServiceResponse(html, '保存失败'), /结果可能未知/);
  const invalid = new Response('{invalid', { headers: { 'content-type': 'application/json' } });
  await assert.rejects(() => readServiceResponse(invalid, '保存失败'), /JSON 无效.*结果可能未知/);
  assert.deepEqual(await readServiceResponse(Response.json({ id: 'test' }), '保存失败'), { id: 'test' });
});
