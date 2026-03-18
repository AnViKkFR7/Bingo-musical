import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './GameCodeDisplay.module.css'

interface Props {
  code: string
}

export function GameCodeDisplay({ code }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback para navegadores sin clipboard API
      const el = document.createElement('textarea')
      el.value = code
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={styles.container}>
      <p className={styles.label}>{t('lobby.shareCode')}</p>
      <div className={styles.codeBox}>
        <span className={styles.code}>{code}</span>
      </div>
      <button
        type="button"
        className={`btn btn-secondary ${styles.copyBtn}`}
        onClick={handleCopy}
      >
        {copied ? t('lobby.codeCopied') : t('lobby.copyCode')}
      </button>
    </div>
  )
}
