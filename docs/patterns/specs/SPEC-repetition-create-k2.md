# 题型规格单

- 模块：pattern（learning-math-pattern）
- 题型：repetition × create（K2，carrier=color，runtime=sort）
- 负责人：unassigned
- 版本：v1.0

## 三维定位（PATTERN-QUALITY-GATE.md §2.1）
1. structure：`repetition`
2. carrier：`color`（`pattern.json → carriers` 里 status=`active` 的条目）
3. task：`create`
4. 矩阵格：`{structure:"repetition", task:"create"}`，`levelFloor:"K2"`；本规格单声明等级 K2，等于该格的 levelFloor，合规。
5. 上报根基因：`RG.PATTERN.SEQUENCE.BASIC`（结构基因）+ `RG.PATTERN.VISUAL.COLOR`（颜色载体基因）——create 任务本身只涉及颜色这一个载体（不像 match 那样跨载体比较两组签名）。

## 1. 能力定义
- ability_tag：`pattern.repetition.create`
- 训练目标：不是从已有序列中"看出"规律（discover/match）或"续写/填补/修复"已有规律（continue/complete/repair），而是从零**构造**一个满足指定结构签名的排列——把 4 颗珠子（2 红 2 蓝）摆成"两个一样紧挨着"（签名 `AABB`）。这是 repetition 结构在本模块里任务复杂度最高的一格（`pattern.json → difficultyAxes → task_complexity` 序列中 create 排在最后）。

## 2. 变量边界
- 允许变量：珠子颜色（红/蓝，2+2）、摆放顺序（拖拽产生）。
- 禁止变量：珠子数量必须恰好 4 颗、颜色必须恰好 2 种各 2 颗——若不对称（如 3 红 1 蓝）则 `AABB` 签名不可达（多重集与目标签名的字母计数不匹配），违反 §8.1 create 行"非空解"要求；不得与 alternating×create@G2 共用 emoji 词汇（红🔴/蓝🔵 vs 上⬆️/下⬇️），避免孩子按字面而非结构完成任务。

## 3. 出题规则
- 目标签名：`AABB`（周期 4，两符号各连续两次），对应 L2 objective 里点名的 AABB 重复规律，与 `SPEC-repetition-match-k2.md` 的 AABB 配对样本呼应，但这里是"构造"而非"比较"。
- 元素：`items = [{id:'C0',token:'red',emoji:'🔴'}, {id:'C1',token:'red',emoji:'🔴'}, {id:'C2',token:'blue',emoji:'🔵'}, {id:'C3',token:'blue',emoji:'🔵'}]`。
- 可达性：4 个元素（2 红 2 蓝）共有 4!/(2!·2!) = 6 种不同的 token 排列，其中恰好 2 种（`RRBB`、`BBRR`）满足 `AABB` 签名——非空解、非全部满足，符合 §8.1 create 行的双重校验（test.html S14a 已验证 `matching=2 / distinct=6`）。

## 4. 选项规则（拖放活动，套用 §8.1 create 行，不适用"answer 在 options 内"）
- 元素总数 4，槽位总数 4，一一对应（复用 `SortRuntime` 的槽位交互）。
- 正确判定：最终摆放通过 `structureSignature()` 计算出的签名 === `AABB`，不要求逐位匹配某个"标准答案顺序"。
- error_type 映射（§8.3）：结果签名与目标签名不符 → `signature_mismatch`；一次成功 → `none`。

## 5. 验收样例
- 正例（视为通过）：`🔴🔴🔵🔵`（RRBB）、`🔵🔵🔴🔴`（BBRR）——两者签名均为 `AABB`，同样正确，无需区分反馈文案（§8.2 在 create 里的含义：没有"非最优可行解"）。
- 反例（拒绝）：`🔴🔵🔴🔵`（ABAB）、`🔴🔵🔵🔴`（ABBA）、`🔵🔴🔴🔵`（BAAB）、`🔵🔴🔵🔴`（BABA）——签名均不为 `AABB`，触发 `signature_mismatch`，允许纠正后重试（§8.5 反馈非惩罚原则）。

## 6. 上线检查
- 出题校验通过：元素数组长度、id 唯一性、token/emoji 字段齐全、同一 token 的 emoji 一致；目标签名可达性与非全达性交叉校验（枚举全部排列，用 `structureSignature()` 重新计算，不信任手写 `matching` 断言）。
- 渲染校验通过：`SortRuntime` 以 `variant.targetSignature` 模式渲染（不显示 `sort` 模式的"从短到长"箭头行），拖放交互与 comparison 既有 sort 样例复用同一 runtime，零代码改动。
- 统计校验通过：radar report 携带 `structure:"repetition"`、`carrier:"color"`、`taskType:"create"`、`activityMode:"create"`。
