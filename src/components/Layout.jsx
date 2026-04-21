import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, FileText, MapPin, Settings, Zap, Menu, X, LogOut, User, Users } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import './Layout.css'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks',     icon: ClipboardList,   label: 'Εντολές' },
  { to: '/reports',   icon: FileText,        label: 'Reports' },
  { to: '/locations', icon: MapPin,          label: 'Τοποθεσίες' },
  { to: '/settings',  icon: Settings,        label: 'Ρυθμίσεις' },
  { to: '/users',     icon: Users,          label: 'Χρήστες', adminOnly: true },
]

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const { profile, org, signOut, isAdmin } = useAuth()

  return (
    <div className="layout">
      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon"><Zap size={18} /></div>
          <div>
            <div className="logo-title">{org?.name || 'SLA Manager'}</div>
            <div className="logo-sub">SLA Manager</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.filter(n => !n.adminOnly || isAdmin).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar"><User size={14} /></div>
            <div>
              <div className="user-name">{profile?.full_name || 'Χρήστης'}</div>
              <div className="user-role">{profile?.role === 'admin' ? 'Admin' : 'User'}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={signOut} title="Αποσύνδεση">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <button className="btn btn-icon btn-ghost mobile-menu" onClick={() => setOpen(!open)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="topbar-right">
            <span className="topbar-brand">{org?.name || 'SLA Manager'}</span>
          </div>
        </header>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
