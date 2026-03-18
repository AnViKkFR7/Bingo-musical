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
        />
      ))}
    </div>
  )
}
