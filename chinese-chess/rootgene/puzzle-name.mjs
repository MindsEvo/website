const FULL_ID = /^(eg|at|tac|oc)_([\p{L}\p{N}]+)_(L[1-3])-(\d{3})$/u;
const NAME = /^[\p{L}\p{N}]+$/u;

export function parsePuzzleName(value, prefix, level, existingTitle = '') {
  const input = value.trim();
  const match = FULL_ID.exec(input);
  if (match) {
    if (match[1] !== prefix || match[3] !== level) {
      throw new Error(`编号前缀和级别必须与所选类型及级别一致：${prefix} 和 ${level}。`);
    }
    return { title: match[2], id: input };
  }
  if (NAME.test(input) || (input && input === existingTitle)) return { title: input, id: '' };
  throw new Error('请输入棋局名称，或完整编号（例如 eg_双炮臣压君_L2-001）。');
}
