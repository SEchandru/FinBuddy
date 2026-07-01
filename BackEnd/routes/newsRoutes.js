const express = require('express');
const router = express.Router();
const newsController = require('../contollers/newsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, newsController.getAllNews);
router.get('/portfolio', authMiddleware, newsController.getPortfolioNews);

module.exports = router;
