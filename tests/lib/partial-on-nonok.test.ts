import { describe, it, expect } from 'vitest';
import { mockFetchSequence } from '../utils/mockFetch';
import { fetchReviews } from '../../lib/reviews';

describe('fetchReviews partial handling on non-ok response', () => {
  it('returns partial true when a later fetch returns non-ok', async () => {
    const page1 = { feed: { entry: [{ id: { label: '1' }, author: { name: { label: 'A' } }, content: { label: 'a' }, 'im:rating': { label: '5' }, updated: { label: '2020-01-01' } }], link: [{ rel: 'next', href: 'https://example.com/next' }] } };
    const badResp = { ok: false } as unknown as Response;

    mockFetchSequence(
      { ok: true, json: async () => page1 } as unknown as Response,
      badResp,
    );

    const res = await fetchReviews({ appId: '123', country: 'us', pages: 2, maxPages: 2 });
    expect(res.reviews.length).toBe(1);
    expect(res.meta.pagesFetched).toBe(2);
    expect(res.meta.partial).toBe(true);
  });
});

