const express = require('express');
const router = express.Router();
const advisorController = require('../contollers/advisorController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/chat', authMiddleware, advisorController.chatWithAdvisor);

module.exports = router;
