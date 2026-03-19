import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from './LanguageSelector'
import styles from './Header.module.css'

export function Header() {
  const { t } = useTranslation()

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="MusiBingo">
          <img src="/musibingo-logo.png" alt="MusiBingo" className={styles.logoImg} />
        </Link>
        <nav className={styles.nav}>
          <NavLink
            to="/imprimir"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            {t('print.navLabel')}
          </NavLink>
          <LanguageSelector />
        </nav>
      </div>
    </header>
  )
}
