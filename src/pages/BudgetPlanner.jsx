import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import {
  FaWallet,
  FaCalculator,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSlidersH
} from 'react-icons/fa';

function BudgetPlanner() {
  const { API_URL, user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 50/30/20 Budgeting sliders allocation percentages
  const [needsPct, setNeedsPct] = useState(50);
  const [wantsPct, setWantsPct] = useState(30);
  const [savingsPct, setSavingsPct] = useState(20);

  // Custom budgets state persistence
  const [customBudgets, setCustomBudgets] = useState({
    Food: 8000,
    Shopping: 5000,
    Rent: 15000,
    Utilities: 4000,
    Travel: 3000,
    Entertainment: 2000
  });

  const [activeCategory, setActiveCategory] = useState('Food');
  const [customValueInput, setCustomValueInput] = useState('8000');

  const income = user?.monthlyIncome || 60000;

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/finance/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchExpenses();
    // Load persisted envelopes
    const saved = localStorage.getItem('finbuddy_envelopes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNeedsPct(parsed.needs || 50);
        setWantsPct(parsed.wants || 30);
        setSavingsPct(parsed.savings || 20);
      } catch (e) {
        console.error(e);
      }
    }
    const savedCats = localStorage.getItem('finbuddy_category_limits');
    if (savedCats) {
      try {
        setCustomBudgets(JSON.parse(savedCats));
      } catch (e) {
        console.error(e);
      }
    }
  }, [fetchExpenses]);

  // Adjust sliders helper
  const handleSliderChange = (type, value) => {
    const val = parseInt(value);
    if (type === 'needs') {
      setNeedsPct(val);
      // Adjust remaining to sum to 100
      const remaining = 100 - val;
      setWantsPct(Math.round(remaining * 0.6));
      setSavingsPct(Math.round(remaining * 0.4));
    } else if (type === 'wants') {
      setWantsPct(val);
      const remaining = 100 - val;
      setNeedsPct(Math.round(remaining * 0.7));
      setSavingsPct(Math.round(remaining * 0.3));
    } else {
      setSavingsPct(val);
      const remaining = 100 - val;
      setNeedsPct(Math.round(remaining * 0.62));
      setWantsPct(Math.round(remaining * 0.38));
    }
  };

  const handleSaveEnvelopes = () => {
    localStorage.setItem('finbuddy_envelopes', JSON.stringify({ needs: needsPct, wants: wantsPct, savings: savingsPct }));
    alert('50/30/20 Envelopes saved successfully!');
  };

  const handleUpdateCustomBudget = (e) => {
    e.preventDefault();
    const val = parseFloat(customValueInput);
    if (isNaN(val) || val < 0) return;

    const updated = {
      ...customBudgets,
      [activeCategory]: val
    };
    setCustomBudgets(updated);
    localStorage.setItem('finbuddy_category_limits', JSON.stringify(updated));
  };

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [expenses]);

  // Aggregate actual category spends
  const actualSpends = useMemo(() => {
    const catSpends = { Food: 0, Shopping: 0, Rent: 0, Utilities: 0, Travel: 0, Entertainment: 0 };
    currentMonthExpenses.forEach(e => {
      if (catSpends[e.category] !== undefined) {
        catSpends[e.category] += e.amount;
      } else {
        catSpends[e.category] = e.amount;
      }
    });
    return catSpends;
  }, [currentMonthExpenses]);

  // Merge budget data for plotting
  const chartData = useMemo(() => {
    return Object.keys(customBudgets).map(cat => ({
      name: cat,
      Planned: customBudgets[cat] || 0,
      Spent: actualSpends[cat] || 0
    }));
  }, [customBudgets, actualSpends]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <FaWallet className="text-blue-500" /> Budget Planner
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Allocate monthly salary envelopes using classical rules and monitor real-time category spends.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Envelope Sliders Card (1-Col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 h-fit">
          <div>
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <FaSlidersH className="text-teal-400" /> 50/30/20 Allocation Envelopes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Divide your net income (₹{income.toLocaleString()}).</p>
          </div>

          <div className="space-y-5 text-xs font-semibold">
            {/* Needs */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                <span>Needs (Essentials)</span>
                <span className="text-blue-400 font-mono">₹{Math.round((needsPct / 100) * income).toLocaleString()} ({needsPct}%)</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={needsPct}
                onChange={(e) => handleSliderChange('needs', e.target.value)}
                className="w-full h-1.5 bg-slate-950 rounded-lg cursor-pointer accent-blue-500"
              />
            </div>

            {/* Wants */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                <span>Wants (Lifestyle)</span>
                <span className="text-purple-400 font-mono">₹{Math.round((wantsPct / 100) * income).toLocaleString()} ({wantsPct}%)</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={wantsPct}
                onChange={(e) => handleSliderChange('wants', e.target.value)}
                className="w-full h-1.5 bg-slate-950 rounded-lg cursor-pointer accent-purple-500"
              />
            </div>

            {/* Savings */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                <span>Savings (Wealth)</span>
                <span className="text-emerald-400 font-mono">₹{Math.round((savingsPct / 100) * income).toLocaleString()} ({savingsPct}%)</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={savingsPct}
                onChange={(e) => handleSliderChange('savings', e.target.value)}
                className="w-full h-1.5 bg-slate-950 rounded-lg cursor-pointer accent-emerald-500"
              />
            </div>

            <button
              onClick={handleSaveEnvelopes}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer text-center mt-3"
            >
              Save Envelopes
            </button>
          </div>
        </div>

        {/* Planned vs Actual Comparison Bar Chart (2-Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-md font-bold text-white">Category Envelopes Audit</h3>
              <p className="text-xs text-slate-400 mt-0.5">Planned limits vs. actual current month spending.</p>
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2.5 py-1 rounded-full font-bold">
              Budgets Audit Tracker
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="name" stroke="#475569" fontSize={9} />
                <YAxis stroke="#475569" fontSize={9} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Bar dataKey="Planned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Configure Custom Category Caps */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div>
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <FaCalculator className="text-indigo-400" /> Custom Category Budget Editor
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure target envelope spending limits for individual categories.
          </p>
        </div>

        <form onSubmit={handleUpdateCustomBudget} className="flex flex-col md:flex-row gap-4 items-end text-xs font-semibold">
          <div className="w-full md:w-48">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Category
            </label>
            <select
              value={activeCategory}
              onChange={(e) => {
                setActiveCategory(e.target.value);
                setCustomValueInput(customBudgets[e.target.value] || '0');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
            >
              {Object.keys(customBudgets).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-48">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Budget Cap Limit (₹)
            </label>
            <input
              type="number"
              value={customValueInput}
              onChange={(e) => setCustomValueInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer h-[38px] shrink-0"
          >
            Apply Category Cap
          </button>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-slate-800/60">
          {Object.entries(customBudgets).map(([cat, val]) => {
            const spent = actualSpends[cat] || 0;
            const breached = spent > val;
            return (
              <div key={cat} className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-1 relative overflow-hidden text-xs">
                <div className={`absolute top-0 left-0 w-1 h-full ${breached ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">{cat}</span>
                <div className="font-extrabold text-white mt-1">₹{val.toLocaleString()}</div>
                <span className={`text-[9px] font-bold flex items-center gap-1 mt-1 ${breached ? 'text-red-400' : 'text-slate-500'}`}>
                  {breached ? <FaExclamationTriangle /> : <FaCheckCircle />}
                  Spent: ₹{spent.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export default BudgetPlanner;
