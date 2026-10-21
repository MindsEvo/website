'use strict';
/**
 * GridRuntime — a tap-to-eliminate logic grid.
 *
 * Rows are people, columns are things. The child taps a cell to cycle
 *   blank -> ❌ (cannot be) -> ✅ (is) -> blank
 * and the puzzle is solved when the ✅ cells are exactly the hidden solution.
 * A ✅ also greys out the rest of its row and column, which is the whole idea of
 * a logic grid: one fact rules out several others.
 *
 * Contract (same as the comparison runtimes):
 *   run(template, variant, ctx) — ctx.onComplete(attempt) / ctx.onBack()
 *   variant: { people: [{id,e,zh,en}], items: [{id,e,zh,en}], solution: [itemIndex...],
 *              clues: [[zh,en]...], instrZh, instrEn }
 *   attempt: { templateId, variantId, mode:'grid', result:'correct', responseMs,
 *              process: { taps, corrections } }
 */
var GridRuntime = (function () {

  var _st = null, _styled = false;

  function _injectStyles() {
    if (_styled) return;
    _styled = true;
    IH.injectStyles();
    var s = document.createElement('style');
    s.textContent = [
      '.lgr{position:fixed;inset:0;background:var(--s1-bg,#f5f3ff);z-index:500;display:flex;flex-direction:column;font-family:inherit;overflow:auto;}',
      '.lgr-instr{text-align:center;font-size:16px;font-weight:900;color:#4c1d95;padding:10px 16px 4px;}',
      '.lgr-body{display:flex;flex-direction:column;align-items:center;gap:12px;padding:8px 14px 16px;}',
      '.lgr-clues{display:grid;gap:6px;width:min(560px,100%);}',
      '.lgr-clue{display:flex;gap:8px;align-items:flex-start;background:#fff;border:2px solid #ddd6fe;border-radius:12px;padding:7px 10px;font-size:15px;font-weight:700;color:#1e293b;line-height:1.45;}',
      '.lgr-clue b{flex:0 0 auto;width:22px;height:22px;border-radius:50%;background:#7c3aed;color:#fff;font-size:12px;line-height:22px;text-align:center;}',
      '.lgr-table{border-collapse:separate;border-spacing:5px;background:#fff;border:2px solid #ddd6fe;border-radius:14px;padding:6px;}',
      '.lgr-h{min-width:62px;text-align:center;font-size:12px;font-weight:800;color:#475569;line-height:1.1;padding:2px;}',
      '.lgr-h .e{display:block;font-size:30px;line-height:1.1;}',
      '.lgr-cell{width:62px;height:56px;border-radius:12px;border:2px solid #ddd6fe;background:#faf5ff;font-size:28px;cursor:pointer;touch-action:manipulation;transition:background .12s,transform .12s;}',
      '.lgr-cell:active{transform:scale(.94);}',
      '.lgr-cell.no{background:#fee2e2;border-color:#fca5a5;}',
      '.lgr-cell.yes{background:#dcfce7;border-color:#4ade80;}',
      '.lgr-cell.only{border:2px dashed #16a34a;background:#f0fdf4;animation:lgr-pulse 1.2s ease-in-out infinite;}',
      '.lgr-cell.auto{background:#f1f5f9;border-color:#e2e8f0;color:#94a3b8;}',
      '.lgr-cell.wrong{animation:lgr-shake .38s ease;border-color:#ef4444;}',
      '.lgr-foot{text-align:center;font-size:13px;font-weight:700;color:#64748b;}',
      '.lgr-tip{width:min(560px,100%);box-sizing:border-box;text-align:center;font-size:14px;font-weight:800;color:#5b21b6;background:#faf5ff;border:2px solid #ddd6fe;border-radius:12px;padding:7px 12px;line-height:1.5;}',
      '.lgr-note{max-width:min(560px,100%);text-align:center;font-size:15px;font-weight:800;color:#4c1d95;background:#ede9fe;border-radius:12px;padding:8px 14px;}',
      'tr.lgr-need{outline:3px solid #f59e0b;outline-offset:2px;border-radius:10px;}',
      '.lgr-check{border:none;background:#7c3aed;color:#fff;font-size:16px;font-weight:900;padding:10px 26px;border-radius:999px;cursor:pointer;}',
      '@keyframes lgr-pulse{0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,.0)}50%{box-shadow:0 0 0 5px rgba(22,163,74,.25)}}',
      '@keyframes lgr-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}'
    ].join('');
    document.head.appendChild(s);
  }

  function run(template, variant, ctx) {
    _injectStyles();
    var np = variant.people.length, ni = variant.items.length, marks = [];
    for (var r = 0; r < np; r++) { marks.push([]); for (var c = 0; c < ni; c++) marks[r].push(0); }  // 0 blank, 1 no, 2 yes
    _st = { template: template, variant: variant, ctx: ctx, marks: marks, taps: 0, corrections: 0, startTime: Date.now(), done: false };
    _build();
  }

  function _head(x) {
    return '<th class="lgr-h">' + (x.e ? '<span class="e">' + x.e + '</span>' : '') + '<span class="zh">' + x.zh + '</span><span class="en">' + x.en + '</span></th>';
  }

  function _build() {
    var s = _st, v = s.variant;
    var root = document.createElement('div');
    root.className = 'lgr'; root.id = 'lgr-root';
    root.innerHTML =
      '<div class="ih-hdr"><button class="ih-back" id="lgr-back">⬅️</button>' +
        '<div class="ih-title"><span class="zh">' + s.ctx.levelId + ' · 逻辑表</span><span class="en">' + s.ctx.levelId + ' · Logic Grid</span></div>' +
        IH.controlsHtml('lgr') + '</div>' +
      '<div class="lgr-instr"><span class="zh">' + (v.instrZh || '') + '</span><span class="en">' + (v.instrEn || '') + '</span></div>' +
      '<div class="lgr-body">' +
        '<div class="lgr-clues">' + v.clues.map(function (c, i) {
          return '<div class="lgr-clue"><b>' + (i + 1) + '</b><span><span class="zh">' + c[0] + '</span><span class="en">' + c[1] + '</span></span></div>';
        }).join('') + '</div>' +
        '<div class="lgr-tip"><span class="zh">💡 先用「不喜欢」打 ❌，排除之后，剩下的就是「喜欢」，打 ✅。</span><span class="en">💡 Mark ❌ for what each one does not like. Rule those out, and what is left is what they like — mark ✅.</span></div>' +
        '<table class="lgr-table" id="lgr-table"></table>' +
        '<div class="lgr-foot"><span class="zh">点一下 ❌ 表示不是，再点一下 ✅ 表示就是，再点一下清除</span><span class="en">Tap once for ❌ (is not), again for ✅ (is), again to clear</span></div>' +
        '<div class="lgr-note" id="lgr-note" style="display:none"></div>' +
        '<button class="lgr-check" id="lgr-check"><span class="zh">检查</span><span class="en">Check</span></button>' +
      '</div>';
    document.body.appendChild(root);
    IH.wire('lgr', { onReset: _reset });
    document.getElementById('lgr-back').addEventListener('click', function () {
      var onBack = s.ctx.onBack; _tearDown(); if (onBack) onBack();
    });
    document.getElementById('lgr-check').addEventListener('click', _check);
    document.addEventListener('shell:langchange', _applyLang);
    _renderTable();
    _applyLang();
  }

  function _renderTable() {
    var s = _st, v = s.variant, t = document.getElementById('lgr-table');
    if (!t) return;
    var h = '<tr><th></th>' + v.items.map(_head).join('') + '</tr>';
    // a ✅ rules out the rest of its row and column: show those as greyed (display only)
    var rowYes = {}, colYes = {};
    s.marks.forEach(function (row, r) { row.forEach(function (m, c) { if (m === 2) { rowYes[r] = 1; colYes[c] = 1; } }); });
    // "only one left": every other cell of this row (or column) is ❌ -> the last one must be ✅
    var onlyLeft = {};
    v.people.forEach(function (p, r) {
      if (rowYes[r]) return;
      var open = []; s.marks[r].forEach(function (m, c) { if (m !== 1 && !colYes[c]) open.push(c); });
      if (open.length === 1) onlyLeft[r + ',' + open[0]] = 1;
    });
    v.items.forEach(function (it, c) {
      if (colYes[c]) return;
      var open = []; s.marks.forEach(function (row, r) { if (row[c] !== 1 && !rowYes[r]) open.push(r); });
      if (open.length === 1) onlyLeft[open[0] + ',' + c] = 1;
    });
    v.people.forEach(function (p, r) {
      h += '<tr>' + _head(p);
      v.items.forEach(function (it, c) {
        var m = s.marks[r][c], cls = m === 1 ? 'no' : m === 2 ? 'yes' : ((rowYes[r] || colYes[c]) ? 'auto' : (onlyLeft[r + ',' + c] ? 'only' : ''));
        h += '<td><button class="lgr-cell ' + cls + '" data-r="' + r + '" data-c="' + c + '">' + (m === 1 ? '❌' : m === 2 ? '✅' : (cls === 'auto' ? '·' : '')) + '</button></td>';
      });
      h += '</tr>';
    });
    t.innerHTML = h;
    Array.prototype.forEach.call(t.querySelectorAll('.lgr-cell'), function (b) {
      b.addEventListener('click', function () {
        if (s.done) return;
        var r = +b.getAttribute('data-r'), c = +b.getAttribute('data-c');
        s.marks[r][c] = (s.marks[r][c] + 1) % 3; s.taps++;
        var nt = document.getElementById('lgr-note'); if (nt) nt.style.display = 'none';
        _renderTable(); _applyLang();
      });
    });
    _applyLang();
  }

  function _check() {
    var s = _st; if (!s || s.done) return;
    var sol = s.variant.solution, wrongCells = [], missingRows = [];
    s.marks.forEach(function (row, r) {
      var hasYes = false;
      row.forEach(function (m, c) {
        var shouldYes = sol[r] === c;
        if (m === 2 && !shouldYes) wrongCells.push([r, c]);   // a ✅ on the wrong cell
        if (m === 1 && shouldYes) wrongCells.push([r, c]);    // a ❌ on the right cell
        if (m === 2 && shouldYes) hasYes = true;
      });
      if (!hasYes) missingRows.push(r);
    });
    if (!wrongCells.length && !missingRows.length) {
      s.done = true;
      if (shell.audio) shell.audio.sfx('win');
      shell.speak(shell.lang === 'zh' ? '全对了！' : 'All correct!');
      var attempt = { templateId: s.template.id, variantId: s.variant.variantId || '', mode: 'grid', result: 'correct',
        responseMs: Date.now() - s.startTime, process: { taps: s.taps, corrections: s.corrections } };
      var onComplete = s.ctx.onComplete;
      setTimeout(function () { _tearDown(); onComplete(attempt); }, 1100);
      return;
    }
    var zh = shell.lang === 'zh', msg;
    if (wrongCells.length) {
      s.corrections++;
      wrongCells.forEach(function (rc) {
        var b = document.querySelector('.lgr-cell[data-r="' + rc[0] + '"][data-c="' + rc[1] + '"]');
        if (b) { b.classList.add('wrong'); setTimeout(function () { b.classList.remove('wrong'); }, 500); }
      });
      if (shell.audio) shell.audio.sfx('wrong');
      msg = zh ? '有的格子标错了，对照线索再看看。' : 'Some cells are marked wrong — check them against the clues.';
    } else {
      // everything marked so far is right, but not every row has its ✅ yet
      missingRows.forEach(function (r) {
        var tr = document.querySelectorAll('#lgr-table tr')[r + 1];
        if (tr) { tr.classList.add('lgr-need'); setTimeout(function () { tr.classList.remove('lgr-need'); }, 1200); }
      });
      msg = zh ? '目前标的都对！还没完成：每一行都要有一个 ✅，用排除法找出来。' : 'Everything so far is right! Not done yet: every row needs a ✅ — rule it out to find it.';
    }
    var note = document.getElementById('lgr-note');
    if (note) { note.textContent = msg; note.style.display = ''; }
    shell.speak(msg);
  }

  function _reset() {
    if (!_st || _st.done) return;
    _st.marks.forEach(function (row) { for (var c = 0; c < row.length; c++) row[c] = 0; });
    _renderTable();
  }

  function _applyLang() {
    var root = document.getElementById('lgr-root'); if (!root) return;
    var l = shell.lang || 'zh';
    root.querySelectorAll('.zh').forEach(function (n) { n.style.display = l === 'zh' ? '' : 'none'; });
    root.querySelectorAll('.en').forEach(function (n) { n.style.display = l === 'en' ? '' : 'none'; });
  }

  function _tearDown() {
    document.removeEventListener('shell:langchange', _applyLang);
    var root = document.getElementById('lgr-root'); if (root) root.remove();
    _st = null;
  }

  return { run: run };
})();
