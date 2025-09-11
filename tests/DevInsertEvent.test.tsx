import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { DevProvider, DevOverlay, InsertShapeModal } from './test-helpers/devmode-stub';

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

describe('Insert event metadata', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('weaver-devmode-session-v1', JSON.stringify({ enabled: true, elements: [], events: [], config: { grid: 8, snap: true } }));
  });

  it('logs insert event with props', async () => {
    render(<Host />);
  const canvas = screen.getByTestId('canvas');
  // open insert modal via right-click, as the overlay listens to contextmenu events
  fireEvent.contextMenu(canvas, { clientX: 50, clientY: 60 });

    // find the dialog
    const dialog = await screen.findByRole('dialog', { name: /Insert Shape/i });
    expect(dialog).toBeTruthy();

    const aria = screen.getByLabelText(/Aria Label/i);
    const cls = screen.getByLabelText(/className/i);
    fireEvent.change(aria, { target: { value: 'my-insert' } });
    fireEvent.change(cls, { target: { value: 'inserted-class' } });

    const insert = screen.getByRole('button', { name: /^Insert$/i });
    fireEvent.click(insert);

    await waitFor(() => {
      const session = JSON.parse(localStorage.getItem('weaver-devmode-session-v1') || '{}');
      const els = session.elements || [];
      expect(els.length).toBeGreaterThan(0);
      const added = els[els.length - 1];
      expect(added.props).toBeTruthy();
      expect(added.props.ariaLabel).toBe('my-insert');
      expect(added.props.className).toBe('inserted-class');
    });
  });
});
