import { NextResponse } from 'next/server';
import { fetchReviews } from '../../../lib/reviews';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const appId = url.searchParams.get('appId') || url.searchParams.get('id');
    const country = url.searchParams.get('country') || 'us';
    const pagesParam = url.searchParams.get('pages');
    const pages = pagesParam ? Math.max(1, Math.min(parseInt(pagesParam, 10) || 1, 50)) : 1;

    if (!appId) {
      return NextResponse.json({ error: 'appId is required' }, { status: 400 });
    }

    // Cap pages to 10 for safety by default
    const maxPages = 10;
    const result = await fetchReviews({ appId, country, pages, maxPages });

    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_server_error', details: String(e?.message || e) }, { status: 500 });
  }
}

