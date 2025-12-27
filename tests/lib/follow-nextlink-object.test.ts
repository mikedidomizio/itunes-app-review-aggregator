import { describe, it, expect } from 'vitest';
import { mockFetchSequence } from '../utils/mockFetch';
import { fetchReviews } from '../../lib/reviews';

describe('fetchReviews next link object handling', () => {
  it('follows next link when link is an object with attributes', async () => {
    const page1 = { feed: { entry: [{ id: { label: '1' }, author: { name: { label: 'A' } }, content: { label: 'a' }, 'im:rating': { label: '5' }, updated: { label: '2020-01-01' } }], link: { attributes: { rel: 'next', href: '/page=2/id=123/sortby=mostrecent/xml?' } } } };
    const page2 = { feed: { entry: [{ id: { label: '2' }, author: { name: { label: 'B' } }, content: { label: 'b' }, 'im:rating': { label: '4' }, updated: { label: '2020-01-02' } }] } };

    const fetchMock = mockFetchSequence(
      { ok: true, json: async () => page1 } as unknown as Response,
      { ok: true, json: async () => page2 } as unknown as Response,
    );

    const res = await fetchReviews({ appId: '123', country: 'ca', pages: 2, maxPages: 2 });
    expect(res.reviews.length).toBe(2);
    expect(res.meta.pagesFetched).toBe(2);

    // Ensure the second call was made to the constructed ca RSS URL (hardcoded in lib)
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    const secondUrl = fetchMock.mock.calls[1][0];
    expect(typeof secondUrl).toBe('string');
    expect((secondUrl as string).includes('/rss/customerreviews/')).toBe(true);
  });
});

