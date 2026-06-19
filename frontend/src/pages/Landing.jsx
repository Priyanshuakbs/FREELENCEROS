import { useNavigate } from 'react-router-dom'
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
    color: 'border-gray-700',
    features: ['3 Clients', '5 Invoices/month', 'Basic Time Tracker', 'Project Management'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₹499',
    period: 'per month',
    color: 'border-indigo-500',
    features: ['Unlimited Clients', 'Unlimited Invoices', 'PDF + Email Invoice', 'Advanced Analytics', 'Priority Support'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Business',
    price: '₹999',
    period: 'per month',
    color: 'border-purple-500',
    features: ['Everything in Pro', 'Client Portal', 'Team Members', 'Custom Invoice Template', 'API Access'],
    cta: 'Contact Sales',
    highlight: false,
  }
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <AnimatedPage className="min-h-screen bg-[#07070a] text-gray-200 font-sans selection:bg-indigo-500/30 selection:text-white relative overflow-hidden">
      {/* Ambient backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none z-0" />
      <div className="absolute top-[800px] right-[-200px] w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[1800px] left-[-200px] w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="border-b border-white/[0.04] px-6 md:px-12 py-4 flex justify-between items-center sticky top-0 bg-[#07070a]/80 backdrop-blur-md z-50">
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
          <button 
            onClick={() => navigate('/register')} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition duration-200 shadow-md shadow-indigo-500/10 active:scale-95"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center px-6 pt-24 pb-16 max-w-4xl mx-auto relative z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 border border-indigo-500/20 animate-fade-in">
          🚀 The Ultimate Suite for Professional Freelancers
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-tight text-white tracking-tight mb-6 max-w-3xl">
          Manage Your Freelance
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-purple-400">
            Business Like a Pro
          </span>
        </h1>
        <p className="text-gray-400 text-base md:text-lg mb-10 max-w-2xl font-medium leading-relaxed">
          The all-in-one workspace built to manage clients, track tasks on a Kanban board, log billable hours, generate invoices automatically, and track expenses.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button 
            onClick={() => navigate('/register')} 
            className="bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            Start Free — No Card Needed
          </button>
          <button 
            onClick={() => navigate('/login')} 
            className="bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.05] text-white px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 active:scale-95"
          >
            Sign In →
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-6 font-semibold uppercase tracking-wider">Join thousands of global freelancers today</p>
      </section>

      {/* Hero Mockup Graphic */}
      <section className="px-6 pb-24 max-w-5xl mx-auto relative z-10">
        <div className="bg-[#111118]/40 border border-white/[0.05] rounded-2xl p-3 backdrop-blur-md shadow-2xl relative">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 blur-xl pointer-events-none" />
          <div className="border border-white/[0.03] rounded-xl overflow-hidden aspect-[16/9] bg-[#0c0c12] flex flex-col">
            {/* Top window headers */}
            <div className="h-9 bg-white/[0.02] border-b border-white/[0.03] flex items-center px-4 gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
            </div>
            {/* Mock content panel layout */}
            <div className="flex-1 p-6 grid grid-cols-4 gap-4">
              <div className="col-span-1 border-r border-white/[0.03] pr-4 flex flex-col gap-2">
                <div className="h-6 w-full bg-white/5 rounded" />
                <div className="h-4 w-5/6 bg-white/[0.02] rounded" />
                <div className="h-4 w-4/5 bg-white/[0.02] rounded" />
                <div className="h-4 w-3/4 bg-white/[0.02] rounded" />
              </div>
              <div className="col-span-3 grid grid-cols-3 gap-4">
                <div className="col-span-3 bg-white/[0.01] border border-white/[0.03] rounded-xl p-4 flex justify-between items-center h-20">
                  <div className="space-y-1">
                    <div className="h-3 w-24 bg-white/5 rounded" />
                    <div className="h-5 w-36 bg-gradient-to-r from-indigo-400 to-purple-400 rounded" />
                  </div>
                  <div className="h-2 w-1/3 bg-white/[0.02] rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full w-2/3" />
                  </div>
                </div>
                <div className="bg-white/[0.01] border border-white/[0.03] rounded-xl p-4 h-28 space-y-2">
                  <div className="h-3 w-12 bg-white/5 rounded" />
                  <div className="h-6 w-20 bg-white/10 rounded" />
                </div>
                <div className="bg-white/[0.01] border border-white/[0.03] rounded-xl p-4 h-28 space-y-2">
                  <div className="h-3 w-16 bg-white/5 rounded" />
                  <div className="h-6 w-16 bg-white/10 rounded" />
                </div>
                <div className="bg-white/[0.01] border border-white/[0.03] rounded-xl p-4 h-28 space-y-2">
                  <div className="h-3 w-14 bg-white/5 rounded" />
                  <div className="h-6 w-24 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/[0.04] bg-white/[0.01] py-12 relative z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center px-6">
          {[
            { value: '1,005+', label: 'Freelancers' },
            { value: '₹50L+', label: 'Invoiced Payouts' },
            { value: '10K+', label: 'Managed Projects' },
            { value: '99.9%', label: 'Platform Uptime' },
          ].map(({ value, label }) => (
            <div key={label} className="space-y-1">
              <p className="text-3xl font-black text-indigo-400 tracking-tight">{value}</p>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-28 max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">Everything You Need</h2>
          <p className="text-gray-450 text-base max-w-xl mx-auto font-medium">One clean, integrated dashboard to organize and automate your entire freelance workflow.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div 
              key={title} 
              className="bg-[#111118]/60 border border-white/[0.04] hover:border-indigo-500/30 hover:shadow-indigo-500/5 hover:-translate-y-1 rounded-2xl p-6 transition-all duration-350 backdrop-blur-md"
            >
              <div className="bg-indigo-500/10 w-11 h-11 rounded-xl flex items-center justify-center mb-5 border border-indigo-500/20">
                <Icon size={20} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-medium">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-6 py-28 max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-405 text-base max-w-xl mx-auto font-medium">Start for free and scale up as your portfolio grows.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`bg-[#111118]/60 border backdrop-blur-md rounded-2xl p-8 flex flex-col justify-between relative transition-all duration-300 hover:shadow-2xl ${
                plan.highlight 
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
              <button
                onClick={() => navigate('/register')}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-500 hover:to-purple-550 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.04] text-white'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-28 text-center relative z-10">
        <div className="max-w-3xl mx-auto bg-gradient-to-b from-[#111118]/80 to-[#0d0d12]/90 border border-white/[0.05] rounded-3xl p-12 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-4xl font-black text-white tracking-tight mb-4">Ready to Level Up Your Business?</h2>
          <p className="text-gray-400 text-base mb-8 max-w-xl mx-auto font-medium">Join independent professionals who run their entire client cycle and billing operations on FreelanceOS.</p>
          <button 
            onClick={() => navigate('/register')} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-base transition-all duration-200 shadow-md shadow-indigo-500/15 active:scale-95"
          >
            Get Started Free Today →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] px-6 py-10 text-center text-gray-500 text-xs font-semibold uppercase tracking-wider relative z-10">
        <p>© 2024 FreelanceOS. Built with ❤️ for Freelancers.</p>
      </footer>
    </AnimatedPage>
  )
}