import { useTranslation } from 'react-i18next'
import type { Player, Board } from '../../types'
import styles from './PlayerList.module.css'

interface Props {
  players: Player[]
  boards: Board[]
}

export function PlayerList({ players, boards }: Props) {
  const { t } = useTranslation()

  const boardByPlayer = new Map(boards.map(b => [b.player_id, b]))

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{t('game.players')}</h3>
      <ul className={styles.list}>
        {players.map(player => {
          const board = boardByPlayer.get(player.id)
          return (
            <li key={player.id} className={styles.item}>
              <span className={styles.avatar}>
                {player.alias.charAt(0).toUpperCase()}
              </span>
              <span className={styles.alias}>{player.alias}</span>
              <div className={styles.badges}>
                {player.is_host && (
                  <span className={styles.djBadge}>DJ</span>
                )}
                {board?.has_bingo && (
                  <span className={`${styles.badge} ${styles.bingoBadge}`}>
                    BINGO
                  </span>
                )}
                {board?.has_line && !board?.has_bingo && (
                  <span className={`${styles.badge} ${styles.lineBadge}`}>
                    {t('game.line')}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
