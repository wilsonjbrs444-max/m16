import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { supabase, fcfa, waNumber, waUrl, orderText, orderNo, badgeClass } from '../supabase.js'
import { useAuth } from '../auth.jsx'
import { useWhatsApp } from '../components.jsx'

export default function Order() {
  const { id } = useParams()
  const { user, loading } = useAuth()
  const wa = waNumber(useWhatsApp())
  const [o, setO] = useState(undefined)

  useEffect(() => {
    if (!user) return
    supabase.from('orders').select('*, order_items(*)').eq('id', id).maybeSingle().then(({ data }) => setO(data))
  }, [user, id])

  if (loading || (user && o === undefined)) return <p className="center">Chargement…</p>
  if (!user) return <Navigate to="/login" state={{ from: `/commande/${id}` }} replace />
  if (!o) return <div className="center"><h1>Commande introuvable</h1><Link className="btn" to="/">Retour à la boutique</Link></div>

  const items = o.order_items
  const viaWa = o.payment_method === 'WhatsApp'
  const waHref = wa ? waUrl(wa, orderText(o, items)) : null

  return (
    <div className="done">
      <div className="okc">✓</div>
      <h1>{viaWa ? 'Commande enregistrée' : 'Commande confirmée'}</h1>
      <p className="muted">Merci {o.customer_name}. Numéro de commande : <b>{orderNo(o.number)}</b></p>

      {viaWa && waHref && (
        <section className="panel hl">
          <b>Dernière étape</b>
          <p className="muted">Envoyez votre commande sur WhatsApp : nous la validons avec vous et organisons la livraison.</p>
          <a className="btn wa" style={{ marginTop: 0 }} href={waHref} target="_blank" rel="noopener noreferrer">Envoyer sur WhatsApp</a>
        </section>
      )}

      <section className="panel">
        <h2>Récapitulatif</h2>
        {items.map(i => <div className="row2" key={i.id}><span>{i.qty} × {i.name}</span><b>{fcfa(i.qty * i.price)}</b></div>)}
        <div className="row2 big"><span>Total</span><b>{fcfa(o.total)}</b></div>
        <div className="row2"><span className="muted">Paiement</span><span>{o.payment_method}</span></div>
        <div className="row2"><span className="muted">Statut</span><span className={'badge ' + badgeClass(o.status)}>{o.status}</span></div>
        <div className="row2"><span className="muted">Livraison</span><span style={{ textAlign: 'right' }}>{o.customer_name}<br />{o.phone}<br />{o.address}</span></div>
      </section>

      <div className="row">
        {!viaWa && waHref && <a className="btn wa" style={{ marginTop: 0 }} href={waHref} target="_blank" rel="noopener noreferrer">Envoyer ma commande sur WhatsApp</a>}
        <Link className="btn o" to="/commandes">Mes commandes</Link>
        <Link className="btn o" to="/">Continuer mes achats</Link>
      </div>
    </div>
  )
}
