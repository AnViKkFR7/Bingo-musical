import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import type { GameTrack } from '../../types'
import styles from './DJPanel.module.css'

interface Props {
  gameId: string
  currentTrackIndex: number
  gameTracks: GameTrack[]
  /** Oculta el historial de canciones (se renderiza fuera, debajo del cartón) */
  hideHistory?: boolean
}

export function DJPanel({ gameId, currentTrackIndex, gameTracks, hideHistory }: Props) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const playedTracks = gameTracks.filter(gt => gt.played_at !== null)
  const hasMoreTracks = currentTrackIndex < gameTracks.length - 1

  async function handleNext() {
    if (!hasMoreTracks || loading) return
    setLoading(true)

    const nextIndex = currentTrackIndex + 1
    const nextTrack = gameTracks[nextIndex]
    if (!nextTrack) {
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('games')
      .update({ current_track_index: nextIndex })
      .eq('id', gameId)

    if (!error) {
      await supabase
        .from('game_tracks')
        .update({ played_at: new Date().toISOString() })
        .eq('id', nextTrack.id)
    }

    setLoading(false)
  }

  return (
    <div className={styles.panel}>
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleNext}
        disabled={loading || !hasMoreTracks}
      >
        {loading
          ? t('common.loading')
          : hasMoreTracks
            ? t('game.nextTrack')
            : t('game.noMoreTracks')}
      </button>

      {/* Historial (solo cuando hideHistory=false) */}
      {!hideHistory && playedTracks.length > 0 && (
        <div className={styles.history}>
          <h4 className={styles.historyTitle}>{t('game.tracksPlayed')}</h4>
          <ul className={styles.historyList}>
            {[...playedTracks].reverse().map(track => (
              <li key={track.id} className={styles.historyItem}>
                {track.album_image_url && (
                  <img
                    src={track.album_image_url}
                    alt={track.name}
                    className={styles.historyThumb}
                    loading="lazy"
                  />
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
    </div>
  )
}
