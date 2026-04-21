import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Zap, Mail, Lock, User, Eye, EyeOff, Building } from 'lucide-react'
import { supabase } from '../supabase.js'
import './Auth.css'

// ── LOGIN ─────────────────────────────────────────────────────────────────────
export function Login() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      if (err.message.includes('Email not confirmed')) {
        setError('Παρακαλώ επιβεβαιώστε το email σας πριν συνδεθείτε. Ελέγξτε τα εισερχόμενά σας.')
      } else {
        setError('Λάθος email ή password.')
      }
      return
    }
    navigate('/dashboard')
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Zap size={20} /></div>
          <span>SLA Manager</span>
        </div>
        <h2 className="auth-title">Καλώς ήρθατε</h2>
        <p className="auth-sub">Συνδεθείτε στον λογαριασμό σας</p>

        <button className="btn-google" onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          Σύνδεση με Google
        </button>

        <div className="auth-divider"><span>ή με email</span></div>

        <form onSubmit={handleLogin}>
          {error && <div className="auth-error">{error}</div>}
          <div className="auth-field">
            <label>Email</label>
            <div className="auth-input-wrap">
              <Mail size={15} className="auth-input-icon" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                     placeholder="email@example.com" required />
            </div>
          </div>
          <div className="auth-field">
            <label>Password</label>
            <div className="auth-input-wrap">
              <Lock size={15} className="auth-input-icon" />
              <input type={showPw ? 'text' : 'password'} value={password}
                     onChange={e => setPassword(e.target.value)}
                     placeholder="••••••••" required />
              <button type="button" className="auth-eye" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? <div className="spinner" style={{width:16,height:16,margin:'0 auto'}}/> : 'Σύνδεση'}
          </button>
        </form>

        <p className="auth-link">
          Δεν έχετε λογαριασμό; <Link to="/register">Εγγραφή</Link>
        </p>
      </div>
    </div>
  )
}

// ── REGISTER ──────────────────────────────────────────────────────────────────
export function Register() {
  const navigate = useNavigate()
  const [step, setStep]         = useState(1) // 1=account, 2=organization
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [userId, setUserId]     = useState(null)

  const handleStep1 = async (e) => {
    e.preventDefault()
    if (password.length < 6) { setError('Το password πρέπει να έχει τουλάχιστον 6 χαρακτήρες.'); return }
    setLoading(true); setError('')

    const { data, error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    // Check if email confirmation is required
    if (!data.session) {
      setStep('verify')
      setUserId(data.user?.id)
      return
    }
    setUserId(data.user?.id)
    setStep(2)
  }

  const handleStep2 = async (e) => {
    e.preventDefault()
    if (!orgName.trim()) { setError('Εισάγετε όνομα εταιρείας.'); return }
    setLoading(true); setError('')

    // Create organization
    const slug = orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert([{ name: orgName.trim(), slug }])
      .select().single()

    if (orgErr) { setLoading(false); setError(orgErr.message); return }

    // Update user profile with org
    await supabase.from('user_profiles').upsert([{
      id: userId,
      org_id: org.id,
      full_name: fullName,
      role: 'admin'
    }])

    setLoading(false)
    navigate('/dashboard')
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding` }
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Zap size={20} /></div>
          <span>SLA Manager</span>
        </div>

        {step === 'verify' ? (
          <div style={{textAlign:'center', padding:'20px 0'}}>
            <div style={{fontSize:48, marginBottom:16}}>📧</div>
            <h2 className="auth-title">Ελέγξτε το email σας</h2>
            <p className="auth-sub" style={{marginBottom:24}}>
              Στείλαμε σύνδεσμο επιβεβαίωσης στο <strong>{email}</strong>.<br/>
              Κάντε κλικ στον σύνδεσμο και μετά συνδεθείτε.
            </p>
            <button className="btn-auth" onClick={() => navigate('/login')}>
              Πήγαινε στο Login
            </button>
          </div>
        ) : step === 1 ? (
          <>
            <h2 className="auth-title">Δημιουργία Λογαριασμού</h2>
            <p className="auth-sub">Ξεκινήστε δωρεάν σήμερα</p>

            <button className="btn-google" onClick={handleGoogle}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
              </svg>
              Εγγραφή με Google
            </button>

            <div className="auth-divider"><span>ή με email</span></div>

            <form onSubmit={handleStep1}>
              {error && <div className="auth-error">{error}</div>}
              <div className="auth-field">
                <label>Ονοματεπώνυμο</label>
                <div className="auth-input-wrap">
                  <User size={15} className="auth-input-icon" />
                  <input value={fullName} onChange={e => setFullName(e.target.value)}
                         placeholder="Νίκος Σπύρου" required />
                </div>
              </div>
              <div className="auth-field">
                <label>Email</label>
                <div className="auth-input-wrap">
                  <Mail size={15} className="auth-input-icon" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                         placeholder="email@example.com" required />
                </div>
              </div>
              <div className="auth-field">
                <label>Password</label>
                <div className="auth-input-wrap">
                  <Lock size={15} className="auth-input-icon" />
                  <input type={showPw ? 'text' : 'password'} value={password}
                         onChange={e => setPassword(e.target.value)}
                         placeholder="Τουλάχιστον 6 χαρακτήρες" required />
                  <button type="button" className="auth-eye" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-auth" disabled={loading}>
                {loading ? <div className="spinner" style={{width:16,height:16,margin:'0 auto'}}/> : 'Συνέχεια →'}
              </button>
            </form>
            <p className="auth-link">Έχετε ήδη λογαριασμό; <Link to="/login">Σύνδεση</Link></p>
          </>
        ) : (
          <>
            <h2 className="auth-title">Στοιχεία Εταιρείας</h2>
            <p className="auth-sub">Τελευταίο βήμα!</p>
            <form onSubmit={handleStep2}>
              {error && <div className="auth-error">{error}</div>}
              <div className="auth-field">
                <label>Όνομα Εταιρείας</label>
                <div className="auth-input-wrap">
                  <Building size={15} className="auth-input-icon" />
                  <input value={orgName} onChange={e => setOrgName(e.target.value)}
                         placeholder="π.χ. Digital Center" required />
                </div>
              </div>
              <button type="submit" className="btn-auth" disabled={loading}>
                {loading ? <div className="spinner" style={{width:16,height:16,margin:'0 auto'}}/> : 'Δημιουργία Λογαριασμού ✓'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
