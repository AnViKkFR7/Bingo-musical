import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGame } from '../hooks/useGame'
import { usePlayers } from '../hooks/usePlayers'
import { useGameStore } from '../store/gameStore'
import { Layout } from '../components/ui/Layout'
import { GameCodeDisplay } from '../components/lobby/GameCodeDisplay'
import { LobbyPlayerList } from '../components/lobby/LobbyPlayerList'
import { StartGameButton } from '../components/lobby/StartGameButton'
import styles from './LobbyPage.module.css'

export function LobbyPage() {
  const { gameCode } = useParams<{ gameCode: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Hooks de side-effects: cargan estado en el store via Realtime
  useGame(gameCode)
  const { game, players, currentPlayer, isLoading, error } = useGameStore()
  usePlayers(game?.id)

  // Redirigir si la partida ya está en curso o terminada
  useEffect(() => {
    if (!game) return
    if (game.status === 'playing') navigate(`/jugar/${gameCode}`, { replace: true })
    if (game.status === 'finished') navigate(`/resultados/${gameCode}`, { replace: true })
  }, [game, gameCode, navigate])

  if (isLoading) {
    return (
      <Layout>
        <div className={styles.center}>
          <div className="spinner" />
        </div>
      </Layout>
    )
  }

  if (error || !game) {
    return (
      <Layout>
        <div className={styles.center}>
          <p className={styles.error}>{t('errors.gameNotFound')}</p>
        </div>
      </Layout>
    )
  }

  const isHost = currentPlayer?.is_host ?? false

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.codeSection}>
          <GameCodeDisplay code={game.code} />
        </div>

        <div className={styles.playersSection}>
          <LobbyPlayerList players={players} />
        </div>

        <div className={styles.actionSection}>
          {isHost ? (
            <StartGameButton
              gameId={game.id}
              playlistSpotifyId={game.playlist_spotify_id}
              boardSize={game.board_size}
            />
          ) : (
            <p className={styles.waitingText}>{t('lobby.waitingForHost')}</p>
          )}
        </div>
      </div>
    </Layout>
  )
}
