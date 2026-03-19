import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout } from '../components/ui/Layout'
import styles from './SobreNosotrosPage.module.css'

const FEATURES = [
  { icon: '🎵', tKey: 'f1' },
  { icon: '👥', tKey: 'f2' },
  { icon: '🎲', tKey: 'f3' },
  { icon: '🎧', tKey: 'f4' },
]

const HOW_TO = [
  { step: '01', icon: '🎼', tKey: 'h1' },
  { step: '02', icon: '📲', tKey: 'h2' },
  { step: '03', icon: '🏆', tKey: 'h3' },
]

const DONATE_ITEMS = [
  { icon: '🚀', tKey: 'd1' },
  { icon: '🎮', tKey: 'd2' },
  { icon: '⚡', tKey: 'd3' },
  { icon: '🧑‍💻', tKey: 'd4' },
]

const TECH = [
  { name: 'React', color: '#61dafb' },
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'Vite', color: '#bd34fe' },
  { name: 'Supabase', color: '#3ecf8e' },
  { name: 'Vercel', color: '#fffcf2' },
  { name: 'Deezer API', color: '#a238ff' },
  { name: 'Spotify API', color: '#1db954' },
]

export function SobreNosotrosPage() {
  const { t } = useTranslation()
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const el = document.querySelector(hash)
    if (el) {
      // Small delay to let the page finish rendering before scrolling
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }
  }, [hash])

  return (
    <Layout>
      <div className={styles.page}>

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <img
            src="/musibingo-logo.png"
            alt="MusiBingo"
            className={styles.heroLogo}
          />
          <h1 className={styles.heroTitle}>
            {t('about.heroTitle')}
            <br />
            <span className={styles.gradientText}>{t('about.heroTitleSpan')}</span>
          </h1>
          <p className={styles.heroSubtitle}>{t('about.heroSubtitle')}</p>
          <Link to="/" className={`btn btn-primary ${styles.heroBtn}`}>
            {t('about.playNow')}
          </Link>
        </section>

        {/* ── Qué es MusiBingo ──────────────────────────────────── */}
        <section className={styles.aboutSection}>
          <div className={styles.sectionLabel}>{t('about.projectLabel')}</div>
          <h2 className={styles.sectionTitle}>{t('about.projectTitle')}</h2>
          <div className={styles.aboutCard}>
            <div className={styles.aboutText}>
              <p dangerouslySetInnerHTML={{ __html: t('about.projectP1') }} />
              <p dangerouslySetInnerHTML={{ __html: t('about.projectP2') }} />
            </div>
            <div className={styles.aboutEmojis} aria-hidden="true">
              <span>🎶</span>
              <span>🎲</span>
              <span>🏆</span>
            </div>
          </div>
        </section>

        {/* ── Características ───────────────────────────────────── */}
        <section className={styles.featuresSection}>
          <div className={styles.sectionLabel}>{t('about.featuresLabel')}</div>
          <h2 className={styles.sectionTitle}>{t('about.featuresTitle')}</h2>
          <div className={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{t(`about.${f.tKey}Title`)}</h3>
                <p className={styles.featureDesc}>{t(`about.${f.tKey}Desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Cómo se juega ─────────────────────────────────────── */}
        <section className={styles.howSection}>
          <div className={styles.sectionLabel}>{t('about.howLabel')}</div>
          <h2 className={styles.sectionTitle}>{t('about.howTitle')}</h2>
          <div className={styles.howGrid}>
            {HOW_TO.map((step, i) => (
              <div key={i} className={styles.howCard}>
                <div className={styles.howStep}>{step.step}</div>
                <div className={styles.howIcon}>{step.icon}</div>
                <h3 className={styles.howTitle}>{t(`about.${step.tKey}Title`)}</h3>
                <p className={styles.howDesc}>{t(`about.${step.tKey}Desc`)}</p>
                {i < HOW_TO.length - 1 && (
                  <div className={styles.howArrow} aria-hidden="true">→</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── MoiraOrdo ─────────────────────────────────────────── */}
        <section className={styles.moiraSection}>
          <div className={styles.moiraCard}>
            <div className={styles.moiraGradientBorder} aria-hidden="true" />
            <div className={styles.moiraContent}>
              <div className={styles.moiraLabel}>{t('about.moiraLabel')}</div>
              <a
                href="https://moiraordo.es/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.moiraName}
              >
                MoiraOrdo<span className={styles.moiraDot}>.</span>
              </a>
              <p className={styles.moiraDesc}>{t('about.moiraDesc1')}</p>
              <p className={styles.moiraDesc}>{t('about.moiraDesc2')}</p>
              <a
                href="https://moiraordo.es/"
                target="_blank"
                rel="noopener noreferrer"
                className={`btn btn-primary ${styles.moiraBtn}`}
              >
                {t('about.visitMoira')}
              </a>
            </div>
          </div>
        </section>

        {/* ── Tech Stack ────────────────────────────────────────── */}
        <section className={styles.techSection}>
          <div className={styles.sectionLabel}>{t('about.techLabel')}</div>
          <h2 className={styles.sectionTitle}>{t('about.techTitle')}</h2>
          <div className={styles.techPills}>
            {TECH.map((tech, i) => (
              <span
                key={i}
                className={styles.techPill}
                style={{ '--pill-color': tech.color } as React.CSSProperties}
              >
                {tech.name}
              </span>
            ))}
          </div>
        </section>

        {/* ── CTA final ─────────────────────────────────────────── */}
        <section className={styles.ctaSection}>
          <h2 className={styles.ctaTitle}>{t('about.ctaTitle')}</h2>
          <p className={styles.ctaSubtitle}>{t('about.ctaSubtitle')}</p>
          <div className={styles.ctaBtns}>
            <Link to="/crear" className={`btn btn-primary ${styles.ctaBtn}`}>
              {t('about.createGame')}
            </Link>
            <Link to="/unirse" className={`btn btn-secondary ${styles.ctaBtn}`}>
              {t('about.joinGame')}
            </Link>
          </div>
        </section>

        {/* ── Donations ─────────────────────────────────────────── */}
        <section id="donar" className={styles.donateSection}>
          <div className={styles.sectionLabel}>{t('donate.label')}</div>
          <div className={styles.donateCard}>
            <div className={styles.donateGlow} aria-hidden="true" />
            <div className={styles.donateInner}>
              <h2 className={styles.donateTitle}>{t('donate.title')}</h2>
              <p className={styles.donateText}>{t('donate.p1')}</p>
              <p className={styles.donateText}>{t('donate.p2')}</p>

              <h3 className={styles.donateSubtitle}>{t('donate.destinationTitle')}</h3>
              <p className={styles.donateLeadin}>{t('donate.destinationLeadin')}</p>
              <div className={styles.donateGrid}>
                {DONATE_ITEMS.map((item) => (
                  <div key={item.tKey} className={styles.donateItem}>
                    <div className={styles.featureIcon}>{item.icon}</div>
                    <p className={styles.donateItemTitle}>{t(`donate.${item.tKey}Title`)}</p>
                    <p className={styles.donateItemDesc}>{t(`donate.${item.tKey}Desc`)}</p>
                  </div>
                ))}
              </div>

              <div className={styles.donateQuote}>
                <p className={styles.donateQuoteTitle}>{t('donate.ctaTitle')}</p>
                <p className={styles.donateQuoteText}>{t('donate.ctaP1')}</p>
                <p className={styles.donateQuoteText}>{t('donate.ctaP2')}</p>
              </div>

              <p className={styles.donateThanks}>{t('donate.thanks')}</p>

              <div className={styles.donateActions}>
                <div className={styles.donatePaypal}>
                  <div className={styles.donateQRBox}>
                    <img
                      src="/qrcode.png"
                      alt="PayPal QR"
                      className={styles.donateQRImg}
                    />
                  </div>
                  <span className={styles.donateQRLabel}>{t('donate.paypalLabel')}</span>
                </div>

                <div className={styles.donateGofundme}>
                  <span className={styles.donateGofundmeEmoji} aria-hidden="true">💚</span>
                  <a
                    href="https://gofund.me/f532b1685"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.donateGofundmeBtn}
                  >
                    {t('donate.gofundmeBtn')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  )
}
