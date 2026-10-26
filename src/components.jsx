import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import { useCart } from './cart.jsx'
import { cover, discount, fcfa, supabase, waNumber } from './supabase.js'

const P = {
  cart: 'M3 4h2l2.5 11h11L21 7H6M9 20h.01M18 20h.01',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  chat: 'M7.9 20A9 9 0 104 16.1L2 22z',
}
export const Icon = ({ n, s = 22 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n]} /></svg>
)

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth()
  const { count } = useCart()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])
  const search = e => { e.preventDefault(); nav(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/') }
  const out = async () => { setOpen(false); await signOut(); nav('/') }
  return (
    <header className="top"><div className="wrap bar">
      <Link to="/" className="brand">M16 <span>IT</span></Link>
      <form className="search" onSubmit={search}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un produit…" aria-label="Rechercher un produit" />
        <button aria-label="Lancer la recherche"><Icon n="search" s={20} /></button>
      </form>
      <div className="acts">
        <Link to="/" className="ib" aria-label="Accueil"><Icon n="home" /></Link>
        <Link to="/panier" className="ib" aria-label={`Panier, ${count} article${count > 1 ? 's' : ''}`}>
          <Icon n="cart" />{count > 0 && <em>{count}</em>}
        </Link>
        {user ? (
          <div className="menu" ref={ref}>
            <button className="ib" onClick={() => setOpen(!open)} aria-label="Mon compte" aria-expanded={open}><Icon n="user" /></button>
            {open && (
              <div className="drop">
                <Link to="/profil" onClick={() => setOpen(false)}>Mon profil</Link>
                <Link to="/panier" onClick={() => setOpen(false)}>Mon panier</Link>
                {isAdmin && <Link to="/admin" onClick={() => setOpen(false)}>Administration</Link>}
                <button onClick={out}>Se déconnecter</button>
              </div>
            )}
          </div>
        ) : <Link to="/login" className="btn sm">Connexion</Link>}
      </div>
    </div></header>
  )
}

export function Carousel({ banners }) {
  const [i, setI] = useState(0)
  const nav = useNavigate()
  useEffect(() => {
    if (banners.length < 2) return
    const t = setInterval(() => setI(x => (x + 1) % banners.length), 5000)
    return () => clearInterval(t)
  }, [banners.length])
  if (!banners.length) return null
  const go = b => b.product_id && nav(`/produit/${b.product_id}`)
  return (
    <section className="hero" aria-roledescription="carrousel" aria-label="Offres du moment">
      <div className="slides" style={{ transform: `translateX(-${i * 100}%)` }}>
        {banners.map(b => (
          <div className="slide" key={b.id} onClick={() => go(b)} role={b.product_id ? 'link' : undefined}
            tabIndex={b.product_id ? 0 : undefined} onKeyDown={e => e.key === 'Enter' && go(b)}
            style={{ cursor: b.product_id ? 'pointer' : 'default' }}>
            {b.image_url && <img src={b.image_url} alt="" />}
            {b.show_text !== false && (
              <div className="cap">
                <h2>{b.title}</h2>
                {b.subtitle && <p>{b.subtitle}</p>}
                {b.product_id && <span className="btn sm light">Voir le produit</span>}
              </div>
            )}
          </div>
        ))}
      </div>
      {banners.length > 1 && (
        <div className="dots">
          {banners.map((b, k) => <button key={b.id} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Bannière ${k + 1}`} />)}
        </div>
      )}
    </section>
  )
}

export function ProductCard({ p }) {
  const { add } = useCart()
  const [done, setDone] = useState(false)
  const img = cover(p)
  const off = discount(p)
  const addIt = e => { e.preventDefault(); add(p); setDone(true); setTimeout(() => setDone(false), 1200) }
  return (
    <Link to={`/produit/${p.id}`} className="card">
      <div className="pic">
        {img ? <img src={img} alt={p.name} loading="lazy" /> : <span className="noimg">Pas de photo</span>}
        {(off > 0 || p.badge) && <span className="tag">{off > 0 ? `-${off} %` : p.badge}</span>}
        {p.stock <= 0 && <span className="out">Épuisé</span>}
      </div>
      <h3>{p.name}</h3>
      {p.specs && <p className="muted">{p.specs}</p>}
      <div className="buy">
        <div className="price">{fcfa(p.price)}{off > 0 && <s>{fcfa(p.old_price)}</s>}</div>
        <button className="add" disabled={p.stock <= 0} onClick={addIt} aria-label={`Ajouter ${p.name} au panier`}>
          {done ? '✓' : <Icon n="cart" s={18} />}
        </button>
      </div>
    </Link>
  )
}

export function useWhatsApp() {
  const [n, setN] = useState('')
  useEffect(() => {
    const load = () => supabase.from('site_settings').select('value').eq('key', 'whatsapp').maybeSingle().then(({ data }) => setN(data?.value ?? ''))
    load()
    window.addEventListener('wa-changed', load)
    return () => window.removeEventListener('wa-changed', load)
  }, [])
  return n
}

export function WhatsAppFab() {
  const wa = waNumber(useWhatsApp())
  const { pathname } = useLocation()
  if (!wa || pathname.startsWith('/admin')) return null
  return (
    <a className="fab" href={`https://wa.me/${wa}?text=${encodeURIComponent('Bonjour M16 IT, j’ai une question.')}`}
      target="_blank" rel="noopener noreferrer" aria-label="Écrire sur WhatsApp"><Icon n="chat" s={26} /></a>
  )
}

export function Footer() {
  const wa = waNumber(useWhatsApp())
  return (
    <footer className="foot"><div className="wrap">
      <b>M16 <span>IT</span></b>
      <p>Matériel informatique pour les étudiants et les professionnels de l’IT. Paiement par Mobile Money, livraison au Cameroun.</p>
      {wa && <a className="btn wa sm" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">Nous écrire sur WhatsApp</a>}
    </div></footer>
  )
}
