// @ts-nocheck
// supabase/functions/spotify-get-playlist-tracks/index.ts
// Obtiene las tracks de una playlist de Spotify.
// Usa el endpoint /playlists/{id}/items (no el deprecado /tracks).
// preview_url está deprecado en la API de Spotify y puede ser null.
// Las credenciales NUNCA salen de esta función.
// Runs in Deno (Supabase Edge Runtime) — not Node.js.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Tipos internos ────────────────────────────────────────────────────────────

interface SpotifyArtist {
  name: string
}

interface SpotifyAlbumImage {
  url: string
  width: number
  height: number
}

interface SpotifyAlbum {
  name: string
  images: SpotifyAlbumImage[]
}

interface SpotifyTrack {
  id: string
  name: string
  artists: SpotifyArtist[]
  album: SpotifyAlbum
  preview_url: string | null
}

interface SpotifyPlaylistTrackItem {
  // Both /tracks and /items endpoints return 'track' as the field name for music tracks
  track: SpotifyTrack | null
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

// ── Paginación: obtiene TODAS las tracks de la playlist ───────────────────────

async function fetchAllTracks(
  playlistId: string,
  token: string
): Promise<SpotifyPlaylistTrackItem[]> {
  const allItems: SpotifyPlaylistTrackItem[] = []
  // Use the non-deprecated /items endpoint.
  // Fields: 'item' is the current field name (not the deprecated 'track').
  // preview_url is deprecated by Spotify and may be null for most tracks.
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/items` +
    `?fields=next,items(track(id,name,artists,album,preview_url))&limit=100`

  while (url) {
    const res: Response = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      throw new Error(`Spotify tracks error: ${res.status}`)
    }

    const page = await res.json()
    allItems.push(...(page.items ?? []))
    url = page.next ?? null
  }

  return allItems
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Preflight CORS
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
    let body: { spotify_playlist_id?: string }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const playlistId = body.spotify_playlist_id?.trim()
    if (!playlistId) {
      return new Response(
        JSON.stringify({ error: 'Missing field: spotify_playlist_id' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error('Missing Spotify credentials in environment')
    }

    const token = await getSpotifyToken(clientId, clientSecret)

    // Metadata de la playlist
    const metaRes = await fetchWithRetry(
      `https://api.spotify.com/v1/playlists/${playlistId}` +
      `?fields=id,name,images,owner`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!metaRes.ok) {
      if (metaRes.status === 404) {
        return new Response(JSON.stringify({ error: 'Playlist not found' }), {
          status: 404,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        })
      }
      throw new Error(`Spotify playlist meta error: ${metaRes.status}`)
    }

    const meta = await metaRes.json()

    // Todas las tracks (paginadas)
    const allItems = await fetchAllTracks(playlistId, token)
    const totalTracks = allItems.length

    // Deduplicar y mapear tracks. Se incluyen TODAS las tracks válidas porque
    // preview_url está deprecado en la API de Spotify y devuelve null en la
    // mayoría de canciones. El campo preview_url se conserva en la respuesta
    // (null si no disponible) para que el cliente lo use cuando esté presente.
    const seenIds = new Set<string>()
    const tracks = allItems
      .map(item => item.track)  // 'track' is the field name in both /tracks and /items endpoints
      .filter((track): track is SpotifyTrack => {
        if (!track || !track.id) return false
        if (seenIds.has(track.id)) return false
        seenIds.add(track.id)
        return true
      })
      .map(track => ({
        spotify_id: track.id,
        name: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        album_name: track.album.name,
        album_image_url: track.album.images[0]?.url ?? null,
        preview_url: track.preview_url ?? null,
      }))

    const tracksWithPreview = tracks.filter(t => t.preview_url !== null)

    const response = {
      playlist: {
        spotify_id: meta.id as string,
        name: meta.name as string,
        image_url: (meta.images as SpotifyAlbumImage[])?.[0]?.url ?? null,
        owner_name: (meta.owner as { display_name: string })?.display_name ?? '',
      },
      tracks,
      total_tracks: totalTracks,
      tracks_with_preview: tracksWithPreview.length,
    }

    return new Response(JSON.stringify(response), {
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
