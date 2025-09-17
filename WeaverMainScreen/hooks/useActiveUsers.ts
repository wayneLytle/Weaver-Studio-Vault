import { useEffect, useState } from 'react';

export interface ActiveUser { id: string; name: string; avatar?: string }

export function useActiveUsers(sessionId: string) {
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(()=>{
    let ws: WebSocket | null = null;
    let cancelled = false;
    try {
      // Placeholder endpoint; replace with real presence gateway
      ws = new WebSocket(`wss://echo.websocket.events?session=${encodeURIComponent(sessionId)}`);
      ws.onopen = () => { if (!cancelled) setConnected(true); };
      ws.onmessage = (ev) => {
        // For demo: synthesize rotating mock users every 5s
        try {
          const now = Date.now();
          const pool = ['Wayne','Tālia','Guest','Collaborator'];
          const sample = pool.slice(0, 1 + (now/5000|0)%pool.length);
          setUsers(sample.map((n,i)=>({ id: String(i), name: n })));
        } catch {}
      };
      const interval = setInterval(()=>{ try { ws?.send('ping'); } catch {} }, 5000);
      return () => { cancelled = true; clearInterval(interval); try { ws?.close(); } catch {}; };
    } catch {
      // fallback mock
      setUsers([{ id:'0', name:'Wayne' },{ id:'1', name:'Tālia'}]);
    }
  }, [sessionId]);

  return { users, connected };
}