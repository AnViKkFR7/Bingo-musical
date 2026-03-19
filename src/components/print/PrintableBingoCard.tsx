import styles from './PrintableBingoCard.module.css'
import type { TrackCell } from '../../lib/printBoards'

export type DesignId = 'festivo' | 'retro' | 'verde' | 'noche' | 'papel'

interface Props {
  design: DesignId
  title: string
  cells: TrackCell[]
  playerNum: number
  gameNum: number
  boardSize: 3 | 4 | 5
}

// Festivo design: 6-color confetti palette per cell index
const FESTIVO_COLORS = ['#c0392b', '#e8a0bf', '#f4a261', '#9b59b6', '#f8c8d4', '#ffffff']

/** Returns white or dark text depending on cell background luminance */
function textColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  // Relative luminance (simplified)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#c0392b' : '#ffffff'
}

export function PrintableBingoCard({ design, title, cells, playerNum, gameNum, boardSize }: Props) {
  const displayTitle = title.trim() || 'MusiBingo'
  const playerLabel = `Jugador ${playerNum} · Partida ${gameNum}`

  return (
    <div className={`${styles.card} ${styles[design]}`}>
      {/* ── Header ─────────────────────────────────────────── */}
      {design === 'festivo' && (
        <div className={styles.headerFestivo}>
          <div className={styles.headerDecLeft}>📻</div>
          <div className={styles.headerCenter}>
            <div className={styles.titleFestivo}>Bingo Musical</div>
            <div className={styles.subtitleFestivo}>{displayTitle.toUpperCase()}</div>
            <div className={styles.playerLabel}>{playerLabel}</div>
          </div>
          <div className={styles.headerDecRight}>🎵</div>
        </div>
      )}

      {design === 'retro' && (
        <div className={styles.headerRetro}>
          <div className={styles.retroTitleBar}>
            <span className={styles.retroWindowTitle}>MusiBingo.app</span>
            <span className={styles.retroButtons}>□ □ □</span>
          </div>
          <div className={styles.retroHeaderBody}>
            <div className={styles.titleRetro}>Bingo Musical</div>
            <div className={styles.subtitleRetro}>{displayTitle}</div>
            <div className={styles.playerLabelRetro}>{playerLabel}</div>
          </div>
        </div>
      )}

      {design === 'verde' && (
        <div className={styles.headerVerde}>
          <div className={styles.verdeHandle}>@MUSIBINGO</div>
          <div className={styles.titleVerde}>{displayTitle.toUpperCase()}</div>
          <div className={styles.verdeBanner}>BINGO MUSICAL</div>
          <div className={styles.playerLabelVerde}>{playerLabel}</div>
        </div>
      )}

      {design === 'noche' && (
        <div className={styles.headerNoche}>
          <div className={styles.nocheStars}>✦ ✦ ✦</div>
          <div className={styles.titleNoche}>🎶 Bingo Musical 🎶</div>
          <div className={styles.subtitleNoche}>{displayTitle}</div>
          <div className={styles.playerLabelNoche}>{playerLabel}</div>
        </div>
      )}

      {design === 'papel' && (
        <div className={styles.headerPapel}>
          <div className={styles.papelStamp}>★ MusiBingo ★</div>
          <div className={styles.titlePapel}>Bingo Musical</div>
          <div className={styles.subtitlePapel}>{displayTitle}</div>
          <div className={styles.playerLabelPapel}>{playerLabel}</div>
        </div>
      )}

      {/* ── Grid ───────────────────────────────────────────── */}
      <div
        className={`${styles.grid} ${styles[`grid${boardSize}`]}`}
        style={{ '--board-size': boardSize } as React.CSSProperties}
      >
        {cells.map((cell, i) => {
          if (design === 'festivo') {
            const bg = FESTIVO_COLORS[i % FESTIVO_COLORS.length]
            const color = textColor(bg)
            return (
              <div
                key={i}
                className={styles.cell}
                style={{ backgroundColor: bg, color }}
              >
                <span className={styles.cellName}>{cell.name}</span>
                <span className={styles.cellArtist}>{cell.artist}</span>
              </div>
            )
          }

          if (design === 'retro') {
            return (
              <div key={i} className={`${styles.cell} ${styles.cellRetro}`}>
                <span className={styles.cellNameRetro}>{cell.name}</span>
                <span className={styles.cellArtistRetro}>{cell.artist}</span>
              </div>
            )
          }

          if (design === 'noche') {
            // Alternate between two deep dark cells with neon accent borders
            const isGlowCell = i % 3 === 0
            return (
              <div key={i} className={`${styles.cell} ${isGlowCell ? styles.cellNocheGlow : styles.cellNoche}`}>
                <span className={styles.cellNameNoche}>{cell.name}</span>
                <span className={styles.cellArtistNoche}>{cell.artist}</span>
              </div>
            )
          }

          if (design === 'papel') {
            return (
              <div key={i} className={`${styles.cell} ${styles.cellPapel}`}>
                <span className={styles.cellNamePapel}>{cell.name}</span>
                <span className={styles.cellArtistPapel}>{cell.artist}</span>
              </div>
            )
          }

          // verde: checkerboard
          const isEvenCell = (Math.floor(i / boardSize) + (i % boardSize)) % 2 === 0
          return (
            <div
              key={i}
              className={styles.cell}
              style={{ backgroundColor: isEvenCell ? '#2d6e35' : '#4a9e54' }}
            >
              <span className={styles.cellNameVerde}>{cell.name}</span>
              <span className={styles.cellArtistVerde}>{cell.artist}</span>
            </div>
          )
        })}
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      {design === 'retro' && (
        <div className={styles.footerRetro}>@MusiBingo</div>
      )}
      {design === 'noche' && (
        <div className={styles.footerNoche}>✦ @MusiBingo ✦</div>
      )}
      {design === 'papel' && (
        <div className={styles.footerPapel}>— musibingo.app —</div>
      )}
    </div>
  )
}
