(function(){
  if(window.__layoutEditorV2) return; window.__layoutEditorV2=true;
  const Z = 2147483600;
  const STORAGE_KEY = 'layoutEditorV2';
  const original = new WeakMap(); // snapshot before any user changes
  const active = new Set(); // elements with move/resize handles
  let drag=null, resize=null;
  const state = loadState(); // persisted element style overrides
  // --- helpers ---
  const px = v=>v+'px';
  const uid = ()=>Math.random().toString(36).slice(2,9);
  function snapshot(el){ if(original.has(el)) return; const cs=getComputedStyle(el); original.set(el,{position:el.style.position,left:el.style.left,top:el.style.top,width:el.style.width,height:el.style.height,bg:el.style.backgroundColor,bw:el.style.borderWidth,bs:el.style.borderStyle,bc:el.style.borderColor,op:el.style.opacity||'',csPos:cs.position}); }
  function applyPersisted(el){ const id = ensureId(el); if(state[id]){ const s=state[id]; ['backgroundColor','borderColor','borderWidth','borderStyle','opacity'].forEach(k=>{ if(s[k]!=null) el.style[k]=s[k];}); }}
  function save(el,prop,val){ const id=ensureId(el); state[id]=state[id]||{}; state[id][prop]=val; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function loadState(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}} }
  function ensureId(el){ if(!el.dataset.le2) el.dataset.le2 = uid(); return el.dataset.le2; }
  function label(el){ const id = el.id? '#'+el.id:''; const cls = el.classList.length?'.'+Array.from(el.classList).slice(0,2).join('.') : ''; return `<${el.tagName.toLowerCase()}>${id}${cls}`; }
  function elements(){ return Array.from(document.body.querySelectorAll('*'))
    .filter(el=> !el.closest('.le2-root') && el.tagName!=='SCRIPT' && el.tagName!=='STYLE'); }
  function restore(el){ const snap=original.get(el); if(!snap) return; Object.assign(el.style,{position:snap.position,left:snap.left,top:snap.top,width:snap.width,height:snap.height,backgroundColor:snap.bg,borderWidth:snap.bw,borderStyle:snap.bs,borderColor:snap.bc,opacity:snap.op}); const id=ensureId(el); delete state[id]; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); deactivate(el); rebuild(); }
  function deactivate(el){ active.delete(el); el.classList.remove('le2-active'); removeHandles(el); }
  function activate(el){ active.add(el); el.classList.add('le2-active'); addHandles(el); }
  function addHandles(el){ if(el.querySelector(':scope>.le2-h-move')) return; const cs=getComputedStyle(el); if(cs.position==='static') el.style.position='relative'; const mv=document.createElement('div'); mv.className='le2-h-move'; const rs=document.createElement('div'); rs.className='le2-h-resize'; el.append(mv,rs); mv.addEventListener('mousedown',e=>{e.preventDefault(); ensureAbsolute(el); drag = {el,x:e.clientX,y:e.clientY,l:parseFloat(el.style.left)||0,t:parseFloat(el.style.top)||0};}); rs.addEventListener('mousedown',e=>{e.preventDefault(); ensureAbsolute(el); resize = {el,x:e.clientX,y:e.clientY,w:el.offsetWidth,h:el.offsetHeight};}); }
  function removeHandles(el){ el.querySelectorAll(':scope>.le2-h-move,:scope>.le2-h-resize').forEach(n=>n.remove()); }
  function ensureAbsolute(el){ const cs=getComputedStyle(el); if(cs.position==='absolute' || cs.position==='fixed') return; const r=el.getBoundingClientRect(); el.style.position='absolute'; el.style.left=px(r.left+window.scrollX); el.style.top=px(r.top+window.scrollY); el.style.width=px(r.width); el.style.height=px(r.height); }

  // --- UI ---
  const launcher = document.createElement('button'); launcher.textContent='Layout Editor'; launcher.className='le2-root le2-launcher'; launcher.style.cssText=`position:fixed;top:6px;left:6px;z-index:${Z+5};background:#111;color:#fff;border:1px solid #444;padding:6px 10px;font:12px system-ui,arial;border-radius:4px;cursor:pointer;`; document.body.appendChild(launcher);
  let open=false, modal=null, list=null;
  launcher.addEventListener('click',()=>{ toggle(); });
  function toggle(){ if(!modal) build(); open=!open; modal.style.display=open?'block':'none'; if(open) rebuild(); }
  function build(){ modal=document.createElement('div'); modal.className='le2-root le2-modal'; modal.style.cssText=`position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:1000px;max-width:95vw;max-height:82vh;overflow:auto;padding:10px 14px;background:#1e1e1e;color:#eee;font:12px/1.3 system-ui,arial;border:1px solid #555;border-radius:8px;z-index:${Z+4};box-shadow:0 4px 20px rgba(0,0,0,.55);`;
    modal.innerHTML=`<style class='le2-root'>
      .le2-head,.le2-row{display:grid;grid-template-columns:18px 200px 80px 110px 110px 90px 70px;gap:6px;align-items:center;}
      .le2-head{position:sticky;top:0;background:#1e1e1e;padding:4px 0;border-bottom:1px solid #444;font-weight:600;z-index:10;}
      .le2-row{padding:3px 0;border-bottom:1px dashed #333;}
      .le2-row:last-child{border-bottom:none;}
      .le2-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .le2-btn{background:#2d2d2d;border:1px solid #555;color:#ddd;padding:4px 9px;border-radius:4px;cursor:pointer;font:12px system-ui;}
      .le2-btn:hover{background:#373737;}
      .le2-btn-green{background:#15803d;border-color:#166534;color:#fff;}
      .le2-btn-green:hover{background:#16a34a;}
      .le2-swatch{width:26px;height:20px;border:1px solid #666;border-radius:4px;cursor:pointer;display:inline-block;}
      .le2-pop{position:absolute;background:#222;border:1px solid #555;padding:6px 8px;border-radius:6px;box-shadow:0 2px 10px rgba(0,0,0,.5);display:flex;flex-direction:column;gap:6px;z-index:${Z+10};}
      .le2-number{width:60px;padding:2px 4px;background:#111;border:1px solid #555;color:#eee;border-radius:4px;}
      select.le2-border{padding:2px 4px;background:#111;border:1px solid #555;color:#eee;border-radius:4px;}
      .le2-active{outline:1px dashed #0ea5e9;outline-offset:2px;}
      .le2-h-move,.le2-h-resize{position:absolute;background:#0ea5e9;color:#fff;z-index:${Z+3};display:flex;align-items:center;justify-content:center;}
      .le2-h-move{width:18px;height:18px;border-radius:50%;top:-10px;left:50%;transform:translate(-50%,0);cursor:move;font-size:10px;}
      .le2-h-resize{width:14px;height:14px;bottom:-7px;right:-7px;cursor:nwse-resize;border-radius:3px;font-size:10px;}
      .le2-toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:8px;flex-wrap:wrap;}
      .le2-search{flex:1;min-width:160px;padding:4px 6px;background:#111;border:1px solid #444;color:#eee;border-radius:4px;}
      .le2-muted{color:#888;font-style:italic;font-size:11px;padding:4px 0 6px;}
    </style>
    <div class='le2-toolbar'>
      <div style='display:flex;gap:6px;align-items:center;'>
        <button class='le2-btn le2-refresh'>Refresh</button>
        <button class='le2-btn le2-close'>&times;</button>
      </div>
      <input class='le2-search' placeholder='Filter elements (tag, #id, .class)' />
    </div>
    <div class='le2-muted'>Check to enable move/resize. Style changes apply immediately & persist (localStorage). Restore reverts and clears persistence.</div>
    <div class='le2-head'><div></div><div>Element</div><div>Border</div><div>Border Color</div><div>Fill</div><div>Opacity</div><div>Restore</div></div>
    <div class='le2-list'></div>`;
    list = modal.querySelector('.le2-list');
    modal.querySelector('.le2-close').addEventListener('click',toggle);
    modal.querySelector('.le2-refresh').addEventListener('click',()=>rebuild(true));
    modal.querySelector('.le2-search').addEventListener('input',()=>rebuild());
    document.body.appendChild(modal);
  }

  function rebuild(forceReload=false){ if(!list) return; list.innerHTML=''; const filter = (modal.querySelector('.le2-search')?.value||'').trim().toLowerCase(); elements().forEach(el=>{ ensureId(el); snapshot(el); applyPersisted(el); if(filter && !label(el).toLowerCase().includes(filter)) return; const cs=getComputedStyle(el); const bw=parseInt(cs.borderWidth)||0; const bc=cs.borderColor; const bg=cs.backgroundColor; const op=Math.round((parseFloat(cs.opacity)||1)*100); const row=document.createElement('div'); row.className='le2-row'; row.dataset.target=el.dataset.le2; const isActive=active.has(el); row.innerHTML=`<input type='checkbox' class='le2-check' ${isActive?'checked':''}/><div class='le2-label' title='${label(el)}'>${label(el)}</div><select class='le2-border'>${[0,1,2,3].map(n=>`<option value='${n}' ${n===bw?'selected':''}>${n}px</option>`).join('')}</select><div data-role='border-color' class='le2-swatch' style='background:${bc}'></div><div data-role='fill-color' class='le2-swatch' style='background:${bg}'></div><div><input type='number' class='le2-number le2-opacity' min='0' max='100' value='${op}'/></div><div><button class='le2-btn le2-btn-green le2-restore'>Restore</button></div>`; list.appendChild(row); }); attachDelegatedHandlers(); }

  let handlersAttached=false; function attachDelegatedHandlers(){ if(handlersAttached) return; handlersAttached=true;
    // Checkbox toggle
    list.addEventListener('change',e=>{ if(e.target.classList.contains('le2-check')){ const id=e.target.closest('.le2-row').dataset.target; const el=document.querySelector(`[data-le2="${id}"]`); if(!el) return; e.target.checked? activate(el):deactivate(el); }});
    // Border size
    list.addEventListener('change',e=>{ if(e.target.classList.contains('le2-border')){ const row=e.target.closest('.le2-row'); const el=document.querySelector(`[data-le2="${row.dataset.target}"]`); if(!el) return; const v=parseInt(e.target.value)||0; el.style.borderWidth=v?px(v):'0px'; el.style.borderStyle=v?'solid':'none'; save(el,'borderWidth',el.style.borderWidth); save(el,'borderStyle',el.style.borderStyle); }});
    // Color swatches (open pop)
    list.addEventListener('click',e=>{ const sw=e.target; if(!sw.classList.contains('le2-swatch')) return; openColorPop(sw); });
    // Opacity
    list.addEventListener('input',e=>{ if(e.target.classList.contains('le2-opacity')){ const row=e.target.closest('.le2-row'); const el=document.querySelector(`[data-le2="${row.dataset.target}"]`); if(!el) return; let v=Math.min(100,Math.max(0,parseInt(e.target.value)||0)); e.target.value=v; el.style.opacity=(v/100).toString(); save(el,'opacity',el.style.opacity); }});
    // Restore
    list.addEventListener('click',e=>{ if(e.target.classList.contains('le2-restore')){ const row=e.target.closest('.le2-row'); const el=document.querySelector(`[data-le2="${row.dataset.target}"]`); if(el) restore(el); }});
  }

  function openColorPop(swatch){ closeColorPops(); const row=swatch.closest('.le2-row'); const id=row.dataset.target; const el=document.querySelector(`[data-le2="${id}"]`); if(!el) return; const prop = swatch.dataset.role==='border-color'? 'borderColor':'backgroundColor'; const pop=document.createElement('div'); pop.className='le2-pop'; pop.innerHTML=`<input type='color' class='le2-color' value='${toHex(getComputedStyle(el)[prop])}'/><div style='display:flex;gap:6px;'><button class='le2-btn le2-apply'>Apply</button><button class='le2-btn le2-close-pop'>Cancel</button></div>`; document.body.appendChild(pop); const r=swatch.getBoundingClientRect(); pop.style.left=px(r.left); pop.style.top=px(r.bottom+4); pop.querySelector('.le2-apply').addEventListener('click',()=>{ const val=pop.querySelector('.le2-color').value; swatch.style.background=val; el.style[prop]=val; save(el,prop,val); pop.remove(); }); pop.querySelector('.le2-close-pop').addEventListener('click',()=>pop.remove()); }
  function closeColorPops(){ document.querySelectorAll('.le2-pop').forEach(p=>p.remove()); }
  document.addEventListener('click',e=>{ if(!e.target.closest('.le2-pop') && !e.target.classList.contains('le2-swatch')) closeColorPops(); });

  function toHex(color){ const ctx=document.createElement('canvas').getContext('2d'); ctx.fillStyle=color; const rgb=ctx.fillStyle; const m=rgb.match(/rgb[a]?\((\d+), ?(\d+), ?(\d+)/i); if(!m) return '#000000'; return '#'+[m[1],m[2],m[3]].map(v=>('0'+parseInt(v).toString(16)).slice(-2)).join(''); }

  // global move/resize
  document.addEventListener('mousemove',e=>{ if(drag){ const {el,x,y,l,t}=drag; el.style.left=px(l + (e.clientX-x)); el.style.top=px(t + (e.clientY-y)); } else if(resize){ const {el,x,y,w,h}=resize; const nw=Math.max(20,w + (e.clientX-x)); const nh=Math.max(20,h + (e.clientY-y)); el.style.width=px(nw); el.style.height=px(nh); } });
  document.addEventListener('mouseup',()=>{ drag=null; resize=null; });

  // Mutation observer (optional small refresh when structure changes)
  const mo=new MutationObserver(()=>{ if(open){ rebuild(); }}); mo.observe(document.body,{childList:true,subtree:true,attributes:false});

  // Initial (lazy) build only when opened by user.
})();