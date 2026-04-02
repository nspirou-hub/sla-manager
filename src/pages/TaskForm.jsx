import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft, RefreshCw, MapPin, Clock, Navigation, Euro } from 'lucide-react'
import {
  getTask, createTask, updateTask,
  getLocations, getTaskTypes, getClients, getSettings,
  calcCosts, genCode, fmtEur
} from '../lib/db.js'
import './TaskForm.css'

const EMPTY = {
  task_code: '', task_date: new Date().toISOString().slice(0,10),
  location_id: '', location_name: '', task_type_id: '', task_type_name: '',
  summary: '', task_start: '10:00', task_end: '11:00',
  duration_hours: 0, drive_km: 0, drive_hours: 0,
  hours_cost: 0, drive_cost: 0, duration_cost: 0,
  extra_charges: 0, total_sum: 0,
  comment: '', status: 'Done', client_id: '', file_export: false
}

export default function TaskForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm]         = useState({ ...EMPTY, task_code: genCode() })
  const [locations, setLocations] = useState([])
  const [types, setTypes]         = useState([])
  const [clients, setClients]     = useState([])
  const [settings, setSettings]   = useState({ hourly_rate: 20, km_rate: 0.3, drive_hourly: 20 })
  const [loading, setLoading]     = useState(isEdit)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    Promise.all([
      getLocations(), getTaskTypes(), getClients(), getSettings()
    ]).then(([{ data: l }, { data: t }, { data: c }, s]) => {
      setLocations(l || [])
      setTypes(t || [])
      setClients(c || [])
      setSettings(s)
    })
    if (isEdit) {
      getTask(id).then(({ data }) => {
        if (data) setForm(data)
        setLoading(false)
      })
    }
  }, [id])

  // Auto-calc duration from start/end
  useEffect(() => {
    if (form.task_start && form.task_end) {
      const [sh, sm] = form.task_start.split(':').map(Number)
      const [eh, em] = form.task_end.split(':').map(Number)
      const dur = ((eh * 60 + em) - (sh * 60 + sm)) / 60
      if (dur > 0 && dur !== form.duration_hours) {
        setForm(f => ({ ...f, duration_hours: Math.round(dur * 10) / 10 }))
      }
    }
  }, [form.task_start, form.task_end])

  // Auto-fill km+drive_hours from location
  const handleLocationChange = (e) => {
    const locId = e.target.value
    const loc = locations.find(l => String(l.id) === locId)
    setForm(f => ({
      ...f,
      location_id: locId,
      location_name: loc?.name || '',
      drive_km: loc?.km || f.drive_km,
      drive_hours: loc?.drive_hours || f.drive_hours,
    }))
  }

  const handleTypeChange = (e) => {
    const t = types.find(t => String(t.id) === e.target.value)
    setForm(f => ({ ...f, task_type_id: e.target.value, task_type_name: t?.name || '' }))
  }

  const handleClientChange = (e) => {
    setForm(f => ({ ...f, client_id: e.target.value }))
  }

  const recalc = () => {
    const costs = calcCosts(form, settings)
    setForm(f => ({ ...f, ...costs }))
  }

  // Auto-recalc on numeric change
  useEffect(() => {
    const costs = calcCosts(form, settings)
    setForm(f => ({ ...f, ...costs }))
  }, [form.duration_hours, form.drive_km, form.drive_hours, form.extra_charges])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.task_date) { setError('Η ημερομηνία είναι υποχρεωτική.'); return }
    if (!form.location_name) { setError('Επιλέξτε τοποθεσία.'); return }
    setSaving(true); setError('')
    const payload = { ...form }
    if (!payload.task_code) payload.task_code = genCode()
    const fn = isEdit ? updateTask(id, payload) : createTask(payload)
    const { error: err } = await fn
    setSaving(false)
    if (err) { setError(err.message); return }
    navigate('/tasks')
  }

  if (loading) return <div style={{ display:'flex',justifyContent:'center',paddingTop:60 }}><div className="spinner"/></div>

  return (
    <div className="task-form-page">
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/tasks')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="page-title">{isEdit ? 'Επεξεργασία Εντολής' : 'Νέα Εντολή'}</div>
            {form.task_code && <div className="page-sub mono">#{form.task_code}</div>}
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? <div className="spinner" style={{width:14,height:14}}/> : <Save size={15} />}
          {isEdit ? 'Αποθήκευση' : 'Δημιουργία'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="form-grid">
        {/* Left column */}
        <div className="form-col">
          {/* Basic info */}
          <div className="card form-section">
            <div className="form-section-title">📋 Βασικά Στοιχεία</div>
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Ημερομηνία *</label>
                <input type="date" value={form.task_date}
                       onChange={e => set('task_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Κατάσταση</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}>
                  <option>Done</option>
                  <option>Pending</option>
                  <option>Cancelled</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Τοποθεσία *</label>
              <select value={form.location_id} onChange={handleLocationChange}>
                <option value="">— Επιλέξτε —</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Τύπος Εργασίας</label>
              <select value={form.task_type_id} onChange={handleTypeChange}>
                <option value="">— Επιλέξτε —</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Πελάτης</label>
              <select value={form.client_id} onChange={handleClientChange}>
                <option value="">— Επιλέξτε —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Σύνοψη</label>
              <textarea rows={3} value={form.summary || ''}
                        onChange={e => set('summary', e.target.value)}
                        placeholder="Περιγραφή εργασίας…" />
            </div>
            <div className="form-group">
              <label className="form-label">Σχόλια</label>
              <textarea rows={2} value={form.comment || ''}
                        onChange={e => set('comment', e.target.value)} />
            </div>
          </div>

          {/* Time */}
          <div className="card form-section">
            <div className="form-section-title"><Clock size={14} /> Χρόνος Εργασίας</div>
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Έναρξη</label>
                <input type="time" value={form.task_start || ''}
                       onChange={e => set('task_start', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Λήξη</label>
                <input type="time" value={form.task_end || ''}
                       onChange={e => set('task_end', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Διάρκεια (ώρες)</label>
                <input type="number" step="0.1" min="0" value={form.duration_hours}
                       onChange={e => set('duration_hours', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="form-col">
          {/* Drive */}
          <div className="card form-section">
            <div className="form-section-title"><Navigation size={14} /> Μετακίνηση</div>
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Χιλιόμετρα</label>
                <input type="number" step="0.5" min="0" value={form.drive_km}
                       onChange={e => set('drive_km', parseFloat(e.target.value) || 0)} />
                <span className="form-hint">Μπορείς να τροποποιήσεις χειροκίνητα</span>
              </div>
              <div className="form-group">
                <label className="form-label">Ώρες Οδήγησης</label>
                <input type="number" step="0.5" min="0" value={form.drive_hours}
                       onChange={e => set('drive_hours', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>

          {/* Costing */}
          <div className="card form-section costing-card">
            <div className="form-section-header">
              <div className="form-section-title"><Euro size={14} /> Κοστολόγηση</div>
              <button className="btn btn-ghost btn-sm" onClick={recalc} type="button">
                <RefreshCw size={12} /> Επανυπολογισμός
              </button>
            </div>
            <div className="cost-grid">
              <div className="cost-row">
                <span className="cost-label">Κόστος Ωρών</span>
                <div className="form-group" style={{ flex: 1 }}>
                  <input type="number" step="0.01" value={form.hours_cost}
                         onChange={e => set('hours_cost', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div className="cost-row">
                <span className="cost-label">Κόστος Οδοιπορικών</span>
                <div className="form-group" style={{ flex: 1 }}>
                  <input type="number" step="0.01" value={form.drive_cost}
                         onChange={e => set('drive_cost', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div className="cost-row">
                <span className="cost-label">Κόστος Διάρκειας</span>
                <div className="form-group" style={{ flex: 1 }}>
                  <input type="number" step="0.01" value={form.duration_cost}
                         onChange={e => set('duration_cost', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div className="cost-row">
                <span className="cost-label">Έξτρα Χρεώσεις</span>
                <div className="form-group" style={{ flex: 1 }}>
                  <input type="number" step="0.01" value={form.extra_charges}
                         onChange={e => set('extra_charges', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div className="cost-total">
                <span>ΣΥΝΟΛΟ</span>
                <span className="cost-total-val">{fmtEur(form.total_sum)}</span>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="card form-section">
            <div className="form-section-title">⚙️ Επιλογές</div>
            <label className="checkbox-row">
              <input type="checkbox" checked={form.file_export}
                     onChange={e => set('file_export', e.target.checked)} />
              <span>Εξαχθέν σε αρχείο</span>
            </label>
          </div>
        </div>
      </div>

      {/* Mobile save */}
      <div className="mobile-save">
        <button className="btn btn-primary" style={{ width:'100%' }}
                onClick={handleSubmit} disabled={saving}>
          {saving ? <div className="spinner" style={{width:14,height:14}}/> : <Save size={15} />}
          {isEdit ? 'Αποθήκευση' : 'Δημιουργία Εντολής'}
        </button>
      </div>
    </div>
  )
}
