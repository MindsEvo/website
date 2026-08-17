'use strict';
/**
 * SortRuntime — Drag-to-slot sorting activity.
 *
 * Entry point:
 *   SortRuntime.run(template, variant, ctx)
 *
 * ctx = {
 *   levelId:    string,
 *   onComplete: function(attempt),   // called on correct answer
 *   onBack:     function()           // called on back button
 * }
 *
 * Attempt structure:
 * {
 *   templateId, variantId, mode:'sort', result:'correct',
 *   responseMs, process: { moves, corrections, finalOrder, targetOrder }
 * }
 *
 * A wrong order is not an outcome: the slots stay filled, the misplaced ones
 * shake, and the child keeps adjusting. onComplete only fires once solved, so
 * process.corrections is what carries the struggle signal.
 */

var SortRuntime = (function () {

  // ── Styles (injected once) ────────────────────────────────────────────────

  var _styled = false;
  function _injectStyles() {
    if (_styled) return;
    _styled = true;
    IH.injectStyles();
    var s = document.createElement('style');
    s.textContent = [
      // overlay fills the viewport above everything
      '.sr{position:fixed;inset:0;background:var(--s1-bg,#eff6ff);z-index:500;display:flex;flex-direction:column;font-family:inherit;}',
      // header reuses shell dark bar look
      '.sr-hdr{display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(7,18,37,0.92);backdrop-filter:blur(10px);flex-shrink:0;}',
      '.sr-hdr-back{background:none;border:none;color:#fff;font-size:22px;cursor:pointer;padding:4px 8px;line-height:1;border-radius:8px;}',
      '.sr-hdr-back:hover{background:rgba(255,255,255,0.12);}',
      '.sr-hdr-title{flex:1;font-size:15px;font-weight:800;color:#fff;}',
      // instruction
      '.sr-instr{text-align:center;font-size:18px;font-weight:900;color:#1e3a8a;padding:14px 16px 6px;flex-shrink:0;}',
      // stage: centered column, elements constrained to max-width so they never fill a wide screen
      '.sr-stage{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:0 18px 10px;overflow:hidden;}',
      '.sr-holding{width:min(680px,100%);background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;flex-shrink:0;}',
      '.sr-holding-lbl{font-size:11px;font-weight:700;color:#94a3b8;text-align:center;letter-spacing:.5px;text-transform:uppercase;}',
      '.sr-holding-items{display:flex;flex-direction:column;gap:6px;min-height:32px;}',
      '.sr-item{display:flex;align-items:center;padding:5px 6px;border-radius:10px;cursor:grab;touch-action:none;user-select:none;background:#f8fafc;border:1.5px solid #e2e8f0;transition:opacity .15s;}',
      '.sr-item:active{cursor:grabbing;}',
      '.sr-item-bar{height:26px;border-radius:999px;flex-shrink:0;}',
      '.sr-slots-wrap{width:min(680px,100%);flex-shrink:0;display:flex;flex-direction:column;gap:6px;}',
      '.sr-slots-arrow{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#64748b;flex-shrink:0;}',
      '.sr-slots-arrow .sr-line{flex:1;height:2px;background:#cbd5e1;border-radius:1px;}',
      '.sr-slots{display:flex;gap:8px;align-items:stretch;}',
      '.sr-slot{flex:1;min-height:70px;max-height:100px;background:#f8fafc;border:2px dashed #cbd5e1;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;transition:border-color .15s,background .15s;}',
      '.sr-slot.pd-hover{border-color:#3b82f6;background:#eff6ff;}',
      '.sr-slot.sr-filled{border-style:solid;border-color:#bfdbfe;background:#fff;}',
      '.sr-slot-num{position:absolute;top:4px;left:7px;font-size:10px;font-weight:800;color:#94a3b8;}',
      '.sr-slot-inner{width:100%;padding:4px 8px;display:flex;align-items:center;}',
      '.sr-slot-inner .sr-item{flex:1;margin:0;border:none;background:none;padding:3px 4px;}',
      '.sr-slot-inner .sr-item-bar{height:20px;}',
      // feedback states
      '.sr-slot.sr-wrong{border-color:#ef4444!important;background:#fef2f2!important;animation:sr-shake .38s ease;}',
      '.sr-slot.sr-ok{border-color:#22c55e!important;background:#f0fdf4!important;}',
      // progress
      '.sr-foot{text-align:center;font-size:13px;font-weight:700;color:#64748b;padding:8px 16px;flex-shrink:0;}',
      // keyframes
      '@keyframes sr-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}60%{transform:translateX(5px)}}',
      '@keyframes sr-pop{0%{transform:scale(1)}45%{transform:scale(1.07)}100%{transform:scale(1)}}',
      '.sr-pop{animation:sr-pop .4s ease;}'
    ].join('');
    document.head.appendChild(s);
  }

  // ── State ─────────────────────────────────────────────────────────────────

  var _st = null;  // { template, variant, ctx, items[], slots[], holding[], moves, corrections, startTime, done }

  // ── Entry ──────────────────────────────────────────────────────────────────

  function run(template, variant, ctx) {
    _injectStyles();
    PointerDrag.unregisterAll();
    _st = {
      template:    template,
      variant:     variant,
      ctx:         ctx,
      items:       variant.items.slice(),
      slots:       new Array(variant.items.length).fill(null), // slot-pos → itemId
      holding:     variant.items.map(function (i) { return i.id; }),
      moves:       0,
      corrections: 0,
      startTime:   Date.now(),
      done:        false
    };
    _buildUI();
  }

  // ── UI Construction ────────────────────────────────────────────────────────

  function _buildUI() {
    var s = _st;
    var n = s.items.length;
    var lang = shell.lang || 'zh';

    var root = document.createElement('div');
    root.className = 'sr';
    root.id = 'sr-root';

    // Header
    root.innerHTML =
      '<div class="ih-hdr">' +
        '<button class="ih-back" id="sr-back">\u2b05\ufe0f</button>' +
        '<div class="ih-title">' +
          '<span class="zh">' + s.ctx.levelId + ' \u00b7 \u6392\u5e8f</span>' +
          '<span class="en">' + s.ctx.levelId + ' \u00b7 Sort</span>' +
        '</div>' +
        IH.controlsHtml('sr') +
      '</div>' +
      '<div class="sr-instr">' +
        '<span class="zh">\u628a\u5f69\u5e26\u4ece\u6700\u77ed\u5230\u6700\u957f\u6392\u597d \u2193</span>' +
        '<span class="en">Sort ribbons shortest \u2192 longest \u2193</span>' +
      '</div>' +
      '<div class="sr-stage">' +
        '<div class="sr-holding">' +
          '<div class="sr-holding-lbl"><span class="zh">\u62d6\u52a8\u5f69\u5e26</span><span class="en">Drag ribbons</span></div>' +
          '<div class="sr-holding-items" id="sr-holding-items"></div>' +
        '</div>' +
        '<div class="sr-slots-wrap">' +
          '<div class="sr-slots-arrow">' +
            '<span class="zh">\u77ed</span><span class="en">Short</span>' +
            '<div class="sr-line"></div>' +
            '<span class="zh">\u957f</span><span class="en">Long</span>' +
          '</div>' +
          '<div class="sr-slots" id="sr-slots"></div>' +
        '</div>' +
      '</div>' +
      '<div class="sr-foot" id="sr-foot">' +
        '<span class="zh">\u5df2\u653e\u5165 0/' + n + '</span>' +
        '<span class="en">0/' + n + ' placed</span>' +
      '</div>';

    document.body.appendChild(root);
    IH.wire('sr', { onReset: _reset });
    _applyLang();

    // Build slots
    var slotsEl = document.getElementById('sr-slots');
    for (var i = 0; i < n; i++) {
      var slot = document.createElement('div');
      slot.className = 'sr-slot';
      slot.id = 'sr-sl-' + i;
      slot.dataset.pos = i;
      slot.innerHTML = '<div class="sr-slot-num">' + (i + 1) + '</div><div class="sr-slot-inner" id="sr-sc-' + i + '"></div>';
      slotsEl.appendChild(slot);
      PointerDrag.registerDropZone(slot, 'slot:' + i);
    }

    // Register holding area as drop zone
    var holdingItems = document.getElementById('sr-holding-items');
    PointerDrag.registerDropZone(holdingItems, 'holding');

    document.getElementById('sr-back').addEventListener('click', function () {
      var onBack = _st && _st.ctx.onBack;
      _tearDown();
      if (onBack) onBack();
    });

    // Initial items render
    _renderHolding();

    // React to lang changes
    document.addEventListener('shell:langchange', _applyLang);
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  function _renderHolding() {
    var el = document.getElementById('sr-holding-items');
    if (!el) return;
    el.innerHTML = '';
    _st.holding.forEach(function (id) {
      var item = _itemById(id);
      if (!item) return;
      el.appendChild(_makeItemEl(item, 'holding'));
    });
  }

  function _renderSlots() {
    var s = _st;
    s.slots.forEach(function (itemId, pos) {
      var slotEl  = document.getElementById('sr-sl-' + pos);
      var inner   = document.getElementById('sr-sc-' + pos);
      if (!slotEl || !inner) return;
      inner.innerHTML = '';
      slotEl.classList.toggle('sr-filled', !!itemId);
      if (itemId) {
        var item = _itemById(itemId);
        if (item) inner.appendChild(_makeItemEl(item, 'slot:' + pos));
      }
    });
  }

  function _makeItemEl(item, zoneId) {
    var el = document.createElement('div');
    el.className = 'sr-item';
    el.dataset.itemId = item.id;
    var bar = document.createElement('div');
    bar.className = 'sr-item-bar';
    bar.style.width = item.lengthPct + '%';
    bar.style.background = item.color;
    el.appendChild(bar);
    PointerDrag.makeDraggable(el, {
      onEnd: function (dragEl, dropZoneId) {
        _handleDrop(item.id, zoneId, dropZoneId);
      }
    });
    return el;
  }

  function _updateFoot() {
    var filled = _st.slots.filter(function (id) { return id !== null; }).length;
    var n = _st.items.length;
    var el = document.getElementById('sr-foot');
    if (!el) return;
    el.innerHTML =
      '<span class="zh">\u5df2\u653e\u5165 ' + filled + '/' + n + '</span>' +
      '<span class="en">' + filled + '/' + n + ' placed</span>';
    _applyLang(el);
  }

  // ── Drag logic ─────────────────────────────────────────────────────────────

  function _handleDrop(itemId, fromZoneId, toZoneId) {
    var s = _st;
    if (!toZoneId || toZoneId === fromZoneId) {
      // Dropped back on same zone or outside — redraw and return
      _renderHolding(); _renderSlots(); return;
    }

    s.moves++;

    if (toZoneId === 'holding') {
      // Slot → holding
      var fp = parseInt(fromZoneId.split(':')[1]);
      s.slots[fp] = null;
      if (s.holding.indexOf(itemId) === -1) s.holding.push(itemId);
      s.corrections++;
    } else {
      // * → slot
      var tp = parseInt(toZoneId.split(':')[1]);
      var displaced = s.slots[tp];  // item already in target slot

      // Remove from source
      if (fromZoneId === 'holding') {
        s.holding = s.holding.filter(function (id) { return id !== itemId; });
      } else {
        var sfp = parseInt(fromZoneId.split(':')[1]);
        if (sfp !== tp) {
          s.slots[sfp] = null;
          s.corrections++;
        }
      }

      // Displace existing item to holding
      if (displaced) {
        s.holding.push(displaced);
        s.corrections++;
      }

      s.slots[tp] = itemId;
    }

    _renderHolding();
    _renderSlots();
    _updateFoot();

    // Auto-verify when all slots filled
    if (s.slots.every(function (id) { return id !== null; })) {
      setTimeout(_verify, 320);
    }
  }

  // ── Verification ──────────────────────────────────────────────────────────

  function _verify() {
    var s = _st;
    if (s.done) return;
    var finalOrder  = s.slots.slice();
    var targetOrder = s.variant.targetOrder;
    var correct = finalOrder.every(function (id, i) { return id === targetOrder[i]; });
    if (correct) {
      s.done = true;
      _onSuccess(finalOrder, targetOrder);
    } else {
      _onWrong(finalOrder, targetOrder);
    }
  }

  function _onSuccess(finalOrder, targetOrder) {
    var s = _st;
    // Green flash on all slots
    for (var i = 0; i < s.slots.length; i++) {
      var slotEl = document.getElementById('sr-sl-' + i);
      if (slotEl) { slotEl.classList.add('sr-ok', 'sr-pop'); }
    }
    if (shell.audio) shell.audio.sfx('win');
    shell.speak(shell.lang === 'zh' ? '太棒了！排对了！' : 'Excellent! Correct order!');

    var attempt = {
      templateId:  s.template.id,
      variantId:   s.variant.variantId || '',
      mode:        'sort',
      result:      'correct',
      responseMs:  Date.now() - s.startTime,
      process: {
        moves:       s.moves,
        corrections: s.corrections,
        finalOrder:  finalOrder,
        targetOrder: targetOrder
      }
    };

    var onComplete = s.ctx.onComplete;
    setTimeout(function () {
      _tearDown();
      onComplete(attempt);
    }, 1100);
  }

  function _onWrong(finalOrder, targetOrder) {
    var s = _st;
    // Shake only the incorrectly placed slots
    for (var i = 0; i < s.slots.length; i++) {
      if (s.slots[i] !== targetOrder[i]) {
        var slotEl = document.getElementById('sr-sl-' + i);
        if (slotEl) {
          slotEl.classList.add('sr-wrong');
          (function (el) {
            setTimeout(function () { el.classList.remove('sr-wrong'); }, 500);
          })(slotEl);
        }
      }
    }
    if (shell.audio) shell.audio.sfx('wrong');
    shell.speak(shell.lang === 'zh' ? '再看看，试着调整一下。' : 'Take another look and try adjusting.');
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function _itemById(id) {
    return _st.items.filter(function (it) { return it.id === id; })[0] || null;
  }

  function _applyLang(el) {
    if (!el || el.type) el = null;  // guard: called as event listener passes Event, not element
    var root = el || document.getElementById('sr-root');
    if (!root || !root.querySelectorAll) return;
    var lang = shell.lang || 'zh';
    root.querySelectorAll('.zh').forEach(function (n) { n.style.display = lang === 'zh' ? '' : 'none'; });
    root.querySelectorAll('.en').forEach(function (n) { n.style.display = lang === 'en' ? '' : 'none'; });
  }

  function _reset() {
    if (!_st || _st.done) return;
    _st.slots   = new Array(_st.items.length).fill(null);
    _st.holding = _st.variant.items.map(function (i) { return i.id; });
    _renderHolding();
    _renderSlots();
    _updateFoot();
  }

  function _tearDown() {
    PointerDrag.unregisterAll();
    document.removeEventListener('shell:langchange', _applyLang);
    var root = document.getElementById('sr-root');
    if (root) root.remove();
    _st = null;
  }

  return { run: run };

}());
