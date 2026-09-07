# 题型规格单

- 模块：pattern（learning-math-pattern）
- 题型：repetition × repair（K2，carrier=color，runtime=puzzle）
- 负责人：unassigned
- 版本：v1.0

## 三维定位（PATTERN-QUALITY-GATE.md §2.1）
1. structure：`repetition`
2. carrier：`color`（与 `SPEC-repetition-continue-k1` / `-complete-k1` / `-discover-k1` 相同载体，同一题库风格，仅等级从 K1 升到 K2）
3. task：`repair`
4. 矩阵格：`{structure:"repetition", task:"repair"}`，`levelFloor:"K2"`；本规格单声明等级 K2，等于该格的 levelFloor，合规。
5. 上报根基因：`RG.PATTERN.SEQUENCE.BASIC` + `RG.PATTERN.VISUAL.COLOR`（同 `STRUCTURE_GENES.repetition`，不新增）。`taskType` 同样不进入 `TASK_OF`——repair 没有空缺位置（序列本身是满的），回答的是"哪一项错了、错在哪"，与 discover 同理被移出 `inference_direction` 轴（`difficultyAxis.inference_direction` 置 `null`，`task_complexity` 用独立哨兵值 `'repair'`，词表已含）。

## 1. 能力定义
- ability_tag：`pattern.repetition.repair`
- 训练目标：面对一条**没有空缺**但其中一项被改错的双色循环序列，先定位哪一项破坏了循环，再选出能让循环重新成立的正确值——比 discover（判断"是不是规律"）更进一步：判断"规律哪里断了、该怎么接回去"，是"检查"而非"预测"或"发现"。

## 2. 变量边界
- 允许变量：颜色词汇表与 `SPEC-repetition-continue-k1` 一致（🔴🔵 双色循环为主，K2 沿用 K1 的双色母版，不引入第三色作为循环本身的构成元素）；序列长度 5–6，与 discover 的候选组长度范围一致；错误项所在下标在题库内随机分布（覆盖首、中、尾），避免"错误总在某个固定位置"这类位置线索。
- 禁止变量：全序列恰好一处错误（不多不少）；将错误项还原为该下标本应有的颜色后，整条序列必须能通过 `structureSignature` 判定为周期 2（`isPeriodicSignature` 为真）；错误项的“错值”本身必须是题库色彩词汇表内的合法颜色（不得是乱码或不存在的符号），且不得恰好等于其本应有的颜色（否则不成立“错误”）。

## 3. 出题规则
- 序列形态：满序列，长度 5 或 6，**不含 `'?'`**——这是与 continue/complete/discover 最大的结构差异，也是运行时判断"这是 repair 题"的依据（`task:'repair'` 字段，而非空缺位置）。
- 构造方法：先写出一条合法的 period-2 循环（如 `A B A B A B`），选定一个下标，把该处的值替换成词汇表内的另一个颜色（不能替换成同一颜色，否则没有错误），得到成题的 `seq`；记录该下标为 `brokenIndex`，记录被替换前（即修复后）的正确颜色为 `answer`。
- 边界策略：`brokenIndex`/`answer` 不是数据作者手写后就直接信任的字段——`test.html` 用与运行时同源的思路独立重新推导（对偶数/奇数两个位置各自投票出多数颜色，若恰好存在唯一一个下标与其位置多数颜色不一致，该下标即重新推导出的 `brokenIndex`，对应颜色即重新推导出的 `answer`），断言重新推导结果与数据字段完全一致，且要求这样的下标必须**恰好一个**（多于一个说明构造出的序列本身不成立“唯一错误”，禁止入库）。

## 4. 选项规则
- 交互分两步：第一步在序列本身上点选"哪一项错了"（定位），第二步从候选颜色里选"应该是什么颜色"（修复）；两步都答对才算本题正确。
- 第二步选项数量：4（候选颜色，含 1 个正确修复值与 3 个干扰色）。
- 干扰项模板（对齐 §4 的通用四项，替换"相邻项误判"为循环题惯用的 `cycle_misalign`，与 discover 规格单同一替换理由）：
  1. 正确修复值（error_type: `none`）。
  2. 循环错位——错误项本身所在位置的"另一半"颜色（即把 A/B 弄反，仍是本序列词汇表内的颜色，但套在错误位置上仍不能让整段回到周期 2）（error_type: `cycle_misalign`）。
  3. 规律误读——序列里出现过、但不属于该双色循环词汇表本身相邻关系的第三色（error_type: `pattern_misread`）。
  4. 无关色——题库色彩词汇表之外风格一致但本题从未出现的颜色（error_type: `random`）。
- 定位步骤的错误不计入上面的 error_type 表（它是独立的"选错下标"维度，不是"选错颜色"）：pattern.json 对 repair 的度量说明本身已注明这是两个不可合并的错误维度（定位错 vs 修复值错），本规格单不重复建新词表，只在验收/统计层面分别记录"下标是否命中 `brokenIndex`"与"颜色是否命中 `answer`"两个布尔量。

## 5. 验收样例
- 正例：`seq:['🔴','🔵','🔴','🔴','🔴','🔵']`，破坏点为下标 3（0 基），本应为 `🔵`（还原后 `🔴🔵🔴🔵🔴🔵` 通过 `isPeriodicSignature`）；`brokenIndex:3`，`answer:'🔵'`，`options` 含 `🔵` 与 3 个干扰色。
- 反例（拒绝）：改动两处或更多（导致重新推导出的候选下标不唯一）；或还原后的序列本身仍不是周期 2（说明"正确版本"本身不成立）；或错误值恰好等于该位置本应有的颜色（等于没有错误）。

## 6. 上线检查
- 出题校验通过：`test.html` 新增 repair 专项——遍历题库，对每题独立重新推导 `brokenIndex`/`answer`（多数投票法），断言与数据字段一致且候选下标唯一；校验 `options` 含 `answer` 且 4 项互不相同。
- 渲染校验通过：`game.js` `renderSequence` 的 `q.task === 'repair'` 分支渲染整条无空缺序列，逐项可点击定位；点选后再渲染第二步的颜色候选（复用 `#s1-opts`）；`checkAnswer` 在下标未选定时不判定，选定下标后要求"下标命中 `brokenIndex`" 且 "所选颜色命中 `answer`" 同时成立才算通过。
- 统计校验通过：radar report 的 `context` 携带 `taskType:"repair"`、`inferenceDirection:null`、`difficultyAxis.task_complexity:"repair"`；`TASK_OF` 映射表不新增 `repair` 键（与 discover 同理，硬性约束）。
