# 题型规格单

- 模块：pattern（learning-math-pattern）
- 题型：repetition × complete（K1，carrier=color，runtime=puzzle）
- 负责人：unassigned
- 版本：v1.0

## 三维定位（PATTERN-QUALITY-GATE.md §2.1）
1. structure：`repetition`
2. carrier：`color`（`pattern.json → carriers.color`，status=`active`，与 SPEC-repetition-continue-k1 相同载体）
3. task：`complete`
4. 矩阵格：`{structure:"repetition", task:"complete"}`，`levelFloor:"K1"`；本规格单声明等级 K1，等于该格的 levelFloor，合规。
5. 上报根基因：`RG.PATTERN.SEQUENCE.BASIC`（结构基因）+ `RG.PATTERN.VISUAL.COLOR`（载体基因）。

## 与既有 K1 规格单的关系（澄清，不是矛盾）
`SPEC-repetition-continue-k1.md` §3 曾写"K1 阶段不出内部空缺（interior）或逆向（backward）题"——那句话描述的是**那一张规格单自己的出题范围**（它只授权 forward 题），不是"K1 这个年级永远不能出 complete 题"的矩阵级禁令。`taskMatrix` 本身就把 `repetition×complete` 的 `levelFloor` 定为 `K1`，说明这一格在矩阵设计时就是合法的；`numerical` 结构在 G1（L3）也是 continue/complete 同级共存（`levelMap.L3.primaryTasks:["continue","complete"]`，两者都已实现），这是本模块唯一的同类先例，本规格单照此先例延伸到 K1。落地后 `levelMap.L1.primaryTasks` 从 `["discover","continue"]` 扩为 `["discover","continue","complete"]`，与 L3 的先例一致。

## 1. 能力定义
- ability_tag：`pattern.repetition.complete`
- 训练目标：在颜色载体上认出 AB 两色循环规律，填补序列中间（或起始）的空缺，而不仅是向前续写。

## 2. 变量边界
- 允许变量：颜色对，从 `🔴 🔵 🟡 🟢 🟣 🟠` 中任选两种组成一个 AB 循环（与 continue@K1 共享同一颜色词汇表）。
- 禁止变量：数字、图形载体、超过两色的循环、非循环序列、`?` 出现在末位（那是 continue，不是 complete——两者靠 `inferenceDirectionOf` 的 blank 位置区分，不能重叠）。

## 3. 出题规则
- 序列长度：5。
- 规律模板：`A B A B A`，`?` 落在 index 1-3（interior，两侧都有线索）或 index 0（backward，只能靠周期倒推）。
- 边界策略：本题型格覆盖 interior + backward 两种非末位空缺；`TASK_OF` 已把两者都映射到 `complete`，因此同一题库里两种位置混合出题，与 `data.js` 里 numerical 各单元的既有做法一致。

## 4. 选项规则
- 选项数量：4。
- 干扰项模板：correct / 循环内的另一色（`pattern_misread`）/ 2 个不在循环内的颜色（`unrelated`）——与 continue@K1 相同的干扰项策略，因为二者共享同一 AB 循环合法性判定。
- error_type 映射：
  - `pattern_misread`：选了循环里的另一种颜色（把 A、B 弄反）。
  - `unrelated`：选了两个循环外的颜色之一。

## 5. 验收样例
- 正例（interior）：`🔴 🔵 ? 🔵 🔴` → 答案 `🔴`（index 2 属于 A 类位置的周期）。
- 正例（backward）：`? 🔵 🔴 🔵 🔴` → 答案 `🔴`（index 0 倒推周期）。
- 反例（拒绝进入题库）：`🔴 🔵 🟡 ? 🔴`（三色且不构成周期性循环，非法规律——与 continue@K1 的反例规则相同）。

## 6. 上线检查
- 出题校验通过：`test.html` 新增 interior/backward 位置的 AB 循环合法性检查（复用 continue@K1 已有的重新推导逻辑，只是取样位置不同）。
- 渲染校验通过：`renderSequence` 对 interior/backward `?` 的渲染与 forward 一致（emoji 序列 + 占位符）。
- 统计校验通过：radar report 的 `context` 携带 `taskType:"complete"`（由 `inferenceDirectionOf` 自动派生，非硬编码）。
