import { Link } from 'react-router-dom'
import { LanguageSelector } from './LanguageSelector'
import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="MusiBingo">
          <img src="/musibingo-logo.png" alt="MusiBingo" className={styles.logoImg} />
        </Link>
        <nav className={styles.nav}>
          <LanguageSelector />
        </nav>
      </div>
    </header>
  )
}
