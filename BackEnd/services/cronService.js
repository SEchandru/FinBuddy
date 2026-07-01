const cron = require('node-cron');
const db = require('../config/db');
const { sendEmail } = require('./emailService');

// Perform spending analysis and generate a comprehensive email report
const analyzeAndSendSpendingReport = async (userId) => {
  const user = db.findOne('users', { id: userId });
  if (!user) {
    console.error(`[Cron Report Error] User ${userId} not found.`);
    return null;
  }

  // 1. Gather all user transaction and goal data
  const expenses = db.find('expenses', { userId });
  const goals = db.find('goals', { userId });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Get previous month dates
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Filter expenses by month
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const lastMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  // Calculate totals
  const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalLastMonth = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category for this month
  const categoriesThisMonth = {};
  thisMonthExpenses.forEach(e => {
    categoriesThisMonth[e.category] = (categoriesThisMonth[e.category] || 0) + e.amount;
  });

  // Group by category for last month
  const categoriesLastMonth = {};
  lastMonthExpenses.forEach(e => {
    categoriesLastMonth[e.category] = (categoriesLastMonth[e.category] || 0) + e.amount;
  });

  // 2. Identify overspending and generate alerts
  const alerts = [];
  const recommendations = [];

  const income = user.monthlyIncome || 0;
  const spendingRate = income > 0 ? (totalThisMonth / income) * 100 : 100;

  // Overall overspending alerts
  if (income > 0 && totalThisMonth > income) {
    alerts.push(`CRITICAL: You spent 100% of your income! You are in debt by ₹${(totalThisMonth - income).toLocaleString()} this month.`);
    recommendations.push("Draft an immediate freeze on all non-essential shopping until next month.");
  } else if (spendingRate > 80) {
    alerts.push(`WARNING: You have spent ${spendingRate.toFixed(1)}% of your monthly income (₹${totalThisMonth.toLocaleString()} spent out of ₹${income.toLocaleString()}).`);
    recommendations.push("Try to defer any large discretionary purchases until the next pay cycle.");
  } else {
    recommendations.push("Excellent work keeping your overall spending below 80% of your earnings. Keep it up!");
  }

  // Category specific alarms
  const categoryBudgets = {
    'Food': 0.15,          // 15% of income
    'Entertainment': 0.10,  // 10%
    'Utilities': 0.15,      // 15%
    'Transport': 0.10,      // 10%
    'Shopping': 0.15        // 15%
  };

  for (const cat in categoriesThisMonth) {
    const amount = categoriesThisMonth[cat];
    const catRate = income > 0 ? (amount / income) : 0;
    const limit = categoryBudgets[cat] || 0.15;

    // Check if category spending exceeds threshold ratio
    if (income > 0 && catRate > limit) {
      alerts.push(`ALERT: Your spending on "${cat}" (₹${amount.toLocaleString()}) represents ${(catRate * 100).toFixed(1)}% of your income, exceeding the recommended limit of ${(limit * 100)}%.`);
      if (cat === 'Food') {
        recommendations.push("Your food budget is high. Try cooking at home or cutting back on food delivery to save up to 20% on meals.");
      } else if (cat === 'Entertainment') {
        recommendations.push("Consider auditing your active streaming or digital subscriptions to trim down entertainment costs.");
      } else if (cat === 'Shopping') {
        recommendations.push("Implement the 48-hour rule: wait 48 hours before purchasing items in your shopping cart.");
      }
    }

    // Check if category spending spiked compared to last month
    const prevAmount = categoriesLastMonth[cat] || 0;
    if (prevAmount > 0) {
      const pctIncrease = ((amount - prevAmount) / prevAmount) * 100;
      if (pctIncrease > 30) {
        alerts.push(`SPIKE: Expenses on "${cat}" spiked by ${pctIncrease.toFixed(1)}% compared to last month (₹${prevAmount.toLocaleString()} vs ₹${amount.toLocaleString()}).`);
        recommendations.push(`Find out what caused the spike in "${cat}" this month to verify it was a one-time emergency rather than lifestyle inflation.`);
      }
    }
  }

  // Goal recommendations
  if (goals.length > 0) {
    const laggingGoals = goals.filter(g => g.currentAmount < g.targetAmount && new Date(g.deadline) < new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000));
    if (laggingGoals.length > 0) {
      recommendations.push(`You have ${laggingGoals.length} goal(s) closing in on their deadlines within 60 days. Redirect a portion of your remaining cash to accelerate their completion.`);
    }
  } else {
    recommendations.push("You haven't set any financial savings goals yet. Create a goal like an 'Emergency Fund' or 'Holiday Savings' on the goal planner to give your savings a clear purpose.");
  }

  // Fallback default recommendation
  if (recommendations.length === 0) {
    recommendations.push("Maintain your current budget plan and review your investments regularly.");
  }

  // 3. Format the email as a premium HTML document
  const alertsHtml = alerts.map(a => `<li style="color: #f87171; margin-bottom: 8px; font-weight: 500;">🚨 ${a}</li>`).join('') || '<li style="color: #34d399;">✅ No overspending alerts detected for this period.</li>';
  const recsHtml = recommendations.map(r => `<li style="color: #e2e8f0; margin-bottom: 8px; line-height: 1.5;">💡 ${r}</li>`).join('');
  const categoryRows = Object.entries(categoriesThisMonth)
    .map(([cat, amt]) => {
      const pct = income > 0 ? ((amt / income) * 100).toFixed(1) : 'N/A';
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #334155; color: #94a3b8;">${cat}</td>
          <td style="padding: 10px; border-bottom: 1px solid #334155; color: #e2e8f0; font-weight: bold; text-align: right;">₹${amt.toLocaleString()}</td>
          <td style="padding: 10px; border-bottom: 1px solid #334155; color: #60a5fa; text-align: right;">${pct}%</td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="3" style="padding: 15px; text-align: center; color: #94a3b8;">No expenses registered this month.</td></tr>`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>FinBuddy Monthly Financial Report</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">FinBuddy Report</h1>
                  <p style="margin: 5px 0 0 0; color: #bfdbfe; font-size: 14px;">Personalized Spending Analysis & Insights</p>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 30px;">
                  <p style="font-size: 18px; margin-top: 0; color: #e2e8f0;">Hello <strong>${user.name}</strong>,</p>
                  <p style="color: #94a3b8; font-size: 15px; line-height: 1.5;">Here is your automated monthly spending analysis report. Our engine has scanned your transactions and compiled your custom recommendations.</p>
                  
                  <!-- Health Score Card -->
                  <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center; border: 1px solid #334155;">
                    <span style="font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Financial Health Score</span>
                    <h2 style="font-size: 48px; color: #34d399; margin: 10px 0 0 0; font-weight: 800;">${user.financialHealthScore} <span style="font-size: 20px; color: #94a3b8; font-weight: normal;">/ 100</span></h2>
                    <p style="font-size: 12px; color: #64748b; margin: 5px 0 0 0;">Calculated from saving rates, investments, and goals progress.</p>
                  </div>

                  <!-- Summary Stats -->
                  <table width="100%" style="margin-bottom: 25px;">
                    <tr>
                      <td width="50%" style="background-color: #111827; padding: 15px; border-radius: 8px; border: 1px solid #1f2937;">
                        <span style="font-size: 12px; color: #64748b; text-transform: uppercase;">Total Expenses</span>
                        <div style="font-size: 20px; font-weight: bold; color: #f43f5e; margin-top: 5px;">₹${totalThisMonth.toLocaleString()}</div>
                      </td>
                      <td width="4%"></td>
                      <td width="46%" style="background-color: #111827; padding: 15px; border-radius: 8px; border: 1px solid #1f2937;">
                        <span style="font-size: 12px; color: #64748b; text-transform: uppercase;">Monthly Income</span>
                        <div style="font-size: 20px; font-weight: bold; color: #34d399; margin-top: 5px;">₹${income.toLocaleString()}</div>
                      </td>
                    </tr>
                  </table>

                  <!-- Alarms Section -->
                  <h3 style="color: #f87171; border-bottom: 1px solid #334155; padding-bottom: 8px; font-size: 16px; margin-top: 30px;">Spending Alarms</h3>
                  <ul style="padding-left: 20px; margin: 10px 0 0 0;">
                    ${alertsHtml}
                  </ul>

                  <!-- Category Breakdown Table -->
                  <h3 style="color: #60a5fa; border-bottom: 1px solid #334155; padding-bottom: 8px; font-size: 16px; margin-top: 30px;">Category Breakdown</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 10px; border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #1e293b;">
                        <th style="padding: 10px; text-align: left; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Category</th>
                        <th style="padding: 10px; text-align: right; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Amount</th>
                        <th style="padding: 10px; text-align: right; color: #94a3b8; font-size: 12px; text-transform: uppercase;">% of Income</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${categoryRows}
                    </tbody>
                  </table>

                  <!-- Actionable Recommendations -->
                  <h3 style="color: #a78bfa; border-bottom: 1px solid #334155; padding-bottom: 8px; font-size: 16px; margin-top: 35px;">Actionable Advice</h3>
                  <ul style="padding-left: 20px; margin: 10px 0 0 0; list-style-type: none;">
                    ${recsHtml}
                  </ul>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #0b0f19; padding: 20px; text-align: center; border-top: 1px solid #1e293b;">
                  <p style="margin: 0; color: #64748b; font-size: 12px;">This is an automated system notification from FinBuddy.</p>
                  <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">&copy; 2026 FinBuddy Dashboard. All rights reserved.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Send the email
  const emailResult = await sendEmail({
    to: user.email,
    subject: `FinBuddy Monthly Spending Report - Health Score: ${user.financialHealthScore}/100`,
    html: emailHtml
  });

  return {
    success: true,
    totalExpenses: totalThisMonth,
    income,
    alerts,
    recommendations,
    emailResult
  };
};

// Initialize the Scheduled Jobs
const initCronJobs = () => {
  console.log("Initializing scheduled Node.js cron jobs...");

  // Runs on the 1st of every month at midnight: '0 0 1 * *'
  // For demonstration, let's also support a test cron or keep the monthly expression.
  // We schedule it for monthly reports.
  cron.schedule('0 0 1 * *', async () => {
    console.log("[Cron Job] Commencing automated monthly spending reports analysis...");
    try {
      const users = db.getCollection('users');
      for (const user of users) {
        if (user.isOnboarded) {
          console.log(`[Cron Job] Processing report for user: ${user.email} (${user.id})`);
          await analyzeAndSendSpendingReport(user.id);
        }
      }
      console.log("[Cron Job] Automated reports processing completed.");
    } catch (err) {
      console.error("[Cron Job Failure]", err);
    }
  });
};

module.exports = {
  initCronJobs,
  analyzeAndSendSpendingReport
};
