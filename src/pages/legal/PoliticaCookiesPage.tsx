import { useTranslation } from 'react-i18next'
import { Layout } from '../../components/ui/Layout'
import styles from './LegalPage.module.css'

const LAST_UPDATED = '19/03/2026'

export function PoliticaCookiesPage() {
  const { t } = useTranslation()
  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.badge}>🍪 Cookies</div>
          <h1 className={styles.title}>{t('legal.cookiesTitle')}</h1>
          <p className={styles.subtitle}>{t('legal.lastUpdated')} {LAST_UPDATED}</p>
        </div>

        <div className={styles.content}>

          {/* 1. ¿Qué son las cookies? */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>❓</span> ¿Qué son las cookies?</h2>
            <div className={styles.sectionText}>
              <p>
                Las <strong>cookies</strong> son pequeños ficheros de texto que un sitio web
                envía al navegador del usuario y que se almacenan en su dispositivo. Permiten
                que el sitio web recuerde información sobre tu visita, como el idioma preferido
                y otras opciones, facilitando la experiencia en futuras visitas.
              </p>
              <p>
                Según su origen, las cookies pueden ser <strong>propias</strong> (establecidas
                por el dominio del propio Sitio Web) o de <strong>terceros</strong> (establecidas
                por dominios externos). Según su duración, pueden ser de <strong>sesión</strong>{' '}
                (se eliminan al cerrar el navegador) o <strong>persistentes</strong> (permanecen
                en el dispositivo durante el período indicado).
              </p>
            </div>
          </section>

          {/* 2. Cookies que usamos */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>📋</span> Cookies que utilizamos</h2>
            <div className={styles.sectionText}>

              {/* Esenciales */}
              <div className={styles.cookieCategory}>
                <h3 className={styles.cookieCategoryTitle}>
                  <span className={styles.tagEssential}>Esenciales</span>
                  {' '}— Necesarias para el funcionamiento
                </h3>
                <p>
                  Estas cookies son imprescindibles para que el Sitio Web funcione
                  correctamente. No se pueden rechazar sin afectar a la funcionalidad básica.
                </p>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Proveedor</th>
                        <th>Finalidad</th>
                        <th>Duración</th>
                        <th>Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>musibingo_cookie_consent</code></td>
                        <td>MusiBingo (propia)</td>
                        <td>Almacena la elección del usuario sobre las cookies (aceptar todas, solo esenciales o rechazar).</td>
                        <td>12 meses</td>
                        <td>localStorage · persistente</td>
                      </tr>
                      <tr>
                        <td><code>sb-[ref]-auth-token</code></td>
                        <td>Supabase (propia)</td>
                        <td>Mantiene la sesión del usuario autenticado en la plataforma de juego.</td>
                        <td>Sesión</td>
                        <td>localStorage · sesión</td>
                      </tr>
                      <tr>
                        <td><code>sb-[ref]-auth-token-code-verifier</code></td>
                        <td>Supabase (propia)</td>
                        <td>Verifica el flujo de autenticación PKCE.</td>
                        <td>Sesión</td>
                        <td>localStorage · sesión</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Analíticas */}
              <div className={styles.cookieCategory}>
                <h3 className={styles.cookieCategoryTitle}>
                  <span className={styles.tagAnalytics}>Analíticas</span>
                  {' '}— Rendimiento y estadísticas
                </h3>
                <p>
                  Estas cookies recopilan información anónima sobre cómo los usuarios
                  navegan por el Sitio Web. Nos ayudan a mejorar el rendimiento. Solo se
                  activan si el usuario ha aceptado cookies analíticas.
                </p>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Proveedor</th>
                        <th>Finalidad</th>
                        <th>Duración</th>
                        <th>Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>va_*</code></td>
                        <td>Vercel Analytics</td>
                        <td>Métricas de rendimiento web anónimas (Core Web Vitals) gestionadas por Vercel.</td>
                        <td>Sesión</td>
                        <td>Cookie de sesión · tercero</td>
                      </tr>
                      <tr>
                        <td><code>_ga</code></td>
                        <td>Google Analytics (Google LLC)</td>
                        <td>Distingue a los usuarios únicos y genera estadísticas de uso del Sitio Web.</td>
                        <td>2 años</td>
                        <td>Persistente · tercero</td>
                      </tr>
                      <tr>
                        <td><code>_gid</code></td>
                        <td>Google Analytics (Google LLC)</td>
                        <td>Distingue a los usuarios. Datos enviados a Google.</td>
                        <td>24 horas</td>
                        <td>Persistente · tercero</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Publicidad */}
              <div className={styles.cookieCategory}>
                <h3 className={styles.cookieCategoryTitle}>
                  <span className={styles.tagAds}>Publicidad</span>
                  {' '}— Anuncios personalizados
                </h3>
                <p>
                  El Sitio Web puede mostrar anuncios a través de <strong>Google AdSense</strong>.
                  Estas cookies permiten a Google mostrar anuncios relevantes basándose en
                  visitas anteriores al Sitio Web y a otros sitios de Internet. Solo se
                  activan si el usuario ha aceptado todas las cookies.
                </p>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Proveedor</th>
                        <th>Finalidad</th>
                        <th>Duración</th>
                        <th>Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>IDE</code></td>
                        <td>Google (DoubleClick)</td>
                        <td>Registro e informe de las acciones del usuario en el sitio web para la personalización de publicidad.</td>
                        <td>390 días</td>
                        <td>Persistente · tercero</td>
                      </tr>
                      <tr>
                        <td><code>test_cookie</code></td>
                        <td>Google (DoubleClick)</td>
                        <td>Verifica que el navegador del usuario admite cookies.</td>
                        <td>Sesión</td>
                        <td>Sesión · tercero</td>
                      </tr>
                      <tr>
                        <td><code>NID</code></td>
                        <td>Google LLC</td>
                        <td>Registra una ID única que identifica el dispositivo del usuario para publicidad personalizada.</td>
                        <td>6 meses</td>
                        <td>Persistente · tercero</td>
                      </tr>
                      <tr>
                        <td><code>DSID</code></td>
                        <td>Google LLC</td>
                        <td>Identifica a un usuario con sesión iniciada en servicios Google y permite suprimir ciertos anuncios.</td>
                        <td>2 semanas</td>
                        <td>Persistente · tercero</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Servicios de terceros vía servidor */}
              <div className={styles.cookieCategory}>
                <h3 className={styles.cookieCategoryTitle}>
                  Servicios de terceros accedidos desde servidor
                </h3>
                <p>
                  Los siguientes servicios son consultados exclusivamente a través de funciones
                  serverless (Supabase Edge Functions) y <strong>no establecen cookies ni
                  almacenan información en el dispositivo del usuario</strong>:
                </p>
                <ul>
                  <li>
                    <strong>Deezer</strong> (deezer.com) — Proporciona las previsualizaciones
                    musicales de 30 segundos.{' '}
                    <a href="https://www.deezer.com/legal/privacy" target="_blank" rel="noopener noreferrer">
                      Política de privacidad de Deezer
                    </a>.
                  </li>
                  <li>
                    <strong>Spotify</strong> (spotify.com) — Búsqueda de canciones y metadatos.{' '}
                    <a href="https://www.spotify.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">
                      Política de privacidad de Spotify
                    </a>.
                  </li>
                </ul>
              </div>

            </div>
          </section>

          {/* 3. Gestión de cookies */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>⚙️</span> Gestión y revocación del consentimiento</h2>
            <div className={styles.sectionText}>
              <p>
                Puedes modificar tu preferencia en cualquier momento eliminando la clave{' '}
                <code>musibingo_cookie_consent</code> del <em>localStorage</em> de tu
                navegador. Al recargar la página, apparecerá de nuevo el panel de cookies para
                que elijas tus preferencias.
              </p>
              <p>
                Asimismo, puedes gestionar o eliminar las cookies de terceros directamente
                desde la configuración de tu navegador:
              </p>
              <ul>
                <li>
                  <strong>Chrome:</strong> Ajustes → Privacidad y seguridad → Cookies y otros
                  datos de sitios.
                </li>
                <li>
                  <strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies y
                  datos del sitio.
                </li>
                <li>
                  <strong>Safari:</strong> Preferencias → Privacidad → Gestionar datos del
                  sitio web.
                </li>
                <li>
                  <strong>Edge:</strong> Configuración → Cookies y permisos del sitio.
                </li>
              </ul>
              <p>
                También puedes optar por no participar en la publicidad personalizada de Google
                visitando{' '}
                <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
                  adssettings.google.com
                </a>{' '}
                o a través de la plataforma{' '}
                <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer">
                  Your Online Choices
                </a>.
              </p>
            </div>
          </section>

          {/* 4. Actualizaciones */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>🔄</span> Actualizaciones</h2>
            <div className={styles.sectionText}>
              <p>
                Esta Política de Cookies puede actualizarse para reflejar cambios en los
                servicios utilizados o en la normativa aplicable. Se recomienda revisarla
                periódicamente. La fecha de última actualización se indica al inicio del
                documento.
              </p>
              <p>
                Para cualquier consulta, puedes contactar en:{' '}
                <span className={styles.placeholder}>[info@moiraordo.es]</span>.
              </p>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  )
}
