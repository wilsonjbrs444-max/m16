import { useEffect, useState } from 'react'
import { supabase, fcfa } from '../supabase.js'

const empty = { name: '', specs: '', description: '', price: '', old_price: '', stock: 0, category_id: '', badge: '', featured: false, active: true }

export default function Admin() {
  const [products, setProducts] = useState([])
  const [cats, setCats] = useState([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [file, setFile] = useState(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const [p, c] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name')])
    setProducts(p.data ?? []); setCats(c.data ?? [])
  }
  useEffect(() => { load() }, [])
  const set = k => e => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function save(e) {
    e.preventDefault()
    const el = e.currentTarget
    setBusy(true); setMsg('')
    let image_url = editing?.image_url ?? null
    if (file) {
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const up = await supabase.storage.from('product-images').upload(path, file)
      if (up.error) { setBusy(false); return setMsg(up.error.message) }
      image_url = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
    }
    const row = {
      name: form.name, specs: form.specs, description: form.description,
      price: Number(form.price), old_price: form.old_price ? Number(form.old_price) : null,
      stock: Number(form.stock), category_id: form.category_id ? Number(form.category_id) : null,
      badge: form.badge || null, featured: form.featured, active: form.active, image_url }
    const { error } = editing
      ? await supabase.from('products').update(row).eq('id', editing.id)
      : await supabase.from('products').insert(row)
    setBusy(false)
    if (error) return setMsg(error.message)
    el.reset(); setForm(empty); setEditing(null); setFile(null); setMsg('Article enregistré.'); load()
  }
  function edit(p) {
    setEditing(p); setFile(null); setMsg('')
    setForm({ ...empty, ...p, old_price: p.old_price ?? '', category_id: p.category_id ?? '', badge: p.badge ?? '', specs: p.specs ?? '', description: p.description ?? '' })
    window.scrollTo(0, 0)
  }
  async function remove(p) {
    if (!confirm(`Supprimer « ${p.name} » ?`)) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) setMsg(error.message); else load()
  }

  return (<>
    <h1>Administration</h1>
    <form className="panel" onSubmit={save}>
      <h2>{editing ? 'Modifier l’article' : 'Nouvel article'}</h2>
      <label>Nom<input value={form.name} onChange={set('name')} required /></label>
      <label>Caractéristiques (ex. Ryzen 5 | 8 Go | 512 Go SSD)<input value={form.specs} onChange={set('specs')} /></label>
      <label>Description<textarea rows="3" value={form.description} onChange={set('description')} /></label>
      <div className="row">
        <label>Prix (FCFA)<input type="number" min="0" value={form.price} onChange={set('price')} required /></label>
        <label>Ancien prix (promo)<input type="number" min="0" value={form.old_price} onChange={set('old_price')} /></label>
        <label>Stock<input type="number" min="0" value={form.stock} onChange={set('stock')} required /></label>
      </div>
      <div className="row">
        <label>Catégorie<select value={form.category_id} onChange={set('category_id')}>
          <option value="">—</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Badge (ex. Nouveau, -10 %)<input value={form.badge} onChange={set('badge')} /></label>
      </div>
      <label>Photo{editing?.image_url && ' (vide = garder l’actuelle)'}<input type="file" accept="image/*" onChange={e => setFile(e.target.files[0] ?? null)} /></label>
      <label className="check"><input type="checkbox" checked={form.featured} onChange={set('featured')} /> Mettre en avant</label>
      <label className="check"><input type="checkbox" checked={form.active} onChange={set('active')} /> Visible dans la boutique</label>
      {msg && <p className="msg">{msg}</p>}
      <div className="row">
        <button className="btn" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        {editing && <button type="button" className="btn o" onClick={() => { setEditing(null); setForm(empty); setFile(null) }}>Annuler</button>}
      </div>
    </form>
    <h2>Articles ({products.length})</h2>
    <div className="list">{products.map(p => (
      <div className="item" key={p.id}>
        {p.image_url ? <img src={p.image_url} alt="" /> : <span className="ph" />}
        <div><b>{p.name}</b><div className="muted">{fcfa(p.price)} · stock {p.stock}{!p.active && ' · masqué'}</div></div>
        <button className="btn o" onClick={() => edit(p)}>Modifier</button>
        <button className="btn o danger" onClick={() => remove(p)}>Supprimer</button>
      </div>))}
    </div>
  </>)
}
