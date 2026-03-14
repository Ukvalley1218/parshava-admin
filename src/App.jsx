import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AdminAuthProvider } from './context/AdminAuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SalesUsers from './pages/SalesUsers'
import Customers from './pages/Customers'
import Inquiries from './pages/Inquiries'
import Orders from './pages/Orders'
import Products from './pages/Products'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <Routes>
          {/* Login Route */}
          <Route path="/admin/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<SalesUsers />} />
            <Route path="customers" element={<Customers />} />
            <Route path="inquiries" element={<Inquiries />} />
            <Route path="orders" element={<Orders />} />
            <Route path="products" element={<Products />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Redirect root to admin */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Router>
    </AdminAuthProvider>
  )
}

export default App