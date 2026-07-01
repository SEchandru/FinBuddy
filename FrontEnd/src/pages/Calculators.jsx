import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FaCalculator, 
  FaSearch, 
  FaStar, 
  FaRegStar, 
  FaBookmark, 
  FaRegBookmark, 
  FaHistory, 
  FaTimes, 
  FaArrowLeft, 
  FaArrowRight, 
  FaInfoCircle, 
  FaLightbulb, 
  FaUserCircle, 
  FaChartLine 
} from 'react-icons/fa';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from 'recharts';

// ==========================================
// 20 FINANCIAL RULES DATA
// ==========================================
const RULES = [
  {
    id: 'r1',
    name: '50-30-20 Rule',
    category: 'budgeting',
    shortDesc: 'Divide post-tax income into Needs (50%), Wants (30%), and Savings (20%).',
    explanation: 'A classic, simple budgeting guideline that ensures you cover living essentials, enjoy your lifestyle, and build long-term wealth without granular line-item tracking.',
    whyImportant: 'Provides a balanced lifestyle, prevents lifestyle bloat, and establishes a mandatory savings baseline.',
    formula: 'Needs (50%) + Wants (30%) + Savings & Investments (20%) = 100% of Net Income',
    example: 'If your net salary is ₹60,000: Spend ₹30,000 on Needs (rent, bills), ₹18,000 on Wants (dining out, hobby), and invest ₹12,000.',
    advantages: ['Easy to maintain long-term', 'Prioritizes saving rate', 'Keeps luxury expenses in check'],
    whenToUse: 'Excellent for salary freshers, college students, and anyone overwhelmed by complex budgets.',
    tips: ['Automate your 20% savings first.', 'Review subscriptions monthly to trim Wants.', 'Rent, health cover, and credit card minimums are Needs.']
  },
  {
    id: 'r2',
    name: '70-20-10 Rule',
    category: 'budgeting',
    shortDesc: 'Allocate 70% to living costs, 20% to savings, and 10% to debt clearance.',
    explanation: 'Designed specifically for individuals carrying active debt liabilities, ensuring they actively pay off credit cards or personal loans while still saving.',
    whyImportant: 'Prevents debt from compounding out of control while ensuring your investment portfolio continues to grow.',
    formula: 'Expenses (70%) + Savings (20%) + Debt Repayment (10%) = 100% of Income',
    example: 'On an income of ₹80,000: Spend ₹56,000 on living expenses, invest ₹16,000, and dedicate ₹8,000 to paying off credit card debt.',
    advantages: ['Balances debt payoff and wealth creation', 'Sets realistic boundaries for spending', 'Helps improve credit score'],
    whenToUse: 'When you are carrying active high-interest credit card debt or personal loans.',
    tips: ['Use the 10% debt allocation as extra principal payments.', 'If debt is cleared, transition the 10% to savings.']
  },
  {
    id: 'r3',
    name: '70-10-10-10 Rule',
    category: 'budgeting',
    shortDesc: 'Allocate 70% to expenses, 10% to investments, 10% to savings, and 10% to skills.',
    explanation: 'An advanced allocation strategy that splits your savings into long-term investments, short-term goals, and skill/career development.',
    whyImportant: 'Puts a premium on personal development and skill growth as the ultimate compounding engine.',
    formula: 'Living (70%) + Long-term Invest (10%) + Short-term Save (10%) + Skill/Debt (10%)',
    example: 'Income of ₹1,00,000: ₹70,000 living expenses, ₹10,000 retirement funds, ₹10,000 vacation fund, ₹10,000 on professional courses/books.',
    advantages: ['Focuses on increasing earning potential', 'Ensures separate buckets for goals', 'Balanced and structured'],
    whenToUse: 'Ideal for young professionals, freelancers, and growth-oriented freshers.',
    tips: ['Use the 10% skill allocation for certifications, books, gym memberships, or side-hustle seeds.']
  },
  {
    id: 'r4',
    name: 'Save Before You Spend',
    category: 'budgeting',
    shortDesc: 'Treat savings as a mandatory expense before planning any other outflows.',
    explanation: 'Also known as "Pay Yourself First." Instead of saving what is left after spending, you spend what is left after saving.',
    whyImportant: 'Forces savings discipline. Dis discretionary expenses naturally contract to fit the remaining cash.',
    formula: 'Spendable Income = Total Income - Target Savings',
    example: 'Upon receiving ₹50,000 salary, transfer ₹10,000 immediately to an investment account. Budget all monthly needs and wants from the remaining ₹40,000.',
    advantages: ['Guarantees you meet savings targets', 'Reduces impulse buying', 'Automates financial freedom'],
    whenToUse: 'A universal habit that should be applied at all income levels.',
    tips: ['Set up auto-debits on your salary day.', 'Keep savings accounts separate from your daily transactional cards.']
  },
  {
    id: 'r5',
    name: 'Needs vs Wants Rule',
    category: 'budgeting',
    shortDesc: 'Classify expenses strictly: Needs are survival essentials; Wants are lifestyle upgrades.',
    explanation: 'Requires analyzing every purchase. Needs are essential for health and livelihood. Wants can be delayed or removed entirely.',
    whyImportant: 'Prevents lifestyle inflation. Helps quickly cut spending during financial emergencies.',
    formula: 'Expense Classification = [Essential (Need) | Discretionary (Want)]',
    example: 'Rent, groceries, health insurance, power bills = Needs. Fine dining, Netflix, branded clothing, vacation = Wants.',
    advantages: ['Builds strong money consciousness', 'Uncovers hidden leaks in spending', 'Ensures financial stability'],
    whenToUse: 'When your savings rates are dropping or you are struggling to make ends meet.',
    tips: ['Wait 48 hours before purchasing any item classified as a Want.', 'Audit subscription bills every quarter.']
  },
  {
    id: 'r6',
    name: 'Avoid Lifestyle Inflation',
    category: 'budgeting',
    shortDesc: 'When income increases, save at least 50% of the raise before increasing expenses.',
    explanation: 'Lifestyle inflation occurs when your expenses rise alongside your income, keeping you in a paycheck-to-paycheck cycle despite earning more.',
    whyImportant: 'Accelerates financial independence. Allows you to enjoy your success while building wealth rapidly.',
    formula: 'New Savings Rate = Old Savings + (Salary Raise * 0.50)',
    example: 'If your monthly salary increases by ₹10,000: Put ₹5,000 into investments and allow yourself to spend the other ₹5,000 on lifestyle upgrades.',
    advantages: ['Avoids the golden handcuffs trap', 'Accelerates savings velocity', 'Promotes sustainable happiness'],
    whenToUse: 'Whenever you receive a promotion, bonus, salary increment, or side-gig revenue.',
    tips: ['Immediately set up a new auto-debit equal to half the raise amount on day one of your increment.']
  },
  {
    id: 'r7',
    name: 'Emergency Fund Rule',
    category: 'debt',
    shortDesc: 'Maintain 3 to 6 months of absolute living expenses in highly liquid cash reserves.',
    explanation: 'A financial shield to cover food, rent, and essential needs during sudden job loss, medical emergencies, or market recessions.',
    whyImportant: 'Avoids liquidating long-term stock investments at a loss or taking high-interest personal loans during emergencies.',
    formula: 'Emergency Reserve = Monthly Expenses * [3 to 6 Months]',
    example: 'If your essential needs cost ₹30,000/month: Keep ₹90,000 (minimum) to ₹1,800,000 (ideal) in high-yield liquid savings accounts or sweep FDs.',
    advantages: ['Peace of mind', 'Protects compounding investments', 'Prevents predatory debt traps'],
    whenToUse: 'The very first cornerstone of any personal finance roadmap.',
    tips: ['Keep this fund in a separate bank account without a debit card attached to avoid daily spending temptations.']
  },
  {
    id: 'r8',
    name: 'Rule of 72',
    category: 'investment',
    shortDesc: 'Divide 72 by the return rate to find years needed to double your money.',
    explanation: 'A quick mathematical formula to calculate the time required for an investment to double in value at a constant compounding interest rate.',
    whyImportant: 'Helps evaluate if an investment return rate is sufficient to meet your timeline goals.',
    formula: 'Years to Double = 72 / Annual Interest Rate',
    example: 'At a 12% mutual fund return, your capital will double in: 72 / 12 = 6 Years.',
    advantages: ['No complex logarithms required', 'Instant mental calculation', 'Accurate for rates between 4% and 20%'],
    whenToUse: 'When comparing different investment options (e.g. FDs vs Mutual Funds).',
    tips: ['Always use the real post-tax rate of return for accurate calculations.']
  },
  {
    id: 'r9',
    name: 'Rule of 114',
    category: 'investment',
    shortDesc: 'Divide 114 by the return rate to find years needed to triple your money.',
    explanation: 'Calculates the years needed to grow an initial capital outlay by 300% (triple) at a given compound interest rate.',
    whyImportant: 'Useful for mid-to-long-term wealth calculations.',
    formula: 'Years to Triple = 114 / Annual Interest Rate',
    example: 'At a 10% rate, your money triples in: 114 / 10 = 11.4 Years.',
    advantages: ['Simplifies multi-decade compounding projections'],
    whenToUse: 'Planning child education funds or home purchases.',
    tips: ['Combine with the Rule of 72 to visualize compounding curve speed.']
  },
  {
    id: 'r10',
    name: 'Rule of 144',
    category: 'investment',
    shortDesc: 'Divide 144 by the return rate to find years needed to quadruple your money.',
    explanation: 'Calculates how long it takes for your investment to quadruple (4x) in value at a constant compounding return.',
    whyImportant: 'Shows the dramatic acceleration of compound interest in later stages.',
    formula: 'Years to Quadruple = 144 / Annual Interest Rate',
    example: 'At a 12% return rate, your investment will grow 4x in: 144 / 12 = 12 Years.',
    advantages: ['Perfect for long-term retirement calculations.'],
    whenToUse: 'Evaluating equity mutual funds over a 10-15 year horizon.',
    tips: ['Notice that while doubling takes 6 years (at 12%), quadrupling takes 12 years (double the time for 4x return).']
  },
  {
    id: 'r11',
    name: '100 Minus Age Rule',
    category: 'investment',
    shortDesc: 'Equity Allocation % = 100 - Your Age. Remaining in Debt/Bonds.',
    explanation: 'A classic asset allocation guide where your equity exposure decreases as you get older, protecting accumulated capital.',
    whyImportant: 'Balances growth (equity) in youth with capital preservation (debt) in retirement.',
    formula: 'Equity Target % = 100 - Age; Debt/Bonds % = Age',
    example: 'If you are 25 years old: Invest 75% in Stocks/Equity and 25% in Debt/Fixed Income.',
    advantages: ['Simple rebalancing benchmark', 'Reduces portfolio risk profile over time'],
    whenToUse: 'Designing your annual asset allocation rebalancing plan.',
    tips: ['If you have a high risk appetite, use "110 Minus Age" or "120 Minus Age" instead.']
  },
  {
    id: 'r12',
    name: 'Diversification Rule',
    category: 'investment',
    shortDesc: 'Spread investments across Equity, Debt, Gold, and Cash. Never concentrate.',
    explanation: 'Asset classes react differently to market conditions. Diversification protects your overall net worth from sharp drops in a single sector.',
    whyImportant: 'Reduces risk without compromising long-term compound growth.',
    formula: 'Portfolio Risk = f(Asset Correlation)',
    example: 'Instead of putting 100% in stocks, hold 65% Equity, 20% Debt, 10% Gold, and 5% Cash.',
    advantages: ['Lowers overall portfolio volatility', 'Ensures liquidity during market crashes'],
    whenToUse: 'Always, when setting up long-term investment portfolios.',
    tips: ['Rebalance your asset weights once a year to lock in gains and buy assets at a discount.']
  },
  {
    id: 'r13',
    name: 'Compound Interest Principle',
    category: 'investment',
    shortDesc: 'Reinvest all gains. Time in the market beats timing the market.',
    explanation: 'Earning interest on interest. The longer your money stays invested, the steeper the exponential wealth creation curve becomes.',
    whyImportant: 'The single most powerful wealth accelerator. Small contributions grow massive over decades.',
    formula: 'Future Value = Principal * (1 + r/n)^(n*t)',
    example: 'Investing ₹10,000 monthly for 15 years yields ₹50 Lakhs (at 12%). Sticking it out for another 5 years grows it to ₹1 Crore (doubles in last 5 years!).',
    advantages: ['Dramatically amplifies small regular savings', 'Requires no daily tracking'],
    whenToUse: 'Start as early as possible. Time is the key variable.',
    tips: ['Never stop mutual fund SIPs during a market crash. That is when you buy cheapest.']
  },
  {
    id: 'r14',
    name: 'Retirement Corpus Rule',
    category: 'retirement',
    shortDesc: 'Target a retirement fund equal to at least 20 times your annual income.',
    explanation: 'A benchmark to estimate when you are financially ready to retire. Using a 4-5% safe withdrawal rate, this corpus funds your lifestyle indefinitely.',
    whyImportant: 'Ensures you do not run out of money in your post-work years.',
    formula: 'Retirement Target = Annual Expenses * 25 (or Annual Income * 20)',
    example: 'If your annual expenses are ₹6,00,000: Target a liquid retirement corpus of ₹1.5 Crore.',
    advantages: ['Gives a clear target milestone', 'Safeguards against post-retirement inflation'],
    whenToUse: 'Planning your long-term retirement goal contributions.',
    tips: ['Factor in inflation. A target of ₹1 Crore today will need to be higher in 20 years.']
  },
  {
    id: 'r15',
    name: 'Pay Yourself First Rule',
    category: 'budgeting',
    shortDesc: 'Direct money to savings, emergency, and loans before buying groceries/needs.',
    explanation: 'Reversing the typical cashflow: Income -> Spend -> Save becomes Income -> Save -> Spend. It automates financial success.',
    whyImportant: 'Guarantees savings targets are hit before lifestyle creeping takes over.',
    formula: 'Savings Transfer -> Fixed Expenses -> Discretionary',
    example: 'Set up automatic SIP transfers on your salary day before allocating credit cards for retail shopping.',
    advantages: ['Forces budget discipline', 'Removes transaction friction'],
    whenToUse: 'Monthly salary credit cycles.',
    tips: ['Use auto-sweep accounts to earn interest on unused transactional margins automatically.']
  },
  {
    id: 'r16',
    name: 'High Interest Debt First Rule',
    category: 'debt',
    shortDesc: 'Prioritize paying credit cards and personal loans before low-rate home loans.',
    explanation: 'Also known as the Debt Avalanche method. High-interest debt compounds quickly, so paying it off saves the most interest.',
    whyImportant: 'Saves you money. High-interest debts (36-40% APR on credit cards) erode wealth faster than investments grow.',
    formula: 'Debt Queue = Sorted by Annual Percentage Rate (APR) Descending',
    example: 'Pay off a credit card debt (38% APR) aggressively while paying only the minimum EMI on your student loan (8% APR).',
    advantages: ['Minimizes total interest paid', 'Shorter path to becoming debt-free'],
    whenToUse: 'When managing multiple loan liabilities.',
    tips: ['Cut up credit cards until your balances are completely cleared.']
  },
  {
    id: 'r17',
    name: '20X Term Insurance Rule',
    category: 'insurance',
    shortDesc: 'Life insurance coverage should be 20 times your annual income.',
    explanation: 'Provides a secure safety net for your family. If the policyholder passes away, the sum assured can yield replacement income.',
    whyImportant: 'Protects dependents from debt liabilities and secures their lifestyle.',
    formula: 'Term Life Coverage = Annual Income * 20 + Outstanding Debts',
    example: 'If you earn ₹10 Lakhs annually and have a home loan of ₹30 Lakhs: Buy a term cover of ₹2.3 Crores.',
    advantages: ['High coverage for a low premium', 'Peace of mind for family support'],
    whenToUse: 'Buy as soon as you have dependents or outstanding debts.',
    tips: ['Choose pure term insurance. Avoid investment-linked plans (ULIPs/Endowments) which offer low returns and low coverage.']
  },
  {
    id: 'r18',
    name: 'Avoid Depreciating Debt Rule',
    category: 'debt',
    shortDesc: 'Never take loans to purchase luxury goods, gadgets, or holiday packages.',
    explanation: 'Consumer goods lose value immediately. Financing them with interest means you pay double for an asset that is worth half.',
    whyImportant: 'Prevents consumer debt traps. Promotes mindful spending.',
    formula: 'Asset Value Trend = Negative -> Interest Rate should be 0 (Save and Buy instead)',
    example: 'Do not buy a ₹1,00,000 phone on high-interest EMI. Save ₹10,000 monthly for 10 months and buy it in cash.',
    advantages: ['Keeps your cash flow flexible', 'Avoids credit score damage'],
    whenToUse: 'When shopping online or tempted by "no-cost" EMI offers.',
    tips: ['If you cannot buy it twice in cash, you cannot afford it.']
  },
  {
    id: 'r19',
    name: 'Full Credit Card Payment Rule',
    category: 'debt',
    shortDesc: 'Always pay the total outstanding due. Never pay only the "Minimum Due".',
    explanation: 'Paying the minimum due keeps the card active but accrues interest (up to 42% annually) on the remaining balance and all new purchases.',
    whyImportant: 'Avoids credit traps. Protects your credit history and score.',
    formula: 'Payment Amount = Total Outstanding Balance',
    example: 'If bill is ₹15,000 and minimum due is ₹750: Pay the full ₹15,000. Do not pay ₹750.',
    advantages: ['Zero interest payments', 'Maximizes reward points value'],
    whenToUse: 'Monthly credit bill cycles.',
    tips: ['Set up auto-pay for the "Total Due Amount" to never miss a cycle.']
  },
  {
    id: 'r20',
    name: 'Financial Literacy First Rule',
    category: 'insurance',
    shortDesc: 'Understand an investment completely before putting your money in.',
    explanation: 'Never invest in products suggested by agents or influencers without verifying features, lock-ins, taxes, and fees.',
    whyImportant: 'Avoids financial scams, low-yield locks, and capital loss.',
    formula: 'Investment Decision = Risk Profile Check + Expense Ratio Check + Goal Alignment',
    example: 'Do not buy crypto or complex derivatives if you do not understand blockchain or option Greeks.',
    advantages: ['Protects principal capital', 'Develops independent thinking'],
    whenToUse: 'Every single time you are looking to place capital.',
    tips: ['If an adviser cannot explain it in three simple sentences, do not buy it.']
  }
];

// ==========================================
// 20 FINANCIAL CALCULATORS DATA
// ==========================================
const CALCULATORS = [
  { id: 'c1', name: 'SIP Calculator', icon: '📈', category: 'investment', desc: 'Calculate the future value of monthly mutual fund investments.' },
  { id: 'c2', name: 'Lumpsum Calculator', icon: '💰', category: 'investment', desc: 'Calculate wealth growth for one-time compound investments.' },
  { id: 'c3', name: 'EMI Calculator', icon: '🏠', category: 'debt', desc: 'Compute monthly payments, total interest, and payoffs for loans.' },
  { id: 'c4', name: 'FD Calculator', icon: '🏦', category: 'investment', desc: 'Fixed Deposit compound return calculator with quarterly interest.' },
  { id: 'c5', name: 'RD Calculator', icon: '📆', category: 'investment', desc: 'Recurring Deposit maturity planner.' },
  { id: 'c6', name: 'Compound Interest Calculator', icon: '🔄', category: 'investment', desc: 'Granular compounding explorer (monthly, quarterly, annually).' },
  { id: 'c7', name: 'Goal Planner Calculator', icon: '🎯', category: 'investment', desc: 'Calculate monthly savings needed to hit a target milestone value.' },
  { id: 'c8', name: 'Emergency Fund Calculator', icon: '🛡️', category: 'debt', desc: 'Compute emergency cash targets and coverage sizes.' },
  { id: 'c9', name: 'Retirement Calculator', icon: '👴', category: 'retirement', desc: 'Calculate inflation-adjusted retirement corpus requirements.' },
  { id: 'c10', name: 'Inflation Calculator', icon: '🎈', category: 'budgeting', desc: 'Evaluate how purchasing power decays over time.' },
  { id: 'c11', name: 'Net Worth Calculator', icon: '⚖️', category: 'budgeting', desc: 'Sum your assets and subtract liabilities.' },
  { id: 'c12', name: 'Budget Planner Calculator', icon: '📋', category: 'budgeting', desc: 'Evaluate your cash flows against 50/30/20 parameters.' },
  { id: 'c13', name: 'Savings Rate Calculator', icon: '📊', category: 'budgeting', desc: 'Determine your monthly net savings efficiency.' },
  { id: 'c14', name: 'Debt Payoff Calculator', icon: '💣', category: 'debt', desc: 'Simulate debt payoff schedules using avalanche principal.' },
  { id: 'c15', name: 'Financial Independence Calculator', icon: '🔓', category: 'retirement', desc: 'Calculate your FIRE number (Financial Independence Retire Early).' },
  { id: 'c16', name: 'Insurance Need Calculator', icon: '☂️', category: 'insurance', desc: 'Calculate life term coverage requirements using 20x annual income.' },
  { id: 'c17', name: 'Rule of 72 Calculator', icon: '✖️2', category: 'investment', desc: 'Years needed to double capital.' },
  { id: 'c18', name: 'Rule of 114 Calculator', icon: '✖️3', category: 'investment', desc: 'Years needed to triple capital.' },
  { id: 'c19', name: 'Rule of 144 Calculator', icon: '✖️4', category: 'investment', desc: 'Years needed to quadruple capital.' },
  { id: 'c20', name: 'Asset Allocation Calculator', icon: '📊', category: 'investment', desc: 'Target portfolio balances using 100-age rules.' }
];

function Calculators() {
  const { user } = useAuth();
  
  const [activeSection, setActiveSection] = useState('rules'); // 'rules' or 'calculators'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Bookmarks & Favorites & History (Stored in LocalStorage)
  const [bookmarkedRules, setBookmarkedRules] = useState(() => {
    const bookmarks = localStorage.getItem('finbuddy_bookmarked_rules');
    return bookmarks ? JSON.parse(bookmarks) : [];
  });
  const [favoriteCalculators, setFavoriteCalculators] = useState(() => {
    const favs = localStorage.getItem('finbuddy_favorite_calculators');
    return favs ? JSON.parse(favs) : [];
  });
  const [recentCalculators, setRecentCalculators] = useState(() => {
    const recents = localStorage.getItem('finbuddy_recent_calculators');
    return recents ? JSON.parse(recents) : [];
  });
  
  // Modals / Detail triggers
  const [selectedRule, setSelectedRule] = useState(null);
  const [activeCalcId, setActiveCalcId] = useState(null);

  // Dynamic Calculator Input State
  const [calcInputs, setCalcInputs] = useState({});

  const toggleBookmark = (ruleId, e) => {
    e.stopPropagation();
    let updated;
    if (bookmarkedRules.includes(ruleId)) {
      updated = bookmarkedRules.filter(id => id !== ruleId);
    } else {
      updated = [...bookmarkedRules, ruleId];
    }
    setBookmarkedRules(updated);
    localStorage.setItem('finbuddy_bookmarked_rules', JSON.stringify(updated));
  };

  const toggleFavorite = (calcId, e) => {
    e.stopPropagation();
    let updated;
    if (favoriteCalculators.includes(calcId)) {
      updated = favoriteCalculators.filter(id => id !== calcId);
    } else {
      updated = [...favoriteCalculators, calcId];
    }
    setFavoriteCalculators(updated);
    localStorage.setItem('finbuddy_favorite_calculators', JSON.stringify(updated));
  };

  const addRecentHistory = (calcId) => {
    let updated = [calcId, ...recentCalculators.filter(id => id !== calcId)];
    // Cap history size at 5 items
    updated = updated.slice(0, 5);
    setRecentCalculators(updated);
    localStorage.setItem('finbuddy_recent_calculators', JSON.stringify(updated));
  };

  // Triggered when opening a calculator
  const openCalculator = (calcId) => {
    addRecentHistory(calcId);
    
    // Seed default inputs based on calculator type
    const defaultInputs = {};
    if (calcId === 'c1') { defaultInputs.monthly = 5000; defaultInputs.rate = 12; defaultInputs.years = 15; }
    else if (calcId === 'c2') { defaultInputs.lumpsum = 50000; defaultInputs.rate = 12; defaultInputs.years = 10; }
    else if (calcId === 'c3') { defaultInputs.loan = 1500000; defaultInputs.rate = 8.5; defaultInputs.years = 15; }
    else if (calcId === 'c4') { defaultInputs.deposit = 100000; defaultInputs.rate = 7.1; defaultInputs.years = 5; }
    else if (calcId === 'c5') { defaultInputs.monthly = 5000; defaultInputs.rate = 6.8; defaultInputs.years = 3; }
    else if (calcId === 'c6') { defaultInputs.principal = 10000; defaultInputs.rate = 12; defaultInputs.years = 10; defaultInputs.freq = '12'; }
    else if (calcId === 'c7') { defaultInputs.target = 500000; defaultInputs.rate = 12; defaultInputs.years = 5; }
    else if (calcId === 'c8') { defaultInputs.expenses = 30000; defaultInputs.months = 6; }
    else if (calcId === 'c9') { defaultInputs.age = 25; defaultInputs.retAge = 60; defaultInputs.expenses = 40000; defaultInputs.inflation = 6; }
    else if (calcId === 'c10') { defaultInputs.amount = 10000; defaultInputs.inflation = 6; defaultInputs.years = 10; }
    else if (calcId === 'c11') { defaultInputs.cash = 100000; defaultInputs.invest = 300000; defaultInputs.property = 0; defaultInputs.debt = 50000; }
    else if (calcId === 'c12') { defaultInputs.income = 60000; defaultInputs.needs = 35000; defaultInputs.wants = 15000; }
    else if (calcId === 'c13') { defaultInputs.income = 60000; defaultInputs.savings = 15000; }
    else if (calcId === 'c14') { defaultInputs.debt = 100000; defaultInputs.monthly = 8000; defaultInputs.rate = 14; }
    else if (calcId === 'c15') { defaultInputs.expenses = 400000; defaultInputs.savings = 1200000; defaultInputs.swr = 4; }
    else if (calcId === 'c16') { defaultInputs.income = 800000; defaultInputs.liabilities = 2000000; defaultInputs.savings = 500000; }
    else if (calcId === 'c17') { defaultInputs.rate = 12; }
    else if (calcId === 'c18') { defaultInputs.rate = 12; }
    else if (calcId === 'c19') { defaultInputs.rate = 12; }
    else if (calcId === 'c20') { defaultInputs.age = 28; defaultInputs.risk = 'moderate'; }

    setCalcInputs(defaultInputs);
    setActiveCalcId(calcId);
  };

  const handleInputChange = (key, val) => {
    setCalcInputs({ ...calcInputs, [key]: val });
  };

  // Filter and search lists
  const filteredRules = RULES.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rule.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || rule.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredCalculators = CALCULATORS.filter(calc => {
    const matchesSearch = calc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          calc.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || calc.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  // Smart advice & age allocations details based on auth profile
  const userAge = user?.age || 22;
  const userRisk = user?.riskProfile?.category || 'Moderate';
  
  // 100 minus age calculation for smart suggestions
  const suggestedEquity = Math.max(20, Math.min(80, 100 - userAge));
  const suggestedGold = 5;
  const suggestedCash = 10;
  const suggestedBonds = Math.max(5, 100 - (suggestedEquity + suggestedGold + suggestedCash));

  // ==========================================
  // CALCULATOR EVALUATIONS ENGINE
  // ==========================================
  const evaluateCalculator = (id) => {
    const vals = calcInputs;
    let resultText = '';
    let insightText = '';
    let recommendationText = '';
    let progress = 50;
    let chartData = [];

    switch (id) {
      case 'c1': { // SIP
        const p = parseFloat(vals.monthly) || 0;
        const r = (parseFloat(vals.rate) || 0) / 12 / 100;
        const n = (parseFloat(vals.years) || 0) * 12;
        if (p > 0 && r > 0 && n > 0) {
          const fv = p * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
          const invested = p * n;
          const gains = fv - invested;
          resultText = `₹${Math.round(fv).toLocaleString()}`;
          insightText = `You invest ₹${invested.toLocaleString()} over ${vals.years} years. Your estimated wealth gains are ₹${Math.round(gains).toLocaleString()}.`;
          recommendationText = `Increasing your monthly SIP by just 10% each year (Step-up SIP) can potentially boost your final corpus by over 40%!`;
          progress = Math.min(100, Math.round((invested / fv) * 100));
          chartData = [
            { name: 'Total Invested', value: Math.round(invested) },
            { name: 'Estimated Gain', value: Math.round(gains) }
          ];
        }
        break;
      }
      case 'c2': { // Lumpsum
        const p = parseFloat(vals.lumpsum) || 0;
        const r = (parseFloat(vals.rate) || 0) / 100;
        const t = parseFloat(vals.years) || 0;
        if (p > 0 && r > 0 && t > 0) {
          const fv = p * Math.pow(1 + r, t);
          const gains = fv - p;
          resultText = `₹${Math.round(fv).toLocaleString()}`;
          insightText = `A single deposit of ₹${p.toLocaleString()} grows by ₹${Math.round(gains).toLocaleString()} due to compounding return.`;
          recommendationText = `Compound growth is exponential. Delaying your investment by just 5 years can cut your final maturity corpus in half.`;
          progress = Math.min(100, Math.round((p / fv) * 100));
          chartData = [
            { name: 'Principal', value: Math.round(p) },
            { name: 'Wealth Growth', value: Math.round(gains) }
          ];
        }
        break;
      }
      case 'c3': { // EMI
        const p = parseFloat(vals.loan) || 0;
        const r = (parseFloat(vals.rate) || 0) / 12 / 100;
        const n = (parseFloat(vals.years) || 0) * 12;
        if (p > 0 && r > 0 && n > 0) {
          const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
          const totalPaid = emi * n;
          const totalInterest = totalPaid - p;
          resultText = `₹${Math.round(emi).toLocaleString()} / month`;
          insightText = `Total repayable over tenure: ₹${Math.round(totalPaid).toLocaleString()}. Total interest component: ₹${Math.round(totalInterest).toLocaleString()}.`;
          recommendationText = `Paying just one extra EMI per year, or increasing payments by 5% annually, can cut your loan tenure down by 4+ years and save lakhs in interest payments.`;
          progress = Math.min(100, Math.round((p / totalPaid) * 100));
          chartData = [
            { name: 'Principal Loan Amount', value: Math.round(p) },
            { name: 'Total Interest Due', value: Math.round(totalInterest) }
          ];
        }
        break;
      }
      case 'c4': { // FD
        const p = parseFloat(vals.deposit) || 0;
        const r = (parseFloat(vals.rate) || 0) / 100;
        const t = parseFloat(vals.years) || 0;
        if (p > 0 && r > 0 && t > 0) {
          // Quarterly compound standard
          const fv = p * Math.pow(1 + r/4, 4*t);
          const interest = fv - p;
          resultText = `₹${Math.round(fv).toLocaleString()}`;
          insightText = `Total interest earned: ₹${Math.round(interest).toLocaleString()}.`;
          recommendationText = `While Fixed Deposits offer safe and guaranteed returns, their real post-inflation returns are often near zero. Reallocate some non-emergency capital to equities.`;
          progress = Math.min(100, Math.round((p / fv) * 100));
          chartData = [
            { name: 'Invested Principal', value: Math.round(p) },
            { name: 'Maturity Interest', value: Math.round(interest) }
          ];
        }
        break;
      }
      case 'c5': { // RD
        const p = parseFloat(vals.monthly) || 0;
        const r = (parseFloat(vals.rate) || 0) / 100;
        const t = parseFloat(vals.years) || 0;
        const n = t * 12;
        if (p > 0 && r > 0 && n > 0) {
          // RD compound maturity formula
          const monthlyRate = r / 12;
          let fv = 0;
          for (let i = 1; i <= n; i++) {
            fv += p * Math.pow(1 + monthlyRate, n - i + 1);
          }
          const invested = p * n;
          const interest = fv - invested;
          resultText = `₹${Math.round(fv).toLocaleString()}`;
          insightText = `Invested amount: ₹${invested.toLocaleString()}. Total interest: ₹${Math.round(interest).toLocaleString()}.`;
          recommendationText = `RDs are perfect for building discipline to buy short-term wants (e.g. buying a laptop or planning a holiday in 2 years).`;
          progress = Math.min(100, Math.round((invested / fv) * 100));
          chartData = [
            { name: 'Cumulative Deposits', value: Math.round(invested) },
            { name: 'Accrued Interest', value: Math.round(interest) }
          ];
        }
        break;
      }
      case 'c6': { // Compound Interest General
        const p = parseFloat(vals.principal) || 0;
        const r = (parseFloat(vals.rate) || 0) / 100;
        const t = parseFloat(vals.years) || 0;
        const f = parseInt(vals.freq) || 12;
        if (p > 0 && r > 0 && t > 0) {
          const fv = p * Math.pow(1 + r/f, f*t);
          const interest = fv - p;
          resultText = `₹${Math.round(fv).toLocaleString()}`;
          insightText = `Initial deposit: ₹${p.toLocaleString()}. Interest gained: ₹${Math.round(interest).toLocaleString()}.`;
          recommendationText = `Compounding frequency makes a difference. Monthly compounding generates more interest than quarterly or annual compounding.`;
          progress = Math.min(100, Math.round((p / fv) * 100));
          chartData = [
            { name: 'Initial Capital', value: Math.round(p) },
            { name: 'Compound Gain', value: Math.round(interest) }
          ];
        }
        break;
      }
      case 'c7': { // Goal Planner
        const target = parseFloat(vals.target) || 0;
        const r = (parseFloat(vals.rate) || 0) / 12 / 100;
        const n = (parseFloat(vals.years) || 0) * 12;
        if (target > 0 && r > 0 && n > 0) {
          const monthly = target / (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
          resultText = `₹${Math.round(monthly).toLocaleString()} / month`;
          insightText = `To hit your target of ₹${target.toLocaleString()} in ${vals.years} years, you must save ₹${Math.round(monthly).toLocaleString()} every month at a ${vals.rate}% return.`;
          recommendationText = `Set up an automated monthly standing instruction. If you cannot invest this full amount, start smaller and step up by 10% every year.`;
          progress = 75;
          chartData = [
            { name: 'Target Goal Value', value: Math.round(target) },
            { name: 'Total Invested Portion', value: Math.round(monthly * n) }
          ];
        }
        break;
      }
      case 'c8': { // Emergency Fund
        const expenses = parseFloat(vals.expenses) || 0;
        const months = parseInt(vals.months) || 6;
        if (expenses > 0) {
          const target = expenses * months;
          resultText = `₹${target.toLocaleString()}`;
          insightText = `Calculated buffer covers ₹${expenses.toLocaleString()} in essential monthly survival expenses for ${months} months.`;
          recommendationText = `Allocate this sum into liquid bank FDs with sweep-in facilities or arbitrage mutual funds. Never lock emergency cash in long-term stocks or bonds.`;
          progress = Math.round((months / 12) * 100);
          chartData = [
            { name: 'Safe Cash Reserve', value: target },
            { name: 'Monthly Budget Limit', value: expenses }
          ];
        }
        break;
      }
      case 'c9': { // Retirement
        const age = parseInt(vals.age) || 25;
        const retAge = parseInt(vals.retAge) || 60;
        const expenses = parseFloat(vals.expenses) || 0;
        const inflation = (parseFloat(vals.inflation) || 6) / 100;
        
        const yearsToRetire = retAge - age;
        if (expenses > 0 && yearsToRetire > 0) {
          // Adjust monthly expenses for inflation at retirement age
          const futureExpenses = expenses * Math.pow(1 + inflation, yearsToRetire);
          // Target corpus = 20 times annual inflation-adjusted expenses
          const corpus = futureExpenses * 12 * 20;
          
          resultText = `₹${Math.round(corpus).toLocaleString()}`;
          insightText = `Your current ₹${expenses.toLocaleString()}/month expenses will inflate to ₹${Math.round(futureExpenses).toLocaleString()}/month at age ${retAge}. You need ₹${Math.round(corpus).toLocaleString()} to retire.`;
          recommendationText = `Start retirement SIPs early. A 25-year-old only needs to invest ₹3,500/month to hit a multi-crore retirement corpus, whereas starting at 40 requires ₹20,000+/month.`;
          progress = 40;
          chartData = [
            { name: 'Target Retirement Corpus', value: Math.round(corpus) },
            { name: 'Inflated Monthly Needs', value: Math.round(futureExpenses) }
          ];
        }
        break;
      }
      case 'c10': { // Inflation Calculator
        const amount = parseFloat(vals.amount) || 0;
        const inflation = (parseFloat(vals.inflation) || 6) / 100;
        const years = parseFloat(vals.years) || 0;
        if (amount > 0 && inflation > 0 && years > 0) {
          const futureValue = amount * Math.pow(1 + inflation, years);
          resultText = `₹${Math.round(futureValue).toLocaleString()}`;
          insightText = `Due to a ${vals.inflation}% annual inflation rate, you will need ₹${Math.round(futureValue).toLocaleString()} in ${years} years to buy what ₹${amount.toLocaleString()} buys today.`;
          recommendationText = `Inflation erodes cash buying power. Beating a 6% inflation rate requires placing your assets in compounding equities yielding at least 10-12% APR.`;
          progress = Math.min(100, Math.round((amount / futureValue) * 100));
          chartData = [
            { name: 'Purchasing Power Today', value: Math.round(amount) },
            { name: 'Future Inflated Cost', value: Math.round(futureValue) }
          ];
        }
        break;
      }
      case 'c11': { // Net Worth
        const cash = parseFloat(vals.cash) || 0;
        const invest = parseFloat(vals.invest) || 0;
        const property = parseFloat(vals.property) || 0;
        const debt = parseFloat(vals.debt) || 0;
        
        const assets = cash + invest + property;
        const netWorth = assets - debt;
        resultText = `₹${netWorth.toLocaleString()}`;
        insightText = `Total Assets: ₹${assets.toLocaleString()}. Total Liabilities/Debts: ₹${debt.toLocaleString()}.`;
        recommendationText = `Your net worth is the ultimate scorecard of your financial health. Focus on increasing your investments (assets) and paying off debts (liabilities) to grow this number.`;
        progress = assets > 0 ? Math.min(100, Math.max(0, Math.round((netWorth / assets) * 100))) : 0;
        chartData = [
          { name: 'Total Assets Owned', value: assets },
          { name: 'Total Debts Owed', value: debt }
        ];
        break;
      }
      case 'c12': { // Budget Planner 50/30/20
        const income = parseFloat(vals.income) || 0;
        const needs = parseFloat(vals.needs) || 0;
        const wants = parseFloat(vals.wants) || 0;
        
        if (income > 0) {
          const savings = Math.max(0, income - (needs + wants));
          const needsPct = (needs / income) * 100;
          const wantsPct = (wants / income) * 105;
          const savingsPct = (savings / income) * 100;
          
          resultText = `Savings: ₹${savings.toLocaleString()} (${savingsPct.toFixed(0)}%)`;
          insightText = `Your budget allocation is: Needs (${needsPct.toFixed(0)}%), Wants (${wantsPct.toFixed(0)}%), and Savings (${savingsPct.toFixed(0)}%).`;
          
          if (needsPct > 50) {
            recommendationText = `Your Needs exceed the recommended 50% limit. Look for ways to lower structural costs (like refinancing home loans or grocery optimization).`;
          } else {
            recommendationText = `Great job! Your needs are below 50%. Divert any leftover wants allocations to compound investments.`;
          }
          progress = Math.min(100, Math.round(savingsPct));
          chartData = [
            { name: 'Needs Limit (50%)', value: Math.round(income * 0.5) },
            { name: 'Wants Limit (30%)', value: Math.round(income * 0.3) },
            { name: 'Your Actual Savings', value: Math.round(savings) }
          ];
        }
        break;
      }
      case 'c13': { // Savings Rate
        const income = parseFloat(vals.income) || 0;
        const savings = parseFloat(vals.savings) || 0;
        if (income > 0) {
          const rate = (savings / income) * 100;
          resultText = `${rate.toFixed(1)}%`;
          insightText = `You save ₹${savings.toLocaleString()} out of ₹${income.toLocaleString()} earned monthly.`;
          recommendationText = `Aim to increase your savings rate by 1% every quarter. Moving from a 10% to 20% savings rate cuts your working career down by 15 years.`;
          progress = Math.min(100, Math.round(rate));
          chartData = [
            { name: 'Savings Portion', value: Math.round(savings) },
            { name: 'Spending Portion', value: Math.round(income - savings) }
          ];
        }
        break;
      }
      case 'c14': { // Debt Payoff
        const debt = parseFloat(vals.debt) || 0;
        const payment = parseFloat(vals.monthly) || 0;
        const rate = (parseFloat(vals.rate) || 0) / 12 / 100;
        if (debt > 0 && payment > 0 && rate > 0) {
          // Amortization months calculation
          // n = -log(1 - (P*r)/M) / log(1 + r)
          const num = 1 - (debt * rate) / payment;
          if (num <= 0) {
            resultText = 'Infinity';
            insightText = `Your monthly payment (₹${payment.toLocaleString()}) does not even cover the interest accrued! Increase your payments to prevent debt from snowballing.`;
            recommendationText = `Double your payments immediately. Cut out all Wants to avoid personal bankruptcy.`;
            progress = 0;
          } else {
            const months = -Math.log(num) / Math.log(1 + rate);
            const totalPaid = payment * months;
            const totalInterest = totalPaid - debt;
            resultText = `${Math.round(months)} Months`;
            insightText = `It will take you ${Math.round(months)} months (or ${(months/12).toFixed(1)} years) to become debt-free. Total interest to pay: ₹${Math.round(totalInterest).toLocaleString()}.`;
            recommendationText = `Pay off high-interest balances using the Avalanche Method: pay the maximum possible extra payments on the card with the highest interest rate.`;
            progress = Math.min(100, Math.round((debt / totalPaid) * 100));
            chartData = [
              { name: 'Debt Principal', value: Math.round(debt) },
              { name: 'Total Interest Over Payoff', value: Math.round(totalInterest) }
            ];
          }
        }
        break;
      }
      case 'c15': { // FIRE (Financial Independence)
        const expenses = parseFloat(vals.expenses) || 0;
        const savings = parseFloat(vals.savings) || 0;
        const swr = parseFloat(vals.swr) || 4;
        if (expenses > 0) {
          const fireCorpus = expenses / (swr / 100);
          const ratio = (savings / fireCorpus) * 100;
          resultText = `₹${Math.round(fireCorpus).toLocaleString()}`;
          insightText = `Based on a safe withdrawal rate of ${swr}%, you require a liquid portfolio value of ₹${Math.round(fireCorpus).toLocaleString()} to retire completely.`;
          recommendationText = `Once you cross 50% of your FIRE target, you are "Coast FIRE," meaning your existing investments can compound to your final target without any further contributions.`;
          progress = Math.min(100, Math.round(ratio));
          chartData = [
            { name: 'Required FIRE Corpus', value: Math.round(fireCorpus) },
            { name: 'Your Current Portfolio', value: Math.round(savings) }
          ];
        }
        break;
      }
      case 'c16': { // Insurance Need
        const income = parseFloat(vals.income) || 0;
        const liabilities = parseFloat(vals.liabilities) || 0;
        const savings = parseFloat(vals.savings) || 0;
        if (income > 0) {
          const cover = (income * 20) + liabilities - savings;
          resultText = `₹${Math.round(cover).toLocaleString()}`;
          insightText = `Calculates target coverage by multiplying annual income by 20 (₹${(income*20).toLocaleString()}), adding loans (₹${liabilities.toLocaleString()}), and subtracting cash assets.`;
          recommendationText = `Buy pure term insurance for this cover. Never buy endowment or pension plans; they have low returns and fail to cover your core liabilities.`;
          progress = 80;
          chartData = [
            { name: 'Suggested Life Cover', value: Math.round(cover) },
            { name: 'Annual Income Replacement', value: Math.round(income * 20) }
          ];
        }
        break;
      }
      case 'c17': { // Rule of 72
        const rate = parseFloat(vals.rate) || 0;
        if (rate > 0) {
          const years = 72 / rate;
          resultText = `${years.toFixed(1)} Years`;
          insightText = `At a compounding return of ${rate}% annually, your money will double in exactly ${years.toFixed(1)} years.`;
          recommendationText = `FDs at 7% take 10.3 years to double. Equities at 12% take 6 years. Think in doubling years to check investment value.`;
          progress = Math.min(100, Math.round((7.2 / years) * 100));
          chartData = [
            { name: 'Rate of Return (%)', value: rate },
            { name: 'Years to Double', value: parseFloat(years.toFixed(1)) }
          ];
        }
        break;
      }
      case 'c18': { // Rule of 114
        const rate = parseFloat(vals.rate) || 0;
        if (rate > 0) {
          const years = 114 / rate;
          resultText = `${years.toFixed(1)} Years`;
          insightText = `At a compounding return of ${rate}% annually, your money will triple (3x) in exactly ${years.toFixed(1)} years.`;
          recommendationText = `Compare with the Rule of 72 to see that tripling takes less than double the time of doubling due to compound acceleration.`;
          progress = Math.min(100, Math.round((11.4 / years) * 100));
          chartData = [
            { name: 'Rate of Return (%)', value: rate },
            { name: 'Years to Triple', value: parseFloat(years.toFixed(1)) }
          ];
        }
        break;
      }
      case 'c19': { // Rule of 144
        const rate = parseFloat(vals.rate) || 0;
        if (rate > 0) {
          const years = 144 / rate;
          resultText = `${years.toFixed(1)} Years`;
          insightText = `At a compounding return of ${rate}% annually, your money will quadruple (4x) in exactly ${years.toFixed(1)} years.`;
          recommendationText = `Compound growth speeds up. Quadrupling (4x) takes exactly double the years of doubling (2x).`;
          progress = Math.min(100, Math.round((14.4 / years) * 100));
          chartData = [
            { name: 'Rate of Return (%)', value: rate },
            { name: 'Years to Quadruple', value: parseFloat(years.toFixed(1)) }
          ];
        }
        break;
      }
      case 'c20': { // Asset Allocation
        const age = parseInt(vals.age) || 25;
        const risk = vals.risk || 'moderate';
        if (age > 0) {
          let eq = 100 - age;
          if (risk === 'conservative') eq = Math.max(15, Math.round(eq * 0.6));
          if (risk === 'aggressive') eq = Math.min(90, Math.round(eq * 1.2));
          const gold = 10;
          const cash = 10;
          const bonds = 100 - (eq + gold + cash);
          
          resultText = `Equity Target: ${eq}%`;
          insightText = `Allocations: Stocks/Equity (${eq}%), Debt/Bonds (${bonds}%), Gold (${gold}%), Cash (${cash}%).`;
          recommendationText = `Annual rebalancing is key. If stocks do well and grow to 80% of your portfolio, sell the excess 5% to buy gold or bonds to stay within your risk bounds.`;
          progress = eq;
          chartData = [
            { name: 'Equity/Stocks', value: eq },
            { name: 'Bonds/Debt', value: bonds },
            { name: 'Gold', value: gold },
            { name: 'Cash', value: cash }
          ];
        }
        break;
      }
      default:
        break;
    }

    return {
      resultValue: resultText,
      insight: insightText,
      recommendation: recommendationText,
      progress,
      chartData
    };
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8 font-sans">
      
      {/* Top Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            FiinBuddy Rules & Calculators
          </h1>
          <p className="text-slate-450 text-sm mt-1">
            An interactive suite of financial rules and calculators designed to educate and grow your wealth.
          </p>
        </div>

        {/* Global Search and Tab Swapper */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-3.5 text-slate-500 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rules or calculators..."
              className="w-full sm:w-64 rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pr-4 pl-10 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => { setActiveSection('rules'); setActiveCalcId(null); setSelectedFilter('all'); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSection === 'rules' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              Financial Rules ({RULES.length})
            </button>
            <button
              onClick={() => { setActiveSection('calculators'); setSelectedFilter('all'); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSection === 'calculators' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              Calculators ({CALCULATORS.length})
            </button>
          </div>
        </div>
      </div>

      {/* Filter Category Pills */}
      {activeCalcId === null && (
        <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-900">
          {[
            { key: 'all', name: 'All Categories' },
            { key: 'budgeting', name: 'Budgeting' },
            { key: 'investment', name: 'Investments' },
            { key: 'debt', name: 'Debts & Loans' },
            { key: 'insurance', name: 'Insurance & Cover' },
            { key: 'retirement', name: 'Retirement & FIRE' }
          ].map(btn => (
            <button
              key={btn.key}
              onClick={() => setSelectedFilter(btn.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedFilter === btn.key
                  ? 'bg-blue-600/10 border-blue-500 text-blue-400 font-semibold'
                  : 'bg-slate-950 border-slate-850 text-slate-500 hover:border-slate-800 hover:text-slate-350'
              }`}
            >
              {btn.name}
            </button>
          ))}
        </div>
      )}

      {/* FINANCIAL RULES GRID */}
      {activeSection === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {filteredRules.map(rule => {
            const isBookmarked = bookmarkedRules.includes(rule.id);
            return (
              <div
                key={rule.id}
                onClick={() => setSelectedRule(rule)}
                className="relative overflow-hidden rounded-xl border border-slate-850 bg-slate-900/30 p-6 backdrop-blur-md flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900/50 group"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-blue-400 border border-slate-850 uppercase tracking-wider">
                      {rule.category}
                    </span>
                    <button
                      onClick={(e) => toggleBookmark(rule.id, e)}
                      className="p-1 text-slate-500 hover:text-yellow-400 transition-all text-xs"
                    >
                      {isBookmarked ? <FaBookmark className="text-yellow-400" /> : <FaRegBookmark />}
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {rule.name}
                  </h3>
                  <p className="text-xs text-slate-450 mt-2 leading-relaxed line-clamp-3">
                    {rule.shortDesc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-850/50 flex justify-between items-center text-xs">
                  <span className="text-blue-400 font-semibold group-hover:underline flex items-center gap-1">
                    Learn More <FaArrowRight className="text-[10px]" />
                  </span>
                </div>
              </div>
            );
          })}
          {filteredRules.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500 text-sm">
              No rules matched your search parameters.
            </div>
          )}
        </div>
      )}

      {/* FINANCIAL CALCULATORS GRID OR INTERACTIVE PAGE */}
      {activeSection === 'calculators' && (
        <>
          {activeCalcId === null ? (
            /* Dashboard of Calculators */
            <div className="space-y-8">
              
              {/* Recent Calculator History stack */}
              {recentCalculators.length > 0 && (
                <div className="bg-slate-900/20 border border-slate-850 rounded-2xl p-5 backdrop-blur-md space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <FaHistory className="text-[10px]" /> Recent Calculators
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recentCalculators.map(id => {
                      const calc = CALCULATORS.find(c => c.id === id);
                      if (!calc) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => openCalculator(id)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                        >
                          <span>{calc.icon}</span>
                          <span>{calc.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {filteredCalculators.map(calc => {
                  const isFavorite = favoriteCalculators.includes(calc.id);
                  return (
                    <div
                      key={calc.id}
                      onClick={() => openCalculator(calc.id)}
                      className="relative overflow-hidden rounded-xl border border-slate-850 bg-slate-900/30 p-6 backdrop-blur-md flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900/50 group"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-3xl">{calc.icon}</span>
                          <button
                            onClick={(e) => toggleFavorite(calc.id, e)}
                            className="p-1 text-slate-500 hover:text-yellow-400 transition-all text-sm"
                          >
                            {isFavorite ? <FaStar className="text-yellow-400" /> : <FaRegStar />}
                          </button>
                        </div>
                        <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                          {calc.name}
                        </h3>
                        <p className="text-xs text-slate-450 mt-2 leading-relaxed line-clamp-3">
                          {calc.desc}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-850/50 flex justify-between items-center text-xs">
                        <span className="text-blue-400 font-semibold group-hover:underline flex items-center gap-1">
                          Open Calculator <FaArrowRight className="text-[10px]" />
                        </span>
                      </div>
                    </div>
                  );
                })}
                {filteredCalculators.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-500 text-sm">
                    No calculators matched your search criteria.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Active Interactive Calculator Interface */
            <div className="space-y-6">
              
              {/* Back Button and Title */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveCalcId(null)}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-850 transition-all text-slate-400 hover:text-white"
                >
                  <FaArrowLeft className="text-xs" />
                </button>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">{CALCULATORS.find(c => c.id === activeCalcId)?.icon}</span>
                    {CALCULATORS.find(c => c.id === activeCalcId)?.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">{CALCULATORS.find(c => c.id === activeCalcId)?.desc}</p>
                </div>
              </div>

              {/* Calculator Panel Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Panel: Inputs */}
                <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md h-fit space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 border-b border-slate-800 pb-3 flex items-center gap-1.5">
                    <FaCalculator className="text-xs text-blue-500" /> Inputs
                  </h3>
                  
                  <div className="space-y-5">
                    {/* Render inputs dynamically based on calculator */}
                    {activeCalcId === 'c1' && ( // SIP
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">Monthly SIP (₹)</span>
                            <span className="text-blue-400">₹{calcInputs.monthly?.toLocaleString()}</span>
                          </div>
                          <input
                            type="range" min="500" max="100000" step="500"
                            value={calcInputs.monthly || 5000}
                            onChange={(e) => handleInputChange('monthly', parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">Expected Annual Return (%)</span>
                            <span className="text-blue-400">{calcInputs.rate}%</span>
                          </div>
                          <input
                            type="range" min="1" max="30" step="0.5"
                            value={calcInputs.rate || 12}
                            onChange={(e) => handleInputChange('rate', parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">Tenure (Years)</span>
                            <span className="text-blue-400">{calcInputs.years} Years</span>
                          </div>
                          <input
                            type="range" min="1" max="40" step="1"
                            value={calcInputs.years || 15}
                            onChange={(e) => handleInputChange('years', parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>
                      </>
                    )}

                    {activeCalcId === 'c2' && ( // Lumpsum
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">Initial Investment (₹)</span>
                            <span className="text-blue-400">₹{calcInputs.lumpsum?.toLocaleString()}</span>
                          </div>
                          <input
                            type="range" min="1000" max="1000000" step="1000"
                            value={calcInputs.lumpsum || 50000}
                            onChange={(e) => handleInputChange('lumpsum', parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">Expected Return (%)</span>
                            <span className="text-blue-400">{calcInputs.rate}%</span>
                          </div>
                          <input
                            type="range" min="1" max="30" step="0.5"
                            value={calcInputs.rate || 12}
                            onChange={(e) => handleInputChange('rate', parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">Time Period (Years)</span>
                            <span className="text-blue-400">{calcInputs.years} Years</span>
                          </div>
                          <input
                            type="range" min="1" max="40" step="1"
                            value={calcInputs.years || 10}
                            onChange={(e) => handleInputChange('years', parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>
                      </>
                    )}

                    {activeCalcId === 'c3' && ( // EMI
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">Loan Principal (₹)</span>
                            <span className="text-blue-400">₹{calcInputs.loan?.toLocaleString()}</span>
                          </div>
                          <input
                            type="range" min="50000" max="10000000" step="50000"
                            value={calcInputs.loan || 1500000}
                            onChange={(e) => handleInputChange('loan', parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">Interest Rate (% APR)</span>
                            <span className="text-blue-400">{calcInputs.rate}%</span>
                          </div>
                          <input
                            type="range" min="5" max="25" step="0.1"
                            value={calcInputs.rate || 8.5}
                            onChange={(e) => handleInputChange('rate', parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">Loan Tenure (Years)</span>
                            <span className="text-blue-400">{calcInputs.years} Years</span>
                          </div>
                          <input
                            type="range" min="1" max="30" step="1"
                            value={calcInputs.years || 15}
                            onChange={(e) => handleInputChange('years', parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>
                      </>
                    )}

                    {activeCalcId === 'c4' && ( // FD
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">Fixed Deposit Amount (₹)</span>
                            <span className="text-blue-400">₹{calcInputs.deposit?.toLocaleString()}</span>
                          </div>
                          <input
                            type="range" min="5000" max="2000000" step="5000"
                            value={calcInputs.deposit || 100000}
                            onChange={(e) => handleInputChange('deposit', parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">FD Rate of Return (%)</span>
                            <span className="text-blue-400">{calcInputs.rate}%</span>
                          </div>
                          <input
                            type="range" min="2" max="15" step="0.1"
                            value={calcInputs.rate || 7.1}
                            onChange={(e) => handleInputChange('rate', parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">FD Tenure (Years)</span>
                            <span className="text-blue-400">{calcInputs.years} Years</span>
                          </div>
                          <input
                            type="range" min="1" max="10" step="1"
                            value={calcInputs.years || 5}
                            onChange={(e) => handleInputChange('years', parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>
                      </>
                    )}

                    {/* Fallback inputs for other calculators (General inputs render) */}
                    {!['c1', 'c2', 'c3', 'c4'].includes(activeCalcId) && (
                      <div className="space-y-4">
                        {Object.keys(calcInputs).map(key => {
                          let labelName = key.charAt(0).toUpperCase() + key.slice(1);
                          if (key === 'monthly') labelName = 'Monthly Amount (₹)';
                          if (key === 'rate') labelName = 'Rate of Return (%)';
                          if (key === 'years') labelName = 'Tenure (Years)';
                          if (key === 'target') labelName = 'Target Goal (₹)';
                          if (key === 'expenses') labelName = 'Expenses (₹)';
                          if (key === 'income') labelName = 'Net Income (₹)';
                          if (key === 'cash') labelName = 'Cash assets (₹)';
                          if (key === 'invest') labelName = 'Investments (₹)';
                          if (key === 'debt') labelName = 'Liabilities / Loan Owed (₹)';
                          
                          if (key === 'freq') {
                            return (
                              <div key={key}>
                                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Compounding Frequency</label>
                                <select
                                  value={calcInputs[key]}
                                  onChange={(e) => handleInputChange(key, e.target.value)}
                                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-4 text-xs text-white outline-none"
                                >
                                  <option value="12">Monthly</option>
                                  <option value="4">Quarterly</option>
                                  <option value="1">Annually</option>
                                </select>
                              </div>
                            );
                          }

                          if (key === 'risk') {
                            return (
                              <div key={key}>
                                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Risk Capability Profile</label>
                                <select
                                  value={calcInputs[key]}
                                  onChange={(e) => handleInputChange(key, e.target.value)}
                                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-4 text-xs text-white outline-none"
                                >
                                  <option value="conservative">Conservative</option>
                                  <option value="moderate">Moderate</option>
                                  <option value="aggressive">Aggressive</option>
                                </select>
                              </div>
                            );
                          }

                          return (
                            <div key={key}>
                              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">{labelName}</label>
                              <input
                                type="number"
                                value={calcInputs[key]}
                                onChange={(e) => handleInputChange(key, parseFloat(e.target.value) || 0)}
                                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-4 text-xs text-white outline-none focus:border-blue-500"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel: Results & Graphics */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Result & progress */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-850 pb-5">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Calculated Maturity Value</span>
                        <h3 className="text-3xl font-extrabold text-teal-400 mt-1">
                          {evaluateCalculator(activeCalcId).resultValue}
                        </h3>
                      </div>
                      
                      <div className="w-full sm:w-1/3 text-xs text-slate-400 space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span>Investment Ratio</span>
                          <span>{evaluateCalculator(activeCalcId).progress}%</span>
                        </div>
                        <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                          <div className="bg-teal-500 h-full rounded-full" style={{ width: `${evaluateCalculator(activeCalcId).progress}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-6 items-center">
                      
                      {/* Graphics (Recharts) */}
                      <div className="md:col-span-3 h-52 flex items-center justify-center">
                        {evaluateCalculator(activeCalcId).chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={evaluateCalculator(activeCalcId).chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={65}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {evaluateCalculator(activeCalcId).chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#10b981'} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                              />
                              <Legend verticalAlign="bottom" height={36} iconSize={10} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-slate-550 text-xs flex items-center gap-1.5">
                            <FaChartLine /> Graphics representation available on compute
                          </div>
                        )}
                      </div>

                      {/* Insight box */}
                      <div className="md:col-span-2 space-y-3">
                        <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <FaInfoCircle className="text-blue-500" /> Financial Insight
                          </span>
                          <p className="text-[11px] text-slate-450 leading-relaxed">
                            {evaluateCalculator(activeCalcId).insight}
                          </p>
                        </div>

                        <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <FaLightbulb className="text-yellow-500" /> recommendation
                          </span>
                          <p className="text-[11px] text-slate-450 leading-relaxed">
                            {evaluateCalculator(activeCalcId).recommendation}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* SMART FINBUDDY INSIGHT ("What FiinBuddy Suggests") */}
                  <div className="bg-gradient-to-r from-blue-950/30 to-teal-950/30 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl"></div>
                    <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl"></div>

                    <div className="relative z-10 flex items-center gap-2 mb-4 border-b border-slate-850/60 pb-3">
                      <FaUserCircle className="text-blue-400 text-lg" />
                      <h3 className="text-base font-bold text-slate-100">What FiinBuddy Suggests</h3>
                    </div>

                    <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-350 leading-relaxed">
                      
                      <div className="space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-850/60">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Demographics</span>
                        <p className="font-semibold text-slate-300">Registered Age: {userAge} Years</p>
                        <p className="text-[11px] text-slate-400">Risk appetite: {userRisk}</p>
                      </div>

                      <div className="space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-850/60">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Suggested Asset Mix</span>
                        <p className="text-slate-300 font-medium">Stocks/Equity: <strong className="text-blue-400">{suggestedEquity}%</strong></p>
                        <p className="text-slate-300 font-medium">Bonds/Debt: <strong className="text-purple-400">{suggestedBonds}%</strong></p>
                        <p className="text-slate-300 font-medium">Gold: <strong className="text-amber-400">{suggestedGold}%</strong></p>
                      </div>

                      <div className="space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-850/60">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Suggested Strategy</span>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                          {userRisk === 'Aggressive' 
                            ? 'Leverage compounding in high-growth index equity funds. Place only 10% in liquid safety nets.'
                            : 'Maintain balanced asset allocations. Rebalance quarterly between debt index limits.'
                          }
                        </p>
                      </div>

                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}
        </>
      )}

      {/* RULE DETAILS MODAL POPUP */}
      {selectedRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-850 pb-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-blue-400 border border-slate-850 uppercase tracking-wider mb-2">
                  {selectedRule.category}
                </span>
                <h2 className="text-2xl font-black text-slate-100">{selectedRule.name}</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => toggleBookmark(selectedRule.id, e)}
                  className="p-2 bg-slate-950 border border-slate-850 rounded-lg hover:border-slate-700 transition-all text-slate-400"
                >
                  {bookmarkedRules.includes(selectedRule.id) 
                    ? <FaBookmark className="text-yellow-400" /> 
                    : <FaRegBookmark />
                  }
                </button>
                <button
                  onClick={() => setSelectedRule(null)}
                  className="p-2 bg-slate-950 border border-slate-850 rounded-lg hover:border-slate-700 transition-all text-slate-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Rule Explanation</h4>
                <p>{selectedRule.explanation}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Why it is Important</h4>
                <p className="text-slate-400">{selectedRule.whyImportant}</p>
              </div>

              {selectedRule.formula && (
                <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Formula</h4>
                  <code className="text-sm text-teal-400 font-bold">{selectedRule.formula}</code>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Real-Life Example</h4>
                <p className="text-slate-400 italic">"{selectedRule.example}"</p>
              </div>

              {/* Advantages List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Advantages</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedRule.advantages.map((adv, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs bg-slate-950/40 p-2 border border-slate-850/40 rounded-lg">
                      <span className="text-emerald-400 text-xs">✔</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* When to use it */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">When to Use It</h4>
                <p className="text-slate-400">{selectedRule.whenToUse}</p>
              </div>

              {/* Actionable Tips */}
              <div className="border-t border-slate-800/40 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-2 flex items-center gap-1.5">
                  <FaLightbulb /> Actionable Tips
                </h4>
                <ul className="space-y-2 text-xs">
                  {selectedRule.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-400">
                      <span className="text-[10px] mt-1">⚡</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Calculators;