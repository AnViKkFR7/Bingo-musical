import { useTranslation } from 'react-i18next'
import { Layout } from '../../components/ui/Layout'
import styles from './LegalPage.module.css'

const LAST_UPDATED = '[FECHA DE ÚLTIMA ACTUALIZACIÓN]'

export function AvisoLegalPage() {
  const { t } = useTranslation()
  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.badge}>⚖️ Legal</div>
          <h1 className={styles.title}>{t('legal.avisoTitle')}</h1>
          <p className={styles.subtitle}>{t('legal.lastUpdated')} {LAST_UPDATED}</p>
        </div>

        <div className={styles.content}>

          {/* 1. Identificación del titular */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>🏢</span> Datos identificativos del titular</h2>
            <div className={styles.sectionText}>
              <p>
                En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de
                Servicios de la Sociedad de la Información y de Comercio Electrónico
                (LSSI-CE), se informa al usuario de los datos del titular de este sitio web:
              </p>
              <p>
                <strong>Titular:</strong>{' '}
                <span className={styles.placeholder}>[Moira Ordo]</span>
              </p>
              <p>
                <strong>NIF/CIF:</strong>{' '}
                <span className={styles.placeholder}>[53321515V]</span>
              </p>
              <p>
                <strong>Domicilio social:</strong>{' '}
                <span className={styles.placeholder}>[Av Somella, Vilanova i la Geltrú, Barcelona, España]</span>
              </p>
              <p>
                <strong>Correo electrónico de contacto:</strong>{' '}
                <span className={styles.placeholder}>[info@moiraordo.es]</span>
              </p>
              <p>
                <strong>Sitio web:</strong>{' '}
                <span className={styles.placeholder}>[www.moiraordo.es]</span>
              </p>
              <p>
                <strong>Actividad:</strong>{' '}
                Plataforma web de entretenimiento musical (bingo musical en tiempo real).
              </p>
            </div>
          </section>

          {/* 2. Objeto */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>📋</span> Objeto y ámbito de aplicación</h2>
            <div className={styles.sectionText}>
              <p>
                El presente Aviso Legal regula el acceso, navegación y uso del sitio web{' '}
                <span className={styles.placeholder}>[www.musibingo.com]</span> (en adelante, «el Sitio Web»),
                del que es titular{' '}
                <span className={styles.placeholder}>[Moira Ordo]</span> (en adelante, «el Titular»).
              </p>
              <p>
                El acceso al Sitio Web implica la aceptación plena y sin reservas de todas
                las disposiciones incluidas en este Aviso Legal. Si el usuario no estuviese
                de acuerdo con las condiciones aquí establecidas, deberá abandonar el Sitio Web.
              </p>
              <p>
                El Titular se reserva el derecho de modificar unilateralmente, en cualquier
                momento y sin previo aviso, la presentación, configuración y contenido del
                Sitio Web, así como las condiciones requeridas para su acceso y uso.
              </p>
            </div>
          </section>

          {/* 3. Propiedad intelectual */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>©</span> Propiedad intelectual e industrial</h2>
            <div className={styles.sectionText}>
              <p>
                Todos los contenidos del Sitio Web —incluyendo, de forma enunciativa pero no
                limitativa, textos, fotografías, gráficos, imágenes, iconos, tecnología,
                software, código fuente y demás contenidos audiovisuales o sonoros, así como
                su diseño gráfico y código fuente— son titularidad del Titular o de terceros
                que han autorizado su uso, y están protegidos por los derechos de propiedad
                intelectual e industrial.
              </p>
              <p>
                Los fragmentos musicales reproducidos en la plataforma se obtienen del
                servicio de previsualizaciones (30 segundos) de la API pública de{' '}
                <strong>Deezer</strong>, y los derechos de cada obra corresponden a sus
                respectivos titulares (artistas, discográficas).
              </p>
              <p>
                Queda expresamente prohibida la reproducción, distribución, comunicación
                pública, transformación o cualquier otra forma de explotación, parcial o
                total, de los contenidos del Sitio Web sin autorización previa y por escrito
                del Titular.
              </p>
            </div>
          </section>

          {/* 4. Condiciones de uso */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>📌</span> Condiciones de uso</h2>
            <div className={styles.sectionText}>
              <p>
                El usuario se compromete a hacer un uso adecuado de los contenidos y servicios
                ofrecidos y, en concreto, a no emplearlos para:
              </p>
              <ul>
                <li>Incurrir en actividades ilícitas, ilegales o contrarias a la buena fe y al orden público.</li>
                <li>Difundir contenidos o propaganda de carácter racista, xenófobo, pornográfico o que atenten contra los derechos humanos.</li>
                <li>Introducir o difundir en la red virus informáticos o cualquier otro sistema físico o lógico susceptible de provocar daños.</li>
                <li>Intentar acceder, utilizar o manipular los datos de otros usuarios, de terceros proveedores o del propio Titular.</li>
                <li>Utilizar el Sitio Web con fines distintos al entretenimiento personal.</li>
              </ul>
              <p>
                El Titular se reserva el derecho de retirar el acceso al Sitio Web a cualquier
                usuario que incumpla las presentes condiciones, sin previo aviso y sin que ello
                genere derecho a indemnización alguna.
              </p>
            </div>
          </section>

          {/* 5. Exclusión de garantías y responsabilidad */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>⚠️</span> Exclusión de garantías y responsabilidad</h2>
            <div className={styles.sectionText}>
              <p>
                El Titular no garantiza la disponibilidad y continuidad del funcionamiento
                del Sitio Web ni que sea útil para una actividad concreta. En la medida en que
                lo permita el ordenamiento jurídico, el Titular excluye cualquier
                responsabilidad por los daños y perjuicios de cualquier naturaleza que puedan
                deberse a la indisponibilidad o falta de continuidad del Sitio Web, a las
                deficiencias de conexión a Internet, o a la presencia de virus en los equipos
                informáticos de los usuarios.
              </p>
              <p>
                Los fragmentos musicales son servidos por la API de <strong>Deezer</strong>
                (servicio de tercero). El Titular no se responsabiliza de la disponibilidad,
                duración o contenido de dichos fragmentos.
              </p>
              <p>
                El Sitio Web puede contener enlaces a páginas de terceros. El Titular no
                asume responsabilidad alguna sobre dichos contenidos, ni garantiza su exactitud,
                actualidad, legalidad o calidad.
              </p>
            </div>
          </section>

          {/* 6. Legislación aplicable */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><span>🏛️</span> Legislación aplicable y jurisdicción</h2>
            <div className={styles.sectionText}>
              <p>
                Las relaciones entre el Titular y los usuarios del Sitio Web se rigen por la
                legislación española vigente, sin perjuicio de las normas de protección de datos
                aplicables. Cualquier controversia se someterá a los Juzgados y Tribunales
                competentes conforme a la normativa española, salvo que la ley establezca otro
                fuero de obligada observancia.
              </p>
              <p>
                Para cualquier consulta o reclamación, el usuario puede dirigirse al Titular
                mediante el correo electrónico{' '}
                <span className={styles.placeholder}>[info@moiraordo.es]</span>.
              </p>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  )
}
