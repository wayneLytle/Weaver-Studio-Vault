import React, { useState } from 'react';

export interface RestorePoint {
  ts: number;
  name?: string;
  text: string;
  summary?: any;
}

interface RestorePointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (rp: RestorePoint) => void;
  draftKey: string; // base key used in TaleWeaverStudio
  currentText: string;
}

const RestorePointModal: React.FC<RestorePointModalProps> = ({ isOpen, onClose, onRestore, draftKey, currentText }) => {
  const [name, setName] = useState('');
  if (!isOpen) return null;

  let points: RestorePoint[] = [];
  try {
    const raw = localStorage.getItem(draftKey);
    points = raw ? JSON.parse(raw) : [];
  } catch {}

  const createPoint = () => {
    try {
      const snapshot = { ts: Date.now(), name: name.trim() || undefined, text: currentText };
      points.push(snapshot as any);
      localStorage.setItem(draftKey, JSON.stringify(points));
      setName('');
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-lg rounded border-2 border-[#e0c87a] bg-[#0b0f13] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[#e0c87a] tracking-widest uppercase text-sm">Restore Points</h2>
          <button onClick={onClose} className="px-2 py-1 text-xs rounded border border-[#e0c87a] text-[#e0c87a]">Close</button>
        </div>
        <div className="mb-4">
          <label className="block text-xs text-[#e0c87a]/80 mb-1">Create New Restore Point</label>
          <div className="flex gap-2">
            <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Optional name" className="flex-1 px-2 py-1 rounded bg-[#141a20] border border-[#e0c87a]/40 text-stone-200 text-sm" />
            <button onClick={createPoint} className="px-3 py-1 rounded border-2 border-[#e0c87a] text-[#e0c87a]">Create</button>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto pr-1 scrollbar-thin hover:scrollbar-thumb-[#e0c87a]/60 scrollbar-thumb-[#e0c87a]/30 scrollbar-track-transparent">
          {points.length === 0 && <div className="text-stone-400 text-sm">No restore points yet.</div>}
          {points.slice().reverse().map(p => (
            <div key={p.ts} className="mb-2 p-2 rounded border border-[#e0c87a]/40 bg-[#10151a]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#e0c87a]/80">{p.name || 'Snapshot'} — {new Date(p.ts).toLocaleTimeString()}</span>
                <button onClick={()=>onRestore(p)} className="px-2 py-0.5 rounded border border-[#e0c87a] text-[#e0c87a]">Restore</button>
              </div>
              {p.summary && (
                <div className="text-[10px] text-stone-400 flex gap-3 flex-wrap">
                  <span>Δ+{p.summary.added}</span>
                  <span>Δ-{p.summary.removed}</span>
                  <span>Δ±{p.summary.changed}</span>
                  <span>{p.summary.totalNew} lines</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestorePointModal;