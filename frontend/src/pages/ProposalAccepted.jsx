import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MessageSquare, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import useClientAuthStore from '../store/clientAuthStore'

export default function ProposalAccepted() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth } = useClientAuthStore()

  const name = searchParams.get('name') || 'Valued Client'
  const company = searchParams.get('company') || ''
  const freelancer = searchParams.get('freelancer') || 'FreelanceOS'
  const conversationId = searchParams.get('conversationId') || ''
  const clientToken = searchParams.get('clientToken') || ''
  const clientId = searchParams.get('clientId') || ''
  const isError = searchParams.get('error') === 'true'

  const [visible, setVisible] = useState(false)
  const [particles, setParticles] = useState([])
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // If clientToken was passed in redirect, auto-authenticate client
    if (clientToken && clientId) {
      setAuth(
        {
          id: clientId,
          _id: clientId,
          name,
          company,
          role: 'client',
        },
        clientToken
      )
    }

    setTimeout(() => setVisible(true), 100)

    // Generate floating particles
    const generated = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      delay: Math.random() * 3,
      duration: Math.random() * 4 + 3,
      color: ['#4f46e5', '#7c3aed', '#059669', '#0ea5e9', '#f59e0b'][Math.floor(Math.random() * 5)],
    }))
    setParticles(generated)
  }, [clientToken, clientId, name, company])

  // Optional auto-redirect countdown if conversationId exists
  useEffect(() => {
    if (!conversationId || isError) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate(`/messages/${conversationId}`)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [conversationId, isError, navigate])

  const handleOpenChat = () => {
    if (conversationId) {
      navigate(`/messages/${conversationId}`)
    } else {
      navigate('/client-dashboard')
    }
  }

  if (isError) {
    return (
      <div style={styles.page}>
        <div style={styles.bgGradient} />
        <div style={{ ...styles.card, ...styles.errorCard, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.6s ease' }}>
          <div style={styles.iconWrap}>
            <span style={{ fontSize: 56 }}>😔</span>
          </div>
          <h1 style={{ ...styles.heading, color: '#ef4444' }}>Oops! Something went wrong</h1>
          <p style={styles.subtext}>
            The proposal link may be invalid or has already expired. Please contact your freelancer for a new link.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {/* Animated gradient background */}
      <div style={styles.bgGradient} />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: p.color,
            opacity: 0.15,
            animation: `float ${p.duration}s ${p.delay}s ease-in-out infinite alternate`,
            pointerEvents: 'none',
          }}
        />
      ))}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        @keyframes float {
          from { transform: translateY(0px) scale(1); opacity: 0.12; }
          to   { transform: translateY(-30px) scale(1.1); opacity: 0.25; }
        }
        @keyframes checkPop {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.2) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes ringPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(79,70,229,0.4); }
          50%       { box-shadow: 0 0 0 20px rgba(79,70,229,0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes confettiFall {
          0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      {/* Confetti pieces */}
      {[...Array(12)].map((_, i) => (
        <div
          key={`confetti-${i}`}
          style={{
            position: 'fixed',
            top: '-20px',
            left: `${(i * 8) + 4}%`,
            width: 10,
            height: 10,
            background: ['#4f46e5', '#059669', '#f59e0b', '#ec4899', '#0ea5e9'][i % 5],
            borderRadius: i % 2 === 0 ? '50%' : '2px',
            animation: `confettiFall ${2.5 + i * 0.3}s ${i * 0.2}s ease-in forwards`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Main card */}
      <div
        style={{
          ...styles.card,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
          transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Logo / Brand */}
        <div style={styles.brand}>
          <span style={styles.brandDot} />
          <span style={styles.brandText}>FreelanceOS</span>
        </div>

        {/* Success Icon */}
        <div style={styles.iconRing}>
          <div style={styles.iconInner}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'checkPop 0.6s 0.4s ease both' }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Main heading */}
        <h1 style={{ ...styles.heading, animation: 'fadeUp 0.5s 0.5s ease both', opacity: 0 }}>
          🎉 Proposal Accepted!
        </h1>

        {/* Subtext */}
        <p style={{ ...styles.subtext, animation: 'fadeUp 0.5s 0.65s ease both', opacity: 0 }}>
          Thank you, <strong style={{ color: '#4f46e5' }}>{name}</strong>
          {company && <> from <strong style={{ color: '#7c3aed' }}>{company}</strong></>}!
          <br />
          Your acceptance has been confirmed and negotiation room is open.
        </p>

        {/* Info box */}
        <div style={{ ...styles.infoBox, animation: 'fadeUp 0.5s 0.8s ease both', opacity: 0 }}>
          <div style={styles.infoRow}>
            <span style={styles.infoIcon}>📬</span>
            <span style={styles.infoLabel}>
              <strong>{freelancer}</strong> has been notified and direct messaging is activated.
            </span>
          </div>
          <div style={styles.divider} />
          <div style={styles.infoRow}>
            <span style={styles.infoIcon}>🚀</span>
            <span style={styles.infoLabel}>
              You can now discuss project specifics and start work immediately.
            </span>
          </div>
        </div>

        {/* Status badge */}
        <div style={{ ...styles.badge, animation: 'fadeUp 0.5s 0.95s ease both', opacity: 0 }}>
          <span style={styles.badgeDot} />
          Status: <strong>Negotiation & Chat Active</strong>
        </div>

        {/* Direct Action: Chat with Freelancer */}
        <div style={{ animation: 'fadeUp 0.5s 1.05s ease both', opacity: 0, marginBottom: '20px' }}>
          <button
            onClick={handleOpenChat}
            style={styles.chatButton}
          >
            <MessageSquare size={18} style={{ marginRight: 8 }} />
            <span>Chat with {freelancer}</span>
            <ArrowRight size={16} style={{ marginLeft: 8 }} />
          </button>

          {conversationId && countdown > 0 && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 10 }}>
              Redirecting automatically to chat in <strong>{countdown}s</strong>...
            </p>
          )}
        </div>

        {/* Footer */}
        <p style={{ ...styles.footer, animation: 'fadeUp 0.5s 1.2s ease both', opacity: 0 }}>
          Powered by <strong style={{ color: '#4f46e5' }}>FreelanceOS</strong> · Direct Freelancer Workspace
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
    background: '#0f0c29',
  },
  bgGradient: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    zIndex: 0,
  },
  card: {
    position: 'relative',
    zIndex: 10,
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '24px',
    padding: '48px 40px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 25px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
  },
  errorCard: {
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '28px',
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    display: 'inline-block',
    boxShadow: '0 0 12px rgba(79,70,229,0.6)',
  },
  brandText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 600,
    fontSize: 15,
    letterSpacing: '0.5px',
  },
  iconRing: {
    width: 90,
    height: 90,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(124,58,237,0.2))',
    border: '2px solid rgba(79,70,229,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    animation: 'ringPulse 2s 1s ease-in-out infinite',
  },
  iconInner: {
    width: 66,
    height: 66,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(79,70,229,0.5)',
  },
  heading: {
    fontSize: 28,
    fontWeight: 800,
    color: '#ffffff',
    margin: '0 0 12px',
    letterSpacing: '-0.5px',
  },
  subtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 1.65,
    margin: '0 0 24px',
  },
  infoBox: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '18px 20px',
    marginBottom: '20px',
    textAlign: 'left',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '6px 0',
  },
  infoIcon: {
    fontSize: 18,
    flexShrink: 0,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.5,
  },
  divider: {
    height: '1px',
    background: 'rgba(255,255,255,0.08)',
    margin: '10px 0',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(5,150,105,0.15)',
    border: '1px solid rgba(5,150,105,0.3)',
    borderRadius: '100px',
    padding: '8px 18px',
    color: '#34d399',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: '24px',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#34d399',
    boxShadow: '0 0 8px #34d399',
    animation: 'ringPulse 1.5s ease-in-out infinite',
    display: 'inline-block',
  },
  chatButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '700',
    borderRadius: '14px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 10px 25px -5px rgba(79,70,229,0.5)',
    transition: 'all 0.2s ease',
  },
  footer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    margin: 0,
  },
  iconWrap: {
    marginBottom: '16px',
  },
}
