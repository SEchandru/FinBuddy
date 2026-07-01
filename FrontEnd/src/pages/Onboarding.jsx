import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUserAlt, FaCoins, FaWallet, FaBullseye } from 'react-icons/fa';

function Onboarding() {
  const { onboard, logout } = useAuth();
  const navigate = useNavigate();

  const [age, setAge] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlySavingsGoal, setMonthlySavingsGoal] = useState('');
  const [netWorth, setNetWorth] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!age || !monthlyIncome || !monthlySavingsGoal) {
      setError('Please fill in all required fields.');
      return;
    }
    if (parseInt(age) <= 0 || parseFloat(monthlyIncome) < 0 || parseFloat(monthlySavingsGoal) < 0) {
      setError('Values cannot be negative.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onboard({
        age: parseInt(age),
        monthlyIncome: parseFloat(monthlyIncome),
        monthlySavingsGoal: parseFloat(monthlySavingsGoal),
        netWorth: parseFloat(netWorth) || 0
      });
      // Redirect to home dashboard
      navigate('/');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"></div>

        <div className="relative z-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Let's get started!
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Tell us about your financial profile so we can personalize your dashboard
          </p>
        </div>

        {error && (
          <div className="relative z-10 mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 mt-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Your Age <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-2 flex items-center">
                <FaUserAlt className="absolute left-3 text-slate-500" />
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="25"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-3 pr-4 pl-10 text-white placeholder-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Starting Net Worth (₹)
              </label>
              <div className="relative mt-2 flex items-center">
                <FaCoins className="absolute left-3 text-slate-500" />
                <input
                  type="number"
                  value={netWorth}
                  onChange={(e) => setNetWorth(e.target.value)}
                  placeholder="50,000"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-3 pr-4 pl-10 text-white placeholder-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Monthly Income (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-2 flex items-center">
              <FaWallet className="absolute left-3 text-slate-500" />
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="40,000"
                className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-3 pr-4 pl-10 text-white placeholder-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Monthly Savings Goal (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-2 flex items-center">
              <FaBullseye className="absolute left-3 text-slate-500" />
              <input
                type="number"
                value={monthlySavingsGoal}
                onChange={(e) => setMonthlySavingsGoal(e.target.value)}
                placeholder="10,000"
                className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-3 pr-4 pl-10 text-white placeholder-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              This represents your targeted savings target to calculate your monthly financial health index.
            </p>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={logout}
              className="w-1/3 rounded-lg border border-slate-800 bg-slate-950 py-3 font-semibold text-slate-400 transition-all hover:bg-slate-900 hover:text-white"
            >
              Sign Out
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 py-3 font-semibold text-white transition-all hover:opacity-95 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto"></div>
              ) : (
                'Save and Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Onboarding;
