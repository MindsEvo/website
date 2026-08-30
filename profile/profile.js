'use strict';
/**
 * Thinking Map page (阶段 1.4) — the read-only view of RadarReader's output.
 *
 * The whole page is a pure function of two inputs: the local play history
 * (read by radar-reader.js) and the gene name registry
 * (metadata/rootgene.json). It writes nothing, uploads nothing, and asks for
 * no permission — so it is safe to open at any time, and re-rendering it on a
 * language switch is just calling render() again.
 *
 * Three choices worth knowing about:
 *
 *   1. THE CHART IS PLAIN SVG, no library. A radar is 40 lines of trig; a
 *      charting library would be 100× the bytes and would fight the shell's
 *      container-driven layout (§8 rule 1). The SVG has a viewBox and no fixed
 *      width, so it scales with the card instead of with a media query.
 *
 *   2. FEWER THAN 3 GENES DRAWS BARS, NOT A RADAR. A 2-axis "polygon" is a
 *      line and a 1-axis one is a dot — both would misrepresent the data as a
 *      shape. Comparison alone reports 2 genes today, so this is the case a
 *      first-time visitor actually sees.
 *
 *   3. THE RADAR IS NEVER THE WHOLE TRUTH, so the grade table is always drawn.
 *      A radar spoke collapses axis 2 into one number (how deep); the table
 *      puts every grade back, with the per-cell accuracy and session count the
 *      spoke had to average away.
 *
 * The registry is a nicety, not a dependency: if the fetch fails (file://, or
 * the file is not deployed yet) every gene still charts, labelled from its own
 * id by RadarReader.deriveLabel. That is said out loud in the footer rather
 * than hidden.
 */
(function (global) {

  var REGISTRY_URL = '../metadata/rootgene.json';

  // Accuracy → colour tier for the grade table. Four bands, not a gradient:
  // a parent reads "green / amber / red", not a 7% difference in lightness.
  var TIERS = [
    { min: 0.90, cls: 'pf-a4' },
    { min: 0.75, cls: 'pf-a3' },
    { min: 0.50, cls: 'pf-a2' },
    { min: 0.00, cls: 'pf-a1' }
  ];

  // Each runtime's `total` counts a DIFFERENT thing. The footer prints the raw
  // sums per runtime with its own unit attached, so nobody is tempted to add
  // the rows together (UNIFIED-GUI-FRAMEWORK.md §4.4 red line).
  // Interaction is '项', not '次': the session count is already printed as 次,
  // and "2 次 · 9/15 次" would read as one quantity contradicting itself.
  var RUNTIME_UNITS = {
    puzzle:      { zh: '题',   en: 'questions',  labelZh: '题目',   labelEn: 'Puzzle' },
    interaction: { zh: '项',   en: 'activities', labelZh: '交互',   labelEn: 'Interaction' },
    mini:        { zh: '回合', en: 'rounds',     labelZh: '小游戏', labelEn: 'Mini-game' }
  };

  var state = {
    labels: null,        // registry genes map, or null if it did not load
    registryVersion: null,
    registryError: null
  };
  var mounted = null;

  // ── tiny helpers ────────────────────────────────────────────

  function isZh() { return ((global.shell && global.shell.lang) || 'en') === 'zh'; }
  function T(zh, en) { return isZh() ? zh : en; }

  function esc(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pct(x) {
    return (x === null || x === undefined || !isFinite(x))
      ? '—' : Math.round(x * 100) + '%';
  }

  function tierClass(accuracy) {
    if (accuracy === null || accuracy === undefined || !isFinite(accuracy)) return '';
    for (var i = 0; i < TIERS.length; i++) {
      if (accuracy >= TIERS[i].min) return TIERS[i].cls;
    }
    return '';
  }

  function dateStr(ts) {
    if (!ts) return T('还没有', 'never');
    var d = new Date(ts);
    if (isNaN(d.getTime())) return T('未知', 'unknown');
    var two = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate());
  }

  function runtimeUnit(rt) {
    var u = RUNTIME_UNITS[rt];
    if (!u) return { unit: T('次', 'items'), label: rt };
    return { unit: isZh() ? u.zh : u.en, label: isZh() ? u.labelZh : u.labelEn };
  }

  // ── registry ────────────────────────────────────────────────

  function loadRegistry() {
    if (typeof global.fetch !== 'function') {
      state.registryError = 'no-fetch';
      return Promise.resolve();
    }
    return global.fetch(REGISTRY_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        state.labels = (json && json.genes) || null;
        state.registryVersion = (json && json.version) || null;
        if (!state.labels) state.registryError = 'no-genes';
      })
      .catch(function (err) {
        // A missing registry costs readable names, nothing else.
        state.registryError = String((err && err.message) || err);
      });
  }

  // ── radar (>= 3 genes) ──────────────────────────────────────

  /**
   * One spoke per gene, one ring per grade. The filled polygon is `coverage`
   * (deepest grade ever played) and the dashed one is `mastery` (deepest grade
   * held at >= the mastery bar for >= the session bar). The gap between them
   * is the recommendation, which is why both are drawn on one chart.
   */
  function radarSvg(result) {
    var genes = result.genes;
    var n = genes.length;
    var rings = result.grades.length;               // 8
    var W = 480, H = 420, cx = W / 2, cy = 208, R = 132;

    function pt(frac, i) {
      var a = -Math.PI / 2 + (i * 2 * Math.PI / n);
      return [cx + Math.cos(a) * R * frac, cy + Math.sin(a) * R * frac];
    }
    function poly(frac0, pick) {
      var pts = [];
      for (var i = 0; i < n; i++) {
        var f = pick ? pick(genes[i]) : frac0;
        var p = pt(f, i);
        pts.push(p[0].toFixed(1) + ',' + p[1].toFixed(1));
      }
      return pts.join(' ');
    }

    var svg = [];
    svg.push('<svg class="pf-chart" viewBox="0 0 ' + W + ' ' + H +
             '" role="img" aria-label="' +
             esc(T('思维雷达：根基因 × 等级', 'Thinking radar: rootGene by grade')) + '">');

    // grade rings, innermost = K1
    for (var r = 1; r <= rings; r++) {
      svg.push('<polygon points="' + poly(r / rings) +
               '" fill="none" stroke="#e2e8f0" stroke-width="1" />');
    }
    // spokes
    for (var i = 0; i < n; i++) {
      var e = pt(1, i);
      svg.push('<line x1="' + cx + '" y1="' + cy + '" x2="' + e[0].toFixed(1) +
               '" y2="' + e[1].toFixed(1) + '" stroke="#e2e8f0" stroke-width="1" />');
    }
    // ring scale: only the two ends are labelled, so the numbers do not become
    // a wall of text on a phone.
    svg.push('<text x="' + (cx + 5) + '" y="' + (cy - R / rings + 4) +
             '" font-size="10" fill="#94a3b8">' + esc(result.grades[0]) + '</text>');
    svg.push('<text x="' + (cx + 5) + '" y="' + (cy - R + 4) +
             '" font-size="10" fill="#94a3b8">' + esc(result.grades[rings - 1]) + '</text>');

    // coverage (filled) then mastery (dashed) on top
    svg.push('<polygon points="' + poly(0, function (g) { return g.coverage; }) +
             '" fill="rgba(102,126,234,0.26)" stroke="#667eea" stroke-width="2" />');
    var anyMastery = genes.some(function (g) { return g.mastery > 0; });
    if (anyMastery) {
      svg.push('<polygon points="' + poly(0, function (g) { return g.mastery; }) +
               '" fill="none" stroke="#764ba2" stroke-width="2" ' +
               'stroke-dasharray="6 4" />');
    }
    // vertices, so a single-grade spoke is still visible
    for (var k = 0; k < n; k++) {
      var v = pt(genes[k].coverage, k);
      svg.push('<circle cx="' + v[0].toFixed(1) + '" cy="' + v[1].toFixed(1) +
               '" r="3" fill="#667eea" />');
    }
    // Hollow markers ONLY where mastery is real. Without them the dashed
    // polygon pinches through the centre for every not-yet-solid gene, which is
    // honest but reads as a drawing artifact; the markers say which vertices
    // are a claim and which are just the line passing through zero.
    if (anyMastery) {
      for (var m = 0; m < n; m++) {
        if (!(genes[m].mastery > 0)) continue;
        var mv = pt(genes[m].mastery, m);
        svg.push('<circle cx="' + mv[0].toFixed(1) + '" cy="' + mv[1].toFixed(1) +
                 '" r="3.5" fill="#ffffff" stroke="#764ba2" stroke-width="2" />');
      }
    }
    // axis labels: short name + the deepest grade reached
    for (var j = 0; j < n; j++) {
      var a = -Math.PI / 2 + (j * 2 * Math.PI / n);
      var lx = cx + Math.cos(a) * (R + 20);
      var ly = cy + Math.sin(a) * (R + 20);
      var ca = Math.cos(a);
      var anchor = ca > 0.25 ? 'start' : (ca < -0.25 ? 'end' : 'middle');
      var dy = Math.sin(a) > 0.6 ? 12 : (Math.sin(a) < -0.6 ? -4 : 4);
      svg.push('<text x="' + lx.toFixed(1) + '" y="' + (ly + dy).toFixed(1) +
               '" text-anchor="' + anchor + '" font-size="13" font-weight="700" ' +
               'fill="#1e293b">' + esc(genes[j].labelShort) + '</text>');
      svg.push('<text x="' + lx.toFixed(1) + '" y="' + (ly + dy + 14).toFixed(1) +
               '" text-anchor="' + anchor + '" font-size="11" fill="#64748b">' +
               esc(genes[j].reachedCode || '—') + '</text>');
    }
    svg.push('</svg>');
    return svg.join('');
  }

  /**
   * Fallback for 1–2 genes: one 8-cell strip per gene. Same two states as the
   * radar (reached / mastered) and the same axis 2, just drawn as a row —
   * because a 2-vertex polygon is a line, and a line implies a shape that is
   * not there.
   */
  function barsHtml(result) {
    var html = ['<div class="pf-bars">'];
    result.genes.forEach(function (gene) {
      html.push('<div class="pf-barrow">');
      html.push('<div class="pf-barlbl"><span>' + esc(gene.label) + '</span>' +
                '<small>' + esc(T('已到 ', 'reached ') + (gene.reachedCode || '—')) +
                ' · ' + esc(pct(gene.accuracy)) + ' · ' +
                esc(gene.sessions + T(' 次', 'x')) + '</small></div>');
      html.push('<div class="pf-barcells">');
      result.grades.forEach(function (code, i) {
        var cls = 'pf-bcell';
        if (i <= gene.masteredIndex) cls += ' pf-mastered';
        else if (i <= gene.reachedIndex) cls += ' pf-reached';
        html.push('<div class="' + cls + '">' + esc(code) + '</div>');
      });
      html.push('</div></div>');
    });
    html.push('</div>');
    return html.join('');
  }

  function legendHtml(result) {
    return '<div class="pf-legend">' +
      '<span class="pf-lg"><span class="pf-sw pf-sw-reach"></span>' +
      esc(T('已练到的最深等级', 'Deepest grade played')) + '</span>' +
      '<span class="pf-lg"><span class="pf-sw pf-sw-master"></span>' +
      esc(T('已掌握（≥' + Math.round(result.config.masteryAccuracy * 100) + '%，≥' +
            result.config.masterySessions + ' 次）',
            'Mastered (≥' + Math.round(result.config.masteryAccuracy * 100) + '%, ≥' +
            result.config.masterySessions + ' sessions)')) + '</span>' +
      '</div>';
  }

  // ── sections ────────────────────────────────────────────────

  function summaryHtml(result) {
    var t = result.totals;
    // The headline accuracy is the mean of per-record ratios — the only
    // cross-runtime-safe average there is. See radar-reader.js rule 1.
    var ratioSum = 0, sessions = 0;
    Object.keys(t.byRuntime).forEach(function (rt) {
      ratioSum += t.byRuntime[rt].ratioSum;
      sessions += t.byRuntime[rt].sessions;
    });
    var mean = sessions ? ratioSum / sessions : null;

    var deepest = -1;
    result.genes.forEach(function (g) {
      if (g.reachedIndex > deepest) deepest = g.reachedIndex;
    });

    var trend = result.trend;
    var trendVal = T('—', '—'), trendCls = '';
    if (trend) {
      var d = Math.round(trend.delta * 100);
      trendVal = (d > 0 ? '+' : '') + d + '%';
      trendCls = d > 0 ? 'pf-delta-up' : (d < 0 ? 'pf-delta-down' : '');
    }

    var cells = [
      [String(result.genes.length), T('已练基因', 'Genes played')],
      [String(t.used),              T('有效记录', 'Records used')],
      [pct(mean),                   T('平均正确率', 'Mean accuracy')],
      [deepest >= 0 ? result.grades[deepest] : '—', T('最深等级', 'Deepest grade')],
      [trendVal,                    T('近期进步', 'Recent change'), trendCls]
    ];

    var html = ['<div class="pf-card"><div class="s1-hstats">'];
    cells.forEach(function (c) {
      html.push('<div class="s1-hstat"><div class="s1-hsval' +
                (c[2] ? ' ' + c[2] : '') + '">' + esc(c[0]) + '</div>' +
                '<div class="s1-hslbl">' + esc(c[1]) + '</div></div>');
    });
    html.push('</div>');
    if (trend) {
      html.push('<p class="pf-note">' + esc(T(
        '“近期进步”把记录按顺序对半分开，用后一半的平均正确率减前一半（' +
          trend.olderCount + ' 次 → ' + trend.newerCount + ' 次，' +
          pct(trend.older) + ' → ' + pct(trend.newer) + '）。',
        '"Recent change" splits the records in half by order and subtracts the ' +
          'earlier mean from the later one (' + trend.olderCount + ' → ' +
          trend.newerCount + ' sessions, ' + pct(trend.older) + ' → ' +
          pct(trend.newer) + ').')) + '</p>');
    } else {
      html.push('<p class="pf-note">' + esc(T(
        '再多玩几次就会出现“近期进步”：需要至少 ' + result.config.trendMinRecords +
          ' 条记录，少于这个数的前后对比只是波动。',
        'A few more sessions and "recent change" appears: it needs at least ' +
          result.config.trendMinRecords + ' records, below which a before/after ' +
          'split is noise.')) + '</p>');
    }
    html.push('</div>');
    return html.join('');
  }

  function chartHtml(result) {
    var few = result.genes.length < 3;
    return '<div class="pf-card">' +
      '<div class="pf-h2">' + esc(T('覆盖与掌握', 'Coverage and mastery')) + '</div>' +
      '<p class="pf-note">' + esc(few
        ? T('目前只有 ' + result.genes.length +
              ' 个根基因有记录，画成雷达就是一条线，所以这里按等级排成条形。多练两三个单元后会自动变成雷达图。',
            'Only ' + result.genes.length + ' rootGene(s) have records so far — a ' +
              'radar of that few axes is a line, so it is drawn as grade strips. ' +
              'It becomes a radar once three or more are in play.')
        : T('每条轴是一个根基因，从中心往外的 8 圈依次是 K1 到 G6。',
            'Each spoke is one rootGene; the 8 rings from the centre outward are ' +
              'K1 through G6.')) + '</p>' +
      (few ? barsHtml(result) : radarSvg(result)) +
      legendHtml(result) +
      '</div>';
  }

  function tableHtml(result) {
    var html = ['<div class="pf-card">'];
    html.push('<div class="pf-h2">' + esc(T('根基因 × 等级', 'RootGene by grade')) + '</div>');
    html.push('<p class="pf-note">' + esc(T(
      '每格是“该基因在该等级的平均正确率 × 练习次数”。雷达图把等级压成一个数，这张表把它还原。',
      'Each cell is the mean accuracy for that gene at that grade, with the ' +
        'session count. The radar averages axis 2 away; this table restores it.')) +
      '</p>');
    html.push('<div class="pf-scroll"><div class="pf-grid">');
    html.push('<div class="pf-gh pf-ghname">' + esc(T('根基因', 'RootGene')) + '</div>');
    result.grades.forEach(function (code) {
      html.push('<div class="pf-gh">' + esc(code) + '</div>');
    });
    result.genes.forEach(function (gene) {
      html.push('<div class="pf-gname" title="' + esc(gene.geneId) + '">' +
                esc(gene.label) + '</div>');
      result.grades.forEach(function (code) {
        var cell = gene.byGrade[code];
        if (!cell || !cell.sessions) {
          html.push('<div class="pf-cell">·</div>');
          return;
        }
        html.push('<div class="pf-cell ' + tierClass(cell.accuracy) + '" title="' +
                  esc(gene.label + ' · ' + code + ' · ' + pct(cell.accuracy) + ' · ' +
                      cell.sessions + T(' 次', ' sessions')) + '">' +
                  '<b>' + esc(pct(cell.accuracy)) + '</b><span>×' +
                  cell.sessions + '</span></div>');
      });
    });
    html.push('</div></div>');
    if (result.totals.noGrade) {
      html.push('<p class="pf-note">' + esc(T(
        '另有 ' + result.totals.noGrade + ' 条记录没有等级信息，只能计入基因总数，无法放进这张表。',
        result.totals.noGrade + ' record(s) carry no grade, so they count toward ' +
          'the gene totals but cannot be placed in this table.')) + '</p>');
    }
    html.push('</div>');
    return html.join('');
  }

  /**
   * The recommendation, one row per gene, straight off `frontierCode` — the
   * shallowest grade already played but not yet solid, or the next grade out if
   * every played grade is solid. No content is invented here: the page names a
   * grade, not a specific level, because only the module knows what exists.
   *
   * A null frontier means one of two very different things, so they are split:
   * solid all the way to G6 (worth saying — the gene is done), or no record of
   * this gene ever carried a grade (nothing to recommend, so no row at all).
   */
  function nextHtml(result) {
    var deepest = result.grades.length - 1;
    var rows = result.genes.map(function (gene) {
      var frontier = gene.frontierCode;
      if (!frontier) {
        return gene.reachedIndex === deepest
          ? { gene: gene, code: result.grades[deepest], kind: 'done', cell: null }
          : null;                       // ungraded records only → no advice
      }
      var cell = gene.byGrade[frontier];
      // Played-but-soft → firm it up. Never played → a genuine step outward,
      // which the frontier rule guarantees is deeper than anything reached.
      return {
        gene: gene, code: frontier, cell: cell,
        kind: (cell && cell.sessions) ? 'firm' : 'new'
      };
    }).filter(Boolean);

    if (!rows.length) return '';

    var html = ['<div class="pf-card">'];
    html.push('<div class="pf-h2">' + esc(T('下一步练什么', 'What to play next')) + '</div>');
    html.push('<ul class="pf-next">');
    rows.forEach(function (row) {
      var tag, text;
      if (row.kind === 'done') {
        tag = T('已通关', 'complete');
        text = T('已经练到 G6 并且稳定，可以换一个基因。',
                 'Solid all the way to G6 — time for a different gene.');
      } else if (row.kind === 'firm') {
        tag = T('巩固', 'firm up');
        text = T('在 ' + row.code + ' 已经练了 ' + row.cell.sessions + ' 次，正确率 ' +
                   pct(row.cell.accuracy) + '，再练几次就算掌握。',
                 row.cell.sessions + ' session(s) at ' + row.code + ' with ' +
                   pct(row.cell.accuracy) + ' — a few more and it counts as mastered.');
      } else {
        tag = T('挑战', 'try next');
        text = T('还没在 ' + row.code + ' 练过，可以试试。',
                 'Not played at ' + row.code + ' yet — worth a try.');
      }
      html.push('<li class="pf-nrow">' +
        '<span class="pf-tag pf-tag-' + (row.kind === 'done' ? 'done' :
          (row.kind === 'firm' ? 'firm' : 'new')) + '">' + esc(tag) + '</span>' +
        '<b>' + esc(row.gene.label) + '</b>' +
        '<span>' + esc(text) + '</span></li>');
    });
    html.push('</ul></div>');
    return html.join('');
  }

  function metaHtml(result) {
    var t = result.totals, s = result.skipped;
    var lines = [];

    lines.push(esc(T('读取记录 ', 'Read ')) + '<code>' + t.used + '/' + t.records +
      '</code>' + esc(T(' 条，来自 ', ' records from ')) + '<code>' + t.gameCount +
      '</code>' + esc(T(' 个游戏，最近一次 ', ' game(s); last played ')) +
      '<code>' + esc(dateStr(t.lastTs)) + '</code>');

    // Per-runtime raw sums, each with its own unit. Deliberately NOT totalled.
    var rts = Object.keys(t.byRuntime);
    if (rts.length) {
      lines.push(esc(T('分运行时（单位不同，不可相加）：',
                       'By runtime (different units, never summed): ')) +
        rts.map(function (rt) {
          var u = runtimeUnit(rt);
          var rb = t.byRuntime[rt];
          // Sessions first, then the raw sum WITH its unit attached, so the two
          // counts can never be read as the same quantity ("9/15 次 · 2 次").
          return '<code>' + esc(u.label + ' ' + rb.sessions +
            T(' 次 · ', ' sessions · ')) + rb.score + '/' + rb.total + ' ' +
            esc(u.unit) + '</code>';
        }).join(' '));
    }

    var dropped = [];
    if (s.noGene)      dropped.push(T('无基因 ' + s.noGene, s.noGene + ' no gene'));
    if (s.noTotal)     dropped.push(T('无题量 ' + s.noTotal, s.noTotal + ' no total'));
    if (s.otherProfile) dropped.push(T('其他档案 ' + s.otherProfile,
                                       s.otherProfile + ' other profile'));
    if (s.unreadable)  dropped.push(T('读不出 ' + s.unreadable, s.unreadable + ' unreadable'));
    if (s.notARecord)  dropped.push(T('格式不对 ' + s.notARecord,
                                      s.notARecord + ' malformed'));
    lines.push(esc(T('跳过：', 'Skipped: ')) +
      (dropped.length ? esc(dropped.join(' · ')) : esc(T('无', 'none'))));

    if (t.legacyNoProfile) {
      lines.push(esc(T('其中 ' + t.legacyNoProfile +
          ' 条记录早于档案机制，没有 profileId，按本机记录保留。',
        t.legacyNoProfile + ' record(s) predate the profile stamp and carry no ' +
          'profileId; they are kept as this device\'s own history.')));
    }

    lines.push(esc(T('档案 ', 'Profile ')) + '<code>' +
      esc(result.profileId || T('（未创建）', '(none)')) + '</code>' +
      esc(T('，仅存本机。', ' — stored on this device only.')));

    if (state.labels) {
      lines.push(esc(T('名称登记表 ', 'Name registry ')) + '<code>rootgene.json ' +
        esc(state.registryVersion || '?') + '</code>');
    } else {
      lines.push(esc(T('名称登记表未加载（' + (state.registryError || '?') +
          '），基因名由 ID 推导，数据不受影响。',
        'Name registry not loaded (' + (state.registryError || '?') +
          '); gene names are derived from their ids. The data is unaffected.')));
    }

    var unknown = result.genes.filter(function (g) { return !g.known; });
    if (state.labels && unknown.length) {
      lines.push(esc(T('有 ' + unknown.length +
          ' 个基因尚未登记名称，已按 ID 显示（这不是错误）。',
        unknown.length + ' gene(s) are not in the registry yet and are shown ' +
          'by id — not an error.')));
    }

    return '<div class="pf-card"><div class="pf-meta">' +
      lines.map(function (l) { return '<div>' + l + '</div>'; }).join('') +
      '</div></div>';
  }

  function emptyHtml() {
    return '<div class="pf-card"><div class="pf-empty">' +
      '<div class="pf-empty-ico">🧭</div>' +
      '<div class="pf-h2">' + esc(T('还没有可画的记录', 'Nothing to chart yet')) + '</div>' +
      '<p class="pf-note">' + esc(T(
        '玩过任意一个单元之后，这里就会出现你练到的根基因和等级。记录只存在这台设备上。',
        'Play any unit and the rootGenes and grades you exercised will appear here. ' +
          'Records live on this device only.')) + '</p>' +
      '<div class="pf-links">' +
      '<a href="../learning/index.html">' + esc(T('数学启智', 'Learning')) + '</a>' +
      '<a href="../sprites/index.html">' + esc(T('思维小精灵', 'Mind Seeds')) + '</a>' +
      '<a href="../studio/index.html">' + esc(T('创意工作坊', 'Creative Workshop')) + '</a>' +
      '<a href="../chess/index.html">' + esc(T('棋类', 'Chess')) + '</a>' +
      '</div></div></div>';
  }

  // ── render ──────────────────────────────────────────────────

  function render() {
    var host = document.getElementById('pf-body');
    if (!host) return;

    if (!global.RadarReader) {
      host.innerHTML = '<div class="pf-card"><p class="pf-note">' +
        esc(T('radar-reader.js 没有加载，无法读取记录。',
              'radar-reader.js did not load, so no history can be read.')) +
        '</p></div>';
      return;
    }

    var result;
    try {
      result = global.RadarReader.read({
        geneLabels: state.labels,
        lang: isZh() ? 'zh' : 'en'
      });
    } catch (err) {
      host.innerHTML = '<div class="pf-card"><p class="pf-note">' +
        esc(T('读取记录时出错：', 'Failed to read history: ')) +
        esc((err && err.message) || err) + '</p></div>';
      return;
    }

    if (!result.genes.length) {
      // Still show the footer: "0 of 12 records had a gene id" is the single
      // most useful thing a developer can learn from an empty page.
      host.innerHTML = emptyHtml() +
        (result.totals.records ? metaHtml(result) : '');
      return;
    }

    host.innerHTML = summaryHtml(result) + chartHtml(result) +
      tableHtml(result) + nextHtml(result) + metaHtml(result);
  }

  // ── boot ────────────────────────────────────────────────────

  function boot() {
    if (global.shell && global.shell.gui && !mounted) {
      // No music on this page (there is nothing playing), so the shell is told
      // not to expect that button rather than us drawing a dead one.
      mounted = global.shell.gui.mountControls(document, { music: false });
    }
    render();
    // A language switch re-renders from the same data: the page holds no state.
    document.addEventListener('shell:langchange', render);
    // Another tab may have finished an activity while this page sat open.
    global.addEventListener('storage', function (e) {
      if (!e || !e.key || e.key.indexOf(':history:') < 0) return;
      render();
    });
  }

  function start() {
    loadRegistry().then(boot, boot);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})(typeof window !== 'undefined' ? window : this);
