// ============================================================
// BINGO MUSICAL — Tipos TypeScript principales
// ============================================================

export interface Playlist {
  id: string
  spotify_id: string
  name: string
  description?: string
  image_url?: string
  owner_name?: string
  is_preset: boolean
  created_at: string
}

export interface Game {
  id: string
  code: string
  playlist_spotify_id: string
  playlist_name: string
  playlist_image_url?: string
  host_player_id?: string
  board_size: 3 | 4 | 5
  status: 'waiting' | 'playing' | 'finished'
  current_track_index: number
  created_at: string
  started_at?: string
  finished_at?: string
}

export interface Player {
  id: string
  game_id: string
  alias: string
  is_host: boolean
  joined_at: string
}

export interface GameTrack {
  id: string
  game_id: string
  play_order: number
  spotify_id: string
  name: string
  artist: string
  album_name?: string
  album_image_url?: string
  preview_url?: string
  played_at?: string
}

export interface Board {
  id: string
  game_id: string
  player_id: string
  track_positions: number[]
  has_line: boolean
  has_bingo: boolean
  created_at: string
}

export interface BoardMark {
  id: string
  board_id: string
  game_id: string
  play_order: number
  marked_at: string
}

// Tipo auxiliar para representar una celda del cartón en el frontend
export interface BoardCell {
  play_order: number
  track: GameTrack
  isPlayed: boolean  // la canción ya ha sonado
  isMarked: boolean  // el jugador la ha marcado
}

// Respuesta de la Edge Function spotify-search
export interface SpotifyPlaylistResult {
  spotify_id: string
  name: string
  image_url?: string
  owner_name: string
  track_count: number
}

// Respuesta de la Edge Function spotify-get-playlist-tracks
export interface SpotifyTrackResult {
  spotify_id: string
  name: string
  artist: string
  album_name?: string
  album_image_url?: string
  preview_url: string
}

export interface SpotifyPlaylistTracksResponse {
  playlist: {
    spotify_id: string
    name: string
    image_url?: string
    owner_name: string
  }
  tracks: SpotifyTrackResult[]
  total_tracks: number
  tracks_with_preview: number
}

// Estado persistido en localStorage
export interface SessionData {
  player_id: string
  board_id: string
  game_code: string
  is_host: boolean
}
