-- ============================================================
-- BINGO MUSICAL — Schema Supabase (arquitectura híbrida)
--
-- Decisión de diseño:
--   Las canciones de Spotify NO se cachean globalmente.
--   Se obtienen en caliente desde la API de Spotify al crear
--   cada partida y se desnormalizan directamente en game_tracks.
--   Así los datos siempre están actualizados y los preview_url
--   nunca caducan.
--
--   La tabla `playlists` solo guarda metadatos ligeros para
--   mostrar el catálogo de opciones (preestablecidas o buscadas).
-- ============================================================


-- ============================================================
-- 1. PLAYLISTS
-- Solo metadatos de la playlist. Sin tracks.
-- Las tracks se obtienen de Spotify en tiempo real al crear
-- una partida y se almacenan desnormalizadas en game_tracks.
-- ============================================================
CREATE TABLE playlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_id  TEXT NOT NULL UNIQUE,   -- ID extraído de la URL de Spotify
  name        TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,                   -- Portada de la playlist
  owner_name  TEXT,                   -- Nombre del propietario en Spotify
  is_preset   BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = preestablecida por el admin
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 2. GAMES (Partidas)
-- Una sala de bingo independiente.
-- ============================================================
CREATE TABLE games (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT NOT NULL UNIQUE,   -- Código de 6 chars para unirse, ej: "XK3D9F"
  playlist_spotify_id TEXT NOT NULL,          -- Spotify ID de la playlist usada
  playlist_name       TEXT NOT NULL,          -- Nombre snapshot en el momento de crear
  playlist_image_url  TEXT,                   -- Portada snapshot en el momento de crear
  host_player_id      UUID,                   -- FK a players (se rellena tras crear el host)
  board_size          SMALLINT NOT NULL DEFAULT 3  -- 3→3x3 | 4→4x4 | 5→5x5
                      CHECK (board_size IN (3, 4, 5)),
  status              TEXT NOT NULL DEFAULT 'waiting'
                      CHECK (status IN ('waiting', 'playing', 'finished')),
  current_track_index INT NOT NULL DEFAULT -1,  -- Índice de la canción actual (-1 = sin empezar)
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at          TIMESTAMPTZ,
  finished_at         TIMESTAMPTZ
);


-- ============================================================
-- 3. PLAYERS (Jugadores)
-- Anónimos: solo alias, sin cuenta. Pertenecen a una partida.
-- ============================================================
CREATE TABLE players (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id   UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  alias     TEXT NOT NULL,
  is_host   BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, alias)   -- No puede haber dos alias iguales en la misma partida
);

-- FK diferida: games referencia players pero players se crea después
ALTER TABLE games
  ADD CONSTRAINT fk_games_host_player
  FOREIGN KEY (host_player_id) REFERENCES players(id);


-- ============================================================
-- 4. GAME_TRACKS
-- Canciones de la partida, obtenidas en caliente desde Spotify
-- al iniciar la partida. Todos los datos de Spotify se
-- desnormalizan aquí para que sean inmutables durante el juego.
-- ============================================================
CREATE TABLE game_tracks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  play_order      INT NOT NULL,         -- Orden de reproducción (barajado al iniciar)

  -- Datos de Spotify copiados en el momento de crear la partida.
  -- Inmutables: aunque Spotify cambie la canción, la partida no se ve afectada.
  spotify_id      TEXT NOT NULL,
  name            TEXT NOT NULL,
  artist          TEXT NOT NULL,        -- Artistas concatenados con coma
  album_name      TEXT,
  album_image_url TEXT,                 -- Portada del álbum (para el cartón)
  preview_url     TEXT,                 -- MP3 de 30s. Obtenido justo al crear → nunca caducado

  -- Estado de reproducción
  played_at       TIMESTAMPTZ,          -- NULL = pendiente | NOT NULL = ya reproducida

  UNIQUE (game_id, play_order)
);


-- ============================================================
-- 5. BOARDS (Cartones)
-- Cada jugador tiene un cartón único por partida.
-- track_positions es un array de play_order de game_tracks
-- que define qué canciones aparecen en el cartón y en qué orden
-- (izquierda→derecha, arriba→abajo).
-- ============================================================
CREATE TABLE boards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  track_positions INT[] NOT NULL,       -- Array de play_order. Longitud = board_size²
  has_line        BOOLEAN NOT NULL DEFAULT FALSE,
  has_bingo       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, player_id)
);


-- ============================================================
-- 6. BOARD_MARKS (Marcas del cartón)
-- Registra qué canciones ha marcado cada jugador.
-- Referencia game_tracks mediante (game_id + play_order).
-- ============================================================
CREATE TABLE board_marks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  game_id     UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  play_order  INT NOT NULL,             -- Referencia a game_tracks(play_order)
  marked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (board_id, play_order)         -- Una canción solo se marca una vez por cartón
);


-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_games_code              ON games(code);
CREATE INDEX idx_games_status            ON games(status);
CREATE INDEX idx_players_game_id         ON players(game_id);
CREATE INDEX idx_game_tracks_game_id     ON game_tracks(game_id);
CREATE INDEX idx_game_tracks_order       ON game_tracks(game_id, play_order);
CREATE INDEX idx_game_tracks_played      ON game_tracks(game_id, played_at);
CREATE INDEX idx_boards_game_id          ON boards(game_id);
CREATE INDEX idx_boards_player_id        ON boards(player_id);
CREATE INDEX idx_board_marks_board_id    ON board_marks(board_id);
CREATE INDEX idx_board_marks_game_id     ON board_marks(game_id);


-- ============================================================
-- REALTIME
-- Solo las tablas que necesitan sincronización en vivo.
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE game_tracks;
ALTER PUBLICATION supabase_realtime ADD TABLE boards;
ALTER PUBLICATION supabase_realtime ADD TABLE board_marks;


-- ============================================================
-- SEED — Playlists preestablecidas
-- Solo metadatos. Las tracks se obtienen de Spotify al vuelo.
-- El spotify_id se extrae de la URL:
--   https://open.spotify.com/playlist/{spotify_id}
-- ============================================================
INSERT INTO playlists (spotify_id, name, description, is_preset) VALUES
  ('37i9dQZEVXbNFJfN1Vw8d9', 'Top 50 España',        'Las 50 más escuchadas en España',            TRUE),
  ('37i9dQZEVXbMDoHDwVN2tF', 'Top 50 Global',         'Las 50 más escuchadas en el mundo',          TRUE),
  ('37i9dQZF1DXcBWIGoYBM5M', 'Today''s Top Hits',     'Los hits del momento',                       TRUE),
  ('37i9dQZF1DX4dyzvuaRJ0n', 'mint',                  'Lo mejor del pop actual',                    TRUE),
  ('37i9dQZF1DWXRqgorJj26U', 'Rock Classics',         'Los clásicos del rock de todos los tiempos', TRUE),
  ('37i9dQZF1DX4o1oenSJRJd', 'All Out 80s',           'Los mejores hits de los años 80',            TRUE),
  ('37i9dQZF1DXbTxeAdrVG2l', 'All Out 90s',           'Los mejores hits de los años 90',            TRUE),
  ('37i9dQZF1DX4UtSsGT1Sbe', 'All Out 00s',           'Los mejores hits de los años 2000',          TRUE);
