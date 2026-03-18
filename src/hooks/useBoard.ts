import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'
import { checkLine, checkBingo } from '../lib/utils'
import type { Board, BoardMark } from '../types'

/**
 * Carga el cartón del jugador y sus marcas, y se suscribe a cambios
 * en tiempo real. Detecta línea y bingo y actualiza Supabase.
 */
export function useBoard(gameId: string | undefined, boardId: string | undefined) {
  const {
    setCurrentBoard,
    setBoardMarks,
    addBoardMark,
    updateBoard,
    currentBoard,
    game,
  } = useGameStore()

  // Carga inicial del board
  useEffect(() => {
    if (!boardId) return

    let cancelled = false

    async function fetchBoard() {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single()

      if (cancelled || error || !data) return
      setCurrentBoard(data as Board)
    }

    fetchBoard()
    return () => { cancelled = true }
  }, [boardId, setCurrentBoard])

  // Carga inicial de marks
  useEffect(() => {
    if (!boardId) return

    let cancelled = false

    async function fetchMarks() {
      const { data, error } = await supabase
        .from('board_marks')
        .select('*')
        .eq('board_id', boardId)

      if (cancelled || error || !data) return
      setBoardMarks(data as BoardMark[])
    }

    fetchMarks()
    return () => { cancelled = true }
  }, [boardId, setBoardMarks])

  // Suscripción Realtime a board_marks (marcas nuevas del propio jugador)
  useEffect(() => {
    if (!boardId || !gameId) return

    const channel = supabase
      .channel(`board_marks:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'board_marks',
          filter: `board_id=eq.${boardId}`,
        },
        async (payload) => {
          const mark = payload.new as BoardMark
          addBoardMark(mark)

          // Verificar línea y bingo tras cada nueva marca
          const store = useGameStore.getState()
          const board = store.currentBoard
          const boardSize = store.game?.board_size ?? 3

          if (!board) return

          const markedSet = store.getMarkedOrders()
          // Incluir la marca recién llegada
          markedSet.add(mark.play_order)

          const hasLine = checkLine(boardSize, markedSet, board.track_positions)
          const hasBingo = checkBingo(boardSize, markedSet, board.track_positions)

          const updates: Partial<Board> = {}
          if (hasLine && !board.has_line)  updates.has_line = true
          if (hasBingo && !board.has_bingo) updates.has_bingo = true

          if (Object.keys(updates).length > 0) {
            await supabase
              .from('boards')
              .update(updates)
              .eq('id', board.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [boardId, gameId, addBoardMark])

  // Suscripción Realtime a boards (has_line / has_bingo del propio jugador)
  useEffect(() => {
    if (!boardId) return

    const channel = supabase
      .channel(`board:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'boards',
          filter: `id=eq.${boardId}`,
        },
        (payload) => {
          updateBoard(payload.new as Board & { id: string })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [boardId, updateBoard])

  // Suscripción Realtime a todos los boards de la partida (para el DJ)
  useEffect(() => {
    if (!gameId) return

    const { setAllBoards, updateBoard: updBoard } = useGameStore.getState()

    // Carga inicial de todos los boards
    supabase
      .from('boards')
      .select('*')
      .eq('game_id', gameId)
      .then(({ data }) => {
        if (data) setAllBoards(data as Board[])
      })

    const channel = supabase
      .channel(`all_boards:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'boards',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          updBoard(payload.new as Board & { id: string })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId])

  return { board: currentBoard, game }
}
