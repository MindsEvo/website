const qs = {
  server: document.getElementById("server-input"),
  gameFilter: document.getElementById("game-filter"),
  geneFilter: document.getElementById("gene-filter"),
  gameOptions: document.getElementById("game-options"),
  geneOptions: document.getElementById("gene-options"),
  refresh: document.getElementById("refresh-btn"),
  kpiGrid: document.getElementById("kpi-grid"),
  overviewBody: document.getElementById("overview-body"),
  trendChart: document.getElementById("trend-chart"),
  trendStrip: document.getElementById("trend-strip"),
  recommendGrid: document.getElementById("recommend-grid"),
  log: document.getElementById("log"),
};

function logLine(msg) {
  const now = new Date().toISOString();
  qs.log.textContent += `[${now}] ${msg}\n`;
  qs.log.scrollTop = qs.log.scrollHeight;
}

function fmtPct(v) {
  return Number.isFinite(v) ? `${Math.round(v * 100)}%` : "-";
}

function fmtMs(v) {
  return Number.isFinite(v) ? `${Math.round(v)}ms` : "-";
}

function safeText(text) {
  return String(text || "").replace(/[&<>"']/g, (ch) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
  });
}

async function fetchJson(base, path) {
  const url = `${base.replace(/\/$/, "")}${path}`;
  logLine(`GET ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

function buildQuery(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && String(value).trim()) {
      sp.set(key, String(value).trim());
    }
  });
  const text = sp.toString();
  return text ? `?${text}` : "";
}

function renderKpis(overview) {
  const byGame = Array.isArray(overview.byGame) ? overview.byGame : [];
  const sessions = byGame.reduce((sum, g) => sum + (Number(g.sessions) || 0), 0);
  const weightedAcc = byGame.reduce((sum, g) => sum + (Number(g.avgAccuracy) || 0) * (Number(g.sessions) || 0), 0);
  const weightedScore = byGame.reduce((sum, g) => sum + (Number(g.avgScore) || 0) * (Number(g.sessions) || 0), 0);
  const avgAcc = sessions ? weightedAcc / sessions : null;
  const avgScore = sessions ? weightedScore / sessions : null;

  const cards = [
    { title: "Sampled Sessions", value: String(overview.sampledSessions || 0) },
    { title: "Active Games", value: String(byGame.length) },
    { title: "Weighted Accuracy", value: fmtPct(avgAcc) },
    { title: "Weighted Score", value: Number.isFinite(avgScore) ? String(Math.round(avgScore)) : "-" },
    { title: "Game Scope", value: (overview.scope && overview.scope.gameKey) || "ALL" },
    { title: "Gene Scope", value: (overview.scope && overview.scope.geneId) || "ALL" },
  ];

  qs.kpiGrid.innerHTML = cards
    .map((c) => `<article class="kpi-card"><h3>${safeText(c.title)}</h3><p>${safeText(c.value)}</p></article>`)
    .join("");
}

function renderOverview(overview) {
  const rows = Array.isArray(overview.byGame) ? overview.byGame : [];
  qs.overviewBody.innerHTML = rows
    .map((row) => {
      const genes = (row.topGenes || []).map((g) => `${g.geneId} (${g.sessions})`).join(", ");
      return `
        <tr>
          <td>${safeText(row.titleZh || row.gameKey)}</td>
          <td>${safeText(row.sessions)}</td>
          <td>${safeText(fmtPct(row.avgAccuracy))}</td>
          <td>${safeText(Number.isFinite(row.avgScore) ? Math.round(row.avgScore) : "-")}</td>
          <td>${safeText(fmtMs(row.avgResponseMs))}</td>
          <td>${safeText(genes || "-")}</td>
        </tr>
      `;
    })
    .join("");
}

function renderTrend(overview) {
  const items = Array.isArray(overview.dailyTrend) ? overview.dailyTrend : [];
  const maxScore = items.reduce((max, item) => Math.max(max, Number(item.avgScore) || 0), 0);

  qs.trendChart.innerHTML = items.length
    ? items
        .map((item) => {
          const score = Number(item.avgScore) || 0;
          const height = maxScore > 0 ? Math.max(12, Math.round((score / maxScore) * 124)) : 12;
          return `
            <article class="trend-bar">
              <div class="trend-bar-metric">${safeText(fmtPct(item.avgAccuracy))}</div>
              <div class="trend-bar-track">
                <div class="trend-bar-fill" style="height:${height}px"></div>
              </div>
              <div class="trend-bar-label">${safeText(item.day)}</div>
            </article>
          `;
        })
        .join("")
    : '<div class="trend-chart-empty">No trend data for current filter.</div>';

  qs.trendStrip.innerHTML = items
    .map(
      (d) => `
      <article class="trend-item">
        <h4>${safeText(d.day)}</h4>
        <p>Sessions: ${safeText(d.sessions)}</p>
        <p>Accuracy: ${safeText(fmtPct(d.avgAccuracy))}</p>
        <p>Score: ${safeText(Number.isFinite(d.avgScore) ? Math.round(d.avgScore) : "-")}</p>
      </article>
    `
    )
    .join("");
}

function renderRecommend(recommend) {
  const list = Array.isArray(recommend.recommendations) ? recommend.recommendations : [];
  qs.recommendGrid.innerHTML = list
    .map((item) => {
      const games = (item.targets && item.targets.games) || [];
      const lessons = (item.targets && item.targets.lessons) || [];
      const videos = (item.targets && item.targets.videos) || [];
      const policy = item.policy || {};

      return `
      <article class="recommend-card">
        <h3>${safeText(item.geneId)}</h3>
        <div class="badges">
          <span class="badge warn">${safeText(policy.band || "unknown")}</span>
          <span class="badge">target ${safeText(policy.targetDifficulty || "-")}</span>
          <span class="badge">resolved ${safeText(policy.resolvedDifficulty || "-")}</span>
        </div>
        <p>${safeText(item.reason || policy.message || "")}</p>
        <strong>Games</strong>
        <ul class="list">${games.slice(0, 3).map((g) => `<li>${safeText(g.titleZh || g.id)}</li>`).join("") || "<li>-</li>"}</ul>
        <strong>Lessons</strong>
        <ul class="list">${lessons.slice(0, 3).map((l) => `<li>${safeText(l.titleZh || l.id)} (${safeText(l.difficulty || "-")})</li>`).join("") || "<li>-</li>"}</ul>
        <strong>Videos</strong>
        <ul class="list">${videos.slice(0, 2).map((v) => `<li>${safeText(v.titleZh || v.id)}</li>`).join("") || "<li>-</li>"}</ul>
      </article>
    `;
    })
    .join("");
}

function renderOptions(options) {
  const games = Array.isArray(options.games) ? options.games : [];
  const genes = Array.isArray(options.genes) ? options.genes : [];

  qs.gameOptions.innerHTML = games
    .map((game) => `<option value="${safeText(game.id)}">${safeText(game.titleZh || game.titleEn || game.id)}</option>`)
    .join("");

  qs.geneOptions.innerHTML = genes
    .map((gene) => `<option value="${safeText(gene.id)}">${safeText(gene.id)}</option>`)
    .join("");
}

async function loadOptions(base) {
  const options = await fetchJson(base, "/api/v1/history/catalog/options");
  renderOptions(options);
}

async function refreshAll() {
  const base = qs.server.value.trim() || "http://localhost:8787";
  const gameKey = qs.gameFilter.value.trim();
  const geneId = qs.geneFilter.value.trim();
  const overviewQuery = buildQuery({ limit: 1000, gameKey, geneId });
  const recommendQuery = buildQuery({ topN: 6, gameKey });
  try {
    logLine("Refreshing dashboard...");
    const [options, overview, recommend] = await Promise.all([
      fetchJson(base, "/api/v1/history/catalog/options"),
      fetchJson(base, `/api/v1/history/statistics/overview${overviewQuery}`),
      fetchJson(base, `/api/v1/history/recommend${recommendQuery}`),
    ]);

    renderOptions(options);
    renderKpis(overview);
    renderOverview(overview);
    renderTrend(overview);
    renderRecommend(recommend);
    logLine("Refresh done.");
  } catch (err) {
    logLine(`ERROR ${err.message}`);
    qs.recommendGrid.innerHTML = `<article class="recommend-card"><h3>Load failed</h3><p>${safeText(err.message)}</p></article>`;
  }
}

qs.refresh.addEventListener("click", refreshAll);
qs.gameFilter.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    refreshAll();
  }
});
qs.geneFilter.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    refreshAll();
  }
});
window.addEventListener("load", refreshAll);
