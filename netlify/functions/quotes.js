// Netlify Function — ZenQuotes proxy
// Fetches quotes server-side to avoid browser CORS restrictions.
// No API key required. Called by frontend as: /.netlify/functions/quotes

export default async () => {
  let res
  try {
    res = await fetch('https://zenquotes.io/api/quotes')
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

  // ZenQuotes returns { q, a, h } — normalize to { text, author } for the frontend
  const quotes = (Array.isArray(data) ? data : [])
    .filter(item => item.q && item.a && item.a !== 'zenquotes.io')
    .map(item => ({ text: item.q, author: item.a }))

  return new Response(JSON.stringify(quotes), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
