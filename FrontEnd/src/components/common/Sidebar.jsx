import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaHome,
  FaWallet,
  FaBullseye,
  FaCalculator,
  FaFileAlt,
  FaSignOutAlt,
  FaMapSigns,
  FaShieldAlt,
  FaChartLine,
  FaNewspaper,
  FaGlobe,
  FaSlidersH,
  FaBalanceScale,
  FaHeartbeat,
  FaUserCheck,
  FaRobot,
  FaChartPie
} from 'react-icons/fa';

function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const healthScore = user?.financialHealthScore || 50;

  // Determine health color
  let healthColor = 'text-yellow-400';
  let healthBg = 'bg-yellow-500';
  if (healthScore >= 75) {
    healthColor = 'text-green-400';
    healthBg = 'bg-green-500';
  } else if (healthScore < 45) {
    healthColor = 'text-red-400';
    healthBg = 'bg-red-500';
  }

  const menuItems = [
    { name: 'Home', path: '/', icon: <FaHome /> },
    { name: 'Financial Analysis', path: '/analysis', icon: <FaChartPie /> },
    { name: 'Financial Roadmap', path: '/roadmap', icon: <FaMapSigns /> },
    { name: 'Expense Tracker', path: '/expenses', icon: <FaWallet /> },
    { name: 'Budget Planner', path: '/budget', icon: <FaSlidersH /> },
    { name: 'Goal Planner', path: '/goals', icon: <FaBullseye /> },
    { name: 'Insurance Planner', path: '/insurance', icon: <FaShieldAlt /> },
    { name: 'Portfolio Tracker', path: '/portfolio', icon: <FaChartLine /> },
    { name: 'Asset Allocation', path: '/asset-allocation', icon: <FaBalanceScale /> },
    { name: 'Finance Health Score', path: '/health-score', icon: <FaHeartbeat /> },
    { name: 'Risk Assessment Quiz', path: '/quiz', icon: <FaUserCheck /> },
    { name: 'Portfolio News', path: '/portfolio-news', icon: <FaNewspaper /> },
    { name: 'Finance News', path: '/news', icon: <FaGlobe /> },
    { name: 'Monthly Financial Review', path: '/reports', icon: <FaFileAlt /> },
    { name: 'AI Financial Advisor', path: '/ai-advisor', icon: <FaRobot /> },
    { name: 'Rule & Calculator Center', path: '/calculators', icon: <FaCalculator /> }
  ];

  const isItemActive = (item) => {
    return location.pathname === item.path;
  };

  return (
    <div className="w-64 h-screen bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between sticky top-0 overflow-y-auto">
      
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
          FinBuddy
        </h1>
        <p className="text-xs text-slate-500 mb-6 font-medium">
          Personal Wealth Advisor
        </p>
 
        {/* Dynamic Financial Health Score Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Finance Health Score
          </h3>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${healthBg}`} 
              style={{ width: `${healthScore}%` }}
            ></div>
          </div>
          <div className={`text-3xl font-extrabold mt-2 ${healthColor}`}>
            {healthScore} <span className="text-sm font-medium text-slate-500">/ 100</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            const active = isItemActive(item);
            return (
              <li key={index}>
                <NavLink
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User Section & Logout */}
      <div>
        <div className="border-t border-slate-850 pt-4 flex flex-col gap-2">
          <div className="px-4 py-2 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm text-white">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/15 transition-all"
          >
            <FaSignOutAlt />
            Sign Out
          </button>
        </div>
      </div>

    </div>
  );
}

export default Sidebar;