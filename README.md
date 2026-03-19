# 🎵 Bingo Musical

> El bingo que suena. Juega con tus amigos usando las canciones que más escucháis.

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Supabase-blue)
![Licencia](https://img.shields.io/badge/licencia-MIT-green)

---

## ¿Qué es?

**Bingo Musical** es una webapp multijugador en tiempo real donde los jugadores rellenan un cartón con canciones. Un DJ pone la música y los jugadores marcan las canciones que reconocen. El primero en completar una línea o el cartón entero, ¡gana!

No hace falta cuenta de Spotify ni registro de ningún tipo para jugar.

---

## Características

- 🎲 **Multisala** — varias partidas activas simultáneamente, cada una con su código único
- 🎧 **Playlists de Spotify** — busca cualquier playlist pública o pega el enlace directamente
- 📋 **Playlists destacadas** — Top 50 Global, Rock Classics, All Out 80s/90s/00s y más
- 🔊 **Audio desde Deezer** — previsualizaciones de 30s obtenidas en tiempo real, sin caducar
- 🟩 **Cartones en 3×3, 4×4 o 5×5** — tú eliges la dificultad
- ⚡ **Tiempo real** — sincronización instantánea entre el DJ y los jugadores vía Supabase Realtime
- 👤 **Sin registro** — los jugadores entran solo con un alias
- 🌍 **5 idiomas** — español, inglés, catalán, francés e italiano

---

## Cómo funciona

```
1. El host crea una partida y elige una playlist de Spotify
2. Comparte el código de 6 caracteres con los jugadores
3. Cada jugador entra con su alias y recibe un cartón único
4. El host avanza canción a canción. En los primeros 10 segundos no se muestra info —
   solo suena la música para dar ventaja a quien la reconozca en el cartón
5. Los jugadores hacen clic en las canciones que reconocen en su cartón
6. ¡Línea o bingo y a celebrarlo!
```

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Estilos | CSS Modules |
| Backend / DB | Supabase (PostgreSQL + Realtime + Edge Functions) |
| Metadatos musicales | Spotify Web API (Client Credentials) |
| Audio previews | Deezer API (sin autenticación) |
| i18n | i18next + react-i18next |
| Estado global | Zustand |

---

## Arquitectura de audio

Las playlists y sus metadatos (portada, título, artistas) se obtienen de la **API de Spotify** mediante el flujo *Client Credentials* — sin que ningún usuario tenga que iniciar sesión.

Las **previsualizaciones de audio (MP3 30s)** se obtienen de **Deezer** a través de una Edge Function propia (`deezer-get-preview`). Deezer no requiere autenticación para búsquedas públicas. La URL se solicita justo en el momento de reproducir, por lo que nunca caduca. Solo el dispositivo del DJ escucha el audio; los jugadores ven la info de la canción en su pantalla.

## Comportamiento del cartón

- Todas las canciones son visibles desde el inicio (sin blur ni bloqueo).
- El jugador **hace clic** en una canción para marcarla. La celda gira con animación 3D mostrando un ✓.
- No hay marcado automático — si el jugador no clica a tiempo, pierde la oportunidad.
- En móvil, el cartón se limita a 3 columnas máximo.

### Variables de entorno necesarias

```bash
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Anuncios (opcional, false por defecto en desarrollo)
VITE_ADS_ENABLED=false
VITE_ADSENSE_CLIENT=

# En Supabase Edge Functions (nunca en el frontend)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
# Deezer no necesita credenciales
```

### Base de datos

1. Ejecuta `bingo_musical_schema.sql` en el SQL Editor de tu proyecto de Supabase.
2. Ejecuta `supabase/seed_playlists.sql` para cargar las playlists destacadas.

---

## Estructura del proyecto

```
src/
├── components/      # Componentes React (game, lobby, playlist, ui, ads)
├── hooks/           # Hooks de Supabase Realtime + lógica de juego
├── i18n/            # Traducciones (es, en, ca, fr, it)
├── lib/             # Cliente Supabase y utilidades
├── pages/           # Páginas de la app
├── store/           # Estado global con Zustand
└── types/           # Tipos TypeScript

supabase/
├── functions/
│   ├── spotify-search/                  # Busca playlists públicas en Spotify
│   ├── spotify-get-playlist-tracks/      # Obtiene tracks de una playlist
│   └── deezer-get-preview/               # Obtiene URL de preview MP3 de Deezer
└── seed_playlists.sql                    # Playlists destacadas predefinidas
```

---

## Licencia

Código no reutilizable por otros
