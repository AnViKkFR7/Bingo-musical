import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './CookieBanner.module.css'

const STORAGE_KEY = 'musibingo_cookie_consent'

export type CookieConsent = 'all' | 'essential' | 'rejected'

export function getCookieConsent(): CookieConsent | null {
  try {
    return localStorage.getItem(STORAGE_KEY) as CookieConsent | null
  } catch {
    return null
  }
}

export function CookieBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem(STORAGE_KEY)
    } catch {
      return false
    }
  })

  if (!visible) return null

  const handleConsent = (level: CookieConsent) => {
    try {
      localStorage.setItem(STORAGE_KEY, level)
    } catch { /* ignore */ }
    setVisible(false)
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="cookie-title">
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.icon} aria-hidden="true">🍪</span>
          <h2 id="cookie-title" className={styles.title}>{t('cookies.title')}</h2>
        </div>
        <p className={styles.text}>
          {t('cookies.text')}{' '}
          <Link to="/politica-cookies" className={styles.link}>
            {t('cookies.policyLink')}
          </Link>
        </p>
        <div className={styles.actions}>
          <button
            className={`btn btn-primary ${styles.btnAccept}`}
            onClick={() => handleConsent('all')}
          >
            {t('cookies.acceptAll')}
          </button>
          <button
            className={`btn btn-secondary ${styles.btnEssential}`}
            onClick={() => handleConsent('essential')}
          >
            {t('cookies.essentialOnly')}
          </button>
          <button
            className={styles.btnReject}
            onClick={() => handleConsent('rejected')}
          >
            {t('cookies.reject')}
          </button>
        </div>
      </div>
    </div>
  )
}
