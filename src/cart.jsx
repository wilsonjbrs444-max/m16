import { createContext, useContext, useEffect, useState } from 'react'

const Ctx = createContext(null)
export const useCart = () => useContext(Ctx)
const KEY = 'm16-cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
  })
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)) } catch {} }, [items])

  const add = (p, qty = 1) => setItems(cur => {
    const max = p.stock || 99
    const found = cur.find(i => i.id === p.id)
    if (found) return cur.map(i => (i.id === p.id ? { ...i, stock: p.stock, qty: Math.min(i.qty + qty, max) } : i))
    return [...cur, { id: p.id, name: p.name, price: p.price, image: p.images?.[0] || p.image_url || null, stock: p.stock, qty: Math.min(qty, max) }]
  })
  const setQty = (id, qty) => setItems(cur => cur.map(i => (i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock || 99)) } : i)))
  const remove = id => setItems(cur => cur.filter(i => i.id !== id))
  const clear = () => setItems([])
  const count = items.reduce((n, i) => n + i.qty, 0)
  const total = items.reduce((n, i) => n + i.qty * i.price, 0)
  return <Ctx.Provider value={{ items, add, setQty, remove, clear, count, total }}>{children}</Ctx.Provider>
}
