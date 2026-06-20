import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Projects from './pages/Projects'
import TimeTracker from './pages/TimeTracker'
import Invoices from './pages/Invoices'
import Landing from './pages/Landing'
import Kanban from './pages/Kanban'
import Expenses from './pages/Expenses'
import Contracts from './pages/Contracts'
import TaxEstimator from './pages/TaxEstimator'
import ClientPortal from './pages/ClientPortal'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AcceptInvite from './pages/AcceptInvite'
import Proposals from './pages/Proposals'
import ClientOnboarding from './pages/ClientOnboarding'
import Profile from './pages/Profile'


const PrivateRoute = ({ children }) => {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" />
  if (user && !user.isVerified) return <Navigate to="/verify-email" />
  return <Layout>{children}</Layout>
}

const AdminRoute = ({ children }) => {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" />
  if (user && !user.isVerified) return <Navigate to="/verify-email" />
  if (user && user.role !== 'admin') return <Navigate to="/projects" />
  return <Layout>{children}</Layout>
}

const VerifyRoute = ({ children }) => {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" />
  if (user && user.isVerified) {
    return <Navigate to={user.role === 'admin' ? "/dashboard" : "/projects"} />
  }
  return children
}

export default function App() {
  const { user } = useAuthStore()
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyRoute><VerifyEmail /></VerifyRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
        <Route path="/portal/:token" element={<ClientPortal />} />
        <Route path="/onboarding/:token" element={<ClientOnboarding />} />
        <Route path="/" element={<Landing />} />

        {/* Admin-only routes */}
        <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/clients" element={<AdminRoute><Clients /></AdminRoute>} />
        <Route path="/invoices" element={<AdminRoute><Invoices /></AdminRoute>} />
        <Route path="/expenses" element={<AdminRoute><Expenses /></AdminRoute>} />
        <Route path="/contracts" element={<AdminRoute><Contracts /></AdminRoute>} />
        <Route path="/tax-estimator" element={<AdminRoute><TaxEstimator /></AdminRoute>} />
        <Route path="/proposals" element={<AdminRoute><Proposals /></AdminRoute>} />

        {/* All authenticated users */}
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
        <Route path="/time-tracker" element={<PrivateRoute><TimeTracker /></PrivateRoute>} />
        <Route path="/kanban" element={<PrivateRoute><Kanban /></PrivateRoute>} />

        <Route path="*" element={<Navigate to={user?.role === 'admin' ? "/dashboard" : "/projects"} />} />
      </Routes>
    </BrowserRouter>
  )
}
