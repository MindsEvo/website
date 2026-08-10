'use strict';
/**
 * Comparison Game  v2.0  (Adaptive Engine Edition)
 *
 * Integrates: engine.js (mastery/scheduler) + generator.js (question generators)
 * Communicates with shell.createGame via standard unit/question API.
 *
 * Session flow:
 *   1. Load templates.json
 *   2. User selects grade level (K1/K2/G1/G2)
 *   3. CmpEngine.selectSessionTemplates() picks 8 templates
 *   4. generateQuestion() builds each question
 *   5. shell.createGame runs the session
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
    '.cq-bar-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#38bdf8,#0ea5e9);}',
    '.cq-bar-label{font-size:13px;font-weight:800;color:#475569;min-width:36px;}',
    '.cq-heights{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:flex-end;height:120px;width:100%;max-width:280px;}',
    '.cq-h-col{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;}',
    '.cq-h-bar{width:44px;border-radius:8px 8px 0 0;}',
    '.cq-h-emoji{font-size:28px;line-height:1;}',
    '.cq-dots-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:400px;}',
    '.cq-dots-cell{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:10px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;}',
    '.cq-dot-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;min-height:40px;}',
    '.cq-dot{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;}',
    '.cq-items{display:flex;gap:10px;justify-content:center;width:100%;max-width:380px;}',
    '.cq-item{display:flex;flex-direction:column;align-items:center;gap:6px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:10px 12px;}',
    '.cq-item-label{font-size:12px;font-weight:800;color:#64748b;}',
    '.cq-shape-svg{width:52px;height:52px;}',
    '.cq-scene{position:relative;width:100%;max-width:380px;height:80px;background:linear-gradient(180deg,#bfdbfe 0%,#eff6ff 100%);border-radius:14px;border:1.5px solid #dbeafe;overflow:hidden;}',
    '.cq-scene-ref{position:absolute;bottom:6px;left:50%;transform:translateX(-50%);font-size:28px;line-height:1;}',
    '.cq-scene-obj{position:absolute;bottom:10px;font-size:24px;line-height:1;}',
    '.cq-containers{display:grid;grid-template-columns:1fr 1fr;gap:16px;width:100%;max-width:340px;}',
    '.cq-container-cell{display:flex;flex-direction:column;align-items:center;gap:6px;}',
    '.cq-container-visual{width:52px;height:70px;border:2.5px solid #94a3b8;border-radius:6px;background:#f1f5f9;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;}',
    '.cq-fill{width:100%;border-radius:2px;background:linear-gradient(180deg,#7dd3fc,#2563eb);}',
    '.cq-container-label{font-size:12px;font-weight:700;color:#64748b;}',
    '.cq-opt{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:72px;padding:6px 4px;}',
    '.cq-opt-emoji{font-size:30px;line-height:1;}',
    '.cq-opt-label{font-size:12px;font-weight:800;color:#64748b;}',
    '.cq-opt-bar-wrap{width:100%;height:12px;background:#dbeafe;border-radius:999px;overflow:hidden;max-width:120px;}',
    '.cq-opt-bar-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#60a5fa,#2563eb);}',
    '.cq-opt-num{font-size:32px;font-weight:900;color:#1e293b;line-height:1;}',
    '.cq-opt-dots{display:flex;flex-wrap:wrap;justify-content:center;gap:3px;max-width:110px;}',
    '.cq-opt-dot{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;}',
    '.cq-opt-h-bar{width:38px;border-radius:5px 5px 0 0;margin:0 auto;}',
    '.s1-opts.cq-3opt{grid-template-columns:repeat(3,1fr)!important;}',
    '.cq-lvl-wrap{display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px 16px;}',
    '.cq-lvl-title-bar{display:flex;align-items:center;width:100%;max-width:440px;}',
    '.cq-lvl-title{font-size:20px;font-weight:900;color:#1e3a8a;text-align:center;flex:1;}',
    '.cq-lvl-back{background:none;border:none;cursor:pointer;font-size:14px;font-weight:700;color:#2563eb;padding:4px 6px;border-radius:8px;white-space:nowrap;flex:0 0 auto;}',
    '.cq-lvl-back:hover{background:#eff6ff;}',
    '.cq-lvl-spacer{flex:0 0 60px;}',
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
    '#s1-replay{display:none!important;}',
    '#cq-home-back{margin-right:auto;background:none;border:none;cursor:pointer;font-size:20px;padding:4px 8px;color:#1e40af;line-height:1;}'
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
      case 'heart':    inner = '<text x="'+sz/2+'" y="'+(sz*0.72)+'" text-anchor="middle" font-size="'+(sz*0.7)+'" fill="'+c+'">♥</text>'; break;
      case 'diamond':  inner = '<polygon points="'+sz/2+','+m+' '+(sz-m)+','+sz/2+' '+sz/2+','+(sz-m)+' '+m+','+sz/2+'" fill="'+c+'"/>'; break;
      default:         inner = '<circle cx="'+sz/2+'" cy="'+sz/2+'" r="'+s2/2+'" fill="'+c+'"/>';
    }
    return '<svg class="cq-shape-svg" viewBox="0 0 '+sz+' '+sz+'" xmlns="http://www.w3.org/2000/svg">'+inner+'</svg>';
  }

  function _starPath(sz, fill) {
    var cx=sz/2, cy=sz/2, r1=sz*0.42, r2=sz*0.18, pts='';
    for (var i=0;i<10;i++){var r=i%2===0?r1:r2,a=(Math.PI/5)*i-Math.PI/2;pts+=(cx+r*Math.cos(a)).toFixed(2)+','+(cy+r*Math.sin(a)).toFixed(2)+' ';}
    return '<polygon points="'+pts.trim()+'" fill="'+fill+'"/>';
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
      case 'weight':       zh=q.askHeavier?'哪个<b>更重</b>？':'哪个<b>更轻</b>？'; en=q.askHeavier?'Which is <b>heavier</b>?':'Which is <b>lighter</b>?'; break;
      case 'speed':        zh=q.askFaster?'哪个<b>更快</b>？':'哪个<b>更慢</b>？'; en=q.askFaster?'Which is <b>faster</b>?':'Which is <b>slower</b>?'; break;
      case 'time':         zh=q.askLongerDuration?'哪个时间<b>更长</b>？':'哪件事<b>先</b>发生？'; en=q.askLongerDuration?'Which duration is <b>longer</b>?':'Which happens <b>first</b>?'; break;
      case 'multi_attribute': zh='哪个<b>更大</b>？（只比较大小）'; en='Which is <b>bigger</b>? (size only)'; break;
      default: zh='选出正确答案。'; en='Choose the correct answer.';
    }
    return '<span class="zh">'+zh+'</span><span class="en">'+en+'</span>';
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
      default: return '';
    }
  }

  function _sizeScene(q) {
    var max=Math.max(q.leftSizeRank,q.rightSizeRank);
    var lSz=Math.round(36+(q.leftSizeRank/max)*44), rSz=Math.round(36+(q.rightSizeRank/max)*44);
    return '<div class="cq-pair">'+
      '<div class="cq-cell"><div class="cq-emoji" style="font-size:'+lSz+'px">'+q.leftEmoji+'</div><div class="cq-label"><span class="zh">'+q.leftNameZh+'</span><span class="en">'+q.leftNameEn+'</span></div></div>'+
      '<div class="cq-cell"><div class="cq-emoji" style="font-size:'+rSz+'px">'+q.rightEmoji+'</div><div class="cq-label"><span class="zh">'+q.rightNameZh+'</span><span class="en">'+q.rightNameEn+'</span></div></div>'+
    '</div>';
  }

  function _lengthScene(q) {
    return '<div class="cq-bars">'+
      '<div class="cq-bar-row"><span class="cq-bar-label">A</span><div class="cq-bar-track"><div class="cq-bar-fill" style="width:'+q.leftPct+'%"></div></div></div>'+
      '<div class="cq-bar-row"><span class="cq-bar-label">B</span><div class="cq-bar-track"><div class="cq-bar-fill" style="width:'+q.rightPct+'%"></div></div></div>'+
    '</div>';
  }

  function _heightScene(q) {
    return '<div class="cq-heights">'+
      '<div class="cq-h-col"><div class="cq-h-emoji">'+q.leftEmoji+'</div><div class="cq-h-bar" style="height:'+q.leftHeightPct+'%;background:#38bdf8;"></div></div>'+
      '<div class="cq-h-col"><div class="cq-h-emoji">'+q.rightEmoji+'</div><div class="cq-h-bar" style="height:'+q.rightHeightPct+'%;background:#34d399;"></div></div>'+
    '</div>';
  }

  function _quantityScene(q) {
    function dots(count) {
      var h='<div class="cq-dot-grid">';
      for(var i=0;i<count;i++) h+='<div class="cq-dot">'+q.objEmoji+'</div>';
      return h+'</div>';
    }
    return '<div class="cq-dots-pair">'+
      '<div class="cq-dots-cell">'+dots(q.leftCount)+(q.showNumbers?'<div class="cq-label">'+q.leftCount+'</div>':'')+'</div>'+
      '<div class="cq-dots-cell">'+dots(q.rightCount)+(q.showNumbers?'<div class="cq-label">'+q.rightCount+'</div>':'')+'</div>'+
    '</div>';
  }

  function _sameDiffScene(q) {
    var h='<div class="cq-items">';
    q.items.forEach(function(item,idx){h+='<div class="cq-item">'+_shapeSvg(item.shape,item.color)+'<div class="cq-item-label">'+['A','B','C'][idx]+'</div></div>';});
    return h+'</div>';
  }

  function _nearFarScene(q) {
    var lx=50-(50-q.leftDistPct)*0.45, rx=50+(q.rightDistPct-50)*0.45;
    return '<div class="cq-scene">'+
      '<div class="cq-scene-ref">'+q.refEmoji+'</div>'+
      '<div class="cq-scene-obj" style="left:'+lx+'%">'+q.leftEmoji+'</div>'+
      '<div class="cq-scene-obj" style="left:'+rx+'%">'+q.rightEmoji+'</div>'+
    '</div>';
  }

  function _fullnessScene(q) {
    function con(pct,emoji,zh,en){
      return '<div class="cq-container-cell">'+
        '<div class="cq-emoji" style="font-size:22px">'+emoji+'</div>'+
        '<div class="cq-container-visual"><div class="cq-fill" style="height:'+pct+'%"></div></div>'+
        '<div class="cq-container-label"><span class="zh">'+zh+'</span><span class="en">'+en+'</span></div></div>';
    }
    return '<div class="cq-containers">'+con(q.leftFillPct,q.leftEmoji,q.leftNameZh,q.leftNameEn)+con(q.rightFillPct,q.rightEmoji,q.rightNameZh,q.rightNameEn)+'</div>';
  }

  // ── Option renderer ────────────────────────────────────────────────────────

  function renderOption(opt, q) {
    var lbl={left:{zh:'选 A',en:'A'},right:{zh:'选 B',en:'B'},A:{zh:'A',en:'A'},B:{zh:'B',en:'B'},C:{zh:'C',en:'C'}};
    var l=lbl[opt]||lbl.left;
    return '<div class="cq-opt">'+_optBody(opt,q)+
      '<div class="cq-opt-label"><span class="zh">'+l.zh+'</span><span class="en">'+l.en+'</span></div></div>';
  }

  function _optBody(opt, q) {
    if ((q.type==='shape'||q.type==='color') && q.items) {
      var idx=['A','B','C'].indexOf(opt);
      if (idx!==-1&&q.items[idx]) return _shapeSvg(q.items[idx].shape,q.items[idx].color,44);
    }
    switch (q.type) {
      case 'size': case 'weight': case 'speed': {
        var em=opt==='left'?q.leftEmoji:q.rightEmoji, nmz=opt==='left'?q.leftNameZh:q.rightNameZh, nme=opt==='left'?q.leftNameEn:q.rightNameEn;
        return '<div class="cq-opt-emoji">'+em+'</div><div class="cq-opt-label"><span class="zh">'+nmz+'</span><span class="en">'+nme+'</span></div>';
      }
      case 'height': {
        var hp=opt==='left'?q.leftHeightPct:q.rightHeightPct, he=opt==='left'?q.leftEmoji:q.rightEmoji;
        return '<div class="cq-opt-emoji" style="font-size:18px">'+he+'</div>'+
          '<div class="cq-opt-h-bar" style="height:'+Math.round(hp*0.5)+'px;background:#38bdf8;border-radius:4px 4px 0 0;width:32px;"></div>';
      }
      case 'length': {
        var pct=opt==='left'?q.leftPct:q.rightPct;
        return '<div class="cq-opt-bar-wrap"><div class="cq-opt-bar-fill" style="width:'+pct+'%"></div></div>';
      }
      case 'quantity': {
        var cnt=opt==='left'?q.leftCount:q.rightCount, dh='<div class="cq-opt-dots">';
        for(var i=0;i<cnt;i++) dh+='<div class="cq-opt-dot">'+q.objEmoji+'</div>';
        dh+='</div>';
        return dh+(q.showNumbers?'<div class="cq-opt-num">'+cnt+'</div>':'');
      }
      case 'number': {
        var num=opt==='left'?q.leftNum:q.rightNum, dotH='';
        if(q.showDots){dotH='<div class="cq-opt-dots">';for(var d=0;d<num;d++) dotH+='<div class="cq-opt-dot" style="background:#93c5fd;border-radius:50%;width:14px;height:14px;"></div>';dotH+='</div>';}
        return dotH+'<div class="cq-opt-num">'+num+'</div>';
      }
      case 'position': {
        var pe=opt==='left'?q.leftEmoji:q.rightEmoji, pnz=opt==='left'?q.leftNameZh:q.rightNameZh, pne=opt==='left'?q.leftNameEn:q.rightNameEn;
        return '<div class="cq-opt-emoji">'+pe+'</div><div class="cq-opt-label"><span class="zh">'+pnz+'</span><span class="en">'+pne+'</span></div>';
      }
      case 'fullness': {
        var fp=opt==='left'?q.leftFillPct:q.rightFillPct, fe=opt==='left'?q.leftEmoji:q.rightEmoji;
        return '<div class="cq-opt-emoji" style="font-size:22px">'+fe+'</div>'+
          '<div style="width:28px;height:44px;border:2px solid #94a3b8;border-radius:4px;background:#f1f5f9;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;">'+
            '<div style="width:100%;height:'+fp+'%;background:#3b82f6;border-radius:2px;"></div></div>';
      }
      case 'time': {
        var tev=opt==='left'?{zh:q.leftEventZh,en:q.leftEventEn}:{zh:q.rightEventZh,en:q.rightEventEn};
        return '<div class="cq-opt-label" style="font-size:15px;font-weight:900;color:#1e293b;"><span class="zh">'+tev.zh+'</span><span class="en">'+tev.en+'</span></div>';
      }
      case 'multi_attribute': {
        var item=opt==='left'?q.left:q.right, szPx=28+Math.round((item.size/10)*28);
        return _shapeSvg(item.shape,item.color,szPx);
      }
      default: return '<div class="cq-opt-label">'+opt+'</div>';
    }
  }

  // ── checkAnswer / voice ────────────────────────────────────────────────────

  function checkAnswer(selected, q) { return selected === q.answer; }

  function getVoiceText(q) {
    var zh='', en='';
    switch(q.type){
      case 'size':    zh=q.askBigger?'哪个更大，'+q.leftNameZh+'还是'+q.rightNameZh+'？':'哪个更小？'; en=q.askBigger?'Which is bigger, '+q.leftNameEn+' or '+q.rightNameEn+'?':'Which is smaller?'; break;
      case 'length':  zh=q.askLonger?'哪根更长？':'哪根更短？'; en=q.askLonger?'Which is longer?':'Which is shorter?'; break;
      case 'height':  zh=q.askTaller?'哪个更高？':'哪个更矮？'; en=q.askTaller?'Which is taller?':'Which is shorter?'; break;
      case 'quantity':zh=q.askMore?'哪边更多？':'哪边更少？'; en=q.askMore?'Which side has more?':'Which side has fewer?'; break;
      case 'number':  zh=q.askBigger?'哪个更大，'+q.leftNum+'还是'+q.rightNum+'？':'哪个更小？'; en=q.askBigger?'Which is bigger, '+q.leftNum+' or '+q.rightNum+'?':'Which is smaller?'; break;
      case 'shape':   zh='哪个形状不一样？'; en='Which shape is different?'; break;
      case 'color':   zh='哪个颜色不一样？'; en='Which color is different?'; break;
      case 'position':zh=q.askNearer?'哪个离'+q.refNameZh+'更近？':'哪个更远？'; en=q.askNearer?'Which is closer?':'Which is farther?'; break;
      case 'fullness':zh=q.askFuller?'哪个更满？':'哪个更空？'; en=q.askFuller?'Which is fuller?':'Which is more empty?'; break;
      case 'weight':  zh=q.askHeavier?'哪个更重？':'哪个更轻？'; en=q.askHeavier?'Which is heavier?':'Which is lighter?'; break;
      case 'speed':   zh=q.askFaster?'哪个更快？':'哪个更慢？'; en=q.askFaster?'Which is faster?':'Which is slower?'; break;
      case 'time':    zh=q.askLongerDuration?'哪个时间更长？':'哪件事先发生？'; en=q.askLongerDuration?'Which duration is longer?':'Which happens first?'; break;
      default:        zh='请选择答案。'; en='Choose an answer.';
    }
    return shell.lang==='zh'?zh:en;
  }

  // ── RootGene / engine hooks ────────────────────────────────────────────────

  function registerRootGenes(ctx) {
    var unit=(ctx&&ctx.unit)||{}, genes=['RG.LOGIC.COMPARISON.BASIC'];
    if(unit.rootGeneIds&&Array.isArray(unit.rootGeneIds)) unit.rootGeneIds.forEach(function(g){genes.push(g);});
    return genes;
  }

  var _sessionTemplateMap={};

  function onAnswer(selected, q, correct, elapsedMs) {
    var tpl=_sessionTemplateMap[q.templateId];
    if(!tpl) return;
    CmpEngine.recordAttempt(q.templateId, q.variantId||CmpEngine.makeVariantId(q.templateId), correct, elapsedMs||0, false, tpl);
  }

  // ── Grade level selector ───────────────────────────────────────────────────

  var GRADE_LEVELS=[
    {id:'K1',badge:'K1',nameZh:'幼儿园小/中班',nameEn:'Pre-K',descZh:'3–4岁 · 无需数字',descEn:'Age 3–4 · No numbers',free:true},
    {id:'K2',badge:'K2',nameZh:'幼儿园大班',nameEn:'Kindergarten',descZh:'5岁 · 数字入门',descEn:'Age 5 · Intro numbers',free:true},
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
    var selected=CmpEngine.selectSessionTemplates(levelId, templates);
    var questions=selected.map(function(tpl){
      var q=generateQuestion(tpl);
      if(!q) return null;
      q.variantId=CmpEngine.makeVariantId(tpl.id);
      _sessionTemplateMap[tpl.id]=tpl;
      return q;
    }).filter(Boolean);
    return [{
      id:levelId+'-session',
      nameZh:levelId+' · 比较挑战',
      nameEn:levelId+' · Comparison Challenge',
      icon:'⚖️',
      descZh:'8题 · 自适应选题',
      descEn:'8 questions · Adaptive',
      rootGeneIds:['RG.LOGIC.COMPARISON.BASIC','RG.LEARNING.MATH.COMPARISON'],
      questions:questions
    }];
  }

  function _init() {
    fetch('./templates.json')
      .then(function(r){return r.json();})
      .then(function(data){_showLevelSelector(data.templates||[]);})
      .catch(function(err){console.error('[comparison] failed to load templates.json',err);});
  }

  function _showLevelSelector(templates) {
    var lang=shell.lang||'zh';
    var wrap=document.createElement('div');
    wrap.id='cq-level-selector';
    wrap.innerHTML='<div class="cq-lvl-wrap">'+
      '<div class="cq-lvl-title-bar">'+
        '<button class="cq-lvl-back" id="cq-sel-back">⬅️ <span class="zh">数学启智</span><span class="en">Math</span></button>'+
        '<div class="cq-lvl-title"><span class="zh">比较 · 选择年级</span><span class="en">Comparison · Grade</span></div>'+
        '<div class="cq-lvl-spacer"></div>'+
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
    var units=_buildUnitsForLevel(levelId, templates);
    shell.createGame({
      id:'learning-math-comparison',
      theme:{primary:'#2563eb',primary2:'#1d4ed8',bg:'#eff6ff'},
      gui:{
        header:{show:true,showBack:true},
        language:{enabled:true,default:'zh'},
        audio:{music:{enabled:true,defaultOn:false},sound:{enabled:true,defaultOn:true}},
        history:{enabled:true},
        help:{enabled:true,
          contentZh:'仔细观察题目，选出符合要求的答案。形状/颜色题：找出和其他两个不一样的那个。',
          contentEn:'Observe the question and pick the right answer. Shape/color: find the odd one out.'}
      },
      title:{zh:'⚖️ 比较 · '+levelId,en:'⚖️ Comparison · '+levelId},
      subtitle:{zh:'观察、判断、比较',en:'Observe, Judge, Compare'},
      passScore:6, debug:true, units:units,
      renderSequence:renderSequence, renderOption:renderOption,
      checkAnswer:checkAnswer, getVoiceText:getVoiceText,
      registerRootGenes:registerRootGenes, onAnswered:onAnswer,
      getReportContext:function(ctx){
        return {moduleId:'comparison',moduleType:'metathinking',level:levelId,sourceGameId:'learning-math-comparison'};
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

  // Inject "upgrade to next grade" button into result screen when it appears.
  function _watchForResultAndInjectNextLevel(levelId, templates) {
    var nextIdx = LEVEL_ORDER.indexOf(levelId) + 1;
    if (nextIdx <= 0 || nextIdx >= LEVEL_ORDER.length) return;  // no next level (G2 is last)
    var nextLevel = LEVEL_ORDER[nextIdx];

    var resultEl = document.getElementById('s1-result');
    if (!resultEl) return;

    var injected = false;
    var observer = new MutationObserver(function() {
      if (injected || resultEl.classList.contains('s1-hidden')) return;
      injected = true;
      observer.disconnect();

      var acts = document.getElementById('s1-racts');
      if (!acts) return;

      var btn = document.createElement('button');
      btn.className = 's1-abtn s1-primary';
      btn.innerHTML =
        '<span class="zh">升级到 ' + nextLevel + ' →</span>' +
        '<span class="en">Next: ' + nextLevel + ' →</span>';

      // Apply current language visibility
      var lang = shell.lang || 'zh';
      btn.querySelectorAll('.zh').forEach(function(el){ el.style.display = lang === 'zh' ? '' : 'none'; });
      btn.querySelectorAll('.en').forEach(function(el){ el.style.display = lang === 'en' ? '' : 'none'; });
      document.addEventListener('shell:langchange', function(e) {
        var l = e.detail && e.detail.lang;
        btn.querySelectorAll('.zh').forEach(function(el){ el.style.display = l === 'zh' ? '' : 'none'; });
        btn.querySelectorAll('.en').forEach(function(el){ el.style.display = l === 'en' ? '' : 'none'; });
      });

      btn.addEventListener('click', function() {
        _tearDownShell();
        _launchGame(nextLevel, templates);
      });

      // Insert before "返回主页" (last button)
      var lastBtn = acts.lastElementChild;
      acts.insertBefore(btn, lastBtn);
    });

    observer.observe(resultEl, { attributes: true, attributeFilter: ['class'] });
  }

  // ── Background music (Web Audio API, no external files) ───────────────────

  var CmpMusic = (function () {
    var _ac = null, _playing = false, _timerId = null, _idx = 0, _nextAt = 0;

    // Pentatonic scale C-maj: C D E G A — cheerful, simple, kid-friendly
    var NOTES = [
      261.63, 293.66, 329.63, 392.00, 440.00,   // C4 D4 E4 G4 A4
      523.25, 587.33, 659.25, 783.99, 880.00     // C5 D5 E5 G5 A5
    ];

    // Melody pattern — indices into NOTES[]
    var PATTERN = [0,2,4,5,4,2,1,0, 2,4,5,7,5,4,2,4,
                   0,2,4,5,4,9,8,7, 5,4,2,0,1,2,0,0];
    var BEAT = 0.42;  // seconds per beat (≈143 bpm feels upbeat but not rushed)

    function _ac_get() {
      if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
      return _ac;
    }

    function _note(freq, t, dur) {
      var ac = _ac_get();
      var osc  = ac.createOscillator();
      var gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'triangle';  // softer timbre than sawtooth
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.07, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    function _schedule() {
      var ac = _ac_get();
      while (_nextAt < ac.currentTime + 0.25) {
        var freq = NOTES[PATTERN[_idx % PATTERN.length]];
        _note(freq, _nextAt, BEAT * 0.75);
        _nextAt += BEAT;
        _idx++;
      }
      if (_playing) _timerId = setTimeout(_schedule, 120);
    }

    function start() {
      if (_playing) return;
      var ac = _ac_get();
      if (ac.state === 'suspended') ac.resume();
      _playing  = true;
      _nextAt   = ac.currentTime + 0.1;
      _schedule();
    }

    function stop() {
      _playing = false;
      if (_timerId) { clearTimeout(_timerId); _timerId = null; }
    }

    // React to shell music toggle
    document.addEventListener('shell:gui:audioChanged', function (e) {
      if (e.detail && e.detail.musicOn) start(); else stop();
    });

    return { start: start, stop: stop };
  }());

  _init();

}());
