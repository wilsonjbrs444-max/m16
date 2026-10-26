import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const configOk = Boolean(url && key)
export const supabase = configOk ? createClient(url, key) : null
export const fcfa = n => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
export const cover = p => p.images?.[0] || p.image_url || null
export const discount = p => (p.old_price && p.old_price > p.price ? Math.round((1 - p.price / p.old_price) * 100) : 0)
export const waNumber = raw => { const d = (raw || '').replace(/\D/g, ''); return d.length === 9 ? '237' + d : d }
export const orderNo = n => 'M16-' + String(n).padStart(5, '0')
export const waUrl = (wa, text) => `https://wa.me/${wa}?text=${encodeURIComponent(text)}`
export const badgeClass = s => ({ 'Payée': 'ok', 'Livrée': 'ok', 'Expédiée': 'blue', 'Annulée': 'no' }[s] || '')
export const orderText = (o, items) => [
  `Bonjour M16 IT, voici ma commande ${orderNo(o.number)} :`,
  ...items.map(i => `• ${i.qty} × ${i.name} — ${fcfa(i.price * i.qty)}`),
  `Total : ${fcfa(o.total)}`,
  `Nom : ${o.customer_name}`, `Téléphone : ${o.phone}`, `Adresse : ${o.address}`, `Paiement : ${o.payment_method}`,
].join('\n')
