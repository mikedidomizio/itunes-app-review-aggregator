import { describe, it, expect } from 'vitest';
import { mockFetchSequence } from '../utils/mockFetch';
import { fetchReviews } from '../../lib/reviews';

describe('fetchReviews safeJson handling', () => {
  it('returns empty reviews when response.json throws', async () => {
    const badResponse = { ok: true, json: async () => { throw new Error('bad json'); } } as unknown as Response;
    mockFetchSequence(badResponse);

    const res = await fetchReviews({ appId: '123', country: 'us', pages: 1, maxPages: 2 });
    expect(res.reviews.length).toBe(0);
    expect(res.meta.pagesFetched).toBe(1);
    expect(res.meta.partial).toBe(false);
  });
});

