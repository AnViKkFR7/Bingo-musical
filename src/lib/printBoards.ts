// ============================================================
// BINGO MUSICAL — Generación de cartones únicos para impresión
// ============================================================

export interface TrackCell {
  spotify_id: string
  name: string
  artist: string
  album_image_url: string
}

export interface PrintableBoard {
  playerId: number  // 1..numPlayers
  gameId: number   // 1..numGames
  cells: TrackCell[] // boardSize² cells in display order
}

/**
 * Fisher-Yates shuffle — returns a new shuffled copy of the array.
 */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Serialise a board's cell IDs into a string for uniqueness checks.
 * NOTE: When tracks.length < boardSize² * 2, boards within the same game
 * may share some songs but their ORDER will always differ, making each
 * board unique from a gameplay perspective.
 */
function boardHash(cells: TrackCell[]): string {
  return cells.map(c => c.spotify_id).join('|')
}

/**
 * Generates all bingo boards for the print batch.
 * Returns a 2D array indexed as [gameIndex][playerIndex].
 *
 * @param tracks    - Full list of available tracks from the playlist
 * @param boardSize - 3, 4 or 5 (cells = boardSize²)
 * @param numPlayers - Number of players per game (1–50)
 * @param numGames  - Number of games (1–10)
 */
export function generateAllBoards(
  tracks: TrackCell[],
  boardSize: 3 | 4 | 5,
  numPlayers: number,
  numGames: number,
): PrintableBoard[][] {
  const needed = boardSize * boardSize

  if (tracks.length < needed) {
    throw new Error(`Not enough tracks: need ${needed}, got ${tracks.length}`)
  }

  const result: PrintableBoard[][] = []

  for (let gameId = 1; gameId <= numGames; gameId++) {
    const gameBoards: PrintableBoard[] = []
    const usedHashes = new Set<string>()

    for (let playerId = 1; playerId <= numPlayers; playerId++) {
      let cells: TrackCell[]
      let hash: string
      let attempts = 0
      const MAX_ATTEMPTS = 200

      do {
        const shuffled = shuffle(tracks)
        cells = shuffled.slice(0, needed)
        hash = boardHash(cells)
        attempts++
      } while (usedHashes.has(hash) && attempts < MAX_ATTEMPTS)

      usedHashes.add(hash)
      gameBoards.push({ playerId, gameId, cells })
    }

    result.push(gameBoards)
  }

  return result
}
