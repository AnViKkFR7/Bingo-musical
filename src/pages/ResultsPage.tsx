import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loadSession } from '../lib/utils'
import { useGame } from '../hooks/useGame'
import { useBoard } from '../hooks/useBoard'
import { usePlayers } from '../hooks/usePlayers'
import { useGameStore } from '../store/gameStore'
import { Layout } from '../components/ui/Layout'
import { AdSlot } from '../components/ads/AdSlot'
import type { BoardCell } from '../types'
import styles from './ResultsPage.module.css'

const SLOT_RESULTS_RECT = import.meta.env.VITE_ADSENSE_SLOT_RESULTS_RECT as string

export function ResultsPage() {
  const { gameCode } = useParams<{ gameCode: string }>()
  const { t } = useTranslation()
  const session = useMemo(() => loadSession(), [])

  useGame(gameCode)
  const { game, gameTracks, currentBoard, boardMarks, players, allBoards, currentPlayer, isLoading } = useGameStore()
  useBoard(game?.id, session?.board_id)
  usePlayers(game?.id)

  const boardCells: BoardCell[] = useMemo(() => {
    if (!currentBoard || !gameTracks.length) return []
    const markedSet = new Set(boardMarks.map(m => m.play_order))
    const trackMap = new Map(gameTracks.map(gt => [gt.play_order, gt]))
    return currentBoard.track_positions
      .map(po => {
        const track = trackMap.get(po)
        if (!track) return null
        return { play_order: po, track, isPlayed: track.played_at != null, isMarked: markedSet.has(po) }
      })
      .filter((c): c is BoardCell => c !== null)
  }, [currentBoard, gameTracks, boardMarks])

  if (isLoading || !game) {
    return (
      <Layout hideAvatars>
        <div className={styles.center}>
          <div className="spinner" />
        </div>
      </Layout>
    )
  }

  const boardByPlayer = new Map(allBoards.map(b => [b.player_id, b]))
  const bingoWinners = players.filter(p => boardByPlayer.get(p.id)?.has_bingo)
  const lineWinners = players.filter(p => boardByPlayer.get(p.id)?.has_line && !boardByPlayer.get(p.id)?.has_bingo)
  const winners = bingoWinners.length ? bingoWinners : lineWinners

  const isWinner = winners.some(w => w.id === currentPlayer?.id)
  const avatarSrc = isWinner ? '/avatar ganador.png' : '/avatar perdedor.png'

  const title = isWinner
    ? (winners.length === 1 ? t('results.winner') : t('results.winners'))
    : t('results.gameOver')

  return (
    <Layout hideAvatars>
      <div className={styles.page}>

        {/* Resultado personal (ganador / perdedor) */}
        <div className={`${styles.resultCard} ${isWinner ? styles.winnerCard : styles.loserCard}`}>
          <img src={avatarSrc} alt={isWinner ? 'Ganador' : 'Perdedor'} className={styles.resultAvatar} />
          <h1 className={styles.resultTitle}>{title}</h1>

          {winners.length > 0 && (
            <ul className={styles.winnerList}>
              {winners.map(w => (
                <li key={w.id} className={styles.winnerName}>
                  {isWinner && w.id === currentPlayer?.id ? '🏆' : '🎵'} {w.alias}
                </li>
              ))}
            </ul>
          )}
        </div>

        <AdSlot slotId={SLOT_RESULTS_RECT} format="rectangle" className={styles.ad} />

        <div className={styles.actions}>
          <Link to="/" className={`btn btn-primary ${styles.homeBtn}`}>
            {t('results.backHome')}
          </Link>
          <Link to="/crear" className="btn btn-secondary">
            {t('results.playAgain')}
          </Link>
        </div>

        <div className={styles.donateNudge}>
          <p className={styles.donateNudgeText}>{t('results.donatePrompt')}</p>
          <Link to="/sobre-nosotros#donar" className={`btn ${styles.donateNudgeBtn}`}>
            {t('results.donateBtn')}
          </Link>
        </div>

        {/* Vista previa del cartón (colapsada en móvil) */}
        {currentBoard && boardCells.length > 0 && (
          <details className={styles.boardDetails}>
            <summary className={styles.boardSummary}>{t('results.yourBoard')}</summary>
            <div className={styles.boardWrapper}>
              <div
                className={styles.boardGrid}
                style={{ '--board-size': game.board_size } as React.CSSProperties}
              >
                {boardCells.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`${styles.boardCell} ${cell.isMarked ? styles.boardCellMarked : ''}`}
                  >
                    <span className={styles.boardCellName}>{cell.track.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </details>
        )}
      </div>
    </Layout>
  )
}
