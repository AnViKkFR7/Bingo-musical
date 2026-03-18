# 🎵 MusiBingo — Project Brief para generación de código

> Este documento contiene toda la información necesaria para generar el código completo de la webapp **MusiBingo**. Léelo íntegramente antes de escribir cualquier línea de código.

---

## 1. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite |
| Estilos | CSS |
| Base de datos / Backend | Supabase (PostgreSQL + Realtime + Edge Functions) |
| Música | Spotify Web API (Client Credentials Flow — solo lectura, sin login de usuarios) |
| Internacionalización | i18next + react-i18next |
| Routing | React Router v6 |
| Estado global | Zustand |
| Anuncios | Google AdSense (slots configurables por componente) |

---

## 2. Requisitos generales

- **Sin login de usuarios.** Los jugadores entran solo con un alias (nombre).
- **Sin login de Spotify para los jugadores.** Solo las Edge Functions de Supabase usan credenciales de Spotify (Client Credentials Flow). El frontend nunca ve las credenciales.
- **Multisala:** pueden existir múltiples partidas activas simultáneamente, cada una con su código único de 6 caracteres.
- **Sincronización en tiempo real** entre el DJ y los jugadores usando Supabase Realtime.
- **Idiomas soportados:** español (`es`), inglés (`en`), catalán (`ca`), francés (`fr`), italiano (`it`). Detección automática del navegador con selector manual en el header.
- **Soporte para anuncios** (Google AdSense). Ver sección 8.

---

## 3. Decisión de arquitectura clave: datos de Spotify al vuelo

> ⚠️ Leer esto antes de implementar cualquier cosa relacionada con Spotify o la base de datos.

**Las canciones de Spotify NO se cachean en ninguna tabla global.** Las razones son:

1. Playlists como el Top 50 se actualizan semanalmente. Una caché permanente quedaría desactualizada.
2. Los `preview_url` de Spotify caducan. Si se guardan hoy y se usan en 2 semanas, estarán rotos.

**Solución adoptada (arquitectura híbrida):**

- La tabla `playlists` solo guarda **metadatos ligeros** (spotify_id, nombre, imagen, is_preset). Sin tracks.
- Al **crear una partida**, se llama a Spotify en ese momento, se obtienen las canciones actualizadas, y se guardan **desnormalizadas** en `game_tracks` (con todos los campos: nombre, artista, imagen, preview_url).
- Los datos de Spotify quedan **inmutables dentro de la partida**: aunque Spotify cambie la playlist, la partida en curso no se ve afectada.
- Con `ON DELETE CASCADE`, si se elimina una partida, todos sus datos de Spotify desaparecen solos.

---

## 4. Flujo general de la aplicación

```
Pantalla de inicio
    ├── [Crear partida] → Seleccionar playlist → Configurar partida → Sala de espera (host)
    └── [Unirse a partida] → Introducir código → Introducir alias → Sala de espera (jugador)

Sala de espera
    ├── Host ve la lista de jugadores conectados en tiempo real y el botón "Iniciar partida"
    └── Jugadores esperan a que el host inicie

Partida en curso
    ├── Vista DJ (host): controla qué canción suena, reproduce el audio, ve historial
    └── Vista Jugador: ve su cartón, marca canciones, puede cantar línea/bingo

Fin de partida
    └── Pantalla de resultados con ganador(es)
```

---

## 5. Páginas y componentes

### 5.1 Páginas (React Router)

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `HomePage` | Pantalla de inicio: Crear / Unirse |
| `/crear` | `CreateGamePage` | Flujo de creación de partida |
| `/unirse` | `JoinGamePage` | Introducir código y alias |
| `/sala/:gameCode` | `LobbyPage` | Sala de espera previa al inicio |
| `/jugar/:gameCode` | `GamePage` | Pantalla principal de juego |
| `/resultados/:gameCode` | `ResultsPage` | Resultados finales |

### 5.2 Componentes principales

**Layout**
- `Header` — Logo, selector de idioma, enlace a inicio
- `AdSlot` — Wrapper para slots de Google AdSense (ver sección 8)
- `Layout` — Wrapper general con header y footer

**Creación de partida (`/crear`)**
- `PresetPlaylistGrid` — Grid de playlists preestablecidas (cargadas desde tabla `playlists` donde `is_preset = true`)
- `PlaylistSearch` — Buscador de playlists públicas de Spotify (llama a Edge Function `spotify-search`)
- `PlaylistUrlInput` — Input para pegar URL o URI de Spotify
- `PlaylistPreview` — Vista previa de la playlist seleccionada (portada, nombre, nº canciones con preview disponible)
- `GameConfigForm` — Selección de tamaño de cartón (3x3, 4x4, 5x5) y alias del host

**Sala de espera (`/sala/:gameCode`)**
- `GameCodeDisplay` — Muestra el código grande y con botón de copiar
- `LobbyPlayerList` — Lista en tiempo real de jugadores conectados (suscripción Realtime a `players`)
- `StartGameButton` — Solo visible para el host; inicia la partida

**Partida (`/jugar/:gameCode`)**
- `DJPanel` — Panel exclusivo del host: botón "Siguiente canción", historial de reproducidas
- `AudioPlayer` — Reproductor HTML5 del preview MP3. **Solo renderiza en el dispositivo del host.** Los jugadores ven la info de la canción pero el audio suena físicamente en el espacio a través del dispositivo del DJ.
- `NowPlaying` — Canción actual visible para todos: portada, título, artista, barra de progreso
- `BingoBoard` — Cartón del jugador: grid de celdas
- `BingoCell` — Celda del cartón (imagen del álbum, título, artista; estados: normal / reproducida / marcada)
- `BingoButton` — Botón para cantar línea o bingo (aparece cuando se detecta la condición)
- `PlayerList` — Lista lateral con todos los jugadores e indicador de línea/bingo cantado

**Resultados (`/resultados/:gameCode`)**
- `WinnerBanner` — Muestra el ganador con animación
- `FinalBoard` — Cartón final con todas las marcas del jugador

---

## 6. Integración con Spotify

### 6.1 Autenticación

**Client Credentials Flow.** Las credenciales viven exclusivamente en las Edge Functions de Supabase. El frontend nunca tiene acceso a ellas.

```
# Variables de entorno en Supabase (servidor, nunca en el frontend)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

### 6.2 Edge Functions necesarias

**`spotify-search`** — Busca playlists públicas por texto
```
GET /functions/v1/spotify-search?q={query}

Respuesta:
[
  {
    spotify_id: string,
    name: string,
    image_url: string,
    owner_name: string,
    track_count: number
  }
]
```

**`spotify-get-playlist-tracks`** — Obtiene las tracks de una playlist con preview_url válido
```
POST /functions/v1/spotify-get-playlist-tracks
Body: { spotify_playlist_id: string }

Respuesta:
{
  playlist: { spotify_id, name, image_url, owner_name },
  tracks: [
    {
      spotify_id: string,
      name: string,
      artist: string,       // artistas concatenados con ", "
      album_name: string,
      album_image_url: string,
      preview_url: string,  // solo tracks con preview_url válido
    }
  ],
  total_tracks: number,     // total en la playlist
  tracks_with_preview: number  // solo las que tienen preview
}
```

> Esta Edge Function filtra automáticamente las canciones sin `preview_url`. El frontend debe advertir si `tracks_with_preview` es menor que `board_size²` (número mínimo para jugar).

### 6.3 Formatos de URL/URI aceptados

El componente `PlaylistUrlInput` debe aceptar y extraer el `spotify_id` de:
- `https://open.spotify.com/playlist/37i9dQZEVXbNFJfN1Vw8d9`
- `https://open.spotify.com/playlist/37i9dQZEVXbNFJfN1Vw8d9?si=...` (con parámetros)
- `spotify:playlist:37i9dQZEVXbNFJfN1Vw8d9`

---

## 7. Base de datos (Supabase)

### 7.1 Schema completo

```sql
-- PLAYLISTS (solo metadatos, sin tracks)
CREATE TABLE playlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_id  TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  owner_name  TEXT,
  is_preset   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GAMES
CREATE TABLE games (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT NOT NULL UNIQUE,
  playlist_spotify_id TEXT NOT NULL,
  playlist_name       TEXT NOT NULL,
  playlist_image_url  TEXT,
  host_player_id      UUID,
  board_size          SMALLINT NOT NULL DEFAULT 3 CHECK (board_size IN (3, 4, 5)),
  status              TEXT NOT NULL DEFAULT 'waiting'
                      CHECK (status IN ('waiting', 'playing', 'finished')),
  current_track_index INT NOT NULL DEFAULT -1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at          TIMESTAMPTZ,
  finished_at         TIMESTAMPTZ
);

-- PLAYERS
CREATE TABLE players (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id   UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  alias     TEXT NOT NULL,
  is_host   BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, alias)
);

ALTER TABLE games
  ADD CONSTRAINT fk_games_host_player
  FOREIGN KEY (host_player_id) REFERENCES players(id);

-- GAME_TRACKS (datos de Spotify desnormalizados, inmutables por partida)
CREATE TABLE game_tracks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  play_order      INT NOT NULL,
  spotify_id      TEXT NOT NULL,
  name            TEXT NOT NULL,
  artist          TEXT NOT NULL,
  album_name      TEXT,
  album_image_url TEXT,
  preview_url     TEXT,
  played_at       TIMESTAMPTZ,
  UNIQUE (game_id, play_order)
);

-- BOARDS
CREATE TABLE boards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  track_positions INT[] NOT NULL,  -- array de play_order, longitud = board_size²
  has_line        BOOLEAN NOT NULL DEFAULT FALSE,
  has_bingo       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, player_id)
);

-- BOARD_MARKS
CREATE TABLE board_marks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  game_id     UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  play_order  INT NOT NULL,
  marked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (board_id, play_order)
);
```

### 7.2 Tablas con Realtime habilitado

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE game_tracks;
ALTER PUBLICATION supabase_realtime ADD TABLE boards;
ALTER PUBLICATION supabase_realtime ADD TABLE board_marks;
```

### 7.3 Variables de entorno del frontend

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## 8. Lógica de juego

### 8.1 Creación de partida

1. El host selecciona una playlist (preset, búsqueda o URL pegada)
2. El frontend llama a `spotify-get-playlist-tracks` para obtener las tracks con preview y mostrar la vista previa
3. Si `tracks_with_preview < board_size²`, mostrar error y no permitir continuar
4. El host elige tamaño de cartón y su alias
5. El frontend genera un código único de 6 caracteres (ver sección 8.8)
6. Se inserta la partida en `games` con `status = 'waiting'`
7. Se crea el player del host con `is_host = TRUE`
8. Se genera el cartón del host aleatoriamente y se inserta en `boards`
9. Guardar `player_id` y `board_id` en `localStorage` (para recuperar sesión si recarga)
10. Redirigir a `/sala/:gameCode`

### 8.2 Unirse a una partida

1. El jugador introduce el código de partida
2. Verificar que la partida existe y `status = 'waiting'`; si no, mostrar error
3. El jugador introduce su alias
4. Verificar que el alias no está en uso en esa partida
5. Crear el player, generar su cartón y guardarlo en `boards`
6. Guardar `player_id` y `board_id` en `localStorage`
7. Redirigir a `/sala/:gameCode`

### 8.3 Generación del cartón

- Seleccionar aleatoriamente `board_size²` canciones del resultado de `spotify-get-playlist-tracks`
- El orden dentro del cartón es aleatorio e independiente para cada jugador
- Guardar en `boards.track_positions` el array de `play_order` de las canciones seleccionadas
- Cada cartón de la misma partida debe ser diferente (barajar con semilla distinta por jugador)

### 8.4 Inicio de partida (solo el host puede hacerlo)

1. Llamar a `spotify-get-playlist-tracks` de nuevo para obtener tracks frescas de Spotify
2. Barajar las tracks aleatoriamente y asignar `play_order` 0, 1, 2...
3. Insertar todas en `game_tracks` con `played_at = NULL`
4. Actualizar `games.status = 'playing'` y `games.started_at = NOW()`
5. Todos los clientes suscritos a Realtime detectan el cambio de `status` y navegan a `/jugar/:gameCode`

> ⚠️ Los `play_order` usados en `boards.track_positions` deben coincidir con los `play_order` asignados en `game_tracks`. La asignación de cartones ocurre **antes** de iniciar (en el paso 8.1/8.2), pero los `play_order` de `game_tracks` se asignan **al iniciar**. Por tanto, los cartones deben generarse **tras** el inicio, o bien los cartones se generan con referencias a `spotify_id` y se mapean a `play_order` al iniciar.
>
> **Solución recomendada:** generar los cartones al unirse usando `spotify_id` temporalmente en el cliente (Zustand), y al iniciar la partida, tras crear `game_tracks`, actualizar `boards.track_positions` con los `play_order` correspondientes en una sola operación.

### 8.5 Reproducción de canciones

1. El DJ pulsa "Siguiente canción"
2. Se incrementa `games.current_track_index` en +1
3. Se actualiza `game_tracks.played_at = NOW()` para esa canción
4. Todos los jugadores reciben el update via Realtime y ven la canción en `NowPlaying`
5. El `AudioPlayer` reproduce automáticamente el `preview_url` de la canción actual
6. **El audio solo suena en el dispositivo del DJ.** El componente `AudioPlayer` solo renderiza si `player.is_host = true`.

### 8.6 Marcar canciones en el cartón

1. El jugador toca una celda de su cartón
2. Solo se puede marcar si esa canción ya ha sido reproducida (`played_at IS NOT NULL` en `game_tracks`)
3. Si la canción aún no ha sonado, la celda no responde al toque (o muestra un feedback visual de "aún no")
4. Al marcar: insertar fila en `board_marks` con `(board_id, game_id, play_order)`
5. El frontend actualiza visualmente la celda como marcada

### 8.7 Detección de línea y bingo

La detección se realiza en el **frontend** cada vez que llega un nuevo `board_mark` via Realtime:

**Línea:** cualquier fila, columna o diagonal completa del cartón marcada.
- Para un cartón de N×N, hay N filas + N columnas + 2 diagonales = 2N+2 combinaciones posibles.

**Bingo:** todas las `board_size²` celdas marcadas.

Cuando se detecta una condición nueva:
1. Actualizar `boards.has_line = true` o `boards.has_bingo = true` en Supabase
2. Mostrar banner al jugador invitándole a "cantar" (botón `BingoButton`)
3. El DJ ve en `PlayerList` qué jugadores han cantado línea o bingo (via Realtime en `boards`)

### 8.8 Fin de partida

- El DJ puede finalizar manualmente en cualquier momento
- O se finaliza automáticamente cuando alguien canta bingo
- Actualizar `games.status = 'finished'` y `games.finished_at = NOW()`
- Todos los clientes navegan a `/resultados/:gameCode`

### 8.9 Generación del código de partida

Generar 6 caracteres aleatorios usando **solo consonantes y dígitos** para evitar palabras malsonantes accidentales:

```typescript
const SAFE_CHARS = 'BCDFGHJKLMNPQRSTVWXYZ23456789'

function generateGameCode(): string {
  return Array.from({ length: 6 }, () =>
    SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
  ).join('')
}
```

Verificar en Supabase que el código no existe antes de usarlo. Si colisiona, regenerar.

---

## 9. Anuncios (Google AdSense)

### 9.1 Componente `AdSlot`

```tsx
interface AdSlotProps {
  slotId: string        // ID del slot de AdSense (desde variable de entorno)
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  className?: string
}
```

Reglas de implementación:
- Solo renderiza el script de AdSense si `VITE_ADS_ENABLED === 'true'`
- Si `VITE_ADS_ENABLED === 'false'`, renderiza un `<div>` vacío con `display: none` (no ocupa espacio)
- Esto permite desarrollar sin anuncios y activarlos en producción con un cambio de variable de entorno

### 9.2 Variables de entorno para anuncios

```bash
VITE_ADS_ENABLED=false                          # true en producción
VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
VITE_ADSENSE_SLOT_HOME_BANNER=                  # Slot banner horizontal en HomePage
VITE_ADSENSE_SLOT_GAME_SIDEBAR=                 # Slot vertical en GamePage
VITE_ADSENSE_SLOT_RESULTS_RECT=                 # Slot rectángulo en ResultsPage
```

### 9.3 Posiciones de anuncios

| Posición | Componente | Formato sugerido |
|---|---|---|
| Bajo el hero en `HomePage` | `AdSlot` | Horizontal (728×90 o auto) |
| Columna lateral en `GamePage` (solo desktop) | `AdSlot` | Vertical (160×600 o auto) |
| Entre secciones en `ResultsPage` | `AdSlot` | Rectángulo (300×250 o auto) |

---

## 10. Internacionalización (i18n)

### 10.1 Setup

```
Librería: i18next + react-i18next
Detección: i18next-browser-languagedetector (detecta del navegador)
Idioma por defecto: es (si el navegador no coincide con ninguno soportado)

Idiomas soportados:
  es → Español
  en → English
  ca → Català
  fr → Français
  it → Italiano
```

### 10.2 Estructura de archivos

```
src/
  i18n/
    index.ts
    locales/
      es.json
      en.json
      ca.json
      fr.json
      it.json
```

### 10.3 Claves de traducción

```json
{
  "home": {
    "title": "Bingo Musical",
    "subtitle": "El bingo que suena",
    "createGame": "Crear partida",
    "joinGame": "Unirse a partida"
  },
  "create": {
    "title": "Crear partida",
    "selectPlaylist": "Selecciona una playlist",
    "presets": "Playlists destacadas",
    "search": "Buscar en Spotify",
    "searchPlaceholder": "Busca una playlist...",
    "pasteUrl": "O pega el enlace de Spotify",
    "urlPlaceholder": "https://open.spotify.com/playlist/...",
    "boardSize": "Tamaño del cartón",
    "boardSize3": "3×3 (9 canciones)",
    "boardSize4": "4×4 (16 canciones)",
    "boardSize5": "5×5 (25 canciones)",
    "yourAlias": "Tu nombre",
    "aliasPlaceholder": "¿Cómo te llamas?",
    "createButton": "Crear partida",
    "notEnoughTracksWarning": "Esta playlist solo tiene {{count}} canciones con previsualización disponible. Necesitas al menos {{needed}} para un cartón {{size}}×{{size}}."
  },
  "lobby": {
    "waitingForPlayers": "Esperando jugadores...",
    "shareCode": "Comparte este código",
    "copyCode": "Copiar código",
    "codeCopied": "¡Copiado!",
    "players": "Jugadores",
    "startGame": "¡Empezar partida!",
    "waitingForHost": "Esperando a que el host inicie la partida..."
  },
  "game": {
    "nowPlaying": "Sonando ahora",
    "nextTrack": "Siguiente canción",
    "noMoreTracks": "No hay más canciones",
    "markInstruction": "Toca si la tienes en tu cartón",
    "cannotMark": "Esta canción aún no ha sonado",
    "line": "¡Línea!",
    "bingo": "¡BINGO!",
    "claimLine": "Cantar línea",
    "claimBingo": "¡Cantar BINGO!",
    "tracksPlayed": "Canciones reproducidas",
    "players": "Jugadores",
    "endGame": "Finalizar partida"
  },
  "results": {
    "winner": "¡Tenemos ganador!",
    "winners": "¡Tenemos ganadores!",
    "gameOver": "Fin de la partida",
    "playAgain": "Jugar otra vez",
    "backHome": "Volver al inicio"
  },
  "errors": {
    "gameNotFound": "Partida no encontrada",
    "gameAlreadyStarted": "La partida ya ha comenzado",
    "gameFinished": "Esta partida ya ha terminado",
    "aliasTaken": "Este nombre ya está en uso en esta partida",
    "invalidUrl": "Enlace de Spotify no válido",
    "notEnoughTracks": "La playlist no tiene suficientes canciones con previsualización",
    "codeCollision": "Error al generar el código, inténtalo de nuevo",
    "generic": "Algo ha ido mal. Inténtalo de nuevo."
  },
  "common": {
    "loading": "Cargando...",
    "back": "Volver",
    "cancel": "Cancelar",
    "confirm": "Confirmar"
  }
}
```

> Traducir todas las claves a `en`, `ca`, `fr` e `it` en sus respectivos archivos JSON.

---

## 11. Estructura de carpetas del proyecto

```
bingo-musical/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ads/
│   │   │   └── AdSlot.tsx
│   │   ├── game/
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── BingoBoard.tsx
│   │   │   ├── BingoCell.tsx
│   │   │   ├── BingoButton.tsx
│   │   │   ├── DJPanel.tsx
│   │   │   ├── NowPlaying.tsx
│   │   │   └── PlayerList.tsx
│   │   ├── lobby/
│   │   │   ├── GameCodeDisplay.tsx
│   │   │   ├── LobbyPlayerList.tsx
│   │   │   └── StartGameButton.tsx
│   │   ├── playlist/
│   │   │   ├── PlaylistSearch.tsx
│   │   │   ├── PlaylistUrlInput.tsx
│   │   │   ├── PlaylistPreview.tsx
│   │   │   └── PresetPlaylistGrid.tsx
│   │   └── ui/
│   │       ├── Header.tsx
│   │       ├── Layout.tsx
│   │       └── LanguageSelector.tsx
│   ├── hooks/
│   │   ├── useGame.ts          ← suscripción Realtime a games
│   │   ├── useGameTracks.ts    ← suscripción Realtime a game_tracks
│   │   ├── useBoard.ts         ← suscripción Realtime a boards + board_marks
│   │   ├── usePlayers.ts       ← suscripción Realtime a players
│   │   └── useAudio.ts         ← control del AudioPlayer (solo host)
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── es.json
│   │       ├── en.json
│   │       ├── ca.json
│   │       ├── fr.json
│   │       └── it.json
│   ├── lib/
│   │   ├── supabase.ts         ← cliente de Supabase
│   │   └── utils.ts            ← generateGameCode(), extractSpotifyId(), checkLine(), checkBingo()
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── CreateGamePage.tsx
│   │   ├── JoinGamePage.tsx
│   │   ├── LobbyPage.tsx
│   │   ├── GamePage.tsx
│   │   └── ResultsPage.tsx
│   ├── store/
│   │   └── gameStore.ts        ← estado global con Zustand (player, board, game actual)
│   ├── types/
│   │   └── index.ts            ← tipos TypeScript (Game, Player, Board, GameTrack, BoardMark...)
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── supabase/
│   └── functions/
│       ├── spotify-search/
│       │   └── index.ts
│       └── spotify-get-playlist-tracks/
│           └── index.ts
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 12. TypeScript — Tipos principales

```typescript
// types/index.ts

export interface Playlist {
  id: string
  spotify_id: string
  name: string
  description?: string
  image_url?: string
  owner_name?: string
  is_preset: boolean
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
  track_positions: number[]  // array de play_order
  has_line: boolean
  has_bingo: boolean
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
  isPlayed: boolean   // la canción ya ha sonado
  isMarked: boolean   // el jugador la ha marcado
}
```

---

## 13. Variables de entorno — `.env.example`

```bash
# Supabase (frontend)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Anuncios
VITE_ADS_ENABLED=false
VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
VITE_ADSENSE_SLOT_HOME_BANNER=
VITE_ADSENSE_SLOT_GAME_SIDEBAR=
VITE_ADSENSE_SLOT_RESULTS_RECT=

# Solo en entorno Supabase (Edge Functions) — NUNCA en el frontend
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

---

## 14. Notas de implementación

1. **Persistencia de sesión:** guardar `player_id`, `board_id` y `game_code` en `localStorage`. Si el jugador recarga, recuperar su sesión sin tener que volver a unirse.

2. **Preview URLs nulas:** la Edge Function `spotify-get-playlist-tracks` filtra canciones sin `preview_url`. Aun así, manejar el caso en el frontend por si alguna URL falla al reproducir (evento `onerror` en el `<audio>`).

3. **El audio solo suena en el DJ:** `AudioPlayer` solo renderiza si el jugador actual tiene `is_host = true`. Los jugadores ven la info de la canción vía Realtime pero el audio suena físicamente en el espacio a través del dispositivo del host.

4. **Cartones únicos por jugador:** al generar el cartón, barajar las canciones disponibles de forma independiente para cada jugador. Usar el `player_id` como semilla si se quiere reproducibilidad.

5. **Responsive:** la vista de jugador (cartón) está optimizada para móvil. La vista del DJ está optimizada para desktop/tablet (se proyecta o usa en una pantalla grande).

6. **RLS (Row Level Security):** configurar políticas en Supabase para que los usuarios solo puedan leer datos de partidas activas. Como no hay autenticación, usar el `anon` role con políticas permisivas en lectura y restrictivas en escritura (solo insertar marks del propio board, etc.).

7. **Coordinación cartones / game_tracks:** los cartones se crean al unirse (antes de iniciar), pero los `play_order` de `game_tracks` se asignan al iniciar. Usar `spotify_id` como referencia intermedia en el cliente y mapear a `play_order` en el momento del inicio.

---

## 15. Diseño visual — MusiBingo

### 15.1 Identidad

- **Nombre:** MusiBingo
- **Logo:** `src/public/musibingo-logo.png` (favicon + header)
- **Tipografía:** Nunito (Google Fonts) — pesos 400, 600, 700, 800, 900

### 15.2 Paleta de colores

| Variable CSS | Hex | Uso |
|---|---|---|
| `--color-teal` | `#14dac9` | Color primario, CTAs, bordes activos |
| `--color-dark` | `#37323e` | Superficies, texto oscuro sobre claro |
| `--color-red` | `#e83151` | Acento, peligro, borde derecho cartón |
| `--color-yellow` | `#fac05e` | Acento secundario, highlights |
| `--color-cream` | `#fffcf2` | Texto principal, fondos claros |
| `--color-bg` | `#1e1b24` | Fondo base de la app |

### 15.3 Diseño mobile-first

- Layout principal máx. 900px, centrado.
- El cartón de bingo se muestra a pantalla completa en móvil.
- Los avatares flotantes se reducen en pantallas < 480px.
- Botones con `border-radius: full` (pill shape) y tipografía extra-bold.

### 15.4 Cartón de bingo (flip animation)

- Cada celda es una tarjeta 3D con perspectiva.
- **Cara frontal:** número de orden (teal), imagen del álbum, nombre de canción y artista.
- **Cara trasera (marcada):** fondo gris `#b5b0bc` con un círculo verde (`#22c55e`) que contiene un tick blanco SVG.
- La animación de volteo usa `transform: rotateY(180deg)` con `transform-style: preserve-3d`.
- Solo es clickable (`cursor: pointer`) cuando `isPlayed && !isMarked`.
- El borde del grid del cartón: teal a la izquierda, rojo a la derecha.

### 15.5 Botón BINGO

- Siempre visible durante la partida (no condicional).
- Gradiente animado de 3 colores cíclico: teal → yellow → red → teal.
- `background-size: 300% 300%` + `animation: gradientShift 3s ease infinite`.
- Si el usuario hace clic cuando el cartón NO está completo → animación `shake` (sin cantar bingo).
- Si el cartón está completo (`boardCells.every(c => c.isMarked)`) → llama a `onClaimBingo()`.

### 15.6 Avatares de jugadores

- 12 avatares en `src/public/avatares/` (archivos Adobe Express).
- Se asignan **determinísticamente** por `playerId` usando `getAvatarUrl(playerId)` en `src/lib/utils.ts`.
  - Hash simple: `hash = (hash * 31 + charCode) >>> 0`, luego `hash % 12`.
- **Lobby:** se muestra el avatar circular (42px) junto al alias de cada jugador.
- **Flotantes:** 8 avatares fijos en posiciones absolutas con animación `floatBob` (translateY + rotate infinito), `z-index: 0`, `pointer-events: none`.
  - Se ocultan los últimos 4 en móvil (< 480px) para no saturar.

### 15.7 Pantalla de resultados

- **Ganador:** muestra `src/public/avatar ganador.png` con animación float + título con gradiente animado.
  - Card con borde teal + glow teal.
- **Perdedor:** muestra `src/public/avatar perdedor.png` con borde rojo + glow rojo.
- La determinación ganador/perdedor se hace comparando `currentPlayer.id` contra el array `winners`.
- El historial del cartón se muestra como `<details>` colapsable (no bloquea la pantalla de resultados).
- Sin avatares flotantes en la pantalla de resultados (prop `hideAvatars` en `<Layout>`).

### 15.8 Componentes de UI

- `FloatingAvatars.tsx` — renderiza los 8 avatares flotantes en `position: fixed; z-index: 0`.
- `Layout.tsx` — acepta `hideAvatars?: boolean` para suprimir los flotantes (juego, resultados).
- `Header.tsx` — logo imagen (no texto). Sin emoji.
- Todos los botones globales: `border-radius: full`, Nunito 800 weight.
