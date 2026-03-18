import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
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

  async function handlePlaylistSelect(spotifyId: string) {
    setSelectedSpotifyId(spotifyId)
    setPlaylistData(null)
    setLoadingPlaylist(true)
    setError(null)

    try {
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
    } catch {
      setError(t('errors.generic'))
    } finally {
      setLoadingPlaylist(false)
    }
  }

  async function handleCreate() {
    if (!playlistData || !selectedSpotifyId || !alias.trim()) return

    const needed = boardSize * boardSize
    if (playlistData.tracks_with_preview < needed) {
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
      const { data: player, error: playerErr } = await supabase
        .from('players')
        .insert({ game_id: game.id, alias: alias.trim(), is_host: true })
        .select()
        .single()

      if (playerErr || !player) throw playerErr ?? new Error('no_player')

      // 4. Actualizar host_player_id
      await supabase.from('games').update({ host_player_id: player.id }).eq('id', game.id)

      // 5. Insertar cartón vacío (track_positions se rellenan al iniciar)
      const { data: board, error: boardErr } = await supabase
        .from('boards')
        .insert({ game_id: game.id, player_id: player.id, track_positions: [] })
        .select()
        .single()

      if (boardErr || !board) throw boardErr ?? new Error('no_board')

      // 6. Guardar sesión
      reset()
      saveSession({ game_code: code, player_id: player.id, board_id: board.id, is_host: true })

      navigate(`/sala/${code}`)
    } catch {
      setError(t('errors.generic'))
      setCreating(false)
    }
  }

  const canCreate =
    !!playlistData &&
    playlistData.tracks_with_preview >= boardSize * boardSize &&
    !!alias.trim()

  return (
    <Layout>
      <div className={styles.page}>
        <h1 className={styles.title}>{t('create.title')}</h1>

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
          <section className={styles.section}>
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
      </div>
    </Layout>
  )
}
