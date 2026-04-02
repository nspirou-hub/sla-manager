import { supabase } from '../supabase.js'

// ── Settings / costing ───────────────────────────────────────────────────────
export async function getSettings() {
  const { data } = await supabase.from('settings').select('*')
  if (!data) return { hourly_rate: 20, km_rate: 0.3, drive_hourly: 20 }
  return Object.fromEntries(data.map(r => [r.key, parseFloat(r.value)]))
}

export async function saveSettings(obj) {
  const rows = Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }))
  return supabase.from('settings').upsert(rows, { onConflict: 'key' })
}

// ── Cost calculation ──────────────────────────────────────────────────────────
export function calcCosts(task, settings) {
  const { hourly_rate = 20, km_rate = 0.3, drive_hourly = 20 } = settings
  const dur   = parseFloat(task.duration_hours) || 0
  const km    = parseFloat(task.drive_km) || 0
  const dh    = parseFloat(task.drive_hours) || 0
  const extra = parseFloat(task.extra_charges) || 0

  const hours_cost    = Math.ceil(dur * hourly_rate / 20) * 20
  const drive_cost    = km * km_rate
  const duration_cost = dh * drive_hourly
  const total_sum     = hours_cost + drive_cost + duration_cost + extra

  return {
    hours_cost:    Math.round(hours_cost * 100) / 100,
    drive_cost:    Math.round(drive_cost * 100) / 100,
    duration_cost: Math.round(duration_cost * 100) / 100,
    total_sum:     Math.round(total_sum * 100) / 100,
  }
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export async function getTasks(filters = {}) {
  let q = supabase.from('tasks').select('*').order('task_date', { ascending: false })
  if (filters.from)     q = q.gte('task_date', filters.from)
  if (filters.to)       q = q.lte('task_date', filters.to)
  if (filters.location) q = q.ilike('location_name', `%${filters.location}%`)
  if (filters.type)     q = q.eq('task_type_name', filters.type)
  if (filters.search)   q = q.or(`summary.ilike.%${filters.search}%,location_name.ilike.%${filters.search}%`)
  return q
}

export async function getTask(id) {
  return supabase.from('tasks').select('*').eq('id', id).single()
}

export async function createTask(task) {
  return supabase.from('tasks').insert([task]).select().single()
}

export async function updateTask(id, task) {
  return supabase.from('tasks').update(task).eq('id', id).select().single()
}

export async function deleteTask(id) {
  return supabase.from('tasks').delete().eq('id', id)
}

// ── Locations ─────────────────────────────────────────────────────────────────
export async function getLocations() {
  return supabase.from('locations').select('*').order('name')
}

export async function upsertLocation(loc) {
  return supabase.from('locations').upsert([loc], { onConflict: 'name' }).select().single()
}

export async function deleteLocation(id) {
  return supabase.from('locations').delete().eq('id', id)
}

// ── Task types ────────────────────────────────────────────────────────────────
export async function getTaskTypes() {
  return supabase.from('task_types').select('*').order('name')
}

// ── Clients ───────────────────────────────────────────────────────────────────
export async function getClients() {
  return supabase.from('clients').select('*').order('name')
}

// ── Dashboard stats ───────────────────────────────────────────────────────────
export async function getDashboardStats() {
  const { data: tasks } = await supabase.from('tasks').select(
    'task_date, total_sum, duration_hours, drive_km, task_type_name, location_name'
  )
  if (!tasks) return null

  const now   = new Date()
  const y     = now.getFullYear()
  const m     = now.getMonth() + 1
  const pad   = n => String(n).padStart(2, '0')
  const curMo = `${y}-${pad(m)}`

  const thisMonth = tasks.filter(t => t.task_date?.startsWith(curMo))
  const thisYear  = tasks.filter(t => t.task_date?.startsWith(String(y)))

  // Monthly breakdown (last 12 months)
  const monthly = {}
  tasks.forEach(t => {
    const mo = t.task_date?.slice(0,7)
    if (!mo) return
    if (!monthly[mo]) monthly[mo] = { count: 0, total: 0, hours: 0 }
    monthly[mo].count++
    monthly[mo].total += t.total_sum || 0
    monthly[mo].hours += t.duration_hours || 0
  })
  const monthlyArr = Object.entries(monthly)
    .sort(([a],[b]) => a.localeCompare(b))
    .slice(-12)
    .map(([mo, v]) => ({ month: mo, ...v,
      total: Math.round(v.total * 100)/100,
      hours: Math.round(v.hours * 10)/10 }))

  // By type
  const byType = {}
  tasks.forEach(t => {
    const k = t.task_type_name || 'Άλλο'
    if (!byType[k]) byType[k] = 0
    byType[k]++
  })
  const byTypeArr = Object.entries(byType)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  return {
    total:       tasks.length,
    totalValue:  Math.round(tasks.reduce((s,t) => s + (t.total_sum||0), 0) * 100) / 100,
    totalHours:  Math.round(tasks.reduce((s,t) => s + (t.duration_hours||0), 0) * 10) / 10,
    totalKm:     Math.round(tasks.reduce((s,t) => s + (t.drive_km||0), 0)),
    monthCount:  thisMonth.length,
    monthValue:  Math.round(thisMonth.reduce((s,t) => s + (t.total_sum||0), 0) * 100) / 100,
    yearCount:   thisYear.length,
    yearValue:   Math.round(thisYear.reduce((s,t) => s + (t.total_sum||0), 0) * 100) / 100,
    monthly:     monthlyArr,
    byType:      byTypeArr,
  }
}

// ── Formatters ────────────────────────────────────────────────────────────────
export const fmtEur = v => {
  const n = parseFloat(v) || 0
  return '€' + n.toLocaleString('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
export const fmtDate = v => {
  if (!v) return '-'
  const [y,m,d] = v.split('-')
  return `${d}/${m}/${y}`
}
export const fmtDur = v => {
  const h = parseFloat(v) || 0
  const hrs  = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  return `${hrs}ω ${String(mins).padStart(2,'0')}'`
}
export const genCode = () => Math.random().toString(16).slice(2, 10)
