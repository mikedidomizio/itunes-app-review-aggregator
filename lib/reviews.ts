// lib/reviews.ts
// Server-side helper to fetch App Store customer reviews from the iTunes RSS JSON endpoint.
// Exports: fetchReviews({ appId, country = 'us', pages = 1, maxPages = 10 })

export type Review = {
  id: string;
  author: string;
  title?: string;
  content: string;
  rating: number;
  version?: string;
  date: string; // ISO
  country?: string;
  raw?: Record<string, unknown>;
};

export type FetchReviewsResult = {
  reviews: Review[];
  meta: {
    pagesFetched: number;
    requestedPages: number;
    totalReviews: number;
    source: string;
    partial: boolean;
  };
};

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch (_err) {
    return null;
  }
}

// Parse reviews from the iTunes RSS JSON feed structure.
function getAsRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === 'object') return x as Record<string, unknown>;
  return null;
}

function parseReviewsFromFeed(json: unknown, country?: string): Review[] {
  if (!json) return [];
  const root = getAsRecord(json);
  if (!root) return [];
  const feed = getAsRecord(root['feed']);
  const entries = Array.isArray(feed?.['entry']) ? (feed!['entry'] as unknown[]) : undefined;
  if (!entries) return [];

  const parsed: Review[] = entries
    .map((entry) => {
      const e = getAsRecord(entry) || {};
      const id = (e['id'] && getAsRecord(e['id'])?.['label']) || (getAsRecord(e['id']) && getAsRecord(getAsRecord(e['id'])!['attributes'])?.['im:id']) || JSON.stringify(e['id']) || Math.random().toString(36).slice(2);
      const author = (getAsRecord(e['author']) && getAsRecord(getAsRecord(e['author'])!['name'])?.['label']) || String(getAsRecord(e['author'])?.['name'] ?? 'Unknown');
      const title = (getAsRecord(e['title'])?.['label']) ?? undefined;
      const content = (getAsRecord(e['content'])?.['label']) ?? (e['content'] ? String(e['content']) : '');
      const ratingRaw = (getAsRecord(e['im:rating'])?.['label']) ?? e['rating'] ?? null;
      const rating = ratingRaw ? parseInt(String(ratingRaw), 10) : 0;
      const version = getAsRecord(e['im:version'])?.['label'] ?? getAsRecord(e['version'])?.['label'] ?? undefined;
      const date = (getAsRecord(e['updated'])?.['label']) ?? (e['published'] ? String(e['published']) : new Date().toISOString());

      return {
        id: String(id),
        author: String(author),
        title: title ? String(title) : undefined,
        content: String(content),
        rating: Number.isFinite(rating) ? rating : 0,
        version: version ? String(version) : undefined,
        date: new Date(String(date)).toISOString(),
        country,
        raw: e,
      } as Review;
    })
    .filter((r) => r.content !== undefined);

  return parsed;
}

function findNextLink(json: unknown): string | null {
  const root = getAsRecord(json);
  if (!root) return null;
  const feed = getAsRecord(root['feed']);
  const links = feed?.['link'];

  const inspectLink = (l: any): string | null => {
    // support links shaped as { attributes: { rel, href } } or { rel, href }
    const attrs = l && (l.attributes ?? l);
    if (attrs && typeof attrs === 'object') {
      const rel = attrs.rel ?? attrs.attributes?.rel;
      const href = attrs.href ?? attrs.attributes?.href;
      if (rel === 'next' && typeof href === 'string') {
        const matches = href.match(/\/(page=\d+\/id=\d+\/sortby=mostrecent)\/xml\?/);
        if (matches && matches.length) {
          // todo hardcoded country code `ca`
          return `https://itunes.apple.com/ca/rss/customerreviews/${matches[1]}/json`;
        }
        // If href is already a rss/json url or other string, return it
        return href;
      }
    }
    return null;
  };

  if (Array.isArray(links)) {
    for (const l of links) {
      const found = inspectLink(l);
      if (found) return found;
    }
  } else if (links && typeof links === 'object') {
    const found = inspectLink(links);
    if (found) return found;
  }

  // Fallbacks: some feeds expose next at feed.next or root.next
  if (typeof feed?.['next'] === 'string') return feed['next'] as string;
  if (typeof root['next'] === 'string') return root['next'] as string;

  return null;
}

export async function fetchReviews({ appId, country = 'us', pages = 1, maxPages = 10 }: { appId: string; country?: string; pages?: number; maxPages?: number; }): Promise<FetchReviewsResult> {
  if (!appId) throw new Error('appId is required');
  const requestedPages = Math.max(1, Math.min(pages || 1, maxPages));

  const baseUrl = (id: string, c: string) => `https://itunes.apple.com/${c}/rss/customerreviews/id=${encodeURIComponent(id)}/sortBy=mostRecent/json`;

  let nextUrl: string | null = baseUrl(appId, country);

  const collected: Review[] = [];
  let fetched = 0;
  let partial = false;

  for (let i = 0; i < requestedPages; i++) {
    const currentUrl = nextUrl;
    if (!currentUrl) break;
    fetched += 1;
    try {
      const res = await fetch(currentUrl, { method: 'GET' });
      if (!res.ok) {
        partial = collected.length > 0;
        break;
      }
      const json = await safeJson(res);

      const reviews = parseReviewsFromFeed(json, country);
      collected.push(...reviews);
      const found = findNextLink(json);

      // If no next link found, stop fetching instead of throwing
      nextUrl = found ?? null;
      if (!nextUrl) break;
    } catch (err: unknown) {
      // Use the caught error to help debugging but continue to set partial flag
      // eslint-disable-next-line no-console
      console.error('fetchReviews error:', err);
      partial = collected.length > 0;
      break;
    }
  }

  return {
    reviews: collected,
    meta: {
      pagesFetched: fetched,
      requestedPages,
      totalReviews: collected.length,
      source: 'itunes-rss',
      partial,
    },
  };
}
