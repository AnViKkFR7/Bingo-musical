import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { HomePage } from './pages/HomePage'
import { CreateGamePage } from './pages/CreateGamePage'
import { JoinGamePage } from './pages/JoinGamePage'
import { LobbyPage } from './pages/LobbyPage'
import { GamePage } from './pages/GamePage'
import { ResultsPage } from './pages/ResultsPage'
import { PrintPage } from './pages/PrintPage'
import { SobreNosotrosPage } from './pages/SobreNosotrosPage'
import { AvisoLegalPage } from './pages/legal/AvisoLegalPage'
import { PoliticaPrivacidadPage } from './pages/legal/PoliticaPrivacidadPage'
import { PoliticaCookiesPage } from './pages/legal/PoliticaCookiesPage'

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
      <div className="spinner" />
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/crear" element={<CreateGamePage />} />
          <Route path="/unirse" element={<JoinGamePage />} />
          <Route path="/sala/:gameCode" element={<LobbyPage />} />
          <Route path="/jugar/:gameCode" element={<GamePage />} />
          <Route path="/resultados/:gameCode" element={<ResultsPage />} />
          <Route path="/imprimir" element={<PrintPage />} />
          <Route path="/sobre-nosotros" element={<SobreNosotrosPage />} />
          <Route path="/aviso-legal" element={<AvisoLegalPage />} />
          <Route path="/politica-privacidad" element={<PoliticaPrivacidadPage />} />
          <Route path="/politica-cookies" element={<PoliticaCookiesPage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
