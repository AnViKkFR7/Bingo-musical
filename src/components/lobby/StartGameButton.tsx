import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useGameStore } from '../../store/gameStore'
import { shuffle } from '../../lib/utils'
import styles from './StartGameButton.module.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

interface SpotifyTrack {
  spotify_id: string
  name: string
  artist: string
  album_name?: string
  album_image_url?: string
  preview_url?: string
}

interface Props {
  gameId: string
  playlistSpotifyId: string
  boardSize: number
  minPlayers?: number
}

export function StartGameButton({
  gameId,
  playlistSpotifyId,
  boardSize,
  minPlayers = 1,
}: Props) {
  const { t } = useTranslation()
  const { players } = useGameStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    setLoading(true)
    setError(null)

    try {
      // 1. Obtener tracks: desde preset_tracks (Supabase) o desde Spotify según is_preset
      let tracks: SpotifyTrack[]

      const { data: playlist } = await supabase
        .from('playlists')
        .select('id, is_preset')
        .eq('spotify_id', playlistSpotifyId)
        .single()

      if (playlist?.is_preset) {
        // Playlist destacada: leer canciones directamente desde Supabase
        // sin llamar a la API de Spotify (playlists editoriales de Spotify
        // no son accesibles con Client Credentials en modo desarrollo)
        const { data: presetTracks, error: ptErr } = await supabase
          .from('preset_tracks')
          .select('id, name, artist, album_image_url')
          .eq('playlist_id', playlist.id)
          .order('sort_order', { ascending: true })

        if (ptErr) throw ptErr
        if (!presetTracks?.length) throw new Error('no_tracks')

        tracks = presetTracks.map(pt => ({
          spotify_id: pt.id,            // UUID del preset como identificador único
          name: pt.name,
          artist: pt.artist,
          album_image_url: pt.album_image_url ?? undefined,
        }))
      } else {
        // Playlist de usuario: obtener tracks frescas desde Spotify
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/spotify-get-playlist-tracks`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ spotify_playlist_id: playlistSpotifyId }),
          }
        )

        if (!res.ok) throw new Error('fetch_tracks_failed')
        const data = await res.json() as { tracks: SpotifyTrack[] }
        if (!data.tracks?.length) throw new Error('no_tracks')
        tracks = data.tracks
      }

      if (!tracks.length) throw new Error('no_tracks')

      // 2. Barajar y asignar play_order
      const shuffledTracks = shuffle(tracks)
      const gameTracks = shuffledTracks.map((track, index) => ({
        game_id: gameId,
        play_order: index,
        spotify_id: track.spotify_id,
        name: track.name,
        artist: track.artist,
        album_name: track.album_name ?? null,
        album_image_url: track.album_image_url ?? null,
        preview_url: track.preview_url ?? null,
      }))

      // 3. Insertar game_tracks
      const { error: tracksErr } = await supabase
        .from('game_tracks')
        .insert(gameTracks)
      if (tracksErr) throw tracksErr

      // 4. Obtener todos los boards de la partida desde la BD y asignar track_positions
      const needed = boardSize * boardSize
      const allPlayOrders = gameTracks.map(gt => gt.play_order)

      const { data: boards, error: boardsFetchErr } = await supabase
        .from('boards')
        .select('id')
        .eq('game_id', gameId)

      if (boardsFetchErr || !boards?.length) throw boardsFetchErr ?? new Error('no_boards')

      for (const board of boards) {
        const trackPositions = shuffle(allPlayOrders).slice(0, needed)
        await supabase
          .from('boards')
          .update({ track_positions: trackPositions })
          .eq('id', board.id)
      }

      // 5. Iniciar la partida
      const { error: gameErr } = await supabase
        .from('games')
        .update({
          status: 'playing',
          started_at: new Date().toISOString(),
        })
        .eq('id', gameId)

      if (gameErr) throw gameErr
      // La navegación la gestiona useGame.ts al detectar el cambio de status via Realtime
    } catch {
      setError(t('errors.generic'))
      setLoading(false)
    }
  }

  const canStart = players.length >= minPlayers

  return (
    <div className={styles.container}>
      {error && <p className={styles.error}>{error}</p>}
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleStart}
        disabled={loading || !canStart}
      >
        {loading ? t('common.loading') : t('lobby.startGame')}
      </button>
      {!canStart && (
        <p className={styles.hint}>
          Se necesita al menos {minPlayers} jugador para iniciar.
        </p>
      )}
    </div>
  )
}
