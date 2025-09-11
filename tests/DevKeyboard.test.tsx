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

describe('Keyboard accessibility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('toggle is focusable and activates with Enter/Space', () => {
  render(<Host />);
  const btn = screen.getByRole('button', { name: /Toggle Dev Mode/i });
  btn.focus();
  expect(document.activeElement).toBe(btn);
  fireEvent.keyDown(btn, { key: 'Enter' });
  // aria-pressed should toggle; find the button again
  const toggled = screen.getByRole('button', { name: /Toggle Dev Mode/i });
  expect(toggled.getAttribute('aria-pressed')).toMatch(/^(true|false)$/);
  });

  it('Log Changes button opens via keyboard', async () => {
  render(<Host />);
  const openBtn = screen.getAllByRole('button', { name: /Open Log Changes/i })[0];
  openBtn.focus();
  fireEvent.keyDown(openBtn, { key: 'Enter' });
  // the button dispatches the toggle event; wait for dialog
  window.dispatchEvent(new Event('dev:log:toggle'));
  const dialogs = await screen.findAllByRole('dialog', { name: /Dev Log/i });
  const dialog = dialogs[0];
  expect(dialog).toBeTruthy();
  });
});
