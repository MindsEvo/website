#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const metadataDir = join(root, 'metadata');

function fail(msg) {
  console.error('[metadata] ERROR:', msg);
}

function warn(msg) {
  console.warn('[metadata] WARN :', msg);
}

function info(msg) {
  console.log('[metadata] INFO :', msg);
}

function loadJson(fileName) {
  const file = join(metadataDir, fileName);
  if (!existsSync(file)) {
    throw new Error('Missing file: ' + file);
  }
  const raw = readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('Invalid JSON in ' + fileName + ': ' + err.message);
  }
}

function listGameIdsFromSource() {
  const targets = [join(root, 'games'), join(root, 'learning')];
  const ids = new Set();

  function walk(dir) {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const p = join(dir, entry);
      const st = statSync(p);
      if (st.isDirectory()) {
        walk(p);
        continue;
      }
      if (entry !== 'game.js') continue;
      const txt = readFileSync(p, 'utf8');
      const m = txt.match(/id\s*:\s*['\"]([^'\"]+)['\"]/);
      if (m && m[1]) ids.add(m[1]);
    }
  }

  for (const t of targets) walk(t);
  return ids;
}

function indexById(items, label, errors) {
  const map = new Map();
  for (const item of items) {
    if (!item || typeof item !== 'object') {
      errors.push(label + ' item must be an object');
      continue;
    }
    if (!item.id || typeof item.id !== 'string') {
      errors.push(label + ' item missing string id');
      continue;
    }
    if (map.has(item.id)) {
      errors.push('Duplicate ' + label + ' id: ' + item.id);
      continue;
    }
    map.set(item.id, item);
  }
  return map;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isValidRootGeneId(id) {
  return typeof id === 'string' && /^RG\.[A-Z0-9_]+(\.[A-Z0-9_]+)+$/.test(id);
}

function validate() {
  const errors = [];
  const warnings = [];

  const gameJson = loadJson('game.json');
  const lessonJson = loadJson('lesson.json');
  const videoJson = loadJson('video.json');

  const games = asArray(gameJson.games);
  const lessons = asArray(lessonJson.lessons);
  const videos = asArray(videoJson.videos);

  if (!Array.isArray(gameJson.games)) errors.push('game.json must contain games[]');
  if (!Array.isArray(lessonJson.lessons)) errors.push('lesson.json must contain lessons[]');
  if (!Array.isArray(videoJson.videos)) errors.push('video.json must contain videos[]');

  const gameMap = indexById(games, 'game', errors);
  const lessonMap = indexById(lessons, 'lesson', errors);
  const videoMap = indexById(videos, 'video', errors);

  for (const [gameId, game] of gameMap) {
    const rootGenes = asArray(game.rootGeneIds);
    if (rootGenes.length === 0) {
      warnings.push('game ' + gameId + ' has empty rootGeneIds');
    }
    for (const rg of rootGenes) {
      if (!isValidRootGeneId(rg)) {
        warnings.push('game ' + gameId + ' has non-standard RootGene id: ' + String(rg));
      }
    }

    for (const lessonId of asArray(game.lessonIds)) {
      if (!lessonMap.has(lessonId)) {
        errors.push('game ' + gameId + ' references missing lessonId: ' + lessonId);
      }
    }
    for (const videoId of asArray(game.videoIds)) {
      if (!videoMap.has(videoId)) {
        errors.push('game ' + gameId + ' references missing videoId: ' + videoId);
      }
    }
  }

  for (const [lessonId, lesson] of lessonMap) {
    const rootGenes = asArray(lesson.rootGeneIds);
    if (rootGenes.length === 0) {
      warnings.push('lesson ' + lessonId + ' has empty rootGeneIds');
    }
    for (const rg of rootGenes) {
      if (!isValidRootGeneId(rg)) {
        warnings.push('lesson ' + lessonId + ' has non-standard RootGene id: ' + String(rg));
      }
    }

    for (const gameId of asArray(lesson.gameIds)) {
      if (!gameMap.has(gameId)) {
        errors.push('lesson ' + lessonId + ' references missing gameId: ' + gameId);
      }
    }
    for (const videoId of asArray(lesson.videoIds)) {
      if (!videoMap.has(videoId)) {
        errors.push('lesson ' + lessonId + ' references missing videoId: ' + videoId);
      }
    }
  }

  for (const [videoId, video] of videoMap) {
    const hasUrl = typeof video.url === 'string' && video.url.length > 0;
    const hasUrls = video.urls && typeof video.urls === 'object';
    if (!hasUrl && !hasUrls) {
      warnings.push('video ' + videoId + ' has neither url nor urls');
    }

    for (const gameId of asArray(video.gameIds)) {
      if (!gameMap.has(gameId)) {
        errors.push('video ' + videoId + ' references missing gameId: ' + gameId);
      }
    }
    for (const lessonId of asArray(video.lessonIds)) {
      if (!lessonMap.has(lessonId)) {
        errors.push('video ' + videoId + ' references missing lessonId: ' + lessonId);
      }
    }
  }

  for (const [gameId, game] of gameMap) {
    for (const lessonId of asArray(game.lessonIds)) {
      const lesson = lessonMap.get(lessonId);
      if (!lesson) continue;
      if (!asArray(lesson.gameIds).includes(gameId)) {
        errors.push('Bidirectional mismatch: game ' + gameId + ' -> lesson ' + lessonId + ' missing reverse lesson.gameIds');
      }
    }
    for (const videoId of asArray(game.videoIds)) {
      const video = videoMap.get(videoId);
      if (!video) continue;
      if (!asArray(video.gameIds).includes(gameId)) {
        errors.push('Bidirectional mismatch: game ' + gameId + ' -> video ' + videoId + ' missing reverse video.gameIds');
      }
    }
  }

  for (const [lessonId, lesson] of lessonMap) {
    for (const videoId of asArray(lesson.videoIds)) {
      const video = videoMap.get(videoId);
      if (!video) continue;
      if (!asArray(video.lessonIds).includes(lessonId)) {
        errors.push('Bidirectional mismatch: lesson ' + lessonId + ' -> video ' + videoId + ' missing reverse video.lessonIds');
      }
    }
  }

  const sourceGameIds = listGameIdsFromSource();
  for (const gameId of gameMap.keys()) {
    if (!sourceGameIds.has(gameId)) {
      warnings.push('game metadata id not found in source game.js files: ' + gameId);
    }
  }

  info('games=' + gameMap.size + ', lessons=' + lessonMap.size + ', videos=' + videoMap.size);

  for (const w of warnings) warn(w);
  for (const e of errors) fail(e);

  if (errors.length > 0) {
    console.error('[metadata] FAILED with ' + errors.length + ' error(s)');
    process.exit(1);
  }

  console.log('[metadata] PASS');
}

try {
  validate();
} catch (err) {
  console.error('[metadata] FATAL:', err.message);
  process.exit(1);
}
