// @ts-nocheck
// supabase/functions/deezer-get-preview/index.ts
// Busca en Deezer una canción por artista + título y devuelve la URL de preview (MP3 30s).
// Deezer NO requiere autenticación para datos públicos del catálogo.
// IMPORTANTE: las URLs de preview caducan en ~15 minutos. Llama siempre en el momento de reproducir.
// Runs in Deno (Supabase Edge Runtime) — not Node.js.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Tipos internos ────────────────────────────────────────────────────────────

interface DeezerArtist {
  id: number
  name: string
}

interface DeezerAlbum {
  id: number
  title: string
  cover_medium: string
}

interface DeezerTrack {
  id: number
  title: string
  preview: string       // URL mp3 30s — caduca en ~15 min
  readable: boolean     // false si no disponible en esa región
  artist: DeezerArtist
  album: DeezerAlbum
}

interface DeezerSearchResponse {
  data?: DeezerTrack[]
  total?: number
  error?: { type: string; message: string; code: number }
}

// ── Fetch con reintentos ──────────────────────────────────────────────────────

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url)
    if (res.status !== 429) return res

    const retryAfter = res.headers.get('Retry-After')
    const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 500 * Math.pow(2, attempt)
    if (attempt < retries) await new Promise(r => setTimeout(r, waitMs))
  }
  throw new Error('Deezer rate limit exceeded after retries')
}

// ── Búsqueda en Deezer ────────────────────────────────────────────────────────

async function searchDeezer(artist: string, title: string): Promise<DeezerTrack | null> {
  // Intento 1: búsqueda precisa con operadores de campo
  const strictQuery = encodeURIComponent(`artist:"${artist}" track:"${title}"`)
  const res1 = await fetchWithRetry(
    `https://api.deezer.com/search/track?q=${strictQuery}&limit=5`
  )
  if (res1.ok) {
    const data: DeezerSearchResponse = await res1.json()
    if (!data.error && data.data) {
      const match = data.data.find(t => t.preview && t.readable !== false)
      if (match) return match
    }
  }

  // Intento 2: búsqueda libre — artista + título como texto plano
  const looseQuery = encodeURIComponent(`${artist} ${title}`)
  const res2 = await fetchWithRetry(
    `https://api.deezer.com/search/track?q=${looseQuery}&limit=10`
  )
  if (res2.ok) {
    const data: DeezerSearchResponse = await res2.json()
    if (!data.error && data.data) {
      const match = data.data.find(t => t.preview && t.readable !== false)
      if (match) return match
    }
  }

  return null
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    let body: { artist?: string; title?: string }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const artist = body.artist?.trim()
    const title = body.title?.trim()

    if (!artist || !title) {
      return new Response(
        JSON.stringify({ error: 'Missing fields: artist and title are required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const track = await searchDeezer(artist, title)

    return new Response(
      JSON.stringify({
        preview_url: track?.preview ?? null,
        deezer_id: track?.id ?? null,
        matched_title: track?.title ?? null,
        matched_artist: track?.artist?.name ?? null,
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
