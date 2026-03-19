import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { loadSession } from '../lib/utils'
import { useGame } from '../hooks/useGame'
import { useGameTracks } from '../hooks/useGameTracks'
import { useBoard } from '../hooks/useBoard'
import { usePlayers } from '../hooks/usePlayers'
import { useTrackReveal } from '../hooks/useTrackReveal'
import { useGameStore } from '../store/gameStore'
import { Layout } from '../components/ui/Layout'
import { AdSlot } from '../components/ads/AdSlot'
import { NowPlaying } from '../components/game/NowPlaying'
import { DJPanel } from '../components/game/DJPanel'
import { BingoBoard } from '../components/game/BingoBoard'
import { BingoButton } from '../components/game/BingoButton'
import { PlayerList } from '../components/game/PlayerList'
import { AudioPlayer } from '../components/game/AudioPlayer'
import type { BoardCell } from '../types'
import styles from './GamePage.module.css'

const SLOT_GAME_SIDEBAR = import.meta.env.VITE_ADSENSE_SLOT_GAME_SIDEBAR as string

export function GamePage() {
  const { gameCode } = useParams<{ gameCode: string }>()
  const { t } = useTranslation()
  const session = useMemo(() => loadSession(), [])

  useGame(gameCode)
  const {
    game,
    gameTracks,
    currentBoard,
    boardMarks,
    players,
    allBoards,
    currentPlayer,
    isLoading,
    getCurrentTrack,
  } = useGameStore()
  useGameTracks(game?.id)
  useBoard(game?.id, session?.board_id)
  usePlayers(game?.id)

  const currentTrack = getCurrentTrack()
  const isHost = currentPlayer?.is_host ?? false
  const hearMusic = session?.hear_music ?? false
  const revealed = useTrackReveal(currentTrack)

  const boardCells: BoardCell[] = useMemo(() => {
    if (!currentBoard || !gameTracks.length) return []
    const markedSet = new Set(boardMarks.map(m => m.play_order))
    const trackMap = new Map(gameTracks.map(gt => [gt.play_order, gt]))
    return currentBoard.track_positions
      .map(po => {
        const track = trackMap.get(po)
        if (!track) return null
        return {
          play_order: po,
          track,
          isPlayed: track.played_at != null,
          isMarked: markedSet.has(po),
        }
      })
      .filter((c): c is BoardCell => c !== null)
  }, [currentBoard, gameTracks, boardMarks])

  const boardComplete = boardCells.length > 0 && boardCells.every(c => c.isMarked)

  async function handleAutoNext() {
    if (!game) return
    const nextIndex = game.current_track_index + 1
    if (nextIndex >= gameTracks.length) return
    const nextTrack = gameTracks[nextIndex]
    if (!nextTrack) return
    const { error } = await supabase
      .from('games')
      .update({ current_track_index: nextIndex })
      .eq('id', game.id)
    if (!error) {
      await supabase
        .from('game_tracks')
        .update({ played_at: new Date().toISOString() })
        .eq('id', nextTrack.id)
    }
  }

  async function handleEndGame() {
    if (!game) return
    await supabase
      .from('games')
      .update({ status: 'finished', finished_at: new Date().toISOString() })
      .eq('id', game.id)
    // useGame detects the change and navigates automatically via Realtime
  }

  async function handleClaimBingo() {
    if (!currentBoard || !game) return
    await supabase.from('boards').update({ has_bingo: true }).eq('id', currentBoard.id)
    await supabase
      .from('games')
      .update({ status: 'finished', finished_at: new Date().toISOString() })
      .eq('id', game.id)
  }

  if (isLoading || !game) {
    return (
      <Layout hideHeader>
        <div className={styles.center}>
          <div className="spinner" />
        </div>
      </Layout>
    )
  }

  const tracksPlayed = gameTracks.filter(gt => gt.played_at != null).length
  const playedTracksList = gameTracks.filter(gt => gt.played_at != null)
  const historyTracks = revealed
    ? playedTracksList
    : playedTracksList.filter(gt => gt.id !== currentTrack?.id)

  return (
    <Layout hideHeader>
      <div className={styles.layout}>
        <main className={styles.main}>
          {/* 1. Canción actual */}
          <NowPlaying
            track={currentTrack}
            progress={0}
            tracksPlayed={tracksPlayed}
            totalTracks={gameTracks.length}
            revealed={revealed}
            isHost={isHost}
          />

          {/* 2. Reproductor de audio */}
          {(isHost || hearMusic) && currentTrack && (
            <AudioPlayer onTrackEnd={isHost ? handleAutoNext : undefined} />
          )}

          {/* 3. Siguiente canción (solo DJ) */}
          {isHost && (
            <DJPanel
              gameId={game.id}
              currentTrackIndex={game.current_track_index}
              gameTracks={gameTracks}
              hideHistory
            />
          )}

          {/* 4+5. Cartón + botón bingo */}
          {currentBoard && (
            <>
              <BingoBoard
                cells={boardCells}
                boardSize={game.board_size}
                boardId={currentBoard.id}
                gameId={game.id}
              />
              <BingoButton
                boardComplete={boardComplete}
                alreadyClaimed={currentBoard.has_bingo}
                onClaimBingo={handleClaimBingo}
              />
            </>
          )}

          {/* 6+7. Finalizar + historial — solo móvil */}
          {isHost && (
            <>
              <button
                type="button"
                className={`btn btn-danger ${styles.mobileOnly}`}
                onClick={handleEndGame}
              >
                {t('game.endGame')}
              </button>

              {historyTracks.length > 0 && (
                <div className={`card ${styles.history} ${styles.mobileOnly}`}>
                  <h4 className={styles.historyTitle}>{t('game.tracksPlayed')}</h4>
                  <ul className={styles.historyList}>
                    {[...historyTracks].reverse().map(track => (
                      <li key={track.id} className={styles.historyItem}>
                        {track.album_image_url && (
                          <img src={track.album_image_url} alt={track.name} className={styles.historyThumb} loading="lazy" />
                        )}
                        <div className={styles.historyInfo}>
                          <span className={styles.historyName}>{track.name}</span>
                          <span className={styles.historyArtist}>{track.artist}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </main>

        <aside className={styles.sidebar}>
          <PlayerList players={players} boards={allBoards} />

          {/* Finalizar + historial — tablet/pc (sidebar) */}
          {isHost && (
            <>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleEndGame}
              >
                {t('game.endGame')}
              </button>

              {historyTracks.length > 0 && (
                <div className={`card ${styles.history}`}>
                  <h4 className={styles.historyTitle}>{t('game.tracksPlayed')}</h4>
                  <ul className={styles.historyList}>
                    {[...historyTracks].reverse().map(track => (
                      <li key={track.id} className={styles.historyItem}>
                        {track.album_image_url && (
                          <img src={track.album_image_url} alt={track.name} className={styles.historyThumb} loading="lazy" />
                        )}
                        <div className={styles.historyInfo}>
                          <span className={styles.historyName}>{track.name}</span>
                          <span className={styles.historyArtist}>{track.artist}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <AdSlot slotId={SLOT_GAME_SIDEBAR} format="vertical" />
        </aside>
      </div>
    </Layout>
  )
}
