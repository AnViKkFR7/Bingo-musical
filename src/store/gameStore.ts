import { create } from 'zustand'
import type { Game, Player, Board, GameTrack, BoardMark, SpotifyTrackResult } from '../types'
import { saveSession, loadSession, clearSession } from '../lib/utils'

// ============================================================
// Tipos del store
// ============================================================

/**
 * Representación provisional de las canciones del cartón ANTES de iniciar
 * la partida. En este momento aún no existen game_tracks con play_order,
 * así que guardamos el spotify_id como referencia intermedia.
 * Una vez iniciada la partida y creados los game_tracks, se actualiza
 * boards.track_positions con los play_order reales.
 */
export interface PendingBoardTrack {
  spotify_id: string
  name: string
  artist: string
  album_image_url?: string
}

interface GameState {
  // Datos de la partida actual
  game: Game | null
  currentPlayer: Player | null
  currentBoard: Board | null

  // Canciones de la partida (una vez iniciada)
  gameTracks: GameTrack[]

  // Marcas del jugador actual
  boardMarks: BoardMark[]

  // Canciones pendientes del cartón (antes de iniciar, referenciadas por spotify_id)
  pendingBoardTracks: PendingBoardTrack[]

  // Jugadores de la sala (para el lobby y el panel del DJ)
  players: Player[]

  // Todos los cartones (para que el DJ vea quién tiene línea/bingo)
  allBoards: Board[]

  // Estado de UI
  isLoading: boolean
  error: string | null
}

interface GameActions {
  // Inicializar desde localStorage al arrancar la app
  initFromSession: () => void

  // Setters principales
  setGame: (game: Game | null) => void
  setCurrentPlayer: (player: Player | null) => void
  setCurrentBoard: (board: Board | null) => void
  setGameTracks: (tracks: GameTrack[]) => void
  setBoardMarks: (marks: BoardMark[]) => void
  setPendingBoardTracks: (tracks: PendingBoardTrack[]) => void
  setPlayers: (players: Player[]) => void
  setAllBoards: (boards: Board[]) => void

  // Actualizaciones parciales via Realtime
  updateGame: (patch: Partial<Game>) => void
  addOrUpdateGameTrack: (track: GameTrack) => void
  addBoardMark: (mark: BoardMark) => void
  updateBoard: (patch: Partial<Board> & { id: string }) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void

  // Helpers derivados
  getCurrentTrack: () => GameTrack | null
  getPlayedTrackOrders: () => Set<number>
  getMarkedOrders: () => Set<number>

  // Estado de carga y errores
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Resetear el store al salir de una partida
  reset: () => void
}

type GameStore = GameState & GameActions

// ============================================================
// Estado inicial
// ============================================================
const initialState: GameState = {
  game: null,
  currentPlayer: null,
  currentBoard: null,
  gameTracks: [],
  boardMarks: [],
  pendingBoardTracks: [],
  players: [],
  allBoards: [],
  isLoading: false,
  error: null,
}

// ============================================================
// Store Zustand
// ============================================================
export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  // ── Inicialización desde localStorage ──────────────────────
  initFromSession: () => {
    const session = loadSession()
    if (session) {
      // La sesión solo guarda IDs; los datos completos se cargarán
      // mediante los hooks de Realtime cuando se monte la página.
      // Aquí solo marcamos que hay una sesión activa para que los
      // hooks sepan qué IDs usar.
      set({
        currentPlayer: {
          id: session.player_id,
          game_id: '',  // se rellenará al cargar el juego
          alias: '',
          is_host: session.is_host,
          joined_at: '',
        },
        currentBoard: {
          id: session.board_id,
          game_id: '',
          player_id: session.player_id,
          track_positions: [],
          has_line: false,
          has_bingo: false,
          created_at: '',
        },
      })
    }
  },

  // ── Setters principales ─────────────────────────────────────
  setGame: (game) => set({ game }),

  setCurrentPlayer: (player) => {
    set({ currentPlayer: player })
    // Persistir sesión si tenemos board
    const { currentBoard, game } = get()
    if (player && currentBoard && game) {
      saveSession({
        player_id: player.id,
        board_id: currentBoard.id,
        game_code: game.code,
        is_host: player.is_host,
      })
    }
  },

  setCurrentBoard: (board) => {
    set({ currentBoard: board })
    const { currentPlayer, game } = get()
    if (board && currentPlayer && game) {
      saveSession({
        player_id: currentPlayer.id,
        board_id: board.id,
        game_code: game.code,
        is_host: currentPlayer.is_host,
      })
    }
  },

  setGameTracks: (tracks) => set({ gameTracks: tracks }),
  setBoardMarks: (marks) => set({ boardMarks: marks }),
  setPendingBoardTracks: (tracks) => set({ pendingBoardTracks: tracks }),
  setPlayers: (players) => set({ players }),
  setAllBoards: (boards) => set({ allBoards: boards }),

  // ── Actualizaciones parciales via Realtime ──────────────────
  updateGame: (patch) =>
    set((state) => ({
      game: state.game ? { ...state.game, ...patch } : null,
    })),

  addOrUpdateGameTrack: (track) =>
    set((state) => {
      const exists = state.gameTracks.findIndex(t => t.id === track.id)
      if (exists === -1) {
        return { gameTracks: [...state.gameTracks, track] }
      }
      const updated = [...state.gameTracks]
      updated[exists] = track
      return { gameTracks: updated }
    }),

  addBoardMark: (mark) =>
    set((state) => {
      // Evitar duplicados
      if (state.boardMarks.some(m => m.id === mark.id)) return {}
      return { boardMarks: [...state.boardMarks, mark] }
    }),

  updateBoard: (patch) =>
    set((state) => {
      // Actualiza el cartón propio si coincide
      const updatedOwn =
        state.currentBoard?.id === patch.id
          ? { ...state.currentBoard, ...patch }
          : state.currentBoard

      // Actualiza en allBoards
      const updatedAll = state.allBoards.map(b =>
        b.id === patch.id ? { ...b, ...patch } : b
      )

      return { currentBoard: updatedOwn, allBoards: updatedAll }
    }),

  addPlayer: (player) =>
    set((state) => {
      if (state.players.some(p => p.id === player.id)) return {}
      return { players: [...state.players, player] }
    }),

  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter(p => p.id !== playerId),
    })),

  // ── Helpers derivados ────────────────────────────────────────
  getCurrentTrack: () => {
    const { game, gameTracks } = get()
    if (!game || game.current_track_index < 0) return null
    return (
      gameTracks.find(t => t.play_order === game.current_track_index) ?? null
    )
  },

  getPlayedTrackOrders: () => {
    const { gameTracks } = get()
    return new Set(
      gameTracks.filter(t => t.played_at != null).map(t => t.play_order)
    )
  },

  getMarkedOrders: () => {
    const { boardMarks } = get()
    return new Set(boardMarks.map(m => m.play_order))
  },

  // ── Estado de UI ─────────────────────────────────────────────
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // ── Reset ────────────────────────────────────────────────────
  reset: () => {
    clearSession()
    set(initialState)
  },
}))

// ── Selector factories (para evitar re-renders innecesarios) ──
export const selectGame = (s: GameStore) => s.game
export const selectCurrentPlayer = (s: GameStore) => s.currentPlayer
export const selectCurrentBoard = (s: GameStore) => s.currentBoard
export const selectGameTracks = (s: GameStore) => s.gameTracks
export const selectBoardMarks = (s: GameStore) => s.boardMarks
export const selectPlayers = (s: GameStore) => s.players
export const selectAllBoards = (s: GameStore) => s.allBoards
export const selectIsLoading = (s: GameStore) => s.isLoading
export const selectError = (s: GameStore) => s.error

// Re-export del tipo para que los hooks puedan usarlo
export type { SpotifyTrackResult }
