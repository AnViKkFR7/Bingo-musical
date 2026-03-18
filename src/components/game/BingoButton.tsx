import { useState } from 'react'
import styles from './BingoButton.module.css'

interface Props {
  boardComplete: boolean
  alreadyClaimed: boolean
  onClaimBingo: () => void
}

export function BingoButton({ boardComplete, alreadyClaimed, onClaimBingo }: Props) {
  const [shaking, setShaking] = useState(false)

  function handleClick() {
    if (alreadyClaimed) return
    if (boardComplete) {
      onClaimBingo()
    } else {
      setShaking(true)
      setTimeout(() => setShaking(false), 620)
    }
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={[
          styles.btn,
          alreadyClaimed ? styles.claimed : '',
          shaking ? styles.shake : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={handleClick}
        disabled={alreadyClaimed}
        aria-label="BINGO!"
      >
        {alreadyClaimed ? '🎉 ¡BINGO cantado!' : 'BINGO!'}
      </button>
    </div>
  )
}
