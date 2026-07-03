import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FaChartLine, 
  FaPlus, 
  FaTrash, 
  FaUpload, 
  FaCopy, 
  FaHeartbeat, 
  FaInfoCircle, 
  FaCheckCircle, 
  FaChevronDown, 
  FaChevronUp, 
  FaRegFileAlt,
  FaCoins
} from 'react-icons/fa';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const ASSET_COLORS = {
  'Equity': '#3b82f6',         // Blue
  'Mutual Funds': '#8b5cf6',   // Purple
  'Gold': '#fbbf24',           // Amber
  'Silver': '#e2e8f0',         // Gray
  'Fixed Deposits': '#10b981', // Emerald
  'PPF': '#06b6d4',            // Cyan
  'EPF': '#34d399',            // Light Green
  'NPS': '#f43f5e',            // Rose
  'Debt Funds': '#f97316',     // Orange
  'Bonds': '#ec4899',          // Pink
  'Crypto': '#a855f7',         // Violet
  'Cash': '#64748b'            // Slate
};

function Portfolio() {
  const { API_URL, user } = useAuth();
  const [holdings, setHoldings] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Uploader tabs/forms
  const [uploadMode, setUploadMode] = useState('text'); // text, manual, csv
  const [bulkText, setBulkText] = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const [expandedNews, setExpandedNews] = useState({});

  // Manual entry fields
  const [manualForm, setManualForm] = useState({
    name: '',
    type: 'Equity',
    qty: 1,
    value: '',
    investedValue: '',
    sector: 'Technology',
    risk: 'Medium'
  });

  const fetchHoldingsAndNews = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const holdingsRes = await axios.get(`${API_URL}/finance/holdings`);
      setHoldings(holdingsRes.data);
      
      const newsRes = await axios.get(`${API_URL}/news/portfolio`);
      setNews(newsRes.data);
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError('Failed to fetch portfolio data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchHoldingsAndNews();
  }, [fetchHoldingsAndNews]);

  // Form handlers
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.name || !manualForm.value) {
      setError('Name and Current Value are required.');
      return;
    }

    try {
      setError('');
      setSuccess('');
      const payload = {
        ...manualForm,
        qty: parseFloat(manualForm.qty) || 1,
        value: parseFloat(manualForm.value),
        investedValue: parseFloat(manualForm.investedValue) || parseFloat(manualForm.value)
      };

      await axios.post(`${API_URL}/finance/holdings`, payload);
      setSuccess(`Holding "${manualForm.name}" added successfully.`);
      
      // Reset form
      setManualForm({
        name: '',
        type: 'Equity',
        qty: 1,
        value: '',
        investedValue: '',
        sector: 'Diversified',
        risk: 'Medium'
      });

      fetchHoldingsAndNews();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to add holding.');
    }
  };

  const handleBulkTextSubmit = async (e) => {
    e.preventDefault();
    if (!bulkText.trim()) {
      setError('Please enter some statements or holdings list.');
      return;
    }

    try {
      setError('');
      setSuccess('');
      const res = await axios.post(`${API_URL}/finance/holdings/upload`, {
        text: bulkText,
        overwrite
      });

      setSuccess(res.data.message || 'Statement uploaded and parsed successfully!');
      setBulkText('');
      fetchHoldingsAndNews();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to parse statement.');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      try {
        setError('');
        setSuccess('');
        const res = await axios.post(`${API_URL}/finance/holdings/upload`, {
          text,
          overwrite
        });
        setSuccess(`File "${file.name}" uploaded and parsed: ${res.data.message}`);
        fetchHoldingsAndNews();
        setTimeout(() => setSuccess(''), 4000);
      } catch (err) {
        console.error(err);
        setError('Failed to upload and parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete holding "${name}"?`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await axios.delete(`${API_URL}/finance/holdings/${id}`);
      setSuccess(`Holding "${name}" deleted.`);
      fetchHoldingsAndNews();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to delete holding.');
    }
  };

  const toggleNews = (id) => {
    setExpandedNews(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculations
  const age = user?.age || 25;
  const riskProfile = user?.riskProfile || 'Moderate';

  // 1. Recommended asset allocations
  let recEquity = 110 - age;
  if (riskProfile === 'Conservative') recEquity -= 10;
  if (riskProfile === 'Aggressive') recEquity += 10;
  recEquity = Math.max(20, Math.min(85, recEquity)); // bound

  const recGold = 10;
  const recCash = 10;
  const recDebt = 100 - recEquity - recGold - recCash;



  // Group allocations for simplified chart comparison
  // Equities: Equity + Mutual Funds
  // Debt: Fixed Deposits + PPF + EPF + NPS + Debt Funds + Bonds
  // Gold: Gold + Silver
  // Cash: Cash + Emergency Fund
  // Crypto: Crypto
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.investedValue, 0);
  const netProfit = totalValue - totalInvested;
  const profitPct = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

  // Compute actual allocations
  const actualGroupAllocations = {
    'Equity / Growth': 0,
    'Debt / Fixed Income': 0,
    'Gold & Precious Metals': 0,
    'Cash & Reserves': 0,
    'Crypto / Alternatives': 0
  };

  holdings.forEach(h => {
    if (['Equity', 'Mutual Funds'].includes(h.type)) {
      actualGroupAllocations['Equity / Growth'] += h.value;
    } else if (['Fixed Deposits', 'PPF', 'EPF', 'NPS', 'Debt Funds', 'Bonds'].includes(h.type)) {
      actualGroupAllocations['Debt / Fixed Income'] += h.value;
    } else if (['Gold', 'Silver'].includes(h.type)) {
      actualGroupAllocations['Gold & Precious Metals'] += h.value;
    } else if (['Cash', 'Emergency Fund'].includes(h.type)) {
      actualGroupAllocations['Cash & Reserves'] += h.value;
    } else if (['Crypto'].includes(h.type)) {
      actualGroupAllocations['Crypto / Alternatives'] += h.value;
    }
  });

  const chartData = Object.keys(actualGroupAllocations)
    .filter(key => actualGroupAllocations[key] > 0 || totalValue === 0)
    .map(key => ({
      name: key,
      value: totalValue > 0 ? Math.round((actualGroupAllocations[key] / totalValue) * 100) : (key === 'Equity / Growth' ? 50 : 25),
      amt: actualGroupAllocations[key]
    }));

  const COLORS = ['#3b82f6', '#10b981', '#fbbf24', '#64748b', '#a855f7'];

  // Target allocations groups
  const targetGroupAllocations = {
    'Equity / Growth': recEquity,
    'Debt / Fixed Income': recDebt,
    'Gold & Precious Metals': recGold,
    'Cash & Reserves': recCash,
    'Crypto / Alternatives': riskProfile === 'Aggressive' ? 5 : 0
  };

  // Gap analysis
  const gapAnalysis = Object.keys(targetGroupAllocations).map(key => {
    const targetPct = targetGroupAllocations[key];
    const actualAmt = actualGroupAllocations[key];
    const actualPct = totalValue > 0 ? (actualAmt / totalValue) * 100 : 0;
    const diffPct = actualPct - targetPct;

    return {
      name: key,
      actualPct: Math.round(actualPct),
      targetPct: Math.round(targetPct),
      diffPct: Math.round(diffPct),
      actualAmt
    };
  });

  // Health Score Calculation
  // 1. Diversification: have at least 3 distinct asset groups (out of Equity, Debt, Gold, Cash, Crypto)
  let activeAssetCount = 0;
  Object.values(actualGroupAllocations).forEach(val => { if (val > 0) activeAssetCount++; });
  const divScore = Math.min(25, activeAssetCount * 8);

  // 2. Target conformance: sum of absolute differences in percentage
  let totalDiff = 0;
  gapAnalysis.forEach(gap => {
    totalDiff += Math.abs(gap.diffPct);
  });
  const conformanceScore = Math.max(0, Math.min(25, 25 - (totalDiff / 4)));

  // 3. Concentration risk: no single stock represents more than 30% of entire portfolio
  let maxSinglePct = 0;
  holdings.forEach(h => {
    const pct = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
    if (pct > maxSinglePct) maxSinglePct = pct;
  });
  const concentrationScore = Math.max(0, Math.min(25, 25 - Math.max(0, (maxSinglePct - 25) * 1.5)));

  // 4. Age appropriateness: check if equity allocation matches rule of 110-age +/- 15%
  const equityPct = totalValue > 0 ? (actualGroupAllocations['Equity / Growth'] / totalValue) * 100 : 0;
  const ageAppropriatenessDiff = Math.abs(equityPct - recEquity);
  const suitabilityScore = Math.max(0, Math.min(25, 25 - (ageAppropriatenessDiff * 0.8)));

  const portfolioHealthScore = holdings.length === 0 ? 0 : Math.round(divScore + conformanceScore + concentrationScore + suitabilityScore);

  let healthStatus = 'Poor';
  let healthColor = 'text-red-500';
  let healthProgressColor = 'bg-red-500';
  if (portfolioHealthScore >= 80) {
    healthStatus = 'Excellent';
    healthColor = 'text-emerald-400';
    healthProgressColor = 'bg-emerald-500';
  } else if (portfolioHealthScore >= 65) {
    healthStatus = 'Good';
    healthColor = 'text-green-400';
    healthProgressColor = 'bg-green-400';
  } else if (portfolioHealthScore >= 45) {
    healthStatus = 'Average';
    healthColor = 'text-yellow-400';
    healthProgressColor = 'bg-yellow-400';
  }

  // Action Center recommendation lists
  const actionItems = [];
  gapAnalysis.forEach(gap => {
    if (totalValue > 0) {
      if (gap.diffPct < -12) {
        actionItems.push({
          type: 'BUY/INCREASE',
          color: 'border-blue-500 bg-blue-500/5 text-blue-400',
          badge: 'bg-blue-500/20 text-blue-400',
          title: `Underallocated in ${gap.name}`,
          desc: `Your current exposure (${gap.actualPct}%) is significantly below target (${gap.targetPct}%). Consider increasing allocation in low-cost index funds or defensive products.`
        });
      } else if (gap.diffPct > 12) {
        actionItems.push({
          type: 'REDUCE/REALLOCATE',
          color: 'border-rose-500 bg-rose-500/5 text-rose-400',
          badge: 'bg-rose-500/20 text-rose-400',
          title: `Overallocated in ${gap.name}`,
          desc: `Your exposure (${gap.actualPct}%) is far above target (${gap.targetPct}%). Consider harvesting gains to reduce volatility and secure capital.`
        });
      }
    }
  });

  if (maxSinglePct > 30) {
    const highlyConcentratedHolding = holdings.find(h => (h.value / totalValue) * 100 === maxSinglePct);
    actionItems.push({
      type: 'REVIEW/CONCENTRATION',
      color: 'border-yellow-500 bg-yellow-500/5 text-yellow-400',
      badge: 'bg-yellow-500/20 text-yellow-400',
      title: `High Concentration: ${highlyConcentratedHolding?.name}`,
      desc: `A single asset represent ${Math.round(maxSinglePct)}% of your net worth, exposing you to company-specific risks. Consider diversifying.`
    });
  }

  if (actionItems.length === 0 && holdings.length > 0) {
    actionItems.push({
      type: 'HOLD/STABLE',
      color: 'border-emerald-500 bg-emerald-500/5 text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-400',
      title: 'Balanced & Calibrated Allocation',
      desc: 'Your asset allocation maps cleanly to your age and risk parameters. Continue with standard systematic investment plans (SIPs).'
    });
  }

  // Strengths and Weaknesses
  const strengths = [];
  const weaknesses = [];

  if (activeAssetCount >= 4) strengths.push('Excellent asset class diversification.');
  else weaknesses.push('High concentration in limited asset categories. Add gold or fixed income.');

  if (maxSinglePct <= 20 && holdings.length > 0) strengths.push('Low single-stock concentration risk.');
  else if (maxSinglePct > 35) weaknesses.push('Extreme dependency on single assets.');

  if (ageAppropriatenessDiff < 10 && holdings.length > 0) strengths.push('Equity exposure matches age profile criteria.');
  else if (equityPct > recEquity + 15) weaknesses.push(`Too aggressive for age ${age}. Consider increasing fixed income reserves.`);
  else if (equityPct < recEquity - 15 && holdings.length > 0) weaknesses.push(`Under-exposed to equity growth assets. May fail to beat inflation long-term.`);

  if (actualGroupAllocations['Cash & Reserves'] > 0) strengths.push('Has solid emergency cash reserves.');
  else weaknesses.push('No liquid cash reserves listed in holdings portfolio.');

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-white min-h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <FaChartLine className="text-blue-500" /> Portfolio Intelligence
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Auto-classify statements, analyze age-suitability gaps, track allocation health, and view personalized advisor briefs.
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

      {/* 1. Wealth Indicator Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Worth</p>
          <p className="text-3xl font-extrabold mt-2 text-white">₹{totalValue.toLocaleString('en-IN')}</p>
          <div className="text-xs text-slate-500 mt-2">Sum of all holdings value</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Invested Value</p>
          <p className="text-3xl font-extrabold mt-2 text-slate-200">₹{totalInvested.toLocaleString('en-IN')}</p>
          <div className="text-xs text-slate-500 mt-2">Principal acquisition cost</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-bl-full"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Valuation</p>
          <p className="text-3xl font-extrabold mt-2 text-slate-100 font-sans">₹{totalValue.toLocaleString('en-IN')}</p>
          <div className="text-xs text-slate-500 mt-2">Latest market estimated valuation</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Unrealized Profit / Loss</p>
          <p className={`text-3xl font-extrabold mt-2 ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString('en-IN')}
          </p>
          <div className={`text-xs mt-2 font-semibold ${netProfit >= 0 ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
            {netProfit >= 0 ? '▲' : '▼'} {profitPct.toFixed(2)}% absolute gains
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Statement Uploader and Holdings Table */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Statement Uploader Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <FaUpload className="text-blue-400 text-sm" /> Ingest & Update Holdings
              </h2>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setUploadMode('text')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${uploadMode === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  Text List / Copy-Paste
                </button>
                <button
                  onClick={() => setUploadMode('csv')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${uploadMode === 'csv' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  Upload File (.csv / .txt)
                </button>
                <button
                  onClick={() => setUploadMode('manual')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${uploadMode === 'manual' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  Manual Entry
                </button>
              </div>
            </div>

            {/* Overwrite Checkbox */}
            <div className="mb-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-850">
              <input
                type="checkbox"
                id="overwrite"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="rounded border-slate-800 text-blue-500 focus:ring-0 bg-slate-900 h-4 w-4"
              />
              <label htmlFor="overwrite" className="cursor-pointer">
                <strong>Overwrite portfolio:</strong> Checking this will erase your current holdings list before importing new data.
              </label>
            </div>

            {uploadMode === 'text' && (
              <form onSubmit={handleBulkTextSubmit} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Paste holding statements or plain text lists. Our intelligent classifier matches keywords automatically. E.g.:<br />
                  <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded font-mono">HDFC Bank - 15 shares</code> or <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded font-mono">SBI Mutual Fund - ₹45,000</code> or <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded font-mono">Gold ETF - ₹30,000</code>.
                </p>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`HAL - 10 shares&#10;Reliance Industries - 5 shares&#10;Gold SGB - ₹25000&#10;Fixed Deposit - ₹150000&#10;Bitcoin - ₹12000`}
                  rows="4"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                ></textarea>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  <FaCopy /> Parse and Sync Statement
                </button>
              </form>
            )}

            {uploadMode === 'csv' && (
              <div className="space-y-4 py-4 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-950">
                <FaRegFileAlt className="text-4xl text-slate-600 mx-auto" />
                <div className="max-w-xs mx-auto">
                  <p className="text-xs text-slate-400 mb-4">
                    Upload broker statement files, CSV files, or text lists. The parser will process line-by-line automatically.
                  </p>
                  <label className="cursor-pointer bg-slate-900 border border-slate-800 text-slate-200 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-850 transition-all inline-block">
                    Choose File
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {uploadMode === 'manual' && (
              <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Asset / Holding Name</label>
                  <input
                    type="text"
                    value={manualForm.name}
                    onChange={(e) => setManualForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., HAL, SBI Mutual Fund, Gold SGB"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Asset Category</label>
                  <select
                    value={manualForm.type}
                    onChange={(e) => setManualForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {Object.keys(ASSET_COLORS).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Quantity / Units</label>
                  <input
                    type="number"
                    step="any"
                    value={manualForm.qty}
                    onChange={(e) => setManualForm(prev => ({ ...prev, qty: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Current Value (₹)</label>
                  <input
                    type="number"
                    value={manualForm.value}
                    onChange={(e) => setManualForm(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="e.g., 50000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Invested Value (₹)</label>
                  <input
                    type="number"
                    value={manualForm.investedValue}
                    onChange={(e) => setManualForm(prev => ({ ...prev, investedValue: e.target.value }))}
                    placeholder="E.g., 42000 (Defaults to current value)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Sector / Subgroup</label>
                  <input
                    type="text"
                    value={manualForm.sector}
                    onChange={(e) => setManualForm(prev => ({ ...prev, sector: e.target.value }))}
                    placeholder="e.g., Technology, Fixed Income, Defense"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <FaPlus /> Add Asset Position
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Holdings Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <FaCoins className="text-yellow-400" /> Active Investment Holdings
            </h2>

            {holdings.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-850 rounded-xl bg-slate-950">
                <FaInfoCircle className="text-3xl text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-400">No holdings found.</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Add assets manually or paste broker statement lists above to build your portfolio.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop/Tablet Table View */}
                <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Asset / Stock</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Qty / Units</th>
                      <th className="py-3 px-4">Invested</th>
                      <th className="py-3 px-4">Current Value</th>
                      <th className="py-3 px-4">P/L (Gain)</th>
                      <th className="py-3 px-4">Risk</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {holdings.map((h) => {
                      const pl = h.value - h.investedValue;
                      const plPct = h.investedValue > 0 ? (pl / h.investedValue) * 100 : 0;
                      return (
                        <tr key={h.id} className="hover:bg-slate-850/30 transition-all">
                          <td className="py-3.5 px-4 font-semibold text-white">
                            <div>{h.name}</div>
                            <span className="text-[10px] text-slate-500 font-mono tracking-wider">{h.sector}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{
                                backgroundColor: `${ASSET_COLORS[h.type] || '#475569'}20`,
                                color: ASSET_COLORS[h.type] || '#94a3b8'
                              }}
                            >
                              {h.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono">{h.qty}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">₹{h.investedValue.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-100">₹{h.value.toLocaleString('en-IN')}</td>
                          <td className={`py-3.5 px-4 font-mono font-semibold ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pl >= 0 ? '+' : ''}₹{pl.toLocaleString('en-IN')}<br />
                            <span className="text-[10px] font-medium">{pl >= 0 ? '▲' : '▼'} {plPct.toFixed(1)}%</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              h.risk === 'High' || h.risk === 'Very High' ? 'bg-red-500/10 text-red-400' :
                              h.risk === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                              'bg-green-500/10 text-green-400'
                            }`}>
                              {h.risk}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleDelete(h.id, h.name)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Delete Holding"
                            >
                              <FaTrash size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card-Based View */}
              <div className="block md:hidden space-y-4">
                {holdings.map((h) => {
                  const pl = h.value - h.investedValue;
                  const plPct = h.investedValue > 0 ? (pl / h.investedValue) * 100 : 0;
                  return (
                    <div key={h.id} className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-white text-xs block">{h.name}</strong>
                          <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase block">{h.sector}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          h.risk === 'High' || h.risk === 'Very High' ? 'bg-red-500/10 text-red-400' :
                          h.risk === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-green-500/10 text-green-400'
                        }`}>
                          {h.risk} Risk
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-semibold border-t border-slate-900 pt-2.5">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-bold block">Qty / Units</span>
                          <span className="font-mono text-slate-300">{h.qty}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-bold block">Invested</span>
                          <span className="font-mono text-slate-300">₹{h.investedValue.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-bold block">Current Value</span>
                          <span className="font-mono text-slate-200">₹{h.value.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-bold block">P/L (Gain)</span>
                          <span className={`font-mono ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pl >= 0 ? '+' : ''}₹{pl.toLocaleString('en-IN')}<br />
                            <span className="text-[9px] font-medium">{pl >= 0 ? '▲' : '▼'} {plPct.toFixed(1)}%</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-900 pt-2.5">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[9px] font-bold"
                          style={{
                            backgroundColor: `${ASSET_COLORS[h.type] || '#475569'}20`,
                            color: ASSET_COLORS[h.type] || '#94a3b8'
                          }}
                        >
                          {h.type}
                        </span>
                        <button
                          onClick={() => handleDelete(h.id, h.name)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer min-h-[44px] touch-manipulation"
                        >
                          <FaTrash size={10} /> Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          </div>

        </div>

        {/* Right 1 Col: Health Score, Allocation Advisor & Action items */}
        <div className="space-y-8">
          
          {/* Portfolio Health Score Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <FaHeartbeat className="text-rose-500" /> Portfolio Health Score
            </h2>

            <div className="text-center py-4 bg-slate-950 rounded-xl border border-slate-850 mb-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Health Status</p>
              <p className={`text-4xl font-extrabold mt-1 ${healthColor}`}>{portfolioHealthScore} / 100</p>
              <p className={`text-xs font-bold mt-1 px-2.5 py-0.5 rounded-full inline-block ${healthColor} bg-slate-900/60`}>
                {healthStatus}
              </p>
              <div className="w-4/5 bg-slate-800 h-2 rounded-full mt-4 mx-auto overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${healthProgressColor}`}
                  style={{ width: `${portfolioHealthScore}%` }}
                ></div>
              </div>
            </div>

            {/* Strengths & Weaknesses Checklist */}
            <div className="space-y-4 text-xs">
              {strengths.length > 0 && (
                <div>
                  <p className="font-bold text-emerald-400 mb-1.5">▲ Strengths</p>
                  <ul className="space-y-1 list-disc pl-4 text-slate-300">
                    {strengths.map((str, idx) => <li key={idx}>{str}</li>)}
                  </ul>
                </div>
              )}

              {weaknesses.length > 0 && (
                <div>
                  <p className="font-bold text-rose-400 mb-1.5">▼ Weaknesses / Risks</p>
                  <ul className="space-y-1 list-disc pl-4 text-slate-300">
                    {weaknesses.map((weak, idx) => <li key={idx}>{weak}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Asset Allocation Advisor & Pie Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-4">Asset Class Allocations</h2>
            
            {totalValue === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-850 rounded-xl">
                No active assets to chart.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val, name, props) => [`${val}% (₹${props.payload.amt.toLocaleString('en-IN')})`, name]}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legends */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {chartData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-850">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-slate-400 font-medium truncate">{item.name}</p>
                        <p className="font-extrabold text-slate-200">{item.value}%</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gap analysis */}
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <p className="text-xs font-bold text-slate-300">Allocation Gap Analysis</p>
                  
                  <div className="space-y-2 text-[11px]">
                    {gapAnalysis.map(gap => {
                      const isCorrect = Math.abs(gap.diffPct) <= 10;
                      return (
                        <div key={gap.name} className="flex justify-between items-center p-2 rounded bg-slate-950 border border-slate-850/80">
                          <div>
                            <span className="font-semibold text-slate-200">{gap.name}</span>
                            <div className="text-[9px] text-slate-400">Current: {gap.actualPct}% | Target: {gap.targetPct}%</div>
                          </div>
                          <div className={`font-mono font-bold ${isCorrect ? 'text-emerald-400' : gap.diffPct > 0 ? 'text-rose-400' : 'text-blue-400'}`}>
                            {gap.diffPct === 0 ? 'Optimal' : `${gap.diffPct > 0 ? '+' : ''}${gap.diffPct}%`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Center */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-4">Advisory Action Center</h2>
            
            <div className="space-y-4">
              {actionItems.map((item, idx) => (
                <div key={idx} className={`border rounded-xl p-4 space-y-2 ${item.color}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      {item.type}
                    </span>
                  </div>
                  <h4 className="text-xs font-extrabold text-white">{item.title}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-light">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 2. Holdings-Specific Portfolio News */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
          <FaRegFileAlt className="text-blue-400" /> My Portfolio Advisory Feed
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Personalized briefings specifically selected for the assets you own. Click any article to view FiinBuddy AI Advisor explanations.
        </p>

        {news.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-850 rounded-xl bg-slate-950">
            No matching news for your current holdings.
            {holdings.length === 0 && ' Add holdings to unlock holding-specific alerts.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {news.map((item) => {
              const isOpen = expandedNews[item.id];
              return (
                <div key={item.id} className="bg-slate-950 border border-slate-850 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[10px] font-bold text-blue-400 uppercase bg-blue-500/10 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.importance === 'Critical' ? 'bg-red-500/20 text-red-400' :
                        item.importance === 'Important' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {item.importance}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 hover:text-blue-400 cursor-pointer" onClick={() => toggleNews(item.id)}>
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 font-light leading-relaxed">
                      {item.summary}
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-3 border-t border-slate-900 pt-3">
                      <span>Source: {item.source}</span>
                      <span>Date: {item.date}</span>
                    </div>

                    {/* Matching Tag */}
                    <div className="mt-2.5">
                      <span className="text-[9px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                        Matches holding: <strong>{item.matchingAsset}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-900 pt-4">
                    <button
                      onClick={() => toggleNews(item.id)}
                      className="w-full flex justify-between items-center text-xs font-semibold text-blue-400 hover:text-blue-300"
                    >
                      <span>{isOpen ? 'Hide AI Advisory Annotation' : 'Show AI Advisory Annotation'}</span>
                      {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                    </button>

                    {isOpen && (
                      <div className="mt-3 bg-slate-900/60 border border-slate-850 rounded-lg p-3.5 space-y-2.5 text-xs text-slate-300">
                        <div>
                          <strong className="text-[10px] font-bold text-teal-400 uppercase tracking-wide block">Why This Matters:</strong>
                          <p className="font-light mt-0.5 text-slate-300 leading-relaxed">{item.aiAdvisor.whyThisMatters}</p>
                        </div>
                        <div>
                          <strong className="text-[10px] font-bold text-purple-400 uppercase tracking-wide block">Impact on Portfolio:</strong>
                          <p className="font-light mt-0.5 text-slate-300 leading-relaxed">{item.aiAdvisor.impactOnPortfolio}</p>
                        </div>
                        <div>
                          <strong className="text-[10px] font-bold text-yellow-400 uppercase tracking-wide block">Action Required:</strong>
                          <p className="font-light mt-0.5 text-slate-300 leading-relaxed">{item.aiAdvisor.actionRequired}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export default Portfolio;
