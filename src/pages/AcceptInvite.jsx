import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { supabase } from '../supabase.js'
import './Auth.css'

export default function AcceptInvite() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [invitation, setInvitation] = useState(null)
  const [step, setStep]     = useState('loading') // loading, register, error
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (!token) { setStep('error'); return }
    supabase.from('invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setStep('error'); return }
        setInvitation(data)
        setStep('register')
      })
  }, [token])

  const handleAccept = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')

    // Sign up the user
    const { data, error: signupErr } = await supabase.auth.signUp({
      email: invitation.email,
      password,
      options: { data: { full_name: fullName } }
    })

    if (signupErr) { setError(signupErr.message); setLoading(false); return }

    // Sign in immediately to get session, then update profile
    const { error: signinErr } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password
    })
    if (!signinErr) {
      await new Promise(r => setTimeout(r, 300))
      await supabase.from('user_profiles').update({
        org_id: invitation.org_id,
        full_name: fullName,
        role: invitation.role
      }).eq('id', data.user.id)
    }

    // Mark invitation as accepted
    await supabase.from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    setLoading(false)
    navigate('/dashboard')
  }

  if (step === 'loading') return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" />
    </div>
  )

  if (step === 'error') return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h2 className="auth-title">Μη έγκυρη πρόσκληση</h2>
        <p className="auth-sub">Ο σύνδεσμος έχει λήξει ή δεν είναι έγκυρος.</p>
        <button className="btn-auth" onClick={() => navigate('/')}>Αρχική σελίδα</button>
      </div>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Zap size={20} /></div>
          <span>SLA Manager</span>
        </div>
        <h2 className="auth-title">Αποδοχή Πρόσκλησης</h2>
        <p className="auth-sub">Δημιουργήστε τον λογαριασμό σας για <strong>{invitation?.email}</strong></p>

        <form onSubmit={handleAccept}>
          {error && <div className="auth-error">{error}</div>}
          <div className="auth-field">
            <label>Ονοματεπώνυμο</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)}
                   placeholder="π.χ. Γιώργης Παπαδόπουλος" required />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                   placeholder="Τουλάχιστον 6 χαρακτήρες" required minLength={6} />
          </div>
          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? <div className="spinner" style={{width:16,height:16,margin:'0 auto'}}/> : 'Δημιουργία Λογαριασμού ✓'}
          </button>
        </form>
      </div>
    </div>
  )
}
