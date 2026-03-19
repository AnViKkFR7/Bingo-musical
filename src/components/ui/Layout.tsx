import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Header } from './Header'
import { FloatingAvatars } from './FloatingAvatars'
import { CookieBanner } from './CookieBanner'
import styles from './Layout.module.css'

interface LayoutProps {
    children: ReactNode
    /** Si true, oculta el header (pantalla de juego a pantalla completa) */
    hideHeader?: boolean
    /** Si true, oculta los avatares flotantes */
    hideAvatars?: boolean
}

export function Layout({ children, hideHeader = false, hideAvatars = false }: LayoutProps) {
    const { t } = useTranslation()
    return (
        <div className={styles.root}>
            {!hideAvatars && <FloatingAvatars />}
            {!hideHeader && <Header />}
            <main className={styles.main}>
                {children}
            </main>
            <footer className={styles.footer}>
                <nav className={styles.footerLinks} aria-label="Legal">
                    <Link to="/sobre-nosotros" className={styles.footerLink}>{t('footer.about')}</Link>
                    <span className={styles.footerSep} aria-hidden="true">·</span>
                    <Link to="/aviso-legal" className={styles.footerLink}>{t('footer.legal')}</Link>
                    <span className={styles.footerSep} aria-hidden="true">·</span>
                    <Link to="/politica-privacidad" className={styles.footerLink}>{t('footer.privacy')}</Link>
                    <span className={styles.footerSep} aria-hidden="true">·</span>
                    <Link to="/politica-cookies" className={styles.footerLink}>{t('footer.cookies')}</Link>
                </nav>
                <p className={styles.footerCredits}>
                    MusiBingo © {new Date().getFullYear()} · {t('footer.madeBy')}{' '}
                    <a href="https://moiraordo.es/" target="_blank" rel="noopener noreferrer" className={styles.footerMoira}>MoiraOrdo</a>
                </p>
            </footer>
            <CookieBanner />
        </div>
    )
}
