import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { 
  FaUser, 
  FaWallet, 
  FaShieldAlt, 
  FaChartPie, 
  FaMapSigns, 
  FaClipboardList, 
  FaExclamationTriangle, 
  FaLightbulb, 
  FaHeartbeat, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaArrowRight, 
  FaUndo, 
  FaPrint, 
  FaInfoCircle, 
  FaCalculator, 
  FaFileAlt 
} from 'react-icons/fa';

const COLORS = ['#3b82f6', '#8b5cf6', '#fbbf24', '#10b981', '#f43f5e'];

// Risk assessment questions pool
const RISK_QUIZ_QUESTIONS = [
  {
    id: "rq1",
    question: "What is your previous investment experience?",
    options: [
      { text: "None: I prefer fixed deposits, post office, or savings accounts.", score: 1 },
      { text: "Some: I have invested in mutual funds, insurance plans, or blue-chip stocks.", score: 2 },
      { text: "Experienced: I actively trade individual stocks, derivatives, or cryptocurrencies.", score: 3 }
    ]
  },
  {
    id: "rq2",
    question: "If your mutual fund portfolio dropped by 20% due to a market crash, how would you react?",
    options: [
      { text: "Panic and withdraw my remaining funds immediately to prevent further losses.", score: 1 },
      { text: "Do nothing and patiently wait for the market to recover.", score: 2 },
      { text: "View it as a discount and buy more units to average down my cost.", score: 3 }
    ]
  },
  {
    id: "rq3",
    question: "How long do you plan to keep your assets invested before needing to withdraw them?",
    options: [
      { text: "Short-term: Less than 3 years (e.g., immediate goals or emergency cash).", score: 1 },
      { text: "Medium-term: 3 to 7 years (e.g., purchasing a home, vehicle, or wedding).", score: 2 },
      { text: "Long-term: More than 7 years (e.g., retirement, children's higher education).", score: 3 }
    ]
  },
  {
    id: "rq4",
    question: "What is your primary financial goal for your investments?",
    options: [
      { text: "Capital protection: I want to keep my principal absolutely safe, even if returns are low.", score: 1 },
      { text: "Balanced growth: I want steady inflation-beating returns with moderate volatility.", score: 2 },
      { text: "Wealth maximization: I want high returns over the long run and can handle big temporary losses.", score: 3 }
    ]
  },
  {
    id: "rq5",
    question: "Which portfolio profile appeals to you the most?",
    options: [
      { text: "Fixed income: 0% risk of capital loss, yielding 6-7% annual returns.", score: 1 },
      { text: "Balanced mix: 20% risk of minor fluctuations, targeting 10-12% returns.", score: 2 },
      { text: "High equity: 40% risk of major market drop, targeting 14-16% compounding returns.", score: 3 }
    ]
  }
];

function FinancialAnalysis() {
  const { user, API_URL, syncLocalUserProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, salary, risk, asset, roadmap, report
  const [expenses, setExpenses] = useState([]);
  const [goals, setGoals] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(user?.riskProfile || null);
  const [actualNeeds, setActualNeeds] = useState(50);
  const [actualWants, setActualWants] = useState(25);
  const [actualSavings, setActualSavings] = useState(20);
  const [actualSkill, setActualSkill] = useState(5);
  
  const [completedChecklist, setCompletedChecklist] = useState(() => {
    const saved = localStorage.getItem(`finbuddy_analysis_checklist_${user?.email || 'guest'}`);
    return saved ? JSON.parse(saved) : {};
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [expRes, goalRes, portRes] = await Promise.all([
        axios.get(`${API_URL}/finance/expenses`),
        axios.get(`${API_URL}/finance/goals`),
        axios.get(`${API_URL}/finance/portfolio`)
      ]);
      setExpenses(expRes.data);
      setGoals(goalRes.data);
      setPortfolio(portRes.data);
    } catch (err) {
      console.error('Error fetching analysis data:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save checklist state to localStorage
  const toggleChecklist = (item) => {
    const updated = {
      ...completedChecklist,
      [item]: !completedChecklist[item]
    };
    setCompletedChecklist(updated);
    localStorage.setItem(`finbuddy_analysis_checklist_${user?.email || 'guest'}`, JSON.stringify(updated));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-white min-h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // --- 1. AGE ANALYSIS ENGINE ---
  const age = user?.age || 22;
  const maritalStatus = user?.maritalStatus || 'Single';
  const dependentsCount = user?.dependents !== undefined ? user?.dependents : 0;

  let lifestage = 'Foundation Building';
  let stageImportance = 'Critical for developing micro-savings habits, building professional skills, and launching compounding early.';
  let stagePriorities = ['Build 3-month emergency fund', 'Secure separate health insurance cover', 'Launch first mutual fund SIP', 'Invest in skill development'];
  let stageMistakes = ['Lifestyle overspending on credit cards', 'Ignoring compounding benefits of early SIPs', 'Relying solely on employee health insurance'];

  if (age >= 26 && age <= 35) {
    lifestage = 'Wealth Building';
    stageImportance = 'Prime compounding decade. Focused on accelerating career growth, mapping life milestones, and tax planning.';
    stagePriorities = ['Establish term life insurance cover', 'Increase equity SIP step-up by 10% annually', 'Establish goals for marriage/home downpayment', 'Maintain savings rate above 20%'];
    stageMistakes = ['Lifestyle inflation matching salary hikes', 'Keeping too much idle cash in savings accounts', 'Inadequate health covers for parents'];
  } else if (age >= 36 && age <= 50) {
    lifestage = 'Asset Accumulation';
    stageImportance = 'Managing children education, home loan liabilities, and building long-term retirement capital reserves.';
    stagePriorities = ['Fund children higher education target SIPs', 'Prepay high-interest debts aggressively', 'Diversify across equity, bonds, and gold', 'Map estate transmission / nominee registrations'];
    stageMistakes = ['Neglecting retirement goals for child costs', 'Over-leveraging on physical real estate properties', 'Asset allocation mismatch against volatility'];
  } else if (age > 50) {
    lifestage = 'Wealth Protection';
    stageImportance = 'Nearing retirement. Focus shifts to preserving capital, generating steady monthly income, and inheritance mapping.';
    stagePriorities = ['Transfer volatile equities to debt/fixed deposits', 'Verify comprehensive post-retirement health covers', 'Setup systematic withdrawal plans (SWP)', 'Complete legal wills and asset transmission maps'];
    stageMistakes = ['Taking high risks in speculative assets to chase yield', 'Underestimating retirement healthcare inflation', 'No clear inheritance wills mapped'];
  }

  // --- 2. SALARY ANALYSIS ENGINE ---
  const monthlySalary = user?.monthlyIncome || 25000;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const actualSavingsRate = monthlySalary > 0 ? ((monthlySalary - totalExpenses) / monthlySalary) * 100 : 0;
  const calculatedSavings = Math.max(0, monthlySalary - totalExpenses);

  const recommendedNeeds = Math.round(monthlySalary * 0.5);
  const recommendedWants = Math.round(monthlySalary * 0.2);
  const recommendedSavings = Math.round(monthlySalary * 0.2);
  const recommendedSkill = Math.round(monthlySalary * 0.1);

  // Compute actual allocations from expense categories if possible
  const needsCategories = ['Rent', 'Utilities', 'Bills', 'Groceries', 'Healthcare', 'Insurance', 'EMI', 'Loan'];
  const wantsCategories = ['Entertainment', 'Shopping', 'Dining', 'Travel', 'Hobbies'];
  const skillCategories = ['Education', 'Books', 'Courses', 'Self-growth'];

  let actualNeedsAmt = 0;
  let actualWantsAmt = 0;
  let actualSkillAmt = 0;

  expenses.forEach(e => {
    if (needsCategories.some(cat => e.category.toLowerCase().includes(cat.toLowerCase()))) {
      actualNeedsAmt += e.amount;
    } else if (wantsCategories.some(cat => e.category.toLowerCase().includes(cat.toLowerCase()))) {
      actualWantsAmt += e.amount;
    } else if (skillCategories.some(cat => e.category.toLowerCase().includes(cat.toLowerCase()))) {
      actualSkillAmt += e.amount;
    } else {
      actualNeedsAmt += e.amount; // default fallback
    }
  });

  const actualSavingsAmt = Math.max(0, monthlySalary - (actualNeedsAmt + actualWantsAmt + actualSkillAmt));

  // Determine actual percentages
  const pctNeeds = monthlySalary > 0 ? Math.round((actualNeedsAmt / monthlySalary) * 100) : 50;
  const pctWants = monthlySalary > 0 ? Math.round((actualWantsAmt / monthlySalary) * 100) : 25;
  const pctSkill = monthlySalary > 0 ? Math.round((actualSkillAmt / monthlySalary) * 100) : 5;
  const pctSavings = monthlySalary > 0 ? Math.round((actualSavingsAmt / monthlySalary) * 100) : 20;

  // --- 3. RISK ASSESSMENT QUIZ ENGINE ---
  const handleSelectQuizOption = (qId, score) => {
    setQuizAnswers(prev => ({ ...prev, [qId]: score }));
  };

  const submitQuiz = () => {
    const totalScore = Object.values(quizAnswers).reduce((a, b) => a + b, 0);
    let category = 'Moderate';
    let explanation = 'You prefer a balanced mix of steady returns and moderate volatility. You are comfortable with medium stock exposure alongside bonds.';
    
    if (totalScore <= 7) {
      category = 'Conservative';
      explanation = 'Your main focus is capital preservation and fixed returns. You prefer avoiding stock market drops and holding cash or high-quality debt.';
    } else if (totalScore >= 13) {
      category = 'Aggressive';
      explanation = 'You seek high capital compounding over the long run and can handle severe market drops. You prefer large allocations in equity and mutual funds.';
    }

    const rec = {
      Conservative: { Stocks: 25, Bonds: 45, Gold: 15, Cash: 15 },
      Moderate: { Stocks: 60, Bonds: 20, Gold: 10, Cash: 10 },
      Aggressive: { Stocks: 80, Bonds: 10, Gold: 5, Cash: 5 }
    }[category];

    const resultObj = { score: totalScore, category, explanation, recommendation: rec };
    setQuizResult(resultObj);
    syncLocalUserProfile({ riskProfile: resultObj });
  };

  // --- 4. SMART ASSET ALLOCATION ENGINE ---
  const riskCategory = quizResult?.category || user?.riskProfile?.category || 'Moderate';
  let recommendedStocksPct = 60;
  let recommendedBondsPct = 20;
  let recommendedGoldPct = 10;
  let recommendedCashPct = 10;

  if (riskCategory === 'Conservative') {
    recommendedStocksPct = 25;
    recommendedBondsPct = 45;
    recommendedGoldPct = 15;
    recommendedCashPct = 15;
  } else if (riskCategory === 'Aggressive') {
    recommendedStocksPct = 80;
    recommendedBondsPct = 10;
    recommendedGoldPct = 5;
    recommendedCashPct = 5;
  }

  // Adjust for age: "110 - age" is a standard equity allocation
  const baseEquity = 110 - age;
  if (riskCategory === 'Moderate') {
    recommendedStocksPct = Math.max(30, Math.min(70, baseEquity));
    recommendedCashPct = 10;
    recommendedGoldPct = 10;
    recommendedBondsPct = 100 - (recommendedStocksPct + recommendedGoldPct + recommendedCashPct);
  }

  const stocksHolding = portfolio.find(p => p.assetType === 'Stocks')?.amount || 0;
  const bondsHolding = portfolio.find(p => p.assetType === 'Bonds')?.amount || 0;
  const goldHolding = portfolio.find(p => p.assetType === 'Gold')?.amount || 0;
  const cashHolding = portfolio.find(p => p.assetType === 'Cash')?.amount || user?.netWorth || 0;

  const totalAssets = stocksHolding + bondsHolding + goldHolding + cashHolding;
  
  const actualStocksPct = totalAssets > 0 ? Math.round((stocksHolding / totalAssets) * 100) : 0;
  const actualBondsPct = totalAssets > 0 ? Math.round((bondsHolding / totalAssets) * 100) : 0;
  const actualGoldPct = totalAssets > 0 ? Math.round((goldHolding / totalAssets) * 100) : 0;
  const actualCashPct = totalAssets > 0 ? Math.round((cashHolding / totalAssets) * 100) : 100;

  const smartAllocationData = [
    { name: 'Equity (Stocks/MFs)', recommended: recommendedStocksPct, actual: actualStocksPct, gap: actualStocksPct - recommendedStocksPct },
    { name: 'Debt (Bonds/FDs)', recommended: recommendedBondsPct, actual: actualBondsPct, gap: actualBondsPct - recommendedBondsPct },
    { name: 'Gold / Hedging', recommended: recommendedGoldPct, actual: actualGoldPct, gap: actualGoldPct - recommendedGoldPct },
    { name: 'Liquid Cash / FDs', recommended: recommendedCashPct, actual: actualCashPct, gap: actualCashPct - recommendedCashPct }
  ];

  const pieDataRecommended = [
    { name: 'Equity', value: recommendedStocksPct },
    { name: 'Debt', value: recommendedBondsPct },
    { name: 'Gold', value: recommendedGoldPct },
    { name: 'Cash', value: recommendedCashPct }
  ];

  const pieDataActual = [
    { name: 'Equity', value: actualStocksPct },
    { name: 'Debt', value: actualBondsPct },
    { name: 'Gold', value: actualGoldPct },
    { name: 'Cash', value: actualCashPct }
  ];

  // --- 5. PERSONAL FINANCIAL ROADMAP ENGINE ---
  const minEF = Math.round(totalExpenses * 3) || Math.round(monthlySalary * 1.5);
  const currentSavings = cashHolding;
  const currentInvestments = stocksHolding + bondsHolding + goldHolding;

  const roadmapMilestones = [
    { id: "m1", month: "Month 1", title: "Create Envelope Budget", desc: "Separate fixed needs from discretionary wants.", status: expenses.length > 0 },
    { id: "m2", month: "Month 2", title: "Build Emergency Fund", desc: `Set aside ₹${minEF.toLocaleString()} safety shield.`, status: currentSavings >= minEF },
    { id: "m3", month: "Month 3", title: "Secure Health Insurance", desc: "Acquire floater medical cover.", status: user?.currentHealthIns > 0 },
    { id: "m4", month: "Month 4", title: "Launch Systematic SIP", desc: "Automate equity mutual fund purchases.", status: currentInvestments > 0 },
    { id: "m5", month: "Month 6", title: "Reach ₹25k Savings", desc: "Build liquid financial cushion.", status: currentSavings >= 25000 },
    { id: "m6", month: "Year 1", title: "Accumulate ₹1 Lakh Net Worth", desc: "Achieve aggregate asset net worth.", status: (currentSavings + currentInvestments - (user?.loans || 0)) >= 100000 },
    { id: "m7", month: "Year 3", title: "Accumulate ₹5 Lakh Investments", desc: "Build compounding investment pool.", status: currentInvestments >= 500000 }
  ];

  const completedMilestonesCount = roadmapMilestones.filter(m => m.status).length;
  const roadmapProgress = Math.round((completedMilestonesCount / roadmapMilestones.length) * 100);

  // --- 6. FINANCIAL CHECKLIST ENGINE ---
  const dynamicChecklist = {
    'Foundation Building': [
      { id: "cb1", text: "Create Emergency Cash Pot" },
      { id: "cb2", text: "Get Individual Health Insurance" },
      { id: "cb3", text: "Launch First Compounding SIP" },
      { id: "cb4", text: "Set aside Skill Development Budget" },
      { id: "cb5", text: "Draft a Career Growth Timeline" },
      { id: "cb6", text: "Clear all Credit Card Debt" },
      { id: "cb7", text: "Read 2 Basic Personal Finance Books" },
      { id: "cb8", text: "Set up Goal-targeted Savings" }
    ],
    'Wealth Building': [
      { id: "cb9", text: "Establish Pure Term Life Insurance" },
      { id: "cb10", text: "Get Family Health Insurance cover" },
      { id: "cb11", text: "Setup Child Education SIPs" },
      { id: "cb12", text: "Audit Retirement Target Corpus" },
      { id: "cb13", text: "Diversify across Mutual Funds & Gold" },
      { id: "cb14", text: "Maximize Annual Tax Savings (80C)" },
      { id: "cb15", text: "Increase SIP amount by 10% annually" },
      { id: "cb16", text: "Maintain Emergency Fund for 6 months" }
    ],
    'Asset Accumulation': [
      { id: "cb17", text: "Fund Core Retirement Accounts" },
      { id: "cb18", text: "Establish Child Higher Education Fund" },
      { id: "cb19", text: "Paydown Home Loan Liabilities" },
      { id: "cb20", text: "Rebalance Portfolio Asset Allocation" },
      { id: "cb21", text: "Draft Legal Wills & Nominees" },
      { id: "cb22", text: "Set up Parents Medical Float Cover" },
      { id: "cb23", text: "Maintain emergency cash in liquid funds" }
    ],
    'Wealth Protection': [
      { id: "cb24", text: "Prepay all Outstanding Debts" },
      { id: "cb25", text: "Move Assets to Fixed Income/Bonds" },
      { id: "cb26", text: "Review Post-Retirement Health Covers" },
      { id: "cb27", text: "Map Systematic Withdrawal Plans (SWP)" },
      { id: "cb28", text: "Complete Nominee Registration Audits" },
      { id: "cb29", text: "Setup Legacy Estate Plan / Will" }
    ]
  }[lifestage];

  // --- 7. FINANCIAL PRIORITY ENGINE ---
  const dynamicPriorities = [
    { title: "Emergency Fund Shield", desc: "Build a liquid reserve worth 3-6 months of essential household expenses.", target: `₹${minEF.toLocaleString()}` },
    { title: "Health Floater Protection", desc: "Get comprehensive health cover to avoid liquidating investments during hospitalizations.", target: `₹5,00,000` },
    { title: "Pure Term Life Cover", desc: "Replace your income for dependent security if you have active liabilities or family.", target: `₹${(monthlySalary * 240).toLocaleString()}` },
    { title: "Compounding Systematic SIPs", desc: "Automate index and large cap equity SIPs to grow salary against inflation.", target: "₹2,000 / month" },
    { title: "Retirement Corpus Mapping", desc: "Build long-term compounding pools in tax-efficient structures like NPS or PPF.", target: "20x Annual Income" }
  ];

  // --- 8. FINANCE HEALTH SCORE ENGINE ---
  // EF Score (20 points): Max if savings >= minEF
  const efScore = currentSavings >= minEF ? 20 : Math.round((currentSavings / (minEF || 1)) * 20);
  
  // Insurance Score (20 points): 10 health, 10 term
  const healthPoints = user?.currentHealthIns > 0 ? 10 : 0;
  const recTermIns = monthlySalary * 12 * 10;
  const termPoints = recTermIns === 0 ? 10 : (user?.currentTermIns >= recTermIns ? 10 : (user?.currentTermIns > 0 ? 5 : 0));
  const insScore = healthPoints + termPoints;

  // Savings Rate Score (15 points): 15 if rate >= 30, 10 if >= 20, 5 if >= 10
  const savingsRateScore = actualSavingsRate >= 30 ? 15 : (actualSavingsRate >= 20 ? 10 : (actualSavingsRate >= 10 ? 5 : 0));

  // Investment Discipline Score (15 points): 15 if has investments
  const investScore = currentInvestments > 0 ? 15 : 0;

  // Debt Score (15 points): 15 if debt-free, 10 if debt < annualSalary * 0.5, else 5
  const activeDebt = user?.loans || 0;
  const debtScore = activeDebt === 0 ? 15 : (activeDebt < monthlySalary * 6 ? 10 : 5);

  // Goal Progress (15 points): based on average progress
  const goalProgressScore = goals.length > 0 
    ? Math.round((goals.reduce((sum, g) => sum + Math.min(1, g.currentAmount / g.targetAmount), 0) / goals.length) * 15)
    : 5;

  const healthScore = Math.min(100, efScore + insScore + savingsRateScore + investScore + debtScore + goalProgressScore);

  let ratingLabel = 'Poor';
  let ratingColor = 'text-rose-500 border-rose-500/20 bg-rose-500/5';
  if (healthScore >= 81) {
    ratingLabel = 'Excellent';
    ratingColor = 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
  } else if (healthScore >= 61) {
    ratingLabel = 'Good';
    ratingColor = 'text-blue-400 border-blue-500/20 bg-blue-500/5';
  } else if (healthScore >= 41) {
    ratingLabel = 'Average';
    ratingColor = 'text-amber-400 border-amber-500/20 bg-amber-500/5';
  }

  // Identify Strengths & Weaknesses
  const strengths = [];
  const weaknesses = [];
  const missingAreas = [];

  if (efScore >= 15) strengths.push("Strong emergency cash buffer secured.");
  else {
    weaknesses.push("Low emergency fund leaves you exposed to immediate job or income shocks.");
    missingAreas.push("Emergency Reserve");
  }

  if (insScore >= 15) strengths.push("Comprehensive insurance mapping active.");
  else {
    weaknesses.push("Inadequate insurance protection risk.");
    if (healthPoints === 0) missingAreas.push("Health Insurance Cover");
    if (termPoints === 0) missingAreas.push("Term Life Protection");
  }

  if (savingsRateScore >= 10) strengths.push(`Healthy monthly savings rate (${Math.round(actualSavingsRate)}%).`);
  else weaknesses.push("Low savings rate. Limit luxury wants to save at least 20% of net salary.");

  if (investScore > 0) strengths.push("Active investment systematic compounders mapped.");
  else {
    weaknesses.push("No compounding assets. Missing out on equity compounding curves.");
    missingAreas.push("Active Investment SIP");
  }

  if (debtScore >= 15) strengths.push("Debt-free balance sheet supports cash flow.");
  else weaknesses.push("Active loan liabilities increase monthly cash outflows.");

  // --- 10. FIINBUDDY ADVISOR COACH INSIGHTS ---
  const advisorCoachInsights = [];
  if (currentSavings < minEF) {
    advisorCoachInsights.push({
      type: "alarm",
      text: `Critical Alert: You do not have an emergency fund. Set aside ₹${minEF.toLocaleString()} in liquid cash before starting aggressive stock trading.`
    });
  }
  if (user?.currentHealthIns === 0) {
    advisorCoachInsights.push({
      type: "warning",
      text: "Warning: Missing medical cover. A single hospital bill can wipe out years of systematic mutual fund investments."
    });
  }
  if (actualSavingsRate < 20) {
    advisorCoachInsights.push({
      type: "suggest",
      text: "Guidance: Your monthly savings rate is below the recommended 20%. Consider auditing subscription leaks."
    });
  }
  if (riskCategory === 'Aggressive' && actualStocksPct < 50) {
    advisorCoachInsights.push({
      type: "suggest",
      text: "Optimization: Your risk profile is Aggressive, but your actual equity exposure is low. Step up stock SIPs."
    });
  }
  if (advisorCoachInsights.length === 0) {
    advisorCoachInsights.push({
      type: "suggest",
      text: "Strategic: Your basic safety buffers are intact. Focus on step-up compounding and tax savings optimization."
    });
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8 font-sans print:bg-white print:text-black">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-5 print:hidden">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
            <FaChartPie />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Financial Analysis Workspace
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Personal Wealth Intelligence Engine: dynamic checks, allocations, and strategic advisory.
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <FaPrint /> Print Intelligence Report
        </button>
      </div>

      {/* Dynamic Security Verification Label */}
      <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[10px] text-emerald-400 font-bold w-fit print:hidden">
        <FaShieldAlt className="text-[9px]" /> 256-Bit Local Execution Verified | Zero Transaction Risk
      </div>

      {/* Tabbed Navigation */}
      <div className="flex border-b border-slate-900 gap-2 pb-1 print:hidden">
        {[
          { id: 'dashboard', name: 'Advisor Panel', icon: <FaLightbulb /> },
          { id: 'salary', name: 'Salary Allocator', icon: <FaWallet /> },
          { id: 'risk', name: 'Risk Assessment', icon: <FaShieldAlt /> },
          { id: 'asset', name: 'Asset Allocations', icon: <FaChartPie /> },
          { id: 'roadmap', name: 'Roadmap & checklist', icon: <FaMapSigns /> },
          { id: 'report', name: 'financial report', icon: <FaFileAlt /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-bold uppercase transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id 
                ? 'border-blue-500 text-blue-400 font-black' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="mt-6">
        
        {/* TAB 1: ADVISOR PANEL */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 print:block">
            {/* Lifestage & Wealth coach bubble */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Lifestage card */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-950/40 border border-blue-900/30 px-2.5 py-1 rounded-full w-fit block">
                  {lifestage} Stage
                </span>
                <h3 className="text-xl font-bold text-slate-100">Age Stage Analysis (Age {age})</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{stageImportance}</p>
                <div className="pt-3 border-t border-slate-850 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Mistakes to Avoid:</span>
                  <ul className="text-xs text-slate-350 space-y-1.5 list-disc pl-4 font-medium">
                    {stageMistakes.map((m, idx) => <li key={idx} className="text-rose-300"><span className="text-slate-300">{m}</span></li>)}
                  </ul>
                </div>
              </div>

              {/* Coach Advisory Bubble */}
              <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-yellow-500/5 blur-2xl"></div>
                <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-1.5">
                  <FaLightbulb /> Personal Financial Advisor Insights
                </h3>
                
                <div className="space-y-3 pt-1">
                  {advisorCoachInsights.map((insight, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3.5 rounded-xl border text-xs leading-normal flex items-start gap-2.5 font-medium ${
                        insight.type === 'alarm' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        insight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}
                    >
                      <span className="text-sm shrink-0">
                        {insight.type === 'alarm' ? '🚨' : insight.type === 'warning' ? '⚠️' : '💡'}
                      </span>
                      <span>{insight.text}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-850 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Risk Assessment</span>
                    <strong className="text-slate-300 uppercase">{riskCategory} Tolerance</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Active Dependents</span>
                    <strong className="text-slate-350">{dependentsCount} Member(s)</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Marital Status</span>
                    <strong className="text-slate-350">{maritalStatus}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Score Circular & Priorities list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Circular Health widget */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md text-center flex flex-col items-center justify-center gap-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Finance Health Score</span>
                <div className="h-32 w-32 rounded-full border-4 border-slate-800 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
                  <span className="text-4xl font-black text-white">{healthScore}</span>
                  <span className="text-[10px] text-slate-500 tracking-wider font-bold">/ 100</span>
                </div>
                <div className={`text-base font-extrabold px-3 py-1 rounded-full border ${ratingColor}`}>
                  <FaHeartbeat className="inline mr-1 text-xs shrink-0" /> {ratingLabel}
                </div>
              </div>

              {/* Priority list */}
              <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <FaMapSigns /> Financial Priorities Checklist
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Ranked safety actions based on your age, salary, and active dependency risks.
                </p>
                <div className="space-y-3">
                  {dynamicPriorities.slice(0, 3).map((pri, idx) => (
                    <div key={idx} className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl flex justify-between items-center gap-4 text-xs font-semibold">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase block font-bold">Priority {idx + 1}</span>
                        <h4 className="text-slate-200">{pri.title}</h4>
                        <p className="text-[10px] text-slate-400 font-light leading-normal">{pri.desc}</p>
                      </div>
                      <div className="text-right whitespace-nowrap shrink-0">
                        <span className="text-[9px] text-slate-500 block uppercase">Target Value</span>
                        <strong className="text-slate-350">{pri.target}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SALARY ALLOCATOR */}
        {activeTab === 'salary' && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-md space-y-8">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FaWallet className="text-blue-500 text-sm" /> Salary allocation slider & Gap Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Audit your recommended allocation (Needs 50%, Wants 20%, Savings 20%, Skill Development 10%) vs actual spending.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Sliders for Actual Budgets */}
              <div className="space-y-6 bg-slate-950/40 p-6 rounded-2xl border border-slate-850">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Configure Actual Allocations</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Adjust sliders to represent your current monthly cash outflow splits. Sum: {actualNeeds + actualWants + actualSavings + actualSkill}%
                </p>

                {/* Slider 1: Needs */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Needs (Fixed bills, rent, groceries)</span>
                    <span className="text-slate-200">{actualNeeds}% (₹{Math.round(monthlySalary * actualNeeds / 100).toLocaleString()})</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={actualNeeds}
                    onChange={(e) => setActualNeeds(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Slider 2: Wants */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Wants (Entertainment, dining, travel)</span>
                    <span className="text-slate-200">{actualWants}% (₹{Math.round(monthlySalary * actualWants / 100).toLocaleString()})</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={actualWants}
                    onChange={(e) => setActualWants(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                </div>

                {/* Slider 3: Savings */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Savings & Investments (SIPs, FDs)</span>
                    <span className="text-slate-200">{actualSavings}% (₹{Math.round(monthlySalary * actualSavings / 100).toLocaleString()})</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={actualSavings}
                    onChange={(e) => setActualSavings(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Slider 4: Skill */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Skill Development (Courses, books)</span>
                    <span className="text-slate-200">{actualSkill}% (₹{Math.round(monthlySalary * actualSkill / 100).toLocaleString()})</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={actualSkill}
                    onChange={(e) => setActualSkill(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                </div>
              </div>

              {/* Gap Analysis */}
              <div className="space-y-6">
                <h4 className="text-sm font-bold text-slate-350 uppercase tracking-wider">Allocation Comparison & Gaps</h4>
                
                <div className="space-y-3.5">
                  {[
                    { name: 'Needs (Fixed)', rec: 50, act: actualNeeds, color: 'text-blue-400' },
                    { name: 'Wants (Discretionary)', rec: 20, act: actualWants, color: 'text-violet-400' },
                    { name: 'Savings (Wealth)', rec: 20, act: actualSavings, color: 'text-emerald-400' },
                    { name: 'Skill Dev', rec: 10, act: actualSkill, color: 'text-yellow-400' }
                  ].map(item => {
                    const diff = item.act - item.rec;
                    return (
                      <div key={item.name} className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-2 text-xs font-semibold">
                        <div className="flex justify-between items-center">
                          <span className={item.color}>{item.name}</span>
                          <span className="text-slate-400">Recommended: {item.rec}%</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] pt-1">
                          <span>Actual: {item.act}%</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                            diff === 0 ? 'bg-slate-900 text-slate-400' :
                            diff < 0 ? 'bg-rose-500/10 text-rose-400' :
                            'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {diff === 0 ? 'Balanced' : `${diff > 0 ? '+' : ''}${diff}% Gap`}
                          </span>
                        </div>
                        {diff < 0 && item.name.includes('Savings') && (
                          <p className="text-[10px] text-rose-300 font-light pt-1 leading-normal">
                            🚨 Warning: Saving rate is below recommended 20%. Trim discretionary wants.
                          </p>
                        )}
                        {diff > 0 && item.name.includes('Wants') && (
                          <p className="text-[10px] text-amber-300 font-light pt-1 leading-normal">
                            ⚠️ Warning: Discretionary spending exceeds recommended limit. Prune leaks.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RISK ASSESSMENT */}
        {activeTab === 'risk' && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-md space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FaShieldAlt className="text-blue-500 text-sm" /> Risk Capability Profiler
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Take the advisor quiz to establish your volatility appetite and map target asset allocations.
              </p>
            </div>

            {/* Quiz result details if completed */}
            {quizResult ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Result Card */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-5">
                  <FaHeartbeat className="text-5xl text-blue-400 animate-pulse" />
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold block">Risk Category</span>
                    <h2 className="text-2xl font-black text-white mt-1 uppercase tracking-tight">{quizResult.category}</h2>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-light bg-slate-950 p-4 border border-slate-850/60 rounded-xl">
                    {quizResult.explanation}
                  </p>
                  <button
                    onClick={() => setQuizResult(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-xs font-bold text-slate-350 border border-slate-800 rounded-xl cursor-pointer w-full flex items-center justify-center gap-1"
                  >
                    <FaUndo /> Retake Risk Quiz
                  </button>
                </div>

                {/* Suggested Asset Weights */}
                <div className="lg:col-span-2 bg-slate-950 border border-slate-850 rounded-2xl p-6 space-y-4">
                  <h4 className="text-sm font-bold text-slate-350 uppercase tracking-wider flex items-center gap-2">
                    <FaChartPie className="text-teal-400" /> Target Asset Allocation Model
                  </h4>
                  
                  <div className="space-y-3">
                    {Object.entries(quizResult.recommendation || {}).map(([asset, pct], idx) => (
                      <div key={asset} className="flex justify-between items-center bg-slate-950/80 p-3.5 rounded-xl border border-slate-850">
                        <div className="flex items-center gap-2 font-bold">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                          <span className="text-xs text-slate-350">{asset} Allocation</span>
                        </div>
                        <span className="text-sm font-extrabold text-white font-mono">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              /* Quiz active screen */
              <div className="max-w-2xl mx-auto bg-slate-950 border border-slate-850 rounded-2xl p-8 space-y-6">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Investment Risk Assessment</span>
                
                <div className="space-y-6">
                  {RISK_QUIZ_QUESTIONS.map((q, qIdx) => (
                    <div key={q.id} className="space-y-3.5 border-b border-slate-850 pb-5 last:border-0 last:pb-0">
                      <h4 className="text-sm font-bold text-slate-200 leading-snug">
                        {qIdx + 1}. {q.question}
                      </h4>
                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const isSelected = quizAnswers[q.id] === opt.score;
                          return (
                            <button
                              key={opt.score}
                              onClick={() => handleSelectQuizOption(q.id, opt.score)}
                              className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs font-semibold leading-relaxed flex items-center justify-between cursor-pointer ${
                                isSelected 
                                  ? 'bg-blue-600/10 border-blue-500 text-white' 
                                  : 'bg-slate-900 border-slate-855 text-slate-450 hover:border-slate-700 hover:text-slate-300'
                              }`}
                            >
                              <span>{opt.text}</span>
                              <span className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                                isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-800'
                              }`}>
                                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white"></span>}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={submitQuiz}
                  disabled={Object.keys(quizAnswers).length < RISK_QUIZ_QUESTIONS.length}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-xs font-bold text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  Analyze Risk Category & Target Weights <FaArrowRight />
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ASSET ALLOCATIONS */}
        {activeTab === 'asset' && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-md space-y-8">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FaChartPie className="text-emerald-400 text-sm" /> Smart Asset Allocation Gap Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Compare your actual holdings vs target splits (Stocks: {recommendedStocksPct}%, Debt: {recommendedBondsPct}%, Gold: {recommendedGoldPct}%, Cash: {recommendedCashPct}%).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              
              {/* Allocation table */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Gap Auditor</h4>
                <div className="space-y-3">
                  {smartAllocationData.map((item, idx) => (
                    <div key={item.name} className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-2 text-xs font-semibold">
                      <div className="flex justify-between items-center text-slate-200">
                        <span>{item.name}</span>
                        <strong className="text-slate-100">Recommended: {item.recommended}%</strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px] pt-1">
                        <span className="text-slate-500">Actual: {item.actual}%</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                          item.gap === 0 ? 'bg-slate-900 text-slate-400' :
                          Math.abs(item.gap) < 5 ? 'bg-emerald-500/10 text-emerald-400' :
                          item.gap < 0 ? 'bg-rose-500/10 text-rose-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {item.gap === 0 ? 'Balanced' : item.gap < 0 ? `Under by ${Math.abs(item.gap)}%` : `Over by ${item.gap}%`}
                        </span>
                      </div>
                      <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden mt-1 flex">
                        <div className="bg-blue-600 h-full" style={{ width: `${item.actual}%` }}></div>
                        <div className="bg-slate-800 h-full" style={{ width: `${Math.max(0, 100 - item.actual)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart Comparison */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Asset Split Model</span>
                
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieDataRecommended}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={55}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieDataRecommended.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }}
                        formatter={(val) => [`${val}%`, 'Target']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[9px] text-slate-400">
                  {pieDataRecommended.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-1 font-semibold">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span>{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: ROADMAP & CHECKLIST */}
        {activeTab === 'roadmap' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Roadmap Timeline */}
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
              <div>
                <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                  <FaMapSigns /> Automatic Financial Roadmap Timeline
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">
                  Milestones automatically mapped from Month 1 to Year 3. Track progress as your assets grow.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-400">Roadmap Progress</span>
                  <span className="text-teal-400 font-bold">{roadmapProgress}% Completed</span>
                </div>
                <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-teal-500 to-blue-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${roadmapProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {roadmapMilestones.map((mil, idx) => (
                  <div key={mil.id} className="relative pl-6 border-l border-slate-800 last:border-0 pb-4 last:pb-0">
                    <div className={`absolute left-[-5.5px] top-1.5 h-3 w-3 rounded-full border ${
                      mil.status ? 'bg-teal-500 border-teal-500' : 'bg-slate-950 border-slate-800'
                    }`} />
                    <div className="flex justify-between items-start text-xs font-semibold">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase block font-bold">{mil.month}</span>
                        <h4 className="text-slate-200">{mil.title}</h4>
                        <p className="text-[10px] text-slate-400 font-light leading-normal">{mil.desc}</p>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap ${
                        mil.status ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-slate-950 text-slate-550 border border-slate-850'
                      }`}>
                        {mil.status ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Checklist */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <div>
                <h3 className="text-sm font-bold text-violet-400 flex items-center gap-2">
                  <FaClipboardList /> {lifestage} Milestone Checklist
                </h3>
                <p className="text-[10px] text-slate-400 leading-normal mt-1">
                  Adjusts dynamically based on your age stage. Toggle checkmarks as you achieve milestones.
                </p>
              </div>

              <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                {dynamicChecklist.map((item) => {
                  const isChecked = completedChecklist[item.id] || false;
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleChecklist(item.id)}
                      className={`w-full text-left p-3.5 border rounded-xl flex items-start gap-3 transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-slate-950/20 border-slate-850/50 text-slate-500 line-through' 
                          : 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-base mt-0.5 text-teal-400 shrink-0">
                        {isChecked ? <FaCheckCircle /> : <FaTimesCircle className="text-slate-650" />}
                      </span>
                      <span className="text-xs font-semibold leading-snug">{item.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: FINANCIAL REPORT CARD */}
        {activeTab === 'report' && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-md space-y-8 print:p-0 print:border-0 print:bg-white print:text-black">
            
            {/* Header report card */}
            <div className="border-b border-slate-800 pb-6 text-center lg:text-left flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 print:border-black">
              <div>
                <h3 className="text-2xl font-black text-white print:text-black">Personal Financial Diagnostics Report</h3>
                <p className="text-xs text-slate-400 mt-1 print:text-slate-700">Client: {user?.name || 'User'} | Generated: {new Date().toLocaleDateString()}</p>
              </div>
              <div className="flex gap-4 justify-center print:hidden">
                <span className={`px-4 py-1.5 rounded-full border text-xs font-bold ${ratingColor}`}>
                  Health: {healthScore} / 100 ({ratingLabel})
                </span>
                <span className="px-4 py-1.5 rounded-full border border-slate-800 bg-slate-950 text-xs font-bold text-slate-350">
                  Risk Category: {riskCategory}
                </span>
              </div>
            </div>

            {/* Metrics Checklist layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              
              {/* Box 1: Age stage */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl print:border-black print:bg-white print:text-black">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">1. Age stage analysis</span>
                <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black">{lifestage} Stage</strong>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal print:text-slate-700">{stageImportance}</p>
              </div>

              {/* Box 2: Health score */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl print:border-black print:bg-white print:text-black">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">2. Finance Health Score</span>
                <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black">{healthScore} / 100</strong>
                <span className="text-[10px] text-emerald-400 block mt-1 font-semibold">{ratingLabel} Status</span>
              </div>

              {/* Box 3: Risk profile */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl print:border-black print:bg-white print:text-black">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">3. Risk profile Quiz</span>
                <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black uppercase">{riskCategory}</strong>
                <p className="text-[10px] text-slate-450 mt-1 leading-normal print:text-slate-700">{quizResult?.explanation || 'Moderate risk profile'}</p>
              </div>

              {/* Box 4: Savings Analysis */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl print:border-black print:bg-white print:text-black">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">4. Savings analysis</span>
                <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black">Rate: {Math.round(actualSavingsRate)}%</strong>
                <span className="text-[10px] text-slate-450 block mt-1 print:text-slate-700">Monthly Surplus: ₹{calculatedSavings.toLocaleString()}</span>
              </div>

              {/* Box 5: Investment analysis */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl print:border-black print:bg-white print:text-black">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">5. Investment analysis</span>
                <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black">₹{currentInvestments.toLocaleString()}</strong>
                <span className="text-[10px] text-slate-450 block mt-1 print:text-slate-700">SIP Status: {currentInvestments > 0 ? 'Active systematic compounding' : 'No investments logged'}</span>
              </div>

              {/* Box 6: Insurance analysis */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl print:border-black print:bg-white print:text-black">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">6. Insurance analysis</span>
                <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black">Score: {insScore}/20</strong>
                <span className="text-[10px] text-slate-450 block mt-1 print:text-slate-700">Medical Cover: {user?.currentHealthIns > 0 ? `₹${(user.currentHealthIns).toLocaleString()}` : 'Missing'}</span>
              </div>

              {/* Box 7: Checklist completion */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl print:border-black print:bg-white print:text-black">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">7. Checklist completion</span>
                <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black">
                  {Object.values(completedChecklist).filter(Boolean).length} / {dynamicChecklist.length} Milestones
                </strong>
                <span className="text-[10px] text-slate-450 block mt-1 print:text-slate-700">Life stage checklist target achieved.</span>
              </div>

              {/* Box 8: Asset Allocation analysis */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl print:border-black print:bg-white print:text-black">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">8. Asset allocation audit</span>
                <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black">Equity: {actualStocksPct}%</strong>
                <span className="text-[10px] text-slate-450 block mt-1 print:text-slate-700">Recommended Stock exposure: {recommendedStocksPct}%</span>
              </div>

              {/* Box 9: Roadmap progress */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl print:border-black print:bg-white print:text-black">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">9. Roadmap progress</span>
                <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black">{roadmapProgress}% Completed</strong>
                <span className="text-[10px] text-slate-450 block mt-1 print:text-slate-700">{completedMilestonesCount} out of 7 milestones met.</span>
              </div>
            </div>

            {/* Strengths / Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs pt-4">
              <div className="space-y-3.5 bg-slate-950 border border-slate-850 p-6 rounded-xl print:border-black print:bg-white print:text-black">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 print:text-black">
                  <FaCheckCircle /> 10. Key Financial Strengths
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-300 font-medium print:text-black">
                  {strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                  {strengths.length === 0 && <li>Set up safety buffers to accumulate positive marks.</li>}
                </ul>
              </div>

              <div className="space-y-3.5 bg-slate-950 border border-slate-850 p-6 rounded-xl print:border-black print:bg-white print:text-black">
                <h4 className="text-sm font-bold text-rose-400 flex items-center gap-1.5 print:text-black">
                  <FaTimesCircle /> 11. Core Financial Deficits
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-300 font-medium print:text-black">
                  {weaknesses.map((w, idx) => <li key={idx} className="text-rose-300 print:text-black"><span className="text-slate-300 print:text-black">{w}</span></li>)}
                  {weaknesses.length === 0 && <li className="text-emerald-400">Zero immediate vulnerabilities detected!</li>}
                </ul>
              </div>
            </div>

            {/* 12. Priorities & 13. Action Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs pt-2">
              <div className="space-y-3 bg-slate-950 border border-slate-850 p-6 rounded-xl print:border-black print:bg-white print:text-black">
                <h4 className="text-sm font-bold text-blue-400 flex items-center gap-1.5 print:text-black">
                  <FaMapSigns /> 12. Top Advisors Priorities
                </h4>
                <div className="space-y-2">
                  {dynamicPriorities.map((pri, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-850/60 last:border-0 font-semibold print:border-black">
                      <span className="text-slate-300 print:text-black">{idx + 1}. {pri.title}</span>
                      <strong className="text-slate-100 print:text-black">{pri.target}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3.5 bg-slate-950 border border-slate-850 p-6 rounded-xl print:border-black print:bg-white print:text-black">
                <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-1.5 print:text-black">
                  <FaLightbulb /> 13. Action Plan
                </h4>
                <div className="space-y-2 text-[11px] leading-relaxed font-medium">
                  <p className="font-semibold text-slate-200 print:text-black">Advisor Recommendation Summary:</p>
                  <p className="text-slate-400 print:text-slate-700">
                    To optimize your wealth trajectory, prioritize setting aside a liquid cash reserve equal to ₹{minEF.toLocaleString()} (Emergency Fund) and purchase a health insurance base policy.
                  </p>
                  <p className="text-slate-400 print:text-slate-700">
                    Once basic protection filters are passed, secure pure term insurance cover, and increase index/large cap mutual fund SIPs dynamically using a 10% annual step-up.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default FinancialAnalysis;
