import { useTranslation } from 'react-i18next'
import type { SpotifyPlaylistTracksResponse } from '../../types'
import styles from './PlaylistPreview.module.css'

interface Props {
  data: SpotifyPlaylistTracksResponse
  boardSize: number
}

export function PlaylistPreview({ data, boardSize }: Props) {
  const { t } = useTranslation()
  const needed = boardSize * boardSize
  const hasEnough = data.tracks_with_preview >= needed

  return (
    <div className={`card ${styles.preview}`}>
      <div className={styles.header}>
        {data.playlist.image_url ? (
          <img
            src={data.playlist.image_url}
            alt={data.playlist.name}
            className={styles.cover}
          />
        ) : (
          <div className={styles.coverPlaceholder}>♪</div>
        )}
        <div className={styles.meta}>
          <h4 className={styles.name}>{data.playlist.name}</h4>
          {data.playlist.owner_name && (
            <p className={styles.owner}>{data.playlist.owner_name}</p>
          )}
          <p className={`${styles.count} ${hasEnough ? styles.countOk : styles.countWarn}`}>
            {data.tracks_with_preview} / {data.total_tracks} tracks con preview
          </p>
        </div>
      </div>

      {!hasEnough && (
        <p className={styles.warning}>
          {t('create.notEnoughTracksWarning', {
            count: data.tracks_with_preview,
            needed,
            size: boardSize,
          })}
        </p>
      )}
    </div>
  )
}
