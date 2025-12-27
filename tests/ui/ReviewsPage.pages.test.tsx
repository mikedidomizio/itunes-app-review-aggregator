import React from 'react';
import { render, screen } from '@testing-library/react';
import ReviewsPage from '../../components/ReviewsPage';

// Utility to set window.location.search in JSDOM
function setLocationSearch(qs: string) {
  const url = new URL(window.location.href);
  url.search = qs;
  // jsdom doesn't allow direct assignment to window.location.search in some environments
  // so we use history.replaceState to simulate it.
  window.history.replaceState({}, '', url.toString());
}

describe('ReviewsPage pages query handling', () => {
  it('defaults pages to 3 when not present', () => {
    setLocationSearch('');
    render(<ReviewsPage />);
    const input = screen.getByLabelText('Pages') as HTMLInputElement;
    // default should be 3
    expect(input.value).toBe('3');
  });

  it('reads pages from URL when present and clamps to max 10', () => {
    setLocationSearch('?pages=8');
    render(<ReviewsPage />);
    const input = screen.getByLabelText('Pages') as HTMLInputElement;
    expect(input.value).toBe('8');

    // test clamping above max
    setLocationSearch('?pages=999');
    render(<ReviewsPage />);
    const input2 = screen.getAllByLabelText('Pages')[0] as HTMLInputElement;
    expect(Number(input2.value)).toBeLessThanOrEqual(10);
  });
});

