import { useTranslation } from 'react-i18next'
import type { Player, Board } from '../../types'
import styles from './PlayerList.module.css'

const PLAYER_AVATARS = [
  'Adobe%20Express%20-%20file.png',
  'Adobe%20Express%20-%20file%20-%20copia.png',
  'Adobe%20Express%20-%20file%20-%20copia%20(2).png',
  'Adobe%20Express%20-%20file%20-%20copia%20(3).png',
  'Adobe%20Express%20-%20file%20-%20copia%20(4).png',
  'Adobe%20Express%20-%20file%20-%20copia%20(6).png',
  'Adobe%20Express%20-%20file%20-%20copia%20(7).png',
  'Adobe%20Express%20-%20file%20-%20copia%20(11).png',
]

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
        {players.map((player, index) => {
          const board = boardByPlayer.get(player.id)
          return (
            <li key={player.id} className={styles.item}>
              <img
                src={`/avatares/${PLAYER_AVATARS[index % PLAYER_AVATARS.length]}`}
                className={styles.avatar}
                alt={player.alias.charAt(0).toUpperCase()}
              />
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
