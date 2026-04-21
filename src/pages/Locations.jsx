import { useEffect, useState } from 'react'
import { Plus, Save, Trash2, MapPin, X } from 'lucide-react'
import { getLocations, upsertLocation, deleteLocation } from '../lib/db.js'

const EMPTY = { name: '', km: '', drive_hours: '' }

export default function Locations() {
  const [locations, setLocations] = useState([])
  const [form, setForm]     = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = () => getLocations().then(({ data }) => setLocations(data || []))
  useEffect(() => { load() }, [])

  const startEdit = (loc) => {
    setEditId(loc.id)
    setForm({ name: loc.name, km: loc.km||'', drive_hours: loc.drive_hours||'' })
  }
  const cancelEdit = () => { setEditId(null); setForm(EMPTY) }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      ...(editId ? { id: editId } : {}),
      name: form.name.trim(),
      km: form.km ? parseFloat(form.km) : null,
      drive_hours: form.drive_hours ? parseFloat(form.drive_hours) : null,
    }
    await upsertLocation(payload)
    setSaving(false); cancelEdit(); load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Διαγραφή τοποθεσίας;')) return
    await deleteLocation(id); load()
  }

  const filtered = locations.filter(l => l.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <div className="page-title">Τοποθεσίες</div>
          <div className="page-sub">{locations.length} τοποθεσίες</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm(EMPTY) }}>
          <Plus size={15} /> Νέα Τοποθεσία
        </button>
      </div>

      {/* Add/Edit form */}
      {editId && (
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: 'var(--c-text2)', fontSize: 12, textTransform: 'uppercase', letterSpacing:'0.05em' }}>
            {editId === 'new' ? '+ Νέα Τοποθεσία' : 'Επεξεργασία'}
          </div>
          <div className="form-row" style={{ gridTemplateColumns: '2fr 1fr 1fr auto' }}>
            <div className="form-group">
              <label className="form-label">Όνομα *</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                     placeholder="π.χ. 2250 Κοζάνη" />
            </div>
            <div className="form-group">
              <label className="form-label">Χιλιόμετρα</label>
              <input type="number" step="0.5" value={form.km}
                     onChange={e => setForm(f => ({...f, km: e.target.value}))} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Ώρες Οδήγησης</label>
              <input type="number" step="0.5" value={form.drive_hours}
                     onChange={e => setForm(f => ({...f, drive_hours: e.target.value}))} placeholder="0" />
            </div>
            <div className="form-group" style={{ justifyContent:'flex-end' }}>
              <label className="form-label">&nbsp;</label>
              <div style={{ display:'flex', gap:6 }}>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                  <Save size={13} />
                </button>
                <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>
                  <X size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <input style={{ width:'100%', marginBottom:12 }}
             placeholder="Αναζήτηση τοποθεσίας…"
             value={search} onChange={e => setSearch(e.target.value)} />

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow:'hidden' }}>
        <table>
          <thead>
            <tr>
              <th><MapPin size={12} style={{marginRight:4}} />Τοποθεσία</th>
              <th>Χιλιόμετρα</th>
              <th>Ώρες Οδήγησης</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id}>
                <td style={{ fontWeight: 500 }}>{l.name}</td>
                <td>{l.km ? `${l.km} km` : <span style={{color:'var(--c-text3)'}}>—</span>}</td>
                <td>{l.drive_hours ? `${l.drive_hours}ω` : <span style={{color:'var(--c-text3)'}}>—</span>}</td>
                <td>
                  <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => startEdit(l)}>
                      ✎
                    </button>
                    <button className="btn btn-sm btn-icon"
                            style={{ background:'rgba(239,68,68,0.1)', color:'#EF4444' }}
                            onClick={() => handleDelete(l.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
