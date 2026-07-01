const db = require('../config/db');

// Helper to recalculate Financial Health Score (0 - 100)
const recalculateHealthScore = (userId) => {
  const user = db.findOne('users', { id: userId });
  if (!user) return;

  let score = 50; // Base score

  // 1. Savings rate check (Max 25 points)
  const expenses = db.find('expenses', { userId });
  const monthlyExpenses = expenses
    .filter(e => {
      // Filter for current month's expenses
      const expDate = new Date(e.date);
      const now = new Date();
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  if (user.monthlyIncome > 0) {
    const savings = user.monthlyIncome - monthlyExpenses;
    const savingsRate = savings / user.monthlyIncome;
    
    if (savingsRate >= 0.3) {
      score += 25; // Great saving rate
    } else if (savingsRate >= 0.15) {
      score += 15; // Good saving rate
    } else if (savingsRate >= 0) {
      score += 5; // Barely saving
    } else {
      score -= 10; // Overspending
    }
  }

  // 2. Goal tracking check (Max 20 points)
  const goals = db.find('goals', { userId });
  if (goals.length > 0) {
    score += 10; // Active goals
    
    // Average completion progress
    const totalProgress = goals.reduce((sum, g) => {
      const completion = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) : 0;
      return sum + Math.min(1, completion);
    }, 0);
    const avgProgress = totalProgress / goals.length;
    score += Math.round(avgProgress * 10);
  }

  // 3. Portfolio Diversification check (Max 20 points)
  const portfolio = db.find('portfolio', { userId });
  const nonCashAllocated = portfolio
    .filter(p => p.assetType !== 'Cash')
    .reduce((sum, p) => sum + p.amount, 0);
  
  if (nonCashAllocated > 0) {
    score += 15; // Has investments
    if (portfolio.length >= 4 && portfolio.every(p => p.amount > 0)) {
      score += 5; // Fully diversified
    }
  }

  // 4. Risk Profile complete (Max 15 points)
  if (user.riskProfile) {
    score += 15;
  }

  // Bound the score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score));
  db.update('users', { id: userId }, { financialHealthScore: finalScore });
};

// --- Expenses ---
exports.getExpenses = (req, res) => {
  try {
    const expenses = db.find('expenses', { userId: req.user.id });
    // Sort by date descending
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching expenses.' });
  }
};

exports.addExpense = (req, res) => {
  const { amount, category, description, date } = req.body;

  if (!amount || !category || !date) {
    return res.status(400).json({ message: 'Amount, category, and date are required.' });
  }

  try {
    const parsedAmount = parseFloat(amount);
    const newExpense = db.create('expenses', {
      userId: req.user.id,
      amount: parsedAmount,
      category,
      description: description || '',
      date
    });

    // Deduct amount from Cash portfolio
    const cashPortfolio = db.findOne('portfolio', { userId: req.user.id, assetType: 'Cash' });
    if (cashPortfolio) {
      const newCashAmount = Math.max(0, cashPortfolio.amount - parsedAmount);
      db.update('portfolio', { id: cashPortfolio.id }, { amount: newCashAmount });
    }

    // Update net worth
    const user = db.findOne('users', { id: req.user.id });
    if (user) {
      const newNetWorth = Math.max(0, user.netWorth - parsedAmount);
      db.update('users', { id: req.user.id }, { netWorth: newNetWorth });
    }

    recalculateHealthScore(req.user.id);
    res.status(201).json(newExpense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding expense.' });
  }
};

exports.bulkAddExpenses = (req, res) => {
  const { expenses } = req.body;

  if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
    return res.status(400).json({ message: 'A non-empty list of expenses is required.' });
  }

  try {
    const userId = req.user.id;
    let totalDeducted = 0;
    const addedExpenses = [];

    expenses.forEach(exp => {
      const { amount, category, description, date } = exp;
      if (amount && category && date) {
        const parsedAmount = parseFloat(amount);
        const newExpense = db.create('expenses', {
          userId,
          amount: parsedAmount,
          category,
          description: description || '',
          date
        });
        addedExpenses.push(newExpense);
        totalDeducted += parsedAmount;
      }
    });

    // Deduct total amount from Cash portfolio
    const cashPortfolio = db.findOne('portfolio', { userId, assetType: 'Cash' });
    if (cashPortfolio) {
      const newCashAmount = Math.max(0, cashPortfolio.amount - totalDeducted);
      db.update('portfolio', { id: cashPortfolio.id }, { amount: newCashAmount });
    }

    // Update net worth
    const user = db.findOne('users', { id: userId });
    if (user) {
      const newNetWorth = Math.max(0, user.netWorth - totalDeducted);
      db.update('users', { id: userId }, { netWorth: newNetWorth });
    }

    recalculateHealthScore(userId);
    res.status(201).json({
      message: `Successfully imported ${addedExpenses.length} transactions!`,
      expenses: addedExpenses
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error bulk adding expenses.' });
  }
};

exports.updateExpense = (req, res) => {
  const { id } = req.params;
  const { amount, category, description, date } = req.body;

  try {
    const expense = db.findOne('expenses', { id, userId: req.user.id });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found.' });
    }

    const updates = {};
    if (amount !== undefined) updates.amount = parseFloat(amount);
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (date !== undefined) updates.date = date;

    // Adjust Cash portfolio if amount changes
    if (amount !== undefined && parseFloat(amount) !== expense.amount) {
      const diff = parseFloat(amount) - expense.amount;
      const cashPortfolio = db.findOne('portfolio', { userId: req.user.id, assetType: 'Cash' });
      if (cashPortfolio) {
        db.update('portfolio', { id: cashPortfolio.id }, { amount: Math.max(0, cashPortfolio.amount - diff) });
      }

      const user = db.findOne('users', { id: req.user.id });
      if (user) {
        db.update('users', { id: req.user.id }, { netWorth: Math.max(0, user.netWorth - diff) });
      }
    }

    const updated = db.update('expenses', { id }, updates);
    recalculateHealthScore(req.user.id);

    res.json({
      message: 'Expense updated successfully!',
      expense: updated
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating expense.' });
  }
};

exports.deleteExpense = (req, res) => {
  const { id } = req.params;

  try {
    const expense = db.findOne('expenses', { id, userId: req.user.id });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found.' });
    }

    // Add back the deleted expense amount to Cash portfolio
    const cashPortfolio = db.findOne('portfolio', { userId: req.user.id, assetType: 'Cash' });
    if (cashPortfolio) {
      const newCashAmount = cashPortfolio.amount + expense.amount;
      db.update('portfolio', { id: cashPortfolio.id }, { amount: newCashAmount });
    }

    // Update net worth
    const user = db.findOne('users', { id: req.user.id });
    if (user) {
      const newNetWorth = user.netWorth + expense.amount;
      db.update('users', { id: req.user.id }, { netWorth: newNetWorth });
    }

    db.delete('expenses', { id, userId: req.user.id });
    recalculateHealthScore(req.user.id);
    res.json({ message: 'Expense deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting expense.' });
  }
};

exports.bulkDeleteExpenses = (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'A non-empty list of expense IDs is required.' });
  }

  try {
    const userId = req.user.id;
    let totalRefunded = 0;
    const deletedIds = [];

    ids.forEach(id => {
      const expense = db.findOne('expenses', { id, userId });
      if (expense) {
        totalRefunded += expense.amount;
        db.delete('expenses', { id, userId });
        deletedIds.push(id);
      }
    });

    if (deletedIds.length > 0) {
      // Refund cash portfolio
      const cashPortfolio = db.findOne('portfolio', { userId, assetType: 'Cash' });
      if (cashPortfolio) {
        const newCashAmount = cashPortfolio.amount + totalRefunded;
        db.update('portfolio', { id: cashPortfolio.id }, { amount: newCashAmount });
      }

      // Update net worth
      const user = db.findOne('users', { id: userId });
      if (user) {
        const newNetWorth = user.netWorth + totalRefunded;
        db.update('users', { id: userId }, { netWorth: newNetWorth });
      }

      recalculateHealthScore(userId);
    }

    res.json({
      message: `Successfully deleted ${deletedIds.length} transactions!`,
      deletedIds
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error bulk deleting expenses.' });
  }
};


// --- Goals ---
exports.getGoals = (req, res) => {
  try {
    const goals = db.find('goals', { userId: req.user.id });
    res.json(goals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching goals.' });
  }
};

exports.addGoal = (req, res) => {
  const { name, targetAmount, currentAmount, category, deadline, priority } = req.body;

  if (!name || !targetAmount || !category || !deadline) {
    return res.status(400).json({ message: 'Name, target amount, category, and deadline are required.' });
  }

  try {
    const newGoal = db.create('goals', {
      userId: req.user.id,
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      category,
      deadline,
      priority: priority || 'Important'
    });

    recalculateHealthScore(req.user.id);
    res.status(201).json(newGoal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding goal.' });
  }
};

exports.contributeToGoal = (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'Please provide a valid contribution amount.' });
  }

  try {
    const goal = db.findOne('goals', { id, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found.' });
    }

    const contribution = parseFloat(amount);
    const cashPortfolio = db.findOne('portfolio', { userId: req.user.id, assetType: 'Cash' });

    if (!cashPortfolio || cashPortfolio.amount < contribution) {
      return res.status(400).json({ message: 'Insufficient cash balance to make this contribution.' });
    }

    // Deduct cash from portfolio
    db.update('portfolio', { id: cashPortfolio.id }, { amount: cashPortfolio.amount - contribution });

    // Add to goal's current amount
    const newCurrentAmount = goal.currentAmount + contribution;
    db.update('goals', { id }, { currentAmount: newCurrentAmount });

    recalculateHealthScore(req.user.id);
    res.json({
      message: 'Goal contribution successful!',
      goal: { ...goal, currentAmount: newCurrentAmount }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error contributing to goal.' });
  }
};

exports.deleteGoal = (req, res) => {
  const { id } = req.params;

  try {
    const goal = db.findOne('goals', { id, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found.' });
    }

    // Refund goal contribution back to Cash
    const cashPortfolio = db.findOne('portfolio', { userId: req.user.id, assetType: 'Cash' });
    if (cashPortfolio && goal.currentAmount > 0) {
      db.update('portfolio', { id: cashPortfolio.id }, { amount: cashPortfolio.amount + goal.currentAmount });
    }

    db.delete('goals', { id, userId: req.user.id });
    recalculateHealthScore(req.user.id);
    res.json({ message: 'Goal deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting goal.' });
  }
};

// --- Portfolio & Net Worth ---
exports.getPortfolio = (req, res) => {
  try {
    const portfolio = db.find('portfolio', { userId: req.user.id });
    res.json(portfolio);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching portfolio.' });
  }
};

exports.updatePortfolio = (req, res) => {
  const { stocks, bonds, gold, cash } = req.body;

  if (stocks === undefined || bonds === undefined || gold === undefined || cash === undefined) {
    return res.status(400).json({ message: 'All asset amounts are required.' });
  }

  try {
    const userId = req.user.id;
    
    // Update individual values
    db.update('portfolio', { userId, assetType: 'Stocks' }, { amount: parseFloat(stocks) });
    db.update('portfolio', { userId, assetType: 'Bonds' }, { amount: parseFloat(bonds) });
    db.update('portfolio', { userId, assetType: 'Gold' }, { amount: parseFloat(gold) });
    db.update('portfolio', { userId, assetType: 'Cash' }, { amount: parseFloat(cash) });

    // Update net worth as sum of all assets
    const newNetWorth = parseFloat(stocks) + parseFloat(bonds) + parseFloat(gold) + parseFloat(cash);
    db.update('users', { id: userId }, { netWorth: newNetWorth });

    recalculateHealthScore(userId);

    const updatedPortfolio = db.find('portfolio', { userId });
    res.json({
      message: 'Portfolio updated successfully!',
      portfolio: updatedPortfolio,
      netWorth: newNetWorth
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating portfolio.' });
  }
};

// --- Detailed Holdings CRUD & Parsing Engine ---

// Helper to parse a text statement line into asset holdings
const parseHoldingLine = (line) => {
  const clean = line.replace(/,/g, '').trim();
  if (!clean) return null;

  // Predefined prices and mock data for stocks
  const stockDatabase = {
    'hdfc bank': { name: 'HDFC Bank', currentPrice: 1650, investedPrice: 1500, sector: 'Banking/Finance', risk: 'Medium', type: 'Equity' },
    'hdfc': { name: 'HDFC Bank', currentPrice: 1650, investedPrice: 1500, sector: 'Banking/Finance', risk: 'Medium', type: 'Equity' },
    'irfc': { name: 'IRFC', currentPrice: 180, investedPrice: 150, sector: 'Infrastructure/Railways', risk: 'Medium', type: 'Equity' },
    'hal': { name: 'HAL', currentPrice: 4200, investedPrice: 3500, sector: 'Defense/Aerospace', risk: 'High', type: 'Equity' },
    'reliance': { name: 'Reliance Industries', currentPrice: 2900, investedPrice: 2600, sector: 'Energy/Conglomerate', risk: 'Low', type: 'Equity' },
    'tcs': { name: 'TCS', currentPrice: 3800, investedPrice: 3400, sector: 'Technology/IT', risk: 'Low', type: 'Equity' },
    'infosys': { name: 'Infosys', currentPrice: 1550, investedPrice: 1400, sector: 'Technology/IT', risk: 'Low', type: 'Equity' }
  };

  let name = '';
  let type = 'Equity';
  let qty = 1;
  let value = 0;
  let investedValue = 0;
  let sector = 'Diversified';
  let risk = 'Medium';

  // Lowercase clean line for comparison
  const lower = clean.toLowerCase();

  // Try to match specific stock names from our database
  let matchedStockKey = Object.keys(stockDatabase).find(key => lower.includes(key));
  
  // Extract number of shares if exists (e.g., "10 shares", "100 shares")
  const sharesMatch = clean.match(/(\d+)\s*(shares|share|qty|units)/i);
  if (sharesMatch) {
    qty = parseInt(sharesMatch[1], 10);
  }

  // Extract amount (e.g., "₹50000", "50000", "Rs 50000")
  const amountMatch = clean.match(/(?:₹|rs\.?|\$)\s*(\d+)/i) || clean.match(/\b(\d+)\b(?!\s*(shares|share|qty|units))/i);
  if (amountMatch) {
    value = parseFloat(amountMatch[1]);
  }

  if (matchedStockKey) {
    const stockInfo = stockDatabase[matchedStockKey];
    name = stockInfo.name;
    type = stockInfo.type;
    sector = stockInfo.sector;
    risk = stockInfo.risk;
    
    if (sharesMatch) {
      value = qty * stockInfo.currentPrice;
      investedValue = qty * stockInfo.investedPrice;
    } else if (value > 0) {
      qty = Math.round(value / stockInfo.currentPrice) || 1;
      investedValue = qty * stockInfo.investedPrice;
    } else {
      qty = 10;
      value = qty * stockInfo.currentPrice;
      investedValue = qty * stockInfo.investedPrice;
    }
  } else {
    // Determine category based on keywords
    if (lower.includes('mutual fund') || lower.includes('sbi mutual') || lower.includes('axis mutual') || lower.includes('fund') && !lower.includes('debt fund') && !lower.includes('emergency')) {
      type = 'Mutual Funds';
      name = clean.split('-')[0].split('₹')[0].split(/\b\d/)[0].trim() || 'Equity Mutual Fund';
      risk = 'Medium';
      sector = 'Aggressive Growth';
    } else if (lower.includes('gold') || lower.includes('sgb') || lower.includes('gld')) {
      type = 'Gold';
      name = 'Gold ETF / SGB';
      risk = 'Low';
      sector = 'Commodities';
    } else if (lower.includes('silver')) {
      type = 'Silver';
      name = 'Silver ETF';
      risk = 'Medium';
      sector = 'Commodities';
    } else if (lower.includes('fd') || lower.includes('fixed deposit')) {
      type = 'Fixed Deposits';
      name = 'Fixed Deposit';
      risk = 'None';
      sector = 'Fixed Income';
    } else if (lower.includes('ppf')) {
      type = 'PPF';
      name = 'Public Provident Fund (PPF)';
      risk = 'None';
      sector = 'Fixed Income';
    } else if (lower.includes('epf')) {
      type = 'EPF';
      name = 'Employees Provident Fund (EPF)';
      risk = 'None';
      sector = 'Fixed Income';
    } else if (lower.includes('nps')) {
      type = 'NPS';
      name = 'National Pension Scheme (NPS)';
      risk = 'Medium';
      sector = 'Retirement Allocation';
    } else if (lower.includes('debt fund')) {
      type = 'Debt Funds';
      name = 'Debt Mutual Fund';
      risk = 'Low';
      sector = 'Debt Markets';
    } else if (lower.includes('bond') || lower.includes('bonds')) {
      type = 'Bonds';
      name = 'Govt / Corporate Bonds';
      risk = 'Low';
      sector = 'Fixed Income';
    } else if (lower.includes('crypto') || lower.includes('btc') || lower.includes('bitcoin') || lower.includes('eth') || lower.includes('ethereum')) {
      type = 'Crypto';
      name = lower.includes('btc') || lower.includes('bitcoin') ? 'Bitcoin (BTC)' : (lower.includes('eth') || lower.includes('ethereum') ? 'Ethereum (ETH)' : 'Crypto Holdings');
      risk = 'Very High';
      sector = 'Digital Assets';
    } else if (lower.includes('cash') || lower.includes('bank')) {
      type = 'Cash';
      name = 'Savings Bank Balance';
      risk = 'None';
      sector = 'Liquid Cash';
    } else if (lower.includes('emergency')) {
      type = 'Emergency Fund';
      name = 'Emergency Safety Reserve';
      risk = 'None';
      sector = 'Liquid Cash';
    } else {
      // Default fallback
      const parts = clean.split(/[-:]/);
      name = parts[0].trim();
      type = 'Equity';
      sector = 'Others';
      risk = 'Medium';
    }

    if (value === 0) {
      value = 10000; // default value
    }
    
    if (['Fixed Deposits', 'PPF', 'EPF', 'Cash', 'Emergency Fund'].includes(type)) {
      investedValue = value;
    } else {
      investedValue = Math.round(value * 0.85); // 15% default profit
    }
  }

  return {
    name,
    type,
    qty,
    value,
    investedValue,
    sector,
    risk
  };
};

// Sync holdings aggregate back to original portfolio and net worth
const syncPortfolioFromHoldings = (userId) => {
  const holdings = db.find('holdings', { userId });
  
  let stocksTotal = 0;
  let bondsTotal = 0;
  let goldTotal = 0;
  let cashTotal = 0;

  holdings.forEach(h => {
    const val = parseFloat(h.value) || 0;
    if (['Equity', 'Mutual Funds', 'Crypto'].includes(h.type)) {
      stocksTotal += val;
    } else if (['Bonds', 'Fixed Deposits', 'PPF', 'EPF', 'NPS', 'Debt Funds'].includes(h.type)) {
      bondsTotal += val;
    } else if (['Gold', 'Silver'].includes(h.type)) {
      goldTotal += val;
    } else if (['Cash', 'Emergency Fund'].includes(h.type)) {
      cashTotal += val;
    }
  });

  const stockPort = db.findOne('portfolio', { userId, assetType: 'Stocks' });
  if (stockPort) db.update('portfolio', { id: stockPort.id }, { amount: stocksTotal });
  else db.create('portfolio', { userId, assetType: 'Stocks', amount: stocksTotal });

  const bondPort = db.findOne('portfolio', { userId, assetType: 'Bonds' });
  if (bondPort) db.update('portfolio', { id: bondPort.id }, { amount: bondsTotal });
  else db.create('portfolio', { userId, assetType: 'Bonds', amount: bondsTotal });

  const goldPort = db.findOne('portfolio', { userId, assetType: 'Gold' });
  if (goldPort) db.update('portfolio', { id: goldPort.id }, { amount: goldTotal });
  else db.create('portfolio', { userId, assetType: 'Gold', amount: goldTotal });

  const cashPort = db.findOne('portfolio', { userId, assetType: 'Cash' });
  if (cashPort) db.update('portfolio', { id: cashPort.id }, { amount: cashTotal });
  else db.create('portfolio', { userId, assetType: 'Cash', amount: cashTotal });

  const netWorth = stocksTotal + bondsTotal + goldTotal + cashTotal;
  db.update('users', { id: userId }, { netWorth });
  recalculateHealthScore(userId);
};

exports.getHoldings = (req, res) => {
  try {
    const holdings = db.find('holdings', { userId: req.user.id });
    res.json(holdings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching holdings.' });
  }
};

exports.addHolding = (req, res) => {
  const { name, type, qty, value, investedValue, sector, risk } = req.body;

  if (!name || !type || !value) {
    return res.status(400).json({ message: 'Name, Type, and Value are required.' });
  }

  try {
    const newHolding = db.create('holdings', {
      userId: req.user.id,
      name,
      type,
      qty: parseFloat(qty) || 1,
      value: parseFloat(value),
      investedValue: parseFloat(investedValue) || parseFloat(value),
      sector: sector || 'Diversified',
      risk: risk || 'Medium'
    });

    syncPortfolioFromHoldings(req.user.id);
    res.status(201).json(newHolding);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating holding.' });
  }
};

exports.uploadHoldings = (req, res) => {
  const { text, overwrite } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Statement text is required.' });
  }

  try {
    const userId = req.user.id;
    if (overwrite) {
      db.delete('holdings', { userId });
    }

    const lines = text.split('\n');
    const addedHoldings = [];

    lines.forEach(line => {
      const parsed = parseHoldingLine(line);
      if (parsed) {
        const newHolding = db.create('holdings', {
          userId,
          ...parsed
        });
        addedHoldings.push(newHolding);
      }
    });

    syncPortfolioFromHoldings(userId);
    res.json({
      message: `Parsed statement: uploaded ${addedHoldings.length} holdings successfully!`,
      holdings: db.find('holdings', { userId })
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error uploading statement holdings.' });
  }
};

exports.deleteHolding = (req, res) => {
  const { id } = req.params;

  try {
    const holding = db.findOne('holdings', { id, userId: req.user.id });
    if (!holding) {
      return res.status(404).json({ message: 'Holding not found.' });
    }

    db.delete('holdings', { id, userId: req.user.id });
    syncPortfolioFromHoldings(req.user.id);
    res.json({ message: 'Holding deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting holding.' });
  }
};

exports.getMetals = async (req, res) => {
  try {
    const metalsKey = process.env.METALS_API_KEY;
    let goldInr = 62500;
    let silverInr = 80200;
    let source = 'Simulated Commodities Feed (Fallback)';

    if (metalsKey) {
      try {
        const response = await fetch(`https://metals-api.com/api/latest?access_key=${metalsKey}&base=INR&symbols=XAU,XAG`);
        const json = await response.json();
        if (json && json.rates) {
          if (json.rates.XAU) {
            goldInr = (1 / json.rates.XAU) * 10 / 31.1035;
          }
          if (json.rates.XAG) {
            silverInr = (1 / json.rates.XAG) * 1000 / 31.1035;
          }
          source = 'Metals API (Live)';
        }
      } catch (apiErr) {
        console.error('Metals API Key fetch error:', apiErr);
      }
    } else {
      try {
        const goldRes = await fetch('https://api.gold-api.com/v1/gold').then(r => r.json());
        const silverRes = await fetch('https://api.gold-api.com/v1/silver').then(r => r.json());
        let usdinr = 83.5;
        try {
          const fxRes = await fetch('https://open.er-api.com/v6/latest/USD').then(r => r.json());
          if (fxRes && fxRes.rates && fxRes.rates.INR) {
            usdinr = fxRes.rates.INR;
          }
        } catch (fxErr) {
          console.warn('FX Rate fetch error in metals controller, using 83.5', fxErr);
        }

        if (goldRes && goldRes.price) {
          goldInr = (goldRes.price * usdinr) * 10 / 31.1035;
        }
        if (silverRes && silverRes.price) {
          silverInr = (silverRes.price * usdinr) * 1000 / 31.1035;
        }
        source = 'Gold-API (Live keyless USD-convert)';
      } catch (keylessErr) {
        console.error('Keyless Gold API fetch error:', keylessErr);
      }
    }

    const goldFluctuation = (Math.random() * 80 - 40);
    const silverFluctuation = (Math.random() * 120 - 60);

    res.json({
      gold: parseFloat((goldInr + goldFluctuation).toFixed(2)),
      silver: parseFloat((silverInr + silverFluctuation).toFixed(2)),
      source,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving commodities metals data.' });
  }
};
