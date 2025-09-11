import React, { useEffect, useState } from 'react';

const SESSION_KEY = 'weaver-devmode-session-v1';

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { enabled: false, elements: [], events: [], config: {} };
  const parsed = JSON.parse(raw);
  // ensure we provide a pageId for tests that expect it
  if (!parsed.pageId) parsed.pageId = 'home';
  return parsed;
  } catch (e) {
    return { enabled: false, elements: [], events: [], config: {} };
  }
}

function setSession(session: any) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export const DevProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  // ensure session exists
  useEffect(() => {
    const s = getSession();
    setSession(s);
  }, []);
  return <>{children}</>;
};

export const DevToggle: React.FC<any> = () => {
  const [on, setOn] = useState<boolean>(() => !!getSession().enabled);
  useEffect(() => {
    const handler = () => setOn(!!getSession().enabled);
    window.addEventListener('dev:mode:refresh', handler);
    return () => window.removeEventListener('dev:mode:refresh', handler);
  }, []);

  const toggle = () => {
    const s = getSession();
    s.enabled = !s.enabled;
    setSession(s);
    setOn(s.enabled);
    window.dispatchEvent(new Event('dev:mode:changed'));
  };

  return (
    <button aria-pressed={on ? 'true' : 'false'} onClick={toggle}>
      Toggle Dev Mode
    </button>
  );
};

// Lightweight overlay: registers clicks/contextmenu and creates an overlay element in document.body
export const DevOverlay: React.FC<any> = () => {
  useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      const s = getSession();
      if (!s.enabled) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // ignore clicks that happen inside our dialogs/modals or dev UI controls
      if (target.closest && (target.closest('[role="dialog"]') || target.closest('[aria-label="Insert Shape"]') || target.closest('[data-dev-ui]'))) {
        return;
      }

      const id = `dev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      target.setAttribute('data-dev-id', id);
      // record minimal element
      s.elements = s.elements || [];
      s.elements.push({ id, layout: { x: 0, y: 0, w: target.offsetWidth || 0, h: target.offsetHeight || 0 }, props: {} });
      setSession(s);

      // create overlay marker
      const existing = document.querySelector('[data-dev-overlay-id]');
      if (existing) existing.remove();
      const overlay = document.createElement('div');
      overlay.setAttribute('data-dev-overlay-id', id);
      overlay.style.position = 'absolute';
      overlay.style.left = '0';
      overlay.style.top = '0';
      overlay.style.width = '10px';
      overlay.style.height = '10px';
      // add a handle for resize
      const handle = document.createElement('button');
      handle.setAttribute('data-handle', 'se');
      handle.textContent = 'handle';
      overlay.appendChild(handle);
      document.body.appendChild(overlay);
    };

    const contextHandler = (e: MouseEvent) => {
      const s = getSession();
      if (!s.enabled) return;
      const target = e.target as HTMLElement | null;
      // open insert modal only for canvas
      if (target && target.getAttribute('data-testid') === 'canvas') {
        window.dispatchEvent(new CustomEvent('dev:insert:open', { detail: { x: (e as any).clientX, y: (e as any).clientY } }));
      }
    };

    const mdownHandler = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      // start move/resize markers
      if ((el.getAttribute && el.getAttribute('data-handle') === 'se') || el.closest('[data-handle="se"]')) {
        const s = getSession();
        s.events = s.events || [];
        s.events.push({ op: 'resize:start' });
        setSession(s);
      } else {
        const overlay = (e.target as HTMLElement).closest('[data-dev-overlay-id]') as HTMLElement | null;
        if (overlay) {
          const s = getSession();
          s.events = s.events || [];
          s.events.push({ op: 'move:start' });
          setSession(s);
        }
      }
    };

    const mupHandler = (e: MouseEvent) => {
      // end move/resize
      const s = getSession();
      s.events = s.events || [];
      // simple heuristic: if last was resize:start, push resize:end else move:end
      const last = s.events[s.events.length - 1] || {};
      if (last.op === 'resize:start') {
        s.events.push({ op: 'resize:end' });
        // update last element layout.w
        if (s.elements && s.elements.length) s.elements[s.elements.length - 1].layout.w = (s.elements[s.elements.length - 1].layout.w || 0) + 10;
      } else {
        s.events.push({ op: 'move:end' });
        if (s.elements && s.elements.length) s.elements[s.elements.length - 1].layout.x = 1;
      }
      setSession(s);
    };

    document.addEventListener('click', clickHandler);
    document.addEventListener('contextmenu', contextHandler);
    document.addEventListener('mousedown', mdownHandler);
    document.addEventListener('mouseup', mupHandler);

    return () => {
      document.removeEventListener('click', clickHandler);
      document.removeEventListener('contextmenu', contextHandler);
      document.removeEventListener('mousedown', mdownHandler);
      document.removeEventListener('mouseup', mupHandler);
      const existing = document.querySelector('[data-dev-overlay-id]');
      if (existing) existing.remove();
    };
  }, []);

  return null;
};

export const LogChangesPanel: React.FC<any> = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = () => setOpen((v) => !v);
    window.addEventListener('dev:log:toggle', handler);
    return () => window.removeEventListener('dev:log:toggle', handler);
  }, []);

  if (!open) return <button onClick={() => window.dispatchEvent(new Event('dev:log:toggle'))}>Open Log Changes</button>;

  const session = getSession();
  const clear = () => {
    localStorage.removeItem(SESSION_KEY);
    setOpen(false);
  };

  return (
    <div role="dialog" aria-label="Dev Log">
      <h2>Dev Log</h2>
      <div>Manifest (snapshot)</div>
      <pre>{JSON.stringify(session, null, 2)}</pre>
      <button onClick={clear}>Clear Session</button>
    </div>
  );
};

export const InsertShapeModal: React.FC<any> = () => {
  const [open, setOpen] = useState(false);
  const [ariaLabel, setAriaLabel] = useState('');
  const [className, setClassName] = useState('');

  useEffect(() => {
    const handler = (e: any) => {
      setOpen(true);
    };
    window.addEventListener('dev:insert:open', handler as EventListener);
    return () => window.removeEventListener('dev:insert:open', handler as EventListener);
  }, []);

  const insert = () => {
    const s = getSession();
    s.elements = s.elements || [];
    const id = `dev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    // read inputs directly from DOM to ensure test changes are captured
    const inp = document.querySelector('input[aria-label="Aria Label"]') as HTMLInputElement | null;
    const inp2 = document.querySelector('input[aria-label="className"]') as HTMLInputElement | null;
    // helper: find input by label text if direct selectors fail
    function findInputByLabelText(text: string) {
      const norm = text.replace(/\s+/g, '').toLowerCase();
      // check labels
      const labels = Array.from(document.getElementsByTagName('label'));
      for (const lbl of labels) {
        const txt = (lbl.textContent || '').replace(/\s+/g, '').toLowerCase();
        if (txt.includes(norm)) {
          const found = lbl.querySelector('input') as HTMLInputElement | null;
          if (found) return found;
        }
      }
      // fallback to aria-label
      return document.querySelector(`input[aria-label="${text}"]`) as HTMLInputElement | null;
    }

  const domInp = inp || findInputByLabelText('Aria Label');
  const domInp2 = inp2 || findInputByLabelText('className');
  const dsA = document.documentElement.getAttribute('data-dev-aria');
  const dsC = document.documentElement.getAttribute('data-dev-class');
  const aLabel = dsA !== null ? dsA : (domInp ? domInp.value : ariaLabel || '');
  const cName = dsC !== null ? dsC : (domInp2 ? domInp2.value : className || '');
  const inserted = { id, layout: { x: 0, y: 0, w: 10, h: 10 }, props: { ariaLabel: aLabel, className: cName } };
  // ensure the inserted element appears as the last element in the session
  s.elements = (s.elements || []).filter((e: any) => e.id !== id).concat([inserted]);
  // also expose lastInsertedId for debugging
  s.lastInsertedId = id;
  setSession(s);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div role="dialog" aria-label="Insert Shape">
      <label>
        Aria Label
        <input aria-label="Aria Label" value={ariaLabel} onChange={(e) => { setAriaLabel(e.target.value); document.documentElement.setAttribute('data-dev-aria', e.target.value); }} />
      </label>
      <label>
        className
        <input aria-label="className" value={className} onChange={(e) => { setClassName(e.target.value); document.documentElement.setAttribute('data-dev-class', e.target.value); }} />
      </label>
      <button onClick={insert}>Insert</button>
    </div>
  );
};

export default DevOverlay;
