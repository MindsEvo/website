'use strict';
/**
 * MatchRuntime — drag left-column items onto matching right-column slots.
 * First use case: animal → home of same size (big/medium/small).
 */
var MatchRuntime = (function () {

  var _styled = false;
  function _injectStyles() {
    if (_styled) return;
    _styled = true;
    IH.injectStyles();
    var s = document.createElement('style');
    s.textContent = [
      '.mr{position:fixed;inset:0;background:var(--s1-bg,#eff6ff);z-index:500;display:flex;flex-direction:column;font-family:inherit;}',
      '.mr-instr{text-align:center;font-size:18px;font-weight:900;color:#1e3a8a;padding:12px 16px 6px;flex-shrink:0;}',
      // centered stage with fixed column widths so items never stretch full screen
      '.mr-stage{flex:1;display:flex;align-items:center;justify-content:center;gap:16px;padding:12px 20px;overflow:hidden;}',
      '.mr-col{display:flex;flex-direction:column;gap:10px;width:min(220px,42vw);}',
      '.mr-mid{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:10px;flex-shrink:0;}',
      '.mr-arrow{font-size:22px;color:#94a3b8;user-select:none;}',
      '.mr-item{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;cursor:grab;touch-action:none;user-select:none;transition:opacity .15s;}',
      '.mr-item.mr-placed{opacity:0.28;pointer-events:none;}',
      '.mr-item-emoji{font-size:42px;line-height:1;flex-shrink:0;}',
      '.mr-item-name{font-size:14px;font-weight:700;color:#334155;}',
      '.mr-slot{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:12px 8px;background:#f8fafc;border:2px dashed #cbd5e1;border-radius:16px;min-height:84px;transition:border-color .15s,background .15s;}',
      '.mr-slot.pd-hover{border-color:#3b82f6;background:#eff6ff;}',
      '.mr-slot.mr-filled{border-style:solid;border-color:#bfdbfe;background:#fff;}',
      '.mr-slot-emoji{font-size:40px;line-height:1;}',
      '.mr-slot-lbl{font-size:13px;font-weight:700;color:#64748b;text-align:center;}',
      '.mr-slot-guest{font-size:34px;line-height:1;margin-top:4px;}',
      '.mr-slot.mr-wrong{border-color:#ef4444!important;background:#fef2f2!important;animation:mr-shake .38s ease;}',
      '.mr-slot.mr-ok{border-color:#22c55e!important;background:#f0fdf4!important;}',
      '.mr-foot{text-align:center;font-size:13px;font-weight:700;color:#64748b;padding:8px 16px;flex-shrink:0;}',
      '@keyframes mr-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}60%{transform:translateX(5px)}}'
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
      leftItems:   variant.leftItems.slice(),
      rightSlots:  variant.rightSlots.slice(),
      // placements: rightSlotId → leftItemId | null
      placements:  {},
      moves:       0,
      corrections: 0,
      startTime:   Date.now(),
      done:        false
    };
    variant.rightSlots.forEach(function (r) { _st.placements[r.id] = null; });
    _buildUI();
  }

  function _buildUI() {
    var s = _st;
    var n = s.rightSlots.length;

    var root = document.createElement('div');
    root.className = 'mr';
    root.id = 'mr-root';
    root.innerHTML =
      '<div class="ih-hdr">' +
        '<button class="ih-back" id="mr-back">\u2b05\ufe0f</button>' +
        '<div class="ih-title">' +
          '<span class="zh">' + s.ctx.levelId + ' \u00b7 \u914d\u5bf9</span>' +
          '<span class="en">' + s.ctx.levelId + ' \u00b7 Match</span>' +
        '</div>' +
        IH.controlsHtml('mr') +
      '</div>' +
      '<div class="mr-instr">' +
        '<span class="zh">\u628a\u5c0f\u52a8\u7269\u62d6\u5230\u5b83\u5408\u9002\u7684\u5bb6 \u2192</span>' +
        '<span class="en">Drag each animal to the right home \u2192</span>' +
      '</div>' +
      '<div class="mr-stage">' +
        '<div class="mr-col" id="mr-left"></div>' +
        '<div class="mr-mid">' + Array(n).fill('<div class="mr-arrow">\u2192</div>').join('') + '</div>' +
        '<div class="mr-col" id="mr-right"></div>' +
      '</div>' +
      '<div class="mr-foot" id="mr-foot"></div>';

    document.body.appendChild(root);
    IH.wire('mr', { onReset: _reset });
    _applyLang();

    document.getElementById('mr-back').addEventListener('click', function () {
      var onBack = _st && _st.ctx.onBack;
      _tearDown();
      if (onBack) onBack();
    });

    // Build right slots (drop zones)
    var rightCol = document.getElementById('mr-right');
    s.rightSlots.forEach(function (slot) {
      var el = document.createElement('div');
      el.className = 'mr-slot';
      el.id = 'mr-rs-' + slot.id;
      el.innerHTML =
        '<div class="mr-slot-emoji">' + slot.emoji + '</div>' +
        '<div class="mr-slot-lbl"><span class="zh">' + slot.nameZh + '</span><span class="en">' + slot.nameEn + '</span></div>' +
        '<div class="mr-slot-guest" id="mr-rg-' + slot.id + '"></div>';
      rightCol.appendChild(el);
      PointerDrag.registerDropZone(el, 'slot:' + slot.id);
    });

    // Also register left column as "return" drop zone
    PointerDrag.registerDropZone(document.getElementById('mr-left'), 'left');

    _renderLeft();
    _updateFoot();

    document.addEventListener('shell:langchange', _applyLang);
  }

  function _renderLeft() {
    var leftCol = document.getElementById('mr-left');
    if (!leftCol) return;
    leftCol.innerHTML = '';
    _st.leftItems.forEach(function (item) {
      var placed = Object.values(_st.placements).indexOf(item.id) !== -1;
      var el = document.createElement('div');
      el.className = 'mr-item' + (placed ? ' mr-placed' : '');
      el.dataset.itemId = item.id;
      el.id = 'mr-li-' + item.id;
      el.innerHTML =
        '<div class="mr-item-emoji">' + item.emoji + '</div>' +
        '<div class="mr-item-name"><span class="zh">' + item.nameZh + '</span><span class="en">' + item.nameEn + '</span></div>';
      leftCol.appendChild(el);
      if (!placed) {
        PointerDrag.makeDraggable(el, {
          onEnd: function (dragEl, zoneId) { _handleDrop(item.id, zoneId); }
        });
      }
    });
    _applyLang(leftCol);
  }

  function _renderSlots() {
    _st.rightSlots.forEach(function (slot) {
      var guestEl = document.getElementById('mr-rg-' + slot.id);
      var slotEl  = document.getElementById('mr-rs-' + slot.id);
      if (!guestEl || !slotEl) return;
      var occupant = _st.placements[slot.id];
      slotEl.classList.toggle('mr-filled', !!occupant);
      if (occupant) {
        var item = _st.leftItems.filter(function (i) { return i.id === occupant; })[0];
        guestEl.textContent = item ? item.emoji : '';
        // Make the slot content draggable to allow re-dragging back
        PointerDrag.makeDraggable(slotEl, {
          onEnd: function (dragEl, zoneId) { _handleDrop(occupant, zoneId, 'slot:' + slot.id); }
        });
      } else {
        guestEl.textContent = '';
      }
    });
  }

  function _handleDrop(itemId, toZoneId, fromZoneId) {
    var s = _st;
    if (!toZoneId || toZoneId === fromZoneId) { _renderLeft(); _renderSlots(); return; }

    s.moves++;

    // Remove item from any current slot
    Object.keys(s.placements).forEach(function (rId) {
      if (s.placements[rId] === itemId) {
        s.placements[rId] = null;
        if (fromZoneId) s.corrections++;
      }
    });

    if (toZoneId !== 'left') {
      var targetSlotId = toZoneId.replace('slot:', '');
      var displaced = s.placements[targetSlotId];
      if (displaced) s.corrections++;
      s.placements[targetSlotId] = itemId;
    }

    _renderLeft();
    _renderSlots();
    _updateFoot();

    var filled = Object.values(s.placements).filter(function (v) { return v !== null; }).length;
    if (filled === s.rightSlots.length) setTimeout(_verify, 300);
  }

  function _updateFoot() {
    var filled = Object.values(_st.placements).filter(function (v) { return v !== null; }).length;
    var n = _st.rightSlots.length;
    var el = document.getElementById('mr-foot');
    if (!el) return;
    el.innerHTML = '<span class="zh">\u5df2\u914d ' + filled + '/' + n + '</span><span class="en">' + filled + '/' + n + ' matched</span>';
    _applyLang(el);
  }

  function _verify() {
    var s = _st;
    if (s.done) return;
    var correct = true;
    var wrongSlotIds = [];
    s.rightSlots.forEach(function (slot) {
      var leftId = s.placements[slot.id];
      var leftItem = s.leftItems.filter(function (i) { return i.id === leftId; })[0];
      if (!leftItem || leftItem.size !== slot.size) {
        correct = false; wrongSlotIds.push(slot.id);
      }
    });

    if (correct) {
      s.done = true;
      s.rightSlots.forEach(function (slot) {
        var el = document.getElementById('mr-rs-' + slot.id);
        if (el) el.classList.add('mr-ok');
      });
      if (shell.audio) shell.audio.sfx('win');
      shell.speak(shell.lang === 'zh' ? '太棒了！全部配对正确！' : 'Excellent! All matched correctly!');
      var attempt = {
        templateId: s.template.id, variantId: s.variant.variantId || '',
        mode: 'match', result: 'correct', responseMs: Date.now() - s.startTime,
        process: { moves: s.moves, corrections: s.corrections }
      };
      var onComplete = s.ctx.onComplete;
      setTimeout(function () { _tearDown(); onComplete(attempt); }, 1100);
    } else {
      wrongSlotIds.forEach(function (id) {
        var el = document.getElementById('mr-rs-' + id);
        if (el) { el.classList.add('mr-wrong'); setTimeout(function () { el.classList.remove('mr-wrong'); }, 500); }
      });
      if (shell.audio) shell.audio.sfx('wrong');
      shell.speak(shell.lang === 'zh' ? '再看看，试着换一换。' : 'Take another look and try swapping.');
    }
  }

  function _applyLang(el) {
    if (!el || el.type) el = null;
    var root = el || document.getElementById('mr-root');
    if (!root || !root.querySelectorAll) return;
    var l = shell.lang || 'zh';
    root.querySelectorAll('.zh').forEach(function (n) { n.style.display = l === 'zh' ? '' : 'none'; });
    root.querySelectorAll('.en').forEach(function (n) { n.style.display = l === 'en' ? '' : 'none'; });
  }

  function _reset() {
    if (!_st || _st.done) return;
    _st.placements = {};
    _st.rightSlots.forEach(function (r) { _st.placements[r.id] = null; });
    _renderLeft();
    _renderSlots();
    _updateFoot();
  }

  function _tearDown() {
    PointerDrag.unregisterAll();
    document.removeEventListener('shell:langchange', _applyLang);
    var root = document.getElementById('mr-root');
    if (root) root.remove();
    _st = null;
  }

  return { run: run };
}());
