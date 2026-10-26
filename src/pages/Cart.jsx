import { Link } from 'react-router-dom'
import { fcfa } from '../supabase.js'
import { useCart } from '../cart.jsx'

export default function Cart() {
  const { items, setQty, remove, clear, total } = useCart()
  if (!items.length) return (
    <div className="center"><h1>Votre panier est vide</h1>
      <p className="muted">Parcourez la boutique et ajoutez les articles qui vous plaisent.</p>
      <Link className="btn" to="/">Découvrir la boutique</Link></div>
  )
  return (<>
    <h1>Mon panier</h1>
    <div className="cartwrap">
      <div className="list">
        {items.map(i => (
          <div className="citem" key={i.id}>
            {i.image ? <img src={i.image} alt="" /> : <span className="ph" style={{ width: 80, height: 80 }} />}
            <div>
              <Link to={`/produit/${i.id}`}><b>{i.name}</b></Link>
              <div className="price">{fcfa(i.price)}</div>
              <div className="row" style={{ alignItems: 'center', marginTop: 8 }}>
                <div className="qty">
                  <button onClick={() => setQty(i.id, i.qty - 1)} aria-label="Moins">−</button>
                  <span>{i.qty}</span>
                  <button onClick={() => setQty(i.id, i.qty + 1)} aria-label="Plus">+</button>
                </div>
                <button className="link" onClick={() => remove(i.id)}>Retirer</button>
              </div>
            </div>
          </div>
        ))}
        <button className="link" onClick={clear}>Vider le panier</button>
      </div>
      <aside className="sum">
        <h2>Récapitulatif</h2>
        <div className="row2"><span>Sous-total</span><b>{fcfa(total)}</b></div>
        <div className="row2"><span>Livraison</span><span className="muted">confirmée avec vous</span></div>
        <div className="row2 big"><span>Total</span><b>{fcfa(total)}</b></div>
        <Link className="btn" to="/commande" style={{ width: '100%' }}>Passer la commande</Link>
        <p className="muted" style={{ marginTop: 10 }}>Paiement par Mobile Money, à la livraison ou via WhatsApp.</p>
      </aside>
    </div>
  </>)
}
