/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_ADS_ENABLED: string
  readonly VITE_ADSENSE_CLIENT: string
  readonly VITE_ADSENSE_SLOT_HOME_BANNER: string
  readonly VITE_ADSENSE_SLOT_GAME_SIDEBAR: string
  readonly VITE_ADSENSE_SLOT_RESULTS_RECT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
