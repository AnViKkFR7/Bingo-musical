import { useTranslation } from 'react-i18next'
import { Layout } from '../../components/ui/Layout'
import styles from './LegalPage.module.css'

const LAST_UPDATED = '[FECHA DE ÚLTIMA ACTUALIZACIÓN]'

export function PoliticaPrivacidadPage() {
  const { t } = useTranslation()
  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.badge}>🔒 Privacidad</div>
          <h1 className={styles.title}>{t('legal.privacidadTitle')}</h1>
          <p className={styles.subtitle}>{t('legal.lastUpdated')} {LAST_UPDATED}</p>
        </div>

        <div className={styles.content}>

          {/* 1. Responsable */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>👤</span> Responsable del tratamiento</h2>
            <div className={styles.sectionText}>
              <p>
                De conformidad con el Reglamento (UE) 2016/679 General de Protección de Datos
                (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía
                de los derechos digitales (LOPDGDD), se informa que el responsable del
                tratamiento de los datos personales recabados a través de este sitio web es:
              </p>
              <p>
                <strong>Responsable:</strong>{' '}
                <span className={styles.placeholder}>[Moira Ordo]</span>
              </p>
              <p>
                <strong>NIF/CIF:</strong>{' '}
                <span className={styles.placeholder}>[53321515V]</span>
              </p>
              <p>
                <strong>Dirección:</strong>{' '}
                <span className={styles.placeholder}>[Av Somella, Vilanova i la Geltrú, Barcelona, España]</span>
              </p>
              <p>
                <strong>Email de contacto:</strong>{' '}
                <span className={styles.placeholder}>[info@moiraordo.es]</span>
              </p>
            </div>
          </section>

          {/* 2. Datos que recogemos */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>📊</span> Datos que recopilamos</h2>
            <div className={styles.sectionText}>
              <p>
                MusiBingo está diseñado para preservar al máximo la privacidad del usuario.
                Los datos que tratamos son mínimos y necesarios para la prestación del servicio:
              </p>
              <ul>
                <li>
                  <strong>Nombre de jugador (nickname):</strong> el alias o nombre que el
                  usuario introduce de forma voluntaria al unirse a una partida. No se solicita
                  ni almacena nombre real, correo electrónico, teléfono ni ningún otro dato
                  identificativo personal.
                </li>
                <li>
                  <strong>Código de partida:</strong> identificador alfanumérico generado
                  automáticamente para cada sesión de juego, sin vinculación a la identidad del
                  usuario.
                </li>
                <li>
                  <strong>Datos técnicos de conexión:</strong> dirección IP y datos de sesión
                  gestionados automáticamente por nuestra infraestructura (Supabase y Vercel)
                  con fines técnicos y de seguridad.
                </li>
                <li>
                  <strong>Preferencias de cookies:</strong> elección del usuario respecto a las
                  cookies, almacenada localmente en su dispositivo (localStorage).
                </li>
              </ul>
              <p>
                No se recogen datos especialmente protegidos (datos de salud, ideología,
                religión, origen racial, etc.).
              </p>
            </div>
          </section>

          {/* 3. Finalidades y base jurídica */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>🎯</span> Finalidades y base jurídica</h2>
            <div className={styles.sectionText}>
              <p>Los datos se tratan para las siguientes finalidades:</p>
              <ul>
                <li>
                  <strong>Prestación del servicio de juego:</strong> gestionar la partida,
                  mostrar el nombre del jugador al resto de participantes y registrar el
                  progreso del cartón. <em>Base jurídica: ejecución de un contrato (art. 6.1.b
                  RGPD).</em>
                </li>
                <li>
                  <strong>Seguridad y prevención del abuso:</strong> detectar y bloquear accesos
                  no autorizados o uso fraudulento de la plataforma. <em>Base jurídica:
                  interés legítimo (art. 6.1.f RGPD).</em>
                </li>
                <li>
                  <strong>Análisis del rendimiento técnico de la web:</strong> estadísticas
                  anónimas de uso para mejora del servicio (solo si el usuario acepta cookies
                  analíticas). <em>Base jurídica: consentimiento (art. 6.1.a RGPD).</em>
                </li>
                <li>
                  <strong>Publicidad:</strong> mostrar anuncios a través de Google AdSense
                  (solo si el usuario acepta cookies de publicidad). <em>Base jurídica:
                  consentimiento (art. 6.1.a RGPD).</em>
                </li>
              </ul>
            </div>
          </section>

          {/* 4. Destinatarios y transferencias */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>🌐</span> Destinatarios y transferencias internacionales</h2>
            <div className={styles.sectionText}>
              <p>
                Los datos pueden ser comunicados a los siguientes encargados del tratamiento
                para prestar el servicio:
              </p>
              <ul>
                <li>
                  <strong>Supabase Inc.</strong> (EE. UU.) — Proveedor de base de datos,
                  autenticación y funciones en la nube. Datos almacenados en servidores de la
                  UE (Frankfurt) cuando está disponible. Política de privacidad:{' '}
                  <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                    supabase.com/privacy
                  </a>.
                </li>
                <li>
                  <strong>Vercel Inc.</strong> (EE. UU.) — Proveedor de alojamiento y
                  despliegue del Sitio Web. Política de privacidad:{' '}
                  <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
                    vercel.com/legal/privacy-policy
                  </a>.
                </li>
                <li>
                  <strong>Google LLC</strong> (EE. UU.) — Proveedor de publicidad contextual
                  (Google AdSense), solo si el usuario ha aceptado cookies publicitarias.
                  Política de privacidad:{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                    policies.google.com/privacy
                  </a>.
                </li>
              </ul>
              <p>
                Las transferencias a EE. UU. se realizan al amparo del Marco de Privacidad de
                Datos UE–EE. UU. (Data Privacy Framework) o mediante cláusulas contractuales
                tipo aprobadas por la Comisión Europea.
              </p>
              <p>
                Los servicios de <strong>Deezer</strong> (previsualizaciones musicales) y{' '}
                <strong>Spotify</strong> (búsqueda de canciones) son consultados únicamente a
                través de funciones serverless (Supabase Edge Functions), por lo que no
                reciben datos directos del usuario final.
              </p>
            </div>
          </section>

          {/* 5. Conservación */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>🗓️</span> Plazo de conservación</h2>
            <div className={styles.sectionText}>
              <p>
                Los datos de partida (nombre de jugador, código de partida, estado del cartón)
                se conservan durante el tiempo necesario para la prestación del servicio y,
                como máximo, <strong>30 días</strong> tras la finalización de la partida, salvo
                obligación legal de conservarlos por un período mayor.
              </p>
              <p>
                Los datos técnicos de conexión (registros de servidor) se conservan durante un
                máximo de <strong>12 meses</strong> con fines de seguridad y diagnóstico.
              </p>
              <p>
                Las preferencias de cookies se conservan en el dispositivo del usuario durante{' '}
                <strong>12 meses</strong> desde su elección.
              </p>
            </div>
          </section>

          {/* 6. Derechos */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>✅</span> Tus derechos</h2>
            <div className={styles.sectionText}>
              <p>
                En virtud de la normativa vigente, el usuario tiene reconocidos los siguientes
                derechos respecto a sus datos personales:
              </p>
              <div className={styles.rightsGrid}>
                <div className={styles.rightItem}><span className={styles.rightIcon}>👁️</span> Acceso</div>
                <div className={styles.rightItem}><span className={styles.rightIcon}>✏️</span> Rectificación</div>
                <div className={styles.rightItem}><span className={styles.rightIcon}>🗑️</span> Supresión («al olvido»)</div>
                <div className={styles.rightItem}><span className={styles.rightIcon}>⏸️</span> Limitación del tratamiento</div>
                <div className={styles.rightItem}><span className={styles.rightIcon}>📦</span> Portabilidad</div>
                <div className={styles.rightItem}><span className={styles.rightIcon}>🚫</span> Oposición</div>
              </div>
              <p style={{ marginTop: 'var(--space-5)' }}>
                Para ejercer cualquiera de estos derechos, el usuario puede dirigirse al
                Responsable mediante correo electrónico a{' '}
                <span className={styles.placeholder}>[info@moiraordo.es]</span>,
                indicando el derecho que desea ejercer y adjuntando copia de su documento de
                identidad. El Responsable contestará en el plazo máximo de un mes.
              </p>
              <p>
                Asimismo, el usuario tiene derecho a presentar una reclamación ante la{' '}
                <strong>Agencia Española de Protección de Datos</strong> (AEPD) si considera
                que el tratamiento de sus datos no es conforme a la normativa:{' '}
                <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
                  www.aepd.es
                </a>.
              </p>
            </div>
          </section>

          {/* 7. Delegado de protección */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>📬</span> Contacto y DPD</h2>
            <div className={styles.sectionText}>
              <p>
                Para cualquier consulta relacionada con el tratamiento de sus datos, puede
                ponerse en contacto en:{' '}
                <span className={styles.placeholder}>[info@moiraordo.es]</span>.
              </p>
            </div>
          </section>

          {/* 8. Menores */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>👶</span> Menores de edad</h2>
            <div className={styles.sectionText}>
              <p>
                El Sitio Web no está dirigido a menores de 14 años. El Titular no recoge
                intencionadamente datos de menores de esa edad. Si un menor hubiera
                proporcionado datos sin el consentimiento de sus progenitores o tutores, estos
                pueden solicitar su supresión a través del correo{' '}
                <span className={styles.placeholder}>[info@moiraordo.es]</span>.
              </p>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  )
}
