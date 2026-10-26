import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import { Footer, Navbar, WhatsAppFab } from './components.jsx'
import Home from './pages/Home.jsx'
import Product from './pages/Product.jsx'
import Cart from './pages/Cart.jsx'
import Profile from './pages/Profile.jsx'
import Login from './pages/Login.jsx'
import Admin from './pages/Admin.jsx'

// Confort d'affichage uniquement : la vraie protection est dans les règles RLS de la base.
function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return <p className="center">Chargement…</p>
  return isAdmin ? children : <Navigate to="/" replace />
}

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (<>
    <Navbar />
    <main className="wrap">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/produit/:id" element={<Product />} />
        <Route path="/panier" element={<Cart />} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
    <Footer />
    <WhatsAppFab />
  </>)
}
