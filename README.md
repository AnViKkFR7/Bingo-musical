# 🎵 Bingo Musical

> El bingo que suena. Juega con tus amigos usando las canciones que más escucháis.

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Supabase-blue)
![Licencia](https://img.shields.io/badge/licencia-MIT-green)

---

## ¿Qué es?

**Bingo Musical** es una webapp multijugador en tiempo real donde los jugadores rellenan cartones con canciones de Spotify. Un DJ reproduce previsualizaciones de 30 segundos y los jugadores marcan las canciones que reconocen en su cartón. El primero en completar una línea o el cartón entero, ¡gana!

No hace falta cuenta de Spotify ni registro de ningún tipo para jugar.

---

## Características

- 🎲 **Multisala** — varias partidas activas simultáneamente, cada una con su código único
- 🎧 **Integración con Spotify** — busca cualquier playlist pública o pega el enlace directamente
- 📋 **Playlists preestablecidas** — Top 50 España, Top 50 Global, Rock Classics, All Out 80s/90s/00s y más
- 🟩 **Cartones en 3×3, 4×4 o 5×5** — tú eliges la dificultad
- ⚡ **Tiempo real** — el cartón se actualiza instantáneamente vía Supabase Realtime
- 👤 **Sin registro** — los jugadores entran solo con un alias
- 🌍 **5 idiomas** — español, inglés, catalán, francés e italiano

---

## Cómo funciona

```
1. El host crea una partida y elige una playlist de Spotify
2. Comparte el código de 6 caracteres con los jugadores
3. Cada jugador entra con su alias y recibe un cartón único
4. El host reproduce canciones una a una (previsualizaciones de 30s)
5. Los jugadores marcan las canciones que reconocen
6. ¡Línea o bingo y a celebrarlo!
```

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Estilos | Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + Realtime + Edge Functions) |
| Música | Spotify Web API (Client Credentials) |
| i18n | i18next + react-i18next |
| Estado global | Zustand |

---

## Arquitectura destacada

Las canciones de Spotify **no se cachean** en base de datos. Cada partida obtiene las tracks en tiempo real desde la API de Spotify en el momento de iniciar, garantizando que playlists dinámicas como el Top 50 estén siempre actualizadas y que los previews de audio nunca estén caducados.


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
```

### Base de datos

Ejecuta el archivo `bingo_musical_schema.sql` en el SQL Editor de tu proyecto de Supabase.

---

## Estructura del proyecto

```
src/
├── components/      # Componentes React (game, lobby, playlist, ui, ads)
├── hooks/           # Hooks de Supabase Realtime
├── i18n/            # Traducciones (es, en, ca, fr, it)
├── lib/             # Cliente Supabase y utilidades
├── pages/           # Páginas de la app
├── store/           # Estado global con Zustand
└── types/           # Tipos TypeScript

supabase/
└── functions/       # Edge Functions (spotify-search, spotify-get-playlist-tracks)
```

---

## Licencia

Código no reutilizable por otros
