// @ts-nocheck
// supabase/functions/spotify-search/index.ts
// Busca playlists públicas en Spotify por texto.
// Las credenciales NUNCA salen de esta función.
// Runs in Deno (Supabase Edge Runtime) — not Node.js.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

// ── Spotify Client Credentials ────────────────────────────────────────────────

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options)
    if (res.status !== 429) return res

    // Respect Retry-After header, fallback to exponential backoff
    const retryAfter = res.headers.get('Retry-After')
    const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 500 * Math.pow(2, attempt)
    if (attempt < retries) await new Promise(r => setTimeout(r, waitMs))
  }
  throw new Error('Spotify rate limit exceeded after retries')
}

async function getSpotifyToken(clientId: string, clientSecret: string): Promise<string> {
  // Spotify Client Credentials Flow — credenciales en el body del form (no en header)
  // Ref: https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetchWithRetry('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    throw new Error(`Spotify token error: ${response.status}`)
  }

  const data = await response.json()
  return data.access_token as string
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const url = new URL(req.url)
    const query = url.searchParams.get('q')?.trim()

    if (!query || query.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing query parameter: q' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error('Missing Spotify credentials in environment')
    }

    const token = await getSpotifyToken(clientId, clientSecret)

    // Buscar playlists en Spotify
    const searchUrl = new URL('https://api.spotify.com/v1/search')
    searchUrl.searchParams.set('q', query)
    searchUrl.searchParams.set('type', 'playlist')
    searchUrl.searchParams.set('limit', '12')

    const searchRes = await fetchWithRetry(searchUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!searchRes.ok) {
      throw new Error(`Spotify search error: ${searchRes.status}`)
    }

    const searchData = await searchRes.json()

    // Mapear al formato esperado por el frontend
    const playlists = (searchData.playlists?.items ?? [])
      // Filtrar nulls (Spotify puede devolver items null)
      .filter((item: unknown) => item !== null)
      .map((item: Record<string, unknown>) => ({
        spotify_id: item['id'] as string,
        name: item['name'] as string,
        image_url: ((item['images'] as Array<{ url: string }>)?.[0]?.url) ?? null,
        owner_name: ((item['owner'] as Record<string, string>)?.['display_name']) ?? '',
        track_count: ((item['tracks'] as Record<string, number>)?.['total']) ?? 0,
      }))

    return new Response(JSON.stringify(playlists), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
