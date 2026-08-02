# MindsEvo 文档总入口

本目录是 `web` 侧唯一权威规范入口。

## 先读顺序（建议）

1. `MINDSEVO-ARCHITECTURE-ROADMAP.md`（总体架构与五阶段实施）
2. `shell/UNIFIED-GUI-FRAMEWORK.md`（阶段 1：统一 GUI 接口草案）
3. `shell/GAME-SHELL-CONVENTION.md`（游戏如何接入统一 Shell）
4. `shell/SHELL-FEATURE-GATE.md`（哪些能力可以上升为公共层）
5. `patterns/PATTERN-QUALITY-GATE.md`（Pattern 模块质量门禁）
6. 对应模块规范（如 Spatial / Quantity）

## 架构主文档

1. `MINDSEVO-ARCHITECTURE-ROADMAP.md`

## Shell 规范

1. `shell/UNIFIED-GUI-FRAMEWORK.md`
2. `shell/GAME-SHELL-CONVENTION.md`
3. `shell/SHELL-FEATURE-GATE.md`

## Pattern 规范

1. `patterns/PATTERN-QUALITY-GATE.md`
2. `patterns/SPATIAL-PATTERN-MODULE.md`
3. `patterns/QUANTITY-PATTERN-MODULE.md`

## 文档治理规则

1. `docs/` 为规范正文唯一位置。
2. 根目录不再保留重复规范文档。
3. 新规则必须标注版本、适用范围、回归要求。
4. 影响跨模块的改动，必须同时更新相关规范并记录变更点。
