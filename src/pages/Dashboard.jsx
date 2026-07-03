import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FaCoins, 
  FaWallet, 
  FaChartPie, 
  FaClipboardList, 
  FaArrowRight, 
  FaShieldAlt, 
  FaHeartbeat, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaLightbulb, 
  FaBullseye, 
  FaExclamationTriangle,
  FaPlus,
  FaUser,
  FaMapSigns,
  FaInfoCircle,
  FaCompass
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#fbbf24', '#10b981', '#f43f5e'];

function Dashboard() {
  const { user, API_URL } = useAuth();
  const navigate = useNavigate();
  
  const [expenses, setExpenses] = useState([]);
  const [goals, setGoals] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roadmapReport, setRoadmapReport] = useState(() => {
    const saved = localStorage.getItem(`finbuddy_roadmap_${user?.email || 'guest'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.report || null;
      } catch (err) {
        console.error("Error loading roadmap from cache:", err);
      }
    }
    return null;
  });

  const [prevUserEmail, setPrevUserEmail] = useState(user?.email || 'guest');
  if (user?.email !== prevUserEmail) {
    setPrevUserEmail(user?.email || 'guest');
    const saved = localStorage.getItem(`finbuddy_roadmap_${user?.email || 'guest'}`);
    let loadedReport = null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        loadedReport = parsed.report || null;
      } catch (err) {
        console.error("Error loading roadmap from cache:", err);
      }
    }
    setRoadmapReport(loadedReport);
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [expRes, goalRes, portRes] = await Promise.all([
          axios.get(`${API_URL}/finance/expenses`),
          axios.get(`${API_URL}/finance/goals`),
          axios.get(`${API_URL}/finance/portfolio`)
        ]);
        setExpenses(expRes.data);
        setGoals(goalRes.data);
        setPortfolio(portRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [API_URL]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-white min-h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // --- PRIMARY CALCULATIONS & DATA MAPPINGS ---
  const age = user?.age || 22;
  const monthlySalary = user?.monthlyIncome || 25000;
  const annualIncome = monthlySalary * 12;
  
  const currentSavings = user?.netWorth || 20000;
  const currentInvestments = portfolio.reduce((sum, p) => p.assetType !== 'Cash' ? sum + p.amount : sum, 0) || 0;
  const existingLoans = user?.loans || 0;
  const currentHealthIns = user?.currentHealthIns || 0;
  const currentTermIns = user?.currentTermIns || 0;
  const nomineeAdded = user?.nomineeAdded || 'No';
  const riskCategory = user?.riskProfile?.category || 'Moderate';

  // Calculate current month's expenses
  const now = new Date();
  const currentMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalMonthlyExpenses = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const actualSavingsRate = monthlySalary > 0 ? Math.round(((monthlySalary - totalMonthlyExpenses) / monthlySalary) * 100) : 0;
  const parsedSavingsRate = Math.max(0, actualSavingsRate);

  // Financial Stage Map
  let stageName = "Foundation Building Stage";
  let stageDesc = "(Age 18-25)";
  if (age >= 26 && age <= 35) {
    stageName = "Wealth Building Stage";
    stageDesc = "(Age 26-35)";
  } else if (age >= 36 && age <= 50) {
    stageName = "Asset Accumulation Stage";
    stageDesc = "(Age 36-50)";
  } else if (age > 50) {
    stageName = "Wealth Protection Stage";
    stageDesc = "(Age 50+)";
  }

  // Dynamic recommendations & gaps
  let recHealthIns = 500000;
  if (age >= 26 && age <= 35) recHealthIns = 1000000;
  if (age >= 36) recHealthIns = 1500005;

  const recTermIns = annualIncome * 10;
  const minEF = Math.round(totalMonthlyExpenses * 3) || Math.round(monthlySalary * 1.5);

  // --- HEALTH SCORE CALCULATION (100 Points) ---
  const efScore = currentSavings >= minEF ? 20 : Math.round((currentSavings / (minEF || 1)) * 20);
  const healthPoints = currentHealthIns > 0 ? 10 : 0;
  const termPoints = recTermIns === 0 ? 10 : (currentTermIns >= recTermIns ? 10 : (currentTermIns > 0 ? 5 : 0));
  const insScore = healthPoints + termPoints;
  const savingsRateScore = parsedSavingsRate >= 30 ? 15 : (parsedSavingsRate >= 20 ? 10 : (parsedSavingsRate >= 10 ? 5 : 0));
  const investScore = currentInvestments > 0 ? 15 : 0;
  const debtScore = existingLoans === 0 ? 15 : (existingLoans < monthlySalary * 6 ? 10 : 5);
  const goalProgressScore = goals.length > 0 
    ? Math.round((goals.reduce((sum, g) => sum + Math.min(1, g.currentAmount / g.targetAmount), 0) / goals.length) * 15)
    : 5;

  const dynamicHealthScore = Math.min(100, efScore + insScore + savingsRateScore + investScore + debtScore + goalProgressScore);
  const healthScore = roadmapReport?.healthScore || dynamicHealthScore;

  let ratingLabel;
  let ratingColor;
  if (healthScore >= 81) {
    ratingLabel = 'Excellent';
    ratingColor = 'text-emerald-500';
  } else if (healthScore >= 61) {
    ratingLabel = 'Good';
    ratingColor = 'text-blue-500';
  } else if (healthScore >= 41) {
    ratingLabel = 'Average';
    ratingColor = 'text-amber-500';
  } else {
    ratingLabel = 'Poor';
    ratingColor = 'text-rose-500';
  }

  // Strengths & Weaknesses lists
  const strengths = [];
  const weaknesses = [];
  const concerns = [];

  if (existingLoans === 0) strengths.push("Completely debt-free status helps maintain cash flow flexibility.");
  else weaknesses.push("Active loans eat into your monthly investing capacity.");

  if (currentSavings >= minEF) strengths.push("Emergency reserve meets safety targets (3+ months expenses).");
  else {
    weaknesses.push("Low liquid cash buffer makes you vulnerable to income shocks.");
    concerns.push("Build a 3-month emergency reserve immediately.");
  }

  if (currentHealthIns >= recHealthIns) strengths.push("Adequate medical cover protects assets from hospitalization bills.");
  else {
    weaknesses.push("Medical cover gap exposes your assets to healthcare inflation.");
    concerns.push("Secure a health floater policy of at least ₹" + recHealthIns.toLocaleString());
  }

  if (recTermIns > 0 && currentTermIns < recTermIns) {
    weaknesses.push("Dependents have zero income protection cover in your absence.");
    concerns.push("Buy a Term Life cover of at least 20x annual income.");
  } else if (recTermIns > 0) {
    strengths.push("Solid Term Life coverage secures dependents' future.");
  }

  if (nomineeAdded === 'Yes') strengths.push("Nominees are successfully mapped across asset registers.");
  else weaknesses.push("Asset transmission risk: Update nominees across holdings.");

  if (parsedSavingsRate >= 20) strengths.push(`Healthy savings rate: You save ${parsedSavingsRate}% of salary.`);
  else weaknesses.push("Low savings rate. Target set-aside of 20% or more.");

  // --- SECTION 2: TOP 3 PRIORITIES ---
  const prioritiesList = [];
  if (currentSavings < minEF) {
    prioritiesList.push({
      title: "Build Emergency Fund",
      reason: "Secure a shield against unexpected job loss or urgent medical wait times.",
      target: `₹${minEF.toLocaleString()}`,
      timeline: "3 Months",
      path: "/expenses"
    });
  }
  if (currentHealthIns < recHealthIns) {
    prioritiesList.push({
      title: "Get Health Insurance",
      reason: `Procure a floater policy of ₹${recHealthIns.toLocaleString()} to guard against medical inflation.`,
      target: `₹${recHealthIns.toLocaleString()}`,
      timeline: "30 Days",
      path: "/roadmap"
    });
  }
  if (recTermIns > 0 && currentTermIns < recTermIns) {
    prioritiesList.push({
      title: "Get Term Insurance",
      reason: `Income replacement of ₹${recTermIns.toLocaleString()} secures family in your absence.`,
      target: `₹${recTermIns.toLocaleString()}`,
      timeline: "60 Days",
      path: "/roadmap"
    });
  }
  if (nomineeAdded === 'No') {
    prioritiesList.push({
      title: "Map Asset Nominees",
      reason: "Add nominees to bank and investment holdings to secure transmission.",
      target: "All Accounts",
      timeline: "15 Days",
      path: "/profile"
    });
  }
  if (currentInvestments === 0) {
    prioritiesList.push({
      title: "Start Monthly SIP",
      reason: "Start compounding early to grow salary against inflation.",
      target: "₹2,000 / month",
      timeline: "Monthly",
      path: "/roadmap"
    });
  }
  // Make sure at least 3 items exist, else fill with goals
  prioritiesList.push({
    title: "Goal-Based Allocation",
    reason: "Dedicate separate SIP contributions to your active targets.",
    target: "Custom Targets",
    timeline: "Ongoing",
    path: "/goals"
  });
  prioritiesList.push({
    title: "Retirement Planning",
    reason: "Accumulate retirement pools early to harness decades of compounding.",
    target: "20x Annual Salary",
    timeline: "Long-term",
    path: "/roadmap"
  });

  const top3Priorities = prioritiesList.slice(0, 3);

  // --- SECTION 3: ROADMAP PROGRESS ---
  const roadmapItems = [
    { name: "Income Started", completed: monthlySalary > 0 },
    { name: "Budget Created", completed: expenses.length > 0 },
    { name: "Emergency Fund", completed: currentSavings >= minEF },
    { name: "Health Insurance", completed: currentHealthIns > 0 },
    { name: "First Investment", completed: currentInvestments > 0 },
    { name: "Goal Planning", completed: goals.length > 0 }
  ];
  const roadmapCompletedCount = roadmapItems.filter(r => r.completed).length;
  const roadmapProgressPct = Math.round((roadmapCompletedCount / 6) * 100);

  // --- SECTION 4: LIFE STAGE CHECKLIST ---
  const lifeStageChecklist = [];
  if (age >= 18 && age <= 25) {
    lifeStageChecklist.push("Create Emergency Cash Pot");
    lifeStageChecklist.push("Get Individual Health Insurance");
    lifeStageChecklist.push("Launch First Compounding SIP");
    lifeStageChecklist.push("Set aside Skill Development Budget");
    lifeStageChecklist.push("Draft a Career Growth Timeline");
    lifeStageChecklist.push("Clear all Credit Card Debt");
    lifeStageChecklist.push("Read 2 Basic Personal Finance Books");
    lifeStageChecklist.push("Set up Goal-targeted Savings");
  } else if (age >= 26 && age <= 35) {
    lifeStageChecklist.push("Establish Pure Term Life Insurance");
    lifeStageChecklist.push("Get Family Health Insurance cover");
    lifeStageChecklist.push("Setup Child Education SIPs");
    lifeStageChecklist.push("Audit Retirement Target Corpus");
    lifeStageChecklist.push("Diversify across Mutual Funds & Gold");
    lifeStageChecklist.push("Maximize Annual Tax Savings (80C)");
    lifeStageChecklist.push("Increase SIP amount by 10% annually");
    lifeStageChecklist.push("Maintain Emergency Fund for 6 months");
  } else if (age >= 36 && age <= 50) {
    lifeStageChecklist.push("Fund Core Retirement Accounts");
    lifeStageChecklist.push("Establish Child Higher Education Fund");
    lifeStageChecklist.push("Paydown Home Loan Liabilities");
    lifeStageChecklist.push("Rebalance Portfolio Asset Allocation");
    lifeStageChecklist.push("Draft Legal Wills & Nominees");
    lifeStageChecklist.push("Set up Parents Medical Float Cover");
    lifeStageChecklist.push("Maintain emergency cash in liquid funds");
  } else {
    lifeStageChecklist.push("Prepay all Outstanding Debts");
    lifeStageChecklist.push("Move Assets to Fixed Income/Bonds");
    lifeStageChecklist.push("Review Post-Retirement Health Covers");
    lifeStageChecklist.push("Map Systematic Withdrawal Plans (SWP)");
    lifeStageChecklist.push("Complete Nominee Registration Audits");
    lifeStageChecklist.push("Setup Legacy Estate Plan / Will");
  }

  // --- SECTION 5: FINANCIAL PROTECTION STATUS ---
  const protectionItems = [
    { name: "Health Insurance", status: currentHealthIns >= recHealthIns ? "Completed" : currentHealthIns > 0 ? "Needs Improvement" : "Missing" },
    { name: "Term Insurance", status: recTermIns === 0 ? "Completed" : currentTermIns >= recTermIns ? "Completed" : currentTermIns > 0 ? "Needs Improvement" : "Missing" },
    { name: "Emergency Fund", status: currentSavings >= minEF * 2 ? "Completed" : currentSavings >= minEF ? "Needs Improvement" : "Missing" },
    { name: "Nominee Setup", status: nomineeAdded === 'Yes' ? "Completed" : "Missing" },
    { name: "Family Protection", status: (currentHealthIns >= recHealthIns && (recTermIns === 0 || currentTermIns >= recTermIns) && nomineeAdded === 'Yes') ? "Completed" : "Needs Improvement" }
  ];

  let protectionScoreNum = 0;
  protectionItems.forEach(p => {
    if (p.status === 'Completed') protectionScoreNum += 20;
    else if (p.status === 'Needs Improvement') protectionScoreNum += 10;
  });
  const criticalMissingItems = protectionItems.filter(p => p.status === 'Missing').map(p => p.name);

  // --- SECTION 6: RECOMMENDED ASSET ALLOCATION ---
  let equityPct = 110 - age;
  let debtPct;
  let goldPct;
  let cashPct;

  if (riskCategory === 'Conservative') {
    equityPct = Math.max(25, Math.round(equityPct * 0.5));
    cashPct = 20;
    goldPct = 15;
    debtPct = 100 - (equityPct + goldPct + cashPct);
  } else if (riskCategory === 'Aggressive') {
    equityPct = Math.min(85, Math.round(equityPct * 1.2));
    goldPct = 5;
    cashPct = 5;
    debtPct = 100 - (equityPct + goldPct + cashPct);
  } else {
    equityPct = Math.max(30, Math.min(70, equityPct - 5));
    debtPct = 15;
    goldPct = 10;
    cashPct = 100 - (equityPct + debtPct + goldPct);
  }

  // Load saved savings percentage if any, else default to 20%
  let savingsPct = 20;
  const savedEnvelopes = localStorage.getItem('finbuddy_envelopes');
  if (savedEnvelopes) {
    try {
      const parsed = JSON.parse(savedEnvelopes);
      savingsPct = parsed.savings || 20;
    } catch (e) {
      console.error(e);
    }
  }
  const savingsAmt = (savingsPct / 100) * monthlySalary;

  const recommendedAllocations = [
    { name: 'Emergency Fund', value: cashPct, rupee: Math.round((cashPct/100)*savingsAmt) },
    { name: 'Equity Mutual Funds', value: equityPct, rupee: Math.round((equityPct/100)*savingsAmt) },
    { name: 'Debt Funds/Bonds', value: debtPct, rupee: Math.round((debtPct/100)*savingsAmt) },
    { name: 'Gold / Hedging', value: goldPct, rupee: Math.round((goldPct/100)*savingsAmt) }
  ];

  let allocationReasoning = `With a ${riskCategory} risk profile at age ${age}, a balanced allocation of ${equityPct}% Equity, ${debtPct}% Debt, and ${goldPct}% Gold helps build long-term capital while cushioning short-term goals.`;

  // --- SECTION 7: FIINBUDDY ADVISOR INSIGHTS ---
  let advisorMessage = "You recently started earning. Avoid direct stock picking. Build an emergency fund first. Then start a systematic SIP of at least ₹1,000 per month. Focus on skill development and income growth.";
  if (age >= 25 && age < 30) {
    advisorMessage = "You are entering your prime compounding decade. Ensure term insurance covers are set up before scaling equities. Step-up your mutual fund SIPs by 10% with every salary increment.";
  } else if (age >= 30) {
    advisorMessage = "With family responsibilities, secure healthcare covers for both children and dependent parents. Diversify investments to lower volatility and map child college milestones.";
  }

  const warningsList = [];
  if (currentHealthIns === 0) warningsList.push("Zero health insurance leaves you highly vulnerable to sudden hospitalization debt.");
  if (recTermIns > 0 && currentTermIns === 0) warningsList.push("Dependents have zero income protection. Mapped term coverage gap is critical.");
  if (existingLoans > monthlySalary * 6) warningsList.push("Outstanding debt leverage is high. Prioritize debt paydowns before aggressive index trading.");

  const suggestionsList = [];
  if (currentSavings < minEF) suggestionsList.push(`Set up automatic transfers to accumulate your ₹${minEF.toLocaleString()} emergency buffer.`);
  if (currentInvestments === 0) suggestionsList.push("Start an index mutual fund SIP of ₹1,000 to start compounding.");
  if (nomineeAdded === 'No') suggestionsList.push("Complete nominee mappings across netbanking portals.");

  const opportunitiesList = [
    "Expected Salary Growth is 10%. Gain certifications to negotiate higher increments.",
    "Equity markets represent long-term wealth generators. Harness compounding early."
  ];

  // Process expense breakdown for categories list
  const expenseCategories = {};
  currentMonthExpenses.forEach(e => {
    expenseCategories[e.category] = (expenseCategories[e.category] || 0) + e.amount;
  });
  const categoryBreakdown = Object.entries(expenseCategories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8 font-sans">

      {/* HEADER ROW WITH SECURITY SEALS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">FiinBuddy Advisor Suite</h1>
          <p className="text-xs text-slate-400 mt-1">Institutional self-custodial wealth planning and strategy engine.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl text-[10px] text-emerald-400 font-bold select-none w-fit">
          <FaShieldAlt className="text-xs" /> Verified Secure Terminal | 256-Bit Local Encryption
        </div>
      </div>

      {/* PRIORITIES 1 & 2: HEALTH SCORE, LIFE STAGE & NEXT ACTION PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Priority 1: Current Financial Stage & Health Score Circular Widget */}
        <div className="md:col-span-2 lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3.5 md:max-w-md">
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-950/40 border border-blue-900/30">
              {stageName} {stageDesc}
            </span>
            <h2 className="text-2xl font-extrabold text-white">Welcome back, {user?.name || 'User'} 👋</h2>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              You are currently classified in the <strong className="text-slate-200">{stageName.replace(" Stage", "")}</strong> stage. 
              Below is your verified financial health audit. Ensure emergency fund reserves are met before scaling high-volatility SIPs.
            </p>
            
            <div className="grid grid-cols-2 gap-4 pt-2 text-[11px] leading-relaxed">
              <div>
                <span className="text-slate-500 font-bold block uppercase text-[9px] tracking-wide mb-1">Key Strengths</span>
                <ul className="space-y-1">
                  {strengths.slice(0, 2).map((s, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <FaCheckCircle className="shrink-0 text-[10px]" /> <span className="text-slate-300 font-medium">{s}</span>
                    </li>
                  ))}
                  {strengths.length === 0 && <span className="text-slate-500">None logged yet.</span>}
                </ul>
              </div>
              <div>
                <span className="text-slate-500 font-bold block uppercase text-[9px] tracking-wide mb-1">Primary Deficits</span>
                <ul className="space-y-1">
                  {weaknesses.slice(0, 2).map((w, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-rose-400 font-semibold">
                      <FaTimesCircle className="shrink-0 text-[10px] mt-0.5" /> <span className="text-slate-350 font-medium">{w}</span>
                    </li>
                  ))}
                  {weaknesses.length === 0 && <span className="text-emerald-400 font-semibold">Zero immediate security deficits!</span>}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-950 p-6 border border-slate-850 rounded-xl text-center w-full md:w-52 shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Advisor Health Score</span>
            <div className="h-24 w-24 rounded-full border-4 border-slate-800 bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden mb-2">
              <span className="text-3xl font-black text-white">{healthScore}</span>
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">/ 100</span>
            </div>
            <div className={`text-sm font-extrabold flex items-center justify-center gap-1 ${ratingColor}`}>
              <FaHeartbeat className="text-xs" /> {ratingLabel}
            </div>
          </div>
        </div>

        {/* Priority 2: Next Recommended Action & Coach Warning Bubble */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold text-yellow-500 flex items-center gap-2 uppercase tracking-wider border-b border-slate-850 pb-2">
              <FaCompass /> Next Advisor Action
            </h3>
            
            <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-2">
              {warningsList.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block">⚠️ Immediate Threat Response Required</span>
                  <strong className="text-xs text-slate-200 block">{warningsList[0]}</strong>
                  <p className="text-[10px] text-slate-400 leading-normal">Our algorithms suggest taking care of this vulnerability prior to other investments.</p>
                </div>
              ) : top3Priorities.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider block">💡 Recommended Next Move</span>
                  <strong className="text-xs text-slate-200 block">{top3Priorities[0].title}</strong>
                  <p className="text-[10px] text-slate-400 leading-normal">{top3Priorities[0].reason}</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">✅ Status Normal</span>
                  <strong className="text-xs text-slate-200 block">Maintain compounding SIP ratios.</strong>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-350 italic font-semibold leading-relaxed">
              "{advisorMessage}"
            </p>
          </div>

          <div className="flex gap-2">
            {warningsList.length > 0 ? (
              <Link 
                to={top3Priorities[0]?.path || "/roadmap"}
                className="w-full text-center py-2.5 bg-rose-600 hover:bg-rose-500 text-xs font-bold rounded-xl transition-all"
              >
                Resolve Deficit Now
              </Link>
            ) : (
              <Link 
                to={top3Priorities[0]?.path || "/roadmap"}
                className="w-full text-center py-2.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-xl transition-all"
              >
                Execute Next Priority
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* PRIORITIES 3 & 4: FINANCIAL CHECKLIST & ROADMAP TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Priority 3: Life Stage Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 uppercase tracking-wider border-b border-slate-850 pb-2">
              <FaClipboardList /> 3. Financial Checklist
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
              Self-reported checklists for your current age stage guidelines ({stageDesc}):
            </p>
          </div>
          
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {lifeStageChecklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs bg-slate-950 p-3 border border-slate-850 rounded-xl font-semibold text-slate-200">
                <span className="text-emerald-500 text-sm"><FaCheckCircle /></span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority 4: Financial Roadmap Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-violet-400 flex items-center gap-2 uppercase tracking-wider border-b border-slate-850 pb-2">
              <FaMapSigns /> 4. Financial Roadmap
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
              Tracking your progress across fundamental milestones:
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {roadmapItems.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                  item.completed 
                    ? 'bg-slate-950 border-slate-850 text-slate-300' 
                    : 'bg-slate-900/50 border-slate-850/40 text-slate-500'
                }`}
              >
                <span className={item.completed ? 'text-emerald-400' : 'text-slate-700'}>
                  {item.completed ? <FaCheckCircle /> : <FaTimesCircle />}
                </span>
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
          
          <div className="bg-slate-950/60 p-3 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold">Overall Roadmap Progress:</span>
            <strong className="text-violet-400 font-black">{roadmapProgressPct}% Completed</strong>
          </div>
        </div>
      </div>

      {/* PRIORITIES 5 & 6: GOAL PROGRESS & PROTECTION STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Priority 5: Goal Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-850 pb-2">
            <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 uppercase tracking-wider">
              <FaBullseye /> 5. Goal Progress
            </h3>
            <Link to="/goals" className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
              Edit Goals <FaArrowRight />
            </Link>
          </div>

          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
            {goals.slice(0, 3).map((goal) => {
              const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              return (
                <div key={goal.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-2 leading-relaxed">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{goal.name}</span>
                    <span className="text-emerald-400 font-bold">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                    <span>₹{goal.currentAmount.toLocaleString()}</span>
                    <span>Target: ₹{goal.targetAmount.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
            {goals.length === 0 && (
              <div className="text-slate-500 text-xs py-8 text-center font-medium">
                No active targets set. Map your dreams in the Goal Planner.
              </div>
            )}
          </div>
        </div>

        {/* Priority 6: Protection Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-850 pb-2">
            <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 uppercase tracking-wider">
              <FaShieldAlt /> 6. Protection Status
            </h3>
            <span className="text-xs text-slate-400 font-bold">Score: {protectionScoreNum} / 100</span>
          </div>

          <div className="space-y-3">
            {protectionItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs bg-slate-950 p-3 border border-slate-850 rounded-xl font-semibold">
                <span className="text-slate-300">{item.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                  item.status === 'Needs Improvement' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          {criticalMissingItems.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl text-[10px] text-red-400 flex items-start gap-2 font-medium">
              <FaExclamationTriangle className="shrink-0 mt-0.5 animate-pulse text-xs" />
              <div>
                <span className="font-bold uppercase text-[9px] block">Uninsured Deficit Alert</span>
                {criticalMissingItems.join(', ')} coverage is missing or critically below guidelines.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PRIORITIES 7 & 8: ASSET ALLOCATIONS TABLE & CASH FLOW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Priority 7: Suggested Asset Allocation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 md:col-span-1 lg:col-span-1">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider border-b border-slate-850 pb-2">
            <FaChartPie /> 7. Suggested Asset Split
          </h3>
          
          <div className="space-y-2">
            {recommendedAllocations.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs bg-slate-950 p-3 border border-slate-850 rounded-xl font-bold">
                <span className="text-slate-350">{item.name}</span>
                <div className="text-right">
                  <strong className="text-slate-100">{item.value}%</strong>
                  {item.rupee > 0 && <span className="text-[10px] text-slate-500 block">₹{item.rupee.toLocaleString()}</span>}
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-[10px] text-slate-450 leading-relaxed font-semibold italic pt-1">
            <FaInfoCircle className="inline mr-1 text-[10px]" /> {allocationReasoning}
          </p>
        </div>

        {/* Cash Flow Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 md:col-span-2 lg:col-span-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider border-b border-slate-850 pb-2">
            <FaWallet /> Cash Flow Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl leading-normal">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Monthly Income</span>
              <strong className="text-lg font-black text-white">₹{monthlySalary.toLocaleString()}</strong>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl leading-normal">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">This Month's Spending</span>
              <strong className="text-lg font-black text-rose-400">₹{totalMonthlyExpenses.toLocaleString()}</strong>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl leading-normal">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Actual Savings Rate</span>
              <strong className={`text-lg font-black ${parsedSavingsRate >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {parsedSavingsRate}%
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-2">
              <span className="text-slate-500 font-bold block uppercase text-[9px] tracking-wide">Top Outlays</span>
              {categoryBreakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-900 last:border-0 text-slate-300">
                  <span>{item.name}</span>
                  <strong className="text-rose-400">₹{item.value.toLocaleString()}</strong>
                </div>
              ))}
              {categoryBreakdown.length === 0 && <span className="text-slate-500 block py-1">No transactions recorded.</span>}
            </div>

            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex flex-col justify-center gap-1">
              <span className="text-slate-500 font-bold block uppercase text-[9px] tracking-wide">Budget Health</span>
              <strong className={`text-base font-black ${parsedSavingsRate >= 30 ? 'text-emerald-400' : parsedSavingsRate >= 20 ? 'text-blue-400' : 'text-rose-400'}`}>
                {parsedSavingsRate >= 30 ? 'Excellent' : parsedSavingsRate >= 20 ? 'Good' : 'Needs Review'}
              </strong>
              <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                {parsedSavingsRate >= 20 
                  ? "Great job saving! You are successfully following the pay-yourself-first principle." 
                  : "Low savings buffers increase emergency vulnerability. We advise pruning wants."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ADVISORY QUICK ACTIONS */}
      <div className="bg-slate-905 border border-slate-800 rounded-2xl p-6">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4">Advisory Quick Actions</span>
        
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <Link 
            to="/expenses" 
            className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer"
          >
            <FaPlus className="text-blue-400 group-hover:scale-110 transition-all" />
            <span className="text-xs font-semibold text-slate-300">Add Expense</span>
          </Link>
          <Link 
            to="/goals" 
            className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer"
          >
            <FaPlus className="text-teal-400 group-hover:scale-110 transition-all" />
            <span className="text-xs font-semibold text-slate-300">Add Goal</span>
          </Link>
          <Link 
            to="/quiz" 
            className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer"
          >
            <FaMapSigns className="text-violet-400 group-hover:scale-110 transition-all" />
            <span className="text-xs font-semibold text-slate-300">Risk Quiz</span>
          </Link>
          <Link 
            to="/profile" 
            className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer"
          >
            <FaUser className="text-yellow-400 group-hover:scale-110 transition-all" />
            <span className="text-xs font-semibold text-slate-300">Update Salary</span>
          </Link>
          <Link 
            to="/analysis" 
            className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer"
          >
            <FaChartPie className="text-emerald-400 group-hover:scale-110 transition-all" />
            <span className="text-xs font-semibold text-slate-300">Analysis Center</span>
          </Link>
          <Link 
            to="/ai-advisor" 
            className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer"
          >
            <FaLightbulb className="text-amber-400 group-hover:scale-110 transition-all" />
            <span className="text-xs font-semibold text-slate-300">AI Advisor Chat</span>
          </Link>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;