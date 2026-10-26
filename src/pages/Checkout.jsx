import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase, fcfa, waNumber, waUrl, orderText } from '../supabase.js'
import { useAuth } from '../auth.jsx'
import { useCart } from '../cart.jsx'
import { useWhatsApp } from '../components.jsx'

const METHODS = [
  ['MTN MoMo', 'Payez avec votre compte MTN MoMo'],
  ['Orange Money', 'Payez avec votre compte Orange Money'],
  ['Paiement à la livraison', 'Vous payez à la réception'],
  ['WhatsApp', 'Finalisez votre commande avec nous sur WhatsApp'],
]
const wait = ms => new Promise(r => setTimeout(r, ms))

export default function Checkout() {
  const { user, loading } = useAuth()
  const { items, total, clear } = useCart()
  const nav = useNavigate()
  const wa = waNumber(useWhatsApp())
  const [f, setF] = useState({ name: '', phone: '', address: '' })
  const [method, setMethod] = useState('MTN MoMo')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('full_name,phone,address').eq('id', user.id).maybeSingle()
      .then(({ data }) => data && setF({ name: data.full_name ?? '', phone: data.phone ?? '', address: data.address ?? '' }))
  }, [user])

  if (loading) return <p className="center">Chargement…</p>
  if (!user) return <Navigate to="/login" state={{ from: '/commande' }} replace />
  if (!items.length && !busy) return <Navigate to="/panier" replace />

  const set = k => e => setF({ ...f, [k]: e.target.value })
  const mobile = method === 'MTN MoMo' || method === 'Orange Money'
  const label = method === 'WhatsApp' ? 'Commander sur WhatsApp' : mobile ? `Payer ${fcfa(total)}` : 'Confirmer la commande'

  async function submit(e) {
    e.preventDefault(); setErr('')
    setBusy(mobile ? 'pay' : 'send')
    try {
      if (mobile) await wait(3500)
      const { data, error } = await supabase.rpc('place_order', {
        p_items: items.map(i => ({ id: i.id, qty: i.qty })),
        p_name: f.name, p_phone: f.phone, p_address: f.address, p_method: method })
      if (error) throw error
      clear()
      nav(`/commande/${data.id}`, { replace: true })
    } catch (e2) { setBusy(''); setErr(e2.message) }
  }

  return (<>
    <h1>Finaliser la commande</h1>
    <form className="cartwrap" onSubmit={submit}>
      <div>
        <section className="panel">
          <h2>Livraison</h2>
          <label>Nom complet<input value={f.name} onChange={set('name')} required autoComplete="name" /></label>
          <label>Téléphone (Mobile Money / WhatsApp)<input type="tel" value={f.phone} onChange={set('phone')} required autoComplete="tel" placeholder="6XX XX XX XX" /></label>
          <label>Adresse de livraison<textarea rows="2" value={f.address} onChange={set('address')} required placeholder="Quartier, ville, repère" /></label>
        </section>
        <section className="panel">
          <h2>Paiement</h2>
          {METHODS.filter(m => m[0] !== 'WhatsApp' || wa).map(([m, d]) => (
            <label key={m} className={'pm' + (method === m ? ' on' : '')}>
              <input type="radio" name="pm" checked={method === m} onChange={() => setMethod(m)} />
              <span><b>{m === 'WhatsApp' ? 'Commander via WhatsApp' : m}</b><small>{d}</small></span>
            </label>))}
        </section>
      </div>
      <aside className="sum">
        <h2>Votre commande</h2>
        {items.map(i => <div className="row2" key={i.id}><span>{i.qty} × {i.name}</span><b>{fcfa(i.qty * i.price)}</b></div>)}
        <div className="row2 big"><span>Total</span><b>{fcfa(total)}</b></div>
        {err && <p className="msg" style={{ color: 'var(--hot)', marginBottom: 10 }}>{err}</p>}
        <button className={'btn' + (method === 'WhatsApp' ? ' wa' : '')} style={{ width: '100%', marginTop: 0 }} disabled={!!busy}>{busy === 'send' ? 'Enregistrement…' : label}</button>
        <p className="muted" style={{ marginTop: 10 }}>Livraison confirmée avec vous par téléphone ou WhatsApp.</p>
      </aside>
    </form>
    {busy === 'pay' && (
      <div className="ov" role="alert"><div>
        <div className="spin" />
        <b>Validation du paiement…</b>
        <p className="muted">Un message de confirmation va s’afficher sur votre téléphone. Validez avec votre code secret.</p>
      </div></div>
    )}
  </>)
}
