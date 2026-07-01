const express = require('express');
const router = express.Router();
const quizController = require('../contollers/quizController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/questions', authMiddleware, quizController.getQuestions);
router.post('/submit', authMiddleware, quizController.submitQuiz);

module.exports = router;
