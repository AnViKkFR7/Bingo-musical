import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SpotifyPlaylistTracksResponse } from '../../types'
import type { DesignId } from './PrintableBingoCard'
import type { PrintableBoard } from '../../lib/printBoards'
import { generateAllBoards } from '../../lib/printBoards'
import styles from './PrintStep4Payment.module.css'

const PRICE_EUR = import.meta.env.VITE_PRINT_PRICE_EUR ?? '1,99'

interface Props {
  playlist: SpotifyPlaylistTracksResponse
  boardSize: 3 | 4 | 5
  numPlayers: number
  numGames: number
  designId: DesignId
  customTitle: string
  onNext: (boards: PrintableBoard[][]) => void
  onBack: () => void
}

const DESIGN_LABELS: Record<DesignId, string> = {
  festivo: 'Festivo 🎉',
  retro:   'Retro 💻',
  verde:   'Verde ⚽',
  noche:   'Noche 🌙',
  papel:   'Papel 📜',
}

export function PrintStep4Payment({
  playlist,
  boardSize,
  numPlayers,
  numGames,
  designId,
  customTitle,
  onNext,
  onBack,
}: Props) {
  const { t } = useTranslation()
  const [paying, setPaying] = useState(false)

  const total = numPlayers * numGames

  async function handlePay() {
    setPaying(true)
    // TODO: Integrar pasarela de pago real (Stripe/PayPal)

    // Simulate payment processing delay (1.5 s)
    await new Promise(r => setTimeout(r, 1500))

    // Generate all boards client-side after "payment" succeeds
    const tracks = playlist.tracks.map(t => ({
      spotify_id: t.spotify_id,
      name: t.name,
      artist: t.artist,
      album_image_url: t.album_image_url ?? '',
    }))

    // For preset playlists tracks may be empty; generate placeholder cells
    const cellTracks = tracks.length >= boardSize * boardSize
      ? tracks
      : Array.from({ length: boardSize * boardSize }, (_, i) => ({
          spotify_id: `placeholder-${i}`,
          name: `Canción ${i + 1}`,
          artist: playlist.playlist.name,
          album_image_url: '',
        }))

    const boards = generateAllBoards(cellTracks, boardSize, numPlayers, numGames)
    setPaying(false)
    onNext(boards)
  }

  return (
    <div className={styles.wrapper}>
      {/* Order summary */}
      <div className="card">
        <h3 className={styles.summaryTitle}>{t('print.orderSummary')}</h3>
        <ul className={styles.summaryList}>
          <li>
            <span className={styles.summaryKey}>Playlist</span>
            <span className={styles.summaryVal}>{playlist.playlist.name}</span>
          </li>
          <li>
            <span className={styles.summaryKey}>{t('create.boardSize')}</span>
            <span className={styles.summaryVal}>{boardSize}×{boardSize}</span>
          </li>
          <li>
            <span className={styles.summaryKey}>{t('print.numPlayers')}</span>
            <span className={styles.summaryVal}>{numPlayers}</span>
          </li>
          <li>
            <span className={styles.summaryKey}>{t('print.numGames')}</span>
            <span className={styles.summaryVal}>{numGames}</span>
          </li>
          <li>
            <span className={styles.summaryKey}>{t('print.totalCards', { total })}</span>
            <span className={styles.summaryVal}>{total}</span>
          </li>
          <li>
            <span className={styles.summaryKey}>Diseño</span>
            <span className={styles.summaryVal}>{DESIGN_LABELS[designId]}</span>
          </li>
          {customTitle && (
            <li>
              <span className={styles.summaryKey}>{t('print.customTitle')}</span>
              <span className={styles.summaryVal}>{customTitle}</span>
            </li>
          )}
        </ul>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>{t('print.price')}</span>
          <span className={styles.priceValue}>{PRICE_EUR} €</span>
        </div>
      </div>

      {/* Pay button */}
      <div className={styles.paySection}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePay}
          disabled={paying}
        >
          {paying
            ? <><span className="spinner" style={{ width: '1em', height: '1em', marginRight: '0.5em' }} />{t('print.generating')}</>
            : t('print.payButton')
          }
        </button>
        <p className={styles.disclaimer}>{t('print.paymentDisclaimer')}</p>
      </div>

      {/* Back */}
      <div className={styles.backRow}>
        <button type="button" className="btn" onClick={onBack} disabled={paying}>
          ← {t('common.back')}
        </button>
      </div>
    </div>
  )
}
