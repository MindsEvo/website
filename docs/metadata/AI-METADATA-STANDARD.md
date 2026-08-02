# AI Metadata 标准（game.json / lesson.json / video.json）

## 版本

- draft v0.1.0 (2026-08-02)
- 适用范围：Learning、Mind Seeds、Creative Workshop

## 1. 目标

统一机器可读元数据，支持：

1. 跨游戏检索
2. 根基因映射
3. 视频联动
4. 推荐与统计

## 2. 文件位置

1. game 元数据：metadata/game.json
2. lesson 元数据：metadata/lesson.json
3. video 元数据：metadata/video.json

## 3. 最小字段规范

### 3.1 game.json

每个游戏对象最小字段：

1. id
2. series
3. module
4. shell
5. titleZh
6. titleEn
7. rootGeneIds
8. lessonIds
9. videoIds

### 3.2 lesson.json

每个课程对象最小字段：

1. id
2. series
3. module
4. difficulty
5. titleZh
6. titleEn
7. objectiveZh
8. objectiveEn
9. rootGeneIds
10. gameIds
11. videoIds

### 3.3 video.json

每个视频对象最小字段：

1. id
2. titleZh
3. titleEn
4. url（或 urls）
5. gameIds
6. lessonIds

说明：

1. 单一链接可使用 url。
2. 多语言链接可使用 urls 对象：`{ zh, en, default }`。

## 4. Shell 接入约定

当前 Shell 已支持：

1. `shell.registerVideoCatalog(catalog)`
2. `shell.loadVideoCatalog(url)`
3. `shell.resolveVideo(videoId, lang)`

建议在入口页初始化：

```javascript
shell.loadVideoCatalog('/metadata/video.json').catch(function (err) {
  console.warn('video catalog load failed', err);
});
```

游戏配置中使用：

```javascript
gui: {
  video: {
    enabled: true,
    videoId: 'learning-math-pattern-intro-001'
  }
}
```

解析优先级：

1. `gui.video.url`
2. `video.json` 解析结果（`videoId -> url`）
3. 若仍无 URL，显示占位提示

## 5. 关联一致性规则

1. `game.videoIds` 中的每个 id 必须存在于 `video.json`。
2. `lesson.gameIds` 中的每个 id 必须存在于 `game.json`。
3. `video.lessonIds` 与 `lesson.videoIds` 应双向可追踪。

## 6. 校验脚本

新增校验工具：

1. `tools/validate-metadata.mjs`

执行方式（在 `web` 目录）：

```bash
node tools/validate-metadata.mjs
```

当前检查内容：

1. `game/lesson/video` 的 id 唯一性。
2. 引用目标存在性（如 `game.videoIds` 引用的视频必须存在）。
3. 双向一致性（如 `game -> lesson` 必须有 `lesson -> game` 回链）。
4. 视频 URL 字段完整性（无 URL 记为 warning）。
5. `game.json` 中的游戏 id 是否能在源码 `game.js` 中找到（warning）。
6. `game/lesson` 的 `rootGeneIds` 非空检查（warning）。
7. RootGene 命名规范检查（warning，建议格式 `RG.SCOPE.CATEGORY.NODE`）。

## 7. 后续演进

1. 增加 `localeAssets` 支持多语言封面、字幕。
2. 增加 `prerequisites` 支持学习路径依赖。
3. 增加 `difficultyScore` 支持推荐排序。
