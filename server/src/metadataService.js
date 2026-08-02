const fs = require("fs");
const path = require("path");

const METADATA_DIR = path.join(__dirname, "..", "..", "metadata");

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (!item || seen.has(item)) {
      continue;
    }
    seen.add(item);
    out.push(item);
  }
  return out;
}

function readJson(fileName) {
  const filePath = path.join(METADATA_DIR, fileName);
  const text = fs.readFileSync(filePath, "utf8");
  return JSON.parse(text);
}

function buildMetadataIndex() {
  const gameCatalog = readJson("game.json");
  const lessonCatalog = readJson("lesson.json");
  const videoCatalog = readJson("video.json");

  const games = safeArray(gameCatalog.games);
  const lessons = safeArray(lessonCatalog.lessons);
  const videos = safeArray(videoCatalog.videos);

  const gameMap = new Map(games.map((g) => [g.id, g]));
  const lessonMap = new Map(lessons.map((l) => [l.id, l]));
  const videoMap = new Map(videos.map((v) => [v.id, v]));

  const geneMap = new Map();
  function ensureGene(geneId) {
    if (!geneMap.has(geneId)) {
      geneMap.set(geneId, { games: new Set(), lessons: new Set(), videos: new Set() });
    }
    return geneMap.get(geneId);
  }

  for (const game of games) {
    for (const geneId of safeArray(game.rootGeneIds)) {
      const slot = ensureGene(geneId);
      slot.games.add(game.id);
      for (const lessonId of safeArray(game.lessonIds)) {
        slot.lessons.add(lessonId);
      }
      for (const videoId of safeArray(game.videoIds)) {
        slot.videos.add(videoId);
      }
    }
  }

  for (const lesson of lessons) {
    for (const geneId of safeArray(lesson.rootGeneIds)) {
      const slot = ensureGene(geneId);
      for (const gameId of safeArray(lesson.gameIds)) {
        slot.games.add(gameId);
      }
      slot.lessons.add(lesson.id);
      for (const videoId of safeArray(lesson.videoIds)) {
        slot.videos.add(videoId);
      }
    }
  }

  return {
    games,
    lessons,
    videos,
    gameMap,
    lessonMap,
    videoMap,
    geneMap,
  };
}

function toGameSummary(game) {
  if (!game) {
    return null;
  }
  return {
    id: game.id,
    series: game.series,
    module: game.module,
    shell: game.shell,
    titleZh: game.titleZh,
    titleEn: game.titleEn,
  };
}

function toLessonSummary(lesson) {
  if (!lesson) {
    return null;
  }
  return {
    id: lesson.id,
    series: lesson.series,
    module: lesson.module,
    difficulty: lesson.difficulty,
    titleZh: lesson.titleZh,
    titleEn: lesson.titleEn,
  };
}

function toVideoSummary(video) {
  if (!video) {
    return null;
  }
  return {
    id: video.id,
    titleZh: video.titleZh,
    titleEn: video.titleEn,
    url: video.url,
    tags: safeArray(video.tags),
  };
}

function getGeneTargets(index, geneId) {
  const slot = index.geneMap.get(geneId);
  if (!slot) {
    return {
      games: [],
      lessons: [],
      videos: [],
    };
  }

  const games = unique(Array.from(slot.games))
    .map((gameId) => toGameSummary(index.gameMap.get(gameId)))
    .filter(Boolean);

  const lessons = unique(Array.from(slot.lessons))
    .map((lessonId) => toLessonSummary(index.lessonMap.get(lessonId)))
    .filter(Boolean);

  const videos = unique(Array.from(slot.videos))
    .map((videoId) => toVideoSummary(index.videoMap.get(videoId)))
    .filter(Boolean);

  return {
    games,
    lessons,
    videos,
  };
}

function difficultyRank(label) {
  if (typeof label !== "string") {
    return Number.MAX_SAFE_INTEGER;
  }
  const m = /^L(\d+)$/i.exec(label.trim());
  if (!m) {
    return Number.MAX_SAFE_INTEGER;
  }
  return Number(m[1]);
}

function pickClosestDifficulty(available, targetDifficulty) {
  if (!available.length) {
    return null;
  }
  const targetRank = difficultyRank(targetDifficulty);
  const sorted = [...available].sort((a, b) => {
    const da = Math.abs(difficultyRank(a) - targetRank);
    const db = Math.abs(difficultyRank(b) - targetRank);
    return da - db || difficultyRank(a) - difficultyRank(b);
  });
  return sorted[0] || null;
}

function getAdaptiveTargets(index, geneId, targetDifficulty) {
  const base = getGeneTargets(index, geneId);
  if (!targetDifficulty) {
    return {
      ...base,
      resolvedDifficulty: null,
    };
  }

  const difficultySet = new Set(base.lessons.map((l) => l.difficulty).filter(Boolean));
  const resolvedDifficulty = pickClosestDifficulty(Array.from(difficultySet), targetDifficulty);
  if (!resolvedDifficulty) {
    return {
      ...base,
      resolvedDifficulty: null,
    };
  }

  const lessons = base.lessons.filter((l) => l.difficulty === resolvedDifficulty);
  const lessonIds = new Set(lessons.map((l) => l.id));

  const gameIdSet = new Set();
  const videoIdSet = new Set();
  for (const lesson of lessons) {
    const full = index.lessonMap.get(lesson.id);
    for (const gameId of safeArray(full && full.gameIds)) {
      gameIdSet.add(gameId);
    }
    for (const videoId of safeArray(full && full.videoIds)) {
      videoIdSet.add(videoId);
    }
  }

  const games = Array.from(gameIdSet)
    .map((gameId) => toGameSummary(index.gameMap.get(gameId)))
    .filter(Boolean);

  const videos = Array.from(videoIdSet)
    .map((videoId) => toVideoSummary(index.videoMap.get(videoId)))
    .filter(Boolean);

  return {
    games: games.length ? games : base.games,
    lessons,
    videos: videos.length ? videos : base.videos,
    resolvedDifficulty,
  };
}

module.exports = {
  buildMetadataIndex,
  getGeneTargets,
  getAdaptiveTargets,
};
