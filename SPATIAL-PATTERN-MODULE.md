# Spatial Pattern（空间关系规律）模块规范

## 版本

- v1.0.0 (2026-07-03)

## 1. 模块定位

Spatial Pattern 训练的是空间关系（Spatial Relationship）：

1. 物体之间的相对位置关系。
2. 多格构型的整体对称/交换/旋转关系。

不训练轨迹推进，不训练单符号朝向旋转。

## 2. 边界裁定规则

唯一裁定规则：

1. 依赖方向 + 步长的连续移动，归 Motion Pattern。
2. 依赖单符号朝向旋转（如 ↑→↓←），归 Visual Pattern。
3. 依赖整体构型关系（交换/整体旋转），归 Spatial Pattern。

## 3. v1 实现范围

1. position_swap（左右/上下位置交换）
2. shape_rotation（3x3 网格内整体旋转）

暂缓：镜像、中心对称。

## 4. 视觉规范

1. Spatial 专属 3x3 网格作为核心载体。
2. 四选项均展示完整 3x3 状态。
3. 网格样式在序列区和选项区保持一致。
4. Motion 模块不复用该网格样式，保持视觉锚点独占。

## 5. 数据字段

单题核心字段：

```json
{
  "module": "spatial_pattern",
  "pattern_type": "position_swap",
  "level": 1,
  "correct": true,
  "time_ms": 5000,
  "error_type": "none"
}
```

error_type 集合：

1. none
2. order_unchanged
3. position_wrong
4. irrelevant_object
5. wrong_direction
6. wrong_angle
7. wrong_shape

## 6. 能力标签

统一归入：空间关系感知（spatial_relationship）。

## 7. 说明

Explain 功能为跨模块通用能力，本模块不单独实现。
