import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewsPage from '../../components/ReviewsPage';
import { vi } from 'vitest';

describe('ReviewsPage', () => {
  it('loads and displays reviews from the API', async () => {
    const fakeApi = { reviews: [{ id: '1', author: 'Alice', content: 'Nice', rating: 5, date: new Date().toISOString() }], meta: { pagesFetched: 1, requestedPages: 1, totalReviews: 1, source: 'test', partial: false } };
    // Mock fetch for /api/reviews
    vi.stubGlobal('fetch', vi.fn(async () => {
      return { ok: true, json: async () => fakeApi } as unknown as Response;
    }));

    render(<ReviewsPage />);

    // The moving average window select should exist and default to 7 days
    const select = screen.getByLabelText('moving-average-window') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('7');

    // Click Load
    const btn = screen.getByText('Load');
    await userEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Nice')).toBeInTheDocument();
      // Chart should be present (either the real chart or the fallback when recharts isn't loaded in test env)
      const chart = screen.queryByTestId('rating-chart') || screen.queryByTestId('rating-chart-fallback');
      expect(chart).toBeTruthy();
    });
  });
});
