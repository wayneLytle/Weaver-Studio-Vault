import React, { useEffect, useRef, useState } from 'react';

interface ColorPickerPopoverProps {
  color: string; // expecting hex or rgba
  onChange: (rgba: string) => void;
  anchorRect?: DOMRect | null;
  onRequestClose?: () => void;
}

function parseColor(input: string): { r: number; g: number; b: number; a: number } {
  if (input.startsWith('#')) {
    const hex = input.replace('#','');
    const v = parseInt(hex.length===3 ? hex.split('').map(c=>c+c).join('') : hex, 16);
    const r = (v >> 16) & 255; const g = (v >> 8) & 255; const b = v & 255; return { r, g, b, a: 1 };
  }
  const m = input.match(/rgba?\((\d+),(\d+),(\d+)(?:,(\d+(?:\.\d+)?))?\)/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] ? +m[4] : 1 };
  return { r: 224, g: 200, b: 122, a: 0.28 };
}

const PALETTE = [
  '#000000','#7f7f7f','#bfbfbf','#e6e6e6','#ffffff',
  '#ff0000','#ff7f00','#ffbf00','#ffff00','#bfff00','#7fff00','#00ff00','#00ff7f','#00ffbf','#00ffff','#00bfff','#007fff','#0000ff','#7f00ff','#bf00ff','#ff00ff','#ff00bf','#ff007f',
];

const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({ color, onChange, anchorRect, onRequestClose }) => {
  const { r: initR, g: initG, b: initB, a: initA } = parseColor(color);
  const [r,setR]=useState(initR); const [g,setG]=useState(initG); const [b,setB]=useState(initB); const [a,setA]=useState(initA);
  const ref = useRef<HTMLDivElement|null>(null);

  useEffect(()=>{
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        onChange(`rgba(${r},${g},${b},${a.toFixed(2)})`);
        onRequestClose?.();
      }
    };
    window.addEventListener('mousedown', handler);
    return ()=>window.removeEventListener('mousedown', handler);
  }, [r,g,b,a,onChange]);

  const apply = () => onChange(`rgba(${r},${g},${b},${a.toFixed(2)})`);
  const applyHex = (hex: string) => {
    const { r: rr, g: gg, b: bb } = parseColor(hex);
    setR(rr); setG(gg); setB(bb);
    onChange(`rgba(${rr},${gg},${bb},${a.toFixed(2)})`);
  };

  const width = 280;
  let stylePos: React.CSSProperties = {};
  if (anchorRect) {
    const padding = 8;
    const leftCandidate = Math.min(
      Math.max(padding, anchorRect.right - width),
      (typeof window !== 'undefined' ? window.innerWidth : 1200) - width - padding
    );
    const topCandidate = Math.min(
      (typeof window !== 'undefined' ? window.innerHeight : 800) - 200,
      anchorRect.bottom + padding
    );
    stylePos = { position: 'fixed', left: leftCandidate, top: topCandidate, width } as React.CSSProperties;
  }
  return (
    <div ref={ref} className="z-50 rounded border-2 border-[#e0c87a] bg-[#0e1216] p-3 shadow-lg" style={stylePos}>
      <div className="grid grid-cols-4 gap-2 text-[10px] text-[#e0c87a] mb-2">
        <label className="flex flex-col items-start gap-1">R<input type="range" min={0} max={255} value={r} onChange={e=>setR(+e.target.value)} /></label>
        <label className="flex flex-col items-start gap-1">G<input type="range" min={0} max={255} value={g} onChange={e=>setG(+e.target.value)} /></label>
        <label className="flex flex-col items-start gap-1">B<input type="range" min={0} max={255} value={b} onChange={e=>setB(+e.target.value)} /></label>
        <label className="flex flex-col items-start gap-1">A<input type="range" min={0} max={1} step={0.01} value={a} onChange={e=>setA(+e.target.value)} /></label>
      </div>
      <div className="flex items-center justify-between mb-2">
        <div className="w-10 h-10 rounded border border-[#e0c87a]/40" style={{ backgroundColor: `rgba(${r},${g},${b},${a})` }} />
        <div className="flex items-center gap-2 text-[11px] text-[#e0c87a]/80">
          <input
            className="w-24 bg-[#141a20] border border-[#e0c87a]/40 rounded px-1 py-0.5 text-[#e0c87a]"
            value={`#${((1<<24) + (r<<16) + (g<<8) + b).toString(16).slice(1)}`}
            onChange={(e)=>{
              const v = e.target.value.trim();
              if (/^#?[0-9a-fA-F]{6}$/.test(v)) {
                const hex = v.startsWith('#') ? v : '#'+v;
                const { r: rr, g: gg, b: bb } = parseColor(hex);
                setR(rr); setG(gg); setB(bb);
              }
            }}
          />
          <code>rgba({r},{g},{b},{a.toFixed(2)})</code>
        </div>
      </div>
      <div className="grid grid-cols-8 gap-1 mb-2 max-h-28 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#e0c87a]/30">
        {PALETTE.map(sw => (
          <button key={sw} onClick={()=>{ applyHex(sw); onRequestClose?.(); }} style={{ background: sw }} className="h-5 rounded border border-[#e0c87a]/30" title={sw} />
        ))}
      </div>
      <div className="flex justify-end gap-2 text-xs">
        <button onClick={()=>{ apply(); onRequestClose?.(); }} className="px-2 py-1 rounded border border-[#e0c87a] text-[#e0c87a]">Apply</button>
      </div>
    </div>
  );
};

export default ColorPickerPopover;