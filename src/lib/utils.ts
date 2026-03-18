import { supabase } from './supabase'
import type { SessionData } from '../types'

// ============================================================
// Generación del código de partida
// Solo consonantes + dígitos para evitar palabras malsonantes
// ============================================================
const SAFE_CHARS = 'BCDFGHJKLMNPQRSTVWXYZ23456789'

function generateGameCode(): string {
  return Array.from({ length: 6 }, () =>
    SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
  ).join('')
}

/**
 * Genera un código de partida único verificando contra Supabase.
 * Reintenta si hay colisión.
 */
export async function generateUniqueGameCode(): Promise<string> {
  let code = generateGameCode()
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const { data, error } = await supabase
      .from('games')
      .select('code')
      .eq('code', code)
      .maybeSingle()

    if (error) throw new Error('Error al verificar el código de partida')
    if (!data) return code

    code = generateGameCode()
    attempts++
  }

  throw new Error('No se pudo generar un código único. Inténtalo de nuevo.')
}

// ============================================================
// Extracción del Spotify ID de una URL o URI
// ============================================================

/**
 * Extrae el spotify_id de:
 * - https://open.spotify.com/playlist/37i9dQZEVXbNFJfN1Vw8d9
 * - https://open.spotify.com/playlist/37i9dQZEVXbNFJfN1Vw8d9?si=...
 * - spotify:playlist:37i9dQZEVXbNFJfN1Vw8d9
 *
 * Devuelve null si el formato no es reconocido.
 */
export function extractSpotifyId(input: string): string | null {
  const trimmed = input.trim()

  // URI format: spotify:playlist:ID
  const uriMatch = trimmed.match(/^spotify:playlist:([A-Za-z0-9]+)$/)
  if (uriMatch) return uriMatch[1]

  // URL format: https://open.spotify.com/playlist/ID
  const urlMatch = trimmed.match(
    /^https?:\/\/open\.spotify\.com\/playlist\/([A-Za-z0-9]+)(?:[?#].*)?$/
  )
  if (urlMatch) return urlMatch[1]

  return null
}

// ============================================================
// Detección de línea y bingo en el cartón
// ============================================================

/**
 * Comprueba si hay al menos una línea completa (fila, columna o diagonal).
 * @param boardSize  tamaño N del cartón (3, 4 o 5)
 * @param markedSet  set de play_order marcados por el jugador
 * @param positions  track_positions del board (array de play_order, tamaño N²)
 */
export function checkLine(
  boardSize: number,
  markedSet: Set<number>,
  positions: number[]
): boolean {
  const N = boardSize

  // Filas
  for (let row = 0; row < N; row++) {
    if (
      Array.from({ length: N }, (_, col) => positions[row * N + col])
        .every(po => markedSet.has(po))
    ) return true
  }

  // Columnas
  for (let col = 0; col < N; col++) {
    if (
      Array.from({ length: N }, (_, row) => positions[row * N + col])
        .every(po => markedSet.has(po))
    ) return true
  }

  // Diagonal principal (↘)
  if (
    Array.from({ length: N }, (_, i) => positions[i * N + i])
      .every(po => markedSet.has(po))
  ) return true

  // Diagonal secundaria (↙)
  if (
    Array.from({ length: N }, (_, i) => positions[i * N + (N - 1 - i)])
      .every(po => markedSet.has(po))
  ) return true

  return false
}

/**
 * Comprueba si el jugador tiene bingo (todas las celdas marcadas).
 */
export function checkBingo(
  boardSize: number,
  markedSet: Set<number>,
  positions: number[]
): boolean {
  return positions.slice(0, boardSize * boardSize).every(po => markedSet.has(po))
}

// ============================================================
// Fisher-Yates shuffle
// ============================================================
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ============================================================
// Persistencia de sesión en localStorage
// ============================================================
const SESSION_KEY = 'bingo_musical_session'

export function saveSession(data: SessionData): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
}

export function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SessionData
  } catch {
    return null
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

// ============================================================
// Avatares de jugadores
// ============================================================
const AVATAR_FILENAMES: readonly string[] = [
  'Adobe%20Express%20-%20file.png',
  'Adobe%20Express%20-%20file%20-%20copia.png',
  'Adobe%20Express%20-%20file%20-%20copia%20(2).png',
  'Adobe%20Express%20-%20file%20-%20copia%20(3).png',
  'Adobe%20Express%20-%20file%20-%20copia%20(4).png',
  'Adobe%20Express%20-%20file%20-%20copia%20(5).png',
  'Adobe%20Express%20-%20file%20-%20copia%20(6).png',
  'Adobe%20Express%20-%20file%20-%20copia%20(7).png',
  'Adobe%20Express%20-%20file%20-%20copia%20(8).png',
  'Adobe%20Express%20-%20file%20-%20copia%20(9).png',
  'Adobe%20Express%20-%20file%20-%20copia%20(10).png',
  'Adobe%20Express%20-%20file%20-%20copia%20(11).png',
]

/**
 * Devuelve una URL de avatar determinística basada en el player ID.
 * Siempre devuelve el mismo avatar para el mismo jugador.
 */
export function getAvatarUrl(playerId: string): string {
  let hash = 0
  for (let i = 0; i < playerId.length; i++) {
    hash = (hash * 31 + playerId.charCodeAt(i)) >>> 0
  }
  return `/avatares/${AVATAR_FILENAMES[hash % AVATAR_FILENAMES.length]}`
}
