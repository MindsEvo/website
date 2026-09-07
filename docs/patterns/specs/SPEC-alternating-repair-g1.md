# 题型规格单

- 模块：pattern（learning-math-pattern）
- 题型：alternating × repair（G1，carrier=direction，runtime=puzzle）
- 负责人：unassigned
- 版本：v1.0

## 三维定位（PATTERN-QUALITY-GATE.md §2.1）
1. structure：`alternating`
2. carrier：`direction`（与 `SPEC-alternating-continue-g1` / `-complete-g1` / `-discover-g1` 相同载体；日夜 `☀️🌙` 变体沿用同一题库风格）
3. task：`repair`
4. 矩阵格：`{structure:"alternating", task:"repair"}`，`levelFloor:"G1"`；本规格单声明等级 G1，等于该格的 levelFloor，合规。
5. 上报根基因：`RG.PATTERN.SEQUENCE.BASIC` + `RG.PATTERN.VISUAL.COLOR` + `RG.PATTERN.VISUAL.SEQUENCE`（同 `STRUCTURE_GENES.alternating`，不新增）。`taskType` 不进入 `TASK_OF`，`difficultyAxis.inference_direction` 置 `null`，`task_complexity` 用哨兵值 `'repair'`——与 `SPEC-repetition-repair-k2.md` 完全同理，此处不重复展开推导过程，仅承接该规格单的结论。

## 1. 能力定义
- ability_tag：`pattern.alternating.repair`
- 训练目标：与 repetition×repair 同一能力形态（先定位、再修复），载体换成方向/昼夜两态交替（⬆️⬇️ 或 ☀️🌙），验证"定位+修复"这一任务形状能否跨结构复用，而不依赖颜色这一个载体。

## 2. 变量边界
- 允许变量：方向词汇表与 `SPEC-alternating-continue-g1` 一致（⬆️⬇️ 或 ☀️🌙 双态交替，二选一，同一题不混用两套词汇）；序列长度 5–6；错误项下标随机分布（覆盖首、中、尾）。
- 禁止变量：全序列恰好一处错误；还原后必须通过 `structureSignature`/`isPeriodicSignature` 判定为周期 2；错误值必须来自本题库合法词汇表，且不得等于该位置本应有的值。

## 3. 出题规则
- 序列形态：满序列，长度 5 或 6，不含 `'?'`，与 repetition×repair 相同的"满序列+一处错误"结构，仅把颜色词汇表换成方向/昼夜词汇表。
- 构造方法：与 `SPEC-repetition-repair-k2.md` §3 完全一致——先写合法 period-2 序列，替换一处为词汇表内的另一值，记录 `brokenIndex`/`answer`。
- 边界策略：与 `SPEC-repetition-repair-k2.md` §3 完全一致——`test.html` 用多数投票法独立重新推导 `brokenIndex`/`answer`，要求候选下标唯一。

## 4. 选项规则
- 交互与选项结构与 `SPEC-repetition-repair-k2.md` §4 完全一致（两步：定位 + 修复；4 个颜色候选替换为 4 个方向/状态候选）。
- 干扰项模板（沿用同一 error_type 命名，仅替换载体）：
  1. 正确修复值（error_type: `none`）。
  2. 循环错位——错误位置的"另一态"（把 ⬆️/⬇️ 或 ☀️/🌙 弄反）（error_type: `cycle_misalign`）。
  3. 规律误读——序列词汇表之外但与 continue/complete/discover 干扰项风格一致的第三态（如 `➡️`/`⭐`）（error_type: `pattern_misread`）。
  4. 无关态——题库词汇表之外、本题从未出现的方向/状态符号（error_type: `random`）。
- 定位步骤的错误同样不计入 error_type 表，独立记录"下标是否命中"这一布尔量，理由与 `SPEC-repetition-repair-k2.md` §4 一致。

## 5. 验收样例
- 正例：`seq:['⬆️','⬇️','⬆️','⬆️','⬆️','⬇️']`，破坏点为下标 3，本应为 `⬇️`（还原后 `⬆️⬇️⬆️⬇️⬆️⬇️` 通过 `isPeriodicSignature`）；`brokenIndex:3`，`answer:'⬇️'`。
- 反例（拒绝）：同 `SPEC-repetition-repair-k2.md` §5——多处改动、还原后仍非周期 2、错误值等于原值，均不得入库。

## 6. 上线检查
- 与 `SPEC-repetition-repair-k2.md` §6 完全一致（同一 `test.html` 专项覆盖两个单元，同一 `game.js` 分支处理两种载体，仅词汇表不同）；radar report 的 `context.structure` 为 `"alternating"`、`carrier` 为 `"direction"`，其余字段形状相同。
