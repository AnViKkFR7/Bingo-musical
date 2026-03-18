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

      // 3. Necesitamos al menos verificar que hay tracks suficientes
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

      const needed = game.board_size * game.board_size
      if ((tracksData.tracks_with_preview ?? 0) < needed) {
        setError(t('errors.notEnoughTracks'))
        return
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
      saveSession({ game_code: cleanCode, player_id: player.id, board_id: board.id, is_host: false })

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
        <h1 className={styles.title}>{t('home.joinGame')}</h1>

        <form className={styles.form} onSubmit={handleJoin}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="game-code">
              Código de partida
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
            <label className={styles.label} htmlFor="player-alias">
              Tu nombre
            </label>
            <input
              id="player-alias"
              type="text"
              className="input"
              placeholder="¿Cómo te llamas?"
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
