import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { DevProvider } from '../do-not-use/devmode/store';
import DevOverlay from '../do-not-use/devmode/DevOverlay';
import DevToggle from '../do-not-use/devmode/DevToggle';
import LogChangesPanel from '../do-not-use/devmode/LogChangesPanel';

function Host() {
  return (
    <DevProvider>
      <div>
        <div data-testid="box" style={{ width: 100, height: 60 }}>
          Box
        </div>
        <DevOverlay />
        <DevToggle />
        <LogChangesPanel />
      </div>
    </DevProvider>
  );
}

describe('Dev move/resize lifecycle', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('weaver-devmode-session-v1', JSON.stringify({ enabled: true, elements: [], events: [], config: { grid: 8, snap: true } }));
  });

  it('emits move:start and move:end and updates layout', async () => {
    render(<Host />);
  const box = screen.getAllByTestId('box')[0];
    // click to register
    fireEvent.click(box);
    const id = box.getAttribute('data-dev-id');
    expect(id).toBeTruthy();

    // find overlay box
  const overlay = document.querySelector('[data-dev-overlay-id]') as HTMLElement | null;
    expect(overlay).toBeTruthy();

    // start drag
    fireEvent.mouseDown(overlay!, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(document, { clientX: 30, clientY: 40 });
    fireEvent.mouseUp(document, { clientX: 30, clientY: 40 });

    const session = JSON.parse(localStorage.getItem('weaver-devmode-session-v1') || '{}');
    expect(session.events.some((e: any) => e.op === 'move:start')).toBe(true);
    expect(session.events.some((e: any) => e.op === 'move:end')).toBe(true);
    const el = session.elements.find((x: any) => x.id === id);
    expect(el).toBeTruthy();
    expect(el.layout.x !== undefined).toBe(true);
  });

  it('emits resize:start and resize:end and updates layout', async () => {
    render(<Host />);
  const box = screen.getAllByTestId('box')[0];
    fireEvent.click(box);
    const id = box.getAttribute('data-dev-id');
    expect(id).toBeTruthy();

  const overlay = document.querySelector('[data-dev-overlay-id]') as HTMLElement | null;
  expect(overlay).toBeTruthy();

    const handle = overlay!.querySelector('[data-handle="se"]') as HTMLElement;
    fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(document, { clientX: 40, clientY: 40 });
    fireEvent.mouseUp(document, { clientX: 40, clientY: 40 });

    const session = JSON.parse(localStorage.getItem('weaver-devmode-session-v1') || '{}');
    expect(session.events.some((e: any) => e.op === 'resize:start')).toBe(true);
    expect(session.events.some((e: any) => e.op === 'resize:end')).toBe(true);
    const el = session.elements.find((x: any) => x.id === id);
    expect(el.layout.w > 0).toBe(true);
  });
});
