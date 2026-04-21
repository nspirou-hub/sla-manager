import { useNavigate } from 'react-router-dom'
import { Zap, ClipboardList, BarChart2, FileText, MapPin, Shield, Check } from 'lucide-react'
import './Landing.css'

const FEATURES = [
  { icon: ClipboardList, title: 'Διαχείριση Εντολών',    desc: 'Καταγραφή και παρακολούθηση όλων των εντολών SLA με αυτόματη κοστολόγηση.' },
  { icon: BarChart2,     title: 'Dashboard & Αναλύσεις', desc: 'Γραφήματα και στατιστικά ανά μήνα, τοποθεσία και τύπο εργασίας.' },
  { icon: FileText,      title: 'Reports PDF/Excel',      desc: 'Επαγγελματικά reports για τιμολόγηση με ένα κλικ.' },
  { icon: MapPin,        title: 'Διαχείριση Τοποθεσιών', desc: 'Προκαθορισμένα χιλιόμετρα και ώρες οδήγησης ανά τοποθεσία.' },
  { icon: Shield,        title: 'Ασφάλεια & Roles',       desc: 'Πολλαπλοί χρήστες με διαφορετικά δικαιώματα (admin/user).' },
  { icon: Zap,           title: 'Cloud & Mobile Ready',   desc: 'Πρόσβαση από οποιαδήποτε συσκευή, οποτεδήποτε.' },
]

const PLANS = [
  {
    name: 'Starter', price: '0', period: 'Δωρεάν',
    features: ['1 χρήστης', 'Έως 50 εντολές/μήνα', 'Dashboard', 'Reports PDF'],
    cta: 'Ξεκίνα Δωρεάν', highlight: false,
  },
  {
    name: 'Pro', price: '19', period: '/μήνα',
    features: ['Έως 5 χρήστες', 'Απεριόριστες εντολές', 'Όλες οι λειτουργίες', 'Email υποστήριξη'],
    cta: 'Δοκίμασε 14 μέρες', highlight: true,
  },
  {
    name: 'Enterprise', price: '49', period: '/μήνα',
    features: ['Απεριόριστοι χρήστες', 'Custom branding', 'API πρόσβαση', 'Προτεραιότητα υποστήριξης'],
    cta: 'Επικοινωνήστε μαζί μας', highlight: false,
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="land-nav">
        <div className="land-logo">
          <div className="land-logo-icon"><Zap size={18} /></div>
          <span>SLA Manager</span>
        </div>
        <div className="land-nav-actions">
          <button className="btn-land-ghost" onClick={() => navigate('/login')}>Σύνδεση</button>
          <button className="btn-land-primary" onClick={() => navigate('/register')}>Εγγραφή</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="land-hero">
        <div className="land-badge">⚡ Διαχείριση SLA για Τεχνικές Εταιρείες</div>
        <h1>Οργανώστε τις εντολές σας.<br/>Εκδώστε reports σε δευτερόλεπτα.</h1>
        <p>Το SLA Manager σας βοηθά να παρακολουθείτε εντολές εργασίας, να υπολογίζετε κόστη αυτόματα και να δημιουργείτε επαγγελματικά reports για τιμολόγηση.</p>
        <div className="land-hero-actions">
          <button className="btn-land-primary btn-lg" onClick={() => navigate('/register')}>
            Ξεκινήστε Δωρεάν
          </button>
          <button className="btn-land-ghost btn-lg" onClick={() => navigate('/login')}>
            Έχω ήδη λογαριασμό
          </button>
        </div>
        <div className="land-hero-img">
          <div className="land-mockup">
            <div className="mockup-bar">
              <span/><span/><span/>
            </div>
            <div className="mockup-content">
              <div className="mockup-kpis">
                {['145 Εντολές', '€14.387', '301ω', '15.290 km'].map(k => (
                  <div key={k} className="mockup-kpi">{k}</div>
                ))}
              </div>
              <div className="mockup-table">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="mockup-row">
                    <div className="mockup-cell short" />
                    <div className="mockup-cell" />
                    <div className="mockup-cell short" />
                    <div className="mockup-cell amount" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="land-section">
        <div className="land-section-header">
          <h2>Όλα όσα χρειάζεστε</h2>
          <p>Σχεδιασμένο για εταιρείες τεχνικής υποστήριξης, alarm, CCTV, IT και συντήρησης.</p>
        </div>
        <div className="land-features">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="land-feature">
              <div className="land-feature-icon"><Icon size={22} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="land-section land-pricing-section">
        <div className="land-section-header">
          <h2>Απλή & Διαφανής Τιμολόγηση</h2>
          <p>Χωρίς κρυφές χρεώσεις. Ακυρώστε οποτεδήποτε.</p>
        </div>
        <div className="land-plans">
          {PLANS.map(plan => (
            <div key={plan.name} className={`land-plan ${plan.highlight ? 'highlight' : ''}`}>
              {plan.highlight && <div className="land-plan-badge">Πιο Δημοφιλές</div>}
              <div className="land-plan-name">{plan.name}</div>
              <div className="land-plan-price">
                {plan.price === '0' ? 'Δωρεάν' : <>€{plan.price}<span>{plan.period}</span></>}
              </div>
              <ul className="land-plan-features">
                {plan.features.map(f => (
                  <li key={f}><Check size={14} />{f}</li>
                ))}
              </ul>
              <button
                className={plan.highlight ? 'btn-land-primary' : 'btn-land-ghost'}
                onClick={() => navigate('/register')}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="land-footer">
        <div className="land-logo">
          <div className="land-logo-icon"><Zap size={16} /></div>
          <span>SLA Manager</span>
        </div>
        <p>© 2026 Digital Center. Όλα τα δικαιώματα διατηρούνται.</p>
      </footer>
    </div>
  )
}
