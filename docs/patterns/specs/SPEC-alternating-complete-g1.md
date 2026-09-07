# 题型规格单

- 模块：pattern（learning-math-pattern）
- 题型：alternating × complete（G1，carrier=direction，runtime=puzzle）
- 负责人：unassigned
- 版本：v1.0

## 三维定位（PATTERN-QUALITY-GATE.md §2.1）
1. structure：`alternating`
2. carrier：`direction`（与 `SPEC-alternating-continue-g1` 相同载体，同一题库）
3. task：`complete`
4. 矩阵格：`{structure:"alternating", task:"complete"}`，`levelFloor:"G1"`；本规格单声明等级 G1，等于该格的 levelFloor，合规。
5. 上报根基因：`RG.PATTERN.SEQUENCE.BASIC` + `RG.PATTERN.VISUAL.SEQUENCE`（同 continue@G1）。

## 1. 能力定义
- ability_tag：`pattern.alternating.complete`
- 训练目标：认出方向/状态两两交替出现的振荡规律，填补序列中间（或起始）的空缺。

## 2. 变量边界
- 允许变量：与 `SPEC-alternating-continue-g1` 相同的方向/状态词汇表——两个题型共用同一 Unit 的题库，只是 `?` 的位置不同。
- 禁止变量：`?` 出现在末位（那是 continue，不是 complete）。

## 3. 出题规则
- 序列长度：5。
- 规律模板：`A B A B A`，`?` 落在 index 1-3（interior）或 index 0（backward）。
- 边界策略：interior + backward 都映射到 `complete`（`TASK_OF`），与 continue@G1 同库混合出题，比照 `data.js` 里 numerical 各单元的既有做法。

## 4. 选项规则
- 选项数量：4。
- 干扰项模板：correct / 振荡中的另一状态（`pattern_misread`）/ 2 个振荡词汇外的状态（`unrelated`）。
- error_type 映射：与 continue@G1 相同。

## 5. 验收样例
- 正例（interior）：`⬆️ ⬇️ ? ⬇️ ⬆️` → 答案 `⬆️`。
- 正例（backward）：`? ⬇️ ⬆️ ⬇️ ⬆️` → 答案 `⬆️`。
- 反例（拒绝）：`⬆️ ⬇️ ➡️ ? ⬆️`（三状态非周期，非法）。

## 6. 上线检查
- 出题校验通过：`test.html` 复用 continue@G1 已建立的 alternating 分支检查，只是取样位置不同。
- 渲染校验通过：与 continue@G1 一致。
- 统计校验通过：radar report 的 `context` 携带 `taskType:"complete"`（由 blank 位置自动派生）。
