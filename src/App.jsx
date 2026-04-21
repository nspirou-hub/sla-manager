import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Landing from './pages/Landing.jsx'
import { Login, Register } from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Tasks from './pages/Tasks.jsx'
import TaskForm from './pages/TaskForm.jsx'
import Reports from './pages/Reports.jsx'
import Locations from './pages/Locations.jsx'
import Settings from './pages/Settings.jsx'
import Users from './pages/Users.jsx'
import AcceptInvite from './pages/AcceptInvite.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" />
    </div>
  )
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"         element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/tasks"     element={<ProtectedRoute><Layout><Tasks /></Layout></ProtectedRoute>} />
      <Route path="/tasks/new" element={<ProtectedRoute><Layout><TaskForm /></Layout></ProtectedRoute>} />
      <Route path="/tasks/:id" element={<ProtectedRoute><Layout><TaskForm /></Layout></ProtectedRoute>} />
      <Route path="/reports"   element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
      <Route path="/locations" element={<ProtectedRoute><Layout><Locations /></Layout></ProtectedRoute>} />
      <Route path="/settings"  element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="/users"     element={<ProtectedRoute><Layout><Users /></Layout></ProtectedRoute>} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
