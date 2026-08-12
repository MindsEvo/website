'use strict';
/**
 * GroupRuntime — drag items into two classification bins.
 * First use case: sort mixed items into "big" and "small" baskets.
 */
var GroupRuntime = (function () {

  var _styled = false;
  function _injectStyles() {
    if (_styled) return;
    _styled = true;
    IH.injectStyles();
    var s = document.createElement('style');
    s.textContent = [
      '.gr{position:fixed;inset:0;background:var(--s1-bg,#eff6ff);z-index:500;display:flex;flex-direction:column;font-family:inherit;}',
      '.gr-instr{text-align:center;font-size:17px;font-weight:900;color:#1e3a8a;padding:10px 16px 4px;flex-shrink:0;}',
      // stage: centered, items pool + bins constrained to max-width
      '.gr-stage{flex:1;display:flex;flex-direction:column;align-items:center;gap:10px;padding:6px 16px 10px;overflow:hidden;}',
      '.gr-pool{width:min(680px,100%);background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:10px;display:flex;flex-wrap:wrap;gap:8px;min-height:66px;flex-shrink:0;}',
      '.gr-pool-lbl{width:100%;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px;}',
      '.gr-item{display:flex;align-items:center;gap:6px;padding:8px 10px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;cursor:grab;touch-action:none;user-select:none;transition:opacity .15s;}',
      '.gr-item-emoji{font-size:28px;line-height:1;}',
      '.gr-item-name{font-size:12px;font-weight:700;color:#475569;}',
      // bins: max-width so they do not fill the entire screen
      '.gr-bins{display:flex;gap:12px;width:min(680px,100%);flex-shrink:0;}',
      '.gr-bin{flex:1;background:#f8fafc;border:2px dashed #cbd5e1;border-radius:18px;display:flex;flex-direction:column;align-items:center;padding:14px 10px 10px;gap:8px;min-height:160px;max-height:260px;transition:border-color .15s,background .15s;}',
      '.gr-bin.pd-hover{border-color:#3b82f6;background:#eff6ff;}',
      '.gr-bin.gr-has-items{border-style:solid;border-color:#bfdbfe;background:#fff;}',
      '.gr-bin-lbl{font-size:18px;font-weight:900;color:#1e3a8a;display:flex;align-items:center;gap:6px;}',
      '.gr-bin-icon{font-size:34px;line-height:1;}',
      '.gr-bin-items{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;}',
      '.gr-bin.gr-wrong{border-color:#ef4444!important;background:#fef2f2!important;animation:gr-shake .38s ease;}',
      '.gr-bin.gr-ok{border-color:#22c55e!important;background:#f0fdf4!important;}',
      '.gr-foot{text-align:center;font-size:13px;font-weight:700;color:#64748b;padding:6px 16px;flex-shrink:0;}',
      '@keyframes gr-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}60%{transform:translateX(5px)}}'
    ].join('');
    document.head.appendChild(s);
  }

  var _st = null;

  function run(template, variant, ctx) {
    _injectStyles();
    PointerDrag.unregisterAll();
    _st = {
      template:    template,
      variant:     variant,
      ctx:         ctx,
      allItems:    variant.items.slice(),
      bins:        variant.bins.slice(),
      // bin contents: { binId: [itemIds] }
      binContents: {},
      pool:        variant.items.map(function (i) { return i.id; }),
      moves:       0,
      corrections: 0,   // items sent back out of a wrong bin
      startTime:   Date.now(),
      done:        false
    };
    variant.bins.forEach(function (b) { _st.binContents[b.id] = []; });
    _buildUI();
  }

  function _buildUI() {
    var s = _st;

    var root = document.createElement('div');
    root.className = 'gr';
    root.id = 'gr-root';
    root.innerHTML =
      '<div class="ih-hdr">' +
        '<button class="ih-back" id="gr-back">\u2b05\ufe0f</button>' +
        '<div class="ih-title">' +
          '<span class="zh">' + s.ctx.levelId + ' \u00b7 \u5206\u7c7b</span>' +
          '<span class="en">' + s.ctx.levelId + ' \u00b7 Sort into Groups</span>' +
        '</div>' +
        IH.controlsHtml('gr') +
      '</div>' +
      '<div class="gr-instr">' +
        '<span class="zh">' + (s.variant.hintZh || '\u628a\u5927\u7684\u653e\u8fdb\u5927\u7b50\uff0c\u5c0f\u7684\u653e\u8fdb\u5c0f\u7b50') + '</span>' +
        '<span class="en">' + (s.variant.hintEn || 'Sort items into the correct baskets') + '</span>' +
      '</div>' +
      '<div class="gr-stage">' +
        '<div class="gr-pool" id="gr-pool">' +
          '<div class="gr-pool-lbl"><span class="zh">\u62d6\u52a8\u5230\u5bf9\u5e94\u7684\u7b50\u5b50</span><span class="en">Drag to the right basket</span></div>' +
        '</div>' +
        '<div class="gr-bins" id="gr-bins"></div>' +
      '</div>' +
      '<div class="gr-foot" id="gr-foot"></div>';

    document.body.appendChild(root);
    IH.wire('gr', { onReset: _reset });
    _applyLang();

    document.getElementById('gr-back').addEventListener('click', function () {
      var onBack = _st && _st.ctx.onBack;
      _tearDown();
      if (onBack) onBack();
    });

    // Build bins
    var binsEl = document.getElementById('gr-bins');
    s.bins.forEach(function (bin) {
      var el = document.createElement('div');
      el.className = 'gr-bin';
      el.id = 'gr-bin-' + bin.id;
      el.innerHTML =
        '<div class="gr-bin-lbl">' +
          '<span class="gr-bin-icon">' + bin.emoji + '</span>' +
          '<span class="zh">' + bin.labelZh + '</span>' +
          '<span class="en">' + bin.labelEn + '</span>' +
        '</div>' +
        '<div class="gr-bin-items" id="gr-bi-' + bin.id + '"></div>';
      binsEl.appendChild(el);
      PointerDrag.registerDropZone(el, 'bin:' + bin.id);
    });

    // Register pool as return drop zone
    PointerDrag.registerDropZone(document.getElementById('gr-pool'), 'pool');

    _renderPool();
    _updateFoot();
    document.addEventListener('shell:langchange', _applyLang);
  }

  function _renderPool() {
    var poolEl = document.getElementById('gr-pool');
    if (!poolEl) return;
    // Remove existing item chips (keep label)
    var chips = poolEl.querySelectorAll('.gr-item');
    chips.forEach(function (c) { c.remove(); });

    _st.pool.forEach(function (itemId) {
      var item = _itemById(itemId);
      if (!item) return;
      var el = _makeChip(item, 'pool');
      poolEl.appendChild(el);
    });
    _applyLang(poolEl);
  }

  function _renderBins() {
    var s = _st;
    s.bins.forEach(function (bin) {
      var itemsEl = document.getElementById('gr-bi-' + bin.id);
      var binEl   = document.getElementById('gr-bin-' + bin.id);
      if (!itemsEl || !binEl) return;
      itemsEl.innerHTML = '';
      binEl.classList.toggle('gr-has-items', s.binContents[bin.id].length > 0);
      s.binContents[bin.id].forEach(function (itemId) {
        var item = _itemById(itemId);
        if (!item) return;
        var chip = _makeChip(item, 'bin:' + bin.id);
        itemsEl.appendChild(chip);
      });
    });
  }

  function _makeChip(item, fromZoneId) {
    var el = document.createElement('div');
    el.className = 'gr-item';
    el.dataset.itemId = item.id;
    el.innerHTML =
      '<div class="gr-item-emoji">' + item.emoji + '</div>' +
      '<div class="gr-item-name"><span class="zh">' + item.nameZh + '</span><span class="en">' + item.nameEn + '</span></div>';
    PointerDrag.makeDraggable(el, {
      onEnd: function (dragEl, toZoneId) { _handleDrop(item.id, fromZoneId, toZoneId); }
    });
    _applyLang(el);
    return el;
  }

  function _handleDrop(itemId, fromZoneId, toZoneId) {
    var s = _st;
    if (!toZoneId || toZoneId === fromZoneId) { _renderPool(); _renderBins(); return; }

    s.moves++;

    // Remove from source
    if (fromZoneId === 'pool') {
      s.pool = s.pool.filter(function (id) { return id !== itemId; });
    } else {
      var srcBinId = fromZoneId.replace('bin:', '');
      if (s.binContents[srcBinId]) {
        s.binContents[srcBinId] = s.binContents[srcBinId].filter(function (id) { return id !== itemId; });
      }
    }

    // Add to target
    if (toZoneId === 'pool') {
      if (s.pool.indexOf(itemId) === -1) s.pool.push(itemId);
    } else {
      var dstBinId = toZoneId.replace('bin:', '');
      if (s.binContents[dstBinId] && s.binContents[dstBinId].indexOf(itemId) === -1) {
        s.binContents[dstBinId].push(itemId);
      }
    }

    _renderPool();
    _renderBins();
    _updateFoot();

    // Verify when pool is empty
    if (s.pool.length === 0) setTimeout(_verify, 300);
  }

  function _updateFoot() {
    var s = _st;
    var total  = s.allItems.length;
    var placed = total - s.pool.length;
    var el = document.getElementById('gr-foot');
    if (!el) return;
    el.innerHTML = '<span class="zh">\u5df2\u5206\u7c7b ' + placed + '/' + total + '</span><span class="en">' + placed + '/' + total + ' sorted</span>';
    _applyLang(el);
  }

  function _verify() {
    var s = _st;
    if (s.done) return;

    var correct = true;
    var wrongBinIds = [];
    s.bins.forEach(function (bin) {
      var allCorrect = s.binContents[bin.id].every(function (itemId) {
        var item = _itemById(itemId);
        return item && item.bin === bin.id;
      });
      if (!allCorrect) { correct = false; wrongBinIds.push(bin.id); }
    });

    if (correct) {
      s.done = true;
      s.bins.forEach(function (b) {
        var el = document.getElementById('gr-bin-' + b.id);
        if (el) el.classList.add('gr-ok');
      });
      shell.speak(shell.lang === 'zh' ? '分对了！全部正确！' : 'Sorted correctly! Well done!');
      var attempt = {
        templateId: s.template.id, variantId: s.variant.variantId || '',
        mode: 'group', result: 'correct', responseMs: Date.now() - s.startTime,
        process: { moves: s.moves, corrections: s.corrections }
      };
      var onComplete = s.ctx.onComplete;
      setTimeout(function () { _tearDown(); onComplete(attempt); }, 1100);
    } else {
      wrongBinIds.forEach(function (id) {
        var el = document.getElementById('gr-bin-' + id);
        if (el) { el.classList.add('gr-wrong'); setTimeout(function () { el.classList.remove('gr-wrong'); }, 500); }
      });
      shell.speak(shell.lang === 'zh' ? '有些放错了，再检查一下。' : 'Some items are in the wrong basket. Try again.');
      // Move wrong items back to pool
      wrongBinIds.forEach(function (binId) {
        s.binContents[binId].forEach(function (itemId) {
          var item = _itemById(itemId);
          if (item && item.bin !== binId && s.pool.indexOf(itemId) === -1) {
            s.pool.push(itemId);
            s.corrections++;
          }
        });
        s.binContents[binId] = s.binContents[binId].filter(function (itemId) {
          var item = _itemById(itemId);
          return item && item.bin === binId;
        });
      });
      setTimeout(function () { _renderPool(); _renderBins(); _updateFoot(); }, 600);
    }
  }

  function _itemById(id) {
    return _st.allItems.filter(function (i) { return i.id === id; })[0] || null;
  }

  function _applyLang(el) {
    if (!el || el.type) el = null;
    var root = el || document.getElementById('gr-root');
    if (!root || !root.querySelectorAll) return;
    var l = shell.lang || 'zh';
    root.querySelectorAll('.zh').forEach(function (n) { n.style.display = l === 'zh' ? '' : 'none'; });
    root.querySelectorAll('.en').forEach(function (n) { n.style.display = l === 'en' ? '' : 'none'; });
  }

  function _reset() {
    if (!_st || _st.done) return;
    _st.pool = _st.allItems.map(function (i) { return i.id; });
    _st.bins.forEach(function (b) { _st.binContents[b.id] = []; });
    _renderPool();
    _renderBins();
    _updateFoot();
  }

  function _tearDown() {
    PointerDrag.unregisterAll();
    document.removeEventListener('shell:langchange', _applyLang);
    var root = document.getElementById('gr-root');
    if (root) root.remove();
    _st = null;
  }

  return { run: run };
}());
