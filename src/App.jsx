import Sidebar from "./components/common/Sidebar";
import AppRoutes from "./routes/AppRoutes";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user } = useAuth();

  // Show sidebar only if logged in and completed onboarding
  const showSidebar = user && user.isOnboarded;

  return (
    <div className="flex min-h-screen bg-slate-950 text-white font-sans">
      {showSidebar && <Sidebar />}

      <div className="flex-1 min-h-screen flex flex-col">
        <AppRoutes />
      </div>
    </div>
  );
}

export default App;