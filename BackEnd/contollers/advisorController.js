const db = require('../config/db');

// Intelligent Local Financial Advisory Heuristic Engine
const generateLocalResponse = (message, profile) => {
  const query = message.toLowerCase();
  const { name, age, income, expenses, goals, holdings, healthScore, risk } = profile;
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const savingsRate = income > 0 ? ((income - totalExpenses) / income) * 100 : 0;

  // 1. Analyze Expenses & Leaks
  if (query.includes('leak') || query.includes('expense') || query.includes('spend') || query.includes('budget')) {
    const categories = {};
    expenses.forEach(e => { categories[e.category] = (categories[e.category] || 0) + e.amount; });
    const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const topSpend = sortedCats.length > 0 ? `${sortedCats[0][0]} (₹${sortedCats[0][1].toLocaleString()})` : 'none logged yet';

    return `Hello ${name || 'there'}! Based on your expense records, your total monthly spending is **₹${totalExpenses.toLocaleString()}** against an income of **₹${income.toLocaleString()}**, leaving a savings rate of **${savingsRate.toFixed(1)}%**. 

Your highest spending category is **${topSpend}**. 

**Advisor Recommendation:**
1. Aim to keep discretionary categories (like Shopping or Dining Out) under **15%** of net income.
2. Consider setting up strict envelope budgets on the *Budget Planner* page. 
3. Trimming just ₹2,000 from your top categories and diverting it to active goals will accelerate your timeline by several months!`;
  }

  // 2. Risk & Portfolio Analysis
  if (query.includes('risk') || query.includes('portfolio') || query.includes('invest') || query.includes('asset') || query.includes('allocation')) {
    const holdingsSummary = holdings.map(h => `${h.name} (₹${h.value.toLocaleString()})`).join(', ');
    return `Looking at your asset profile, your risk tolerance is categorized as **${risk || 'Moderate'}** based on your assessment history. 

Your active holdings are: ${holdingsSummary || 'Cash only'}. 

**Asset Allocation Audit:**
1. Under the standard *110 minus age* rule for your age (${age || 30}), your equity exposure should target **${110 - (age || 30)}%**.
2. If you are **${risk || 'Moderate'}**, we recommend keeping a balanced sheet: **60% Equities, 20% Bonds, 10% Gold, and 10% Cash**.
3. Check out the *Asset Allocation* tab to calculate your exact portfolio gaps and view specific rebalancing buy/sell actions!`;
  }

  // 3. Goal Advisor
  if (query.includes('goal') || query.includes('save') || query.includes('dream') || query.includes('target')) {
    if (goals.length === 0) {
      return `I see you haven't launched any savings targets yet. Establishing goals is crucial to give your savings direction and purpose! Go to the *Goal Planner* to configure your first preset (e.g., a 6-month Emergency Safety Reserve).`;
    }

    const goalList = goals.map(g => `"${g.name}" (₹${g.currentAmount.toLocaleString()}/₹${g.targetAmount.toLocaleString()})`).join(', ');
    return `You have **${goals.length} active goals**: ${goalList}. 

**Goal Feasibility Assessment:**
- Your cumulative monthly saving requirement to hit all deadlines is **₹${goals.reduce((s, g) => s + (g.targetAmount / 12), 0).toLocaleString()}/month**.
- Make sure to prioritize the **Emergency Fund** preset first to shield your long-term mutual fund investments from forced liquidations during emergencies.
- Try simulating budget cuts on the *Goal Planner* slider to see how simple spending adjustments accelerate these milestones!`;
  }

  // 4. Insurance Advice
  if (query.includes('insurance') || query.includes('protect') || query.includes('policy') || query.includes('health')) {
    const recTerm = income > 0 ? income * 12 * 10 : 5000000;
    return `Protection planning is the bedrock of wealth creation. Based on your current income of **₹${income.toLocaleString()}**:
1. **Term Insurance Target:** You should secure a minimum coverage of **₹${recTerm.toLocaleString()}** (roughly 10x your annual income plus any active liabilities) to protect your family.
2. **Health Insurance Target:** Secure at least **₹5,000,000** base cover. Relying purely on corporate employee coverage is risky in case of career transitions.
3. Review your coverage shortfall dials on our *Insurance Planner* page.`;
  }

  // 5. Default General Greeting & Help
  return `Hi ${name || 'there'}! I am your personal FinBuddy AI Advisor. 

I have analyzed your financial profile (Health Score: **${healthScore}/100**, Risk Profile: **${risk || 'Moderate'}**, Income: **₹${income.toLocaleString()}**). 

Here are some specific queries I can help you with:
- *"How can I fix my budget leaks?"*
- *"Audit my risk profile and asset allocations"*
- *"Are my savings goals realistic?"*
- *"Am I covered adequately by insurance?"*
- *"Explain the 50/30/20 rule"*

What financial strategy would you like to discuss today?`;
};

// POST `/api/advisor/chat`
exports.chatWithAdvisor = async (req, res) => {
  const { message, chatHistory } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'User message is required.' });
  }

  try {
    const userId = req.user.id;
    const user = db.findOne('users', { id: userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Query active financials to construct user profile
    const expenses = db.find('expenses', { userId }) || [];
    const goals = db.find('goals', { userId }) || [];
    const holdings = db.find('holdings', { userId }) || [];
    const healthScore = user.financialHealthScore || 50;
    const risk = user.riskProfile?.category || 'Moderate';

    const profile = {
      name: user.name,
      age: user.age,
      income: user.monthlyIncome || 0,
      expenses,
      goals,
      holdings,
      healthScore,
      risk
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const historyPrompt = (chatHistory || []).map(h => 
          `${h.sender === 'user' ? 'User' : 'Advisor'}: ${h.text}`
        ).join('\n');

        const systemContext = `You are FinBuddy AI Advisor, an elite, professional wealth strategist. 
You are conversing with the client, ${profile.name || 'User'} (Age: ${profile.age || 30}).
Client Financial Profile:
- Monthly Net Income: ₹${profile.income.toLocaleString()}
- Total Spent This Month: ₹${expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}
- Current Financial Health Score: ${healthScore}/100
- Risk Tolerance Profile: ${risk}
- Active Savings Goals: ${goals.map(g => `${g.name} (Target: ₹${g.targetAmount}, Saved: ₹${g.currentAmount})`).join(', ') || 'None set'}
- Active Holdings: ${holdings.map(h => `${h.name} (${h.type}, Value: ₹${h.value})`).join(', ') || 'Cash only'}

Respond to the user's message in a professional, warm, concise, and highly actionable style. Keep responses under 4 sentences where possible, using markdown bullets for emphasis. Do not make up calculations. Always reference the client's actual numbers from the profile.

Conversation History:
${historyPrompt}
User: ${message}
Advisor:`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: systemContext }]
            }]
          })
        });

        const json = await response.json();
        if (json && json.candidates && json.candidates[0]?.content?.parts[0]?.text) {
          const replyText = json.candidates[0].content.parts[0].text.trim();
          return res.json({ reply: replyText });
        }
      } catch (geminiErr) {
        console.error('Gemini advisor error, using local fallback:', geminiErr);
      }
    }

    // Heuristic Local Fallback response
    const localReply = generateLocalResponse(message, profile);
    res.json({ reply: localReply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error communicating with AI Advisor.' });
  }
};
