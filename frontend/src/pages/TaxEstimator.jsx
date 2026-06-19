import { useState, useEffect } from 'react'
import { Percent, DollarSign, Calculator, AlertCircle, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'

export default function TaxEstimator() {
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [gstInput, setGstInput] = useState('')
  const [gstResults, setGstResults] = useState(null)

  async function fetchFinancials() {
    try {
      const [invoicesRes, expensesRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/expenses'),
      ])
      
      const paidInvoicesTotal = invoicesRes.data.invoices
        .filter((i) => i.status === 'paid')
        .reduce((acc, i) => acc + i.total, 0)
        
      const expensesTotal = expensesRes.data.expenses.reduce((acc, e) => acc + e.amount, 0)

      setIncome(paidInvoicesTotal)
      setExpenses(expensesTotal)
    } catch {
      toast.error('Failed to load financials for tax estimation')
    }
  }

  useEffect(() => {
    fetchFinancials()
  }, [])

  // Section 44ADA Presumptive Tax calculations (applicable up to 75L gross receipts)
  const presumptiveTaxableIncome = income * 0.50
  const regularTaxableIncome = Math.max(0, income - expenses)
  const thresholdExceeded = income > 7500000

  // Standard Indian Tax Slabs (Simplified New Tax Regime estimation)
  const estimateTax = (taxableIncome) => {
    if (taxableIncome <= 300000) return 0
    let tax = 0
    let tempIncome = taxableIncome

    // Up to 3L - Nil
    // 3L to 6L - 5%
    if (tempIncome > 300000) {
      const slab = Math.min(300000, tempIncome - 300000)
      tax += slab * 0.05
    }
    // 6L to 9L - 10%
    if (tempIncome > 600000) {
      const slab = Math.min(300000, tempIncome - 600000)
      tax += slab * 0.10
    }
    // 9L to 12L - 15%
    if (tempIncome > 900000) {
      const slab = Math.min(300000, tempIncome - 900000)
      tax += slab * 0.15
    }
    // 12L to 15L - 20%
    if (tempIncome > 1200000) {
      const slab = Math.min(300000, tempIncome - 1200000)
      tax += slab * 0.20
    }
    // Above 15L - 30%
    if (tempIncome > 1500000) {
      const slab = tempIncome - 1500000
      tax += slab * 0.30
    }

    // 4% Health & Education Cess
    tax += tax * 0.04
    return Math.round(tax)
  }

  const presumptiveTax = estimateTax(presumptiveTaxableIncome)
  const regularTax = estimateTax(regularTaxableIncome)

  const handleGstCalculate = (e) => {
    e.preventDefault()
    const grossVal = Number(gstInput)
    if (!grossVal || grossVal <= 0) return

    // Assumes 18% standard GST rate
    const baseValue = Math.round(grossVal / 1.18)
    const gstTotal = grossVal - baseValue
    const cgst = Math.round(gstTotal / 2)
    const sgst = cgst

    setGstResults({
      gross: grossVal,
      base: baseValue,
      gst: gstTotal,
      cgst,
      sgst,
    })
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Tax & GST <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Estimator</span> 🧮
        </h1>
        <p className="text-gray-400 text-sm mt-1.5 font-medium">Estimate tax liability under Section 44ADA presumptive scheme vs. actual expenses scheme.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 backdrop-blur shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Gross Receipts (Paid Revenue)</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">
            ₹{Number(income).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 backdrop-blur shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Tracked Expenses</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <Percent size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">
            ₹{Number(expenses).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Section 44ADA Comparison Panel (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 backdrop-blur shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Calculator size={18} className="text-emerald-400" />
              Tax Regime Comparison (FY 2024-25)
            </h2>
            <p className="text-xs text-gray-400 mb-6">Comparison under the Simplified Slab Rates of the New Tax Regime.</p>

            {thresholdExceeded && (
              <div className="bg-amber-950/20 border border-amber-800/40 text-amber-400 p-4 rounded-xl mb-6 flex gap-3 text-sm">
                <AlertCircle size={20} className="shrink-0" />
                <p>Gross receipts exceed ₹75 Lakhs limit. You are ineligible for the presumptive scheme under Section 44ADA.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Presumptive scheme */}
              <div className={`p-5 rounded-2xl border ${!thresholdExceeded ? 'bg-indigo-950/10 border-indigo-500/25' : 'bg-gray-950/40 border-gray-850 opacity-60'}`}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-white text-sm">Presumptive Scheme (Sec 44ADA)</h3>
                  {!thresholdExceeded && <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded">Eligible</span>}
                </div>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex justify-between border-b border-gray-800/60 pb-2">
                    <span className="text-gray-400">Assumed Profit Rate</span>
                    <span className="font-semibold text-white">50% of gross</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800/60 pb-2">
                    <span className="text-gray-400">Taxable Net Income</span>
                    <span className="font-semibold text-white">₹{Number(presumptiveTaxableIncome).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-gray-400">Estimated Income Tax</span>
                    <span className="font-bold text-indigo-400">₹{Number(presumptiveTax).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Regular Scheme */}
              <div className="p-5 rounded-2xl border bg-gray-950/40 border-gray-850">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-white text-sm">Standard Deduction Scheme</h3>
                  <span className="bg-gray-800 text-gray-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded">Expenses Deduction</span>
                </div>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex justify-between border-b border-gray-800/60 pb-2">
                    <span className="text-gray-400">Actual Profit Rate</span>
                    <span className="font-semibold text-white">
                      {income > 0 ? Math.round(((income - expenses) / income) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800/60 pb-2">
                    <span className="text-gray-400">Taxable Net Income</span>
                    <span className="font-semibold text-white">₹{Number(regularTaxableIncome).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-gray-400">Estimated Income Tax</span>
                    <span className="font-bold text-emerald-400">₹{Number(regularTax).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {!thresholdExceeded && (
              <div className="bg-indigo-950/20 border border-indigo-850/40 text-indigo-300 p-4 rounded-xl mt-6 flex gap-3 text-xs">
                <HelpCircle size={18} className="shrink-0 text-indigo-400" />
                <p>
                  <strong>Which is better?</strong>{' '}
                  {presumptiveTax < regularTax 
                    ? `Presumptive Taxation (Sec 44ADA) saves you approx. ₹${(regularTax - presumptiveTax).toLocaleString('en-IN')} in taxes because your actual expenses are less than 50% of your earnings.`
                    : `The Standard scheme is better because your actual tracked expenses exceed 50% of your revenue, which lowers your taxable income.`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* GST Calculator (1 Col) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 backdrop-blur shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calculator size={18} className="text-pink-400" />
              GST 18% Estimator
            </h2>
            <form onSubmit={handleGstCalculate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Invoice Amount (₹)</label>
                <input
                  type="number"
                  value={gstInput}
                  onChange={(e) => setGstInput(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full bg-gray-950/80 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-600 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold py-2.5 rounded-xl shadow-lg transition duration-300 text-sm"
              >
                Estimate GST
              </button>
            </form>

            {gstResults && (
              <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-4 space-y-3 text-xs text-gray-300">
                <div className="flex justify-between border-b border-gray-850 pb-2">
                  <span className="text-gray-400 font-medium">Receipt Invoice Total:</span>
                  <span className="font-bold text-white">₹{gstResults.gross.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-2">
                  <span className="text-gray-400">Base Project Value:</span>
                  <span className="font-bold text-white">₹{gstResults.base.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-2">
                  <span className="text-gray-400">Total GST (18% inclusive):</span>
                  <span className="font-bold text-pink-400">₹{gstResults.gst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[11px] pl-2">
                  <span className="text-gray-500">CGST (9%):</span>
                  <span className="text-gray-400">₹{gstResults.cgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[11px] pl-2">
                  <span className="text-gray-500">SGST (9%):</span>
                  <span className="text-gray-400">₹{gstResults.sgst.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
