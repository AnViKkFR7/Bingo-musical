import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'
import type { Player } from '../types'

/**
 * Carga los jugadores de la partida y se suscribe a cambios en tiempo real.
 * Usado en el lobby y en el panel del DJ.
 */
export function usePlayers(gameId: string | undefined) {
  const { setPlayers, addPlayer, removePlayer } = useGameStore()

  // Carga inicial
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
    }

    fetchPlayers()
    return () => { cancelled = true }
  }, [gameId, setPlayers])

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
