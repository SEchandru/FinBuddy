import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaCompass, 
  FaUser, 
  FaWallet, 
  FaUsers, 
  FaCoins, 
  FaBullseye, 
  FaRedoAlt, 
  FaArrowRight, 
  FaArrowLeft, 
  FaHeartbeat, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaInfoCircle, 
  FaLightbulb, 
  FaCheckSquare, 
  FaRegSquare, 
  FaShieldAlt, 
  FaExclamationTriangle,
  FaChartPie,
  FaCalendarAlt
} from 'react-icons/fa';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#fbbf24', '#10b981', '#f43f5e'];

// Risk assessment questions pool for Roadmap
const ROADMAP_QUIZ = [
  {
    id: "rq1",
    question: "If your investment falls by 20% in a month due to market volatility, what will you do?",
    options: [
      { text: "Sell immediately to prevent further losses.", profile: "Conservative", score: 1 },
      { text: "Hold and wait for market recovery.", profile: "Moderate", score: 2 },
      { text: "Buy more at a discount to average cost.", profile: "Aggressive", score: 3 }
    ]
  },
  {
    id: "rq2",
    question: "How long can you stay invested without needing this money?",
    options: [
      { text: "Short-term: Less than 3 years.", profile: "Conservative", score: 1 },
      { text: "Medium-term: 3 to 7 years.", profile: "Moderate", score: 2 },
      { text: "Long-term: More than 7 years.", profile: "Aggressive", score: 3 }
    ]
  },
  {
    id: "rq3",
    question: "What is your previous investment experience?",
    options: [
      { text: "None: I prefer fixed deposits/savings.", profile: "Conservative", score: 1 },
      { text: "Some: I have invested in mutual funds.", profile: "Moderate", score: 2 },
      { text: "Experienced: I trade stocks and derivatives.", profile: "Aggressive", score: 3 }
    ]
  },
  {
    id: "rq4",
    question: "Which of these investment options do you prefer?",
    options: [
      { text: "Guaranteed savings schemes (PPF, FD) yielding 7%.", profile: "Conservative", score: 1 },
      { text: "Balanced portfolios (Hybrid Funds) targeting 10-12%.", profile: "Moderate", score: 2 },
      { text: "Equity index funds or direct stocks targeting 12-15%.", profile: "Aggressive", score: 3 }
    ]
  },
  {
    id: "rq5",
    question: "What is your primary financial goal?",
    options: [
      { text: "Capital protection and regular income.", profile: "Conservative", score: 1 },
      { text: "Inflation-beating steady wealth growth.", profile: "Moderate", score: 2 },
      { text: "Maximizing long-term wealth accumulation aggressively.", profile: "Aggressive", score: 3 }
    ]
  }
];

function Roadmap() {
  const { user, syncLocalUserProfile } = useAuth();
  const location = useLocation();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('executive'); // executive, insurance, assets, checklist

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['executive', 'insurance', 'assets', 'checklist'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);
  
  // Onboarding Form States (Upgraded for "Roadmap & Protection Planner")
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || 22,
    gender: 'Male',
    maritalStatus: 'Single',
    monthlySalary: user?.monthlyIncome || 25000,
    additionalIncome: 0,
    expectedGrowth: 10,
    familyMembersCount: 1,
    parentsDependent: 'Yes',
    spouseDependent: 'No',
    childrenCount: 0,
    savings: user?.netWorth || 20000,
    investments: 0,
    loans: 0,
    currentHealthIns: 0,
    currentTermIns: 0,
    nomineeAdded: 'No',
    goals: {
      emergencyFund: true,
      bike: false,
      car: false,
      marriage: false,
      house: false,
      childEducation: false,
      retirement: true,
      travel: false
    }
  });

  // Risk Quiz State
  const [quizAnswers, setQuizAnswers] = useState({});
  
  // Report Result State
  const [report, setReport] = useState(() => {
    const saved = localStorage.getItem(`finbuddy_roadmap_${user?.email || 'guest'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.report && parsed.report.insuranceAnalysis && parsed.report.strengths) {
          return parsed.report;
        }
      } catch (err) {
        console.error("Error parsing saved roadmap:", err);
      }
    }
    return null;
  });
  
  const [completedItems, setCompletedItems] = useState(() => {
    const saved = localStorage.getItem(`finbuddy_roadmap_${user?.email || 'guest'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.report && parsed.report.insuranceAnalysis && parsed.report.strengths) {
          return parsed.completedItems || {};
        }
      } catch (err) {
        console.error("Error parsing saved roadmap:", err);
      }
    }
    return {};
  });

  const [hasReport, setHasReport] = useState(() => {
    const saved = localStorage.getItem(`finbuddy_roadmap_${user?.email || 'guest'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.report && parsed.report.insuranceAnalysis && parsed.report.strengths) {
          return true;
        }
      } catch (err) {
        console.error("Error parsing saved roadmap:", err);
      }
    }
    return false;
  });

  // Sync state when user changes
  const [prevUserEmail, setPrevUserEmail] = useState(user?.email || 'guest');
  if (user?.email !== prevUserEmail) {
    setPrevUserEmail(user?.email || 'guest');
    const saved = localStorage.getItem(`finbuddy_roadmap_${user?.email || 'guest'}`);
    let loadedReport = null;
    let loadedCompletedItems = {};
    let loadedHasReport = false;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.report && parsed.report.insuranceAnalysis && parsed.report.strengths) {
          loadedReport = parsed.report;
          loadedCompletedItems = parsed.completedItems || {};
          loadedHasReport = true;
        } else {
          localStorage.removeItem(`finbuddy_roadmap_${user?.email || 'guest'}`);
        }
      } catch (err) {
        console.error("Error parsing saved roadmap:", err);
        localStorage.removeItem(`finbuddy_roadmap_${user?.email || 'guest'}`);
      }
    }
    setReport(loadedReport);
    setCompletedItems(loadedCompletedItems);
    setHasReport(loadedHasReport);
  }

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleGoalToggle = (goalKey) => {
    setFormData(prev => ({
      ...prev,
      goals: {
        ...prev.goals,
        [goalKey]: !prev.goals[goalKey]
      }
    }));
  };

  const handleQuizAnswer = (qId, optionIdx) => {
    setQuizAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const nextStep = () => {
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  // Generate Personalized Advisor Report
  const generateRoadmap = () => {
    setLoading(true);
    
    // Parse form values
    const age = parseInt(formData.age);
    const monthlyIncome = parseFloat(formData.monthlySalary) + parseFloat(formData.additionalIncome);
    const annualIncome = monthlyIncome * 12;
    const currentSavings = parseFloat(formData.savings) || 0;
    const currentInvestments = parseFloat(formData.investments) || 0;
    const existingLoans = parseFloat(formData.loans) || 0;
    const currentHealthIns = parseFloat(formData.currentHealthIns) || 0;
    const currentTermIns = parseFloat(formData.currentTermIns) || 0;
    const estimatedExpenses = Math.round(monthlyIncome * 0.65);
    const actualSavingsRate = monthlyIncome > 0 ? ((monthlyIncome - estimatedExpenses) / monthlyIncome) * 105 : 0;
    const parsedSavingsRate = Math.max(0, Math.min(100, Math.round(actualSavingsRate / 1.05)));

    // Calculate Risk Quiz score
    let riskScore = 0;
    let answeredCount = 0;
    ROADMAP_QUIZ.forEach(q => {
      const selected = quizAnswers[q.id];
      if (selected !== undefined) {
        riskScore += q.options[selected].score;
        answeredCount++;
      }
    });

    const avgRisk = answeredCount > 0 ? (riskScore / answeredCount) : 2;
    let riskProfile = 'Moderate';
    if (avgRisk < 1.6) riskProfile = 'Conservative';
    else if (avgRisk > 2.4) riskProfile = 'Aggressive';

    // --- INSURANCE ANALYSIS ---
    // Health Insurance recommended limits
    let recHealthIns = 500000; // Single base
    if (formData.maritalStatus === 'Married') {
      if (formData.childrenCount > 0) {
        recHealthIns = 2000000; // Family with children (15L - 25L -> 20L recommended)
      } else {
        recHealthIns = 1500000; // Married couple (10L - 20L -> 15L recommended)
      }
    } else {
      if (formData.childrenCount > 0 || formData.parentsDependent === 'Yes') {
        recHealthIns = 1000000; // Single parent or dependent parents
      }
    }
    
    const healthGap = Math.max(0, recHealthIns - currentHealthIns);
    const healthPriority = healthGap > 0 ? (healthGap > recHealthIns / 2 ? 'Critical' : 'High') : 'Secure';

    // Term Insurance recommended limits (Formula: 20x Annual Income)
    const recTermIns = annualIncome * 20;
    const termGap = Math.max(0, recTermIns - currentTermIns);
    const termPriority = termGap > 0 ? (termGap > recTermIns / 2 ? 'Critical' : 'High') : 'Secure';
    const termProtectionScore = recTermIns === 0 ? 100 : Math.min(100, Math.round((currentTermIns / recTermIns) * 100));

    // --- HEALTH SCORE CALCULATION (100 Points) ---
    // 1. Emergency Fund (20 Points) - 6 months expenses
    const targetEF = estimatedExpenses * 6;
    const minEF = estimatedExpenses * 3;
    let efScore = 0;
    if (currentSavings >= targetEF) efScore = 20;
    else if (currentSavings >= minEF) efScore = 15;
    else if (currentSavings > 0) efScore = Math.round((currentSavings / (minEF || 1)) * 15);

    // 2. Insurance Coverage (20 Points) - 10 points health, 10 points term
    let healthPoints = 0;
    if (currentHealthIns >= recHealthIns) healthPoints = 10;
    else if (currentHealthIns > 0) healthPoints = Math.round((currentHealthIns / recHealthIns) * 10);

    let termPoints = 0;
    if (recTermIns === 0) termPoints = 10; // no dependents
    else if (currentTermIns >= recTermIns) termPoints = 10;
    else if (currentTermIns > 0) termPoints = Math.round((currentTermIns / recTermIns) * 10);
    
    const insScore = healthPoints + termPoints;

    // 3. Savings Rate (15 Points) - Full points for 30%+ savings rate
    let savingsRateScore = 0;
    if (parsedSavingsRate >= 30) savingsRateScore = 15;
    else if (parsedSavingsRate >= 20) savingsRateScore = 10;
    else if (parsedSavingsRate >= 10) savingsRateScore = 5;

    // 4. Investment Discipline (15 Points) - Proportional to salary
    let investScore = 0;
    if (currentInvestments > annualIncome * 0.5) investScore = 15;
    else if (currentInvestments > annualIncome * 0.25) investScore = 10;
    else if (currentInvestments > 0) investScore = 5;

    // 5. Debt Management (15 Points) - Full points if debt-free
    let debtScore = 15;
    if (existingLoans > 0) {
      const loanRatio = existingLoans / annualIncome;
      if (loanRatio > 1.5) debtScore = 3;
      else if (loanRatio > 0.75) debtScore = 8;
      else debtScore = 12;
    }

    // 6. Goal Progress (15 Points) - Based on savings/investment ratio to income
    const netAssets = currentSavings + currentInvestments;
    let goalProgressScore = 5;
    if (netAssets > annualIncome * 1.5) goalProgressScore = 15;
    else if (netAssets > annualIncome * 0.5) goalProgressScore = 10;
    else if (netAssets > 0) goalProgressScore = 8;

    const healthScore = efScore + insScore + savingsRateScore + investScore + debtScore + goalProgressScore;

    let ratingLabel;
    let ratingColor;
    let ratingBg;
    if (healthScore >= 81) {
      ratingLabel = 'Excellent';
      ratingColor = 'text-emerald-500';
      ratingBg = 'bg-emerald-500/10';
    } else if (healthScore >= 61) {
      ratingLabel = 'Good';
      ratingColor = 'text-blue-500';
      ratingBg = 'bg-blue-500/10';
    } else if (healthScore >= 41) {
      ratingLabel = 'Average';
      ratingColor = 'text-amber-500';
      ratingBg = 'bg-amber-500/10';
    } else {
      ratingLabel = 'Poor';
      ratingColor = 'text-rose-500';
      ratingBg = 'bg-rose-500/10';
    }

    // --- ADVISOR CHECKLISTS ---
    // Insurance checklist
    const insuranceChecklist = [
      { id: 'i_hi_av', text: 'Health Insurance Available', completed: currentHealthIns > 0 },
      { id: 'i_hi_ad', text: 'Health Insurance Adequate', completed: currentHealthIns >= recHealthIns },
      { id: 'i_ti_av', text: 'Term Insurance Available', completed: currentTermIns > 0 },
      { id: 'i_ti_ad', text: 'Term Insurance Adequate', completed: recTermIns === 0 || currentTermIns >= recTermIns },
      { id: 'i_nom', text: 'Nominee Added', completed: formData.nomineeAdded === 'Yes' },
      { id: 'i_ef_av', text: 'Emergency Fund Available', completed: currentSavings >= minEF },
      { id: 'i_fam_pr', text: 'Family Financial Protection Ready', completed: (currentHealthIns >= recHealthIns && (recTermIns === 0 || currentTermIns >= recTermIns) && formData.nomineeAdded === 'Yes' && currentSavings >= minEF) }
    ];

    // Age milestone checklist
    const ageChecklist = [];
    if (age >= 18 && age <= 25) {
      ageChecklist.push({ id: 'cb1', text: 'Create Emergency Cash Pot' });
      ageChecklist.push({ id: 'cb2', text: 'Get Individual Health Insurance' });
      ageChecklist.push({ id: 'cb3', text: 'Launch First Compounding SIP' });
      ageChecklist.push({ id: 'cb4', text: 'Set aside Skill Development Budget' });
      ageChecklist.push({ id: 'cb5', text: 'Draft a Career Growth Timeline' });
      ageChecklist.push({ id: 'cb6', text: 'Clear all Credit Card Debt' });
      ageChecklist.push({ id: 'cb7', text: 'Read 2 Basic Personal Finance Books' });
      ageChecklist.push({ id: 'cb8', text: 'Set up Goal-targeted Savings' });
    } else if (age >= 26 && age <= 35) {
      ageChecklist.push({ id: 'cb9', text: 'Establish Pure Term Life Insurance' });
      ageChecklist.push({ id: 'cb10', text: 'Get Family Health Insurance cover' });
      ageChecklist.push({ id: 'cb11', text: 'Setup Child Education SIPs' });
      ageChecklist.push({ id: 'cb12', text: 'Audit Retirement Target Corpus' });
      ageChecklist.push({ id: 'cb13', text: 'Diversify across Mutual Funds & Gold' });
      ageChecklist.push({ id: 'cb14', text: 'Maximize Annual Tax Savings (80C)' });
      ageChecklist.push({ id: 'cb15', text: 'Increase SIP amount by 10% annually' });
      ageChecklist.push({ id: 'cb16', text: 'Maintain Emergency Fund for 6 months' });
    } else if (age >= 36 && age <= 50) {
      ageChecklist.push({ id: 'cb17', text: 'Fund Core Retirement Accounts' });
      ageChecklist.push({ id: 'cb18', text: 'Establish Child Higher Education Fund' });
      ageChecklist.push({ id: 'cb19', text: 'Paydown Home Loan Liabilities' });
      ageChecklist.push({ id: 'cb20', text: 'Rebalance Portfolio Asset Allocation' });
      ageChecklist.push({ id: 'cb21', text: 'Draft Legal Wills & Nominees' });
      ageChecklist.push({ id: 'cb22', text: 'Set up Parents Medical Float Cover' });
      ageChecklist.push({ id: 'cb23', text: 'Maintain emergency cash in liquid funds' });
    } else {
      ageChecklist.push({ id: 'cb24', text: 'Prepay all Outstanding Debts' });
      ageChecklist.push({ id: 'cb25', text: 'Move Assets to Fixed Income/Bonds' });
      ageChecklist.push({ id: 'cb26', text: 'Review Post-Retirement Health Covers' });
      ageChecklist.push({ id: 'cb27', text: 'Map Systematic Withdrawal Plans (SWP)' });
      ageChecklist.push({ id: 'cb28', text: 'Complete Nominee Registration Audits' });
      ageChecklist.push({ id: 'cb29', text: 'Setup Legacy Estate Plan / Will' });
    }

    // --- ASSET ALLOCATION SPLITS & REASONING ---
    let equityPct = 110 - age;
    let debtPct;
    let goldPct;
    let cashPct;

    if (riskProfile === 'Conservative') {
      equityPct = Math.max(25, Math.round(equityPct * 0.5));
      cashPct = 20;
      goldPct = 15;
      debtPct = 100 - (equityPct + goldPct + cashPct);
    } else if (riskProfile === 'Aggressive') {
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

    // Adjust allocation values based on family size
    if (formData.familyMembersCount > 3 && riskProfile !== 'Conservative') {
      equityPct = Math.max(30, equityPct - 5);
      cashPct += 5;
    }

    const netWorth = currentSavings + currentInvestments;
    const allocationData = [
      { name: 'Equity Mutual Funds', value: equityPct, rupee: Math.round((equityPct/100)*netWorth) },
      { name: 'Debt Funds/Bonds', value: debtPct, rupee: Math.round((debtPct/100)*netWorth) },
      { name: 'Gold / Hedging', value: goldPct, rupee: Math.round((goldPct/100)*netWorth) },
      { name: 'Emergency Cash / FDs', value: cashPct, rupee: Math.round((cashPct/100)*netWorth) }
    ].filter(a => a.value > 0);

    // Custom allocation reasoning
    let allocationReasoning;
    if (riskProfile === 'Aggressive') {
      allocationReasoning = `At age ${age}, with an Aggressive risk profile and ${formData.familyMembersCount} family members, your primary objective is compounding wealth. We recommend allocating a dominant ${equityPct}% to Equities to beat inflation, while keeping ${cashPct}% in liquid cash for family protection.`;
    } else if (riskProfile === 'Conservative') {
      allocationReasoning = `Because your risk profile is Conservative, capital protection is a key priority. We suggest limiting equities to ${equityPct}% and securing ${debtPct}% in stable debt funds, alongside a significant ${cashPct}% cash shield to protect dependents from immediate income disruptions.`;
    } else {
      allocationReasoning = `With a Moderate risk profile at age ${age}, a balanced allocation of ${equityPct}% Equity, ${debtPct}% Debt, and ${goldPct}% Gold maintains healthy compounding without excessive volatility, backed by a stable ${cashPct}% emergency cash core.`;
    }

    // --- FINANCIAL PRIORITY ACTIONS ---
    const priorities = [];
    if (currentSavings < minEF) {
      priorities.push("🚨 Build Emergency Fund: Secure at least ₹" + minEF.toLocaleString() + " in high-yield liquid cash.");
    }
    if (currentHealthIns < recHealthIns) {
      priorities.push("☂️ Health Insurance: Procure cover of ₹" + recHealthIns.toLocaleString() + " to guard against medical inflation.");
    }
    if (recTermIns > 0 && currentTermIns < recTermIns) {
      priorities.push("☂️ Term Insurance: Buy a pure Term Life policy of at least ₹" + recTermIns.toLocaleString() + " to shield dependents.");
    }
    if (currentInvestments === 0) {
      priorities.push("📈 Start SIP: Automate ₹2,000/month in equity mutual funds to start compounding.");
    }
    priorities.push("🎯 Goal Based Investing: Allocate targeted mutual funds to achieve goals.");
    priorities.push("👴 Retirement Planning: Open an NPS/PPF and map systematic investments for your senior years.");
    
    // Slice to top 6 priorities matching request
    const topPriorities = priorities.slice(0, 6);

    // --- STRENGTHS & WEAKNESSES ---
    const strengths = [];
    const weaknesses = [];

    if (existingLoans === 0) strengths.push("You are completely debt-free, keeping 100% of your salary cash flows flexible.");
    else if (existingLoans < annualIncome * 0.5) strengths.push("Your loan liabilities are well-controlled (under 50% of annual income).");
    else weaknesses.push("High leverage threat: Outstanding debts exceed 50% of annual income, restricting cash flow.");

    if (currentSavings >= targetEF) strengths.push("Excellent liquid cash buffer! You have successfully secured a 6-month emergency reserve.");
    else if (currentSavings >= minEF) strengths.push("Healthy emergency core: You have secured a 3-month expense cash shield.");
    else weaknesses.push("Liquid cash hazard: Emergency cash reserves are under 3 months, making you vulnerable to sudden shocks.");

    if (currentHealthIns >= recHealthIns) strengths.push("Adequate medical cover: Health insurance meets recommended standards.");
    else if (currentHealthIns > 0) weaknesses.push("Under-insured health: Medical coverage is below recommended safety margins.");
    else weaknesses.push("Critical medical risk: You do not have health insurance, risking asset liquidation in emergencies.");

    if (recTermIns > 0 && currentTermIns >= recTermIns) strengths.push("Solid term protection: Income replacement term insurance is fully funded.");
    else if (recTermIns > 0 && currentTermIns > 0) weaknesses.push("Inadequate term protection: Current life cover is under the recommended 20x annual income.");
    else if (recTermIns > 0) weaknesses.push("Critical life risk: Zero term insurance despite active dependents. Dependents lack income security.");

    if (formData.nomineeAdded === 'Yes') strengths.push("Estate hygiene: Nominees have been added to secure asset transmission.");
    else weaknesses.push("Transmission risk: Nominees are missing, which could cause inheritance roadblocks.");

    if (parsedSavingsRate >= 20) strengths.push(`Strong savings habits: You save ${parsedSavingsRate}% of your monthly salary.`);
    else weaknesses.push(`Low savings rate: You save under 20% of income. We suggest trimming discretionary wants.`);

    // --- TOP FINANCIAL RISKS DETAIL ---
    const financialRisks = [];
    if (currentHealthIns < recHealthIns) {
      financialRisks.push({
        title: "Medical Inflation Risk",
        why: "Healthcare costs in India are rising at 14% annually. A single hospitalization can cost ₹3-5 Lakhs.",
        ignored: "You could be forced to take high-interest personal loans or liquidate your investment SIPs.",
        action: `Purchase or increase your health insurance coverage to ₹${recHealthIns.toLocaleString()} immediately.`
      });
    }
    if (recTermIns > 0 && currentTermIns < recTermIns) {
      financialRisks.push({
        title: "Income Disruption Risk (No Protection for Dependents)",
        why: "Your dependents rely on your salary. In your absence, they lose their primary livelihood support.",
        ignored: "Dependents might inherit your loans, struggle with living costs, or halt education goals.",
        action: `Apply for a pure Term Life Insurance cover of ₹${recTermIns.toLocaleString()} (approx premium ₹800-1200/month).`
      });
    }
    if (currentSavings < minEF) {
      financialRisks.push({
        title: "Emergency Cash Crunch",
        why: "Unplanned events like job losses, urgent repairs, or medical wait-times require instant liquid money.",
        ignored: "Forced borrowing from high-interest sources or credit cards, building a debt trap.",
        action: `Set aside ₹${minEF.toLocaleString()} in a separate savings account or liquid fund. Do not touch this for daily needs.`
      });
    }
    if (parsedSavingsRate < 20) {
      financialRisks.push({
        title: "Inflation Wealth Erosion",
        why: "Living expenses double every 10 years at 7% inflation. Keeping money idle in low-yield assets loses value.",
        ignored: "You will fall short of long-term milestones like buying a home or retirement safety.",
        action: `Increase savings rate above 20% and allocate to compounding mutual funds.`
      });
    }

    // --- TIMELINE PLANS ---
    const plan30Day = [
      currentSavings < minEF ? `Transfer ₹${Math.round(minEF/3).toLocaleString()} immediately to a separate emergency pot.` : "Review emergency cash location.",
      currentHealthIns === 0 ? "Compare online family-floater health insurance options." : "Verify health insurance renewal details.",
      formData.nomineeAdded === 'No' ? "Log in to netbanking/investment portals and update nominee details." : "Verify nominee active status."
    ];

    const plan90Day = [
      recTermIns > 0 && currentTermIns === 0 ? `Apply for a term life cover of ₹${recTermIns.toLocaleString()}.` : "Maintain current life covers.",
      currentInvestments === 0 ? "Set up a monthly auto-debit SIP of ₹2,000 in an Index Mutual Fund." : "Review and rebalance current mutual fund portfolios.",
      "Track and audit all household subscriptions and recurring expenses."
    ];

    const plan1Year = [
      `Aim to achieve an annual savings target of ${Math.round(parsedSavingsRate + 5)}% by cutting wants.`,
      `Review salary increments and raise SIP values by 10% annually (Step-up SIP).`,
      "Review tax-saving investments (under 80C/80D) before the financial year ends."
    ];

    const plan5Year = [
      "Target doubling your total net investments base via continuous compounding.",
      age < 30 ? "Accumulate initial down payments for vehicle or marriage goals." : "Review kids education corpus targets.",
      "Review debt status: prepay home loans or personal loans aggressively to become debt-free."
    ];

    // Combine final report
    const finalReport = {
      healthScore,
      ratingLabel,
      ratingColor,
      ratingBg,
      riskProfile,
      insuranceChecklist,
      ageChecklist,
      allocationData,
      allocationReasoning,
      topPriorities,
      strengths,
      weaknesses,
      financialRisks,
      plan30Day,
      plan90Day,
      plan1Year,
      plan5Year,
      insuranceAnalysis: {
        health: {
          current: currentHealthIns,
          recommended: recHealthIns,
          gap: healthGap,
          priority: healthPriority
        },
        term: {
          current: currentTermIns,
          recommended: recTermIns,
          gap: termGap,
          priority: termPriority,
          score: termProtectionScore
        }
      }
    };

    setReport(finalReport);
    setCompletedItems({});
    
    // Save report in localStorage
    localStorage.setItem(`finbuddy_roadmap_${user?.email || 'guest'}`, JSON.stringify({
      report: finalReport,
      completedItems: {}
    }));

    // Sync financial health score with active user session
    if (syncLocalUserProfile) {
      syncLocalUserProfile({
        financialHealthScore: healthScore,
        riskProfile: riskProfile
      });
    }

    setTimeout(() => {
      setLoading(false);
      setHasReport(true);
      setActiveTab('executive');
    }, 1000);
  };

  const toggleChecklistItem = (itemId) => {
    const updated = {
      ...completedItems,
      [itemId]: !completedItems[itemId]
    };
    setCompletedItems(updated);
    
    // Save updated checklist items in localStorage
    const saved = localStorage.getItem(`finbuddy_roadmap_${user?.email || 'guest'}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.completedItems = updated;
      localStorage.setItem(`finbuddy_roadmap_${user?.email || 'guest'}`, JSON.stringify(parsed));
    }
  };

  const resetRoadmap = () => {
    localStorage.removeItem(`finbuddy_roadmap_${user?.email || 'guest'}`);
    setHasReport(false);
    setStep(1);
    setReport(null);
    setQuizAnswers({});
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8 font-sans">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
            <FaShieldAlt />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Financial Roadmap & Protection Planner
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Your personal financial advisor. Tailored insurance checklist, dynamic age milestone tracker, and risk-adjusted asset recommendations.
            </p>
          </div>
        </div>

        {hasReport && (
          <button
            onClick={resetRoadmap}
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-350 hover:text-white rounded-xl transition-all flex items-center gap-1.5 shadow-md"
          >
            <FaRedoAlt className="text-[10px]" /> Reset Planner
          </button>
        )}
      </div>

      {/* ROADMAP CONFIGURATION FORMS (STEP BY STEP WIZARD) */}
      {!hasReport && (
        <div className="max-w-2xl mx-auto bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative backdrop-blur-md">
          {/* Progress Indicators */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Advisor Profiler (Step {step} of 6)
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div 
                  key={i} 
                  className={`h-1.5 w-7 rounded-full transition-all duration-300 ${
                    i <= step ? 'bg-blue-500' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-slate-400 text-xs font-bold animate-pulse uppercase tracking-wider">Compiling advisor analytics & building protection roadmap...</p>
            </div>
          ) : (
            <>
              {/* STEP 1: Personal Details */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><FaUser className="text-blue-500 text-sm" /> Step 1: Personal Details</h2>
                    <p className="text-xs text-slate-400 mt-1">Basic demography helps align benchmarks for your life stage.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="John Doe"
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Age</label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Marital Status</label>
                      <select
                        value={formData.maritalStatus}
                        onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced / Widowed</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Income Details */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><FaWallet className="text-blue-500 text-sm" /> Step 2: Income & Employment</h2>
                    <p className="text-xs text-slate-400 mt-1">Earnings and growth expectations help calculate protection safety margins.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Monthly In-Hand Salary (₹)</label>
                      <input
                        type="number"
                        value={formData.monthlySalary}
                        onChange={(e) => handleInputChange('monthlySalary', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Additional Monthly Income (₹)</label>
                      <input
                        type="number"
                        value={formData.additionalIncome}
                        onChange={(e) => handleInputChange('additionalIncome', parseFloat(e.target.value) || 0)}
                        placeholder="Rental, side gig, interest..."
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Expected Annual Growth (%)</label>
                      <input
                        type="range" min="1" max="50" step="1"
                        value={formData.expectedGrowth}
                        onChange={(e) => handleInputChange('expectedGrowth', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="text-right text-xs text-blue-400 font-bold mt-1">{formData.expectedGrowth}% growth rate</div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Family Details */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><FaUsers className="text-blue-500 text-sm" /> Step 3: Family Dependencies</h2>
                    <p className="text-xs text-slate-400 mt-1">Dependent count dictates term cover size and health premium floaters.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Total Family Members</label>
                      <input
                        type="number"
                        value={formData.familyMembersCount}
                        onChange={(e) => handleInputChange('familyMembersCount', parseInt(e.target.value) || 1)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Children Count</label>
                      <input
                        type="number"
                        value={formData.childrenCount}
                        onChange={(e) => handleInputChange('childrenCount', parseInt(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Parents Dependent?</label>
                      <select
                        value={formData.parentsDependent}
                        onChange={(e) => handleInputChange('parentsDependent', e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Spouse Dependent?</label>
                      <select
                        value={formData.spouseDependent}
                        onChange={(e) => handleInputChange('spouseDependent', e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Financial Details */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><FaCoins className="text-blue-500 text-sm" /> Step 4: Asset & Insurance Diagnostics</h2>
                    <p className="text-xs text-slate-400 mt-1">Current cushions and liabilities map your protection gaps.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Liquid Savings (₹)</label>
                      <input
                        type="number"
                        value={formData.savings}
                        onChange={(e) => handleInputChange('savings', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Mutual Funds & Equity (₹)</label>
                      <input
                        type="number"
                        value={formData.investments}
                        onChange={(e) => handleInputChange('investments', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Existing Loan Liabilities (₹)</label>
                      <input
                        type="number"
                        value={formData.loans}
                        onChange={(e) => handleInputChange('loans', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Nominees Added to Accounts?</label>
                      <select
                        value={formData.nomineeAdded}
                        onChange={(e) => handleInputChange('nomineeAdded', e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                      >
                        <option value="Yes">Yes (All accounts mapped)</option>
                        <option value="No">No (Need to add nominees)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Current Health Insurance (₹)</label>
                      <input
                        type="number"
                        value={formData.currentHealthIns}
                        onChange={(e) => handleInputChange('currentHealthIns', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 500000"
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Current Term Life Insurance (₹)</label>
                      <input
                        type="number"
                        value={formData.currentTermIns}
                        onChange={(e) => handleInputChange('currentTermIns', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 5000000"
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Goals Checklist */}
              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><FaBullseye className="text-blue-500 text-sm" /> Step 5: Select Your Targets</h2>
                    <p className="text-xs text-slate-400 mt-1">Check the goals you are planning to fund in the next 5-10 years.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(formData.goals).map(([key, val]) => {
                      let label = key.charAt(0).toUpperCase() + key.slice(1);
                      if (key === 'emergencyFund') label = 'Emergency Reserve';
                      if (key === 'childEducation') label = "Children's Education";

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleGoalToggle(key)}
                          className={`text-left p-3.5 border rounded-xl flex items-center gap-3 transition-all text-xs font-medium ${
                            val 
                              ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                              : 'bg-slate-950/40 border-slate-850 text-slate-450 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-lg">
                            {val ? <FaCheckSquare /> : <FaRegSquare />}
                          </span>
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 6: Risk Quiz */}
              {step === 6 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><FaCompass className="text-blue-500 text-sm" /> Step 6: Risk Capability Profile</h2>
                    <p className="text-xs text-slate-400 mt-1">Complete these 5 rapid profiling questions to map asset weights.</p>
                  </div>

                  <div className="space-y-5 max-h-[380px] overflow-y-auto pr-1">
                    {ROADMAP_QUIZ.map((q) => (
                      <div key={q.id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-3">
                        <p className="text-xs font-bold text-slate-300">{q.question}</p>
                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = quizAnswers[q.id] === oIdx;
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => handleQuizAnswer(q.id, oIdx)}
                                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                                  isSelected 
                                    ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                                    : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:bg-slate-900/30'
                                }`}
                              >
                                {opt.text}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Navigation Controls */}
              <div className="flex justify-between mt-8 pt-6 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={step === 1}
                  className="px-5 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 flex items-center gap-1.5"
                >
                  <FaArrowLeft /> Back
                </button>

                {step < 6 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5"
                  >
                    Next Step <FaArrowRight />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={generateRoadmap}
                    disabled={Object.keys(quizAnswers).length < 5}
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 text-xs font-semibold text-white disabled:opacity-30 shadow-lg"
                  >
                    Build Advisor Planner
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ROADMAP REPORT ADVISOR DASHBOARD */}
      {hasReport && report && (
        <div className="space-y-8">
          
          {/* Executive Overview Panel (Score & Priorities) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Health Score Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md text-center flex flex-col items-center justify-center gap-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Finance Health Score</span>
              <div className="h-32 w-32 rounded-full border-4 border-slate-800 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-3xl font-black text-white">{report.healthScore}</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">/ 100</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Health Rating</span>
                <div className={`text-xl font-extrabold flex items-center justify-center gap-1.5 ${report.ratingColor}`}>
                  <FaHeartbeat /> {report.ratingLabel}
                </div>
              </div>
            </div>

            {/* Current Financial Status overview */}
            <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Asset Diagnostics</span>
              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Savings (Cash)</span>
                  <span className="text-sm font-bold text-slate-200">₹{(formData.savings || 0).toLocaleString()}</span>
                </div>
                <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Investments</span>
                  <span className="text-sm font-bold text-slate-200">₹{(formData.investments || 0).toLocaleString()}</span>
                </div>
                <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Total Debts</span>
                  <span className="text-sm font-bold text-red-400">₹{(formData.loans || 0).toLocaleString()}</span>
                </div>
                <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Net Assets</span>
                  <span className={`text-sm font-bold ${((formData.savings || 0) + (formData.investments || 0) - (formData.loans || 0)) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ₹{((formData.savings || 0) + (formData.investments || 0) - (formData.loans || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Priorities */}
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block"><FaCompass className="inline mr-1 text-yellow-400" /> Next Advisory Priorities</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.topPriorities.map((pri, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 border rounded-xl flex items-center gap-2 text-xs font-semibold ${
                      idx === 0 
                        ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
                        : 'bg-slate-950/60 border-slate-850 text-slate-300'
                    }`}
                  >
                    <div className="h-5 w-5 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center font-bold text-[9px] shrink-0">
                      {idx + 1}
                    </div>
                    <span className="leading-tight">{pri}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Tabbed Navigation for Planner Dashboard */}
          <div className="flex border-b border-slate-900 gap-2 pb-1">
            <button
              onClick={() => setActiveTab('executive')}
              className={`px-4 py-2 text-xs font-bold uppercase transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'executive' 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FaLightbulb /> Executive Report
            </button>
            <button
              onClick={() => setActiveTab('insurance')}
              className={`px-4 py-2 text-xs font-bold uppercase transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'insurance' 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FaShieldAlt /> Protection & Insurance
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-4 py-2 text-xs font-bold uppercase transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'assets' 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FaChartPie /> Asset Allocation
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-4 py-2 text-xs font-bold uppercase transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'checklist' 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FaCheckSquare /> Milestone Checklist
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="mt-4">
            
            {/* TAB 1: EXECUTIVE REPORT */}
            {activeTab === 'executive' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left side: Strengths & Weaknesses */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Strengths Card */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                    <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                      <FaCheckCircle /> Advisor Strengths Evaluation
                    </h3>
                    <ul className="space-y-3 mt-1.5 text-xs text-slate-350">
                      {report.strengths.map((str, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-slate-300">
                          <FaCheckCircle className="mt-0.5 text-emerald-400 shrink-0 text-sm" />
                          <span>{str}</span>
                        </li>
                      ))}
                      {report.strengths.length === 0 && (
                        <p className="text-slate-500 italic text-xs">No specific strengths detected. We recommend setting up standard emergency assets.</p>
                      )}
                    </ul>
                  </div>

                  {/* Weaknesses Card */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                    <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                      <FaTimesCircle /> Advisor Deficits & Gaps
                    </h3>
                    <ul className="space-y-3 mt-1.5 text-xs text-slate-350">
                      {report.weaknesses.map((weak, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-slate-300">
                          <FaTimesCircle className="mt-0.5 text-rose-500 shrink-0 text-sm" />
                          <span>{weak}</span>
                        </li>
                      ))}
                      {report.weaknesses.length === 0 && (
                        <p className="text-emerald-400 italic text-xs">Fantastic job! No immediate security weaknesses or structural deficits identified.</p>
                      )}
                    </ul>
                  </div>

                  {/* Top Critical Risks Explanations */}
                  {report.financialRisks.length > 0 && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                      <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                        <FaExclamationTriangle /> Critical Risks & Advisor Protection Guidelines
                      </h3>
                      <div className="space-y-4">
                        {report.financialRisks.map((risk, i) => (
                          <div key={i} className="bg-slate-950/70 border border-slate-850 p-4 rounded-xl space-y-2">
                            <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wide flex items-center gap-1.5">
                              <FaExclamationTriangle /> {risk.title}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] pt-1">
                              <div>
                                <span className="text-slate-500 font-bold block uppercase">Why It Matters:</span>
                                <p className="text-slate-300 mt-0.5">{risk.why}</p>
                              </div>
                              <div>
                                <span className="text-rose-500 font-bold block uppercase">If Ignored:</span>
                                <p className="text-slate-300 mt-0.5">{risk.ignored}</p>
                              </div>
                              <div>
                                <span className="text-blue-400 font-bold block uppercase">Action to Take:</span>
                                <p className="text-slate-200 mt-0.5 font-semibold">{risk.action}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Right side: Action timelines */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* Time Action Plan Card */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-5">
                    <h3 className="text-sm font-bold text-violet-400 flex items-center gap-2">
                      <FaCalendarAlt /> Time-Based Action Plans
                    </h3>
                    
                    <div className="space-y-5 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Immediate 30-Day Plan</span>
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-300 mt-1.5 font-medium">
                          {report.plan30Day.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>

                      <div className="pt-3 border-t border-slate-850">
                        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">Critical 90-Day Milestones</span>
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-300 mt-1.5 font-medium">
                          {report.plan90Day.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>

                      <div className="pt-3 border-t border-slate-850">
                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block">1-Year Financial Targets</span>
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-300 mt-1.5 font-medium">
                          {report.plan1Year.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>

                      <div className="pt-3 border-t border-slate-850">
                        <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest block">5-Year Wealth Strategy</span>
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-300 mt-1.5 font-medium">
                          {report.plan5Year.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: PROTECTION & INSURANCE */}
            {activeTab === 'insurance' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Insurance Details Table */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Detailed Analysis Card */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
                    <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                      <FaShieldAlt /> Insurance Planning & Gap Analysis
                    </h3>

                    {/* Health Insurance Analysis row */}
                    <div className="space-y-3 bg-slate-950/80 border border-slate-850 p-5 rounded-xl">
                      <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Health Insurance Floater</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          report.insuranceAnalysis.health.priority === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                          report.insuranceAnalysis.health.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          Priority: {report.insuranceAnalysis.health.priority}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Current Coverage</span>
                          <span className="text-sm font-bold text-slate-200">₹{report.insuranceAnalysis.health.current.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Suggested Level</span>
                          <span className="text-sm font-bold text-slate-200">₹{report.insuranceAnalysis.health.recommended.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Coverage Deficit</span>
                          <span className={`text-sm font-bold ${report.insuranceAnalysis.health.gap > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            ₹{report.insuranceAnalysis.health.gap.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850 mt-2 text-[11px] text-slate-350 flex items-start gap-2">
                        <FaInfoCircle className="text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-300 block">Health Advisory Notes:</span>
                          Calculated for a family of {formData.familyMembersCount} member(s). A single hospitalization without adequate coverage risks instant depletion of your savings.
                        </div>
                      </div>
                    </div>

                    {/* Term Insurance Analysis row */}
                    <div className="space-y-3 bg-slate-950/80 border border-slate-850 p-5 rounded-xl">
                      <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Term Life Insurance (Income Replacement)</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          report.insuranceAnalysis.term.priority === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                          report.insuranceAnalysis.term.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          Priority: {report.insuranceAnalysis.term.priority}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Current Cover</span>
                          <span className="text-sm font-bold text-slate-200">₹{report.insuranceAnalysis.term.current.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">20x Income Rec.</span>
                          <span className="text-sm font-bold text-slate-200">₹{report.insuranceAnalysis.term.recommended.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Coverage Deficit</span>
                          <span className={`text-sm font-bold ${report.insuranceAnalysis.term.gap > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            ₹{report.insuranceAnalysis.term.gap.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Protection Score</span>
                          <span className="text-sm font-bold text-violet-400">{report.insuranceAnalysis.term.score}%</span>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850 mt-2 text-[11px] text-slate-350 flex items-start gap-2">
                        <FaInfoCircle className="text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-300 block">Life Advisory Notes:</span>
                          Calculated based on your annual income of ₹{(formData.monthlySalary * 12).toLocaleString()}. In the event of an untimely demise, a pure term insurance cover is critical to secure the future of your dependents and cover outstanding loans.
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Right side: Protection checklist */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* Insurance checklist card */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                    <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                      <FaShieldAlt /> Advisor Protection Checklist
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      This checklist evaluates core safety milestones required to declare your family financially protected.
                    </p>

                    <div className="space-y-3">
                      {report.insuranceChecklist.map(item => (
                        <div 
                          key={item.id} 
                          className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${
                            item.completed 
                              ? 'bg-slate-950/20 border-slate-850/50 text-slate-500' 
                              : 'bg-slate-950/80 border-slate-800 text-slate-200'
                          }`}
                        >
                          <span className="text-base text-teal-400 shrink-0">
                            {item.completed ? <FaCheckCircle /> : <FaTimesCircle className="text-slate-650" />}
                          </span>
                          <span className="font-semibold leading-tight">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 3: ASSET ALLOCATION */}
            {activeTab === 'assets' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left side: Allocation split table & Reasoning */}
                <div className="lg:col-span-2 space-y-6">
                  
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-5">
                    <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                      <FaChartPie /> Suggested Asset Allocation Splits
                    </h3>
                    
                    {/* Percentages list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {report.allocationData.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-slate-950 p-4 border border-slate-850 rounded-xl">
                          <div className="flex items-center gap-2 font-bold text-slate-350">
                            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span>{item.name}</span>
                          </div>
                          <div className="text-right">
                            <strong className="text-slate-100 text-base">{item.value}%</strong>
                            {item.rupee > 0 && <span className="text-[10px] text-slate-500 block">₹{item.rupee.toLocaleString()}</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 space-y-2 mt-4">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                        <FaLightbulb /> Advisor Reasoning
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {report.allocationReasoning}
                      </p>
                    </div>

                  </div>

                </div>

                {/* Right side: Pie chart rendering */}
                <div className="lg:col-span-1 space-y-6">
                  
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4 text-center">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">Allocation Pie</h3>
                    
                    {/* Recharts Pie */}
                    <div className="h-52 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={report.allocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {report.allocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '11px' }}
                            formatter={(value) => [`${value}%`, 'Target Allocation']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-400">
                      {report.allocationData.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span>{item.name} ({item.value}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 4: MILESTONE CHECKLIST */}
            {activeTab === 'checklist' && (
              <div className="max-w-3xl mx-auto space-y-6">
                
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                  <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                    <FaCheckSquare /> Life-Stage Financial Milestone Checklist
                  </h3>
                  <p className="text-xs text-slate-400">
                    Milestones suggested dynamically for age group **{formData.age < 25 ? '20-25' : formData.age < 30 ? '25-30' : '30-40+'}**. Toggle checkbox items as you achieve them.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {report.ageChecklist.map((item) => {
                      const isChecked = completedItems[item.id];
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleChecklistItem(item.id)}
                          className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                            isChecked 
                              ? 'bg-slate-950/20 border-slate-850/50 text-slate-500 line-through' 
                              : 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-base mt-0.5 text-teal-400 shrink-0">
                            {isChecked ? <FaCheckSquare /> : <FaRegSquare className="text-slate-600" />}
                          </span>
                          <span className="text-xs font-semibold leading-snug">{item.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default Roadmap;
