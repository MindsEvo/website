# RootGene Framework 标准（阶段 3）

## 版本

- draft v0.1.0 (2026-08-02)
- 适用范围：Learning、MindSeeds

## 1. 目标

通过统一 RootGene 标签，把每次练习结果映射到可统计、可推荐的元思维维度。

## 2. 接口约定

每个 Shell 游戏推荐实现：

```javascript
registerRootGenes(ctx) => string[]
```

其中 `ctx` 结构：

1. shell: `shell-1`（统一入口）
2. gameId: 当前游戏 ID
3. unit: 当前单元对象
4. state:
- score
- total
- hints
- passed
- elapsedMs

## 3. 写入时机

1. 在单元结算时由 Shell 自动调用 `registerRootGenes(ctx)`。
2. 结果写入 `shell.report()` 的 `geneIds` 字段。

## 4. 回退策略

1. 如果游戏未实现 `registerRootGenes`，Shell 可回退到 `rootGeneIds` 静态字段（可选）。
2. 如果两者都没有，则本次报告 `geneIds` 为空数组。

## 5. 命名建议

建议使用层级式命名，便于后续聚合：

1. `RG.PATTERN.SEQUENCE.BASIC`
2. `RG.LEARNING.MATH.PATTERN.U1`
3. `RG.MINDSEEDS.NUMBER_PATTERN.U3`

## 6. 接入状态

当前已覆盖：

1. Learning（math）：logic、modeling、pattern、strategy
2. MindSeeds：number、color、visual、motion、temporal、size、spatial、quantity、logic、mixed

## 7. 验收检查

1. 结算后历史 report 含 `geneIds` 字段。
2. `geneIds` 为去重后的字符串数组。
3. 游戏异常不应导致主流程中断（Shell 捕获 `registerRootGenes` 异常并降级）。
