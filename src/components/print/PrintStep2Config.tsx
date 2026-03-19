import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SpotifyPlaylistTracksResponse } from '../../types'
import styles from './PrintStep2Config.module.css'

const MIN_TRACKS: Record<3 | 4 | 5, number> = { 3: 9, 4: 16, 5: 25 }

interface Props {
  playlist: SpotifyPlaylistTracksResponse
  boardSize: 3 | 4 | 5
  numPlayers: number
  numGames: number
  onNext: (config: { boardSize: 3 | 4 | 5; numPlayers: number; numGames: number }) => void
  onBack: () => void
}

export function PrintStep2Config({
  playlist,
  boardSize: initialBoardSize,
  numPlayers: initialPlayers,
  numGames: initialGames,
  onNext,
  onBack,
}: Props) {
  const { t } = useTranslation()

  const [boardSize, setBoardSize] = useState<3 | 4 | 5>(initialBoardSize)
  const [numPlayers, setNumPlayers] = useState(initialPlayers)
  const [numGames, setNumGames] = useState(initialGames)

  const total = numPlayers * numGames
  const needed = MIN_TRACKS[boardSize]
  const hasEnoughTracks = playlist.total_tracks >= needed

  function handleNext() {
    if (!hasEnoughTracks) return
    onNext({ boardSize, numPlayers, numGames })
  }

  return (
    <div className={styles.wrapper}>
      {/* Board size */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t('create.boardSize')}</legend>
        <div className={styles.radioGroup}>
          {([3, 4, 5] as const).map(size => (
            <label
              key={size}
              className={`${styles.radioLabel} ${boardSize === size ? styles.radioSelected : ''}`}
            >
              <input
                type="radio"
                name="boardSize"
                value={size}
                checked={boardSize === size}
                onChange={() => setBoardSize(size)}
                className={styles.radioInput}
              />
              <span className={styles.radioText}>{t(`create.boardSize${size}`)}</span>
            </label>
          ))}
        </div>
        {!hasEnoughTracks && (
          <p className={styles.warn}>
            {t('print.notEnoughTracks', { size: boardSize, needed })}
          </p>
        )}
      </fieldset>

      {/* Number of players */}
      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="numPlayers">
          {t('print.numPlayers')}
          <span className={styles.fieldValue}>{numPlayers}</span>
        </label>
        <input
          id="numPlayers"
          type="range"
          min={1}
          max={50}
          value={numPlayers}
          onChange={e => setNumPlayers(Number(e.target.value))}
          className={styles.slider}
        />
        <div className={styles.sliderTicks}>
          <span>1</span>
          <span>50</span>
        </div>
      </div>

      {/* Number of games */}
      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="numGames">
          {t('print.numGames')}
          <span className={styles.fieldValue}>{numGames}</span>
        </label>
        <input
          id="numGames"
          type="range"
          min={1}
          max={10}
          value={numGames}
          onChange={e => setNumGames(Number(e.target.value))}
          className={styles.slider}
        />
        <div className={styles.sliderTicks}>
          <span>1</span>
          <span>10</span>
        </div>
      </div>

      {/* Total counter */}
      <div className={styles.totalBadge}>
        {t('print.totalCards', { total })}
      </div>

      {/* Navigation */}
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={onBack}>
          ← {t('common.back')}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleNext}
          disabled={!hasEnoughTracks}
        >
          {t('common.confirm')} →
        </button>
      </div>
    </div>
  )
}
