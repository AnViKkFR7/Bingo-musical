import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n/index'
import './index.css'
import { App } from './App'
import { useGameStore } from './store/gameStore'

// Recuperar sesión guardada (si el usuario recargó la página)
useGameStore.getState().initFromSession()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
