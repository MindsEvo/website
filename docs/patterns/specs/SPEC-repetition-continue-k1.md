# 题型规格单

- 模块：pattern（learning-math-pattern）
- 题型：repetition × continue（K1，carrier=color，runtime=puzzle）
- 负责人：unassigned
- 版本：v1.0

## 三维定位（PATTERN-QUALITY-GATE.md §2.1）
1. structure：`repetition`
2. carrier：`color`（`pattern.json → carriers.color`，status=`active`）
3. task：`continue`
4. 矩阵格：`{structure:"repetition", task:"continue"}`，`levelFloor:"K1"`；本规格单声明等级 K1，等于该格的 levelFloor，合规。
5. 上报根基因：`RG.PATTERN.SEQUENCE.BASIC`（结构基因）+ `RG.PATTERN.VISUAL.COLOR`（载体基因——规则确实落在颜色属性上，按 geneReporting 规则必须上报）。

## 1. 能力定义
- ability_tag：`pattern.repetition.continue`
- 训练目标：在颜色载体上认出 AB 两色循环规律，向前续写下一个元素（不使用数字）。

## 2. 变量边界
- 允许变量：颜色对，从 `🔴 🔵 🟡 🟢 🟣 🟠` 中任选两种组成一个 AB 循环。
- 禁止变量：数字、图形载体、超过两色的循环、非循环序列。

## 3. 出题规则
- 序列长度：5（4 个已知项 + 1 个 `?`）。
- 规律模板：`A B A B ?`（周期 2 的 AB 循环）。
- 边界策略：`?` 恒在序列末位（forward 方向）；K1 阶段不出内部空缺（interior）或逆向（backward）题，与 `levelMap.L1` 的 `primaryTasks:["discover","continue"]` 一致。

## 4. 选项规则
- 选项数量：4。
- 干扰项模板：correct / 循环内的另一色（`pattern_misread`）/ 2 个不在循环内的颜色（`unrelated`）。
- error_type 映射：
  - `pattern_misread`：选了循环里的另一种颜色（把 A、B 弄反）。
  - `unrelated`：选了两个循环外的颜色之一。

## 5. 验收样例
- 正例：`🔴 🔵 🔴 🔵 ?` → 答案 `🔴`（AB 循环，位置 4 的奇偶性对应 A）。
- 反例（拒绝进入题库）：`🔴 🔵 🟡 🔴 ?`（三色且不构成周期性循环，非法规律）。

## 6. 上线检查
- 出题校验通过：`test.html` S2/S3/S4 的 repetition 分支（AB 循环合法性 + 答案重新推导，而非采信题库自报值）。
- 渲染校验通过：`renderSequence` 对 emoji 序列渲染正常，`?` 占位符与数字题一致。
- 统计校验通过：radar report 的 `context` 携带 `structure:"repetition"`、`carrier:"color"`、`patternType:"repetition"`。
