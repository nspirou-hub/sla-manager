import { useEffect, useState } from 'react'
import { Save, RefreshCw } from 'lucide-react'
import { getSettings, saveSettings } from '../lib/db.js'
import { supabase } from '../supabase.js'

export default function Settings() {
  const [settings, setSettings] = useState({ hourly_rate: 20, km_rate: 0.3, drive_hourly: 20 })
  const [clients, setClients]   = useState([])
  const [newClient, setNewClient] = useState('')
  const [types, setTypes]       = useState([])
  const [newType, setNewType]   = useState('')
  const [saved, setSaved]       = useState(false)
  const [loading, setLoading]   = useState(true)

  const load = async () => {
    const [s, { data: c }, { data: t }] = await Promise.all([
      getSettings(),
      supabase.from('clients').select('*').order('name'),
      supabase.from('task_types').select('*').order('name'),
    ])
    setSettings(s); setClients(c||[]); setTypes(t||[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    await saveSettings(settings)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const addClient = async () => {
    if (!newClient.trim()) return
    await supabase.from('clients').insert([{ name: newClient.trim() }])
    setNewClient(''); load()
  }
  const delClient = async (id) => {
    if (!confirm('Διαγραφή πελάτη;')) return
    await supabase.from('clients').delete().eq('id', id); load()
  }

  const addType = async () => {
    if (!newType.trim()) return
    await supabase.from('task_types').insert([{ name: newType.trim() }])
    setNewType(''); load()
  }
  const delType = async (id) => {
    if (!confirm('Διαγραφή τύπου εργασίας;')) return
    await supabase.from('task_types').delete().eq('id', id); load()
  }

  if (loading) return <div style={{display:'flex',justifyContent:'center',paddingTop:60}}><div className="spinner"/></div>

  const s = (k, v) => setSettings(p => ({ ...p, [k]: v }))

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <div>
          <div className="page-title">Ρυθμίσεις</div>
          <div className="page-sub">Παράμετροι κοστολόγησης & λίστες</div>
        </div>
      </div>

      {/* Costing */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 16, color: 'var(--c-text)', fontSize: 14 }}>
          💰 Παράμετροι Κοστολόγησης
        </div>
        <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <div className="form-group">
            <label className="form-label">Χρέωση ανά ώρα (€)</label>
            <input type="number" step="0.5" value={settings.hourly_rate}
                   onChange={e => s('hourly_rate', parseFloat(e.target.value))} />
            <span style={{fontSize:11,color:'var(--c-text3)'}}>Στρογγυλοποίηση ανά €20</span>
          </div>
          <div className="form-group">
            <label className="form-label">Χρέωση ανά χλμ (€)</label>
            <input type="number" step="0.01" value={settings.km_rate}
                   onChange={e => s('km_rate', parseFloat(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">Ώρα οδήγησης (€)</label>
            <input type="number" step="0.5" value={settings.drive_hourly}
                   onChange={e => s('drive_hourly', parseFloat(e.target.value))} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: 8 }}>
          {saved ? '✅ Αποθηκεύτηκε!' : <><Save size={14}/> Αποθήκευση</>}
        </button>
      </div>

      {/* Clients */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--c-text)', fontSize: 14 }}>
          👤 Πελάτες
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <input value={newClient} onChange={e => setNewClient(e.target.value)}
                 placeholder="Νέος πελάτης…" style={{ flex:1 }}
                 onKeyDown={e => e.key==='Enter' && addClient()} />
          <button className="btn btn-primary btn-sm" onClick={addClient}>+ Προσθήκη</button>
        </div>
        {clients.map(c => (
          <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
               padding:'8px 0', borderBottom:'1px solid var(--c-border)' }}>
            <span style={{ fontSize:13 }}>{c.name}</span>
            <button className="btn btn-sm" style={{background:'rgba(239,68,68,0.1)',color:'#EF4444'}}
                    onClick={() => delClient(c.id)}>✕</button>
          </div>
        ))}
      </div>

      {/* Task Types */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--c-text)', fontSize: 14 }}>
          🔧 Τύποι Εργασίας
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <input value={newType} onChange={e => setNewType(e.target.value)}
                 placeholder="Νέος τύπος εργασίας…" style={{ flex:1 }}
                 onKeyDown={e => e.key==='Enter' && addType()} />
          <button className="btn btn-primary btn-sm" onClick={addType}>+ Προσθήκη</button>
        </div>
        {types.map(t => (
          <div key={t.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
               padding:'8px 0', borderBottom:'1px solid var(--c-border)' }}>
            <span style={{ fontSize:13 }}>{t.name}</span>
            <button className="btn btn-sm" style={{background:'rgba(239,68,68,0.1)',color:'#EF4444'}}
                    onClick={() => delType(t.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
