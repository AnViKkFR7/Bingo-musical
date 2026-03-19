import { useState } from 'react'
import type { BoardCell } from '../../types'
import { BingoCell } from './BingoCell'
import styles from './BingoBoard.module.css'

interface Props {
  cells: BoardCell[]
  boardSize: number
  boardId: string
  gameId: string
}

export function BingoBoard({ cells, boardSize, boardId, gameId }: Props) {
  const [blocked, setBlocked] = useState(false)

  function handleWrongClick() {
    if (blocked) return
    setBlocked(true)
    setTimeout(() => setBlocked(false), 1500)
  }

  return (
    <div
      className={styles.grid}
      style={{ '--board-size': boardSize } as React.CSSProperties}
      aria-label="Cartón de bingo"
    >
      {cells.map((cell, index) => (
        <BingoCell
          key={`${cell.play_order}-${index}`}
          cell={cell}
          boardId={boardId}
          gameId={gameId}
          blocked={blocked}
          onWrongClick={handleWrongClick}
        />
      ))}
    </div>
  )
}
