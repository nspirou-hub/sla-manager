import { useEffect, useState } from 'react'
import { FileText, Download, BarChart2, Calendar } from 'lucide-react'
import { getTasks, getClients, fmtEur, fmtDate } from '../lib/db.js'
import './Reports.css'

const DEFAULT_CLIENT = 'ΧΑΡΑΛΑΜΠΟΣ ΘΕΟΔΟΣΗΣ ΑΒΕΕ'
const today = () => new Date().toISOString().slice(0,10)
const firstOfMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` }

export default function Reports() {
  const [from, setFrom]       = useState(firstOfMonth())
  const [to, setTo]           = useState(today())
  const [client, setClient]   = useState(DEFAULT_CLIENT)
  const [clients, setClients] = useState([])
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getClients().then(({ data }) => setClients(data || []))
  }, [])

  const loadPreview = async () => {
    setLoading(true)
    const { data } = await getTasks({ from, to })
    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => { loadPreview() }, [from, to])

  const totalSum    = tasks.reduce((s,t) => s + (t.total_sum||0), 0)
  const totalHours  = tasks.reduce((s,t) => s + (t.duration_hours||0), 0)
  const totalKm     = tasks.reduce((s,t) => s + (t.drive_km||0), 0)
  const totalExtra  = tasks.reduce((s,t) => s + (t.extra_charges||0), 0)
  const totalHCost  = tasks.reduce((s,t) => s + (t.hours_cost||0), 0)
  const totalDCost  = tasks.reduce((s,t) => s + (t.drive_cost||0), 0)

  // Export to CSV (browser-side, no Python needed)
  const exportCSV = () => {
    const headers = ['Ημερομηνία','Κωδικός','Τοποθεσία','Τύπος','Σύνοψη',
                     'Έναρξη','Λήξη','Διάρκεια','Χλμ','Ώρες Οδήγ.',
                     'Κόστος Ωρών','Κόστος Οδοιπ.','Κόστος Διάρκ.','Έξτρα','Σύνολο']
    const rows = tasks.map(t => [
      fmtDate(t.task_date), t.task_code||'', t.location_name||'', t.task_type_name||'',
      (t.summary||'').replace(/,/g,' '),
      t.task_start||'', t.task_end||'', t.duration_hours||0, t.drive_km||0,
      t.drive_hours||0, t.hours_cost||0, t.drive_cost||0, t.duration_cost||0,
      t.extra_charges||0, t.total_sum||0
    ])
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `SLA_${from}_${to}.csv`
    a.click()
  }

  // Print PDF via browser print dialog (styled)
  const printPDF = () => {
    const original = document.title
    const fromStr = from.split('-').reverse().join('/')
    const toStr   = to.split('-').reverse().join('/')
    document.title = `SLA_Report_${client.replace(/\s+/g,'_')}_${from}_${to}`
    window.print()
    document.title = original
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <div className="page-title">Reports</div>
          <div className="page-sub">Δημιουργία αναφορών για τιμολόγηση</div>
        </div>
      </div>

      {/* Controls */}
      <div className="card report-controls">
        <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 2fr auto auto' }}>
          <div className="form-group">
            <label className="form-label"><Calendar size={12} /> Από</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label"><Calendar size={12} /> Έως</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Πελάτης</label>
            <input value={client} onChange={e => setClient(e.target.value)}
                   placeholder="Όνομα πελάτη για το report" />
          </div>
          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <label className="form-label">&nbsp;</label>
            <button className="btn btn-ghost" onClick={exportCSV} disabled={!tasks.length}>
              <Download size={15} /> CSV
            </button>
          </div>
          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <label className="form-label">&nbsp;</label>
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn btn-ghost" title="Αντιγραφή ονόματος αρχείου"
                onClick={() => {
                  const name = `SLA_Report_${client.replace(/\s+/g,'_')}_${from}_${to}`
                  navigator.clipboard.writeText(name).then(() => {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2500)
                  })
                }} disabled={!tasks.length}>
                {copied ? '✅' : '📋'}
              </button>
              <button className="btn btn-primary" onClick={printPDF} disabled={!tasks.length}>
                <FileText size={15} /> Εκτύπωση PDF
              </button>
            </div>
          </div>
        </div>

        {/* Quick presets */}
        <div className="presets">
          {[
            { label: 'Τρέχων μήνας', fn: () => { setFrom(firstOfMonth()); setTo(today()) }},
            { label: 'Προηγ. μήνας', fn: () => {
              const d = new Date(); d.setDate(0)
              const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0')
              setFrom(`${y}-${m}-01`)
              setTo(`${y}-${m}-${String(d.getDate()).padStart(2,'0')}`)
            }},
            { label: 'Τρέχον τρίμηνο', fn: () => {
              const d = new Date(); const q = Math.floor(d.getMonth()/3)
              setFrom(`${d.getFullYear()}-${String(q*3+1).padStart(2,'0')}-01`)
              setTo(today())
            }},
            { label: 'Φέτος', fn: () => { setFrom(`${new Date().getFullYear()}-01-01`); setTo(today()) }},
          ].map(p => (
            <button key={p.label} className="btn btn-ghost btn-sm preset-btn" onClick={p.fn}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI summary */}
      {tasks.length > 0 && (
        <div className="report-kpis">
          {[
            { label: 'Εντολές',         value: tasks.length },
            { label: 'Συνολική Αξία',   value: fmtEur(totalSum) },
            { label: 'Ώρες Εργασίας',   value: `${Math.round(totalHours*10)/10}ω` },
            { label: 'Χλμ',             value: `${Math.round(totalKm)} km` },
            { label: 'Κόστος Ωρών',     value: fmtEur(totalHCost) },
            { label: 'Κόστος Οδοιπ.',   value: fmtEur(totalDCost) },
            { label: 'Έξτρα',           value: fmtEur(totalExtra) },
          ].map(k => (
            <div key={k.label} className="report-kpi">
              <div className="report-kpi-val">{k.value}</div>
              <div className="report-kpi-lbl">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Printable report */}
      <div className="card print-report" id="print-area">
        {/* Print header */}
        <div className="print-header">
          <div>
            <div className="print-company">Digital Center</div>
            <div className="print-sub">SLA Service Report</div>
          </div>
          <div className="print-meta">
            <div><strong>Πελάτης:</strong> {client}</div>
            <div><strong>Περίοδος:</strong> {fmtDate(from)} – {fmtDate(to)}</div>
            <div><strong>Εκδόθηκε:</strong> {new Date().toLocaleString('el-GR')}</div>
          </div>
        </div>

        {/* Summary boxes */}
        <div className="print-kpis">
          <div className="print-kpi"><strong>{tasks.length}</strong><span>Εντολές</span></div>
          <div className="print-kpi"><strong>{fmtEur(totalSum)}</strong><span>Συνολική Αξία</span></div>
          <div className="print-kpi"><strong>{Math.round(totalHours*10)/10}ω</strong><span>Ώρες Εργασίας</span></div>
          <div className="print-kpi"><strong>{Math.round(totalKm)} km</strong><span>Χλμ Μετακίνησης</span></div>
          <div className="print-kpi"><strong>{fmtEur(totalExtra)}</strong><span>Έξτρα Χρεώσεις</span></div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding: 40 }}><div className="spinner" /></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state"><p>Δεν βρέθηκαν εντολές για αυτό το διάστημα.</p></div>
        ) : (
          <>
            <h3 className="print-section-title">Αναλυτικές Εντολές Εργασίας</h3>
            <table className="print-table">
                <colgroup>
                  <col/><col/><col/><col/>
                  <col/><col/><col/><col/>
                  <col/><col/><col/><col/>
                  <col/><col/>
                </colgroup>
                <thead>
                  <tr>
                    <th>Ημ/νία</th><th>Τοποθεσία</th>
                    <th>Τύπος</th><th>Σύνοψη</th>
                    <th>Έναρξη</th><th>Λήξη</th><th>Διάρκ.</th>
                    <th>Χλμ</th><th>Ώρες Οδ.</th>
                    <th>Κ.Ωρών</th><th>Κ.Οδοιπ.</th><th>Κ.Διάρκ.</th>
                    <th>Έξτρα</th><th>Σύνολο</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(t => (
                    <tr key={t.id}>
                      <td>{fmtDate(t.task_date)}</td>
                      <td>{t.location_name||'-'}</td>
                      <td>{t.task_type_name||'-'}</td>
                      <td>{t.summary ? t.summary.slice(0,60)+(t.summary.length>60?'…':'') : '-'}</td>
                      <td>{t.task_start?.slice(0,5)||'-'}</td>
                      <td>{t.task_end?.slice(0,5)||'-'}</td>
                      <td>{t.duration_hours||0}</td>
                      <td>{t.drive_km||0}</td>
                      <td>{t.drive_hours||0}</td>
                      <td>{fmtEur(t.hours_cost)}</td>
                      <td>{fmtEur(t.drive_cost)}</td>
                      <td>{fmtEur(t.duration_cost)}</td>
                      <td>{fmtEur(t.extra_charges)}</td>
                      <td style={{fontWeight:700}}>{fmtEur(t.total_sum)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="tr-total">
                    <td colSpan={4}><strong>ΣΥΝΟΛΑ — {tasks.length} εντολές</strong></td>
                    <td colSpan={2}></td>
                    <td><strong>{Math.round(totalHours*10)/10}</strong></td>
                    <td><strong>{Math.round(totalKm)}</strong></td>
                    <td><strong>{tasks.reduce((s,t)=>s+(t.drive_hours||0),0).toFixed(1)}</strong></td>
                    <td><strong>{fmtEur(totalHCost)}</strong></td>
                    <td><strong>{fmtEur(totalDCost)}</strong></td>
                    <td><strong>{fmtEur(tasks.reduce((s,t)=>s+(t.duration_cost||0),0))}</strong></td>
                    <td><strong>{fmtEur(totalExtra)}</strong></td>
                    <td><strong>{fmtEur(totalSum)}</strong></td>
                  </tr>
                </tfoot>
              </table>
          {/* Summary by task type */}
          {tasks.length > 0 && (() => {
            const byType = {}
            tasks.forEach(t => {
              const k = t.task_type_name || 'Άλλο'
              if (!byType[k]) byType[k] = { count:0, hours:0, total:0 }
              byType[k].count++
              byType[k].hours += t.duration_hours||0
              byType[k].total += t.total_sum||0
            })
            const rows = Object.entries(byType).sort((a,b)=>b[1].total-a[1].total)
            const fmtH = h => {
              const hrs=Math.floor(h), mins=Math.round((h-hrs)*60)
              return `${hrs}ω ${String(mins).padStart(2,'0')}'`
            }
            return (
              <>
                <h3 className="print-section-title" style={{marginTop:20}}>Ανάλυση ανά Τύπο Εργασίας</h3>
                <table className="print-table" style={{width:'55%',minWidth:'300px'}}>
                  <thead>
                    <tr>
                      <th style={{textAlign:'left',width:'50%'}}>Τύπος Εργασίας</th>
                      <th style={{textAlign:'center',width:'15%'}}>Εντολές</th>
                      <th style={{textAlign:'center',width:'20%'}}>Συν. Ωρών</th>
                      <th style={{textAlign:'right',width:'15%'}}>Συν. Αξία</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(([name,v],i) => (
                      <tr key={i}>
                        <td style={{textAlign:'left'}}>{name}</td>
                        <td style={{textAlign:'center'}}>{v.count}</td>
                        <td style={{textAlign:'center'}}>{fmtH(v.hours)}</td>
                        <td style={{textAlign:'right',fontWeight:600,color:'#10B981'}}>{fmtEur(v.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="tr-total">
                      <td style={{textAlign:'left'}}><strong>ΣΥΝΟΛΟ</strong></td>
                      <td style={{textAlign:'center'}}><strong>{tasks.length}</strong></td>
                      <td style={{textAlign:'center'}}><strong>{fmtH(totalHours)}</strong></td>
                      <td style={{textAlign:'right'}}><strong style={{color:'#10B981'}}>{fmtEur(totalSum)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </>
            )
          })()}

          {/* Footer */}
          {tasks.length > 0 && (
            <div className="print-footer">
              Digital Center | SLA Report | Περίοδος: {fmtDate(from)} – {fmtDate(to)} | Εκδόθηκε: {new Date().toLocaleString('el-GR')}
            </div>
          )}
          </>
        )}
      </div>
    </div>
  )
}
