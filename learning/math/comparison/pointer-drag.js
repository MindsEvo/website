'use strict';
/**
 * PointerDrag — lightweight drag-and-drop using PointerEvents API.
 *
 * Covers mouse, touch, and stylus uniformly. No external dependencies.
 *
 * Usage:
 *   PointerDrag.makeDraggable(el, { onEnd: function(el, zoneId) {} });
 *   PointerDrag.registerDropZone(el, 'zone-id');
 *   PointerDrag.unregisterAll();   // call when tearing down an activity
 */
var PointerDrag = (function () {

  var _zones  = [];   // [{ el, id }]
  var _active = null; // current drag state

  // ── Public ─────────────────────────────────────────────────────────────────

  function makeDraggable(el, handlers) {
    el.style.touchAction = 'none'; // prevent native scroll interfering

    el.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;       // ignore right/middle mouse
      e.preventDefault();
      e.stopPropagation();

      var rect = el.getBoundingClientRect();

      // Ghost: visual clone that follows the pointer
      var ghost = el.cloneNode(true);
      ghost.style.cssText =
        'position:fixed;pointer-events:none;z-index:9000;margin:0;' +
        'left:' + rect.left + 'px;top:' + rect.top + 'px;' +
        'width:' + rect.width + 'px;height:' + rect.height + 'px;' +
        'opacity:0.82;transform:scale(1.06);box-shadow:0 6px 20px rgba(0,0,0,0.18);' +
        'transition:none;border-radius:inherit;';
      document.body.appendChild(ghost);

      _active = {
        el:       el,
        ghost:    ghost,
        ox:       e.clientX - rect.left,   // pointer offset within element
        oy:       e.clientY - rect.top,
        handlers: handlers,
        zone:     null                      // currently hovered drop zone
      };

      el.style.opacity = '0.28';
      el.setPointerCapture(e.pointerId);

      if (handlers.onStart) handlers.onStart(el);
    });

    el.addEventListener('pointermove', function (e) {
      if (!_active || _active.el !== el) return;
      e.preventDefault();

      var gx = e.clientX - _active.ox;
      var gy = e.clientY - _active.oy;
      _active.ghost.style.left = gx + 'px';
      _active.ghost.style.top  = gy + 'px';

      // Find drop zone under pointer (ghost hidden so elementFromPoint works)
      _active.ghost.style.visibility = 'hidden';
      var under = document.elementFromPoint(e.clientX, e.clientY);
      _active.ghost.style.visibility = '';

      var newZone = _findZone(under);
      if (newZone !== _active.zone) {
        if (_active.zone) _active.zone.el.classList.remove('pd-hover');
        if (newZone)      newZone.el.classList.add('pd-hover');
        _active.zone = newZone;
      }
    });

    function _endDrag(e) {
      if (!_active || _active.el !== el) return;
      e.preventDefault();

      var zone = _active.zone;
      if (zone) zone.el.classList.remove('pd-hover');

      _active.ghost.remove();
      el.style.opacity = '';

      var zoneId   = zone ? zone.id : null;
      var handlers = _active.handlers;
      _active = null;

      if (handlers.onEnd) handlers.onEnd(el, zoneId);
    }

    el.addEventListener('pointerup',     _endDrag);
    el.addEventListener('pointercancel', function () {
      if (!_active || _active.el !== el) return;
      _active.ghost.remove();
      el.style.opacity = '';
      _active = null;
    });
  }

  function registerDropZone(el, id) {
    _zones.push({ el: el, id: id });
    el.classList.add('pd-dropzone');
  }

  function unregisterAll() {
    _zones.forEach(function (z) { z.el.classList.remove('pd-dropzone', 'pd-hover'); });
    _zones  = [];
    _active = null;
  }

  // ── Private ────────────────────────────────────────────────────────────────

  function _findZone(el) {
    while (el) {
      for (var i = 0; i < _zones.length; i++) {
        if (_zones[i].el === el || _zones[i].el.contains(el)) return _zones[i];
      }
      el = el.parentElement;
    }
    return null;
  }

  return {
    makeDraggable:    makeDraggable,
    registerDropZone: registerDropZone,
    unregisterAll:    unregisterAll
  };

}());
