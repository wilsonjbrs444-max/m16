import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase, fcfa, orderNo, badgeClass } from '../supabase.js'
import { useAuth } from '../auth.jsx'

export default function Orders() {
  const { user, loading } = useAuth()
  const [list, setList] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setList(data ?? []))
  }, [user])

  if (loading) return <p className="center">Chargement…</p>
  if (!user) return <Navigate to="/login" state={{ from: '/commandes' }} replace />
  if (!list) return <p className="center">Chargement…</p>

  return (<>
    <h1>Mes commandes</h1>
    {list.length === 0 ? (
      <div className="center"><p>Vous n’avez pas encore passé de commande.</p><Link className="btn" to="/">Découvrir la boutique</Link></div>
    ) : (
      <div className="list">{list.map(o => (
        <Link to={`/commande/${o.id}`} className="ord" key={o.id}>
          <div className="top2"><b>{orderNo(o.number)}</b><span className={'badge ' + badgeClass(o.status)}>{o.status}</span></div>
          <div className="muted">{new Date(o.created_at).toLocaleDateString('fr-FR')} · {o.order_items.length} article{o.order_items.length > 1 ? 's' : ''}</div>
          <b>{fcfa(o.total)}</b>
        </Link>))}
      </div>
    )}
  </>)
}
