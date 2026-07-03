import { useState } from "react";
import Sidebar from "./components/common/Sidebar";
import AppRoutes from "./routes/AppRoutes";
import { useAuth } from "./context/AuthContext";
import { 
  FaBars, 
  FaHome, 
  FaMapSigns, 
  FaBullseye, 
  FaChartLine, 
  FaUserCheck, 
  FaBell, 
  FaSearch 
} from "react-icons/fa";
import { NavLink } from "react-router-dom";

function App() {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Show sidebar only if logged in and completed onboarding
  const showSidebar = user && user.isOnboarded;
  const healthScore = user?.financialHealthScore || 50;

  return (
    <div className="flex min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden relative">
      
      {/* SIDEBAR - DESKTOP & DRAWER ON MOBILE */}
      {showSidebar && (
        <>
          {/* Drawer backdrop overlay on mobile */}
          {isDrawerOpen && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-all duration-300"
              onClick={() => setIsDrawerOpen(false)}
            />
          )}

          {/* Sidebar container */}
          <div className={`
            fixed top-0 left-0 h-screen z-50 transition-transform duration-300 md:translate-x-0 md:sticky md:block md:w-64 shrink-0
            ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <Sidebar onClose={() => setIsDrawerOpen(false)} />
          </div>
        </>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 min-h-screen flex flex-col min-w-0 pb-16 md:pb-0">
        
        {/* RESPONSIVE TOP HEADER */}
        {showSidebar && (
          <header className="sticky top-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 z-30 px-6 py-4 flex items-center justify-between">
            {/* Left side: Hamburger on mobile, search on desktop */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 -ml-2 text-slate-400 hover:text-white md:hidden cursor-pointer touch-manipulation min-w-[44px] min-h-[44px]"
                aria-label="Open navigation drawer"
              >
                <FaBars className="text-xl" />
              </button>
              
              <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl w-64">
                <FaSearch className="text-slate-500 text-xs" />
                <input 
                  type="text" 
                  placeholder="Search assets, calculators, news..." 
                  className="bg-transparent text-xs text-slate-300 placeholder-slate-500 outline-none w-full font-medium"
                />
              </div>
              
              {/* Mobile App Title */}
              <span className="font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent md:hidden text-lg">
                FinBuddy
              </span>
            </div>

            {/* Right side: Notifications, Profile, Health Badge */}
            <div className="flex items-center gap-4">
              {/* Health score badge */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl text-xs font-bold">
                <span className="text-slate-500 uppercase text-[9px] tracking-wider">Health</span>
                <span className={healthScore >= 75 ? 'text-emerald-400' : healthScore < 45 ? 'text-red-400' : 'text-yellow-400'}>
                  {healthScore}/100
                </span>
              </div>
              
              {/* Notifications */}
              <button className="p-2 text-slate-400 hover:text-white cursor-pointer relative touch-manipulation min-w-[44px] min-h-[44px]">
                <FaBell />
                <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
              </button>
              
              {/* Profile Avatar / Link */}
              <NavLink to="/profile" className="flex items-center gap-2 hover:opacity-90">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden lg:inline text-xs font-bold text-slate-300">{user?.name}</span>
              </NavLink>
            </div>
          </header>
        )}

        {/* PAGE CONTENT CONTAINER (Max-width 1600px centered) */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-8">
          <AppRoutes />
        </main>

        {/* STICKY BOTTOM NAVIGATION FOR MOBILE */}
        {showSidebar && (
          <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around items-center py-2.5 z-45 md:hidden shadow-lg select-none">
            {[
              { name: 'Home', path: '/', icon: <FaHome /> },
              { name: 'Roadmap', path: '/roadmap', icon: <FaMapSigns /> },
              { name: 'Goals', path: '/goals', icon: <FaBullseye /> },
              { name: 'Portfolio', path: '/portfolio', icon: <FaChartLine /> },
              { name: 'Profile', path: '/profile', icon: <FaUserCheck /> }
            ].map((link, idx) => (
              <NavLink 
                key={idx}
                to={link.path}
                className={({ isActive }) => `
                  flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all min-w-[50px] py-1.5 touch-manipulation min-h-[44px]
                  ${isActive ? 'text-blue-400 scale-105' : 'text-slate-400 hover:text-slate-200'}
                `}
              >
                <span className="text-base">{link.icon}</span>
                <span>{link.name}</span>
              </NavLink>
            ))}
          </nav>
        )}

      </div>
    </div>
  );
}

export default App;