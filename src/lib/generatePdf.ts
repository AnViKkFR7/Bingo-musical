// ============================================================
// BINGO MUSICAL — Generación del PDF imprimible
// ============================================================
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { PrintableBoard } from './printBoards'

export type DesignId = 'festivo' | 'retro' | 'verde'

// Cards per A4 page by board size
const CARDS_PER_PAGE: Record<3 | 4 | 5, number> = { 3: 4, 4: 4, 5: 3 }

// Grid layout per board size
const LAYOUT: Record<3 | 4 | 5, { cols: number; rows: number }> = {
  3: { cols: 2, rows: 2 },
  4: { cols: 2, rows: 2 },
  5: { cols: 1, rows: 3 },
}

/**
 * Convert an external image URL to a base64 data URI.
 * Use this helper when embedding Spotify album images into jsPDF
 * to avoid CORS issues. Available for future use.
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

/**
 * Generate and download the bingo card PDF.
 *
 * @param cardsContainer - The hidden DOM element containing all rendered
 *                         PrintableBingoCard wrappers as direct children.
 * @param boardSize      - 3, 4 or 5
 * @param boards         - The generated boards (for ordering: all games, all players)
 */
export async function generatePdf(
  cardsContainer: HTMLElement,
  boardSize: 3 | 4 | 5,
  boards: PrintableBoard[][],
): Promise<void> {
  const A4_W = 210   // mm
  const A4_H = 297   // mm
  const MARGIN = 10  // mm
  const GAP_MM = 5   // mm gap between cards

  const useW = A4_W - 2 * MARGIN
  const useH = A4_H - 2 * MARGIN

  const { cols, rows } = LAYOUT[boardSize]
  const cardW = (useW - (cols - 1) * GAP_MM) / cols
  const cardH = (useH - (rows - 1) * GAP_MM) / rows
  const cardsPerPage = CARDS_PER_PAGE[boardSize]

  // Boards are ordered game1/all-players, game2/all-players …
  const totalBoards = boards.flat().length
  const cardEls = Array.from(cardsContainer.children) as HTMLElement[]

  if (cardEls.length !== totalBoards) {
    console.warn(
      `generatePdf: expected ${totalBoards} card elements but found ${cardEls.length}`,
    )
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let firstPage = true

  // Ensure custom fonts (Nunito etc.) are fully loaded before capturing
  await document.fonts.ready

  for (let i = 0; i < cardEls.length; i++) {
    const posInPage = i % cardsPerPage

    if (posInPage === 0 && !firstPage) {
      pdf.addPage()
    }
    firstPage = false

    const canvas = await html2canvas(cardEls[i], {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/png')
    const col = posInPage % cols
    const row = Math.floor(posInPage / cols)
    const x = MARGIN + col * (cardW + GAP_MM)
    const y = MARGIN + row * (cardH + GAP_MM)

    pdf.addImage(imgData, 'PNG', x, y, cardW, cardH)
  }

  pdf.save('musibingo-cartones.pdf')
}
