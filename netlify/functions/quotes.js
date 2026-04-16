// Netlify Function — type.fit quotes proxy
// Fetches quotes server-side to avoid browser CORS restrictions.
// No API key required. Called by frontend as: /.netlify/functions/quotes

export default async () => {
  let res
  try {
    res = await fetch('https://type.fit/api/quotes')
  } catch {
    return Response.json({ error: 'Quotes service unavailable' }, { status: 502 })
  }

  if (!res.ok) {
    return Response.json(
      { error: `Upstream error: ${res.status}` },
      { status: 502 }
    )
  }

  const data = await res.json()

  // Pass through the array; let frontend pick randomly and cache in localStorage
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // CDN caches for 1 hour
    },
  })
}
