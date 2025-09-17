import React, { useEffect, useMemo, useRef, useState } from 'react';

type Mode = 'root' | 'custom' | 'eyedropper-fallback';

export interface HighlightModalProps {
  anchorRect: DOMRect | null;
  color: string;
  onClose: () => void;
  onApply: (rgba: string) => void;
  onNone: () => void;
  onLivePreview?: (rgba: string) => void; // updates editor highlights in real-time
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s; const x = c * (1 - Math.abs(((h / 60) % 2) - 1)); const m = v - c;
  let r=0,g=0,b=0;
  if (h < 60) { r=c; g=x; }
  else if (h < 120) { r=x; g=c; }
  else if (h < 180) { g=c; b=x; }
  else if (h < 240) { g=x; b=c; }
  else if (h < 300) { r=x; b=c; }
  else { r=c; b=x; }
  return { r: Math.round((r+m)*255), g: Math.round((g+m)*255), b: Math.round((b+m)*255) };
}
function rgbToHex(r:number,g:number,b:number){return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');}
function hexToRgb(hex: string){
  const n = hex.startsWith('#') ? hex.slice(1) : hex;
  if (n.length !== 6) return { r: 224, g: 200, b: 122 };
  return { r: parseInt(n.slice(0,2),16), g: parseInt(n.slice(2,4),16), b: parseInt(n.slice(4,6),16) };
}

const DropIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c-.3 0-.6.1-.8.4C9 5.1 6 9.8 6 12.8 6 16.6 8.7 20 12 20s6-3.4 6-7.2C18 9.8 15 5.1 12.8 2.4 12.6 2.1 12.3 2 12 2zM8 12.8C8 10.6 10.6 6.8 12 4.9c1.4 1.9 4 5.7 4 7.9 0 2.9-1.8 5.2-4 5.2s-4-2.3-4-5.2z"/></svg>
);
const DropSlashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.2 3 3 4.2l4 4C6.4 9.4 6 10.9 6 12.8 6 16.6 8.7 20 12 20c1.9 0 3.6-.9 4.8-2.3l4 4L22 20.5 4.2 3zM12 4.9c1.4 1.9 4 5.7 4 7.9 0 .8-.1 1.6-.4 2.3l-7-7c.7-1.2 1.6-2.4 2.4-3.2z"/></svg>
);
const EyedropperIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.7 4.3a3.6 3.6 0 0 0-5.1 0l-1 1-1-1-2.1 2.1 1 1L5 13v4l2 2h4l6.6-6.6 1 1L20.7 11l-1-1 1-1a3.6 3.6 0 0 0 0-5.1zM7 15l5.2-5.2 2 2L9 17H7v-2z"/></svg>
);

const HighlightModal: React.FC<HighlightModalProps> = ({ anchorRect, color, onClose, onApply, onNone, onLivePreview }) => {
  const [mode, setMode] = useState<Mode>('root');
  const [hex, setHex] = useState<string>(() => {
    const m = color.match(/#([0-9a-f]{6})/i); if (m) return m[0];
    const m2 = color.match(/rgba?\((\d+),(\d+),(\d+)/i); if (m2) return rgbToHex(+m2[1],+m2[2],+m2[3]);
    return '#e0c87a';
  });
  const [h, setH] = useState<number>(42); // default golden hue
  const [s, setS] = useState<number>(0.5);
  const [v, setV] = useState<number>(0.75);
  const rgba = useMemo(()=>{ const {r,g,b}=hsvToRgb(h,s,v); return { r,g,b,a:0.28 }; }, [h,s,v]);
  const rgbaCss = `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})`;

  useEffect(() => { if (mode==='custom') onLivePreview?.(rgbaCss); }, [mode, rgbaCss, onLivePreview]);

  // positioning above anchor
  const stylePos: React.CSSProperties = useMemo(()=>{
    const width = 360; const height = mode==='custom' ? 420 : 140;
    if (!anchorRect) return { position:'fixed', right: 16, bottom: 80, width };
    const padding = 8;
    const left = clamp(anchorRect.left, 8, (typeof window!=='undefined'?window.innerWidth:1200)-width-8);
    const top = clamp(anchorRect.top - height - padding, 8, (typeof window!=='undefined'?window.innerHeight:800)-height-8);
    return { position:'fixed', left, top, width };
  }, [anchorRect, mode]);

  // custom picker canvases
  const gradientRef = useRef<HTMLCanvasElement|null>(null);
  const hueRef = useRef<HTMLCanvasElement|null>(null);
  const drawGradient = () => {
    const cv = gradientRef.current; if (!cv) return; const ctx = cv.getContext('2d'); if (!ctx) return;
    const { r,g,b } = hsvToRgb(h,1,1);
    const base = ctx.createLinearGradient(0,0,cv.width,0); base.addColorStop(0,'#fff'); base.addColorStop(1,`rgb(${r},${g},${b})`);
    ctx.fillStyle = base; ctx.fillRect(0,0,cv.width,cv.height);
    const shade = ctx.createLinearGradient(0,0,0,cv.height); shade.addColorStop(0,'rgba(0,0,0,0)'); shade.addColorStop(1,'rgba(0,0,0,1)');
    ctx.fillStyle = shade; ctx.fillRect(0,0,cv.width,cv.height);
    // selector circle
    ctx.beginPath(); ctx.arc(s*cv.width, (1-v)*cv.height, 7, 0, Math.PI*2); ctx.strokeStyle = '#e0c87a'; ctx.lineWidth = 2; ctx.stroke();
  };
  const drawHue = () => {
    const cv = hueRef.current; if (!cv) return; const ctx = cv.getContext('2d'); if (!ctx) return;
    const grad = ctx.createLinearGradient(0,0,cv.width,0);
    for (let i=0;i<=360;i+=10) { const {r,g,b} = hsvToRgb(i,1,1); grad.addColorStop(i/360, `rgb(${r},${g},${b})`); }
    ctx.fillStyle = grad; ctx.fillRect(0,0,cv.width,cv.height);
    // selector
    ctx.beginPath(); ctx.arc((h/360)*cv.width, cv.height/2, 6, 0, Math.PI*2); ctx.strokeStyle = '#e0c87a'; ctx.lineWidth = 2; ctx.stroke();
  };
  useEffect(()=>{ drawGradient(); }, [h,s,v]);
  useEffect(()=>{ drawHue(); }, [h]);

  const handleGradPointer = (e: React.MouseEvent|React.TouchEvent) => {
    const cv = gradientRef.current; if (!cv) return; const rect = cv.getBoundingClientRect();
    const pt = 'touches' in e ? e.touches[0] : (e as any);
    const x = clamp((pt.clientX - rect.left)/rect.width, 0, 1);
    const y = clamp((pt.clientY - rect.top)/rect.height, 0, 1);
    setS(x); setV(1-y);
  };
  const handleHuePointer = (e: React.MouseEvent|React.TouchEvent) => {
    const cv = hueRef.current; if (!cv) return; const rect = cv.getBoundingClientRect();
    const pt = 'touches' in e ? e.touches[0] : (e as any);
    const x = clamp((pt.clientX - rect.left)/rect.width, 0, 1);
    setH(Math.round(x*360));
  };

  // Eyedropper: use native EyeDropper API when available; otherwise fallback overlay
  const startNativeEyedropper = async () => {
    try {
      const EyeDropperCtor = (window as any).EyeDropper;
      if (!EyeDropperCtor) return false;
      const ed = new EyeDropperCtor();
      const res = await ed.open(); // { sRGBHex: '#RRGGBB' }
      if (res && res.sRGBHex) {
        const { r, g, b } = hexToRgb(res.sRGBHex);
        const rgbaCss = `rgba(${r},${g},${b},0.28)`;
        onLivePreview?.(rgbaCss);
        onApply(rgbaCss);
        onClose();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // fallback overlay state
  const [fallbackShot, setFallbackShot] = useState<HTMLImageElement|null>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement|null>(null);
  const [hoverColor, setHoverColor] = useState<string>('rgba(224,200,122,0.28)');
  useEffect(()=>{
    if (mode !== 'eyedropper-fallback') return;
    let disposed = false;
    (async()=>{
      if (!(window as any).html2canvas) {
        await new Promise<void>((resolve)=>{
          const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
          s.onload = ()=>resolve(); document.head.appendChild(s);
        });
      }
      const html2canvas = (window as any).html2canvas;
      const canvas = await html2canvas(document.body, { scale: 1, useCORS: true, logging: false });
      if (disposed) return;
      const img = new Image(); img.src = canvas.toDataURL('image/png');
      img.onload = () => { if (!disposed) setFallbackShot(img); };
    })();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { onClose(); } };
    window.addEventListener('keydown', onKey);
    return ()=>{ disposed = true; window.removeEventListener('keydown', onKey); };
  }, [mode, onClose]);

  const drawFallback = (e?: React.MouseEvent) => {
    const cv = fallbackCanvasRef.current; if (!cv) return; const ctx = cv.getContext('2d'); if (!ctx) return;
    const W = cv.width = window.innerWidth; const H = cv.height = window.innerHeight;
    ctx.fillStyle = '#0b0f13'; ctx.fillRect(0,0,W,H);
    if (fallbackShot) ctx.drawImage(fallbackShot, 0, 0, W, H);
    if (e) {
      const x = e.clientX; const y = e.clientY;
      try {
        const d = ctx.getImageData(x, y, 1, 1).data; const r=d[0], g=d[1], b=d[2];
        const rgbaCss = `rgba(${r},${g},${b},0.28)`; setHoverColor(rgbaCss); onLivePreview?.(rgbaCss);
        // magnifier circle
        ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI*2); ctx.strokeStyle = '#e0c87a'; ctx.lineWidth = 2; ctx.stroke();
      } catch {}
    }
    // HUD
    ctx.fillStyle = 'rgba(11,15,19,0.75)'; ctx.fillRect(12, 12, 170, 40);
    ctx.strokeStyle = '#e0c87a'; ctx.lineWidth = 1; ctx.strokeRect(12,12,170,40);
    ctx.fillStyle = '#e0c87a'; ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Hover and click to pick', 20, 30);
  };
  const onFallbackMove = (e: React.MouseEvent) => { drawFallback(e); };
  const onFallbackClick = (e: React.MouseEvent) => {
    const cv = fallbackCanvasRef.current; if (!cv) return; const ctx = cv.getContext('2d'); if (!ctx) return;
    try {
      const d = ctx.getImageData(e.clientX, e.clientY, 1, 1).data; const r=d[0], g=d[1], b=d[2];
      const rgbaCss = `rgba(${r},${g},${b},0.28)`; onApply(rgbaCss); onClose();
    } catch { onClose(); }
  };

  return (
    <div className="z-50 rounded border-2 border-[#e0c87a] bg-[#0e1216] p-3 shadow-xl" style={stylePos} role="dialog" aria-modal="true">
      {mode === 'root' && (
        <div className="min-w-[320px]">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={()=>{ onNone(); onClose(); }} className="flex items-center gap-2 px-2 py-1 rounded border border-[#e0c87a] text-[#e0c87a]" aria-label="None">
              <DropSlashIcon className="w-4 h-4" /> None
            </button>
            <button onClick={()=>setMode('custom')} className="px-2 py-1 rounded border border-[#e0c87a] text-[#e0c87a]">Custom</button>
            <button
              onClick={async()=>{
                const ok = await startNativeEyedropper();
                if (!ok) setMode('eyedropper-fallback');
              }}
              className="relative group p-1 rounded border border-[#e0c87a] text-[#e0c87a]"
              aria-label="Pick a Custom Color"
            >
              <EyedropperIcon className="w-5 h-5" />
              <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] px-1 py-[1px] rounded border border-[#e0c87a]/60 bg-[#0b0f13] text-[#e0c87a] opacity-0 group-hover:opacity-100">Pick a Custom Color</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#e0c87a]/40" style={{ background: color }} aria-label="Current color preview" />
            <div className="text-[11px] text-[#e0c87a]/80">{hex}</div>
            <div className="flex-1" />
            <button onClick={onClose} className="px-2 py-1 rounded border border-[#e0c87a] text-[#e0c87a]">Close</button>
          </div>
        </div>
      )}
      {mode === 'custom' && (
        <div className="min-w-[340px]">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[#e0c87a] tracking-widest uppercase text-xs">Custom Color</div>
            <button onClick={()=>setMode('root')} className="px-2 py-1 text-xs rounded border border-[#e0c87a]/60 text-[#e0c87a]">Back</button>
          </div>
          <div className="mb-2 relative">
            <canvas ref={gradientRef} width={320} height={180} className="touch-none rounded border border-[#e0c87a]/40" onMouseDown={handleGradPointer} onMouseMove={(e)=> e.buttons===1 && handleGradPointer(e)} onTouchStart={handleGradPointer as any} onTouchMove={handleGradPointer as any} />
          </div>
          <div className="mb-2">
            <canvas ref={hueRef} width={320} height={16} className="touch-none rounded border border-[#e0c87a]/40" onMouseDown={handleHuePointer} onMouseMove={(e)=> e.buttons===1 && handleHuePointer(e)} onTouchStart={handleHuePointer as any} onTouchMove={handleHuePointer as any} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full border border-[#e0c87a]/40" style={{ background: rgbaCss }} />
            <input aria-label="Hex" className="w-24 bg-[#141a20] border border-[#e0c87a]/40 rounded px-1 py-0.5 text-[#e0c87a]" value={hex}
              onChange={(e)=>{ const v=e.target.value.trim(); setHex(v); if (/^#?[0-9a-fA-F]{6}$/.test(v)){ const n=v.startsWith('#')?v:'#'+v; const r=parseInt(n.slice(1,3),16); const g=parseInt(n.slice(3,5),16); const b=parseInt(n.slice(5,7),16); onLivePreview?.(`rgba(${r},${g},${b},0.28)`); }} } />
            <div className="text-[11px] text-[#e0c87a]/80">rgba({rgba.r},{rgba.g},{rgba.b},0.28)</div>
          </div>
          <div className="flex justify-end gap-2 text-xs">
            <button onClick={onClose} className="px-2 py-1 rounded border border-[#e0c87a]/60 text-[#e0c87a]">Cancel</button>
            <button onClick={()=>{ onApply(rgbaCss); onClose(); }} className="px-2 py-1 rounded border border-[#e0c87a] text-[#e0c87a]">OK</button>
          </div>
        </div>
      )}
      {mode === 'eyedropper-fallback' && (
        <div className="fixed inset-0 z-[60]">
          <canvas
            ref={fallbackCanvasRef}
            className="fixed inset-0 cursor-crosshair"
            onMouseMove={onFallbackMove}
            onMouseEnter={()=>drawFallback()}
            onClick={onFallbackClick}
          />
          {/* initial draw once image loads */}
          <FallbackDrawer img={fallbackShot} onDraw={drawFallback} />
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3 py-2 rounded border border-[#e0c87a] bg-[#0b0f13]/85 text-[#e0c87a] text-xs">
            <span className="w-4 h-4 rounded-full border border-[#e0c87a]/50" style={{ background: hoverColor }} />
            <span>Hover and click to pick • Esc to cancel</span>
            <button onClick={onClose} className="ml-2 px-2 py-0.5 rounded border border-[#e0c87a]/60">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to trigger initial draw when fallback screenshot updates
const FallbackDrawer: React.FC<{ img: HTMLImageElement | null; onDraw: () => void }> = ({ img, onDraw }) => {
  useEffect(()=>{ if (img) requestAnimationFrame(()=>onDraw()); }, [img]);
  return null;
};

export default HighlightModal;
