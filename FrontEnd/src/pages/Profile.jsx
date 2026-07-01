import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaCheckCircle } from 'react-icons/fa';

function Profile() {
  const { API_URL, onboard } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [age, setAge] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlySavingsGoal, setMonthlySavingsGoal] = useState('');
  const [netWorth, setNetWorth] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [dependents, setDependents] = useState(0);

  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/auth/profile`);
      setProfile(res.data.user);
      
      // Initialize form fields
      setAge(res.data.user.age || '');
      setMonthlyIncome(res.data.user.monthlyIncome || '');
      setMonthlySavingsGoal(res.data.user.monthlySavingsGoal || '');
      setNetWorth(res.data.user.netWorth || '');
      setMaritalStatus(res.data.user.maritalStatus || 'Single');
      setDependents(res.data.user.dependents !== undefined ? res.data.user.dependents : 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!age || !monthlyIncome || !monthlySavingsGoal) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setSuccess('');

    try {
      await onboard({
        age: parseInt(age),
        monthlyIncome: parseFloat(monthlyIncome),
        monthlySavingsGoal: parseFloat(monthlySavingsGoal),
        netWorth: parseFloat(netWorth) || 0,
        maritalStatus,
        dependents: parseInt(dependents) || 0
      });
      
      setSuccess('Profile configuration updated successfully!');
      setEditMode(false);
      fetchProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          User Settings & Profile
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your personal details, savings constraints, and verify your assessment outputs.
        </p>
      </div>

      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400 flex items-center gap-2">
          <FaCheckCircle /> {success}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Profile Configuration Form */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-md h-fit">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaUser className="text-blue-500 text-sm" />
              Settings Details
            </h2>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-xs transition-all shadow-md"
              >
                Edit Parameters
              </button>
            )}
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile?.name || ''}
                  disabled
                  className="w-full rounded-lg border border-slate-850 bg-slate-950/40 py-2.5 px-4 text-slate-500 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full rounded-lg border border-slate-850 bg-slate-950/40 py-2.5 px-4 text-slate-500 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  disabled={!editMode}
                  className={`w-full rounded-lg border py-2.5 px-4 outline-none ${
                    editMode 
                      ? 'border-slate-800 bg-slate-950/80 text-white focus:border-blue-500' 
                      : 'border-slate-850 bg-slate-950/40 text-slate-400'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Total Portfolio Assets (₹)
                </label>
                <input
                  type="number"
                  value={netWorth}
                  onChange={(e) => setNetWorth(e.target.value)}
                  disabled={!editMode}
                  className={`w-full rounded-lg border py-2.5 px-4 outline-none ${
                    editMode 
                      ? 'border-slate-800 bg-slate-950/80 text-white focus:border-blue-500' 
                      : 'border-slate-850 bg-slate-950/40 text-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Monthly Income (₹)
                </label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  disabled={!editMode}
                  className={`w-full rounded-lg border py-2.5 px-4 outline-none ${
                    editMode 
                      ? 'border-slate-800 bg-slate-950/80 text-white focus:border-blue-500' 
                      : 'border-slate-850 bg-slate-950/40 text-slate-400'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Monthly Savings Goal (₹)
                </label>
                <input
                  type="number"
                  value={monthlySavingsGoal}
                  onChange={(e) => setMonthlySavingsGoal(e.target.value)}
                  disabled={!editMode}
                  className={`w-full rounded-lg border py-2.5 px-4 outline-none ${
                    editMode 
                      ? 'border-slate-800 bg-slate-950/80 text-white focus:border-blue-500' 
                      : 'border-slate-850 bg-slate-950/40 text-slate-400'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Marital Status
                </label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  disabled={!editMode}
                  className={`w-full rounded-lg border py-2.5 px-4 outline-none ${
                    editMode 
                      ? 'border-slate-800 bg-slate-950/80 text-white focus:border-blue-500' 
                      : 'border-slate-850 bg-slate-950/40 text-slate-400'
                  }`}
                  required
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Number of Dependents
                </label>
                <input
                  type="number"
                  value={dependents}
                  onChange={(e) => setDependents(parseInt(e.target.value) || 0)}
                  disabled={!editMode}
                  min="0"
                  className={`w-full rounded-lg border py-2.5 px-4 outline-none ${
                    editMode 
                      ? 'border-slate-800 bg-slate-950/80 text-white focus:border-blue-500' 
                      : 'border-slate-850 bg-slate-950/40 text-slate-400'
                  }`}
                  required
                />
              </div>
            </div>

            {editMode && (
              <div className="flex gap-4 pt-4 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => { setEditMode(false); fetchProfile(); }}
                  className="px-6 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-sm font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all shadow-lg shadow-blue-600/10"
                >
                  Save Parameters
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Key metrics summaries */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* financial health card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md text-center">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Financial Health Score</h3>
            <div className="text-5xl font-black text-emerald-400 mt-4">
              {profile?.financialHealthScore}
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Calculated dynamically. Recompute it by completing goals, saving more money, or taking the risk quiz.
            </p>
          </div>

          {/* risk details */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Risk Profile Summary</h3>
            {profile?.riskProfile ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-950/80 border border-slate-850 p-3.5 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium">Risk Category</span>
                  <span className="text-sm font-bold text-teal-400">{profile.riskProfile.category}</span>
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Current Allocation Plan</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(profile.riskProfile.recommendation || {}).map(([asset, pct]) => (
                      <div key={asset} className="bg-slate-950/40 p-2 rounded-lg border border-slate-850/40 flex justify-between">
                        <span className="text-slate-400">{asset}</span>
                        <span className="font-bold text-slate-200">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs py-4 text-center">
                No risk capability calculated yet. Visit Risk Assessment page.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default Profile;