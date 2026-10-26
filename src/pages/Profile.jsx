import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useAuth } from '../auth.jsx'

export default function Profile() {
  const { user, isAdmin, loading, signOut } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ full_name: '', phone: '', address: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('full_name,phone,address').eq('id', user.id).maybeSingle()
      .then(({ data }) => data && setF({ full_name: data.full_name ?? '', phone: data.phone ?? '', address: data.address ?? '' }))
  }, [user])

  if (loading) return <p className="center">Chargement…</p>
  if (!user) return <Navigate to="/login" replace />
  const set = k => e => setF({ ...f, [k]: e.target.value })

  async function save(e) {
    e.preventDefault(); setMsg('')
    const { error } = await supabase.rpc('update_my_profile', { p_name: f.full_name, p_phone: f.phone, p_address: f.address })
    setMsg(error ? error.message : 'Profil enregistré.')
  }
  const out = async () => { await signOut(); nav('/') }

  return (<>
    <h1>Mon profil</h1>
    <form className="panel" onSubmit={save}>
      <h2>Mes informations</h2>
      <label>E-mail<input value={user.email} readOnly /></label>
      <label>Nom complet<input value={f.full_name} onChange={set('full_name')} /></label>
      <label>Téléphone (Mobile Money)<input type="tel" value={f.phone} onChange={set('phone')} placeholder="6XX XX XX XX" /></label>
      <label>Adresse de livraison<textarea rows="2" value={f.address} onChange={set('address')} placeholder="Quartier, ville" /></label>
      {msg && <p className="msg">{msg}</p>}
      <button className="btn">Enregistrer</button>
    </form>
    <section className="panel">
      <h2>Session</h2>
      {isAdmin && <p className="muted">Vous êtes connecté avec un compte administrateur.</p>}
      <button className="btn o" onClick={out}>Se déconnecter</button>
    </section>
  </>)
}
