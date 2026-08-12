#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const metadataDir = join(root, 'metadata');
const mtDir = join(metadataDir, 'metathinking');

function fail(msg) {
  console.error('[metathinking] ERROR:', msg);
}

function warn(msg) {
  console.warn('[metathinking] WARN :', msg);
}

function info(msg) {
  console.log('[metathinking] INFO :', msg);
}

// Tracks files that carried a UTF-8 BOM so it is reported as a locatable error
// instead of aborting the whole run with an opaque JSON parse failure.
const bomFiles = [];

function loadJson(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) {
    bomFiles.push(filePath);
    return JSON.parse(raw.slice(1));
  }
  return JSON.parse(raw);
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

function requiredField(obj, field, file, errors) {
  if (!(field in obj)) {
    errors.push(file + ' missing required field: ' + field);
  }
}

function validateComparisonModule(module, fileName, gameIds, lessonIds, videoIds, errors, warnings) {
  const required = [
    'version', 'updatedAt', 'moduleType', 'id', 'canonicalUrl', 'title', 'description',
    'ageRange', 'educationReference', 'rootGeneIds', 'difficultyAxes', 'typeTree',
    'levelMap', 'prerequisites', 'videos', 'exercises', 'statistics', 'aiQueryHints', 'tags'
  ];
  required.forEach(function (field) { requiredField(module, field, fileName, errors); });

  const levels = asArray(module.levelMap).map(function (x) { return x && x.levelId; });
  const uniq = new Set(levels);
  const expected = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'];
  expected.forEach(function (levelId) {
    if (!uniq.has(levelId)) errors.push(fileName + ' levelMap missing ' + levelId);
  });
  if (uniq.size !== levels.length) {
    errors.push(fileName + ' levelMap has duplicate levelId entries');
  }

  // Implementation cross-reference (see METATHINKING-MODULE-STANDARD.md §5a).
  // A level that claims to be playable must name the in-game level and modes
  // behind it; a partial level must state what is missing.
  const allowedStatus = ['implemented', 'partial', 'planned'];
  asArray(module.levelMap).forEach(function (lvl) {
    if (!lvl || typeof lvl !== 'object') return;
    const at = fileName + ' levelMap[' + (lvl.levelId || '?') + ']';
    if (allowedStatus.indexOf(lvl.status) < 0) {
      errors.push(at + ' has invalid status: ' + String(lvl.status) +
                  ' (expected implemented | partial | planned)');
      return;
    }
    if (lvl.status === 'planned') {
      if ('gradeCode' in lvl || 'implementedModes' in lvl) {
        errors.push(at + ' is planned but declares gradeCode/implementedModes');
      }
      return;
    }
    if (!lvl.gradeCode)        errors.push(at + ' is ' + lvl.status + ' but has no gradeCode');
    if (!asArray(lvl.implementedModes).length)
      errors.push(at + ' is ' + lvl.status + ' but has no implementedModes[]');
    if (lvl.status === 'partial' && !(lvl.coverageGapZh && lvl.coverageGapEn))
      errors.push(at + ' is partial but has no coverageGapZh/coverageGapEn');
  });

  asArray(module.rootGeneIds).forEach(function (rg) {
    if (typeof rg !== 'string' || !/^RG\.[A-Z0-9_]+(\.[A-Z0-9_]+)+$/.test(rg)) {
      warnings.push(fileName + ' has non-standard RootGene id: ' + String(rg));
    }
  });

  asArray(module.videos).forEach(function (video) {
    if (!video || typeof video !== 'object') return;
    if (video.id && !videoIds.has(video.id) && video.status === 'implemented') {
      errors.push(fileName + ' references missing implemented video id: ' + video.id);
    }
    asArray(video.linkedGameIds).forEach(function (id) {
      if (!gameIds.has(id)) errors.push(fileName + ' video.linkedGameIds missing in game.json: ' + id);
    });
    asArray(video.linkedLessonIds).forEach(function (id) {
      if (!lessonIds.has(id)) errors.push(fileName + ' video.linkedLessonIds missing in lesson.json: ' + id);
    });
  });

  asArray(module.exercises).forEach(function (ex) {
    if (!ex || typeof ex !== 'object') return;
    asArray(ex.sourceGameIds).forEach(function (id) {
      if (!gameIds.has(id)) errors.push(fileName + ' exercise.sourceGameIds missing in game.json: ' + id);
    });
    asArray(ex.sourceLessonIds).forEach(function (id) {
      if (!lessonIds.has(id)) errors.push(fileName + ' exercise.sourceLessonIds missing in lesson.json: ' + id);
    });
    asArray(ex.sourceLevelIds).forEach(function (id) {
      if (expected.indexOf(id) < 0) errors.push(fileName + ' exercise.sourceLevelIds invalid level id: ' + id);
    });
  });
}

function validate() {
  const errors = [];
  const warnings = [];

  if (!existsSync(mtDir)) {
    throw new Error('Missing metathinking directory: ' + mtDir);
  }

  const gameJson = loadJson(join(metadataDir, 'game.json'));
  const lessonJson = loadJson(join(metadataDir, 'lesson.json'));
  const videoJson = loadJson(join(metadataDir, 'video.json'));

  const gameIds = new Set(asArray(gameJson.games).map(function (x) { return x && x.id; }).filter(Boolean));
  const lessonIds = new Set(asArray(lessonJson.lessons).map(function (x) { return x && x.id; }).filter(Boolean));
  const videoIds = new Set(asArray(videoJson.videos).map(function (x) { return x && x.id; }).filter(Boolean));

  const indexPath = join(mtDir, 'index.json');
  if (!existsSync(indexPath)) {
    errors.push('Missing metadata/metathinking/index.json');
  }

  const files = readdirSync(mtDir).filter(function (f) { return f.endsWith('.json'); });
  info('module files=' + files.length);

  files.forEach(function (file) {
    const abs = join(mtDir, file);
    let doc;
    try {
      doc = loadJson(abs);
    } catch (e) {
      errors.push(file + ' invalid JSON: ' + e.message);
      return;
    }

    if (file === 'index.json') {
      if (!Array.isArray(doc.modules)) {
        errors.push('index.json must contain modules[]');
      }
      return;
    }

    validateComparisonModule(doc, file, gameIds, lessonIds, videoIds, errors, warnings);
  });

  warnings.forEach(warn);
  bomFiles.forEach(function (f) {
    fail(f + ' starts with a UTF-8 BOM — strip it, JSON must not carry one');
  });
  errors.forEach(fail);

  if (errors.length > 0 || bomFiles.length > 0) {
    console.error('[metathinking] FAILED with ' + (errors.length + bomFiles.length) + ' error(s)');
    process.exit(1);
  }

  console.log('[metathinking] PASS');
}

try {
  validate();
} catch (err) {
  console.error('[metathinking] FATAL:', err.message);
  process.exit(1);
}
