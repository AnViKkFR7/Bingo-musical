import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'
import { loadSession } from '../lib/utils'
import type { Player } from '../types'

/**
 * Carga los jugadores de la partida con polling cada segundo + Realtime como respaldo.
 * El polling garantiza que la lista se actualice aunque Realtime falle.
 */
export function usePlayers(gameId: string | undefined) {
  const { setPlayers, addPlayer, removePlayer, setCurrentPlayer } = useGameStore()

  // Polling cada segundo (carga inicial + refresco continuo)
  useEffect(() => {
    if (!gameId) return

    let cancelled = false

    async function fetchPlayers() {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId)
        .order('joined_at', { ascending: true })

      if (cancelled || error || !data) return
      setPlayers(data as Player[])

      // Sincronizar currentPlayer con los datos reales del servidor
      const session = loadSession()
      if (session) {
        const me = (data as Player[]).find(p => p.id === session.player_id)
        if (me) setCurrentPlayer(me)
      }
    }

    fetchPlayers()
    const interval = setInterval(fetchPlayers, 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [gameId, setPlayers, setCurrentPlayer])

  // Suscripción Realtime
  useEffect(() => {
    if (!gameId) return

    const channel = supabase
      .channel(`players:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          addPlayer(payload.new as Player)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          removePlayer((payload.old as { id: string }).id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, addPlayer, removePlayer])
}
