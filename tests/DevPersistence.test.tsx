import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { DevProvider } from '../do-not-use/devmode/store';
import DevToggle from '../do-not-use/devmode/DevToggle';
import LogChangesPanel from '../do-not-use/devmode/LogChangesPanel';

function Host() {
  return (
    <DevProvider>
      <div>
        <DevToggle />
        <LogChangesPanel />
      </div>
    </DevProvider>
  );
}

describe('Persistence and Clear', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists a session and clears it', async () => {
    // enable session before render
    localStorage.setItem('weaver-devmode-session-v1', JSON.stringify({ enabled: true, elements: [{ id: 'x', layout: { x: 1, y: 2, w: 3, h: 4 } }], events: [] }));
    render(<Host />);
  // open log
  window.dispatchEvent(new Event('dev:log:toggle'));
    const dialog = await screen.findByRole('dialog', { name: /Dev Log/i });
    expect(dialog.textContent).toContain('"pageId": "home"');

    // Click clear session button
    const clearBtn = screen.getByText(/Clear Session/i);
    fireEvent.click(clearBtn);
    // after clear, localStorage should be empty or missing the key
    expect(localStorage.getItem('weaver-devmode-session-v1')).toBeNull();
  });
});
