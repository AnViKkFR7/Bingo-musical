import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase, ensureAuth } from '../lib/supabase'
import { generateUniqueGameCode, saveSession } from '../lib/utils'
import { useGameStore } from '../store/gameStore'
import { Layout } from '../components/ui/Layout'
import { PresetPlaylistGrid } from '../components/playlist/PresetPlaylistGrid'
import { PlaylistSearch } from '../components/playlist/PlaylistSearch'
import { PlaylistUrlInput } from '../components/playlist/PlaylistUrlInput'
import { PlaylistPreview } from '../components/playlist/PlaylistPreview'
import { GameConfigForm } from '../components/playlist/GameConfigForm'
import type { SpotifyPlaylistTracksResponse } from '../types'
import styles from './CreateGamePage.module.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export function CreateGamePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { reset } = useGameStore()

  const [selectedSpotifyId, setSelectedSpotifyId] = useState<string | null>(null)
  const [playlistData, setPlaylistData] = useState<SpotifyPlaylistTracksResponse | null>(null)
  const [loadingPlaylist, setLoadingPlaylist] = useState(false)
  const [boardSize, setBoardSize] = useState<3 | 4 | 5>(3)
  const [alias, setAlias] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const configRef = useRef<HTMLDivElement>(null)
  const pageBottomRef = useRef<HTMLDivElement>(null)

  // Scroll to config form when a playlist is successfully loaded
  useEffect(() => {
    if (!playlistData) return
    const timer = setTimeout(
      () => configRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      150
    )
    return () => clearTimeout(timer)
  }, [playlistData])

  // Scroll to bottom on error so the user sees the message
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(
      () => pageBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
      100
    )
    return () => clearTimeout(timer)
  }, [error])

  async function handlePlaylistSelect(spotifyId: string) {
    setSelectedSpotifyId(spotifyId)
    setPlaylistData(null)
    setLoadingPlaylist(true)
    setError(null)

    try {
      // Check if this is a preset playlist.
      // Spotify editorial playlists (owner = Spotify) are blocked in dev mode since Nov 2024.
      // Preset playlists serve their tracks directly from the preset_tracks table.
      const { data: pl } = await supabase
        .from('playlists')
        .select('id, is_preset, name, image_url, owner_name')
        .eq('spotify_id', spotifyId)
        .single()

      if (pl?.is_preset) {
        const { count, error: ptErr } = await supabase
          .from('preset_tracks')
          .select('*', { count: 'exact', head: true })
          .eq('playlist_id', pl.id)
        if (ptErr) throw ptErr

        setPlaylistData({
          playlist: {
            spotify_id: spotifyId,
            name: pl.name,
            image_url: pl.image_url ?? undefined,
            owner_name: pl.owner_name ?? 'Spotify',
          },
          tracks: [],
          total_tracks: count ?? 30,
          tracks_with_preview: count ?? 30,
        })
      } else {
        // User playlist: fetch tracks from the Spotify edge function
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
      setLoadingPlaylist(false)
    }
  }

  async function handleCreate() {
    if (!playlistData || !selectedSpotifyId || !alias.trim()) return

    const needed = boardSize * boardSize
    if (playlistData.total_tracks < needed) {
      setError(t('errors.notEnoughTracks'))
      return
    }

    setCreating(true)
    setError(null)

    try {
      // 1. Generar código único
      const code = await generateUniqueGameCode()

      // 2. Insertar partida
      const { data: game, error: gameErr } = await supabase
        .from('games')
        .insert({
          code,
          playlist_spotify_id: selectedSpotifyId,
          playlist_name: playlistData.playlist.name,
          playlist_image_url: playlistData.playlist.image_url ?? null,
          board_size: boardSize,
          status: 'waiting',
        })
        .select()
        .single()

      if (gameErr || !game) throw gameErr ?? new Error('no_game')

      // 3. Crear jugador host
      const user = await ensureAuth()
      const { data: player, error: playerErr } = await supabase
        .from('players')
        .insert({ game_id: game.id, alias: alias.trim(), is_host: true, auth_user_id: user?.id ?? null })
        .select()
        .single()

      if (playerErr || !player) throw playerErr ?? new Error('no_player')

      // 4. Actualizar host_player_id
      const { error: hostUpdateErr } = await supabase
        .from('games')
        .update({ host_player_id: player.id })
        .eq('id', game.id)
      if (hostUpdateErr) throw hostUpdateErr

      // 5. Insertar cartón vacío (track_positions se rellenan al iniciar)
      const { data: board, error: boardErr } = await supabase
        .from('boards')
        .insert({ game_id: game.id, player_id: player.id, track_positions: [] })
        .select()
        .single()

      if (boardErr || !board) throw boardErr ?? new Error('no_board')

      // 6. Guardar sesión y re-hidratar el store antes de navegar
      reset()
      saveSession({ game_code: code, player_id: player.id, board_id: board.id, is_host: true })
      useGameStore.getState().initFromSession()

      navigate(`/sala/${code}`)
    } catch {
      setError(t('errors.generic'))
      setCreating(false)
    }
  }

  const canCreate =
    !!playlistData &&
    playlistData.total_tracks >= boardSize * boardSize &&
    !!alias.trim()

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('create.title')}</h1>
          <button className={styles.backButton} onClick={() => navigate(-1)} type="button">
            ← {t('common.back')}
          </button>
        </div>



        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>{t('create.selectPlaylist')}</h2>

          <PresetPlaylistGrid
            selectedId={selectedSpotifyId ?? undefined}
            onSelect={handlePlaylistSelect}
          />

          <PlaylistSearch
            selectedId={selectedSpotifyId ?? undefined}
            onSelect={handlePlaylistSelect}
          />

          <PlaylistUrlInput onSelect={handlePlaylistSelect} />

          {loadingPlaylist && <p className={styles.loading}>{t('common.loading')}</p>}

          {playlistData && (
            <PlaylistPreview data={playlistData} boardSize={boardSize} />
          )}
        </section>

        {playlistData && (
          <section ref={configRef} className={styles.section}>
            <GameConfigForm
              boardSize={boardSize}
              onBoardSizeChange={setBoardSize}
              alias={alias}
              onAliasChange={setAlias}
              onSubmit={handleCreate}
              loading={creating}
              disabled={!canCreate}
            />
          </section>
        )}

        {error && <p className={styles.error}>{error}</p>}
        <div ref={pageBottomRef} />
      </div>

      <button
        type="button"
        className={styles.scrollToTop}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label={t('common.scrollToTop')}
        title={t('common.scrollToTop')}
      >
        ↑
      </button>
    </Layout>
  )
}
