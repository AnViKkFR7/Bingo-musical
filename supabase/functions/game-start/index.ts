// @ts-nocheck
// supabase/functions/game-start/index.ts
//
// Inicia una partida de Bingo Musical de forma segura:
//   1. Verifica que el caller es el host de la partida.
//   2. Obtiene las tracks (desde preset_tracks o Spotify).
//   3. Baraja y crea game_tracks.
//   4. Asigna track_positions a cada cartón.
//   5. Cambia el status a 'playing'.
//
// Todas las operaciones de escritura se hacen con service_role,
// que omite RLS. La verificación de identidad se hace con el JWT
// del caller (supabase.auth.getUser).
//
// Runs in Deno (Supabase Edge Runtime) — not Node.js.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Fisher-Yates shuffle ──────────────────────────────────────

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── Spotify helpers ───────────────────────────────────────────

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options)
    if (res.status !== 429) return res
    const retryAfter = res.headers.get('Retry-After')
    const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 500 * Math.pow(2, attempt)
    if (attempt < retries) await new Promise(r => setTimeout(r, waitMs))
  }
  throw new Error('Rate limit exceeded after retries')
}

async function getSpotifyToken(clientId: string, clientSecret: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })
  const res = await fetchWithRetry('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(`Spotify token error: ${res.status}`)
  const data = await res.json()
  return data.access_token as string
}

async function fetchSpotifyTracks(playlistId: string, token: string): Promise<Track[]> {
  const allItems: any[] = []
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/items` +
    `?fields=next,items(track(id,name,artists,album,preview_url))&limit=100`

  while (url) {
    const res = await fetchWithRetry(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) {
      if (res.status === 404) throw new Error('Playlist not found')
      throw new Error(`Spotify tracks error: ${res.status}`)
    }
    const page = await res.json()
    allItems.push(...(page.items ?? []))
    url = page.next ?? null
  }

  const seenIds = new Set<string>()
  return allItems
    .map((item: any) => item.track)
    .filter((t: any) => {
      if (!t?.id || seenIds.has(t.id)) return false
      seenIds.add(t.id)
      return true
    })
    .map((t: any) => ({
      spotify_id: t.id,
      name: t.name,
      artist: t.artists.map((a: any) => a.name).join(', '),
      album_name: t.album?.name ?? null,
      album_image_url: t.album?.images?.[0]?.url ?? null,
      preview_url: t.preview_url ?? null,
    }))
}

// ── Tipos ─────────────────────────────────────────────────────

interface Track {
  spotify_id: string
  name: string
  artist: string
  album_name: string | null
  album_image_url: string | null
  preview_url: string | null
}

// ── Handler principal ─────────────────────────────────────────

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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Cliente admin (service_role) — omite RLS para escrituras seguras
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  // ── 1. Verificar identidad del caller ─────────────────────

  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace('Bearer ', '').trim()

  if (!jwt || jwt === anonKey) {
    // El caller no tiene sesión autenticada
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  // Verificar el JWT con un cliente de usuario para extraer auth.uid()
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })

  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  // ── 2. Leer el body ───────────────────────────────────────

  let body: { game_id?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const { game_id } = body
  if (!game_id) {
    return new Response(JSON.stringify({ error: 'Missing field: game_id' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    // ── 3. Obtener partida y verificar que el caller es el host ──

    const { data: game, error: gameErr } = await adminClient
      .from('games')
      .select('id, playlist_spotify_id, board_size, status, host_player_id')
      .eq('id', game_id)
      .single()

    if (gameErr || !game) {
      return new Response(JSON.stringify({ error: 'Game not found' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    if (game.status !== 'waiting') {
      return new Response(JSON.stringify({ error: 'Game already started' }), {
        status: 409,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Verificar que auth.uid() es el host
    const { data: hostPlayer } = await adminClient
      .from('players')
      .select('id, auth_user_id')
      .eq('id', game.host_player_id)
      .single()

    if (!hostPlayer || hostPlayer.auth_user_id !== user.id) {
      return new Response(JSON.stringify({
        error: 'Forbidden: caller is not the host',
        _debug: {
          caller_uid: user.id,
          host_auth_user_id: hostPlayer?.auth_user_id ?? null,
          host_player_id: game.host_player_id,
          match: hostPlayer?.auth_user_id === user.id,
        },
      }), {
        status: 403,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // ── 4. Obtener tracks ─────────────────────────────────────

    const playlistSpotifyId = game.playlist_spotify_id
    let tracks: Track[]

    // Comprobar si es playlist preset
    const { data: playlist } = await adminClient
      .from('playlists')
      .select('id, is_preset')
      .eq('spotify_id', playlistSpotifyId)
      .maybeSingle()

    if (playlist?.is_preset) {
      // Tracks desde preset_tracks (sin llamar a Spotify)
      const { data: presetTracks, error: ptErr } = await adminClient
        .from('preset_tracks')
        .select('id, name, artist, album_image_url')
        .eq('playlist_id', playlist.id)
        .order('sort_order', { ascending: true })

      if (ptErr || !presetTracks?.length) throw new Error('No preset tracks found')

      tracks = presetTracks.map(pt => ({
        spotify_id: pt.id,
        name: pt.name,
        artist: pt.artist,
        album_name: null,
        album_image_url: pt.album_image_url ?? null,
        preview_url: null,
      }))
    } else {
      // Tracks desde Spotify (playlist de usuario)
      const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
      const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')
      if (!clientId || !clientSecret) throw new Error('Missing Spotify credentials')

      const token = await getSpotifyToken(clientId, clientSecret)
      tracks = await fetchSpotifyTracks(playlistSpotifyId, token)
      if (!tracks.length) throw new Error('No tracks found in playlist')
    }

    // ── 5. Barajar y preparar game_tracks ────────────────────

    const boardSize = game.board_size
    const shuffledTracks = shuffle(tracks)
    const gameTracks = shuffledTracks.map((track, index) => ({
      game_id,
      play_order: index,
      spotify_id: track.spotify_id,
      name: track.name,
      artist: track.artist,
      album_name: track.album_name,
      album_image_url: track.album_image_url,
      preview_url: track.preview_url,
    }))

    // ── 6. Insertar game_tracks (service_role omite RLS) ─────

    const { error: tracksErr } = await adminClient
      .from('game_tracks')
      .insert(gameTracks)
    if (tracksErr) throw tracksErr

    // ── 7. Asignar track_positions a cada cartón ─────────────

    const allPlayOrders = gameTracks.map(gt => gt.play_order)
    const needed = boardSize * boardSize

    const { data: boards, error: boardsFetchErr } = await adminClient
      .from('boards')
      .select('id')
      .eq('game_id', game_id)

    if (boardsFetchErr || !boards?.length) throw boardsFetchErr ?? new Error('No boards found')

    for (const board of boards) {
      const trackPositions = shuffle(allPlayOrders).slice(0, needed)
      const { error: boardUpdateErr } = await adminClient
        .from('boards')
        .update({ track_positions: trackPositions })
        .eq('id', board.id)
      if (boardUpdateErr) throw boardUpdateErr
    }

    // ── 8. Cambiar estado de la partida a 'playing' ──────────

    const { error: gameUpdateErr } = await adminClient
      .from('games')
      .update({ status: 'playing', started_at: new Date().toISOString() })
      .eq('id', game_id)
    if (gameUpdateErr) throw gameUpdateErr

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    console.error('[game-start]', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
