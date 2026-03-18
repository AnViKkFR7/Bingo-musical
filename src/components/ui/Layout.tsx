import type { ReactNode } from 'react'
import { Header } from './Header'
import { FloatingAvatars } from './FloatingAvatars'
import styles from './Layout.module.css'

interface LayoutProps {
    children: ReactNode
    /** Si true, oculta el header (pantalla de juego a pantalla completa) */
    hideHeader?: boolean
    /** Si true, oculta los avatares flotantes */
    hideAvatars?: boolean
}

export function Layout({ children, hideHeader = false, hideAvatars = false }: LayoutProps) {
    return (
        <div className={styles.root}>
            {!hideAvatars && <FloatingAvatars />}
            {!hideHeader && <Header />}
            <main className={styles.main}>
                {children}
            </main>
            <footer className={styles.footer}>
                <p>MusiBingo © {new Date().getFullYear()} - Developed by <strong><a href="https://moiraordo.es/" target="_blank" rel="noopener noreferrer">MoiraOrdo</a></strong></p>
            </footer>
        </div>
    )
}
