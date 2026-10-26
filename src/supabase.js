import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const configOk = Boolean(url && key)
export const supabase = configOk ? createClient(url, key) : null
export const fcfa = n => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
export const cover = p => p.images?.[0] || p.image_url || null
export const discount = p => (p.old_price && p.old_price > p.price ? Math.round((1 - p.price / p.old_price) * 100) : 0)
