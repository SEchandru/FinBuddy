import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FaNewspaper, 
  FaChevronDown, 
  FaChevronUp, 
  FaArrowUp, 
  FaArrowDown, 
  FaGraduationCap, 
  FaInfoCircle, 
  FaShieldAlt, 
  FaRobot 
} from 'react-icons/fa';

const PF_TIPS = [
  {
    title: 'The Rule of 72: Compounding Calculator',
    desc: 'Divide 72 by your expected annual rate of return to see how many years it will take to double your money. E.g., at 12% equity growth, your capital doubles in approx. 6 years.'
  },
  {
    title: 'Tax Slabs: Old vs. New Regime',
    desc: 'The New Regime has lower tax rates but does not allow deduction exemptions (80C, 80D). If you do not have active home loans or high insurance premiums, the New Regime is typically better for freshers.'
  },
  {
    title: 'Debt Avalanche vs. Snowball',
    desc: 'Avalanche pays off the highest-interest loans first (saving the most money). Snowball pays off the smallest balances first (giving psychological wins). Choose the one that keeps you motivated.'
  },
  {
    title: 'Emergency Fund: Liquid Shield',
    desc: 'Keep at least 6 months of mandatory expenses (rent, food, EMI) in a separate liquid savings account or liquid mutual fund. Never invest this shield in volatile stocks.'
  }
];

function NewsCenter() {
  const { API_URL } = useAuth();
  const [allNews, setAllNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [expandedNews, setExpandedNews] = useState({});
  const [tipIndex, setTipIndex] = useState(0);

  // Market indices simulated state
  const [indices, setIndices] = useState({
    nifty: { val: 23540.20, change: 112.40, pct: 0.48, trend: 'up' },
    sensex: { val: 77395.50, change: 334.80, pct: 0.43, trend: 'up' },
    niftyBank: { val: 51820.60, change: 290.15, pct: 0.56, trend: 'up' },
    gold: { val: 72450, change: -120, pct: -0.17, trend: 'down' }
  });

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_URL}/news`);
      setAllNews(res.data);
      setFilteredNews(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch financial news feed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Tab filter trigger
  useEffect(() => {
    if (activeTab === 'All') {
      setFilteredNews(allNews);
    } else {
      setFilteredNews(
        allNews.filter(n => n.category.toLowerCase() === activeTab.toLowerCase())
      );
    }
  }, [activeTab, allNews]);

  // Simulate subtle index changes to feel "alive"
  useEffect(() => {
    const interval = setInterval(() => {
      setIndices(prev => {
        const isNiftyUp = Math.random() > 0.4;
        const niftyDiff = (Math.random() * 4 - 1.5) * (isNiftyUp ? 1 : -1);
        const newNifty = parseFloat((prev.nifty.val + niftyDiff).toFixed(2));
        const newNiftyChange = parseFloat((prev.nifty.change + niftyDiff).toFixed(2));
        const newNiftyPct = parseFloat(((newNiftyChange / 23427.8) * 100).toFixed(2));

        const isSensexUp = Math.random() > 0.4;
        const sensexDiff = (Math.random() * 12 - 4.5) * (isSensexUp ? 1 : -1);
        const newSensex = parseFloat((prev.sensex.val + sensexDiff).toFixed(2));
        const newSensexChange = parseFloat((prev.sensex.change + sensexDiff).toFixed(2));
        const newSensexPct = parseFloat(((newSensexChange / 77060.7) * 100).toFixed(2));

        return {
          ...prev,
          nifty: { val: newNifty, change: newNiftyChange, pct: newNiftyPct, trend: newNiftyChange >= 0 ? 'up' : 'down' },
          sensex: { val: newSensex, change: newSensexChange, pct: newSensexPct, trend: newSensexChange >= 0 ? 'up' : 'down' }
        };
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const toggleNews = (id) => {
    setExpandedNews(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const nextTip = () => {
    setTipIndex((prev) => (prev + 1) % PF_TIPS.length);
  };

  const prevTip = () => {
    setTipIndex((prev) => (prev - 1 + PF_TIPS.length) % PF_TIPS.length);
  };

  // Categories list
  const tabs = ['All', 'Markets', 'Economy', 'Taxation', 'Retirement', 'Mutual Funds', 'Insurance', 'Stocks'];

  // Count holding-specific alerts
  const holdingAlertsCount = allNews.filter(n => n.isHoldingSpecific).length;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <FaNewspaper className="text-blue-500" /> News Center & Advisor Brief
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Market index trackers, micro-economic updates, personalized holding alerts, and simplified AI advisor summaries.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* 1. Market Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* NIFTY 50 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nifty 50</p>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-bold font-mono tracking-tight">{indices.nifty.val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className={`text-xs font-bold flex items-center gap-0.5 ${indices.nifty.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
              {indices.nifty.trend === 'up' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
              {indices.nifty.pct}%
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">Change: {indices.nifty.change >= 0 ? '+' : ''}{indices.nifty.change}</p>
        </div>

        {/* SENSEX */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sensex</p>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-bold font-mono tracking-tight">{indices.sensex.val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className={`text-xs font-bold flex items-center gap-0.5 ${indices.sensex.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
              {indices.sensex.trend === 'up' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
              {indices.sensex.pct}%
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">Change: {indices.sensex.change >= 0 ? '+' : ''}{indices.sensex.change}</p>
        </div>

        {/* NIFTY BANK */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nifty Bank</p>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-bold font-mono tracking-tight">{indices.niftyBank.val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className={`text-xs font-bold flex items-center gap-0.5 ${indices.niftyBank.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
              {indices.niftyBank.trend === 'up' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
              {indices.niftyBank.pct}%
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">Change: +{indices.niftyBank.change}</p>
        </div>

        {/* GOLD */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gold (24K/10g)</p>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-bold font-mono tracking-tight">₹{indices.gold.val.toLocaleString('en-IN')}</span>
            <span className={`text-xs font-bold flex items-center gap-0.5 ${indices.gold.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
              {indices.gold.trend === 'up' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
              {indices.gold.pct}%
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">Change: {indices.gold.change}</p>
        </div>
      </div>

      {/* 2. AI Portfolio Advisor Alert Banner */}
      {holdingAlertsCount > 0 && (
        <div className="bg-gradient-to-r from-blue-900/30 to-indigo-950/30 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20">
            <FaRobot size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              FiinBuddy AI Portfolio Alert
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              We detected <strong>{holdingAlertsCount} critical updates</strong> affecting assets in your portfolio holdings (e.g. quarterly earnings, corporate decisions, or macroeconomic shifts). Make sure to expand the <strong>FiinBuddy AI Advisor Annotations</strong> on the matching articles below to review action items.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Tabs and news on Left, Personal Finance Corner on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* News Feed - 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Articles list */}
          {filteredNews.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-850 rounded-xl bg-slate-900/50">
              <FaInfoCircle className="text-3xl text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-400">No news articles found in this category.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredNews.map((item) => {
                const isOpen = expandedNews[item.id];
                return (
                  <div 
                    key={item.id} 
                    className={`bg-slate-900 border rounded-2xl p-6 transition-all ${
                      item.isHoldingSpecific 
                        ? 'border-indigo-500/20 bg-gradient-to-br from-slate-900 to-indigo-950/10' 
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-400 uppercase bg-blue-500/10 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        {item.isHoldingSpecific && (
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                            Matches Holding: {item.matchingAsset}
                          </span>
                        )}
                      </div>
                      
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.importance === 'Critical' ? 'bg-red-500/20 text-red-400' :
                        item.importance === 'Important' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {item.importance}
                      </span>
                    </div>

                    <h2 
                      className="text-lg font-bold text-slate-100 hover:text-blue-400 cursor-pointer"
                      onClick={() => toggleNews(item.id)}
                    >
                      {item.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed font-light">
                      {item.summary}
                    </p>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-4 border-t border-slate-850 pt-3">
                      <span>Publisher: {item.source}</span>
                      <span>Published: {item.date}</span>
                    </div>

                    {/* FiinBuddy Insight Advisor Accordion */}
                    <div className="mt-4 border-t border-slate-850 pt-4">
                      <button
                        onClick={() => toggleNews(item.id)}
                        className="w-full flex justify-between items-center text-xs font-semibold text-blue-400 hover:text-blue-300"
                      >
                        <span className="flex items-center gap-1.5"><FaRobot className="text-teal-400" /> FiinBuddy AI Advisor Analysis</span>
                        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                      </button>

                      {isOpen && (
                        <div className="mt-3 bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3.5 text-xs">
                          <div>
                            <strong className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block">Why This Matters</strong>
                            <p className="font-light mt-0.5 text-slate-300 leading-relaxed">{item.aiAdvisor.whyThisMatters}</p>
                          </div>
                          <div>
                            <strong className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Impact on Portfolio</strong>
                            <p className="font-light mt-0.5 text-slate-300 leading-relaxed">{item.aiAdvisor.impactOnPortfolio}</p>
                          </div>
                          <div>
                            <strong className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider block">Action Required</strong>
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

        {/* Sidebar - Personal Finance Corner - 1 Col */}
        <div className="space-y-8">
          
          {/* Personal Finance Advice Corner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-bl-full"></div>
            <h2 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-2">
              <FaGraduationCap className="text-indigo-400" /> Personal Finance Corner
            </h2>

            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                <span>Rule {tipIndex + 1} of {PF_TIPS.length}</span>
                <div className="flex gap-2">
                  <button onClick={prevTip} className="hover:text-slate-300 p-1">◀</button>
                  <button onClick={nextTip} className="hover:text-slate-300 p-1">▶</button>
                </div>
              </div>
              
              <h4 className="text-xs font-bold text-white">{PF_TIPS[tipIndex].title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-light">{PF_TIPS[tipIndex].desc}</p>
            </div>
          </div>

          {/* Premium Portfolio Shield Recommendation */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-md font-bold text-slate-200 mb-3 flex items-center gap-2">
              <FaShieldAlt className="text-emerald-400" /> Advisor Protection Shield
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-light mb-4">
              Financial security isn\'t just about high-return stocks. A premium protection setup is the foundation of long-term stability.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                <span className="text-[9px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">Emergency Shield</span>
                <h5 className="font-bold text-white mt-1.5">Liquid Savings Reserve</h5>
                <p className="text-[10px] text-slate-400 mt-1 font-light leading-relaxed">Ensure you have 6x of monthly salary locked in accessible bank accounts/liquid mutual funds.</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                <span className="text-[9px] font-bold text-blue-400 uppercase bg-blue-500/10 px-2 py-0.5 rounded">Health Shield</span>
                <h5 className="font-bold text-white mt-1.5">Individual Health Coverage</h5>
                <p className="text-[10px] text-slate-400 mt-1 font-light leading-relaxed">Secure at least ₹5 Lakhs base coverage with a super top-up policy. Corporate covers are usually not enough.</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default NewsCenter;
