import { useEffect, useState } from 'react'
import { supabase, fcfa } from '../supabase.js'

export default function Home() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        setItems(data ?? [])
      })
  }, [])

  if (!items) return <p className="center">Chargement…</p>
  return (<>
    <h1>Matériel informatique</h1>
    {error && <p className="msg">Impossible de charger les articles : {error}</p>}
    {!error && items.length === 0 && <p className="muted">Aucun article pour l’instant. Ajoutez-en depuis l’espace Administration.</p>}
    <div className="grid">{items.map(p => (
      <article className="card" key={p.id}>
        {p.badge && <span className="tag">{p.badge}</span>}
        {p.image_url && <img src={p.image_url} alt={p.name} />}
        <h3>{p.name}</h3>
        <p className="muted">{p.specs}</p>
        <div><b>{fcfa(p.price)}</b>{p.old_price && <s>{fcfa(p.old_price)}</s>}</div>
      </article>))}
    </div>
  </>)
}
