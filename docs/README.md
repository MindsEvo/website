# MindsEvo 文档总入口

本目录是 `web` 侧唯一权威规范入口。

## 先读顺序（建议）

0. `HANDOFF-NEXT-STEPS.md`（**当前状态与待办 —— 接手先读这篇**）
1. `MINDSEVO-ARCHITECTURE-ROADMAP.md`（总体架构与五阶段实施）
2. `shell/UNIFIED-GUI-FRAMEWORK.md`（阶段 1：统一 GUI 接口草案）
3. `shell/GAME-SHELL-CONVENTION.md`（游戏如何接入统一 Shell）
4. `shell/SHELL-FEATURE-GATE.md`（哪些能力可以上升为公共层）
5. `patterns/PATTERN-QUALITY-GATE.md`（Pattern 模块质量门禁）
6. `metadata/AI-METADATA-STANDARD.md`（阶段 5：标准元数据）
7. `metadata/METATHINKING-MODULE-STANDARD.md`（元思维模块机器可读标准）
8. `rootgene/ROOTGENE-FRAMEWORK.md`（**思维雷达坐标系 —— 双轴定稿**）
9. 对应模块规范（如 Spatial / Quantity / Comparison）

## 当前状态

1. `HANDOFF-NEXT-STEPS.md`（已落地内容、待办优先级、静默陷阱、跨平台一致性核实结论）

## 架构主文档

1. `MINDSEVO-ARCHITECTURE-ROADMAP.md`

## Shell 规范

1. `shell/UNIFIED-GUI-FRAMEWORK.md`
2. `shell/GAME-SHELL-CONVENTION.md`
3. `shell/SHELL-FEATURE-GATE.md`
4. `shell/GUI-MIGRATION-CHECKLIST.md`

## Pattern 规范

1. `patterns/PATTERN-QUALITY-GATE.md`
2. `patterns/SPATIAL-PATTERN-MODULE.md`
3. `patterns/QUANTITY-PATTERN-MODULE.md`

## 实现参考（Learning 系列样板）

1. `patterns/COMPARISON-PUZZLE-IMPLEMENTATION.md`（Cycle 调度 + 选择题样板）
2. `patterns/COMPARISON-INTERACTION-IMPLEMENTATION.md`（拖放活动样板）
3. `patterns/COMPARISON-MINIGAME-IMPLEMENTATION.md`（限时连续小游戏样板 + Adapter 框架）

> 新建 Learning 模块请以这三篇为蓝本：`engine.js` 跨学科共享，
> `templates.json` + `generator.js` 是每个模块的定制层。
> 三篇分别对应三种活动类型：一题一答 / 一次操作 / 一段限时连续场景。

## Metadata 规范

1. `metadata/AI-METADATA-STANDARD.md`
2. `metadata/METATHINKING-MODULE-STANDARD.md`

## RootGene 规范

1. `rootgene/ROOTGENE-FRAMEWORK.md`（v0.2.0：基因只表能力，深度轴用 `gradeCode`）

## 文档治理规则

1. `docs/` 为规范正文唯一位置。
2. 根目录不再保留重复规范文档。
3. 新规则必须标注版本、适用范围、回归要求。
4. 影响跨模块的改动，必须同时更新相关规范并记录变更点。
5. 改动落地后，把状态与新增待办同步进 `HANDOFF-NEXT-STEPS.md`，
   保证「接手先读这篇」始终成立。
