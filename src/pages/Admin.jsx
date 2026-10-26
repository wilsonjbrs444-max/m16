import { useEffect, useState } from 'react'
import { supabase, fcfa, cover, waNumber, orderNo } from '../supabase.js'

// Réduit les photos (téléphone = plusieurs Mo) pour un site rapide.
async function compress(file, max = 1400) {
  try {
    const bmp = await createImageBitmap(file)
    const r = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * r); c.height = Math.round(bmp.height * r)
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
    ctx.drawImage(bmp, 0, 0, c.width, c.height)
    const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.85))
    return blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : file
  } catch { return file }
}
async function upload(file) {
  const f = await compress(file)
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`
  const { error } = await supabase.storage.from('product-images').upload(path, f, { contentType: f.type })
  if (error) throw error
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
}

const emptyP = { name: '', specs: '', description: '', price: '', old_price: '', stock: 0, category_id: '', badge: '', featured: false, active: true }

function Products() {
  const [list, setList] = useState([])
  const [cats, setCats] = useState([])
  const [form, setForm] = useState(emptyP)
  const [editing, setEditing] = useState(null)
  const [kept, setKept] = useState([])
  const [files, setFiles] = useState([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const [p, c] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name')])
    setList(p.data ?? []); setCats(c.data ?? [])
  }
  useEffect(() => { load() }, [])
  const set = k => e => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const reset = () => { setForm(emptyP); setEditing(null); setKept([]); setFiles([]) }

  async function save(e) {
    e.preventDefault()
    const el = e.currentTarget
    setBusy(true); setMsg('')
    try {
      const added = []
      for (const f of files) added.push(await upload(f))
      const images = [...kept, ...added]
      const row = {
        name: form.name, specs: form.specs, description: form.description,
        price: Number(form.price), old_price: form.old_price ? Number(form.old_price) : null,
        stock: Number(form.stock), category_id: form.category_id ? Number(form.category_id) : null,
        badge: form.badge || null, featured: form.featured, active: form.active,
        images, image_url: images[0] ?? null }
      const { error } = editing
        ? await supabase.from('products').update(row).eq('id', editing.id)
        : await supabase.from('products').insert(row)
      if (error) throw error
      el.reset(); reset(); setMsg('Article enregistré.'); load()
    } catch (err) { setMsg(err.message) }
    setBusy(false)
  }
  function edit(p) {
    setEditing(p); setMsg(''); setFiles([])
    setForm({ ...emptyP, ...p, old_price: p.old_price ?? '', category_id: p.category_id ?? '', badge: p.badge ?? '', specs: p.specs ?? '', description: p.description ?? '' })
    setKept(p.images?.length ? p.images : p.image_url ? [p.image_url] : [])
    window.scrollTo(0, 0)
  }
  async function remove(p) {
    if (!confirm(`Supprimer « ${p.name} » ?`)) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) setMsg(error.message); else load()
  }

  return (<>
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
        <label>Badge (ex. Nouveau)<input value={form.badge} onChange={set('badge')} /></label>
      </div>
      <label>Photos (plusieurs possibles)
        <input type="file" accept="image/*" multiple onChange={e => setFiles([...e.target.files])} />
      </label>
      {files.length > 0 && <p className="muted">{files.length} nouvelle(s) photo(s) à envoyer.</p>}
      {kept.length > 0 && (<>
        <p className="muted">Photos actuelles : touchez une photo pour en faire la couverture, × pour la retirer.</p>
        <div className="ad">{kept.map((u, n) => (
          <div key={u} className={'t' + (n === 0 ? ' cov' : '')}>
            <img src={u} alt="" onClick={() => setKept([u, ...kept.filter(x => x !== u)])} />
            <button type="button" onClick={() => setKept(kept.filter(x => x !== u))} aria-label="Retirer">×</button>
          </div>))}
        </div>
      </>)}
      <label className="check"><input type="checkbox" checked={form.featured} onChange={set('featured')} /> Mettre en avant</label>
      <label className="check"><input type="checkbox" checked={form.active} onChange={set('active')} /> Visible dans la boutique</label>
      {msg && <p className="msg">{msg}</p>}
      <div className="row">
        <button className="btn" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        {editing && <button type="button" className="btn o" onClick={reset}>Annuler</button>}
      </div>
    </form>
    <h2>Articles ({list.length})</h2>
    <div className="list">{list.map(p => (
      <div className="item" key={p.id}>
        {cover(p) ? <img src={cover(p)} alt="" /> : <span className="ph" />}
        <div><b>{p.name}</b><div className="muted">{fcfa(p.price)} · stock {p.stock}{!p.active && ' · masqué'}</div></div>
        <button className="btn o sm" onClick={() => edit(p)}>Modifier</button>
        <button className="btn o sm danger" onClick={() => remove(p)}>Supprimer</button>
      </div>))}
    </div>
  </>)
}

const emptyB = { title: '', subtitle: '', product_id: '', position: 0, active: true, show_text: true }

function Banners() {
  const [list, setList] = useState([])
  const [prods, setProds] = useState([])
  const [form, setForm] = useState(emptyB)
  const [editing, setEditing] = useState(null)
  const [file, setFile] = useState(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const [b, p] = await Promise.all([
      supabase.from('banners').select('*').order('position'),
      supabase.from('products').select('id,name').order('name')])
    setList(b.data ?? []); setProds(p.data ?? [])
  }
  useEffect(() => { load() }, [])
  const set = k => e => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const reset = () => { setForm(emptyB); setEditing(null); setFile(null) }

  async function save(e) {
    e.preventDefault()
    const el = e.currentTarget
    setBusy(true); setMsg('')
    try {
      let image_url = editing?.image_url ?? null
      if (file) image_url = await upload(file)
      if (!image_url) throw new Error('Ajoutez une image pour la bannière.')
      const row = { title: form.title, subtitle: form.subtitle || null, product_id: form.product_id || null, position: Number(form.position), active: form.active, show_text: form.show_text, image_url }
      const { error } = editing
        ? await supabase.from('banners').update(row).eq('id', editing.id)
        : await supabase.from('banners').insert(row)
      if (error) throw error
      el.reset(); reset(); setMsg('Bannière enregistrée.'); load()
    } catch (err) { setMsg(err.message) }
    setBusy(false)
  }
  function edit(b) {
    setEditing(b); setFile(null); setMsg('')
    setForm({ title: b.title, subtitle: b.subtitle ?? '', product_id: b.product_id ?? '', position: b.position, active: b.active, show_text: b.show_text !== false })
    window.scrollTo(0, 0)
  }
  async function remove(b) {
    if (!confirm(`Supprimer la bannière « ${b.title} » ?`)) return
    const { error } = await supabase.from('banners').delete().eq('id', b.id)
    if (error) setMsg(error.message); else load()
  }

  return (<>
    <form className="panel" onSubmit={save}>
      <h2>{editing ? 'Modifier la bannière' : 'Nouvelle bannière'}</h2>
      <label>Titre (nom de la bannière)<input value={form.title} onChange={set('title')} required /></label>
      <label>Sous-titre (optionnel)<input value={form.subtitle} onChange={set('subtitle')} /></label>
      <label>Produit à ouvrir au clic<select value={form.product_id} onChange={set('product_id')}>
        <option value="">Aucun lien</option>{prods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Image (format large conseillé, environ 1600 × 600)
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0] ?? null)} /></label>
      {editing?.image_url && !file && <img src={editing.image_url} alt="" style={{ maxHeight: 90, borderRadius: 8 }} />}
      <div className="row">
        <label>Ordre d’affichage<input type="number" value={form.position} onChange={set('position')} /></label>
        <label className="check"><input type="checkbox" checked={form.active} onChange={set('active')} /> Affichée</label>
        <label className="check"><input type="checkbox" checked={form.show_text} onChange={set('show_text')} /> Écrire le titre sur l’image</label>
      </div>
      {msg && <p className="msg">{msg}</p>}
      <div className="row">
        <button className="btn" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        {editing && <button type="button" className="btn o" onClick={reset}>Annuler</button>}
      </div>
    </form>
    <h2>Bannières ({list.length})</h2>
    <div className="list">{list.map(b => (
      <div className="item" key={b.id}>
        {b.image_url ? <img src={b.image_url} alt="" /> : <span className="ph" />}
        <div><b>{b.title}</b><div className="muted">Ordre {b.position}{!b.active && ' · masquée'}</div></div>
        <button className="btn o sm" onClick={() => edit(b)}>Modifier</button>
        <button className="btn o sm danger" onClick={() => remove(b)}>Supprimer</button>
      </div>))}
    </div>
  </>)
}

function Settings() {
  const [wa, setWa] = useState('')
  const [msg, setMsg] = useState('')
  useEffect(() => { supabase.from('site_settings').select('value').eq('key', 'whatsapp').maybeSingle().then(({ data }) => setWa(data?.value ?? '')) }, [])
  async function save(e) {
    e.preventDefault(); setMsg('')
    const { error } = await supabase.from('site_settings').upsert({ key: 'whatsapp', value: waNumber(wa) })
    if (!error) window.dispatchEvent(new Event('wa-changed'))
    setMsg(error ? error.message : 'Numéro enregistré.')
  }
  return (
    <form className="panel" onSubmit={save}>
      <h2>Contact WhatsApp</h2>
      <label>Ton numéro WhatsApp (ex. 6XX XX XX XX)<input type="tel" value={wa} onChange={e => setWa(e.target.value)} /></label>
      <p className="muted">Le bouton WhatsApp du site et celui des fiches produit ouvriront une conversation avec ce numéro. Laisse vide pour les masquer.</p>
      {msg && <p className="msg">{msg}</p>}
      <button className="btn">Enregistrer</button>
    </form>
  )
}

const STATUSES = ['En attente', 'Payée', 'Expédiée', 'Livrée', 'Annulée']

function AdminOrders() {
  const [list, setList] = useState([])
  const [msg, setMsg] = useState('')
  const load = () => supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).then(({ data }) => setList(data ?? []))
  useEffect(() => { load() }, [])
  async function setStatus(o, status) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', o.id)
    if (error) setMsg(error.message); else { setMsg(''); load() }
  }
  return (<>
    <h2>Commandes ({list.length})</h2>
    {msg && <p className="msg">{msg}</p>}
    {list.length === 0 && <p className="muted">Aucune commande pour l’instant.</p>}
    <div className="list">{list.map(o => (
      <div className="ord" key={o.id}>
        <div className="top2"><b>{orderNo(o.number)}</b><span className="muted">{new Date(o.created_at).toLocaleString('fr-FR')}</span></div>
        <div>{o.customer_name} · <a href={`tel:${o.phone}`}><u>{o.phone}</u></a></div>
        <div className="muted">{o.address} · {o.payment_method}</div>
        <ul className="lines">{o.order_items.map(i => <li key={i.id}>{i.qty} × {i.name}</li>)}</ul>
        <div className="row" style={{ alignItems: 'center' }}>
          <b>{fcfa(o.total)}</b>
          <select value={o.status} onChange={e => setStatus(o, e.target.value)} aria-label="Statut de la commande">
            {STATUSES.map(s => <option key={s}>{s}</option>)}</select>
        </div>
      </div>))}
    </div>
  </>)
}

export default function Admin() {
  const [tab, setTab] = useState('articles')
  return (<>
    <h1>Administration</h1>
    <div className="tabs">
      <button className={tab === 'articles' ? 'on' : ''} onClick={() => setTab('articles')}>Articles</button>
      <button className={tab === 'bannieres' ? 'on' : ''} onClick={() => setTab('bannieres')}>Bannières</button>
      <button className={tab === 'commandes' ? 'on' : ''} onClick={() => setTab('commandes')}>Commandes</button>
      <button className={tab === 'reglages' ? 'on' : ''} onClick={() => setTab('reglages')}>Réglages</button>
    </div>
    {tab === 'articles' ? <Products /> : tab === 'bannieres' ? <Banners /> : tab === 'commandes' ? <AdminOrders /> : <Settings />}
  </>)
}
