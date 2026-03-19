import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { PresetPlaylistGrid } from '../playlist/PresetPlaylistGrid'
import { PlaylistSearch } from '../playlist/PlaylistSearch'
import { PlaylistUrlInput } from '../playlist/PlaylistUrlInput'
import { PlaylistPreview } from '../playlist/PlaylistPreview'
import type { SpotifyPlaylistTracksResponse } from '../../types'
import styles from './PrintStep1Playlist.module.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const MIN_TRACKS: Record<3 | 4 | 5, number> = { 3: 9, 4: 16, 5: 25 }

interface Props {
  boardSize: 3 | 4 | 5
  playlist: SpotifyPlaylistTracksResponse | null
  onNext: (playlist: SpotifyPlaylistTracksResponse) => void
}

export function PrintStep1Playlist({ boardSize, playlist, onNext }: Props) {
  const { t } = useTranslation()

  const [selectedId, setSelectedId] = useState<string | null>(
    playlist?.playlist.spotify_id ?? null,
  )
  const [playlistData, setPlaylistData] = useState<SpotifyPlaylistTracksResponse | null>(playlist)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const confirmRef = useRef<HTMLDivElement>(null)

  // Scroll to confirm/error area whenever playlistData or error changes
  useEffect(() => {
    if (!playlistData && !error) return
    const timer = setTimeout(() => {
      confirmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 150)
    return () => clearTimeout(timer)
  }, [playlistData, error])

  async function handleSelect(spotifyId: string) {
    setSelectedId(spotifyId)
    setPlaylistData(null)
    setLoading(true)
    setError(null)

    try {
      // Check if it's a preset playlist (tracks come from DB)
      const { data: pl } = await supabase
        .from('playlists')
        .select('id, is_preset, name, image_url, owner_name')
        .eq('spotify_id', spotifyId)
        .single()

      if (pl?.is_preset) {
        // Fetch actual track data from preset_tracks so cards have real song names
        const { data: ptRows, error: ptErr } = await supabase
          .from('preset_tracks')
          .select('name, artist')
          .eq('playlist_id', pl.id)
          .order('sort_order', { ascending: true })
        if (ptErr) throw ptErr

        const tracks = (ptRows ?? []).map((row, i) => ({
          spotify_id: `preset-${pl.id}-${i}`,
          name: row.name as string,
          artist: row.artist as string,
          album_image_url: undefined,
          preview_url: '',
        }))

        setPlaylistData({
          playlist: {
            spotify_id: spotifyId,
            name: pl.name,
            image_url: pl.image_url ?? undefined,
            owner_name: pl.owner_name ?? 'Spotify',
          },
          tracks,
          total_tracks: tracks.length,
          tracks_with_preview: tracks.length,
        })
      } else {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/spotify-get-playlist-tracks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ spotify_playlist_id: spotifyId }),
        })
        if (!res.ok) throw new Error('fetch_failed')
        const data: SpotifyPlaylistTracksResponse = await res.json()
        setPlaylistData(data)
      }
    } catch {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  function handleNext() {
    if (!playlistData) return
    const needed = MIN_TRACKS[boardSize]
    if (playlistData.total_tracks < needed) {
      setError(t('print.notEnoughTracks', { size: boardSize, needed }))
      return
    }
    onNext(playlistData)
  }

  const canContinue =
    !!playlistData && playlistData.total_tracks >= MIN_TRACKS[boardSize]

  return (
    <div className={styles.wrapper}>
      <PresetPlaylistGrid selectedId={selectedId ?? undefined} onSelect={handleSelect} />
      <PlaylistSearch selectedId={selectedId ?? undefined} onSelect={handleSelect} />
      <PlaylistUrlInput onSelect={handleSelect} />

      {loading && <p className={styles.status}>{t('common.loading')}</p>}
      {error && <p className={styles.error}>{error}</p>}

      {playlistData && !loading && (
        <PlaylistPreview data={playlistData} boardSize={boardSize} />
      )}

      <div ref={confirmRef} className={styles.actions}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleNext}
          disabled={!canContinue || loading}
        >
          {t('common.confirm')} →
        </button>
      </div>
    </div>
  )
}
