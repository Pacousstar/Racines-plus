import { createBrowserClient } from '@supabase/ssr'

// Utilitaires de création du client Supabase pour le front-end (navigateur)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
