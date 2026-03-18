import { useTranslation } from 'react-i18next'
import styles from './GameConfigForm.module.css'

interface Props {
  boardSize: 3 | 4 | 5
  onBoardSizeChange: (size: 3 | 4 | 5) => void
  alias: string
  onAliasChange: (alias: string) => void
  onSubmit: () => void
  loading: boolean
  disabled: boolean
}

const BOARD_SIZES = [3, 4, 5] as const

export function GameConfigForm({
  boardSize,
  onBoardSizeChange,
  alias,
  onAliasChange,
  onSubmit,
  loading,
  disabled,
}: Props) {
  const { t } = useTranslation()

  const sizeLabels: Record<3 | 4 | 5, string> = {
    3: t('create.boardSize3'),
    4: t('create.boardSize4'),
    5: t('create.boardSize5'),
  }

  return (
    <form
      className={styles.form}
      onSubmit={e => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <div className={styles.field}>
        <label className={styles.label}>{t('create.boardSize')}</label>
        <div className={styles.sizeOptions}>
          {BOARD_SIZES.map(size => (
            <button
              key={size}
              type="button"
              className={`${styles.sizeBtn} ${boardSize === size ? styles.active : ''}`}
              onClick={() => onBoardSizeChange(size)}
            >
              {sizeLabels[size]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="host-alias">
          {t('create.yourAlias')}
        </label>
        <input
          id="host-alias"
          type="text"
          className="input"
          placeholder={t('create.aliasPlaceholder')}
          value={alias}
          onChange={e => onAliasChange(e.target.value)}
          maxLength={30}
          autoComplete="nickname"
          required
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={disabled || loading || !alias.trim()}
      >
        {loading ? t('common.loading') : t('create.createButton')}
      </button>
    </form>
  )
}
