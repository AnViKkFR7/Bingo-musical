import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PrintableBingoCard } from './PrintableBingoCard'
import type { DesignId } from './PrintableBingoCard'
import type { PrintableBoard } from '../../lib/printBoards'
import { generatePdf } from '../../lib/generatePdf'
import styles from './PrintStep5Download.module.css'

interface Props {
  boards: PrintableBoard[][]
  boardSize: 3 | 4 | 5
  designId: DesignId
  customTitle: string
}

// Pixel dimensions for the hidden card container — sized to match A4 layout
// Larger sizes give better rendering DPI (~300dpi at html2canvas scale:2)
const CARD_PX: Record<3 | 4 | 5, { width: number; height: number }> = {
  3: { width: 560, height: 820 },
  4: { width: 560, height: 820 },
  5: { width: 1120, height: 560 },
}

// Base font-size for the card wrapper so em-based CSS produces readable print text
// Computed so that cellName (0.55em) renders at ~8-9pt in the final PDF slot
const CARD_FONT_SIZE: Record<3 | 4 | 5, number> = {
  3: 36,
  4: 32,
  5: 28,
}

export function PrintStep5Download({ boards, boardSize, designId, customTitle }: Props) {
  const { t } = useTranslation()
  const hiddenRef = useRef<HTMLDivElement>(null)

  const [downloading, setDownloading] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailSending, setEmailSending] = useState(false)

  const total = boards.flat().length
  const { width, height } = CARD_PX[boardSize]

  async function handleDownload() {
    if (!hiddenRef.current) return
    setDownloading(true)
    try {
      await generatePdf(hiddenRef.current, boardSize, boards)
    } finally {
      setDownloading(false)
    }
  }

  async function handleSendEmail() {
    if (!email.trim()) return
    setEmailSending(true)
    // TODO: Integrar EmailJS o Supabase Edge Function para envío real
    await new Promise(r => setTimeout(r, 1000))
    setEmailSending(false)
    setEmailSent(true)
  }

  return (
    <div className={styles.wrapper}>
      {/* Success message */}
      <div className={styles.successBanner}>
        <div className={styles.successIcon}>🎉</div>
        <h2 className={styles.successTitle}>{t('print.successTitle')}</h2>
        <p className={styles.successSubtitle}>{t('print.successSubtitle', { total })}</p>
      </div>

      {/* Download */}
      <div className={styles.downloadSection}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading
            ? <><span className="spinner" style={{ width: '1em', height: '1em', marginRight: '0.5em' }} />{t('print.generating')}</>
            : `⬇ ${t('print.downloadPdf')}`
          }
        </button>
      </div>

      {/* Divider */}
      <div className={styles.divider}>
        <span className={styles.dividerText}>o</span>
      </div>

      {/* Email */}
      <div className={styles.emailSection}>
        <p className={styles.emailLabel}>{t('print.sendByEmail')}</p>
        {emailSent ? (
          <p className={styles.emailSentMsg}>✅ {t('print.emailSent')}</p>
        ) : (
          <div className={styles.emailRow}>
            <input
              type="email"
              className="input"
              placeholder={t('print.emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={emailSending}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSendEmail}
              disabled={emailSending || !email.trim()}
            >
              {emailSending
                ? <span className="spinner" style={{ width: '1em', height: '1em' }} />
                : t('print.emailSend')
              }
            </button>
          </div>
        )}
      </div>

      {/* Hidden container holding all rendered cards for PDF capture */}
      <div
        ref={hiddenRef}
        aria-hidden="true"
        className={styles.hiddenContainer}
      >
        {/* Ordered: game 1 all players, game 2 all players, … */}
        {boards.map(gameBoards =>
          gameBoards.map(board => (
            <div
              key={`g${board.gameId}-p${board.playerId}`}
              style={{ width, height, flexShrink: 0, fontSize: CARD_FONT_SIZE[boardSize] }}
            >
              <PrintableBingoCard
                design={designId}
                title={customTitle}
                cells={board.cells}
                playerNum={board.playerId}
                gameNum={board.gameId}
                boardSize={boardSize}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
