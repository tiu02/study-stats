// Netlify Function v2 — YouTube Data API proxy
// Keeps YOUTUBE_API_KEY server-side; browser never sees it.
// Called by frontend as: /.netlify/functions/youtube-search?q=<query>

export default async (req) => {
  // --- Input validation ---
  const url = new URL(req.url);
  const query = (url.searchParams.get('q') ?? '').trim();

  if (!query) {
    return Response.json({ error: 'Query is required' }, { status: 400 });
  }
  if (query.length > 100) {
    return Response.json(
      { error: 'Query too long (max 100 characters)' },
      { status: 400 }
    );
  }

  // --- Key guard ---
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // --- Call YouTube Data API v3 ---
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '4',
    safeSearch: 'moderate',
    q: query,
    key: apiKey,
  });

  let ytRes;
  try {
    ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`
    );
  } catch {
    return Response.json(
      { error: 'Video service unavailable. Try again.' },
      { status: 502 }
    );
  }

  if (!ytRes.ok) {
    if (ytRes.status === 401) {
      return Response.json({ error: 'API key invalid or missing' }, { status: 401 });
    }
    if (ytRes.status === 403) {
      return Response.json(
        { error: 'API quota exceeded. Try again later.' },
        { status: 429 }
      );
    }
    return Response.json(
      { error: `Video API error: ${ytRes.status}` },
      { status: 502 }
    );
  }

  const data = await ytRes.json();

  // --- Return only the fields the frontend needs; never echo the key ---
  const items = (data.items ?? []).map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnail:
      item.snippet.thumbnails?.medium?.url ??
      item.snippet.thumbnails?.default?.url ??
      '',
  }));

  return Response.json({ items });
};
