import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { DevProvider } from '../do-not-use/devmode/store';
import DevOverlay from '../do-not-use/devmode/DevOverlay';
import InsertShapeModal from '../do-not-use/devmode/InsertShapeModal';

function Host() {
  return (
    <DevProvider>
      <div>
        <div data-testid="canvas" style={{ width: 400, height: 300 }}>
          Canvas
        </div>
        <DevOverlay />
        <InsertShapeModal />
      </div>
    </DevProvider>
  );
}

describe('Insert flow', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('weaver-devmode-session-v1', JSON.stringify({ enabled: true, elements: [], events: [], config: { grid: 8, snap: true } }));
  });

  it('opens insert modal on right click and creates an element', async () => {
    render(<Host />);
    const canvas = screen.getByTestId('canvas');
    fireEvent.contextMenu(canvas, { clientX: 50, clientY: 60 });
    // modal should appear
    const dialog = await screen.findByRole('dialog', { name: /Insert Shape/i });
    expect(dialog).toBeTruthy();
  const insert = screen.getByRole('button', { name: /^Insert$/i });
    fireEvent.click(insert);
    const session = JSON.parse(localStorage.getItem('weaver-devmode-session-v1') || '{}');
    expect(Array.isArray(session.elements)).toBe(true);
    expect(session.elements.length >= 1).toBe(true);
  });
});
