import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'

export default function Login() {
  const nav = useNavigate()
  const loc = useLocation()
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ email: '', password: '', name: '' })
  const [msg, setMsg] = useState('')
  const set = k => e => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault(); setMsg('')
    const { data, error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email: f.email, password: f.password })
      : await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.name } } })
    if (error) return setMsg(error.message)
    if (mode === 'signup' && !data.session) return setMsg('Compte créé. Confirmez votre e-mail, puis connectez-vous.')
    nav(loc.state?.from || '/')
  }
  return (
    <form className="panel" onSubmit={submit}>
      <h1>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h1>
      {mode === 'signup' && <label>Nom complet<input value={f.name} onChange={set('name')} required /></label>}
      <label>E-mail<input type="email" value={f.email} onChange={set('email')} required /></label>
      <label>Mot de passe<input type="password" minLength={6} value={f.password} onChange={set('password')} required /></label>
      {msg && <p className="msg">{msg}</p>}
      <button className="btn">{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>
      <p className="muted">{mode === 'login' ? 'Pas encore de compte ?' : 'Déjà inscrit ?'}{' '}
        <a href="#" onClick={e => { e.preventDefault(); setMode(mode === 'login' ? 'signup' : 'login') }}>
          {mode === 'login' ? 'Créer un compte' : 'Se connecter'}</a></p>
    </form>)
}
