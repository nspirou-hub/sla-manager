import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Tasks from './pages/Tasks.jsx'
import TaskForm from './pages/TaskForm.jsx'
import Reports from './pages/Reports.jsx'
import Locations from './pages/Locations.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"           element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"  element={<Dashboard />} />
        <Route path="/tasks"      element={<Tasks />} />
        <Route path="/tasks/new"  element={<TaskForm />} />
        <Route path="/tasks/:id"  element={<TaskForm />} />
        <Route path="/reports"    element={<Reports />} />
        <Route path="/locations"  element={<Locations />} />
        <Route path="/settings"   element={<Settings />} />
      </Routes>
    </Layout>
  )
}
