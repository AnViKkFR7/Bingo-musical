import { useTranslation } from 'react-i18next'
import { useAudio } from '../../hooks/useAudio'
import styles from './AudioPlayer.module.css'

interface Props {
  previewUrl: string | null
}

/**
 * AudioPlayer — solo renderiza en el dispositivo del host.
 * Reproduce el preview MP3 de la canción actual.
 */
export function AudioPlayer({ previewUrl }: Props) {
  const { t } = useTranslation()
  const { playing, progress, togglePlay } = useAudio(previewUrl)

  return (
    <div className={styles.player}>
      <button
        type="button"
        className={`btn btn-secondary ${styles.playBtn}`}
        onClick={togglePlay}
        aria-label={playing ? 'Pause' : 'Play'}
        disabled={!previewUrl}
      >
        {playing ? '⏸' : '▶'}
      </button>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </div>

      {!previewUrl && (
        <span className={styles.noPreview}>Sin preview</span>
      )}
    </div>
  )
}
