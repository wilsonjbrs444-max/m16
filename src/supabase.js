import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Si les variables manquent (ex. oubliées sur Vercel), on évite la page blanche :
// main.jsx affichera un message clair au lieu de planter.
export const configOk = Boolean(url && key)
export const supabase = configOk ? createClient(url, key) : null
export const fcfa = n => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
