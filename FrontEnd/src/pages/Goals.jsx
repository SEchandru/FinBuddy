import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FaTrash, 
  FaPlus, 
  FaBullseye, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaRobot, 
  FaTrophy, 
  FaChartLine, 
  FaLightbulb,
  FaArrowRight
} from 'react-icons/fa';

const PREBUILT_GOALS = [
  { category: 'Emergency Fund', icon: '🛡️', defaultName: 'Emergency Safety Reserve', priority: 'Critical', defaultTarget: 100000, desc: '3-6 months of expenses for emergencies.' },
  { category: 'Retirement', icon: '👴', defaultName: 'Sunset Retirement Fund', priority: 'Critical', defaultTarget: 5000000, desc: 'Systematic corpus for retirement comfort.' },
  { category: 'Child Education', icon: '🎓', defaultName: 'Child Higher Education Fund', priority: 'Important', defaultTarget: 1000000, desc: 'Corpus for future tuition fees.' },
  { category: 'House', icon: '🏠', defaultName: 'Dream Home Downpayment', priority: 'Important', defaultTarget: 1500000, desc: 'Capital for property downpayment.' },
  { category: 'Marriage', icon: '💍', defaultName: 'Wedding Fund Milestone', priority: 'Important', defaultTarget: 500000, desc: 'Celebration and event planning.' },
  { category: 'Bike', icon: '🏍️', defaultName: 'Sports Bike Purchase', priority: 'Optional', defaultTarget: 150000, desc: 'Two-wheeler lifestyle asset.' },
  { category: 'Car', icon: '🚗', defaultName: 'Family SUV Downpayment', priority: 'Optional', defaultTarget: 800000, desc: 'Four-wheeler lifestyle asset.' },
  { category: 'Laptop', icon: '💻', defaultName: 'Workstation Tech Upgrade', priority: 'Optional', defaultTarget: 120000, desc: 'High-end productivity computer.' },
  { category: 'Mobile', icon: '📱', defaultName: 'Premium Flagship Phone', priority: 'Optional', defaultTarget: 80000, desc: 'Next-gen smartphone upgrade.' },
  { category: 'Travel', icon: '✈️', defaultName: 'Europe Vacation Tour', priority: 'Optional', defaultTarget: 300000, desc: 'Leisure and travel planning.' },
  { category: 'Custom Goal', icon: '🎯', defaultName: 'My Savings Milestone', priority: 'Important', defaultTarget: 200000, desc: 'Define your custom financial milestone.' }
];

// Helper to calculate months remaining and monthly saving required
const calculateGoalMetrics = (goal, monthlyIncome) => {
  const deadlineDate = new Date(goal.deadline);
  const now = new Date();
  
  // Calculate months remaining (minimum 1 month to avoid division by zero)
  const timeDiff = deadlineDate.getTime() - now.getTime();
  const daysRemaining = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
  const monthsRemaining = Math.max(1, Math.round(daysRemaining / 30));
  
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  const monthlySavingRequired = monthsRemaining > 0 ? remainingAmount / monthsRemaining : remainingAmount;
  
  // Difficulty & Feasibility heuristics relative to monthly income
  let difficulty = 'Easy';
  let feasibilityScore = 95;
  
  if (monthlyIncome > 0) {
    const ratio = monthlySavingRequired / monthlyIncome;
    if (ratio > 0.45) {
      difficulty = 'Unrealistic';
      feasibilityScore = 15;
    } else if (ratio > 0.22) {
      difficulty = 'Difficult';
      feasibilityScore = 50;
    } else if (ratio > 0.08) {
      difficulty = 'Moderate';
      feasibilityScore = 80;
    } else {
      difficulty = 'Easy';
      feasibilityScore = 95;
    }
  }

  // Expect Outcomes for different plans:
  // 1. Cash (0%): P = Remaining / Months
  const cashMonthly = monthlySavingRequired;
  
  // 2. RD (6% compounded monthly, r = 0.06/12)
  // Formula for annuity: P = FV * r / [ (1 + r)^n - 1 ]
  const rRD = 0.06 / 12;
  const n = monthsRemaining;
  const rdMonthly = n > 1 
    ? (remainingAmount * rRD) / (Math.pow(1 + rRD, n) - 1)
    : remainingAmount;

  // 3. Hybrid Plan (9% compound return)
  const rHybrid = 0.09 / 12;
  const hybridMonthly = n > 1
    ? (remainingAmount * rHybrid) / (Math.pow(1 + rHybrid, n) - 1)
    : remainingAmount;

  // 4. SIP Mutual Funds Plan (12% compound return)
  const rSIP = 0.12 / 12;
  const sipMonthly = n > 1
    ? (remainingAmount * rSIP) / (Math.pow(1 + rSIP, n) - 1)
    : remainingAmount;

  return {
    monthsRemaining,
    remainingAmount,
    monthlySavingRequired,
    difficulty,
    feasibilityScore,
    fundingPlans: {
      cash: Math.round(cashMonthly),
      rd: Math.round(rdMonthly),
      hybrid: Math.round(hybridMonthly),
      sip: Math.round(sipMonthly)
    }
  };
};

// Automatic Priority Heuristics sorting function
const sortGoalsByPriority = (goals) => {
  const getCategoryWeight = (cat) => {
    switch (cat) {
      case 'Emergency Fund': return 1;
      case 'Retirement':
      case 'Child Education':
      case 'House':
        return 2;
      case 'Marriage':
      case 'Bike':
      case 'Laptop':
        return 3;
      case 'Car':
      case 'Travel':
      case 'Mobile':
      default:
        return 4;
    }
  };

  const getPriorityWeight = (prio) => {
    switch (prio) {
      case 'Critical': return -0.5;
      case 'Important': return 0;
      case 'Optional': return 0.5;
      default: return 0;
    }
  };

  return [...goals].sort((a, b) => {
    const weightA = getCategoryWeight(a.category) + getPriorityWeight(a.priority);
    const weightB = getCategoryWeight(b.category) + getPriorityWeight(b.priority);
    
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    // Fallback to remaining target amount (larger targets first)
    return b.targetAmount - a.targetAmount;
  });
};

const getGoalAlert = (goal, metrics) => {
  const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  if (pct >= 100) {
    return { status: 'Goal Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
  }
  if (metrics.difficulty === 'Unrealistic') {
    return { status: 'Goal At Risk', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
  }
  if (metrics.monthsRemaining < 3 && pct < 40) {
    return { status: 'Goal At Risk', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
  }
  if (pct < 15) {
    return { status: 'Goal Behind Schedule', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
  }
  return { status: 'Goal Achievable', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
};

const calculateGoalHealthScore = (goals, monthlyIncome) => {
  if (!goals || goals.length === 0) return { total: 0, status: 'No Goals Set', color: 'text-slate-500', bg: 'bg-slate-500/10', totalTarget: 0, totalRemaining: 0, totalMonthlyRequired: 0 };

  let progressSum = 0;
  let totalTarget = 0;
  let totalRemaining = 0;
  let totalMonthlyRequired = 0;
  let unrealisticCount = 0;
  let hasEmergencyFund = false;
  let emergencyProgress = 0;
  let criticalOnTrack = true;

  goals.forEach(g => {
    const progress = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) : 0;
    progressSum += Math.min(1, progress);
    totalTarget += g.targetAmount;
    totalRemaining += Math.max(0, g.targetAmount - g.currentAmount);

    const metrics = calculateGoalMetrics(g, monthlyIncome);
    totalMonthlyRequired += metrics.monthlySavingRequired;

    if (metrics.difficulty === 'Unrealistic') {
      unrealisticCount++;
      if (g.priority === 'Critical') {
        criticalOnTrack = false;
      }
    }

    if (g.category === 'Emergency Fund') {
      hasEmergencyFund = true;
      emergencyProgress = progress;
    }
  });

  const avgProgress = progressSum / goals.length;

  // 1. Goal Progress (30 points)
  const progressScore = avgProgress * 30;

  // 2. Savings Discipline (25 points)
  let savingsDisciplineScore = 5;
  if (monthlyIncome > 0) {
    const requiredRatio = totalMonthlyRequired / monthlyIncome;
    if (requiredRatio <= 0.30) savingsDisciplineScore = 25;
    else if (requiredRatio <= 0.50) savingsDisciplineScore = 15;
    else if (requiredRatio <= 0.70) savingsDisciplineScore = 10;
  }

  // 3. Priority Alignment (20 points)
  let priorityScore = 0;
  if (hasEmergencyFund) {
    priorityScore += 10;
    priorityScore += Math.round(emergencyProgress * 10);
  } else {
    priorityScore = 5; // Penalty for missing emergency safety net
  }
  if (criticalOnTrack) {
    priorityScore += 5;
  }

  // 4. Timeline Feasibility (15 points)
  const feasibilityScore = Math.max(0, 15 - (unrealisticCount * 5));

  // 5. Consistency / Active Goal count (10 points)
  const consistencyScore = Math.min(10, goals.length * 3);

  const total = Math.max(0, Math.min(100, Math.round(progressScore + savingsDisciplineScore + priorityScore + feasibilityScore + consistencyScore)));

  let status = 'Poor';
  let color = 'text-rose-500';
  let bg = 'bg-rose-500/10';
  let progressClass = 'bg-rose-500';
  
  if (total >= 85) {
    status = 'Excellent';
    color = 'text-emerald-400';
    bg = 'bg-emerald-500/10';
    progressClass = 'bg-emerald-500';
  } else if (total >= 65) {
    status = 'Good';
    color = 'text-blue-400';
    bg = 'bg-blue-500/10';
    progressClass = 'bg-blue-500';
  } else if (total >= 45) {
    status = 'Average';
    color = 'text-yellow-400';
    bg = 'bg-yellow-500/10';
    progressClass = 'bg-yellow-400';
  }

  return {
    total,
    status,
    color,
    bg,
    progressClass,
    totalMonthlyRequired,
    totalTarget,
    totalRemaining
  };
};

function Goals() {
  const { API_URL, user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // New goal form states
  const [goalType, setGoalType] = useState('Emergency Fund');
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('Important');
  
  // Interactive simulator states
  const [selectedSimGoalId, setSelectedSimGoalId] = useState('');
  const [expenseReductionAmt, setExpenseReductionAmt] = useState(1000);

  // Contributions state mapping
  const [contributions, setContributions] = useState({});
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const monthlyIncome = user?.monthlyIncome || 25000;

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/finance/goals`);
      setGoals(res.data);
      if (res.data.length > 0) {
        setSelectedSimGoalId(res.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Pre-fill form details when user clicks pre-built category shortcuts
  const handleQuickSelectPreset = (preset) => {
    setGoalType(preset.category);
    setName(preset.defaultName);
    setTargetAmount(preset.defaultTarget);
    setCurrentAmount(0);
    setPriority(preset.priority);
    
    // Auto calculate typical target date (e.g. 12 months for small gadgets, 60 months for vehicles/house)
    const months = ['Emergency Fund', 'Laptop', 'Mobile', 'Travel'].includes(preset.category) ? 12 : 60;
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + months);
    setDeadline(targetDate.toISOString().split('T')[0]);
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount || !deadline) {
      setFormError('Please fill in all required fields.');
      return;
    }
    if (parseFloat(targetAmount) <= 0) {
      setFormError('Target amount must be positive.');
      return;
    }
    if (parseFloat(currentAmount) < 0) {
      setFormError('Current amount cannot be negative.');
      return;
    }

    setFormError('');
    try {
      const res = await axios.post(`${API_URL}/finance/goals`, {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        category: goalType,
        deadline,
        priority
      });
      
      const updatedGoals = [...goals, res.data];
      setGoals(updatedGoals);
      if (!selectedSimGoalId) {
        setSelectedSimGoalId(res.data.id);
      }
      
      // Reset fields
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setDeadline('');
      setSuccessMsg('Savings goal created successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create goal.');
    }
  };

  const handleContribute = async (id) => {
    const amount = parseFloat(contributions[id]);
    if (!amount || amount <= 0) {
      setActionError('Please enter a valid contribution amount.');
      return;
    }
    setActionError('');
    setSuccessMsg('');

    try {
      const res = await axios.post(`${API_URL}/finance/goals/${id}/contribute`, { amount });
      setGoals(goals.map(g => g.id === id ? res.data.goal : g));
      setContributions({ ...contributions, [id]: '' });
      setSuccessMsg(res.data.message || 'Contribution registered successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to contribute to goal.');
      setTimeout(() => setActionError(''), 4000);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Delete this savings target? Any accumulated savings will be refunded back to your Cash balance.')) return;
    try {
      await axios.delete(`${API_URL}/finance/goals/${id}`);
      setGoals(goals.filter(g => g.id !== id));
      if (selectedSimGoalId === id) {
        const remaining = goals.filter(g => g.id !== id);
        setSelectedSimGoalId(remaining.length > 0 ? remaining[0].id : '');
      }
      setSuccessMsg('Goal deleted and savings refunded.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error deleting goal:', err);
      setActionError('Failed to delete goal.');
    }
  };

  const handleContributionChange = (id, val) => {
    setContributions({ ...contributions, [id]: val });
  };

  // --- DERIVED METRICS & RATIOS ---
  const activeGoalsSorted = useMemo(() => {
    return sortGoalsByPriority(goals);
  }, [goals]);

  const dashboardMetrics = useMemo(() => {
    return calculateGoalHealthScore(goals, monthlyIncome);
  }, [goals, monthlyIncome]);

  // Smart Alert mapping for goal list items
  const getGoalAlertDetails = useCallback((goal) => {
    const metrics = calculateGoalMetrics(goal, monthlyIncome);
    return getGoalAlert(goal, metrics);
  }, [monthlyIncome]);

  // Advisor Panel insights generator
  const advisorInsights = useMemo(() => {
    const list = [];
    if (goals.length === 0) return ['Set up your first financial savings target to generate coaching tips!'];

    const hasEmergency = goals.some(g => g.category === 'Emergency Fund');
    const emergencyGoal = goals.find(g => g.category === 'Emergency Fund');
    const emergencyCompleted = emergencyGoal && (emergencyGoal.currentAmount >= emergencyGoal.targetAmount);

    if (!hasEmergency) {
      list.push('💡 Priority Alert: Emergency safety reserves should be established first. Create an Emergency Fund goal immediately.');
    } else if (!emergencyCompleted) {
      list.push('🛡️ Recommendation: Focus savings allocations onto completing your Emergency Fund before lifestyle projects to ensure safety.');
    }

    let unrealisticCount = 0;
    goals.forEach(g => {
      const m = calculateGoalMetrics(g, monthlyIncome);
      if (m.difficulty === 'Unrealistic') {
        unrealisticCount++;
        list.push(`⚠️ Feasibility warning: Target deadline for "${g.name}" is unrealistic. Consider extending the target date or contributing ₹${Math.round(m.monthlySavingRequired - (monthlyIncome * 0.15))} more monthly.`);
      }
    });

    if (dashboardMetrics.total < 60 && unrealisticCount === 0) {
      list.push('💡 Savings discipline check: Total monthly saving requirements are high compared to income. Extend deadlines to improve your Goal Health Score.');
    }

    if (list.length === 0) {
      list.push('⭐ Stellar roadmap consistency! All active milestones behave within realistic savings allocations.');
    }

    return list;
  }, [goals, monthlyIncome, dashboardMetrics]);

  // Dynamic Goal Impact acceleration values
  const impactStats = useMemo(() => {
    const targetSimGoal = goals.find(g => g.id === selectedSimGoalId);
    if (!targetSimGoal) return null;

    const metrics = calculateGoalMetrics(targetSimGoal, monthlyIncome);
    const remaining = metrics.remainingAmount;
    const normalMonthly = metrics.monthlySavingRequired;

    const baselineMonths = metrics.monthsRemaining;
    const acceleratedMonthly = normalMonthly + expenseReductionAmt;
    const acceleratedMonths = acceleratedMonthly > 0 ? Math.ceil(remaining / acceleratedMonthly) : baselineMonths;
    const monthsSaved = Math.max(0, baselineMonths - acceleratedMonths);

    return {
      goalName: targetSimGoal.name,
      normalMonths: baselineMonths,
      acceleratedMonths,
      monthsSaved,
      savingTip: `Trimming ₹${expenseReductionAmt.toLocaleString()} from discretionary spending cuts target completion by ${monthsSaved} full months!`
    };
  }, [goals, selectedSimGoalId, expenseReductionAmt, monthlyIncome]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-white min-h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8">
      
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2.5">
          <FaTrophy className="text-yellow-500" /> Goal Planning & Achievement System
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Personal Goal Advisor: Feasibility scoring, RD vs SIP funding projections, and dynamic expense impact calculators.
        </p>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400 flex items-center gap-2">
          <FaCheckCircle /> {successMsg}
        </div>
      )}
      {actionError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-400">
          {actionError}
        </div>
      )}

      {/* 1. GOAL DASHBOARD HEADER */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        
        {/* Health Score Circular Gauge */}
        <div className="xl:col-span-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Goal Health Score</h3>
          
          <div className="relative flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="#1e293b" strokeWidth="6" fill="transparent" />
              <circle 
                cx="48" 
                cy="48" 
                r="40" 
                stroke={dashboardMetrics.total >= 85 ? '#10b981' : (dashboardMetrics.total >= 65 ? '#3b82f6' : (dashboardMetrics.total >= 45 ? '#fbbf24' : '#ef4444'))} 
                strokeWidth="6" 
                fill="transparent" 
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - (goals.length > 0 ? dashboardMetrics.total : 0) / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <span className={`absolute text-2xl font-extrabold ${goals.length > 0 ? dashboardMetrics.color : 'text-slate-500'}`}>
              {goals.length > 0 ? dashboardMetrics.total : '--'}
            </span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${goals.length > 0 ? `${dashboardMetrics.bg} ${dashboardMetrics.color}` : 'bg-slate-800 text-slate-400'} border border-slate-850`}>
            {goals.length > 0 ? dashboardMetrics.status : 'Empty'}
          </span>
        </div>

        {/* Dashboard Numerical metrics cards */}
        <div className="xl:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex flex-col justify-between">
            <p className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">Total Active Goals</p>
            <h4 className="text-2xl font-extrabold text-white mt-2">{goals.length} Goals</h4>
            <span className="text-[10px] text-slate-500 mt-1 font-light">Milestones tracked</span>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex flex-col justify-between">
            <p className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">Combined Target Value</p>
            <h4 className="text-2xl font-extrabold text-blue-400 mt-2">₹{dashboardMetrics.totalTarget.toLocaleString('en-IN')}</h4>
            <span className="text-[10px] text-slate-500 mt-1 font-light">Remaining: ₹{dashboardMetrics.totalRemaining.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex flex-col justify-between">
            <p className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">Average Completion %</p>
            <h4 className="text-2xl font-extrabold text-emerald-400 mt-2">
              {goals.length > 0 ? Math.round(((dashboardMetrics.totalTarget - dashboardMetrics.totalRemaining)/dashboardMetrics.totalTarget)*100) : 0}%
            </h4>
            <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-emerald-500" 
                style={{ width: `${goals.length > 0 ? Math.round(((dashboardMetrics.totalTarget - dashboardMetrics.totalRemaining)/dashboardMetrics.totalTarget)*100) : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-md flex flex-col justify-between">
            <p className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">Monthly Savings Needed</p>
            <h4 className="text-2xl font-extrabold text-yellow-400 mt-2">₹{Math.round(dashboardMetrics.totalMonthlyRequired).toLocaleString('en-IN')}</h4>
            <span className="text-[10px] text-slate-500 mt-1 font-light">
              {monthlyIncome > 0 ? `${Math.round((dashboardMetrics.totalMonthlyRequired / monthlyIncome)*100)}% of income` : 'No income added'}
            </span>
          </div>
        </div>

      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: CREATION & ADVISORY PANEL */}
        <div className="xl:col-span-1 space-y-8">
          
          {/* prebuilt goal presets */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FaLightbulb className="text-yellow-500" /> Goal Presets Library
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Click any pre-built milestone category to initialize targets instantly.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PREBUILT_GOALS.map((preset) => (
                <button
                  key={preset.category}
                  onClick={() => handleQuickSelectPreset(preset)}
                  className={`bg-slate-950/80 border ${goalType === preset.category ? 'border-blue-500' : 'border-slate-850'} hover:border-slate-700 p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer group`}
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{preset.icon}</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 group-hover:text-white truncate w-full">{preset.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Create Goal Form */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FaPlus className="text-blue-500" /> Smart Goal Planner Setup
            </h3>

            {formError && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-[11px] text-rose-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddGoal} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Goal Type</label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-slate-300 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {PREBUILT_GOALS.map(p => <option key={p.category} value={p.category}>{p.category}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-slate-300 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Critical">🚨 Critical</option>
                    <option value="Important">⭐ Important</option>
                    <option value="Optional">💡 Optional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Goal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Europe Trip 2027"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Target (₹)</label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="2,50,000"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Current Saved (₹)</label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Target Date</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white transition-all shadow-md shadow-blue-600/10 cursor-pointer text-center"
              >
                Launch Savings Target
              </button>
            </form>
          </div>

          {/* Coach Insights Feed */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
              <FaRobot className="text-teal-400" /> Savings Advisor Tips
            </h3>
            <div className="space-y-3 text-xs leading-normal font-light">
              {advisorInsights.map((insight, idx) => (
                <p key={idx} className="text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  {insight}
                </p>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PROGRESS CARDS, SORTING, SIMULATORS */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Priority Sort Indicator */}
          <div className="flex justify-between items-center text-xs font-semibold print:hidden">
            <span className="text-slate-400 uppercase tracking-wider">Active Savings Milestones</span>
            <span className="text-slate-500 italic">Auto-sorted by category priority</span>
          </div>

          {goals.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <FaBullseye className="text-5xl text-slate-700 animate-pulse" />
              <p className="text-sm font-bold">No Savings Roadmap Targets Registered.</p>
              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                Use the setup form or preset library on the left to map your milestones and launch advisor-grade plans.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeGoalsSorted.map((goal, idx) => {
                const metrics = calculateGoalMetrics(goal, monthlyIncome);
                const alertInfo = getGoalAlertDetails(goal);
                const progressPct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
                const isCompleted = goal.currentAmount >= goal.targetAmount;
                
                // Fetch the preset icon
                const categoryPreset = PREBUILT_GOALS.find(p => p.category === goal.category);
                const icon = categoryPreset ? categoryPreset.icon : '🎯';

                // Determine category priority label
                let categoryGroup = 'Luxury Milestone';
                if (goal.category === 'Emergency Fund') categoryGroup = 'Emergency safety';
                else if (['Retirement', 'Child Education', 'House'].includes(goal.category)) categoryGroup = 'Essential Milestone';
                else if (['Marriage', 'Bike', 'Laptop'].includes(goal.category)) categoryGroup = 'Lifestyle Milestone';

                return (
                  <div 
                    key={goal.id}
                    className={`bg-slate-900/40 border rounded-2xl p-6 backdrop-blur-md space-y-6 transition-all duration-300 relative overflow-hidden ${
                      isCompleted ? 'border-emerald-500/20 bg-emerald-950/2' : 'border-slate-800 hover:border-slate-750'
                    }`}
                  >
                    {idx === 0 && (
                      <div className="absolute top-0 right-0 bg-yellow-500/10 border-l border-b border-yellow-500/20 text-yellow-500 text-[9px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                        ★ #1 Priority Goal
                      </div>
                    )}

                    {/* Card Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl p-3 bg-slate-950/60 rounded-2xl border border-slate-850 shrink-0">{icon}</span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-lg font-bold text-white leading-tight">{goal.name}</h4>
                            <span className="px-2 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 border border-slate-700 font-semibold uppercase">
                              {categoryGroup}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] ${alertInfo.bg} ${alertInfo.color} ${alertInfo.border} font-bold`}>
                              {alertInfo.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 font-light">
                            Priority: <strong>{goal.priority}</strong> | Target Deadline: <strong>{new Date(goal.deadline).toLocaleDateString()}</strong> ({metrics.monthsRemaining} months remaining)
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all self-start md:self-center cursor-pointer"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>

                    {/* Progress Bar & Stats */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-slate-400">Roadmap Progress</span>
                        <span className={isCompleted ? 'text-emerald-400' : 'text-blue-400'}>{progressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-blue-600 to-teal-400'}`}
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Saved: ₹{goal.currentAmount.toLocaleString()}</span>
                        <span>Target: ₹{goal.targetAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Feasibility Panel & Funding plans */}
                    {!isCompleted && (
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-slate-855/60 text-xs">
                        
                        {/* Feasibility Indicator */}
                        <div className="md:col-span-1 bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex flex-col justify-between text-center relative overflow-hidden">
                          <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Feasibility</p>
                          <span className={`text-md font-extrabold uppercase my-2 inline-block ${
                            metrics.difficulty === 'Easy' ? 'text-emerald-400' : (metrics.difficulty === 'Moderate' ? 'text-blue-400' : (metrics.difficulty === 'Difficult' ? 'text-yellow-400' : 'text-rose-500'))
                          }`}>
                            {metrics.difficulty}
                          </span>
                          <span className="text-[9px] text-slate-400 font-light">Score: {metrics.feasibilityScore}/100</span>
                        </div>

                        {/* Funding Schemes comparison */}
                        <div className="md:col-span-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Goal Funding Advisory Plans (Monthly Outlay)</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                              <p className="text-[8px] text-slate-500 font-bold uppercase">Cash (0%)</p>
                              <p className="text-xs font-bold text-white mt-1">₹{metrics.fundingPlans.cash.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                              <p className="text-[8px] text-slate-400 font-bold uppercase">RD Plan (6%)</p>
                              <p className="text-xs font-bold text-blue-400 mt-1">₹{metrics.fundingPlans.rd.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                              <p className="text-[8px] text-slate-400 font-bold uppercase">Hybrid (9%)</p>
                              <p className="text-xs font-bold text-teal-400 mt-1">₹{metrics.fundingPlans.hybrid.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                              <p className="text-[8px] text-slate-400 font-bold uppercase">SIP (12%)</p>
                              <p className="text-xs font-bold text-emerald-400 mt-1">₹{metrics.fundingPlans.sip.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Contribution Footer */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-855/60">
                      {isCompleted ? (
                        <div className="w-full flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-bold py-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          <FaCheckCircle /> Milestone Completed! Funds fully allocated.
                        </div>
                      ) : (
                        <div className="flex gap-2 w-full md:max-w-xs text-xs">
                          <input
                            type="number"
                            value={contributions[goal.id] || ''}
                            onChange={(e) => handleContributionChange(goal.id, e.target.value)}
                            placeholder="Add fund contribution (₹)"
                            className="flex-1 min-w-0 rounded-xl border border-slate-850 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
                          />
                          <button
                            onClick={() => handleContribute(goal.id)}
                            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                          >
                            Contribute Cash
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-light mt-1 md:mt-0">
                        <FaCalendarAlt />
                        <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* 3. GOAL IMPACT ANALYSIS (EXPENSE ACCELERATION ENGINE) */}
          {goals.length > 0 && impactStats && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FaChartLine className="text-blue-500" /> Goal Timeline Acceleration Simulator
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  See how channeling monthly expense savings (from food or shopping) directly into goals accelerates your roadmap.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                
                {/* Select Goal */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Milestone</label>
                  <select
                    value={selectedSimGoalId}
                    onChange={(e) => setSelectedSimGoalId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {goals.map(g => (
                      <option key={g.id} value={g.id}>{g.name} (₹{g.targetAmount.toLocaleString()})</option>
                    ))}
                  </select>
                </div>

                {/* Expense Reduction Slider */}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span>Category Outlay Reduction</span>
                    <span className="text-blue-400 font-sans">₹{expenseReductionAmt.toLocaleString()}/month</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="5000"
                    step="100"
                    value={expenseReductionAmt}
                    onChange={(e) => setExpenseReductionAmt(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-600 font-bold uppercase">
                    <span>₹200</span>
                    <span>₹2,500</span>
                    <span>₹5,000</span>
                  </div>
                </div>

              </div>

              {/* Simulation Result Box */}
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-bl-full"></div>
                
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-slate-200">Accelerating "{impactStats.goalName}"</h4>
                  <p className="text-slate-400 font-light leading-normal">{impactStats.savingTip}</p>
                </div>

                <div className="flex items-center gap-6 text-center shrink-0">
                  <div className="bg-slate-900 border border-slate-850 p-2 px-3 rounded-lg">
                    <p className="text-[8px] text-slate-500 font-bold uppercase">Normal</p>
                    <p className="text-sm font-extrabold text-slate-300 mt-0.5">{impactStats.normalMonths} months</p>
                  </div>
                  <FaArrowRight className="text-slate-600 text-xs" />
                  <div className="bg-blue-600/10 border border-blue-500/20 p-2 px-3 rounded-lg">
                    <p className="text-[8px] text-blue-400 font-bold uppercase">Accelerated</p>
                    <p className="text-sm font-extrabold text-blue-400 mt-0.5">{impactStats.acceleratedMonths} months</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 px-3 rounded-lg">
                    <p className="text-[8px] text-emerald-400 font-bold uppercase">Saved</p>
                    <p className="text-sm font-extrabold text-emerald-400 mt-0.5">{impactStats.monthsSaved} months</p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default Goals;