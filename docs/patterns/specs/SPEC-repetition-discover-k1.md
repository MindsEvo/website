# 题型规格单

- 模块：pattern（learning-math-pattern）
- 题型：repetition × discover（K1，carrier=color，runtime=puzzle）
- 负责人：unassigned
- 版本：v1.0

## 三维定位（PATTERN-QUALITY-GATE.md §2.1）
1. structure：`repetition`
2. carrier：`color`（与 `SPEC-repetition-continue-k1` / `SPEC-repetition-complete-k1` 相同载体，同一题库风格）
3. task：`discover`
4. 矩阵格：`{structure:"repetition", task:"discover"}`，`levelFloor:"K1"`；本规格单声明等级 K1，等于该格的 levelFloor，合规。
5. 上报根基因：`RG.PATTERN.SEQUENCE.BASIC`（同 continue@K1 / complete@K1）。`taskType` 不进入 `TASK_OF`（其取值域被 `inference_direction` 词表锁定为 forward/interior/backward），而是作为独立哨兵值 `'discover'` 直接进入 `difficultyAxis.task_complexity`（该词表本身包含 `'discover'`），`inference_direction` 置 `null`——因为 discover 没有空缺位置，"哪一组有规律"回答的是"做什么"而不是"缺口在哪"，与 `repair` 被移出该轴同理（见 pattern.json difficultyAxes.inference_direction 的 `movedOut` 备注）。

## 1. 能力定义
- ability_tag：`pattern.repetition.discover`
- 训练目标：面对若干组"看起来相似"的颜色序列，识别哪一组真的存在可重复的结构（ABAB 型循环），哪些只是表面相似的伪规律——这是"看见规律"能力的起点，早于"预测/补全/检查"。

## 2. 变量边界
- 允许变量：颜色词汇表与 `SPEC-repetition-continue-k1` 相同（🔴🔵 双色循环，K1 不引入第三色作为"正确组"的构成元素）；各候选组的序列长度可以不同（4–6 之间）——"规律是否能够完整铺满整组"本身就是判据之一，不是需要控制的无关变量。
- 禁止变量：正确组必须是严格周期性的双色交替（period=2，且总长度是 2 的整倍数）；候选组总数固定为 4，正确组在候选组中的位置在题库内随机分布（不固定在第 1 组），避免"位置线索"替代真实判断。

## 3. 出题规则
- 候选组数：4（对应下方 4 类，含 1 个正例与 3 类干扰）。
- 规律模板：
  1. 正例：`A B A B A B`（period=2，长度 6，可整除，`structureSignature` 判定为周期性）。
  2. 干扰-规律误读：前半段与正例一致，末尾断裂，如 `A B A B A A`（signature `ABABAA`，任何 1 ≤ p ≤ 3 都无法整段铺满，非周期）。
  3. 干扰-循环错位：单元正确但总长度未铺满整循环，如 `A B A B A`（长度 5，`5 % 2 ≠ 0`，非周期）。
  4. 干扰-无序：全部或大部分位置互不相同，如 `A B C D C B`（无小于总长的周期单元，非周期）。
- 边界策略：判定方法与运行时已实现的 `structureSignature()` + `isPeriodicSignature()`（`game.js`）完全一致——"正确组"是且仅是能通过该函数判定为周期性的那一组；数据作者不能凌驾于该函数手写"正确"标记，必须让候选组的实际内容自然满足/不满足判定。

## 4. 选项规则
- 选项数量：4（与候选组一一对应，选项即"选第几组"）。
- 干扰项模板：
  1. 正确组（error_type: `none`）。
  2. 规律误读组——看起来延续了 AB 交替但末尾断裂（error_type: `pattern_misread`）。
  3. 循环错位组——单元正确但总长度不构成整循环（error_type: `cycle_misalign`，按 §4 备注"循环题可替换为 cycle_misalign"，替代 `adjacent_item`）。
  4. 无序组——不存在可重复单元（error_type: `random`）。
- error_type 映射：见上；4 类穷尽本题型的候选组构造方式，无同义重复命名。

## 5. 验收样例
- 正例：候选组 `{1:"🔴🔵🔴🔵🔴🔴", 2:"🔴🔵🔴🔵🔴🔵", 3:"🔴🔵🔴🔵🔴", 4:"🔴🔵🟡🟢🟡🔵"}` → 答案第 2 组（唯一通过 `isPeriodicSignature` 判定的组）。
- 反例（拒绝）：任何题目里出现两组同时通过 `isPeriodicSignature` 判定为周期性（答案不唯一），或正确组混入 K1 未教过的第三色，均不得入库。

## 6. 上线检查
- 出题校验通过：`test.html` 新增 discover 专项——遍历题库，对每题的 4 个候选组重算 `structureSignature`/`isPeriodicSignature`，断言恰好 1 组为真且其位置等于 `answer`。
- 渲染校验通过：`game.js` `renderSequence` 的 `q.task === 'discover'` 分支渲染 4 个候选组（各自带序号），不复用单序列+`?`的布局；`getVoiceText` 对应分支返回固定提示语，不逐项朗读 emoji。
- 统计校验通过：radar report 的 `context` 携带 `taskType:"discover"`、`inferenceDirection:null`、`difficultyAxis.task_complexity:"discover"`；`TASK_OF` 映射表不新增 `discover` 键（validate.js 的 inference_direction 词表检查为硬性约束）。
