import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'
import type { Game } from '../types'

/**
 * Carga la partida inicial por código y se suscribe a cambios en tiempo real.
 * Navega automáticamente cuando el status cambia a 'playing' o 'finished'.
 */
export function useGame(gameCode: string | undefined) {
  const {
    setGame,
    updateGame,
    setLoading,
    setError,
    game,
  } = useGameStore()
  const navigate = useNavigate()

  // Carga inicial
  useEffect(() => {
    if (!gameCode) return

    let cancelled = false

    async function fetchGame() {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('code', gameCode)
        .single()

      if (cancelled) return

      if (error || !data) {
        setError('errors.gameNotFound')
        setLoading(false)
        return
      }

      setGame(data as Game)
      setLoading(false)
    }

    fetchGame()
    return () => { cancelled = true }
  }, [gameCode, setGame, setLoading, setError])

  // Suscripción Realtime
  useEffect(() => {
    if (!game?.id) return

    const channel = supabase
      .channel(`game:${game.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${game.id}`,
        },
        (payload) => {
          const updated = payload.new as Game
          updateGame(updated)

          // Navegación automática por cambio de estado
          if (updated.status === 'playing') {
            navigate(`/jugar/${updated.code}`)
          } else if (updated.status === 'finished') {
            navigate(`/resultados/${updated.code}`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [game?.id, game?.code, updateGame, navigate])

  return { game }
}
