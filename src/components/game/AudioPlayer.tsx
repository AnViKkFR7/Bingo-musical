import { useAudio } from '../../hooks/useAudio'
import styles from './AudioPlayer.module.css'

/**
 * AudioPlayer — solo renderiza en el dispositivo del host.
 * Obtiene el preview de Deezer al vuelo (URL fresca cada vez que cambia la canción).
 */
export function AudioPlayer() {
  const { isPlaying, progress, hasError, isFetchingPreview, previewUrl, togglePlay } = useAudio()

  return (
    <div className={styles.player}>
      <button
        type="button"
        className={`btn btn-secondary ${styles.playBtn}`}
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        disabled={!previewUrl || isFetchingPreview}
      >
        {isFetchingPreview
          ? <span className={styles.spinner} aria-hidden="true" />
          : isPlaying ? '⏸' : '▶'}
      </button>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </div>

      {isFetchingPreview && (
        <span className={styles.noPreview}>Buscando en Deezer…</span>
      )}
      {!isFetchingPreview && !previewUrl && !hasError && (
        <span className={styles.noPreview}>Sin preview</span>
      )}
    </div>
  )
}
