import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { CheckCircle, Clock, FileText, Users, BarChart2, Zap } from 'lucide-react'
import AnimatedPage from '../components/AnimatedPage'

const features = [
  { icon: Users, title: 'Client Management', desc: 'Track all your clients, their projects and payment history in one place.' },
  { icon: FileText, title: 'Smart Invoicing', desc: 'Create professional invoices with GST, send via email and track payments.' },
  { icon: Clock, title: 'Time Tracker', desc: 'Track billable hours in real-time with project-wise time logs.' },
  { icon: BarChart2, title: 'Analytics', desc: 'Get insights on revenue, top clients and project performance.' },
  { icon: CheckCircle, title: 'Task Management', desc: 'Manage project tasks with progress tracking and deadlines.' },
  { icon: Zap, title: 'Fast & Simple', desc: 'Clean UI designed for freelancers — no bloat, just what you need.' },
]

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: ['3 Clients', '5 Invoices/month', 'Basic Time Tracker', 'Project Management'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₹499',
    period: 'per month',
    features: ['Unlimited Clients', 'Unlimited Invoices', 'PDF + Email Invoice', 'Advanced Analytics', 'Priority Support'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Business',
    price: '₹999',
    period: 'per month',
    features: ['Everything in Pro', 'Client Portal', 'Team Members', 'Custom Invoice Template', 'API Access'],
    cta: 'Contact Sales',
    highlight: false,
  },
]

const stats = [
  { value: '1,005+', label: 'Freelancers' },
  { value: '₹50L+', label: 'Invoiced Payouts' },
  { value: '10K+', label: 'Managed Projects' },
  { value: '99.9%', label: 'Platform Uptime' },
]

// ── Count-up number, triggers once when scrolled into view ──────────────────
function CountUp({ value }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(reduceMotion ? value : '0')

  useEffect(() => {
    if (!inView) return
    if (reduceMotion) { setDisplay(value); return }

    const match = value.match(/[\d,.]+/)
    if (!match) { setDisplay(value); return }

    const target = parseFloat(match[0].replace(/,/g, ''))
    const prefix = value.slice(0, match.index)
    const suffix = value.slice(match.index + match[0].length)
    const duration = 1400
    const start = performance.now()

    let frame
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * target
      const formatted = target % 1 !== 0 ? current.toFixed(1) : Math.floor(current).toLocaleString('en-IN')
      setDisplay(`${prefix}${formatted}${suffix}`)
      if (progress < 1) frame = requestAnimationFrame(tick)
      else setDisplay(value)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, value, reduceMotion])

  return <span ref={ref}>{display}</span>
}

// ── Reusable scroll-reveal wrapper ───────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  const heroStagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
  }
  const heroItem = {
    hidden: reduceMotion ? {} : { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <AnimatedPage className="min-h-screen bg-[#07070a] text-gray-200 font-sans selection:bg-indigo-500/30 selection:text-white relative overflow-hidden">
      {/* Ambient backgrounds — slow breathing motion */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none z-0"
        animate={reduceMotion ? {} : { opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[800px] right-[-200px] w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"
        animate={reduceMotion ? {} : { x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[1800px] left-[-200px] w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"
        animate={reduceMotion ? {} : { x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      {/* Navbar */}
      <motion.nav
        initial={reduceMotion ? false : { opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-white/[0.04] px-6 md:px-12 py-4 flex justify-between items-center sticky top-0 bg-[#07070a]/80 backdrop-blur-md z-50"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            💼
          </div>
          <span className="text-base font-bold text-white tracking-tight">FreelanceOS</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-400 hover:text-white transition-colors text-xs font-semibold px-4 py-2"
          >
            Sign In
          </button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/register')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors duration-200 shadow-md shadow-indigo-500/10"
          >
            Get Started Free
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        variants={heroStagger}
        initial="hidden"
        animate="show"
        className="text-center px-6 pt-24 pb-16 max-w-4xl mx-auto relative z-10 flex flex-col items-center"
      >
        <motion.div
          variants={heroItem}
          className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 border border-indigo-500/20"
        >
          🚀 The Ultimate Suite for Professional Freelancers
        </motion.div>
        <motion.h1 variants={heroItem} className="text-5xl md:text-7xl font-black leading-tight text-white tracking-tight mb-6 max-w-3xl">
          Manage Your Freelance
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-purple-400 bg-[length:200%_auto] animate-[gradientShift_6s_ease_infinite]">
            Business Like a Pro
          </span>
        </motion.h1>
        <motion.p variants={heroItem} className="text-gray-400 text-base md:text-lg mb-10 max-w-2xl font-medium leading-relaxed">
          The all-in-one workspace built to manage clients, track tasks on a Kanban board, log billable hours, generate invoices automatically, and track expenses.
        </motion.p>
        <motion.div variants={heroItem} className="flex gap-4 justify-center flex-wrap">
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white px-8 py-4 rounded-xl font-bold text-base transition-colors duration-300 shadow-lg shadow-indigo-500/20"
          >
            Start Free — No Card Needed
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            className="bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.05] text-white px-8 py-4 rounded-xl font-bold text-base transition-colors duration-300"
          >
            Sign In →
          </motion.button>
        </motion.div>
        <motion.p variants={heroItem} className="text-gray-500 text-xs mt-6 font-semibold uppercase tracking-wider">
          Join thousands of global freelancers today
        </motion.p>
      </motion.section>

      {/* Hero Mockup — a live, breathing dashboard, not a static wireframe */}
      <Reveal delay={0.1} className="px-6 pb-24 max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="bg-[#111118]/40 border border-white/[0.05] rounded-2xl p-3 backdrop-blur-md shadow-2xl relative"
        >
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 blur-xl pointer-events-none" />
          <div className="border border-white/[0.03] rounded-xl overflow-hidden aspect-[16/9] bg-[#0c0c12] flex flex-col relative">
            <div className="h-9 bg-white/[0.02] border-b border-white/[0.03] flex items-center px-4 gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
              <span className="ml-3 text-[10px] text-gray-600 font-mono">app.freelanceos.com/dashboard</span>
            </div>

            <div className="flex-1 p-6 grid grid-cols-4 gap-4">
              {/* Sidebar skeleton */}
              <div className="col-span-1 border-r border-white/[0.03] pr-4 flex flex-col gap-2.5">
                {['Dashboard', 'Clients', 'Projects', 'Invoices', 'Time Tracker'].map((label, i) => (
                  <motion.div
                    key={label}
                    initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
                    className={`h-6 rounded flex items-center px-2 text-[9px] font-semibold tracking-wide ${i === 0 ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' : 'text-gray-600'
                      }`}
                  >
                    {label}
                  </motion.div>
                ))}
              </div>

              <div className="col-span-3 grid grid-cols-3 gap-4">
                {/* Revenue card with animated progress fill */}
                <div className="col-span-3 bg-white/[0.01] border border-white/[0.03] rounded-xl p-4 flex justify-between items-center h-20">
                  <div className="space-y-1">
                    <div className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">Monthly Revenue Goal</div>
                    <div className="text-base font-bold bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">
                      <CountUp value="₹68,400" /> / ₹1,00,000
                    </div>
                  </div>
                  <div className="h-2 w-1/3 bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                      initial={{ width: '0%' }}
                      whileInView={{ width: '68%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Mini stat cards */}
                {[
                  { label: 'Invoices Paid', value: '24' },
                  { label: 'Active Clients', value: '12' },
                  { label: 'Hours Logged', value: '186' },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.45 }}
                    className="bg-white/[0.01] border border-white/[0.03] rounded-xl p-4 h-28 space-y-2"
                  >
                    <div className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">{s.label}</div>
                    <div className="text-2xl font-black text-white/90">
                      <CountUp value={s.value} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Floating "task card" drifting from In Progress → Done, the one signature motion moment */}
            {!reduceMotion && (
              <motion.div
                className="absolute bottom-6 left-[28%] bg-[#161620] border border-indigo-500/30 rounded-lg px-3 py-1.5 text-[9px] font-semibold text-indigo-200 shadow-lg shadow-indigo-500/10 flex items-center gap-1.5"
                initial={{ opacity: 0, x: 0 }}
                whileInView={{ opacity: [0, 1, 1, 0], x: [0, 0, 140, 140] }}
                viewport={{ once: true }}
                transition={{ duration: 3.2, delay: 1, times: [0, 0.15, 0.85, 1], ease: 'easeInOut' }}
              >
                <CheckCircle size={11} className="text-emerald-400" />
                Invoice #INV-0847 marked paid
              </motion.div>
            )}
          </div>
        </motion.div>
      </Reveal>

      {/* Stats Section */}
      <section className="border-y border-white/[0.04] bg-white/[0.01] py-12 relative z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center px-6">
          {stats.map(({ value, label }, i) => (
            <Reveal key={label} delay={i * 0.08}>
              <p className="text-3xl font-black text-indigo-400 tracking-tight">
                <CountUp value={value} />
              </p>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-28 max-w-6xl mx-auto relative z-10">
        <Reveal className="text-center mb-20">
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">Everything You Need</h2>
          <p className="text-gray-450 text-base max-w-xl mx-auto font-medium">One clean, integrated dashboard to organize and automate your entire freelance workflow.</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={(i % 3) * 0.1}>
              <motion.div
                whileHover={reduceMotion ? {} : { y: -6, borderColor: 'rgba(99,102,241,0.3)' }}
                transition={{ duration: 0.25 }}
                className="bg-[#111118]/60 border border-white/[0.04] rounded-2xl p-6 backdrop-blur-md h-full"
              >
                <motion.div
                  whileHover={reduceMotion ? {} : { rotate: -6, scale: 1.08 }}
                  className="bg-indigo-500/10 w-11 h-11 rounded-xl flex items-center justify-center mb-5 border border-indigo-500/20"
                >
                  <Icon size={20} className="text-indigo-400" />
                </motion.div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed font-medium">{desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-6 py-28 max-w-6xl mx-auto relative z-10">
        <Reveal className="text-center mb-20">
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-405 text-base max-w-xl mx-auto font-medium">Start for free and scale up as your portfolio grows.</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.1}>
              <motion.div
                whileHover={reduceMotion ? {} : { y: -6 }}
                transition={{ duration: 0.25 }}
                className={`bg-[#111118]/60 border backdrop-blur-md rounded-2xl p-8 flex flex-col justify-between h-full relative ${plan.highlight
                    ? 'border-indigo-500 shadow-indigo-500/5 ring-1 ring-indigo-500/30 md:scale-105 z-10'
                    : 'border-white/[0.04] hover:border-white/[0.12]'
                  }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-extrabold text-white mb-2">{plan.name}</h3>
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{plan.period}</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-gray-305 text-sm font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/register')}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-colors duration-200 ${plan.highlight
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.04] text-white'
                    }`}
                >
                  {plan.cta}
                </motion.button>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-28 text-center relative z-10">
        <Reveal className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-b from-[#111118]/80 to-[#0d0d12]/90 border border-white/[0.05] rounded-3xl p-12 backdrop-blur-md shadow-2xl relative overflow-hidden">
            <motion.div
              className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"
              animate={reduceMotion ? {} : { scale: [1, 1.15, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"
              animate={reduceMotion ? {} : { scale: [1.15, 1, 1.15] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            <h2 className="text-4xl font-black text-white tracking-tight mb-4">Ready to Level Up Your Business?</h2>
            <p className="text-gray-400 text-base mb-8 max-w-xl mx-auto font-medium">Join independent professionals who run their entire client cycle and billing operations on FreelanceOS.</p>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/register')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-base transition-colors duration-200 shadow-md shadow-indigo-500/15"
            >
              Get Started Free Today →
            </motion.button>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] px-6 py-10 text-center text-gray-500 text-xs font-semibold uppercase tracking-wider relative z-10">
        <p>© 2024 FreelanceOS. Built with ❤️ for Freelancers.</p>
      </footer>

      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </AnimatedPage>
  )
}