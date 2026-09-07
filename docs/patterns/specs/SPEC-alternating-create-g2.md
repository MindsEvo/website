# 题型规格单

- 模块：pattern（learning-math-pattern）
- 题型：alternating × create（G2，carrier=direction，runtime=sort）
- 负责人：unassigned
- 版本：v1.0

## 三维定位（PATTERN-QUALITY-GATE.md §2.1）
1. structure：`alternating`
2. carrier：`direction`（`pattern.json → carriers` 里的 `direction` 条目，`carrierGeneId: RG.PATTERN.SPATIAL.RELATION`；该条目已在 Unit 8 的 G1 拼图内容中使用，本题继续沿用同一载体）
3. task：`create`
4. 矩阵格：`{structure:"alternating", task:"create"}`，`levelFloor:"G2"`；本规格单声明等级 G2，等于该格的 levelFloor，合规。
5. 上报根基因：`RG.PATTERN.SEQUENCE.BASIC`（结构基因）+ `RG.PATTERN.SPATIAL.RELATION`（方向载体基因）。

## 1. 能力定义
- ability_tag：`pattern.alternating.create`
- 训练目标：构造一个满足"一上一下交替"结构签名（`ABAB`）的排列——把 4 个箭头（2 上 2 下）摆成真正的交替，而不是分组堆放（`UUDD`/`DDUU`）。这是 alternating 结构本模块内任务复杂度最高的一格，也是本模块首次让 `direction` 载体进入非拼图（拖放）活动。

## 2. 变量边界
- 允许变量：箭头方向（上/下，2+2）、摆放顺序（拖拽产生）。
- 禁止变量：箭头数量必须恰好 4 个、方向必须恰好 2 种各 2 个——不对称组合下 `ABAB` 签名不可达；不得与 repetition×create@K2 共用 emoji 词汇（上⬆️/下⬇️ vs 红🔴/蓝🔵）。

## 3. 出题规则
- 目标签名：`ABAB`（周期 2，两符号严格交替），对应 alternating 结构"两两振荡"的定义特征，与既有 `alternating×match@G2` 样本（比较两组已成形序列的振荡签名）互补——这里是"构造"出一个振荡排列，不是比较两个已给定的振荡序列。
- 元素：`items = [{id:'D0',token:'up',emoji:'⬆️'}, {id:'D1',token:'up',emoji:'⬆️'}, {id:'D2',token:'down',emoji:'⬇️'}, {id:'D3',token:'down',emoji:'⬇️'}]`。
- 可达性：4 个元素（2 上 2 下）共有 6 种不同 token 排列，其中恰好 2 种（`UDUD`、`DUDU`）满足 `ABAB` 签名——非空解、非全部满足（test.html S14b 已验证 `matching=2 / distinct=6`）。

## 4. 选项规则（拖放活动，套用 §8.1 create 行，不适用"answer 在 options 内"）
- 元素总数 4，槽位总数 4，一一对应（复用 `SortRuntime` 的槽位交互，与 repetition×create@K2 相同 runtime，零代码分叉）。
- 正确判定：最终摆放通过 `structureSignature()` 计算出的签名 === `ABAB`。
- error_type 映射（§8.3）：结果签名与目标签名不符（如摆成 `UUDD`/`DDUU` 分组堆放）→ `signature_mismatch`；一次成功 → `none`。

## 5. 验收样例
- 正例（视为通过）：`⬆️⬇️⬆️⬇️`（UDUD）、`⬇️⬆️⬇️⬆️`（DUDU）——两者签名均为 `ABAB`，同样正确。
- 反例（拒绝）：`⬆️⬆️⬇️⬇️`（UUDD）、`⬇️⬇️⬆️⬆️`（DDUU）——这是 repetition 的 AABB 签名，不是 alternating 的 ABAB，触发 `signature_mismatch`；`⬆️⬇️⬇️⬆️`（UDDU）、`⬇️⬆️⬆️⬇️`（DUUD）——签名为 `ABBA`，同样拒绝。

## 6. 上线检查
- 出题校验通过：元素数组长度、id 唯一性、token/emoji 字段齐全、同一 token 的 emoji 一致；目标签名可达性与非全达性交叉校验（枚举全部排列，用 `structureSignature()` 重新计算）。
- 渲染校验通过：`SortRuntime` 以 `variant.targetSignature` 模式渲染，拖放交互与 repetition×create@K2 复用同一 runtime。
- 统计校验通过：radar report 携带 `structure:"alternating"`、`carrier:"direction"`、`taskType:"create"`、`activityMode:"create"`。
- 文档一致性：`pattern.json → carriers → direction` 的 `status` 字段需与实际使用情况核对（Unit 8 拼图 + 本 create 活动均已使用该载体）。
