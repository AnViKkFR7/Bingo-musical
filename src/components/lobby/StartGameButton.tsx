import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useGameStore } from '../../store/gameStore'
import styles from './StartGameButton.module.css'

interface Props {
  gameId: string
  playlistSpotifyId: string
  boardSize: number
  minPlayers?: number
}

export function StartGameButton({
  gameId,
  playlistSpotifyId: _playlistSpotifyId,
  boardSize: _boardSize,
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
      // Toda la lógica de inicio se ejecuta en la Edge Function game-start
      // con service_role (omite RLS). La verificación de que el caller
      // es el host se hace en la EF mediante JWT + RLS check.
      const { error: fnErr } = await supabase.functions.invoke('game-start', {
        body: { game_id: gameId },
      })
      if (fnErr) throw fnErr
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
