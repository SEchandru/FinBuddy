const express = require('express');
const router = express.Router();
const financeController = require('../contollers/financeController');
const authMiddleware = require('../middleware/authMiddleware');

// Expenses
router.get('/expenses', authMiddleware, financeController.getExpenses);
router.post('/expenses', authMiddleware, financeController.addExpense);
router.post('/expenses/bulk', authMiddleware, financeController.bulkAddExpenses);
router.post('/expenses/bulk-delete', authMiddleware, financeController.bulkDeleteExpenses);
router.put('/expenses/:id', authMiddleware, financeController.updateExpense);
router.delete('/expenses/:id', authMiddleware, financeController.deleteExpense);

// Goals
router.get('/goals', authMiddleware, financeController.getGoals);
router.post('/goals', authMiddleware, financeController.addGoal);
router.post('/goals/:id/contribute', authMiddleware, financeController.contributeToGoal);
router.delete('/goals/:id', authMiddleware, financeController.deleteGoal);

// Portfolio
router.get('/portfolio', authMiddleware, financeController.getPortfolio);
router.post('/portfolio', authMiddleware, financeController.updatePortfolio);

// Holdings
router.get('/holdings', authMiddleware, financeController.getHoldings);
router.post('/holdings', authMiddleware, financeController.addHolding);
router.post('/holdings/upload', authMiddleware, financeController.uploadHoldings);
router.delete('/holdings/:id', authMiddleware, financeController.deleteHolding);
router.get('/metals', authMiddleware, financeController.getMetals);

module.exports = router;
