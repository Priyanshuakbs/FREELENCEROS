import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import useClientAuthStore from './store/clientAuthStore'

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
import ProposalAccepted from './pages/ProposalAccepted'
import ClientOnboarding from './pages/ClientOnboarding'
import Profile from './pages/Profile'

// ⭐ CRM Pages
import Leads from './pages/Leads'
import LeadDetails from './pages/LeadDetails'

// Client Portal Pages
import ClientLogin from './pages/ClientLogin'
import ClientForgotPassword from './pages/ClientForgotPassword'
import ClientResetPassword from './pages/ClientResetPassword'
import ClientVerifyEmail from './pages/ClientVerifyEmail'
import ClientDashboard from './pages/ClientDashboard'

// Chat & Portfolio Pages
import Messages from './pages/Messages'
import PublicPortfolio from './pages/PublicPortfolio'
import FreelancersDirectory from './pages/FreelancersDirectory'

const PrivateRoute = ({ children }) => {
  const { token, user } = useAuthStore()

  if (!token) return <Navigate to="/login" />

  if (user && !user.isVerified) {
    return <Navigate to="/verify-email" />
  }

  return <Layout>{children}</Layout>
}

const AdminRoute = ({ children }) => {
  const { token, user } = useAuthStore()

  if (!token) return <Navigate to="/login" />

  if (user && !user.isVerified) {
    return <Navigate to="/verify-email" />
  }

  if (user && user.role !== 'admin') {
    return <Navigate to="/projects" />
  }

  return <Layout>{children}</Layout>
}

const VerifyRoute = ({ children }) => {
  const { token, user } = useAuthStore()

  if (!token) return <Navigate to="/login" />

  if (user && user.isVerified) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/dashboard' : '/projects'}
      />
    )
  }

  return children
}

const ClientRoute = ({ children }) => {
  const { token } = useClientAuthStore()

  if (!token) return <Navigate to="/client-login" />

  return children
}

const MessagesRoute = () => {
  const { token: userToken, user } = useAuthStore()
  const { token: clientToken } = useClientAuthStore()

  if (userToken) {
    if (user && !user.isVerified) {
      return <Navigate to="/verify-email" />
    }
    return <Layout><Messages /></Layout>
  }

  if (clientToken) {
    return <Messages />
  }

  return <Navigate to="/login" />
}

const FallbackRoute = () => {
  const { token: userToken, user } = useAuthStore()
  const { token: clientToken } = useClientAuthStore()

  if (userToken) {
    return <Navigate to={user?.role === 'admin' ? '/dashboard' : '/projects'} />
  }
  if (clientToken) {
    return <Navigate to="/client-dashboard" />
  }
  return <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />

      <Routes>

        {/* ---------------- Public Routes ---------------- */}

        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/verify-email"
          element={
            <VerifyRoute>
              <VerifyEmail />
            </VerifyRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        <Route
          path="/accept-invite/:token"
          element={<AcceptInvite />}
        />

        <Route
          path="/portal/:token"
          element={<ClientPortal />}
        />

        <Route
          path="/proposal-accepted"
          element={<ProposalAccepted />}
        />

        <Route
          path="/freelancers"
          element={<FreelancersDirectory />}
        />

        <Route
          path="/explore"
          element={<FreelancersDirectory />}
        />

        <Route
          path="/portfolio/:identifier"
          element={<PublicPortfolio />}
        />

        <Route
          path="/freelancers/:identifier"
          element={<PublicPortfolio />}
        />

        <Route
          path="/onboarding/:token"
          element={<ClientOnboarding />}
        />

        <Route
          path="/messages"
          element={<MessagesRoute />}
        />

        <Route
          path="/messages/:conversationId"
          element={<MessagesRoute />}
        />

        {/* ---------------- Client Dashboard Routes ---------------- */}

        <Route path="/client-login" element={<ClientLogin />} />
        
        <Route path="/client-forgot-password" element={<ClientForgotPassword />} />
        
        <Route path="/client-reset-password/:token" element={<ClientResetPassword />} />
        
        <Route path="/client-verify" element={<ClientVerifyEmail />} />

        <Route
          path="/client-dashboard"
          element={
            <ClientRoute>
              <ClientDashboard />
            </ClientRoute>
          }
        />

        {/* ---------------- Admin Routes ---------------- */}

        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/clients"
          element={<Navigate to="/leads" replace />}
        />

        {/* ⭐ NEW LEADS MODULE */}

        <Route
          path="/leads"
          element={
            <AdminRoute>
              <Leads />
            </AdminRoute>
          }
        />

        <Route
          path="/leads/:id"
          element={
            <AdminRoute>
              <LeadDetails />
            </AdminRoute>
          }
        />

        <Route
          path="/invoices"
          element={
            <AdminRoute>
              <Invoices />
            </AdminRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <AdminRoute>
              <Expenses />
            </AdminRoute>
          }
        />

        <Route
          path="/contracts"
          element={
            <AdminRoute>
              <Contracts />
            </AdminRoute>
          }
        />

        <Route
          path="/tax-estimator"
          element={
            <AdminRoute>
              <TaxEstimator />
            </AdminRoute>
          }
        />

        <Route
          path="/proposals"
          element={
            <AdminRoute>
              <Proposals />
            </AdminRoute>
          }
        />

        {/* ---------------- Authenticated Routes ---------------- */}

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        <Route
          path="/projects"
          element={
            <PrivateRoute>
              <Projects />
            </PrivateRoute>
          }
        />

        <Route
          path="/kanban"
          element={
            <PrivateRoute>
              <Kanban />
            </PrivateRoute>
          }
        />

        <Route
          path="/time-tracker"
          element={
            <PrivateRoute>
              <TimeTracker />
            </PrivateRoute>
          }
        />

        {/* ---------------- Fallback ---------------- */}

        <Route
          path="*"
          element={<FallbackRoute />}
        />
      </Routes>
    </BrowserRouter>
  )
}