import { describe, it, expect, vi } from 'vitest';
import { fetchReviews } from '../../lib/reviews';

// Simple unit tests mocking global.fetch

describe('fetchReviews', () => {
  it('throws when appId missing', async () => {
    await expect(fetchReviews({ appId: '' })).rejects.toThrow();
  });

  it('parses single page JSON', async () => {
    const fakeJson = {
      feed: {
        entry: [
          { id: { label: '1' }, author: { name: { label: 'Alice' } }, title: { label: 'Great' }, content: { label: 'Nice app' }, 'im:rating': { label: '5' }, updated: { label: '2020-01-01T00:00:00Z' } },
          { id: { label: '2' }, author: { name: { label: 'Bob' } }, title: { label: 'Ok' }, content: { label: 'It works' }, 'im:rating': { label: '4' }, updated: { label: '2020-01-02T00:00:00Z' } },
        ],
      },
    };

    global.fetch = vi.fn(async () => ({ ok: true, json: async () => fakeJson } as unknown as Response));

    const res = await fetchReviews({ appId: '123', country: 'us', pages: 1, maxPages: 2 });
    expect(res.reviews.length).toBe(2);
    expect(res.meta.pagesFetched).toBe(1);
    expect(res.meta.totalReviews).toBe(2);
  });

  it('follows next link for multiple pages', async () => {
    const page1 = { feed: { entry: [{ id: { label: '1' }, author: { name: { label: 'A' } }, content: { label: 'a' }, 'im:rating': { label: '5' }, updated: { label: '2020-01-01' } }], link: [{ rel: 'next', href: 'https://example.com/next' }] } };
    const page2 = { feed: { entry: [{ id: { label: '2' }, author: { name: { label: 'B' } }, content: { label: 'b' }, 'im:rating': { label: '4' }, updated: { label: '2020-01-02' } }] } };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => page1 } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => page2 } as unknown as Response);

    const res = await fetchReviews({ appId: '123', country: 'us', pages: 2, maxPages: 2 });
    expect(res.reviews.length).toBe(2);
    expect(res.meta.pagesFetched).toBe(2);
  });
});
