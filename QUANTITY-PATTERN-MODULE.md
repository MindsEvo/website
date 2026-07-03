# Quantity Pattern（数量规律）模块规范

## 版本

- v1.0.0 (2026-07-03)

## 1. 模块定位

Quantity Pattern 训练实物数量关系（Concrete Quantities）：

1. 关注有多少个物体。
2. 关注数量变化的节奏。
3. 不使用抽象数字逻辑。

## 2. 边界规则

1. Number Pattern 负责抽象数字逻辑，Quantity 不承接。
2. Quantity 题面、选项、提示、语音不出现阿拉伯数字。
3. Visual 模块不再承载数量递增题型。

## 3. v1 题型范围

1. increase_decrease（数量递增递减）
2. alternate（数量交替）
3. cycle（数量循环）

分组规律保留为有条件题型，待视觉分组边界验证通过后再并入。

## 4. 数据规范

```json
{
  "module": "quantity_pattern",
  "pattern_type": "increase_decrease",
  "level": 1,
  "correct": true,
  "time_ms": 4000,
  "error_type": "none"
}
```

error_type 推荐集合：

1. none
2. too_many
3. too_few
4. unchanged
5. pattern_misread
6. adjacent_item
7. cycle_misalign
8. group_count_wrong
9. no_grouping

## 5. 能力标签

统一归入：数量感知（quantity_sense）。

## 6. 说明

Explain 功能为跨模块统一能力，本模块不单独实现。
