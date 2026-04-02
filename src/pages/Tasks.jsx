import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Edit2, Trash2, ChevronDown, X } from 'lucide-react'
import { getTasks, deleteTask, getLocations, getTaskTypes, fmtEur, fmtDate } from '../lib/db.js'
import './Tasks.css'

export default function Tasks() {
  const navigate = useNavigate()
  const [tasks, setTasks]         = useState([])
  const [locations, setLocations] = useState([])
  const [types, setTypes]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    search: '', from: '', to: '', location: '', type: ''
  })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await getTasks(filters)
    setTasks(data || [])
    setLoading(false)
  }, [filters])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    Promise.all([getLocations(), getTaskTypes()]).then(([{ data: l }, { data: t }]) => {
      setLocations(l || [])
      setTypes(t || [])
    })
  }, [])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Διαγραφή εντολής;')) return
    await deleteTask(id)
    load()
  }

  const clearFilters = () => setFilters({ search: '', from: '', to: '', location: '', type: '' })
  const hasFilters = Object.values(filters).some(Boolean)

  // Totals
  const totalSum   = tasks.reduce((s, t) => s + (t.total_sum || 0), 0)
  const totalHours = tasks.reduce((s, t) => s + (t.duration_hours || 0), 0)
  const totalKm    = tasks.reduce((s, t) => s + (t.drive_km || 0), 0)

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <div className="page-title">Εντολές Εργασίας</div>
          <div className="page-sub">{tasks.length} εγγραφές</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-ghost ${showFilters ? 'active-filter' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}>
            <Filter size={15} /> Φίλτρα
            {hasFilters && <span className="filter-badge" />}
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/tasks/new')}>
            <Plus size={15} /> Νέα Εντολή
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="search-bar">
        <Search size={15} className="search-icon" />
        <input
          placeholder="Αναζήτηση σε τοποθεσία, σύνοψη…"
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        {filters.search && (
          <button className="search-clear" onClick={() => setFilters(f => ({ ...f, search: '' }))}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="filters-panel card">
          <div className="form-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            <div className="form-group">
              <label className="form-label">Από</label>
              <input type="date" value={filters.from}
                     onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Έως</label>
              <input type="date" value={filters.to}
                     onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Τοποθεσία</label>
              <select value={filters.location}
                      onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}>
                <option value="">Όλες</option>
                {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Τύπος</label>
              <select value={filters.type}
                      onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
                <option value="">Όλοι</option>
                {types.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
          </div>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={clearFilters}>
              <X size={13} /> Καθαρισμός φίλτρων
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card table-card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <p>Δεν βρέθηκαν εντολές</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ημ/νία</th>
                  <th>Τοποθεσία</th>
                  <th>Τύπος</th>
                  <th className="hide-mobile">Σύνοψη</th>
                  <th>Διάρκ.</th>
                  <th className="hide-mobile">Χλμ</th>
                  <th className="hide-mobile">Κόστος Ωρών</th>
                  <th className="hide-mobile">Κόστος Οδοιπ.</th>
                  <th className="hide-mobile">Έξτρα</th>
                  <th>Σύνολο</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id} className="task-row" onClick={() => navigate(`/tasks/${t.id}`)}>
                    <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                      {fmtDate(t.task_date)}
                    </td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.location_name || '-'}
                    </td>
                    <td>
                      <span className="badge badge-blue" style={{ whiteSpace: 'nowrap' }}>
                        {t.task_type_name || '-'}
                      </span>
                    </td>
                    <td className="hide-mobile" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--c-text2)', fontSize: 12 }}>
                      {t.summary || '-'}
                    </td>
                    <td>{t.duration_hours ? `${t.duration_hours}ω` : '-'}</td>
                    <td className="hide-mobile">{t.drive_km ? `${t.drive_km} km` : '-'}</td>
                    <td className="hide-mobile">{fmtEur(t.hours_cost)}</td>
                    <td className="hide-mobile">{fmtEur(t.drive_cost)}</td>
                    <td className="hide-mobile">{fmtEur(t.extra_charges)}</td>
                    <td style={{ fontWeight: 600, color: '#10B981', whiteSpace: 'nowrap' }}>
                      {fmtEur(t.total_sum)}
                    </td>
                    <td>
                      <div className="row-actions" onClick={e => e.stopPropagation()}>
                        <button className="btn btn-icon btn-ghost btn-sm"
                                onClick={() => navigate(`/tasks/${t.id}`)}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-icon btn-sm"
                                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                                onClick={e => handleDelete(t.id, e)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="tr-total">
                  <td colSpan={4}><strong>ΣΥΝΟΛΑ — {tasks.length} εντολές</strong></td>
                  <td><strong>{Math.round(totalHours * 10) / 10}ω</strong></td>
                  <td className="hide-mobile"><strong>{Math.round(totalKm)} km</strong></td>
                  <td className="hide-mobile" colSpan={3}></td>
                  <td><strong style={{ color: '#10B981' }}>{fmtEur(totalSum)}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
