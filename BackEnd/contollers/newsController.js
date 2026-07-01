const db = require('../config/db');

// List of global/market news articles
const globalNews = [
  {
    id: 'g1',
    title: 'RBI Keeps Repo Rate Unchanged at 6.5%, Signals Focus on inflation Targeting',
    summary: 'The Reserve Bank of India Monetary Policy Committee has decided to keep the policy repo rate unchanged, continuing its stance on withdrawal of accommodation to align inflation to the target.',
    category: 'Economy',
    importance: 'Important',
    source: 'Economic Times',
    date: '2026-06-22',
    aiAdvisor: {
      whyThisMatters: 'Interest rates dictate borrowing costs and yields on fixed-income instruments. A stable repo rate suggests inflation is under control but not low enough to warrant cuts.',
      impactOnPortfolio: 'Fixed Deposits and Bonds will continue to offer stable high yields for some more time. Home loans/EMI rates will remain steady without immediate relief.',
      actionRequired: 'If you have cash surpluses, lock them in high-yield Fixed Deposits or Debt Mutual Funds before eventual rate cuts begin later this year.'
    }
  },
  {
    id: 'g2',
    title: 'New Tax Slab Simplification: Capital Gains Restructured for Equity and Debt',
    summary: 'The Finance Ministry announced changes to short-term and long-term capital gains tax structures. Equity long-term capital gains (LTCG) tax is adjusted, while debt fund indexation benefits undergo changes.',
    category: 'Taxation',
    importance: 'Critical',
    source: 'Financial Express',
    date: '2026-06-20',
    aiAdvisor: {
      whyThisMatters: 'Tax efficiency directly impacts your net returns. Understanding the new holding periods and tax rates is critical for planning withdrawals.',
      impactOnPortfolio: 'Increases tax liability on long-term stock holdings sold above the threshold. Reduces the post-tax attractiveness of non-equity mutual funds held short-term.',
      actionRequired: 'Utilize tax-harvesting strategies. Realize up to ₹1.25 Lakhs of equity LTCG every year to avail tax exemption. Review debt holdings and hold till maturity where appropriate.'
    }
  },
  {
    id: 'g3',
    title: 'Mutual Fund Industry SIP Inflows Hit Historic High of ₹22,000 Crore in May',
    summary: 'Retail investor participation continues to surge as monthly Systematic Investment Plan (SIP) contributions reach a new record, indicating strong confidence in domestic equity markets.',
    category: 'Mutual Funds',
    importance: 'Useful',
    source: 'AMFI Daily',
    date: '2026-06-18',
    aiAdvisor: {
      whyThisMatters: 'Strong domestic inflows act as a safety net for local markets, cushioning Indian stocks from foreign institutional investor (FII) selling pressure.',
      impactOnPortfolio: 'Your equity mutual funds and mid/small-cap allocations receive strong support, reducing downside volatility during global sell-offs.',
      actionRequired: 'Continue active SIPs. Avoid pausing investments due to market highs, as dollar-cost averaging works best in the long run.'
    }
  },
  {
    id: 'g4',
    title: 'EPFO Announces Interest Rate of 8.25% for FY 2025-26',
    summary: 'The Ministry of Labour has approved the Employees\' Provident Fund Organisation\'s recommendation to credit an interest rate of 8.25% to EPF subscribers\' accounts for the active fiscal year.',
    category: 'Retirement',
    importance: 'Important',
    source: 'Press Information Bureau',
    date: '2026-06-15',
    aiAdvisor: {
      whyThisMatters: 'An 8.25% risk-free return backed by the Government of India makes EPF one of the most lucrative debt investments available to salaried individuals.',
      impactOnPortfolio: 'Boosts your long-term retirement safety net. The compounding effect of this high rate will accelerate your debt-side portfolio growth.',
      actionRequired: 'Ensure your EPF nominations are up to date. Avoid withdrawing from your EPF account prematurely when changing jobs to keep the tax-free compounding alive.'
    }
  },
  {
    id: 'g5',
    title: 'IRDAI Mandates Standardized Health Insurance Policies for Senior Citizens',
    summary: 'Insurance Regulatory and Development Authority of India has directed all general insurers to offer comprehensive, standardized coverage plans for senior citizens with simplified pre-existing disease riders.',
    category: 'Insurance',
    importance: 'Important',
    source: 'MoneyControl',
    date: '2026-06-12',
    aiAdvisor: {
      whyThisMatters: 'Simplifies buying health coverage for elderly parents, which is traditionally a major source of out-of-pocket medical expenses for families.',
      impactOnPortfolio: 'Reduces the risk of emergency medical bills wiping out your equity savings or forcing you to break fixed deposits prematurely.',
      actionRequired: 'Assess your parents\' existing health insurance. If they lack coverage or have high copay policies, consider upgrading to these standard citizen policies.'
    }
  },
  {
    id: 'g6',
    title: 'Global Inflation Cools Down: US Fed Hints at Potential Interest Rate Cuts in Q3',
    summary: 'Following softer inflation data in the United States, the Federal Reserve Chairman indicated that policy rates might be eased if macroeconomic indicators continue their positive trajectory.',
    category: 'Markets',
    importance: 'Useful',
    source: 'Bloomberg Quint',
    date: '2026-06-23',
    aiAdvisor: {
      whyThisMatters: 'A US interest rate cut typically triggers capital inflows into emerging markets like India, as foreign investors search for higher yields.',
      impactOnPortfolio: 'Triggers a potential rally in Large-Cap Indian Equities, Tech Stocks, and Gold as the Dollar index weakens.',
      actionRequired: 'Maintain your planned allocation to growth equities. Do not make rushed asset shifts; let the market momentum work for your existing SIPs.'
    }
  }
];

// Mock data database mapping holding types/symbols to news items
const holdingSpecificNewsDatabase = {
  // Stock specific news
  'HDFC Bank': {
    id: 'h_hdfc',
    title: 'HDFC Bank Announces Q4 Net Profit Jump of 18%, Asset Quality Remains Stable',
    summary: 'India\'s largest private sector lender reported strong credit growth, driven by retail loan expansions. Gross NPA declined marginally, showcasing resilient underwriting standards.',
    category: 'Stocks',
    importance: 'Important',
    source: 'CNBC TV18',
    date: '2026-06-22',
    matchSymbol: 'HDFC Bank',
    aiAdvisor: {
      whyThisMatters: 'HDFC Bank is the bellwether of the banking sector. Earnings growth here indicates strong consumer credit demand and banking sector stability.',
      impactOnPortfolio: 'Positive for your HDFC Bank holdings. This provides a strong valuation floor and limits downside risk for your banking allocation.',
      actionRequired: 'HOLD. No immediate change needed. The stock continues to be a solid core holding for long-term compound growth.'
    }
  },
  'IRFC': {
    id: 'h_irfc',
    title: 'IRFC Approves ₹15,000 Crore Fundraise for Railway Infrastructure Projects',
    summary: 'Indian Railway Finance Corporation (IRFC) board has approved a proposal to raise capital through domestic bonds and external borrowings to fund asset procurement for Indian Railways.',
    category: 'Stocks',
    importance: 'Important',
    source: 'Business Standard',
    date: '2026-06-21',
    matchSymbol: 'IRFC',
    aiAdvisor: {
      whyThisMatters: 'As the primary financing arm of the Indian Railways, IRFC benefits directly from the government\'s heavy capital expenditure in railway lines and rolling stock.',
      impactOnPortfolio: 'Increases future interest income margins. The stock maintains its strong utility-like characteristics with a stable sovereign-backed profile.',
      actionRequired: 'HOLD. If you entered at a low price, continue enjoying high dividend yields. Monitor sector concentration, as PSUs can undergo long consolidation phases.'
    }
  },
  'HAL': {
    id: 'h_hal',
    title: 'HAL Secures ₹24,000 Crore Export Order for Light Combat Aircraft Tejas',
    summary: 'Hindustan Aeronautics Limited (HAL) has clinched a historic manufacturing deal with a Southeast Asian nation. The agreement includes spare parts supply and maintenance support over 10 years.',
    category: 'Stocks',
    importance: 'Critical',
    source: 'Defence News India',
    date: '2026-06-19',
    matchSymbol: 'HAL',
    aiAdvisor: {
      whyThisMatters: 'This marks a significant milestone in India\'s defence export push, upgrading HAL\'s order book visibility to more than 6 years of future revenue.',
      impactOnPortfolio: 'Extremely positive for your HAL holdings. Will likely support high valuation multiples and stock performance in the short-to-medium term.',
      actionRequired: 'HOLD or ACCUMULATE on dips. Since defence is a high-beta sector, avoid buying in lump sum at all-time highs, but HAL remains a premium long-term holding.'
    }
  },
  'Reliance Industries': {
    id: 'h_reliance',
    title: 'Reliance Retail Enters JV with European Fashion Major to Expand Premium Store Footprint',
    summary: 'Reliance Industries Limited\'s retail arm has signed a joint venture to bring premium international lifestyle brands to India, targeting affluent consumers in tier-1 and tier-2 cities.',
    category: 'Stocks',
    importance: 'Useful',
    source: 'LiveMint',
    date: '2026-06-17',
    matchSymbol: 'Reliance Industries',
    aiAdvisor: {
      whyThisMatters: 'Reliance is shifting its valuation profile from a pure oil-and-gas conglomerate to a consumer tech and retail giant, unlocking higher retail margins.',
      impactOnPortfolio: 'Brings stability to your core equity holdings. Reliance acts as a defensive large-cap stock that outperforms during market consolidations.',
      actionRequired: 'HOLD. It is a solid cornerstone stock that matches long-term wealth compounding needs.'
    }
  },
  'TCS': {
    id: 'h_tcs',
    title: 'TCS Signs $1.5 Billion Digital Transformation Deal with UK Healthcare Provider',
    summary: 'Tata Consultancy Services has bagged a mega contract to modernize the digital stack and cloud infrastructure of a major healthcare firm, signaling recovery in IT spend.',
    category: 'Stocks',
    importance: 'Important',
    source: 'TechCrunch India',
    date: '2026-06-16',
    matchSymbol: 'TCS',
    aiAdvisor: {
      whyThisMatters: 'Large deal wins highlight that global enterprises are resuming software upgrade spends, which is the primary driver of Indian IT sector growth.',
      impactOnPortfolio: 'Improves earnings visibility for TCS and supports dividend payouts, which are key components of IT investor returns.',
      actionRequired: 'HOLD. TCS is an excellent cash-flow generator. The stock provides a strong dividend yield and high return on capital employed.'
    }
  },
  'Infosys': {
    id: 'h_infosys',
    title: 'Infosys Expands Enterprise Generative AI Alliance with Global Cloud Provider',
    summary: 'Infosys announced an expansion of its collaboration to deliver specialized AI-driven solutions to global financial services, helping clients streamline compliance workflows.',
    category: 'Stocks',
    importance: 'Important',
    source: 'ET Tech',
    date: '2026-06-14',
    matchSymbol: 'Infosys',
    aiAdvisor: {
      whyThisMatters: 'Harnessing generative AI tools is critical for IT majors to maintain competitive margins and prevent market share loss to newer agile competitors.',
      impactOnPortfolio: 'Supports valuation multiples for your Infosys shares. Enhances confidence in the firm\'s technology roadmap and adaptability.',
      actionRequired: 'HOLD. Keep position sizes within reasonable limits of your overall tech sector exposure.'
    }
  },
  // Category specific news
  'Mutual Funds': {
    id: 'c_mf',
    title: 'SEBI Clarifies Expense Ratio Caps: Direct Mutual Funds to Become Cheaper',
    summary: 'The Securities and Exchange Board of India has proposed a revised tiered structure for Total Expense Ratios (TER) in mutual funds, aiming to pass on scale benefits to retail investors.',
    category: 'Mutual Funds',
    importance: 'Important',
    source: 'SEBI Circular',
    date: '2026-06-22',
    matchType: 'Mutual Funds',
    aiAdvisor: {
      whyThisMatters: 'Lower expense ratios mean less money goes to asset management companies and more remains invested, boosting compounding returns over 10-20 years.',
      impactOnPortfolio: 'Direct plans of your Mutual Funds will see minor fee reductions, incrementally increasing your long-term returns.',
      actionRequired: 'Verify that you are invested in "Direct" plans of mutual funds rather than "Regular" plans. Regular plans carry broker commissions that reduce returns by 0.5% - 1.0% annually.'
    }
  },
  'Gold': {
    id: 'c_gold',
    title: 'Gold Prices Consolidation Near All-Time Highs Amid Central Bank Accumulation',
    summary: 'International gold spot prices consolidated near historic highs. Robust buying from central banks in emerging markets and geopolitical hedge demand continue to support the metal.',
    category: 'Markets',
    importance: 'Important',
    source: 'Bullion Bulletin',
    date: '2026-06-23',
    matchType: 'Gold',
    aiAdvisor: {
      whyThisMatters: 'Gold is the ultimate safe-haven asset. Central bank accumulation indicates systemic trust issues in global reserve currencies (like USD).',
      impactOnPortfolio: 'Your Gold ETF/SGB holdings are performing their hedging role perfectly, maintaining purchasing power and balancing stock market volatility.',
      actionRequired: 'HOLD. Keep your gold allocation at 10-15% of your net worth as a portfolio shield. Avoid overallocating, as gold does not generate active cash flows.'
    }
  },
  'Silver': {
    id: 'c_silver',
    title: 'Silver Demand Surges in Industrial Applications; Prices Eyes Multi-Year High',
    summary: 'The rising utilization of silver in solar panel manufacturing and electric vehicle electronics has strained global physical supplies, pushing prices upwards.',
    category: 'Markets',
    importance: 'Useful',
    source: 'Metal Markets',
    date: '2026-06-22',
    matchType: 'Silver',
    aiAdvisor: {
      whyThisMatters: 'Silver behaves partly as a precious metal and partly as an industrial commodity. High industrial demand can cause silver to outperform gold during manufacturing booms.',
      impactOnPortfolio: 'Boosts your Silver ETF performance. Silver is more volatile than gold, so expect sharper price swings in this holding.',
      actionRequired: 'HOLD. Since silver is highly volatile, ensure it is treated as a tactical commodity holding, keeping its allocation limited (less than 5% of portfolio).'
    }
  },
  'Fixed Deposits': {
    id: 'c_fd',
    title: 'Banks Offer Special FD Rates up to 7.9% for 1-Year Tenure',
    summary: 'To supportcredit credit expansion, several private and public sector banks have introduced special, limited-duration fixed deposit schemes offering elevated interest rates.',
    category: 'Finance',
    importance: 'Useful',
    source: 'Reserve Bank Bulletin',
    date: '2026-06-21',
    matchType: 'Fixed Deposits',
    aiAdvisor: {
      whyThisMatters: 'Getting close to 8% guaranteed return allows conservative investors to secure returns that outpace inflation on a post-tax basis in lower tax brackets.',
      impactOnPortfolio: 'Your fixed-income returns will see an upward revision if you reinvest maturing low-yield FDs into these special high-yield schemes.',
      actionRequired: 'Check the maturity dates of your current fixed deposits. Reinvest maturing sums into these high-yield tenures rather than letting them lie in low-interest savings accounts.'
    }
  },
  'PPF': {
    id: 'c_ppf',
    title: 'PPF Interest Rates Maintained at 7.1% for the Current Quarter',
    summary: 'The Department of Economic Affairs announced that interest rates for small savings schemes, including the Public Provident Fund (PPF), will remain unchanged for the next quarter.',
    category: 'Retirement',
    importance: 'Useful',
    source: 'Ministry of Finance',
    date: '2026-06-20',
    matchType: 'PPF',
    aiAdvisor: {
      whyThisMatters: 'PPF interest rates are sovereign-backed and entirely tax-free (under EEE status), which makes a 7.1% yield equivalent to a 10.1% taxable yield for individuals in the 30% tax bracket.',
      impactOnPortfolio: 'Maintains tax-free compounding of your debt retirement bucket. Acts as an excellent anchor against market drawdowns.',
      actionRequired: 'Try to deposit your annual PPF contribution (up to ₹1.5 Lakhs) between April 1st and April 5th of each financial year to maximize the interest accrued for the full year.'
    }
  },
  'Crypto': {
    id: 'c_crypto',
    title: 'New Regulatory Guidelines for Digital Assets Proposed: Strict Compliance Ahead',
    summary: 'Financial regulators have proposed a standardized compliance framework for cryptocurrency exchanges, focusing on investor protection, transaction tracking, and tax disclosures.',
    category: 'Markets',
    importance: 'Important',
    source: 'Reuters',
    date: '2026-06-23',
    matchType: 'Crypto',
    aiAdvisor: {
      whyThisMatters: 'Regulations bring legitimacy but also eliminate privacy and increase compliance overhead, which can cause short-term price disruptions.',
      impactOnPortfolio: 'Increases compliance/tax-tracking needs for your Bitcoin/Ethereum holdings. Reduces structural risks of exchange collapses like FTX.',
      actionRequired: 'Ensure you keep complete records of buy/sell transactions for tax filings. Store your assets in secure, recognized wallets/platforms.'
    }
  }
};

// Helper to generate advisor suggestions locally when Gemini is offline
const generateHeuristicAdvisor = (title, summary, category) => {
  let whyThisMatters = 'This development highlights a macroeconomic change or sector event that affects capital flows.';
  let impactOnPortfolio = 'May cause minor volatility in matching asset categories depending on market sentiment.';
  let actionRequired = 'HOLD. Review your overall portfolio asset allocation limits before executing new trades.';

  const titleLower = title.toLowerCase();

  if (category === 'Taxation' || titleLower.includes('tax') || titleLower.includes('budget')) {
    whyThisMatters = 'Tax regulations alter the net, post-tax returns of investments, forcing a review of holding durations.';
    impactOnPortfolio = 'Directly modifies net yield projections for affected asset classes. Tax-advantaged instruments should be prioritized.';
    actionRequired = 'Consult a tax advisor. Structure asset sales to maximize annual tax-free capital gain exemptions (e.g. ₹1.25L LTCG).';
  } else if (category === 'Economy' || titleLower.includes('rbi') || titleLower.includes('rate') || titleLower.includes('inflation')) {
    whyThisMatters = 'Central bank policy decisions dictate borrowing costs, fixed-deposit returns, and corporate debt costs.';
    impactOnPortfolio = 'Fixed Deposits lock in peak yields. High-duration bonds appreciate if interest rates drop.';
    actionRequired = 'If interest rates are peaking, lock in high-yield Fixed Deposits or Debt Mutual Funds before cuts begin.';
  } else if (category === 'Mutual Funds' || titleLower.includes('sip') || titleLower.includes('mutual fund')) {
    whyThisMatters = 'Expense ratio updates and structural retail inflows indicate growing retail market participation.';
    impactOnPortfolio = 'Provides liquidity and valuation support for domestic equities. Direct plans maintain superior compounding margins.';
    actionRequired = 'Double check that your mutual fund holdings are in "Direct" plans rather than commission-paying "Regular" plans.';
  } else if (category === 'Stocks' || category === 'Markets' || titleLower.includes('profit') || titleLower.includes('shares')) {
    whyThisMatters = 'Corporate orders and quarterly profit surges reflect firm pricing power and technology integration efficiency.';
    impactOnPortfolio = 'Triggers positive price momentum and improves capital returns for matching equity holdings.';
    actionRequired = 'Ensure individual stock concentrations do not exceed 5-10% of total wealth to hedge against sector shocks.';
  } else if (category === 'Insurance' || titleLower.includes('insurance') || titleLower.includes('health')) {
    whyThisMatters = 'Regulatory standardizations for health insurance make buying coverage easier for senior citizens and families.';
    impactOnPortfolio = 'Minimizes the risk of catastrophic emergency expenses draining your long-term equity mutual fund investments.';
    actionRequired = 'Maintain separate private health and term insurance policies apart from corporate employee insurance benefits.';
  }

  return { whyThisMatters, impactOnPortfolio, actionRequired };
};

// Helper to call Gemini API for live article analysis
const getGeminiAdvisorAnalysis = async (title, summary, user) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const age = user ? user.age : 30;
    const income = user ? user.monthlyIncome : 60000;
    const health = user ? user.financialHealthScore : 75;

    const prompt = `You are FinBuddy AI Advisor, a world-class personal wealth manager. Analyze this financial news:
Title: ${title}
Summary: ${summary}
User Profile: Age ${age}, Monthly Net Income ₹${income}, Financial Health Score ${health}/100.

Generate a JSON object containing exactly three fields (no markdown formatting, no backticks, just raw JSON):
{
  "whyThisMatters": "Why this news matters to a retail investor, in 2 sentences.",
  "impactOnPortfolio": "How this impacts a personal finance portfolio with assets like stocks/mutual funds, in 2 sentences.",
  "actionRequired": "Concrete, actionable advice (e.g. BUY, HOLD, SELL, or check limits) for the user, in 1 sentence."
}
IMPORTANT: Output ONLY the raw JSON string. Do not wrap in \`\`\`json or any other formatting.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    const json = await response.json();
    if (json && json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0].text) {
      let text = json.candidates[0].content.parts[0].text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      }
      return JSON.parse(text);
    }
  } catch (err) {
    console.error('Gemini Advisor integration error:', err);
  }
  return null;
};

// GET /api/news
exports.getAllNews = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = db.findOne('users', { id: userId });
    const holdings = db.find('holdings', { userId });

    const holdingNames = holdings.map(h => h.name);
    const holdingTypes = holdings.map(h => h.type);

    let articlesList = [];

    // 1. Try to fetch from GNews if API key is present
    const gnewsKey = process.env.GNEWS_API_KEY;
    if (gnewsKey) {
      try {
        const response = await fetch(`https://gnews.io/api/v4/top-headlines?category=business&lang=en&apikey=${gnewsKey}`);
        const json = await response.json();
        if (json && Array.isArray(json.articles)) {
          const mappedArticles = await Promise.all(json.articles.slice(0, 10).map(async (art, index) => {
            // Determine category
            let cat = 'Markets';
            const t = art.title.toLowerCase();
            if (t.includes('tax') || t.includes('budget') || t.includes('slab')) cat = 'Taxation';
            else if (t.includes('inflation') || t.includes('gdp') || t.includes('fed') || t.includes('rbi') || t.includes('rate')) cat = 'Economy';
            else if (t.includes('mutual') || t.includes('sip') || t.includes('fund')) cat = 'Mutual Funds';
            else if (t.includes('insurance') || t.includes('health') || t.includes('policy')) cat = 'Insurance';

            // Determine importance
            let imp = 'Useful';
            if (t.includes('crash') || t.includes('tax') || t.includes('budget') || t.includes('hike') || t.includes('policy')) imp = 'Critical';
            else if (t.includes('rate') || t.includes('earning') || t.includes('profit') || t.includes('deal')) imp = 'Important';

            // AI Advisor summary
            let advisor = await getGeminiAdvisorAnalysis(art.title, art.description, user);
            if (!advisor) {
              advisor = generateHeuristicAdvisor(art.title, art.description, cat);
            }

            return {
              id: `gnews_${index}_${Date.now()}`,
              title: art.title,
              summary: art.description || art.content || 'Click source for full coverage.',
              category: cat,
              importance: imp,
              source: art.source.name || 'GNews Live',
              date: (art.publishedAt || new Date().toISOString()).substring(0, 10),
              aiAdvisor: advisor
            };
          }));
          articlesList = mappedArticles;
        }
      } catch (gnewsErr) {
        console.error('GNews API fetch error, falling back to local database news:', gnewsErr);
      }
    }

    // Fallback if GNews key is missing or failed
    if (articlesList.length === 0) {
      articlesList = [...globalNews];
    }

    // 2. Add holding specific news
    const personalizedMatches = [];
    Object.keys(holdingSpecificNewsDatabase).forEach(key => {
      const newsItem = holdingSpecificNewsDatabase[key];
      if (newsItem.matchSymbol && holdingNames.some(name => name.toLowerCase().includes(key.toLowerCase()))) {
        personalizedMatches.push({ ...newsItem, isHoldingSpecific: true, matchingAsset: newsItem.matchSymbol });
      } else if (newsItem.matchType && holdingTypes.includes(newsItem.matchType)) {
        personalizedMatches.push({ ...newsItem, isHoldingSpecific: true, matchingAsset: newsItem.matchType });
      }
    });

    // Merge global news with personalized news, eliminating duplicates
    personalizedMatches.forEach(pm => {
      if (!articlesList.some(n => n.title === pm.title)) {
        articlesList.unshift(pm);
      }
    });

    articlesList.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(articlesList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching news.' });
  }
};

// GET /api/news/portfolio
exports.getPortfolioNews = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = db.findOne('users', { id: userId });
    const holdings = db.find('holdings', { userId });

    const holdingNames = holdings.map(h => h.name);
    const holdingTypes = holdings.map(h => h.type);

    let portfolioNews = [];

    // 1. Try to fetch from MarketAux if API key is present and user has stock holdings
    const marketauxKey = process.env.MARKETAUX_API_KEY;
    const stockHoldings = holdings.filter(h => h.type === 'Equity');
    if (marketauxKey && stockHoldings.length > 0) {
      try {
        const querySymbols = stockHoldings.map(h => h.name).slice(0, 3).join(',');
        const response = await fetch(`https://api.marketaux.com/v1/news/all?symbols=${querySymbols}&filter_entities=true&language=en&api_token=${marketauxKey}`);
        const json = await response.json();
        if (json && Array.isArray(json.data)) {
          const mappedArticles = await Promise.all(json.data.map(async (art, index) => {
            // Find which holding matched
            let matchingAsset = stockHoldings[0].name;
            stockHoldings.forEach(sh => {
              if (art.title.toLowerCase().includes(sh.name.toLowerCase()) || art.description.toLowerCase().includes(sh.name.toLowerCase())) {
                matchingAsset = sh.name;
              }
            });

            let advisor = await getGeminiAdvisorAnalysis(art.title, art.description, user);
            if (!advisor) {
              advisor = generateHeuristicAdvisor(art.title, art.description, 'Stocks');
            }

            return {
              id: `marketaux_${index}_${Date.now()}`,
              title: art.title,
              summary: art.description || 'Details inside article feed.',
              category: 'Stocks',
              importance: 'Important',
              source: art.source || 'MarketAux Live',
              date: (art.published_at || new Date().toISOString()).substring(0, 10),
              isHoldingSpecific: true,
              matchingAsset,
              aiAdvisor: advisor
            };
          }));
          portfolioNews = mappedArticles;
        }
      } catch (maErr) {
        console.error('MarketAux fetch error, falling back to local database holding news:', maErr);
      }
    }

    // Fallback if MarketAux key is missing or failed
    if (portfolioNews.length === 0) {
      Object.keys(holdingSpecificNewsDatabase).forEach(key => {
        const newsItem = holdingSpecificNewsDatabase[key];
        if (newsItem.matchSymbol && holdingNames.some(name => name.toLowerCase().includes(key.toLowerCase()))) {
          portfolioNews.push({ ...newsItem, isHoldingSpecific: true, matchingAsset: newsItem.matchSymbol });
        } else if (newsItem.matchType && holdingTypes.includes(newsItem.matchType)) {
          portfolioNews.push({ ...newsItem, isHoldingSpecific: true, matchingAsset: newsItem.matchType });
        }
      });
    }

    portfolioNews.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(portfolioNews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching portfolio news.' });
  }
};
