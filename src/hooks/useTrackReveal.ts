import { useEffect, useState, useRef } from 'react'
import type { GameTrack } from '../types'

const REVEAL_DELAY_MS = 10_000

/**
 * Devuelve `true` una vez que han pasado 10 segundos desde que el cliente
 * recibió la pista actual. El temporizador arranca en el cliente cuando
 * cambia el `track.id`, independientemente del `played_at` del servidor.
 */
export function useTrackReveal(track: GameTrack | null): boolean {
  const [revealed, setRevealed] = useState(false)
  const prevIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const trackId = track?.id

    // Misma canción: no reiniciar el temporizador
    if (trackId === prevIdRef.current) return
    prevIdRef.current = trackId

    setRevealed(false)

    if (!trackId) return

    const timer = setTimeout(() => setRevealed(true), REVEAL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [track?.id])

  return revealed
}
