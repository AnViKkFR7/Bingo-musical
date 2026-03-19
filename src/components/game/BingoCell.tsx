import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { BoardCell } from '../../types'
import styles from './BingoCell.module.css'

interface Props {
  cell: BoardCell
  boardId: string
  gameId: string
}

export function BingoCell({ cell, boardId, gameId }: Props) {
  const [marking, setMarking] = useState(false)

  async function handleClick() {
    if (cell.isMarked || marking) return
    setMarking(true)
    await supabase.from('board_marks').insert({
      board_id: boardId,
      game_id: gameId,
      play_order: cell.play_order,
    })
    setMarking(false)
  }

  const isClickable = !cell.isMarked

  return (
    <div
      className={[
        styles.wrapper,
        cell.isMarked ? styles.flipped : '',
        isClickable ? styles.clickable : '',
        marking ? styles.marking : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
      role="button"
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      aria-pressed={cell.isMarked}
      aria-label={`${cell.track.name} — ${cell.track.artist}`}
    >
      <div className={styles.inner}>
        {/* FRONT */}
        <div className={styles.front}>
          {cell.track.album_image_url ? (
            <img
              src={cell.track.album_image_url}
              alt={cell.track.name}
              className={styles.image}
              loading="lazy"
            />
          ) : (
            <div className={styles.imagePlaceholder}>♪</div>
          )}
          <div className={styles.info}>
            <span className={styles.trackName}>{cell.track.name}</span>
            <span className={styles.artist}>{cell.track.artist}</span>
          </div>
        </div>

        {/* BACK shown after flip */}
        <div className={styles.back} aria-hidden="true">
          <div className={styles.checkCircle}>
            <svg viewBox="0 0 24 24" fill="none" className={styles.checkIcon}>
              <path
                d="M5 13l4 4L19 7"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
