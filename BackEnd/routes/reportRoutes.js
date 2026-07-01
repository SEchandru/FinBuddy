const express = require('express');
const router = express.Router();
const reportController = require('../contollers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/monthly', authMiddleware, reportController.getMonthlyReportData);
router.post('/send-email', authMiddleware, reportController.triggerEmailReport);

module.exports = router;
