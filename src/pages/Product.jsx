import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase, fcfa, discount } from '../supabase.js'
import { useCart } from '../cart.jsx'

export default function Product() {
  const { id } = useParams()
  const nav = useNavigate()
  const { add } = useCart()
  const [p, setP] = useState(undefined)
  const [k, setK] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setK(0); setQty(1); setAdded(false)
    supabase.from('products').select('*').eq('id', id).maybeSingle().then(({ data }) => setP(data))
  }, [id])

  if (p === undefined) return <p className="center">Chargement…</p>
  if (!p) return (
    <div className="center"><h1>Produit introuvable</h1>
      <p className="muted">Il n’existe pas ou n’est plus en vente.</p>
      <Link className="btn" to="/">Retour à la boutique</Link></div>
  )
  const imgs = p.images?.length ? p.images : p.image_url ? [p.image_url] : []
  const off = discount(p)
  const out = p.stock <= 0
  const addIt = () => { add(p, qty); setAdded(true) }

  return (
    <div className="pd">
      <div>
        <div className="main">{imgs[k] ? <img src={imgs[k]} alt={p.name} /> : <span className="noimg">Pas de photo</span>}</div>
        {imgs.length > 1 && (
          <div className="thumbs">
            {imgs.map((u, n) => <button key={u} className={n === k ? 'on' : ''} onClick={() => setK(n)} aria-label={`Photo ${n + 1}`}><img src={u} alt="" /></button>)}
          </div>
        )}
      </div>
      <div>
        <Link to="/" className="muted">← Retour à la boutique</Link>
        <h1>{p.name}</h1>
        {p.specs && <p className="muted">{p.specs}</p>}
        <div className="pprice">{fcfa(p.price)}{off > 0 && <><s>{fcfa(p.old_price)}</s><span className="tag inl">-{off} %</span></>}</div>
        <p className={'stock ' + (out ? 'no' : 'ok')}>{out ? 'Épuisé pour le moment' : p.stock <= 5 ? `Plus que ${p.stock} en stock` : 'En stock'}</p>
        {!out && (
          <div className="qty" aria-label="Quantité">
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Moins">−</button>
            <span>{qty}</span>
            <button onClick={() => setQty(Math.min(p.stock, qty + 1))} aria-label="Plus">+</button>
          </div>
        )}
        <div className="row" style={{ margin: '14px 0' }}>
          <button className="btn" disabled={out} onClick={addIt}>{added ? 'Ajouté ✓' : 'Ajouter au panier'}</button>
          <button className="btn o" disabled={out} onClick={() => { add(p, qty); nav('/panier') }}>Acheter maintenant</button>
        </div>
        {added && <p className="msg">Article ajouté. <Link to="/panier"><u>Voir mon panier</u></Link></p>}
        <ul className="perks">
          <li>Paiement par Mobile Money</li>
          <li>Livraison partout au Cameroun</li>
          <li>Garantie vendeur sur le produit</li>
        </ul>
        {p.description && <><h2>Description</h2><p className="desc">{p.description}</p></>}
      </div>
    </div>
  )
}
