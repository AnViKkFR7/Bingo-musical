import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import styles from './GameCodeDisplay.module.css'

interface Props {
  code: string
}

export function GameCodeDisplay({ code }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const joinUrl = `${window.location.origin}/unirse?code=${code}`

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

  function handleWhatsApp() {
    const text = t('lobby.whatsappText', { code, url: joinUrl })
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  return (
    <div className={styles.container}>
      <p className={styles.label}>{t('lobby.shareCode')}</p>
      <div className={styles.codeBox}>
        <span className={styles.code}>{code}</span>
      </div>

      <div className={styles.btnRow}>
        <button
          type="button"
          className={`btn btn-secondary ${styles.copyBtn}`}
          onClick={handleCopy}
        >
          {copied ? t('lobby.codeCopied') : t('lobby.copyCode')}
        </button>

        <button
          type="button"
          className={`btn ${styles.waBtn}`}
          onClick={handleWhatsApp}
          aria-label="WhatsApp"
        >
          <span aria-hidden="true">📲</span> WhatsApp
        </button>

        <button
          type="button"
          className={`btn ${styles.qrBtn}`}
          onClick={() => setShowQR(v => !v)}
          aria-expanded={showQR}
        >
          {showQR ? t('lobby.hideQR') : t('lobby.showQR')}
        </button>
      </div>

      {showQR && (
        <div className={styles.qrWrap}>
          <div className={styles.qrBox}>
            <QRCodeSVG
              value={joinUrl}
              size={180}
              bgColor="#ffffff"
              fgColor="#0d1117"
              level="M"
            />
          </div>
          <p className={styles.qrHint}>{t('lobby.qrHint')}</p>
        </div>
      )}
    </div>
  )
}
