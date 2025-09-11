import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InsertComponentNameHere from '../components/InsertComponentNameHere';

describe('InsertComponentNameHere', () => {
  it('renders main regions from manifest', () => {
    const manifest = {
      title: 'Test Workspace',
      subtitle: 'test',
      status: 'OK',
      document: { title: 'Test Tale' },
    };
    render(<InsertComponentNameHere manifest={manifest} personaOverlays={[]} />);
    expect(screen.getByRole('main', { name: /Main Panel/i })).toBeTruthy();
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByText(/Test Tale/)).toBeTruthy();
  });
});
