# 题型规格单

- 模块：pattern（learning-math-pattern）
- 题型：alternating × match（G2，carrier=color+shape，runtime=match）
- 负责人：unassigned
- 版本：v1.0

## 三维定位（PATTERN-QUALITY-GATE.md §2.1）
1. structure：`alternating`
2. carrier：`color` + `shape`（跨载体——`taskTypes.match` 的定义本身就是"外观不同、结构相同"，两个载体都是 `pattern.json → carriers` 里 status=`active` 的条目）
3. task：`match`
4. 矩阵格：`{structure:"alternating", task:"match"}`，`levelFloor:"G2"`；本规格单声明等级 G2，等于该格的 levelFloor，合规。
5. 上报根基因：`RG.PATTERN.SEQUENCE.BASIC`（结构基因）+ `RG.PATTERN.VISUAL.COLOR`（颜色载体基因）+ `RG.PATTERN.VISUAL.SEQUENCE`（图形载体基因）——两个载体基因都上报，因为 match 任务比较的正是这两个载体各自的结构签名，规则同时落在两边。

## 1. 能力定义
- ability_tag：`pattern.alternating.match`
- 训练目标：识别两组外观不同（颜色 vs 图形）但结构相同的规律串，完成同构匹配（红蓝红蓝 ≡ 圆方圆方）。

## 2. 变量边界
- 允许变量：左侧 3 个颜色 emoji 序列、右侧 3 个图形 emoji 序列，各自对应一个结构签名（`ABAB` / `AABAAB` / `ABBABB`）。
- 禁止变量：数字载体（`taskMatrixExclusions` 已明确排除 `numerical × match`）；左右两侧不得共用同一 emoji 词汇，否则退化为字面匹配而非结构匹配。

## 3. 出题规则
- 序列长度：不适用单一续写序列——本题比较的是左右两组"结构签名"，每个左/右项本身是一个 4-6 元素的规律串。
- 规律模板：`ABAB`（周期 2）、`AABAAB`（周期 3，AAB）、`ABBABB`（周期 3，ABB）。
- 边界策略：3 个左项与 3 个右项的签名两两不同，保证一一对应、无歧义（§3.3 无歧义原则 + §8.1 match 行）。

## 4. 选项规则（拖放活动，套用 §8.1 match 行，不适用"answer 在 options 内"）
- 左右等量：3 对 3。
- 每个左项恰好一个正确目标（签名相同的右项），映射一对一。
- error_type 映射（§8.3）：配对到签名不同的右项 → `attr_confusion`；一次成功 → `none`。

## 5. 验收样例
- 正例：`🔴🔵🔴🔵`（ABAB）↔ `⚪🔷⚪🔷`（ABAB）为一对；`🔴🔴🔵🔴🔴🔵`（AABAAB）↔ 对应图形 AABAAB 为一对。
- 反例（拒绝）：任意两个左项（或两个右项）签名相同——违反 §8.1 一一对应要求，会导致多解。

## 6. 上线检查
- 出题校验通过：新增结构合法性检查——左右等量、每个左项签名在右侧恰好命中一次、无重复签名。
- 渲染校验通过：`MatchRuntime` 渲染 emoji 序列（新增 `.mr-seq` 样式），拖放交互与既有 size/home 匹配一致。
- 统计校验通过：radar report 携带 `structure:"alternating"`、`carriers:["color","shape"]`、`taskType:"match"`、`activityMode:"match"`。
