/**
 * metadata/validate.js — static metadata ↔ code cross-checker (v1.2.0)
 *
 * Why this page exists
 * --------------------
 * `difficultyAxes` / `levelMap` / `typeTree` in metadata/metathinking/*.json are
 * read by NO runtime JS today. So a module can ship a value that is outside the
 * declared vocabulary, or claim a level that metadata calls "planned", and
 * nothing complains. This page collides both sides once, on demand, in the
 * browser — no build step, no node.
 *
 * Severities
 *   FAIL  a contradiction: one of the two sides is wrong and must be edited.
 *   WARN  a dead metadata entry, or "cannot verify" on an `active` module.
 *   INFO  legal but worth a human look (unregistered gene id, code richer than
 *         the metadata's "primary" claim, planned entries not wired yet,
 *         "cannot verify" on an `in-progress` module).
 *
 * How the code side is read
 * -------------------------
 * `LEVEL_GRADE`, the axis base table and `<MODULE>_TYPE_OF` are private
 * variables inside game.js's IIFE, and game.js self-boots on load, so we cannot
 * import them. This page fetches game.js AS TEXT, strips comments, and slices
 * the object literals out with a brace matcher. That is deliberately fragile in
 * ONE direction only: if an extractor finds nothing it reports "cannot verify",
 * never a silent pass.
 *
 * The type-map name is derived from the module id, not configured:
 * `comparison` → `COMPARISON_TYPE_OF`, `pattern` → `PATTERN_TYPE_OF`. A new
 * module that follows the convention needs no edit here.
 *
 * "Cannot verify" is WARN for a module the catalog calls `active`, and INFO for
 * one it calls `in-progress` — see `Suite.prototype.cv`. The honesty rule is
 * unchanged: an extractor that finds nothing NEVER passes.
 *
 * When a module later exports its contract explicitly — e.g.
 * `window.CMP_CONTRACT = { LEVEL_GRADE, AXIS_BASE, TYPE_OF }` — delete the text
 * extractor for that module and read the export instead.
 *
 * v1.2.0 adds S7: the structure × task allowlist matrix (pattern's three-
 * dimension model). See suiteMatrix for why a matrix exists at all.
 */
(function (global) {
  "use strict";

  var VERSION = "1.2.0";
  var BASE = "../";

  // Mode vocabularies overlap but are NOT the same list:
  //   metadata implementedModes : puzzle | sort | match | group | fit | mini
  //   templates.json  mode      : puzzle | sort | match | group | fit | mini_game
  //   record activityRuntime    : puzzle | interaction | mini
  // The only legitimate alias is mini_game === mini. Anything else is a FAIL.
  var MODE_ALIAS = { mini_game: "mini" };

  var GENE_ID_RE = /^RG\.[A-Z0-9_]+\.[A-Z0-9_]+\.[A-Z0-9_]+$/;
  var GENE_SCAN_RE = /RG\.[A-Z0-9_]+(?:\.[A-Z0-9_]+)+/g;

  // Files scanned for RG.* ids, relative to a game's declared path.
  var CODE_FILES = ["game.js", "generator.js", "data.js"];

  // ── tiny report model ──────────────────────────────────────────────────────

  var counts = { ok: 0, fail: 0, warn: 0, info: 0 };
  var host = null;

  function Suite(id, titleZh, titleEn) {
    this.id = id;
    this.el = document.createElement("section");
    this.el.className = "suite";
    var h = document.createElement("div");
    h.className = "suite-title";
    h.textContent = id + " · " + titleZh + " / " + titleEn;
    this.el.appendChild(h);
    this.body = document.createElement("div");
    this.body.className = "suite-body";
    this.el.appendChild(this.body);
    host.appendChild(this.el);
  }

  Suite.prototype._line = function (level, text, detail) {
    var row = document.createElement("div");
    row.className = "line " + level;
    var tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = level === "pass" ? "OK  " : level.toUpperCase().slice(0, 4);
    row.appendChild(tag);
    var msg = document.createElement("span");
    msg.className = "msg";
    msg.textContent = text;
    row.appendChild(msg);
    if (detail) {
      var d = document.createElement("div");
      d.className = "detail";
      d.textContent = detail;
      row.appendChild(d);
    }
    this.body.appendChild(row);
    return row;
  };

  Suite.prototype.pass = function (t, d) { counts.ok++;   return this._line("pass", t, d); };
  Suite.prototype.fail = function (t, d) { counts.fail++; return this._line("fail", t, d); };
  Suite.prototype.warn = function (t, d) { counts.warn++; return this._line("warn", t, d); };
  Suite.prototype.info = function (t, d) { counts.info++; return this._line("info", t, d); };
  Suite.prototype.stat = function (t) { return this._line("stat", t); };

  /**
   * "cannot verify" for a module suite.
   *
   * The honesty rule stays: an extractor that finds nothing NEVER passes. But a
   * module whose index.json entry says `in-progress` is telling us up front that
   * it is not fully built yet, so a missing declaration is expected news, not a
   * warning to chase — same treatment game.json's `status: "planned"` already
   * gets in S1. Only `active` modules raise WARN here.
   *
   * The note says "声明未齐" rather than "运行时尚未接线": `in-progress` covers
   * both a module with no runtime at all and one like `pattern`, whose puzzle
   * runtime ships and reports to the radar while its templates.json and
   * generator do not exist yet. Which of the two it is belongs in that module's
   * own statusNote, not in a line the validator prints for every module.
   */
  Suite.prototype.cv = function (mod, t, d) {
    if (mod && mod.status === "in-progress") {
      return this.info(t + " · 模块 status=in-progress，声明未齐属预期", d);
    }
    return this.warn(t, d);
  };

  // ── fetch helpers ──────────────────────────────────────────────────────────

  function fetchJson(rel) {
    return fetch(BASE + rel, { cache: "no-store" }).then(function (res) {
      if (!res.ok) { throw new Error(rel + " → HTTP " + res.status); }
      return res.text();
    }).then(function (text) {
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error(rel + " → invalid JSON: " + e.message);
      }
    });
  }

  function fetchTextOrNull(rel) {
    return fetch(BASE + rel, { cache: "no-store" }).then(function (res) {
      return res.ok ? res.text() : null;
    }).catch(function () { return null; });
  }

  function fetchExists(rel) {
    return fetch(BASE + rel, { cache: "no-store" }).then(function (res) {
      return !!res.ok;
    }).catch(function () { return false; });
  }

  // ── source-text extractors ─────────────────────────────────────────────────

  /**
   * Remove // and /* *\/ comments, honouring ' " ` strings and escapes.
   * Regex literals containing quotes could confuse this, but none of the
   * declarations we slice live inside one — and stripping matters because
   * doc comments in radar-reader.js contain placeholder ids like RG.X.Y.Z.
   */
  function stripComments(src) {
    var out = "", i = 0, n = src.length;
    while (i < n) {
      var c = src.charAt(i);
      if (c === '"' || c === "'" || c === "`") {
        out += c;
        i++;
        while (i < n) {
          var d = src.charAt(i);
          if (d === "\\") { out += d + src.charAt(i + 1); i += 2; continue; }
          out += d;
          i++;
          if (d === c) { break; }
        }
        continue;
      }
      if (c === "/" && src.charAt(i + 1) === "/") {
        while (i < n && src.charAt(i) !== "\n") { i++; }
        continue;
      }
      if (c === "/" && src.charAt(i + 1) === "*") {
        i += 2;
        while (i < n && !(src.charAt(i) === "*" && src.charAt(i + 1) === "/")) { i++; }
        i += 2;
        continue;
      }
      out += c;
      i++;
    }
    return out;
  }

  /** Slice the balanced { … } block whose opening brace is at or after `from`. */
  function sliceBlock(src, from) {
    var open = src.indexOf("{", from);
    if (open < 0) { return null; }
    var depth = 0, i = open, n = src.length;
    while (i < n) {
      var c = src.charAt(i);
      if (c === '"' || c === "'" || c === "`") {
        var q = c;
        i++;
        while (i < n) {
          var d = src.charAt(i);
          if (d === "\\") { i += 2; continue; }
          i++;
          if (d === q) { break; }
        }
        continue;
      }
      if (c === "{") { depth++; }
      else if (c === "}") {
        depth--;
        if (depth === 0) { return { body: src.slice(open + 1, i), end: i + 1 }; }
      }
      i++;
    }
    return null;
  }

  /** key: 'value' pairs at any depth of the given text (flat objects only). */
  function flatStringMap(text) {
    var out = {}, re = /(['"]?)([A-Za-z_$][\w$]*)\1\s*:\s*(['"])([^'"]*)\3/g, m;
    while ((m = re.exec(text))) { out[m[2]] = m[4]; }
    return out;
  }

  /** key: { … } blocks → { key: flatStringMap(block) }. */
  function nestedStringMap(text) {
    var out = {}, re = /(['"]?)([A-Za-z_$][\w$]*)\1\s*:\s*\{/g, m;
    while ((m = re.exec(text))) {
      var block = sliceBlock(text, m.index + m[0].length - 1);
      if (!block) { break; }
      out[m[2]] = flatStringMap(block.body);
      re.lastIndex = block.end;
    }
    return out;
  }

  /** Slice `var NAME = { … }` (or `NAME = { … }`) out of stripped source. */
  function declBlock(src, name) {
    var re = new RegExp("(?:var|let|const)?\\s*" + name + "\\s*=\\s*\\{");
    var m = re.exec(src);
    if (!m) { return null; }
    return sliceBlock(src, m.index + m[0].length - 1);
  }

  /**
   * `axis.<key> = <expr>;` refinements after the base table.
   * `=(?!=)` so that `axis.relation_complexity === 'direct'` inside an `if`
   * is not harvested as an assignment; for a ternary only the branches
   * (everything after the first `?`) can be values.
   */
  function axisRefinements(src) {
    var out = {}, re = /axis\.([A-Za-z_$][\w$]*)\s*=(?!=)\s*([^;]+);/g, m;
    while ((m = re.exec(src))) {
      var key = m[1];
      var expr = m[2];
      var q = expr.indexOf("?");
      if (q >= 0) { expr = expr.slice(q + 1); }
      var vals = expr.match(/(['"])([^'"]*)\1/g) || [];
      out[key] = (out[key] || []).concat(vals.map(function (v) { return v.slice(1, -1); }));
    }
    return out;
  }

  function geneIdsIn(src) {
    return unique(stripComments(src).match(GENE_SCAN_RE) || []);
  }

  // ── misc helpers ───────────────────────────────────────────────────────────

  function unique(list) {
    var seen = {}, out = [];
    (list || []).forEach(function (x) {
      if (x && !seen[x]) { seen[x] = 1; out.push(x); }
    });
    return out;
  }

  function arr(v) { return Array.isArray(v) ? v : []; }
  function join(list) { return list.join(", "); }
  function statusOf(entry, dflt) {
    return (entry && typeof entry.status === "string") ? entry.status : dflt;
  }
  function normMode(mode) {
    return MODE_ALIAS[mode] || mode;
  }
  function diff(a, b) {
    var set = {};
    b.forEach(function (x) { set[x] = 1; });
    return a.filter(function (x) { return !set[x]; });
  }

  // ── S1 · rootgene registry ↔ code ↔ game.json ──────────────────────────────

  function suiteGenes(data) {
    var s = new Suite("S1", "根基因登记表 ↔ 代码 ↔ game.json", "RootGene registry vs code vs catalog");
    var registry = data.rootgene.genes || {};
    var registryIds = Object.keys(registry);
    var usedByCode = {};   // geneId → [gameId]
    var declared = {};     // geneId → [gameId]

    s.stat("登记 " + registryIds.length + " 个基因 · 校验 " + data.game.games.length + " 个游戏条目");

    // naming shape, registry side
    var badName = registryIds.filter(function (id) { return !GENE_ID_RE.test(id); });
    if (badName.length) {
      s.fail("登记表里有 " + badName.length + " 个 id 不符合 RG.SCOPE.CATEGORY.NODE", join(badName));
    } else {
      s.pass("登记表 id 全部符合 RG.SCOPE.CATEGORY.NODE");
    }

    // category references
    var catIds = {};
    arr(data.rootgene.categories).forEach(function (c) { catIds[c.id] = 1; });
    var badCat = registryIds.filter(function (id) { return !catIds[registry[id].category]; });
    if (badCat.length) {
      s.fail("有基因引用了未登记的 category", badCat.map(function (id) {
        return id + " → " + registry[id].category;
      }).join(" · "));
    } else {
      s.pass("每个基因的 category 都在 categories 列表里");
    }

    data.game.games.forEach(function (g) {
      var planned = statusOf(g, "implemented") === "planned";
      var files = data.code[g.id] || {};
      var loaded = Object.keys(files);
      var found = [];
      loaded.forEach(function (f) { found = found.concat(geneIdsIn(files[f])); });
      found = unique(found);

      arr(g.rootGeneIds).forEach(function (id) {
        declared[id] = (declared[id] || []).concat(g.id);
      });
      found.forEach(function (id) {
        usedByCode[id] = (usedByCode[id] || []).concat(g.id);
      });

      if (!loaded.length) {
        s.warn(g.id + "：读不到任何代码文件，无法核对（cannot verify）", "tried " + g.path + "{" + join(CODE_FILES) + "}");
        return;
      }

      var missingInCode = diff(arr(g.rootGeneIds), found);
      var extraInCode = diff(found, arr(g.rootGeneIds));

      if (!missingInCode.length && !extraInCode.length) {
        s.pass(g.id + "：声明与代码一致（" + (arr(g.rootGeneIds).length || 0) + " 个基因）");
      }
      if (missingInCode.length) {
        if (planned) {
          s.info(g.id + "：status=planned，代码尚未上报 " + missingInCode.length + " 个基因", join(missingInCode));
        } else {
          s.fail(g.id + "：game.json 声明了代码里找不到的基因", join(missingInCode));
        }
      }
      if (extraInCode.length) {
        s.warn(g.id + "：代码上报了 game.json 未声明的基因", join(extraInCode));
      }
      if (planned) {
        var idWired = loaded.some(function (f) { return files[f].indexOf(g.id) >= 0; });
        if (!idWired) {
          s.info(g.id + "：代码里还没有出现这个 gameId，接入时需要统一", g.path);
        }
      }
    });

    // ids used anywhere but not registered → INFO (reader derives a label)
    var usedIds = unique(Object.keys(usedByCode).concat(Object.keys(declared)));
    var unregistered = usedIds.filter(function (id) { return !registry[id]; });
    if (unregistered.length) {
      s.info("有 " + unregistered.length + " 个基因 id 未登记（合法：reader 会从 id 推导标签）", join(unregistered));
    } else {
      s.pass("代码与 game.json 用到的基因 id 全部已登记");
    }

    var badUsedName = usedIds.filter(function (id) { return !GENE_ID_RE.test(id); });
    if (badUsedName.length) {
      s.fail("代码/game.json 里有 id 不符合命名规范", join(badUsedName));
    }

    // registered but never used → dead entry (WARN), unless status=planned (INFO)
    var dead = registryIds.filter(function (id) { return !usedByCode[id] && !declared[id]; });
    var deadPlanned = dead.filter(function (id) { return statusOf(registry[id], "active") === "planned"; });
    var deadActive = diff(dead, deadPlanned);
    if (deadActive.length) {
      s.warn("登记表里有 " + deadActive.length + " 个死条目（无人声明、无代码上报）", join(deadActive));
    } else {
      s.pass("登记表没有死条目");
    }
    if (deadPlanned.length) {
      // Dead AND planned: nobody declares it and no code reports it. That is the
      // normal state of a gene minted ahead of the content it will label, so it
      // is INFO — but do not claim game.json has claimed it, because a claimed
      // gene is not dead and would have gone to `claimedOnly` below instead.
      s.info("有 " + deadPlanned.length + " 个基因已登记但还没有任何模块认领（status=planned，属预期）", join(deadPlanned));
    }

    var claimedOnly = registryIds.filter(function (id) {
      return declared[id] && !usedByCode[id] && statusOf(registry[id], "active") !== "planned";
    });
    if (claimedOnly.length) {
      s.info("有 " + claimedOnly.length + " 个基因只在 game.json 出现，代码从未上报", join(claimedOnly));
    }
  }

  // ── S2 · levelMap ↔ code LEVEL_GRADE ───────────────────────────────────────

  function suiteLevels(data, mod) {
    var s = new Suite("S2", mod.id + " · levelMap ↔ 代码 LEVEL_GRADE", "level and gradeCode agreement");
    var gradeCodes = (global.RadarReader && global.RadarReader.GRADE_CODES) || null;
    if (!gradeCodes) {
      s.warn("RadarReader 未加载，gradeCode 合法性无法核对（cannot verify）");
    } else {
      s.stat("GRADE_CODES = " + join(gradeCodes) + "（来自 radar-reader.js）");
    }

    var rows = arr(mod.json.levelMap);
    var live = rows.filter(function (r) {
      return r.status === "implemented" || r.status === "partial";
    });
    s.stat("levelMap " + rows.length + " 行 · implemented/partial " + live.length + " 行");

    if (gradeCodes) {
      var bad = rows.filter(function (r) { return gradeCodes.indexOf(r.gradeCode) < 0; });
      if (bad.length) {
        s.fail("有 levelMap 行的 gradeCode 不在 GRADE_CODES 里", bad.map(function (r) {
          return r.levelId + " → " + r.gradeCode;
        }).join(" · "));
      } else {
        s.pass("levelMap 每行的 gradeCode 都在 GRADE_CODES 里");
      }
    }

    if (!mod.source) {
      s.cv(mod, mod.id + "：读不到 game.js，LEVEL_GRADE 无法核对（cannot verify）", mod.path + "game.js");
      return;
    }
    var block = declBlock(mod.source, "LEVEL_GRADE");
    if (!block) {
      s.cv(mod, "在 game.js 里找不到 LEVEL_GRADE 声明，无法核对（cannot verify）",
        "extractor: /(var|let|const)? LEVEL_GRADE = {…}/");
      return;
    }
    var levelGrade = flatStringMap(block.body);
    var codeLevels = Object.keys(levelGrade);
    s.stat("代码 LEVEL_GRADE = " + codeLevels.map(function (k) {
      return k + "→" + levelGrade[k];
    }).join(" · "));

    // code side: every key must be a gradeCode that metadata declares live
    var metaByGrade = {};
    live.forEach(function (r) { metaByGrade[r.gradeCode] = r; });

    codeLevels.forEach(function (key) {
      var row = metaByGrade[key];
      if (!row) {
        var anyRow = rows.filter(function (r) { return r.gradeCode === key; })[0];
        if (anyRow) {
          s.fail("代码上线了 " + key + "，但 levelMap " + anyRow.levelId + " 的 status=" + anyRow.status,
            "把 status 改成 implemented/partial，或从代码里撤掉这一级");
        } else {
          s.fail("代码上线了 " + key + "，levelMap 里没有对应的 gradeCode");
        }
        return;
      }
      if (levelGrade[key] !== row.gradeCode) {
        s.fail("LEVEL_GRADE['" + key + "'] = '" + levelGrade[key] + "'，与 " + row.levelId +
          " 的 gradeCode '" + row.gradeCode + "' 不一致");
      } else {
        s.pass(row.levelId + "/" + row.gradeCode + "：代码与 levelMap 一致（status=" + row.status + "）");
      }
    });

    var missingInCode = live.filter(function (r) { return codeLevels.indexOf(r.gradeCode) < 0; });
    if (missingInCode.length) {
      s.fail("levelMap 声明已上线、但代码 LEVEL_GRADE 里没有的等级", missingInCode.map(function (r) {
        return r.levelId + "/" + r.gradeCode + "(" + r.status + ")";
      }).join(" · "));
    } else {
      s.pass("levelMap 声明已上线的等级，代码全部覆盖");
    }
    mod.levelGrade = levelGrade;
  }

  // ── S3 · difficultyAxes vocabulary ↔ code ──────────────────────────────────

  function suiteAxes(data, mod) {
    var s = new Suite("S3", mod.id + " · difficultyAxes 词表 ↔ 代码取值", "axis vocabulary agreement");
    var axes = arr(mod.json.difficultyAxes);
    var vocab = {};
    axes.forEach(function (a) { vocab[a.id] = arr(a.progression); });
    s.stat("词表 " + axes.length + " 根轴：" + axes.map(function (a) {
      return a.id + "[" + arr(a.progression).length + "]";
    }).join(" · "));

    if (!mod.source) {
      s.cv(mod, mod.id + "：读不到 game.js，取值无法核对（cannot verify）");
      return;
    }
    var block = declBlock(mod.source, "base");
    if (!block) {
      s.cv(mod, "在 game.js 里找不到 difficultyAxisFor 的 base 表，无法核对（cannot verify）",
        "extractor: /var base = {…}/");
      return;
    }
    var base = nestedStringMap(block.body);
    var levels = Object.keys(base);
    if (!levels.length) {
      s.cv(mod, "base 表解析出 0 行，无法核对（cannot verify）");
      return;
    }
    s.stat("代码 base 表覆盖 " + join(levels));

    var problems = 0;
    levels.forEach(function (lv) {
      var row = base[lv];
      Object.keys(row).forEach(function (axisId) {
        if (!vocab[axisId]) {
          s.fail(lv + "：代码写了词表里没有的轴 '" + axisId + "'");
          problems++;
          return;
        }
        if (vocab[axisId].indexOf(row[axisId]) < 0) {
          s.fail(lv + "." + axisId + " = '" + row[axisId] + "' 不在 progression 里",
            "允许值：" + join(vocab[axisId]));
          problems++;
        }
      });
      var missing = Object.keys(vocab).filter(function (axisId) { return !(axisId in row); });
      if (missing.length) {
        s.info(lv + "：base 表没有给这些轴取值", join(missing));
      }
    });

    // axis.<key> = … refinements
    var refine = axisRefinements(mod.source);
    var refineKeys = Object.keys(refine);
    if (!refineKeys.length) {
      s.stat("代码里没有 axis.* 精调赋值");
    } else {
      refineKeys.forEach(function (axisId) {
        if (!vocab[axisId]) {
          s.fail("精调赋值写了词表里没有的轴 '" + axisId + "'");
          problems++;
          return;
        }
        var bad = unique(refine[axisId]).filter(function (v) { return vocab[axisId].indexOf(v) < 0; });
        if (bad.length) {
          s.fail("axis." + axisId + " 精调取值不在 progression 里：" + join(bad),
            "允许值：" + join(vocab[axisId]));
          problems++;
        } else {
          s.pass("axis." + axisId + " 精调取值合法（" + join(unique(refine[axisId])) + "）");
        }
      });
    }

    if (!problems) {
      s.pass("base 表 " + levels.length + " 行 × " + Object.keys(vocab).length + " 轴的取值全部在词表内");
    }
  }

  // ── S4 · typeTree ↔ code type map + shipped templates ──────────────────────

  function suiteTypes(data, mod) {
    var s = new Suite("S4", mod.id + " · typeTree ↔ 代码分类 ↔ 题库", "type coverage and status honesty");
    var tree = arr(mod.json.typeTree);
    var known = {};
    tree.forEach(function (t) { known[t.id] = t; });
    s.stat("typeTree " + tree.length + " 类：" + tree.map(function (t) {
      return t.id + "(" + t.status + ")";
    }).join(" · "));

    if (!mod.source) {
      s.cv(mod, mod.id + "：读不到 game.js，分类映射无法核对（cannot verify）");
      return;
    }
    var block = declBlock(mod.source, mod.typeMapName);
    if (!block) {
      s.cv(mod, "找不到 " + mod.typeMapName + "，无法核对（cannot verify）", "extractor: /var " + mod.typeMapName + " = {…}/");
      return;
    }
    var typeOf = flatStringMap(block.body);
    var attrs = Object.keys(typeOf);
    s.stat("代码把 " + attrs.length + " 个属性映射到 " + unique(attrs.map(function (a) {
      return typeOf[a];
    })).length + " 个类别");

    var badTargets = unique(attrs.map(function (a) { return typeOf[a]; }))
      .filter(function (t) { return !known[t]; });
    if (badTargets.length) {
      s.fail("代码映射到了 typeTree 里没有的类别", join(badTargets));
    } else {
      s.pass("代码映射的类别全部在 typeTree 里");
    }

    if (!mod.templates) {
      s.cv(mod, mod.id + "：读不到 templates.json，status 无法核对（cannot verify）");
      return;
    }
    var shipped = {};   // typeId → { levels:{}, count:n, attrs:{} }
    arr(mod.templates.templates).forEach(function (t) {
      var typeId = typeOf[t.type];
      if (!typeId) {
        s.fail("题库里的 type '" + t.type + "' 在 " + mod.typeMapName + " 里没有映射", t.id);
        return;
      }
      var slot = shipped[typeId] || (shipped[typeId] = { levels: {}, count: 0, attrs: {} });
      slot.count++;
      slot.levels[t.level] = 1;
      slot.attrs[t.type] = 1;
    });

    tree.forEach(function (t) {
      var slot = shipped[t.id];
      var live = t.status === "implemented" || t.status === "partial";
      if (slot && !live) {
        s.fail("typeTree." + t.id + " status=" + t.status + "，但题库里有 " + slot.count + " 道题",
          "levels " + join(Object.keys(slot.levels)) + " · types " + join(Object.keys(slot.attrs)));
      } else if (!slot && live) {
        s.fail("typeTree." + t.id + " status=" + t.status + "，但题库里一道题也没有");
      } else if (slot) {
        s.pass("typeTree." + t.id + " status=" + t.status + "，题库 " + slot.count +
          " 道（" + join(Object.keys(slot.levels)) + "）");
      } else {
        s.pass("typeTree." + t.id + " status=" + t.status + "，题库确实为空");
      }
      if (live && !t.implementedBy) {
        s.info("typeTree." + t.id + " 已上线但没有 implementedBy 区块");
      }
    });
    mod.shipped = shipped;
    mod.typeOf = typeOf;
  }

  // ── S5 · implementedModes / primaryTypes ↔ templates.json ──────────────────

  function suiteModes(data, mod) {
    var s = new Suite("S5", mod.id + " · implementedModes / primaryTypes ↔ 题库", "mode and type inventory");
    s.stat("别名：mini_game ≡ mini（templates.json 用 mini_game，metadata 用 mini）");

    if (!mod.templates) {
      s.cv(mod, mod.id + "：读不到 templates.json，无法核对（cannot verify）");
      return;
    }
    var byLevel = {};
    arr(mod.templates.templates).forEach(function (t) {
      var slot = byLevel[t.level] || (byLevel[t.level] = { modes: {}, types: {} });
      slot.modes[normMode(t.mode)] = 1;
      if (mod.typeOf && mod.typeOf[t.type]) { slot.types[mod.typeOf[t.type]] = 1; }
    });
    s.stat("题库 " + arr(mod.templates.templates).length + " 条，覆盖 " + join(Object.keys(byLevel)));

    arr(mod.json.levelMap).forEach(function (row) {
      var live = row.status === "implemented" || row.status === "partial";
      var slot = byLevel[row.gradeCode];
      if (!live) {
        if (slot) {
          s.fail(row.levelId + "/" + row.gradeCode + " status=" + row.status + "，但题库里有内容",
            "modes " + join(Object.keys(slot.modes)));
        }
        return;
      }
      if (!slot) {
        s.fail(row.levelId + "/" + row.gradeCode + " 声明已上线，题库里却没有对应等级");
        return;
      }
      var declaredModes = arr(row.implementedModes).map(normMode);
      var actualModes = Object.keys(slot.modes);
      var missing = diff(declaredModes, actualModes);
      var extra = diff(actualModes, declaredModes);
      if (!missing.length && !extra.length) {
        s.pass(row.levelId + "/" + row.gradeCode + " implementedModes 与题库一致（" + join(actualModes.sort()) + "）");
      }
      if (missing.length) {
        s.fail(row.levelId + "/" + row.gradeCode + " 声明了题库里没有的模式", join(missing));
      }
      if (extra.length) {
        s.fail(row.levelId + "/" + row.gradeCode + " 题库有的模式没有写进 implementedModes", join(extra));
      }

      var declaredTypes = arr(row.primaryTypes);
      var actualTypes = Object.keys(slot.types);
      var beyond = diff(actualTypes, declaredTypes);
      var absent = diff(declaredTypes, actualTypes);
      if (beyond.length) {
        // "primary" is emphasis, not inventory — a curriculum call, so INFO.
        s.info(row.levelId + "/" + row.gradeCode + " 题库还产生了 primaryTypes 之外的类别", join(beyond));
      }
      if (absent.length) {
        s.fail(row.levelId + "/" + row.gradeCode + " primaryTypes 里的类别题库里没有", join(absent));
      }
      if (!beyond.length && !absent.length) {
        s.pass(row.levelId + "/" + row.gradeCode + " primaryTypes 与题库一致（" + join(actualTypes.sort()) + "）");
      }
    });
  }

  // ── S6 · referential integrity ─────────────────────────────────────────────

  function suiteRefs(data) {
    var s = new Suite("S6", "目录交叉引用与路径", "catalog cross-references and paths");
    var games = arr(data.game.games);
    var lessons = arr(data.lesson.lessons);
    var videos = arr(data.video.videos);
    var gameIds = {}, lessonIds = {}, videoIds = {};
    games.forEach(function (g) { gameIds[g.id] = g; });
    lessons.forEach(function (l) { lessonIds[l.id] = l; });
    videos.forEach(function (v) { videoIds[v.id] = v; });
    s.stat("game " + games.length + " · lesson " + lessons.length + " · video " + videos.length);

    var dupes = [];
    [["game", games], ["lesson", lessons], ["video", videos]].forEach(function (pair) {
      var seen = {};
      pair[1].forEach(function (x) {
        if (seen[x.id]) { dupes.push(pair[0] + ":" + x.id); }
        seen[x.id] = 1;
      });
    });
    if (dupes.length) { s.fail("有重复 id", join(dupes)); }
    else { s.pass("三张目录内部没有重复 id"); }

    var dangling = [];
    function checkRefs(kind, item, field, table) {
      arr(item[field]).forEach(function (id) {
        if (!table[id]) { dangling.push(kind + " " + item.id + "." + field + " → " + id); }
      });
    }
    games.forEach(function (g) {
      checkRefs("game", g, "lessonIds", lessonIds);
      checkRefs("game", g, "videoIds", videoIds);
    });
    lessons.forEach(function (l) {
      checkRefs("lesson", l, "gameIds", gameIds);
      checkRefs("lesson", l, "videoIds", videoIds);
    });
    videos.forEach(function (v) {
      checkRefs("video", v, "gameIds", gameIds);
      checkRefs("video", v, "lessonIds", lessonIds);
    });
    if (dangling.length) { s.fail("有 " + dangling.length + " 个悬空引用", dangling.join(" · ")); }
    else { s.pass("game / lesson / video 之间没有悬空引用"); }

    // back-link symmetry
    var asym = [];
    games.forEach(function (g) {
      arr(g.lessonIds).forEach(function (lid) {
        var l = lessonIds[lid];
        if (l && arr(l.gameIds).indexOf(g.id) < 0) {
          asym.push(g.id + " → " + lid + "（lesson 未回指）");
        }
      });
    });
    lessons.forEach(function (l) {
      arr(l.gameIds).forEach(function (gid) {
        var g = gameIds[gid];
        if (g && arr(g.lessonIds).indexOf(l.id) < 0) {
          asym.push(l.id + " → " + gid + "（game 未回指）");
        }
      });
    });
    if (asym.length) { s.warn("有 " + asym.length + " 处单向引用", asym.join(" · ")); }
    else { s.pass("game ↔ lesson 引用双向对称"); }

    var orphanLessons = lessons.filter(function (l) { return !arr(l.gameIds).length; });
    var orphanVideos = videos.filter(function (v) {
      return !arr(v.gameIds).length && !arr(v.lessonIds).length;
    });
    if (orphanLessons.length) { s.info("有 " + orphanLessons.length + " 节课没有关联游戏", join(orphanLessons.map(function (l) { return l.id; }))); }
    if (orphanVideos.length) { s.info("有 " + orphanVideos.length + " 个视频没有关联游戏或课程", join(orphanVideos.map(function (v) { return v.id; }))); }
    if (!orphanLessons.length && !orphanVideos.length) { s.pass("没有孤立的课程或视频"); }

    // lesson genes must be registered too
    var registry = data.rootgene.genes || {};
    var lessonGenes = [];
    lessons.forEach(function (l) {
      arr(l.rootGeneIds).forEach(function (id) {
        if (!registry[id]) { lessonGenes.push(l.id + " → " + id); }
      });
    });
    if (lessonGenes.length) { s.info("lesson.json 里有未登记的基因 id", lessonGenes.join(" · ")); }
    else { s.pass("lesson.json 的基因 id 全部已登记"); }

    // declared path must exist
    var missingPath = games.filter(function (g) { return !g.path; });
    if (missingPath.length) {
      s.fail("有 " + missingPath.length + " 个游戏条目没有 path 字段", join(missingPath.map(function (g) { return g.id; })));
    } else {
      s.pass("每个游戏条目都有 path 字段");
    }
    var bad = Object.keys(data.pathOk).filter(function (id) { return !data.pathOk[id]; });
    if (bad.length) {
      s.fail("有 " + bad.length + " 个 path 下找不到 index.html", bad.map(function (id) {
        return id + " → " + gameIds[id].path;
      }).join(" · "));
    } else {
      s.pass("每个 path 下都能取到 index.html");
    }

    var planned = games.filter(function (g) { return statusOf(g, "implemented") === "planned"; });
    if (planned.length) {
      s.info("有 " + planned.length + " 个条目 status=planned（已登记，尚未接入上报）",
        join(planned.map(function (g) { return g.id; })));
    }
  }

  // ── S7 · structure × task allowlist matrix ─────────────────────────────────

  /**
   * Runs inside the per-module loop (so the page shows S2-S5 + S7 per module,
   * then the global S6). Only modules that declare `taskMatrix` are checked;
   * `comparison` expresses the same idea as mode × type inside templates.json
   * and legitimately has no matrix, so its absence is a stat, not a warning.
   *
   * What this suite exists to stop: a three-dimension model degenerating into a
   * cross product. 7 structures x 6 tasks = 42 cells and several of them are
   * meaningless (a relational pattern has no "next item") or degenerate (matching
   * two numeric runs is just "both are +2"). The matrix lists the cells that are
   * allowed; `taskMatrixExclusions` lists the rest WITH A REASON. Together they
   * must cover every cell exactly once — that is the invariant here, and it is
   * what makes "we thought about all 42" checkable instead of asserted.
   */
  function suiteMatrix(data, mod) {
    var json = mod.json || {};
    if (!json.taskMatrix) { return; }

    var s = new Suite("S7", mod.id + " · structure × task 白名单矩阵", "structure-task allowlist matrix");
    var registry = (data.rootgene && data.rootgene.genes) || {};
    var grades = (global.RadarReader && global.RadarReader.GRADE_CODES) || null;

    var structures = arr(json.typeTree).map(function (t) { return t.id; });
    var tasks = arr(json.taskTypes).map(function (t) { return t.id; });
    var typeById = {};
    arr(json.typeTree).forEach(function (t) { typeById[t.id] = t; });
    var taskById = {};
    arr(json.taskTypes).forEach(function (t) { taskById[t.id] = t; });
    var rows = arr(json.taskMatrix);
    var excl = arr(json.taskMatrixExclusions);

    s.stat("结构 " + structures.length + " 类 × 任务 " + tasks.length + " 种 = " +
      (structures.length * tasks.length) + " 格 · 允许 " + rows.length + " · 排除 " + excl.length);

    // ── 1. every cell referenced must exist, and each appears exactly once ────
    var seen = {}, dup = [], unknown = [];
    rows.concat(excl).forEach(function (r) {
      var key = r.structure + "×" + r.task;
      if (structures.indexOf(r.structure) < 0 || tasks.indexOf(r.task) < 0) { unknown.push(key); }
      seen[key] = (seen[key] || 0) + 1;
      if (seen[key] === 2) { dup.push(key); }
    });
    if (unknown.length) {
      s.fail("矩阵引用了 typeTree / taskTypes 里没有的 id", join(unique(unknown)));
    } else {
      s.pass("矩阵每一格的 structure 与 task 都已声明");
    }
    if (dup.length) {
      s.fail("有格子被列了两次（允许与排除不能同时成立）", join(unique(dup)));
    }

    var missing = [];
    structures.forEach(function (st) {
      tasks.forEach(function (tk) {
        if (!seen[st + "×" + tk]) { missing.push(st + "×" + tk); }
      });
    });
    if (missing.length) {
      s.fail("有 " + missing.length + " 格既没允许也没排除（未表态）", join(missing));
    } else if (!dup.length) {
      s.pass("允许 + 排除正好覆盖每一格一次（" + (rows.length + excl.length) + "/" +
        (structures.length * tasks.length) + "）");
    }

    // ── 2. exclusions must carry a reason ────────────────────────────────────
    var noReason = excl.filter(function (r) { return !r.reasonZh || !r.reasonEn; });
    if (noReason.length) {
      s.fail("有排除格没有写理由（排除必须可复核）", noReason.map(function (r) {
        return r.structure + "×" + r.task;
      }).join(" · "));
    } else if (excl.length) {
      s.pass("每个排除格都写了中英文理由");
    }

    // ── 3. levelFloor legality and runtime agreement ─────────────────────────
    if (!grades) {
      s.warn("RadarReader 未加载，levelFloor 合法性无法核对（cannot verify）");
    } else {
      var badFloor = rows.filter(function (r) { return grades.indexOf(r.levelFloor) < 0; });
      if (badFloor.length) {
        s.fail("有 levelFloor 不在 GRADE_CODES 里", badFloor.map(function (r) {
          return r.structure + "×" + r.task + "→" + r.levelFloor;
        }).join(" · "));
      } else {
        s.pass("每个允许格的 levelFloor 都是合法 gradeCode");
      }
    }

    var badRt = rows.filter(function (r) {
      var t = taskById[r.task];
      return t && t.runtime && r.runtime !== t.runtime;
    });
    if (badRt.length) {
      s.fail("矩阵的 runtime 与 taskTypes 声明的 runtime 不一致", badRt.map(function (r) {
        return r.structure + "×" + r.task + " " + r.runtime + " ≠ " + taskById[r.task].runtime;
      }).join(" · "));
    } else {
      s.pass("矩阵 runtime 与 taskTypes 一致（" + join(unique(rows.map(function (r) {
        return r.task + "→" + r.runtime;
      }).map(function (x) { return x.split("→")[1]; }))) + "）");
    }

    // ── 4. no orphan structure or task ───────────────────────────────────────
    var usedSt = unique(rows.map(function (r) { return r.structure; }));
    var usedTk = unique(rows.map(function (r) { return r.task; }));
    var deadSt = diff(structures, usedSt);
    var deadTk = diff(tasks, usedTk);
    if (deadSt.length) {
      s.fail("有结构一个任务都不允许，等于声明了做不了的类型", join(deadSt));
    } else {
      s.pass("每个结构都至少有一个允许的任务");
    }
    if (deadTk.length) {
      s.fail("有任务在任何结构上都不允许", join(deadTk));
    } else {
      s.pass("每个任务都至少落在一个结构上");
    }

    // ── 5. a shipped cell needs a shipped structure ──────────────────────────
    var liveRows = rows.filter(function (r) {
      return r.status === "implemented" || r.status === "partial";
    });
    var lying = liveRows.filter(function (r) {
      var t = typeById[r.structure];
      return !t || (t.status !== "implemented" && t.status !== "partial");
    });
    if (lying.length) {
      s.fail("矩阵说这格已上线，但它的 typeTree 结构还是 planned", lying.map(function (r) {
        return r.structure + "×" + r.task + "(" + (typeById[r.structure] || {}).status + ")";
      }).join(" · "));
    } else {
      s.pass("已上线的 " + liveRows.length + " 格，其结构在 typeTree 里也是已上线（" +
        liveRows.map(function (r) { return r.structure + "×" + r.task; }).join(" · ") + "）");
    }

    // ── 6. genes referenced by structures / carriers ─────────────────────────
    var scope = arr(json.rootGeneIds);
    var geneRefs = [];
    arr(json.typeTree).forEach(function (t) {
      if (t.structureGeneId) { geneRefs.push([t.id, t.structureGeneId]); }
      arr(t.extraGeneIds).forEach(function (g) { geneRefs.push([t.id, g]); });
    });
    arr(json.carriers).forEach(function (c) {
      if (c.carrierGeneId) { geneRefs.push(["carrier:" + c.id, c.carrierGeneId]); }
    });
    var outOfScope = geneRefs.filter(function (p) { return scope.indexOf(p[1]) < 0; });
    if (outOfScope.length) {
      s.fail("结构 / 载体引用了 rootGeneIds 之外的基因", outOfScope.map(function (p) {
        return p[0] + "→" + p[1];
      }).join(" · "));
    } else {
      s.pass("结构与载体引用的基因全部在模块 rootGeneIds 之内（" + geneRefs.length + " 处引用）");
    }
    var unreg = unique(scope.filter(function (id) { return !registry[id]; }));
    if (unreg.length) {
      s.info("模块 rootGeneIds 里有 " + unreg.length + " 个 id 未登记（合法：reader 会推导标签）", join(unreg));
    } else {
      s.pass("模块 rootGeneIds " + scope.length + " 个 id 全部已登记");
    }

    // ── 7. every level can actually deliver the tasks it emphasises ──────────
    if (grades) {
      var allow = {};
      rows.forEach(function (r) { allow[r.structure + "×" + r.task] = r; });
      var unreachable = [];
      arr(json.levelMap).forEach(function (row) {
        var g = grades.indexOf(row.gradeCode);
        arr(row.primaryTasks).forEach(function (task) {
          var via = arr(row.primaryTypes).filter(function (st) {
            var cell = allow[st + "×" + task];
            return cell && grades.indexOf(cell.levelFloor) <= g;
          });
          if (!via.length) {
            unreachable.push(row.levelId + "/" + row.gradeCode + " " + task);
          }
        });
      });
      if (unreachable.length) {
        s.fail("有等级强调的任务，在它自己的 primaryTypes 上按矩阵做不出来", join(unreachable));
      } else {
        s.pass("levelMap 每一行的 primaryTasks 都能在它的 primaryTypes 上按矩阵实现");
      }

      var homeless = structures.filter(function (st) {
        return !arr(json.levelMap).some(function (row) {
          return arr(row.primaryTypes).indexOf(st) >= 0;
        });
      });
      if (homeless.length) {
        s.fail("有结构在 levelMap 里没有任何归属等级", join(homeless));
      } else {
        s.pass("7 类结构在 levelMap 里都有归属等级");
      }

      var badTask = [];
      arr(json.levelMap).forEach(function (row) {
        arr(row.primaryTasks).forEach(function (t) {
          if (tasks.indexOf(t) < 0) { badTask.push(row.levelId + "→" + t); }
        });
      });
      if (badTask.length) {
        s.fail("levelMap 的 primaryTasks 里有未声明的任务 id", join(badTask));
      }
    }

    // ── 8. code side: SESSION_SIZE, TASK_OF, STRUCTURE_GENES ─────────────────
    var policy = json.sessionPolicy || {};
    if (!mod.source) {
      s.cv(mod, mod.id + "：读不到 game.js，SESSION_SIZE / TASK_OF 无法核对（cannot verify）");
      return;
    }
    var m = /SESSION_SIZE\s*=\s*(\d+)/.exec(mod.source);
    if (!m) {
      s.cv(mod, "在 game.js 里找不到 SESSION_SIZE，无法核对（cannot verify）",
        "extractor: /SESSION_SIZE = <number>/");
    } else if (typeof policy.maxItemsPerSession !== "number") {
      s.fail("代码有 SESSION_SIZE = " + m[1] + "，但 sessionPolicy.maxItemsPerSession 未声明");
    } else if (Number(m[1]) !== policy.maxItemsPerSession) {
      s.fail("SESSION_SIZE = " + m[1] + " 与 sessionPolicy.maxItemsPerSession = " +
        policy.maxItemsPerSession + " 不一致");
    } else {
      s.pass("SESSION_SIZE 与 sessionPolicy.maxItemsPerSession 一致（" + m[1] + " 题）");
    }

    var taskBlock = declBlock(mod.source, "TASK_OF");
    if (!taskBlock) {
      s.cv(mod, "在 game.js 里找不到 TASK_OF，任务取值无法核对（cannot verify）",
        "extractor: /var TASK_OF = {…}/");
    } else {
      var taskOf = flatStringMap(taskBlock.body);
      var dirAxis = arr(json.difficultyAxes).filter(function (a) {
        return a.id === "inference_direction";
      })[0];
      var dirVocab = dirAxis ? arr(dirAxis.progression) : [];
      var badKeys = Object.keys(taskOf).filter(function (k) { return dirVocab.indexOf(k) < 0; });
      var badVals = unique(Object.keys(taskOf).map(function (k) { return taskOf[k]; }))
        .filter(function (v) { return tasks.indexOf(v) < 0; });
      if (badKeys.length) {
        s.fail("TASK_OF 的键不在 inference_direction 词表里", join(badKeys) +
          "（允许：" + join(dirVocab) + "）");
      }
      if (badVals.length) {
        s.fail("TASK_OF 的取值不在 taskTypes 里", join(badVals));
      }
      if (!badKeys.length && !badVals.length) {
        s.pass("TASK_OF 方向→任务映射合法（" + Object.keys(taskOf).map(function (k) {
          return k + "→" + taskOf[k];
        }).join(" · ") + "）");
      }
      var uncovered = diff(dirVocab, Object.keys(taskOf));
      if (uncovered.length) {
        s.info("TASK_OF 没有覆盖的方向（这些方向的题还没上线）", join(uncovered));
      }
    }

    var geneBlock = declBlock(mod.source, "STRUCTURE_GENES");
    if (!geneBlock) {
      s.cv(mod, "在 game.js 里找不到 STRUCTURE_GENES，上报基因无法核对（cannot verify）",
        "extractor: /var STRUCTURE_GENES = {…}/");
    } else {
      var codeGenes = unique(geneBlock.body.match(GENE_SCAN_RE) || []);
      var outside = codeGenes.filter(function (g) { return scope.indexOf(g) < 0; });
      if (outside.length) {
        s.fail("STRUCTURE_GENES 上报了模块 rootGeneIds 之外的基因", join(outside));
      } else {
        s.pass("STRUCTURE_GENES 上报的 " + codeGenes.length + " 个基因都在模块范围内（" +
          join(codeGenes) + "）");
      }
      // keys are `structureId: [ … ]`, so they cannot be read by flatStringMap
      var keyRe = /([A-Za-z_$][\w$]*)\s*:\s*\[/g, mm, keys = [];
      while ((mm = keyRe.exec(geneBlock.body))) { keys.push(mm[1]); }
      var unknownStruct = keys.filter(function (k) { return structures.indexOf(k) < 0; });
      if (unknownStruct.length) {
        s.fail("STRUCTURE_GENES 的键不是 typeTree 里的结构 id", join(unknownStruct));
      } else if (keys.length) {
        s.pass("STRUCTURE_GENES 的键全部是已声明结构（" + join(keys) + "）");
      }
    }
  }

  // ── boot ───────────────────────────────────────────────────────────────────

  function renderSummary() {
    var el = document.getElementById("summary-badge");
    var parts = [
      "OK " + counts.ok,
      "INFO " + counts.info,
      "WARN " + counts.warn,
      "FAIL " + counts.fail
    ];
    el.textContent = parts.join(" · ");
    el.className = counts.fail ? "badge-fail" : (counts.warn ? "badge-warn" : "badge-ok");
  }

  // The private type map inside a module's game.js is named after the module:
  // comparison → COMPARISON_TYPE_OF, pattern → PATTERN_TYPE_OF.
  function typeMapNameFor(id) {
    return String(id).toUpperCase().replace(/-/g, "_") + "_TYPE_OF";
  }

  function loadModules(catalog, games) {
    var mods = arr(catalog.modules).filter(function (m) {
      return m.status !== "retired";
    });
    return Promise.all(mods.map(function (m) {
      // A metathinking module id equals the `module` field of its learning game.
      var game = games.filter(function (g) {
        return g.series === "learning" && g.module === m.id;
      })[0];
      var path = game && game.path;
      return fetchJson("metadata/metathinking/" + m.id + ".json").then(function (json) {
        var jobs = [
          path ? fetchTextOrNull(path + "game.js") : Promise.resolve(null),
          path ? fetchTextOrNull(path + "templates.json") : Promise.resolve(null)
        ];
        return Promise.all(jobs).then(function (out) {
          var templates = null;
          if (out[1]) {
            try { templates = JSON.parse(out[1]); } catch (e) { templates = null; }
          }
          return {
            id: m.id,
            // `active` (default) validates at full strictness; `in-progress`
            // downgrades cannot-verify lines to INFO. See Suite.prototype.cv.
            status: m.status || "active",
            typeMapName: typeMapNameFor(m.id),
            json: json,
            path: path || null,
            gameId: game ? game.id : null,
            source: out[0] ? stripComments(out[0]) : null,
            templates: templates
          };
        });
      });
    }));
  }

  function boot() {
    host = document.getElementById("suites");
    document.getElementById("version").textContent = "validator v" + VERSION +
      (global.RadarReader ? " · radar-reader v" + global.RadarReader.version : " · radar-reader 未加载");

    Promise.all([
      fetchJson("metadata/game.json"),
      fetchJson("metadata/lesson.json"),
      fetchJson("metadata/video.json"),
      fetchJson("metadata/rootgene.json"),
      fetchJson("metadata/metathinking/index.json")
    ]).then(function (out) {
      var data = {
        game: out[0], lesson: out[1], video: out[2],
        rootgene: out[3], catalog: out[4],
        code: {}, pathOk: {}
      };
      var games = arr(data.game.games);

      var jobs = [];
      games.forEach(function (g) {
        data.code[g.id] = {};
        if (!g.path) { return; }
        jobs.push(fetchExists(g.path + "index.html").then(function (ok) {
          data.pathOk[g.id] = ok;
        }));
        CODE_FILES.forEach(function (f) {
          jobs.push(fetchTextOrNull(g.path + f).then(function (text) {
            if (text) { data.code[g.id][f] = text; }
          }));
        });
      });

      return Promise.all(jobs)
        .then(function () { return loadModules(data.catalog, games); })
        .then(function (mods) {
          suiteGenes(data);
          mods.forEach(function (mod) {
            suiteLevels(data, mod);
            suiteAxes(data, mod);
            suiteTypes(data, mod);
            suiteModes(data, mod);
            suiteMatrix(data, mod);
          });
          suiteRefs(data);
          renderSummary();
        });
    }).catch(function (err) {
      host = host || document.body;
      var s = new Suite("S0", "加载失败", "load failure");
      s.fail(String(err && err.message ? err.message : err),
        "这个页面需要通过 HTTP 打开（file:// 下 fetch 会被拦）。");
      renderSummary();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
