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
  raw?: any;
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
  } catch (e) {
    return null;
  }
}

// Parse reviews from the iTunes RSS JSON feed structure.
function parseReviewsFromFeed(json: any, country?: string): Review[] {
  if (!json) return [];
  // The iTunes RSS feed for reviews has a `feed.entry` array; the first entry may be the app info.
  const entries = json?.feed?.entry;
  if (!Array.isArray(entries)) return [];

  // Filter out entries that don't look like reviews (app info sometimes included).
  const reviews = entries
    .map((e: any) => {
      // Typical structure fields: id.label, author.name.label, title.label, content.label, im:rating.label, updated.label, im:version?.label
      const id = e?.id?.label || e?.id?.attributes?.['im:id'] || JSON.stringify(e?.id) || Math.random().toString(36).slice(2);
      const author = e?.author?.name?.label || e?.author?.name || 'Unknown';
      const title = e?.title?.label || e?.title;
      const content = e?.content?.label || e?.content || '';
      const ratingRaw = e?.['im:rating']?.label || e?.rating || null;
      const rating = ratingRaw ? parseInt(ratingRaw, 10) : 0;
      const version = e?.['im:version']?.label || e?.version?.label || undefined;
      const date = e?.updated?.label || e?.['updated']?.label || e?.published?.label || new Date().toISOString();

      return {
        id: String(id),
        author: String(author),
        title: title ? String(title) : undefined,
        content: String(content),
        rating: Number.isFinite(rating) ? rating : 0,
        version: version ? String(version) : undefined,
        date: new Date(date).toISOString(),
        country,
        raw: e,
      } as Review;
    })
    // sometimes the first entry is the app metadata which doesn't have im:rating; filter those out
    .filter((r: Review) => r.rating >= 0 && r.content !== undefined);

  return reviews;
}

function findNextLink(json: any): string | null {
  // The iTunes RSS JSON sometimes includes feed.link array with rel="next" and href
  const links = json?.feed?.link;
  if (Array.isArray(links)) {
    for (const l of links) {
      const rel = l?.rel || l?.attributes?.rel;
      const href = l?.href || l?.attributes?.href || l?.label;
      if (rel === 'next' && href) return href;
    }
  } else if (links && typeof links === 'object') {
    const rel = links?.rel || links?.attributes?.rel;
    const href = links?.href || links?.attributes?.href || links?.label;
    if (rel === 'next' && href) return href;
  }

  // Some feeds include a top-level "next" property
  if (typeof json?.next === 'string') return json.next;

  return null;
}

export async function fetchReviews({ appId, country = 'us', pages = 1, maxPages = 10 }: { appId: string; country?: string; pages?: number; maxPages?: number; }): Promise<FetchReviewsResult> {
  if (!appId) throw new Error('appId is required');
  const requestedPages = Math.max(1, Math.min(pages || 1, maxPages));

  const baseUrl = (id: string, c: string) => `https://itunes.apple.com/${c}/rss/customerreviews/id=${encodeURIComponent(id)}/sortBy=mostRecent/json`;

  let nextUrl = baseUrl(appId, country);
  const collected: Review[] = [];
  let fetched = 0;
  let partial = false;

  while (nextUrl && fetched < requestedPages) {
    fetched += 1;
    try {
      const res = await fetch(nextUrl, { method: 'GET' });
      if (!res.ok) {
        partial = collected.length > 0;
        break;
      }
      const json = await safeJson(res);
      const reviews = parseReviewsFromFeed(json, country);
      collected.push(...reviews);

      // Find next link
      const found = findNextLink(json);
      if (found && typeof found === 'string') {
        // If the found link is relative, make absolute by using it as-is (itunes returns absolute links)
        nextUrl = found;
      } else {
        nextUrl = null;
      }

      // Small delay could be added here if needed
    } catch (e) {
      partial = collected.length > 0;
      break;
    }
  }

  console.log(collected)

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
