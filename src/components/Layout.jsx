import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, FileText, MapPin, Settings, Zap, Menu, X } from 'lucide-react'
import { useState } from 'react'
import './Layout.css'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks',     icon: ClipboardList,   label: 'Εντολές' },
  { to: '/reports',   icon: FileText,        label: 'Reports' },
  { to: '/locations', icon: MapPin,          label: 'Τοποθεσίες' },
  { to: '/settings',  icon: Settings,        label: 'Ρυθμίσεις' },
]

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon"><Zap size={18} /></div>
          <div>
            <div className="logo-title">Digital Center</div>
            <div className="logo-sub">SLA Manager</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
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

        <div className="sidebar-footer">
          <div className="version">v1.0.0</div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-wrap">
        <header className="topbar">
          <button className="btn btn-icon btn-ghost mobile-menu" onClick={() => setOpen(!open)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="topbar-right">
            <span className="topbar-brand">SLA Manager</span>
          </div>
        </header>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
