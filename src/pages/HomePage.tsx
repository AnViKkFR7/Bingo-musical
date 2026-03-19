import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Layout } from '../components/ui/Layout'
import { AdSlot } from '../components/ads/AdSlot'
import styles from './HomePage.module.css'

const SLOT_HOME_BANNER = import.meta.env.VITE_ADSENSE_SLOT_HOME_BANNER as string

export function HomePage() {
  const { t } = useTranslation()

  return (
    <Layout hideHeader>
      <div className={styles.hero}>
        <img src="/musibingo-logo.png" alt="MusiBingo" className={styles.logo} />

        <div className={styles.actions}>
          <Link to="/crear" className={`btn btn-primary ${styles.ctaBtn}`}>
            {t('home.createGame')}
          </Link>
          <Link to="/unirse" className={`btn btn-secondary ${styles.ctaBtn}`}>
            {t('home.joinGame')}
          </Link>
        </div>
      </div>

      <AdSlot
        slotId={SLOT_HOME_BANNER}
        format="horizontal"
        className={styles.adBanner}
      />
    </Layout>
  )
}
