import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { extractSpotifyId } from '../../lib/utils'
import styles from './PlaylistUrlInput.module.css'

interface Props {
  onSelect: (spotifyId: string) => void
}

export function PlaylistUrlInput({ onSelect }: Props) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleChange(v: string) {
    setValue(v)
    setError(null)
    if (!v.trim()) return

    const id = extractSpotifyId(v.trim())
    if (id) {
      onSelect(id)
    } else {
      setError(t('errors.invalidUrl'))
    }
  }

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('create.pasteUrl')}</h3>
      <input
        type="url"
        className="input"
        placeholder={t('create.urlPlaceholder')}
        value={value}
        onChange={e => handleChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      {error && <p className={styles.error}>{error}</p>}
    </section>
  )
}
