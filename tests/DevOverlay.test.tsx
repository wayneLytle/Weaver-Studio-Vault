import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { DevProvider, DevOverlay } from './test-helpers/devmode-stub';

function TestHost() {
  return (
    <DevProvider>
      <div>
        <button data-testid="target">Click me</button>
        <DevOverlay />
      </div>
    </DevProvider>
  );
}

describe('DevOverlay', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates a dev id and registers element when clicked in Dev Mode', async () => {
  // enable dev mode via localStorage before rendering so the provider bootstraps with it
  localStorage.setItem('weaver-devmode-session-v1', JSON.stringify({ enabled: true, elements: [], events: [], config: { grid: 8, snap: true } }));

  // render the host once
  const { container } = render(<TestHost />);

  const btn = screen.getByTestId('target');
    fireEvent.click(btn);

    // after click, button should have data-dev-id attribute
    const attr = btn.getAttribute('data-dev-id');
    expect(attr).toBeTruthy();

    // store should have at least one element recorded
    const session = JSON.parse(localStorage.getItem('weaver-devmode-session-v1') || '{}');
    expect(Array.isArray(session.elements)).toBe(true);
    expect(session.elements.length >= 1).toBe(true);
  });
});
