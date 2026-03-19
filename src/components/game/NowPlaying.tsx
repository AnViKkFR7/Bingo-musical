import { useTranslation } from 'react-i18next'
import type { GameTrack } from '../../types'
import styles from './NowPlaying.module.css'

const MYSTERY_AVATARS = [
  'Adobe%20Express%20-%20file.png',
  'Adobe%20Express%20-%20file%20-%20copia%20(3).png',
  'Adobe%20Express%20-%20file%20-%20copia%20(4).png',
  'Adobe%20Express%20-%20file%20-%20copia%20(7).png',
]

interface Props {
  track: GameTrack | null
  progress: number  // 0-100
  tracksPlayed: number
  totalTracks: number
  revealed?: boolean
  isHost?: boolean
}

export function NowPlaying({ track, progress, tracksPlayed, totalTracks, revealed = true, isHost = false }: Props) {
  const { t } = useTranslation()

  if (!track) {
    return (
      <div className={`card ${styles.empty}`}>
        <p className={styles.emptyText}>
          {isHost ? t('game.clickToStart') : t('game.waitingForDJ')}
        </p>
      </div>
    )
  }

  return (
    <div className={`card ${styles.container}`}>
      <div className={styles.header}>
        <span className={styles.label}>{t('game.nowPlaying')}</span>
        <span className={styles.counter}>
          {tracksPlayed} / {totalTracks}
        </span>
      </div>

      {revealed ? (
        <div className={styles.trackInfo}>
          {track.album_image_url ? (
            <img
              src={track.album_image_url}
              alt={track.album_name ?? track.name}
              className={styles.albumArt}
            />
          ) : (
            <div className={styles.albumArtPlaceholder}>♪</div>
          )}
          <div className={styles.details}>
            <span className={styles.trackName}>{track.name}</span>
            <span className={styles.artist}>{track.artist}</span>
            {track.album_name && (
              <span className={styles.album}>{track.album_name}</span>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.mystery}>
          <img
            src={`/avatares/${MYSTERY_AVATARS[track.play_order % MYSTERY_AVATARS.length]}`}
            className={styles.mysteryAvatar}
            alt=""
          />
          <div className={styles.mysteryText}>
            <span className={styles.mysteryHint}>🎵 ¿Reconoces la canción?</span>
            <span className={styles.mysterySub}>La info aparece en unos segundos…</span>
          </div>
        </div>
      )}

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
