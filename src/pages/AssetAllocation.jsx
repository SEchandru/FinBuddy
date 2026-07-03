import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import {
  FaChartPie,
  FaBalanceScale,
  FaExchangeAlt,
  FaPlusCircle,
  FaInfoCircle,
  FaTachometerAlt
} from 'react-icons/fa';

const COLORS = ['#3b82f6', '#10b981', '#fbbf24', '#a855f7'];

function AssetAllocation() {
  const { API_URL, user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rebalanceInput, setRebalanceInput] = useState('10000');
  const [simulatedAllocations, setSimulatedAllocations] = useState(null);

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/finance/portfolio`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPortfolio(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Determine current allocation amounts
  const currentAllocationAmounts = useMemo(() => {
    let stocks = 0;
    let bonds = 0;
    let gold = 0;
    let cash = 0;

    portfolio.forEach(p => {
      const val = p.amount || 0;
      if (p.assetType === 'Stocks') stocks = val;
      else if (p.assetType === 'Bonds') bonds = val;
      else if (p.assetType === 'Gold') gold = val;
      else if (p.assetType === 'Cash') cash = val;
    });

    const total = stocks + bonds + gold + cash;
    return { stocks, bonds, gold, cash, total };
  }, [portfolio]);

  // Determine target allocation weights based on risk profile
  const targetWeights = useMemo(() => {
    const defaultRec = {
      Stocks: 50,
      Bonds: 30,
      Gold: 10,
      Cash: 10
    };

    if (user?.riskProfile?.recommendation) {
      return user.riskProfile.recommendation;
    }

    const riskCat = user?.riskProfile?.category || 'Moderate';
    if (riskCat === 'Conservative') {
      return { Stocks: 25, Bonds: 50, Gold: 15, Cash: 10 };
    } else if (riskCat === 'Aggressive') {
      return { Stocks: 75, Bonds: 15, Gold: 5, Cash: 5 };
    }

    return defaultRec;
  }, [user]);

  // Calculate gaps
  const gapAnalysis = useMemo(() => {
    const { stocks, bonds, gold, cash, total } = currentAllocationAmounts;
    if (total === 0) {
      return Object.entries(targetWeights).map(([name, weight]) => ({
        name,
        currentVal: 0,
        currentPct: 0,
        targetPct: weight,
        gapPct: weight,
        gapVal: 0,
        action: 'BUY/ACCUMULATE'
      }));
    }

    const classes = [
      { name: 'Stocks', currentVal: stocks },
      { name: 'Bonds', currentVal: bonds },
      { name: 'Gold', currentVal: gold },
      { name: 'Cash', currentVal: cash }
    ];

    return classes.map(c => {
      const targetPct = targetWeights[c.name] || 0;
      const currentPct = (c.currentVal / total) * 100;
      const gapPct = targetPct - currentPct;
      const targetVal = (targetPct / 100) * total;
      const gapVal = targetVal - c.currentVal;

      let action = 'HOLD (STABLE)';
      if (gapPct > 3) action = 'BUY / ALLOCATE';
      else if (gapPct < -3) action = 'REDUCE / REALLOCATE';

      return {
        name: c.name,
        currentVal: c.currentVal,
        currentPct: parseFloat(currentPct.toFixed(1)),
        targetPct,
        gapPct: parseFloat(gapPct.toFixed(1)),
        gapVal: Math.round(gapVal),
        action
      };
    });
  }, [currentAllocationAmounts, targetWeights]);

  // Rebalancing logic simulator
  const handleSimulateRebalance = () => {
    const surplus = parseFloat(rebalanceInput);
    if (isNaN(surplus) || surplus <= 0) return;

    const { stocks, bonds, gold, cash, total } = currentAllocationAmounts;
    const newTotal = total + surplus;

    // Distribute the new money to minimize gaps
    // Premium allocation solver: tries to buy assets that are under-allocated
    const simulated = Object.entries(targetWeights).map(([name, weight]) => {
      const targetVal = (weight / 100) * newTotal;
      let currentVal = 0;
      if (name === 'Stocks') currentVal = stocks;
      else if (name === 'Bonds') currentVal = bonds;
      else if (name === 'Gold') currentVal = gold;
      else if (name === 'Cash') currentVal = cash;

      const shortfall = Math.max(0, targetVal - currentVal);
      return { name, targetVal, currentVal, shortfall };
    });

    const totalShortfall = simulated.reduce((sum, s) => sum + s.shortfall, 0);

    const logs = simulated.map(s => {
      const allocatedAmount = totalShortfall > 0
        ? Math.round((s.shortfall / totalShortfall) * surplus)
        : Math.round(((targetWeights[s.name] || 25) / 100) * surplus);

      return {
        name: s.name,
        previousVal: s.currentVal,
        allocatedVal: allocatedAmount,
        newVal: s.currentVal + allocatedAmount,
        newPct: parseFloat((((s.currentVal + allocatedAmount) / newTotal) * 100).toFixed(1)),
        targetPct: targetWeights[s.name] || 0
      };
    });

    setSimulatedAllocations(logs);
  };

  const chartCurrentData = useMemo(() => {
    const { stocks, bonds, gold, cash, total } = currentAllocationAmounts;
    if (total === 0) return [];
    return [
      { name: 'Stocks', value: stocks },
      { name: 'Bonds', value: bonds },
      { name: 'Gold', value: gold },
      { name: 'Cash', value: cash }
    ].filter(i => i.value > 0);
  }, [currentAllocationAmounts]);

  const chartTargetData = useMemo(() => {
    return Object.entries(targetWeights).map(([name, value]) => ({
      name,
      value
    }));
  }, [targetWeights]);

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
          <FaBalanceScale className="text-blue-500" /> Asset Allocation Advisor
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review actual distributions against risk-aligned target categories and execute rebalancing simulations.
        </p>
      </div>

      {/* Pie Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Allocation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4 flex items-center gap-2 self-start">
            <FaChartPie className="text-blue-400" /> Current Asset Mix
          </h3>
          {chartCurrentData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-500 text-xs">
              No holdings recorded. Ingest assets in Portfolio to populate.
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartCurrentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartCurrentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    formatter={(val) => [`₹${val.toLocaleString()}`, 'Value']}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Target Allocation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4 flex items-center gap-2 self-start">
            <FaTachometerAlt className="text-teal-400" /> Target Risk Profile Mix ({user?.riskProfile?.category || 'Moderate'})
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartTargetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartTargetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  formatter={(val) => [`${val}%`, 'Target']}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gap Analysis Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
          Allocation Gap Analysis
        </h3>
        
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                <th className="pb-3">Asset Category</th>
                <th className="pb-3 text-right">Current Value</th>
                <th className="pb-3 text-right">Current %</th>
                <th className="pb-3 text-right">Target %</th>
                <th className="pb-3 text-right">Deviation Gap</th>
                <th className="pb-3 text-right">Action Needed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-semibold">
              {gapAnalysis.map(row => {
                const isOver = row.gapPct < 0;
                return (
                  <tr key={row.name} className="hover:bg-slate-800/20 transition-all">
                    <td className="py-4 text-slate-300">{row.name}</td>
                    <td className="py-4 text-right font-mono text-white">₹{row.currentVal.toLocaleString()}</td>
                    <td className="py-4 text-right font-mono text-slate-400">{row.currentPct}%</td>
                    <td className="py-4 text-right font-mono text-slate-400">{row.targetPct}%</td>
                    <td className={`py-4 text-right font-mono font-bold ${isOver ? 'text-yellow-500' : 'text-emerald-400'}`}>
                      {row.gapPct > 0 ? `+${row.gapPct}%` : `${row.gapPct}%`} 
                      <span className="text-[10px] block font-light text-slate-500">
                        {row.gapVal > 0 ? `Buy ₹${row.gapVal.toLocaleString()}` : `Sell ₹${Math.abs(row.gapVal).toLocaleString()}`}
                      </span>
                    </td>
                    <td className={`py-4 text-right ${
                      row.action.includes('BUY') ? 'text-blue-400' : (row.action.includes('REDUCE') ? 'text-yellow-400' : 'text-slate-400')
                    }`}>
                      {row.action}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card-Based View */}
        <div className="block md:hidden space-y-4">
          {gapAnalysis.map((row) => {
            const isOver = row.gapPct < 0;
            return (
              <div key={row.name} className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3 font-semibold text-xs leading-normal">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-slate-200 text-sm font-bold">{row.name}</span>
                  <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                    row.action.includes('BUY') ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                    (row.action.includes('REDUCE') ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                    'bg-slate-800/40 text-slate-400 border border-slate-800/50')
                  }`}>
                    {row.action}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Current Value</span>
                    <span className="font-mono text-slate-300">₹{row.currentVal.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Current %</span>
                    <span className="font-mono text-slate-300">{row.currentPct}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Target %</span>
                    <span className="font-mono text-slate-400">{row.targetPct}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Deviation Gap</span>
                    <span className={`font-mono font-bold ${isOver ? 'text-yellow-500' : 'text-emerald-400'}`}>
                      {row.gapPct > 0 ? `+${row.gapPct}%` : `${row.gapPct}%`}
                      <span className="text-[9px] block font-light text-slate-500">
                        {row.gapVal > 0 ? `Buy ₹${row.gapVal.toLocaleString()}` : `Sell ₹${Math.abs(row.gapVal).toLocaleString()}`}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rebalancing Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div>
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <FaExchangeAlt className="text-indigo-400" /> Capital Allocation Rebalance Simulator
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Model how contributing a new lump sum cash windfall will optimize your portfolio allocation gaps.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 max-w-sm">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Lump Sum Contribution (₹)
            </label>
            <input
              type="number"
              value={rebalanceInput}
              onChange={(e) => setRebalanceInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-855 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              placeholder="e.g. 50,000"
            />
          </div>

          <button
            onClick={handleSimulateRebalance}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-blue-500/10 transition-all flex items-center gap-1.5 cursor-pointer h-[38px] shrink-0"
          >
            <FaPlusCircle /> Distribute Windfall
          </button>
        </div>

        {simulatedAllocations && (
          <div className="bg-slate-950 border border-slate-855 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wide">
              Simulated Distribution Strategy
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold">
              {simulatedAllocations.map(s => (
                <div key={s.name} className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <span className="text-[10px] text-slate-500 uppercase">{s.name}</span>
                  <div className="font-mono text-white mt-1">
                    Inject: <span className="text-emerald-400 font-extrabold">₹{s.allocatedVal.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-light flex justify-between pt-1 border-t border-slate-800/30">
                    <span>New Value: ₹{s.newVal.toLocaleString()}</span>
                    <span>New %: {s.newPct}% ({s.targetPct}%)</span>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-[10px] text-slate-500 leading-normal font-light flex gap-1.5 items-center">
              <FaInfoCircle className="text-blue-500" />
              This simulation resolves the closest mathematical path to rebalance your holdings without forcing tax-triggering sales.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

export default AssetAllocation;
