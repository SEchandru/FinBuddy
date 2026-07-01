import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FaHeartbeat,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaPiggyBank,
  FaBullseye,
  FaChartPie,
  FaClipboardList,
  FaShieldAlt
} from 'react-icons/fa';

function HealthScore() {
  const { API_URL, user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [goals, setGoals] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFinancials = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [expRes, goalsRes, portRes] = await Promise.all([
        axios.get(`${API_URL}/finance/expenses`, { headers }),
        axios.get(`${API_URL}/finance/goals`, { headers }),
        axios.get(`${API_URL}/finance/portfolio`, { headers })
      ]);

      setExpenses(expRes.data);
      setGoals(goalsRes.data);
      setPortfolio(portRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchFinancials();
  }, [fetchFinancials]);

  const scoreDetails = useMemo(() => {
    const income = user?.monthlyIncome || 0;
    const healthScore = user?.financialHealthScore || 50;

    // 1. Calculate Savings Rate Metric
    const totalSpent = expenses
      .filter(e => {
        const d = new Date(e.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const savings = Math.max(0, income - totalSpent);
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    let savingsRatePoints = 0;
    if (savingsRate >= 30) savingsRatePoints = 25;
    else if (savingsRate >= 15) savingsRatePoints = 15;
    else if (savingsRate >= 0) savingsRatePoints = 5;

    // 2. Budget Discipline
    // Count budget violations (e.g. food spent exceeding 15% of salary, shopping > 10%)
    let budgetPoints = 25;
    const catSpends = {};
    expenses.forEach(e => { catSpends[e.category] = (catSpends[e.category] || 0) + e.amount; });

    if (income > 0) {
      if ((catSpends['Food'] || 0) > income * 0.20) budgetPoints -= 7;
      if ((catSpends['Shopping'] || 0) > income * 0.15) budgetPoints -= 8;
      if (totalSpent > income) budgetPoints = 0;
    }
    budgetPoints = Math.max(0, budgetPoints);

    // 3. Goal Contribution Progress
    let goalPoints = 0;
    if (goals.length > 0) {
      goalPoints += 5; // Active goals bonus
      const totalProgress = goals.reduce((sum, g) => sum + Math.min(1, g.currentAmount / g.targetAmount), 0);
      goalPoints += Math.round((totalProgress / goals.length) * 10);
    }

    // 4. Protection & Risk assessment
    let riskQuizPoints = user?.riskProfile ? 20 : 5;

    // 5. Asset Diversification
    let diversificationPoints = 0;
    const nonCashAssets = portfolio.filter(p => p.assetType !== 'Cash' && p.amount > 0);
    if (nonCashAssets.length > 0) {
      diversificationPoints += 10;
      if (portfolio.length >= 4 && portfolio.every(p => p.amount > 0)) {
        diversificationPoints += 5;
      }
    }

    // Strengths and Warnings lists
    const strengths = [];
    const concerns = [];

    if (savingsRate >= 30) strengths.push('Excellent Savings Discipline (saving 30%+ net salary).');
    else if (savingsRate < 10) concerns.push('Thin Savings Shield (saving less than 10% of monthly income).');

    if (budgetPoints === 25) strengths.push('Impeccable Budget Adherence (no category limit breaches).');
    if (totalSpent > income) concerns.push('Income Deficit: Monthly spending exceeds net cashflow.');

    const hasEmergency = goals.some(g => g.category === 'Emergency Fund');
    if (hasEmergency) strengths.push('Emergency Safety Goal set and active.');
    else concerns.push('Safety Net Deficit: No active Emergency Fund target configured.');

    if (user?.riskProfile) strengths.push('Risk profile alignment assessment completed.');
    else concerns.push('Undetermined Risk Appetite: Complete the Risk Assessment Quiz.');

    if (nonCashAssets.length >= 3) strengths.push('Good Asset Diversification across multiple vectors.');
    else concerns.push('Concentration Risk: Portfolios held primary in single assets or pure cash.');

    return {
      total: healthScore,
      savingsRatePoints,
      budgetPoints,
      goalPoints,
      riskQuizPoints,
      diversificationPoints,
      savingsRate,
      totalSpent,
      strengths,
      concerns
    };
  }, [user, expenses, goals, portfolio]);

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
          <FaHeartbeat className="text-rose-500 animate-pulse" /> Financial Health Audit
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review your unified score components and execute coach checklist recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gauge Card (1-Col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full animate-pulse"></div>
          
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Health Rating</h3>
          
          <div className="relative h-32 w-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="6" fill="transparent" />
              <circle cx="50" cy="50" r="42" 
                      stroke={scoreDetails.total >= 75 ? '#10b981' : (scoreDetails.total >= 45 ? '#3b82f6' : '#ef4444')} 
                      strokeWidth="6" fill="transparent"
                      strokeDasharray={263.8}
                      strokeDashoffset={263.8 - (263.8 * scoreDetails.total) / 100}
                      strokeLinecap="round" />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-black text-white">{scoreDetails.total}</span>
              <span className="text-[10px] text-slate-500 block font-bold">/ 100</span>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
            scoreDetails.total >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
            (scoreDetails.total >= 45 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20')
          }`}>
            {scoreDetails.total >= 75 ? 'EXCELLENT' : (scoreDetails.total >= 45 ? 'GOOD' : 'NEEDS ACTION')}
          </span>
        </div>

        {/* Audit Checklist (2-Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Strengths */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <FaCheckCircle /> Pillars of Strength
            </h4>
            <div className="space-y-2">
              {scoreDetails.strengths.length === 0 ? (
                <p className="text-xs text-slate-500">None detected. Work on savings rate and goal tracking to improve.</p>
              ) : (
                scoreDetails.strengths.map((s, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-900 p-3 rounded-xl text-xs text-slate-300 font-light leading-relaxed">
                    {s}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Concerns */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <FaTimesCircle /> Action Concerns
            </h4>
            <div className="space-y-2">
              {scoreDetails.concerns.length === 0 ? (
                <p className="text-xs text-slate-500">Stellar work! No major warnings found.</p>
              ) : (
                scoreDetails.concerns.map((w, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-900 p-3 rounded-xl text-xs text-slate-300 font-light leading-relaxed">
                    {w}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Numerical Weights Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Financial health score weights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          
          {/* Savings rate */}
          <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-2 relative">
            <FaPiggyBank className="absolute top-4 right-4 text-emerald-400" />
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Savings Rate</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {scoreDetails.savingsRatePoints} <span className="text-xs text-slate-500 font-medium">/ 25</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-light">Rate: {scoreDetails.savingsRate.toFixed(1)}%</span>
          </div>

          {/* Budgeting */}
          <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-2 relative">
            <FaClipboardList className="absolute top-4 right-4 text-blue-400" />
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Budget discipline</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {scoreDetails.budgetPoints} <span className="text-xs text-slate-500 font-medium">/ 25</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-light">Violations checked</span>
          </div>

          {/* Goal Planning */}
          <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-2 relative">
            <FaBullseye className="absolute top-4 right-4 text-yellow-400" />
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Goal Progress</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {scoreDetails.goalPoints} <span className="text-xs text-slate-500 font-medium">/ 15</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-light">{goals.length} active goals</span>
          </div>

          {/* Risk assessment consistency */}
          <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-2 relative">
            <FaShieldAlt className="absolute top-4 right-4 text-indigo-400" />
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Risk Assessment</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {scoreDetails.riskQuizPoints} <span className="text-xs text-slate-500 font-medium">/ 20</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-light">Assessment sync status</span>
          </div>

          {/* Diversification */}
          <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-2 relative">
            <FaChartPie className="absolute top-4 right-4 text-purple-400" />
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Diversification</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {scoreDetails.diversificationPoints} <span className="text-xs text-slate-500 font-medium">/ 15</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-light">Asset distribution variety</span>
          </div>

        </div>

        <div className="bg-slate-950 border border-slate-855 p-4 rounded-xl flex gap-3 text-xs text-slate-400 leading-normal font-light">
          <FaInfoCircle className="text-blue-500 shrink-0 mt-0.5" />
          <p>
            Your health score is evaluated dynamically. Completing the **Risk Quiz**, logging diversified holdings, and matching your category budgets accelerates this rating.
          </p>
        </div>
      </div>

    </div>
  );
}

export default HealthScore;
