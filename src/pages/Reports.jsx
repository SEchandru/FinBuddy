import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FaFileAlt, 
  FaPaperPlane, 
  FaExclamationTriangle, 
  FaLightbulb, 
  FaCalendarCheck, 
  FaExternalLinkAlt,
  FaPrint,
  FaCheckCircle,
  FaTimesCircle,
  FaMapSigns
} from 'react-icons/fa';

function Reports() {
  const { user, API_URL } = useAuth();
  
  const [reportData, setReportData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  const [error, setError] = useState('');

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const [repRes, goalRes, portRes] = await Promise.all([
        axios.get(`${API_URL}/reports/monthly`),
        axios.get(`${API_URL}/finance/goals`),
        axios.get(`${API_URL}/finance/portfolio`)
      ]);
      setReportData(repRes.data);
      setGoals(goalRes.data);
      setPortfolio(portRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch report statistics.');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // --- PERSONAL INTELLIGENCE REPORT ENGINE CALCULATIONS ---
  const age = user?.age || 22;
  const monthlySalary = user?.monthlyIncome || 25000;
  const annualIncome = monthlySalary * 12;
  const currentMonthExpenses = reportData?.totalExpenses || 0;
  const actualSavingsRate = monthlySalary > 0 ? ((monthlySalary - currentMonthExpenses) / monthlySalary) * 100 : 0;
  const calculatedSavings = Math.max(0, monthlySalary - currentMonthExpenses);

  const stocksHolding = portfolio.find(p => p.assetType === 'Stocks')?.amount || 0;
  const bondsHolding = portfolio.find(p => p.assetType === 'Bonds')?.amount || 0;
  const goldHolding = portfolio.find(p => p.assetType === 'Gold')?.amount || 0;
  const cashHolding = portfolio.find(p => p.assetType === 'Cash')?.amount || user?.netWorth || 0;

  const currentSavings = cashHolding;
  const currentInvestments = stocksHolding + bondsHolding + goldHolding;
  const totalAssets = stocksHolding + bondsHolding + goldHolding + cashHolding;

  const actualStocksPct = totalAssets > 0 ? Math.round((stocksHolding / totalAssets) * 100) : 0;

  const minEF = Math.round(currentMonthExpenses * 3) || Math.round(monthlySalary * 1.5);
  const recTermIns = monthlySalary * 12 * 10;
  const recHealthIns = age >= 36 ? 1500005 : age >= 26 ? 1000000 : 500000;

  // Lifestage calculation
  let lifestage = 'Foundation Building';
  let stageImportance = 'Critical for developing micro-savings habits, building professional skills, and launching compounding early.';
  if (age >= 26 && age <= 35) {
    lifestage = 'Wealth Building';
    stageImportance = 'Prime compounding decade. Focused on accelerating career growth, mapping life milestones, and tax planning.';
  } else if (age >= 36 && age <= 50) {
    lifestage = 'Asset Accumulation';
    stageImportance = 'Managing children education, home loan liabilities, and building long-term retirement capital reserves.';
  } else if (age > 50) {
    lifestage = 'Wealth Protection';
    stageImportance = 'Nearing retirement. Focus shifts to preserving capital, generating steady monthly income, and inheritance mapping.';
  }

  // Recommended Stocks exposure
  let recommendedStocksPct = 60;
  if (user?.riskProfile?.category === 'Conservative') recommendedStocksPct = 25;
  else if (user?.riskProfile?.category === 'Aggressive') recommendedStocksPct = 80;
  else recommendedStocksPct = Math.max(30, Math.min(70, 110 - age));

  // Health score calculation
  const efScore = currentSavings >= minEF ? 20 : Math.round((currentSavings / (minEF || 1)) * 20);
  const healthPoints = user?.currentHealthIns > 0 ? 10 : 0;
  const termPoints = recTermIns === 0 ? 10 : (user?.currentTermIns >= recTermIns ? 10 : (user?.currentTermIns > 0 ? 5 : 0));
  const insScore = healthPoints + termPoints;
  const savingsRateScore = actualSavingsRate >= 30 ? 15 : (actualSavingsRate >= 20 ? 10 : (actualSavingsRate >= 10 ? 5 : 0));
  const investScore = currentInvestments > 0 ? 15 : 0;
  const debtScore = (user?.loans || 0) === 0 ? 15 : ((user?.loans || 0) < monthlySalary * 6 ? 10 : 5);
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

  // Dynamic Checklist count
  const dynamicChecklist = {
    'Foundation Building': ['cb1', 'cb2', 'cb3', 'cb4', 'cb5', 'cb6', 'cb7', 'cb8'],
    'Wealth Building': ['cb9', 'cb10', 'cb11', 'cb12', 'cb13', 'cb14', 'cb15', 'cb16'],
    'Asset Accumulation': ['cb17', 'cb18', 'cb19', 'cb20', 'cb21', 'cb22', 'cb23'],
    'Wealth Protection': ['cb24', 'cb25', 'cb26', 'cb27', 'cb28', 'cb29']
  }[lifestage];

  const completedChecklist = JSON.parse(localStorage.getItem(`finbuddy_analysis_checklist_${user?.email || 'guest'}`) || '{}');

  // Roadmap milestones progress
  const roadmapMilestones = [
    { status: currentMonthExpenses > 0 },
    { status: currentSavings >= minEF },
    { status: user?.currentHealthIns > 0 },
    { status: currentInvestments > 0 },
    { status: currentSavings >= 25000 },
    { status: (currentSavings + currentInvestments - (user?.loans || 0)) >= 100000 },
    { status: currentInvestments >= 500000 }
  ];
  const completedMilestonesCount = roadmapMilestones.filter(m => m.status).length;
  const roadmapProgress = Math.round((completedMilestonesCount / roadmapMilestones.length) * 100);

  // Strengths & Weaknesses
  const strengths = [];
  const weaknesses = [];
  if (efScore >= 15) strengths.push("Strong emergency cash buffer secured.");
  else weaknesses.push("Low emergency fund leaves you exposed to immediate shocks.");
  if (insScore >= 15) strengths.push("Comprehensive insurance mapping active.");
  else weaknesses.push("Inadequate insurance protection risk.");
  if (savingsRateScore >= 10) strengths.push(`Healthy monthly savings rate (${Math.round(actualSavingsRate)}%).`);
  else weaknesses.push("Low savings rate. Save at least 20% of net salary.");
  if (investScore > 0) strengths.push("Active investment systematic compounders mapped.");
  else weaknesses.push("No compounding assets. Missing stock compounding benefits.");

  const riskCategory = user?.riskProfile?.category || 'Moderate';

  const dynamicPriorities = [
    { title: "Emergency Fund Shield", target: `₹${minEF.toLocaleString()}` },
    { title: "Health Floater Protection", target: `₹5,00,000` },
    { title: "Pure Term Life Cover", target: `₹${(monthlySalary * 240).toLocaleString()}` }
  ];

  const handleSendEmailReport = async () => {
    setEmailLoading(true);
    setEmailResult(null);
    setError('');
    
    try {
      const res = await axios.post(`${API_URL}/reports/send-email`);
      setEmailResult(res.data);
      // Refresh report data to reflect any updated health score
      fetchReportData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error dispatching email report.');
    } finally {
      setEmailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Financial Reports & Automation
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review your spending diagnostics and test the automated Nodemailer email reports.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Manual Trigger Success Details */}
      {emailResult && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FaPaperPlane className="text-sm" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Report Dispatched Successfully!</h3>
              <p className="text-xs text-slate-400">Nodemailer compiled and sent the analysis to your registered email address.</p>
            </div>
          </div>

          {emailResult.previewUrl ? (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Ethereal Mail Sandbox</p>
                <p className="text-xs text-slate-500 mt-1">No custom SMTP was configured, so we generated a browser-friendly inbox review link.</p>
              </div>
              <a
                href={emailResult.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 font-semibold text-xs text-white transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap self-stretch sm:self-auto text-center justify-center"
              >
                Open Email Preview <FaExternalLinkAlt className="text-[10px]" />
              </a>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
              Report sent to your configured custom SMTP servers.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850">
              Identified Alarms: <strong className="text-slate-200">{emailResult.alertsCount}</strong>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850">
              Compiled Recommendations: <strong className="text-slate-200">{emailResult.recommendationsCount}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Columns: Monthly diagnostics */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Spend Summary */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <FaFileAlt className="text-blue-500 text-sm" />
              Diagnostics for {reportData?.monthName} {reportData?.year}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Income</span>
                <div className="text-xl font-bold mt-1 text-slate-200">₹{reportData?.income?.toLocaleString()}</div>
              </div>

              <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Expenses</span>
                <div className="text-xl font-bold mt-1 text-rose-400">₹{reportData?.totalExpenses?.toLocaleString()}</div>
              </div>

              <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Savings</span>
                <div className="text-xl font-bold mt-1 text-emerald-400">₹{reportData?.savings?.toLocaleString()}</div>
              </div>

              <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Savings Rate</span>
                <div className="text-xl font-bold mt-1 text-blue-400">{reportData?.savingsRate?.toFixed(0)}%</div>
              </div>
            </div>
          </div>

          {/* Alerts & Warnings */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-rose-400">
              <FaExclamationTriangle className="text-sm" />
              Active Spending Alarms
            </h2>
            <div className="space-y-3">
              {reportData?.alerts.map((alert, idx) => (
                <div key={idx} className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-xl text-sm text-rose-400 flex items-start gap-2.5">
                  <span className="mt-0.5">🚨</span>
                  <span>{alert}</span>
                </div>
              ))}
              {reportData?.alerts.length === 0 && (
                <div className="text-slate-500 text-sm py-4 text-center">
                  ✅ Budget levels healthy! No overspending anomalies or spikes detected.
                </div>
              )}
            </div>
          </div>

          {/* Actionable Advice */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-violet-400">
              <FaLightbulb className="text-sm" />
              Actionable Recommendations
            </h2>
            <div className="space-y-3">
              {reportData?.recommendations.map((rec, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-300 flex items-start gap-2.5">
                  <span className="mt-0.5">💡</span>
                  <span>{rec}</span>
                </div>
              ))}
              {reportData?.recommendations.length === 0 && (
                <div className="text-slate-500 text-sm py-4 text-center">
                  Maintain your budget constraints.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Panel: Cron and Mail Trigger */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Manual Nodemailer Dispatch */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaPaperPlane className="text-blue-500 text-sm" />
                Trigger Dispatcher
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Clicking the button below manually executes the exact same spending analysis algorithm that the background cron job runs, compiling details and emailing them to you immediately.
              </p>
            </div>

            <button
              onClick={handleSendEmailReport}
              disabled={emailLoading}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-white transition-all shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {emailLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Dispatching...
                </>
              ) : (
                <>
                  <FaPaperPlane className="text-xs" /> Email My Report Now
                </>
              )}
            </button>
          </div>

          {/* Node Cron Job Schedule Detail */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-teal-400">
              <FaCalendarCheck className="text-sm" />
              Cron Automation
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              FinBuddy's scheduled monthly spending reports are managed by a background <strong>node-cron</strong> scheduler.
            </p>

            <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-4 text-center">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Cron Expression</span>
              <code className="text-sm text-teal-400 font-bold block mt-1">0 0 1 * *</code>
              <span className="text-[10px] text-slate-500 mt-2 block">Runs on the 1st of every month at 00:00 (Midnight)</span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              The cron thread continuously evaluates each active user profile, builds diagnostic indicators, and triggers a Nodemailer server thread.
            </p>
          </div>

        </div>

      </div>

      {/* PERSONAL ADVISOR INTEL REPORT SECTION */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 space-y-6 mt-8 print:bg-white print:text-black print:border-black print:p-0">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 print:border-black">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2 print:text-black">
              <FaFileAlt className="text-blue-500 text-sm print:hidden" /> Advisor Personal Intelligence Report
            </h2>
            <p className="text-xs text-slate-400 mt-1 print:text-slate-700">Consolidated financial intelligence parameters audit for age stage guidelines.</p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white transition-all cursor-pointer print:hidden flex items-center gap-1.5"
          >
            <FaPrint /> Print Report
          </button>
        </div>

        {/* 13-point Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-normal">
          {/* Stage */}
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl print:border-black print:bg-white print:text-black">
            <span className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider print:text-slate-550">1. Life Stage</span>
            <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black">{lifestage} Stage</strong>
            <p className="text-[10px] text-slate-400 mt-1 print:text-slate-700">{stageImportance}</p>
          </div>

          {/* Health Score */}
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl print:border-black print:bg-white print:text-black">
            <span className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider print:text-slate-550">2. Health Score</span>
            <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black">{healthScore} / 100</strong>
            <span className="text-[10px] text-emerald-400 block mt-1 font-semibold">{ratingLabel} Status</span>
          </div>

          {/* Risk Profile */}
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl print:border-black print:bg-white print:text-black">
            <span className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider print:text-slate-550">3. Risk Profile</span>
            <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black uppercase">{riskCategory}</strong>
            <p className="text-[10px] text-slate-450 mt-1 print:text-slate-700">{user?.riskProfile?.explanation || 'Moderate investment tolerance profile.'}</p>
          </div>

          {/* Savings Analysis */}
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl print:border-black print:bg-white print:text-black">
            <span className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider print:text-slate-550">4. Savings Analysis</span>
            <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black">Surplus Rate: {Math.round(actualSavingsRate)}%</strong>
            <span className="text-[10px] text-slate-450 block mt-1 print:text-slate-700">Monthly savings: ₹{(calculatedSavings).toLocaleString()}</span>
          </div>

          {/* Investment Analysis */}
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl print:border-black print:bg-white print:text-black">
            <span className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider print:text-slate-550">5. Investment Analysis</span>
            <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black">Assets: ₹{currentInvestments.toLocaleString()}</strong>
            <span className="text-[10px] text-slate-450 block mt-1 print:text-slate-700">SIP Status: {currentInvestments > 0 ? 'Compounding active' : 'No investments logged'}</span>
          </div>

          {/* Insurance Analysis */}
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl print:border-black print:bg-white print:text-black">
            <span className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider print:text-slate-550">6. Insurance Coverage</span>
            <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black">Gaps Score: {insScore}/20</strong>
            <span className="text-[10px] text-slate-450 block mt-1 print:text-slate-700">Health cover: {user?.currentHealthIns > 0 ? `₹${(user.currentHealthIns).toLocaleString()}` : 'Missing'}</span>
          </div>

          {/* Checklist Completion */}
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl print:border-black print:bg-white print:text-black">
            <span className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider print:text-slate-550">7. Checklist completion</span>
            <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black">
              {Object.values(completedChecklist).filter(Boolean).length} / {dynamicChecklist.length} Milestones
            </strong>
            <span className="text-[10px] text-slate-450 block mt-1 print:text-slate-700">Life stage milestones checked.</span>
          </div>

          {/* Asset Allocation */}
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl print:border-black print:bg-white print:text-black">
            <span className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider print:text-slate-550">8. Asset Allocation Audit</span>
            <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black">Stocks Exposure: {actualStocksPct}%</strong>
            <span className="text-[10px] text-slate-450 block mt-1 print:text-slate-700">Target recommended equity: {recommendedStocksPct}%</span>
          </div>

          {/* Roadmap Progress */}
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl print:border-black print:bg-white print:text-black">
            <span className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider print:text-slate-550">9. Roadmap Progress</span>
            <strong className="text-sm font-bold text-slate-200 block mt-1 print:text-black">{roadmapProgress}% Completed</strong>
            <span className="text-[10px] text-slate-450 block mt-1 print:text-slate-700">{completedMilestonesCount} out of 7 milestones met.</span>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-normal">
          <div className="bg-slate-950 p-5 border border-slate-850 rounded-xl print:border-black print:bg-white print:text-black">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 print:text-black">
              <FaCheckCircle className="print:hidden" /> 10. Key Strengths
            </h4>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-350 mt-2 font-medium print:text-black">
              {strengths.map((s, idx) => <li key={idx}>{s}</li>)}
              {strengths.length === 0 && <li>Ensure Emergency Fund reserves are active to log strengths.</li>}
            </ul>
          </div>

          <div className="bg-slate-950 p-5 border border-slate-850 rounded-xl">
            <h4 className="text-sm font-bold text-rose-400 flex items-center gap-1.5 print:text-black">
              <FaTimesCircle className="print:hidden" /> 11. Core Deficits
            </h4>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-305 mt-2 font-medium print:text-black">
              {weaknesses.map((w, idx) => <li key={idx} className="text-rose-300 print:text-black"><span className="text-slate-350 print:text-black">{w}</span></li>)}
              {weaknesses.length === 0 && <li className="text-emerald-400 font-bold">Zero immediate security deficits identified!</li>}
            </ul>
          </div>
        </div>

        {/* Priorities & Action Plan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-normal">
          <div className="bg-slate-950 p-5 border border-slate-850 rounded-xl print:border-black print:bg-white print:text-black">
            <h4 className="text-sm font-bold text-blue-400 flex items-center gap-1.5 print:text-black">
              <FaMapSigns className="print:hidden" /> 12. Top Advisors Priorities
            </h4>
            <div className="space-y-2 mt-2">
              {dynamicPriorities.slice(0, 3).map((pri, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-855 last:border-0 font-semibold print:border-black">
                  <span className="text-slate-300 print:text-black">{idx + 1}. {pri.title}</span>
                  <strong className="text-slate-100 print:text-black">{pri.target}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-3 print:border-black print:bg-white print:text-black">
            <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-1.5 print:text-black">
              <FaLightbulb className="print:hidden" /> 13. Action Plan
            </h4>
            <div className="space-y-1.5 text-[11px] leading-relaxed font-medium">
              <p className="font-semibold text-slate-250 print:text-black">System Wealth Optimizer Recommendations:</p>
              <p className="text-slate-400 print:text-slate-700">
                To achieve peak financial stability, establish your emergency buffer pot (₹{minEF.toLocaleString()}) and obtain an individual floater healthcare cover immediately.
              </p>
              <p className="text-slate-400 print:text-slate-700">
                Then, implement pure term coverage (20x annual salary) and step up index mutual fund equity SIPs by 10% annually.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Reports;