'use strict';
/**
 * Comparison Game  v2.0  (Adaptive Engine Edition)
 *
 * Integrates: engine.js (mastery/scheduler) + generator.js (question generators)
 * Communicates with shell.createGame via standard unit/question API.
 *
 * Session flow:
 *   1. Load templates-data.js (mirror of templates.json)
 *   2. User selects grade level (K1/K2/G1/G2)
 *   3. CmpEngine.getSessionTemplates() composes SESSION_SIZE templates
 *      (sessionPolicy: at most MAX_ACTIVITIES_PER_SESSION activities, last)
 *   4. _freshQuestion() builds each item, redrawing recently seen variants
 *   5. shell.createGame runs the single-choice batch, then ActivityRunner
 *      runs the activities one by one
 *   6. On each answer, CmpEngine.recordAttempt() updates state
 */

(function () {

  // ── Styles ─────────────────────────────────────────────────────────────────

  var styleEl = document.createElement('style');
  styleEl.id = 'cmp-shell-style';
  styleEl.textContent = [
    '.cq{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;}',
    '.cq-q{font-size:22px;font-weight:900;color:#1e3a8a;line-height:1.3;text-align:center;}',
    '.cq-hint{font-size:12px;color:#94a3b8;text-align:center;}',
    '.cq-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:400px;}',
    '.cq-cell{display:flex;flex-direction:column;align-items:center;gap:4px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:12px 8px;}',
    '.cq-emoji{line-height:1;text-align:center;}',
    '.cq-label{font-size:12px;font-weight:700;color:#64748b;}',
    '.cq-num{font-size:38px;font-weight:900;color:#1e293b;line-height:1;}',
    '.cq-bars{display:flex;flex-direction:column;gap:14px;width:100%;max-width:360px;}',
    '.cq-bar-row{display:flex;align-items:center;gap:10px;}',
    '.cq-bar-track{flex:1;height:16px;background:#e2e8f0;border-radius:999px;overflow:hidden;}',
    '.cq-bar-fill{height:100%;border-radius:999px;}',
    // Slot marker: the letter (and colour) that ties a scene item to its option.
    '.cq-slot{width:24px;height:24px;border-radius:8px;color:#fff;font-size:13px;font-weight:900;' +
      'display:flex;align-items:center;justify-content:center;line-height:1;flex:0 0 auto;}',
    '.cq-heights{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:end;width:100%;max-width:280px;}',
    '.cq-h-col{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;}',
    // Fixed-height track: the bar is sized in px against H_BAR_MAX, never in %,
    // because a % height inside an auto-height flex column does not resolve.
    '.cq-h-track{height:108px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;}',
    '.cq-h-bar{width:44px;border-radius:8px 8px 0 0;}',
    '.cq-h-emoji{font-size:28px;line-height:1;}',
    '.cq-dots-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:400px;}',
    '.cq-dots-cell{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:10px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;}',
    '.cq-dot-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;min-height:40px;}',
    '.cq-dot{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;}',
    '.cq-items{display:flex;gap:10px;justify-content:center;width:100%;max-width:380px;}',
    '.cq-item{display:flex;flex-direction:column;align-items:center;gap:6px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:10px 12px;}',
    // Default size only — _shapeSvg sets width/height inline whenever the size
    // carries meaning, and an inline style must be free to win over this.
    '.cq-shape-svg{width:52px;height:52px;}',
    // multi_attribute scene: two objects on ONE baseline inside a fixed-height
    // box, so the size difference is the only thing the eye has to judge.
    '.cq-ma-pair{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:end;width:100%;max-width:320px;}',
    '.cq-ma-cell{display:flex;flex-direction:column;align-items:center;gap:6px;}',
    '.cq-ma-box{height:100px;display:flex;align-items:flex-end;justify-content:center;}',
    // position scene: the reference sits at ONE shared left edge and each object
    // gets its own row, so both distances are drawn from the same start on the
    // same track (§6.6) and "closer" is just "the shorter dotted path".
    '.cq-scene{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:2px 6px;width:100%;max-width:380px;height:96px;padding:8px 12px 8px 8px;box-sizing:border-box;background:linear-gradient(180deg,#bfdbfe 0%,#eff6ff 100%);border-radius:14px;border:1.5px solid #dbeafe;}',
    '.cq-scene-ref{font-size:30px;line-height:1;text-align:center;}',
    '.cq-scene-rows{display:flex;flex-direction:column;gap:10px;}',
    // The track is the ruler. Its width is definite (flex row of definite width),
    // so the % below resolves — unlike a % height on an auto-height parent.
    '.cq-scene-track{position:relative;height:30px;}',
    '.cq-scene-path{position:absolute;left:0;top:50%;border-bottom:3px dotted #60a5fa;}',
    '.cq-scene-obj{position:absolute;top:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:3px;}',
    '.cq-scene-emoji{font-size:22px;line-height:1;}',
    '.cq-containers{display:grid;grid-template-columns:1fr 1fr;gap:16px;width:100%;max-width:340px;}',
    '.cq-container-cell{display:flex;flex-direction:column;align-items:center;gap:6px;}',
    '.cq-container-visual{width:52px;height:70px;border:2.5px solid #94a3b8;border-radius:6px;background:#f1f5f9;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;}',
    '.cq-fill{width:100%;border-radius:2px;background:linear-gradient(180deg,#7dd3fc,#2563eb);}',
    '.cq-container-label{font-size:12px;font-weight:700;color:#64748b;}',
    '.cq-opt{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:72px;padding:6px 4px;}',
    // Option pointer: the only thing a scene-backed option is allowed to show.
    '.cq-opt-ptr{width:40px;height:40px;border-radius:12px;color:#fff;font-size:20px;font-weight:900;' +
      'display:flex;align-items:center;justify-content:center;line-height:1;}',
    '.cq-opt-emoji{font-size:30px;line-height:1;}',
    '.cq-opt-label{font-size:12px;font-weight:800;color:#64748b;}',
    '.cq-opt-num{font-size:32px;font-weight:900;color:#1e293b;line-height:1;}',
    '.cq-opt-dots{display:flex;flex-wrap:wrap;justify-content:center;gap:3px;max-width:110px;}',
    '.cq-opt-dot{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;}',
    '.s1-opts.cq-3opt{grid-template-columns:repeat(3,1fr)!important;}',
    '.cq-lvl-wrap{display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px 16px;}',
    '.cq-lvl-title-bar{display:flex;align-items:center;width:100%;max-width:520px;gap:8px;}',
    '.cq-lvl-title{font-size:20px;font-weight:900;color:#1e3a8a;text-align:center;flex:1;}',
    '.cq-lvl-back{background:none;border:none;cursor:pointer;font-size:14px;font-weight:700;color:#2563eb;padding:4px 6px;border-radius:8px;white-space:nowrap;flex:0 0 auto;}',
    '.cq-lvl-back:hover{background:#eff6ff;}',
    '.cq-lvl-spacer{flex:0 0 auto;}',
    '.cq-lvl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;width:100%;max-width:440px;}',
    '.cq-lvl-card{border:2px solid #bfdbfe;border-radius:16px;padding:18px 14px;cursor:pointer;text-align:center;background:#fff;transition:transform .16s,border-color .16s,box-shadow .16s;}',
    '.cq-lvl-card:hover{transform:translateY(-2px);border-color:#3b82f6;box-shadow:0 8px 20px rgba(37,99,235,0.12);}',
    '.cq-lvl-card.locked{opacity:0.45;cursor:default;pointer-events:none;}',
    '.cq-lvl-badge{font-size:26px;font-weight:900;color:#1e40af;margin-bottom:4px;}',
    '.cq-lvl-name{font-size:13px;font-weight:700;color:#334155;}',
    '.cq-lvl-desc{font-size:11px;color:#94a3b8;margin-top:4px;}',
    '.cq-lvl-tag{display:inline-block;font-size:10px;font-weight:700;border-radius:6px;padding:2px 8px;margin-top:6px;}',
    '.cq-lvl-tag.free{background:#dcfce7;color:#16a34a;}',
    '.cq-lvl-tag.locked-tag{background:#f1f5f9;color:#94a3b8;}',
    '.cq-lvl-cycle{font-size:11px;font-weight:700;color:#3b82f6;margin-top:5px;}',
    '.cq-lvl-cycle.done{color:#16a34a;}',
    '#s1-replay{display:none!important;}',
    '#cq-home-back{margin-right:auto;background:none;border:none;cursor:pointer;font-size:20px;padding:4px 8px;color:#1e40af;line-height:1;}',
    '.cq-prog{padding:12px 16px;background:#f8fafc;border-radius:12px;margin-bottom:10px;width:100%;max-width:360px;}',
    '.cq-prog-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}',
    '.cq-prog-label{font-size:13px;font-weight:700;color:#334155;}',
    '.cq-prog-pct{font-size:15px;font-weight:900;}',
    '.cq-prog-track{height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-bottom:6px;}',
    '.cq-prog-fill{height:100%;border-radius:999px;transition:width .5s ease;}',
    '.cq-prog-msg{font-size:12px;color:#64748b;text-align:center;}',
    // Z1/Z2/Z3: a fixed-height box so differently-sized emoji share one
    // baseline — same trick as .cq-h-track / .cq-ma-box.
    '.cq-size-box{height:96px;display:flex;align-items:flex-end;justify-content:center;}',
    '.cq-triple{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;width:100%;max-width:440px;align-items:end;}',
    // Balance (W1–W4)
    '.cq-balance-wrap,.cq-balance-stack{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;}',
    '.cq-balance{position:relative;width:220px;height:110px;margin:0 auto;}',
    '.cq-balance-beam{position:absolute;top:36px;left:6px;width:208px;height:8px;background:#94a3b8;border-radius:4px;' +
      'transform-origin:center center;display:flex;justify-content:space-between;align-items:flex-start;transition:transform .3s;}',
    '.cq-balance-tray{display:flex;flex-direction:column;align-items:center;gap:4px;width:60px;background:#f8fafc;' +
      'border:2px solid #cbd5e1;border-radius:10px;padding:6px 4px;margin-top:18px;}',
    '.cq-balance-emoji{font-size:26px;line-height:1;}',
    '.cq-balance-pivot{position:absolute;left:50%;top:40px;width:0;height:0;border-left:13px solid transparent;' +
      'border-right:13px solid transparent;border-bottom:22px solid #64748b;transform:translateX(-50%);}',
    '.cq-swap{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%;}',
    '.cq-swap-ref{display:flex;align-items:center;gap:10px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:10px 16px;}',
    '.cq-swap-side{display:flex;align-items:center;gap:4px;}',
    '.cq-swap-units{display:flex;flex-wrap:wrap;gap:3px;max-width:120px;}',
    '.cq-swap-eq{font-size:20px;font-weight:900;color:#64748b;}',
    '.cq-swap-pair{display:flex;align-items:center;gap:14px;}',
    '.cq-swap-cell{display:flex;flex-direction:column;align-items:center;gap:6px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:10px 12px;min-width:70px;}',
    '.cq-swap-q{font-size:26px;font-weight:900;color:#94a3b8;}',
    // Race (S1–S3)
    '.cq-race{display:flex;flex-direction:column;gap:14px;}',
    '.cq-race-legend{display:flex;justify-content:space-between;align-items:center;width:230px;margin-left:34px;font-size:12px;color:#64748b;font-weight:800;}',
    '.cq-race-lane{display:flex;align-items:center;gap:10px;}',
    '.cq-race-track{position:relative;width:230px;flex-shrink:0;height:36px;background:#eef2f7;border-radius:999px;border:1.5px solid #cbd5e1;}',
    '.cq-race-fill{position:absolute;right:0;top:0;bottom:0;background:#3b82f6;border-radius:999px;}',
    '.cq-race-runner{position:absolute;top:50%;transform:translate(-50%,-50%);width:30px;height:30px;box-sizing:border-box;border-radius:50%;background:#fff;border:2px solid #3b82f6;display:flex;align-items:center;justify-content:center;font-size:17px;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,.25);}',
    '.cq-race-timer{font-size:12px;font-weight:800;color:#475569;white-space:nowrap;}',
    // Difference evidence rows (quantity_diff reuses .cq-dots-pair; race_diff/weight_diff share these)
    '.cq-evid{display:flex;flex-direction:column;gap:12px;}',
    '.cq-evid-row{display:flex;align-items:center;gap:12px;}',
    '.cq-evid-emoji{font-size:30px;line-height:1;}',
    '.cq-evid-readout{font-size:16px;font-weight:900;color:#1e293b;background:#f1f5f9;border:1.5px solid #e2e8f0;border-radius:10px;padding:6px 14px;}',
    // Area (Z4/Z5)
    '.cq-grid-pair{display:flex;gap:20px;justify-content:center;align-items:flex-end;width:100%;flex-wrap:wrap;}',
    '.cq-grid-cell-wrap{display:flex;flex-direction:column;align-items:center;gap:6px;}',
    '.cq-grid{position:relative;background:#f1f5f9;border:1.5px solid #94a3b8;}',
    '.cq-grid-cell{position:absolute;width:20px;height:20px;border:1px solid #e2e8f0;box-sizing:border-box;}',
    '.cq-rect-vline{position:absolute;top:0;bottom:0;width:1px;background:rgba(255,255,255,.65);}',
    '.cq-rect-hline{position:absolute;left:0;right:0;height:1px;background:rgba(255,255,255,.65);}',
    // "same" option: a fixed text card, never a slot pointer (§1.3).
    '.cq-opt-same{font-size:15px;font-weight:900;color:#1e293b;text-align:center;padding:6px 4px;}'
  ].join('');
  document.head.appendChild(styleEl);


  // ── SVG shape renderer ─────────────────────────────────────────────────────

  function _shapeSvg(shape, color, size) {
    var sz = size || 52;
    var c = GEN_DATA.colorMap[color] ? GEN_DATA.colorMap[color].hex : '#3b82f6';
    var inner = '', s2 = sz * 0.85, m = (sz - s2) / 2;
    switch (shape) {
      case 'circle':   inner = '<circle cx="'+sz/2+'" cy="'+sz/2+'" r="'+s2/2+'" fill="'+c+'"/>'; break;
      case 'square':   inner = '<rect x="'+m+'" y="'+m+'" width="'+s2+'" height="'+s2+'" rx="4" fill="'+c+'"/>'; break;
      case 'triangle': inner = '<polygon points="'+sz/2+','+m+' '+(sz-m)+','+(sz-m)+' '+m+','+(sz-m)+'" fill="'+c+'"/>'; break;
      case 'star':     inner = _starPath(sz, c); break;
      case 'heart':    inner = _heartPath(sz, c); break;
      case 'diamond':  inner = '<polygon points="'+sz/2+','+m+' '+(sz-m)+','+sz/2+' '+sz/2+','+(sz-m)+' '+m+','+sz/2+'" fill="'+c+'"/>'; break;
      default:         inner = '<circle cx="'+sz/2+'" cy="'+sz/2+'" r="'+s2/2+'" fill="'+c+'"/>';
    }
    // The width/height MUST be inline. The viewBox is proportional to sz, so with
    // only `.cq-shape-svg{width:52px}` every shape rendered at exactly 52px and
    // the size argument was silently discarded — a "bigger" shape was not bigger.
    return '<svg class="cq-shape-svg" style="width:'+sz+'px;height:'+sz+'px" ' +
      'viewBox="0 0 '+sz+' '+sz+'" xmlns="http://www.w3.org/2000/svg">'+inner+'</svg>';
  }

  function _starPath(sz, fill) {
    var cx=sz/2, cy=sz/2, r1=sz*0.42, r2=sz*0.18, pts='';
    for (var i=0;i<10;i++){var r=i%2===0?r1:r2,a=(Math.PI/5)*i-Math.PI/2;pts+=(cx+r*Math.cos(a)).toFixed(2)+','+(cy+r*Math.sin(a)).toFixed(2)+' ';}
    return '<polygon points="'+pts.trim()+'" fill="'+fill+'"/>';
  }

  // The heart is drawn, not typed. As a <text>♥</text> glyph its ink depended on
  // whatever font the device had and covered far less of the box than the other
  // shapes, so a big heart could look smaller than a small triangle. A path on
  // the same 0.85-of-the-box footprint keeps all six shapes comparable.
  function _heartPath(sz, fill) {
    var s2=sz*0.85, k=s2/32, h=29.6*k;
    return '<g transform="translate('+((sz-s2)/2).toFixed(2)+','+((sz-h)/2).toFixed(2)+') scale('+k.toFixed(4)+')" fill="'+fill+'">'+
      '<path d="M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4' +
      'c0,9.4,9.5,11.9,16,21.2c6.1-9.3,16-12.1,16-21.2C32,3.8,28.2,0,23.6,0z"/></g>';
  }

  // ── Question renderers ─────────────────────────────────────────────────────

  function renderSequence(q, container) {
    var html = '<div class="cq"><div class="cq-q">'+_questionText(q)+'</div>'+_sceneHtml(q)+'</div>';
    container.innerHTML = html;
    var optsEl = document.getElementById('s1-opts');
    if (optsEl) {
      if (q.options && q.options.length === 3) optsEl.classList.add('cq-3opt');
      else optsEl.classList.remove('cq-3opt');
    }
  }

  function _questionText(q) {
    var zh='', en='';
    switch (q.type) {
      case 'size':         zh=q.askBigger?'哪个<b>更大</b>？':'哪个<b>更小</b>？'; en=q.askBigger?'Which is <b>bigger</b>?':'Which is <b>smaller</b>?'; break;
      case 'length':       zh=q.askLonger?'哪根<b>更长</b>？':'哪根<b>更短</b>？'; en=q.askLonger?'Which is <b>longer</b>?':'Which is <b>shorter</b>?'; break;
      case 'height':       zh=q.askTaller?'哪个<b>更高</b>？':'哪个<b>更矮</b>？'; en=q.askTaller?'Which is <b>taller</b>?':'Which is <b>shorter</b>?'; break;
      case 'quantity':     zh=q.askMore?'哪边<b>更多</b>？':'哪边<b>更少</b>？'; en=q.askMore?'Which side has <b>more</b>?':'Which side has <b>fewer</b>?'; break;
      case 'number':       zh=q.askBigger?'哪个数字<b>更大</b>？':'哪个数字<b>更小</b>？'; en=q.askBigger?'Which number is <b>bigger</b>?':'Which number is <b>smaller</b>?'; break;
      case 'shape':        zh='哪个形状<b>不一样</b>？'; en='Which shape is <b>different</b>?'; break;
      case 'color':        zh='哪个颜色<b>不一样</b>？'; en='Which color is <b>different</b>?'; break;
      case 'position':     zh=q.askNearer?'哪个离'+q.refNameZh+'<b>更近</b>？':'哪个离'+q.refNameZh+'<b>更远</b>？'; en=q.askNearer?'Which is <b>closer</b> to the '+q.refNameEn+'?':'Which is <b>farther</b> from the '+q.refNameEn+'?'; break;
      case 'fullness':     zh=q.askFuller?'哪个装得<b>更满</b>？':'哪个装得<b>更少</b>？'; en=q.askFuller?'Which is <b>fuller</b>?':'Which is <b>more empty</b>?'; break;
      case 'time':         zh=q.askLongerDuration?'哪个时间<b>更长</b>？':'哪件事<b>先</b>发生？'; en=q.askLongerDuration?'Which duration is <b>longer</b>?':'Which happens <b>first</b>?'; break;
      case 'multi_attribute':
        zh='哪个<b>更大</b>？'+(q.ignoreZh?'（不用管'+q.ignoreZh+'）':'');
        en='Which is <b>bigger</b>?'+(q.ignoreEn?' (ignore the '+q.ignoreEn+')':'');
        break;
      case 'size_pick':   zh=q.askBigger?'哪个<b>最大</b>？':'哪个<b>最小</b>？'; en=q.askBigger?'Which is the <b>biggest</b>?':'Which is the <b>smallest</b>?'; break;
      case 'size_real':
        zh = q.askReal
          ? (q.askBigger ? '哪个<b>真的</b>更大？' : '哪个<b>真的</b>更小？')
          : (q.askBigger ? '图上哪个<b>画得</b>更大？' : '图上哪个<b>画得</b>更小？');
        en = q.askReal
          ? (q.askBigger ? 'Which is <b>really</b> bigger?' : 'Which is <b>really</b> smaller?')
          : (q.askBigger ? 'Which is <b>drawn</b> bigger?' : 'Which is <b>drawn</b> smaller?');
        break;
      case 'balance_judge': zh=q.askHeavier?'哪个<b>更重</b>？':'哪个<b>更轻</b>？'; en=q.askHeavier?'Which is <b>heavier</b>?':'Which is <b>lighter</b>?'; break;
      case 'balance_select':
      case 'balance_chain': zh=q.askHeaviest?'哪个<b>最重</b>？':'哪个<b>最轻</b>？'; en=q.askHeaviest?'Which is the <b>heaviest</b>?':'Which is the <b>lightest</b>?'; break;
      case 'balance_swap':  zh='哪边<b>更重</b>？'; en='Which side is <b>heavier</b>?'; break;
      case 'race_judge':    zh=q.askFaster?'哪个<b>更快</b>？':'哪个<b>更慢</b>？'; en=q.askFaster?'Which is <b>faster</b>?':'Which is <b>slower</b>?'; break;
      case 'race_select':   zh=q.askFastest?'谁跑得<b>最快</b>？':'谁跑得<b>最慢</b>？'; en=q.askFastest?'Who is the <b>fastest</b>?':'Who is the <b>slowest</b>?'; break;
      case 'race_variant':  zh=q.askFaster?'谁跑得<b>更快</b>？':'谁跑得<b>更慢</b>？'; en=q.askFaster?'Who ran <b>faster</b>?':'Who ran <b>slower</b>?'; break;
      case 'area_grid':
      case 'area_rect':     zh=q.askBigger?'哪个图形<b>更大</b>？':'哪个图形<b>更小</b>？'; en=q.askBigger?'Which shape is <b>bigger</b>?':'Which shape is <b>smaller</b>?'; break;
      case 'quantity_diff': zh='两边<b>相差几个</b>？'; en='<b>By how many</b> do the two sides differ?'; break;
      case 'area_diff':     zh='两个图形<b>相差几格</b>？'; en='<b>By how many squares</b> do the two shapes differ?'; break;
      case 'race_diff':     zh='两位选手<b>相差几秒</b>？'; en='<b>By how many seconds</b> do the two racers differ?'; break;
      case 'weight_diff':   zh='两个盒子<b>相差几个</b>重量单位？'; en='<b>By how many units</b> do the two boxes differ?'; break;
      default: zh='选出正确答案。'; en='Choose the correct answer.';
    }
    return '<span class="zh">'+zh+'</span><span class="en">'+en+'</span>';
  }

  // ── Slot markers: the scene ⇄ option contract ──────────────────────────────
  // Rule for every scene-backed type: the SCENE owns the compared attribute
  // (shared baseline, obvious difference, one slot marker per item) and the
  // OPTION is only a pointer at a slot. An option never re-draws the attribute —
  // that used to put the real comparison inside the answer cards.
  //
  // Slot colour is used only where the items have no identity of their own
  // (length and height are anonymous bars); everywhere else the marker is
  // neutral slate and the option shows the item's own emoji/name instead.

  var SLOT_LETTERS = ['A', 'B', 'C'];
  var SLOT_COLORS  = ['#0ea5e9', '#10b981', '#f59e0b'];
  var SLOT_NEUTRAL = '#64748b';
  var SLOT_COLORED = { length: 1, height: 1 };
  // `difference` judge types: options are numeric gap values, not slot
  // pointers (see renderOption / _optBody).
  var DIFF_VALUE_TYPES = { quantity_diff: 1, area_diff: 1, race_diff: 1, weight_diff: 1 };
  var H_BAR_MAX    = 80;   // px; must match .cq-h-track height minus the emoji
  var MA_BOX       = 96;   // px; the biggest object in a multi_attribute pair
                           // (must stay <= the .cq-ma-box height)

  function _slotIdx(opt) {
    if (opt === 'left')  return 0;
    if (opt === 'right') return 1;
    var i = SLOT_LETTERS.indexOf(String(opt));
    return i === -1 ? 0 : i;
  }

  function _slotColor(idx, type) {
    if (!SLOT_COLORED[type]) return SLOT_NEUTRAL;
    return SLOT_COLORS[idx] || SLOT_NEUTRAL;
  }

  function _slotBadge(idx, type) {
    return '<div class="cq-slot" style="background:' + _slotColor(idx, type) + '">' +
      (SLOT_LETTERS[idx] || '?') + '</div>';
  }

  // A badge for a NAMED slot (a specific box/racer letter carried in the data,
  // e.g. which box sits on a balance) rather than a positional index — always
  // neutral, since colour must never become an extra identity cue (§1.2).
  function _letterBadge(letter) {
    return '<div class="cq-slot" style="background:' + SLOT_NEUTRAL + '">' + letter + '</div>';
  }

  function _hasScene(type) {
    return type === 'size' || type === 'length' || type === 'height' ||
           type === 'quantity' || type === 'position' || type === 'fullness' ||
           type === 'shape' || type === 'color' || type === 'multi_attribute' ||
           type === 'size_pick' || type === 'size_real' ||
           type === 'balance_judge' || type === 'balance_select' ||
           type === 'balance_chain' || type === 'balance_swap' ||
           type === 'race_judge' || type === 'race_select' || type === 'race_variant' ||
           type === 'area_grid' || type === 'area_rect' ||
           type === 'quantity_diff' || type === 'area_diff' ||
           type === 'race_diff' || type === 'weight_diff';
  }

  function _sceneHtml(q) {
    switch (q.type) {
      case 'size':     return _sizeScene(q);
      case 'length':   return _lengthScene(q);
      case 'height':   return _heightScene(q);
      case 'quantity': return _quantityScene(q);
      case 'position': return _nearFarScene(q);
      case 'fullness': return _fullnessScene(q);
      case 'shape':
      case 'color':    return _sameDiffScene(q);
      case 'multi_attribute': return _multiAttrScene(q);
      case 'size_pick': return _sizePickScene(q);
      case 'size_real': return _sizeRealScene(q);
      case 'balance_judge': return _balanceScene(q);
      case 'balance_select':
      case 'balance_chain':  return _balanceMultiScene(q);
      case 'balance_swap':   return _balanceSwapScene(q);
      case 'race_judge':
      case 'race_variant':   return _raceScene(q);
      case 'race_select':    return _raceSelectScene(q);
      case 'area_grid':      return _areaGridScene(q);
      case 'area_rect':      return _areaRectScene(q);
      case 'quantity_diff':  return _quantityScene(q);
      case 'area_diff':      return _areaGridScene(q);
      case 'race_diff':      return _raceDiffScene(q);
      case 'weight_diff':    return _weightDiffScene(q);
      default: return '';
    }
  }

  function _sizeScene(q) {
    function cell(idx, px, emoji) {
      return '<div class="cq-cell"><div class="cq-size-box"><div class="cq-emoji" style="font-size:' + px + 'px">' + emoji + '</div></div>' + _slotBadge(idx, q.type) + '</div>';
    }
    return '<div class="cq-pair">' + cell(0, q.leftSizeRank, q.leftEmoji) + cell(1, q.rightSizeRank, q.rightEmoji) + '</div>';
  }

  // Z2: same icon three times at fixed ratios 1 : 0.78 : 0.6, slots A/B/C.
  function _sizePickScene(q) {
    var h = '<div class="cq-triple">';
    ['A', 'B', 'C'].forEach(function (l) {
      h += '<div class="cq-cell"><div class="cq-size-box"><div class="cq-emoji" style="font-size:' + q.sizeBySlot[l] + 'px">' + q.emoji + '</div></div>' + _letterBadge(l) + '</div>';
    });
    return h + '</div>';
  }

  // Z3: two DIFFERENT real objects — the only type allowed to show names in
  // its scene, because the name is exactly what conveys real-world size
  // (§1.1 exception).
  function _sizeRealScene(q) {
    function cell(idx, px, emoji, nz, ne) {
      return '<div class="cq-cell"><div class="cq-size-box"><div class="cq-emoji" style="font-size:' + px + 'px">' + emoji + '</div></div>' +
        '<div class="cq-label"><span class="zh">' + nz + '</span><span class="en">' + ne + '</span></div>' + _slotBadge(idx, q.type) + '</div>';
    }
    return '<div class="cq-pair">' + cell(0, q.leftSizeRank, q.leftEmoji, q.leftNameZh, q.leftNameEn) +
      cell(1, q.rightSizeRank, q.rightEmoji, q.rightNameZh, q.rightNameEn) + '</div>';
  }

  function _lengthScene(q) {
    function row(idx,pct){
      return '<div class="cq-bar-row">'+_slotBadge(idx,q.type)+
        '<div class="cq-bar-track"><div class="cq-bar-fill" style="width:'+pct+'%;background:'+_slotColor(idx,q.type)+'"></div></div></div>';
    }
    return '<div class="cq-bars">'+row(0,q.leftPct)+row(1,q.rightPct)+'</div>';
  }

  function _heightScene(q) {
    // Bar heights are computed in px against H_BAR_MAX on purpose. A `height:X%`
    // inside .cq-h-col does not resolve (auto-height flex column), which used to
    // collapse both bars to 0px and made the two items look exactly the same
    // height — while the option cards still showed the difference.
    function col(idx,emoji,pct){
      var px=Math.max(8,Math.round(pct/100*H_BAR_MAX));
      return '<div class="cq-h-col">'+
        '<div class="cq-h-track"><div class="cq-h-emoji">'+emoji+'</div>'+
          '<div class="cq-h-bar" style="height:'+px+'px;background:'+_slotColor(idx,q.type)+'"></div></div>'+
        _slotBadge(idx,q.type)+
      '</div>';
    }
    return '<div class="cq-heights">'+col(0,q.leftEmoji,q.leftHeightPct)+col(1,q.rightEmoji,q.rightHeightPct)+'</div>';
  }

  function _quantityScene(q) {
    function dots(count) {
      var h='<div class="cq-dot-grid">';
      for(var i=0;i<count;i++) h+='<div class="cq-dot">'+q.objEmoji+'</div>';
      return h+'</div>';
    }
    function cell(idx,count){
      return '<div class="cq-dots-cell">'+dots(count)+
        (q.showNumbers?'<div class="cq-label">'+count+'</div>':'')+_slotBadge(idx,q.type)+'</div>';
    }
    return '<div class="cq-dots-pair">'+cell(0,q.leftCount)+cell(1,q.rightCount)+'</div>';
  }

  function _sameDiffScene(q) {
    var h='<div class="cq-items">';
    q.items.forEach(function(item,idx){h+='<div class="cq-item">'+_shapeSvg(item.shape,item.color)+_slotBadge(idx,q.type)+'</div>';});
    return h+'</div>';
  }

  // multi_attribute: size is the compared attribute, so it belongs in the scene
  // (§6.5) and on one shared ruler (§6.6) — the bigger object fills MA_BOX and
  // the other is drawn as its true fraction of it. Colour and shape vary on
  // purpose; they are the distractors the child has to learn to ignore, which is
  // exactly why the option cards must not repeat them.
  function _multiAttrScene(q) {
    var max = Math.max(q.left.size, q.right.size);
    function cell(idx, item) {
      var px = Math.max(30, Math.round(MA_BOX * item.size / max));
      return '<div class="cq-ma-cell">' +
        '<div class="cq-ma-box">' + _shapeSvg(item.shape, item.color, px) + '</div>' +
        _slotBadge(idx, q.type) + '</div>';
    }
    return '<div class="cq-ma-pair">' + cell(0, q.left) + cell(1, q.right) + '</div>';
  }

  // position: distance from the reference is the compared attribute, so it has to
  // BE a distance on screen. The old layout pinned the reference at 50% and put
  // each object at `50 ± (dist − 50) × 0.45`, which made the drawn gap
  // `0.45 × |dist − 50|` — a V shape: dist 50 landed on top of the reference and
  // dist 10 and dist 90 landed equally far from it. With the generator's ranges
  // the FAR object was routinely drawn nearer than the near one, so the answer
  // looked reversed. Now the reference owns one shared left edge, each object has
  // its own row on the same track, and the dotted path is the true distance.
  function _nearFarScene(q) {
    function row(idx, pct, emoji) {
      return '<div class="cq-scene-track">' +
        '<div class="cq-scene-path" style="width:' + pct + '%"></div>' +
        '<div class="cq-scene-obj" style="left:' + pct + '%">' +
          '<div class="cq-scene-emoji">' + emoji + '</div>' + _slotBadge(idx, q.type) +
        '</div></div>';
    }
    return '<div class="cq-scene">' +
      '<div class="cq-scene-ref">' + q.refEmoji + '</div>' +
      '<div class="cq-scene-rows">' +
        row(0, q.leftDistPct, q.leftEmoji) +
        row(1, q.rightDistPct, q.rightEmoji) +
      '</div></div>';
  }

  function _fullnessScene(q) {
    function con(idx,pct,emoji,zh,en){
      return '<div class="cq-container-cell">'+
        '<div class="cq-emoji" style="font-size:22px">'+emoji+'</div>'+
        '<div class="cq-container-visual"><div class="cq-fill" style="height:'+pct+'%"></div></div>'+
        '<div class="cq-container-label"><span class="zh">'+zh+'</span><span class="en">'+en+'</span></div>'+
        _slotBadge(idx,q.type)+'</div>';
    }
    return '<div class="cq-containers">'+
      con(0,q.leftFillPct,q.leftEmoji,q.leftNameZh,q.leftNameEn)+
      con(1,q.rightFillPct,q.rightEmoji,q.rightNameZh,q.rightNameEn)+'</div>';
  }

  // ── Balance scenes (W1–W4) ─────────────────────────────────────────────────
  // tiltDeg is a CSS rotate() degree (positive = clockwise = right tray down),
  // fixed at ±14° regardless of the real weight gap (§2 shared rule) — the
  // generator already picked the sign, so the beam is the only thing that
  // moves; both trays always carry the SAME icon (identity-neutral, §1.2).

  function _balanceOneHtml(tiltDeg, emoji, leftLabel, rightLabel) {
    return '<div class="cq-balance">' +
      '<div class="cq-balance-beam" style="transform:rotate(' + tiltDeg + 'deg)">' +
        '<div class="cq-balance-tray"><div class="cq-balance-emoji">' + emoji + '</div>' + leftLabel + '</div>' +
        '<div class="cq-balance-tray"><div class="cq-balance-emoji">' + emoji + '</div>' + rightLabel + '</div>' +
      '</div>' +
      '<div class="cq-balance-pivot"></div>' +
    '</div>';
  }

  // W1: a single balance, options are left/right/same — slot badges are the
  // usual positional A/B pointers.
  function _balanceScene(q) {
    return '<div class="cq-balance-wrap">' +
      _balanceOneHtml(q.tiltDeg, q.emoji, _slotBadge(0, q.type), _slotBadge(1, q.type)) +
    '</div>';
  }

  // W2/W3: two or three balances stacked; each tray is labelled with the
  // actual box letter it holds (not a positional index), since the options
  // (A/B/C) name specific boxes, not "left" or "right".
  function _balanceMultiScene(q) {
    var h = '<div class="cq-balance-stack">';
    q.balances.forEach(function (b) {
      h += _balanceOneHtml(b.tiltDeg, q.emoji, _letterBadge(b.left), _letterBadge(b.right));
    });
    return h + '</div>';
  }

  // W4: a flat reference balance (k balls = 1 block, drawn as SVG shapes so no
  // real object can smuggle in common sense) above a beam-less pair of trays —
  // no beam on the bottom pair on purpose, or its tilt/levelness would give the
  // answer away before the child converts units (§ W4 画面 note).
  function _swapUnits(shape, count, color) {
    var h = '<div class="cq-swap-units">';
    for (var i = 0; i < count; i++) h += _shapeSvg(shape, color, 26);
    return h + '</div>';
  }

  function _balanceSwapScene(q) {
    var top = '<div class="cq-swap-ref">' +
      '<div class="cq-swap-side">' + _swapUnits('circle', q.k, 'red') + '</div>' +
      '<div class="cq-swap-eq">=</div>' +
      '<div class="cq-swap-side">' + _swapUnits('square', 1, 'blue') + '</div>' +
    '</div>';

    var blockCell = '<div class="cq-swap-cell">' + _swapUnits('square', q.m, 'blue') + _slotBadge(q.blockSide === 'left' ? 0 : 1, q.type) + '</div>';
    var ballCell  = '<div class="cq-swap-cell">' + _swapUnits('circle', q.n, 'red') + _slotBadge(q.blockSide === 'left' ? 1 : 0, q.type) + '</div>';
    var bottom = '<div class="cq-swap-pair">' +
      (q.blockSide === 'left' ? blockCell + '<div class="cq-swap-q">?</div>' + ballCell
                               : ballCell + '<div class="cq-swap-q">?</div>' + blockCell) +
    '</div>';

    return '<div class="cq-swap">' + top + bottom + '</div>';
  }

  // ── Race scenes (S1–S3) ────────────────────────────────────────────────────
  // Every lane shows the same racer icon and a stopwatch reading; no speed-hint
  // decoration (dust, motion lines) is ever drawn (§3 shared rule).

  function _raceLaneHtml(badge, pct, seconds, emoji) {
    return '<div class="cq-race-lane">' + badge +
      '<div class="cq-race-track">' +
        '<div class="cq-race-fill" style="width:' + pct + '%"></div>' +
        '<div class="cq-race-runner" style="left:' + (100 - pct) + '%">' + emoji + '</div>' +
      '</div>' +
      '<div class="cq-race-timer">⏱ ' + seconds + '秒</div>' +
    '</div>';
  }

  var RACE_LEGEND = '<div class="cq-race-legend"><span>🏁</span><span>← 起点</span></div>';

  // S1 (race_judge) and S3 (race_variant) share this: both carry
  // leftPct/rightPct + leftSeconds/rightSeconds, so one renderer covers the
  // "same time" and "same distance" framings without branching on variant.
  function _raceScene(q) {
    return '<div class="cq-race">' + RACE_LEGEND +
      _raceLaneHtml(_slotBadge(0, q.type), q.leftPct, q.leftSeconds, q.emoji) +
      _raceLaneHtml(_slotBadge(1, q.type), q.rightPct, q.rightSeconds, q.emoji) +
    '</div>';
  }

  // S2: three lanes, same stopwatch reading throughout, positions keyed by slot letter.
  function _raceSelectScene(q) {
    var h = '<div class="cq-race">' + RACE_LEGEND;
    ['A', 'B', 'C'].forEach(function (l) {
      h += _raceLaneHtml(_letterBadge(l), q.posBySlot[l], q.seconds, q.emoji);
    });
    return h + '</div>';
  }

  // ── Difference evidence scenes ──────────────────────────────────────────────
  // Both carriers reduce to the same shape: a slot badge, the (shared, identity-
  // neutral) icon, and an instrument readout — no position/tilt to read, since
  // the whole point of these two is that only the number differs.
  function _evidenceRowHtml(badge, emoji, readout) {
    return '<div class="cq-evid-row">' + badge +
      '<div class="cq-evid-emoji">' + emoji + '</div>' +
      '<div class="cq-evid-readout">' + readout + '</div>' +
    '</div>';
  }

  function _raceDiffScene(q) {
    return '<div class="cq-evid">' +
      _evidenceRowHtml(_slotBadge(0, q.type), q.emoji, '⏱ ' + q.leftSeconds + '秒') +
      _evidenceRowHtml(_slotBadge(1, q.type), q.emoji, '⏱ ' + q.rightSeconds + '秒') +
    '</div>';
  }

  function _weightDiffScene(q) {
    return '<div class="cq-evid">' +
      _evidenceRowHtml(_slotBadge(0, q.type), q.emoji, '⚖️ ' + q.leftWeight) +
      _evidenceRowHtml(_slotBadge(1, q.type), q.emoji, '⚖️ ' + q.rightWeight) +
    '</div>';
  }

  // ── Area scenes (Z4/Z5) ────────────────────────────────────────────────────

  var GRID_CELL = 20;

  function _gridPolyHtml(cells, bbox, color) {
    var occupied = {};
    cells.forEach(function (c) { occupied[c.x + ',' + c.y] = true; });
    var h = '<div class="cq-grid" style="width:' + (bbox.w * GRID_CELL) + 'px;height:' + (bbox.h * GRID_CELL) + 'px;">';
    for (var y = 0; y < bbox.h; y++) {
      for (var x = 0; x < bbox.w; x++) {
        var on = occupied[x + ',' + y];
        h += '<div class="cq-grid-cell" style="left:' + (x * GRID_CELL) + 'px;top:' + (y * GRID_CELL) + 'px;' +
          (on ? 'background:' + color + ';' : '') + '"></div>';
      }
    }
    return h + '</div>';
  }

  // Z4: two polyominoes, each on its own light grid so every cell is countable.
  function _areaGridScene(q) {
    return '<div class="cq-grid-pair">' +
      '<div class="cq-grid-cell-wrap">' + _gridPolyHtml(q.leftCells, q.leftBBox, '#60a5fa') + _slotBadge(0, q.type) + '</div>' +
      '<div class="cq-grid-cell-wrap">' + _gridPolyHtml(q.rightCells, q.rightBBox, '#34d399') + _slotBadge(1, q.type) + '</div>' +
    '</div>';
  }

  var RECT_CELL = 16;

  function _rectGridHtml(a, b, color) {
    var h = '<div class="cq-grid" style="width:' + (a * RECT_CELL) + 'px;height:' + (b * RECT_CELL) + 'px;background:' + color + ';">';
    for (var x = 1; x < a; x++) h += '<div class="cq-rect-vline" style="left:' + (x * RECT_CELL) + 'px;"></div>';
    for (var y = 1; y < b; y++) h += '<div class="cq-rect-hline" style="top:' + (y * RECT_CELL) + 'px;"></div>';
    return h + '</div>';
  }

  // Z5: a×b vs c×d grid rectangles — the longer-edge one is smaller-area on
  // most unequal draws, so the grid lines are what settle it, not the outline.
  function _areaRectScene(q) {
    return '<div class="cq-grid-pair">' +
      '<div class="cq-grid-cell-wrap">' + _rectGridHtml(q.leftA, q.leftB, '#93c5fd') + _slotBadge(0, q.type) + '</div>' +
      '<div class="cq-grid-cell-wrap">' + _rectGridHtml(q.rightA, q.rightB, '#6ee7b7') + _slotBadge(1, q.type) + '</div>' +
    '</div>';
  }

  // ── Option renderer ────────────────────────────────────────────────────────

  function renderOption(opt, q) {
    // "same" is never a slot — it is a fixed text card, for every type that
    // offers it (§1.3). Checked first so it short-circuits the scene branch
    // below, which would otherwise try to treat it as slot index 0.
    if (opt === 'same') return '<div class="cq-opt">' + _optSameCard(q) + '</div>';

    // `difference` judge types: the options are candidate gap NUMBERS, not
    // slot pointers — the scene still renders the evidence, but the option
    // itself IS the answer, so it skips _optPointer entirely (checked before
    // the _hasScene branch for the same reason "same" is checked first).
    if (DIFF_VALUE_TYPES[q.type]) return '<div class="cq-opt">' + _optBody(opt, q) + '</div>';

    // Scene-backed type → pointer only. See the slot-marker contract above.
    if (_hasScene(q.type)) return '<div class="cq-opt">'+_optPointer(opt,q)+'</div>';

    // No scene (number / time): the options ARE the question
    // content, so they keep carrying it — plus a letter label.
    var lbl={left:{zh:'选 A',en:'A'},right:{zh:'选 B',en:'B'},A:{zh:'A',en:'A'},B:{zh:'B',en:'B'},C:{zh:'C',en:'C'}};
    var l=lbl[opt]||lbl.left;
    return '<div class="cq-opt">'+_optBody(opt,q)+
      '<div class="cq-opt-label"><span class="zh">'+l.zh+'</span><span class="en">'+l.en+'</span></div></div>';
  }

  var SAME_LABELS = {
    balance_judge: { zh: '一样重', en: 'Same weight' },
    balance_swap:  { zh: '一样重', en: 'Same weight' },
    race_judge:    { zh: '一样快', en: 'Same speed' },
    race_variant:  { zh: '一样快', en: 'Same speed' },
    area_grid:     { zh: '一样大', en: 'Same size' },
    area_rect:     { zh: '一样大', en: 'Same size' }
  };

  function _optSameCard(q) {
    var l = SAME_LABELS[q.type] || { zh: '一样', en: 'Same' };
    return '<div class="cq-opt-same"><span class="zh">' + l.zh + '</span><span class="en">' + l.en + '</span></div>';
  }

  // A pointer = the slot letter (in the slot colour) plus, when the two items
  // are told apart by something other than the compared attribute, a neutral
  // copy of that identity: the emoji at a FIXED size and the name. Never the
  // attribute itself.
  function _optPointer(opt, q) {
    var idx=_slotIdx(opt);
    var h='<div class="cq-opt-ptr" style="background:'+_slotColor(idx,q.type)+'">'+(SLOT_LETTERS[idx]||'?')+'</div>';
    return h+_optIdentity(opt,q);
  }

  function _optIdentity(opt, q) {
    switch (q.type) {
      // Two distinct objects: the emoji/name identifies them without hinting.
      // size_real (Z3) belongs here too — the name is what conveys real-world
      // size, which is exactly what the question asks about (§1.1 exception).
      case 'position': case 'fullness': case 'size_real': {
        var left=opt==='left';
        var em=left?q.leftEmoji:q.rightEmoji, nz=left?q.leftNameZh:q.rightNameZh, ne=left?q.leftNameEn:q.rightNameEn;
        var h='<div class="cq-opt-emoji" style="font-size:24px">'+em+'</div>';
        if (nz) h+='<div class="cq-opt-label"><span class="zh">'+nz+'</span><span class="en">'+ne+'</span></div>';
        return h;
      }
      // length / height / quantity: anonymous items — the letter is the identity.
      // shape / color: the identity IS the answer, so showing it would give it away.
      // multi_attribute: shape and colour are the distractors, so repeating them
      // in the card would put the noise back where the answer is chosen.
      // size / size_pick (Z1/Z2) and every balance/race/area type: the compared
      // objects are IDENTICAL on purpose (§1.2) — a name or emoji here would
      // add nothing, so the slot letter is the only pointer.
      default: return '';
    }
  }

  // Bodies for the scene-less types only. Scene-backed types go through
  // _optPointer instead, so nothing here may re-draw a compared attribute.
  function _optBody(opt, q) {
    switch (q.type) {
      case 'number': {
        var num=opt==='left'?q.leftNum:q.rightNum, dotH='';
        if(q.showDots){dotH='<div class="cq-opt-dots">';for(var d=0;d<num;d++) dotH+='<div class="cq-opt-dot" style="background:#93c5fd;border-radius:50%;width:14px;height:14px;"></div>';dotH+='</div>';}
        return dotH+'<div class="cq-opt-num">'+num+'</div>';
      }
      case 'time': {
        var tev=opt==='left'?{zh:q.leftEventZh,en:q.leftEventEn}:{zh:q.rightEventZh,en:q.rightEventEn};
        return '<div class="cq-opt-label" style="font-size:15px;font-weight:900;color:#1e293b;"><span class="zh">'+tev.zh+'</span><span class="en">'+tev.en+'</span></div>';
      }
      case 'quantity_diff': case 'area_diff': case 'race_diff': case 'weight_diff':
        return '<div class="cq-opt-num">'+opt+'</div>';
      default: return '<div class="cq-opt-label">'+opt+'</div>';
    }
  }

  // ── checkAnswer / voice ────────────────────────────────────────────────────

  function checkAnswer(selected, q) { return selected === q.answer; }

  function getVoiceText(q) {
    var zh='', en='';
    switch(q.type){
      case 'size':    zh=q.askBigger?'哪个更大？':'哪个更小？'; en=q.askBigger?'Which is bigger?':'Which is smaller?'; break;
      case 'length':  zh=q.askLonger?'哪根更长？':'哪根更短？'; en=q.askLonger?'Which is longer?':'Which is shorter?'; break;
      case 'height':  zh=q.askTaller?'哪个更高？':'哪个更矮？'; en=q.askTaller?'Which is taller?':'Which is shorter?'; break;
      case 'quantity':zh=q.askMore?'哪边更多？':'哪边更少？'; en=q.askMore?'Which side has more?':'Which side has fewer?'; break;
      case 'number':  zh=q.askBigger?'哪个更大，'+q.leftNum+'还是'+q.rightNum+'？':'哪个更小？'; en=q.askBigger?'Which is bigger, '+q.leftNum+' or '+q.rightNum+'?':'Which is smaller?'; break;
      case 'shape':   zh='哪个形状不一样？'; en='Which shape is different?'; break;
      case 'color':   zh='哪个颜色不一样？'; en='Which color is different?'; break;
      case 'position':zh='哪个离'+q.refNameZh+(q.askNearer?'更近？':'更远？'); en=(q.askNearer?'Which is closer to the ':'Which is farther from the ')+q.refNameEn.toLowerCase()+'?'; break;
      case 'fullness':zh=q.askFuller?'哪个更满？':'哪个更空？'; en=q.askFuller?'Which is fuller?':'Which is more empty?'; break;
      case 'time':    zh=q.askLongerDuration?'哪个时间更长？':'哪件事先发生？'; en=q.askLongerDuration?'Which duration is longer?':'Which happens first?'; break;
      case 'multi_attribute':
        zh='哪个更大？'+(q.ignoreZh?'不用管'+q.ignoreZh+'。':'');
        en='Which is bigger?'+(q.ignoreEn?' Ignore the '+q.ignoreEn+'.':'');
        break;
      case 'size_pick':   zh=q.askBigger?'哪个最大？':'哪个最小？'; en=q.askBigger?'Which is the biggest?':'Which is the smallest?'; break;
      case 'size_real':
        zh = q.askReal ? (q.askBigger?'哪个真的更大？':'哪个真的更小？') : (q.askBigger?'图上哪个画得更大？':'图上哪个画得更小？');
        en = q.askReal ? (q.askBigger?'Which is really bigger?':'Which is really smaller?') : (q.askBigger?'Which is drawn bigger?':'Which is drawn smaller?');
        break;
      case 'balance_judge': zh=q.askHeavier?'哪个更重？':'哪个更轻？'; en=q.askHeavier?'Which is heavier?':'Which is lighter?'; break;
      case 'balance_select':
      case 'balance_chain': zh=q.askHeaviest?'哪个最重？':'哪个最轻？'; en=q.askHeaviest?'Which is the heaviest?':'Which is the lightest?'; break;
      case 'balance_swap':  zh='哪边更重？'; en='Which side is heavier?'; break;
      case 'race_judge':    zh=q.askFaster?'哪个更快？':'哪个更慢？'; en=q.askFaster?'Which is faster?':'Which is slower?'; break;
      case 'race_select':   zh=q.askFastest?'谁跑得最快？':'谁跑得最慢？'; en=q.askFastest?'Who is the fastest?':'Who is the slowest?'; break;
      case 'race_variant':  zh=q.askFaster?'谁跑得更快？':'谁跑得更慢？'; en=q.askFaster?'Who ran faster?':'Who ran slower?'; break;
      case 'area_grid':
      case 'area_rect':     zh=q.askBigger?'哪个图形更大？':'哪个图形更小？'; en=q.askBigger?'Which shape is bigger?':'Which shape is smaller?'; break;
      case 'quantity_diff': zh='两边相差几个？'; en='By how many do the two sides differ?'; break;
      case 'area_diff':     zh='两个图形相差几格？'; en='By how many squares do the two shapes differ?'; break;
      case 'race_diff':     zh='两位选手相差几秒？'; en='By how many seconds do the two racers differ?'; break;
      case 'weight_diff':   zh='两个盒子相差几个重量单位？'; en='By how many units do the two boxes differ?'; break;
      default:        zh='请选择答案。'; en='Choose an answer.';
    }
    return shell.lang==='zh'?zh:en;
  }

  // ── RootGene / engine hooks ────────────────────────────────────────────────

  /**
   * Thinking-radar contract for this module. Every activity in this unit —
   * puzzle batches through shell.createGame, and sort/match/group/fit/mini
   * through ActivityRunner — must describe itself the same way, or the radar
   * cannot roll the two paths into one picture.
   *
   * Genes carry ABILITY only. Where the child was (this module, this level)
   * travels in moduleId / levelId / gradeCode, never inside the gene id.
   */
  var MODULE_ID   = 'comparison';
  var MODULE_TYPE = 'metathinking';
  var SOURCE_GAME_ID = 'learning-math-comparison';

  /**
   * levelId → gradeCode. This module's level ids are already the canonical
   * K1/K2/G1..G6 vocabulary, so the map is the identity — but it is written out
   * rather than assumed, because shell.grade.normalize() refuses to guess and
   * every other module has to declare its own mapping here too.
   */
  var LEVEL_GRADE = { K1:'K1', K2:'K2', G1:'G1', G2:'G2' };

  /**
   * Three-dimension model (comparison.json → designModel): every template
   * declares structure × carrier × task itself, so the radar reads them off the
   * template instead of guessing from the attribute being compared.
   */

  // Mirrors comparison.json → sessionPolicy. Collided by validator S7 / S8.
  var SESSION_SIZE = 8;
  var MAX_ACTIVITIES_PER_SESSION = 2;

  // Structure id → genes an item of that structure reports
  // (comparison.json → geneReporting).
  var STRUCTURE_GENES = {
    direct:         ['RG.LOGIC.COMPARISON.BASIC'],
    equivalence:    ['RG.LOGIC.COMPARISON.BASIC'],
    interference:   ['RG.LOGIC.COMPARISON.BASIC'],
    difference:     ['RG.LOGIC.COMPARISON.BASIC'],
    mediated:       ['RG.LOGIC.COMPARISON.BASIC'],
    transitive:     ['RG.LOGIC.COMPARISON.BASIC', 'RG.LOGIC.REASONING.BASIC'],
    multi_criteria: ['RG.LOGIC.COMPARISON.BASIC']
  };

  // comparison.json → difficultyAxes.relation_complexity note.
  var RELATION_OF = {
    direct:'direct', equivalence:'direct',
    interference:'indirect', difference:'indirect', mediated:'indirect',
    transitive:'chain', multi_criteria:'constrained'
  };

  /**
   * Position on the difficulty axes declared in comparison.json. The level sets
   * the base; the template's own structure and task then set relation and task
   * complexity, and multi_criteria widens the dimension axis.
   */
  function difficultyAxisFor(levelId, tpl) {
    var base = {
      K1: { object_complexity:'concrete', dimension_complexity:'single',
            relation_complexity:'direct', task_complexity:'judge', language_complexity:'action',
            transfer_complexity:'within-domain' },
      K2: { object_complexity:'concrete', dimension_complexity:'single',
            relation_complexity:'direct', task_complexity:'judge', language_complexity:'question',
            transfer_complexity:'within-domain' },
      G1: { object_complexity:'symbolic', dimension_complexity:'single',
            relation_complexity:'direct', task_complexity:'judge', language_complexity:'question',
            transfer_complexity:'within-domain' },
      G2: { object_complexity:'symbolic', dimension_complexity:'dual',
            relation_complexity:'indirect', task_complexity:'judge', language_complexity:'compound',
            transfer_complexity:'cross-domain' }
    }[levelId];
    if (!base) return null;

    var axis = Object.assign({}, base);
    if (!tpl) return axis;
    if (RELATION_OF[tpl.structure]) axis.relation_complexity = RELATION_OF[tpl.structure];
    if (tpl.task) axis.task_complexity = tpl.task;
    if (tpl.structure === 'multi_criteria') {
      axis.dimension_complexity = (levelId === 'G2') ? 'multi' : 'dual';
    }
    return axis;
  }

  /**
   * The single place that builds the radar payload. Both activity paths call
   * this, so a change to the contract cannot land on one path and miss the
   * other. `comparisonType` equals `structure` (same convention as pattern's
   * patternType); `attributeType` keeps the template's raw `type` field.
   */
  function buildRadarContext(levelId, tpl, extra) {
    var ctx = {
      moduleId:       MODULE_ID,
      moduleType:     MODULE_TYPE,
      levelId:        levelId || null,
      gradeCode:      LEVEL_GRADE[levelId] || null,
      comparisonType: tpl ? (tpl.structure || null) : null,
      structure:      tpl ? (tpl.structure || null) : null,
      carrier:        tpl ? (tpl.carrier || null) : null,
      taskType:       tpl ? (tpl.task || null) : null,
      attributeType:  tpl ? (tpl.type || null) : null,
      difficultyAxis: difficultyAxisFor(levelId, tpl),
      sourceGameId:   SOURCE_GAME_ID
    };
    return extra ? Object.assign(ctx, extra) : ctx;
  }

  function genesFor(tpl) {
    return ((tpl && STRUCTURE_GENES[tpl.structure]) || ['RG.LOGIC.COMPARISON.BASIC']).slice();
  }

  /** Most frequent value in an array, or null. Used to label a mixed batch. */
  function _dominant(values) {
    var counts = {}, best = null, bestN = 0;
    values.forEach(function (v) {
      if (!v) return;
      counts[v] = (counts[v] || 0) + 1;
      if (counts[v] > bestN) { bestN = counts[v]; best = v; }
    });
    return best;
  }

  function registerRootGenes(ctx) {
    var unit=(ctx&&ctx.unit)||{}, genes=['RG.LOGIC.COMPARISON.BASIC'];
    if(unit.rootGeneIds&&Array.isArray(unit.rootGeneIds)) unit.rootGeneIds.forEach(function(g){genes.push(g);});
    return genes;
  }

  var _sessionTemplateMap={};

  function onAnswer(selected, q, correct, elapsedMs) {
    var tpl=_sessionTemplateMap[q.templateId];
    if(!tpl) return;
    CmpEngine.recordSessionAnswer(tpl.level, tpl.id, correct);
    var meta = {
      mode:   'puzzle',
      result: correct ? 'correct' : 'incorrect',
      radar:  buildRadarContext(tpl.level, tpl)
    };
    // optionTypes is only present on Phase-2-onward templates (§1.6); older
    // templates simply omit process, exactly as before this field existed.
    if (q.optionTypes && q.optionTypes[selected]) meta.process = { errorType: q.optionTypes[selected] };
    CmpEngine.recordAttempt(q.templateId, q.variantId||CmpEngine.makeVariantId(q.templateId), correct, elapsedMs||0, false, tpl, meta);
  }

  /**
   * Generate an item for tpl, redrawing (a few times) when it matches one of
   * the template's recently shown variants, then remember the one shown.
   */
  function _freshQuestion(tpl) {
    var q = null, sig = null;
    for (var i = 0; i < 6; i++) {
      q = generateQuestion(tpl);
      if (!q) return null;
      sig = CmpEngine.variantSignature(q);
      if (!CmpEngine.isRecentVariant(tpl.id, sig)) break;
    }
    CmpEngine.rememberVariant(tpl.id, sig);
    return q;
  }

  // ── Grade level selector ───────────────────────────────────────────────────

  var GRADE_LEVELS=[
    {id:'K1',badge:'K1',nameZh:'幼儿园小/中班',nameEn:'Pre-K',descZh:'3–4岁 · 无需数字',descEn:'Age 3–4 · No numbers',free:true},
    {id:'K2',badge:'K2',nameZh:'幼儿园大班',nameEn:'Kindergarten',descZh:'5岁 · 10以内',descEn:'Age 5 · Within 10',free:true},
    {id:'G1',badge:'G1',nameZh:'小学一年级',nameEn:'Grade 1',descZh:'6岁 · 20以内',descEn:'Age 6 · Within 20',free:true},
    {id:'G2',badge:'G2',nameZh:'小学二年级',nameEn:'Grade 2',descZh:'7岁 · 100以内',descEn:'Age 7 · Within 100',free:true},
    {id:'G3',badge:'G3',nameZh:'三年级',nameEn:'Grade 3',descZh:'即将推出',descEn:'Coming Soon',free:false},
    {id:'G4',badge:'G4',nameZh:'四年级',nameEn:'Grade 4',descZh:'即将推出',descEn:'Coming Soon',free:false},
    {id:'G5',badge:'G5',nameZh:'五年级',nameEn:'Grade 5',descZh:'即将推出',descEn:'Coming Soon',free:false},
    {id:'G6',badge:'G6',nameZh:'六年级',nameEn:'Grade 6',descZh:'即将推出',descEn:'Coming Soon',free:false}
  ];

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  function _buildUnitsForLevel(levelId, templates) {
    _sessionTemplateMap={};
    var selected=CmpEngine.getSessionTemplates(levelId, templates).filter(function(tpl){
      return !CmpEngine.isActivity(tpl);
    });
    var genes=[];
    var questions=selected.map(function(tpl){
      var q=_freshQuestion(tpl);
      if(!q){
        // Same guard as the interaction path: a template whose generator fails
        // must leave the cycle, or getSessionTemplates() keeps handing it back.
        console.warn('[comparison] generator produced no question for', tpl.id, '— skipping template');
        CmpEngine.skipTemplate(levelId, tpl.id);
        return null;
      }
      q.variantId=CmpEngine.makeVariantId(tpl.id);
      _sessionTemplateMap[tpl.id]=tpl;
      genesFor(tpl).forEach(function(g){ if(genes.indexOf(g)===-1) genes.push(g); });
      return q;
    }).filter(Boolean);
    var n = questions.length;
    var cycleStatus = CmpEngine.getCycleStatus(levelId);
    var resuming = cycleStatus.sessionActive && cycleStatus.doneCount > 0;
    return [{
      id:levelId+'-session',
      nameZh:levelId+' · 比较挑战'+(resuming?' · 续':''),
      nameEn:levelId+' · Comparison'+(resuming?' (resume)':''),
      icon:'⚖️',
      descZh:n+'题 · 轮次送题',
      descEn:n+' questions · Cycle',
      // Ability genes only. Where this session sits in the content tree travels
      // in moduleId / unitId / levelId — see buildRadarContext().
      rootGeneIds:genes,
      questions:questions
    }];
  }

  function _init() {
    // Loaded from templates-data.js (a plain global, like every other module's
    // data.js) rather than fetch('./templates.json'): fetch() of a same-folder
    // file is blocked when this page is opened via file://, which left the
    // page permanently blank. templates-data.js must stay content-identical to
    // templates.json — metadata/validate.js still fetches templates.json
    // directly and does not read this file.
    CmpEngine.setSessionPolicy({ size: SESSION_SIZE, maxActivities: MAX_ACTIVITIES_PER_SESSION });
    _showLevelSelector((window.CMP_TEMPLATES_DATA && window.CMP_TEMPLATES_DATA.templates) || []);
  }

  function _showLevelSelector(templates) {
    var lang=shell.lang||'zh';
    var wrap=document.createElement('div');
    wrap.id='cq-level-selector';
    wrap.innerHTML='<div class="cq-lvl-wrap">'+
      '<div class="cq-lvl-title-bar">'+
        '<button class="cq-lvl-back" id="cq-sel-back">⬅️ <span class="zh">数学启智</span><span class="en">Math</span></button>'+
        '<div class="cq-lvl-title"><span class="zh">比较 · 选择年级</span><span class="en">Comparison · Grade</span></div>'+
        IH.controlsHtml('lvl')+
      '</div>'+
      '<div class="cq-lvl-grid">'+
      // appended below
      GRADE_LEVELS.map(function(lvl){
        var lk=!lvl.free;
        return '<div class="cq-lvl-card'+(lk?' locked':'')+'" data-level="'+lvl.id+'">'+
          '<div class="cq-lvl-badge">'+lvl.badge+'</div>'+
          '<div class="cq-lvl-name"><span class="zh">'+lvl.nameZh+'</span><span class="en">'+lvl.nameEn+'</span></div>'+
          '<div class="cq-lvl-desc"><span class="zh">'+lvl.descZh+'</span><span class="en">'+lvl.descEn+'</span></div>'+
          '<div class="cq-lvl-tag '+(lk?'locked-tag':'free')+'"><span class="zh">'+(lk?'即将推出':'免费')+'</span><span class="en">'+(lk?'Soon':'Free')+'</span></div>'+
          (function(){
            if(lk) return '';
            var cs=CmpEngine.getCycleStatus(lvl.id);
            if(cs.unlocked) return '<div class="cq-lvl-cycle done"><span class="zh">\u2713 \u5df2\u89e3\u9501</span><span class="en">\u2713 Unlocked</span></div>';
            if(cs.started)  return '<div class="cq-lvl-cycle"><span class="zh">\u8fdb\u5ea6 '+cs.doneCount+'/'+cs.totalCount+'</span><span class="en">'+cs.doneCount+'/'+cs.totalCount+' done</span></div>';
            return '';
          })()+
        '</div>';
      }).join('')+
      '</div></div>';

    function applyLang(l){
      wrap.querySelectorAll('.zh').forEach(function(el){el.style.display=l==='zh'?'':'none';});
      wrap.querySelectorAll('.en').forEach(function(el){el.style.display=l==='en'?'':'none';});
    }
    applyLang(lang);
    document.addEventListener('shell:langchange',function(e){applyLang(e.detail&&e.detail.lang);});
    document.body.appendChild(wrap);
    IH.wire('lvl');

    var backBtn=document.getElementById('cq-sel-back');
    if(backBtn) backBtn.addEventListener('click',function(){window.location.href='../index.html';});

    wrap.addEventListener('click',function(e){
      var card=e.target.closest('.cq-lvl-card:not(.locked)');
      if(!card) return;
      wrap.remove();
      _launchGame(card.getAttribute('data-level'), templates);
    });
  }

  function _tearDownShell() {
    var wrap=document.querySelector('.s1-wrap');
    var transcript=document.getElementById('s1-transcript');
    var overlay=document.getElementById('s1-overlay');
    if(wrap) wrap.remove();
    if(transcript) transcript.remove();
    if(overlay) overlay.remove();
  }

  var LEVEL_ORDER = ['K1', 'K2', 'G1', 'G2'];

  function _launchGame(levelId, templates) {
    var selected = CmpEngine.getSessionTemplates(levelId, templates);

    // Single-choice items run first as one batch through shell.createGame;
    // activities (at most MAX_ACTIVITIES_PER_SESSION) follow one at a time
    // through ActivityRunner, so an activity is never the first item.
    // getSessionTemplates() resumes from whatever is still unanswered, so
    // re-entering this function after each step is enough.
    var hasPuzzle = selected.some(function (tpl) { return !CmpEngine.isActivity(tpl); });
    var firstActivity = selected.filter(CmpEngine.isActivity)[0];

    if (hasPuzzle) {
      _launchPuzzleSession(levelId, templates);
    } else if (firstActivity) {
      _launchInteraction(firstActivity, levelId, templates);
    }
  }

  /**
   * Put an Interaction / Mini-game activity on the thinking radar's depth axis.
   *
   * Until now only the puzzle path reached `shell.report()` (createGame calls it
   * for us), so the two continuous runtimes existed in the engine's own event
   * stream but were invisible to `me:{gameId}:history:*` — i.e. invisible to the
   * radar, which reads gene × gradeCode from exactly that key prefix.
   *
   * Two units of `total` meet here and must not be confused:
   *   - puzzle / interaction: `total` counts questions or solved activities;
   *   - mini-game:            `total` counts ROUNDS.
   * That is why `activityRuntime` is stamped on the record — the history panel
   * and the radar both need it to know which arithmetic applies. It must also be
   * non-zero: shell's history reader skips records without a `total`, so a
   * mini-game run with an unset round count would be dropped in silence.
   */
  function _reportInteraction(tpl, levelId, attempt, correct) {
    if (!shell || typeof shell.report !== 'function') return;
    var isMini = (attempt.mode || tpl.runtime || tpl.mode) === 'mini';
    var p = attempt.process || {};
    // A run that produced no rounds carries no evidence about the child; report
    // one unit of work rather than a zero that the reader would discard.
    var rounds = isMini ? (p.rounds || 0) : 0;
    var radar = buildRadarContext(tpl.level || levelId, tpl);

    shell.report({
      gameId:    SOURCE_GAME_ID,
      // Same cycle session as the puzzle batch, so keep the unit id and tell the
      // two apart by activityRuntime / templateId instead of by a parallel id.
      unitId:    levelId + '-session',
      templateId: tpl.id,
      variantId:  attempt.variantId || null,
      score:     isMini ? (p.correctRounds || 0) : (correct ? 1 : 0),
      total:     isMini ? (rounds || 1) : 1,
      timeMs:    attempt.responseMs || 0,
      // No interaction runtime has a hint affordance today (the templates carry
      // hint text, nothing counts its use), so 0 is a fact, not a placeholder.
      hintsUsed: 0,
      geneIds:   genesFor(tpl),
      shell:     'shell-1',
      activityRuntime: isMini ? 'mini' : 'interaction',
      activityMode:    attempt.mode || tpl.runtime || tpl.mode || null,
      result:    attempt.result || null,
      // The same four coordinates the puzzle path lifts out of its context are
      // flattened here too, so one reader shape works for all three runtimes.
      levelId:        radar.levelId,
      gradeCode:      radar.gradeCode,
      comparisonType: radar.comparisonType,
      difficultyAxis: radar.difficultyAxis,
      moduleId:       radar.moduleId,
      moduleType:     radar.moduleType,
      context:   radar
    });
  }

  // Run a single long-form template (sort / match / group / fit / mini) via ActivityRunner
  function _launchInteraction(tpl, levelId, templates) {
    var variant = _freshQuestion(tpl);
    if (!variant) {
      // Broken template definition. Drop it out of the cycle instead of
      // re-entering _launchGame with the same unanswered template forever.
      console.warn('[comparison] generator produced no variant for', tpl.id, '— skipping template');
      CmpEngine.skipTemplate(levelId, tpl.id);
      _launchGame(levelId, templates);
      return;
    }
    variant.variantId = CmpEngine.makeVariantId(tpl.id);

    ActivityRunner.launch(tpl, variant, {
      levelId:    levelId,
      onComplete: function (attempt) {
        // A continuous activity cannot report a boolean, so runtimes may hand
        // back 'passed' (reached the threshold) or 'completed' (played to the
        // end below it). Both are real work; only the first counts as correct.
        // 'aborted' means the child left mid-game: nothing is recorded and the
        // template stays in the cycle, so leaving is never a scored failure.
        if (attempt.result === 'aborted') {
          _showLevelSelector(templates);
          return;
        }
        var correct = attempt.result === 'correct' || attempt.result === 'passed';

        // Record in cycle
        CmpEngine.recordSessionAnswer(tpl.level, tpl.id, correct);
        CmpEngine.recordAttempt(tpl.id, attempt.variantId, correct,
          attempt.responseMs, false, tpl, {
            mode:    attempt.mode || tpl.runtime || tpl.mode,
            result:  attempt.result,
            process: attempt.process,
            // Interaction and mini activities never pass through
            // getReportContext(), so the radar coordinates have to be attached
            // here or these attempts land on the radar with no depth at all.
            radar:   buildRadarContext(tpl.level || levelId, tpl)
          });

        _reportInteraction(tpl, levelId, attempt, correct);

        // Continue: if session still has puzzle templates (resume), run them now
        var remaining = CmpEngine.getSessionRemaining(levelId);
        if (remaining > 0) {
          _launchGame(levelId, templates);   // resume picks up remaining templates
        } else {
          var sr = CmpEngine.completeSession(levelId);
          _showInteractionResult(attempt, sr, levelId, templates);
        }
      },
      onBack: function () {
        _showLevelSelector(templates);
      }
    });
  }

  // Per-mode result wording. Every drag-and-drop runtime keeps the child working
  // until the activity is solved, so 'correct' is the normal path there;
  // INCORRECT_TEXT is the fallback for a runtime that hands back a failed
  // attempt. Mini-games are different: they always run to the end, so their
  // wording is keyed off 'passed' vs 'completed' instead.
  var INTERACTION_RESULT_TEXT = {
    sort:  { zh: '排对了！',     en: 'Correct order!' },
    match: { zh: '全部配对成功！', en: 'All matched!' },
    group: { zh: '全部分类正确！', en: 'All sorted!' },
    fit:   { zh: '成功过河了！',   en: 'Across the river!' },
    mini:  { zh: '这一局完成了！', en: 'Round complete!' }
  };
  var INTERACTION_INCORRECT_TEXT = { zh: '继续尝试！', en: 'Keep trying!' };
  // Below threshold is not a loss — the child finished the game.
  var MINI_COMPLETED_TEXT = { zh: '玩完啦，越练越准！', en: 'Finished — keep practising!' };

  // A mini-game is many rounds long, so the child deserves to see what the run
  // actually was. The runtime deliberately does not draw this itself — it hands
  // the numbers over in `process` and the shared result overlay renders them, so
  // every future game gets the same summary for free. No score is shown on
  // purpose: speed and accuracy are the feedback, points would become the goal.
  function _miniStatsHtml(attempt) {
    var p = attempt && attempt.process;
    if (!p || attempt.mode !== 'mini' || !p.rounds) return '';
    var acc = typeof p.accuracyPct === 'number' ? p.accuracyPct : 0;
    var sec = p.avgRoundMs ? (p.avgRoundMs / 1000).toFixed(1) : null;
    function cell(emoji, value, zh, en) {
      return '<div style="min-width:78px;text-align:center">' +
        '<div style="font-size:22px">' + emoji + '</div>' +
        '<div style="font-size:20px;font-weight:900;color:#1d4ed8">' + value + '</div>' +
        '<div style="font-size:12px;color:#64748b">' +
          '<span class="zh">' + zh + '</span><span class="en">' + en + '</span></div>' +
      '</div>';
    }
    return '<div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;' +
      'background:#f8fafc;border:2px solid #e2e8f0;border-radius:16px;padding:12px 16px;">' +
      cell('✅', p.correctRounds + '/' + p.rounds, '答对', 'Correct') +
      cell('🎯', acc + '%', '准确率', 'Accuracy') +
      cell('🔥', p.bestStreak || 0, '最长连对', 'Best streak') +
      (sec ? cell('⚡', sec + 's', '平均用时', 'Avg time') : '') +
    '</div>';
  }

  // Brief result overlay after a solo long-form activity
  function _showInteractionResult(attempt, sr, levelId, templates) {
    var nextIdx   = LEVEL_ORDER.indexOf(levelId) + 1;
    var nextLevel = nextIdx < LEVEL_ORDER.length ? LEVEL_ORDER[nextIdx] : null;

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.94);z-index:600;' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:32px;';

    var good = attempt.result === 'correct' || attempt.result === 'passed';
    var icon = sr.cycleComplete && sr.unlocked ? '🏆' : (good ? '⭐' : '💪');
    var text = good
      ? (INTERACTION_RESULT_TEXT[attempt.mode] || { zh: '做对了！', en: 'Well done!' })
      : (attempt.result === 'completed' ? MINI_COMPLETED_TEXT : INTERACTION_INCORRECT_TEXT);
    overlay.innerHTML =
      '<div style="font-size:52px">' + icon + '</div>' +
      '<div style="font-size:20px;font-weight:900;color:#1e3a8a;text-align:center">' +
        '<span class="zh">' + text.zh + '</span>' +
        '<span class="en">' + text.en + '</span>' +
      '</div>' +
      _miniStatsHtml(attempt) +
      '<div id="sor-acts" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;"></div>';

    document.body.appendChild(overlay);
    _applyLangVisibility(overlay);

    var acts = document.getElementById('sor-acts');

    // Next group button
    var nextBtn = document.createElement('button');
    nextBtn.className = 's1-abtn s1-primary';
    nextBtn.innerHTML = '<span class="zh">下一组 →</span><span class="en">Next Group →</span>';
    _applyLangVisibility(nextBtn);
    nextBtn.addEventListener('click', function () {
      overlay.remove();
      _launchGame(levelId, templates);
    });
    acts.appendChild(nextBtn);

    // Upgrade button if cycle complete + unlocked
    if (sr.cycleComplete && sr.unlocked && nextLevel) {
      var upBtn = document.createElement('button');
      upBtn.className = 's1-abtn s1-primary';
      upBtn.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
      upBtn.innerHTML = '<span class="zh">升级到 ' + nextLevel + ' →</span><span class="en">Next: ' + nextLevel + ' →</span>';
      _applyLangVisibility(upBtn);
      upBtn.addEventListener('click', function () { overlay.remove(); _launchGame(nextLevel, templates); });
      acts.appendChild(upBtn);
    }

    // Home button
    var homeBtn = document.createElement('button');
    homeBtn.className = 's1-abtn s1-outline';
    homeBtn.innerHTML = '<span class="zh">返回主页</span><span class="en">Home</span>';
    _applyLangVisibility(homeBtn);
    homeBtn.addEventListener('click', function () { overlay.remove(); _showLevelSelector(templates); });
    acts.appendChild(homeBtn);
  }

  // Original puzzle flow (renamed to avoid confusion)
  function _launchPuzzleSession(levelId, templates) {
    var units = _buildUnitsForLevel(levelId, templates);
    shell.createGame({
      id:'learning-math-comparison',
      theme:{primary:'#2563eb',primary2:'#1d4ed8',bg:'#eff6ff'},
      gui:{
        header:{show:true,showBack:true},
        language:{enabled:true,default:'en'},
        audio:{music:{enabled:true,defaultOn:false},sound:{enabled:true,defaultOn:true}},
        history:{enabled:true},
        help:{enabled:true,
          contentZh:'仔细观察题目，选出符合要求的答案。形状/颜色题：找出和其他两个不一样的那个。',
          contentEn:'Observe the question and pick the right answer. Shape/color: find the odd one out.'}
      },
      title:{zh:'⚖️ 比较 · '+levelId,en:'⚖️ Comparison · '+levelId},
      subtitle:{zh:'观察、判断、比较',en:'Observe, Judge, Compare'},
      // debug:false → real progression (unit 1 open, the rest unlock on pass).
      // Append ?debug=1 to the URL when testing later units.
      passScore:Math.max(1, Math.ceil(units[0].questions.length * 0.75)), debug:false, units:units,
      renderSequence:renderSequence, renderOption:renderOption,
      checkAnswer:checkAnswer, getVoiceText:getVoiceText,
      registerRootGenes:registerRootGenes, onAnswer:onAnswer,
      getReportContext:function(ctx){
        // A puzzle session is a mixed batch, so the batch is labelled with its
        // dominant structure and the level's own axis position (no
        // per-template refinement — that only makes sense per attempt).
        var tpls = Object.keys(_sessionTemplateMap).map(function (id) { return _sessionTemplateMap[id]; });
        function uniq(key) {
          return tpls.map(function (t) { return t[key]; }).filter(function (v, i, a) {
            return v && a.indexOf(v) === i;
          });
        }
        var dominant = _dominant(tpls.map(function (t) { return t.structure; }));
        return buildRadarContext(levelId, null, {
          comparisonType:  dominant,
          structure:       dominant,
          comparisonTypes: uniq('structure'),
          structures:      uniq('structure'),
          carriers:        uniq('carrier'),
          taskTypes:       uniq('task'),
          activityRuntime: 'puzzle'
        });
      }
    });

    _injectShellHomeBackButton(templates);
    _watchForResultAndInjectNextLevel(levelId, templates);
  }

  // Add "← 返回选级" button to shell home header so user can go back to grade chooser.
  function _injectShellHomeBackButton(templates) {
    var homeHdr = document.querySelector('#s1-home .s1-hdr');
    if (!homeHdr || document.getElementById('cq-home-back')) return;
    var btn = document.createElement('button');
    btn.id = 'cq-home-back';
    btn.innerHTML = '⬅️';
    btn.title = '返回选级 / Back to levels';
    btn.addEventListener('click', function() {
      _tearDownShell();
      _showLevelSelector(templates);
    });
    homeHdr.insertBefore(btn, homeHdr.firstChild);
  }

  // Show progress + conditionally show upgrade button on result screen.
  function _watchForResultAndInjectNextLevel(levelId, templates) {
    var nextIdx   = LEVEL_ORDER.indexOf(levelId) + 1;
    var nextLevel = nextIdx < LEVEL_ORDER.length ? LEVEL_ORDER[nextIdx] : null;

    var resultEl = document.getElementById('s1-result');
    if (!resultEl) return;

    var injected = false;
    var observer = new MutationObserver(function() {
      if (injected || resultEl.classList.contains('s1-hidden')) return;
      injected = true;
      observer.disconnect();

      var acts = document.getElementById('s1-racts');

      // Activities still pending in this session: carry on instead of closing it.
      if (CmpEngine.getSessionRemaining(levelId) > 0) {
        if (!acts) return;
        while (acts.firstElementChild !== acts.lastElementChild) acts.removeChild(acts.firstElementChild);
        var goBtn = document.createElement('button');
        goBtn.className = 's1-abtn s1-primary';
        goBtn.innerHTML = '<span class="zh">继续：动手活动 →</span><span class="en">Continue: activities →</span>';
        _applyLangVisibility(goBtn);
        goBtn.addEventListener('click', function() {
          _tearDownShell();
          _launchGame(levelId, templates);
        });
        acts.insertBefore(goBtn, acts.lastElementChild);
        return;
      }

      // Finalise session and get cycle status
      var sr = CmpEngine.completeSession(levelId);

      if (!acts) return;

      // Rewrite retry button — it will relaunch with fresh questions
      var retryBtn = acts.firstElementChild;
      if (retryBtn) {
        var freshRetry = retryBtn.cloneNode(true);
        retryBtn.parentNode.replaceChild(freshRetry, retryBtn);
        freshRetry.addEventListener('click', function() {
          _tearDownShell();
          _launchGame(levelId, templates);
        });
      }

      _injectCycleProgress(levelId, sr, acts, nextLevel);

      if (sr.cycleComplete) {
        // Cycle done — show upgrade or retry-cycle; no auto-advance
        if (sr.unlocked && nextLevel) {
          var upgradeBtn = document.createElement('button');
          upgradeBtn.className = 's1-abtn s1-primary';
          upgradeBtn.innerHTML = '<span class="zh">升级到 ' + nextLevel + ' →</span><span class="en">Next: ' + nextLevel + ' →</span>';
          _applyLangVisibility(upgradeBtn);
          upgradeBtn.addEventListener('click', function() { _tearDownShell(); _launchGame(nextLevel, templates); });
          acts.insertBefore(upgradeBtn, acts.lastElementChild);
        }
      } else {
        // Cycle in progress — show "next group" button instead of auto-advance
        var nextBtn = document.createElement('button');
        nextBtn.className = 's1-abtn s1-primary';
        nextBtn.innerHTML = '<span class="zh">下一组 →</span><span class="en">Next Group →</span>';
        _applyLangVisibility(nextBtn);
        nextBtn.addEventListener('click', function() {
          _tearDownShell();
          _launchGame(levelId, templates);
        });
        acts.insertBefore(nextBtn, acts.lastElementChild);
      }
    });

    observer.observe(resultEl, { attributes: true, attributeFilter: ['class'] });
  }

  function _injectCycleProgress(levelId, sr, acts, nextLevel) {
    var cycleComplete = sr.cycleComplete;
    var doneCount  = sr.doneCount || 0;
    var totalCount = sr.totalCount || 1;
    var pct = Math.round(doneCount / totalCount * 100);
    var accuracyPct = sr.accuracyPct || 0;

    var color, labelZh, labelEn, msgZh, msgEn, barPct;
    if (cycleComplete) {
      barPct  = accuracyPct;
      color   = sr.unlocked ? '#22c55e' : '#f59e0b';
      labelZh = levelId + ' 准确率'; labelEn = levelId + ' Accuracy';
      if (sr.unlocked && !nextLevel) {
        // Terminal level (G2) mastered: there is nowhere left to "upgrade"
        // to, so say so explicitly instead of just falling silent — the
        // retry button still works, this only adds the missing acknowledgment.
        msgZh = '🏆 K1-G2 全部内容已完成！' + levelId + ' 准确率 ' + accuracyPct + '%，可以继续练习巩固。';
        msgEn = '🏆 All of K1-G2 complete! ' + levelId + ' accuracy ' + accuracyPct + '% — keep practicing if you like.';
      } else {
        msgZh = sr.unlocked ? levelId + ' 已掌握！准确率 ' + accuracyPct + '% 🎉' : '准确率 ' + accuracyPct + '%，建议再来一轮（需要 ≥80%）';
        msgEn = sr.unlocked ? levelId + ' mastered! ' + accuracyPct + '% 🎉' : 'Accuracy ' + accuracyPct + '%, try again (need ≥80%)';
      }
    } else {
      barPct  = pct;
      color   = '#3b82f6';
      labelZh = levelId + ' 本轮进度'; labelEn = levelId + ' Cycle';
      msgZh   = '已完成 ' + doneCount + '/' + totalCount + ' 题，继续加油！';
      msgEn   = doneCount + '/' + totalCount + ' done — keep going!';
    }

    var div = document.createElement('div');
    div.className = 'cq-prog';
    div.innerHTML =
      '<div class="cq-prog-row">' +
        '<span class="cq-prog-label"><span class="zh">' + labelZh + '</span><span class="en">' + labelEn + '</span></span>' +
        '<span class="cq-prog-pct" style="color:' + color + '">' + (cycleComplete ? accuracyPct + '%' : doneCount + '/' + totalCount) + '</span>' +
      '</div>' +
      '<div class="cq-prog-track"><div class="cq-prog-fill" style="width:' + Math.min(100, barPct) + '%;background:' + color + '"></div></div>' +
      '<div class="cq-prog-msg"><span class="zh">' + msgZh + '</span><span class="en">' + msgEn + '</span></div>';
    _applyLangVisibility(div);
    acts.parentNode.insertBefore(div, acts);
  }

  function _applyLangVisibility(el) {
    var lang = shell.lang || 'zh';
    function apply(l) {
      el.querySelectorAll('.zh').forEach(function(n){ n.style.display = l==='zh' ? '' : 'none'; });
      el.querySelectorAll('.en').forEach(function(n){ n.style.display = l==='en' ? '' : 'none'; });
    }
    apply(lang);
    document.addEventListener('shell:langchange', function(e){ apply(e.detail && e.detail.lang); });
  }

  // Background music now lives in the shared engine: shell.audio (see shell.js).

  _init();

}());
