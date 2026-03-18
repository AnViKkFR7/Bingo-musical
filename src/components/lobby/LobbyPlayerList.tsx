import { useTranslation } from 'react-i18next'
import { getAvatarUrl } from '../../lib/utils'
import type { Player } from '../../types'
import styles from './LobbyPlayerList.module.css'

interface Props {
  players: Player[]
}

export function LobbyPlayerList({ players }: Props) {
  const { t } = useTranslation()

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        {t('lobby.players')} ({players.length})
      </h3>
      <ul className={styles.list}>
        {players.map(player => (
          <li key={player.id} className={styles.item}>
            <img
              src={getAvatarUrl(player.id)}
              alt={player.alias}
              className={styles.avatar}
            />
            <span className={styles.alias}>{player.alias}</span>
            {player.is_host && (
              <span className={styles.hostBadge}>DJ</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
