import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'
const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load(session) {
    const u = session?.user ?? null
    setUser(u)
    if (u) {
      const { data } = await supabase.from('profiles').select('role').eq('id', u.id).single()
      setIsAdmin(data?.role === 'admin')
    } else setIsAdmin(false)
    setLoading(false)
  }
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => load(data.session))
    // setTimeout : évite un blocage connu quand on appelle Supabase dans ce callback
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setTimeout(() => load(s), 0))
    return () => sub.subscription.unsubscribe()
  }, [])
  const signOut = () => supabase.auth.signOut()
  return <Ctx.Provider value={{ user, isAdmin, loading, signOut }}>{children}</Ctx.Provider>
}
