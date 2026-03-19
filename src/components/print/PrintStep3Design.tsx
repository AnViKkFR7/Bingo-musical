import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SpotifyPlaylistTracksResponse, SpotifyTrackResult } from '../../types'
import { PrintableBingoCard } from './PrintableBingoCard'
import type { DesignId } from './PrintableBingoCard'
import type { TrackCell } from '../../lib/printBoards'
import styles from './PrintStep3Design.module.css'

const MAX_TITLE = 40

const DESIGNS: { id: DesignId; labelKey: string; emoji: string; description: string }[] = [
  { id: 'festivo', labelKey: 'print.designFestivo', emoji: '🎉', description: 'Candy · Pop · Rosa' },
  { id: 'retro',   labelKey: 'print.designRetro',   emoji: '💻', description: 'Vintage · Lila · Ordenador' },
  { id: 'verde',   labelKey: 'print.designVerde',   emoji: '⚽', description: 'Deportivo · Verde · Moderno' },
  { id: 'noche',   labelKey: 'print.designNoche',   emoji: '🌙', description: 'Discoteca · Neón · Oscuro' },
  { id: 'papel',   labelKey: 'print.designPapel',   emoji: '📜', description: 'Artesanal · Kraft · Cálido' },
]

interface Props {
  playlist: SpotifyPlaylistTracksResponse
  boardSize: 3 | 4 | 5
  designId: DesignId
  customTitle: string
  onNext: (design: DesignId, title: string) => void
  onBack: () => void
}

/** Build a sample set of cells from playlist tracks for the preview */
function sampleCells(tracks: SpotifyTrackResult[], boardSize: number): TrackCell[] {
  const needed = boardSize * boardSize
  const pool = tracks.length
    ? tracks.slice(0, needed)
    : Array.from({ length: needed }, (_, i) => ({
        spotify_id: `sample-${i}`,
        name: `Canción ${i + 1}`,
        artist: 'Artista',
        album_image_url: '',
        preview_url: '',
      }))

  return pool.map(t => ({
    spotify_id: t.spotify_id,
    name: t.name,
    artist: t.artist,
    album_image_url: t.album_image_url ?? '',
  }))
}

export function PrintStep3Design({
  playlist,
  boardSize,
  designId: initialDesign,
  customTitle: initialTitle,
  onNext,
  onBack,
}: Props) {
  const { t } = useTranslation()
  const [designId, setDesignId] = useState<DesignId>(initialDesign)
  const [customTitle, setCustomTitle] = useState(initialTitle)

  const previewCells = sampleCells(playlist.tracks, boardSize)

  return (
    <div className={styles.wrapper}>
      {/* Design selector */}
      <div className={styles.designGrid}>
        {DESIGNS.map(d => (
          <button
            key={d.id}
            type="button"
            className={`${styles.designCard} ${designId === d.id ? styles.designSelected : ''}`}
            onClick={() => setDesignId(d.id)}
            aria-pressed={designId === d.id}
          >
            <span className={styles.designEmoji}>{d.emoji}</span>
            <span className={styles.designName}>{t(d.labelKey)}</span>
            <span className={styles.designDesc}>{d.description}</span>
          </button>
        ))}
      </div>

      {/* Custom title */}
      <div className={styles.titleField}>
        <label className={styles.titleLabel} htmlFor="customTitle">
          {t('print.customTitle')}
          <span className={styles.charCount}>{customTitle.length}/{MAX_TITLE}</span>
        </label>
        <input
          id="customTitle"
          type="text"
          className="input"
          placeholder={t('print.customTitlePlaceholder')}
          value={customTitle}
          maxLength={MAX_TITLE}
          onChange={e => setCustomTitle(e.target.value)}
        />
        <p className={styles.titleHint}>{t('print.customTitleHint')}</p>
      </div>

      {/* Live preview */}
      <div className={styles.previewSection}>
        <div className={styles.previewCard}>
          <PrintableBingoCard
            design={designId}
            title={customTitle}
            cells={previewCells}
            playerNum={1}
            gameNum={1}
            boardSize={boardSize}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={onBack}>
          ← {t('common.back')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onNext(designId, customTitle)}
        >
          {t('common.confirm')} →
        </button>
      </div>
    </div>
  )
}
