import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Dashboard from "../pages/Dashboard";
import ExpenseTracker from "../pages/ExpenseTracker";
import Goals from "../pages/Goals";
import Calculators from "../pages/Calculators";
import Reports from "../pages/Reports";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Onboarding from "../pages/Onboarding";
import Roadmap from "../pages/Roadmap";
import Portfolio from "../pages/Portfolio";
import NewsCenter from "../pages/NewsCenter";
import MarketIntelligence from "../pages/MarketIntelligence";
import RiskQuiz from "../pages/RiskQuiz";
import AIAdvisor from "../pages/AIAdvisor";
import AssetAllocation from "../pages/AssetAllocation";
import HealthScore from "../pages/HealthScore";
import InsurancePlanner from "../pages/InsurancePlanner";
import BudgetPlanner from "../pages/BudgetPlanner";
import PortfolioNews from "../pages/PortfolioNews";
import FinancialAnalysis from "../pages/FinancialAnalysis";

// Protect routes based on user state
const ProtectedRoute = ({ children, requireOnboarded = true }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireOnboarded && !user.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!requireOnboarded && user.isOnboarded) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Redirect authenticated users away from Login/Register
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (user) {
    if (!user.isOnboarded) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Onboarding Route */}
      <Route path="/onboarding" element={
        <ProtectedRoute requireOnboarded={false}>
          <Onboarding />
        </ProtectedRoute>
      } />

      {/* Protected Main Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/analysis" element={
        <ProtectedRoute>
          <FinancialAnalysis />
        </ProtectedRoute>
      } />
      <Route path="/roadmap" element={
        <ProtectedRoute>
          <Roadmap />
        </ProtectedRoute>
      } />
      <Route path="/expenses" element={
        <ProtectedRoute>
          <ExpenseTracker />
        </ProtectedRoute>
      } />
      <Route path="/budget" element={
        <ProtectedRoute>
          <BudgetPlanner />
        </ProtectedRoute>
      } />
      <Route path="/goals" element={
        <ProtectedRoute>
          <Goals />
        </ProtectedRoute>
      } />
      <Route path="/insurance" element={
        <ProtectedRoute>
          <InsurancePlanner />
        </ProtectedRoute>
      } />
      <Route path="/portfolio" element={
        <ProtectedRoute>
          <Portfolio />
        </ProtectedRoute>
      } />
      <Route path="/asset-allocation" element={
        <ProtectedRoute>
          <AssetAllocation />
        </ProtectedRoute>
      } />
      <Route path="/health-score" element={
        <ProtectedRoute>
          <HealthScore />
        </ProtectedRoute>
      } />
      <Route path="/quiz" element={
        <ProtectedRoute>
          <RiskQuiz />
        </ProtectedRoute>
      } />
      <Route path="/portfolio-news" element={
        <ProtectedRoute>
          <PortfolioNews />
        </ProtectedRoute>
      } />
      <Route path="/news" element={
        <ProtectedRoute>
          <NewsCenter />
        </ProtectedRoute>
      } />
      <Route path="/market" element={
        <ProtectedRoute>
          <MarketIntelligence />
        </ProtectedRoute>
      } />
      <Route path="/ai-advisor" element={
        <ProtectedRoute>
          <AIAdvisor />
        </ProtectedRoute>
      } />
      <Route path="/calculators" element={
        <ProtectedRoute>
          <Calculators />
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;