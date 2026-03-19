import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Layout } from '../components/ui/Layout'
import { PrintStepIndicator } from '../components/print/PrintStepIndicator'
import { PrintStep1Playlist } from '../components/print/PrintStep1Playlist'
import { PrintStep2Config } from '../components/print/PrintStep2Config'
import { PrintStep3Design } from '../components/print/PrintStep3Design'
import { PrintStep4Payment } from '../components/print/PrintStep4Payment'
import { PrintStep5Download } from '../components/print/PrintStep5Download'
import type { DesignId } from '../components/print/PrintableBingoCard'
import type { PrintableBoard } from '../lib/printBoards'
import type { SpotifyPlaylistTracksResponse } from '../types'
import styles from './PrintPage.module.css'

interface PrintWizardState {
  step: 1 | 2 | 3 | 4 | 5
  playlist: SpotifyPlaylistTracksResponse | null
  boardSize: 3 | 4 | 5
  numPlayers: number
  numGames: number
  designId: DesignId
  customTitle: string
  paymentDone: boolean
  generatedBoards: PrintableBoard[][]
  deliveryEmail: string
}

const INITIAL_STATE: PrintWizardState = {
  step: 1,
  playlist: null,
  boardSize: 3,
  numPlayers: 5,
  numGames: 1,
  designId: 'festivo',
  customTitle: '',
  paymentDone: false,
  generatedBoards: [],
  deliveryEmail: '',
}

export function PrintPage() {
  const { t } = useTranslation()
  const [state, setState] = useState<PrintWizardState>(INITIAL_STATE)
  const [showScrollTop, setShowScrollTop] = useState(false)

  function update(partial: Partial<PrintWizardState>) {
    setState(s => ({ ...s, ...partial }))
  }

  // Scroll to top whenever the step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [state.step])

  // Show/hide floating scroll-to-top button
  useEffect(() => {
    function onScroll() {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const stepTitles: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: t('print.step1Title'),
    2: t('print.step2Title'),
    3: t('print.step3Title'),
    4: t('print.step4Title'),
    5: t('print.step5Title'),
  }

  return (
    <Layout>
      <div className={styles.page}>
        {/* Page header */}
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{t('print.pageTitle')}</h1>
          <p className={styles.pageSubtitle}>{t('print.pageSubtitle')}</p>
        </header>

        {/* Step indicator */}
        <PrintStepIndicator step={state.step} />

        {/* Step heading */}
        <h2 className={styles.stepHeading}>{stepTitles[state.step]}</h2>

        {/* Step content */}
        <div className={styles.stepContent}>
          {state.step === 1 && (
            <PrintStep1Playlist
              boardSize={state.boardSize}
              playlist={state.playlist}
              onNext={playlist => update({ playlist, step: 2 })}
            />
          )}

          {state.step === 2 && state.playlist && (
            <PrintStep2Config
              playlist={state.playlist}
              boardSize={state.boardSize}
              numPlayers={state.numPlayers}
              numGames={state.numGames}
              onNext={({ boardSize, numPlayers, numGames }) =>
                update({ boardSize, numPlayers, numGames, step: 3 })}
              onBack={() => update({ step: 1 })}
            />
          )}

          {state.step === 3 && state.playlist && (
            <PrintStep3Design
              playlist={state.playlist}
              boardSize={state.boardSize}
              designId={state.designId}
              customTitle={state.customTitle}
              onNext={(designId, customTitle) => update({ designId, customTitle, step: 4 })}
              onBack={() => update({ step: 2 })}
            />
          )}

          {state.step === 4 && state.playlist && (
            <PrintStep4Payment
              playlist={state.playlist}
              boardSize={state.boardSize}
              numPlayers={state.numPlayers}
              numGames={state.numGames}
              designId={state.designId}
              customTitle={state.customTitle}
              onNext={boards =>
                update({ generatedBoards: boards, paymentDone: true, step: 5 })}
              onBack={() => update({ step: 3 })}
            />
          )}

          {state.step === 5 && state.paymentDone && (
            <PrintStep5Download
              boards={state.generatedBoards}
              boardSize={state.boardSize}
              designId={state.designId}
              customTitle={state.customTitle}
            />
          )}
        </div>
      </div>

      {/* Floating scroll-to-top button */}
      {showScrollTop && (
        <button
          type="button"
          className={styles.scrollToTop}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t('common.scrollToTop')}
          title={t('common.scrollToTop')}
        >
          ↑
        </button>
      )}
    </Layout>
  )
}
