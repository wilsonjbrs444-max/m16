import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { Carousel, ProductCard } from '../components.jsx'

export default function Home() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const cat = params.get('cat') || ''
  const tri = params.get('tri') || ''
  const [products, setProducts] = useState(null)
  const [cats, setCats] = useState([])
  const [banners, setBanners] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCats(data ?? []))
    supabase.from('banners').select('*').eq('active', true).order('position').then(({ data }) => setBanners(data ?? []))
    supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: false })
      .then(({ data, error }) => { if (error) setError(error.message); setProducts(data ?? []) })
  }, [])

  const setParam = (k, v) => { const n = new URLSearchParams(params); v ? n.set(k, v) : n.delete(k); setParams(n) }
  if (!products) return <p className="center">Chargement…</p>

  const s = q.toLowerCase()
  const shown = products
    .filter(p => (!cat || String(p.category_id) === cat) && (!s || `${p.name} ${p.specs ?? ''} ${p.description ?? ''}`.toLowerCase().includes(s)))
    .sort((a, b) => (tri === 'asc' ? a.price - b.price : tri === 'desc' ? b.price - a.price : 0))

  return (<>
    {banners.length > 0 ? <Carousel banners={banners} /> : (
      <section className="welcome"><h1>Votre matériel IT, au meilleur prix.</h1>
        <p>Ordinateurs, composants, périphériques et accessoires pour vos études et vos projets.</p></section>
    )}
    <div className="chips" role="tablist" aria-label="Catégories">
      <button className={'chip' + (!cat ? ' on' : '')} onClick={() => setParam('cat', '')}>Tout</button>
      {cats.map(c => <button key={c.id} className={'chip' + (cat === String(c.id) ? ' on' : '')} onClick={() => setParam('cat', String(c.id))}>{c.name}</button>)}
    </div>

    <div className="bar2">
      <h2>{q ? `Résultats pour « ${q} »` : 'Nos produits'} <span className="muted">({shown.length})</span></h2>
      <select value={tri} onChange={e => setParam('tri', e.target.value)} aria-label="Trier">
        <option value="">Nouveautés</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option>
      </select>
    </div>

    {error && <p className="msg">Impossible de charger les articles : {error}</p>}
    {shown.length === 0 && !error ? (
      <div className="center">
        <p>{products.length === 0 ? 'Aucun article pour l’instant. Revenez bientôt !' : 'Aucun produit ne correspond à votre recherche.'}</p>
        {products.length > 0 && <button className="btn o" onClick={() => setParams({})}>Réinitialiser les filtres</button>}
      </div>
    ) : <div className="grid">{shown.map(p => <ProductCard key={p.id} p={p} />)}</div>}

  </>)
}
