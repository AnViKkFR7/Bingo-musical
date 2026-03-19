import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { saveSession } from '../lib/utils'
import { useGameStore } from '../store/gameStore'
import { Layout } from '../components/ui/Layout'
import styles from './JoinGamePage.module.css'

export function JoinGamePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { reset } = useGameStore()

  const [code, setCode] = useState('')
  const [alias, setAlias] = useState('')
  const [sameRoom, setSameRoom] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const cleanCode = code.trim().toUpperCase()
      const cleanAlias = alias.trim()

      // 1. Buscar partida
      const { data: game, error: gameErr } = await supabase
        .from('games')
        .select('id, code, playlist_spotify_id, board_size, status')
        .eq('code', cleanCode)
        .single()

      if (gameErr || !game) {
        setError(t('errors.gameNotFound'))
        return
      }
      if (game.status === 'playing') {
        setError(t('errors.gameAlreadyStarted'))
        return
      }
      if (game.status === 'finished') {
        setError(t('errors.gameFinished'))
        return
      }

      // 2. Verificar alias libre
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('game_id', game.id)
        .eq('alias', cleanAlias)
        .maybeSingle()

      if (existingPlayer) {
        setError(t('errors.aliasTaken'))
        return
      }

      // 3. Verificar que hay tracks suficientes
      const needed = game.board_size * game.board_size

      const { data: playlistMeta } = await supabase
        .from('playlists')
        .select('id, is_preset')
        .eq('spotify_id', game.playlist_spotify_id)
        .maybeSingle()

      if (playlistMeta?.is_preset) {
        const { count } = await supabase
          .from('preset_tracks')
          .select('id', { count: 'exact', head: true })
          .eq('playlist_id', playlistMeta.id)
        if ((count ?? 0) < needed) {
          setError(t('errors.notEnoughTracks'))
          return
        }
      } else {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/spotify-get-playlist-tracks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ spotify_playlist_id: game.playlist_spotify_id }),
        })
        if (!res.ok) throw new Error('fetch_tracks_failed')
        const tracksData = await res.json()
        if ((tracksData.total_tracks ?? 0) < needed) {
          setError(t('errors.notEnoughTracks'))
          return
        }
      }

      // 4. Crear jugador
      const { data: player, error: playerErr } = await supabase
        .from('players')
        .insert({ game_id: game.id, alias: cleanAlias, is_host: false })
        .select()
        .single()

      if (playerErr || !player) throw playerErr ?? new Error('no_player')

      // 5. Insertar cartón vacío (track_positions se rellenan al iniciar)
      const { data: board, error: boardErr } = await supabase
        .from('boards')
        .insert({ game_id: game.id, player_id: player.id, track_positions: [] })
        .select()
        .single()

      if (boardErr || !board) throw boardErr ?? new Error('no_board')

      // 6. Guardar en sesión
      reset()
      saveSession({ game_code: cleanCode, player_id: player.id, board_id: board.id, is_host: false, hear_music: !sameRoom })

      navigate(`/sala/${cleanCode}`)
    } catch {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className={styles.page}>
        <button className={styles.backButton} onClick={() => navigate(-1)} type="button">
          ← {t('common.back')}
        </button>
        <h1 className={styles.title}>{t('join.title')}</h1>

        <form className={styles.form} onSubmit={handleJoin}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="game-code">
              {t('join.codeLabel')}
            </label>
            <input
              id="game-code"
              type="text"
              className={`input ${styles.codeInput}`}
              placeholder="XXXXXX"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoComplete="off"
              spellCheck={false}
              required
            />
          </div>

          <div className={styles.field}>
            <p className={styles.label}>{t('join.sameRoomQuestion')}</p>
            <div className={styles.toggleRow}>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={sameRoom}
                  onChange={e => setSameRoom(e.target.checked)}
                />
                <span className={styles.toggleSlider} />
              </label>
              <span className={styles.toggleLabel}>
                {sameRoom ? t('common.yes') : t('common.no')}
              </span>
            </div>
            {!sameRoom && (
              <p className={styles.toggleHint}>{t('join.sameRoomHint')}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="player-alias">
              {t('join.aliasLabel')}
            </label>
            <input
              id="player-alias"
              type="text"
              className="input"
              placeholder={t('join.aliasPlaceholder')}
              value={alias}
              onChange={e => setAlias(e.target.value)}
              maxLength={30}
              autoComplete="nickname"
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !code.trim() || !alias.trim()}
          >
            {loading ? t('common.loading') : t('home.joinGame')}
          </button>
        </form>
      </div>
    </Layout>
  )
}
