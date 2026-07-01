const { analyzeAndSendSpendingReport } = require('../services/cronService');
const db = require('../config/db');

exports.getMonthlyReportData = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = db.findOne('users', { id: userId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const expenses = db.find('expenses', { userId });
    const goals = db.find('goals', { userId });
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const categoriesThisMonth = {};
    thisMonthExpenses.forEach(e => {
      categoriesThisMonth[e.category] = (categoriesThisMonth[e.category] || 0) + e.amount;
    });

    // Compute basic stats
    const income = user.monthlyIncome || 0;
    const savings = Math.max(0, income - totalThisMonth);
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const budgetRemaining = Math.max(0, income - totalThisMonth);

    // Overspending and Recommendations (in-memory run)
    const alerts = [];
    const recommendations = [];

    if (income > 0 && totalThisMonth > income) {
      alerts.push(`Critical overspend! You spent 100% of your income (over by ₹${(totalThisMonth - income).toLocaleString()}).`);
      recommendations.push("Draft an immediate freeze on all non-essential shopping until next month.");
    } else if (income > 0 && (totalThisMonth / income) > 0.8) {
      alerts.push(`Warning: High spend rate of ${((totalThisMonth / income) * 100).toFixed(0)}%.`);
      recommendations.push("Try to defer any large discretionary purchases until the next pay cycle.");
    }

    // Category check
    const categoryBudgets = {
      'Food': 0.15,
      'Entertainment': 0.10,
      'Utilities': 0.15,
      'Transport': 0.10,
      'Shopping': 0.15
    };

    for (const cat in categoriesThisMonth) {
      const amt = categoriesThisMonth[cat];
      const limit = categoryBudgets[cat] || 0.15;
      const ratio = income > 0 ? (amt / income) : 0;
      if (income > 0 && ratio > limit) {
        alerts.push(`High spending on "${cat}" (₹${amt.toLocaleString()} - ${(ratio * 100).toFixed(0)}% of income).`);
        if (cat === 'Food') recommendations.push("Consider grocery prep and home cooking to trim down food costs.");
        if (cat === 'Entertainment') recommendations.push("Review and cancel unused digital subscription plans.");
        if (cat === 'Shopping') recommendations.push("Delay non-essential shopping carts for 48 hours.");
      }
    }

    if (goals.length === 0) {
      recommendations.push("No active financial goals. Create a savings goal to keep your expenses purposeful.");
    }

    res.json({
      monthName: now.toLocaleString('default', { month: 'long' }),
      year: currentYear,
      income,
      totalExpenses: totalThisMonth,
      savings,
      savingsRate,
      budgetRemaining,
      categories: categoriesThisMonth,
      alerts,
      recommendations
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error compiling report data.' });
  }
};

exports.triggerEmailReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await analyzeAndSendSpendingReport(userId);

    if (!result) {
      return res.status(500).json({ message: 'Failed to generate report.' });
    }

    res.json({
      message: 'Spending analysis generated and dispatched successfully!',
      previewUrl: result.emailResult.previewUrl || null,
      alertsCount: result.alerts.length,
      recommendationsCount: result.recommendations.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error dispatching email report.', error: err.message });
  }
};
