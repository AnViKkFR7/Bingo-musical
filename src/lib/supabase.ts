import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Singleton promise: se resuelve exactamente una vez con el User autenticado.
// Garantiza que nunca se llama a signInAnonymously() más de una vez,
// independientemente de cuántos callers llamen a ensureAuth() en paralelo.
let _authPromise: Promise<import('@supabase/supabase-js').User | null> | null = null

export function ensureAuth(): Promise<import('@supabase/supabase-js').User | null> {
  if (_authPromise) return _authPromise
  _authPromise = (async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session.user
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.warn('[auth] signInAnonymously failed:', error.message)
      return null
    }
    return data.user ?? null
  })()
  return _authPromise
}

// Arrancar la sesión en cuanto se importa el módulo.
ensureAuth()
