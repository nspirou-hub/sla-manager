import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
         XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, ClipboardList, Euro, Clock, Navigation, Plus, ArrowRight } from 'lucide-react'
import { getDashboardStats, fmtEur, fmtDate } from '../lib/db.js'
import { supabase } from '../supabase.js'
import './Dashboard.css'

const PIE_COLORS = ['#2979C2','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16']

function KPI({ icon: Icon, label, value, sub, color = 'blue' }) {
  return (
    <div className={`kpi-card kpi-${color}`}>
      <div className="kpi-icon"><Icon size={18} /></div>
      <div className="kpi-body">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats]   = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      supabase.from('tasks').select('*').order('task_date', { ascending: false }).limit(6)
    ]).then(([s, { data }]) => {
      setStats(s)
      setRecent(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Επισκόπηση εντολών SLA</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tasks/new')}>
          <Plus size={15} /> Νέα Εντολή
        </button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KPI icon={ClipboardList} label="Εντολές (μήνας)"  value={stats.monthCount}          sub={`${stats.total} συνολικά`}        color="blue" />
        <KPI icon={Euro}          label="Αξία μήνα"         value={fmtEur(stats.monthValue)}   sub={`${fmtEur(stats.yearValue)} φέτος`} color="green" />
        <KPI icon={Clock}         label="Ώρες εργασίας"     value={`${stats.totalHours}ω`}     sub="Σύνολο"                            color="gold" />
        <KPI icon={Navigation}    label="Χλμ οδήγησης"      value={`${stats.totalKm.toLocaleString('el-GR')} km`} sub="Σύνολο"         color="purple" />
      </div>

      {/* Charts row */}
      <div className="charts-row">
        <div className="card chart-card">
          <div className="chart-title">Εντολές & Αξία ανά Μήνα</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.monthly} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#4A6A8A', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#4A6A8A', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#1C2A3A', border: '1px solid #1E3A5F', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#8BA8C8' }}
              />
              <Bar dataKey="count" name="Εντολές" fill="#2979C2" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <div className="chart-title">Αξία (€) ανά Μήνα</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.monthly} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#4A6A8A', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#4A6A8A', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#1C2A3A', border: '1px solid #1E3A5F', borderRadius: 8, fontSize: 12 }}
                formatter={v => [fmtEur(v), 'Αξία']}
              />
              <Line dataKey="total" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card chart-pie">
          <div className="chart-title">Ανά Τύπο Εργασίας</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats.byType} dataKey="count" nameKey="name" cx="50%" cy="50%"
                   innerRadius={50} outerRadius={80} paddingAngle={2}>
                {stats.byType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1C2A3A', border: '1px solid #1E3A5F', borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {stats.byType.slice(0,4).map((d,i) => (
              <div key={i} className="pie-legend-item">
                <span className="pie-dot" style={{ background: PIE_COLORS[i] }} />
                <span>{d.name}</span>
                <span className="pie-count">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent tasks */}
      <div className="card">
        <div className="section-header">
          <div className="chart-title">Πρόσφατες Εντολές</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>
            Όλες <ArrowRight size={13} />
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Ημ/νία</th>
              <th>Τοποθεσία</th>
              <th>Τύπος</th>
              <th>Σύνοψη</th>
              <th>Διάρκεια</th>
              <th className="hide-mobile">Χλμ</th>
              <th>Σύνολο</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(t => (
              <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/tasks/${t.id}`)}>
                <td className="mono" style={{ fontSize: 12 }}>{fmtDate(t.task_date)}</td>
                <td>{t.location_name || '-'}</td>
                <td><span className="badge badge-blue">{t.task_type_name || '-'}</span></td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.summary || '-'}
                </td>
                <td>{t.duration_hours ? `${t.duration_hours}ω` : '-'}</td>
                <td className="hide-mobile">{t.drive_km ? `${t.drive_km} km` : '-'}</td>
                <td style={{ color: '#10B981', fontWeight: 600 }}>{fmtEur(t.total_sum)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
