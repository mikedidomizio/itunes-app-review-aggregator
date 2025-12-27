import { describe, it, expect, vi } from 'vitest';
import { fetchReviews, computeDailyCumulativeAverages } from '../../lib/reviews';

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

// Tests for computeDailyCumulativeAverages

describe('computeDailyCumulativeAverages', () => {
  it('returns empty for empty input', () => {
    expect(computeDailyCumulativeAverages([])).toEqual([]);
  });

  it('computes single review correctly', () => {
    const r = { id: '1', author: 'A', content: 'c', rating: 5, date: '2020-01-01T00:00:00Z' } as any;
    const out = computeDailyCumulativeAverages([r]);
    expect(out.length).toBe(1);
    expect(out[0].dailyAverage).toBe(5);
    expect(out[0].cumulativeAverage).toBe(5);
    expect(out[0].cumulativeCount).toBe(1);
  });

  it('computes multiple same-day reviews', () => {
    const r1 = { id: '1', author: 'A', content: 'c', rating: 5, date: '2020-01-01T00:00:00Z' } as any;
    const r2 = { id: '2', author: 'B', content: 'c', rating: 3, date: '2020-01-01T12:00:00Z' } as any;
    const out = computeDailyCumulativeAverages([r1, r2]);
    expect(out.length).toBe(1);
    expect(out[0].dailyAverage).toBe(4);
    expect(out[0].cumulativeAverage).toBe(4);
    expect(out[0].cumulativeCount).toBe(2);
  });

  it('computes cumulative across days', () => {
    const r1 = { id: '1', author: 'A', content: 'c', rating: 5, date: '2020-01-01T00:00:00Z' } as any;
    const r2 = { id: '2', author: 'B', content: 'c', rating: 3, date: '2020-01-02T00:00:00Z' } as any;
    const out = computeDailyCumulativeAverages([r1, r2]);
    expect(out.length).toBe(2);
    expect(out[0].dailyAverage).toBe(5);
    expect(out[0].cumulativeAverage).toBe(5);
    expect(out[1].dailyAverage).toBe(3);
    expect(out[1].cumulativeAverage).toBe(4); // (5 + 3) / 2
  });
});
