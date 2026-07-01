const db = require('../config/db');

// Question Pool (15 distinct financial questions)
const QUESTION_POOL = [
  {
    id: "q1",
    question: "What is your primary investment goal?",
    options: [
      { text: "Preserving capital and avoiding any losses", score: 1 },
      { text: "Generating regular income to cover living expenses", score: 2 },
      { text: "A mix of income generation and steady growth", score: 3 },
      { text: "Maximizing long-term wealth accumulation", score: 4 }
    ]
  },
  {
    id: "q2",
    question: "If your investment portfolio dropped 20% in a month due to market volatility, what would you do?",
    options: [
      { text: "Panic and sell all remaining investments to prevent further loss", score: 1 },
      { text: "Move my funds into safer assets like bonds or cash deposits", score: 2 },
      { text: "Do nothing and wait for the market to eventually recover", score: 3 },
      { text: "Buy more at a discount, viewing it as a buying opportunity", score: 4 }
    ]
  },
  {
    id: "q3",
    question: "How long do you plan to hold your major investments before you need to withdraw them?",
    options: [
      { text: "Less than 1 year (Very short term)", score: 1 },
      { text: "1 to 3 years (Short term)", score: 2 },
      { text: "3 to 7 years (Medium term)", score: 3 },
      { text: "More than 7 years (Long term)", score: 4 }
    ]
  },
  {
    id: "q4",
    question: "How would you describe your understanding of financial markets and investment products?",
    options: [
      { text: "Virtually none; I prefer keeping money in savings accounts", score: 1 },
      { text: "Basic; I understand mutual funds but not complex assets", score: 2 },
      { text: "Good; I understand stock market basics and asset allocation", score: 3 },
      { text: "Excellent; I actively follow markets and trade stocks/derivatives", score: 4 }
    ]
  },
  {
    id: "q5",
    question: "What is your current employment and income stability?",
    options: [
      { text: "Unemployed, retired, or highly unstable contract work", score: 1 },
      { text: "Self-employed with variable monthly earnings", score: 2 },
      { text: "Salaried employee with a steady but average income", score: 3 },
      { text: "Highly secure job with high and steadily rising income", score: 4 }
    ]
  },
  {
    id: "q6",
    question: "Which of these investment portfolios appeals to you most?",
    options: [
      { text: "100% Cash/FDs: 0% risk of loss, 5% annual return", score: 1 },
      { text: "Low Risk: 10% chance of small loss, 7% annual return", score: 2 },
      { text: "Medium Risk: 25% chance of moderate loss, 10% annual return", score: 3 },
      { text: "High Risk: 40% chance of severe loss, 15% annual return", score: 4 }
    ]
  },
  {
    id: "q7",
    question: "If you received a large windfall (e.g. inheritance or bonus), how would you allocate it?",
    options: [
      { text: "Put it all in fixed deposits or savings accounts", score: 1 },
      { text: "Invest in stable bonds or conservative hybrid funds", score: 2 },
      { text: "Spread it across diversified index funds and blue-chip stocks", score: 3 },
      { text: "Allocate to high-growth tech stocks, crypto, or startups", score: 4 }
    ]
  },
  {
    id: "q8",
    question: "How do you feel about inflation eroding the purchasing power of your cash savings?",
    options: [
      { text: "I prefer inflation erosion over any risk of losing principal", score: 1 },
      { text: "It concerns me, but I am still hesitant to take stock market risks", score: 2 },
      { text: "I want to beat inflation, so I accept moderate market fluctuations", score: 3 },
      { text: "I must beat inflation aggressively, so I welcome high-risk assets", score: 4 }
    ]
  },
  {
    id: "q9",
    question: "Which portfolio performance profile do you prefer over a 5-year period?",
    options: [
      { text: "Steady, slow upward trend with no declines", score: 1 },
      { text: "Mild fluctuations, ending with a small positive return", score: 2 },
      { text: "Moderate volatility, ending with a decent gain", score: 3 },
      { text: "Extreme ups and downs, but ending with a substantial profit", score: 4 }
    ]
  },
  {
    id: "q10",
    question: "What is your current debt situation?",
    options: [
      { text: "Heavy debts (high credit card debt, personal loans)", score: 1 },
      { text: "Moderate debts (home loan or education loan)", score: 2 },
      { text: "Low debts (small car loan or minor credit card balances)", score: 3 },
      { text: "Completely debt-free", score: 4 }
    ]
  },
  {
    id: "q11",
    question: "How much of your monthly income is left for investing after meeting expenses?",
    options: [
      { text: "Almost nothing; I live paycheck to paycheck", score: 1 },
      { text: "Less than 10% of my income", score: 2 },
      { text: "10% to 30% of my income", score: 3 },
      { text: "More than 30% of my income", score: 4 }
    ]
  },
  {
    id: "q12",
    question: "How do you react to financial news reporting a global economic slowdown?",
    options: [
      { text: "Immediately withdraw my money to stash cash", score: 1 },
      { text: "Get anxious and stop adding new investments", score: 2 },
      { text: "Ignore the news and maintain my systematic investment plan", score: 3 },
      { text: "Look for opportunities to invest more while prices are cheap", score: 4 }
    ]
  },
  {
    id: "q13",
    question: "If an investment has a 50% chance of doubling your money and a 50% chance of losing half, would you invest?",
    options: [
      { text: "Absolutely not; the risk is too high", score: 1 },
      { text: "Maybe with a tiny fraction of my savings (less than 5%)", score: 2 },
      { text: "Yes, with a moderate amount (10% to 20%)", score: 3 },
      { text: "Yes, with a significant amount (more than 30%)", score: 4 }
    ]
  },
  {
    id: "q14",
    question: "How do you view high-growth speculative assets like cryptocurrency or pre-revenue startups?",
    options: [
      { text: "Gambling; I avoid them completely", score: 1 },
      { text: "Intriguing, but I would only allocate pocket money to them", score: 2 },
      { text: "Good for high-yield returns, I hold a moderate allocation", score: 3 },
      { text: "Essential for rapid wealth growth; I invest heavily in them", score: 4 }
    ]
  },
  {
    id: "q15",
    question: "What role does investment income play in your current monthly livelihood?",
    options: [
      { text: "Crucial; I rely on investment dividends/interest to pay bills", score: 1 },
      { text: "Supplementary; it helps cover some occasional costs", score: 2 },
      { text: "None; I reinvest all gains and rely solely on my salary", score: 3 },
      { text: "None, and I can support myself for 1+ years without working", score: 4 }
    ]
  }
];

// Fisher-Yates shuffle helper
const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// GET `/api/quiz/questions`
exports.getQuestions = (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user's previous quiz records to avoid repeating the same questions
    const userHistory = db.find('quizHistory', { userId });
    
    let lastQuestionIds = [];
    if (userHistory.length > 0) {
      // Sort by date descending to get the latest attempt
      userHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const latestAttempt = userHistory[0];
      lastQuestionIds = Object.keys(latestAttempt.answers || {});
    }

    // Filter out questions that were present in the user's last quiz attempt
    let candidateQuestions = QUESTION_POOL.filter(q => !lastQuestionIds.includes(q.id));

    // If we filtered out too many, fallback to the entire pool
    if (candidateQuestions.length < 5) {
      candidateQuestions = QUESTION_POOL;
    }

    // Shuffle and pick exactly 6 questions to make it a fast, dynamic quiz
    const selectedQuestions = shuffle(candidateQuestions).slice(0, 6);

    res.json(selectedQuestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating quiz questions.' });
  }
};

// POST `/api/quiz/submit`
exports.submitQuiz = (req, res) => {
  const { answers } = req.body; // Map of questionId -> selectedOptionIndex

  if (!answers || Object.keys(answers).length === 0) {
    return res.status(400).json({ message: 'Answers are required.' });
  }

  try {
    const userId = req.user.id;
    const user = db.findOne('users', { id: userId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Calculate total score based on selected answers
    let totalScore = 0;
    let questionsAnsweredCount = 0;

    for (const qId in answers) {
      const question = QUESTION_POOL.find(q => q.id === qId);
      if (question) {
        const optionIndex = answers[qId];
        const selectedOption = question.options[optionIndex];
        if (selectedOption) {
          totalScore += selectedOption.score;
          questionsAnsweredCount++;
        }
      }
    }

    if (questionsAnsweredCount === 0) {
      return res.status(400).json({ message: 'Invalid quiz answers.' });
    }

    // Normalize score out of 24 (since we ask 6 questions, max score is 24, min is 6)
    const maxPossible = questionsAnsweredCount * 4;
    const minPossible = questionsAnsweredCount * 1;
    const scorePercentage = (totalScore - minPossible) / (maxPossible - minPossible);

    // Determine Risk Profile Category
    let riskCategory = 'Moderate';
    if (scorePercentage < 0.35) {
      riskCategory = 'Conservative';
    } else if (scorePercentage > 0.70) {
      riskCategory = 'Aggressive';
    }

    // Save quiz attempt in history
    db.create('quizHistory', {
      userId,
      answers,
      score: totalScore,
      percentage: scorePercentage,
      category: riskCategory
    });

    // Determine Asset Allocation based on risk category and age
    // Age plays a vital role. "110 - age" is a standard guideline for Stocks %
    const userAge = user.age || 30; // fallback to 30 if onboarding is incomplete
    const standardEquity = 110 - userAge;

    let stocksPct = 0;
    let bondsPct = 0;
    let goldPct = 0;
    let cashPct = 0;

    if (riskCategory === 'Conservative') {
      // Conservative: limit stocks, focus on bonds and cash
      stocksPct = Math.max(15, Math.round(standardEquity * 0.5));
      goldPct = 15;
      cashPct = 20;
      bondsPct = 100 - (stocksPct + goldPct + cashPct);
    } else if (riskCategory === 'Moderate') {
      // Moderate: balanced asset mix
      stocksPct = Math.max(30, Math.min(70, Math.round(standardEquity * 0.85)));
      goldPct = 10;
      cashPct = 10;
      bondsPct = 100 - (stocksPct + goldPct + cashPct);
    } else {
      // Aggressive: heavy stock allocation
      stocksPct = Math.max(50, Math.min(90, Math.round(standardEquity * 1.2)));
      goldPct = 5;
      cashPct = 5;
      bondsPct = 100 - (stocksPct + goldPct + cashPct);
    }

    const allocationRecommendation = {
      Stocks: stocksPct,
      Bonds: bondsPct,
      Gold: goldPct,
      Cash: cashPct
    };

    // Update user's risk profile details
    db.update('users', { id: userId }, {
      riskProfile: {
        score: totalScore,
        category: riskCategory,
        lastQuizDate: new Date().toISOString(),
        recommendation: allocationRecommendation
      }
    });

    // Force update user's health score
    // Helper function duplicate
    const expenses = db.find('expenses', { userId });
    const monthlyExpenses = expenses
      .filter(e => {
        const expDate = new Date(e.date);
        const now = new Date();
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);

    let healthScore = 55;
    if (user.monthlyIncome > 0) {
      const savingsRate = (user.monthlyIncome - monthlyExpenses) / user.monthlyIncome;
      if (savingsRate >= 0.3) healthScore += 25;
      else if (savingsRate >= 0.15) healthScore += 15;
      else if (savingsRate >= 0) healthScore += 5;
      else healthScore -= 10;
    }
    const goals = db.find('goals', { userId });
    if (goals.length > 0) {
      healthScore += 10;
      const totalProgress = goals.reduce((sum, g) => sum + Math.min(1, g.currentAmount / g.targetAmount), 0);
      healthScore += Math.round((totalProgress / goals.length) * 10);
    }
    healthScore += 15; // Completed risk assessment!
    
    // Check portfolio
    const portfolio = db.find('portfolio', { userId });
    if (portfolio.some(p => p.assetType !== 'Cash' && p.amount > 0)) {
      healthScore += 15;
      if (portfolio.every(p => p.amount > 0)) healthScore += 5;
    }
    db.update('users', { id: userId }, { financialHealthScore: Math.max(0, Math.min(100, healthScore)) });

    res.json({
      score: totalScore,
      category: riskCategory,
      recommendation: allocationRecommendation,
      message: `Assessment completed! You have a ${riskCategory} risk profile.`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing quiz submission.' });
  }
};
