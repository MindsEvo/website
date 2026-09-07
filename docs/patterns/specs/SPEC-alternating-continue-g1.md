# 题型规格单

- 模块：pattern（learning-math-pattern）
- 题型：alternating × continue（G1，carrier=direction，runtime=puzzle）
- 负责人：unassigned
- 版本：v1.0

## 三维定位（PATTERN-QUALITY-GATE.md §2.1）
1. structure：`alternating`
2. carrier：`direction`（新载体——`pattern.json → typeTree.alternating.examples[0]` 明确列出"up down up down / on off on off"为该结构的范例；这是本模块第一次给 `alternating` 引入单载体拼图内容，此前唯一实现的 `alternating` 内容是跨载体的 match 样例）
3. task：`continue`
4. 矩阵格：`{structure:"alternating", task:"continue"}`，`levelFloor:"G1"`；本规格单声明等级 G1，等于该格的 levelFloor，合规。
5. 上报根基因：`RG.PATTERN.SEQUENCE.BASIC`（结构基因）+ `RG.PATTERN.VISUAL.SEQUENCE`（沿用 `STRUCTURE_GENES.alternating` 既定的图形类基因；方向箭头归类为图形载体，不新增基因 id）。

## 与 repetition 的区别（为什么这不是同一件事换了图标）
`repetition` 的范例是"单一属性的循环续写"；`alternating` 的范例是"两种对立状态的振荡"（up/down、on/off），在 `typeTree.json` 里是两条并列但语义不同的分类，即使数学签名同为周期 2。本题型内容严格取自 `alternating.examples[0]` 的字面案例，不是把 repetition 的颜色循环换皮。

## 1. 能力定义
- ability_tag：`pattern.alternating.continue`
- 训练目标：认出方向/状态两两交替出现的振荡规律（⬆️⬇️），向前续写下一个状态。

## 2. 变量边界
- 允许变量：方向对 `⬆️ ⬇️` 或状态对 `☀️ 🌙`（每题固定用一对，不混用）。
- 禁止变量：数字、颜色载体（避免与 repetition 内容混淆）、超过两状态的振荡、非周期序列。

## 3. 出题规则
- 序列长度：5（4 个已知项 + 1 个 `?`）。
- 规律模板：`A B A B ?`（周期 2 的状态振荡）。
- 边界策略：`?` 恒在序列末位（forward 方向），与 `alternating×complete@G1` 的 interior/backward 题共用同一题库、靠 `inferenceDirectionOf` 的 blank 位置分流，互不重叠。

## 4. 选项规则
- 选项数量：4。
- 干扰项模板：correct / 振荡中的另一状态（`pattern_misread`，把 A、B 弄反）/ 2 个振荡词汇外的状态或图形（`unrelated`）。
- error_type 映射：
  - `pattern_misread`：选了振荡里的另一状态。
  - `unrelated`：选了振荡词汇外的干扰项。

## 5. 验收样例
- 正例：`⬆️ ⬇️ ⬆️ ⬇️ ?` → 答案 `⬆️`（周期 2，index 4 的奇偶性对应 A）。
- 反例（拒绝进入题库）：`⬆️ ⬇️ ➡️ ⬆️ ?`（三状态且不构成周期性振荡，非法规律）。

## 6. 上线检查
- 出题校验通过：`test.html` 新增 alternating 分支的振荡合法性检查（复用 `structureSignature`/`isPeriodicSignature`，§6.1 助手函数，而非再手写一套判定）。
- 渲染校验通过：`renderSequence` 对状态 emoji 序列渲染正常，`?` 占位符与既有题型一致。
- 统计校验通过：radar report 的 `context` 携带 `structure:"alternating"`、`taskType:"continue"`、`gradeCode:"G1"`。
