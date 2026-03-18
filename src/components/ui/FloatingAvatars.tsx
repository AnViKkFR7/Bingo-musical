import styles from './FloatingAvatars.module.css'

interface FloaterConfig {
  src: string
  top: string
  left?: string
  right?: string
  delay: string
  duration: string
  size: string
}

const FLOATERS: FloaterConfig[] = [
  { src: 'Adobe%20Express%20-%20file.png',              top: '7%',  left: '2%',  delay: '0s',   duration: '6s',   size: '64px' },
  { src: 'Adobe%20Express%20-%20file%20-%20copia%20(3).png', top: '12%', right: '3%', delay: '1s',   duration: '7.5s', size: '56px' },
  { src: 'Adobe%20Express%20-%20file%20-%20copia%20(6).png', top: '40%', left: '1%',  delay: '2s',   duration: '8s',   size: '60px' },
  { src: 'Adobe%20Express%20-%20file%20-%20copia%20(9).png', top: '55%', right: '2%', delay: '0.5s', duration: '6.5s', size: '52px' },
  { src: 'Adobe%20Express%20-%20file%20-%20copia.png',       top: '72%', left: '4%',  delay: '1.5s', duration: '7s',   size: '58px' },
  { src: 'Adobe%20Express%20-%20file%20-%20copia%20(4).png', top: '82%', right: '5%', delay: '3s',   duration: '6s',   size: '54px' },
  { src: 'Adobe%20Express%20-%20file%20-%20copia%20(7).png', top: '28%', left: '1%',  delay: '2.5s', duration: '9s',   size: '50px' },
  { src: 'Adobe%20Express%20-%20file%20-%20copia%20(11).png',top: '88%', right: '2%', delay: '4s',   duration: '7s',   size: '48px' },
]

export function FloatingAvatars() {
  return (
    <div className={styles.container} aria-hidden="true">
      {FLOATERS.map((f, i) => (
        <img
          key={i}
          src={`/avatares/${f.src}`}
          className={styles.avatar}
          style={{
            top: f.top,
            left: f.left,
            right: f.right,
            width: f.size,
            height: f.size,
            animationDelay: f.delay,
            animationDuration: f.duration,
          }}
          alt=""
        />
      ))}
    </div>
  )
}
