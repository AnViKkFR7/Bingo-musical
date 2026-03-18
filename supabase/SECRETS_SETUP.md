# Configuración de secrets en Supabase Edge Functions

## Por qué NO van en .env

Las credenciales de Spotify son **secretos de servidor**, no variables de frontend.

- Las variables `VITE_*` del `.env` son procesadas por Vite y acaban literalmente
  en el bundle JavaScript que descarga el navegador → cualquiera puede verlas.
- Los **Supabase Edge Function Secrets** solo son visibles en el runtime de Deno
  (servidor), nunca en el cliente.

## Cómo configurarlo

### Opción A — CLI de Supabase (recomendado)

```bash
supabase secrets set SPOTIFY_CLIENT_ID=tu_client_id
supabase secrets set SPOTIFY_CLIENT_SECRET=tu_client_secret
```

Para verificar que están bien configurados:
```bash
supabase secrets list
```

### Opción B — Dashboard de Supabase

1. Abre tu proyecto en https://app.supabase.com
2. Ve a **Edge Functions** → **Secrets**
3. Añade:
   - `SPOTIFY_CLIENT_ID` = tu client id de Spotify
   - `SPOTIFY_CLIENT_SECRET` = tu client secret de Spotify

## Desarrollo local con supabase CLI

Crea un fichero `supabase/.env.local` (ya está en .gitignore por defecto):

```bash
SPOTIFY_CLIENT_ID=tu_client_id_aqui
SPOTIFY_CLIENT_SECRET=tu_client_secret_aqui
```

Luego arranca las funciones localmente:
```bash
supabase functions serve --env-file supabase/.env.local
```

## Dónde obtener las credenciales

1. Ve a https://developer.spotify.com/dashboard
2. Crea una aplicación (o usa una existente)
3. En la app verás **Client ID** y **Client Secret**
