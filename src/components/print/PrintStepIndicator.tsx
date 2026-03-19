import { useTranslation } from 'react-i18next'
import styles from './PrintStepIndicator.module.css'

interface Props {
  step: 1 | 2 | 3 | 4 | 5
}

export function PrintStepIndicator({ step }: Props) {
  const { t } = useTranslation()

  const steps = [
    t('print.step1Title'),
    t('print.step2Title'),
    t('print.step3Title'),
    t('print.step4Title'),
    t('print.step5Title'),
  ]

  return (
    <nav className={styles.indicator} aria-label="Pasos del asistente">
      {steps.map((label, i) => {
        const num = i + 1
        const isActive = num === step
        const isDone = num < step

        return (
          <div
            key={num}
            className={`${styles.step} ${isActive ? styles.active : ''} ${isDone ? styles.done : ''}`}
            aria-current={isActive ? 'step' : undefined}
          >
            <div className={styles.circle}>
              {isDone ? '✓' : num}
            </div>
            <span className={styles.label}>{label}</span>
          </div>
        )
      })}
    </nav>
  )
}
