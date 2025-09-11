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

describe('LogChangesPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('opens via event and shows exported manifest', async () => {
    render(<Host />);
  // simulate clicking the Log Changes button by dispatching the event
  window.dispatchEvent(new Event('dev:log:toggle'));
    const dialog = await screen.findByRole('dialog', { name: /Dev Log/i });
    expect(dialog).toBeTruthy();
    expect(dialog.textContent).toContain('Manifest (snapshot)');
  });
});
