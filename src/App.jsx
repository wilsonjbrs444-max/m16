import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Admin from './pages/Admin.jsx'

// Confort d'affichage uniquement : la vraie protection est dans les règles RLS de la base.
function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return <p className="center">Chargement…</p>
  return isAdmin ? children : <Navigate to="/" replace />
}

export default function App() {
  const { user, isAdmin, signOut } = useAuth()
  return (<>
    <header className="top"><div className="wrap bar">
      <Link to="/" className="brand">M16 <span>IT</span></Link>
      <nav>
        <Link to="/">Boutique</Link>
        {isAdmin && <Link to="/admin">Administration</Link>}
        {user ? <button onClick={signOut}>Déconnexion</button> : <Link to="/login">Connexion</Link>}
      </nav>
    </div></header>
    <main className="wrap">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  </>)
}
