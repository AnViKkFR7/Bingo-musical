import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'
import type { GameTrack } from '../types'

/**
 * Carga las game_tracks de la partida y se suscribe a cambios en tiempo real.
 * Detecta quando una canción pasa a played_at NOT NULL (reproducida).
 */
export function useGameTracks(gameId: string | undefined) {
  const { setGameTracks, addOrUpdateGameTrack } = useGameStore()

  // Carga inicial
  useEffect(() => {
    if (!gameId) return

    let cancelled = false

    async function fetchTracks() {
      const { data, error } = await supabase
        .from('game_tracks')
        .select('*')
        .eq('game_id', gameId)
        .order('play_order', { ascending: true })

      if (cancelled || error || !data) return
      setGameTracks(data as GameTrack[])
    }

    fetchTracks()
    return () => { cancelled = true }
  }, [gameId, setGameTracks])

  // Suscripción Realtime — solo actualizaciones (cuando se marca played_at)
  useEffect(() => {
    if (!gameId) return

    const channel = supabase
      .channel(`game_tracks:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_tracks',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          addOrUpdateGameTrack(payload.new as GameTrack)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_tracks',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          addOrUpdateGameTrack(payload.new as GameTrack)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, addOrUpdateGameTrack])
}
