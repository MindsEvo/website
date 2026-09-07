# 题型规格单

- 模块：pattern（learning-math-pattern）
- 题型：alternating × discover（G1，carrier=direction，runtime=puzzle）
- 负责人：unassigned
- 版本：v1.0

## 三维定位（PATTERN-QUALITY-GATE.md §2.1）
1. structure：`alternating`
2. carrier：`direction`（与 `SPEC-alternating-continue-g1` / `SPEC-alternating-complete-g1` 相同载体，同一题库风格）
3. task：`discover`
4. 矩阵格：`{structure:"alternating", task:"discover"}`，`levelFloor:"G1"`；本规格单声明等级 G1，等于该格的 levelFloor，合规。
5. 上报根基因：`RG.PATTERN.SEQUENCE.BASIC` + `RG.PATTERN.VISUAL.SEQUENCE`（同 continue@G1 / complete@G1）。同 `SPEC-repetition-discover-k1`：`taskType` 不写入 `TASK_OF`，作为独立哨兵值 `'discover'` 直接进入 `difficultyAxis.task_complexity`；`inference_direction` 置 `null`（discover 无空缺位置，回答"做什么"而非"缺口在哪"）。

## 1. 能力定义
- ability_tag：`pattern.alternating.discover`
- 训练目标：面对若干组"看起来相似"的方向/状态序列，识别哪一组真的是两两交替的振荡规律，哪些只是表面相似的伪规律——"看见规律"起点，早于"预测/补全/检查"。

## 2. 变量边界
- 允许变量：方向/状态词汇表与 `SPEC-alternating-continue-g1` 相同（⬆️⬇️ 两状态振荡为主，不引入第三状态作为"正确组"的构成元素）；各候选组序列长度可以不同（4–6 之间），理由同 discover@K1——"是否铺满整循环"本身是判据。
- 禁止变量：正确组必须是严格的两状态交替（period=2，总长度是 2 的整倍数）；候选组总数固定为 4，正确组位置在题库内随机分布。

## 3. 出题规则
- 候选组数：4（对应下方 4 类，含 1 个正例与 3 类干扰）。
- 规律模板：
  1. 正例：`⬆️⬇️⬆️⬇️⬆️⬇️`（period=2，长度 6，signature `ABABAB`，周期性）。
  2. 干扰-规律误读：前半段延续交替，末尾断裂，如 `⬆️⬇️⬆️⬇️⬆️⬆️`（signature `ABABAA`，非周期）。
  3. 干扰-循环错位：单元正确但总长度未铺满整循环，如 `⬆️⬇️⬆️⬇️⬆️`（长度 5，非周期）。
  4. 干扰-无序：混入交替词汇表之外的状态或互不相同，如 `⬆️⬇️➡️⬅️➡️⬇️`（signature `ABCDCB`，非周期），呼应 `SPEC-alternating-complete-g1` 反例"三状态非周期，非法"——此处该结构被用作 discover 的合法干扰项，而非需要拒绝的正例。
- 边界策略：判定方法与运行时 `structureSignature()` + `isPeriodicSignature()` 完全一致；正确组是且仅是能通过该函数判定为周期性的那一组，数据作者不得手写标记凌驾判定函数。

## 4. 选项规则
- 选项数量：4（与候选组一一对应）。
- 干扰项模板：
  1. 正确组（error_type: `none`）。
  2. 规律误读组（error_type: `pattern_misread`）。
  3. 循环错位组（error_type: `cycle_misalign`，替代 `adjacent_item`，理由同 §4 备注"循环题可替换为 cycle_misalign"）。
  4. 无序/混入额外状态组（error_type: `random`）。
- error_type 映射：见上；4 类穷尽本题型的候选组构造方式，无同义重复命名，与 `SPEC-repetition-discover-k1` 保持跨结构一致的命名口径。

## 5. 验收样例
- 正例：候选组 `{1:"⬆️⬇️⬆️⬇️⬆️", 2:"⬆️⬇️➡️⬅️➡️⬇️", 3:"⬆️⬇️⬆️⬇️⬆️⬇️", 4:"⬆️⬇️⬆️⬇️⬆️⬆️"}` → 答案第 3 组。
- 反例（拒绝）：两组同时通过判定为周期性（答案不唯一），或正确组使用 G1 题库未出现过的状态词汇。

## 6. 上线检查
- 出题校验通过：`test.html` 复用 discover@K1 建立的候选组重算校验逻辑（`structureSignature`/`isPeriodicSignature`），断言恰好 1 组为真且位置等于 `answer`。
- 渲染校验通过：与 discover@K1 共用 `game.js` 的 `q.task === 'discover'` 渲染分支，仅数据不同。
- 统计校验通过：radar report 的 `context` 携带 `taskType:"discover"`、`inferenceDirection:null`、`difficultyAxis.task_complexity:"discover"`。
