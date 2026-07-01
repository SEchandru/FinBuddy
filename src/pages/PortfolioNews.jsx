import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FaNewspaper,
  FaRobot,
  FaChevronDown,
  FaChevronUp,
  FaBookmark,
  FaInfoCircle
} from 'react-icons/fa';

function PortfolioNews() {
  const { API_URL } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedArticleId, setExpandedArticleId] = useState(null);

  const fetchPortfolioNews = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/news/portfolio`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArticles(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not fetch portfolio news. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchPortfolioNews();
  }, [fetchPortfolioNews]);

  const toggleExpand = (id) => {
    setExpandedArticleId(prev => (prev === id ? null : id));
  };

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
          <FaNewspaper className="text-indigo-400" /> Portfolio Holdings News
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Stock-specific market announcements and events matching your active investments, filtered by relevance.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-400 flex items-center gap-2">
          <FaInfoCircle /> {error}
        </div>
      )}

      {articles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-855 rounded-2xl p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3 max-w-2xl mx-auto mt-12">
          <FaNewspaper className="text-5xl text-slate-700 animate-pulse" />
          <p className="text-sm font-bold">No holdings news found.</p>
          <p className="text-xs text-slate-650 leading-relaxed">
            Upload holdings statements (like HAL, HDFC Bank, Mutual Funds) inside the **Portfolio Tracker** to feed personalized events to this monitor.
          </p>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          {articles.map((art) => {
            const isExpanded = expandedArticleId === art.id;
            return (
              <div
                key={art.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-750 transition-all space-y-4 text-xs font-semibold relative overflow-hidden"
              >
                {/* Holdings Match badge */}
                <div className="absolute top-0 right-0 bg-indigo-500/10 border-l border-b border-indigo-500/25 text-indigo-400 text-[8px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider flex items-center gap-1">
                  <FaBookmark /> Matches Hold: {art.matchingAsset || 'Portfolio'}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                    <span className="text-indigo-400 font-extrabold">{art.category}</span>
                    <span>•</span>
                    <span>Source: {art.source}</span>
                    <span>•</span>
                    <span>{art.date}</span>
                  </div>

                  <h3 className="text-md font-extrabold text-white leading-snug">
                    {art.title}
                  </h3>

                  <p className="text-slate-400 font-light leading-relaxed">
                    {art.summary}
                  </p>
                </div>

                {art.aiAdvisor && (
                  <div className="pt-2">
                    <button
                      onClick={() => toggleExpand(art.id)}
                      className="flex items-center gap-2 text-[10px] font-extrabold text-teal-400 uppercase tracking-wider hover:text-teal-300 transition-all cursor-pointer"
                    >
                      <FaRobot /> FinBuddy AI Advisor Analysis
                      {isExpanded ? <FaChevronUp size={8} /> : <FaChevronDown size={8} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-4 bg-slate-950 border border-slate-855 rounded-xl p-5 space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500"></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-light leading-relaxed text-slate-300">
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-500 uppercase font-extrabold block">Why This Matters</span>
                            <p>{art.aiAdvisor.whyThisMatters}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-500 uppercase font-extrabold block">Portfolio Impact</span>
                            <p>{art.aiAdvisor.impactOnPortfolio}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-500 uppercase font-extrabold block">Action Required</span>
                            <p className="text-teal-400 font-medium">{art.aiAdvisor.actionRequired}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PortfolioNews;
