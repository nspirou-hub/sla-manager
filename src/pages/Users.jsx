import { useEffect, useState } from 'react'
import { UserPlus, Trash2, Shield, User, Mail, Clock, Check } from 'lucide-react'
import { supabase } from '../supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import './Users.css'

export default function Users() {
  const { profile, org } = useAuth()
  const [users, setUsers]           = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading]       = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState('user')
  const [inviting, setInviting]     = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  const load = async () => {
    setLoading(true)
    const [{ data: profs }, { data: invs }] = await Promise.all([
      supabase.from('user_profiles')
        .select('*, organizations(name)')
        .eq('org_id', org?.id),
      supabase.from('invitations')
        .select('*')
        .eq('org_id', org?.id)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
    ])
    setUsers(profs || [])
    setInvitations(invs || [])
    setLoading(false)
  }

  useEffect(() => { if (org?.id) load() }, [org])

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true); setError(''); setSuccess('')

    // Check if already exists
    const { data: existing } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', inviteEmail.trim())
      .eq('org_id', org.id)
      .is('accepted_at', null)

    if (existing?.length > 0) {
      setError('Υπάρχει ήδη εκκρεμής πρόσκληση για αυτό το email.')
      setInviting(false); return
    }

    const { data: inv, error: err } = await supabase
      .from('invitations')
      .insert([{ org_id: org.id, email: inviteEmail.trim(), role: inviteRole, invited_by: profile.id }])
      .select().single()

    if (err) { setError(err.message); setInviting(false); return }

    // Send invitation email via Supabase Auth
    const inviteUrl = `${window.location.origin}/accept-invite?token=${inv.token}`
    
    // Use Supabase admin invite (works with service role) or show link
    setSuccess(`Πρόσκληση δημιουργήθηκε! Στείλε αυτόν τον σύνδεσμο στον χρήστη:\n${inviteUrl}`)
    setInviteEmail(''); setInviting(false)
    load()
  }

  const handleRoleChange = async (userId, newRole) => {
    await supabase.from('user_profiles').update({ role: newRole }).eq('id', userId)
    load()
  }

  const handleRemoveUser = async (userId) => {
    if (!confirm('Αφαίρεση χρήστη από την εταιρεία;')) return
    await supabase.from('user_profiles').update({ org_id: null }).eq('id', userId)
    load()
  }

  const handleCancelInvite = async (invId) => {
    await supabase.from('invitations').delete().eq('id', invId)
    load()
  }

  const copyLink = (token) => {
    const url = `${window.location.origin}/accept-invite?token=${token}`
    navigator.clipboard.writeText(url)
    setSuccess('Σύνδεσμος αντιγράφηκε!')
    setTimeout(() => setSuccess(''), 3000)
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="empty-state">
        <Shield size={40} />
        <p>Δεν έχετε δικαίωμα πρόσβασης σε αυτή τη σελίδα.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <div className="page-title">Διαχείριση Χρηστών</div>
          <div className="page-sub">{org?.name} — {users.length} χρήστες</div>
        </div>
      </div>

      {/* Invite form */}
      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
        <div className="users-section-title"><UserPlus size={15} /> Πρόσκληση Νέου Χρήστη</div>
        <form onSubmit={handleInvite}>
          {error   && <div className="auth-error" style={{marginBottom:12}}>{error}</div>}
          {success && (
            <div className="users-success">
              {success.split('\n').map((line, i) => (
                <div key={i} style={i===1 ? {fontSize:11, wordBreak:'break-all', marginTop:6, fontFamily:'monospace', background:'rgba(255,255,255,0.05)', padding:'6px 8px', borderRadius:4} : {}}>
                  {line}
                </div>
              ))}
            </div>
          )}
          <div className="form-row" style={{ gridTemplateColumns: '1fr auto auto' }}>
            <div className="form-group">
              <label className="form-label">Email χρήστη</label>
              <input type="email" value={inviteEmail}
                     onChange={e => setInviteEmail(e.target.value)}
                     placeholder="user@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <label className="form-label">&nbsp;</label>
              <button className="btn btn-primary" type="submit" disabled={inviting}>
                {inviting ? <div className="spinner" style={{width:14,height:14}}/> : <><UserPlus size={14}/> Πρόσκληση</>}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Active users */}
      <div className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--c-border)' }}>
          <div className="users-section-title"><User size={15} /> Ενεργοί Χρήστες</div>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Χρήστης</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar-sm">
                        {(u.full_name||'?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{u.full_name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--c-text3)' }}>{u.id === profile.id ? '(εσείς)' : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {u.id === profile.id ? (
                      <span className="badge badge-blue">admin</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        style={{ fontSize: 12, padding: '4px 8px', width: 'auto' }}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </td>
                  <td>
                    {u.id !== profile.id && (
                      <button className="btn btn-sm btn-icon"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                              onClick={() => handleRemoveUser(u.id)}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--c-border)' }}>
            <div className="users-section-title"><Clock size={15} /> Εκκρεμείς Προσκλήσεις</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Λήξη</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invitations.map(inv => (
                <tr key={inv.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Mail size={13} style={{ color: 'var(--c-text3)' }} />
                      {inv.email}
                    </div>
                  </td>
                  <td><span className="badge badge-yellow">{inv.role}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--c-text3)' }}>
                    {new Date(inv.expires_at).toLocaleDateString('el-GR')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Αντιγραφή συνδέσμου"
                              onClick={() => copyLink(inv.token)}>
                        <Check size={13} />
                      </button>
                      <button className="btn btn-sm btn-icon"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                              onClick={() => handleCancelInvite(inv.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
